import { NextResponse } from "next/server";
import subdomains from "./subdomains.json";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};

export default async function middleware(req: Request) {
  const url = new URL(req.url);
  const hostname = req.headers.get("host") || "";

  const allowedDomains = ["localhost:3000"];

  const isAllowedDomain = allowedDomains.some(
    (domain) => hostname === domain
    // hostname.includes(domain)
  );
  const subdomain = hostname.split(".")[0];

  if (subdomain === "www" || hostname === "example.com") {
    return NextResponse.next();
  }

  if (
    isAllowedDomain &&
    !subdomains.some((item) => item.subdomain === subdomain)
  ) {
    return NextResponse.next();
  }

  const subdomainData = subdomains.find((d) => d.subdomain === subdomain);
  if (subdomainData) {
    const newUrl = new URL(`/${subdomain}${url.pathname}`, req.url);
    return NextResponse.rewrite(newUrl);
  }

  return new Response(null, { status: 404 });
}
