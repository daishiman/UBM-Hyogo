# Phase 1: 要件定義 — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: 本タスクは Cloudflare staging 環境への deploy command 実 行（`bash scripts/cf.sh deploy --env staging`）、UI/API smoke、Forms sync validation、`wrangler tail` 取得、D1 schema parity 検証を伴い、生成された evidence artifact をリポジトリへコミットする副作用を持つ。CONST_004 に従い「実環境への副作用 + repo へのコミット成果物が発生する」ため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 1 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 想定実行者 | 人間オペレーター + Claude Code（user approval ゲート併用） |

## 目的

09a 親タスク（`09a-parallel-staging-deploy-smoke-and-forms-sync-validation`）の Phase 11 に残存する `NOT_EXECUTED` placeholder を、実 staging 環境で取得した deploy ログ・smoke 結果・Forms sync evidence・D1 schema parity 結果に置換する。これにより 09c production deploy の前提（公開・会員・管理境界の実機検証 / Forms sync 健全性 / D1 migration 整合性）を実測値で担保する。

ビジネス価値: production リリース前に「staging で動く」を文書ではなく実測 evidence で証明し、本番直前/直後にしか露呈しないインシデント（authz boundary 漏れ、Forms quota 枯渇、D1 schema drift、Workers binding 不整合）を staging で先取りする。

## 入力

| 種別 | 値 |
| --- | --- |
| 上流タスク evidence | 08a coverage gate / 08a-B `/members` search/filter coverage / 08b Playwright E2E evidence |
| 親タスク状態 | `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/*` の placeholder（`NOT_EXECUTED`） |
| Cloudflare staging secrets | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` ほか（1Password vault → `.env` op:// 参照経由のみ。値は記録しない） |
| staging targets | `ubm-hyogo-api-staging` (Workers) / `ubm-hyogo-web-staging` (Workers) / `ubm-hyogo-db-staging` (D1, id `990e5d6c-51eb-4826-9c13-c0ae007d5f46`) |
| staging URL | API/Web の staging エンドポイント（`apps/{api,web}/wrangler.toml` の `[env.staging]` に紐付くデプロイ URL を Phase 11 で確定） |
| 仕様正本 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`、`docs/00-getting-started-manual/specs/08-free-database.md` |

## 出力（成果物 evidence 種別）

Phase 11 で取得し、以下のパスに保存する。本 Phase ではパスと命名規則のみを確定する。

| # | 種別 | 保存先（命名規則） |
| --- | --- | --- |
| 1 | api deploy ログ | `outputs/phase-11/evidence/deploy-api-staging.log` |
| 2 | web deploy ログ | `outputs/phase-11/evidence/deploy-web-staging.log` |
| 3 | curl smoke（公開 `/healthz`、`/public/members`、`/public/members?q=...&zone=...&status=...&tag=...&sort=...`） | `outputs/phase-11/evidence/curl-public-*.log`（クエリ別に分割） |
| 4 | curl smoke（authz: 未認証で `/me`、`/admin/*` が 401/403） | `outputs/phase-11/evidence/curl-authz-*.log` |
| 5 | UI screenshot（公開 `/members`、ログイン、`/me`、`/admin`） | `outputs/phase-11/evidence/screenshots/{public-members,login,me,admin}-staging.png` |
| 6 | Playwright report / trace | `outputs/phase-11/playwright-staging/` |
| 7 | Forms schema sync ログ | `outputs/phase-11/evidence/forms-schema-sync.log` |
| 8 | Forms responses sync ログ | `outputs/phase-11/evidence/forms-responses-sync.log` |
| 9 | `sync_jobs` dump | `outputs/phase-11/evidence/sync-jobs-staging.json` |
| 10 | `audit_log` dump（直近 sync 関連のみ） | `outputs/phase-11/evidence/audit-log-staging.json` |
| 11 | `wrangler tail --env staging` redacted log（30 分相当 or 取得不能理由） | `outputs/phase-11/evidence/wrangler-tail.log` |
| 12 | D1 migration list (`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging`) | `outputs/phase-11/evidence/d1-migrations-staging.log` |
| 13 | D1 schema parity diff（staging vs production の table list / `PRAGMA table_info` / index 比較） | `outputs/phase-11/evidence/d1-schema-parity.json` |

