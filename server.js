// ============================================
// CreatorProof - Backend Server
// ============================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const ethers = require("ethers");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());

app.use(
    express.json({
        limit: "50mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "50mb"
    })
);

// Serve project files
app.use(express.static(__dirname));

// Serve frontend files
app.use(
    express.static(
        path.join(__dirname, "frontend")
    )
);

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SEPOLIA_RPC_URL =
    process.env.SEPOLIA_RPC_URL ||
    process.env.SEPOLIA_RPC;

const PRIVATE_KEY =
    process.env.PRIVATE_KEY ||
    process.env.SEPOLIA_PRIVATE_KEY;

const CONTRACT_ADDRESS =
    process.env.CONTRACT_ADDRESS ||
    process.env.SEPOLIA_CONTRACT_ADDRESS;

// ============================================
// SUPABASE
// ============================================

let supabase = null;

if (
    SUPABASE_URL &&
    SUPABASE_KEY
) {

    try {

        supabase =
            createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

        console.log(
            "Supabase: configured"
        );

    } catch (error) {

        console.log(
            "WARNING: Supabase initialization failed."
        );

        console.log(
            error.message
        );
    }

} else {

    console.log(
        "WARNING: Supabase is not configured."
    );
}

// ============================================
// SMART CONTRACT ABI
// ============================================

let contractABI = null;

const artifactPath =
    path.join(
        __dirname,
        "artifacts",
        "contracts",
        "CreatorProofRegistry.sol",
        "CreatorProofRegistry.json"
    );

try {

    if (
        fs.existsSync(
            artifactPath
        )
    ) {

        const artifact =
            JSON.parse(
                fs.readFileSync(
                    artifactPath,
                    "utf8"
                )
            );

        contractABI =
            artifact.abi;

        console.log(
            "Smart contract ABI: loaded."
        );

    } else {

        console.log(
            "WARNING: Contract ABI not found."
        );

        console.log(
            "Expected:"
        );

        console.log(
            artifactPath
        );
    }

} catch (error) {

    console.log(
        "ERROR loading contract ABI:"
    );

    console.log(
        error.message
    );
}

// ============================================
// SEPOLIA BLOCKCHAIN
// ============================================

let provider = null;
let wallet = null;
let contract = null;

// Detect ethers version
const ethersV6 =
    !!(
        ethers &&
        typeof ethers.JsonRpcProvider ===
        "function"
    );

const ethersV5 =
    !!(
        ethers &&
        ethers.providers &&
        typeof ethers.providers.JsonRpcProvider ===
        "function"
    );

if (
    SEPOLIA_RPC_URL &&
    PRIVATE_KEY &&
    CONTRACT_ADDRESS &&
    contractABI
) {

    try {

        // ========================================
        // CREATE PROVIDER
        // ========================================

        if (ethersV6) {

            provider =
                new ethers.JsonRpcProvider(
                    SEPOLIA_RPC_URL
                );

        } else if (ethersV5) {

            provider =
                new ethers.providers.JsonRpcProvider(
                    SEPOLIA_RPC_URL
                );

        } else {

            throw new Error(
                "Compatible ethers JsonRpcProvider was not found."
            );
        }

        // ========================================
        // CREATE WALLET
        // ========================================

        wallet =
            new ethers.Wallet(
                PRIVATE_KEY,
                provider
            );

        // ========================================
        // CREATE CONTRACT
        // ========================================

        contract =
            new ethers.Contract(
                CONTRACT_ADDRESS,
                contractABI,
                wallet
            );

        console.log(
            "Sepolia: configured"
        );

        console.log(
            "Wallet:",
            wallet.address
        );

        console.log(
            "Contract:",
            CONTRACT_ADDRESS
        );

    } catch (error) {

        console.log(
            "ERROR: Sepolia initialization failed."
        );

        console.log(
            error.message
        );
    }

} else {

    console.log(
        "WARNING: Sepolia is not configured."
    );

    if (!SEPOLIA_RPC_URL) {

        console.log(
            "Missing: SEPOLIA_RPC_URL"
        );
    }

    if (!PRIVATE_KEY) {

        console.log(
            "Missing: PRIVATE_KEY"
        );
    }

    if (!CONTRACT_ADDRESS) {

        console.log(
            "Missing: CONTRACT_ADDRESS"
        );
    }

    if (!contractABI) {

        console.log(
            "Missing: Contract ABI"
        );
    }
}

// ============================================
// HOME PAGE
// ============================================

