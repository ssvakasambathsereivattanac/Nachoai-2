
const config = require("../config");
const { runWithUser } = require("./user-context");

async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Please log in to use NachoAI."
        });
    }

    if (!config.supabaseUrl || !config.supabasePublishableKey) {
        return res.status(503).json({
            error: "Supabase authentication is not configured."
        });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            error: "Your login session is invalid."
        });
    }

    try {
        const response = await fetch(
            `${config.supabaseUrl}/auth/v1/user`,
            {
                headers: {
                    apikey: config.supabasePublishableKey,
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 401 || response.status === 403) {
            return res.status(401).json({
                error: "Your session expired. Please log in again."
            });
        }

        if (!response.ok) {
            console.error(
                "Supabase verification failed:",
                response.status
            );

            return res.status(503).json({
                error: "Could not verify your login."
            });
        }

        const user = await response.json();

        if (!user.id) {
            return res.status(401).json({
                error: "Invalid user account."
            });
        }

        req.user = {
            id: user.id,
            email: user.email
        };

        return runWithUser(req.user, () => next());

    } catch (error) {
        console.error("Authentication error:", error.message);

        return res.status(503).json({
            error: "Authentication service unavailable."
        });
    }
}

module.exports = requireAuth;
