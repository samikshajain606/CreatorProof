/* =========================================================
   CREATORPROOF - MAIN JAVASCRIPT
   Registration + Verification + My Content + Dashboard
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_BASE_URL = "/api";


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function generateId(prefix = "CP") {

    return (
        prefix +
        "-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()
    );
}


function formatDate(date) {

    if (!date) {
        return "N/A";
    }

    const d = new Date(date);

    if (isNaN(d.getTime())) {
        return "N/A";
    }

    return d.toLocaleString();
}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "success"
) {

    const oldToast =
        document.getElementById(
            "creatorProofToast"
        );

    if (oldToast) {
        oldToast.remove();
    }


    const toast =
        document.createElement("div");

    toast.id =
        "creatorProofToast";

    toast.style.position =
        "fixed";

    toast.style.bottom =
        "25px";

    toast.style.right =
        "25px";

    toast.style.padding =
        "14px 20px";

    toast.style.borderRadius =
        "10px";

    toast.style.color =
        "#ffffff";

    toast.style.fontSize =
        "13px";

    toast.style.fontWeight =
        "600";

    toast.style.zIndex =
        "99999";

    toast.style.maxWidth =
        "420px";

    toast.style.boxShadow =
        "0 10px 30px rgba(0,0,0,0.18)";

    toast.style.background =
        type === "error"
            ? "#ef4444"
            : "#10b981";

    toast.textContent =
        message;

    document.body.appendChild(
        toast
    );


    setTimeout(
        function () {

            if (toast) {
                toast.remove();
            }

        },
        4000
    );
}


/* =========================================================
   SHA-256
   ========================================================= */

async function generateSHA256(file) {

    if (!file) {

        throw new Error(
            "No file selected."
        );
    }


    const arrayBuffer =
        await file.arrayBuffer();


    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            arrayBuffer
        );


    const hashArray =
        Array.from(
            new Uint8Array(
                hashBuffer
            )
        );


    return hashArray
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


/* =========================================================
   CURRENT USER
   ========================================================= */

function getCurrentUser() {

    try {

        const stored =
            localStorage.getItem(
                "creatorProofUser"
            );

        if (!stored) {
            return null;
        }

        return JSON.parse(
            stored
        );

    } catch (error) {

        console.error(
            "Unable to read current user:",
            error
        );

        return null;
    }
}


/* =========================================================
   CONTENT REGISTRATION
   ========================================================= */

