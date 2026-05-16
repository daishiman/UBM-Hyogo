# Phase 12 — 正本同期 / 実装ガイド

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | serial-05-step-02-identity-conflicts-merge |
| 実装区分 | **実装仕様書** |
| workflow state | `implemented_local_visual_evidence_captured` |
| Phase 11 連携 | VISUAL task（screenshots + smoke evidence） |

## 1. 目的

既存 `IdentityConflictRow` hardening の実装意図、API contract、VISUAL evidence、正本同期結果を
`task-specification-creator` の Phase 12 strict 7 に従って記録する。

## 2. 実行タスク（strict 7 成果物）

| # | タスク | 出力ファイル |
| --- | --- | --- |
| 1 | Phase 12 top index | `outputs/phase-12/main.md` |
| 2 | implementation-guide（中学生レベル概念説明 + 技術者向け詳細） | `outputs/phase-12/implementation-guide.md` |
| 3 | system-spec-update-summary（Step 1 必須・Step 2 判定） | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | documentation-changelog（変更ファイル + validator 結果） | `outputs/phase-12/documentation-changelog.md` |
| 5 | unassigned-task-detection（0 件でも理由明記） | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | skill-feedback-report（改善なしでも必須） | `outputs/phase-12/skill-feedback-report.md` |
| 7 | phase12-task-spec-compliance-check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 3. implementation-guide.md の必須構成

### Part 1: 中学生レベルの概念説明

| ブロック | 説明イメージ |
| --- | --- |
| 何を作ったか | 同じ人が 2 つの会員記録に分かれたとき、管理者が確認して 1 つにまとめる操作を安全にした |
| どう動くか | merge を押すと確認が 2 回出て、理由を書いて実行するとサーバーへ送られる |
| なぜ作るのか | 重複した会員記録を放置すると、連絡や集計が間違うため |
| どんな安全装置があるか | 理由必須、二重送信防止、400/409 では画面を閉じない、表示 email は mask 済み |
| 何を変えていないか | API / D1 schema / public page は変更しない |

### Part 2: 技術者向け実装ガイド

| # | チェック項目 | 記述要点 |
| --- | --- | --- |
| C12P2-1 | TypeScript 型定義 | `IdentityConflictRow` / `MergeIdentityRequest` / `MergeIdentityResponse` |
| C12P2-2 | API シグネチャ | `POST /api/admin/identity-conflicts/:conflictId/merge` |
| C12P2-3 | 使用例 | `IdentityConflictRow` から `useAdminMutation<MergeIdentityResponse>()` を呼ぶ |
| C12P2-4 | エラー処理 | 400 / 409 / auth error / generic error |
| C12P2-5 | 設定可能パラメータ | reason 1〜500 文字、VISUAL screenshot path、design token gate |

## 4. system-spec-update-summary の Step 2 判定

**判定: N/A**

- 本タスクは既存 UI hardening。新規 API endpoint / D1 schema / shared package export 追加なし。
- 正本 API contract は `apps/api/src/routes/admin/identity-conflicts.ts` と
  `packages/shared/src/schemas/identity-conflict.ts` に既存。
- aiworkflow-requirements には identity-conflicts 正本が既に存在するため、同一 wave では
  task-workflow / artifact inventory / changelog の同期有無を記録する。

## 5. compliance check の必須文言

`outputs/artifacts.json` が存在しない場合:

> `outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。

## 6. 完了条件

- [ ] strict 7 ファイルが物理存在
- [ ] Part 1 に中学生レベル 5 ブロックと専門用語セルフチェックがある
- [ ] Part 2 が C12P2-1〜C12P2-5 を満たす
- [ ] Phase 11 screenshots と smoke log を相対参照
- [ ] `system-spec-update-summary.md` に Step 1-A〜1-H と Step 2 N/A 根拠を記録
- [ ] `skill-feedback-report.md` は改善なしでも 3 観点（テンプレ / ワークフロー / ドキュメント）で記録
- [ ] `phase12-task-spec-compliance-check.md` は `PASS` 単独表記を使わず 3 値 state suffix を付ける

## 7. 次 Phase

Phase 13（user-gated PR 準備）へ進む。
