# Phase 11: 手動テスト（NON_VISUAL）

## 11.1 NON_VISUAL 宣言（WEEKGRD-03 / Feedback 4 準拠）

| 項目                  | 値                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------- |
| タスク種別            | NON_VISUAL（バックエンド env 参照経路バグ、UI 表示物の意匠変更なし）                       |
| スクリーンショット    | 不要（既存 admin dashboard の UI は変更なし）                                              |
| 代替証跡 (主ソース)   | (1) Playwright admin dashboard runtime smoke (#849) の pass ログ                          |
|                       | (2) staging 実機 `curl -I /admin` の `200 OK` 応答                                         |
|                       | (3) `wrangler tail` で `error.boundary.caught` が新規発生しないこと                       |
| 作らない理由          | 表示要素・レイアウト・トークン・配色いずれにも変更がないため。runtime 200 で機能継続を担保 |
| 関連 `ui-sanity-visual-review.md` | NON_VISUAL のため非該当（冒頭に「NON_VISUAL宣言・非視覚的バグ修正・代替証跡=Playwright smoke + staging 200 確認」を記載） |

## 11.2 staging 再現テスト手順

```bash
# 1. staging に deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# 2. tail を起動（別 terminal）
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging --format pretty

# 3. ブラウザで /admin を開く
#    https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin

# 4. 期待:
#    - 200 で render される（global-error boundary に到達しない）
#    - tail に `error.boundary.caught` (scope=admin) が出ない
#    - dashboard KPI / Zone Distribution / Recent Actions が表示される
```

エビデンスは `outputs/phase-11/manual-test-result.md` に記録。

## 11.3 manual-test-result.md テンプレート

```markdown
# manual-test-result.md

## 実施情報
- 実施日時: 2026-05-23 hh:mm JST
- 実施環境: Cloudflare Workers staging
- ビルド commit: <commit hash>
- 実施者: <name>

## NON_VISUAL 宣言
（11.1 と同内容を再掲）

## 証跡（主ソース）
- [ ] Playwright runtime smoke pass: outputs/phase-6/playwright-result.txt 抜粋
- [ ] staging /admin HTTP status: 200
- [ ] error.boundary.caught (scope=admin) 発生件数: 0

## 仕様判断根拠
- 不変条件「apps/web の env 参照は getEnv() 経由のみ」適合
- 既存 API endpoint surface のみ利用
- 127.0.0.1 焼き込み排除

## 実行記録
（curl / tail / playwright 出力の抜粋）
```

## 11.4 Phase 11 着手チェック（Feedback 3）

- Phase 1 で記録した分類: NON_VISUAL → Phase 11 着手時の判定と一致。再分類不要。
