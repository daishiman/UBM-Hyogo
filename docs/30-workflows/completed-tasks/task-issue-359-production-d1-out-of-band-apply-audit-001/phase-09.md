# Phase 9: 品質保証（redaction / read-only 検証）

[実装区分: ドキュメントのみ仕様書]

## 目的

監査の品質ゲートを通過することを保証するチェックリストを確定する。

## 品質ゲート

### G1: redaction PASS

- ゲート: `outputs/` 配下のいずれのファイルにも secret 値（API Token / OAuth token / Bearer / cookie）が含まれない
- 検証コマンド: Phase 4 検証コマンド表 §AC-7 を参照
- 不合格時: 該当ファイルを redacted 版に置換し、Phase 11 を再実行

### G2: read-only evidence PASS

- ゲート: 本 audit の実行 transcript に production mutation command が 0 件であること。local wrangler が利用可能な場合は補助証跡として監査前後の `d1_migrations` ledger row 数一致も確認する
- 検証コマンド: Phase 4 検証コマンド表 §AC-8 を参照
- local wrangler blocked 時: 親 workflow Phase 13 の既取得 ledger snapshot + GitHub Actions / git read-only transcript を代替証跡にする
- 不合格時: 監査停止、`outputs/phase-11/read-only-checklist.md` に mutation command または row 差分を記録し、ユーザーへエスカレーション

### G3: 判定一意性 PASS

- ゲート: `attribution-decision.md` の `decision:` 行が 1 行のみ存在
- 検証コマンド: Phase 4 検証コマンド表 §AC-3 を参照
- 不合格時: 判定を再評価（複数候補時は Phase 6 §A5 のフォールバック適用）

### G4: 排他成果物 PASS

- ゲート: `decision == confirmed` なら `cross-reference-plan.md` 存在、`decision == unattributed` なら `recurrence-prevention-formalization.md` 存在
- 検証: `ls outputs/phase-12/{cross-reference-plan.md,recurrence-prevention-formalization.md}` のいずれか一方が存在
- 不合格時: 判定に応じて欠落側を作成

### G5: Phase 12 7 固定成果物 PASS

- ゲート: `main.md` / `implementation-guide.md` / `documentation-changelog.md` / `system-spec-update-summary.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` の 7 ファイル実体存在
- 検証コマンド: Phase 4 検証コマンド表 §AC-9 を参照
- 不合格時: 欠落ファイルを Phase 12 で補完

### G6: 単一レコード一致性 PASS

- ゲート: `single-record.md` の各列値が `attribution-decision.md` / `d1-migrations-ledger.md` / `operation-candidate-inventory.md` と矛盾しない
- 検証: 手動相互参照（cross-check）
- 不合格時: 不整合箇所を訂正し再実行

## 出力 (`outputs/phase-09/main.md`)

- 上記 G1〜G6 のチェックリスト
- 不合格時の対応手順
- 全ゲート PASS のサマリ表

## 完了条件

- [ ] 6 ゲートすべての検証手段が定義
- [ ] 不合格時の差し戻し先 Phase が明示

## メタ情報

- taskType: docs-only
- visualEvidence: NON_VISUAL
- workflow_state: spec_created

## 実行タスク

- 詳細は本 Phase の既存セクションを参照する。

## 参照資料

- index.md
- artifacts.json
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 成果物

- 対応する `outputs/phase-*` 配下の `main.md`。

## 統合テスト連携

- docs-only / NON_VISUAL のため UI 統合テストは対象外。Phase 11 の read-only audit evidence と Phase 12 compliance check で検証する。
