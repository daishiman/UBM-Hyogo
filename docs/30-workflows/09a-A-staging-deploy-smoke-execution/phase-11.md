# Phase 11: 手動 smoke / 実測 evidence — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: Cloudflare staging への deploy・curl smoke・Playwright UI smoke・Forms sync・`wrangler tail` 取得・D1 schema parity 検証を含む実測操作は、実環境への副作用と repo へコミットされる evidence artifact 生成を伴う。CONST_004 により docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 11 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 想定実行者 | 人間オペレーター + Claude Code（user approval gate 併用） |

## 目的

Phase 5 ランブックを「人間 + AI が現場で読み返せる作業手順書」として再表現する。13 evidence の取得手順・保存先・命名規則・redact ルール・取得不能時のフォールバックを 1 ファイルで完結させ、`outputs/phase-11/main.md` へ実測サマリ（hash / size / 取得時刻 / PASS-FAIL）が漏れなく記録される状態を作る。

## 事前準備チェックリスト

- [ ] `git branch --show-current` が `feat/09a-A-staging-deploy-smoke-execution`（実行 PR 用）であること。仕様書 PR ブランチ `docs/09a-A-staging-deploy-smoke-execution-task-spec` では本 Phase 11 の実行を行わない。
- [ ] `mise exec -- node -v` が `v24.15.0` であること
- [ ] `bash scripts/cf.sh whoami` が成功し、token scope に `Workers Scripts:Edit` / `D1:Edit` / `Pages:Edit` を含むこと（出力をログに残す）
- [ ] `op signin` 済みで `op run --env-file=.env -- env | grep CLOUDFLARE_API_TOKEN` が値を返すこと（値そのものは出力にも evidence にも残さない）
- [ ] `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging` で旧 version ID を控える（rollback 用）
- [ ] `bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging` で旧 version ID を控える
- [ ] evidence 保存ディレクトリを作成: `mkdir -p docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/{deploy,curl,screenshots,playwright,forms,d1,wrangler-tail}`

> 以下では evidence ルートを `EVID=docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence` と表記する。

## Approval Gate プロンプト

各 gate で Claude Code は **実行コマンド全文・予測影響・rollback 方法** を提示して停止する。user の `approve` 文字列受領後にのみ次の手順へ進む。

### G1: api / web staging deploy

```
[G1: STAGING DEPLOY APPROVAL]
予定コマンド:
  bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
  bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
影響範囲: ubm-hyogo-api-staging / ubm-hyogo-web-staging Workers の version 切替
旧 version ID (rollback 用): api=<...> / web=<...>
失敗時 rollback:
  bash scripts/cf.sh rollback <旧VERSION_ID> --config apps/api/wrangler.toml --env staging
"approve G1" と返信してください。
```

### G2: D1 staging migration apply（pending がある場合のみ）

```
[G2: D1 MIGRATION APPLY APPROVAL]
対象 DB: ubm-hyogo-db-staging
pending 件数: <N>（d1-migrations-staging.log 参照）
予定コマンド:
  bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
影響: D1 schema 変更（rollback CLI なし。事前に export を取得済みであること）
事前 export:
  bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging --output $EVID/d1/backup-pre-migrate.sql
"approve G2" と返信してください。
```

### G3: Forms sync 実行

```
[G3: FORMS SYNC APPROVAL]
影響: Google Forms API quota を 1 サイクル消費 / sync_jobs / audit_log に行追加
予定: schema sync → responses sync の順に各 1 回実行
失敗時: 翌日リトライ TODO を outputs/phase-11/main.md に記録、本 Phase は他 evidence のみで完了させない
"approve G3" と返信してください。
```

### G4: 09c blocker 更新コミット（Phase 13 直前）

```
[G4: BLOCKER UPDATE COMMIT APPROVAL]
更新対象:
  docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md
  docs/30-workflows/09a-A-staging-deploy-smoke-execution/artifacts.json
  docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/main.md ほか
git diff --stat:
  <提示>
"approve G4" と返信してください。
```

## 13 evidence 一覧（保存先 / 命名規則 / 取得コマンド / 期待 size / 検証 grep）

