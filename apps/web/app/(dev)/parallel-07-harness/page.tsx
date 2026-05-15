import { Harness } from "./Harness.client";

type View = "login-loading" | "login-error" | "root-error" | "profile-loading";
type Theme = "light" | "dark";

interface PageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const views = new Set<View>([
  "login-loading",
  "login-error",
  "root-error",
  "profile-loading",
]);

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Parallel07HarnessPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawView = first(params.view);
  const rawTheme = first(params.theme);
  const view = views.has(rawView as View) ? (rawView as View) : "login-loading";
  const theme: Theme = rawTheme === "dark" ? "dark" : "light";

  return <Harness view={view} theme={theme} />;
}
