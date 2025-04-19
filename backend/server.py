import json
import time
import math
import io
import re
from datetime import datetime
import asyncio

import pandas as pd
import requests
from bs4 import BeautifulSoup
import urllib3
from fastapi import FastAPI, Body
from dotenv import load_dotenv
import os
from pydantic import BaseModel

# Load environment variables
load_dotenv()

app = FastAPI()

class Location(BaseModel):
    lat: float
    lon: float

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/weather")
async def weather(latitude: float, longitude: float):
    """Get weather and environmental data for a specific location"""
    try:
        # Get current data
        aqi_str = get_air_quality_forecast(latitude, longitude)
        aqi_value = None
        if aqi_str and ":" in aqi_str:
            try:
                aqi_value = int(aqi_str.split(": ")[1])
            except (ValueError, IndexError):
                pass
        
        # Get AQI category safely
        aqi_category = None
        if aqi_value is not None:
            if aqi_value <= 50:
                aqi_category = "Good"
            elif aqi_value <= 100:
                aqi_category = "Moderate"
            elif aqi_value <= 150:
                aqi_category = "Unhealthy for Sensitive Groups"
            elif aqi_value <= 200:
                aqi_category = "Unhealthy"
            elif aqi_value <= 300:
                aqi_category = "Very Unhealthy"
            else:
                aqi_category = "Hazardous"
        
        # Get flood risk data safely
        flood_data = {
            "distance_km": None,
            "current_level": None,
            "trend": None
        }
        try:
            flood_info = check_location_flood_risk(latitude, longitude)
            if flood_info:
                flood_parts = flood_info.split(", ")
                if len(flood_parts) >= 3:
                    try:
                        flood_data["distance_km"] = float(flood_parts[0].split(": ")[1].split()[0])
                    except (ValueError, IndexError):
                        pass
                    try:
                        flood_data["current_level"] = flood_parts[1].split(": ")[1]
                    except IndexError:
                        pass
                    try:
                        flood_data["trend"] = flood_parts[2].split(": ")[1]
                    except IndexError:
                        pass
        except Exception:
            pass
        
        # Get weather data safely
        weather_data = {
            "conditions": [],
            "temperature_celsius": None,
            "temperature_fahrenheit": None
        }
        try:
            weather_str = getWeatherAndTemp(latitude, longitude)
            if weather_str:
                weather_parts = weather_str.split("and the temperature is ")
                if len(weather_parts) > 0:
                    conditions_str = weather_parts[0].replace("Weathers include: ", "")
                    weather_data["conditions"] = [w.strip() for w in conditions_str.split(",") if w.strip() and w.strip() != "None"]
                
                if len(weather_parts) > 1:
                    try:
                        temp_c = float(weather_parts[1])
                        weather_data["temperature_celsius"] = temp_c
                        weather_data["temperature_fahrenheit"] = round(temp_c * 9/5 + 32, 2)
                    except (ValueError, IndexError):
                        pass
        except Exception:
            pass
        
        # Get power outage status safely
        power_outage = None
        try:
            power_outage = long_lat_power_outage(latitude, longitude)
        except Exception:
            pass
        
        data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "air_quality": {
                "aqi": aqi_value,
                "category": aqi_category
            },
            "flood_risk": flood_data,
            "power_outage": power_outage,
            "weather": weather_data
        }
        return data
    except Exception as e:
        return {"error": str(e)}







def is_point_in_polygon(point, polygon):
    """
    Determine if a point is inside a polygon using the ray casting algorithm.

    Args:
        point: A tuple or list containing (latitude, longitude)
        polygon: A list of (latitude, longitude) tuples representing the vertices
                of the polygon in order

    Returns:
        bool: True if the point is inside the polygon, False otherwise
    """
    x, y = point[1], point[0]  # longitude, latitude
    inside = False

    n = len(polygon)
    j = n - 1

    for i in range(n):
        xi, yi = polygon[i][1], polygon[i][0]  # longitude, latitude
        xj, yj = polygon[j][1], polygon[j][0]  # longitude, latitude

        intersect = ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if intersect:
            inside = not inside

        j = i

    return inside

def clean_polygon_coordinates_float(polygon_coords):
    """
    Convert a list of dictionaries with 'Latitude' and 'Longitude' keys to a list of (lat, lon) tuples,
    where both are floats (preserving precision).
    """
    cleaned_coords = []

    for coord in polygon_coords:
        try:
            lat = float(coord['Latitude'])
            lon = float(coord['Longitude'])
            cleaned_coords.append((lat, lon))
        except (KeyError, ValueError) as e:
            # print(f"Error processing coordinate: {coord}. Error: {e}")
            continue

    return cleaned_coords

