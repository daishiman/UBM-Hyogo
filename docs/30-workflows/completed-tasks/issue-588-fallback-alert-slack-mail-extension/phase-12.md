# Phase 12: Close-out / SSOT 同期 / unassigned 検出

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local-runtime-pending / IMPLEMENTED_LOCAL_RUNTIME_PENDING |

## 12-A. 中学生レベル概念説明

「サーバーが**間違える割合**（fallback rate）が **5% を超える状態が 3 時間続いた**ら、自動で『これは問題かも』と知らせる仕組みがあります。今までは GitHub に Issue（チケット）を作るだけでした。それだと**気付くのが遅れる**かもしれないので、**Slack（チャット）と メール** にも同時に通知が飛ぶようにしました。

ただし、通知に**個人情報や秘密の文字列を載せたら大変なこと**になるので、`userId` や `tenantId`、長い hex（ハッシュ）、認証トークン、Slack の webhook URL を全部 `[REDACTED]`（伏せ字）に置き換えてから送ります。

Slack やメールが**送れなかったとしても**、GitHub Issue だけは絶対に作るようにしてあります。逆に通知系は『ベストエフォート』で、失敗してもログに残すだけ。」

## 12-B. Phase 12 必須 7 outputs

| ファイル | 用途 |
| --- | --- |
| `outputs/phase-12/main.md` | close-out 総括 |
| `outputs/phase-12/implementation-guide.md` | 実装手順 / DoD / コマンド全部入り（Phase 13 PR 本文の元ネタ） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 1-11 の AC / DoD / evidence 整合 check |
| `outputs/phase-12/system-spec-update-summary.md` | `15-infrastructure-runbook.md` への追記要約 |
| `outputs/phase-12/skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への学び |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 unassigned 検出（無ければ「該当なし」明記） |
| `outputs/phase-12/documentation-changelog.md` | 編集した docs / spec / runbook の絶対 path 一覧 |

## 12-C. SSOT 同期 checklist

- [x] `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` 編集
- [x] `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md` に supersede 注記
- [x] `.claude/skills/aiworkflow-requirements/indexes/` 手動同期（quick-reference / resource-map / task-workflow-active）
- [x] `documentation-changelog.md` に上記 path を canonical absolute path で列挙

## 12-D. unassigned task detection

- 親 #549 由来の他 followup（02 / 04 / 05）は本タスクと独立。新規 unassigned 検出なし。
- `EMAIL_WEBHOOK_URL` provider 契約は外部 secret/provider operation であり、実装は env 設定だけで有効化できる状態まで完了した。secret mutation は user-gated runtime boundary として扱い、別 backlog へは送らない。

## 12-E. state vocabulary

| 状態 | 条件 |
| --- | --- |
| `IMPLEMENTED_LOCAL_RUNTIME_PENDING` | 全 unit test PASS / typecheck / lint / dry-run 動作確認済み、production fallback 発火検証 pending |
| `completed` | production で 1 度以上 fallback rate 連続超過が発生し、Slack / mail 通知が観測された後に昇格 |

本タスクは local PASS 取得時点で `IMPLEMENTED_LOCAL_RUNTIME_PENDING` にとどめる。

## 12-F. placeholder token grep gate

```bash
rg -n "TODO|FIXME|XXX|<placeholder>" \
  docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/ \
  scripts/cf-audit-log/observation/fallback-rate-alert.ts
# expected: 0 hits
```

## 12-G. dirty-code gate

`apps/` / `packages/` への dirty diff があれば本タスクとの関連を分類記録する。本仕様書の影響範囲は `scripts/` / `docs/` / `.github/workflows/` のみで、`apps/` / `packages/` は touch しない。

## 出力

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/documentation-changelog.md`
