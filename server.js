// ============================================================
// CreatorProof - Complete Real Application Backend
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const ethers = require("ethers");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

const AUTH_SECRET =
    process.env.AUTH_SECRET ||
    "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET";

// ============================================================
// DIRECTORIES
// ============================================================

const frontendPath =
    path.join(__dirname, "frontend");

const jsPath =
    path.join(__dirname, "js");

const cssPath =
    path.join(__dirname, "css");

const uploadsPath =
    path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, {
        recursive: true
    });
}

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

app.use(cookieParser());

// ============================================================
// STATIC FILES
// ============================================================

app.use(
    "/uploads",
    express.static(uploadsPath)
);

app.use(
    "/js",
    express.static(jsPath)
);

app.use(
    "/css",
    express.static(cssPath)
);

app.use(
    express.static(__dirname)
);

app.use(
    express.static(frontendPath)
);

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
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

// ============================================================
// SUPABASE
// ============================================================

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

        console.error(
            "Supabase initialization failed:",
            error.message
        );

    }

} else {

    console.log(
        "WARNING: Supabase is NOT configured."
    );

}

// ============================================================
// SMART CONTRACT ABI
// ============================================================

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
            "WARNING: Smart contract ABI not found."
        );

    }

} catch (error) {

    console.error(
        "Error loading contract ABI:",
        error.message
    );

}

// ============================================================
// BLOCKCHAIN
// ============================================================

let provider = null;
let wallet = null;
let contract = null;

if (
    SEPOLIA_RPC_URL &&
    PRIVATE_KEY &&
    CONTRACT_ADDRESS &&
    contractABI
) {

    try {

        provider =
            new ethers.JsonRpcProvider(
                SEPOLIA_RPC_URL
            );

        wallet =
            new ethers.Wallet(
                PRIVATE_KEY,
                provider
            );

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
            "Blockchain wallet:",
            wallet.address
        );

        console.log(
            "Contract:",
            CONTRACT_ADDRESS
        );

    } catch (error) {

        console.error(
            "Sepolia initialization failed:",
            error.message
        );

    }

} else {

    console.log(
        "WARNING: Sepolia is NOT fully configured."
    );

    if (!SEPOLIA_RPC_URL)
        console.log("Missing SEPOLIA_RPC_URL");

    if (!PRIVATE_KEY)
        console.log("Missing PRIVATE_KEY");

    if (!CONTRACT_ADDRESS)
        console.log("Missing CONTRACT_ADDRESS");

    if (!contractABI)
        console.log("Missing contract ABI");

}

// ============================================================
// MULTER FILE UPLOAD
// ============================================================

const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    uploadsPath
                );

            },

        filename:
            function (
                req,
                file,
                cb
            ) {

                const extension =
                    path.extname(
                        file.originalname
                    );

                const baseName =
                    path.basename(
                        file.originalname,
                        extension
                    )
                    .replace(
                        /[^a-zA-Z0-9_-]/g,
                        "_"
                    );

                const unique =
                    Date.now() +
                    "-" +
                    crypto
                        .randomBytes(6)
                        .toString("hex");

                cb(
                    null,
                    unique +
                    "-" +
                    baseName +
                    extension
                );

            }

    });

const upload =
    multer({

        storage,

        limits: {

            fileSize:
                100 *
                1024 *
                1024

        }

    });

// ============================================================
// AUTH HELPERS
// ============================================================

function createToken(user) {

    return jwt.sign(
        {
            id:
                user.id,

            email:
                user.email,

            role:
                user.role ||
                "Creator"
        },

        AUTH_SECRET,

        {
            expiresIn:
                "7d"
        }
    );

}

function setAuthCookie(
    res,
    token
) {

    res.cookie(
        "creatorproof_token",
        token,
        {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge:
                7 *
                24 *
                60 *
                60 *
                1000
        }
    );

}

function getToken(req) {

    return (
        req.cookies &&
        req.cookies.creatorproof_token
    );

}

function requireAuth(
    req,
    res,
    next
) {

    const token =
        getToken(req);

    if (!token) {

        return res.status(401).json({

            success: false,

            message:
                "You must sign in first."

        });

    }

    try {

        const decoded =
            jwt.verify(
                token,
                AUTH_SECRET
            );

        req.user =
            decoded;

        next();

    } catch (error) {

        return res.status(401).json({

            success: false,

            message:
                "Your session has expired. Please sign in again."

        });

    }

}

