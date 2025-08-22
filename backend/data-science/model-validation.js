/**
 * PLANTED MATCHING ALGORITHM - MODEL VALIDATION FRAMEWORK
 * 
 * Cross-validation, A/B testing, bias detection, and performance metrics
 * for ensuring algorithm fairness and effectiveness.
 * 
 * Author: Data Science Hive Mind Agent
 * Date: 2025-07-26
 */

const tf = require('@tensorflow/tfjs-node');
const { BayesianCompatibilityModel, CompatibilityClusteringModel, RelationshipSurvivalModel } = require('./statistical-models');

/**
 * MODEL VALIDATION FRAMEWORK
 * Comprehensive validation including cross-validation, bias detection, and fairness metrics
 */
class ModelValidationFramework {
  
  constructor() {
    this.validationResults = {};
    this.biasMetrics = {};
    this.fairnessThresholds = this.initializeFairnessThresholds();
  }
  
  /**
   * Initialize fairness thresholds for bias detection
   */
  initializeFairnessThresholds() {
    return {
      demographic_parity: 0.05, // Max 5% difference in match rates across groups
      equalized_odds: 0.05, // Max 5% difference in true positive rates
      calibration: 0.05, // Max 5% difference in positive predictive values
      individual_fairness: 0.1, // Max 10% difference for similar individuals
      statistical_significance: 0.05 // p-value threshold for statistical tests
    };
  }
  
  /**
   * Perform time-based cross-validation to prevent data leakage
   */
  async performTimeBasedCrossValidation(data, model, numFolds = 5) {
    console.log('Starting time-based cross-validation...');
    
    // Sort data by timestamp to ensure temporal order
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const foldSize = Math.floor(sortedData.length / numFolds);
    const validationResults = [];
    
    for (let fold = 0; fold < numFolds; fold++) {
      console.log(`Processing fold ${fold + 1}/${numFolds}`);
      
      // Training data: all data before validation period
      const trainEndIndex = (fold + 1) * foldSize;
      const trainingData = sortedData.slice(0, trainEndIndex);
      
      // Validation data: next time period
      const validationStartIndex = trainEndIndex;
      const validationEndIndex = Math.min(validationStartIndex + foldSize, sortedData.length);
      const validationData = sortedData.slice(validationStartIndex, validationEndIndex);
      
      if (validationData.length === 0) continue;
      
      // Train model on training data
      const trainedModel = await this.trainModel(model, trainingData);
      
      // Validate on validation data
      const foldResults = await this.validateModel(trainedModel, validationData);
      
      validationResults.push({
        fold: fold + 1,
        trainingSize: trainingData.length,
        validationSize: validationData.length,
        ...foldResults
      });
    }
    
    // Calculate aggregate metrics
    const aggregateResults = this.aggregateValidationResults(validationResults);
    
    console.log('Cross-validation completed.');
    return {
      foldResults: validationResults,
      aggregateResults,
      isValid: this.assessModelValidity(aggregateResults)
    };
  }
  
  /**
   * Perform comprehensive bias detection across protected attributes
   */
  async detectBias(model, testData) {
    console.log('Starting bias detection analysis...');
    
    const protectedAttributes = [
      'age_group',
      'gender', 
      'location_tier',
      'years_plant_based_group',
      'dietary_preference'
    ];
    
    const biasResults = {};
    
    for (const attribute of protectedAttributes) {
      console.log(`Analyzing bias for: ${attribute}`);
      
      const attributeGroups = this.groupByAttribute(testData, attribute);
      
      biasResults[attribute] = {
        demographic_parity: await this.calculateDemographicParity(model, attributeGroups),
        equalized_odds: await this.calculateEqualizedOdds(model, attributeGroups),
        calibration: await this.calculateCalibration(model, attributeGroups),
        statistical_significance: await this.performStatisticalSignificanceTest(model, attributeGroups)
      };
    }
    
    // Individual fairness analysis
    biasResults.individual_fairness = await this.assessIndividualFairness(model, testData);
    
    // Overall bias assessment
    const overallBias = this.assessOverallBias(biasResults);
    
    this.biasMetrics = biasResults;
    
    console.log('Bias detection completed.');
    return {
      biasResults,
      overallBias,
      recommendations: this.generateBiasRecommendations(biasResults)
    };
  }
  
