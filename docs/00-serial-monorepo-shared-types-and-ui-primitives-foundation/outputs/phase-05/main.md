# Phase 5 成果物: 実装ランブック

→ 詳細は runbook.md を参照。

## scaffold 順序

1. root config（pnpm-workspace.yaml, package.json, tsconfig.json, vitest.config.ts）
2. packages/shared 雛形（ids.ts + 4層スケルトン）
3. packages/integrations/google 雛形（FormsClient interface）
4. apps/api 雛形（/healthz エンドポイント追加）
5. apps/web 雛形（route group + UI primitives 15 種 + tones.ts）
6. 統合検証（typecheck → lint → test）

## sanity check 一覧

| step | sanity | 期待 |
|------|--------|------|
| 1 | pnpm install | exit 0、lockfile 生成 |
| 2 | typecheck shared | exit 0 |
| 3 | typecheck integrations-google | exit 0 |
| 4 | typecheck api | exit 0 |
| 5 | typecheck web | exit 0、15 primitives export |
| 6 | typecheck/lint/test all | exit 0 |
