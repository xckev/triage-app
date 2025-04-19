import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getStoredEnvironmentalData, fetchAndStoreEnvironmentalData } from '../services/environmentalService';

const Widget = ({ title, value, subtitle, icon, style, valueStyle }: { 
  title: string; 
  value: string; 
  subtitle: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: any;
  valueStyle?: any;
}) => {
  const theme = useTheme();
  return (
    <Surface style={[styles.widget, style, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.widgetHeader}>
        <Text style={[styles.widgetTitle, { color: theme.colors.onSurface }]}>{title}</Text>
        {icon && <MaterialCommunityIcons name={icon} size={24} color={theme.colors.onSurfaceVariant} />}
      </View>
      <Text style={[styles.widgetValue, valueStyle, { color: theme.colors.primary }]}>{value}</Text>
      <Text style={[styles.widgetSubtitle, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>
    </Surface>
  );
};

export default function DashboardScreen() {
  const theme = useTheme();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [environmentalData, setEnvironmentalData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      console.log('Loading initial data...');
      // Check location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Get location
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // First try to get stored data
      const storedData = await getStoredEnvironmentalData();
      if (storedData) {
        console.log('Using stored data initially');
        setEnvironmentalData(storedData);
      }

      // Then fetch fresh data with current location
      console.log('Fetching fresh data with location:', currentLocation.coords);
      await fetchAndStoreEnvironmentalData(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      const freshData = await getStoredEnvironmentalData();
      setEnvironmentalData(freshData);
    } catch (error) {
      console.error('Error in initialization:', error);
      setErrorMsg('Error fetching environmental data');
    }
  };

  const onRefresh = useCallback(async () => {
    if (!location) {
      console.error('Cannot refresh: location not available');
      setErrorMsg('Location not available for refresh');
      return;
    }

    console.log('Refreshing data with location:', location.coords);
    setRefreshing(true);
    try {
      // Fetch new data from API with current location
      await fetchAndStoreEnvironmentalData(
        location.coords.latitude,
        location.coords.longitude
      );
      // Reload the stored data
      const data = await getStoredEnvironmentalData();
      setEnvironmentalData(data);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setErrorMsg('Error refreshing environmental data');
    } finally {
      setRefreshing(false);
    }
  }, [location]);

  useEffect(() => {
    console.log('Dashboard mounted, loading data...');
    loadData();
  }, []);

  const formatCoordinates = (coords: Location.LocationObject | null) => {
    if (!coords) return 'Loading...';
    return `${coords.coords.latitude.toFixed(4)}, ${coords.coords.longitude.toFixed(4)}`;
  };

  const formatTemperature = (data: any): string => {
    const temp = data?.weather?.temperature_celsius;
    if (temp === null || temp === undefined) return '--°C';
    return `${Math.round(temp)}°C`;
  };

  const getWeatherConditions = (data: any): string => {
    if (!data?.weather?.conditions?.length) return 'Unknown';
    return data.weather.conditions.join(', ');
  };

  const getAQIStatus = (data: any): string => {
    if (data?.air_quality?.aqi === null) return 'Unknown';
    return `${data.air_quality.aqi} (${data.air_quality.category || 'Unknown'})`;
  };

  const getFloodRiskStatus = (data: any): string => {
    if (!data?.flood_risk) return 'Unknown';
    return `${data.flood_risk.current_level} (${data.flood_risk.trend})`;
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          Dashboard
        </Text>
        <Image 
          source={require('../assets/images/TriageLogo.png')}
          style={styles.logo}
        />
      </View>

      <View style={styles.summaryContainer}>
        <Widget
          title="Power Grid"
          value={environmentalData?.power_outage === false ? "All systems normal" : "Power outage detected"}
          subtitle={`Last updated ${environmentalData?.timestamp ? new Date(environmentalData.timestamp).toLocaleString() : 'Loading...'}`}
          icon="check-circle"
          style={styles.summaryWidget}
        />
      </View>

      <View style={styles.gridContainer}>
        <Widget
          title="Air Quality"
          value={environmentalData ? getAQIStatus(environmentalData) : 'Loading...'}
          subtitle="Current AQI Status"
          icon="air-filter"
        />
        <Widget
          title="Weather"
          value={environmentalData ? formatTemperature(environmentalData) : 'Loading...'}
          subtitle={environmentalData ? getWeatherConditions(environmentalData) : 'Loading...'}
          icon="weather-partly-cloudy"
        />
        <Widget
          title="Flood Risk"
          value={environmentalData ? getFloodRiskStatus(environmentalData) : 'Loading...'}
          subtitle={`${environmentalData?.flood_risk?.distance_km?.toFixed(1) || '--'} km from station`}
          icon="water"
        />
        <Widget
          title="Location"
          value={formatCoordinates(location)}
          subtitle={errorMsg || "Current coordinates"}
          icon="map-marker"
          valueStyle={styles.locationValue}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontWeight: 'bold',
  },
  summaryContainer: {
    paddingTop: 0,
    padding: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 20,
  },
  widget: {
    padding: 16,
    borderRadius: 16,
    elevation: 1,
    width: '47%',
    aspectRatio: 1,
  },
  summaryWidget: {
    width: '100%',
    aspectRatio: 2,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  widgetValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationValue: {
    fontSize: 20,
  },
  widgetSubtitle: {
    fontSize: 14,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 40,
  },
});
