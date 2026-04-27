# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 名称 | 設定 DRY 化 |
| タスク | UT-08 モニタリング/アラート設計 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 状態 | completed |
| GitHub Issue | #10（CLOSED） |
| タスク種別 | design / non_visual / spec_created |

---

## 目的

Phase 2 で作成された監視設計成果物（9 種のドキュメント）を横断レビューし、
閾値値・Secret 名・通知先・WAE データセット名・runbook 参照の**重複設定**を特定し、
**SSOT（Single Source of Truth）**として集約する DRY 化計画を策定する。

設計タスクのため**コードは触らず、ドキュメント上での値の重複と参照ルールの整理に閉じる**。
最終的に Wave 2 実装タスクが本設計書を読むだけで、矛盾のない単一値を参照できる状態にする。

---

## 実行タスク

- [ ] Phase 2 成果物 9 種の横断スキャンを行い、重複定義を抽出する
- [ ] 閾値値（CPU / リクエスト数 / エラー率 / 無料枠消費率）の SSOT 候補を特定する
- [ ] Secret 名（Slack Webhook URL・通知先メール・UptimeRobot API key 等）の命名規則統一案を作成する
- [ ] WAE データセット名・イベント名命名規則を整理する
- [ ] 通知先（メール / Slack）の単一参照表を確定する
- [ ] 05a runbook（observability-matrix.md / cost-guardrail-runbook.md）への参照リンク統一方針を決定する
- [ ] Before / After テーブルを `outputs/phase-08/refactoring-log.md` に記録する
- [ ] DRY 化対象外（意図的に複数箇所に書く必要がある項目）を理由付きで記録する

---

## DRY 化対象一覧（想定スキャン項目）

| 種別 | 想定重複箇所 | SSOT 候補 |
| --- | --- | --- |
| 閾値値（WARNING / CRITICAL） | `alert-threshold-matrix.md` / `monitoring-design.md` / `failure-detection-rules.md` | `alert-threshold-matrix.md` |
| Secret 名 | `notification-design.md` / `secret-additions.md` / `wae-instrumentation-plan.md` | `secret-additions.md` |
| WAE データセット名 | `wae-instrumentation-plan.md` / `metric-catalog.md` / `monitoring-design.md` | `wae-instrumentation-plan.md` |
| 通知先（チャネル） | `notification-design.md` / `external-monitor-evaluation.md` | `notification-design.md` |
| 05a runbook 参照リンク | 全成果物 | `runbook-diff-plan.md` |
| メトリクス名 | `metric-catalog.md` / `wae-instrumentation-plan.md` | `metric-catalog.md` |

---

## Before / After 記録フォーマット

`outputs/phase-08/refactoring-log.md` に以下のテーブルを必ず含める。

```markdown
## Before / After 比較

| # | 項目 | Before（重複箇所） | After（SSOT） | 他箇所の対応 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 1 | WARNING 閾値（CPU 80%） | alert-threshold-matrix.md / monitoring-design.md の 2 箇所に直接記載 | alert-threshold-matrix.md のみで定義 | monitoring-design.md は「閾値マトリクス参照」とリンク化 | 閾値変更時に複数ファイルを書き換える事故を防ぐ |
| 2 | Slack Webhook Secret 名 | notification-design.md / secret-additions.md / 実装計画の表記揺れ | secret-additions.md で `MONITORING_SLACK_WEBHOOK_URL` に統一 | notification-design.md・wae-instrumentation-plan.md の参照を同一名称に修正 | 1Password Environments 取り込み時の名前一致を担保 |
| ... | ... | ... | ... | ... | ... |

## DRY 化対象外（意図的重複）

| # | 項目 | 重複が必要な理由 |
| --- | --- | --- |
| 1 | 「無料枠遵守」原則の繰り返し記述 | 各設計書の冒頭で読者に再認識させる目的があるため繰り返し記載してよい |
```

---

## 統合テスト連携

本タスクは spec_created / non_visual の設計タスクであり、この Phase では実装コード・外部監視設定・Secret 投入を実行しない。統合テスト連携は、後段 Wave 2 実装タスクが本 Phase の成果物を入力として実行する。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| 後段 Wave 2 実装タスク | WAE 計装、外形監視設定、通知疎通、D1 / Sheets 失敗検知テスト | 設計・検証観点を定義し、実行は委譲 |
| UT-09 | Sheets→D1 同期失敗検知ルール | UT-09 完了後に閾値とイベント名を再確認 |
| UT-07 | 通知基盤との接続 | 通知チャネル候補として参照し、実装は UT-07 / 後段タスクで確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | AC・成果物一覧 |
| 必須 | outputs/phase-02/monitoring-design.md | 総合設計書（SSOT 起点） |
| 必須 | outputs/phase-02/alert-threshold-matrix.md | 閾値定義 SSOT 候補 |
| 必須 | outputs/phase-02/secret-additions.md | Secret 名 SSOT 候補 |
| 必須 | outputs/phase-02/wae-instrumentation-plan.md | WAE データセット SSOT 候補 |
| 参考 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md | 既存 observability-matrix の SSOT |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | DRY ルールの正本 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/refactoring-log.md | DRY 化記録（Before / After + 対象外一覧） |

---

## 完了条件

- [ ] Phase 2 成果物 9 種を全件スキャンしたことを記録した
- [ ] 重複設定が Before / After テーブルで全件追跡されている
- [ ] SSOT 集約先が各項目について 1 ファイルに確定している
- [ ] DRY 化対象外項目が理由付きで記録されている
- [ ] 05a runbook 参照リンクが `runbook-diff-plan.md` 経由に統一されている
- [ ] `outputs/phase-08/refactoring-log.md` が artifacts.json の phase-08 と整合している

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-08 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次 Phase: 09（品質保証）
- 引き継ぎ: `outputs/phase-08/refactoring-log.md` の SSOT 確定結果を Phase 9 の品質チェック観点（line budget / link parity / 名前一致）の入力として使用する
- ブロック条件: Before / After が記録できないほど重複が多い場合は Phase 2 へ差し戻す