  /**
   * Calculate demographic parity (equal match rates across groups)
   */
  async calculateDemographicParity(model, attributeGroups) {
    const groupMatchRates = {};
    
    for (const [groupName, groupData] of Object.entries(attributeGroups)) {
      const predictions = await this.getPredictions(model, groupData);
      const matchRate = predictions.filter(p => p >= 0.5).length / predictions.length;
      groupMatchRates[groupName] = matchRate;
    }
    
    // Calculate maximum difference between groups
    const matchRates = Object.values(groupMatchRates);
    const maxRate = Math.max(...matchRates);
    const minRate = Math.min(...matchRates);
    const disparityRatio = maxRate - minRate;
    
    return {
      groupMatchRates,
      disparityRatio,
      passesThreshold: disparityRatio <= this.fairnessThresholds.demographic_parity,
      threshold: this.fairnessThresholds.demographic_parity
    };
  }
  
  /**
   * Calculate equalized odds (equal true positive rates across groups)
   */
  async calculateEqualizedOdds(model, attributeGroups) {
    const groupTPRs = {};
    const groupFPRs = {};
    
    for (const [groupName, groupData] of Object.entries(attributeGroups)) {
      const predictions = await this.getPredictions(model, groupData);
      const actualOutcomes = groupData.map(d => d.successful_match ? 1 : 0);
      
      const metrics = this.calculateBinaryClassificationMetrics(predictions, actualOutcomes);
      groupTPRs[groupName] = metrics.tpr;
      groupFPRs[groupName] = metrics.fpr;
    }
    
    // Calculate maximum difference in TPRs and FPRs
    const tprValues = Object.values(groupTPRs);
    const fprValues = Object.values(groupFPRs);
    
    const tprDisparity = Math.max(...tprValues) - Math.min(...tprValues);
    const fprDisparity = Math.max(...fprValues) - Math.min(...fprValues);
    
    const maxDisparity = Math.max(tprDisparity, fprDisparity);
    
    return {
      groupTPRs,
      groupFPRs,
      tprDisparity,
      fprDisparity,
      maxDisparity,
      passesThreshold: maxDisparity <= this.fairnessThresholds.equalized_odds,
      threshold: this.fairnessThresholds.equalized_odds
    };
  }
  
  /**
   * Calculate calibration (equal positive predictive values across groups)
   */
  async calculateCalibration(model, attributeGroups) {
    const groupPPVs = {};
    
    for (const [groupName, groupData] of Object.entries(attributeGroups)) {
      const predictions = await this.getPredictions(model, groupData);
      const actualOutcomes = groupData.map(d => d.successful_match ? 1 : 0);
      
      const metrics = this.calculateBinaryClassificationMetrics(predictions, actualOutcomes);
      groupPPVs[groupName] = metrics.ppv;
    }
    
    // Calculate maximum difference in PPVs
    const ppvValues = Object.values(groupPPVs);
    const ppvDisparity = Math.max(...ppvValues) - Math.min(...ppvValues);
    
    return {
      groupPPVs,
      ppvDisparity,
      passesThreshold: ppvDisparity <= this.fairnessThresholds.calibration,
      threshold: this.fairnessThresholds.calibration
    };
  }
  
