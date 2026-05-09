# Phase 10: ローカル / staging 検証 / cron trigger dry-run / Slack dry-run channel 投稿

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| Source | `outputs/phase-10/phase-10.md` |
| 区分 | 検証（fixture-driven + staging live cron 1 run） |
| 想定所要 | 0.75 人日 |

## 目的

Phase 5-9 で実装 / 反映した live wiring を、ローカル `wrangler dev --test-scheduled` と staging Cloudflare Worker で検証し、**HIGH severity finding が Slack dry-run channel に redact-safe payload で投稿される**ことと、**staging D1 `audit_correlation_findings` row に PII / secret literal が露出しない**ことを 1 回の cron 実行 evidence で示す。

production への展開は Phase 13 G2 / G3 ゲート後に限定し、本 Phase では production への deploy / production 側 cron 起動は **行わない**。

## 実行タスク

1. **vitest / bats / shellcheck / actionlint（fixture 駆動の事前 green 確認）**
   ```bash
   mise exec -- pnpm --filter @ubm/api test src/audit-correlation src/routes/audit-correlation
   mise exec -- bash scripts/audit-correlation/__tests__/grep-gate.bats
   mise exec -- bash scripts/audit-correlation/__tests__/runner-determinism.bats
   mise exec -- bash scripts/audit-correlation/__tests__/live-mode.bats
   shellcheck scripts/audit-correlation/*.sh
   mise exec -- pnpm dlx @rhysd/actionlint-runner@latest .github/workflows/audit-correlation-verify.yml
   ```

2. **ローカル `wrangler dev --test-scheduled` 起動**

   `bash scripts/cf.sh` 経由で `wrangler dev` を起動し、scheduled trigger を擬似発火する。

   ```bash
   # ターミナル A: scheduled handler を有効化した wrangler dev を起動
   bash scripts/cf.sh dev \
     --config apps/api/wrangler.toml \
     --env staging \
     --test-scheduled \
     --local \
     2>&1 | tee outputs/phase-10/wrangler-dev-scheduled.log &

   # 起動待機（Ready on http://127.0.0.1:8787 を log から確認）
   for i in 1 2 3 4 5 6 7 8 9 10; do
     grep -q 'Ready on' outputs/phase-10/wrangler-dev-scheduled.log && break
     sleep 2
   done

   # ターミナル B: scheduled trigger を擬似発火
   curl -fsS "http://127.0.0.1:8787/__scheduled?cron=*%2F15+*+*+*+*" \
     -o outputs/phase-10/wrangler-dev-scheduled-response.json

   # 終了
   pkill -f 'wrangler dev' || true
   ```

   期待: log に `runCorrelation start` / `runCorrelation done` 相当のログ行が含まれ、Slack 送信は dry-run channel 設定（`AUDIT_CORRELATION_SLACK_DRY_RUN=true`）が反映されている。

3. **staging への deploy**

   ```bash
   bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \
     2>&1 | tee outputs/phase-10/staging-deploy.log

   # deploy 後の version / triggers 確認
   bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging \
     | tee outputs/phase-10/staging-deployments.log
   ```

4. **staging cron 1 回待機 → D1 row 観測**

   cron は `*/15 * * * *` のため、deploy 直後から最大 15 分待機して 1 回起動を観測する。

   ```bash
   # 待機（最大 16 分）。観測はログ tail で行い、観測完了後に break。
   bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging \
     --format json --search 'runCorrelation' \
     2>&1 | tee outputs/phase-10/staging-cron-1run.log &
   TAIL_PID=$!
   sleep 960  # 16 分 = 1 cron interval + 1 分余裕
   kill "$TAIL_PID" || true

   # cron 1 回起動が観測できたことを log から grep 確認
   grep -E '"runCorrelation":"start"|"runCorrelation":"done"' outputs/phase-10/staging-cron-1run.log

   # D1 row 観測（直近 1 時間以内に格納された row の件数のみ取得。値は select しない）
   bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
     --command "SELECT COUNT(*) AS cnt FROM audit_correlation_findings WHERE created_at >= strftime('%s','now') - 3600;" \
     | tee outputs/phase-10/staging-d1-row-count.log
   ```

   期待: `cnt >= 0`（live GitHub audit log が静かなときは 0 件もあり得るので、件数の最低保証は次の Step 5 で synthetic HIGH を流して保証する）。