更新対象ドキュメント:
- `outputs/phase-11/main.md`: 各 evidence への参照と PASS/FAIL 判定
- `outputs/phase-12/main.md`: 実測サマリ、未解決 TODO、09c への引き渡し条件
- `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/*`: 親タスク側の `NOT_EXECUTED` を本タスク evidence への参照リンクで置換
- `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md`: blocker 状態を「09a-A 実測完了済み / 残課題: …」に更新

## 機能要件

1. staging api / web の deploy が `bash scripts/cf.sh deploy` で完了し、deployment ID と URL がログに残る。
2. 公開 `/members` に対する curl smoke が 08a-B Phase 11 contract（`q` / `zone` / `status` / `tag` / `sort` の全クエリ、density runtime evidence）に沿って 200 を返し、件数が記録される。
3. 認可境界 smoke で、未認証 `/me` / `/admin` が 401 / 403、ロール不一致でも 403 を返す。
4. Playwright UI smoke で公開 / ログイン / profile / admin が描画され、screenshot が保存される。
5. Forms schema sync と responses sync が staging で 1 サイクル成功し、`sync_jobs` 行と `audit_log` 行が増分する。
6. `wrangler tail` で 30 分相当の staging ログを取得、または取得不能時は理由（quota / token scope 不足等）を `wrangler-tail.log` に明記する。
7. D1 staging の `migrations list` が `Applied` のみで `pending=0`、または pending 行がある場合はその理由 evidence と TODO を残す。
8. D1 schema parity（staging vs production の table 一覧 / `PRAGMA table_info(member_responses|member_identities|member_status|deleted_members|sync_jobs|audit_log|magic_tokens|tag_assignment_queue)` / index）が一致する。差分がある場合は production 側 migration TODO を `unassigned-task` に発行する。

## 非機能要件

| 観点 | 要求 |
| --- | --- |
| 安全性 | secret 値（API token / OAuth refresh token / D1 row data の PII）を log / artifact / コミットに残さない。`wrangler tail` は redact してから保存する |
| 再現性 | 全コマンドは `bash scripts/cf.sh ...` 経由で実行し、wrangler を直接呼ばない（CLAUDE.md ルール） |
| Free-tier 遵守 | invariants #14。Workers requests / D1 reads / Forms quota が free-tier 内に収まることを記録 |
| 監査性 | `sync_jobs` / `audit_log` の append-only 性を確認し、行 ID / created_at を evidence に残す |
| 操作の明示性 | deploy / D1 migration apply / sync 実行は user approval gate で停止する（自走禁止） |

## 制約条件

1. production への deploy / D1 migration apply は scope 外（CONST_007 例外なし）。
2. 新規 UI / API 機能追加・bugfix は scope 外。staging で発覚したバグは `unassigned-task/` に切り出して 09c の blocker として扱う。
3. `.env` への実値書き込み禁止（op:// 参照のみ）。`wrangler login` の OAuth トークン保持禁止。
4. apps/web から D1 への直接アクセス導入禁止（invariants #6）。smoke 観測中に既存の boundary 違反が見つかった場合は `unassigned-task/` で起票し、本タスクでは修正しない。
5. CONST_007: 本タスク内で発見した課題は「Phase XX で対応」と先送りせず、Phase 11 evidence もしくは `unassigned-task/` 起票のいずれかで必ず処理を完結させる。

## 関係者・承認ゲート

