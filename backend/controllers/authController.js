import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import {
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify,
} from "jose";

import { isDatabaseConnected } from "../config/database.js";
import { AuthToken } from "../models/AuthToken.js";
import { User } from "../models/User.js";
import { sendAuthEmail } from "../services/emailService.js";

dotenv.config({
  path: [".env", ".env.local", "../.env.local"],
});

const JWT_SECRET = process.env.JWT_SECRET || "";

const FRONTEND_URL = (
  process.env.FRONTEND_URL || "http://localhost:8080"
).replace(/\/$/, "");

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || "";

const MICROSOFT_CLIENT_ID =
  process.env.MICROSOFT_CLIENT_ID || "";

const TOKEN_TTL_MS = 60 * 60 * 1000;

const BCRYPT_ROUNDS = 12;

const googleClient =
  new OAuth2Client(GOOGLE_CLIENT_ID);

/* =========================================================
   MICROSOFT PUBLIC SIGNING KEYS
========================================================= */

const microsoftJWKS =
  createRemoteJWKSet(
    new URL(
      "https://login.microsoftonline.com/common/discovery/v2.0/keys",
    ),
  );

/* =========================================================
   AUTH HELPERS
========================================================= */

const authAvailable = () =>
  isDatabaseConnected() &&
  Boolean(JWT_SECRET);

const unavailable = (res) =>
  res.status(503).json({
    success: false,
    message:
      "Authentication service is unavailable.",
  });

const genericInvalid = (res) =>
  res.status(400).json({
    success: false,
    message: "Invalid request.",
  });

/* =========================================================
   PUBLIC USER
========================================================= */

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.displayName,
  username: user.username,
  bio: user.bio,
  is_verified: user.isVerified,
  auth_provider: user.authProvider,
});

/* =========================================================
   JWT SESSION
========================================================= */

const issueSession = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.displayName,
      is_verified: user.isVerified,
    },
    JWT_SECRET,
    {
      expiresIn: "30d",
    },
  );

/* =========================================================
   TOKEN HELPERS
========================================================= */

const hashToken = (token) =>
  crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

const createOneTimeToken = async (
  userId,
  type,
) => {
  await AuthToken.deleteMany({
    userId,
    type,
  });

  const token =
    crypto.randomBytes(32).toString("hex");

  await AuthToken.create({
    userId,
    type,
    tokenHash: hashToken(token),
    expiresAt: new Date(
      Date.now() + TOKEN_TTL_MS,
    ),
  });

  return token;
};

/* =========================================================
   SEND AUTH EMAIL
========================================================= */

const sendTokenEmail = async (
  user,
  type,
) => {
  const token =
    await createOneTimeToken(
      user.id,
      type,
    );

  const query =
    type === "email-verification"
      ? "verify_token"
      : "reset_token";

  await sendAuthEmail({
    toEmail: user.email,
    displayName: user.displayName,

    actionUrl:
      `${FRONTEND_URL}/?${query}=${token}`,

    actionLabel:
      type === "email-verification"
        ? "Verify email"
        : "Reset password",

    purpose:
      type === "email-verification"
        ? "verify your email address"
        : "reset your password",
  });

  return token;
};

/* =========================================================
   EMAIL / PASSWORD SIGN UP
========================================================= */

export const signUp = async (
  req,
  res,
) => {
  if (!authAvailable()) {
    return unavailable(res);
  }

  const {
    email,
    password,
    username,
    displayName,
  } = req.validatedBody;

  try {
    const existing =
      await User.findOne({
        $or: [
          { email },
          ...(username
            ? [{ username }]
            : []),
        ],
      }).lean();

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "An account with this email is already registered. Please sign in instead.",
      });
    }

    const user =
      await User.create({
        email,

        passwordHash:
          await bcrypt.hash(
            password,
            BCRYPT_ROUNDS,
          ),

        username,

        displayName:
          displayName ||
          username ||
          email.split("@")[0],

        authProvider: "local",

        isVerified: false,
      });

    let verifyToken = null;

    try {
      verifyToken =
        await createOneTimeToken(
          user.id,
          "email-verification",
        );

      const verifyUrl =
        `${FRONTEND_URL}/?verify_token=${verifyToken}`;

      await sendAuthEmail({
        toEmail: user.email,
        displayName: user.displayName,
        actionUrl: verifyUrl,
        actionLabel: "Verify email",
        purpose:
          "verify your email address",
      });
    } catch (error) {
      console.warn(
        "Email send warning:",
        error.message,
      );
    }

    const devVerifyUrl =
      verifyToken
        ? `${FRONTEND_URL}/?verify_token=${verifyToken}`
        : null;

    return res.status(201).json({
      success: true,

      message:
        "Account created! Please verify your email address to sign in.",

      devVerifyToken: verifyToken,

      devVerifyUrl,
    });
  } catch (error) {
    console.error(
      "Signup Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process signup. Please check your details.",
    });
  }
};

