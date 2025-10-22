import { NextRequest, NextResponse } from "next/server";
import { Arcade } from "@arcadeai/arcadejs";
import { auth } from "@/lib/auth/auth";

/**
 * Arcade Custom Verifier Endpoint
 * 
 * This endpoint is called by Arcade during OAuth flows to verify that the user
 * authorizing a tool is the same user who initiated the authorization.
 * 
 * Flow:
 * 1. User initiates tool authorization in OAP
 * 2. Arcade handles OAuth with the external service (GitHub, Slack, etc.)
 * 3. After OAuth completes, Arcade redirects to this endpoint with flow_id
 * 4. We verify the user's identity by matching session email with flow
 * 5. Arcade completes the authorization and user can use the tool
 * 
 * Security: This prevents phishing by ensuring the authenticated user in OAP
 * is the same person who completed the OAuth flow.
 */

export async function GET(req: NextRequest) {
  try {
    // Get flow_id from query parameters
    const { searchParams } = new URL(req.url);
    const flow_id = searchParams.get("flow_id");

    console.log("Arcade verifier called with flow_id:", flow_id);

    if (!flow_id) {
      console.error("No flow_id provided");
      return NextResponse.json(
        { error: "Missing flow_id parameter" },
        { status: 400 }
      );
    }

    // Get the current user's session
    const session = await auth();
    console.log("Session in verifier:", { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      email: session?.user?.email 
    });

    if (!session?.user?.email) {
      console.error("No session or email found in verifier");
      // User not authenticated - show error instead of redirect
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Required</title>
            <style>
              body { font-family: sans-serif; padding: 2rem; text-align: center; }
              .error { color: #e53e3e; }
            </style>
          </head>
          <body>
            <h1 class="error">Authentication Required</h1>
            <p>Please sign in to OAP first, then try authorizing the tool again.</p>
            <button onclick="window.location.href='/'">Go to OAP</button>
          </body>
        </html>
        `,
        { status: 401, headers: { "Content-Type": "text/html" } }
      );
    }

    // Initialize Arcade client with API key
    const arcade = new Arcade({
      apiKey: process.env.ARCADE_API_KEY,
    });

    // Verify the user's identity with Arcade
    // The user_id must match what was passed when starting the auth flow
    const result = await arcade.auth.confirmUser({
      flow_id,
      user_id: session.user.email, // Use email as user identifier
    });

    console.log("Arcade verification successful:", {
      flow_id,
      user_email: session.user.email,
      auth_id: result.auth_id,
    });

    // Show success page - don't redirect
    // Arcade will handle redirecting the user back to their flow
    // Return success HTML page
    return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 400px;
              }
              .success-icon {
                font-size: 48px;
                margin-bottom: 1rem;
              }
              h1 {
                color: #1a202c;
                margin: 0 0 0.5rem 0;
                font-size: 24px;
              }
              p {
                color: #4a5568;
                margin: 0 0 1.5rem 0;
              }
              button {
                background: #667eea;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
              }
              button:hover {
                background: #5a67d8;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">✓</div>
              <h1>Authorization Successful!</h1>
              <p>You've successfully authorized the tool. You can now close this window and return to your agent.</p>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>
        `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Arcade verification error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
              max-width: 400px;
            }
            .error-icon {
              font-size: 48px;
              margin-bottom: 1rem;
            }
            h1 {
              color: #1a202c;
              margin: 0 0 0.5rem 0;
              font-size: 24px;
            }
            p {
              color: #4a5568;
              margin: 0 0 1.5rem 0;
            }
            .error-details {
              background: #fed7d7;
              color: #742a2a;
              padding: 0.75rem;
              border-radius: 4px;
              font-size: 14px;
              margin-bottom: 1rem;
            }
            button {
              background: #f56565;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover {
              background: #e53e3e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">✗</div>
            <h1>Authorization Failed</h1>
            <p>There was an error verifying your authorization.</p>
            <div class="error-details">${errorMessage}</div>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }
}

