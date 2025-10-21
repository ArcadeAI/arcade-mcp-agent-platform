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

- 🔐 **Production-Ready Auth**: Supabase removed, ready for Okta SSO integration
- 🛠️ **100+ Tools via Arcade**: GitHub, Slack, Gmail, Calendar, Linear, and more
- 🔒 **Secure by Design**: Server-side API key management, no client exposure
- ⚡ **Proxy Architecture**: Zero client-side credentials, full request control
- 🎯 **Per-User Authorization**: Arcade handles OAuth flows for each user
- 🏢 **Enterprise SSO Ready**: Built for Okta OIDC integration (Phase 2)

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
- Server-side API key storage (never exposed to browser)
- Per-user tool authorization through Arcade OAuth
- Custom headers for user identification
- Production-ready security architecture

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
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                            │
│  ┌────────────┐    ┌──────────────┐    ┌────────────────────────┐   │
│  │  Chat UI   │    │  Tools UI    │    │  Agent Management      │   │
│  └──────┬─────┘    └──────┬───────┘    └──────────┬─────────────┘   │
│         │                 │                       │                 │
│         │                 │                       │                 │
└─────────┼─────────────────┼───────────────────────┼─────────────────┘
          │                 │                       │
          │                 │                       │
          ▼                 ▼                       ▼
┌────────────────────────────────────────────────────────────────────┐
│                    Next.js Backend (Server)                        │
│                                                                    │
│  ┌──────────────────────┐         ┌─────────────────────────────┐  │
│  │  /api/langgraph/     │         │  /api/oap_mcp               │  │
│  │  proxy/{id}          │         │                             │  │
│  │                      │         │  Injects:                   │  │
│  │  Injects:            │         │  • Authorization: Bearer    │  │
│  │  • LANGSMITH_API_KEY │         │    ${ARCADE_API_KEY}        │  │
│  │  • x-auth-scheme     │         │  • Arcade-User-ID:          │  │
│  └──────────┬───────────┘         │    ${ARCADE_USER_ID}        │  │
│             │                     └─────────────┬───────────────┘  │
└─────────────┼───────────────────────────────────┼──────────────────┘
              │                                   │
              │                                   │
              ▼                                   ▼
┌──────────────────────────┐      ┌──────────────────────────────────┐
│   LangGraph Deployment   │      │      Arcade MCP Gateway          │
│                          │      │                                  │
│  • Local: localhost:2024 │      │  • Handles OAuth flows           │
│  • Cloud: LangSmith      │      │  • Manages tool authorization    │
│  • Custom deployment     │      │  • Executes tools securely       │
│                          │      │  • Returns results               │
│  Graph: chat_agent       │      │                                  │
│  Config: MCP tools, etc. │      │  Tools: GitHub, Slack, Gmail,    │
│                          │      │         Linear, Notion, etc.     │
└──────────────────────────┘      └──────────────────────────────────┘
```

### Data Flow

#### MCP Tool Execution
```
1. User → Agent: "Check my GitHub repos"
2. Agent → LangGraph: Invokes tool
3. LangGraph → OAP Proxy: MCP tool call request
4. OAP Proxy → Arcade: Request + Auth headers
5. Arcade → GitHub: OAuth-authenticated API call
6. GitHub → Arcade → OAP → Agent → User: Results
```

#### Authentication Headers
```bash
# Sent to Arcade on every MCP request
Authorization: Bearer arc_projXXXXXXXXXX
Arcade-User-ID: user@company.com
```

## Quick Start

### Prerequisites

- **Node.js** 18+ and **Yarn**
- **Python** 3.10+ (for LangGraph agent)
- **LangGraph CLI**: `pip install langgraph-cli`
- **Arcade Account**: Sign up at [arcade.dev](https://arcade.dev)
- **LangSmith Account**: Sign up at [smith.langchain.com](https://smith.langchain.com)
- **Anthropic API Key**: Get from [console.anthropic.com](https://console.anthropic.com)

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

### Step 3: Configure OAP

```bash
cd open-agent-platform/apps/web

# Create .env.local from the example
cp .env.example .env.local

# Edit .env.local and set:
# - ARCADE_MCP_GATEWAY_URL (from Arcade dashboard)
# - ARCADE_API_KEY (from Arcade dashboard)
# - ARCADE_USER_ID (your email)
# - NEXT_PUBLIC_DEPLOYMENTS id (assistant ID from Step 2)
# - LANGSMITH_API_KEY (from LangSmith)
```

**Example `.env.local`:**
```bash
NEXT_PUBLIC_BASE_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DEPLOYMENTS='[{"id":"ASSISTANT-ID-HERE","deploymentUrl":"http://localhost:2024","isDefault":true,"defaultGraphId":"chat_agent","name":"Local"}]'
NEXT_PUBLIC_USE_LANGSMITH_AUTH=true
LANGSMITH_API_KEY=lsv2_pt_...
ARCADE_MCP_GATEWAY_URL=https://api.arcade.dev/mcp/your-slug
ARCADE_API_KEY=arc_proj_...
ARCADE_USER_ID=you@company.com
NEXT_PUBLIC_MCP_AUTH_REQUIRED=true
```

### Step 4: Run OAP

```bash
# From project root
yarn install
yarn dev
```

Navigate to `http://localhost:3000`