function setupRegistration() {

    const registerForm =
        document.getElementById(
            "registerForm"
        );

    const contentFile =
        document.getElementById(
            "contentFile"
        );

    const contentTitle =
        document.getElementById(
            "contentTitle"
        );

    const creatorName =
        document.getElementById(
            "creatorName"
        );

    const contentType =
        document.getElementById(
            "contentType"
        );

    const hashSection =
        document.getElementById(
            "hashSection"
        );

    const hashDisplay =
        document.getElementById(
            "hashDisplay"
        );

    const sha256Hash =
        document.getElementById(
            "sha256Hash"
        );


    if (
        !registerForm ||
        !contentFile
    ) {

        return;
    }


    /* =====================================================
       FILE SELECTION
       ===================================================== */

    contentFile.addEventListener(
        "change",
        async function () {

            const file =
                this.files[0];


            if (!file) {

                if (hashSection) {

                    hashSection.style.display =
                        "none";
                }

                if (hashDisplay) {

                    hashDisplay.textContent =
                        "";
                }

                if (sha256Hash) {

                    sha256Hash.value =
                        "";
                }

                return;
            }


            if (hashSection) {

                hashSection.style.display =
                    "block";
            }


            if (hashDisplay) {

                hashDisplay.textContent =
                    "Generating SHA-256 fingerprint...";
            }


            try {

                const hash =
                    await generateSHA256(
                        file
                    );


                if (sha256Hash) {

                    sha256Hash.value =
                        hash;
                }


                if (hashDisplay) {

                    hashDisplay.textContent =
                        hash;
                }


                contentFile.dataset.sha256 =
                    hash;


                console.log(
                    "SHA-256 Fingerprint:",
                    hash
                );


            } catch (error) {

                console.error(
                    "SHA-256 generation failed:",
                    error
                );


                if (hashDisplay) {

                    hashDisplay.textContent =
                        "Unable to generate fingerprint.";
                }


                if (sha256Hash) {

                    sha256Hash.value =
                        "";
                }
            }

        }
    );


    /* =====================================================
       REGISTER SUBMIT
       ===================================================== */

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const title =
                contentTitle
                    ? contentTitle.value.trim()
                    : "";


            const creator =
                creatorName
                    ? creatorName.value.trim()
                    : "Creator Demo";


            const type =
                contentType
                    ? contentType.value
                    : "";


            const file =
                contentFile.files[0];


            /* =================================================
               VALIDATION
               ================================================= */

            if (!title) {

                showToast(
                    "Please enter a content title.",
                    "error"
                );

                return;
            }


            if (!creator) {

                showToast(
                    "Please enter the creator name.",
                    "error"
                );

                return;
            }


            if (!type) {

                showToast(
                    "Please select the content type.",
                    "error"
                );

                return;
            }


            if (!file) {

                showToast(
                    "Please select a file.",
                    "error"
                );

                return;
            }


            try {

                /* =================================================
                   SHA-256
                   ================================================= */

                showToast(
                    "Generating SHA-256 fingerprint..."
                );


                const hash =
                    await generateSHA256(
                        file
                    );


                if (sha256Hash) {

                    sha256Hash.value =
                        hash;
                }


                if (hashDisplay) {

                    hashDisplay.textContent =
                        hash;
                }


                /* =================================================
                   CONTENT ID
                   ================================================= */

                const contentId =
                    generateId("CP");


                /* =================================================
                   CREATOR
                   ================================================= */

                const currentUser =
                    getCurrentUser();


                const creatorId =
                    creator ||
                    (
                        currentUser &&
                        currentUser.email
                    ) ||
                    "demo-creator";


                /* =================================================
                   REQUEST DATA

                   IMPORTANT:
                   These names MUST match server.js
                   ================================================= */

                const requestData = {

                    title:
                        title,

                    contentId:
                        contentId,

                    creatorId:
                        creatorId,

                    fileName:
                        file.name,

                    contentType:
                        type,

                    sha256Hash:
                        hash,

                    filePath:
                        null
                };


                console.log(
                    "================================"
                );

                console.log(
                    "CREATORPROOF REGISTRATION"
                );

                console.log(
                    "================================"
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
                    "Creator:",
                    creatorId
                );

                console.log(
                    "File:",
                    file.name
                );

                console.log(
                    "SHA-256:",
                    hash
                );


                /* =================================================
                   SEND TO SERVER

                   THIS IS THE IMPORTANT PART.

                   server.js route:
                   POST /api/content/register

                   Therefore:
                   /api/content/register
                   ================================================= */

                showToast(
                    "Registering content on Sepolia..."
                );


                const response =
                    await fetch(
                        `${API_BASE_URL}/content/register`,
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    requestData
                                )
                        }
                    );


                /* =================================================
                   READ RESPONSE
                   ================================================= */

                let result;

                try {

                    result =
                        await response.json();

                } catch (jsonError) {

                    throw new Error(
                        "Server returned an invalid response."
                    );
                }


                console.log(
                    "Registration response:",
                    result
                );


                /* =================================================
                   CHECK ERROR
                   ================================================= */

                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        result.error ||
                        "Content registration failed."
                    );
                }


                /* =================================================
                   SAVE RESULT
                   ================================================= */

                const savedData =
                    result.data || {};


                localStorage.setItem(
                    "creatorProofContent",
                    JSON.stringify(
                        savedData
                    )
                );


                localStorage.setItem(
                    "lastContentTitle",
                    title
                );


                localStorage.setItem(
                    "lastFileName",
                    file.name
                );


                localStorage.setItem(
                    "lastFileType",
                    type
                );


                localStorage.setItem(
                    "lastFileSize",
                    file.size.toString()
                );


                localStorage.setItem(
                    "lastContentId",
                    contentId
                );


                localStorage.setItem(
                    "lastSha256Hash",
                    hash
                );


                if (
                    savedData.transactionHash
                ) {

                    localStorage.setItem(
                        "lastTransactionHash",
                        savedData.transactionHash
                    );
                }


                if (
                    savedData.blockNumber
                ) {

                    localStorage.setItem(
                        "lastBlockNumber",
                        savedData.blockNumber.toString()
                    );
                }


                /* =================================================
                   SUCCESS
                   ================================================= */

                console.log(
                    "================================"
                );

                console.log(
                    "REGISTRATION SUCCESS"
                );

                console.log(
                    "================================"
                );

                console.log(
                    "Content ID:",
                    contentId
                );

                console.log(
                    "SHA-256:",
                    hash
                );

                console.log(
                    "Transaction:",
                    savedData.transactionHash ||
                    "Not returned"
                );

                console.log(
                    "Block:",
                    savedData.blockNumber ||
                    "Not returned"
                );


                showToast(
                    "Content registered successfully on Sepolia!"
                );


                /* =================================================
                   GO TO MY CONTENT
                   ================================================= */

                setTimeout(
                    function () {

                        window.location.href =
                            "/content.html";

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "================================"
                );

                console.error(
                    "CONTENT REGISTRATION ERROR"
                );

                console.error(
                    error
                );

                console.error(
                    "================================"
                );


                showToast(
                    error.message ||
                    "Unable to register content.",
                    "error"
                );
            }

        }
    );
}


/* =========================================================
   MY CONTENT
   ========================================================= */

