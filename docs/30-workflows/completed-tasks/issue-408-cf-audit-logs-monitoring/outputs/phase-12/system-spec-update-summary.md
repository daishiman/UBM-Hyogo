# System Spec Update Summary — Issue #408 Cloudflare Audit Logs 監視

aiworkflow-requirements references の SSOT 反映結果を Step 1-A / 1-B / 1-C / Step 2 の 4 段で記述する。Step 2 は新規 secret / observability / incident response contract を正本化するため **適用** とする。

## Step 1-A: 影響行の列挙

### `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

| 影響箇所 | 既存内容 | 追加 / 変更概要 |
| --- | --- | --- |
| 「GitHub Secrets / Variables（CI/CD 用）」 | `CLOUDFLARE_API_TOKEN` の deploy token だけが required secret | `CF_AUDIT_TOKEN_PROD` 行を追加（scope = `Audit Logs:Read`、用途 = 監視、rotation 経路 = deploy Token と独立） |
| 後続の rotation 手順節 | deploy Token rotation のみ記載 | "監視 Token rotation" 小節を追加（90 日、deploy と非同期で交換可能、watchdog による自己 alert 経路） |
| ファイル末尾の参照リンク | — | 本タスク `docs/30-workflows/issue-408-cf-audit-logs-monitoring/index.md` を関連 spec として追記 |

### `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`

| 影響箇所 | 既存内容 | 追加 / 変更概要 |
| --- | --- | --- |
| 09b-A runtime smoke contract 後続 | sync / Sentry / Slack trigger のみ | Issue #408 audit-log monitoring contract を追加（implemented_local / runtime pending、severity label、7 evidence 境界） |

### `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

| 影響箇所 | 既存内容 | 追加 / 変更概要 |
| --- | --- | --- |
| Incident Severity | P0/P1/P2 の一般運用分類 | audit-log HIGH alert を P1 相当として明記 |
| Incident response 手順 | rollback / cron disable / postmortem が中心 | 監視 Token 即失効 → D1 影響調査 → 再発行 → 7 日 baseline 除外の手順を追記 |

## Step 1-B: 更新差分要旨

- 監視と deploy の **secret 分離原則** を SSOT に明文化することで、漏洩時の blast radius を deploy 経路から物理的に切断する設計が runbook 側からも再現できるようにする。
- audit-log alert は既存 incident response の中で **新カテゴリ** として独立（既存 deploy 系インシデントとは初動が異なる: 影響調査が D1 query 主体、deploy 停止は不要）。
- secret 命名規則を `CF_<PURPOSE>_<ENV>` に拡張する整理により、将来の analytics / observability Token の追加にも一貫した語彙を提供する。

> **適用状態**: 上記 SSOT 編集は本サイクルで `implemented_local / runtime pending` として反映済み。workflow / scripts / migration は local 実装済みだが、production Token 発行、GitHub environment secret 登録、D1 migration apply、7 日 baseline、hourly run evidence は未完了として分離する。

## Step 1-C: 検証コマンド

```bash
# (1) 命名規則の追加が反映されたか
grep -n "CF_AUDIT_TOKEN_PROD" \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
# 期待: 1 行以上ヒット

# (2) audit-log 対応手順が runbook に存在するか
grep -nE "audit-log (HIGH )?alert|監視 Token" \
  .claude/skills/aiworkflow-requirements/references/observability-monitoring.md \
  docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
# 期待: 2 行以上ヒット

# (3) 行数 sanity（過剰加筆検出）
wc -l .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
wc -l .claude/skills/aiworkflow-requirements/references/observability-monitoring.md
wc -l docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
# 期待: 編集前比 +30〜+80 行程度

# (4) link integrity
grep -n "issue-408-cf-audit-logs-monitoring" \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
  .claude/skills/aiworkflow-requirements/references/observability-monitoring.md \
  docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
# 期待: 各 1 行以上

# (5) skill index drift
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/
# 期待: drift ゼロで再生成完了
```

## Step 2: System / operations spec sync（適用）

本タスクは会員 / フォーム / 認証のドメインモデルには変更を与えないが、Cloudflare Audit Logs の **監視 / observability / secret / incident response 領域** に新規 contract を追加する。よって Step 2 は `deployment-secrets-management.md`、`observability-monitoring.md`、`15-infrastructure-runbook.md` への system / operations spec sync として **適用** する。

同期済み current facts:

- `CF_AUDIT_TOKEN_PROD` は `Account > Audit Logs:Read` のみで、deploy 用 `CLOUDFLARE_API_TOKEN` と分離する。
- HIGH / MEDIUM / LOW の alert label は `priority:high|medium|low` + `type:security` に統一する。
- Phase 11 placeholder は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` であり、runtime PASS ではない。
- audit-log HIGH alert 時は監視 Token 失効、D1 `cf_audit_log` 調査、Token 再発行、baseline 除外の順で対応する。

ドメイン仕様への影響が後続で発生した場合（例: FU-04 で GitHub Actions audit log を統合し、組織 governance に踏み込む等）は別タスクで追加 Step 2 を実施する。