app.get(
    "/",
    (req, res) => {

        const indexPath =
            path.join(
                __dirname,
                "frontend",
                "index.html"
            );

        if (
            fs.existsSync(
                indexPath
            )
        ) {

            res.sendFile(
                indexPath
            );

        } else {

            res.send(`
                <h1>CreatorProof</h1>
                <p>Backend server is running.</p>
                <p>Frontend index.html was not found.</p>
            `);
        }
    }
);

// ============================================
// API TEST
// ============================================

app.get(
    "/api/test",
    async (req, res) => {

        res.json({

            success: true,

            message:
                "CreatorProof is connected to the backend.",

            data: []
        });
    }
);

// ============================================
// BLOCKCHAIN TEST
// ============================================

app.get(
    "/api/blockchain/test",
    async (req, res) => {

        if (
            !provider ||
            !wallet ||
            !contract
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Sepolia blockchain is not configured.",

                details:
                    "Check SEPOLIA_RPC_URL, PRIVATE_KEY and CONTRACT_ADDRESS in .env"
            });
        }

        try {

            const network =
                await provider.getNetwork();

            const balance =
                await provider.getBalance(
                    wallet.address
                );

            let balanceFormatted;

            if (
                ethersV6 &&
                typeof ethers.formatEther ===
                "function"
            ) {

                balanceFormatted =
                    ethers.formatEther(
                        balance
                    );

            } else {

                balanceFormatted =
                    ethers.utils.formatEther(
                        balance
                    );
            }

            res.json({

                success: true,

                message:
                    "Connected to Sepolia successfully.",

                network:
                    network.name,

                chainId:
                    network.chainId.toString(),

                wallet:
                    wallet.address,

                balance:
                    balanceFormatted,

                contract:
                    CONTRACT_ADDRESS
            });

        } catch (error) {

            console.error(
                "Blockchain test error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to connect to Sepolia.",

                error:
                    error.message
            });
        }
    }
);

// ============================================
// GET ALL CONTENT
// ============================================

app.get(
    "/api/content",
    async (req, res) => {

        if (!supabase) {

            return res.status(500).json({

                success: false,

                message:
                    "Supabase is not configured."
            });
        }

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("content")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );

            if (error) {

                throw error;
            }

            res.json({

                success: true,

                count:
                    data
                        ? data.length
                        : 0,

                data:
                    data || []
            });

        } catch (error) {

            console.error(
                "Supabase content error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve content.",

                error:
                    error.message
            });
        }
    }
);

// ============================================
// REGISTER CONTENT
// ============================================

