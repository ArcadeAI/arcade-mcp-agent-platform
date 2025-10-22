import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

const MCP_SERVER_URL = process.env.ARCADE_MCP_GATEWAY_URL;
const MCP_AUTH_REQUIRED = process.env.NEXT_PUBLIC_MCP_AUTH_REQUIRED === "true";
const ARCADE_API_KEY = process.env.ARCADE_API_KEY;
// Fallback user ID for development (will be replaced by session email in production)
const ARCADE_USER_ID_FALLBACK = process.env.ARCADE_USER_ID;

/**
 * Proxies requests from the client to the MCP server.
 * Extracts the path after '/api/oap_mcp', constructs the target URL,
 * forwards the request with necessary headers and body, and injects
 * the MCP authorization token.
 *
 * @param req The incoming NextRequest.
 * @returns The response from the MCP server.
 */
export async function proxyRequest(req: NextRequest): Promise<Response> {
  if (!MCP_SERVER_URL) {
    return new Response(
      JSON.stringify({
        message:
          "ARCADE_MCP_GATEWAY_URL environment variable is not set. Please set it to the URL of your Arcade MCP Gateway.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // Extract the path after '/api/oap_mcp/'
  // Example: /api/oap_mcp/foo/bar -> /foo/bar
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/oap_mcp/, "");

  // Construct the target URL
  // MCP_SERVER_URL should be the full URL including /mcp/<slug>
  // We just append the additional path if any
  const targetUrlObj = new URL(MCP_SERVER_URL);
  if (path) {
    targetUrlObj.pathname = `${targetUrlObj.pathname}${targetUrlObj.pathname.endsWith("/") ? "" : "/"}${path.startsWith("/") ? path.slice(1) : path}`;
  }
  targetUrlObj.search = url.search;
  const targetUrl = targetUrlObj.toString();

  // Prepare headers, forwarding original headers except Host
  // and adding Authorization
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Some headers like 'host' should not be forwarded
    if (key.toLowerCase() !== "host") {
      headers.append(key, value);
    }
  });

  // Add Arcade-specific headers if auth is required
  if (MCP_AUTH_REQUIRED) {
    if (!ARCADE_API_KEY) {
      return new Response(
        JSON.stringify({
          message: "ARCADE_API_KEY environment variable is not set.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get user email from session, fallback to env var for development
    const session = await auth();
    const userEmail = session?.user?.email || ARCADE_USER_ID_FALLBACK;

    if (!userEmail) {
      return new Response(
        JSON.stringify({
          message:
            "User email not found. Please log in or set ARCADE_USER_ID for development.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    headers.set("Authorization", `Bearer ${ARCADE_API_KEY}`);
    headers.set("Arcade-User-ID", userEmail);
  }

  headers.set("Accept", "application/json, text/event-stream");

  // Determine body based on method
  let body: BodyInit | null | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    // For POST, PUT, PATCH, DELETE etc., forward the body
    body = req.body;
  }

  try {
    // Make the proxied request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });
    // Clone the response to create a new one we can modify
    const responseClone = response.clone();

    // Create a new response with the same status, headers, and body
    let newResponse: NextResponse;

    try {
      // Try to parse as JSON first
      const responseData = await responseClone.json();
      newResponse = NextResponse.json(responseData, {
        status: response.status,
        statusText: response.statusText,
      });
    } catch (_) {
      // If not JSON, use the raw response body
      const responseBody = await response.text();
      newResponse = new NextResponse(responseBody, {
        status: response.status,
        statusText: response.statusText,
      });
    }

    // Copy all headers from the original response
    response.headers.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  } catch (error) {
    console.error("MCP Proxy Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ message: "Proxy request failed", error: errorMessage }),
      {
        status: 502, // Bad Gateway
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
