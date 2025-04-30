import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationObject } from 'expo-location';

interface EnvironmentalData {
  timestamp: string;
  aqi: string;
  flood_risk: string;
  power_outage: string;
  weather: string;
}

const STORAGE_KEY = '@environmental_data';
const API_BASE_URL = 'http://35.93.197.32:8000/weather';

export const fetchAndStoreEnvironmentalData = async (latitude: number, longitude: number): Promise<void> => {
  try {
    const url = `${API_BASE_URL}?latitude=${latitude}&longitude=${longitude}`;
    console.log('Making API call to:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data: EnvironmentalData = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Store the data locally
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Environmental data stored successfully');
  } catch (error) {
    console.error('Error fetching and storing environmental data:', error);
    throw error;
  }
};

export const getStoredEnvironmentalData = async (): Promise<EnvironmentalData | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      console.log('Retrieved stored data:', JSON.stringify(JSON.parse(data), null, 2));
      return JSON.parse(data);
    }
    console.log('No stored data found');
    return null;
  } catch (error) {
    console.error('Error reading stored data:', error);
    return null;
  }
}; 
// import AsyncStorage from '@react-native-async-storage/async-storage';

// interface EnvironmentalData {
//   timestamp: string;
//   aqi: string;
//   flood_risk: string;
//   power_outage: string;
//   weather: string;
// }

// const STORAGE_KEY = '@environmental_data';
// const API_URL = 'http://54.149.70.62:8002/weather?latitude=47.59&longitude=-122.116'; // Replace with your actual API endpoint

// export const fetchAndStoreEnvironmentalData = async (): Promise<void> => {
//   try {
//     // Make the API call
//     const response = await fetch(API_URL);
    
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }

//     const data: EnvironmentalData = await response.json();
    
//     // Store the data locally
//     await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
//     console.log('Environmental data stored successfully' + data);
//   } catch (error) {
//     console.error('Error fetching and storing environmental data:', error);
//     throw error;
//   }
// };

// export const getStoredEnvironmentalData = async (): Promise<EnvironmentalData | null> => {
//   try {
//     const data = await AsyncStorage.getItem(STORAGE_KEY);
//     return data ? JSON.parse(data) : null;
//   } catch (error) {
//     console.error('Error reading stored data:', error);
//     return null;
//   }
// }; 