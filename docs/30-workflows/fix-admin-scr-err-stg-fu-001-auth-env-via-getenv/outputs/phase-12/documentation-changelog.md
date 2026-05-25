# Documentation Changelog

[実装区分: 実装仕様書]

> `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 段階の指示書。current factsの close-out で各 Step の結果を current facts へ確定する。
> 全 Step（1-A / 1-B / 1-C / Step 2）を個別に明記し、「該当なし」も省略しない。
> workflow-local 同期と global skill sync を別ブロックで記録する（[Feedback BEFORE-QUIT-003]）。

## Step 別結果（close-out 時に確定）

| Step     | 結果（close-out 時に記入）                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| Step 1-A | 完了タスク記録 + 関連ドキュメントリンク + 変更履歴 + quick-reference / resource-map / task-workflow-active / SKILL-changelog を same-wave で更新 |
| Step 1-B | 実装状況テーブルへ `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（またはcurrent facts `phase12_completed`）を記録。機能実装状況テーブルは不変（該当なし）|
| Step 1-C | 親 #849/#877 follow-up テーブルと先行単一ファイル仕様のステータスを current facts へ更新（実施: 〇/×）           |
| Step 2   | **該当する**: `getAuthEnv()` / `AuthEnv` 新規追加に伴い env アクセス契約を 2 アクセサ構成へ正本化（実施: 〇/×）  |

## ブロック A: workflow-local 同期

current factsの close-out で本 workflow 配下を更新する。

| Path                                                                                  | Change（close-out 時に確定）                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `docs/30-workflows/fix-admin-scr-err-stg-fu-001-auth-env-via-getenv/index.md`         | 完了タスクセクション / phase status を current facts へ             |
| `.../artifacts.json`（root）                                                          | `status` / `phases[].status` をcurrent factsステータスへ更新              |
| `.../outputs/artifacts.json`（output）                                                | root artifacts と同値 parity を維持                                |
| `.../outputs/phase-10/phase-10.md`                                                     | NON_VISUAL 代替証跡（最終レビュー）を確定                          |
| `.../outputs/phase-11/manual-test-result.md`                                          | `auth.spec.ts` / `env.spec.ts` の自動テスト結果を記録              |
| `.../outputs/phase-11/screenshots/`                                                   | `.gitkeep` 削除（NON_VISUAL・PNG 0 件）                            |
| `.../outputs/phase-12/*`                                                              | strict 7 を物理配置（本ファイル群）                                |

## ブロック B: global skill sync

current factsの close-out で global skill 正本を更新する。

| Path                                                                                          | Change（close-out 時に確定）                                      |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `.claude/skills/aiworkflow-requirements/LOGS.md`                                              | close-out sync エントリ追記                                       |
| `.claude/skills/task-specification-creator/LOGS.md`                                           | close-out sync エントリ追記                                       |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`                           | `getAuthEnv` / `getPublicFetchEnv` 境界の検索導線を追加            |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（または completed） | workflow state を current facts へ                                 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md`                                   | 変更履歴追記                                                      |
| `.claude/skills/aiworkflow-requirements/references/`（architecture / interfaces 系 env 正本） | `getAuthEnv()` 経由・safeParse partial・fail-closed 契約へ同期    |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-fix-admin-scr-err-stg-fu-001-auth-env-via-getenv-2026-05.md` | 苦戦箇所 L-AUTHENV-001..005（issue 字義 vs fail-closed・throw/safeParse 並存・binding 同梱・optional key・スコープ除外）を記録（新規） |

> mirror parity（`.agents/skills/...`）が存在する場合は `diff -qr` で確認する。
> インデックス再生成: `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を Task 12-2/12-3/12-6
> 完了後に実行し stale を防ぐ。

## Verification（current facts）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/auth.spec.ts apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/fetch/public.spec.ts
```

Result（close-out 時に記入）: PASS / FAIL。staging runtime smoke は user-gated（`pending`）。
