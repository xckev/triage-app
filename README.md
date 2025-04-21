# Triage Mobile App

A disaster relief and prevention mobile application built with the Meta LlaMA Stack, Expo, and React Native. This app helps individuals and communities prepare for, respond to, and recover from natural disasters. It provides real-time information, AI-powered assistance, and works seamlessly both online and offline.

## Key Features

- **Disaster Preparedness**: Access to emergency checklists, evacuation routes, and safety guidelines
- **Real-time Updates**: Get live information about weather conditions, disaster alerts, and emergency services
- **Offline Functionality**: Critical data is cached locally for access during internet outages
- **AI Assistance**: Powered by Llama 3.3 through Ollama on AWS EC2 for intelligent responses to emergency situations
- **Location-based Services**: Find nearby shelters, emergency services, and safe zones
- **Cross-platform Support**: Available on iOS, Android, and web platforms

## Technical Stack

- **Framework**: Expo (v52.0.46)
- **Frontend**: React Native (v0.76.9)
- **AI Backend**: 
  - Llama 3.3
  - Ollama
  - AWS EC2
- **Navigation**: Expo Router
- **State Management**: React Context
- **Storage**: Async Storage for offline data persistence
- **Type Safety**: TypeScript

## Offline Capabilities

The app automatically:
- Downloads and caches critical disaster information when connected
- Stores user preferences and emergency contacts locally
- Syncs data when internet connection is restored
- Provides access to essential features without internet connection

## AI Features

Powered by Llama 3.3 through Ollama on AWS EC2:
- Natural language processing for emergency queries
- Intelligent disaster response recommendations
- Personalized safety suggestions based on location and situation
- Real-time risk assessment

## Get Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a:
- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Development

The project uses file-based routing with Expo Router. Main app screens are located in the `app` directory:
- `index.tsx`: Main disaster dashboard
- `chat.tsx`: AI-powered emergency assistance
- `settings.tsx`: User preferences and offline data management
- `_layout.tsx`: Navigation layout

## Contributing

We welcome contributions to help improve disaster response capabilities. Please follow these steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