/* =========================================================
   EMAIL / PASSWORD SIGN IN
========================================================= */

export const signIn = async (
  req,
  res,
) => {
  if (!authAvailable()) {
    return unavailable(res);
  }

  try {
    const {
      email,
      password,
    } = req.validatedBody;

    const user =
      await User.findOne({
        email,
      }).select("+passwordHash");

    if (
      !user ||
      user.authProvider !== "local" ||
      !user.isVerified ||
      !(await bcrypt.compare(
        password,
        user.passwordHash,
      ))
    ) {
      return genericInvalid(res);
    }

    user.lastLoginAt =
      new Date();

    await user.save();

    return res.json({
      success: true,
      message:
        "Signed in successfully.",

      token: issueSession(user),

      user: toPublicUser(user),
    });
  } catch (error) {
    console.error(
      "Login Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process login.",
    });
  }
};

/* =========================================================
   GOOGLE SIGN IN

   FLOW:

   First Google login:
   Google → Create account → Send verification email
   → NO JWT

   Later Google login:
   Google → Existing verified account → JWT
========================================================= */

export const googleAuth = async (
  req,
  res,
) => {
  if (!authAvailable()) {
    return unavailable(res);
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      success: false,
      message:
        "Google authentication is not configured on the server.",
    });
  }

  try {
    const { credential } =
      req.body;

    /* -----------------------------------------------------
       VALIDATE CREDENTIAL
    ----------------------------------------------------- */

    if (
      !credential ||
      typeof credential !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Google credential is required.",
      });
    }

    /* -----------------------------------------------------
       VERIFY GOOGLE TOKEN
    ----------------------------------------------------- */

    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          GOOGLE_CLIENT_ID,
      });

    const payload =
      ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid Google credential.",
      });
    }

    const googleId =
      payload.sub;

    const email =
      payload.email
        ?.trim()
        .toLowerCase();

    const name =
      payload.name ||
      email?.split("@")[0] ||
      "Google User";

    /* -----------------------------------------------------
       GOOGLE MUST HAVE VERIFIED EMAIL
    ----------------------------------------------------- */

    if (
      !googleId ||
      !email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Google account could not be verified.",
      });
    }

    /* -----------------------------------------------------
       FIND USER BY GOOGLE ID
    ----------------------------------------------------- */

    let user =
      await User.findOne({
        googleId,
      });

    /* -----------------------------------------------------
       IF NOT FOUND, CHECK EMAIL
    ----------------------------------------------------- */

    if (!user) {
      user =
        await User.findOne({
          email,
        });
    }

    /* =====================================================
       FIRST TIME GOOGLE USER
    ===================================================== */

    if (!user) {
      user =
        await User.create({
          email,

          passwordHash:
            await bcrypt.hash(
              crypto.randomBytes(32).toString(
                "hex",
              ),
              BCRYPT_ROUNDS,
            ),

          displayName: name,

          googleId,

          authProvider: "google",

          /*
           * IMPORTANT
           *
           * First Google login is NOT
           * automatically verified.
           */
          isVerified: false,

          lastLoginAt:
            new Date(),
        });

      /* ---------------------------------------------------
         SEND VERIFICATION EMAIL
      --------------------------------------------------- */

      let verifyToken =
        null;

      try {
        verifyToken =
          await createOneTimeToken(
            user.id,
            "email-verification",
          );

        const verifyUrl =
          `${FRONTEND_URL}/?verify_token=${verifyToken}`;

        await sendAuthEmail({
          toEmail: user.email,

          displayName:
            user.displayName,

          actionUrl:
            verifyUrl,

          actionLabel:
            "Verify email",

          purpose:
            "verify your email address",
        });

        console.log(
          `Google verification email sent to ${user.email}`,
        );
      } catch (error) {
        console.warn(
          "Google verification email warning:",
          error.message,
        );
      }

      /* ---------------------------------------------------
         DEVELOPMENT VERIFICATION URL
      --------------------------------------------------- */

      const devVerifyUrl =
        verifyToken
          ? `${FRONTEND_URL}/?verify_token=${verifyToken}`
          : null;

      /*
       * IMPORTANT:
       *
       * Do NOT issue JWT here.
       */

      return res.status(403).json({
        success: false,

        requiresVerification: true,

        message:
          "Google account created. Please verify your email before continuing.",

        email: user.email,

        devVerifyUrl,
      });
    }

    /* =====================================================
       EXISTING GOOGLE USER
    ===================================================== */

    user.googleId =
      googleId;

    /*
     * DO NOT automatically set:
     *
     * user.isVerified = true
     *
     * because our application requires
     * email verification.
     */

    /* -----------------------------------------------------
       EXISTING USER BUT NOT VERIFIED
    ----------------------------------------------------- */

    if (!user.isVerified) {
      let verifyToken =
        null;

      try {
        verifyToken =
          await createOneTimeToken(
            user.id,
            "email-verification",
          );

        const verifyUrl =
          `${FRONTEND_URL}/?verify_token=${verifyToken}`;

        await sendAuthEmail({
          toEmail: user.email,

          displayName:
            user.displayName || name,

          actionUrl:
            verifyUrl,

          actionLabel:
            "Verify email",

          purpose:
            "verify your email address",
        });
      } catch (error) {
        console.warn(
          "Google verification resend warning:",
          error.message,
        );
      }

      const devVerifyUrl =
        verifyToken
          ? `${FRONTEND_URL}/?verify_token=${verifyToken}`
          : null;

      return res.status(403).json({
        success: false,

        requiresVerification: true,

        message:
          "Please verify your email before signing in.",

        email: user.email,

        devVerifyUrl,
      });
    }

    /* =====================================================
       EXISTING VERIFIED USER
    ===================================================== */

    user.lastLoginAt =
      new Date();

    if (!user.displayName) {
      user.displayName =
        name;
    }

    /*
     * If this is an existing local account,
     * keep local as the primary provider.
     */
    if (
      user.authProvider !==
      "local"
    ) {
      user.authProvider =
        "google";
    }

    await user.save();

    /* -----------------------------------------------------
       LOGIN DIRECTLY
    ----------------------------------------------------- */

    return res.json({
      success: true,

      message:
        "Signed in with Google successfully.",

      token:
        issueSession(user),

      user:
        toPublicUser(user),
    });
  } catch (error) {
    console.error(
      "Google Authentication Error:",
      error,
    );

    return res.status(401).json({
      success: false,
      message:
        "Unable to authenticate with Google.",
    });
  }
};

