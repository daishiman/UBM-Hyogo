# Phase 12: 未タスク検出（unassigned-task-detection）

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 12 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

SSOT §3 OUT のスコープ外事項、Phase 3-10 の MINOR 指摘、Phase 11 発見事項、コードコメント TODO を確認し、本サイクルで formalize すべき未タスクを検出する。本 WF は「S1〜S4 のいずれであっても復旧する多層防御」を today's fix とするため、唯一のスコープ外は **S3（bound worker hard error）と staging ログで確定した場合のみ必要になる API worker 側の根治** であり、これを current 1 件として formalize する（0 件にしない）。

## current 未タスク（SSOT §3 OUT の 1 項目を formalize）

### C-1: API worker（`ubm-hyogo-api-staging`）側の根治（S3 確定時のみ）

| 項目 | 内容 |
| --- | --- |
| 状態 | `deferred_pending_sub_cause`（サブ原因確定待ち） |
| 分離理由 | **CONST_007 例外①**: サブ原因が S3（service-binding fetch throw ＝ bound worker の hard error）と **staging ログ（Phase 11 RT-D）で確定した場合のみ**必要。確定前に `apps/api` を触るのは AC-7（apps/api 非接触）違反かつ仕様分岐の合意未済 |
| 実施時期 | Phase 11 RT-D で S3 確定後（`transportKind=service-binding` の `ApiTransportError` がログで確認された場合） |
| 配置先 | `unassigned-task/task-api-worker-hard-error-root-fix.md`（本 WF root 直下・バックログ・本 wave で配置済） |
| 依存 | T01〜T04 の実装 + staging deploy（RT-A）+ 新構造化ログによる S3 確定（RT-D） |

> 上記 1 件以外に先送りは無い（SSOT §3「上記 1 件以外に先送りは無い」を逐語継承）。

## 前身 WF Issue #1189-#1192 との対応関係（重複起票しない）

前身 WF `profile-session-fetch-failure-investigation` の unassigned C-1〜C-4 は Issue #1189-#1192 として起票済み（OPEN）。本 WF との対応関係:

| 前身 Issue | 内容 | 本 WF での扱い |
| --- | --- | --- |
| #1189（前身 C-1） | 410（is_deleted member）の本格対応 | **対象外のまま**（F-2 により今回の現象は 410 ではないと確定。Issue は前身側で継続追跡・本 WF は触れない） |
| #1190（前身 C-2） | 5xx の根治 | **対象外のまま**（F-3 により今回の現象は 5xx ではなく transport throw。Issue は前身側で継続追跡） |
| #1191（前身 C-3） | **transport デプロイ齟齬の運用是正** | **本 WF が実装で回収**（T01 観測性 deploy 到達 + T03 fallback chain + T04 診断 2 系統化が transport 運用是正の実装そのもの）。**重複起票しない**。local 実装完了後、#1191 のクローズ可否はユーザー判断（user-gated） |
| #1192（前身 C-4） | 管理者 `/profile` 専用 UX | **対象外のまま**（本 WF は transport 層のみ・UI 不変。Issue は前身側で継続追跡） |

> 本 WF の新規未タスク（C-1: S3 API 根治）は #1189-#1192 のいずれとも領域が重ならない（bound worker の hard error 根治は前身 Issue 群に存在しない）。GitHub Issue 起票は S3 確定後でよい（現時点ではバックログファイルのみ・user-gated）。

## 検出ソースと結果

### 1. 元タスク仕様書のスコープ外（SSOT §3 OUT / index.md「既知のスコープ外」）

| 事象 | 候補化 | 起票判定 |
| --- | --- | --- |
| API worker 側の根治（S3 確定時） | current C-1 | **formalize（current・`deferred_pending_sub_cause`・バックログ配置済）** |
| 410 復帰 / 5xx 根治 / 管理者 UX | 候補外 | 前身 Issue #1189/#1190/#1192 が追跡中・重複起票しない |
| ブラウザ拡張由来のコンソールノイズ | 候補外 | 自社外・起票しない |

### 2. Phase 3-10 の MINOR 指摘

| 指摘 | 検出 |
| --- | --- |
| MINOR-1（単発 resolve と chain の一時重複） | 未タスク化不要（Phase 8 のリファクタリング工程で本サイクル内解消・Phase 10 §10.3 で追跡） |
| MINOR-2（診断スクリプト旧 probe の誤誘導） | 未タスク化不要（T04 が本サイクル内で是正・AC-6） |

### 3. Phase 11 発見事項

| 発見 | 検出 |
| --- | --- |
| Phase 11 実行発見 | 0 件（implemented_local_runtime_pending のため RT-A〜RT-D は未実施・user-gated）。RT-D で S3 が確定した時点で current C-1 の着手条件が満たされる |

### 4. コードコメント TODO

| TODO | 検出 |
| --- | --- |
| 新規 TODO/FIXME | 0 件（本タスク由来の新規 TODO/FIXME なし） |

