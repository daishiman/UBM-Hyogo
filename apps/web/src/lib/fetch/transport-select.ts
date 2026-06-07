export type TransportKind = "service-binding" | "http-fallback";

export interface ServiceBinding {
  readonly fetch: typeof fetch;
}

export interface ResolveServiceBindingInput {
  readonly binding: ServiceBinding | undefined;
  readonly disableBinding: boolean;
}

export function resolveServiceBinding({
  binding,
  disableBinding,
}: ResolveServiceBindingInput): ServiceBinding | undefined {
  if (disableBinding) return undefined;
  return binding;
}

export function stripTrailingSlash(base: string): string {
  return base.replace(/\/$/, "");
}

export interface SelectTransportConfig {
  readonly binding: ServiceBinding | undefined;
  readonly resolveBase: () => string | null;
  readonly bindingUrlPrefix?: string;
  readonly log?: (
    transport: TransportKind,
    path: string,
    status: number,
  ) => void;
}

export type SelectTransportResult =
  | {
      readonly kind: TransportKind;
      readonly response: Response;
    }
  | {
      readonly kind: "base-unavailable";
    };

export async function selectAndFetch(
  cfg: SelectTransportConfig,
  path: string,
  init: RequestInit,
): Promise<SelectTransportResult> {
  if (cfg.binding) {
    const response = await cfg.binding.fetch(
      `${cfg.bindingUrlPrefix ?? "https://service-binding.local"}${path}`,
      init,
    );
    cfg.log?.("service-binding", path, response.status);
    return { kind: "service-binding", response };
  }

  const base = cfg.resolveBase();
  if (base === null) return { kind: "base-unavailable" };

  const response = await fetch(`${base}${path}`, init);
  cfg.log?.("http-fallback", path, response.status);
  return { kind: "http-fallback", response };
}
