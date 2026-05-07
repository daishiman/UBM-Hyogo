# Phase 3: 設計レビュー — 09b-A-observability-sentry-slack-runtime-smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 3 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 実装区分 | ドキュメントのみ |

## 目的

Phase 2 の設計（1Password item / secret 命名 / binding / Sentry test event 仕様 / Slack 通知 matrix / rollback-rotation / fallback tree）を、矛盾・漏れ・整合性・依存関係の 4 観点でレビューし、Phase 4（テスト戦略）への前提引き渡し可否を判定する。

## 入力

- Phase 1 確定 AC / evidence path / approval gate / 自走禁止操作
- Phase 2 設計 output（`outputs/phase-02/main.md`）
- 既存 09b runbook（incident-response-runbook.md / release-runbook.md）
- 正本仕様（observability-monitoring.md / deployment-secrets-management.md）

## 出力（Phase 3 確定アウトプット）

`outputs/phase-03/main.md` に以下を確定する:

1. レビュー観点 6 件に対する PASS / FIX-NEEDED / DEFER 判定
2. 修正必要点（あれば）と Phase 2 への戻り判断
3. Phase 4 へ進む GO/NO-GO 判定
4. レビュー gate 記録（reviewer / tag / 日時）

## 実行タスク

1. **不変条件レビュー**: INV #14 / #16 / #17 が Phase 2 設計の各セクションに反映されているか確認。完了条件: 各 INV に紐づく Phase 2 セクションが特定でき、欠落がない。
2. **secret 漏洩リスクレビュー**: grep gate / op:// 参照のみ / repo / log / PR body / evidence の各箇所で実値が残らないことを設計上担保しているか検証。完了条件: 全箇所に値が残らない経路設計になっている。
3. **runbook 完備性レビュー**: rollback / rotation / fallback がすべて Phase 2 に記述されているか確認。完了条件: 6.1 / 6.2 / 6.3 / 7（fallback tree）が連続していて漏れがない。
4. **既存 runbook との整合性レビュー**: 09b incident-response-runbook / release-runbook の placeholder と本設計の secret 名が衝突しないか確認。`SLACK_ALERT_WEBHOOK_URL` 既存名と `SLACK_WEBHOOK_INCIDENT` 新規名の互換 / migration path が明記されているか。完了条件: 整合性または明示的な migration 設計が確認できる。
5. **approval gate / 自走禁止カバレッジレビュー**: G-01 〜 G-05 が全実 secret 操作 / deploy / commit / push / PR をカバーしているか確認。完了条件: 自走禁止操作リストの全項目が gate に紐づく。
6. **Phase 4 前提引き渡し可否判定**: テスト戦略（Phase 4）が必要とする入力（AC・evidence path・通知 matrix・fallback tree）が揃っているか判定。完了条件: GO/NO-GO のいずれかが結論として出る。

## 制約事項

- 本フェーズは review 文書作成のみで、実 secret 登録・コード変更・deploy・commit・push・PR は行わない
- 修正が必要と判断された場合は Phase 2 に戻すか、本フェーズで修正案を併記して Phase 4 へ送るかを Phase 3 output で判断記録する

## 検証コマンド

```bash
# Phase 3 output に必須セクションが揃っていること
grep -q "PASS\|FIX-NEEDED\|DEFER" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-03/main.md
grep -q "GO\|NO-GO" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-03/main.md

# 設計に実値が紛れ込んでいないこと（Phase 1/2 と再確認）
! rg -n "SENTRY_DSN assignment containing an https DSN|hooks\.slack\.com/services/[A-Z0-9]+|sentry\.io/[0-9]+" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/

# 既存 runbook の参照があること
grep -q "incident-response-runbook\|release-runbook" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-03/main.md
```


## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 成果物

- `outputs/phase-03/main.md`

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件

- [ ] 6 レビュー観点それぞれに PASS / FIX-NEEDED / DEFER 判定が記録されている
- [ ] FIX-NEEDED があれば Phase 2 戻し判断 or 本フェーズ修正併記の方針が明記されている
- [ ] Phase 4 への GO/NO-GO 判定が結論として出ている
- [ ] reviewer / tag（design-review / self-review）/ 日時が記録されている
- [ ] 既存 runbook（09b/09c）との整合性が確認されている

## タスク 100% 実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実 secret 値を書いていない
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ以下を渡す:

- 確定 AC / evidence path / approval gate
- レビュー済み 1Password item 構造 / secret 命名 / binding 表
- レビュー済み Slack 通知 matrix / Sentry test event 仕様
- レビュー済み rollback / rotation / fallback tree
- GO 判定およびレビュー gate 記録
