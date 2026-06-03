# Phase 5 成果物 — 実装ランブック

## 1. 新規作成 / 修正ファイル一覧（5 件）

| パス | 変更種別 |
| --- | --- |
| `scripts/verify-wrangler-binding-drift.mjs` | 新規 |
| `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | 新規 |
| `.github/workflows/verify-wrangler-binding-drift.yml` | 新規 |
| `package.json` | 編集（`verify:wrangler-binding-drift` script 追記） |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集（Current Cloudflare binding inventory 更新: MEMBER_PHOTOS / DB / SYNC_ALERTS 行追加） |

> 解析対象 `apps/api/wrangler.toml` / `apps/api/src/env.ts` は非編集。

## 2. 実装 Step（Before/After）

- **Step1**: `verify-wrangler-binding-drift.mjs` パーサ実装（`parse*` named export + `import.meta.url` CLI ガード）。Before=不在 → After=TC-01〜04 を満たす行走査 + kind 正規化 + 集約。
- **Step2**: `reconcile` 純粋関数（I/O なし・突合マトリクス 8 行）。Before=不在 → After=TC-05〜10 を満たす 4 種 Drift code。
- **Step3**: `main`（readFileSync + exit 0/1 + decisive log `[verify-wrangler-binding-drift] <code>: <binding> — <detail>`）。read-only（書き込み / fetch / child_process なし・D-7/AC-7）。
- **Step4**: `verify-wrangler-binding-drift.spec.ts`（TC-01〜10・fixture 文字列・`.spec.ts` のみ）。
- **Step5**: `verify-wrangler-binding-drift.yml`（3 ソース paths トリガ・既存 verify-design-tokens.yml 規約整合・AC-9）+ `package.json` script + 棚卸し表 MEMBER_PHOTOS 追記（AC-10）→ `pnpm verify:wrangler-binding-drift` exit 0。

## 3. ローカル実行・検証コマンド

```bash
mise exec -- pnpm verify:wrangler-binding-drift
mise exec -- pnpm exec vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 4. コミット粒度

| # | 内容 | ファイル |
| --- | --- | --- |
| C-1 | gate 本体 + 回帰 spec | `.mjs` / `.spec.ts` |
| C-2 | CI 配線 + package script + 現存ドリフト是正 | `.yml` / `package.json` / `deployment-cloudflare.md` |

> **本ワークフローでは実コミットを作成しない**。同一 PR 内に C-1/C-2 を含め、CI 導入時点で gate exit 0 になる順序（棚卸し表是正同梱・AC-10・CONST_007）を今回のローカル差分で担保する。commit / push / PR はユーザー承認後に行う。

## 5. DoD

- TC-01〜10 全 pass / `main` read-only exit 0/1 / decisive log 出力。
- CI gate `.yml` が 3 ソース変更で起動し既存規約整合（AC-9）。
- `package.json` に `verify:wrangler-binding-drift` 追記。
- `deployment-cloudflare.md` に MEMBER_PHOTOS / DB / SYNC_ALERTS 行追加 → **現行 repo で `pnpm verify:wrangler-binding-drift` exit 0**（AC-10 / R-1）。
- typecheck / lint 緑。

## 6. 結論

変更 5 ファイル・Step1〜5・コミット粒度 C-1/C-2・DoD を方針正本として確定。解析対象 2 ファイルは非編集。Phase 6 異常系拡充へ。
