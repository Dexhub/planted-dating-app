# Planted Dating App - Advanced Matching Algorithm

A sophisticated plant-based dating platform with multi-dimensional compatibility scoring and real-time matching capabilities.

## 🚀 Algorithm Implementation Features

### Core Compatibility Engine
- **Multi-dimensional Scoring**: 5 weighted compatibility dimensions
- **Real-time Performance**: <100ms response time target
- **Scalable Architecture**: Handles thousands of concurrent users
- **Intelligent Caching**: Redis-based performance optimization
- **A/B Testing**: Built-in algorithm variant testing

### Compatibility Dimensions

#### 1. Lifestyle Alignment (35% weight)
- **Dietary Preference**: Vegan/vegetarian compatibility
- **Years Plant-Based**: Journey timeline similarity  
- **Cooking Skills**: Kitchen compatibility levels
- **Restaurant Preferences**: Shared dining experiences

#### 2. Values Compatibility (30% weight)
- **Why Plant-Based**: NLP analysis of motivations
- **Shared Interests**: Common activities and hobbies
- **Activism Alignment**: Environmental/animal rights values

#### 3. Lifestyle Integration (20% weight)
- **Location Proximity**: Geographic compatibility
- **Age Preferences**: Mutual age range compatibility
- **Activity Patterns**: Active vs. quiet lifestyle match

#### 4. Communication Style (10% weight)
- **Text Complexity**: Writing style similarity analysis
- **Response Patterns**: Communication frequency match
- **Expression Style**: Emoji and tone compatibility

#### 5. Personal Compatibility (5% weight)
- **Personality Inference**: Interest-based personality matching
- **Energy Levels**: Activity and social energy alignment
- **Humor Compatibility**: Communication style analysis

## 🏗️ Architecture Overview

### Performance Optimizations
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Request  │───▶│  Matching API    │───▶│ Compatibility   │
│                 │    │  (<100ms target) │    │ Engine          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Redis Cache     │    │ Vector          │
                       │  (30min TTL)     │    │ Operations      │
                       └──────────────────┘    └─────────────────┘
```

### Scalability Design
- **Horizontal Scaling**: Stateless microservice architecture
- **Database Optimization**: MongoDB indexes for fast queries
- **Batch Processing**: Daily pre-computation of matches
- **Load Balancing**: Distributed request handling
- **Memory Management**: Efficient data structures

## 📊 Performance Metrics

### Response Time Targets
- **Real-time Matching**: <100ms per request
- **Batch Processing**: 10,000 users processed in <30 minutes
- **Cache Hit Rate**: >70% for optimal performance
- **Error Rate**: <1% for production stability

### Throughput Capabilities
- **Concurrent Users**: 1,000+ simultaneous requests
- **Daily Calculations**: 100,000+ compatibility scores
- **Memory Usage**: <512MB per service instance
- **CPU Efficiency**: Optimized vector operations

## 🔧 Installation & Setup

### Prerequisites
- Node.js 14+
- MongoDB 4.4+
- Redis 6.0+
- NPM or Yarn

### Backend Setup
```bash
cd backend
npm install

# Install additional dependencies for algorithm
npm install redis mathjs

# Set environment variables
cp .env.example .env
# Configure MONGODB_URI, REDIS_URL, JWT_SECRET

# Start development server
npm run dev

# Run tests
npm test

# Run daily batch processing
npm run precompute-matches
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🚀 API Endpoints

### Matching API
```bash
# Get potential matches with compatibility scores
GET /api/matches/potential?limit=10&minScore=60

# Get performance metrics
GET /api/matches/metrics

# Traditional swipe functionality
POST /api/matches/swipe
{
  "userId": "60f7b...",
  "action": "like|pass",
  "superLike": false
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "60f7b...",
        "firstName": "Alice",
        "age": 28,
        "compatibilityScore": 87,
        "compatibilityBreakdown": {
          "lifestyleAlignment": 92,
          "valuesCompatibility": 85,
          "lifestyleIntegration": 78,
          "communicationStyle": 82,
          "personalCompatibility": 88
        },
        "insights": [
          "Perfect dietary match - you're both vegan!",
          "You share 4 interests: cooking, hiking, sustainability, yoga",
          "Same city - perfect for spontaneous plant-based food adventures!"
        ],
        "confidence": 94
      }
    ],
    "total": 8,
    "responseTime": 73
  }
}
```

## 🧪 Testing & Quality Assurance

