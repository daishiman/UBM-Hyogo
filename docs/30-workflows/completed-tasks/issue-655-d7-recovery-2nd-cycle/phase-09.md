# Phase 9 — 運用準備

## 目的

D'+0 reset / daily check 経路 / code freeze 通達 / max 2 周ガード を運用フローとして確定する。

## 9-1. D'+0 確定手順

1. PR-A を `dev` に merge する
2. (production-code 修正を含む場合) `dev` → `main` リリース後に `cf-audit-log-monitor.yml` の hourly schedule が回り、最初に `conclusion=success` になった hourly run を取得:
   ```bash
   gh run list --workflow=cf-audit-log-monitor.yml --status=success --limit 1 --json createdAt,htmlUrl
   ```
3. 取得した `createdAt` を D'+0 として `recovery-rootcause.md` の frontmatter `d_prime_zero` フィールドに記載
4. D'+7 = D'+0 + 168 hour を計算し記録

## 9-2. Daily check 経路

D'+1 / D'+3 / D'+5 に next-day operator が実行する:

```bash
gh run list --workflow=cf-audit-log-monitor.yml --limit 25 \
  --json conclusion,createdAt,databaseId,htmlUrl >> \
  outputs/phase-11/evidence/hourly-run-daily-check-recovery.md
```

結果が連続 success かつ artifact 件数が想定通り(`actions/list-workflow-run-artifacts` で 1 件以上)であることを確認。

## 9-3. Code freeze 通達

recovery window (D'+0 〜 D'+7) 中、以下の path への新規 PR は freeze。

| path | 凍結理由 |
| --- | --- |
| `.github/workflows/cf-audit-log-*.yml` | hourly run の動作変更 = recovery snapshots 汚染 |
| `scripts/cf-audit-log/**` | 同上 |

凍結検知用 grep gate (任意):
```bash
git diff origin/dev --name-only | grep -E "^(\.github/workflows/cf-audit-log-|scripts/cf-audit-log/)" \
  && echo "::error::recovery window 中の cf-audit-log path 変更禁止" && exit 1
```

freeze 通達は `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の追記セクション (Phase 5-4) で正本化する。

## 9-4. Max 2 周ガード

`recovery-rootcause.md` frontmatter に `cycle: 2` を記載。3 周目を要する事態になった場合は本タスク内で打ち切り、canonical state は `runtime_pending` に据え置き、運用ラベル `escalated` として `recovery-rootcause.md` に追記。

## 完了条件

- [ ] 9-1〜9-4 が runbook に反映されている
- [ ] daily check の operator hand-off note が PR-A 本文に明記されている
