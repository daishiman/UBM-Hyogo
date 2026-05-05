// ut-web-cov-03 Phase 5/8: global fetch を Vitest spy で差し替えるための helper。
// 各 test の beforeEach で mockFetchOnce/Sequence、afterEach で restoreFetch を呼ぶ。

import { vi, type MockInstance } from "vitest";

export interface MockFetchResponseInit {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** body を文字列としてそのまま返したい場合（JSON.parse 失敗ケースの再現用） */
  rawBody?: string;
}

const buildResponse = (init: MockFetchResponseInit): Response => {
  const status = init.status ?? 200;
  const headers = new Headers({
    "content-type": "application/json",
    ...(init.headers ?? {}),
  });
  const body =
    init.rawBody !== undefined
      ? init.rawBody
      : init.body === undefined
        ? ""
        : JSON.stringify(init.body);
  return new Response(body, { status, headers });
};

let activeSpy: MockInstance | undefined;

const ensureSpy = (): MockInstance => {
  if (!activeSpy) {
    activeSpy = vi.spyOn(globalThis, "fetch");
  }
  return activeSpy;
};

export const mockFetchOnce = (init: MockFetchResponseInit): MockInstance => {
  const spy = ensureSpy();
  spy.mockResolvedValueOnce(buildResponse(init));
  return spy;
};

export const mockFetchSequence = (
  inits: ReadonlyArray<MockFetchResponseInit>,
): MockInstance => {
  const spy = ensureSpy();
  for (const init of inits) {
    spy.mockResolvedValueOnce(buildResponse(init));
  }
  return spy;
};

export const mockFetchNetworkError = (message = "network error"): MockInstance => {
  const spy = ensureSpy();
  spy.mockRejectedValueOnce(new TypeError(message));
  return spy;
};

export const restoreFetch = (): void => {
  if (activeSpy) {
    activeSpy.mockRestore();
    activeSpy = undefined;
  }
};
