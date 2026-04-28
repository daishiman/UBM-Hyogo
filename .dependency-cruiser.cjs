// 02c が正本管理する dependency-cruiser config。
// 02a / 02b は本ファイルを編集する PR を 02c に向ける合意。
//
// 検出する違反:
//   1. apps/web → apps/api/src/repository/**（不変条件 #5 / AC-3 / AC-5）
//   2. apps/web → @cloudflare/workers-types の D1Database（不変条件 #5 / AC-4）
//   3. 02a domain ↔ 02b domain（AC-11）
//   4. 02b domain ↔ 02c domain（AC-11）
//   5. 02c domain ↔ 02a domain（不変条件 #12 / AC-11）
module.exports = {
  forbidden: [
    {
      name: "no-web-to-d1-repository",
      severity: "error",
      comment:
        "apps/web から apps/api/src/repository/** への直接 import を禁止（不変条件 #5）。Hono API endpoint 経由で取得すること。",
      from: { path: "^apps/web/" },
      to: { path: "^apps/api/src/repository/" },
    },
    {
      name: "no-web-to-d1-binding",
      severity: "error",
      comment:
        "apps/web から D1Database 型 / @cloudflare/d1 の直接 import を禁止（不変条件 #5）。",
      from: { path: "^apps/web/" },
      to: { path: "(@cloudflare/workers-types|@cloudflare/d1)" },
    },
    {
      name: "repo-no-cross-domain-2a-to-2b",
      severity: "error",
      comment:
        "02a domain repository から 02b domain repository への直接 import を禁止（AC-11）。",
      from: {
        path: "^apps/api/src/repository/(members|identities|status|responses|responseSections|responseFields|fieldVisibility|memberTags)\\.ts$",
      },
      to: {
        path: "^apps/api/src/repository/(meetings|attendance|tagDefinitions|tagQueue|schemaVersions|schemaQuestions|schemaDiffQueue)\\.ts$",
      },
    },
    {
      name: "repo-no-cross-domain-2b-to-2c",
      severity: "error",
      comment:
        "02b domain repository から 02c domain repository への直接 import を禁止（AC-11）。",
      from: {
        path: "^apps/api/src/repository/(meetings|attendance|tagDefinitions|tagQueue|schemaVersions|schemaQuestions|schemaDiffQueue)\\.ts$",
      },
      to: {
        path: "^apps/api/src/repository/(adminUsers|adminNotes|auditLog|syncJobs|magicTokens)\\.ts$",
      },
    },
    {
      name: "repo-no-cross-domain-2c-to-2a",
      severity: "error",
      comment:
        "02c domain repository から 02a domain repository への直接 import を禁止（不変条件 #12 / AC-11）。",
      from: {
        path: "^apps/api/src/repository/(adminUsers|adminNotes|auditLog|syncJobs|magicTokens)\\.ts$",
      },
      to: {
        path: "^apps/api/src/repository/(members|identities|status|responses|responseSections|responseFields|fieldVisibility|memberTags)\\.ts$",
      },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(__tests__|__fixtures__|_shared)" },
  },
};
