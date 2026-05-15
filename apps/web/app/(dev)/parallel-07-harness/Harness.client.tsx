"use client";

import RouteError from "../../error";
import LoginError from "../../login/error";
import LoginLoading from "../../login/loading";
import ProfileLoading from "../../profile/loading";

type View = "login-loading" | "login-error" | "root-error" | "profile-loading";
type Theme = "light" | "dark";

interface HarnessProps {
  readonly view: View;
  readonly theme: Theme;
}

const sampleError = Object.assign(new Error("parallel-07 visual fixture"), {
  digest: "parallel-07-fixture",
});
sampleError.stack = "Error: parallel-07 visual fixture";

export function Harness({ view, theme }: HarnessProps) {
  return (
    <div
      data-theme={theme === "dark" ? "dark" : undefined}
      data-page="parallel-07-harness"
      data-view={view}
      data-visual-theme={theme}
      className="min-h-screen bg-surface px-6 py-12 text-text"
    >
      {view === "login-loading" ? <LoginLoading /> : null}
      {view === "login-error" ? (
        <LoginError error={sampleError} reset={() => undefined} />
      ) : null}
      {view === "root-error" ? (
        <RouteError error={sampleError} reset={() => undefined} />
      ) : null}
      {view === "profile-loading" ? <ProfileLoading /> : null}
    </div>
  );
}