5. **検証用 fixture を意図的に HIGH severity 化して Slack dry-run channel に流す**

   live `/orgs/{org}/audit-log` から HIGH が偶然出る保証はないため、`POST /internal/audit-correlation/run` に **synthetic fixture を payload で渡す手動 trigger** を実行する。internal token は op 参照経由で stdin から `Authorization: Bearer` ヘッダに注入する。

   ```bash
   # internal token を環境変数に揮発的に展開（log には残らない）
   export INTERNAL_TOKEN="$(op read 'op://CloudflareSecurity/AuditCorrelationInternalToken/value')"

   # synthetic HIGH severity fixture（同一 fingerprint で 5 分以内の cross-source イベント）
   curl -fsS -X POST \
     "https://ubm-hyogo-api-staging.<account>.workers.dev/internal/audit-correlation/run" \
     -H "Authorization: Bearer ${INTERNAL_TOKEN}" \
     -H "Content-Type: application/json" \
     --data-binary @scripts/audit-correlation/fixtures/synthetic-high-payload.json \
     -o outputs/phase-10/staging-high-trigger-response.json

   # token を即時 unset（プロセス継続中も値を保持しない）
   unset INTERNAL_TOKEN

   # response を確認（severity HIGH の finding が 1 件以上含まれること）
   jq '.findings | map(select(.severity == "HIGH")) | length' \
     outputs/phase-10/staging-high-trigger-response.json
   ```

   `scripts/audit-correlation/fixtures/synthetic-high-payload.json` の中身は Phase 5 で実装済みの fixture を流用し、redact-safe フィールドのみで構成（実 email / 実 IP / 実 UA を含まない）。

6. **Slack dry-run channel 投稿確認**

   Phase 5 の `notify-slack.ts` は `AUDIT_CORRELATION_SLACK_DRY_RUN=true` のとき投稿先 webhook を staging dry-run channel に切り替える。実投稿は Slack 側で目視確認すると同時に、Worker から送信した payload 構造を log に保存する（payload 自体に PII / secret が含まれていないことを後段の grep gate で検証する）。

   ```bash
   # staging Worker tail で notify-slack の送信 payload を log として捕捉
   bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging \
     --format json --search 'notifySlack:payload' \
     2>&1 | tee outputs/phase-10/slack-dryrun-tail.log &
   TAIL_PID=$!
   sleep 30
   kill "$TAIL_PID" || true

   # 捕捉した log 行から payload JSON だけを抽出
   jq -c 'select(.message.payload != null) | .message.payload' \
     outputs/phase-10/slack-dryrun-tail.log \
     > outputs/phase-10/slack-dryrun-payload.json

   # Slack UI 上で dry-run channel に投稿が来ていることを目視確認し、結果を outputs/phase-10/phase-10.md に記録
   ```

   期待: `slack-dryrun-payload.json` に以下のみ含まれる:
   - `text` / `blocks` の表示文字列に runbook URL（`AUDIT_CORRELATION_RUNBOOK_BASE_URL` 起点）
   - `fingerprint_hash_prefix`（先頭 8 文字）
   - `actor_domain`、`ip_prefix`、`ua_bucket`、`severity`、`event_type`、`fingerprint_version`、`observed_at`

   含まれないこと: full email / email local-part / full IP / full UA / raw payload / PAT literal / webhook URL literal。

7. **grep gate を staging D1 永続化レコードに対して実行**

   ```bash
   # 直近 1 時間の row を redact-safe 列のみで dump（保存禁止列が schema に存在しないこと前提）
   bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
     --command "SELECT id, fingerprint_hash_prefix, fingerprint_version, actor_domain, ip_prefix, ua_bucket, severity, event_type, observed_at, created_at FROM audit_correlation_findings WHERE created_at >= strftime('%s','now') - 3600;" \
     --json \
     > outputs/phase-10/staging-d1-recent-rows.json

   # row dump に対し literal grep（PII / secret / webhook URL / PAT が混入していないこと）
   grep -F -e 'ghp_' -e 'github_pat_' -e 'hooks.slack.com/services/' \
           -e 'xoxb-' -e 'xoxp-' -e 'Bearer ghp_' -e 'Bearer github_pat_' \
     outputs/phase-10/staging-d1-recent-rows.json \
     && { echo "literal leaked into D1 row"; exit 1; } || echo "ok"

   # full email / full IPv4 の正規表現検査（追加保険。actor_domain や ip_prefix の正規化漏れを検出）
   grep -REn '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' outputs/phase-10/staging-d1-recent-rows.json \
     && { echo "full email leaked"; exit 1; } || echo "no email leak"
   grep -REn '([0-9]{1,3}\.){3}[0-9]{1,3}\b' outputs/phase-10/staging-d1-recent-rows.json \
     | grep -vE '/24|/48' \
     && { echo "full IP leaked"; exit 1; } || echo "no full ip leak"

   # 結果を gate ログとして保存
   {
     echo "=== D1 grep gate result ==="
     echo "rows file: outputs/phase-10/staging-d1-recent-rows.json"
     echo "literal grep: ok"
     echo "full email grep: ok"
     echo "full ip grep: ok"
   } > outputs/phase-10/d1-grep-gate.log

   # Slack payload に対しても同等の grep
   grep -F -e 'ghp_' -e 'github_pat_' -e 'hooks.slack.com/services/' \
           -e 'xoxb-' -e 'xoxp-' -e 'Bearer ghp_' \
     outputs/phase-10/slack-dryrun-payload.json \
     && { echo "literal leaked into slack payload"; exit 1; } || echo "ok"
   grep -REn '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' outputs/phase-10/slack-dryrun-payload.json \
     && { echo "full email leaked into slack"; exit 1; } || echo "ok"
   ```

