import { NextResponse, type NextRequest } from "next/server";

const demoCookieName = "teamalum_demo_session";

function isBypassedPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/demo") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

async function createDemoToken(password: string, secret: string) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${password}:${secret}`),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const demoPassword = process.env.DEMO_PASSWORD;

  if (!demoPassword || isBypassedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const demoSecret = process.env.DEMO_SESSION_SECRET ?? demoPassword;
  const expectedToken = await createDemoToken(demoPassword, demoSecret);
  const sessionToken = request.cookies.get(demoCookieName)?.value;

  if (sessionToken === expectedToken) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Demo password required." }, { status: 401 });
  }

  const demoUrl = request.nextUrl.clone();
  demoUrl.pathname = "/demo";
  demoUrl.search = "";
  demoUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(demoUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
