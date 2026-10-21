import { teamAdminHeader, teamAdminPathHeader, teamAdminRoute } from "./lib/team-admin-routing";
import { NextResponse, type NextRequest } from "next/server";
import { resolveClientSlug } from "./lib/client-slugs";

const demoCookieName = "teamalum_demo_session";
import { reservedSubdomains } from "./lib/client-address";
import { studioOrigin } from "./lib/studio-navigation";

function isBypassedPath(pathname: string) {
  return (
    pathname === "/.well-known/teamalum-site" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/hq") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/demo") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

function getTeamAlumSubdomain(hostHeader: string | null) {
  const host = (hostHeader ?? "").split(":")[0].toLowerCase();
  const rootDomain = process.env.TEAMALUM_ROOT_DOMAIN ?? "teamalum.com";

  if (!host.endsWith(`.${rootDomain}`)) {
    return null;
  }

  const subdomain = host.slice(0, -`.${rootDomain}`.length);

  if (!subdomain || reservedSubdomains.has(subdomain)) {
    return null;
  }

  return resolveClientSlug(subdomain);
}

function getClientRewritePath(clientId: string, pathname: string) {
  if (pathname === "/") {
    return `/site/${clientId}`;
  }

  if (pathname === "/join") {
    return `/site/${clientId}/join`;
  }

  if ((pathname === "/membership/success" || pathname === "/success")) {
    return `/site/${clientId}/membership/success`;
  }

  return null;
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

export async function proxy(request: NextRequest) {
  if ((request.nextUrl.pathname === "/studio" || request.nextUrl.pathname.startsWith("/studio/")) && process.env.TEAMALUM_STUDIO_URL) {
    const canonical = studioOrigin(request.url);
    if (canonical !== request.nextUrl.origin) {
      const target = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical);
      if (!["GET", "HEAD"].includes(request.method)) return NextResponse.json({ error: `Open Studio at ${canonical} and sign in before submitting this form.` }, { status: 409 });
      return NextResponse.redirect(target, 307);
    }
  }

  // Never trust a tenant header supplied by the browser, including on legacy routes.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(teamAdminHeader);
  requestHeaders.delete(teamAdminPathHeader);
  const teamAdmin = teamAdminRoute(request.nextUrl.pathname);
  if (teamAdmin) {
    if (!["GET", "HEAD"].includes(request.method) && request.headers.get("origin") !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Submit team changes from your signed-in workspace." }, { status: 403 });
    }
    requestHeaders.set(teamAdminHeader, teamAdmin.clientId);
    requestHeaders.set(teamAdminPathHeader, request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const clientId = getTeamAlumSubdomain(request.headers.get("host"));
  const rewritePath = clientId
    ? getClientRewritePath(clientId, request.nextUrl.pathname)
    : null;

  if (rewritePath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewritePath;

    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  const demoPassword = process.env.DEMO_PASSWORD;

  if (!demoPassword || isBypassedPath(request.nextUrl.pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const demoSecret = process.env.DEMO_SESSION_SECRET ?? demoPassword;
  const expectedToken = await createDemoToken(demoPassword, demoSecret);
  const sessionToken = request.cookies.get(demoCookieName)?.value;

  if (sessionToken === expectedToken) {
    return NextResponse.next({ request: { headers: requestHeaders } });
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
