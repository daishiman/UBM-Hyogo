# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

「無料枠見積もり」「secret hygiene」「a11y」の 3 軸で staging 環境品質を裏付ける証跡を `outputs/phase-09/main.md` に集約し、Phase 10 GO/NO-GO 判定の根拠とする。

## 実行タスク

1. Cloudflare 無料枠（Workers / D1 / Pages）の staging 24h 見積もりを記述
2. secret hygiene チェックリスト（log 漏洩 / commit 混入 / .env 残置）
3. a11y チェック（08b Playwright a11y suite の staging 結果）
4. spec_created でも書ける範囲の品質ガード（lint / typecheck / test green）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠仕様 |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | a11y 観点 |
| 必須 | doc/02-application-implementation/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/ | a11y suite |
| 参考 | CLAUDE.md | secrets 管理ポリシー |

## 実行手順

### ステップ 1: 無料枠見積もり
- staging 24h で想定: Workers req 30k 以下 / D1 reads 50k 以下 / D1 writes 5k 以下 / Pages req は無制限相当
- 実測は Cloudflare Analytics URL から取得

### ステップ 2: secret hygiene
- `git grep` で `AUTH_SECRET=` / `GOOGLE_PRIVATE_KEY=` がリポジトリにないか
- `gh run view` log で secret が masked されているか
- `.env` ファイルが `.gitignore` に含まれているか

### ステップ 3: a11y 確認
- 08b Playwright a11y suite を staging URL で実行
- a11y violation が WCAG AA 基準で 0 件

### ステップ 4: 品質ガード
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` を CI で再確認

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO 判定の根拠 |
| Phase 11 | smoke 後に同じ Cloudflare Analytics で再確認 |
| 並列 09b | 監視 / alert で free-tier 超過を通知 |
| 下流 09c | production の free-tier 見積もりに転用 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: web bundle に D1 import なし（H-1 再確認）
- 不変条件 #10: 無料枠見積もりが PASS
- 不変条件 #11: admin UI に編集 form なし（grep 0 件）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積もり | 9 | pending | Workers / D1 / Pages |
| 2 | secret hygiene | 9 | pending | git grep / .env / log |
| 3 | a11y 確認 | 9 | pending | 08b a11y suite を staging で |
| 4 | 品質ガード | 9 | pending | lint / typecheck / test |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質サマリ + 無料枠見積もり |
| メタ | artifacts.json | Phase 9 を completed に更新 |

## 完了条件

- [ ] 無料枠見積もりが PASS
- [ ] secret hygiene 違反 0 件
- [ ] a11y violation 0 件
- [ ] 品質ガード 4 項目 green

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 4 軸チェックすべて green
- artifacts.json の phase 9 を completed に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: 無料枠見積もり結果、secret hygiene 結果、a11y 結果
- ブロック条件: いずれかの軸で違反が 1 件でも出れば次 Phase へ進まず該当 task へ差し戻し

## 無料枠見積もり（staging 24h）

| メトリクス | 上限 | 想定実測 | 余裕 |
| --- | --- | --- | --- |
| Workers req | 100k req/day | 30k req（手動 sync 2 回 + Playwright + smoke） | 70% |
| D1 reads | 500k/day | 50k（一覧 + 詳細 + admin queries） | 90% |
| D1 writes | 100k/day | 5k（sync UPSERT） | 95% |
| Pages req | 無制限相当 | - | - |

確認 URL（placeholder）:
- `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/analytics`
- `https://dash.cloudflare.com/<account>/d1/databases/ubm_hyogo_staging/metrics`

## Secret hygiene チェックリスト

| # | 項目 | 確認コマンド | 期待 |
| --- | --- | --- | --- |
| 1 | リポジトリに secret 平文がない | `git grep -n "AUTH_SECRET=\|GOOGLE_PRIVATE_KEY=\|RESEND_API_KEY="` | 0 hit |
| 2 | `.env` 系がコミット対象外 | `git check-ignore -v .env .env.staging .env.production` | 全て ignored |
| 3 | GitHub Actions log で secret が masked | `gh run view --log` で `***` 表示 | masked |
| 4 | wrangler secret 一覧で予期せぬ secret なし | `wrangler secret list --config apps/api/wrangler.toml` | 4 種のみ |
| 5 | Pages secret 一覧で予期せぬ secret なし | `wrangler pages secret list --project-name ubm-hyogo-web-staging` | 3 種のみ |

## a11y チェック（staging URL）

| ページ | 確認項目 | 期待 |
| --- | --- | --- |
| `/` | landmark / heading / contrast | violation 0 |
| `/members` | filter form の label / focus order | violation 0 |
| `/login` | form / error message の aria | violation 0 |
| `/profile` | summary 表の構造 / a11y label | violation 0 |
| `/admin` | nav / table / drawer 操作 | violation 0 |

## 品質ガード（CI 再確認）

| ガード | コマンド | 期待 |
| --- | --- | --- |
| lint | `pnpm lint` | exit 0 |
| typecheck | `pnpm typecheck` | exit 0 |
| test | `pnpm test` | exit 0 |
| build | `pnpm build` | exit 0 |
