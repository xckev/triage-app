import { getStoredEnvironmentalData } from './environmentalService';
import * as Location from 'expo-location';

const getLocationInfo = async (): Promise<string> => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return 'Location permission not granted';
    }

    let location = await Location.getCurrentPositionAsync({});
    return `${location.coords.latitude.toFixed(4)}°N, ${location.coords.longitude.toFixed(4)}°W`;
  } catch (error) {
    console.error('Error getting location:', error);
    return 'Location data not available';
  }
};

const formatEnvironmentalData = async (data: any): Promise<string> => {
  if (!data) return 'No environmental data available.';
  
  const locationInfo = await getLocationInfo();
  
  return `
Current Environmental Status:
- Location: ${locationInfo}
- Air Quality: **${data.air_quality.aqi}** (${data.air_quality.category})
- Flood Risk: **${data.flood_risk.current_level}** (${data.flood_risk.trend})
  Distance from station: ${data.flood_risk.distance_km.toFixed(1)} km
- Power Status: **${data.power_outage ? 'Outage' : 'Normal'}**
- Weather: **${data.weather.conditions.join(', ')}**
  Temperature: ${Math.round(data.weather.temperature_celsius)}°C (${data.weather.temperature_fahrenheit}°F)
- Last Updated: ${new Date(data.timestamp).toLocaleString()}
`;
};

export const generateResponse = async (prompt: string, mode: 'disaster' | 'firstaid' | 'mental' = 'disaster'): Promise<string> => {
  try {
    // Get the stored environmental data
    const environmentalData = await getStoredEnvironmentalData();
    const environmentalContext = await formatEnvironmentalData(environmentalData);

    const response = await fetch('http://35.92.225.238:5000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `MODE: ${mode.toUpperCase()} ASSISTANT \n\n${environmentalContext}\n\nUser Message: ${prompt}`
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}; 
// export const generateResponse = async (prompt: string): Promise<string> => {
//   try {
//     const response = await fetch('http://54.149.70.62:8001/analyze', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         prompt: `MODE: DISASTER ASSISTANT \n\n User Message:${prompt}`
//       }),
//     });

//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }

//     const data = await response.json();
//     return data.response;
//   } catch (error) {
//     console.error('Error generating response:', error);
//     throw error;
//   }
// }; 