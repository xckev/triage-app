import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Surface, useTheme, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

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

export default function HomeScreen() {
  const theme = useTheme();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const formatCoordinates = (coords: Location.LocationObject | null) => {
    if (!coords) return 'Loading...';
    return `${coords.coords.latitude.toFixed(4)}, ${coords.coords.longitude.toFixed(4)}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          title="Summary"
          value="All systems normal"
          subtitle="Last updated 2 minutes ago"
          icon="check-circle"
          style={styles.summaryWidget}
        />
      </View>

      <View style={styles.gridContainer}>
        <Widget
          title="AQI"
          value="42"
          subtitle="Good"
          icon="air-filter"
        />
        <Widget
          title="Risk Level"
          value="Low"
          subtitle="No immediate concerns"
          icon="shield-check"
        />
        <Widget
          title="Location"
          value={formatCoordinates(location)}
          subtitle={errorMsg || "Current coordinates"}
          icon="map-marker"
          valueStyle={styles.locationValue}
        />
        <Widget
          title="Resources"
          value="Available"
          subtitle="All resources ready"
          icon="medical-bag"
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