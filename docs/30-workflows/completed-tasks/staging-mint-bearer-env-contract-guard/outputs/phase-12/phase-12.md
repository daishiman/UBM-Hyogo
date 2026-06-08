# Phase 12: ドキュメント更新

## 目的

TASK-STAGING-MINT-BEARER-ENV-CONTRACT-GUARD-001 実装仕様書の strict 7 outputs を生成し、`implemented_local_evidence_captured` として close-out する。mint env 契約 drift 再発防止（A role-scoping / B drift gate / C provision 整合 / D degrade）の実コード実装・test 実行・actionlint まで本サイクルで完了。staging 実走・実 secret 投入・commit/push/PR は user-gated。

## strict 7 outputs

| # | ファイル | 状態 |
| - | -------- | ---- |
| 1 | `outputs/phase-12/main.md` | 作成済み（タスク要約 / 成果物 / 実装対象・実装済み / 状態） |
| 2 | `outputs/phase-12/implementation-guide.md` | 作成済み（Part 1 例え話ナビ / Part 2 型・シグネチャ + main フロー + workflow 差分 + 設定値一覧 + エラー処理 + 視覚証跡） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 作成済み（Step 1-A/1-B/1-C + Step 2 = N/A 理由） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 作成済み（全 Step 結果 / 作成ファイル / validator / current vs baseline） |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 作成済み（current = M-1 gating / baseline = M-2/M-3/M-4 + issue #916・関連差分確認） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 作成済み（FB-1/FB-2 + no-op reason + evidence path） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 作成済み（canonical 9 見出し逐語） |

## Step 1-A〜1-C / Step 2（implemented local close-out）

- Step 1-A: 完了記録 — 本タスク root を 30-workflows ledger に `implemented_local_evidence_captured` で記録。親 `issue-1081-bulk-tag-real-d1-runtime-smoke` の mint env 契約欠陥を修正する follow-up として位置付け。
- Step 1-B: 実装状況 — 仕様書 Phase 1-13 作成完了 / 実コード（mint role-scoping / drift gate / provision 更新 / degrade / workflow）実装完了 / focused test・actionlint PASS / commit・PR pending（Gate-C）。
- Step 1-C: 関連タスク — 親 issue-1081（drift fix 起点）/ baseline issue #916（実 secret 投入・別関心）/ 既存 `verify-hook-integrity.yml`（gate 構造踏襲）の関係を記録。
- Step 2: aiworkflow-requirements の新規インターフェース追加なし（CI/script 改修のみ）→ **N/A**。mint script の新 env / 新 CLI 契約は documentation-changelog に記録。

## 完了判定

- [x] strict 7 を全て生成（canonical 9 見出し逐語準拠）
- [x] implementation-guide.md を Part 1（例え話・専門用語なし）/ Part 2（型・API・コード例・エラー処理・設定値一覧）+ 視覚証跡で実体付き作成（heading-only 回避）
- [x] Phase 11 evidence inventory を `Classification / Path / Status` テーブルで固定し、screenshot 行 = `n/a`・代替証跡 = `present`（実在）・自動テスト log = `pending`（実装 wave 生成予定）と明記
- [x] Step 1-A〜1-C を implemented local 状態で close-out・Step 2 = N/A（理由明記）
- [x] unassigned-task-detection を 0 件本体 + M-1（gating・先送りでない）current / baseline 分離で出力
- [x] related issue なし・staging 実走は user-gated・本 root は active 維持
