const hre = require("hardhat");

async function main() {
    console.log("Deploying CreatorProofRegistry...");

    const CreatorProofRegistry =
        await hre.ethers.getContractFactory("CreatorProofRegistry");

    const contract =
        await CreatorProofRegistry.deploy();

    await contract.deployed();

    console.log("");
    console.log("======================================");
    console.log("CreatorProof Contract Deployed!");
    console.log("======================================");
    console.log("");
    console.log("Contract Address:");
    console.log(contract.address);
    console.log("");
    console.log("Network: Sepolia");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });