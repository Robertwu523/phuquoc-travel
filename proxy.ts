import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 renamed "middleware" to "proxy". The handler signature is
// unchanged, so we can expose next-intl's middleware under the proxy name.
export const proxy = createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