async function loadContentTable() {

    const tableBody =
        document.getElementById(
            "contentTable"
        ) ||
        document.getElementById(
            "contentTableBody"
        );


    if (!tableBody) {

        return;
    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                style="
                    text-align:center;
                    padding:30px;
                "
            >

                Loading registered content...

            </td>

        </tr>

    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/content`
            );


        let result;

        try {

            result =
                await response.json();

        } catch (error) {

            throw new Error(
                "Invalid server response."
            );
        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                result.error ||
                "Unable to load content."
            );
        }


        const contents =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        if (
            contents.length === 0
        ) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            padding:40px;
                        "
                    >

                        <div
                            style="
                                font-size:28px;
                                margin-bottom:10px;
                            "
                        >
                            🔐
                        </div>

                        <strong>
                            No registered content yet
                        </strong>

                        <br>

                        <span
                            style="
                                color:#888;
                                font-size:12px;
                            "
                        >
                            Register your first file to create
                            a blockchain-ready content record.
                        </span>

                    </td>

                </tr>

            `;

            return;
        }


        tableBody.innerHTML =
            contents
                .map(
                    function (content) {

                        const contentId =
                            content.content_id ||
                            content.contentId ||
                            "N/A";


                        const fileName =
                            content.file_name ||
                            content.fileName ||
                            "Unknown file";


                        const hash =
                            content.sha256_hash ||
                            content.sha256Hash ||
                            "";


                        const status =
                            content.status ||
                            "Registered";


                        const blockchainStatus =
                            content.blockchain_status ||
                            "Pending";


                        const createdAt =
                            content.created_at ||
                            content.createdAt;


                        const txHash =
                            content.blockchain_tx_hash ||
                            content.transactionHash ||
                            "";


                        return `

                            <tr>

                                <td>

                                    <div
                                        style="
                                            display:flex;
                                            flex-direction:column;
                                            gap:4px;
                                        "
                                    >

                                        <strong>
                                            ${escapeHTML(
                                                content.title ||
                                                "Untitled Content"
                                            )}
                                        </strong>

                                        <span
                                            style="
                                                font-size:11px;
                                                color:#888;
                                            "
                                        >
                                            ${escapeHTML(
                                                fileName
                                            )}
                                        </span>

                                    </div>

                                </td>


                                <td>

                                    <span
                                        style="
                                            font-family:monospace;
                                            font-size:11px;
                                        "
                                    >
                                        ${escapeHTML(
                                            contentId
                                        )}
                                    </span>

                                </td>


                                <td>

                                    <span
                                        title="${escapeHTML(hash)}"
                                        style="
                                            font-family:monospace;
                                            font-size:10px;
                                            word-break:break-all;
                                        "
                                    >
                                        ${escapeHTML(
                                            hash
                                                ? hash.substring(
                                                    0,
                                                    16
                                                ) + "..."
                                                : "N/A"
                                        )}
                                    </span>

                                </td>


                                <td>

                                    <span
                                        class="badge badge-purple"
                                    >
                                        ${escapeHTML(
                                            status
                                        )}
                                    </span>

                                    <br>

                                    <span
                                        style="
                                            font-size:10px;
                                            color:#777;
                                        "
                                    >
                                        Blockchain:
                                        ${escapeHTML(
                                            blockchainStatus
                                        )}
                                    </span>

                                </td>


                                <td>

                                    <span
                                        class="badge badge-purple"
                                    >
                                        v1
                                    </span>

                                </td>


                                <td>

                                    <span
                                        style="
                                            font-size:11px;
                                        "
                                    >
                                        ${escapeHTML(
                                            formatDate(
                                                createdAt
                                            )
                                        )}
                                    </span>

                                    ${
                                        txHash
                                            ? `
                                                <br>
                                                <a
                                                    href="https://sepolia.etherscan.io/tx/${encodeURIComponent(txHash)}"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style="
                                                        font-size:10px;
                                                    "
                                                >
                                                    View Transaction
                                                </a>
                                            `
                                            : ""
                                    }

                                </td>

                            </tr>

                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Unable to load content:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >

                    <strong>
                        Unable to load content
                    </strong>

                    <br>

                    <span
                        style="
                            color:#888;
                            font-size:12px;
                        "
                    >
                        ${escapeHTML(
                            error.message
                        )}
                    </span>

                </td>

            </tr>

        `;
    }
}


/* =========================================================
   CONTENT VERIFICATION
   ========================================================= */

function setupVerification() {

    const verifyForm =
        document.getElementById(
            "verifyForm"
        );


    const contentIdInput =
        document.getElementById(
            "contentId"
        );


    const verifyFile =
        document.getElementById(
            "verifyFile"
        );


    const sha256HashInput =
        document.getElementById(
            "sha256Hash"
        );


    const verifyHashSection =
        document.getElementById(
            "verifyHashSection"
        );


    const verifyHashDisplay =
        document.getElementById(
            "verifyHashDisplay"
        );


    const result =
        document.getElementById(
            "verificationResult"
        );


    if (
        !verifyForm ||
        !verifyFile
    ) {

        return;
    }


    /* =====================================================
       FILE SELECTION
       ===================================================== */

    verifyFile.addEventListener(
        "change",
        async function () {

            const file =
                this.files[0];


            if (!file) {

                if (verifyHashSection) {

                    verifyHashSection.style.display =
                        "none";
                }


                if (sha256HashInput) {

                    sha256HashInput.value =
                        "";
                }


                if (verifyHashDisplay) {

                    verifyHashDisplay.textContent =
                        "";
                }

                return;
            }


            if (verifyHashSection) {

                verifyHashSection.style.display =
                    "block";
            }


            if (verifyHashDisplay) {

                verifyHashDisplay.textContent =
                    "Generating SHA-256 fingerprint...";
            }


            try {

                const hash =
                    await generateSHA256(
                        file
                    );


                if (sha256HashInput) {

                    sha256HashInput.value =
                        hash;
                }


                if (verifyHashDisplay) {

                    verifyHashDisplay.textContent =
                        hash;
                }


                verifyFile.dataset.sha256 =
                    hash;


                console.log(
                    "Verification SHA-256:",
                    hash
                );


            } catch (error) {

                console.error(
                    "Verification hash error:",
                    error
                );


                if (verifyHashDisplay) {

                    verifyHashDisplay.textContent =
                        "Unable to generate fingerprint.";
                }


                if (sha256HashInput) {

                    sha256HashInput.value =
                        "";
                }
            }

        }
    );


    /* =====================================================
       VERIFY SUBMIT
       ===================================================== */

    verifyForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* =================================================
               GET CONTENT ID
               ================================================= */

            const contentId =
                contentIdInput
                    ? contentIdInput.value.trim()
                    : "";


            /* =================================================
               GET FILE
               ================================================= */

            const file =
                verifyFile.files[0];


            /* =================================================
               VALIDATION
               ================================================= */

            if (!contentId) {

                showToast(
                    "Please enter the Content ID.",
                    "error"
                );

                return;
            }


            if (!file) {

                showToast(
                    "Please select a file.",
                    "error"
                );

                return;
            }


            try {

                /* =================================================
                   GENERATE SHA-256
                   ================================================= */

                showToast(
                    "Calculating SHA-256 fingerprint..."
                );


                const uploadedHash =
                    await generateSHA256(
                        file
                    );


                if (sha256HashInput) {

                    sha256HashInput.value =
                        uploadedHash;
                }


                if (verifyHashDisplay) {

                    verifyHashDisplay.textContent =
                        uploadedHash;
                }


                console.log(
                    "================================"
                );

                console.log(
                    "CONTENT VERIFICATION"
                );

                console.log(
                    "================================"
                );

                console.log(
                    "Content ID:",
                    contentId
                );

                console.log(
                    "SHA-256:",
                    uploadedHash
                );


                /* =================================================
                   REQUEST BODY

                   server.js expects:

                   contentId
                   sha256Hash
                   ================================================= */

                const verificationBody = {

                    contentId:
                        contentId,

                    sha256Hash:
                        uploadedHash
                };


                console.log(
                    "Verification request:",
                    verificationBody
                );


                /* =================================================
                   SEND TO SERVER

                   POST /api/content/verify
                   ================================================= */

                const response =
                    await fetch(
                        `${API_BASE_URL}/content/verify`,
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    verificationBody
                                )
                        }
                    );


                /* =================================================
                   READ RESPONSE
                   ================================================= */

                let verification;

                try {

                    verification =
                        await response.json();

                } catch (error) {

                    throw new Error(
                        "Server returned an invalid response."
                    );
                }


                console.log(
                    "Verification response:",
                    verification
                );


                /* =================================================
                   SERVER ERROR
                   ================================================= */

                if (!response.ok) {

                    throw new Error(
                        verification.message ||
                        verification.error ||
                        "Verification failed."
                    );
                }


                /* =================================================
                   DETERMINE RESULT
                   ================================================= */

                const verified =
                    verification.verified === true;


                /* =================================================
                   VERIFIED
                   ================================================= */

                if (verified) {

                    const content =
                        verification.data ||
                        {};


                    const returnedContentId =
                        content.content_id ||
                        content.contentId ||
                        verification.contentId ||
                        contentId;


                    const title =
                        content.title ||
                        "Registered Content";


                    const creator =
                        content.creator_id ||
                        content.creatorId ||
                        content.creator ||
                        "N/A";


                    const fileName =
                        content.file_name ||
                        content.fileName ||
                        file.name;


                    const registeredHash =
                        content.sha256_hash ||
                        content.sha256Hash ||
                        verification.sha256Hash ||
                        uploadedHash;


                    const contentStatus =
                        content.status ||
                        "Registered";


                    const blockchainStatus =
                        content.blockchain_status ||
                        "Registered";


                    if (result) {

                        result.style.display =
                            "block";


                        result.innerHTML = `

                            <div
                                style="
                                    padding:10px;
                                "
                            >

                                <h2
                                    style="
                                        margin-bottom:10px;
                                    "
                                >
                                    ✓ Content Verified
                                </h2>


                                <p
                                    style="
                                        margin-bottom:20px;
                                    "
                                >
                                    The uploaded file matches
                                    the registered CreatorProof
                                    fingerprint.
                                </p>


                                <div
                                    style="
                                        display:grid;
                                        gap:12px;
                                    "
                                >

                                    <div>

                                        <strong>
                                            Content ID
                                        </strong>

                                        <br>

                                        <span
                                            style="
                                                font-family:monospace;
                                                font-size:11px;
                                            "
                                        >
                                            ${escapeHTML(
                                                returnedContentId
                                            )}
                                        </span>

                                    </div>


                                    <div>

                                        <strong>
                                            Content Title
                                        </strong>

                                        <br>

                                        ${escapeHTML(
                                            title
                                        )}

                                    </div>


                                    <div>

                                        <strong>
                                            Creator
                                        </strong>

                                        <br>

                                        ${escapeHTML(
                                            creator
                                        )}

                                    </div>


                                    <div>

                                        <strong>
                                            File
                                        </strong>

                                        <br>

                                        ${escapeHTML(
                                            fileName
                                        )}

                                    </div>


                                    <div>

                                        <strong>
                                            SHA-256 Fingerprint
                                        </strong>

                                        <br>

                                        <span
                                            style="
                                                font-family:monospace;
                                                font-size:10px;
                                                word-break:break-all;
                                            "
                                        >
                                            ${escapeHTML(
                                                registeredHash
                                            )}
                                        </span>

                                    </div>


                                    <div>

                                        <strong>
                                            Content Status
                                        </strong>

                                        <br>

                                        <span
                                            class="badge badge-purple"
                                        >
                                            ${escapeHTML(
                                                contentStatus
                                            )}
                                        </span>

                                    </div>


                                    <div>

                                        <strong>
                                            Blockchain Status
                                        </strong>

                                        <br>

                                        <span
                                            class="badge badge-purple"
                                        >
                                            ${escapeHTML(
                                                blockchainStatus
                                            )}
                                        </span>

                                    </div>

                                </div>

                            </div>

                        `;
                    }


                    showToast(
                        "Content verified successfully!"
                    );


                    return;
                }


                /* =================================================
                   NOT VERIFIED
                   ================================================= */

                if (result) {

                    result.style.display =
                        "block";


                    result.innerHTML = `

                        <div
                            style="
                                padding:10px;
                            "
                        >

                            <h2
                                style="
                                    margin-bottom:10px;
                                "
                            >
                                ✕ Content Not Verified
                            </h2>


                            <p>
                                The Content ID and SHA-256
                                fingerprint do not match
                                a registered CreatorProof
                                record.
                            </p>


                            <div
                                style="
                                    margin-top:15px;
                                    display:grid;
                                    gap:10px;
                                "
                            >

                                <div>

                                    <strong>
                                        Content ID:
                                    </strong>

                                    <span
                                        style="
                                            font-family:monospace;
                                            font-size:11px;
                                        "
                                    >
                                        ${escapeHTML(
                                            contentId
                                        )}
                                    </span>

                                </div>


                                <div>

                                    <strong>
                                        SHA-256:
                                    </strong>

                                    <span
                                        style="
                                            font-family:monospace;
                                            font-size:10px;
                                            word-break:break-all;
                                        "
                                    >
                                        ${escapeHTML(
                                            uploadedHash
                                        )}
                                    </span>

                                </div>

                            </div>

                        </div>

                    `;
                }


                showToast(
                    "Content could not be verified.",
                    "error"
                );


            } catch (error) {

                console.error(
                    "================================"
                );

                console.error(
                    "CONTENT VERIFICATION ERROR"
                );

                console.error(
                    error
                );

                console.error(
                    "================================"
                );


                if (result) {

                    result.style.display =
                        "block";


                    result.innerHTML = `

                        <div
                            style="
                                padding:10px;
                            "
                        >

                            <h2>
                                ✕ Verification Failed
                            </h2>

                            <p>
                                ${escapeHTML(
                                    error.message ||
                                    "Unable to verify content."
                                )}
                            </p>

                        </div>

                    `;
                }


                showToast(
                    error.message ||
                    "Unable to verify content.",
                    "error"
                );
            }

        }
    );
}