8. **production 展開は本 Phase では実施しない**
   - production deploy / production cron 起動 / production Secrets 投入 / production D1 migration apply は **Phase 13 G2 / G3 ゲート通過後に限定**。本 Phase の evidence は staging のみで完結させる。

## 検証マトリクス

| シナリオ | 入力 | 期待 |
| --- | --- | --- |
| ローカル `wrangler dev --test-scheduled` | `*/15 * * * *` 擬似発火 | scheduled handler が起動し例外なく完走 |
| staging deploy | `bash scripts/cf.sh deploy --env staging` | 新 version が active triggers 込みで反映 |
| staging cron 1 回起動 | 待機 ≤16 分 | tail log に `runCorrelation:start` / `:done` |
| staging synthetic HIGH | internal token + synthetic fixture POST | response の `findings[].severity == "HIGH"` が 1 件以上 |
| Slack dry-run channel | tail で notifySlack payload 取得 | dry-run channel に投稿、redact-safe payload のみ |
| D1 grep gate | 直近 1 時間 row dump | literal / full email / full IP 検出 0 |
| Slack payload grep gate | dry-run payload | literal / full email 検出 0 |

## 変更対象ファイル / コマンド対象

| パス | 種別 | 役割 |
| --- | --- | --- |
| `scripts/audit-correlation/fixtures/synthetic-high-payload.json` | 新規 / 確認 | staging へ送る synthetic HIGH fixture（redact-safe フィールドのみ） |
| staging Cloudflare Worker | deploy | live wiring 反映 |
| staging D1 `ubm-hyogo-db-staging` | observe | 直近 1 時間 row 観測 |
| staging Slack dry-run channel | observe | redact-safe payload 投稿確認 |

## 実行手順

上記 1-7 のコマンド列を順に実行する。各ステップで evidence ファイルが `outputs/phase-10/` 配下に生成されること、grep gate で `ok` が出力されることを必ず確認する。

## 検証コマンド / 期待出力

| コマンド | 期待出力 |
| --- | --- |
| `pnpm --filter @ubm/api test src/audit-correlation` | green |
| `wrangler dev --test-scheduled` 経由の `/__scheduled` 呼び出し | HTTP 200 |
| `bash scripts/cf.sh deploy --env staging` | `Deployment complete` |
| staging tail に `runCorrelation:start` / `:done` | 各 1 回以上 |
| synthetic HIGH POST | `findings[].severity == "HIGH"` が 1 件以上 |
| `slack-dryrun-payload.json` に PII literal | 検出 0 |
| `staging-d1-recent-rows.json` に full email / full IP | 検出 0 |

## evidence 配置先

- `outputs/phase-10/wrangler-dev-scheduled.log`（ローカル wrangler dev 起動 + scheduled 擬似発火 log）
- `outputs/phase-10/wrangler-dev-scheduled-response.json`
- `outputs/phase-10/staging-deploy.log`
- `outputs/phase-10/staging-deployments.log`
- `outputs/phase-10/staging-cron-1run.log`（cron 1 回起動の tail log）
- `outputs/phase-10/staging-d1-row-count.log`
- `outputs/phase-10/staging-high-trigger-response.json`
- `outputs/phase-10/slack-dryrun-tail.log`
- `outputs/phase-10/slack-dryrun-payload.json`
- `outputs/phase-10/staging-d1-recent-rows.json`
- `outputs/phase-10/d1-grep-gate.log`
- `outputs/phase-10/phase-10.md`（実行サマリ + Slack UI 目視確認結果）

## 安全性チェック（secret / 平文露出が無いこと）