| # | 種別 | 保存先 (filename) | 取得コマンド | 期待 size | 検証 grep |
| --- | --- | --- | --- | --- | --- |
| 1 | api deploy ログ | `$EVID/deploy/deploy-api-staging.log` | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \| tee $EVID/deploy/deploy-api-staging.log` | 2-50 KB | `Deployed ubm-hyogo-api-staging` / version ID 行 |
| 2 | web deploy ログ | `$EVID/deploy/deploy-web-staging.log` | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \| tee $EVID/deploy/deploy-web-staging.log` | 2-50 KB | `Deployed ubm-hyogo-web-staging` / version ID 行 |
| 3a | curl `/healthz` | `$EVID/curl/curl-public-healthz.log` | `curl -sSi https://<api-staging>/healthz \| tee $EVID/curl/curl-public-healthz.log` | <2 KB | `HTTP/.* 200` |
| 3b-h | curl `/public/members` 7 種 (base/q/zone/status/tag/sort/density) | `$EVID/curl/curl-public-members-{base,q,zone,status,tag,sort,density}.log` | 例: `curl -sSi 'https://<api-staging>/public/members?q=foo' \| tee $EVID/curl/curl-public-members-q.log` | 各 1-50 KB | `HTTP/.* 200` / `"items"` |
| 4a | curl authz 未認証 `/me` | `$EVID/curl/curl-authz-me-unauth.log` | `curl -sSi https://<api-staging>/me` | <2 KB | `HTTP/.* 401` |
| 4b | curl authz 未認証 `/admin/members` | `$EVID/curl/curl-authz-admin-unauth.log` | `curl -sSi https://<api-staging>/admin/members` | <2 KB | `HTTP/.* 40[13]` |
| 4c | curl authz member role で `/admin/*` | `$EVID/curl/curl-authz-admin-member-role.log` | member セッション cookie 付与で curl | <5 KB | `HTTP/.* 403` |
| 5 | UI screenshot 4 種 | `$EVID/screenshots/{public-members,login,me,admin}-staging.png` | Playwright UI smoke の `--screenshot=on` で生成 | 各 50 KB-2 MB | `file` で `PNG image` |
| 6 | Playwright report / trace | `$EVID/playwright/` (HTML report + trace.zip) | `pnpm --filter web exec playwright test --config=playwright.staging.config.ts --reporter=html,list --output=$EVID/playwright` | dir 1-20 MB | `index.html` 存在 |
| 7 | Forms schema sync ログ | `$EVID/forms/forms-schema-sync.log` | api admin endpoint POST を curl で叩いた結果を tee | 1-50 KB | `"status":"succeeded"` |
| 8 | Forms responses sync ログ | `$EVID/forms/forms-responses-sync.log` | 同上（responses 用 endpoint） | 1-100 KB | `"status":"succeeded"` |
| 9 | sync_jobs dump | `$EVID/d1/sync-jobs-staging.json` | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT * FROM sync_jobs ORDER BY id DESC LIMIT 20" > $EVID/d1/sync-jobs-staging.json` | 1-30 KB | `"kind"` / `"status"` |
| 10 | audit_log dump | `$EVID/d1/audit-log-staging.json` | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT * FROM audit_log ORDER BY id DESC LIMIT 50" > $EVID/d1/audit-log-staging.json` | 1-50 KB | `"action"` |
| 11 | wrangler tail (redacted) | `$EVID/wrangler-tail/api-30min.log` | 後述 fallback 含む | 1-500 KB | `"outcome"` / 値 ≠ `[REDACTED]` 部分が残る |
| 12 | D1 migration list | `$EVID/d1/d1-migrations-staging.log` | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \| tee $EVID/d1/d1-migrations-staging.log` | <10 KB | `Applied` / `pending` 行 |
| 13 | D1 schema parity diff | `$EVID/d1/d1-schema-parity.json` | Phase 2 のループスクリプトを実行し集約 | 5-100 KB | `"diffCount"` |

> 13 件の番号付けは「deploy 2 + curl 9 (healthz1+members7+authz3=11 のうち curl 系を 9 と数える集計*) + screenshot 4(=1群) + playwright 1 + forms 2 + d1 dump 2 + wrangler tail 1 + d1 mig list 1 + d1 parity 1 = 13 evidence 種別」として扱う。screenshot は 4 ファイル 1 種別。
> *引き継ぎコンテキスト記載の「curl smoke 9 種」= healthz 1 + public/members 5（base/q/zone/status/tag/sort/density のうち親タスクが規定する 5 系）+ authz 3 = 9。本 Phase では public/members 7 系まで取得し最低 5 系で AC 充足とする。

## 実行手順（順序固定）

1. **事前準備チェックリスト** を 1 件ずつ満たす。
2. **G1 approval** を取得し、deploy 2 件を実行 → evidence #1 / #2 を保存。
3. **D1 migration list** を取得し evidence #12 を保存。`pending=0` 以外なら **G2 approval** を経て apply。
4. **D1 schema parity** スクリプト（Phase 2 のループ）を実行し evidence #13 を生成。`diffCount > 0` の場合は `docs/30-workflows/unassigned-task/task-09a-d1-schema-parity-followup-001.md` を新規起票（テンプレは Phase 12 を参照）。
5. **curl smoke** を実行し evidence #3a/#3b-h/#4a-c を保存。`HTTP/.* 200`・`401`・`403` のステータスコードを `outputs/phase-11/main.md` の表へ転記。
6. **`[VISUAL_ON_EXECUTION]` ラベル付き Playwright UI smoke** を実行し evidence #5 / #6 を保存。screenshot に PII（実会員氏名 / メール）が映る場合は次のいずれかを適用:
   - テスト fixture アカウント（`manjumoto.daishi@senpai-lab.com` / `manju.manju.03.28@gmail.com`）に切替
   - 該当領域に Playwright `page.locator(...).screenshot({ mask: [...] })` で blur / mask
   - 既に保存後に発覚した場合は `outputs/phase-11/main.md` に redact 状況を記録した上でファイルを再撮影で置換（masked 前のファイルは commit しない）
7. **G3 approval** を取得し Forms schema → responses sync を順次実行 → evidence #7 / #8 / #9 / #10 を保存。
8. **wrangler tail capture** を実行 → evidence #11 を保存（後述 fallback 参照）。
9. `outputs/phase-11/main.md` の実測表を全行更新し、`hash`（`shasum -a 256`）/ `size`（`wc -c`）/ 取得時刻（`date -u +%FT%TZ`）/ PASS-FAIL を埋める。
10. `grep -R "NOT_EXECUTED" docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/` が 0 件であることを確認（Phase 7 ゲート相当）。

## wrangler tail capture（具体例 + fallback）

`scripts/cf.sh` は `wrangler tail` を特殊ハンドリングしないが、第 1 引数以降をそのまま wrangler に渡すため次のように呼び出せる:

```bash
# 推奨: cf.sh 経由（op で token 注入 + ローカル wrangler + esbuild 整合）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty \
  | sed -E \
      -e 's/(Authorization: )[^[:space:]]+/\1[REDACTED]/g' \
      -e 's/([Cc]ookie: )[^[:space:]]+/\1[REDACTED]/g' \
      -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[REDACTED_EMAIL]/g' \
      -e 's/(token=|Bearer )[A-Za-z0-9._-]+/\1[REDACTED]/g' \
      -e 's/([0-9]{1,3}\.){3}[0-9]{1,3}/[REDACTED_IP]/g' \
  | tee $EVID/wrangler-tail/api-30min.log
