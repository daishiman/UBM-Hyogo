# Phase 2: 設計 — 09b-A-observability-sentry-slack-runtime-smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09b-A-observability-sentry-slack-runtime-smoke |
| phase | 2 / 13 |
| wave | 09b-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 実装区分 | ドキュメントのみ |

## 目的

Phase 1 で確定した AC / gate / evidence path を満たすための **runbook 構成、1Password item 構造、Cloudflare secret 命名、environment binding map、Sentry test event 仕様、Slack 通知 matrix、rollback / rotation 手順、失敗時 fallback 判定 tree** を最小責務で設計する。
本フェーズはドキュメント設計のみで、実 secret 登録・コード変更・deploy・commit・push・PR は行わない。

## 入力

- Phase 1 確定 AC（AC-01 〜 AC-05）
- Phase 1 evidence path / approval gate / 自走禁止操作リスト
- 正本仕様: `observability-monitoring.md` / `deployment-secrets-management.md`
- CLAUDE.md（`scripts/cf.sh` 経由 / `wrangler` 直接禁止 / op:// 参照）

## 出力（Phase 2 確定アウトプット）

`outputs/phase-02/main.md` に以下を確定する:

1. 1Password item 構造（vault / item / field 名）
2. Cloudflare secret 命名表（apps × env の 4 軸）
3. environment binding 表（wrangler.toml への追記必要箇所）
4. Sentry test event 仕様
5. Slack 通知 matrix
6. rollback / rotation 手順
7. 失敗時 fallback 判定 tree

## 実行タスク

1. **1Password item 構造設計**: vault / item / field 名の正本を定義する。Sentry / Slack について環境ごとに分離。完了条件: AC-03 を満たす op:// 参照のみで実値ハンドリングが完結する設計になっている。
2. **Cloudflare secret 命名の正本確定**: `SENTRY_DSN_API` / `SENTRY_DSN_WEB` / `SLACK_WEBHOOK_INCIDENT` 等の名称を `observability-monitoring.md` の既存名と整合させる。完了条件: 命名衝突がなく、env 別に区別可能。
3. **environment binding マップ**: `apps/api/wrangler.toml` / `apps/web/wrangler.toml` に追記する secret 名と env（staging / production）を表で確定する。実値はコードに書かない。完了条件: Phase 5 が wrangler.toml diff を作るだけで実装可能な粒度。
4. **Sentry test event 仕様**: 送信手段（Sentry SDK の `captureMessage` テスト送信 or curl での envelope POST）、確認画面（Sentry project の Issues 画面）、redact ルール（event id のみ記録、stack trace は非機密 message のみ）。完了条件: AC-01 を Phase 11 で実行可能。
5. **Slack 通知 matrix**: trigger / severity / dedupe window / suppress / channel を表化。完了条件: AC-02 / AC-04 と整合し、INV #17 を満たす。
6. **rollback / rotation 手順設計**: secret 削除 → 1Password 旧 revision 再投入 / DSN ローテーション条件 / webhook URL revoke 手順を整備。完了条件: 任意の rotation シナリオを Phase 5 が手順実行できる。
7. **失敗時 fallback 判定 tree**: Sentry 受信失敗時、Slack 送信失敗時、secret 配置失敗時の fallback を分岐 tree で定義。完了条件: AC-04 が docs として満たされる。

## 制約事項

- 設計内に実 DSN / 実 webhook URL を**書かない**（INV #16）。op:// 参照と secret 名のみ
- Cloudflare 無料枠で運用可能な範囲（INV #14）。Sentry free plan / Slack standard webhook を前提
- secret 投入は `scripts/cf.sh secret put` の stdin 経由のみ。`wrangler` 直接禁止
- 通知頻度上限は free-tier の rate limit を超えない設計に留める

## 検証コマンド

```bash
# 設計に実値が紛れ込んでいないこと
! rg -n "SENTRY_DSN assignment containing an https DSN|hooks\.slack\.com/services/[A-Z0-9]+|sentry\.io/[0-9]+" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-02/

# 必須セクションが揃っていること
grep -q "1Password item" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-02/main.md
grep -q "Cloudflare secret" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-02/main.md
grep -q "通知 matrix\|notification matrix" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-02/main.md
grep -q "rollback\|rotation" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-02/main.md
grep -q "fallback" docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-02/main.md
```


## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 成果物

- `outputs/phase-02/main.md`

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL / spec_created のため、この Phase では実 integration test、secret 登録、Sentry event 発火、Slack webhook 送信を実行しない。
- 後続 runtime execution wave では Phase 11 の evidence contract に従い、staging smoke、redaction grep、approval record を統合証跡として取得する。

## 完了条件

- [ ] 1Password vault / item / field の命名が AC-03 を満たす設計になっている
- [ ] Cloudflare secret 名が apps × env の 4 軸で衝突なく配置される
- [ ] wrangler.toml への追記必要箇所が表で確定し、実値はコードに含めない方針が明記されている
- [ ] Sentry test event 仕様で「event id のみ記録、stack trace 非機密のみ」が明記
- [ ] Slack 通知 matrix が trigger / severity / dedupe window / suppress / channel を網羅
- [ ] rollback / rotation 手順が secret 削除→再投入 / DSN ローテーション / webhook revoke を含む
- [ ] 失敗時 fallback 判定 tree が Sentry / Slack / secret 配置 の各失敗を分岐で扱う

## タスク 100% 実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実 secret 値を書いていない
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ以下を渡す:

- 1Password item 構造 / Cloudflare secret 命名表 / environment binding 表
- Sentry test event 仕様
- Slack 通知 matrix
- rollback / rotation 手順
- 失敗時 fallback 判定 tree