/* =========================================================
   LOGIN
   ========================================================= */

function setupLogin() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );


    if (!loginForm) {

        return;
    }


    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "email"
                );


            const passwordInput =
                document.getElementById(
                    "password"
                );


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            if (!email) {

                showToast(
                    "Please enter your email.",
                    "error"
                );

                return;
            }


            if (!password) {

                showToast(
                    "Please enter your password.",
                    "error"
                );

                return;
            }


            localStorage.setItem(
                "creatorProofUser",
                JSON.stringify({

                    email:
                        email,

                    loggedIn:
                        true,

                    loginTime:
                        new Date().toISOString()

                })
            );


            showToast(
                "Authentication successful!"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "/dashboard.html";

                },
                700
            );
        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    localStorage.removeItem(
        "creatorProofUser"
    );


    window.location.href =
        "/index.html";
}


/* =========================================================
   DASHBOARD STATISTICS
   ========================================================= */

async function loadDashboardStats() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/content`
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                result.error ||
                "Unable to load dashboard data."
            );
        }


        const contents =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        /* =================================================
           TOTAL CONTENT
           ================================================= */

        const totalContent =
            document.getElementById(
                "totalContent"
            );


        if (totalContent) {

            totalContent.textContent =
                contents.length;
        }


        const totalContents =
            document.getElementById(
                "totalContents"
            );


        if (totalContents) {

            totalContents.textContent =
                contents.length;
        }


        /* =================================================
           VERIFIED CONTENT
           ================================================= */

        const verifiedContent =
            document.getElementById(
                "verifiedContent"
            );


        if (verifiedContent) {

            const verified =
                contents.filter(
                    function (content) {

                        return (
                            content.status ===
                            "Verified"
                        );
                    }
                );


            verifiedContent.textContent =
                verified.length;
        }


        const verifiedContents =
            document.getElementById(
                "verifiedContents"
            );


        if (verifiedContents) {

            const verified =
                contents.filter(
                    function (content) {

                        return (
                            content.status ===
                            "Verified"
                        );
                    }
                );


            verifiedContents.textContent =
                verified.length;
        }


        /* =================================================
           BLOCKCHAIN RECORDS
           ================================================= */

        const blockchainRecords =
            document.getElementById(
                "blockchainRecords"
            );


        if (blockchainRecords) {

            const blockchainCount =
                contents.filter(
                    function (content) {

                        return (
                            content.blockchain_tx_hash
                        );
                    }
                ).length;


            blockchainRecords.textContent =
                blockchainCount;
        }


        /* =================================================
           ACTIVE LICENSES
           ================================================= */

        const activeLicenses =
            document.getElementById(
                "activeLicenses"
            );


        if (activeLicenses) {

            let licenses = [];


            try {

                const stored =
                    localStorage.getItem(
                        "creatorProofLicenses"
                    );


                if (stored) {

                    licenses =
                        JSON.parse(
                            stored
                        );


                    if (
                        !Array.isArray(
                            licenses
                        )
                    ) {

                        licenses = [];
                    }
                }

            } catch (error) {

                licenses = [];
            }


            activeLicenses.textContent =
                licenses.length;
        }


    } catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );
    }
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupRegistration();

        setupVerification();

        setupLogin();
        
        setupLicenses();

        setupDisputes();

        loadContentTable();

        loadDashboardStats();


    }
);
/* =========================================================
   LICENSE MANAGEMENT
   ========================================================= */

function setupLicenses() {

    const licenseForm =
        document.getElementById("licenseForm");

    const licenseFormCard =
        document.getElementById("licenseFormCard");

    const licenseType =
        document.getElementById("licenseType");

    const cancelButton =
        document.getElementById("cancelLicenseBtn");

    const createButtons =
        document.querySelectorAll(".license-create-btn");

    if (!licenseForm) {
        return;
    }

    createButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const selectedType =
                button.dataset.licenseType || "Custom";

            if (licenseType) {
                licenseType.value = selectedType;
            }

            if (licenseFormCard) {

                licenseFormCard.style.display = "block";

                licenseFormCard.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

        });

    });


    if (cancelButton) {

        cancelButton.addEventListener("click", function () {

            licenseForm.reset();

            if (licenseFormCard) {
                licenseFormCard.style.display = "none";
            }

        });

    }


    licenseForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const contentId =
            document.getElementById("licenseContentId")
                .value.trim();

        const type =
            document.getElementById("licenseType")
                .value.trim();

        const licensee =
            document.getElementById("licensee")
                .value.trim();

        const expiry =
            document.getElementById("licenseExpiry")
                .value;

        const permissions =
            document.getElementById("licensePermissions")
                .value.trim();


        if (!contentId) {
            alert("Please enter the Content ID.");
            return;
        }

        if (!type) {
            alert("Please select a license type.");
            return;
        }

        if (!licensee) {
            alert("Please enter the licensee name.");
            return;
        }

        if (!expiry) {
            alert("Please select an expiry date.");
            return;
        }


        let licenses = [];

        try {

            const stored =
                localStorage.getItem(
                    "creatorProofLicenses"
                );

            if (stored) {
                licenses = JSON.parse(stored);
            }

            if (!Array.isArray(licenses)) {
                licenses = [];
            }

        } catch (error) {

            console.error(
                "Error loading licenses:",
                error
            );

            licenses = [];
        }


        const license = {

            id:
                "LIC-" +
                Date.now(),

            contentId:
                contentId,

            contentTitle:
                localStorage.getItem(
                    "lastContentTitle"
                ) || "Registered Content",

            licensee:
                licensee,

            type:
                type,

            status:
                "Active",

            expiry:
                expiry,

            permissions:
                permissions,

            createdAt:
                new Date().toISOString()

        };


        licenses.push(license);


        localStorage.setItem(
            "creatorProofLicenses",
            JSON.stringify(licenses)
        );


        alert(
            "License created successfully!"
        );


        licenseForm.reset();


        if (licenseFormCard) {
            licenseFormCard.style.display = "none";
        }


        loadLicensesTable();


        if (typeof loadDashboardStats === "function") {
            loadDashboardStats();
        }

    });


    loadLicensesTable();
}


/* =========================================================
   LOAD LICENSES
   ========================================================= */

function loadLicensesTable() {

    const tableBody =
        document.getElementById(
            "licensesTableBody"
        );

    const countElement =
        document.getElementById(
            "licenseCount"
        );


    if (!tableBody) {
        return;
    }


    let licenses = [];

    try {

        const stored =
            localStorage.getItem(
                "creatorProofLicenses"
            );

        if (stored) {
            licenses = JSON.parse(stored);
        }

        if (!Array.isArray(licenses)) {
            licenses = [];
        }

    } catch (error) {

        console.error(
            "Error loading licenses:",
            error
        );

        licenses = [];
    }


    const activeLicenses =
        licenses.filter(function (license) {

            return license.status === "Active";

        });


    if (countElement) {

        countElement.textContent =
            activeLicenses.length + " active";

    }


    if (activeLicenses.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >

                    <div
                        style="
                            font-size:28px;
                            margin-bottom:10px;
                        "
                    >
                        📄
                    </div>

                    <strong>
                        No active licenses
                    </strong>

                    <br>

                    <span
                        style="
                            color:#888;
                            font-size:12px;
                        "
                    >
                        Create a license for your
                        registered content to see it here.
                    </span>

                </td>

            </tr>

        `;

        return;
    }


    tableBody.innerHTML =
        activeLicenses.map(function (license) {

            return `

                <tr>

                    <td>

                        <strong>
                            ${escapeLicenseHTML(
                                license.contentTitle ||
                                "Registered Content"
                            )}
                        </strong>

                    </td>


                    <td>

                        <span
                            style="
                                font-family:monospace;
                                font-size:10px;
                                word-break:break-all;
                            "
                        >
                            ${escapeLicenseHTML(
                                license.contentId
                            )}
                        </span>

                    </td>


                    <td>

                        ${escapeLicenseHTML(
                            license.licensee
                        )}

                    </td>


                    <td>

                        ${escapeLicenseHTML(
                            license.type
                        )}

                    </td>


                    <td>

                        <span class="badge badge-success">
                            Active
                        </span>

                    </td>


                    <td>

                        ${formatLicenseDate(
                            license.expiry
                        )}

                    </td>

                </tr>

            `;

        }).join("");

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeLicenseHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatLicenseDate(date) {

    if (!date) {
        return "N/A";
    }


    const d = new Date(date);


    if (isNaN(d.getTime())) {
        return "N/A";
    }


    return d.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}
