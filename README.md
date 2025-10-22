# Open Agent Platform + Arcade MCP

> A production-ready agent management platform powered by LangChain's Open Agent Platform and Arcade's MCP Gateway

<div align="center">

**🤖 LangGraph Agents** • **🔧 Arcade MCP Tools** • **🚀 Enterprise Ready**

[Quick Start](#quick-start) • [Architecture](#architecture) • [Configuration](#configuration) • [Documentation](#documentation)

</div>

---

## Overview

This is a customized implementation of [LangChain's Open Agent Platform](https://github.com/langchain-ai/open-agent-platform) integrated with [Arcade.dev's MCP Gateway](https://arcade.dev) for secure, scalable tool access. The platform provides a modern web interface for creating, managing, and interacting with LangGraph agents that can access 100+ external tools through Arcade's production-grade MCP infrastructure.

### What Makes This Special

- 🔐 **Multi-Provider SSO**: Okta, Microsoft Entra ID, and PingID - choose your identity provider
- 🛠️ **100+ Tools via Arcade**: GitHub, Slack, Gmail, Calendar, Linear, and more
- 🔒 **Custom Verifier**: Production-ready OAuth security with user verification
- ⚡ **Proxy Architecture**: Zero client-side credentials, full request control
- 🎯 **True Multi-User**: Per-user tool authorization with session-based identity
- 🏢 **Enterprise Ready**: Complete SSO integration with phishing and session hijacking protection

## Key Features

### ✨ Agent Management
Build and configure LangGraph agents through an intuitive web interface. No code required for agent deployment and configuration.

### 🔧 Arcade MCP Integration
Access Arcade's entire tool ecosystem:
- **Productivity**: Gmail, Google Calendar, Outlook, Notion, Asana
- **Developer Tools**: GitHub, Jira, Linear
- **Communication**: Slack, Microsoft Teams, Discord
- **And 100+ more...**

### 🔐 Secure Tool Authorization
- **Custom Verifier Endpoint**: Validates user identity during OAuth flows
- **Server-side API keys**: Never exposed to browser
- **Per-user OAuth**: Each user authorizes tools with their own accounts
- **Phishing/Session Hijacking Protection**: Ensures session user matches authorizing user
- **Multi-user Isolation**: Users cannot access each other's tool authorizations
- **Production-ready**: Implements [Arcade's security requirements](https://docs.arcade.dev/en/home/auth/secure-auth-production)

### 💬 Advanced Chat Interface
- Real-time streaming responses
- Tool execution visualization
- Multi-modal support (text, images, files)
- Thread history and management

### 🎨 No-Code Configuration
- Visual tool selection interface
- Agent configuration through UI forms
- Model selection and parameter tuning
- MCP server configuration

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                             │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │  Chat UI   │    │  Tools UI    │    │  Agent Management        │  │
│  └──────┬─────┘    └──────┬───────┘    └──────────┬───────────────┘  │
│         │                 │                       │                  │
│         └─────────────────┴───────────────────────┘                  │
│                           │                                          │
│                 User authenticated via:                              │
│                 Okta / Entra ID / PingID                             │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Next.js Backend (Server) + NextAuth                     │
│                                                                      │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│  │ /api/auth/          │  │ Session Mgmt     │  │ /api/arcade/   │  │
│  │ [..nextauth]        │  │ (JWT Cookies)    │  │ verify         │  │
│  │                     │  │                  │  │                │  │
│  │ • Okta OIDC        │  │ Gets user email  │  │ Custom         │  │
│  │ • Entra ID OIDC    │  │ from session     │  │ Verifier       │  │
│  │ • PingID OIDC      │  │                  │  │ (Phase 3)      │  │
│  └─────────────────────┘  └────────┬─────────┘  └────────┬───────┘  │
│                                    │                     │          │
│  ┌─────────────────────┐  ┌────────▼──────────┐          │          │
│  │ /api/langgraph/     │  │ /api/oap_mcp      │◄─────────┘          │
│  │ proxy/{id}          │  │                   │  (on OAuth redirect) │
│  │                     │  │ Gets session:     │                     │
│  │ Injects:            │  │ user.email        │                     │
│  │ • LANGSMITH_API_KEY │  │                   │                     │
│  │ • x-auth-scheme     │  │ Injects:          │                     │
│  └──────────┬──────────┘  │ • Authorization:  │                     │
│             │             │   Bearer ${KEY}   │                     │
│             │             │ • Arcade-User-ID: │                     │
│             │             │   ${session.email}│                     │
│             │             └─────────┬─────────┘                     │
└─────────────┼───────────────────────┼───────────────────────────────┘
              │                       │
              ▼                       ▼
┌───────────────────────┐   ┌─────────────────────────────────────────┐
│  LangGraph Deployment │   │      Arcade MCP Gateway                 │
│                       │   │                                         │
│  • localhost:2024     │   │  1. Receives tool call with             │
│  • LangSmith Cloud    │   │     Arcade-User-ID: user@company.com    │
│                       │   │  2. User needs GitHub OAuth?            │
│  Executes agents with │   │  3. Redirects to GitHub                 │
│  configured MCP tools │   │  4. User authorizes                     │
│                       │   │  5. Redirects to /api/arcade/verify     │
│                       │   │  6. Verifier confirms user identity     │
│                       │   │  7. Tool authorized for this user       │
│                       │   │  8. Executes with user's OAuth token    │
└───────────────────────┘   └─────────────────────────────────────────┘
```

### Data Flow

#### User Authentication & Session Flow (Phase 2)
```
1. User visits OAP → Unauthenticated
2. Middleware checks session → None found
3. Redirect to SSO login page (Okta/Entra/Ping)
4. User authenticates with corporate SSO
5. SSO redirects to /api/auth/callback/{provider}
6. NextAuth validates OAuth code & creates JWT session
7. Session cookie stored (httpOnly, secure)
8. User redirected to OAP → Authenticated
9. All subsequent requests include session cookie
```

#### MCP Tool Execution with Multi-User Auth (Phases 2 & 3)
```
1. User A (alice@company.com) → Agent: "Check my GitHub repos"
2. Agent → LangGraph: Invokes GitHub tool
3. LangGraph → OAP /api/oap_mcp
4. OAP extracts session: alice@company.com
5. OAP → Arcade with headers:
   • Authorization: Bearer ${ARCADE_API_KEY}
   • Arcade-User-ID: alice@company.com
6. Arcade checks: Does alice@company.com have GitHub OAuth?
   
   If NO:
   7a. Arcade → User's browser: GitHub OAuth page
   7b. User authorizes with THEIR GitHub account
   7c. GitHub → Arcade with auth code
   7d. Arcade → OAP Custom Verifier: /api/arcade/verify?flow_id=xxx
   7e. Verifier gets session email: alice@company.com
   7f. Verifier → Arcade: confirmUser(flow_id, alice@company.com)
   7g. Arcade validates identity match ✓
   7h. Tool authorized for alice@company.com
   
   If YES:
   7. Use existing OAuth token
   
8. Arcade → GitHub API with alice@company.com's token
9. GitHub returns Alice's repos
10. Arcade → OAP → Agent → User: Alice sees HER repos

// Meanwhile, User B (bob@company.com) has separate auth
// Bob's tools use BOB's GitHub account, completely isolated
```

#### Dynamic Headers (Multi-User)
```typescript
// Sent to Arcade on every MCP request - dynamically per user
Authorization: Bearer arc_proj... // Same for all (project key)
Arcade-User-ID: alice@company.com  // Different per user from session!
```

## Quick Start

### Prerequisites

- **Node.js** 18+ and **Yarn**
- **Python** 3.10+ (for LangGraph agent)
- **LangGraph CLI**: `pip install langgraph-cli`
- **Arcade Account**: Sign up at [arcade.dev](https://arcade.dev)
- **LangSmith Account**: Sign up at [smith.langchain.com](https://smith.langchain.com)
- **Anthropic API Key**: Get from [console.anthropic.com](https://console.anthropic.com)
- **SSO Provider** (choose one): Okta, Microsoft Entra ID, or PingID account

### Step 1: Set Up Arcade MCP Gateway

1. **Create an Arcade account** at [arcade.dev](https://arcade.dev)
2. **Get your API key** from the Arcade dashboard
3. **Note your MCP gateway URL**: `https://api.arcade.dev/mcp/<your-slug>`
4. **Configure tools** you want to use (GitHub, Slack, etc.)

### Step 2: Create a LangGraph Agent

```bash
# Use the example agent included
cd simple-langgraph-agent

# Install dependencies
pip install -r requirements.txt

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Start the LangGraph server
langgraph dev --port 2024
```

When the server starts, **note the assistant ID** shown in the output or LangSmith Studio URL.

### Step 3: Configure SSO Provider

Choose one (or more) identity providers:

**Option A: Okta**
```bash
# In Okta Dashboard, create OIDC Web App
# Redirect URI: http://localhost:3000/api/auth/callback/okta
# Copy: Client ID, Client Secret, Issuer
```

**Option B: Microsoft Entra ID**
```bash
# In Azure Portal, create App Registration
# Redirect URI: http://localhost:3000/api/auth/callback/entra-id
# Copy: Application ID, Client Secret, Tenant ID
```

**Option C: PingID**
```bash
# In PingOne Console, create OIDC Web App
# Redirect URI: http://localhost:3000/api/auth/callback/ping
# Copy: Client ID, Client Secret, Issuer URL
```

### Step 4: Configure OAP

```bash
cd open-agent-platform/apps/web
cp .env.example .env.local

# Generate NextAuth secret
openssl rand -base64 32

# Edit .env.local with ALL required values:
```

**Complete `.env.local` Example:**
```bash
# Base & NextAuth
NEXT_PUBLIC_BASE_API_URL=http://localhost:3000/api
NEXTAUTH_SECRET=<output-from-openssl>
NEXTAUTH_URL=http://localhost:3000

# SSO Provider (at least one)
PING_CLIENT_ID=<from-ping>
PING_CLIENT_SECRET=<from-ping>
PING_ISSUER=https://auth.pingone.com/{env-id}/as

# LangGraph
NEXT_PUBLIC_DEPLOYMENTS='[{"id":"<ASSISTANT-ID>","deploymentUrl":"http://localhost:2024","isDefault":true,"defaultGraphId":"chat_agent","name":"Local"}]'
NEXT_PUBLIC_USE_LANGSMITH_AUTH=true
LANGSMITH_API_KEY=lsv2_pt_...

# Arcade
ARCADE_MCP_GATEWAY_URL=https://api.arcade.dev/mcp/your-slug
ARCADE_API_KEY=arc_proj_...
NEXT_PUBLIC_MCP_AUTH_REQUIRED=true

# Optional fallback (only for dev without SSO)
# ARCADE_USER_ID=dev@example.com
```

### Step 5: Run OAP

```bash
# From project root
yarn install
yarn dev
```

Navigate to `http://localhost:3000`

### Step 6: Authenticate & Create Agent

1. **Sign In**: Click user menu → Choose your SSO provider → Authenticate
2. **Browse Tools**: Go to `/tools` → See all 1000+ Arcade MCP tools
3. **Create Agent**: Go to `/agents` → Click "Create Agent"
4. **Select Graph**: Choose "Chat Agent" from dropdown
5. **Configure MCP Tools**: Select which tools the agent can access
6. **Name & Create**: Give your agent a name and description
7. **Start Chatting**: Click into your agent and start a conversation!

### Step 7: (Optional) Configure Custom Verifier for Production

For production multi-user OAuth security:

1. Deploy OAP to a public URL or use ngrok
2. Go to **Arcade Dashboard** → Auth → Settings
3. Select **"Custom verifier"**
4. Enter verifier URL: `https://your-domain.com/api/arcade/verify`
5. Save and test tool authorization flow

See [PHASE3-COMPLETE.md](docs) for detailed verifier setup.

## Configuration

### Environment Variables

See `apps/web/.env.example` for the complete template with detailed instructions.

#### Core Variables (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_API_URL` | API base URL (must include `/api`) | `http://localhost:3000/api` |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application base URL | `http://localhost:3000` |

#### SSO Providers (Configure at least ONE)

| Variable | Provider | Description |
|----------|----------|-------------|
| `OKTA_CLIENT_ID`<br>`OKTA_CLIENT_SECRET`<br>`OKTA_ISSUER` | Okta | Okta OIDC application credentials |
| `ENTRA_CLIENT_ID`<br>`ENTRA_CLIENT_SECRET`<br>`ENTRA_TENANT_ID` | Microsoft | Azure AD/Entra ID app registration |
| `PING_CLIENT_ID`<br>`PING_CLIENT_SECRET`<br>`PING_ISSUER` | PingID | Ping Identity OIDC application |

#### Arcade MCP (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `ARCADE_MCP_GATEWAY_URL` | Your Arcade MCP gateway URL | `https://api.arcade.dev/mcp/yourslug` |
| `ARCADE_API_KEY` | Arcade project API key (server-side only) | `arc_proj_...` |
| `ARCADE_USER_ID` | **Optional** fallback for dev without SSO | `dev@example.com` |
| `NEXT_PUBLIC_MCP_AUTH_REQUIRED` | Enable MCP authentication | `true` |

#### LangGraph (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_DEPLOYMENTS` | LangGraph deployment config (JSON) | See below |
| `LANGSMITH_API_KEY` | LangSmith API key for proxy auth | `lsv2_pt_...` |
| `NEXT_PUBLIC_USE_LANGSMITH_AUTH` | Enable proxy mode | `true` |

#### LangGraph Deployments Configuration

The `NEXT_PUBLIC_DEPLOYMENTS` is a JSON array. **Important:** The `id` field must be the **assistant ID**, not a random UUID.

```json
[{
  "id": "LANGGRAPH_ASSISTANT_ID_HERE",            // Assistant ID from langgraph dev
  "deploymentUrl": "http://localhost:2024",       // Where LangGraph is running
  "isDefault": true,                              // Whether this is the default
  "defaultGraphId": "chat_agent",                 // Graph ID from langgraph.json
  "name": "Local Development"                     // Display name
}]
```

To find your assistant ID:
```bash
# Start your LangGraph agent
langgraph dev --port 2024

# Look for the assistant ID in the LangSmith Studio URL, or:
curl http://localhost:2024/assistants/search | jq
```

## How It Works

### Arcade MCP Integration

#### Server-Side Proxy Pattern

All MCP requests are proxied through the Next.js backend to protect API keys:

```typescript
// Browser makes request to local endpoint
const client = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/api/oap_mcp")
);

// Server proxies to Arcade with auth headers
headers.set("Authorization", `Bearer ${ARCADE_API_KEY}`);
headers.set("Arcade-User-ID", ${ARCADE_USER_ID});

// Request forwarded to Arcade
fetch("https://api.arcade.dev/mcp/yourslug", { headers });
```

#### Per-User Tool Authorization

Arcade handles OAuth for each tool:
1. User authorizes a tool (e.g., GitHub) through Arcade's OAuth flow
2. Arcade stores the authorization linked to the user's email
3. When tool is called, `Arcade-User-ID` header identifies which user
4. Arcade uses that user's OAuth tokens to execute the tool
5. Results returned to agent

This means each user can have their own GitHub/Slack/etc. authorizations.

### Authentication Architecture

#### Current Implementation (Phase 2)

**NextAuth + Multi-Provider SSO:** Production-ready authentication supporting multiple enterprise identity providers:

**Supported Providers:**
- **Okta** - Enterprise SSO platform
- **Microsoft Entra ID** (formerly Azure AD) - Microsoft's identity platform
- **PingID** - Ping Identity SSO solution

**Development Mode** (`NODE_ENV=development`):
- Authentication optional - allows testing without SSO
- Falls back to `ARCADE_USER_ID` from environment
- Sign in buttons available but not required
- Fully backward compatible with Phase 1

**Production Mode** (`NODE_ENV=production`):
- SSO required for access (any configured provider)
- Users authenticate with their corporate identity provider
- Per-user Arcade tool authorization
- Session managed via secure JWT cookies

**Implementation:**
```typescript
// apps/web/src/lib/auth/auth.ts - Dynamic provider configuration
const getProviders = () => {
  const providers = [];
  
  // Okta
  if (process.env.OKTA_CLIENT_ID && process.env.OKTA_ISSUER) {
    providers.push({ id: "okta", type: "oidc", ... });
  }
  
  // Microsoft Entra ID
  if (process.env.ENTRA_CLIENT_ID && process.env.ENTRA_TENANT_ID) {
    providers.push({ id: "entra-id", type: "oidc", ... });
  }
  
  // PingID
  if (process.env.PING_CLIENT_ID && process.env.PING_ISSUER) {
    providers.push({ id: "ping", type: "oidc", ... });
  }
  
  return providers;
};

// apps/web/src/app/api/oap_mcp/proxy-request.ts  
// Multi-user support - each user's email from their SSO session
const session = await auth();
const userEmail = session?.user?.email || ARCADE_USER_ID_FALLBACK;
headers.set("Arcade-User-ID", userEmail);
```

**Benefits:**
- **Multi-provider flexibility** - Choose your enterprise SSO provider
- **Per-user tool access** - Each user has their own Arcade OAuth authorizations
- **Secure** - Email from validated JWT session, not client input
- **Zero-config defaults** - Only configure the provider(s) you need
- **Enterprise-ready** - Standard OIDC protocol, works with any OIDC provider

### LangGraph Proxy Mode

All LangGraph requests use server-side authentication:

```typescript
// Client creates SDK client pointing to proxy
const client = new Client({
  apiUrl: "http://localhost:3000/api/langgraph/proxy/{deploymentId}",
  defaultHeaders: { "x-auth-scheme": "langsmith" }
});

// Server uses LangSmith API key (never exposed to client)
const headers = {
  "Authorization": `Bearer ${LANGSMITH_API_KEY}`,
  "x-auth-scheme": "langsmith"
};
```

Benefits:
- No client-side credentials
- Centralized auth management
- Easy to rotate API keys
- Compatible with enterprise security policies

## Project Structure

```
open-agent-platform/
├── apps/
│   ├── web/                          # Main Next.js application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (app)/            # Main app routes
│   │   │   │   │   ├── agents/       # Agent management
│   │   │   │   │   ├── tools/        # Tool browser & playground
│   │   │   │   │   └── layout.tsx    # Root layout with providers
│   │   │   │   └── api/
│   │   │   │       ├── oap_mcp/      # 🎯 Arcade MCP proxy
│   │   │   │       │   ├── route.ts
│   │   │   │       │   └── proxy-request.ts  # Header injection
│   │   │   │       └── langgraph/
│   │   │   │           ├── proxy/    # LangGraph proxy
│   │   │   │           └── defaults/ # Default assistants
│   │   │   ├── components/           # Reusable UI components
│   │   │   ├── features/             # Feature modules
│   │   │   │   ├── agents/           # Agent CRUD operations
│   │   │   │   ├── chat/             # Chat interface
│   │   │   │   └── tools/            # Tool management
│   │   │   ├── hooks/
│   │   │   │   ├── use-mcp.tsx       # 🎯 MCP client hook
│   │   │   │   └── use-agents.tsx    # Agent operations
│   │   │   ├── lib/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── types.ts      # Auth interfaces
│   │   │   │   │   ├── mock-provider.ts  # 🎯 Mock auth
│   │   │   │   │   └── middleware.ts # Request middleware
│   │   │   │   └── client.ts         # LangGraph SDK factory
│   │   │   └── providers/
│   │   │       ├── Session.tsx       # 🎯 Session context
│   │   │       ├── MCP.tsx           # 🎯 MCP context
│   │   │       └── Agents.tsx        # Agents context
│   │   └── .env.example              # 🎯 Configuration template
│   └── docs/                         # Documentation site
│
├── simple-langgraph-agent/           # 🎯 Example agent for testing
│   ├── agent.py                      # Minimal agent with MCP support
│   ├── langgraph.json               # LangGraph configuration
│   └── requirements.txt
│
├── PHASE1-COMPLETE.md                # 🎯 Phase 1 implementation notes
└── README.md                         # This file

🎯 = Modified/created for Arcade integration
```

## Development

### Running Locally

**Terminal 1 - LangGraph Agent:**
```bash
cd simple-langgraph-agent
langgraph dev --port 2024
```

**Terminal 2 - OAP Frontend:**
```bash
cd open-agent-platform
yarn dev
```

**Access:**
- OAP: `http://localhost:3000`
- LangGraph Studio: `http://localhost:2024` (or via LangSmith)

### Testing MCP Tools

Browse and test Arcade tools without creating an agent:

```bash
# Open in browser
http://localhost:3000/tools          # Browse all available tools
http://localhost:3000/tools/playground  # Test tool execution
```

### Creating Agents

1. Ensure LangGraph agent is running
2. Go to `/agents` in OAP
3. Click "Create Agent"
4. Select graph from dropdown
5. Configure MCP tools
6. Create and start chatting!

## Implementation Details

### Changes from Original OAP

#### Removed
- ❌ All Supabase authentication code
- ❌ Auth UI pages (signin, signup, password reset)
- ❌ User management features
- ❌ Supabase SDK dependencies (`@supabase/ssr`, `@supabase/supabase-js`)

#### Added
- ✅ Arcade MCP Gateway integration
- ✅ Custom header injection for Arcade auth
- ✅ Mock authentication provider
- ✅ Environment variable rename: `ARCADE_MCP_GATEWAY_URL`
- ✅ Enhanced documentation

#### Modified
- 🔄 Middleware: Allow all requests (no auth checks)
- 🔄 MCP Proxy: Inject Arcade-specific headers
- 🔄 Client Creation: Enforce proxy-only mode
- 🔄 All components: Remove session/token dependencies
- 🔄 RAG: Temporarily stubbed out

### Files Modified (Summary)

**Deleted (15+ files):**
```
src/lib/auth/supabase.ts
src/lib/auth/supabase-client.ts
src/providers/Auth.tsx
src/app/(auth)/          # Entire directory
src/features/signin/
src/features/signup/
src/features/forgot-password/
src/features/reset-password/
src/app/debug-auth/
src/components/auth/
```

**Created:**
```
# Phase 1: Core Infrastructure
src/lib/auth/mock-provider.ts        # Mock auth for testing
src/providers/Session.tsx            # Session provider (now uses NextAuth)
apps/web/.env.example                # Configuration template
simple-langgraph-agent/              # Example LangGraph agent

# Phase 2: Multi-Provider Authentication
src/lib/auth/auth.ts                 # NextAuth config with 3 providers
src/lib/auth/providers.ts            # Provider utilities
src/app/api/auth/[...nextauth]/      # NextAuth API routes

# Phase 3: Custom Verifier
src/app/api/arcade/verify/           # Arcade custom verifier endpoint
```

**Modified (30+ files):**
```
# Core Changes
apps/web/package.json                # Removed Supabase, added NextAuth + Arcade SDK
src/app/api/oap_mcp/proxy-request.ts # Dynamic Arcade-User-ID from session
src/hooks/use-mcp.tsx                # Protocol 2025-06-18 support
src/lib/client.ts                    # Proxy-only mode
src/lib/auth/middleware.ts           # NextAuth session validation
src/components/sidebar/nav-user.tsx  # Multi-provider sign-in UI
src/providers/Agents.tsx             # Removed session dependencies
src/providers/Session.tsx            # NextAuth integration
src/app/(app)/layout.tsx             # NextAuthSessionProvider wrapper

# 25+ more files updated
```

## Troubleshooting

### Tools Not Loading

**Symptom:** `/tools` page is empty or shows "No tools available"

**Solutions:**
1. Verify `ARCADE_MCP_GATEWAY_URL` is correct (check Arcade dashboard)
2. Confirm `ARCADE_API_KEY` is valid
3. Ensure `ARCADE_USER_ID` matches your Arcade account email
4. Check browser console for errors
5. Look for terminal logs: `MCP Proxy: Forwarding request to...`

**Common Issues:**
- Protocol version mismatch → Upgrade MCP SDK: `yarn add @modelcontextprotocol/sdk@latest`
- 404 errors → Check URL doesn't have double `/mcp/mcp/`
- 401/403 errors → Verify API key and user ID

### Graph Dropdown Empty

**Symptom:** "Create Agent" dialog shows no graphs

**Solutions:**
1. Ensure LangGraph agent is running: `curl http://localhost:2024/ok`
2. Verify `NEXT_PUBLIC_DEPLOYMENTS` `id` is the **assistant ID** (not random UUID)
3. Check `NEXT_PUBLIC_BASE_API_URL` includes `/api` suffix
4. Restart OAP after env changes
5. Check browser console for "Deployment not found" errors

**Finding Assistant ID:**
```bash
# From LangSmith Studio URL, or:
curl http://localhost:2024/assistants/search | jq '.[0].assistant_id'
```

### 404 Errors on LangGraph Routes

**Symptom:** Requests to `/langgraph/...` return 404

**Solution:** Add `/api` to `NEXT_PUBLIC_BASE_API_URL`:
```bash
# Wrong:
NEXT_PUBLIC_BASE_API_URL=http://localhost:3000

# Correct:
NEXT_PUBLIC_BASE_API_URL=http://localhost:3000/api
```

### MCP Protocol Version Error

**Symptom:** `Server's protocol version is not supported: 2025-06-18`

**Solution:** Update MCP SDK:
```bash
cd apps/web
yarn add @modelcontextprotocol/sdk@latest
```

## Current Status & Roadmap

### ✅ Phase 1: Complete

- Supabase authentication removed
- Arcade MCP Gateway integrated
- Proxy-only architecture implemented
- Mock auth provider for testing
- Full agent + tool functionality working

### ✅ Phase 2: Complete

**NextAuth + Multi-Provider SSO Integration**
- ✅ NextAuth.js v5 installed and configured
- ✅ **Three enterprise identity providers:**
  - Okta OIDC with PKCE
  - Microsoft Entra ID (Azure AD)
  - PingID with Ping Identity
- ✅ Dynamic provider detection (zero-config)
- ✅ Real authentication with JWT session management
- ✅ Dynamic `Arcade-User-ID` from authenticated user email
- ✅ Development mode fallback (backward compatible)
- ✅ Multi-provider sign-in UI
- ✅ Production auth enforcement via middleware

### ✅ Phase 3: Complete

**Arcade Custom Verifier**
- ✅ Custom verifier endpoint at `/api/arcade/verify`
- ✅ Arcade SDK integration for `confirmUser` API
- ✅ Session-based user identity validation
- ✅ Phishing attack prevention
- ✅ Multi-user OAuth isolation
- ✅ Production-ready security implementation
- ✅ Styled success/error pages
- ✅ Comprehensive error handling

### 📋 Future Enhancements

**RAG Re-implementation**
- Restore RAG functionality with NextAuth integration
- Per-user document collections
- Authenticated vector store access

**Multi-Deployment Support**
- Multiple LangGraph deployments simultaneously
- Cloud + local deployment mixing
- Deployment selection UI

## Security & Production Readiness

### Production-Ready Features ✅

**Authentication & Authorization:**
- ✅ Multi-provider SSO (Okta, Entra ID, PingID)
- ✅ NextAuth session management with JWT
- ✅ Arcade Custom Verifier for OAuth security
- ✅ Per-user tool authorization
- ✅ Phishing attack prevention
- ✅ Server-side API key storage

**Architecture Security:**
- ✅ Proxy pattern prevents credential exposure
- ✅ No client-side tokens or secrets
- ✅ Session-based user identification
- ✅ Multi-user OAuth isolation
- ✅ HTTPS-ready (configure in production)

### Deployment Modes

**Development Mode** (`NODE_ENV=development`):
- Authentication optional
- Fallback to `ARCADE_USER_ID` env var
- Great for local testing
- All features functional

**Production Mode** (`NODE_ENV=production`):
- SSO required (configure at least one provider)
- Per-user authentication and tool access
- Custom verifier active
- Session validation enforced

### Pre-Production Checklist

Before going live:

1. ✅ **Auth**: NextAuth with SSO configured (Phases 2 & 3 complete)
2. ✅ **Verifier**: Custom verifier implemented and tested
3. ✅ **Multi-user**: Per-user tool authorization working
4. ⚠️ **HTTPS/TLS**: Required for production OAuth (configure on hosting)
5. ⚠️ **Domain**: Real domain needed (ngrok for testing)
6. ⚠️ **Rate Limiting**: Add if needed for your use case
7. ⚠️ **Monitoring**: Set up logging/alerting
8. ⚠️ **Backup**: Configure data persistence strategy

## Arcade MCP Reference

### Supported Tool Categories

- **Productivity**: Gmail, Google Calendar, Outlook, Notion, Asana, ClickUp
- **Developer**: GitHub, GitLab, Jira, Linear
- **Communication**: Slack, Microsoft Teams, Discord, Zoom
- **CRM**: Salesforce, HubSpot
- **Storage**: Google Drive, Dropbox, Box
- **Social**: LinkedIn, Twitter/X, Reddit
- **And many more...**

Full list: [docs.arcade.dev/en/mcp-servers](https://docs.arcade.dev/en/mcp-servers)

### Custom Verifier Implementation

The platform includes a production-ready custom verifier for secure multi-user OAuth:

**Endpoint**: `/api/arcade/verify`

**How it Works:**
1. User initiates tool authorization (e.g., GitHub)
2. Arcade handles OAuth with external service
3. After OAuth, Arcade redirects to verifier with `flow_id`
4. Verifier extracts user email from NextAuth session
5. Calls `arcade.auth.confirmUser(flow_id, user_email)`
6. Arcade validates user identity matches the flow
7. Tool authorization completed securely

**Security Benefits:**
- ✅ Prevents phishing attacks
- ✅ Validates session user = OAuth user
- ✅ Multi-user isolation enforced
- ✅ Cannot authorize tools for other users

**Configuration:**
- Development: Use Arcade's default verifier
- Testing: Configure ngrok URL in Arcade Dashboard
- Production: Configure production domain in Arcade Dashboard

Documentation: [Arcade Custom Verifier](https://docs.arcade.dev/en/home/auth/secure-auth-production)

## Related Projects

- **LangChain Open Agent Platform**: [github.com/langchain-ai/open-agent-platform](https://github.com/langchain-ai/open-agent-platform)
- **Arcade MCP**: [arcade.dev](https://arcade.dev)

- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)

## License

See [LICENSE](LICENSE) file for details.

## Acknowledgments

- **LangChain** for the Open Agent Platform foundation
- **Arcade.dev** for the MCP Gateway infrastructure and tool ecosystem

---

<div align="center">

**Built with** [LangGraph](https://github.com/langchain-ai/langgraph) • [Arcade MCP](https://arcade.dev) • [Next.js](https://nextjs.org)

</div>
