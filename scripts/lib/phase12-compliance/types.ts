export type WorkflowState =
  | "spec_created"
  | "implemented-local"
  | "implemented_local_runtime_pending"
  | "IMPLEMENTED_LOCAL_RUNTIME_PENDING"
  | "PASS_BOUNDARY_SYNCED_RUNTIME_PENDING"
  | "completed"
  | "unknown";

export type WorkflowRoot = {
  rootPath: string;
  workflowState: WorkflowState;
  hasCompletedTasksAncestor: boolean;
};

export type CanonicalHeading = {
  index: number;
  heading: string;
};

export type ComplianceCheckResult =
  | { ok: true; rootPath: string }
  | {
      ok: false;
      rootPath: string;
      reason: "missing-file" | "missing-heading" | "parse-error";
      details: string;
    };
