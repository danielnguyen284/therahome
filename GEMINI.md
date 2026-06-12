# GEMINI.md - TheraHome Project Guidelines

This file provides context and instructions for AI coding assistants working on the TheraHome project.

## Project Overview
TheraHome is a comprehensive healthcare platform consisting of a mobile application, an admin dashboard, and a robust backend.

### Project Structure
- **/TheraEase-APP**: Mobile application built with Expo (React Native). (folder name kept as TheraEase-APP)
- **/admin-panel**: Web dashboard for administrators built with Next.js.
- **/backend**: REST API and server logic built with Express.js and MongoDB.

---

## 📱 TheraHome-APP (Mobile)
- **Framework**: Expo (React Native)
- **State Management**: Zustand
- **Backend-as-a-Service**: Supabase
- **UI Components**: React Native Paper, Lucide Icons
- **Animations**: Moti, Reanimated
- **Charts**: React Native Chart Kit
- **Navigation**: Expo Router (v7 stack)
- **Key Commands**:
  - `npm start` - Start Expo development server
  - `npm run android` - Run on Android emulator
  - `npm run ios` - Run on iOS simulator

---

## 💻 Admin Panel (Web)
- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase
- **Icons**: Lucide React
- **Visuals**: Recharts
- **Key Commands**:
  - `npm run dev` - Start development server
  - `npm run build` - Build for production

---

## ⚙️ Backend (API)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT, Google Auth
- **Deployment**: Configured for Vercel
- **Key Commands**:
  - `npm run dev` - Start backend server
  - `npm run seed` - Run data seeding scripts

---

## 🛠 Coding Standards & Rules
1. **Modules**: Use ES Modules (`import`/`export`) throughout the project.
2. **Naming**: Use camelCase for variables/functions and PascalCase for React components.
3. **Typing**: Use TypeScript for both the App and Admin Panel. Backend is currently JavaScript but follows clean patterns.
4. **Consistency**:
   - Use Lucide icons for all UI elements across both web and mobile.
   - Prefer functional components and hooks over class components.
   - Maintain separation of concerns: keep business logic in hooks/utils and display logic in components.
5. **No Placeholders**: Never use placeholder text or mock data if actual project context is available.

---

## 🚀 Common Workflows
- When adding a new feature that spans the stack:
  1. Define the Mongoose model in `/backend/models`.
  2. Create the API route in `/backend/routes`.
  3. Implement the UI in `/admin-panel` or `/TheraEase-APP` using the new API.
