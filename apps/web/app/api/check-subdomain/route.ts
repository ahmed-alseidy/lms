import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

interface Subdomain {
  subdomain: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");

  const filePath = path.join(process.cwd(), "subdomains.json");
  const fileData = fs.readFileSync(filePath, "utf8");

  const subdomains: Subdomain[] = JSON.parse(fileData);
  const hasSubdomain = subdomains.some((d) => d.subdomain === subdomain);

  return NextResponse.json(
    {
      hasSubdomain,
    },
    { status: 200 }
  );
}
