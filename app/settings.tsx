import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Switch, useTheme, TextInput, Button, SegmentedButtons, Text } from 'react-native-paper';
import { useThemeContext } from '../context/ThemeContext';

interface Profile {
  name: string;
  age: string;
  gender: string;
  ability: string;
  details: string;
}

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const theme = useTheme();
  const [profile, setProfile] = useState<Profile>({
    name: '',
    age: '',
    gender: 'prefer-not',
    ability: 'none',
    details: '',
  });

  const handleProfileChange = (field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <List.Section>
        <List.Subheader>Profile</List.Subheader>
        <View style={styles.profileSection}>
          <TextInput
            label="Name"
            value={profile.name}
            onChangeText={(value) => handleProfileChange('name', value)}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Age"
            value={profile.age}
            onChangeText={(value) => handleProfileChange('age', value)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>Gender</Text>
            <SegmentedButtons
              value={profile.gender}
              onValueChange={(value) => handleProfileChange('gender', value)}
              buttons={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'prefer-not', label: 'Prefer not to say' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>Ability Status</Text>
            <SegmentedButtons
              value={profile.ability}
              onValueChange={(value) => handleProfileChange('ability', value)}
              buttons={[
                { value: 'none', label: 'None' },
                { value: 'visual', label: 'Visual' },
                { value: 'mobility', label: 'Mobility' },
                { value: 'other', label: 'Other' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
          <TextInput
            label="Additional Details"
            placeholder="Enter additional details as context for AI features"
            value={profile.details}
            onChangeText={(value) => handleProfileChange('details', value)}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          <Button 
            mode="contained" 
            onPress={() => {/* TODO: Save profile */}} 
            style={styles.saveButton}
          >
            Save Profile
          </Button>
        </View>
        <Divider />
      </List.Section>

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
  profileSection: {
    padding: 16,
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    marginTop: 8,
  }
}); 