// ============================================================
// HOME
// ============================================================

app.get(
    "/",
    function (
        req,
        res
    ) {

        const indexPath =
            path.join(
                frontendPath,
                "index.html"
            );

        if (
            fs.existsSync(
                indexPath
            )
        ) {

            return res.sendFile(
                indexPath
            );

        }

        res.send(
            "<h1>CreatorProof</h1><p>Server is running.</p>"
        );

    }
);

// ============================================================
// AUTH - SIGN UP
// ============================================================

app.post(
    "/api/auth/signup",
    async function (
        req,
        res
    ) {

        if (!supabase) {

            return res.status(500).json({

                success: false,

                message:
                    "Supabase is not configured."

            });

        }

        try {

            const {
                name,
                email,
                password,
                role
            } =
                req.body;

            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Name, email and password are required."

                });

            }

            if (
                password.length < 6
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must contain at least 6 characters."

                });

            }

            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();

            const {
                data: existing,
                error: existingError
            } =
                await supabase
                    .from("users")
                    .select("id")
                    .eq(
                        "email",
                        cleanEmail
                    )
                    .maybeSingle();

            if (existingError) {

                throw existingError;

            }

            if (existing) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this email already exists."

                });

            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const newUser = {

                name:
                    name.trim(),

                email:
                    cleanEmail,

                password_hash:
                    passwordHash,

                role:
                    role ||
                    "Creator"

            };

            const {
                data: user,
                error
            } =
                await supabase
                    .from("users")
                    .insert([
                        newUser
                    ])
                    .select(
                        "id,name,email,role,created_at"
                    )
                    .single();

            if (error) {

                throw error;

            }

            const token =
                createToken(
                    user
                );

            setAuthCookie(
                res,
                token
            );

            res.status(201).json({

                success: true,

                message:
                    "Account created successfully.",

                user

            });

        } catch (error) {

            console.error(
                "Signup error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to create account.",

                error:
                    error.message

            });

        }

    }
);

// ============================================================
// AUTH - SIGN IN
// ============================================================

app.post(
    "/api/auth/login",
    async function (
        req,
        res
    ) {

        if (!supabase) {

            return res.status(500).json({

                success: false,

                message:
                    "Supabase is not configured."

            });

        }

        try {

            const {
                email,
                password
            } =
                req.body;

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and password are required."

                });

            }

            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();

            const {
                data: user,
                error
            } =
                await supabase
                    .from("users")
                    .select("*")
                    .eq(
                        "email",
                        cleanEmail
                    )
                    .maybeSingle();

            if (error) {

                throw error;

            }

            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "No account exists with this email."

                });

            }

            if (!user.password_hash) {

                return res.status(401).json({

                    success: false,

                    message:
                        "This account does not have a password. Please create a new account."

                });

            }

            const valid =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );

            if (!valid) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Incorrect password."

                });

            }

            const safeUser = {

                id:
                    user.id,

                name:
                    user.name,

                email:
                    user.email,

                role:
                    user.role ||
                    "Creator",

                wallet_address:
                    user.wallet_address ||
                    null,

                created_at:
                    user.created_at

            };

            const token =
                createToken(
                    safeUser
                );

            setAuthCookie(
                res,
                token
            );

            res.json({

                success: true,

                message:
                    "Signed in successfully.",

                user:
                    safeUser

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to sign in.",

                error:
                    error.message

            });

        }

    }
);

// ============================================================
// CURRENT USER
// ============================================================

app.get(
    "/api/auth/me",
    requireAuth,
    async function (
        req,
        res
    ) {

        try {

            const {
                data: user,
                error
            } =
                await supabase
                    .from("users")
                    .select(
                        "id,name,email,role,wallet_address,created_at"
                    )
                    .eq(
                        "id",
                        req.user.id
                    )
                    .single();

            if (error) {

                throw error;

            }

            res.json({

                success: true,

                user

            });

        } catch (error) {

            console.error(
                "Current user error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve user."

            });

        }

    }
);

// ============================================================
// LOGOUT
// ============================================================

