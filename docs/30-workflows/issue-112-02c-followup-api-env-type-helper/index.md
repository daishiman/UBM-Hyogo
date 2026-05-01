# issue-112-02c-followup-api-env-type-helper — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| ディレクトリ | docs/30-workflows/issue-112-02c-followup-api-env-type-helper |
| Issue | #112 (CLOSED — 仕様書作成時点で既に close 済。本仕様書は close されたまま作成する運用) |
| 親タスク | 02c-d1-repository-foundation |
| Wave | 2 (follow-up) |
| 実行種別 | sequential |
| 作成日 | 2026-05-01 |
| 担当 | api-foundation |
| 状態 | implemented-local / Phase 1-12 completed / Phase 13 pending_user_approval |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | medium |
| 規模 | small |
| 発見元 | 02c Phase 12 unassigned-task-detection #1 |

## purpose

`apps/api/src/env.ts` を Worker env 型の **正本** として配置し、02c の `_shared/db.ts` の `ctx(env)` および後続タスク（03a / 03b / 04b / 04c / 05a / 05b / 09b 以降）の Hono router / Cron handler が **型ドリフト無し** で参照できる状態にする。`wrangler.toml` の binding 定義と TS 型 `Env` を一対一対応として明文化し、`apps/web` から `apps/api/src/env.ts` を import すると boundary lint が error にする運用を確立する。

## scope in / out

### scope in

- `apps/api/src/env.ts` の新規作成（`Env` interface + 必要な再 export）
- `apps/api/wrangler.toml` の binding 棚卸しと `Env` との対応表（コメント形式）
- `apps/api/src/repository/_shared/db.ts` の `ctx()` を `Pick<Env, "DB">` を取るよう refactor（後方互換維持）
- 02c implementation-guide.md の `_shared/db.ts` 節への反映と、`Hono<{ Bindings: Env }>` 使用例追記
- `scripts/lint-boundaries.mjs` の禁止トークンが `apps/api/src/env` を含むことの確認・追加

### scope out

- KV / R2 / Magic Link HMAC key 等の binding **追加** 実装（03a 以降の個別タスク責務）
- Hono router 実装本体（04b / 04c）
- `wrangler types` 自動生成基盤の整備（将来検討、本タスクは手動 + コメント運用）
- secret 管理ポリシー（`scripts/cf.sh` / 1Password / CLAUDE.md）の改修
- 02c で作成済みの D1 repository 実装の再設計

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02c-d1-repository-foundation | `_shared/db.ts` の `ctx()` を refactor 対象として引き取る |
| 上流参照 | apps/api/wrangler.toml | binding 一覧の正本 |
| 後続 | 03a forms-schema-sync | Cron handler の `Env` 参照 |
| 後続 | 03b forms-response-sync | Cron handler の `Env` 参照 |
| 後続 | 04b me-and-profile-api | `Hono<{ Bindings: Env }>` 参照 |
| 後続 | 04c admin-backoffice-api | `Hono<{ Bindings: Env }>` 参照 |
| 後続 | 05a authjs-google-oauth-and-admin-gate | session / OAuth 用 binding 拡張時の追従点 |
| 後続 | 05b magic-link-and-session-cookie | KV / HMAC key binding 拡張時の追従点 |
| 後続 | 09b production-deploy | wrangler binding と TS 型の同期確認 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/02c-followup-001-api-env-type-and-helper.md | 起票元の未タスク仕様（背景・AC 一次出典） |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #5（apps/web → D1 直接アクセス禁止） |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成と binding の前提 |
| 必須 | apps/api/wrangler.toml | binding 定義の正本 |
| 必須 | apps/api/src/repository/_shared/db.ts | refactor 対象の現行実装 |
| 必須 | scripts/lint-boundaries.mjs | boundary lint 実行 gate |
| 参考 | docs/30-workflows/02-application-implementation/ | 02c 親仕様 |

## AC（Acceptance Criteria）

- AC-1: `apps/api/src/env.ts` が存在し、`Env` interface が export されている
- AC-2: `Env` の各 key が `wrangler.toml` の binding と一対一対応している（`env.ts` 内コメントで対応関係を明示）
- AC-3: 02c の `_shared/db.ts` の `ctx()` が `Pick<Env, "DB">` を引数に取るよう refactor され、既存 unit test がすべて pass
- AC-4: 後続タスク向け参照例として `Hono<{ Bindings: Env }>` の使用例が `outputs/phase-12/implementation-guide.md` および 02c implementation-guide.md に追記されている
- AC-5: `apps/web/**` から `apps/api/src/env.ts` を import すると boundary lint が error として検出する（不変条件 #5）
- AC-6: refactor 後も `pnpm typecheck` / `pnpm lint` / `pnpm test --filter @ubm/api` がすべて pass する
- AC-7: secret 値（API token / OAuth secret 等）が `env.ts` のコメントや evidence に**含まれない**ことを Phase 9 secret hygiene check で確認

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（暗黙契約の正本化 / wrangler 同期手段）と AC-1〜7 確定 |
| 2 | 設計 | phase-02.md | `Env` interface 設計、binding 対応表、`ctx()` refactor 契約 |
| 3 | 設計レビュー | phase-03.md | 代替案（`wrangler types` 自動生成 / 既存暗黙型維持）と PASS-MINOR-MAJOR |
| 4 | タスク分解 | phase-04.md | `env.ts` 新規 / `db.ts` refactor / guide 反映 / boundary lint の 4 サブタスク |
| 5 | 実装計画 | phase-05.md | runbook（編集順序 / typecheck / test 実行手順） |
| 6 | テスト戦略 | phase-06.md | 既存 02c unit test 維持 / boundary lint 期待値 / 型レベル契約テスト |
| 7 | 受入条件マトリクス | phase-07.md | AC × evidence × 不変条件 マトリクス |
| 8 | CI / 品質ゲート | phase-08.md | `verify-indexes` / typecheck / lint / test / boundary lint の通過確認 |
| 9 | セキュリティ / boundary 検証 | phase-09.md | secret hygiene / boundary lint negative test / `apps/web` 違反検知 |
| 10 | ロールアウト / 後続連携 | phase-10.md | 03a〜09b への引き継ぎ仕様、binding 追加時の改修フロー |
| 11 | evidence 取得 (NON_VISUAL) | phase-11.md | typecheck / lint / test / boundary lint の log evidence 取得 |
| 12 | close-out | phase-12.md | 実装ガイド / 仕様同期 / 未タスク検出 / skill-feedback / compliance check |
| 13 | PR 作成 | phase-13.md | 承認ゲート + commit + push + PR + `Refs #112` |

## 不変条件参照

- 不変条件 **#5**: D1 への直接アクセスは `apps/api` に閉じる。本タスクは `Env` を `apps/api/src/env.ts` に閉じ、boundary lint で `apps/web` からの import を gate する。
- 不変条件 **#1**: 実フォーム schema をコードに固定しすぎない（`Env` には Forms 関連の `formId` 等の vars を含めるが、schema 構造は型に持ち込まない）。

## 補足

- Issue #112 は仕様書作成時点で **CLOSED** だが、ユーザー指示により close されたまま本仕様書を作成する。close 状態と `metadata.issue_state_at_spec_time = "CLOSED"` を記録し、Phase 13 では `Refs #112` を採用、`Closes` は使用しない。