/* =========================================================
   MICROSOFT SIGN IN
========================================================= */

export const microsoftAuth = async (
  req,
  res,
) => {
  if (!authAvailable()) {
    return unavailable(res);
  }

  if (!MICROSOFT_CLIENT_ID) {
    return res.status(503).json({
      success: false,
      message:
        "Microsoft authentication is not configured on the server.",
    });
  }

  try {
    const { idToken } =
      req.body;

    if (
      !idToken ||
      typeof idToken !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Microsoft ID token is required.",
      });
    }

    /* -----------------------------------------------------
       DECODE ONLY TO DISCOVER TENANT
    ----------------------------------------------------- */

    const unverified =
      decodeJwt(idToken);

    const tenantId =
      String(
        unverified.tid || "",
      );

    const tenantGuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      !tenantGuid.test(
        tenantId,
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid Microsoft tenant.",
      });
    }

    const expectedIssuer =
      `https://login.microsoftonline.com/${tenantId}/v2.0`;

    const { payload } =
      await jwtVerify(
        idToken,
        microsoftJWKS,
        {
          audience:
            MICROSOFT_CLIENT_ID,

          issuer:
            expectedIssuer,

          algorithms: ["RS256"],
        },
      );

    const microsoftId =
      payload.sub ||
      payload.oid;

    const email =
      String(
        payload.email ||
          payload.preferred_username ||
          "",
      )
        .trim()
        .toLowerCase();

    const name =
      String(
        payload.name ||
          email.split("@")[0] ||
          "Microsoft User",
      ).trim();

    if (
      !microsoftId ||
      !email
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Microsoft account information is incomplete.",
      });
    }

    let user =
      await User.findOne({
        microsoftId,
      });

    if (!user) {
      user =
        await User.findOne({
          email,
        });
    }

    if (!user) {
      user =
        await User.create({
          email,

          passwordHash:
            await bcrypt.hash(
              crypto.randomBytes(
                32,
              ).toString("hex"),
              BCRYPT_ROUNDS,
            ),

          displayName: name,

          microsoftId,

          authProvider:
            "microsoft",

          isVerified: true,

          lastLoginAt:
            new Date(),
        });
    } else {
      user.microsoftId =
        microsoftId;

      user.isVerified =
        true;

      user.lastLoginAt =
        new Date();

      if (
        user.authProvider !==
        "local"
      ) {
        user.authProvider =
          "microsoft";
      }

      if (!user.displayName) {
        user.displayName =
          name;
      }

      await user.save();
    }

    return res.json({
      success: true,

      message:
        "Signed in with Microsoft successfully.",

      token:
        issueSession(user),

      user:
        toPublicUser(user),
    });
  } catch (error) {
    console.error(
      "Microsoft Authentication Error:",
      error,
    );

    return res.status(401).json({
      success: false,
      message:
        "Unable to authenticate with Microsoft.",
    });
  }
};