app.post(
    "/api/auth/logout",
    function (
        req,
        res
    ) {

        res.clearCookie(
            "creatorproof_token",
            {
                httpOnly: true,
                secure: false,
                sameSite: "lax"
            }
        );

        res.json({

            success: true,

            message:
                "Signed out successfully."

        });

    }
);

// ============================================================
// UPDATE PROFILE
// ============================================================

app.put(
    "/api/auth/profile",
    requireAuth,
    async function (
        req,
        res
    ) {

        try {

            const {
                name,
                walletAddress
            } =
                req.body;

            const updates = {};

            if (
                name !== undefined
            ) {

                updates.name =
                    name.trim();

            }

            if (
                walletAddress !== undefined
            ) {

                updates.wallet_address =
                    walletAddress.trim();

            }

            const {
                data: user,
                error
            } =
                await supabase
                    .from("users")
                    .update(
                        updates
                    )
                    .eq(
                        "id",
                        req.user.id
                    )
                    .select(
                        "id,name,email,role,wallet_address,created_at"
                    )
                    .single();

            if (error) {

                throw error;

            }

            res.json({

                success: true,

                message:
                    "Profile updated successfully.",

                user

            });

        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to update profile.",

                error:
                    error.message

            });

        }

    }
);

// ============================================================
// API TEST
// ============================================================

app.get(
    "/api/test",
    function (
        req,
        res
    ) {

        res.json({

            success: true,

            message:
                "CreatorProof backend is working."

        });

    }
);

// ============================================================
// BLOCKCHAIN TEST
// ============================================================

app.get(
    "/api/blockchain/test",
    async function (
        req,
        res
    ) {

        if (
            !provider ||
            !wallet ||
            !contract
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Sepolia blockchain is not configured."

            });

        }

        try {

            const network =
                await provider.getNetwork();

            const balance =
                await provider.getBalance(
                    wallet.address
                );

            res.json({

                success: true,

                message:
                    "Connected to Ethereum Sepolia.",

                network:
                    network.name,

                chainId:
                    network.chainId.toString(),

                wallet:
                    wallet.address,

                balance:
                    ethers.formatEther(
                        balance
                    ),

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
                    "Unable to connect to Sepolia.",

                error:
                    error.message

            });

        }

    }
);

// ============================================================
// GET USER CONTENT
// ============================================================

app.get(
    "/api/content",
    requireAuth,
    async function (
        req,
        res
    ) {

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
                    .eq(
                        "creator_id",
                        req.user.id
                    )
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
                "Content retrieval error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve your content.",

                error:
                    error.message

            });

        }

    }
);

// ============================================================
// GET ONE CONTENT RECORD
// ============================================================

app.get(
    "/api/content/:id",
    requireAuth,
    async function (
        req,
        res
    ) {

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("content")
                    .select("*")
                    .eq(
                        "id",
                        req.params.id
                    )
                    .eq(
                        "creator_id",
                        req.user.id
                    )
                    .single();

            if (error) {

                throw error;

            }

            res.json({

                success: true,

                data

            });

        } catch (error) {

            res.status(404).json({

                success: false,

                message:
                    "Content not found."

            });

        }

    }
);

// ============================================================
// REGISTER CONTENT
// ============================================================