| ゲート | 承認者 | タイミング |
| --- | --- | --- |
| G1: deploy 実行 | user | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 直前 |
| G2: D1 migration apply（pending がある場合のみ） | user | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` 直前 |
| G3: Forms sync 実行 | user | staging Forms quota 消費を伴うため事前承認 |
| G4: 09c blocker 更新コミット | user | Phase 13 PR 直前 |

各ゲートで Claude Code は実行コマンドと予測影響を提示して停止する。

## DoD（index.md AC を Phase 1 チェックリストへ展開）

- [ ] 09a 親タスク Phase 11 の `NOT_EXECUTED` placeholder が、本タスク Phase 11 evidence への参照に置換されている
- [ ] `/members` search/filter smoke が 08a-B Phase 11 contract（`/public/members` curl + screenshots + axe）に沿って取得されている
- [ ] UI / authz / admin route smoke evidence（screenshot + Playwright report）が保存されている
- [ ] Forms schema / responses sync evidence（log + `sync_jobs` + `audit_log` dump）が保存されている
- [ ] `wrangler-tail.log` に staging ログまたは取得不能理由が保存されている
- [ ] 09c blocker（`task-09c-production-deploy-execution-001.md`）が実測結果で更新されている
- [ ] D1 staging `migrations list` が `Applied` のみ、または pending の理由 evidence が残っている
- [ ] D1 schema parity (staging vs production) 差分 0、または差分時は production 側 migration TODO が `unassigned-task/` に発行されている

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/index.md`
- `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/`（親タスク phase-11 / phase-12）
- `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 schema 正本 / `member_responses` / `sync_jobs` / `audit_log`）
- `apps/api/wrangler.toml`（`[env.staging]` / D1 binding `ubm-hyogo-db-staging`）
- `apps/web/wrangler.toml`（`[env.staging]`）
- `scripts/cf.sh`（Cloudflare CLI ラッパーの正本）
- `CLAUDE.md`（cf.sh 経由必須、`.env` 取り扱い、branch / governance）

## 多角的チェック観点

- 不変条件 #5: 公開 / 会員 / 管理境界が staging 実測で破綻していないこと
- 不変条件 #6: apps/web から D1 直アクセスが入っていないこと（smoke 中に確認）
- 不変条件 #14: Cloudflare free-tier の境界に踏み込んでいないこと
- placeholder と実測 evidence を物理パスで分離する（`NOT_EXECUTED` 文字列の混在禁止）
- 未実装 / 未実測を PASS と扱わない（Phase 7 AC マトリクスで突き合わせる）

## サブタスク管理

- [ ] 親タスク Phase 11 / Phase 12 の現状 placeholder を抽出し本 Phase 1 outputs に列挙
- [ ] 13 evidence path が `outputs/phase-11/evidence/` 配下で命名規則どおりに確保されることを確認
- [ ] G1〜G4 の approval gate が Phase 5 / Phase 11 runbook に貫通することを確認
- [ ] `outputs/phase-01/main.md` を作成

## 成果物

- `outputs/phase-01/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 上記 DoD の全項目に対する取得手段（コマンド / 保存先）が Phase 1 内で確定している
- approval gate の場所と実行コマンドが文書化されている
- 13 evidence パスの命名規則が Phase 2 設計に渡せる粒度で揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] follow-up gate（実測未取得を埋める）に限定されており、本体タスクの再実装ではない
- [ ] 本 Phase では deploy / commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ以下を渡す:
- 13 evidence の保存パス命名規則
- 8 件の DoD（実行手段が紐付いた状態）
- 4 件の approval gate（G1: api deploy / G2: D1 migration apply / G3: Forms sync / G4: 09c blocker 更新コミット）
- 親タスク `09a-parallel-...` および `task-09c-production-deploy-execution-001.md` の更新箇所

## 実行タスク

- [ ] phase-01 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 統合テスト連携

- Phase 11 の staging smoke evidence と Phase 12 compliance check で連携する。
