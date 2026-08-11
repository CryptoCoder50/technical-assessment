const hre = require("hardhat");

async function main() {
  console.log(" Testing Certificate Verification...");

  const [deployer, issuer, student] = await hre.ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Issuer:", issuer.address);
  console.log("Student:", student.address);

  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  const certificate = await CertificateVerification.deploy();
  await certificate.waitForDeployment();
  const contractAddress = await certificate.getAddress();

  console.log("\n Contract deployed to:", contractAddress);

  // Add issuer role
  console.log("\n Adding issuer role...");
  await certificate.addIssuer(issuer.address);
  console.log(" Issuer role added");

  // Issue a certificate
  console.log("\n Issuing a certificate...");
  const studentName = "John Doe";
  const studentId = "STU2024001";
  const courseName = "Full Stack Web Development";
  const ipfsHash = "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX";
  const expiryDuration = 365 * 24 * 60 * 60;
  const grade = "A";
  const credits = 40;

  const tx = await certificate.connect(issuer).issueCertificate(
    studentName,
    studentId,
    courseName,
    ipfsHash,
    expiryDuration,
    grade,
    credits
  );
  
  const receipt = await tx.wait();
  const event = receipt.logs.find(log => log.fragment && log.fragment.name === "CertificateIssued");
  const certificateId = event.args.certificateId.toString();

  console.log(" Certificate issued with ID:", certificateId);

  // Verify the certificate
  console.log("\n Verifying certificate...");
  const [isValid, summary] = await certificate.verifyCertificate(certificateId);
  
  console.log("Certificate ID:", summary.id.toString());
  console.log("Student Name:", summary.studentName);
  console.log("Course:", summary.courseName);
  console.log("Grade:", summary.grade);
  console.log("Is Valid:", isValid);
  console.log("Issuer:", summary.issuer);
  console.log("Issued Date:", new Date(Number(summary.issuedDate) * 1000).toLocaleString());

  console.log("\n All tests passed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});