  /**
   * Assess individual fairness (similar individuals receive similar predictions)
   */
  async assessIndividualFairness(model, testData) {
    console.log('Assessing individual fairness...');
    
    const fairnessViolations = [];
    const sampleSize = Math.min(1000, testData.length); // Sample for computational efficiency
    const sampledData = this.randomSample(testData, sampleSize);
    
    for (let i = 0; i < sampledData.length; i++) {
      const individual1 = sampledData[i];
      
      // Find similar individuals using feature similarity
      const similarIndividuals = this.findSimilarIndividuals(individual1, sampledData, 0.1); // 10% similarity threshold
      
      if (similarIndividuals.length > 0) {
        const pred1 = await this.getPrediction(model, individual1);
        
        for (const individual2 of similarIndividuals) {
          const pred2 = await this.getPrediction(model, individual2);
          const predictionDifference = Math.abs(pred1 - pred2);
          
          if (predictionDifference > this.fairnessThresholds.individual_fairness) {
            fairnessViolations.push({
              individual1: individual1.id,
              individual2: individual2.id,
              similarity: this.calculateSimilarity(individual1, individual2),
              predictionDifference,
              prediction1: pred1,
              prediction2: pred2
            });
          }
        }
      }
    }
    
    const violationRate = fairnessViolations.length / (sampleSize * 10); // Average violations per individual
    
    return {
      totalViolations: fairnessViolations.length,
      violationRate,
      sampleSize,
      passesThreshold: violationRate <= 0.05, // Max 5% violation rate
      violations: fairnessViolations.slice(0, 10) // Return top 10 violations for analysis
    };
  }
  
  /**
   * Perform statistical significance testing for group differences
   */
  async performStatisticalSignificanceTest(model, attributeGroups) {
    const groupNames = Object.keys(attributeGroups);
    const testResults = {};
    
    // Perform pairwise t-tests between groups
    for (let i = 0; i < groupNames.length; i++) {
      for (let j = i + 1; j < groupNames.length; j++) {
        const group1Name = groupNames[i];
        const group2Name = groupNames[j];
        
        const group1Predictions = await this.getPredictions(model, attributeGroups[group1Name]);
        const group2Predictions = await this.getPredictions(model, attributeGroups[group2Name]);
        
        const tTestResult = this.performTTest(group1Predictions, group2Predictions);
        
        testResults[`${group1Name}_vs_${group2Name}`] = {
          ...tTestResult,
          significantDifference: tTestResult.pValue < this.fairnessThresholds.statistical_significance
        };
      }
    }
    
    return testResults;
  }
  
  /**
   * A/B Testing Framework for algorithm improvements
   */
  async runABTest(controlModel, treatmentModel, testData, testDuration = 30) {
    console.log('Starting A/B test...');
    
    // Split test data randomly
    const shuffledData = this.shuffleArray([...testData]);
    const splitIndex = Math.floor(shuffledData.length / 2);
    
    const controlGroup = shuffledData.slice(0, splitIndex);
    const treatmentGroup = shuffledData.slice(splitIndex);
    
    // Run both models
    const controlResults = await this.evaluateModel(controlModel, controlGroup);
    const treatmentResults = await this.evaluateModel(treatmentModel, treatmentGroup);
    
    // Statistical analysis
    const statisticalAnalysis = this.analyzeABTestResults(controlResults, treatmentResults);
    
    return {
      controlGroup: {
        size: controlGroup.length,
        metrics: controlResults
      },
      treatmentGroup: {
        size: treatmentGroup.length,
        metrics: treatmentResults
      },
      statisticalAnalysis,
      recommendation: this.makeABTestRecommendation(statisticalAnalysis)
    };
  }
  
  /**
   * Calculate comprehensive success metrics
   */
  calculateSuccessMetrics(predictions, actualOutcomes, interactionData = null) {
    const binaryPredictions = predictions.map(p => p >= 0.5 ? 1 : 0);
    const binaryMetrics = this.calculateBinaryClassificationMetrics(binaryPredictions, actualOutcomes);
    
    // Ranking metrics
    const rankingMetrics = this.calculateRankingMetrics(predictions, actualOutcomes);
    
    // Business metrics
    const businessMetrics = interactionData ? 
      this.calculateBusinessMetrics(predictions, actualOutcomes, interactionData) : null;
    
    return {
      accuracy: binaryMetrics.accuracy,
      precision: binaryMetrics.precision,
      recall: binaryMetrics.recall,
      f1Score: binaryMetrics.f1Score,
      auc: this.calculateAUC(predictions, actualOutcomes),
      
      // Ranking metrics
      precisionAtK: rankingMetrics.precisionAtK,
      ndcg: rankingMetrics.ndcg,
      map: rankingMetrics.map, // Mean Average Precision
      
      // Diversity and coverage
      diversity: this.calculateDiversity(predictions),
      coverage: this.calculateCoverage(predictions),
      
      // Business metrics
      ...businessMetrics
    };
  }
  
