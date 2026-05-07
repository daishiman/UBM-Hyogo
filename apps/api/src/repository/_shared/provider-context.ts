import type { AttendanceProvider } from "../attendance";
import type { DbCtx } from "./db";

export type RepositoryProviderVariables = {
  attendanceProvider: AttendanceProvider;
};

export type RepositoryProviderCtx = DbCtx & {
  readonly var: RepositoryProviderVariables;
};
