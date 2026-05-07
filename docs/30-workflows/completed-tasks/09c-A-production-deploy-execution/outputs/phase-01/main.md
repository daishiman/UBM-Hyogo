# Phase 1 Output: 要件定義 — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

> **本タスクの位置付け**: 完了済み 09c serial（runbook docs-only 整備）の execution gate のみを担う follow-up タスク。docs-only 仕様の再設計は範囲外。後続実装サイクルで実 production を mutate する。

## 1. スコープ確定

### Scope In

- main merge commit と deploy target commit hash の照合 evidence
- production D1 backup（migration apply 前の `d1 export`）
- production D1 migration list / apply evidence
- API Worker（`ubm-hyogo-api`）の production deploy
- Web（`ubm-hyogo-web`）の production deploy
- release tag `vYYYYMMDD-HHMM` 作成と push
- production runtime smoke（public / member / admin の 10 ルート）
- production manual sync trigger（`POST /admin/sync/schema` / `POST /admin/sync/responses`）
- 24h post-release verification（Cloudflare Analytics / D1 metrics / 不変条件確認）
- user approval evidence（Phase 10 / 11 / 13）

### Scope Out

- 09c docs-only 仕様書の再設計（完了済み 09c serial の責務）
- 新規アプリケーション機能開発・コード変更
- Cloudflare secret 値の記録・rotation
- 09a-A staging smoke 未 green 状態での production 実行
- staging deploy execution（09a-A の責務）
- post-deploy healthcheck メカニズム自体の実装（09b-B の責務）
- observability 自体の構築（09b-A の責務）

## 2. 上流依存タスクの green 判定基準

| 上流タスク | green 判定 evidence | 確認方法 |
| --- | --- | --- |
| 09a-A staging smoke green | `docs/30-workflows/09a-*/outputs/phase-11/main.md` に staging public/member/admin smoke の 200/authz green ログが揃う | 該当 outputs/phase-11/ 配下の smoke evidence を読む |
| 09b-A observability runtime | Sentry / Slack の production binding が runtime smoke で疎通済み | 09b-A の outputs/phase-11/ の通知到達 evidence |
| 09b-B post-deploy smoke | post-deploy smoke が silent failure を検知できることが staging で確認済み | 09b-B の outputs/phase-11/ の検知 evidence |
| 09b release/incident runbook | release runbook と incident response runbook が docs-only として確定 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` と 09b の outputs |

すべての上流が green でない場合は 09c-A は実行を開始しない（blocker として扱う）。

## 3. AC × evidence path mapping（5 項目）

| AC | 内容 | evidence path（命名規約） | 検証手段 |
| --- | --- | --- | --- |
| AC-1 | user approval evidence が保存される | `outputs/phase-11/user-approval-log.md` | Phase 10 / 11 / 13 の approval ログを 1 ファイルに集約 |
| AC-2 | production D1 migration が Applied として確認される | `outputs/phase-11/d1-migrations-list-before.txt`, `outputs/phase-11/d1-migrations-apply.txt`, `outputs/phase-11/d1-migrations-list-after.txt`, `outputs/phase-11/d1-backup-<timestamp>.sql`（または size 記録） | apply 前後で list 比較し、Applied 件数が一致または増加 |
| AC-3 | api/web production deploy が exit 0 | `outputs/phase-11/api-deploy.log`, `outputs/phase-11/web-deploy.log` | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` / `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` の stdout/stderr 全文（web は事前に `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` 必須） |
| AC-4 | production public/member/admin smoke が green | `outputs/phase-11/smoke-public.md`, `outputs/phase-11/smoke-member.md`, `outputs/phase-11/smoke-admin.md`, `outputs/phase-11/smoke-screenshots/*.png` | 10 ルートの HTTP status と authz boundary、VISUAL 証跡（スクリーンショット）を含む |
| AC-5 | release tag と 24h verification summary が保存される | `outputs/phase-11/release-tag.txt`, `outputs/phase-11/24h-verification-summary.md`, `outputs/phase-11/24h-metrics-screenshots/*.png` | `git tag` 出力と `git ls-remote --tags origin` で remote tag 確認、24h 後の Cloudflare Dashboard metrics |

### evidence ファイル命名規約

- すべて `outputs/phase-11/` 配下に配置
- 1 AC に対して複数 evidence がある場合は prefix を共通化（例: `d1-migrations-*.txt`, `smoke-*.md`）
- timestamp は ISO 8601 互換（`YYYYMMDDTHHMMZ` または `YYYYMMDD-HHMM`）
- screenshot は `smoke-screenshots/` および `24h-metrics-screenshots/` のサブディレクトリに `<route-or-metric>-<timestamp>.png` 形式で配置
- secret 値は転記しない（mask 済みのみ）

