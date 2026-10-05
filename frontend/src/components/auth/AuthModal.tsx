import React, { useState } from "react";

import { GoogleLogin } from "@react-oauth/google";

import { useAuth } from "@/context/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  CheckCircle2,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";

import { toast } from "sonner";

import {
  PublicClientApplication,
  type Configuration,
} from "@azure/msal-browser";

/* =========================================================
   MICROSOFT CONFIGURATION
========================================================= */

const MICROSOFT_CLIENT_ID =
  import.meta.env["VITE_MICROSOFT_CLIENT_ID"] as
    | string
    | undefined;

const isBrowser = typeof window !== "undefined";

const REDIRECT_URI = isBrowser
  ? `${window.location.origin}/redirect.html`
  : "/redirect.html";

const POST_LOGOUT_REDIRECT_URI = isBrowser
  ? window.location.origin
  : "/";

const msalConfig: Configuration = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID || "",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};
const msalInstance = new PublicClientApplication(msalConfig);

let msalInitialized = false;

async function loginWithMicrosoft() {
  if (!MICROSOFT_CLIENT_ID) {
    throw new Error(
      "Microsoft authentication is not configured. Add VITE_MICROSOFT_CLIENT_ID to frontend/.env.local.",
    );
  }

  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;
  }

 const result = await msalInstance.loginPopup({
  scopes: ["openid", "profile", "email"],
  redirectUri: REDIRECT_URI,
});

  return result.idToken;
}

/* =========================================================
   AUTH MODAL
========================================================= */

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    openAuthModal,
    signIn,
    signInWithGoogle,
    signInWithMicrosoft,
    signUp,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [socialSubmitting, setSocialSubmitting] = useState<
    "google" | "microsoft" | null
  >(null);

  const isSignUp = authMode === "signup";

  /* =========================================================
     EMAIL LOGIN / SIGNUP
  ========================================================= */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSubmitting(true);

    try {
      if (isSignUp) {
        await signUp({
          email: email.trim(),
          password,
          name: name.trim(),
        });
      } else {
        await signIn(email.trim(), password);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    if (!credentialResponse.credential) {
      toast.error("Google authentication failed. No credential received.");
      return;
    }

    setSocialSubmitting("google");

    try {
      /*
       * Send the REAL Google ID token to our backend.
       *
       * The backend will verify this token with Google
       * before creating/signing in the MongoDB user.
       */
      await signInWithGoogle(credentialResponse.credential);
    } catch (error: any) {
      console.error("Google login error:", error);

      toast.error(
        error?.message || "Unable to sign in with Google.",
      );
    } finally {
      setSocialSubmitting(null);
    }
  };

  /* =========================================================
     MICROSOFT LOGIN
  ========================================================= */

  const handleMicrosoft = async () => {
    setSocialSubmitting("microsoft");

    try {
      const idToken = await loginWithMicrosoft();

      await signInWithMicrosoft(idToken);
    } catch (error: any) {
      console.error("Microsoft login error:", error);

      toast.error(
        error?.message || "Unable to sign in with Microsoft.",
      );
    } finally {
      setSocialSubmitting(null);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Dialog
      open={isAuthModalOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeAuthModal();
        }
      }}
    >
      <DialogContent className="sm:max-w-[460px] overflow-hidden border border-border/80 bg-card p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {isSignUp
              ? "Create an AI News Summarizer Account"
              : "Sign in to AI News Summarizer"}
          </DialogTitle>
        </DialogHeader>

        {/* =================================================
            SOCIAL AUTH
        ================================================= */}

        <div className="grid grid-cols-2 gap-3 pt-2">

          {/* GOOGLE */}

          <div className="flex min-h-11 items-center justify-center overflow-hidden">
            {import.meta.env['VITE_GOOGLE_CLIENT_ID'] ? (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast.error(
                      "Google authentication failed.",
                    );
                  }}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text={isSignUp ? "signup_with" : "signin_with"}
                  shape="rectangular"
                  width="210"
                  auto_select={false}
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled
                className="h-11 w-full rounded-xl"
              >
                Google not configured
              </Button>
            )}
          </div>

          {/* MICROSOFT */}

          <Button
            type="button"
            variant="outline"
            disabled={socialSubmitting !== null}
            onClick={handleMicrosoft}
            className="h-11 border border-border/90 bg-background hover:bg-muted/60 text-foreground font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
          >
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 23 23"
            >
              <path
                fill="#f35325"
                d="M1 1h10v10H1z"
              />
              <path
                fill="#81bc06"
                d="M12 1h10v10H12z"
              />
              <path
                fill="#05a6f0"
                d="M1 12h10v10H1z"
              />
              <path
                fill="#ffba08"
                d="M12 12h10v10H12z"
              />
            </svg>

            {socialSubmitting === "microsoft"
              ? "Connecting..."
              : "Sign in with Microsoft"}
          </Button>
        </div>

        {/* GOOGLE LOADING */}

        {socialSubmitting === "google" && (
          <p className="text-center text-xs text-muted-foreground">
            Verifying your Google account...
          </p>
        )}

        {/* DIVIDER */}

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/70" />
          </div>

          <div className="relative bg-card px-3 text-xs text-muted-foreground font-medium">
            Or continue with AI News Summarizer Account
          </div>
        </div>

        {/* =================================================
            EMAIL FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* NAME */}

          {isSignUp && (
            <div className="space-y-1.5">
              <Label
                htmlFor="auth-name"
                className="text-xs font-semibold"
              >
                Full Name
              </Label>

              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  id="auth-name"
                  className="pl-9 h-11 border-border/90 bg-background rounded-xl"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your name"
                  maxLength={80}
                  required
                />
              </div>
            </div>
          )}

          {/* EMAIL */}

          <div className="space-y-1.5">
            <Label
              htmlFor="auth-email"
              className="text-xs font-semibold"
            >
              Email
            </Label>

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />

              <Input
                id="auth-email"
                type="email"
                className="pl-9 h-11 border-border/90 bg-background rounded-xl text-sm"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                maxLength={254}
                required
              />
            </div>
          </div>

          {/* PASSWORD */}

          <div className="space-y-1.5">
            <Label
              htmlFor="auth-password"
              className="text-xs font-semibold"
            >
              Password
            </Label>

            <div className="relative">
              <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />

              <Input
                id="auth-password"
                type="password"
                className="pl-9 h-11 border-border/90 bg-background rounded-xl text-sm"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••••••••••"
                minLength={6}
                maxLength={128}
                required
              />
            </div>

            {!isSignUp && (
              <div className="text-right pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      "Password reset instructions will be sent to your email.",
                    )
                  }
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>

          {/* SECURITY CARD */}

          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />

              <span className="text-xs font-semibold">
                Secure authentication
              </span>
            </div>

            <span className="text-[11px] text-muted-foreground">
              Protected
            </span>
          </div>

          {/* ACTION BUTTONS */}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={closeAuthModal}
              className="h-11 rounded-xl border-border/90 font-semibold"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                submitting ||
                socialSubmitting !== null ||
                !email.trim() ||
                password.length < 6
              }
              className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {submitting
                ? "Please wait..."
                : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
            </Button>
          </div>

          {/* FOOTER */}

          <p className="text-center text-xs text-muted-foreground pt-2">
            {isSignUp
              ? "Already have an account?"
              : "Need an AI News Summarizer account?"}{" "}

            <button
              type="button"
              className="font-bold text-primary hover:underline"
              onClick={() =>
                openAuthModal(
                  isSignUp ? "signin" : "signup",
                )
              }
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}