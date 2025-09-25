const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔒 Privacy Feedback System Interaction Script");
  console.log("============================================");

  // Get contract addresses from environment or prompt for them
  const privacyFeedbackAddress = process.env.PRIVACY_FEEDBACK_CONTRACT;
  const feedbackAnalyzerAddress = process.env.FEEDBACK_ANALYZER_CONTRACT;

  if (!privacyFeedbackAddress || !feedbackAnalyzerAddress) {
    console.error("❌ Please set contract addresses in .env file");
    process.exit(1);
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Interacting with account:", signer.address);

  // Get contract instances
  const PrivacyFeedback = await ethers.getContractFactory("PrivacyFeedback");
  const privacyFeedback = PrivacyFeedback.attach(privacyFeedbackAddress);

  const FeedbackAnalyzer = await ethers.getContractFactory("FeedbackAnalyzer");
  const feedbackAnalyzer = FeedbackAnalyzer.attach(feedbackAnalyzerAddress);

  console.log("\n📊 Current System Status:");
  console.log("========================");

  // Get public statistics
  const publicStats = await privacyFeedback.getPublicStats();
  console.log("Total Feedbacks:", publicStats[0].toString());
  console.log("Analysis Available:", publicStats[1]);
  console.log("Contract Deploy Time:", new Date(Number(publicStats[2]) * 1000).toLocaleString());

  // Check user's feedback history
  const userFeedbackCount = await privacyFeedback.getUserFeedbackCount(signer.address);
  const hasSubmitted = await privacyFeedback.hasUserSubmittedFeedback(signer.address);
  console.log("Your Feedback Count:", userFeedbackCount.toString());
  console.log("Has Submitted Feedback:", hasSubmitted);

  // Get analysis overview
  const analysisOverview = await feedbackAnalyzer.getAnalysisOverview();
  console.log("Analysis Batches Processed:", analysisOverview[0].toString());
  console.log("Last Analysis Time:", new Date(Number(analysisOverview[1]) * 1000).toLocaleString());
  console.log("Report Ready:", analysisOverview[2]);

  console.log("\n🎯 Demo Functions:");
  console.log("==================");

  // Demo 1: Submit encrypted feedback
  console.log("\n1. Submitting sample encrypted feedback...");
  try {
    const satisfaction = 4; // 1-5 rating
    const category = 2;     // 1-10 category
    const sentiment = 7;    // 1-10 sentiment

    console.log(`   Satisfaction: ${satisfaction}/5`);
    console.log(`   Category: ${category}/10`);
    console.log(`   Sentiment: ${sentiment}/10`);

    const tx = await privacyFeedback.submitFeedback(satisfaction, category, sentiment);
    console.log("   Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("   ✅ Feedback submitted successfully!");
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Find the FeedbackSubmitted event
    const feedbackEvent = receipt.logs.find(log => {
      try {
        const parsedLog = privacyFeedback.interface.parseLog(log);
        return parsedLog.name === 'FeedbackSubmitted';
      } catch (e) {
        return false;
      }
    });

    if (feedbackEvent) {
      const parsedEvent = privacyFeedback.interface.parseLog(feedbackEvent);
      console.log("   Feedback ID:", parsedEvent.args.feedbackId.toString());
    }

  } catch (error) {
    console.log("   ❌ Failed to submit feedback:", error.message);
  }

  // Demo 2: Check category participation (privacy-preserving)
  console.log("\n2. Checking category participation...");
  try {
    for (let cat = 1; cat <= 5; cat++) {
      const hasParticipation = await privacyFeedback.getCategoryParticipation(cat);
      console.log(`   Category ${cat}: ${hasParticipation ? '✅ Has submissions' : '❌ No submissions'}`);
    }
  } catch (error) {
    console.log("   ❌ Failed to check categories:", error.message);
  }

  // Demo 3: Process analysis batch (owner only)
  console.log("\n3. Processing confidential analysis...");
  try {
    const currentOwner = await privacyFeedback.owner();
    if (signer.address.toLowerCase() === currentOwner.toLowerCase()) {

      // Sample batch data for analysis
      const categories = [1, 2, 3, 4, 5, 1, 2, 3];
      const satisfactions = [4, 5, 3, 4, 5, 3, 4, 5];
      const sentiments = [7, 8, 6, 7, 9, 6, 7, 8];

      console.log("   Processing batch with", categories.length, "feedback items...");

      const tx = await feedbackAnalyzer.processFeedbackBatch(categories, satisfactions, sentiments);
      const receipt = await tx.wait();

      console.log("   ✅ Analysis batch processed!");
      console.log("   Gas used:", receipt.gasUsed.toString());

    } else {
      console.log("   ⚠️  Analysis requires owner privileges");
    }
  } catch (error) {
    console.log("   ❌ Failed to process analysis:", error.message);
  }

  // Demo 4: Check category status
  console.log("\n4. Checking category analysis status...");
  try {
    for (let cat = 1; cat <= 3; cat++) {
      const status = await feedbackAnalyzer.getCategoryStatus(cat);
      console.log(`   Category ${cat}: Data=${status[0]}, Threshold Met=${status[1]}`);
    }
  } catch (error) {
    console.log("   ❌ Failed to check status:", error.message);
  }

  console.log("\n🔐 Privacy Protection Features:");
  console.log("===============================");
  console.log("✅ All feedback data encrypted with FHE");
  console.log("✅ Minimum 5 submissions required for analysis");
  console.log("✅ Confidential aggregation and trend analysis");
  console.log("✅ Privacy-preserving category insights");
  console.log("✅ Encrypted satisfaction and sentiment scoring");

  console.log("\n📋 Available Owner Functions:");
  console.log("=============================");
  console.log("- performConfidentialAnalysis()");
  console.log("- requestAnalysisDecryption()");
  console.log("- generateConfidentialReport()");
  console.log("- requestInsightDecryption(category)");
  console.log("- resetAnalysis()");

  console.log("\n🎉 Interaction complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction failed:", error);
    process.exit(1);
  });