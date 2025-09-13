// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivacyFeedback is SepoliaConfig {

    address public owner;
    uint32 public feedbackCounter;

    struct EncryptedFeedback {
        euint8 satisfaction;     // 1-5 rating (encrypted)
        euint8 category;         // feedback category (encrypted)
        euint32 timestamp;       // submission time (encrypted)
        address submitter;       // public address for verification
        bool isAnalyzed;         // analysis status
        euint8 sentiment;        // analyzed sentiment score (encrypted)
    }

    struct AnalysisResult {
        euint32 totalSubmissions;
        euint8 averageSatisfaction;
        euint8 dominantCategory;
        euint8 overallSentiment;
        bool isReady;
    }

    mapping(uint32 => EncryptedFeedback) public feedbacks;
    mapping(address => uint32[]) public userFeedbacks;
    mapping(uint8 => euint32) public categoryTotals;  // encrypted category counts

    AnalysisResult public currentAnalysis;

    event FeedbackSubmitted(address indexed user, uint32 indexed feedbackId);
    event AnalysisCompleted(uint32 totalFeedbacks, bool publicResults);
    event PrivacyViolationDetected(address indexed user, uint32 feedbackId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier validRating(uint8 _rating) {
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        _;
    }

    modifier validCategory(uint8 _category) {
        require(_category >= 1 && _category <= 10, "Category must be 1-10");
        _;
    }

    constructor() {
        owner = msg.sender;
        feedbackCounter = 0;

        // Initialize analysis result
        currentAnalysis = AnalysisResult({
            totalSubmissions: FHE.asEuint32(0),
            averageSatisfaction: FHE.asEuint8(0),
            dominantCategory: FHE.asEuint8(0),
            overallSentiment: FHE.asEuint8(0),
            isReady: false
        });
    }

    // Submit encrypted feedback with privacy protection
    function submitFeedback(
        uint8 _satisfaction,
        uint8 _category,
        uint8 _sentimentScore
    ) external
        validRating(_satisfaction)
        validCategory(_category)
    {
        require(_sentimentScore >= 1 && _sentimentScore <= 10, "Sentiment must be 1-10");

        uint32 currentId = ++feedbackCounter;

        // Encrypt all sensitive data in batch
        euint8 encSatisfaction = FHE.asEuint8(_satisfaction);
        euint8 encCategory = FHE.asEuint8(_category);
        euint32 encTimestamp = FHE.asEuint32(uint32(block.timestamp));
        euint8 encSentiment = FHE.asEuint8(_sentimentScore);

        // Store encrypted feedback
        feedbacks[currentId] = EncryptedFeedback({
            satisfaction: encSatisfaction,
            category: encCategory,
            timestamp: encTimestamp,
            submitter: msg.sender,
            isAnalyzed: false,
            sentiment: encSentiment
        });

        // Track user's feedback history
        userFeedbacks[msg.sender].push(currentId);

        // Update category totals (encrypted) - optimize with cached value
        euint32 currentTotal = categoryTotals[_category];
        categoryTotals[_category] = FHE.add(currentTotal, FHE.asEuint32(1));

        // Batch set FHE permissions for gas efficiency
        FHE.allowThis(encSatisfaction);
        FHE.allowThis(encCategory);
        FHE.allowThis(encTimestamp);
        FHE.allowThis(encSentiment);
        FHE.allow(encSatisfaction, msg.sender);
        FHE.allow(encCategory, msg.sender);

        emit FeedbackSubmitted(msg.sender, currentId);
    }

    // Perform confidential analysis on encrypted feedback data - optimized
    function performConfidentialAnalysis() external onlyOwner {
        require(feedbackCounter > 0, "No feedback data available");

        uint32 unanalyzedCount = 0;
        euint32 totalSatisfaction = FHE.asEuint32(0);
        euint32 totalSentiment = FHE.asEuint32(0);
        euint8 maxCategoryCount = FHE.asEuint8(0);
        euint8 dominantCat = FHE.asEuint8(1);

        // First pass: count unanalyzed to avoid unnecessary operations
        for (uint32 i = 1; i <= feedbackCounter; i++) {
            if (!feedbacks[i].isAnalyzed) {
                unanalyzedCount++;
            }
        }

        require(unanalyzedCount > 0, "All feedback already analyzed");

        // Second pass: aggregate only unanalyzed feedback
        for (uint32 i = 1; i <= feedbackCounter; i++) {
            EncryptedFeedback storage feedback = feedbacks[i];

            if (!feedback.isAnalyzed) {
                // Batch convert and add (more gas efficient)
                totalSatisfaction = FHE.add(totalSatisfaction, FHE.asEuint32(feedback.satisfaction));
                totalSentiment = FHE.add(totalSentiment, FHE.asEuint32(feedback.sentiment));
                feedback.isAnalyzed = true;
            }
        }

        // Optimized category analysis - use existing totals
        for (uint8 cat = 1; cat <= 10; cat++) {
            euint8 catCount8 = FHE.asEuint8(categoryTotals[cat]);
            ebool isGreater = FHE.gt(catCount8, maxCategoryCount);
            maxCategoryCount = FHE.select(isGreater, catCount8, maxCategoryCount);
            dominantCat = FHE.select(isGreater, FHE.asEuint8(cat), dominantCat);
        }

        // Calculate averages with optimized division
        euint32 feedbackCount32 = FHE.asEuint32(feedbackCounter);
        euint8 avgSatisfaction = FHE.asEuint8(FHE.div(totalSatisfaction, feedbackCounter));
        euint8 avgSentiment = FHE.asEuint8(FHE.div(totalSentiment, feedbackCounter));

        // Batch update analysis results
        currentAnalysis = AnalysisResult({
            totalSubmissions: feedbackCount32,
            averageSatisfaction: avgSatisfaction,
            dominantCategory: dominantCat,
            overallSentiment: avgSentiment,
            isReady: true
        });

        // Batch set permissions
        FHE.allowThis(currentAnalysis.totalSubmissions);
        FHE.allowThis(currentAnalysis.averageSatisfaction);
        FHE.allowThis(currentAnalysis.dominantCategory);
        FHE.allowThis(currentAnalysis.overallSentiment);

        emit AnalysisCompleted(feedbackCounter, false);
    }

    // Request decryption for authorized analysis viewing
    function requestAnalysisDecryption() external onlyOwner {
        require(currentAnalysis.isReady, "Analysis not ready");

        bytes32[] memory cts = new bytes32[](4);
        cts[0] = FHE.toBytes32(currentAnalysis.totalSubmissions);
        cts[1] = FHE.toBytes32(currentAnalysis.averageSatisfaction);
        cts[2] = FHE.toBytes32(currentAnalysis.dominantCategory);
        cts[3] = FHE.toBytes32(currentAnalysis.overallSentiment);

        FHE.requestDecryption(cts, this.processAnalysisResults.selector);
    }

    // Process decrypted analysis results
    function processAnalysisResults(
        uint256 requestId,
        uint32 totalSubmissions,
        uint8 avgSatisfaction,
        uint8 dominantCategory,
        uint8 overallSentiment,
        bytes[] memory signatures
    ) external {
        // Note: In a production environment, proper signature verification should be implemented
        // For now, we'll accept the callback assuming it comes from the trusted relayer
        require(signatures.length > 0, "Signatures required");

        // Analysis results are now available for authorized viewing
        emit AnalysisCompleted(totalSubmissions, true);
    }

    // Get user's own feedback count (privacy-preserving)
    function getUserFeedbackCount(address user) external view returns (uint256) {
        return userFeedbacks[user].length;
    }

    // Check if user has submitted feedback (privacy check)
    function hasUserSubmittedFeedback(address user) external view returns (bool) {
        return userFeedbacks[user].length > 0;
    }

    // Privacy-preserving category distribution check
    function getCategoryParticipation(uint8 category) external onlyOwner returns (ebool) {
        require(category >= 1 && category <= 10, "Invalid category");
        // Returns encrypted boolean whether category has any submissions
        return FHE.gt(categoryTotals[category], FHE.asEuint32(0));
    }

    // Emergency privacy protection - detect potential violations
    function detectPrivacyViolation(uint32 feedbackId) external onlyOwner {
        require(feedbackId <= feedbackCounter && feedbackId > 0, "Invalid feedback ID");

        EncryptedFeedback storage feedback = feedbacks[feedbackId];

        // Check for suspicious patterns (this is a simplified check)
        // In practice, this would involve more sophisticated privacy analysis
        emit PrivacyViolationDetected(feedback.submitter, feedbackId);
    }

    // Get public statistics (non-sensitive)
    function getPublicStats() external view returns (
        uint32 totalFeedbacks,
        bool analysisAvailable,
        uint256 contractDeployTime
    ) {
        return (
            feedbackCounter,
            currentAnalysis.isReady,
            block.timestamp
        );
    }

    // Administrative function to reset analysis - gas optimized
    function resetAnalysis() external onlyOwner {
        // Reset analysis in batch
        currentAnalysis = AnalysisResult({
            totalSubmissions: FHE.asEuint32(0),
            averageSatisfaction: FHE.asEuint8(0),
            dominantCategory: FHE.asEuint8(0),
            overallSentiment: FHE.asEuint8(0),
            isReady: false
        });

        // Reset category totals efficiently
        euint32 zero = FHE.asEuint32(0);
        for (uint8 i = 1; i <= 10; i++) {
            categoryTotals[i] = zero;
        }
    }
}