import { Client } from "@langchain/langgraph-sdk";
import { getDeployments } from "./environment/deployments";

export function createClient(deploymentId: string) {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
  if (!baseApiUrl) {
    throw new Error(
      "Failed to create client: Base API URL not configured. Please set NEXT_PUBLIC_BASE_API_URL",
    );
  }

  const client = new Client({
    apiUrl: `${baseApiUrl}/langgraph/proxy/${deploymentId}`,
    defaultHeaders: {
      "x-auth-scheme": "langsmith",
    },
  });
  return client;
}
