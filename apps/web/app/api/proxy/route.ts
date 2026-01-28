import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return handleProxy(req);
}

export async function POST(req: NextRequest) {
  return handleProxy(req);
}

export async function PUT(req: NextRequest) {
  return handleProxy(req);
}

export async function PATCH(req: NextRequest) {
  return handleProxy(req);
}

export async function DELETE(req: NextRequest) {
  return handleProxy(req);
}

async function handleProxy(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  try {
    const cookieHeader = req.headers.get("cookie") || "";

    const incomingContentType = req.headers.get("content-type") || "";

    // Prepare the request body in a way that Nest/Fastify can parse
    let outgoingBody: BodyInit | undefined = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (incomingContentType.includes("application/json")) {
        // Parse once as JSON and re-stringify to ensure proper JSON body
        try {
          const json = await req.json();
          outgoingBody = JSON.stringify(json);
        } catch {
          outgoingBody = undefined;
        }
      } else {
        // For multipart/form-data, text, etc., just forward the raw bytes
        try {
          const buffer = await req.arrayBuffer();
          outgoingBody = buffer;
        } catch {
          outgoingBody = undefined;
        }
      }
    }

    // Forward the request to the backend
    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        // Preserve original content-type so Nest knows how to parse the body
        "Content-Type": incomingContentType || "application/json",
        Cookie: cookieHeader,
        ...Object.fromEntries(
          Array.from(req.headers.entries()).filter(
            ([key]) =>
              ![
                "host",
                "content-length",
                "cookie",
                "connection",
                "upgrade",
                "sec-fetch-site",
                "sec-fetch-mode",
                "sec-fetch-dest",
                "sec-fetch-user",
                "content-type",
              ].includes(key.toLowerCase())
          )
        ),
      },
      body: outgoingBody,
    });

    // Get response data
    const contentType = backendResponse.headers.get("content-type") || "";
    let responseData: any;

    if (contentType.includes("application/json")) {
      responseData = await backendResponse.json();
    } else {
      responseData = await backendResponse.text();
    }

    // Forward response with proper headers
    const responseHeaders = new Headers();
    responseHeaders.set(
      "Access-Control-Allow-Origin",
      req.headers.get("origin") || "*"
    );
    responseHeaders.set("Access-Control-Allow-Credentials", "true");

    // Copy relevant headers from backend response
    backendResponse.headers.forEach((value, key) => {
      if (
        !["content-encoding", "content-length", "transfer-encoding"].includes(
          key.toLowerCase()
        )
      ) {
        responseHeaders.set(key, value);
      }
    });

    return NextResponse.json(responseData, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Proxy request failed" },
      { status: 500 }
    );
  }
}