/* =========================================================
   DISPUTE MANAGEMENT
   ========================================================= */

function setupDisputes() {

    const form =
        document.getElementById("disputeForm");

    const formCard =
        document.getElementById("disputeFormCard");

    const newButton =
        document.getElementById("newDisputeButton");

    const cancelButton =
        document.getElementById("cancelDisputeButton");


    if (!form) {
        return;
    }


    /* OPEN FORM */

    if (newButton) {

        newButton.addEventListener(
            "click",
            function () {

                formCard.style.display = "block";

                formCard.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    }


    /* CANCEL */

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                form.reset();

                formCard.style.display = "none";

            }
        );

    }


    /* SUBMIT */

    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const contentId =
                document.getElementById(
                    "disputeContentId"
                ).value.trim();


            const type =
                document.getElementById(
                    "disputeType"
                ).value;


            const claimant =
                document.getElementById(
                    "disputeClaimant"
                ).value.trim();


            const description =
                document.getElementById(
                    "disputeDescription"
                ).value.trim();


            const evidence =
                document.getElementById(
                    "disputeEvidence"
                ).value.trim();


            if (!contentId) {

                alert(
                    "Please enter the Content ID."
                );

                return;
            }


            if (!type) {

                alert(
                    "Please select a dispute type."
                );

                return;
            }


            if (!claimant) {

                alert(
                    "Please enter the claimant name."
                );

                return;
            }


            if (!description) {

                alert(
                    "Please describe the dispute."
                );

                return;
            }


            let disputes = [];


            try {

                const stored =
                    localStorage.getItem(
                        "creatorProofDisputes"
                    );


                if (stored) {

                    disputes =
                        JSON.parse(stored);

                }


                if (!Array.isArray(disputes)) {

                    disputes = [];

                }

            } catch (error) {

                console.error(
                    "Error loading disputes:",
                    error
                );

                disputes = [];

            }


            const dispute = {

                id:
                    "DSP-" +
                    String(
                        Date.now()
                    ).slice(-6),

                contentId:
                    contentId,

                contentTitle:
                    localStorage.getItem(
                        "lastContentTitle"
                    ) ||
                    "Registered Content",

                type:
                    type,

                claimant:
                    claimant,

                description:
                    description,

                evidence:
                    evidence,

                status:
                    "Under Review",

                createdAt:
                    new Date().toISOString()

            };


            disputes.push(
                dispute
            );


            localStorage.setItem(
                "creatorProofDisputes",
                JSON.stringify(
                    disputes
                )
            );


            console.log(
                "Dispute created:",
                dispute
            );


            alert(
                "Dispute submitted successfully!"
            );


            form.reset();

            formCard.style.display =
                "none";


            loadDisputesTable();

            updateDisputeStats();

        }
    );


    loadDisputesTable();

    updateDisputeStats();

}