app.post(
    "/api/content/register",
    requireAuth,
    upload.single("contentFile"),
    async function (
        req,
        res
    ) {

        let uploadedFile = null;

        try {

            console.log("");
            console.log(
                "================================"
            );
            console.log(
                "CONTENT REGISTRATION"
            );
            console.log(
                "================================"
            );

            uploadedFile =
                req.file;

            const {
                title,
                description,
                contentType,
                licenseType,
                sha256Hash
            } =
                req.body;

            if (!title) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Content title is required."

                });

            }

            if (!uploadedFile) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please upload a file."

                });

            }

            // ------------------------------------------------
            // Calculate SHA-256 on backend
            // ------------------------------------------------

            const fileBuffer =
                fs.readFileSync(
                    uploadedFile.path
                );

            const backendHash =
                crypto
                    .createHash("sha256")
                    .update(fileBuffer)
                    .digest("hex");

            if (
                sha256Hash &&
                sha256Hash !== backendHash
            ) {

                fs.unlinkSync(
                    uploadedFile.path
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "File fingerprint verification failed."

                });

            }

            const finalHash =
                backendHash;

            const contentId =
                "CP-" +
                Date.now() +
                "-" +
                crypto
                    .randomBytes(5)
                    .toString("hex");

            // ------------------------------------------------
            // Blockchain
            // ------------------------------------------------

            if (
                !contract ||
                !wallet
            ) {

                fs.unlinkSync(
                    uploadedFile.path
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Sepolia blockchain is not configured."

                });

            }

            console.log(
                "Registering content:",
                contentId
            );

            console.log(
                "SHA-256:",
                finalHash
            );

            let existing = null;

            try {

                existing =
                    await contract.getContent(
                        contentId
                    );

            } catch (error) {

                existing =
                    null;

            }

            if (
                existing &&
                existing.exists === true
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This content ID already exists."

                });

            }

            let transaction;

            try {

                transaction =
                    await contract.registerContent(
                        contentId,
                        title,
                        finalHash
                    );

            } catch (error) {

                console.error(
                    "Blockchain transaction failed:",
                    error
                );

                return res.status(500).json({

                    success: false,

                    message:
                        error.shortMessage ||
                        error.reason ||
                        "Blockchain registration failed.",

                    error:
                        error.message

                });

            }

            console.log(
                "Transaction:",
                transaction.hash
            );

            const receipt =
                await transaction.wait();

            console.log(
                "Confirmed in block:",
                receipt.blockNumber
            );

            // ------------------------------------------------
            // Database
            // ------------------------------------------------

            const record = {

                title:
                    title.trim(),

                description:
                    description
                        ? description.trim()
                        : null,

                content_id:
                    contentId,

                creator_id:
                    req.user.id,

                file_name:
                    uploadedFile.originalname,

                content_type:
                    contentType ||
                    uploadedFile.mimetype ||
                    "Other",

                sha256_hash:
                    finalHash,

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
                    "/uploads/" +
                    uploadedFile.filename,

                license_type:
                    licenseType ||
                    "All Rights Reserved"

            };

            let databaseRecord =
                null;

            if (supabase) {

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

                    console.error(
                        "Supabase save failed:",
                        error
                    );

                    return res.status(207).json({

                        success: true,

                        message:
                            "Blockchain registration succeeded, but the database save failed.",

                        data: {

                            contentId,

                            sha256Hash:
                                finalHash,

                            transactionHash:
                                transaction.hash,

                            blockNumber:
                                receipt.blockNumber,

                            database:
                                null

                        }

                    });

                }

                databaseRecord =
                    data;

            }

            res.json({

                success: true,

                message:
                    "Content registered successfully.",

                data: {

                    contentId,

                    title,

                    description:
                        description || "",

                    sha256Hash:
                        finalHash,

                    transactionHash:
                        transaction.hash,

                    blockNumber:
                        receipt.blockNumber,

                    network:
                        "Sepolia",

                    wallet:
                        wallet.address,

                    fileName:
                        uploadedFile.originalname,

                    database:
                        databaseRecord

                }

            });

        } catch (error) {

            console.error(
                "CONTENT REGISTRATION ERROR:",
                error
            );

            if (
                uploadedFile &&
                uploadedFile.path &&
                fs.existsSync(
                    uploadedFile.path
                )
            ) {

                try {

                    fs.unlinkSync(
                        uploadedFile.path
                    );

                } catch (cleanupError) {

                    console.error(
                        cleanupError
                    );

                }

            }

            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Content registration failed."

            });

        }

    }
);

// ============================================================
// VERIFY CONTENT
// ============================================================

app.post(
    "/api/content/verify",
    async function (
        req,
        res
    ) {

        const {
            contentId,
            sha256Hash
        } =
            req.body;

        if (
            !contentId ||
            !sha256Hash
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Content ID and SHA-256 hash are required."

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

                contentId,

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
                    "Unable to verify content.",

                error:
                    error.message

            });

        }

    }
);

// ============================================================
// BLOCKCHAIN CONTENT
// ============================================================

app.get(
    "/api/blockchain/content/:contentId",
    async function (
        req,
        res
    ) {

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
                "Blockchain content error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve blockchain content.",

                error:
                    error.message

            });

        }

    }
);

