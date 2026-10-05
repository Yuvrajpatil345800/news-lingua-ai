import { z } from "zod";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_BYTES = 72; // bcrypt only uses the first 72 bytes.
const MAX_USERNAME_LENGTH = 32;
const MAX_DISPLAY_NAME_LENGTH = 80;
const MAX_BIO_LENGTH = 500;

const emailDomainIsValid = (email) => {
  const [, domain = ""] = email.split("@");
  if (domain.length > 253 || !domain.includes(".")) return false;
  const labels = domain.split(".");
  const tld = labels.at(-1);
  return (
    tld.length >= 2 &&
    tld.length <= 63 &&
    /^[a-z]{2,63}$/i.test(tld) &&
    labels.every((label) =>
      label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    )
  );
};

const sanitizePlainText = (value) =>
  value
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(MAX_EMAIL_LENGTH)
  .email()
  .refine(emailDomainIsValid);

const password = z
  .string()
  .min(8)
  .refine((value) => Buffer.byteLength(value, "utf8") <= MAX_PASSWORD_BYTES)
  .refine((value) => /[A-Z]/.test(value))
  .refine((value) => /[a-z]/.test(value))
  .refine((value) => /\d/.test(value))
  .refine((value) => /[^A-Za-z0-9]/.test(value));

const username = z.string().trim().min(1).max(MAX_USERNAME_LENGTH).regex(/^[A-Za-z0-9_-]+$/);
const displayName = z
  .string()
  .transform(sanitizePlainText)
  .pipe(z.string().min(1).max(MAX_DISPLAY_NAME_LENGTH));
const bio = z.string().transform(sanitizePlainText).pipe(z.string().max(MAX_BIO_LENGTH));

export const signupSchema = z
  .object({ email, password, username: username.optional(), displayName: displayName.optional(), name: displayName.optional() })
  .strict()
  .transform(({ name, displayName, ...value }) => ({ ...value, displayName: displayName || name }));

export const loginSchema = z.object({ email, password }).strict();
export const passwordResetSchema = z.object({ email }).strict();
export const passwordResetConfirmSchema = z.object({ token: z.string().min(1).max(256), password }).strict();
export const profileUpdateSchema = z
  .object({ username: username.optional(), displayName: displayName.optional(), bio: bio.optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
export const magicLinkSchema = z
  .object({ email, name: displayName.optional(), displayName: displayName.optional() })
  .strict()
  .transform(({ name, displayName, ...value }) => ({ ...value, displayName: displayName || name }));
export const verificationSchema = z.object({ token: z.string().min(1).max(256) }).strict();

// The response intentionally does not reveal which validation rule failed.
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: "Invalid request." });
  }
  req.validatedBody = result.data;
  next();
};
