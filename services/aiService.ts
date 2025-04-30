import { getStoredEnvironmentalData } from './environmentalService';
import * as Location from 'expo-location';

const getLocationInfo = async (): Promise<string> => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return 'Location permission not granted';
    }

    let location = await Location.getCurrentPositionAsync({});
    if (!location?.coords) {
      return 'Location coordinates not available';
    }

    return `${location.coords.latitude.toFixed(4)}°N, ${location.coords.longitude.toFixed(4)}°W`;
  } catch (error) {
    console.error('Error getting location:', error);
    return 'Location data not available';
  }
};

const formatEnvironmentalData = async (data: any): Promise<string> => {
  if (!data) return 'No environmental data available.';
  
  const locationInfo = await getLocationInfo();
  
  // Format flood risk distance with null check
  const floodRiskDistance = data.flood_risk?.distance_km 
    ? `${data.flood_risk.distance_km.toFixed(1)} km`
    : 'Unknown';

  return `
Current Environmental Status:
- Location: ${locationInfo}
- Air Quality: **${data.air_quality?.aqi ?? 'Unknown'}** (${data.air_quality?.category ?? 'Unknown'})
- Flood Risk: **${data.flood_risk?.current_level ?? 'Unknown'}** (${data.flood_risk?.trend ?? 'Unknown'})
  Distance from station: ${floodRiskDistance}
- Power Status: **${data.power_outage !== undefined ? (data.power_outage ? 'Outage' : 'Normal') : 'Unknown'}**
- Weather: **${data.weather?.conditions?.join(', ') ?? 'Unknown'}**
  Temperature: ${data.weather?.temperature_celsius ? Math.round(data.weather.temperature_celsius) : 'Unknown'}°C (${data.weather?.temperature_fahrenheit ?? 'Unknown'}°F)
- Last Updated: ${data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Unknown'}
`;
};

export const generateResponse = async (prompt: string, mode: 'disaster' | 'firstaid' | 'mental' = 'disaster'): Promise<string> => {
  try {
    // Get the stored environmental data
    const environmentalData = await getStoredEnvironmentalData();
    const environmentalContext = await formatEnvironmentalData(environmentalData);

    const response = await fetch('http://35.93.197.32:5000/analyze', {
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