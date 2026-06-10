# Phase 12: 未タスク検出（unassigned-task-detection）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | VISUAL |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

元タスク仕様書のスコープ外事項（SSOT §3 OUT）、Phase 3-10 の MINOR 指摘、Phase 11 発見事項、コードコメント TODO を確認し、本サイクルで起票すべき未タスクを検出する。本タスクは「調査・原因特定のみ」をユーザーが選択済みのため、**本格的な根本修正は CONST_007 例外①（合意未済の仕様分岐）として 4 件を current 未タスクとして必ず formalize する（0 件にしない）**。これらは先送りではなく、**真因が staging 実機調査で確定するまで修正方針を決められない**ことが分離理由である。

## current 未タスク（SSOT §3 OUT の 4 項目を formalize）

> いずれも「真因確定後の仕様分岐の合意待ち」。配置先は `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/`（本調査が close-out で completed-tasks へ移動した後の配置を想定）。状態は `deferred_pending_root_cause`。

### C-1: 410（is_deleted member）の本格対応（復帰 or 明示誘導）

| 項目 | 内容 |
| --- | --- |
| 状態 | `deferred_pending_root_cause` |
| 分離理由 | **CONST_007 例外①**: 真因が H3（410・`member_status.is_deleted=1`）と確定した場合のみ着手。is_deleted member の復帰可否・誘導文言（「退会済みです / 再登録は…」等）は要合意で、真因確定前に方針を決められない |
| 実施時期 | 真因確定後（Phase 11 MT-A/MT-C で H3 確定が前提） |
| 配置先 | `completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/` |
| 依存 | 本調査の真因確定（H3）。`member_status` schema・`/me` 410 status 体系（変更しない前提だが復帰フローは要設計） |

### C-2: 5xx の根治（session-resolver / API worker / D1 のバグ修正）

| 項目 | 内容 |
| --- | --- |
| 状態 | `deferred_pending_root_cause` |
| 分離理由 | **CONST_007 例外①**: 真因が H4（5xx）と確定し、例外箇所（`me-session-resolver.ts` / D1 / ハンドラ）を特定してからでないと修正対象を定義できない。API worker 修正は apps/api 改変を伴い本タスクの非接触不変条件（AC-6）を超える |
| 実施時期 | 真因確定後（Phase 11 MT-A=5xx / API ログで例外箇所特定が前提） |
| 配置先 | `completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/` |
| 依存 | 本調査の真因確定（H4）+ 例外箇所の特定 |

### C-3: transport デプロイ齟齬の運用是正（旧 bundle 残存）

| 項目 | 内容 |
| --- | --- |
| 状態 | `deferred_pending_root_cause` |
| 分離理由 | **CONST_007 例外①**: 真因が H5（transport 失敗・旧 bundle 残存 / service-binding 未応答）と確定した場合のみ。deploy 操作は user-gated で、再デプロイ要否・運用手順是正は真因確定前に決められない |
| 実施時期 | 真因確定後（Phase 11 MT-B 診断スクリプトで deploy 版数齟齬 / service-binding 未応答が確認されることが前提） |
| 配置先 | `completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/` |
| 依存 | 本調査の真因確定（H5）+ 診断スクリプトの deploy 版数 / service-binding 結果 |

### C-4: 管理者アカウントの `/profile` 専用 UX

| 項目 | 内容 |
| --- | --- |
| 状態 | `deferred_pending_root_cause` |
| 分離理由 | **CONST_007 例外①**: 管理者（万壽本大嗣・管理者）が member identity/status を**持つ/持たない**かが調査（Phase 11 MT-C の D1 read-only / AC-2）で確定してからでないと、管理者向け `/profile` の期待挙動・専用 UX を決められない |
| 実施時期 | 真因確定後（AC-2 の管理者 identity/status 保持の結論が前提） |
| 配置先 | `completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/` |
| 依存 | 本調査の AC-2 結論（管理者の identity/status 保持・resolver の cookie 解決可否） |

## 検出ソースと結果

### 1. 元タスク仕様書のスコープ外（SSOT §3 OUT / index.md「既知のスコープ外」）

| 事象 | 候補化 | 起票判定 |
| --- | --- | --- |
| 410 本格対応 | current C-1 | **起票（current・deferred_pending_root_cause）** |
| 5xx 根治 | current C-2 | **起票（current・deferred_pending_root_cause）** |
| transport デプロイ齟齬の運用是正 | current C-3 | **起票（current・deferred_pending_root_cause）** |
| 管理者 `/profile` 専用 UX | current C-4 | **起票（current・deferred_pending_root_cause）** |
| `[Sentry] Sentry.init() in a browser extension` | 候補外 | ブラウザ拡張由来・自社外・起票しない |
| `content.js POST http://127.0.0.1:8888 ERR_CONNECTION_REFUSED` | 候補外 | ブラウザ拡張（1Password 等）由来・自社外・起票しない |
| `Permissions-Policy: browsing-topics` 警告 | 候補外 | Chromium 標準警告・無害・起票しない |