/* =========================================================
   LOAD DISPUTES TABLE
   ========================================================= */

function loadDisputesTable() {

    const tableBody =
        document.getElementById(
            "disputesTableBody"
        );


    if (!tableBody) {
        return;
    }


    let disputes = [];


    try {

        const stored =
            localStorage.getItem(
                "creatorProofDisputes"
            );


        if (stored) {

            disputes =
                JSON.parse(stored);

        }


        if (!Array.isArray(disputes)) {

            disputes = [];

        }

    } catch (error) {

        console.error(
            "Error loading disputes:",
            error
        );

        disputes = [];

    }


    if (disputes.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >

                    <div
                        style="
                            font-size:28px;
                            margin-bottom:10px;
                        "
                    >
                        ⚖
                    </div>

                    <strong>
                        No disputes submitted
                    </strong>

                    <br>

                    <span
                        style="
                            color:#888;
                            font-size:12px;
                        "
                    >
                        Click "+ New Dispute" to submit a dispute.
                    </span>

                </td>

            </tr>

        `;

        return;
    }


    tableBody.innerHTML =
        disputes.map(
            function (dispute) {


                let badgeClass =
                    "badge-warning";


                if (
                    dispute.status ===
                    "Resolved"
                ) {

                    badgeClass =
                        "badge-success";

                }


                return `

                    <tr>

                        <td>

                            <strong>
                                #${escapeDisputeHTML(
                                    dispute.id
                                )}
                            </strong>

                        </td>


                        <td>

                            <strong>
                                ${escapeDisputeHTML(
                                    dispute.contentTitle ||
                                    "Registered Content"
                                )}
                            </strong>

                            <br>

                            <span
                                style="
                                    font-family:monospace;
                                    font-size:9px;
                                    color:#64748b;
                                "
                            >
                                ${escapeDisputeHTML(
                                    dispute.contentId
                                )}
                            </span>

                        </td>


                        <td>

                            ${escapeDisputeHTML(
                                dispute.type
                            )}

                        </td>


                        <td>

                            <span
                                class="badge ${badgeClass}"
                            >
                                ${escapeDisputeHTML(
                                    dispute.status
                                )}
                            </span>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   DISPUTE STATISTICS
   ========================================================= */

