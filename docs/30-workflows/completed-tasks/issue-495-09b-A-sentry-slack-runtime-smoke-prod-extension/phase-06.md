# Phase 6: 異常系検証 — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 6 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5 runbook の失敗パターンと escalation 経路を A-ID で固定する。production 拡張で新規発生する failure mode（production_confirm 欠落 / staging→production cross-contamination）を含める。

## 入力

- Phase 5 runbook
- Phase 2 設計（route 入出力表 / G1〜G4）
- Phase 1 AC-P1〜AC-P6

## 異常系一覧

| A-ID | 概要 | trigger 条件 | detection | recovery | rollback / 再 smoke 条件 |
| --- | --- | --- | --- | --- | --- |
| A-01 | production_confirm 欠落で 403 | curl で `x-smoke-production-confirm` 付け忘れ | response `errorCode: PRODUCTION_CONFIRM_REQUIRED` | header 付与で再叩き | 再 smoke 1 回まで・連投禁止 |
| A-02 | token mismatch で 401 | Bearer token 不一致 / 古い token | response 401 | op:// 参照を再取得して再叩き | 認証修復後に再 smoke 1 回 |
| A-03 | DSN 欠落 / 無効 | production secret 未配置 / typo | response の `sentry.errorCode = CONFIG_MISSING / CONFIG_INVALID` | `cf.sh secret list` で確認 → 1Password 値再投入 | 配置後に再 smoke。secret rollback は staging で dry-run 経由 |
| A-04 | Slack webhook 失敗 | webhook revoked / 401 / invalid_payload / fetch reject | response の `slack.errorCode = UPSTREAM_ERROR` / status 4xx / `slack fetch failed` | webhook 状態を Slack 管理画面で確認、必要なら revoke + 再発行 | 新 webhook を 1Password 更新 → secret rollback → 再 put → 再 smoke |
| A-05 | redaction grep hit | DSN / webhook / token が docs/log/PR/evidence に混入 | T-10 の `rg -n` が 1 件以上 hit | **即時**: 該当行を redact、未 commit なら `git restore`、commit 済みなら新 commit で削除（履歴削除は user approval 必須）/ 漏洩値の rotation / revoke を即時実行 | rotation / revoke 完了まで G4 通過禁止 |
| A-06 | staging→production cross-contamination | production env の `cf.sh secret list` 受信先 project が staging | production secret を delete → 1Password の production item で再 put → Sentry / Slack 双方で受信先確認 | rollback 後に Step 5 をやり直し。受信履歴に staging mix が残る場合は Sentry / Slack 側で event を delete し event id を redact 化 |
| A-07 | production smoke の Slack message が `[STAGING SMOKE]` prefix で着信 | `smokeMessagePrefix` ロジック誤実装 / `c.env.ENVIRONMENT` 設定漏れ | T-09 evidence の prefix 確認で発覚 | route コード再修正 + redeploy + 再 smoke | 是正前は G4 通過禁止 |
| A-08 | production smoke の連投で alert noise | smoke を G3 後に複数回叩く | Slack channel に同一 prefix message が並ぶ | 1 回叩いたら G4 まで進める。意図せざる連投は incident note に記録 | 連投禁止。1 回 PASS → G4 へ |

## production 特有 approval gate（重大事故）

| 事象 | 必要 approval |
| --- | --- |
| A-05（漏洩確定） | rotation / revoke 実行承認 + 履歴削除可否判断 |
| A-06（cross-contamination） | 即時 secret delete / Sentry / Slack 影響範囲確認承認 |
| A-07（誤 prefix） | 緊急 redeploy 承認 |
| 連続失敗（A-01〜A-04 で 2 回連続） | 人間判断による中止 |

## alert fatigue / suppress

- production smoke は G3 通過後 **1 回のみ**。再実行は escalation 経由
- staging との混乱回避のため Slack channel を分離するか prefix 識別を必ず確認
- T-08 staging smoke も rerun 間 1 分以上空ける

## 検証コマンド

```bash
# A-05 redaction
rg -n 'hooks\.slack\.com/services/[A-Z0-9]+|sentry\.io/[0-9]+/[0-9]+|xox[bp]-' docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/

# A-03 secret 名のみ確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
```

## 成果物

- `outputs/phase-06/main.md`

## 完了条件

- A-01〜A-08 すべてに detection / recovery / rollback / 再 smoke 条件
- production 連投禁止が runbook 化
- 重大事故時 approval gate 明示

## 次 Phase への引き渡し

Phase 7 へ: AC × 異常系の trace。
