# Planted - Where Values Meet 🌱

A complete dating application for vegetarians and vegans, built with the MERN stack (MongoDB, Express, React, Node.js) and real-time messaging with Socket.io.

## Features

- **User Authentication**: Secure registration and login with JWT
- **Profile Management**: Photo uploads, bio, interests, and dietary preferences
- **Smart Matching**: Algorithm-based compatibility scoring
- **Real-time Messaging**: Live chat with typing indicators
- **Responsive Design**: Mobile-first approach following brand guidelines
- **Founding Member System**: First 100 members get special status

## Tech Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time features
- Multer for file uploads
- Nodemailer for emails
- Bcrypt for password hashing

### Frontend
- React with Vite
- React Router for navigation
- Framer Motion for animations
- Socket.io Client
- Axios for API calls
- React Hook Form
- React Hot Toast

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- Stripe account for payments
- SMTP server for emails

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with your credentials:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/planted-dating
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
CLIENT_URL=http://localhost:5173
```

4. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_STRIPE_PUBLIC_KEY
```

4. Start the development server:
```bash
npm run dev
```

## Running the Application

1. Start MongoDB locally:
```bash
mongod
```

2. Start the backend server:
```bash
cd backend && npm run dev
```

3. Start the frontend:
```bash
cd frontend && npm run dev
```

4. Open http://localhost:5173 in your browser

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user
- `PUT /api/auth/updatepassword` - Update password

### Users
- `GET /api/users` - Browse users (with filters)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:id/block` - Block user
- `POST /api/users/:id/report` - Report user

### Matches
- `POST /api/matches/swipe` - Like/pass on user
- `GET /api/matches` - Get matches
- `GET /api/matches/likes` - Get who liked you
- `DELETE /api/matches/:matchId` - Unmatch

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/:matchId` - Get conversation
- `PUT /api/messages/:matchId/read` - Mark as read
- `GET /api/messages/unread` - Get unread count

### Uploads
- `POST /api/upload/photo` - Upload photo
- `DELETE /api/upload/photo/:photoId` - Delete photo
- `PUT /api/upload/photo/:photoId/main` - Set main photo

## Design Guidelines

The app follows the Planted brand guidelines:
- **Colors**: Black (#000), White (#FFF), Green (#00D27A)
- **Fonts**: Instrument Serif (headings), Inter (body)
- **Voice**: Honest, empathetic, confident
- **Animations**: Subtle, purposeful, 60fps target

## Production Deployment

1. Set up MongoDB Atlas
2. Configure Stripe production keys
3. Set up production email service
4. Update environment variables
5. Build frontend: `npm run build`
6. Deploy to hosting service (Heroku, AWS, etc.)

## License

This project is proprietary and confidential.