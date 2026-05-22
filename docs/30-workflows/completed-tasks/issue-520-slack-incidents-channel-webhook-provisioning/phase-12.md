# Phase 12: ドキュメント更新 — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 12 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local（ローカル redaction script / `.env.example` / `apps/api` redaction test hardening 反映済み。実 channel 作成・実 webhook 発行・実 secret 投入・実 smoke 発火 / commit / push / PR は未実施） |

## 目的

task-specification-creator skill の Phase 12 仕様（6 必須タスク）を完遂し、aiworkflow-requirements 正本（observability-monitoring.md / deployment-secrets-management.md）と本タスクの provisioning 結果（channel 名・webhook secret 命名規則・op:// 参照規約）を同期する。implementation / NON_VISUAL / approval-gated runtime pending タスクとして workflow_state は `implemented-local` に分類し、external runtime wave で最終判定する。

## workflow_state 分類の根拠

- 本サイクルではローカルの redaction script、`.env.example`、`apps/api` redaction test hardening、runbook、正本仕様同期を実ファイルへ反映したため `implemented-local` とする
- 実 Slack channel 作成 / 実 webhook 発行 / 実 secret 投入 / 実 smoke 発火 / commit / push / PR は実行しない（NON_VISUAL / SaaS 不可逆 操作 / G1〜G4 user approval 前段）
- Phase 12 close-out で `completed` への書き換えは禁止する（external runtime pending ルール）

## 依存成果物参照

- Phase 5: `outputs/phase-05/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- Phase 8: `outputs/phase-08/main.md`
- Phase 9: `outputs/phase-09/main.md`
- Phase 10: `outputs/phase-10/main.md`

## 6 必須タスク

### Task 12-1: 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）

- output: `outputs/phase-12/implementation-guide.md`
- Part 1（中学生レベル / 必須テンプレート）:
  > 「Slack の通知部屋を新しく作って、サーバーが何かあったときにそこに自動で連絡が届くように、通知の合鍵（webhook URL）を金庫（1Password）にしまう作業です。合鍵の中身は誰かに見えると悪用されるので、ファイルや PR には絶対に書かず、金庫の場所を指す番号札（op://...）だけを書きます。さらに、合鍵を使う『ステージング（練習用サーバー）』と『本番サーバー』の 2 つに、合鍵を順番に登録します。本番に登録する前に必ず練習用で動作確認し、人が OK を出した後に次に進む（G1〜G4 の 4 つの確認ゲート）ルールにします。」
  - 「なぜ 4 段階の確認ゲートが必要なのか（不可逆な作業を取り消せないため）」
  - 「なぜ webhook の URL を log や PR に書いてはいけないのか（漏れたら誰でもこの部屋に偽メッセージを投げられるため）」を平易に
- Part 2（技術者レベル）:
  - Slack channel `#ubm-hyogo-incidents` 作成手順（admin UI 操作 / channel slug 規約）
  - incoming webhook 発行手順（idempotent / 既存有効時の再利用判定）
  - 1Password item path 規約: `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>`
  - `bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --env <env>` 投入順序（staging → production）
  - GitHub Actions secret 登録手順（`gh secret set SLACK_WEBHOOK_INCIDENT --repo daishiman/UBM-Hyogo`）
  - `apps/api/src/routes/admin/smoke-observability.test.ts` への redaction-safe assertion 追記方針（response が webhook URL fragment を含まないことの assertion）
  - `.env.example` への `SLACK_WEBHOOK_INCIDENT="op://Vault/Item/Field"` プレースホルダー追加方針
  - rollback 手順（incident channel archive / webhook revoke / secret delete の逆順）
  - G1〜G4 multi-stage approval gate と evidence path（channel-provisioning-log.md / webhook-smoke-log.md）への内部 link
- 完了条件: 同一ファイル内 Part 1 / Part 2 section 分割、Part 2 から Phase 1 / Phase 2 / Phase 11 への内部 link

### Task 12-2: システム仕様書更新

