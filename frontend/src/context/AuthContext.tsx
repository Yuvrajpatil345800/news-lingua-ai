import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";
import { api } from "@/services/api";

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  bio?: string;
  is_verified?: boolean;
  auth_provider?: string;
}

export type AuthMode = "signin" | "signup";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  isAuthModalOpen: boolean;
  authMode: AuthMode;

  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;

  signIn: (
    email: string,
    password: string,
  ) => Promise<boolean>;

  signInWithGoogle: (
    credential: string,
  ) => Promise<boolean>;

  signInWithMicrosoft: (
    idToken: string,
  ) => Promise<boolean>;

  signUp: (payload: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<boolean>;

  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isAuthModalOpen,
    setIsAuthModalOpen,
  ] = useState(false);

  const [authMode, setAuthMode] =
    useState<AuthMode>("signin");

  /* =====================================================
     APPLY SESSION
  ===================================================== */

  const applySession = (
    nextToken: string | null,
    nextUser: User | null,
  ) => {
    setToken(nextToken);
    setUser(nextUser);

    if (!nextToken || !nextUser) {
      localStorage.removeItem(
        "news_summarizer_token",
      );

      localStorage.removeItem(
        "news_summarizer_user",
      );

      return;
    }

    localStorage.setItem(
      "news_summarizer_token",
      nextToken,
    );

    localStorage.setItem(
      "news_summarizer_user",
      JSON.stringify(nextUser),
    );
  };

  /* =====================================================
     RESTORE SESSION
  ===================================================== */

  useEffect(() => {
    const initialize = async () => {
      const params =
        new URLSearchParams(
          window.location.search,
        );

      const verificationToken =
        params.get("verify_token");

      try {
        /* EMAIL VERIFICATION */

        if (verificationToken) {
          const response =
            await api.verifyEmail({
              token: verificationToken,
            });

          applySession(
            response.token,
            response.user,
          );

          window.history.replaceState(
            {},
            "",
            window.location.pathname,
          );

          toast.success(
            "Email verified. You are signed in.",
          );

          return;
        }

        /* RESTORE SAVED LOGIN */

        const savedToken =
          localStorage.getItem(
            "news_summarizer_token",
          );

        if (!savedToken) {
          return;
        }

        const response =
          await api.getMe();

        applySession(
          savedToken,
          response.user,
        );
      } catch {
        applySession(null, null);
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, []);

  /* =====================================================
     EMAIL SIGN IN
  ===================================================== */

  const signIn = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response =
        await api.signIn({
          email:
            email.trim().toLowerCase(),
          password,
        });

      applySession(
        response.token,
        response.user,
      );

      setIsAuthModalOpen(false);

      toast.success(
        "Welcome back! You are signed in.",
      );

      return true;
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Unable to sign in. Please check your details.",
      );

      return false;
    }
  };

  /* =====================================================
     GOOGLE SIGN IN
  ===================================================== */

const signInWithGoogle = async (
  credential: string,
): Promise<boolean> => {
  try {
    if (!credential) {
      throw new Error(
        "Google authentication credential is missing.",
      );
    }

    const response =
      await api.signInWithGoogle(credential);

    /*
     * NEW GOOGLE ACCOUNT
     *
     * Backend has created the account but the email
     * still needs to be verified.
     */
    if (
      "requiresEmailVerification" in response &&
      response.requiresEmailVerification
    ) {
      toast.success(
        "Account created with Google. Please verify your email before continuing.",
        {
          duration: 8000,
        },
      );

      return true;
    }

    /*
     * EXISTING / VERIFIED GOOGLE ACCOUNT
     *
     * Normal login.
     */
    if (
      response.token &&
      response.user
    ) {
      applySession(
        response.token,
        response.user,
      );

      setIsAuthModalOpen(false);

      toast.success(
        "Signed in with Google successfully!",
      );

      return true;
    }

    throw new Error(
      "Google authentication response was incomplete.",
    );
  } catch (error: any) {
    console.error(
      "Google authentication error:",
      error,
    );

    toast.error(
      error?.message ||
        "Unable to sign in with Google.",
    );

    return false;
  }
};
  /* =====================================================
     MICROSOFT SIGN IN
  ===================================================== */

  const signInWithMicrosoft = async (
    idToken: string,
  ): Promise<boolean> => {
    try {
      const response =
        await api.signInWithMicrosoft(
          idToken,
        );

      applySession(
        response.token,
        response.user,
      );

      setIsAuthModalOpen(false);

      toast.success(
        "Signed in with Microsoft successfully!",
      );

      return true;
    } catch (error: any) {
      console.error(
        "Microsoft authentication error:",
        error,
      );

      toast.error(
        error?.message ||
          "Unable to sign in with Microsoft.",
      );

      return false;
    }
  };

  /* =====================================================
     SIGN UP
  ===================================================== */

  const signUp = async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name?: string;
  }): Promise<boolean> => {
    try {
      const response =
        await api.signUp({
          email:
            email.trim().toLowerCase(),
          password,
          ...(name?.trim()
            ? {
                name: name.trim(),
              }
            : {}),
        });

      if (response.devVerifyUrl) {
        toast.success(
          "Account created! Verify your email.",
          {
            action: {
              label: "Verify Now",
              onClick: () => {
                window.location.href =
                  response.devVerifyUrl!;
              },
            },
            duration: 10000,
          },
        );
      } else {
        toast.success(
          response.message ||
            "Account created! Check your email.",
        );
      }

      setAuthMode("signin");

      return true;
    } catch (error: any) {
      console.error(
        "Sign up error:",
        error,
      );

      toast.error(
        error?.message ||
          "Unable to create account.",
      );

      return false;
    }
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = async (): Promise<void> => {
    applySession(null, null);

    toast.info(
      "Signed out successfully.",
    );
  };

  /* =====================================================
     PROVIDER
  ===================================================== */

  return (
    <AuthContext.Provider
      value={{
        user,
        token,

        isAuthenticated:
          Boolean(user && token),

        isLoading,

        isAuthModalOpen,
        authMode,

        openAuthModal: (
          mode: AuthMode = "signin",
        ) => {
          setAuthMode(mode);
          setIsAuthModalOpen(true);
        },

        closeAuthModal: () =>
          setIsAuthModalOpen(false),

        signIn,
        signInWithGoogle,
        signInWithMicrosoft,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =====================================================
   HOOK
===================================================== */

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }

  return context;
};