import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';

const Widget = ({ title, value, subtitle, style }: { title: string; value: string; subtitle: string; style?: any }) => (
  <Surface style={[styles.widget, style]}>
    <Text style={styles.widgetTitle}>{title}</Text>
    <Text style={styles.widgetValue}>{value}</Text>
    <Text style={styles.widgetSubtitle}>{subtitle}</Text>
  </Surface>
);

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.summaryContainer}>
        <Widget
          title="Summary"
          value="All systems normal"
          subtitle="Last updated 2 minutes ago"
          style={styles.summaryWidget}
        />
      </View>
      <View style={styles.gridContainer}>
        <Widget
          title="AQI"
          value="42"
          subtitle="Good"
        />
        <Widget
          title="Risk Level"
          value="Low"
          subtitle="No immediate concerns"
        />
        <Widget
          title="Placeholder 1"
          value="N/A"
          subtitle="Coming soon"
        />
        <Widget
          title="Placeholder 2"
          value="N/A"
          subtitle="Coming soon"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryContainer: {
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  widget: {
    margin: 8,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: 'white',
    width: '45%',
    aspectRatio: 1,
  },
  summaryWidget: {
    width: '100%',
    aspectRatio: 2,
  },
  widgetTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  widgetValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 8,
  },
  widgetSubtitle: {
    fontSize: 14,
    color: '#666',
  },
}); 