def long_lat_power_outage(lat, long):
  columns = ['county_name', 'customers_tracked', 'customers_out', 'Outage Percentage']
  df = pd.DataFrame(columns=columns)
  url = 'https://www.pse.com/api/sitecore/OutageMap/AnonymoussMapListView'
  response = requests.get(url)
  if response.status_code == 200:
      data = response.json()
  else:
      print(f"Error fetching data: {response.status_code}")

  columns = ['Start Time', 'Customers Impacted', 'Status', 'Cause' , 'Last Update', 'Est. Restoration Time', 'Point of Interest', 'Polygon Coordinates']
  df_PSE = pd.DataFrame(columns=columns)

  for i in range(len(data["PseMap"])):
    start_time = data["PseMap"][i]["DataProvider"]["Attributes"][0]["Value"]
    customers_impacted = data["PseMap"][i]["DataProvider"]["Attributes"][1]["Value"]
    status = data["PseMap"][i]["DataProvider"]["Attributes"][2]["Value"]
    cause = data["PseMap"][i]["DataProvider"]["Attributes"][3]["Value"]
    last_update = data["PseMap"][i]["DataProvider"]["Attributes"][4]["Value"]
    rest_time = data["PseMap"][i]["DataProvider"]["Attributes"][5]["Value"]
    point_of_interest_lat = data["PseMap"][i]["DataProvider"]["PointOfInterest"]["Latitude"]
    point_of_interest_long = data["PseMap"][i]["DataProvider"]["PointOfInterest"]["Longitude"]
    point_of_interest_title = data["PseMap"][i]["DataProvider"]["PointOfInterest"]["Title"]
    point_of_interest = point_of_interest_lat + " " + point_of_interest_long + " " + point_of_interest_title
    polygon_coordinates = data["PseMap"][i]["Polygon"]

    new_data = {
        'Start Time': start_time,
        'Customers Impacted': customers_impacted,
        'Status': status,
        'Cause': cause,
        'Last Update': last_update,
        'Est. Restoration Time': rest_time,
        'Point of Interest': point_of_interest,
        'Polygon Coordinates': polygon_coordinates,
    }

    new_df = pd.DataFrame([new_data])

    df_PSE = pd.concat([df_PSE, new_df], ignore_index=True)

  for polygon in df_PSE['Polygon Coordinates']:
    if is_point_in_polygon((long, lat), clean_polygon_coordinates_float(polygon)):
      return True

#   print(df_PSE['Polygon Coordinates'][0])

  return False




