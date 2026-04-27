import type { ApiErrorClientView, UbmErrorCode } from "@ubm-hyogo/shared/errors";

export type { ApiErrorClientView, UbmErrorCode };

export interface ApiClientErrorResult {
  ok: false;
  error: ApiErrorClientView;
}

export interface ApiClientSuccessResult<T> {
  ok: true;
  data: T;
}

export type ApiClientResult<T> = ApiClientSuccessResult<T> | ApiClientErrorResult;

const PROBLEM_JSON = "application/problem+json";

export function isProblemJson(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  return contentType.toLowerCase().includes(PROBLEM_JSON);
}

export function isApiErrorClientView(value: unknown): value is ApiErrorClientView {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === "string" &&
    typeof v.title === "string" &&
    typeof v.status === "number" &&
    typeof v.detail === "string" &&
    typeof v.instance === "string" &&
    typeof v.code === "string" &&
    typeof v.traceId === "string"
  );
}

export async function parseApiResponse<T>(res: Response): Promise<ApiClientResult<T>> {
  const contentType = res.headers.get("content-type");
  if (!res.ok && isProblemJson(contentType)) {
    const body = (await res.json()) as unknown;
    if (isApiErrorClientView(body)) {
      return { ok: false, error: body };
    }
    return {
      ok: false,
      error: {
        type: "urn:ubm:error:UBM-5000",
        title: "Internal Server Error",
        status: res.status,
        detail: "サーバーから不正な形式のエラーレスポンスを受信しました。",
        instance: `urn:uuid:client-${Date.now()}`,
        code: "UBM-5000" as UbmErrorCode,
        traceId: `urn:uuid:client-${Date.now()}`,
      },
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: {
        type: "urn:ubm:error:UBM-5000",
        title: "Internal Server Error",
        status: res.status,
        detail: `Unexpected response: ${res.status}`,
        instance: `urn:uuid:client-${Date.now()}`,
        code: "UBM-5000" as UbmErrorCode,
        traceId: `urn:uuid:client-${Date.now()}`,
      },
    };
  }
  const data = (await res.json()) as T;
  return { ok: true, data };
}
