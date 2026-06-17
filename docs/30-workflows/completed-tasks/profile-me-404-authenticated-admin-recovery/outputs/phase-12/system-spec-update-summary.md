# Phase 12: システム仕様更新サマリ（system-spec-update-summary）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 12 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

本ワークフローの仕様（notFound 観測性 + apps/api 自動 CD + web route-404 ログ + 診断拡張）が既存システム仕様・skill reference へ与える影響を Step 1-A / 1-B / 1-C / Step 2 の手順で個別に記録する。workflow-local sync と global skill sync を別ブロックで分離する（Feedback BEFORE-QUIT-003）。本サイクルは `implemented_local_runtime_pending`（ローカル実装・focused 証跡完了、staging runtime / PR は user-gated）。

## Step 1-A: 完了タスク記録 / 既存システム仕様（specs/）への影響評価

| 仕様 | 影響 | 結果 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md`（`/me` レスポンス項目） | **`/me` の path・レスポンス shape・status 体系は不変**（AC-6・apps/api `/me` route 非接触）。T01 は notFound 応答 body/status を変えず context ログのみ追加 | 仕様変更なし |
| `docs/00-getting-started-manual/specs/02-auth.md`（session / 認証境界） | `sessionGuard` の 401/410 判定・redirect 経路は不変。401→redirect / 410→専用文言の境界は T01〜T04 で touch しない | 仕様変更なし |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md`（session 境界） | session 未解決→401→redirect の正本は不変（404 でないことの根拠 F-3 に依存するのみ） | 仕様変更なし |
| `docs/00-getting-started-manual/specs/08-free-database.md`（D1 構成） | D1 schema・アクセス境界（apps/api に閉じる）は不変 | 仕様変更なし |
| `CLAUDE.md`（不変条件 / 運用フロー） | T02 は `scripts/cf.sh deploy` 規約に準拠する自動 CD の追加で、`wrangler` 直叩き禁止・secret 管理の不変条件を変えない | 仕様変更なし |

Step 1-A 結論: **`/me` 契約不変・認証境界不変・D1 不変のため既存 specs への文面変更は該当なし**。変更は `apps/api` の notFound ログ context・`.github/workflows/api-cd.yml`（新規 CD）・`apps/web` の transport ログ・`scripts/` の read-only 診断に閉じる。

## Step 1-B: 実装状況テーブル（implemented_local_runtime_pending）

| 項目 | 状況 |
| --- | --- |
| 実装状況 | **`implemented_local_runtime_pending`**（Phase 1-13 仕様書 + T01〜T04 を同一サイクルでローカル実装。staging runtime / PR は user-gated） |
| 実装ファイル | `apps/api/src/middleware/error-handler.ts`（T01・notFound 構造化ログ）/ `.github/workflows/api-cd.yml`（T02・自動 CD）/ `scripts/smoke/runtime-admin-api.sh`（T02・api 直 probe runner）/ `scripts/diagnose-profile-session.sh`（T04・route 差分 + parity） |
| 既存実装 + 回帰証跡 | `apps/web/src/lib/server-fetch/safe-fetch.ts` は既存 transport descriptor ログでT03を満たすため実装変更なし。`apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` に `MEMBER_SESSION_404` 回帰テストを追加 |
| テストファイル | `apps/api/src/middleware/error-handler.spec.ts`（新規）/ `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`（編集） |
| apps/api `/me` route 非接触 | `apps/api/src/routes/me/**` は非接触（AC-6）。S3 確定時の根治のみ #1192/#1234 へ委譲 |
| 実行記録 | `bash -n scripts/diagnose-profile-session.sh` PASS / `bash -n scripts/smoke/runtime-admin-api.sh` PASS / API focused Vitest 1 PASS / web focused Vitest 12 PASS |

## Step 1-C: 関連タスク更新 / skill reference への影響評価

