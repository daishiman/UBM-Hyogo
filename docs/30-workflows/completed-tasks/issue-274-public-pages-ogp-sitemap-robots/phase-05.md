# Phase 5: 環境 / 設定準備

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 | 前 | 4 | 次 | 6 |
| 状態 | completed |

## 目的
sitemap / robots / OG image を実装するための env / wrangler / Next.js 設定の事前変更を完了する。

## 5.1 env schema 確認
`apps/web/src/lib/env.ts` の `EnvSchema` に既に `ENVIRONMENT` / `INTERNAL_API_BASE_URL` がある。**追加変更なし**。

## 5.2 site URL の env 追加是非
本サイクルでは `getSiteUrl()` 内で `ENVIRONMENT` 値から URL を hard-code する（CONST_007: 1 サイクル内完結のため、env 追加 + secrets 投入 + wrangler.toml 更新で副作用を増やさない）。
将来的に `NEXT_PUBLIC_SITE_URL` を `EnvSchema` に追加する判断は別 followup 候補だが、本タスクには含めない。

## 5.3 wrangler.toml 確認
- `apps/web/wrangler.toml`: 変更なし
- `[vars]` / `[env.staging.vars]` / `[env.production.vars]` の `ENVIRONMENT` 値が `local` / `staging` / `production` で揃っていることを確認

## 5.4 Next.js / OpenNext 互換性確認
- `apps/web/next.config.ts`: 変更なし
- `apps/web/open-next.config.ts`: 変更なし
- `next/og` の ImageResponse は OpenNext Workers で動作する（Next.js 公式に edge runtime 互換）

## 5.5 Playwright config 確認
- `apps/web/playwright.config.ts` で baseURL が `http://localhost:3000` であることを確認
- smoke 用 project が既にある場合はそこに spec 追加、なければ smoke project の有無を `playwright.config.ts` で確認

## 5.6 依存パッケージ確認
```bash
# next/og は Next.js に同梱
node -e "console.log(require.resolve('next/og'))"
```
**追加 install 不要**。

## 依存 Phase 参照
- Phase 4 の成果物を参照する


## 完了条件
- [ ] この Phase の成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- `outputs/phase-05/main.md` に env / wrangler / next.config に「変更不要」を明記した確認ログを記録
- Playwright baseURL と smoke project の設定を確認した結果を記録


## 実行タスク
- [ ] env schema / wrangler vars / Next.js config の変更要否を確認する
- [ ] Playwright smoke の起動前提を確認する
- [ ] 追加 install 不要であることを `next/og` resolve で確認する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| 現行 env | `apps/web/src/lib/env.ts` | env schema 変更要否 |
| Cloudflare config | `apps/web/wrangler.toml` | ENVIRONMENT / API base URL vars |
| Playwright config | `apps/web/playwright.config.ts` | smoke 実行前提 |


## 成果物
- `outputs/phase-05/main.md`（env / config / dependency 確認ログ）