```bash
# Phase 10 で生成したすべての evidence ファイルに secret literal が混入していないこと
grep -REn 'ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|hooks\.slack\.com/services/[A-Z0-9/]+|xox[bp]-[A-Za-z0-9-]+|Bearer\s+ghp_|Bearer\s+github_pat_' \
  outputs/phase-10 \
  && { echo "literal leaked into phase-10 evidence"; exit 1; } || echo "ok"

# evidence に full email / full IP が含まれていないこと
grep -REn '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' outputs/phase-10 \
  && { echo "full email leaked"; exit 1; } || echo "ok"
grep -REn '([0-9]{1,3}\.){3}[0-9]{1,3}\b' outputs/phase-10 \
  | grep -vE '/24|/48|127\.0\.0\.1' \
  && { echo "full ip leaked"; exit 1; } || echo "ok"

# 環境変数として揮発展開した INTERNAL_TOKEN が unset されていること
[ -z "${INTERNAL_TOKEN:-}" ] || { echo "INTERNAL_TOKEN still in env"; exit 1; }
```

## 失敗時の trouble-shooting

- vitest / bats 失敗 → Phase 5-7 実装に戻る。
- `wrangler dev --test-scheduled` が `Ready` にならない → `apps/api/src/index.ts` の `scheduled` export を Phase 5 で追加し忘れていないか確認。
- staging cron が 16 分待っても起動しない → `bash scripts/cf.sh deployments list --env staging` で triggers が反映されているか確認。`wrangler.toml` の `[env.staging.triggers]` が空の場合 Phase 9 に戻る。
- synthetic HIGH POST が 401 → `AUDIT_CORRELATION_INTERNAL_TOKEN` の Cloudflare Secrets 投入を Phase 9 のコマンドで再実行。
- D1 grep gate で full IP 検出 → Phase 5 の `persist.ts` で IP prefix マスク（IPv4 `/24` / IPv6 `/48`）が反映されていない可能性。Phase 5 に戻り、redact ロジックを修正後 staging へ再 deploy。
- Slack payload に email local-part 検出 → Phase 5 の `notify-slack.ts` で `actor_domain` ではなく `actor` をそのまま使用している可能性。Phase 5 に戻る。

## 統合テスト連携

- 本 Phase の evidence は Phase 11 の NON_VISUAL evidence pack に転記される（typecheck / lint / test / build / grep-gate / staging cron 1 回成功 / Slack dry-run / D1 grep gate）。
- `.github/workflows/audit-correlation-verify.yml` の live mode grep gate（Phase 7 / 8）と本 Phase の手動 grep gate が二重に保護する。

## 参照資料

- 親ワークフロー Phase 10: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-10.md`
- Cloudflare Workers Cron Triggers / `wrangler dev --test-scheduled` Docs
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」「シークレット管理」
- Phase 8（D1 schema 列毎の保存可否表）/ Phase 9（Secrets 投入手順）

## 成果物

- `outputs/phase-10/phase-10.md`
  - 検証マトリクス 7 シナリオの実行結果
  - ローカル `wrangler dev --test-scheduled` の擬似発火 evidence
  - staging deploy / staging cron 1 回起動 evidence
  - synthetic HIGH POST と Slack dry-run channel 投稿の Slack UI 目視確認結果
  - D1 / Slack payload に対する grep gate 結果（literal / full email / full IP 検出 0）

## 完了条件（DoD）

- [ ] vitest / bats / shellcheck / actionlint がすべて green。
- [ ] ローカル `wrangler dev --test-scheduled` で `/__scheduled?cron=*%2F15+*+*+*+*` が HTTP 200 で完走。
- [ ] staging deploy 後、最大 16 分以内に cron が 1 回起動し、tail log に `runCorrelation:start` / `:done` が記録される。
- [ ] synthetic HIGH POST に対し `findings[].severity == "HIGH"` が 1 件以上含まれる response を取得済み。
- [ ] Slack dry-run channel に redact-safe payload で投稿が届いたことを Slack UI で目視確認し、`outputs/phase-10/slack-dryrun-payload.json` に payload 構造を保存。
- [ ] staging D1 直近 1 時間 row dump (`outputs/phase-10/staging-d1-recent-rows.json`) に対し literal / full email / full IP の grep gate が検出 0。
- [ ] Slack payload に対し literal / full email の grep gate が検出 0。
- [ ] Phase 10 evidence ディレクトリ全体に対する横断的な secret / PII grep gate が検出 0。
- [ ] `INTERNAL_TOKEN` を含む揮発環境変数が unset で残っていない。
- [ ] production 展開（deploy / Secrets 投入 / D1 migration apply）は **本 Phase では実施しておらず**、Phase 13 G2 / G3 ゲート後に持ち越されている。
