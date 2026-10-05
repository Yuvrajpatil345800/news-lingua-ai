const attempts = new Map();

const WINDOW_MS = 15 * 60 * 1000;

// More relaxed during local development.
// Keep the production limit stricter.
const MAX_ATTEMPTS =
  process.env.NODE_ENV === "production"
    ? 10
    : 100;

export const authRateLimit = (req, res, next) => {
  const now = Date.now();

  // Clean expired entries
  if (attempts.size > 10_000) {
    for (const [attemptKey, attempt] of attempts) {
      if (attempt.resetAt <= now) {
        attempts.delete(attemptKey);
      }
    }
  }

  const key =
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";

  const entry = attempts.get(key);

  // First request or window expired
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return next();
  }

  // Rate limit reached
  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil(
      (entry.resetAt - now) / 1000,
    );

    res.setHeader(
      "Retry-After",
      retryAfterSeconds,
    );

    return res.status(429).json({
      success: false,
      message:
        "Too many requests. Please try again later.",
    });
  }

  entry.count += 1;

  return next();
};