  /**
   * Helper methods for validation and bias detection
   */
  
  groupByAttribute(data, attribute) {
    const groups = {};
    
    data.forEach(item => {
      const attributeValue = this.getAttributeValue(item, attribute);
      
      if (!groups[attributeValue]) {
        groups[attributeValue] = [];
      }
      
      groups[attributeValue].push(item);
    });
    
    return groups;
  }
  
  getAttributeValue(item, attribute) {
    switch (attribute) {
      case 'age_group':
        const age = item.features.demographic.age_normalized * (65 - 18) + 18;
        if (age < 25) return 'young';
        if (age < 35) return 'early_career';
        if (age < 45) return 'established';
        return 'mature';
        
      case 'gender':
        return item.features.demographic.gender;
        
      case 'location_tier':
        return item.features.demographic.location_tier.toString();
        
      case 'years_plant_based_group':
        const years = item.features.dietary.years_plant_based;
        if (years < 2) return 'newcomer';
        if (years < 5) return 'developing';
        return 'experienced';
        
      case 'dietary_preference':
        return item.features.dietary.dietary_type === 1 ? 'vegan' : 'vegetarian';
        
      default:
        return 'unknown';
    }
  }
  
  async getPredictions(model, data) {
    // This would integrate with the actual model prediction method
    return data.map(item => {
      // Placeholder - would call actual model.predict(item.features)
      return Math.random(); // Replace with actual prediction
    });
  }
  
  async getPrediction(model, item) {
    // Placeholder - would call actual model.predict(item.features)
    return Math.random(); // Replace with actual prediction
  }
  
  calculateBinaryClassificationMetrics(predictions, actualOutcomes) {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      const actual = actualOutcomes[i];
      
      if (pred === 1 && actual === 1) tp++;
      else if (pred === 1 && actual === 0) fp++;
      else if (pred === 0 && actual === 0) tn++;
      else if (pred === 0 && actual === 1) fn++;
    }
    
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const accuracy = (tp + tn) / (tp + fp + tn + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const tpr = recall;
    const fpr = fp / (fp + tn) || 0;
    const ppv = precision;
    
    return { accuracy, precision, recall, f1Score, tpr, fpr, ppv };
  }
  
  calculateAUC(predictions, actualOutcomes) {
    // Sort by prediction score descending
    const sorted = predictions.map((pred, i) => ({ pred, actual: actualOutcomes[i] }))
                              .sort((a, b) => b.pred - a.pred);
    
    let tp = 0, fp = 0;
    let auc = 0;
    const totalPositives = actualOutcomes.filter(a => a === 1).length;
    const totalNegatives = actualOutcomes.length - totalPositives;
    
    if (totalPositives === 0 || totalNegatives === 0) return 0.5;
    
    sorted.forEach(item => {
      if (item.actual === 1) {
        tp++;
      } else {
        fp++;
        auc += tp; // Add current TP count for each FP
      }
    });
    
    return auc / (totalPositives * totalNegatives);
  }
  
  calculateRankingMetrics(predictions, actualOutcomes, k = 10) {
    // Calculate Precision@K
    const sortedIndices = predictions.map((pred, i) => ({ pred, actual: actualOutcomes[i], index: i }))
                                    .sort((a, b) => b.pred - a.pred)
                                    .slice(0, k);
    
    const relevantAtK = sortedIndices.filter(item => item.actual === 1).length;
    const precisionAtK = relevantAtK / k;
    
    // Calculate NDCG@K
    const dcg = sortedIndices.reduce((sum, item, i) => {
      const relevance = item.actual;
      return sum + relevance / Math.log2(i + 2);
    }, 0);
    
    const idealRelevance = [...actualOutcomes].sort((a, b) => b - a).slice(0, k);
    const idcg = idealRelevance.reduce((sum, relevance, i) => {
      return sum + relevance / Math.log2(i + 2);
    }, 0);
    
    const ndcg = idcg > 0 ? dcg / idcg : 0;
    
    // Calculate Mean Average Precision (simplified)
    let map = 0;
    let relevantCount = 0;
    
    sortedIndices.forEach((item, i) => {
      if (item.actual === 1) {
        relevantCount++;
        map += relevantCount / (i + 1);
      }
    });
    
    const totalRelevant = actualOutcomes.filter(a => a === 1).length;
    map = totalRelevant > 0 ? map / totalRelevant : 0;
    
    return { precisionAtK, ndcg, map };
  }
  
