// The deployed backend. Not a secret - every request from the browser carries it
// anyway - and having a real default means a build that forgot the environment
// variable still works, rather than sending every request to "undefined/auth/login"
// and returning a 404 that points nowhere near the cause.
export const DEFAULT_API_URL = "https://muna-vms-staging.onrender.com";

// NEXT_PUBLIC_* is inlined at build time, not read at runtime, so this is fixed
// when the bundle is built. Local development overrides it in .env.local; the
// default carries production.
//
// In its own module because next.config.ts reads it too, to allow exactly this
// origin in the Content-Security-Policy.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
