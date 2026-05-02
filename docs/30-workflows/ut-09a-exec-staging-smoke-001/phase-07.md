# Phase 7: AC マトリクス — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 7 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

各 AC が evidence path / 検証 Layer / 異常系ハンドリングと 1 対 1 対応していることを
マトリクスで確定する。

## 実行タスク

1. AC-1〜AC-6 を evidence path と対応づける。
2. redaction checklist を UI / tail evidence の PASS 条件へ接続する。
3. 09c blocker 更新フォーマットを固定する。

## 参照資料

- docs/30-workflows/ut-09a-exec-staging-smoke-001/phase-06.md
- docs/30-workflows/ut-09a-exec-staging-smoke-001/phase-11.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## 統合テスト連携

- Phase 11 runtime evidence は本 AC matrix に従って PASS / FAIL 判定する
- AC-6 の結果を 09c production deploy gate へ渡す

## AC マトリクス

| AC | 内容 | 検証 Layer | 主 evidence path | 異常系参照 |
| --- | --- | --- | --- | --- |
| AC-1 | `outputs/phase-11/*` の `NOT_EXECUTED` を実測 evidence へ置換 | Layer 5 (artifacts parity) | 09a `outputs/phase-11/*`, 本タスク `outputs/phase-11/main.md` | Phase 6 全般 |
| AC-2 | UI 5 ルート + 認可境界の screenshot / Playwright report + redaction PASS | Layer 1 / Layer 2 | `outputs/phase-11/playwright-staging/`, `manual-smoke-log.md`, `redaction-checklist.md` | UI smoke 系 |
| AC-3 | Forms schema / responses sync の staging 実行と audit dump | Layer 3 | `outputs/phase-11/sync-jobs-staging.json` | Forms sync 系 |
| AC-4 | `bash scripts/cf.sh` 経由 tail 30 分相当の redacted log + redaction PASS | Layer 4 | `outputs/phase-11/wrangler-tail.log`, `redaction-checklist.md` | Workers tail 系 |
| AC-5 | 09a `artifacts.json` と `outputs/artifacts.json` の parity | Layer 5 | `validate-phase-output.js` 出力 | secret / PII |
| AC-6 | 09c blocker 状態の更新 | Layer 6 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` の diff | UI / Forms / tail いずれか FAIL 時 |

## AC-6 更新フォーマット

09c blocker 更新は `blocked|unblocked`, `reason`, `evidence_path`, `checked_at` の 4
項目を `task-workflow-active.md` の 09c 行または近接注記に残す。PASS 時は
`unblocked`、FAIL / 未実行 / redaction 不合格時は `blocked` を維持する。

## 完了判定ルール

- 全 AC が PASS でかつ artifacts parity が PASS の場合のみ Phase 11 を completed にする
- いずれかが FAIL の場合は AC-6 を「09c blocker 維持」状態で更新し、本タスクは
  partial completed とする

## 多角的チェック観点

- 「placeholder のまま」を AC PASS と扱わない
- evidence path のファイル存在だけでなく内容妥当性も確認対象に含める
- AC-6 は AC-1〜AC-5 の結果論理 AND で決まる

## サブタスク管理

- [ ] AC-1〜AC-6 と evidence path の対応を確定
- [ ] AC-6 の PASS / FAIL 判定ロジックを記述
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- AC マトリクスが 1 対 1 で完成している
- AC-6 の判定ロジックが他 AC と論理整合している
- evidence path の不在が AC FAIL に直結する判定式である

## タスク100%実行確認

- [ ] partial completed 時のフォローパスが記述されている
- [ ] AC ↔ evidence path に欠落がない

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクスと判定ロジックを渡す。