### 2. Phase 3-10 の MINOR 指摘

| 指摘 | 検出 |
| --- | --- |
| Phase 3-10 MINOR | 0 件（Phase 10 §10.3 で N/A 記載済。設計レビューは全 PASS・代替案の不採用理由確定済）。本格修正 4 件は MINOR ではなく current 未タスク（§current）として formalize |

### 3. Phase 11 発見事項

| 発見 | 検出 |
| --- | --- |
| Phase 11 実行発見 | 0 件（implemented_local_evidence_captured のため staging 実機調査は user-gated・未実施）。実機調査で H3/H4/H5 が確定した時点で、対応する current 未タスク（C-1/C-2/C-3）の着手条件が満たされる |

### 4. コードコメント TODO

| TODO | 検出 |
| --- | --- |
| 新規 TODO/FIXME | 0 件（implemented_local_evidence_captured。実装時に本タスク由来の新規 TODO/FIXME を残さない方針） |

## current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| **current（本サイクルで完結する観測性タスク）** | T01（`/profile` 区別表示）/ T02（構造化ログ）/ T03（診断スクリプト）。本サイクルで仕様確定・実装済み |
| **current（真因確定待ちで起票する本格修正）** | C-1（410 本格対応）/ C-2（5xx 根治）/ C-3（transport 運用是正）/ C-4（管理者 UX）。`deferred_pending_root_cause`・配置先 = unassigned-task/・依存 = 本調査の真因確定 |
| baseline（既存・本サイクル対象外） | 関連 6 WF の解決済み真因（404・loopback・resolver 未接続・safeServerFetch 化・orphan status）。本タスクは「解決済み前提」として引き継ぐのみで再起票しない |

## 重複チェック（関連タスク差分）

| 確認項目 | 結果 |
| --- | --- |
| 既存 6 WF との重複 | 重複なし。profile-reload-session-404-fix（404）/ staging-api-url-and-session-recovery（loopback）/ 06b-A-me-api-authjs-session-resolver（resolver 未接続）/ login-stale-link-and-profile-me-safe-fetch・issue-879（safeServerFetch 化）/ admin-member-detail-status-404-fix（orphan status=401 側）は、いずれも**解決済み真因**であり、本タスクが扱う**デフォルト分岐の観測性（410/5xx/FAILED）**とは別領域。C-1〜C-4 は真因確定後の本格修正で、既存 WF が未着手の領域 |
| 既存 open issue との重複 | relatedIssue=null（staging 実機観察起点）。C-1〜C-4 は真因確定後に起票するため、現時点で重複する open issue なし |
| 本サイクル内タスク間の重複 | T01（UI 表示）/ T02（server ログ）/ T03（運用診断）は関心分離済・重複なし |

## 検出結果サマリ

**current 未タスク: 4 件（C-1〜C-4・`deferred_pending_root_cause`）。** SSOT §3 OUT の本格修正 4 項目を、真因確定までの仕様分岐の合意待ち（CONST_007 例外①）として formalize した。**先送りではなく、真因が確定しないと修正方針を決められないことが分離理由**である。本サイクルの観測性タスク（T01/T02/T03）は implemented_local_evidence_captured で実装完了し、staging 実機調査と真因確定が user-gated。

## 完了条件

- [x] SSOT §3 OUT の 4 項目を current 未タスク C-1〜C-4 として formalize（0 件にしない）
- [x] 各 current に state=`deferred_pending_root_cause` / 分離理由（CONST_007 例外①）/ 実施時期（真因確定後）/ 配置先（`completed-tasks/<wf>/unassigned-task/`）/ 依存（本調査の真因確定）を記載
- [x] スコープ外/MINOR/Phase11発見/TODO の 4 ソースを確認
- [x] current / baseline を分離
- [x] 重複チェック欄（既存 6 WF / open issue / 本サイクル内）を設置

## 成果物

- `outputs/phase-12/unassigned-task-detection.md`（本ファイル）

## 参照資料

- `_shared-context.md` §3 OUT（CONST_007 例外①・未タスク化対象）
- `index.md`（既知のスコープ外 / 既存 6 WF との関係）
- `outputs/phase-10/phase-10.md` §10.3（MINOR 0 件 N/A）
