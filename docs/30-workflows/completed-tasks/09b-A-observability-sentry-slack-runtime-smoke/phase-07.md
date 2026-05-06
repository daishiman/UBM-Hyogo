# Phase 7: AC マトリクス — 09b-A-observability-sentry-slack-runtime-smoke

[実装区分: ドキュメントのみ]

CONST_004 例外根拠: 本タスクは docs-only / spec_created / remaining-only。本 phase は **AC trace matrix の確定** であり、実 evidence は Phase 11 で取得する spec として AC × evidence path × 検証コマンド × PASS 条件 × 取得 phase × approval gate を 1:1:1:1:1:1 で対応させる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 7 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only / spec_created / remaining-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 確定 AC（5 件）→ 各 Phase 出力 evidence の trace matrix を完成させる。runtime evidence は spec として確定し、実 evidence は実行 wave（Phase 11）で取得することを明記する。

## 入力

- Phase 1 確定 AC（AC-01〜AC-05）と evidence path 6 系統 / approval gate G-01〜G-05
- Phase 4 Test ID 表（T-01〜T-07）
- Phase 5 runbook（Step 0〜7）
- Phase 6 異常系対応表（A-01〜A-06）

## AC matrix 作成ルール

- 各 AC に対し以下を 1:1:1 で対応
  - evidence file path（Phase 11 が取得する path / Phase 12 が更新する path）
  - 検証コマンド（grep / cf.sh secret list / dashboard 目視）
  - PASS 条件（具体的な閾値・出現条件）
  - approval gate 関連（G-01〜G-05 のいずれか）
  - 取得 phase（Phase 11 / Phase 12 / 既に Phase 4-6 で確定）
- docs-only / spec_created / remaining-only なので **「runtime evidence は spec として Phase 4-6 で確定、実 evidence は Phase 11 実行 wave で取得」** を明記
- Phase 11 で取得する evidence と Phase 5 / Phase 6 の手順との対応関係を確定


## 実行タスク

1. この Phase の入力、出力、approval gate、redaction 境界を確認する。
2. 実 secret 値、DSN URL、Slack webhook URL、token 値が仕様書に含まれていないことを確認する。
3. 後続 Phase または runtime wave へ引き渡す evidence path を明示する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 成果物

- `outputs/phase-07/main.md`

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件

- AC-01〜AC-05 すべてが evidence path / 検証コマンド / PASS 条件 / 取得 phase / approval gate に紐づく
- coverage gap がないことの self-check が記録される
- `outputs/phase-07/main.md` に matrix 表が確定する

## タスク100%実行確認

- [ ] AC × evidence の対応漏れがない
- [ ] runtime evidence と spec evidence の境界が明示されている
- [ ] approval gate G-01〜G-05 がすべて matrix のいずれかに登場する
- [ ] 実装・deploy・commit・push・PR を本タスク内で実行していない

## 引き渡し用 AC matrix（概要）

| AC | 取得 phase | 主 evidence path |
| --- | --- | --- |
| AC-01 | Phase 11 | `outputs/phase-11/sentry-test-event-id.md` |
| AC-02 | Phase 11 | `outputs/phase-11/slack-test-notification-evidence.md` |
| AC-03 | Phase 11 | `outputs/phase-11/redaction-grep-result.md` |
| AC-04 | Phase 6（spec）／ Phase 11（実発生時） | `outputs/phase-06/main.md` |
| AC-05 | Phase 12 | `outputs/phase-12/runbook-diff.md` |

詳細表は `outputs/phase-07/main.md` に確定。

## 次 Phase への引き渡し

Phase 8 へ、AC matrix を渡す。Phase 8 以降は本 matrix を check list として実行 wave（Phase 11）の入力とする。Phase 11 終了時には matrix の各行が「PASS / 取得済 evidence path」で埋まっていることを Phase 13 PR 本文の品質ゲートとする。
