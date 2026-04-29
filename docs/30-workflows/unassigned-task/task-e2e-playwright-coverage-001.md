# Next.js page / route の E2E coverage（Playwright）導入 - タスク指示書

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-e2e-playwright-coverage-001                                      |
| タスク名     | apps/web Next.js page / layout の E2E coverage 補完                   |
| 分類         | テストフレームワーク追加 / カバレッジ補完                             |
| 対象機能     | Playwright + apps/web `page.tsx` / `layout.tsx` / route.ts 主要導線   |
| 優先度       | 中                                                                    |
| 見積もり規模 | 中規模                                                                |
| ステータス   | 未実施 (proposed)                                                     |
| 親タスク     | coverage-80-enforcement                                               |
| 発見元       | coverage-80-enforcement Phase 12 unassigned-task-detection (U-2)      |
| 発見日       | 2026-04-29                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`apps/web` の `page.tsx` / `layout.tsx` / Edge runtime 領域は Vitest v8 unit coverage で計測しにくく、coverage-80-enforcement では `coverage.exclude` リストで除外する設計となった。除外比率が高いと、apps/web の重要導線（公開ディレクトリ / マイページ / 管理バックオフィス）が unit coverage から外れてしまう。

### 1.2 問題点・課題

- exclude が広がりすぎると 80% gate が形骸化（高い数値だが実体は薄い）
- Cloudflare Workers（OpenNext）の Edge runtime テストは v8 で再現困難
- ユーザー導線回帰の検知手段が unit テストに不在

### 1.3 放置した場合の影響

- apps/web の重要 page / route が回帰テストの対象から外れ、本番障害検知が遅れる
- coverage 80% gate 通過しても実体カバレッジが低く、品質保証として機能しない

---

## 2. 何を達成するか（What）

### 2.1 目的

Playwright 等の E2E coverage を別経路で導入し、unit coverage 除外分を補完する。

### 2.2 最終ゴール（想定 AC）

1. apps/web 主要 route（公開ディレクトリ / マイページ / 管理）の smoke / accessibility / server action 境界が E2E テストでカバーされる
2. E2E coverage の閾値（例: 主要 route 100% 訪問）が定義され、CI で gate される
3. coverage-guard.sh の `coverage.exclude` 除外比率が Phase 11 baseline 計測で 30% 以下に収まる（または超過時の代替指標が runbook 合意される）
4. E2E テストは Cloudflare Workers staging 環境で実行可能

### 2.3 スコープ

#### 含むもの

- Playwright 導入仕様（config / fixture / CI integration）
- apps/web 主要 route の E2E テスト初期セット
- E2E coverage 閾値の合意

#### 含まないもの

- E2E テスト全件の実装（初期セットのみ。網羅は別タスク）
- Visual regression（Chromatic 等）導入

### 2.4 成果物

- `apps/web/playwright.config.ts`
- `apps/web/e2e/` ディレクトリと初期テスト
- CI workflow 追記
- E2E coverage 運用 runbook

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- coverage-80-enforcement PR① 以降（exclude リスト確定後）
- Cloudflare staging 環境が利用可能

### 3.2 依存タスク

- 親: coverage-80-enforcement
- 関連: UT-24（staging deploy smoke test）, UT-26（sheets API e2e smoke test）

### 3.3 推奨アプローチ

PR② テスト追加期間中に並行して導入。staging 環境向け smoke を最小セットで開始し、route 追加に応じて段階拡張する。

---

## 4. 苦戦箇所【記入必須】

`page.tsx` / `layout.tsx` / Edge runtime 領域は v8 unit coverage で計上できないため、単純 include すると 0% で gate を不当に落とす。一方で広く exclude すると見かけ coverage は高いが実体は薄くなる。E2E coverage で補完する場合も、Cloudflare Workers の OpenNext runtime と Playwright のローカル実行で挙動差が出やすい（KV / D1 binding の mock 戦略が必要）。E2E は実行時間が長いため CI 内訳の整理（parallel / shard）も慎重に設計する必要がある。

---

## 5. 影響範囲

- `apps/web/playwright.config.ts`（新規）
- `apps/web/e2e/`（新規）
- `apps/web/package.json` script
- `.github/workflows/ci.yml`（E2E job 追加）
- coverage-80-enforcement の `coverage.exclude` 妥当性

---

## 6. 推奨タスクタイプ

implementation / VISUAL（page 描画を含む E2E のため UI 観点が混入する）

---

## 7. 参照情報

- 検出ログ: `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md` の U-2
- 親 index: `docs/30-workflows/coverage-80-enforcement/index.md`（苦戦想定 #3）
- Playwright docs: https://playwright.dev
- 関連 UT-26: `docs/30-workflows/unassigned-task/UT-26-sheets-api-e2e-smoke-test.md`

---

## 8. 備考

Playwright 導入と並行して `coverage.exclude` 除外比率を baseline 計測で常時可視化し、E2E でカバーした route は exclude から外す運用にすると unit / E2E の境界が動的に最適化される。