/* =========================================================
   EMAIL VERIFICATION
========================================================= */

export const verifyEmail = async (
  req,
  res,
) => {
  if (!authAvailable()) {
    return unavailable(res);
  }

  try {
    const record =
      await AuthToken.findOneAndDelete({
        tokenHash:
          hashToken(
            req.validatedBody.token,
          ),

        type:
          "email-verification",

        expiresAt: {
          $gt: new Date(),
        },
      });

    if (!record) {
      return genericInvalid(res);
    }

    const user =
      await User.findByIdAndUpdate(
        record.userId,
        {
          isVerified: true,

          lastLoginAt:
            new Date(),
        },
        {
          new: true,
        },
      );

    if (!user) {
      return genericInvalid(res);
    }

    return res.json({
      success: true,

      message:
        "Email verified.",

      token:
        issueSession(user),

      user:
        toPublicUser(user),
    });
  } catch (error) {
    console.error(
      "Email Verification Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process email verification.",
    });
  }
};

/* =========================================================
   PASSWORD RESET REQUEST
========================================================= */

export const requestPasswordReset =
  async (req, res) => {
    if (!authAvailable()) {
      return unavailable(res);
    }

    try {
      const user =
        await User.findOne({
          email:
            req.validatedBody.email,
        });

      if (user) {
        await sendTokenEmail(
          user,
          "password-reset",
        );
      }

      return res.json({
        success: true,

        message:
          "If an account exists, reset instructions will be sent.",
      });
    } catch (error) {
      console.error(
        "Password Reset Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process request.",
      });
    }
  };

/* =========================================================
   PASSWORD RESET CONFIRM
========================================================= */

export const confirmPasswordReset =
  async (req, res) => {
    if (!authAvailable()) {
      return unavailable(res);
    }

    try {
      const {
        token,
        password,
      } = req.validatedBody;

      const record =
        await AuthToken.findOneAndDelete({
          tokenHash:
            hashToken(token),

          type:
            "password-reset",

          expiresAt: {
            $gt: new Date(),
          },
        });

      if (!record) {
        return genericInvalid(res);
      }

      const user =
        await User.findByIdAndUpdate(
          record.userId,
          {
            passwordHash:
              await bcrypt.hash(
                password,
                BCRYPT_ROUNDS,
              ),

            authProvider:
              "local",
          },
          {
            new: true,
          },
        );

      if (!user) {
        return genericInvalid(res);
      }

      return res.json({
        success: true,
        message:
          "Password updated.",
      });
    } catch (error) {
      console.error(
        "Password Reset Confirmation Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process request.",
      });
    }
  };

/* =========================================================
   PROFILE
========================================================= */

export const updateProfile = async (
  req,
  res,
) => {
  if (!authAvailable()) {
    return unavailable(res);
  }

  try {
    const {
      username,
      displayName,
      bio,
    } = req.validatedBody;

    const update =
      Object.fromEntries(
        Object.entries({
          username,
          displayName,
          bio,
        }).filter(
          ([, value]) =>
            value !== undefined,
        ),
      );

    const user =
      await User.findByIdAndUpdate(
        req.user.id,
        update,
        {
          new: true,
          runValidators: true,
        },
      );

    if (!user) {
      return genericInvalid(res);
    }

    return res.json({
      success: true,

      message:
        "Profile updated.",

      user:
        toPublicUser(user),
    });
  } catch (error) {
    if (
      error?.code === 11000
    ) {
      return res.status(400).json({
        success: false,

        message:
          "That username is already in use.",
      });
    }

    console.error(
      "Profile Update Error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to update profile.",
    });
  }
};

/* =========================================================
   CURRENT USER
========================================================= */

export const getMe = async (
  req,
  res,
) => {
  if (!authAvailable()) {
    return unavailable(res);
  }

  try {
    const user =
      await User.findById(
        req.user.id,
      );

    if (!user) {
      return res.status(401).json({
        success: false,

        message:
          "Invalid or expired session token. Please sign in again.",
      });
    }

    return res.json({
      success: true,

      user:
        toPublicUser(user),
    });
  } catch (error) {
    console.error(
      "Get profile Error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load your profile.",
    });
  }
};