import type { EvaluationResource, EvaluationSuite } from "../core.ts";

export interface AdapterObservation {
  rawResponse: string;
  transportOutput?: string;
  resourceInvocation?: ResourceInvocation;
  stderr: string;
  durationMs: number;
  exitCode: number | null;
  executionError?: string;
}

export interface ResourceInvocation {
  surface: "cli-agent" | "tool";
  resource: string;
  tool?: string;
  toolUseId?: string;
}

export interface AdapterRequest {
  canonicalPrompt: string;
  projectedPrompt: string;
  resource: EvaluationResource;
}

export interface AdapterMetadata {
  id: string;
  target: string;
  transport: string;
  pluginName: string;
  discoveredCommand: string;
  executable: string;
  argumentPrefix: string[];
  runtimeVersion: string;
  projection: string;
  projectionResourceMap: { path: string; digest: string };
  launcherModel: {
    role: string;
    target: string;
  };
  modelMapping: Record<string, string | null>;
}

export interface EvaluationAdapter {
  readonly id: string;
  readonly target: string;
  readonly transport: string;
  prepare(): Promise<AdapterMetadata>;
  projectedResourcePath(resource: EvaluationResource): string;
  projectPrompt(suite: EvaluationSuite, canonicalPrompt: string): string;
  execute(request: AdapterRequest): AdapterObservation;
}