```

`cf.sh tail` が `[cf.sh] usage` を出して失敗する環境（ラッパーが positional 引数を要求）では、次の代替を使う:

```bash
# 代替: mise exec + pnpm wrangler 直叩き（CF_SH_SKIP_WITH_ENV を使わず op run 経由）
op run --env-file=.env -- mise exec -- pnpm wrangler tail \
  --config apps/api/wrangler.toml --env staging --format pretty \
  | sed -E ... # 同じ redact パイプ
  | tee $EVID/wrangler-tail/api-30min.log
```

実時間 30 分相当を取得する。途中で `Ctrl-C` した場合はその時点までのログを保存し、`outputs/phase-11/main.md` の備考欄に「実時間 X 分で打ち切り」と記録する。

### 取得不能だった場合のフォールバック（理由記録テンプレ）

`wrangler-tail/api-30min.log` の 1 行目に **理由ヘッダ** を入れたうえで取得試行ログを保存:

```
# wrangler tail 取得不能 (filled at <ISO8601>)
reason: <token scope unsufficient | quota exceeded | network error | other>
attempted-command: bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty
exit-code: <N>
stderr-excerpt: |
  <最初の 20 行>
fallback-attempted: <analytics_engine_datasets query を試したか / 試した場合の結果>
follow-up-task: docs/30-workflows/unassigned-task/task-09a-wrangler-tail-recovery-001.md (新規起票したか)
```

## evidence サマリ表（`outputs/phase-11/main.md` の最終構成）

`outputs/phase-11/main.md` には次の 4 セクションを必ず置く:

1. status: `pending → executed`
2. evidence 一覧表（13 行 × `path` / `hash` / `size_bytes` / `acquired_at_utc` / `result(PASS|FAIL|N/A)` / `notes`）
3. approval gate 取得記録表（G1〜G4 × `approved_at` / `approved_by` / `command_executed`）
4. 親タスクへの引き渡し（09c blocker 更新差分の reference / unassigned-task 起票一覧）

## 取得不能時のフォールバック手順（共通）

| 事象 | 対応 | 記録先 |
| --- | --- | --- |
| deploy 失敗 | rollback コマンドを実行し、log を `$EVID/deploy/` に保存。修正は本タスク scope 外として `unassigned-task/` に起票 | `outputs/phase-11/main.md` notes 欄 |
| D1 migration apply 失敗 | export 済 backup の参照だけ記録（D1 rollback CLI なし）。再 migration を `unassigned-task/` に起票 | 同上 |
| Forms quota 枯渇（429） | 翌日リトライ TODO を `outputs/phase-11/main.md` に明記 → 翌日に再実行（先送り扱いせず本 Phase 内で完了） | 同上 |
| Playwright flaky | 最大 2 回まで再実行。3 回目の fail は trace を保存し fail 理由を記録 | 同上 |
| screenshot に PII | 即座に再撮影 + masked 前ファイル不コミット | 同上 |
| wrangler tail 取得不能 | 上記「理由記録テンプレ」を 1 行目に保存 | `wrangler-tail/api-30min.log` 自体 |

## 統合テスト連携

- 上流: 08a coverage gate / 08a-B `/members` search/filter coverage / 08b Playwright E2E evidence / Cloudflare staging secrets
- 下流: 09c production deploy execution（本 Phase で生成された evidence path をそのまま 09c 入力に渡す）

## 多角的チェック観点

- 不変条件 #5 / #6 / #14 が staging 実測で破綻していない
- 13 evidence すべてに hash / size / 取得時刻が埋まっている
- `NOT_EXECUTED` 文字列が本タスク outputs/ から完全消滅している
- secret / PII が evidence へ混入していない（`grep -R "Bearer " $EVID` / メールアドレス正規表現で確認）
- approval gate G1〜G4 が CLI 出力に明示記録されている

## サブタスク管理

- [ ] 事前準備チェックリスト 7 項目を完了
- [ ] G1〜G4 approval gate を全件取得
- [ ] 13 evidence をすべて保存
- [ ] `outputs/phase-11/main.md` の 4 セクションを更新
- [ ] `grep -R NOT_EXECUTED` 0 件確認
- [ ] PII / secret 混入の最終 grep 確認

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/` 配下 13 種別

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 全 13 evidence が定義パスに存在し、`outputs/phase-11/main.md` の表が完全に埋まっている
- approval gate G1〜G4 の取得記録が残っている
- `wrangler-tail/api-30min.log` が取得済 or 取得不能理由テンプレで埋まっている
- D1 schema parity `diffCount = 0` または production 側 migration TODO 起票済み

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で commit / push / PR を実行していない（コミット / PR は Phase 13 で扱う）
- [ ] CONST_007 違反（先送り）が発生していない

## 次 Phase への引き渡し

Phase 12 へ:
- 13 evidence の hash / size / 結果サマリ
- 起票した unassigned-task のパス一覧
- 09c blocker 更新の素案（実測値置換版）

## 実行タスク

- [ ] phase-11 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 参照資料

- docs/30-workflows/09a-A-staging-deploy-smoke-execution/index.md
- docs/30-workflows/09a-A-staging-deploy-smoke-execution/artifacts.json
