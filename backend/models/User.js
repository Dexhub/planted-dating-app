const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'Please provide your first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please provide your last name'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide your date of birth']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'other'],
    required: true
  },
  interestedIn: {
    type: String,
    enum: ['male', 'female', 'both', 'all'],
    required: true
  },
  dietaryPreference: {
    type: String,
    enum: ['vegan', 'vegetarian'],
    required: [true, 'Please specify if you are vegan or vegetarian']
  },
  yearsBased: {
    type: Number,
    required: [true, 'Please specify how many years you have been plant-based'],
    min: 0
  },
  location: {
    city: {
      type: String,
      required: true
    },
    state: String,
    country: {
      type: String,
      default: 'USA'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  bio: {
    type: String,
    maxlength: 500,
    required: [true, 'Please tell us about yourself']
  },
  whyPlantBased: {
    type: String,
    maxlength: 300,
    required: [true, 'Please share why you chose a plant-based lifestyle']
  },
  favoriteRestaurants: [{
    type: String,
    maxlength: 100
  }],
  cookingSkill: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'chef-level'],
    required: true
  },
  interests: [{
    type: String,
    enum: ['cooking', 'fitness', 'yoga', 'meditation', 'hiking', 'travel', 'music', 'art', 'reading', 'gardening', 'activism', 'sustainability']
  }],
  photos: [{
    url: String,
    isMain: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    ageRange: {
      min: {
        type: Number,
        default: 18,
        min: 18
      },
      max: {
        type: Number,
        default: 99,
        max: 99
      }
    },
    distance: {
      type: Number,
      default: 50,
      max: 500
    },
    dietaryDealbreaker: {
      type: Boolean,
      default: true
    }
  },
  subscription: {
    status: {
      type: String,
      enum: ['pending', 'active', 'cancelled', 'expired'],
      default: 'pending'
    },
    plan: {
      type: String,
      enum: ['founding', 'monthly', 'annual'],
      default: 'founding'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String
  },
  verification: {
    email: {
      type: Boolean,
      default: false
    },
    phone: {
      type: Boolean,
      default: false
    },
    video: {
      type: Boolean,
      default: false
    },
    payment: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isFoundingMember: {
    type: Boolean,
    default: false
  },
  memberNumber: Number,
  blockedUsers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  reportedUsers: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age
userSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Update lastActive on any update
userSchema.pre('save', function(next) {
  this.lastActive = Date.now();
  next();
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

module.exports = mongoose.model('User', userSchema);