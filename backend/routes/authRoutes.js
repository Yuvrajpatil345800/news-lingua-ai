import express from "express";

import {
  verifyEmail,
  getMe,
  signUp,
  signIn,
  requestPasswordReset,
  confirmPasswordReset,
  updateProfile,
  googleAuth,
  microsoftAuth,
} from "../controllers/authController.js";

import { requireAuth } from "../middleware/authMiddleware.js";
import { authRateLimit } from "../middleware/authRateLimit.js";

import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetSchema,
  profileUpdateSchema,
  signupSchema,
  validateBody,
  verificationSchema,
} from "../middleware/authValidation.js";

const router = express.Router();

router.use(authRateLimit);

router.post(
  "/signup",
  validateBody(signupSchema),
  signUp,
);

router.post(
  "/login",
  validateBody(loginSchema),
  signIn,
);

router.post(
  "/google",
  googleAuth,
);

router.post(
  "/microsoft",
  microsoftAuth,
);

router.post(
  "/password-reset",
  validateBody(passwordResetSchema),
  requestPasswordReset,
);

router.post(
  "/password-reset/confirm",
  validateBody(passwordResetConfirmSchema),
  confirmPasswordReset,
);

router.patch(
  "/profile",
  requireAuth,
  validateBody(profileUpdateSchema),
  updateProfile,
);

router.post(
  "/verify-email",
  validateBody(verificationSchema),
  verifyEmail,
);

router.get(
  "/me",
  requireAuth,
  getMe,
);

export default router;