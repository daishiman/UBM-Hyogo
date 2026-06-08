# Phase 12: ドキュメント更新 — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | issue-1104-member-creation-path-unification |
| Phase | 12（ドキュメント更新） |
| workflow_state | **implemented_local_evidence_captured**（commit・PR・remote ops は全てユーザーゲート） |
| 分類 | NON_VISUAL（`apps/api` のみ。`apps/web` 無変更 = AC-6） |
| implementation_mode | `new` |
| 主成果物 | Phase 12 strict 7 ファイル（本ファイル + outputs/phase-12 の 6 ファイル） |

## 目的

本 workflow が **仕様化しローカル実装まで完了した** F-1〜F-5（単一 helper `createMemberWithStatus` 集約 + auto-link
status 連結 + ingest 統合 + F-4 防御保持 + 回帰テスト）を、運用・将来タスク・PR close-out へ
正しく引き渡すためのドキュメントを整備する。本 workflow は **implemented_local_evidence_captured** のため、各成果物は
「仕様として確定した内容」と「ユーザーゲートの external ops（commit・PR・staging）」を分離して記録する。

## 実行タスク

### 12.1 Phase 12 の 6 成果物（outputs/phase-12/ 配下）

> 各成果物は本 wave で生成済み。本ファイルは各成果物の **責務（何を書くか）** を定義する。

| # | 成果物 | 責務 |
|---|--------|------|
| 12-1 | `implementation-guide.md` | Part 1（中学生レベル・例え話）で「会員台帳に名前を載せる作業と、その人の“状態カード”を用意する作業を、これからは必ずセットで行う1つの手続きにまとめる。だから、どの入口から会員を作っても状態カードが無い人（orphan）が生まれない」を専門用語なしで説明。Part 2（技術者レベル）で `createMemberWithStatus` のシグネチャ・内部委譲（`upsertMember` + `ensureMemberStatusRow`）、auto-link（`backfillIdentityFromCandidate`）への status 連結、F-4（route 防御 backstop 保持）の意図、冪等性・writeCount セマンティクスを確定。`## 視覚証跡` で「`apps/web` 無変更のため Phase 11 スクリーンショット不要・代替証跡=自動テスト + staging はユーザーゲート」を明記 |
| 12-2 | `system-spec-update-summary.md` | Step 1-A（完了タスク記録）/ Step 1-B（実装状況テーブル）/ Step 1-C（関連タスク = 親 404-fix・followup-002）を implemented_local_evidence_captured として記録。Step 2（新規インターフェース追加）は **N/A**（下記 §12.2 判定） |
| 12-3 | `documentation-changelog.md` | 全 Step（1-A / 1-B / 1-C / Step 2）の結果を個別明記（「該当なし」も記録）。workflow-local 同期と global skill sync を別ブロックで記録（[Feedback BEFORE-QUIT-003]） |
| 12-4 | `unassigned-task-detection.md` | **0 件でも必須出力**。current / baseline を分離（下記 §12.3） |
| 12-5 | `skill-feedback-report.md` | 改善点なしでも必須。テンプレート / ワークフロー / ドキュメント観点で記録。特に「生成責務の単一点集約（orphan を構造的に発生不能化）」refactor パターンと、issue 棚卸しの陳腐化（auto-link 経路見落とし・行番号ずれ）を grep で補完した調査パターンの再利用可能性を記録 |
| 12-6 | `phase12-task-spec-compliance-check.md` | canonical 9 見出しを **逐語**で使用し、CI gate `verify-phase12-compliance` の SSOT 照合に整合。見出し 4（evidence）は `\| Classification \| Path \| Status \|` の 3 列で status を `present` / `pending` / `n/a` のみで記載（focused evidence は取得済み、external runtime evidence は `pending`） |

### 12.2 Task 12-2 Step 2 判定（新規インターフェース追加 = N/A）

| 項目 | 判定 |
|------|------|
| Step 2（新規 IPC / API surface / 型の追加） | **N/A** |
| 理由 | 新規 helper `createMemberWithStatus` は **`apps/api` 内部の repository helper**（`apps/api/src/repository/members.ts` 内に閉じる）であり、公開 IPC / API endpoint surface・リクエスト / レスポンス shape・外部契約型の追加では一切ない。member_status 既定行の同期生成は内部実装の挙動であり、既存 endpoint のレスポンスは不変（Phase 3 §2）。したがって aiworkflow-requirements の **システム仕様更新（Step 2）は不要** |
| close-out ルール | ただし implemented_local_evidence_captured の close-out ルールに従い、**Step 1-A〜1-C は same-wave で記録する**（完了タスク記録 / 実装状況テーブル / 関連タスク）。internal helper であっても workflow の存在と状態（implemented_local_evidence_captured）はシステム仕様サマリに残す |

### 12.3 未タスク検出方針（unassigned-task-detection.md）

| 項目 | 方針 |
|------|------|
| 出力必須 | **0 件でも必ず出力**する |
| current / baseline 分離 | current（本 wave で新規検出した未タスク候補）と baseline（既存の分離済み項目）を分けて記録 |
| current 期待値 | **0 件**（Phase 10 §10.3 で MINOR なし）。本タスクの設計はスコープ内で閉じている |
| baseline 記録 | followup-002（`member_status.member_id` → `member_identities` FK 制約）は **既存分離**（親 404-fix の MINOR-FUT-2 由来）であり、**本 wave での新規起票対象ではない**。baseline として参照記録のみ |
| GitHub Issue 起票 | 仮に新規候補が出ても起票自体は **ユーザーゲート**。本 wave では起票しない |

### 12.4 完了条件チェックリスト

- [x] Phase 12 の 6 成果物（outputs/phase-12/ 配下）の責務を表で定義した
- [x] Task 12-2 Step 2 を **N/A**（internal repository helper・公開 surface 不変）と判定し、Step 1-A〜1-C は same-wave 記録と明記した
- [x] 未タスク検出方針（0 件でも出力・current/baseline 分離・current=0 件・FK は baseline）を定義した
- [x] compliance-check は canonical 9 見出し逐語・evidence status は present/pending/n-a に限定する旨を記録した

## 参照資料

- Phase 5（F-1〜F-5 実装仕様）/ Phase 10（AC 充足判定・MINOR なし）/ Phase 11（NON_VISUAL 証跡）
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`（canonical 9 見出し SSOT）
- index.md §4 スコープ（FK = followup-002 へ既存分離）

## 成果物

- 本ファイル（phase-12.md）
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

> outputs/phase-12/ 配下 6 ファイルは本 wave で生成済み（本ファイルは責務定義）。

## 統合テスト連携

- 本 Phase の 6 成果物は implemented_local_evidence_captured の証跡（local deterministic evidence は取得済み、external runtime evidence は pending）と整合させる。
- compliance-check の canonical 9 見出しは `verify-phase12-compliance` gate で機械照合され、Phase 13 の PR pre-flight（`verify-pr-ready.sh`）の通過条件となる。