function updateDisputeStats() {

    let disputes = [];


    try {

        const stored =
            localStorage.getItem(
                "creatorProofDisputes"
            );


        if (stored) {

            disputes =
                JSON.parse(stored);

        }


        if (!Array.isArray(disputes)) {

            disputes = [];

        }

    } catch (error) {

        disputes = [];

    }


    const total =
        disputes.length;


    const resolved =
        disputes.filter(
            function (dispute) {

                return (
                    dispute.status ===
                    "Resolved"
                );

            }
        ).length;


    const review =
        disputes.filter(
            function (dispute) {

                return (
                    dispute.status ===
                    "Under Review"
                );

            }
        ).length;


    const resolutionRate =
        total > 0
            ? Math.round(
                (resolved / total) * 100
            )
            : 0;


    const totalElement =
        document.getElementById(
            "totalDisputes"
        );


    const resolvedElement =
        document.getElementById(
            "resolvedDisputes"
        );


    const reviewElement =
        document.getElementById(
            "reviewDisputes"
        );


    const rateElement =
        document.getElementById(
            "resolutionRate"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (resolvedElement) {

        resolvedElement.textContent =
            resolved;

    }


    if (reviewElement) {

        reviewElement.textContent =
            review;

    }


    if (rateElement) {

        rateElement.textContent =
            resolutionRate +
            "% resolution";

    }


    /* ANALYTICS */

    const analyticsContent =
        document.getElementById(
            "analyticsContent"
        );


    const analyticsBlockchain =
        document.getElementById(
            "analyticsBlockchain"
        );


    const analyticsLicenses =
        document.getElementById(
            "analyticsLicenses"
        );


    const contentData =
        localStorage.getItem(
            "creatorProofContent"
        );


    const licensesData =
        localStorage.getItem(
            "creatorProofLicenses"
        );


    let contentCount = 0;

    let blockchainCount = 0;

    let licenseCount = 0;


    try {

        if (contentData) {

            const content =
                JSON.parse(
                    contentData
                );

            if (Array.isArray(content)) {

                contentCount =
                    content.length;

                blockchainCount =
                    content.filter(
                        function (item) {

                            return (
                                item.txHash ||
                                item.transactionHash
                            );

                        }
                    ).length;

            }

        }

    } catch (error) {

        console.error(
            "Content analytics error:",
            error
        );

    }


    try {

        if (licensesData) {

            const licenses =
                JSON.parse(
                    licensesData
                );

            if (Array.isArray(licenses)) {

                licenseCount =
                    licenses.length;

            }

        }

    } catch (error) {

        console.error(
            "License analytics error:",
            error
        );

    }


    if (analyticsContent) {

        analyticsContent.textContent =
            contentCount;

    }


    if (analyticsBlockchain) {

        analyticsBlockchain.textContent =
            blockchainCount;

    }


    if (analyticsLicenses) {

        analyticsLicenses.textContent =
            licenseCount;

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeDisputeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}