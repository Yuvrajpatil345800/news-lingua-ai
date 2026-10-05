const API_BASE_URL =
  (import.meta.env['VITE_API_URL'] as string) ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "");

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem(
      "news_summarizer_token",
    );

    if (token) {
      headers['Authorization'] =
        `Bearer ${token}`;
    }
  }

  return headers;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      "The application API is not configured.",
    );
  }

  const url =
    `${API_BASE_URL}${endpoint}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "The authentication/news service is unavailable. Please make sure the backend server is running.",
    );
  }

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message ||
        "An unexpected API error occurred.",
    ) as Error & {
      data?: unknown;
    };

    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  /* =====================================================
     SPEECH
  ===================================================== */

  synthesizeSpeech: async (
    text: string,
    language: string,
  ) => {
    const response =
      await fetch(
        `${API_BASE_URL}/api/news/speech`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            text,
            language,
          }),
        },
      );

    if (!response.ok) {
      const data =
        await response
          .json()
          .catch(() => ({}));

      throw new Error(
        data.message ||
          "Failed to generate speech.",
      );
    }

    return response.blob();
  },

  /* =====================================================
     SUMMARIZATION
  ===================================================== */

  summarize: async (params: {
    text?: string;
    url?: string;
    language?: string;
  }) => {
    return apiRequest<{
      success: boolean;
      data: {
        id: string | null;
        title: string;
        summary: string;
        keyPoints: string[];
        sentiment: string;
        category: string;
        url?: string | null;
        language: string;
        createdAt: string;
      };
    }>(
      "/api/news/summarize",
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
  },

  /* =====================================================
     HISTORY
  ===================================================== */

  getHistory: () =>
    apiRequest<{
      success: boolean;
      history: Array<{
        id: string;
        title: string;
        url?: string;
        summary: string;
        key_points?: string[];
        sentiment?: string;
        language?: string;
        created_at: string;
      }>;
    }>("/api/news/history"),

  deleteHistoryItem: (
    id: string,
  ) =>
    apiRequest<{
      success: boolean;
    }>(
      `/api/news/history/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =====================================================
     LOCAL SIGN UP
  ===================================================== */

  signUp: (payload: {
    email: string;
    password: string;
    name?: string;
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      devVerifyToken?: string;
      devVerifyUrl?: string | null;
    }>(
      "/api/auth/signup",
      {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          displayName: payload.name,
        }),
      },
    ),

  /* =====================================================
     LOCAL SIGN IN
  ===================================================== */

  signIn: (payload: {
    email: string;
    password: string;
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      token: string;
      user: {
        id: string;
        email: string;
        name: string;
        username?: string;
        bio?: string;
        is_verified: boolean;
        auth_provider?: string;
      };
    }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  /* =====================================================
     GOOGLE
  ===================================================== */
   signInWithGoogle: (credential: string) =>
  apiRequest<{
    success: boolean;
    message: string;
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      username?: string;
      bio?: string;
      is_verified: boolean;
      auth_provider?: string;
    };
  }>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({
      credential,
    }),
  }),
  
    

  /* =====================================================
     MICROSOFT
  ===================================================== */

  signInWithMicrosoft: (
    idToken: string,
  ) =>
    apiRequest<{
      success: boolean;
      message: string;
      token: string;
      user: {
        id: string;
        email: string;
        name: string;
        username?: string;
        bio?: string;
        is_verified: boolean;
        auth_provider?: string;
      };
    }>(
      "/api/auth/microsoft",
      {
        method: "POST",
        body: JSON.stringify({
          idToken,
        }),
      },
    ),

  /* =====================================================
     EMAIL VERIFICATION
  ===================================================== */

  verifyEmail: (
    payload: { token: string },
  ) =>
    apiRequest<{
      success: boolean;
      message: string;
      token: string;
      user: {
        id: string;
        email: string;
        name: string;
        username?: string;
        bio?: string;
        is_verified: boolean;
        auth_provider?: string;
      };
    }>(
      "/api/auth/verify-email",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  /* =====================================================
     PASSWORD RESET
  ===================================================== */

  requestPasswordReset: (
    payload: { email: string },
  ) =>
    apiRequest<{
      success: boolean;
      message: string;
    }>(
      "/api/auth/password-reset",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  /* =====================================================
     PROFILE
  ===================================================== */

  updateProfile: (payload: {
    username?: string;
    displayName?: string;
    bio?: string;
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      user?: unknown;
    }>(
      "/api/auth/profile",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),

  /* =====================================================
     CURRENT USER
  ===================================================== */

  getMe: () =>
    apiRequest<{
      success: boolean;
      user: {
        id: string;
        email: string;
        name: string;
        username?: string;
        bio?: string;
        is_verified: boolean;
        auth_provider?: string;
      };
    }>("/api/auth/me"),
};