  performTTest(group1, group2) {
    const n1 = group1.length;
    const n2 = group2.length;
    
    if (n1 === 0 || n2 === 0) {
      return { tStatistic: 0, pValue: 1, degreesOfFreedom: 0 };
    }
    
    const mean1 = group1.reduce((sum, val) => sum + val, 0) / n1;
    const mean2 = group2.reduce((sum, val) => sum + val, 0) / n2;
    
    const var1 = group1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
    const var2 = group2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);
    
    const pooledSE = Math.sqrt(var1 / n1 + var2 / n2);
    const tStatistic = (mean1 - mean2) / pooledSE;
    const degreesOfFreedom = n1 + n2 - 2;
    
    // Simplified p-value calculation (would use proper t-distribution in production)
    const pValue = 2 * (1 - this.approximateNormalCDF(Math.abs(tStatistic)));
    
    return { tStatistic, pValue, degreesOfFreedom, mean1, mean2 };
  }
  
  approximateNormalCDF(z) {
    // Approximation of normal CDF for p-value calculation
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }
  
  erf(x) {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
  
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  randomSample(array, sampleSize) {
    const shuffled = this.shuffleArray(array);
    return shuffled.slice(0, sampleSize);
  }
  
  findSimilarIndividuals(target, candidates, threshold) {
    return candidates.filter(candidate => {
      if (candidate.id === target.id) return false;
      
      const similarity = this.calculateSimilarity(target, candidate);
      return similarity >= threshold;
    });
  }
  
  calculateSimilarity(individual1, individual2) {
    // Calculate feature similarity (simplified cosine similarity)
    const features1 = Object.values(individual1.features).flat().filter(f => typeof f === 'number');
    const features2 = Object.values(individual2.features).flat().filter(f => typeof f === 'number');
    
    if (features1.length !== features2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  assessOverallBias(biasResults) {
    let totalViolations = 0;
    let totalTests = 0;
    
    Object.values(biasResults).forEach(attributeResults => {
      if (typeof attributeResults === 'object' && attributeResults.passesThreshold !== undefined) {
        totalTests++;
        if (!attributeResults.passesThreshold) {
          totalViolations++;
        }
      }
    });
    
    const violationRate = totalViolations / totalTests;
    
    return {
      totalTests,
      totalViolations,
      violationRate,
      overallBiasLevel: violationRate < 0.1 ? 'low' : violationRate < 0.3 ? 'moderate' : 'high',
      passesOverallFairness: violationRate < 0.1
    };
  }
  
  generateBiasRecommendations(biasResults) {
    const recommendations = [];
    
    Object.entries(biasResults).forEach(([attribute, results]) => {
      if (typeof results === 'object' && results.passesThreshold === false) {
        recommendations.push({
          attribute,
          issue: this.describeBiasIssue(attribute, results),
          recommendation: this.getBiasRecommendation(attribute, results),
          priority: results.disparityRatio > 0.2 ? 'high' : 'medium'
        });
      }
    });
    
    return recommendations;
  }
  
  describeBiasIssue(attribute, results) {
    if (results.disparityRatio) {
      return `${attribute} shows ${(results.disparityRatio * 100).toFixed(1)}% disparity in outcomes`;
    }
    return `${attribute} exhibits bias according to fairness metrics`;
  }
  
  getBiasRecommendation(attribute, results) {
    return `Consider rebalancing training data for ${attribute} or implementing fairness constraints in the model`;
  }
}

module.exports = {
  ModelValidationFramework
};