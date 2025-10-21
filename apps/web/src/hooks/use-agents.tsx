import { createClient } from "@/lib/client";
import { Agent } from "@/types/agent";
import { Assistant } from "@langchain/langgraph-sdk";
import { toast } from "sonner";
import { useCallback } from "react";
import { isSystemCreatedDefaultAssistant } from "@/lib/agent-utils";

export function useAgents() {
  const getAgent = useCallback(
    async (
      agentId: string,
      deploymentId: string,
    ): Promise<Agent | undefined> => {
      try {
        const client = createClient(deploymentId);
        const agent = await client.assistants.get(agentId);
        // Never expose the system created default assistants to the user
        if (isSystemCreatedDefaultAssistant(agent)) {
          return undefined;
        }
        return { ...agent, deploymentId };
      } catch (e) {
        console.error("Failed to get agent", e);
        toast.error("Failed to get agent");
        return undefined;
      }
    },
    [],
  );

  const getAgentConfigSchema = useCallback(
    async (agentId: string, deploymentId: string) => {
      try {
        const client = createClient(deploymentId);
        const schemas = await client.assistants.getSchemas(agentId);

        return schemas.config_schema ?? undefined;
      } catch (e) {
        console.error("Failed to get agent config schema", e);
        toast.error("Failed to get agent config schema", {
          description: (
            <div className="flex flex-col items-start gap-2">
              <p>
                Agent ID:{" "}
                <span className="font-mono font-semibold">{agentId}</span>
              </p>
              <p>
                Deployment ID:{" "}
                <span className="font-mono font-semibold">{deploymentId}</span>
              </p>
            </div>
          ),
          richColors: true,
        });
      }
    },
    [],
  );

  const createAgent = useCallback(
    async (
      deploymentId: string,
      graphId: string,
      args: {
        name: string;
        description: string;
        config: Record<string, any>;
      },
    ): Promise<Assistant | undefined> => {
      try {
        const client = createClient(deploymentId);
        const agent = await client.assistants.create({
          graphId,
          metadata: {
            description: args.description,
          },
          name: args.name,
          config: {
            configurable: {
              ...args.config,
            },
          },
        });
        return agent;
      } catch (e) {
        console.error("Failed to create agent", e);
        toast.error("Failed to create agent");
        return undefined;
      }
    },
    [],
  );

  const updateAgent = useCallback(
    async (
      agentId: string,
      deploymentId: string,
      args: {
        name?: string;
        description?: string;
        config?: Record<string, any>;
      },
    ): Promise<Assistant | undefined> => {
      try {
        const client = createClient(deploymentId);
        const agent = await client.assistants.update(agentId, {
          metadata: {
            ...(args.description && { description: args.description }),
          },
          ...(args.name && { name: args.name }),
          ...(args.config && { config: { configurable: args.config } }),
        });
        return agent;
      } catch (e) {
        console.error("Failed to update agent", e);
        toast.error("Failed to update agent");
        return undefined;
      }
    },
    [],
  );

  const deleteAgent = useCallback(
    async (deploymentId: string, agentId: string): Promise<boolean> => {
      try {
        const client = createClient(deploymentId);
        await client.assistants.delete(agentId);
        return true;
      } catch (e) {
        console.error("Failed to delete agent", e);
        toast.error("Failed to delete agent");
        return false;
      }
    },
    [],
  );

  return {
    getAgent,
    getAgentConfigSchema,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}