// ============================================================
// DELETE CONTENT
// ============================================================

app.delete(
    "/api/content/:id",
    requireAuth,
    async function (
        req,
        res
    ) {

        try {

            const {
                data: record,
                error: findError
            } =
                await supabase
                    .from("content")
                    .select("*")
                    .eq(
                        "id",
                        req.params.id
                    )
                    .eq(
                        "creator_id",
                        req.user.id
                    )
                    .single();

            if (findError) {

                throw findError;

            }

            const {
                error
            } =
                await supabase
                    .from("content")
                    .delete()
                    .eq(
                        "id",
                        req.params.id
                    )
                    .eq(
                        "creator_id",
                        req.user.id
                    );

            if (error) {

                throw error;

            }

            if (
                record.file_path
            ) {

                const relative =
                    record.file_path
                        .replace(
                            /^\/uploads\//,
                            ""
                        );

                const fullPath =
                    path.join(
                        uploadsPath,
                        relative
                    );

                if (
                    fs.existsSync(
                        fullPath
                    )
                ) {

                    fs.unlinkSync(
                        fullPath
                    );

                }

            }

            res.json({

                success: true,

                message:
                    "Content removed from your database."

            });

        } catch (error) {

            console.error(
                "Delete content error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to delete content.",

                error:
                    error.message

            });

        }

    }
);
// ============================================================
// DISPUTES - GET ALL USER DISPUTES
// ============================================================