app.post(
    "/api/content/register",
    async (req, res) => {

        console.log("");

        console.log(
            "================================"
        );

        console.log(
            "CONTENT REGISTRATION REQUEST"
        );

        console.log(
            "================================"
        );

        console.log(
            "Request body:",
            req.body
        );

        const {
            title,
            content,
            contentId,
            creatorId,
            fileName,
            contentType,
            sha256Hash,
            filePath
        } = req.body;

        // ----------------------------------------
        // Validate title
        // ----------------------------------------

        if (!title) {

            return res.status(400).json({

                success: false,

                message:
                    "Title is required."
            });
        }

        // ----------------------------------------
        // Validate content ID
        // ----------------------------------------

        if (!contentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Content ID is required."
            });
        }

        // ----------------------------------------
        // Validate SHA-256
        // ----------------------------------------

        if (!sha256Hash) {

            return res.status(400).json({

                success: false,

                message:
                    "SHA-256 hash is required."
            });
        }

        // ----------------------------------------
        // Check blockchain
        // ----------------------------------------

        if (
            !contract ||
            !wallet
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Sepolia blockchain is not configured.",

                details:
                    "Check SEPOLIA_RPC_URL, PRIVATE_KEY and CONTRACT_ADDRESS in .env"
            });
        }

        try {

            console.log("");

            console.log(
                "Registering on Sepolia..."
            );

            console.log(
                "Content ID:",
                contentId
            );

            console.log(
                "Title:",
                title
            );

            console.log(
                "SHA-256:",
                sha256Hash
            );

            console.log(
                "Wallet:",
                wallet.address
            );

            console.log(
                "Contract:",
                CONTRACT_ADDRESS
            );

            // ----------------------------------------
            // Check if already registered
            // ----------------------------------------

            try {

                const existing =
                    await contract.getContent(
                        contentId
                    );

                if (
                    existing &&
                    existing[5] === true
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "This content ID is already registered on the blockchain.",

                        contentId:
                            contentId
                    });
                }

            } catch (checkError) {

                console.log(
                    "Could not check existing blockchain record:",
                    checkError.message
                );
            }

            // ----------------------------------------
            // Register on blockchain
            // ----------------------------------------

            console.log(
                "Sending transaction to Sepolia..."
            );

            console.log(
                "Preparing blockchain transaction..."
            );

            console.log(
                "Content ID:",
                contentId
            );

            console.log(
                "Title:",
                title
            );

            console.log(
                "SHA-256:",
                sha256Hash
            );

            console.log(
                "Wallet:",
                wallet.address
            );

            console.log(
                "Contract:",
                CONTRACT_ADDRESS
            );

            // ----------------------------------------
            // Estimate gas
            // ----------------------------------------

            console.log(
                "Estimating gas..."
            );

            let gasEstimate;

            try {

                // Ethers v6
                if (
                    contract.registerContent &&
                    contract.registerContent.estimateGas
                ) {

                    gasEstimate =
                        await contract
                            .registerContent
                            .estimateGas(
                                contentId,
                                title,
                                sha256Hash
                            );

                }

                // Ethers v5
                else if (
                    contract.estimateGas &&
                    contract.estimateGas.registerContent
                ) {

                    gasEstimate =
                        await contract
                            .estimateGas
                            .registerContent(
                                contentId,
                                title,
                                sha256Hash
                            );

                }

                else {

                    throw new Error(
                        "Could not find registerContent gas estimation method."
                    );
                }

                console.log(
                    "Gas estimate:",
                    gasEstimate.toString()
                );

            } catch (gasError) {

                console.error(
                    "GAS ESTIMATION FAILED:"
                );

                console.error(
                    gasError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Blockchain gas estimation failed.",

                    error:
                        gasError.reason ||
                        gasError.shortMessage ||
                        gasError.message
                });
            }

            // ----------------------------------------
            // Calculate gas limit
            // ----------------------------------------

            /*
             * Convert to string first.
             *
             * This works with both:
             * - ethers v5 BigNumber
             * - ethers v6 bigint
             *
             * It prevents:
             * "Cannot mix BigInt and other types"
             */

            const gasEstimateValue =
                BigInt(
                    gasEstimate.toString()
                );

            const gasLimitValue =
                (
                    gasEstimateValue * 120n
                ) / 100n;

            /*
             * Send gasLimit as a decimal string.
             *
             * This is accepted by both ethers v5
             * and ethers v6 as a BigNumberish.
             */

            const gasLimit =
                gasLimitValue.toString();

            console.log(
                "Gas limit:",
                gasLimit
            );

            // ----------------------------------------
            // Send transaction
            // ----------------------------------------

            console.log(
                "Sending blockchain transaction..."
            );

            let transaction;

            try {

                transaction =
                    await contract.registerContent(
                        contentId,
                        title,
                        sha256Hash,
                        {
                            gasLimit:
                                gasLimit
                        }
                    );

                console.log(
                    "Transaction sent:",
                    transaction.hash
                );

            } catch (txError) {

                console.error(
                    "TRANSACTION FAILED:"
                );

                console.error(
                    txError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Blockchain transaction failed.",

                    error:
                        txError.reason ||
                        txError.shortMessage ||
                        txError.message
                });
            }

            // ----------------------------------------
            // Wait for confirmation
            // ----------------------------------------

            console.log(
                "Waiting for blockchain confirmation..."
            );

            let receipt;

            try {

                receipt =
                    await transaction.wait();

                console.log(
                    "Blockchain transaction confirmed."
                );

                console.log(
                    "Block number:",
                    receipt.blockNumber
                );

            } catch (confirmError) {

                console.error(
                    "CONFIRMATION FAILED:"
                );

                console.error(
                    confirmError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Transaction confirmation failed.",

                    transactionHash:
                        transaction.hash,

                    error:
                        confirmError.message
                });
            }

            // ----------------------------------------
            // Save to Supabase
            // ----------------------------------------

            let databaseRecord = null;

            if (supabase) {

           const record = {

    title:
        title,

    content_id:
        contentId,

    creator_id:
        creatorId ||
        "Creator Demo",

    file_name:
        fileName ||
        null,

    content_type:
        contentType ||
        "Document",

    sha256_hash:
        sha256Hash,

    blockchain_tx_hash:
        transaction.hash,

    blockchain_network:
        "Sepolia",

    creator_wallet:
        wallet.address,

    blockchain_status:
        "Confirmed",

    status:
        "Registered",

    file_path:
        filePath ||
        null
};

                console.log(
                    "Saving registration to Supabase..."
                );

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("content")
                        .insert([
                            record
                        ])
                        .select()
                        .single();

                if (error) {

                    console.log(
                        "WARNING: Blockchain registration succeeded, but Supabase save failed."
                    );

                    console.log(
                        error.message
                    );

                } else {

                    databaseRecord =
                        data;

                    console.log(
                        "Saved to Supabase successfully."
                    );
                }
            }

            // ----------------------------------------
            // Success response
            // ----------------------------------------

            res.json({

                success: true,

                message:
                    "Content registered successfully on Sepolia.",

                data: {

                    contentId:
                        contentId,

                    title:
                        title,

                    sha256Hash:
                        sha256Hash,

                    wallet:
                        wallet.address,

                    network:
                        "Sepolia",

                    contract:
                        CONTRACT_ADDRESS,

                    transactionHash:
                        transaction.hash,

                    blockNumber:
                        receipt.blockNumber,

                    database:
                        databaseRecord
                }
            });

        } catch (error) {

            console.error("");

            console.error(
                "BLOCKCHAIN REGISTRATION ERROR:"
            );

            console.error(
                error
            );

            let message =
                "Failed to register content.";

            if (error.reason) {

                message =
                    error.reason;
            }

            if (error.shortMessage) {

                message =
                    error.shortMessage;
            }

            res.status(500).json({

                success: false,

                message:
                    message,

                error:
                    error.message,

                details: {

                    contentId:
                        contentId,

                    network:
                        "Sepolia",

                    contract:
                        CONTRACT_ADDRESS
                }
            });
        }
    }
);

