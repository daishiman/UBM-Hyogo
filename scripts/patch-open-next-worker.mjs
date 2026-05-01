#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const workerPath = resolve(process.cwd(), ".open-next/worker.js");
const marker = "const buildAuthEnv = (env) => ({";

let source = readFileSync(workerPath, "utf8");

if (source.includes(marker)) {
  console.log("[patch-open-next-worker] auth env bridge already present");
  process.exit(0);
}

const envBridge = `const buildAuthEnv = (env) => ({
    API_SERVICE: env.API_SERVICE,
    ENVIRONMENT: env.ENVIRONMENT,
    AUTH_SECRET: env.AUTH_SECRET,
    AUTH_URL: env.AUTH_URL,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    AUTH_GOOGLE_ID: env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: env.AUTH_GOOGLE_SECRET,
    INTERNAL_API_BASE_URL: env.INTERNAL_API_BASE_URL,
    INTERNAL_AUTH_SECRET: env.INTERNAL_AUTH_SECRET,
});
const withAuthHeaders = (request, env) => {
    const headers = new Headers(request.headers);
    const pairs = [
        ["x-ubm-auth-secret", env.AUTH_SECRET],
        ["x-ubm-auth-url", env.AUTH_URL],
        ["x-ubm-google-client-id", env.GOOGLE_CLIENT_ID],
        ["x-ubm-google-client-secret", env.GOOGLE_CLIENT_SECRET],
        ["x-ubm-auth-google-id", env.AUTH_GOOGLE_ID],
        ["x-ubm-auth-google-secret", env.AUTH_GOOGLE_SECRET],
        ["x-ubm-internal-api-base-url", env.INTERNAL_API_BASE_URL],
        ["x-ubm-internal-auth-secret", env.INTERNAL_AUTH_SECRET],
    ];
    for (const [name, value] of pairs) {
        if (value) {
            headers.set(name, value);
        }
    }
    return new Request(request, { headers });
};
`;

const insertionPoint =
  'export { BucketCachePurge } from "./.build/durable-objects/bucket-cache-purge.js";\n';
if (!source.includes(insertionPoint)) {
  throw new Error("OpenNext worker template changed: insertion point not found");
}
source = source.replace(insertionPoint, `${insertionPoint}${envBridge}`);

const replacements = [
  [
    "    async fetch(request, env, ctx) {\n        return runWithCloudflareRequestContext(request, env, ctx, async () => {\n            const response = maybeGetSkewProtectionResponse(request);",
    "    async fetch(request, env, ctx) {\n        globalThis.__UBM_AUTH_ENV__ = buildAuthEnv(env);\n        const authRequest = withAuthHeaders(request, env);\n        return runWithCloudflareRequestContext(authRequest, env, ctx, async () => {\n            const response = maybeGetSkewProtectionResponse(authRequest);",
  ],
  [
    "            const url = new URL(request.url);",
    "            const url = new URL(authRequest.url);",
  ],
  [
    "                return await handleImageRequest(url, request.headers, env);",
    "                return await handleImageRequest(url, authRequest.headers, env);",
  ],
  [
    "            const reqOrResp = await middlewareHandler(request, env, ctx);",
    "            const reqOrResp = await middlewareHandler(authRequest, env, ctx);",
  ],
  [
    "            return handler(reqOrResp, env, ctx, request.signal);",
    "            return handler(withAuthHeaders(reqOrResp, env), env, ctx, authRequest.signal);",
  ],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) {
    throw new Error(`OpenNext worker template changed: replacement not found: ${from}`);
  }
  source = source.replace(from, to);
}

writeFileSync(workerPath, source);
console.log("[patch-open-next-worker] auth env bridge injected");