### Test Coverage
- **Unit Tests**: Algorithm components (>90% coverage)
- **Integration Tests**: API endpoints and database operations
- **Performance Tests**: Response time and throughput validation
- **A/B Tests**: Algorithm variant comparison

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run performance tests
npm run test:performance

# Run specific test suite
npm test -- --testNamePattern="Compatibility"
```

## 📈 Monitoring & Analytics

### Performance Dashboard
- **Response Time Tracking**: Real-time performance monitoring
- **Algorithm Effectiveness**: Match success rates and user satisfaction
- **Cache Performance**: Hit rates and optimization opportunities
- **Error Tracking**: Detailed error analysis and recovery

### A/B Testing Framework
```javascript
// Create new algorithm variant test
const test = createABTest('matching_algorithm_v2', ['current', 'enhanced'], {
  current: 50,    // 50% traffic
  enhanced: 50    // 50% traffic
});

// Track conversions
trackABTestConversion('matching_algorithm_v2', userId, variant, {
  compatibilityScore: 87,
  userSatisfaction: 4.5
});
```

## 🔄 Batch Processing

### Daily Match Pre-computation
The system runs overnight batch processing to pre-compute compatibility scores:

```bash
# Run manual batch processing
npm run precompute-matches

# Automated daily execution (2 AM)
# Configured in matchingService.js
```

### Benefits
- **Faster Response Times**: Pre-computed scores for immediate retrieval
- **Load Distribution**: Heavy computation during off-peak hours
- **Cache Warming**: Populate Redis cache for next day
- **Analytics Generation**: Daily performance reports

## 🛠️ Configuration

### Algorithm Weights
Adjust compatibility scoring weights in `ALGORITHM_WEIGHTS`:

```javascript
const ALGORITHM_WEIGHTS = {
  lifestyle: {
    dietaryPreference: 0.40,    // 40% of lifestyle score
    yearsBased: 0.25,           // 25% of lifestyle score
    cookingSkill: 0.20,         // 20% of lifestyle score
    favoriteRestaurants: 0.15   // 15% of lifestyle score
  },
  // ... other dimensions
};
```

### Performance Tuning
- **Cache TTL**: Adjust Redis cache timeout (default: 30 minutes)
- **Batch Size**: Configure daily processing batch size (default: 100 users)
- **Response Timeout**: Set API response timeout (default: 5 seconds)
- **Memory Limits**: Configure service memory allocation

## 🚀 Deployment

### Production Environment
```bash
# Build optimized version
npm run build

# Start production server
npm start

# Deploy with PM2
pm2 start ecosystem.config.js

# Setup Redis cluster for high availability
# Configure MongoDB replica set for scalability
```

### Environment Variables
```bash
NODE_ENV=production
MONGODB_URI=mongodb://replica-set/planted
REDIS_URL=redis://cluster-endpoint:6379
JWT_SECRET=your-secret-key
CACHE_TTL=1800
BATCH_SIZE=100
MAX_CONCURRENT_REQUESTS=1000
```

## 📚 Algorithm Details

### Compatibility Score Calculation
The algorithm uses a weighted multi-dimensional approach:

1. **Data Collection**: Gather user profile information
2. **Vector Creation**: Convert categorical data to numerical vectors
3. **Similarity Calculation**: Compute distances and overlaps
4. **Weight Application**: Apply configured weights to each dimension
5. **Score Normalization**: Ensure 0-100 score range
6. **Insight Generation**: Create human-readable explanations

### Performance Optimizations
- **Vectorized Operations**: Efficient mathematical computations
- **Lazy Loading**: Load data only when needed
- **Connection Pooling**: Optimize database connections
- **Query Optimization**: Indexed database queries
- **Memory Caching**: In-memory frequently accessed data

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/algorithm-improvement`
3. Run tests: `npm test`
4. Commit changes: `git commit -m 'Add algorithm enhancement'`
5. Push branch: `git push origin feature/algorithm-improvement`
6. Create Pull Request

### Code Style
- ESLint configuration for consistent code style
- Prettier for code formatting
- JSDoc comments for algorithm functions
- Comprehensive test coverage required

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Algorithm Documentation**: `/docs/algorithm.md`
- **API Documentation**: `/docs/api.md`
- **Performance Benchmarks**: `/docs/performance.md`
- **Deployment Guide**: `/docs/deployment.md`

---

**Built with ❤️ for the plant-based community**

*Bringing together conscious individuals through intelligent compatibility matching*