// jose v6 is ESM-only, so a CommonJS module must load it via dynamic import().
const josePromise = import("jose");

let jwksPromise = null;

function getJwks() {
  if (!jwksPromise) {
    jwksPromise = josePromise.then(({ createRemoteJWKSet }) =>
      createRemoteJWKSet(new URL(process.env.JWKS_URL)),
    );
  }
  return jwksPromise;
}

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is missing.",
      });
    }

    const [{ jwtVerify }, jwks] = await Promise.all([josePromise, getJwks()]);

    const { payload } = await jwtVerify(token, jwks, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid user identity.",
      });
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token.",
    });
  }
};

module.exports = verifyToken;
