# How to Run Planted Dating App

## Quick Start

### 1. Start MongoDB (if not already running)
Open a terminal and run:
```bash
mongod
```
Leave this terminal open.

### 2. Start the Backend Server
Open a new terminal and run:
```bash
cd backend
npm run dev
```
The backend will start on http://localhost:5001

### 3. Start the Frontend
Open another new terminal and run:
```bash
cd frontend
npm run dev
```
The frontend will start on http://localhost:5173

### 4. Access the App
Open your browser and go to: http://localhost:5173

## First Time Setup

1. Click "Apply to Join" to create an account
2. Fill out the registration form
3. Complete your profile with photos
4. Start browsing and matching!

## Test Credentials
If you want to test with existing accounts, you can:
1. Create a new account through registration
2. Use the app as intended

## Troubleshooting

### MongoDB Connection Error
If you see MongoDB connection errors:
1. Make sure MongoDB is installed: `brew install mongodb-community`
2. Start MongoDB: `mongod`
3. If permission errors, create data directory: `sudo mkdir -p /data/db && sudo chown -R $(whoami) /data/db`

### Port Already in Use
If port 5001 is in use:
1. Find the process: `lsof -i :5001`
2. Kill it: `kill -9 <PID>`
3. Or change the PORT in backend/.env

### Frontend Not Loading
1. Make sure you're accessing http://localhost:5173 (not 3000)
2. Check that frontend/.env has the correct API URL
3. Try clearing browser cache

## Features to Try

1. **Registration**: Multi-step form with validation
2. **Browse**: Swipe through profiles
3. **Matches**: See who you've matched with
4. **Messages**: Real-time chat with matches
5. **Profile**: Upload photos and edit your info
6. **Settings**: Update preferences and security

Enjoy using Planted! 🌱