app.get(
    "/api/disputes",
    requireAuth,
    async function (req, res) {

        if (!supabase) {

            return res.status(500).json({
                success: false,
                message: "Supabase is not configured."
            });

        }

        try {

            const {
                data: disputes,
                error
            } = await supabase
                .from("disputes")
                .select("*")
                .eq(
                    "creator_id",
                    req.user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

            if (error) {
                throw error;
            }

            /*
             * Get the related content information.
             * This is done separately so the route does not
             * depend on a specific Supabase foreign-key setup.
             */

            const result = [];

            for (const dispute of disputes || []) {

                let content = null;

                if (dispute.content_id) {

                    const {
                        data: contentData
                    } = await supabase
                        .from("content")
                        .select(
                            "id,title,file_name,sha256_hash,blockchain_tx_hash,blockchain_network"
                        )
                        .eq(
                            "id",
                            dispute.content_id
                        )
                        .eq(
                            "creator_id",
                            req.user.id
                        )
                        .maybeSingle();

                    content = contentData || null;
                }

                result.push({

                    ...dispute,

                    content_title:
                        content?.title ||
                        content?.file_name ||
                        "Registered Content",

                    file_name:
                        content?.file_name ||
                        null,

                    sha256_hash:
                        content?.sha256_hash ||
                        dispute.sha256_hash ||
                        null,

                    blockchain_tx_hash:
                        content?.blockchain_tx_hash ||
                        dispute.blockchain_tx_hash ||
                        null,

                    blockchain_network:
                        content?.blockchain_network ||
                        "Sepolia"

                });

            }

            res.json({

                success: true,

                count:
                    result.length,

                data:
                    result

            });

        } catch (error) {

            console.error(
                "Get disputes error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to retrieve disputes.",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// DISPUTES - CREATE NEW DISPUTE
// ============================================================

app.post(
    "/api/disputes",
    requireAuth,
    async function (req, res) {

        if (!supabase) {

            return res.status(500).json({

                success: false,

                message:
                    "Supabase is not configured."

            });

        }

        try {

            const {
                content_id,
                type,
                description
            } = req.body;


            if (!content_id) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Content is required."

                });

            }


            if (!type) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Dispute type is required."

                });

            }


            if (!description || !description.trim()) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Dispute description is required."

                });

            }


            // ------------------------------------------------
            // Make sure the selected content belongs to user
            // ------------------------------------------------

            const {
                data: content,
                error: contentError
            } = await supabase
                .from("content")
                .select(
                    "id,title,file_name,sha256_hash,blockchain_tx_hash,blockchain_network"
                )
                .eq(
                    "id",
                    content_id
                )
                .eq(
                    "creator_id",
                    req.user.id
                )
                .single();


            if (contentError || !content) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Registered content not found."

                });

            }


            // ------------------------------------------------
            // Create dispute
            // ------------------------------------------------

            const disputeRecord = {

                content_id:
                    content.id,

                creator_id:
                    req.user.id,

                type:
                    type,

                description:
                    description.trim(),

                status:
                    "Pending"

            };


            const {
                data: dispute,
                error
            } = await supabase
                .from("disputes")
                .insert([
                    disputeRecord
                ])
                .select("*")
                .single();


            if (error) {

                throw error;

            }


            res.status(201).json({

                success: true,

                message:
                    "Dispute submitted successfully.",

                data: {

                    ...dispute,

                    content_title:
                        content.title ||
                        content.file_name,

                    sha256_hash:
                        content.sha256_hash,

                    blockchain_tx_hash:
                        content.blockchain_tx_hash,

                    blockchain_network:
                        content.blockchain_network ||
                        "Sepolia"

                }

            });

        } catch (error) {

            console.error(
                "Create dispute error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to create dispute.",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// DISPUTES - UPDATE STATUS
// ============================================================

app.put(
    "/api/disputes/:id/status",
    requireAuth,
    async function (req, res) {

        if (!supabase) {

            return res.status(500).json({

                success: false,

                message:
                    "Supabase is not configured."

            });

        }

        try {

            const disputeId =
                req.params.id;


            const requestedStatus =
                req.body.status;


            if (!requestedStatus) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Dispute status is required."

                });

            }


            /*
             * Normalize different spellings so the backend
             * accepts both "Under Review" and "Open".
             */

            const normalized =
                String(requestedStatus)
                    .trim()
                    .toLowerCase()
                    .replace(/_/g, " ");


            let newStatus;


            if (normalized === "pending") {

                newStatus = "Pending";

            } else if (
                normalized === "open" ||
                normalized === "under review" ||
                normalized === "in review"
            ) {

                newStatus = "Open";

            } else if (
                normalized === "resolved"
            ) {

                newStatus = "Resolved";

            } else {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid dispute status."

                });

            }


            // ------------------------------------------------
            // Find dispute belonging to logged-in user
            // ------------------------------------------------

            const {
                data: existingDispute,
                error: findError
            } = await supabase
                .from("disputes")
                .select("*")
                .eq(
                    "id",
                    disputeId
                )
                .eq(
                    "creator_id",
                    req.user.id
                )
                .single();


            if (
                findError ||
                !existingDispute
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Dispute not found."

                });

            }


            const currentStatus =
                String(
                    existingDispute.status ||
                    "Pending"
                )
                    .trim()
                    .toLowerCase()
                    .replace(/_/g, " ");


            // ------------------------------------------------
            // Only allow the intended workflow
            // ------------------------------------------------

            if (
                newStatus === "Open" &&
                currentStatus !== "pending"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Only pending disputes can be opened."

                });

            }


            if (
                newStatus === "Resolved" &&
                currentStatus !== "open" &&
                currentStatus !== "under review" &&
                currentStatus !== "in review"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Only open disputes can be resolved."

                });

            }


            // ------------------------------------------------
            // Update status
            // ------------------------------------------------

            const {
                data: updatedDispute,
                error: updateError
            } = await supabase
                .from("disputes")
                .update({

                    status:
                        newStatus

                })
                .eq(
                    "id",
                    disputeId
                )
                .eq(
                    "creator_id",
                    req.user.id
                )
                .select("*")
                .single();


            if (updateError) {

                throw updateError;

            }


            res.json({

                success: true,

                message:
                    `Dispute ${newStatus.toLowerCase()} successfully.`,

                data:
                    updatedDispute

            });

        } catch (error) {

            console.error(
                "Update dispute status error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to update dispute status.",

                error:
                    error.message

            });

        }

    }
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
    "/api/health",
    function (
        req,
        res
    ) {

        res.json({

            success: true,

            application:
                "CreatorProof",

            supabase:
                !!supabase,

            blockchain:
                !!contract,

            network:
                "Ethereum Sepolia",

            timestamp:
                new Date().toISOString()

        });

    }
);

// ============================================================
// MULTER ERROR HANDLER
// ============================================================

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        if (
            error instanceof multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "File is too large. Maximum size is 100 MB."

                });

            }

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }

        next(error);

    }
);
// ============================================================
// DISPUTE STATUS UPDATE
// ============================================================

