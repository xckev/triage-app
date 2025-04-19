import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Switch, useTheme } from 'react-native-paper';
import { useThemeContext } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const theme = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <List.Section>
        <List.Subheader>General</List.Subheader>
        <List.Item
          title="Dark Mode"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Notifications"
          left={props => <List.Icon {...props} icon="bell" />}
        />
      </List.Section>
      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 