| 参照 | 影響 | 結果 |
| --- | --- | --- |
| Issue #1192（admin `/profile` 専用 UX） | data-cause が S3（401/410）と確定した場合のみ admin `/profile` UX の論点へ委譲。本 WF は transport/CD/観測層のみで UI 不変ゆえ領域非交差 | 委譲関係を記録・本 WF は触れない |
| Issue #1234（environmentExplicit fail-closed / FU-001） | S3 確定時の environment 明示注入論点へ委譲。本 WF の T01〜T04 とは別レイヤ（env 注入の縮退構成は本 WF の対象外） | 委譲関係を記録・本 WF は触れない |
| PR #1237（transport 多段フォールバック chain） | 起点 `origin/dev` に含む。F-9（chain は HTTP エラー応答で fallback しない）の根拠であり、本 WF はこれを変更せず観測性のみ追加 | 既存実装を前提に積む・文面変更なし |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（active ledger） | 本ワークフローを `implemented_local_runtime_pending` として登録 | 同一 wave で同期 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | 新規 architectural pattern は内部運用層（api-cd + route_not_matched 診断）に閉じるが、検索導線が必要 | quick-reference / resource-map / task-workflow-active を同一 wave で同期 |

## Step 2: 新規 interface / 型定義の追加（判定）

判定: **公開 interface / IPC surface の追加 = 該当なし**。

- T01 の notFound ログ context フィールド（`reason` / `method` / `path` / `hasAuthorization` / `hasSessionCookie`）は `apps/api` の**内部運用ログ（`logError` の structured payload）に閉じる**診断フィールドで、`/me` の API/IPC surface（path・shape・status 体系）には現れない。応答 body は `UBM-1404` の `application/problem+json` のまま不変。
- T03 の `routeNotFound:boolean` は `apps/web` の**内部運用ログ（`console.error("server_fetch_failed", ...)`）に閉じる**フィールドで、`fetchAuthed` / `safeServerFetch` の公開戻り値型・呼び出し契約を変えない。
- T02 の `api-cd.yml` は **CI/CD パイプライン（GitHub Actions workflow）の追加**で、アプリケーションの公開 interface ではない。

### 判断根拠（1 行明記）

追加されるのは `apps/api` notFound の内部運用ログ context・`apps/web` transport の内部運用ログフィールド・CI/CD workflow のみで、`/me` の API/IPC surface（path・shape・status 体系）と `fetchAuthed` / `safeServerFetch` の公開契約は不変のため、公開 interface 追加は該当なし。

## workflow-local sync

| 対象 | 状況 |
| --- | --- |
| `outputs/phase-{1..11}/*`（本 WF 設計・契約・復旧手順） | present（既存・本 wave 参照元） |
| `outputs/phase-12/*`（strict 7） | 本 wave で生成（present） |
| `outputs/phase-13/phase-13.md` | 本 wave で生成（present） |
| `outputs/phase-11/manual-test-result.md` | present（RT-A〜RT-E + S1〜S3 判定フロー） |
| `artifacts.json` / `outputs/artifacts.json` | `workflow_state=implemented_local_runtime_pending` / phase 1-12 completed / 13 pending_user_approval を保持（既存・本 wave 不変更） |

## global skill sync

| 対象 | 状況 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 同一 wave で登録 |
| `.claude/skills/aiworkflow-requirements/references/workflow-profile-me-404-authenticated-admin-recovery-artifact-inventory.md` | 同一 wave で追加 |
| `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md` | 同一 wave で導線追加（topic-map / keywords は既存 generator 差分が大きいため manual minimal sync） |

## 完了条件

- [x] Step 1-A（既存 specs 影響: `/me` 契約・認証境界・D1 不変のため変更なし）を記録
- [x] Step 1-B（実装状況テーブル: implemented_local_runtime_pending・実装/新規/テストファイルは後続サイクル）を記録
- [x] Step 1-C（関連タスク #1192/#1234/#1237 委譲・skill reference は未更新）を記録
- [x] Step 2（新規 interface: notFound ログ context と api-cd.yml は内部運用層・公開 IF 追加なし＝該当なし）を判断根拠 1 行で記録
- [x] workflow-local sync と global skill sync を別ブロックで分離記録

## 成果物

- `outputs/phase-12/system-spec-update-summary.md`（本ファイル）

## 参照資料

- `index.md`（不変条件・正本順位）
- `_shared-context.md` §2（S1〜S3）/ §4（状態所有権）/ §5（T01〜T04）/ §7（不変条件）
- `outputs/phase-4/phase-4.md`（I/O 契約・notFound ログ payload）
