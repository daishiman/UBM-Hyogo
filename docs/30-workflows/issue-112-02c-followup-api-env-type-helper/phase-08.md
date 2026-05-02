# Phase 8: CI / 品質ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 8 / 13 |
| Phase 名称 | CI / 品質ゲート |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (受入条件マトリクス) |
| 次 Phase | 9 (セキュリティ / boundary 検証) |
| 状態 | pending |

## 目的

`apps/api/src/env.ts` 新規作成と `_shared/db.ts` `ctx()` refactor が、既存 CI 品質ゲートを **追加 gate なし** で通過することを確定する。本タスクは 02c 既存 CI gate（typecheck / lint / test / boundary lint）の **影響範囲のみを refactor 担保** する scope であり、新規 workflow の追加は行わない。Phase 9（boundary 検証）/ Phase 11（evidence 取得）への引き渡し点を明文化する。

## 通過必須 gate 一覧

| # | gate | 実行コマンド | CI workflow / job 名 | trigger | 期待出力 | fail 時対応 |
| --- | --- | --- | --- | --- | --- | --- |
| G-1 | TypeScript 型チェック | `pnpm typecheck` | `.github/workflows/ci.yml` job: `ci` step: `Type check` | `push` to `main`/`dev`、`pull_request` to `main`/`dev` | exit 0、stderr に diagnostic 0 件 | `Env` の field 漏れ / `Pick<Env, "DB">` 互換崩壊が主因。02c 利用箇所の渡し型を修正、または `D1Db` alias の互換性を Phase 2 設計に戻す |
| G-2 | Lint | `pnpm lint` | `.github/workflows/ci.yml` job: `ci` step: `Lint` | 同上 | exit 0、warning は許容（既存 baseline 比で増えないこと） | unused import / 命名規約逸脱の修正。`env.ts` の予約欄コメント整形ミス等 |
| G-3 | apps/api unit test | `pnpm test --filter @ubm/api` | `.github/workflows/ci.yml` の `coverage-gate` (continue-on-error 中) で network 含む実行はせず、ローカル / Phase 11 evidence で gate 化 | push / PR | 02c 既存 test 全 pass（`ctx()` fixture 互換維持） | 02c fixture が `Pick<Env, "DB">` で受理されない場合、`D1Db` alias を `D1Database` 互換に戻す。Phase 6 の構造的部分型契約に沿って fixture 形を確認 |
| G-4 | boundary lint | `node scripts/lint-boundaries.mjs` | 現状 CI workflow 直接実行は無いため Phase 11 evidence で取得（local 必須実行 gate）。次フェーズ以降に CI 組込み余地あり（scope out） | 手動 / Phase 11 | exit 0（apps/web 配下に禁止トークン違反 0 件） | 違反検出時は import 元 path を修正。本タスクの positive: `apps/api/src/env.ts` を web から触らないこと |
| G-5 | verify-indexes-up-to-date | `pnpm indexes:rebuild` 後 git diff | `.github/workflows/verify-indexes.yml` job: `verify-indexes-up-to-date` | push to `main`、PR to `main`/`dev` | `.claude/skills/aiworkflow-requirements/indexes` に diff 無し | 本タスクは skill 改修無しのため通常無関係。skill index に副作用が出た場合のみ `pnpm indexes:rebuild` を実行 commit |

## CI workflow / job 名と trigger サマリ

| workflow ファイル | job 名 | trigger | 本タスクとの関係 |
| --- | --- | --- | --- |
| `.github/workflows/ci.yml` | `ci`, `coverage-gate` | push/PR `main`/`dev` | G-1 / G-2 / (G-3 補助) を担う本タスクの主 gate |
| `.github/workflows/verify-indexes.yml` | `verify-indexes-up-to-date` | push `main`、PR `main`/`dev` | G-5。skill 改修ない場合は無関係（pass 想定） |
| `.github/workflows/backend-ci.yml` | `deploy-staging` / `deploy-production` | push `dev` / `main` | 本タスクは PR レベルで完結し deploy gate は 09b 責務。typecheck pass が前提 |
| `.github/workflows/pr-build-test.yml` / `validate-build.yml` / `e2e-tests.yml` / `web-cd.yml` / `pr-target-safety-gate.yml` | 各種 | 各 trigger | 直接の関連は無し。NON_VISUAL のため e2e の追加実行不要 |