// ============================================
// VERIFY CONTENT
// ============================================

app.post(
    "/api/content/verify",
    async (req, res) => {

        const {
            contentId,
            sha256Hash
        } = req.body;

        if (
            !contentId ||
            !sha256Hash
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "contentId and sha256Hash are required."
            });
        }

        if (!contract) {

            return res.status(500).json({

                success: false,

                message:
                    "Sepolia blockchain is not configured."
            });
        }

        try {

            const result =
                await contract.verifyContent(
                    contentId,
                    sha256Hash
                );

            res.json({

                success: true,

                verified:
                    result,

                contentId:
                    contentId,

                sha256Hash:
                    sha256Hash,

                network:
                    "Sepolia",

                contract:
                    CONTRACT_ADDRESS
            });

        } catch (error) {

            console.error(
                "Verification error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to verify content.",

                error:
                    error.message
            });
        }
    }
);

// ============================================
// GET CONTENT FROM BLOCKCHAIN
// ============================================

app.get(
    "/api/blockchain/content/:contentId",
    async (req, res) => {

        if (!contract) {

            return res.status(500).json({

                success: false,

                message:
                    "Sepolia blockchain is not configured."
            });
        }

        try {

            const content =
                await contract.getContent(
                    req.params.contentId
                );

            res.json({

                success: true,

                data: {

                    contentId:
                        content[0],

                    title:
                        content[1],

                    sha256Hash:
                        content[2],

                    creator:
                        content[3],

                    registeredAt:
                        content[4].toString(),

                    exists:
                        content[5]
                }
            });

        } catch (error) {

            console.error(
                "Blockchain content lookup error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve blockchain content.",

                error:
                    error.message
            });
        }
    }
);

// ============================================
// 404 HANDLER
// ============================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API endpoint not found.",

            path:
                req.originalUrl
        });
    }
);

// ============================================
// ERROR HANDLER
// ============================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Server error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Internal server error.",

            error:
                error.message
        });
    }
);

// ============================================
// START SERVER
// ============================================

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "=================================="
        );

        console.log(
            "       CreatorProof Server"
        );

        console.log(
            "=================================="
        );

        console.log("");

        console.log(
            `Server running at: http://localhost:${PORT}`
        );

        console.log("");

        console.log(
            "Supabase:",
            supabase
                ? "configured"
                : "NOT configured"
        );

        console.log(
            "Sepolia RPC:",
            SEPOLIA_RPC_URL
                ? "configured"
                : "NOT configured"
        );

        console.log(
            "Private Key:",
            PRIVATE_KEY
                ? "configured"
                : "NOT configured"
        );

        console.log(
            "Contract:",
            CONTRACT_ADDRESS
                ? CONTRACT_ADDRESS
                : "NOT configured"
        );

        console.log("");

        console.log(
            `API Test: http://localhost:${PORT}/api/test`
        );

        console.log(
            `Blockchain Test: http://localhost:${PORT}/api/blockchain/test`
        );

        console.log(
            `Content API: http://localhost:${PORT}/api/content`
        );

        console.log(
            `Register API: http://localhost:${PORT}/api/content/register`
        );

        console.log("");
    }
);