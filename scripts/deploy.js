const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Privacy Customer Feedback System...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy PrivacyFeedback contract first
  console.log("\n1. Deploying PrivacyFeedback contract...");
  const PrivacyFeedback = await ethers.getContractFactory("PrivacyFeedback");
  const privacyFeedback = await PrivacyFeedback.deploy();
  await privacyFeedback.waitForDeployment();

  const privacyFeedbackAddress = await privacyFeedback.getAddress();
  console.log("PrivacyFeedback deployed to:", privacyFeedbackAddress);

  // Deploy FeedbackAnalyzer contract with PrivacyFeedback address
  console.log("\n2. Deploying FeedbackAnalyzer contract...");
  const FeedbackAnalyzer = await ethers.getContractFactory("FeedbackAnalyzer");
  const feedbackAnalyzer = await FeedbackAnalyzer.deploy(privacyFeedbackAddress);
  await feedbackAnalyzer.waitForDeployment();

  const feedbackAnalyzerAddress = await feedbackAnalyzer.getAddress();
  console.log("FeedbackAnalyzer deployed to:", feedbackAnalyzerAddress);

  // Verify initial setup
  console.log("\n3. Verifying deployment...");

  // Check PrivacyFeedback contract
  const owner = await privacyFeedback.owner();
  const feedbackCounter = await privacyFeedback.feedbackCounter();
  console.log("PrivacyFeedback owner:", owner);
  console.log("Initial feedback counter:", feedbackCounter.toString());

  // Check FeedbackAnalyzer contract
  const analyzerOwner = await feedbackAnalyzer.owner();
  const linkedFeedbackContract = await feedbackAnalyzer.feedbackContract();
  console.log("FeedbackAnalyzer owner:", analyzerOwner);
  console.log("Linked feedback contract:", linkedFeedbackContract);

  // Get public stats
  const publicStats = await privacyFeedback.getPublicStats();
  console.log("Public stats - Total feedbacks:", publicStats[0].toString());
  console.log("Public stats - Analysis available:", publicStats[1]);

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses Summary:");
  console.log("================================");
  console.log("PrivacyFeedback:   ", privacyFeedbackAddress);
  console.log("FeedbackAnalyzer:  ", feedbackAnalyzerAddress);
  console.log("================================");

  console.log("\n📝 Next Steps:");
  console.log("1. Update your .env file with the deployed contract addresses");
  console.log("2. Verify contracts on Etherscan using: npx hardhat verify --network sepolia <address>");
  console.log("3. Test the privacy feedback submission functionality");
  console.log("4. Ensure FHE encryption is working properly");

  console.log("\n🔒 Privacy Features Enabled:");
  console.log("- Encrypted feedback submission (satisfaction, category, sentiment)");
  console.log("- Confidential analysis processing");
  console.log("- Privacy-preserving aggregation");
  console.log("- Minimum threshold protection (5+ submissions)");
  console.log("- Encrypted trend analysis");

  return {
    privacyFeedback: privacyFeedbackAddress,
    feedbackAnalyzer: feedbackAnalyzerAddress
  };
}

main()
  .then((addresses) => {
    console.log("\n🎉 Privacy Feedback System deployed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });