# Phase 6: 異常系検証（証跡欠落 / unattributed 経路）

[実装区分: ドキュメントのみ仕様書]

## 目的

監査ランブック実行中に発生しうる異常系を列挙し、それぞれの分岐とフォールバックを確定する。

## 異常系シナリオ

### A1: `bash scripts/cf.sh whoami` が exit 0 を返さない

- 原因候補: 1Password / `.env` / API Token 経路の drift（UT-09A 系の状態）
- 対応: 本監査タスクは blocked。`ut-09a-cloudflare-auth-token-injection-recovery-001` 完了後に再開
- 記録: `outputs/phase-11/main.md` に `BLOCKED_ON_UT_09A` を記載し中断

### A2: `d1_migrations` ledger 取得が失敗

- 原因候補: production D1 binding 不整合 / token scope 不足
- 対応: 監査停止し、`outputs/phase-11/main.md` に失敗 evidence 記録。production への write 試行は禁止
- 記録: 失敗時の stderr を redacted で保存

### A3: applied timestamp が Phase 13 evidence と不一致

- 原因候補: 別 apply が後続で実行された / 元 evidence の取得 timestamp が異なる
- 対応: 不一致を `outputs/phase-11/timestamp-mismatch.md` に記録。本監査は `unattributed` 寄り判定（confirmed の前提が崩れる）
- ゲート: AC-1 不成立として扱う

### A4: 候補が 0 件

- 原因候補: 2026-05-01 前後に該当 commit / PR / workflow run がそもそも存在しない
- 対応: `unattributed` 確定。再発防止策 formalize へ進む（Phase 12 `recurrence-prevention-formalization.md`）
- 注意: 候補 0 件は妥当な結論であり、エラーではない

### A5: 複数候補が `confirmed` 評価される

- 原因候補: 同日に複数の正規 workflow が走った
- 対応: 各候補の `approval_evidence` 強度（PR review / runbook entry）と apply timestamp 以前または同時刻であることを確認し、最強候補を `decision: confirmed (workflow=...)` に採用。2026-05-02 の Phase 13 user 承認は observed apply 後の contextual evidence であり、confirmed 根拠には使わない
- 補足: 採用しなかった候補も `attribution-decision.md` に「考慮済み」として残す

### A6: redaction スキャンで違反検出

- 原因候補: ledger / log 出力に account id / token 部分文字列が含まれる
- 対応: 該当ファイルを redacted 版に置換し、commit には含めない。`outputs/phase-11/redaction-checklist.md` に違反検出箇所と修正手順を記録
- ゲート: AC-7 不成立として扱う（修正後再検証）

### A7: 監査前後 ledger row 数が異なる

- 原因候補: 監査中に他者が apply / rollback を行った可能性
- 対応: 監査停止。`outputs/phase-11/read-only-checklist.md` に row 数差分を記録し、ユーザーへエスカレーション
- ゲート: AC-8 不成立として扱う

### A8: 親 workflow Phase 13 evidence へ cross-reference 追加が必要だが、追記対象ファイルが移動 / 改名されている

- 原因候補: completed-tasks 配下の構造変更
- 対応: 移動先を `git log --follow` で追跡し、現行 path に追記。元 path がない場合は `task-issue-191-...` の `index.md` 末尾に追記
- 記録: cross-reference-plan.md に「実 path」「移動前 path」を併記

## 出力 (`outputs/phase-06/main.md`)

- A1〜A8 の異常系表
- 各シナリオの分岐・フォールバック・ゲート

## 完了条件

- [ ] 8 シナリオ全てに対応手順が定義されている
- [ ] 「監査停止 / 続行 / 再判定」の判断基準が明確

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
