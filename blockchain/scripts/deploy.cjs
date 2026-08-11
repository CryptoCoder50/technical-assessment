const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(" Deploying CertificateVerification contract...");

  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  const certificate = await CertificateVerification.deploy();

  await certificate.waitForDeployment();
  const address = await certificate.getAddress();

  console.log(" CertificateVerification deployed to:", address);

  // Save the contract address to a file for the frontend
  const configPath = path.join(__dirname, "../../frontend/src/domains/certificates/config/contract.json");
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(
    configPath,
    JSON.stringify({
      address: address,
      network: "localhost",
      chainId: 1337,
    }, null, 2)
  );

  console.log(" Contract address saved to:", configPath);

  // Get the ABI and save it
  const artifact = await hre.artifacts.readArtifact("CertificateVerification");
  const abiPath = path.join(__dirname, "../../frontend/src/domains/certificates/config/abi.json");
  
  fs.writeFileSync(
    abiPath,
    JSON.stringify(artifact.abi, null, 2)
  );

  console.log(" ABI saved to:", abiPath);

  console.log("\n Deployment complete!");
  console.log(" Contract Address:", address);
  console.log("\nNext steps:");
  console.log("1. Update frontend .env with contract address");
  console.log("2. Run frontend: npm run dev");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});