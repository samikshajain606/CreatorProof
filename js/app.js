// ============================================================
// CreatorProof - Frontend Application
// ============================================================

(function () {

    "use strict";

    // ========================================================
    // HTML ESCAPE
    // ========================================================

    window.escapeHtml = function (value) {

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

    };

    // ========================================================
    // API REQUEST
    // ========================================================

    window.api = async function (
        url,
        options = {}
    ) {

        const response =
            await fetch(
                url,
                {
                    credentials: "include",
                    ...options
                }
            );

        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            data = {};

        }

        if (
            response.status === 401
        ) {

            if (
                !location.pathname.endsWith(
                    "login.html"
                ) &&
                !location.pathname.endsWith(
                    "signup.html"
                ) &&
                !location.pathname.endsWith(
                    "index.html"
                )
            ) {

                window.location.href =
                    "login.html";

            }

        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Request failed."
            );

        }

        return data;

    };

    // ========================================================
    // CURRENT USER
    // ========================================================

    window.getCurrentUser =
        async function () {

            try {

                const result =
                    await api(
                        "/api/auth/me"
                    );

                return result.user;

            } catch (error) {

                return null;

            }

        };

    // ========================================================
    // AUTH PAGE GUARD
    // ========================================================

    window.requireUser =
        async function () {

            const user =
                await getCurrentUser();

            if (!user) {

                window.location.href =
                    "login.html";

                return null;

            }

            return user;

        };

    // ========================================================
    // SIGN OUT
    // ========================================================

    window.signOut =
        async function () {

            try {

                await api(
                    "/api/auth/logout",
                    {
                        method:
                            "POST"
                    }
                );

            } catch (error) {

                console.error(
                    error
                );

            }

            window.location.href =
                "login.html";

        };

    // ========================================================
    // UPDATE PROFILE UI
    // ========================================================

    window.updateUserUI =
        function (user) {

            if (!user) {
                return;
            }

            document
                .querySelectorAll(
                    "[data-user-name]"
                )
                .forEach(
                    element => {

                        element.textContent =
                            user.name ||
                            "Creator";

                    }
                );

            document
                .querySelectorAll(
                    "[data-user-email]"
                )
                .forEach(
                    element => {

                        element.textContent =
                            user.email ||
                            "";

                    }
                );

            document
                .querySelectorAll(
                    "[data-user-role]"
                )
                .forEach(
                    element => {

                        element.textContent =
                            user.role ||
                            "Creator";

                    }
                );

            document
                .querySelectorAll(
                    "[data-user-avatar]"
                )
                .forEach(
                    element => {

                        element.textContent =
                            getInitials(
                                user.name
                            );

                    }
                );

        };

    function getInitials(
        name
    ) {

        if (!name) {
            return "CP";
        }

        const parts =
            name
                .trim()
                .split(/\s+/);

        if (
            parts.length >= 2
        ) {

            return (
                parts[0][0] +
                parts[1][0]
            ).toUpperCase();

        }

        return name
            .substring(0, 2)
            .toUpperCase();

    }

    // ========================================================
    // PAGE AUTH INITIALIZATION
    // ========================================================

    document.addEventListener(
        "DOMContentLoaded",
        async function () {

            const protectedPage =
                [
                    "dashboard.html",
                    "register.html",
                    "content.html",
                    "verify.html",
                    "licenses.html",
                    "disputes.html",
                    "profile.html"
                ]
                .some(
                    page =>
                        location.pathname
                            .toLowerCase()
                            .endsWith(page)
                );

            if (!protectedPage) {
                return;
            }

            const user =
                await requireUser();

            if (!user) {
                return;
            }

            updateUserUI(
                user
            );

            setupGlobalMenus();

        }
    );

    // ========================================================
    // GLOBAL MENUS
    // ========================================================

    function setupGlobalMenus() {

        const profileButton =
            document.getElementById(
                "profileButton"
            );

        const profileMenu =
            document.getElementById(
                "profileMenu"
            );

        if (
            profileButton &&
            profileMenu
        ) {

            profileButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    profileMenu
                        .classList
                        .toggle("show");

                }
            );

        }

        const notificationButton =
            document.getElementById(
                "notificationButton"
            );

        const notificationPanel =
            document.getElementById(
                "notificationPanel"
            );

        if (
            notificationButton &&
            notificationPanel
        ) {

            notificationButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    notificationPanel
                        .classList
                        .toggle("show");

                }
            );

        }

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                signOut
            );

        }

        document.addEventListener(
            "click",
            function () {

                if (profileMenu) {

                    profileMenu
                        .classList
                        .remove("show");

                }

                if (notificationPanel) {

                    notificationPanel
                        .classList
                        .remove("show");

                }

            }
        );

    }

    // ========================================================
    // FILE HASH
    // ========================================================

    window.calculateSHA256 =
        async function (file) {

            const buffer =
                await file.arrayBuffer();

            const hashBuffer =
                await crypto.subtle.digest(
                    "SHA-256",
                    buffer
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
                            .padStart(
                                2,
                                "0"
                            )
                )
                .join("");

        };

    // ========================================================
    // SHORT HASH
    // ========================================================

    window.shortenHash =
        function (hash) {

            if (!hash) {
                return "Not available";
            }

            if (
                hash.length <= 28
            ) {

                return hash;

            }

            return (
                hash.substring(
                    0,
                    14
                ) +
                "..." +
                hash.substring(
                    hash.length - 10
                )
            );

        };

    // ========================================================
    // DATE
    // ========================================================

    window.formatDate =
        function (value) {

            if (!value) {
                return "Not available";
            }

            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return value;

            }

            return date.toLocaleString();

        };

})();