### Step 5: Create Your First Agent

1. **Browse Tools**: Go to `/tools` → See all Arcade MCP tools available
2. **Create Agent**: Go to `/agents` → Click "Create Agent"
3. **Select Graph**: Choose "Chat Agent" from dropdown
4. **Configure Tools**: Select which tools the agent can access
5. **Name It**: Give your agent a name and description
6. **Start Chatting**: Click into your agent and start a conversation!

## Configuration

### Environment Variables

See `apps/web/.env.example` for the complete template.

#### Essential Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_API_URL` | API base URL (must include `/api`) | `http://localhost:3000/api` |
| `ARCADE_MCP_GATEWAY_URL` | Your Arcade MCP gateway endpoint | `https://api.arcade.dev/mcp/yourslug` |
| `ARCADE_API_KEY` | Arcade project API key (server-side) | `arc_proj_...` |
| `ARCADE_USER_ID` | User email for tool authorization | `user@company.com` |
| `NEXT_PUBLIC_DEPLOYMENTS` | LangGraph deployment configuration | See below |
| `LANGSMITH_API_KEY` | LangSmith API key for proxy auth | `lsv2_pt_...` |

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

#### Current State (Phase 1)

**Mock Authentication:** The application uses a `MockAuthProvider` for testing:
- All users appear as "Test User" (`test@example.com`)
- No actual authentication required
- Single shared `ARCADE_USER_ID` for all users
- Suitable for development and testing only

**Implementation:**
```typescript
// apps/web/src/lib/auth/mock-provider.ts
export class MockAuthProvider implements AuthProvider {
  private mockUser: User = {
    id: "mock-user-id",
    email: "test@example.com",
    displayName: "Test User",
  };
  // ... always returns this user
}
```

#### Planned (Phase 2)

**NextAuth + Okta SSO:**
- Real user authentication via Okta OIDC
- Session management with secure cookies
- Per-user Arcade identification
- Dynamic `Arcade-User-ID` from authenticated user's email

```typescript
// Future implementation
const session = await getServerSession();
headers.set("Arcade-User-ID", session.user.email);
```

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
src/lib/auth/mock-provider.ts        # Mock auth for testing
src/providers/Session.tsx            # Minimal session provider
apps/web/.env.example                # Configuration template
simple-langgraph-agent/              # Example agent
PHASE1-COMPLETE.md                   # Implementation notes
```

**Modified (25+ files):**
```
apps/web/package.json                # Removed Supabase deps
src/app/api/oap_mcp/proxy-request.ts # Arcade header injection
src/hooks/use-mcp.tsx                # Dynamic URL, error handling
src/lib/client.ts                    # Proxy-only mode
src/lib/auth/middleware.ts           # Allow all requests
src/providers/Agents.tsx             # Remove auth dependencies
src/features/chat/providers/Stream.tsx
src/components/sidebar/nav-user.tsx
... and 18 more files
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

### 🚧 Phase 2: In Planning

**NextAuth + Okta SSO Integration**
- Install and configure NextAuth.js
- Implement Okta OIDC provider
- Replace mock provider with real auth
- Dynamic `Arcade-User-ID` from session
- Re-enable RAG functionality
- Update UI components for real user data

### 📋 Phase 3: Future

**Arcade Custom Verifier Service**
- Build verification endpoint for Arcade OAuth
- Deploy as separate service
- Configure in Arcade dashboard
- Enable production-grade tool authorization

**Multi-Deployment Support**
- Support multiple LangGraph deployments
- Cloud + local deployments simultaneously
- Deployment switching in UI

## Security Considerations

### Current Implementation (Development)

⚠️ **Not for production use** - No authentication enabled

**What's Secure:**
- ✅ API keys stored server-side only
- ✅ Proxy pattern prevents credential exposure
- ✅ No tokens sent to browser
- ✅ Environment variable isolation

**What's NOT Secure:**
- ❌ No user authentication
- ❌ Anyone can access the application
- ❌ All users share same Arcade identity
- ❌ No session management

### Production Requirements

Before deploying to production:

1. ✅ Implement NextAuth with Okta SSO (Phase 2)
2. ✅ Build Arcade custom verifier (Phase 3)
3. ✅ Enable per-user tool authorization
4. ✅ Add rate limiting
5. ✅ Enable HTTPS/TLS
6. ✅ Set secure cookie flags
7. ✅ Configure CORS properly
8. ✅ Add audit logging

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

### Custom Verifier (Phase 3)

For production use, Arcade requires a custom verifier endpoint. This will:
- Validate user identity during OAuth flows
- Prevent phishing attacks
- Ensure secure tool authorization

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