## current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| **current（本サイクルで完結するタスク）** | T01（観測性統合）/ T02（field-tolerant）/ T03（fallback chain）/ T04（診断拡張）。本サイクルで仕様確定済・実装は後続 |
| **current（サブ原因確定待ちで formalize する未タスク）** | C-1（S3 API worker 根治）。`deferred_pending_sub_cause`・配置先 = `unassigned-task/`・依存 = RT-D の S3 確定 |
| baseline（既存・本サイクル対象外） | 前身 Issue #1189（410）/ #1190（5xx）/ #1192（管理者 UX）。#1191（transport 運用是正）のみ本 WF が実装で回収 |

## 重複チェック（関連タスク差分）

| 確認項目 | 結果 |
| --- | --- |
| 前身 WF Issue #1189-#1192 との重複 | 重複なし。#1191 は本 WF が実装で回収（重複起票回避）、#1189/#1190/#1192 は領域非交差で前身側追跡を維持。C-1（bound worker hard error 根治）はどの Issue にも存在しない新規領域 |
| 観測性ブランチ WF（`profile-session-transport-observability-fail-closed`）との重複 | 重複なし。T01 が当該成果を本 WF へ統合し、本 WF の PR が dev へ届ける（個別 PR を立てない・Phase 13 で明記） |
| 本サイクル内タスク間の重複 | T01（検知 + S2 fail-closed）/ T02（env 耐性）/ T03(劣化運転) / T04（運用診断）は層分離済・重複なし |

## 追補: 実装後検証で発見した追加未タスク（2026-06-12 未タスク作成フロー・2回検証）

### N-1: ENVIRONMENT 未注入時 localhost fallback の fail-closed 化（environmentExplicit 統合完遂）

| 項目 | 内容 |
| --- | --- |
| 状態 | 未着手（Issue #1234 起票済・仕様書配置済） |
| 発見経緯 | 実装後の未タスク作成フロー 2 回検証で、T01 の取り込み対象のうち **`environmentExplicit` fail-closed のみが統合から欠落**していることを原実装ブランチとの diff 照合（`git show fix/profile-session-staging-localhost-endpoint:...`）で確定 |
| 欠落内容 | `apps/web/src/lib/env.ts` `getEnvironment()` が ENVIRONMENT 未注入時に `"local"` へ既定（explicit 概念なし）。`transport.ts` の localhost fallback 条件が `environment==="local"` のみ → ENVIRONMENT 未注入＋transport 全欠落の縮退構成で localhost fail-open（S2）残存。AC-1 DoD「S2 fail-closed 化」/ AC-4「ENVIRONMENT 明示 local のみ」部分未充足 |
| 検出できなかった理由 | focused 5 spec 72 tests 全 PASS だが ENVIRONMENT undefined ケースの回帰テストが不在（部分カバレッジ green の罠）。`system-spec-update-summary.md:22` の「environmentExplicit 方式で維持」は doc-over-claim |
| 優先度 | 中（staging/production は wrangler.toml `[vars]` で ENVIRONMENT 注入済・T03 chain の防御により即時実害は低い。診断正確性と仕様適合の問題） |
| 配置先 | `docs/30-workflows/unassigned-task/profile-session-staging-transport-recovery-followup-001-environment-explicit-fail-closed.md` |

> 本追補により下記サマリの「current 未タスク: 1 件」は **2 件（C-1 + N-1）** に更新される（C-1 は S3 確定待ちバックログ・N-1 は着手可能な Issue #1234）。

## 検出結果サマリ

**current 未タスク: 1 件（C-1・`deferred_pending_sub_cause`・`unassigned-task/task-api-worker-hard-error-root-fix.md` 配置済）。** S3 確定時のみ着手可能な API worker 根治を CONST_007 例外①として formalize した。前身 Issue #1189-#1192 のうち transport 運用是正（#1191 相当）は本 WF が実装で回収し重複起票しない。それ以外（410/5xx/管理者 UX）は前身側の追跡を維持する。

## 完了条件

- [x] SSOT §3 OUT の 1 項目を current C-1 として formalize（0 件にしない）
- [x] C-1 に状態 / 分離理由（CONST_007 例外①: 真因確定前に apps/api を触れない）/ 実施時期（Phase 11 RT-D で S3 確定後）/ 配置先（本ファイル＝バックログ）/ 依存を記載
- [x] 前身 Issue #1189-#1192 との対応関係（transport 運用是正は本 WF が実装で回収・重複起票しない）を明記
- [x] スコープ外 / MINOR / Phase 11 発見 / TODO の 4 ソースを確認
- [x] current / baseline 分離と重複チェック欄を設置

## 成果物

- `outputs/phase-12/unassigned-task-detection.md`（本ファイル）
- `unassigned-task/task-api-worker-hard-error-root-fix.md`（formalize 先・本 wave 配置）

## 参照資料

- `_shared-context.md` §3 OUT（CONST_007 例外①）/ §6（既存 WF・Issue との関係）
- `index.md`（既知のスコープ外）
- `outputs/phase-10/phase-10.md` §10.3（MINOR-1/2 追跡）
- `outputs/phase-11/manual-test-result.md`（RT-D・S3 確定条件）
