const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Simple Privacy Feedback System...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy SimpleFeedback contract
  console.log("\n1. Deploying SimpleFeedback contract...");
  const SimpleFeedback = await ethers.getContractFactory("SimpleFeedback");

  // Estimate gas for deployment
  const deployTx = await SimpleFeedback.getDeployTransaction();
  const estimatedGas = await ethers.provider.estimateGas(deployTx);
  console.log("Estimated deployment gas:", estimatedGas.toString());

  const simpleFeedback = await SimpleFeedback.deploy({
    gasLimit: estimatedGas * 120n / 100n // Add 20% buffer
  });

  await simpleFeedback.waitForDeployment();

  const simpleFeedbackAddress = await simpleFeedback.getAddress();
  console.log("SimpleFeedback deployed to:", simpleFeedbackAddress);

  // Verify initial setup
  console.log("\n2. Verifying deployment...");

  // Check SimpleFeedback contract
  const owner = await simpleFeedback.owner();
  const feedbackCounter = await simpleFeedback.feedbackCounter();
  console.log("SimpleFeedback owner:", owner);
  console.log("Initial feedback counter:", feedbackCounter.toString());

  // Get public stats
  const publicStats = await simpleFeedback.getPublicStats();
  console.log("Public stats - Total feedbacks:", publicStats[0].toString());
  console.log("Public stats - Revealed feedbacks:", publicStats[1].toString());
  console.log("Public stats - Analysis available:", publicStats[2]);

  // Test commitment creation (example)
  console.log("\n3. Testing commitment creation...");
  const sampleCommitment = await simpleFeedback.createCommitment(5, 3, 8, 123456);
  console.log("Sample commitment created successfully");
  console.log("Commitment hash:", sampleCommitment.commitHash);

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Address:");
  console.log("================================");
  console.log("SimpleFeedback:    ", simpleFeedbackAddress);
  console.log("================================");

  console.log("\n📝 Gas Optimization Features:");
  console.log("- Optimized compiler settings (1000 runs, viaIR)");
  console.log("- Reduced gas price (10 gwei)");
  console.log("- Batch operations for multiple reveals");
  console.log("- Efficient storage patterns");
  console.log("- Minimal external calls");

  console.log("\n🔒 Privacy Features:");
  console.log("- Commitment-reveal scheme for data privacy");
  console.log("- Hash-based encryption of sensitive data");
  console.log("- Minimum threshold protection (5+ submissions)");
  console.log("- User-controlled data revelation");
  console.log("- Anonymous submission with reveal flexibility");

  console.log("\n📖 Usage Instructions:");
  console.log("1. Users submit feedback using commitments (hashed data)");
  console.log("2. Users can reveal their data when ready for analysis");
  console.log("3. Analysis requires minimum 5 revealed submissions");
  console.log("4. Batch reveals available for gas efficiency");

  return {
    simpleFeedback: simpleFeedbackAddress
  };
}

main()
  .then((addresses) => {
    console.log("\n🎉 Simple Privacy Feedback System deployed successfully!");
    console.log("Ready for Sepolia testnet deployment!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });