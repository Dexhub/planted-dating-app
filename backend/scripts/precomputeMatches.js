#!/usr/bin/env node

/**
 * Daily Match Pre-computation Script
 * Runs overnight to pre-compute compatibility scores and cache results
 * Usage: npm run precompute-matches
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { precomputeMatches } = require('../services/matchingService');
const { generateReport } = require('../services/analyticsService');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for batch processing'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function runBatchProcessing() {
  const startTime = Date.now();
  console.log('Starting daily match pre-computation...', new Date().toISOString());
  
  try {
    // Pre-compute matches for all active users
    const result = await precomputeMatches({
      batchSize: 100,
      maxCandidates: 200
    });
    
    console.log('Pre-computation Results:');
    console.log(`- Total users processed: ${result.totalUsers}`);
    console.log(`- Duration: ${result.duration}ms`);
    console.log(`- Completed at: ${result.completedAt}`);
    
    // Generate analytics report
    const report = generateReport('24h');
    console.log('\nDaily Analytics Report:');
    console.log(`- Total calculations: ${report.summary.totalCalculations}`);
    console.log(`- Average response time: ${report.summary.avgResponseTime}ms`);
    console.log(`- Cache hit rate: ${report.summary.cacheHitRate}%`);
    console.log(`- Match success rate: ${report.summary.matchSuccessRate}%`);
    
    // Check for bottlenecks
    const bottlenecks = report.performance.bottlenecks;
    if (bottlenecks.length > 0) {
      console.log('\n⚠️  Performance Bottlenecks Detected:');
      bottlenecks.forEach(bottleneck => {
        console.log(`- ${bottleneck.type}: ${bottleneck.value} (${bottleneck.severity})`);
        console.log(`  Recommendation: ${bottleneck.recommendation}`);
      });
    }
    
    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`- [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`  Action: ${rec.action}`);
      });
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Batch processing completed successfully in ${totalTime}ms`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Received SIGINT, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Received SIGTERM, shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start the batch processing
runBatchProcessing();