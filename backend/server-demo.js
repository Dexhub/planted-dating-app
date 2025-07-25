const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Mock data
const mockUsers = [
  {
    id: '1',
    email: 'demo@planted.com',
    password: 'demo123', // In real app, this would be hashed
    firstName: 'Sarah',
    lastName: 'Green',
    age: 28,
    dietaryPreference: 'vegan',
    yearsBased: 5,
    location: { city: 'San Francisco' },
    bio: 'Passionate about plant-based cooking and sustainable living. Love hiking and trying new vegan restaurants!',
    whyPlantBased: 'For the animals, health, and our planet.',
    cookingSkill: 'advanced',
    interests: ['cooking', 'hiking', 'yoga', 'sustainability'],
    photos: [],
    isFoundingMember: true,
    memberNumber: 42,
    verification: {
      email: true,
      payment: true,
      video: false
    },
    subscription: {
      status: 'active',
      plan: 'founding'
    }
  }
];

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, dietaryPreference } = req.body;
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    email,
    firstName,
    lastName,
    dietaryPreference,
    age: 25,
    yearsBased: 2,
    location: { city: 'New York' },
    bio: 'New to Planted!',
    whyPlantBased: 'Health and environment',
    cookingSkill: 'intermediate',
    interests: [],
    photos: [],
    isFoundingMember: mockUsers.length < 100,
    memberNumber: mockUsers.length + 1,
    verification: {
      email: false,
      payment: false,
      video: false
    },
    subscription: {
      status: 'pending',
      plan: 'founding'
    }
  };
  
  mockUsers.push(newUser);
  
  const token = jwt.sign({ id: newUser.id }, 'demo-secret', { expiresIn: '30d' });
  
  res.json({
    success: true,
    token,
    user: newUser
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email);
  
  if (!user || (email === 'demo@planted.com' && password !== 'demo123')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  const token = jwt.sign({ id: user.id }, 'demo-secret', { expiresIn: '30d' });
  
  res.json({
    success: true,
    token,
    user
  });
});

app.get('/api/auth/me', (req, res) => {
  // For demo, return first user
  res.json({
    success: true,
    data: mockUsers[0]
  });
});

// User routes
app.get('/api/users', (req, res) => {
  // Return some mock profiles
  const profiles = [
    {
      _id: '2',
      firstName: 'Alex',
      age: 30,
      photos: [],
      location: { city: 'Los Angeles' },
      bio: 'Vegan chef and food blogger. Always experimenting with new recipes!',
      dietaryPreference: 'vegan',
      yearsBased: 8,
      whyPlantBased: 'Started for health, stayed for the animals',
      cookingSkill: 'chef-level',
      interests: ['cooking', 'travel', 'photography']
    },
    {
      _id: '3',
      firstName: 'Jordan',
      age: 26,
      photos: [],
      location: { city: 'Portland' },
      bio: 'Environmental activist and yoga instructor. Love outdoor adventures!',
      dietaryPreference: 'vegetarian',
      yearsBased: 4,
      whyPlantBased: 'Environmental impact and animal welfare',
      cookingSkill: 'intermediate',
      interests: ['yoga', 'hiking', 'activism', 'meditation']
    }
  ];
  
  res.json({
    success: true,
    data: profiles
  });
});

// Match routes
app.post('/api/matches/swipe', (req, res) => {
  const { userId, action } = req.body;
  
  // Simulate random match
  const matched = action === 'like' && Math.random() > 0.5;
  
  res.json({
    success: true,
    matched,
    message: matched ? "It's a match!" : action === 'like' ? 'Liked!' : 'Passed',
    matchedUser: matched ? {
      id: userId,
      firstName: 'Alex'
    } : undefined
  });
});

app.get('/api/matches', (req, res) => {
  res.json({
    success: true,
    count: 2,
    data: [
      {
        id: 'match1',
        user: {
          _id: '2',
          firstName: 'Alex',
          photos: [],
          bio: 'Vegan chef and food blogger.',
          dietaryPreference: 'vegan'
        },
        matchedAt: new Date().toISOString(),
        compatibilityScore: 85,
        sharedInterests: ['cooking', 'travel']
      }
    ]
  });
});

app.get('/api/matches/likes', (req, res) => {
  res.json({
    success: true,
    count: 1,
    data: [
      {
        matchId: 'like1',
        user: {
          _id: '3',
          firstName: 'Jordan',
          photos: [],
          bio: 'Environmental activist and yoga instructor.',
          dietaryPreference: 'vegetarian'
        },
        likedAt: new Date().toISOString(),
        superLike: true
      }
    ]
  });
});

// Messages
app.get('/api/messages/unread', (req, res) => {
  res.json({
    success: true,
    unreadCount: 3
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Planted Dating API (Demo Mode) is running',
    note: 'This is a demo version without database'
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`
=================================
🌱 Planted Demo Server Running! 🌱
=================================
API: http://localhost:${PORT}
Frontend: http://localhost:5173

Demo Login:
Email: demo@planted.com
Password: demo123
=================================
  `);
});