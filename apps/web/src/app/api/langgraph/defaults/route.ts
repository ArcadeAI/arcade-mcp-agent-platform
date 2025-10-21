import { NextRequest } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import { getDeployments } from "@/lib/environment/deployments";

/**
 * Creates a client for a specific deployment using LangSmith auth
 */
function createServerClient(deploymentId: string) {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  // Always use LangSmith auth in proxy mode
  const client = new Client({
    apiUrl: deployment.deploymentUrl,
    apiKey: process.env.LANGSMITH_API_KEY,
    defaultHeaders: {
      "x-auth-scheme": "langsmith",
    },
  });
  return client;
}

/**
 * Gets or creates default assistants for a deployment
 */
async function getOrCreateDefaultAssistants(deploymentId: string) {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  const client = createServerClient(deploymentId);

  const [systemDefaultAssistants, userDefaultAssistants] = await Promise.all([
    client.assistants.search({
      limit: 100,
      metadata: {
        created_by: "system",
      },
    }),
    client.assistants.search({
      limit: 100,
      metadata: {
        _x_oap_is_default: true,
      },
    }),
  ]);

  if (!systemDefaultAssistants.length) {
    throw new Error("Failed to find default system assistants.");
  }

  if (systemDefaultAssistants.length === userDefaultAssistants.length) {
    // User has already created all default assistants.
    return userDefaultAssistants;
  }

  // Find all assistants which are created by the system, but do not have a corresponding user defined default assistant.
  const missingDefaultAssistants = systemDefaultAssistants.filter(
    (assistant) =>
      !userDefaultAssistants.some((a) => a.graph_id === assistant.graph_id),
  );

  // Create default assistants for missing graphs
  const newUserDefaultAssistantsPromise = missingDefaultAssistants.map(
    async (assistant) => {
      const isDefaultDeploymentAndGraph =
        deployment.isDefault &&
        deployment.defaultGraphId === assistant.graph_id;
      return await client.assistants.create({
        graphId: assistant.graph_id,
        name: `${isDefaultDeploymentAndGraph ? "Default" : "Primary"} Assistant`,
        metadata: {
          _x_oap_is_default: true,
          description: `${isDefaultDeploymentAndGraph ? "Default" : "Primary"}  Assistant`,
          ...(isDefaultDeploymentAndGraph && { _x_oap_is_primary: true }),
        },
      });
    },
  );

  const newUserDefaultAssistants = [
    ...userDefaultAssistants,
    ...(await Promise.all(newUserDefaultAssistantsPromise)),
  ];

  if (systemDefaultAssistants.length === newUserDefaultAssistants.length) {
    // We've successfully created all the default assistants, for every graph.
    return newUserDefaultAssistants;
  }

  throw new Error(
    `Failed to create default assistants for deployment ${deploymentId}. Expected ${systemDefaultAssistants.length} default assistants, but found/created ${newUserDefaultAssistants.length}.`,
  );
}

/**
 * GET handler for the /api/langgraph/defaults endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const deploymentId = url.searchParams.get("deploymentId");

    if (!deploymentId) {
      return new Response(
        JSON.stringify({ error: "Missing deploymentId parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const defaultAssistants = await getOrCreateDefaultAssistants(deploymentId);

    return new Response(JSON.stringify(defaultAssistants), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting default assistants:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