- output: `outputs/phase-12/system-spec-update-summary.md`（Step 1-A / Step 1-B / Step 1-C 章立て）
- 編集対象（canonical absolute path）:
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-150841-wt-9/.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
    - 追記内容: incident channel 名 `ubm-hyogo-incidents` の正本指定 / `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` prefix と channel の対応 / Sentry-to-Slack ではなく直接 webhook 経路である旨
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-150841-wt-9/.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
    - 追記内容: `SLACK_WEBHOOK_INCIDENT` の op:// 参照規約（`op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>`）/ Cloudflare staging+production 両方への投入義務 / `cf.sh secret put` 経由必須 / GitHub Actions secret 登録要件 / redaction grep gate 4 系統
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-150841-wt-9/.claude/skills/aiworkflow-requirements/indexes/keywords.json`（必要時のみ）
    - 追加候補: `ubm-hyogo-incidents`, `SLACK_WEBHOOK_INCIDENT`, `incoming webhook`, `incident channel provisioning`
- Step 1-A: 該当ファイルの現状把握（diff 前）
- Step 1-B: 追記差分の文面案
- Step 1-C: indexes rebuild（`mise exec -- pnpm indexes:rebuild`）と drift 0 確認
- 完了条件: 2 reference の diff 案が summary に記録 / keywords.json 更新有無の判定理由 / indexes drift 0

### Task 12-3: ドキュメント更新履歴

- output: `outputs/phase-12/documentation-changelog.md`
- 内容（canonical absolute path で列挙）:
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-150841-wt-9/docs/30-workflows/LOGS.md` への追記エントリ案（issue-520 implemented-local）
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-150841-wt-9/.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` への追記エントリ案（observability-monitoring / deployment-secrets-management 更新）
  - `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-150841-wt-9/.claude/skills/task-specification-creator/SKILL-changelog.md` への追記エントリ案（NON_VISUAL secret-only タスクの phase-11 template 適用例）
  - 関連 AC（AC-1〜AC-8）と 1:1 で更新理由を紐付け
- 完了条件: 上記 3 ファイルへの追記文面が canonical absolute path 付きで列挙されている

### Task 12-4: 未タスク検出レポート（0 件でも出力必須）

- output: `outputs/phase-12/unassigned-task-detection.md`
- 検出対象例:
  - Slack app（bot token）化への移行（incoming webhook → bot token）
  - PagerDuty 連携 / on-call rotation
  - Sentry-to-Slack 公式連携（Sentry alert rule からの自動通知）
  - smoke の cron 定期実行化
  - production smoke の rotation 監査（webhook revoke + 再発行 cycle）
  - 09c production deploy readiness の observability gate との連動
- 完了条件: `unassigned 件数: <数>` を必ず明示（0 件でも `unassigned 件数: 0` を明記）

### Task 12-5: スキルフィードバックレポート（3 観点固定 / 改善点なしでも章立て出力）

- output: `outputs/phase-12/skill-feedback-report.md`
- 章立て:
  1. テンプレ改善: NON_VISUAL secret-only タスクで phase-11 が「実コード変更ゼロ + 外部 SaaS 不可逆操作 + secret 配置」という変則パターンに対応するための template 改善余地
  2. ワークフロー改善: G1〜G4 multi-stage approval gate を 4 配置先（1Password / Cloudflare staging / Cloudflare production / GitHub Actions）にマッピングする運用の改善余地
  3. ドキュメント改善: aiworkflow-requirements の `observability-monitoring.md` と `deployment-secrets-management.md` の境界（channel 命名は前者 / secret 命名は後者）の明確化余地
- 完了条件: 各観点に最低 1 段落（改善点なしと判断した場合もその根拠を 1 段落で）

### Task 12-6: タスク仕様書コンプライアンスチェック

- output: `outputs/phase-12/phase12-task-spec-compliance-check.md`
- 確認項目:
  - 6 必須タスクに対応する 7 ファイル実体存在
  - Phase 11 が `channel-provisioning-log.md` / `webhook-smoke-log.md` を分離設計
  - 状態語彙 PASS_BOUNDARY_SYNCED_RUNTIME_PENDING の適用
  - aiworkflow-requirements 2 reference 同期（diff 案 + indexes drift 0 計画）
  - 実 webhook URL / token / workspace 固有 URL fragment（実値は 1Password 管理 / pattern は env var 注入）が repository scan で 0 件（grep 4 系統、既存 redaction-test fixture と既存 legacy docs の明示 allowlist を除外）
  - workflow_state が `implemented-local` であり、external runtime は pending として分離されている
  - D1 schema parity = N/A（secret-only）が明記されている
  - visualEvidence: NON_VISUAL が明記されている

## 7 必須ファイル

| # | path |
| --- | --- |
| 1 | `outputs/phase-12/main.md` |
| 2 | `outputs/phase-12/implementation-guide.md` |
| 3 | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | `outputs/phase-12/documentation-changelog.md` |
| 5 | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | `outputs/phase-12/skill-feedback-report.md` |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## LOGS.md 更新エントリ案（canonical absolute path）

| target file | 追記内容 |
| --- | --- |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-150841-wt-9/docs/30-workflows/LOGS.md` | `2026-05-07 / issue-520-slack-incidents-channel-webhook-provisioning / implemented-local / NON_VISUAL / Slack incidents channel + webhook provisioning specification (G1-G4 gates defined, runtime evidence pending)` |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-150841-wt-9/.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | `2026-05-07 / observability-monitoring.md + deployment-secrets-management.md sync planned for SLACK_WEBHOOK_INCIDENT / ubm-hyogo-incidents channel naming (issue-520)` |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-150841-wt-9/.claude/skills/task-specification-creator/SKILL-changelog.md` | `v2026.05.07-issue520-slack-secret-provisioning-boundary` |

## 実行ルール

- aiworkflow-requirements 更新と indexes rebuild は same-wave sync として実施する
- 実 Slack / 1Password / Cloudflare / GitHub / smoke の外部副作用だけを user approval 後の runtime wave に残す
- 実 webhook URL / token / workspace fragment を docs に絶対に書かない
- commit / push / PR は本仕様書 cycle で行わない
- workflow_state は `implemented-local`、external runtime は pending として分離する

## 制約事項

- redaction-safe 原則: docs / log / changelog / feedback / compliance check いずれにも webhook URL 実値・token・workspace fragment を書かない
- 中学生レベル説明テンプレ（Part 1）は本 phase に明記された文面を踏襲する
- Phase 12 で `completed` 書き換えを行わない（NON_VISUAL / external runtime pending）

## 成果物

- 上記 7 ファイル

## 完了条件

- [ ] 7 ファイル実体存在
- [ ] aiworkflow-requirements 2 reference の diff 案が `system-spec-update-summary.md` に記録
- [ ] LOGS / _legacy / SKILL-changelog の追記エントリ案が canonical absolute path 付きで列挙
- [ ] unassigned-task-detection.md が `unassigned 件数: <数>` を明示
- [ ] skill-feedback-report.md が 3 観点章立てで出力（改善点なしでも根拠記述）
- [ ] phase12-task-spec-compliance-check.md が D1 parity N/A / NON_VISUAL / workflow_state implemented-local と external runtime pending の分離を確認
- [ ] 実 webhook URL / token / workspace fragment が docs に含まれていない（grep gate 0 hit 計画）

## タスク 100% 実行確認

- [ ] 6 必須タスクすべてが output ファイルに対応
- [ ] workflow_state が `implemented-local` であり、external runtime pending と分離されている
- [ ] Part 1 中学生レベル説明テンプレが指定文面を含んでいる
- [ ] commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ: PR title / body 骨子 / branch 名 / G ゲート方式（G1〜G4 + Phase 13 commit / push / PR の独立承認）/ self-check / redaction 最終確認手順。

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- 必須成果物が存在し、runtime pending と static PASS の境界が明記されている。

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