## 各 gate の期待出力例

- **G-1 `pnpm typecheck`**: 標準出力 / stderr に "Found 0 errors" 相当（tsc -b 構成）。`apps/api` package 範囲で diagnostic ゼロ。
- **G-2 `pnpm lint`**: ESLint exit 0。`env.ts` への lint rule 違反 0 件。
- **G-3 `pnpm test --filter @ubm/api`**: vitest 結果 "X passed, 0 failed"。02c 既存 test 件数が減らないこと（snapshot 件数比較）。
- **G-4 `node scripts/lint-boundaries.mjs`**: 空出力 + exit 0。違反時は `apps/web/<path> contains forbidden token: apps/api` 形式の行を出す。
- **G-5 verify-indexes**: `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` が exit 0。

## 既存 02c CI gate との差分

| 種別 | 02c 時点 | 本タスク後 | 変更理由 |
| --- | --- | --- | --- |
| typecheck | 02c repository 配下を gate | 02c gate に加え `apps/api/src/env.ts` の `Env` interface も型チェック対象 | 新規ファイル追加 |
| lint | 02c repository 配下を gate | `apps/api/src/env.ts` も lint 対象に追加（既存 ESLint 設定範囲に自動包含） | 同上 |
| unit test | 02c `_shared/db.ts` `ctx({ DB: D1Db })` の test | refactor 後 `ctx(env: Pick<Env, "DB">)` の同 test 群が pass。**新規 test 追加は無し** | 後方互換 refactor のため契約テストのみ Phase 6 で型レベル化 |
| boundary lint | `apps/api` 全体禁止トークンが既に有効 | **追加トークン不要** （`scripts/lint-boundaries.mjs` の `apps/api` 文字列で `apps/api/src/env` も自動検知） | Phase 9 negative test で実証 |
| 新規 workflow | — | **追加無し** | small スケール / refactor scope のため過剰投資を回避 |

## Phase 連携

| 連携先 | 引き渡す観測 | 受け取る gate |
| --- | --- | --- |
| Phase 9 | G-4 boundary lint の positive / negative 双方の期待挙動 | negative test でも exit non-zero |
| Phase 11 (evidence 取得) | G-1〜G-5 の実行ログ | log evidence 5 種を `outputs/phase-11/evidence/` に格納 |
| Phase 12 (close-out) | 既存 CI gate に追加無しの結論 | implementation-guide.md に「本タスク後の CI gate 一覧」を明記 |
| 後続 09b | typecheck / lint pass を deploy 前提条件として確認 | production deploy 前 gate |

## 多角的チェック観点

- **追加 gate 不要原則**: 既存 5 gate（G-1〜G-5）で AC-1〜7 全てが gate 化されることを確認したため、本タスクで新 workflow を追加しない。将来 binding が増え `Env` の同期漏れリスクが顕在化した時点で `wrangler types` 自動生成 gate を Phase 3 代替案 1 として再評価。
- **後方互換**: G-3 unit test pass を以て `Pick<Env, "DB">` への refactor が破壊的でないことを立証する。
- **不変条件 #5**: G-4 boundary lint で apps/web → apps/api/src/env を機械的に gate 化（Phase 9 詳細）。
- **secret hygiene**: G-1 / G-2 のログ自体に secret は出ないため、Phase 9 の grep で evidence を担保。

## 実行タスク

- [ ] G-1〜G-5 の gate 一覧を `outputs/phase-08/main.md` に転記
- [ ] CI workflow ファイル名 / job 名 / trigger を artifact 化
- [ ] 02c CI gate との差分（追加 gate 無し / 影響範囲のみ）を明文化
- [ ] Phase 11 evidence 取得項目（G-1〜G-5 各 log）を引き継ぎ note に記録

## 完了条件

- [ ] gate 一覧が 5 件揃っている
- [ ] 各 gate の期待出力 / fail 時対応が記述されている
- [ ] 既存 02c gate との差分が「追加 gate 無し」として明示されている
- [ ] `outputs/phase-08/main.md` が作成されている

## 成果物

- `outputs/phase-08/main.md`