# Disable SSL warnings (only use this in development)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def create_flood_monitoring_df():
    # Raw location data
    location_data = """
    #USGS-SF17 South Fork Snoqualmie River 47.415109, -121.587321
    #USGS-MF11 Middle Fork Snoqualmie River 47.485912, -121.647864
    #USGS-NF10 North Fork Snoqualmie River 47.614825, -121.713444
    #USGS-38 Snoqualmie River- Below the Falls 47.545077, -121.842316
    #SVPA-37 Snoqualmie Falls Golf Course 47.561390, -121.878524
    #SVPA-36 Fall City - Neal Rd. SE 47.585410, -121.903805
    #SVPA-34 The "T" at W Snoqualmie River Rd SE 47.587822, -121.926108
    #SVPA-33 Snoqualmie River at SE 19th Way 47.592763, -121.921028
    #SVPA-29 W Snoqualmie River Rd NE near Jubilee Farm 47.611599, -121.934404
    #SVPA-26 W Snoqualmie River Rd NE at Blue Heron Golf Course 47.625158, -121.933527
    #SVPA-25 Snoqualmie River at NE Tolt Hill Rd 47.638133, -121.928484
    #USGS-22 Snoqualmie River at Carnation 47.665934, -121.925397
    #SVPA-19 Staurt Landing - South of Oxbow Farm 47.688900, -121.963700
    #SVPA-17 NE 100th St at Goose & Gander Farm 47.683900, -121.984500
    #SVPA-15 NE 124th St (East) at Local Roots Farm 47.708603, -121.986294
    #SVPA-15B NE 124th St (West) 47.709082, -122.003216
    #SVPA-12 NE 138th St 47.722446, -121.997481
    #USGS-9 Snoqualmie River at Duvall 47.743155, -121.987900
    #USGS-SH5 Snohomish River at Monroe 47.830932, -122.048459
    """

    # Prepare lists to store data
    location_ids = []
    location_names = []
    latitudes = []
    longitudes = []

    # Process each line of location data
    for line in location_data.strip().split('\n'):
        line = line.strip()
        if not line:
            continue

        # Remove the leading # if present
        if line.startswith('#'):
            line = line[1:].strip()

        # Use regex to extract all parts: code, name, and coordinates
        pattern = r'([A-Z]+-[A-Z0-9]+)\s+(.*?)\s+(\d+\.\d+),\s*(-\d+\.\d+)'
        match = re.match(pattern, line)

        if match:
            location_id = match.group(1)
            location_name = match.group(2).strip()
            lat = float(match.group(3))
            lon = float(match.group(4))

            location_ids.append(location_id)
            location_names.append(location_name)
            latitudes.append(lat)
            longitudes.append(lon)
        else:
            print(f"Error: Could not parse line: {line}")

    # Create initial DataFrame with location information
    df = pd.DataFrame({
        'Location ID': location_ids,
        'Location Name': location_names,
        'Latitude': latitudes,
        'Longitude': longitudes,
        'Flood Level': None,  # Will be populated from API
        'Level Trend': None   # Will be populated from API
    })

    # Now, fetch the flood data from API and update the DataFrame
    current_date = datetime.now().date()
    year = current_date.year
    month = current_date.month
    day = current_date.day

    url = "https://prodplanreadingsvc.azurewebsites.net/api/GetGageStatusAndRecentReadings"

    # Format dates correctly
    from_datetime = datetime(year, month, day, 0, 0, 0).strftime("%a, %d %b %Y %H:%M:%S GMT")
    to_datetime = datetime(year, month, day+2, 0, 0, 0).strftime("%a, %d %b %Y %H:%M:%S GMT")

    # Parameters
    params = {
        'regionId': 1,
        'fromDateTime': from_datetime,
        'toDateTime': to_datetime
    }

    # Send the GET request
    try:
        response = requests.get(url, params=params, verify=False)

        if response.status_code == 200:
            data = response.json()

            # Create a dictionary to easily look up flood data by location ID
            flood_data_dict = {}
            for gage in data["gages"]:
                location_id = gage["locationId"]
                flood_level = gage["status"]["floodLevel"]
                level_trend = gage["status"]["levelTrend"]

                flood_data_dict[location_id] = {
                    'Flood Level': flood_level,
                    'Level Trend': level_trend
                }

            # Update the DataFrame with flood data
            for index, row in df.iterrows():
                location_id = row['Location ID']
                if location_id in flood_data_dict:
                    df.at[index, 'Flood Level'] = flood_data_dict[location_id]['Flood Level']
                    df.at[index, 'Level Trend'] = flood_data_dict[location_id]['Level Trend']

            # print(f"Successfully updated flood data for {len(flood_data_dict)} locations.")

            # Check for locations in our dataframe that didn't get flood data
            missing_data = df[df['Flood Level'].isna()]
            if not missing_data.empty:
                print(f"Warning: {len(missing_data)} locations didn't receive flood data.")
                # print("Location IDs without flood data:", missing_data['Location ID'].tolist())

            # Check for flood data that didn't match our location list
            api_ids = set(flood_data_dict.keys())
            df_ids = set(df['Location ID'])
            unmatched_api_ids = api_ids - df_ids
            if unmatched_api_ids:
                print(f"Warning: {len(unmatched_api_ids)} locations from API weren't in our location list.")
                # print("Unmatched API Location IDs:", list(unmatched_api_ids))

        else:
            print(f"Failed to fetch flood data: HTTP {response.status_code}")

    except Exception as e:
        print(f"Error when fetching flood data: {str(e)}")

    return df

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance between two points using the Haversine formula.
    Returns distance in kilometers.
    """
    # Earth's radius in kilometers
    R = 6371.0

    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Differences in coordinates
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    # Haversine formula
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    return distance

def find_nearest_flood_data(latitude, longitude, flood_df=None):
    """
    Find the nearest location to the given coordinates and return its flood data.

    Args:
        latitude (float): Latitude of the point to check
        longitude (float): Longitude of the point to check
        flood_df (DataFrame, optional): Pre-loaded flood monitoring dataframe.
                                        If None, will create a new one.

    Returns:
        dict: Dictionary containing information about the nearest location and its flood data
    """
    # If no dataframe provided, create one
    if flood_df is None:
        flood_df = create_flood_monitoring_df()

    # Calculate distance to each location
    distances = []
    for _, row in flood_df.iterrows():
        dist = calculate_distance(latitude, longitude, row['Latitude'], row['Longitude'])
        distances.append(dist)

    # Add distances to the dataframe
    flood_df['Distance'] = distances

    # Find the nearest location
    nearest = flood_df.loc[flood_df['Distance'].idxmin()]

    # Create result dictionary
    result = {
        'nearest_location_id': nearest['Location ID'],
        'nearest_location_name': nearest['Location Name'],
        'distance_km': nearest['Distance'],
        'flood_level': nearest['Flood Level'],
        'level_trend': nearest['Level Trend'],
        'latitude': nearest['Latitude'],
        'longitude': nearest['Longitude']
    }

    return result

def check_location_flood_risk(latitude, longitude):
    """
    User-friendly function to check flood risk at a specific location.

    Args:
        latitude (float): Latitude of the location to check
        longitude (float): Longitude of the location to check

    Returns:
        dict: Dictionary containing all flood risk information
    """
    # Get nearest flood monitoring data
    nearest = find_nearest_flood_data(latitude, longitude)

    return f"Distance from Flood Monitoring Station: {nearest['distance_km']:.2f} kilometers" + f", Current Flood Level: {nearest['flood_level']}" + f", Level Trend: {nearest['level_trend']}"
# print(check_location_flood_risk(47.59645, -122.11650))





def getWeatherAndTemp(lat, lon):
  api_template = "https://api.weather.gov/points/{lat},{lon}"
  headers = {"User-Agent": "Mozilla/5.0"}
  try:
    url = api_template.format(lat=round(lat, 2), lon=round(lon, 2))
    response = requests.get(url, headers=headers)
    #print(response.json())
    link = response.json()['properties']['forecastGridData']

    response2 = requests.get(link, headers=headers)
    temp = response2.json()['properties']['temperature']['values'][0]['value']
    lens = len(response2.json()['properties']['weather']['values'])
    sets = set()
    for i in range(lens):
      sets.add(response2.json()['properties']['weather']['values'][i]['value'][0]['weather'])
    string = "Weathers include: "
    for i in sets:
      if i != 'None':
        string = string + str(i) + ", "

    return string + "and the temperature is " + str(temp)
  except:
    return ''








def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance between two coordinates using the Haversine formula

    Parameters:
    -----------
    lat1, lon1 : float
        Coordinates of the first point (in decimal degrees)
    lat2, lon2 : float
        Coordinates of the second point (in decimal degrees)

    Returns:
    --------
    float
        Distance in miles between the two points
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 3956  # Radius of earth in miles

    return c * r

def get_air_quality_forecast(latitude, longitude, distance=15, api_key='C920E2B5-999E-4ECF-8F6F-820B9CCA4155'):
    """
    Fetches air quality forecast data from AirNow API based on latitude and longitude

    Parameters:
    -----------
    latitude : float
        The latitude coordinate
    longitude : float
        The longitude coordinate
    distance : int, optional
        The search radius in miles (default: 15)
    api_key : str, optional
        Your AirNow API key

    Returns:
    --------
    tuple
        (DataFrame containing the air quality forecast data,
         Dictionary with details about AQI and distance to stations)
    """
    # Get current date in YYYY-MM-DD format
    current_date = datetime.now().strftime('%Y-%m-%d')
    # print(f"Fetching data for date: {current_date}")

    # Build the API URL
    url = f"https://www.airnowapi.org/aq/forecast/latLong/?format=text/csv&latitude={latitude}&longitude={longitude}&date={current_date}&distance={distance}&API_KEY={api_key}"

    try:
        # Fetch data from the API
        response = requests.get(url)
        response.raise_for_status()  # Raise exception for HTTP errors

        # Parse CSV data into a pandas DataFrame
        csv_data = response.text
        df = pd.read_csv(io.StringIO(csv_data))

        # Extract information
        result_info = {}

        if not df.empty:
            # Extract AQI values
            result_info['aqi_values'] = {}
            for index, row in df.iterrows():
                # Check if these columns exist in the dataframe
                if 'AQI' in df.columns and 'ReportingArea' in df.columns and 'DateForecast' in df.columns:
                    location = row['ReportingArea']
                    date = row['DateForecast']
                    aqi = row['AQI']

                    return "AQI: " + str(aqi)

            # Calculate distances if Latitude and Longitude columns are in the data
            if 'Latitude' in df.columns and 'Longitude' in df.columns:
                result_info['distances'] = {}
                for index, row in df.iterrows():
                    station_lat = row['Latitude']
                    station_lon = row['Longitude']

                    # Calculate distance between input and station coordinates
                    dist = calculate_distance(latitude, longitude, station_lat, station_lon)

                    # Store the distance by station location
                    location = row['ReportingArea'] if 'ReportingArea' in df.columns else f"Station {index}"
                    result_info['distances'][location] = dist

        return "Normal"

    except requests.exceptions.RequestException as e:
        # print(f"Error fetching air quality data: {e}")
        return None, None








if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)