## 4. production deploy 実行順序（13 ステップ）

| # | ステップ | コマンド / 操作 | gate |
| --- | --- | --- | --- |
| 1 | main merge precondition | `gh pr merge <dev-to-main-PR> --squash` または相当 merge | Phase 13 user approval |
| 2 | upstream green 確認 | 09a-A / 09b-A / 09b-B の outputs/phase-11 を citable に記録 | Phase 10 user approval |
| 3 | identity 確認 | `bash scripts/cf.sh whoami` | — |
| 4 | D1 backup | `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --remote --output=outputs/phase-11/d1-backup-<ts>.sql --env production --config apps/api/wrangler.toml` | — |
| 5 | D1 migration list（apply 前） | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` | — |
| 6 | D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` | Phase 11 user approval（mutation） |
| 7 | D1 migration list（apply 後） | step 5 と同コマンド再実行 | — |
| 8 | API deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | Phase 11 user approval（mutation） |
| 9a | Web OpenNext build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | — |
| 9b | Web deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` | Phase 11 user approval（mutation） |
| 10 | release tag | `git tag -a vYYYYMMDD-HHMM -m "<msg>" && git push origin vYYYYMMDD-HHMM` | Phase 11 user approval（mutation） |
| 11 | runtime smoke | 10 ルート curl + 手動ブラウザ確認 + manual sync POST | — |
| 12 | invariant 検証 | web bundle inspection（#6）、`/profile` 編集不可確認（#5/#11）、admin UI 確認 | — |
| 13 | 24h verification | Cloudflare Analytics / D1 metrics / `sync_jobs` SQL を 24h 経過後に確認 | — |

## 5. 自走禁止操作（user approval gate）

以下のコマンド・操作は user approval ログ（`outputs/phase-11/user-approval-log.md` に該当 step の承認記載）なしには実行しない:

- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod ...`（step 6）
- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`（step 8）
- `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production`（step 9b、事前に `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` 必須）
- `git push origin <release-tag>`（step 10）
- `gh pr merge` の dev → main 昇格（step 1, Phase 13）
- production secret の追加・削除・rotate（本タスクのスコープ外。発生時は緊急停止）
- `bash scripts/cf.sh rollback ...`（rollback 判断は user approval が前提）

read-only 操作（`whoami` / `d1 migrations list` / `d1 export`）は approval 不要。

## 6. blocker 一覧

| blocker | 解消手段 |
| --- | --- |
| 09a-A staging smoke が green でない | 09a-A の Phase 11 を完了させる。本タスクは待機 |
| 09b-A observability が production で未疎通 | 09b-A の Phase 11 を完了させる |
| 09b-B post-deploy smoke が未 green | 09b-B の Phase 11 を完了させる |
| Phase 13 user approval 未取得 | Phase 13 で user に承認依頼。承認なしに dev → main 昇格しない |
| Cloudflare API token / 1Password 参照不全 | `bash scripts/cf.sh whoami` で identity を再確認 |
| D1 backup ファイル size 0 | `d1 export` を再実行。失敗継続なら incident 扱いで escalate |
| migration apply で error | `d1 migrations list` で current state 確認、forward migration で修復、破壊的 SQL は禁止 |
| smoke で 5xx / authz violation | 即時 rollback（worker / pages / D1）を Phase 11 user approval 経由で実行 |

## 7. 4 条件評価

| 条件 | spec 段階の評価 |
| --- | --- |
| 価値 | PASS: production release を user approval 付きで実行する経路が確定し、未実行 deploy が完了済みに見えるリスクを排除する |
| 実現可能性 | PASS: 既存の `scripts/cf.sh` / Web OpenNext build / `git tag` のみで実現可能 |
| 整合性 | PASS: 不変条件 #5 / #6 / #14 を smoke / bundle inspection / 24h metrics で検証 |
| 運用性 | pending_user_approval: 実 runtime 評価は Phase 10 / 11 / 13 の approval 後 |

## 8. Open Questions（spec 段階で確定済み・runtime で TBD）

| 項目 | spec での扱い | runtime |
| --- | --- | --- |
| deploy window（営業時間 / 保守時間帯） | user approval の都度判断 | TBD at execution |
| release tag の具体値 | `vYYYYMMDD-HHMM` フォーマット | 実行時刻で生成 |
| smoke の対象 URL（`<account>.workers.dev`） | template | runtime evidence で確定 |
| 24h verification の閾値 | Cloudflare free-tier の上限を threshold とする | metrics 取得時に確定 |

## 9. Phase 2 への引き渡し

- AC × evidence path mapping（5 項目）
- 13 ステップの実行順序
- 自走禁止操作リスト
- 上流依存の green 判定基準
- evidence ファイル命名規約
- blocker 一覧