app.put(
    "/api/disputes/:id/status",
    requireAuth,
    async function (req, res) {

        if (!supabase) {

            return res.status(500).json({

                success: false,

                message:
                    "Supabase is not configured."

            });

        }

        try {

            const disputeId =
                req.params.id;

            const requestedStatus =
                req.body.status;


            if (!requestedStatus) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Dispute status is required."

                });

            }


            const status =
                String(requestedStatus)
                    .trim()
                    .toLowerCase();


            let finalStatus;


            if (status === "open") {

                finalStatus = "Open";

            } else if (status === "resolved") {

                finalStatus = "Resolved";

            } else {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid dispute status."

                });

            }


            // ------------------------------------------------
            // Find dispute
            // ------------------------------------------------

            const {
                data: dispute,
                error: findError
            } =
                await supabase
                    .from("disputes")
                    .select("*")
                    .eq(
                        "id",
                        disputeId
                    )
                    .eq(
                        "creator_id",
                        req.user.id
                    )
                    .single();


            if (findError || !dispute) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Dispute not found."

                });

            }


            // ------------------------------------------------
            // Current status
            // ------------------------------------------------

            const currentStatus =
                String(
                    dispute.status ||
                    "Pending"
                )
                    .trim()
                    .toLowerCase();


            // ------------------------------------------------
            // Pending -> Open
            // ------------------------------------------------

            if (
                finalStatus === "Open"
            ) {

                if (
                    currentStatus !== "pending"
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Only pending disputes can be opened."

                    });

                }

            }


            // ------------------------------------------------
            // Open -> Resolved
            // ------------------------------------------------

            if (
                finalStatus === "Resolved"
            ) {

                if (
                    currentStatus !== "open" &&
                    currentStatus !== "under review" &&
                    currentStatus !== "in review"
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Only open disputes can be resolved."

                    });

                }

            }


            // ------------------------------------------------
            // Update database
            // ------------------------------------------------

            const {
                data: updatedDispute,
                error: updateError
            } =
                await supabase
                    .from("disputes")
                    .update({

                        status:
                            finalStatus

                    })
                    .eq(
                        "id",
                        disputeId
                    )
                    .eq(
                        "creator_id",
                        req.user.id
                    )
                    .select("*")
                    .single();


            if (updateError) {

                throw updateError;

            }


            res.json({

                success: true,

                message:
                    `Dispute ${finalStatus.toLowerCase()} successfully.`,

                data:
                    updatedDispute

            });

        } catch (error) {

            console.error(
                "Dispute status update error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to update dispute status.",

                error:
                    error.message

            });

        }

    }
);
// ============================================================
// 404
// ============================================================

app.use(
    function (
        req,
        res
    ) {

        if (
            req.originalUrl.startsWith(
                "/api/"
            )
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "API endpoint not found.",

                path:
                    req.originalUrl

            });

        }

        res.status(404).send(
            "<h1>CreatorProof - Page Not Found</h1>"
        );

    }
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

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

// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    function () {

        console.log("");
        console.log(
            "=========================================="
        );
        console.log(
            "        CREATORPROOF SERVER"
        );
        console.log(
            "=========================================="
        );
        console.log("");

        console.log(
            `Server: http://localhost:${PORT}`
        );

        console.log(
            "Supabase:",
            supabase
                ? "CONNECTED"
                : "NOT CONFIGURED"
        );

        console.log(
            "Ethereum Sepolia:",
            contract
                ? "CONNECTED"
                : "NOT CONFIGURED"
        );

        console.log(
            "Contract:",
            CONTRACT_ADDRESS ||
            "NOT CONFIGURED"
        );

        console.log("");

        console.log(
            "Authentication:"
        );

        console.log(
            "  POST /api/auth/signup"
        );

        console.log(
            "  POST /api/auth/login"
        );

        console.log(
            "  GET  /api/auth/me"
        );

        console.log(
            "  POST /api/auth/logout"
        );

        console.log("");

        console.log(
            "Content:"
        );

        console.log(
            "  GET  /api/content"
        );

        console.log(
            "  POST /api/content/register"
        );

        console.log(
            "  POST /api/content/verify"
        );

        console.log("");

        console.log(
            "=========================================="
        );

    }
);