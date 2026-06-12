# GEMINI.md - TheraHome Mobile App

## Tech Stack
- **Framework**: Expo (React Native)
- **State Management**: Zustand
- **Database/Auth**: Supabase
- **UI**: React Native Paper, Lucide Icons
- **Animations**: Moti, Reanimated
- **Charts**: React Native Chart Kit
- **Navigation**: Expo Router (v7)

## Project Structure
- `/app`: Expo Router screens and layouts.
- `/src`: Components, hooks, stores, and utilities.
- `/assets`: Images and fonts.
- `/supabase`: Supabase configuration and types.

## Standards
- Use `lucide-react-native` for icons.
- Prefer functional components with TypeScript.
- Store state in Zustand stores located in `/src/store`.

## Commands
- `npm start`
- `npm run android`
- `npm run ios`
