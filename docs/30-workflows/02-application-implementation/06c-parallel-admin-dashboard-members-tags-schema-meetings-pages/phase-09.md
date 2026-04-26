# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

型安全 / lint / unit / a11y / 無料枠 / secret hygiene を全項目チェックし、本タスクの spec が implementation phase で破綻しないことを確認する。

## 実行タスク

1. 型安全（typecheck pass、`responseId` と `memberId` の混同なし）
2. lint pass（D1 直接 import 検出、未使用 import なし）
3. unit test pass（component 単位）
4. a11y チェック（Drawer / Modal の WAI-ARIA、キーボード操作、focus trap）
5. 無料枠見積もり（Workers req / 月）
6. secret hygiene（環境変数の漏れチェック）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/admin-test-strategy.md | test 計画 |
| 必須 | outputs/phase-08/main.md | 命名統一 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | a11y 仕様 |

## 実行手順

### ステップ 1: 型安全
```bash
pnpm -F apps/web typecheck
```
- `responseId !== memberId` の混同を防ぐため、`AdminMemberDetailView` から取得する props を branded type で受ける

### ステップ 2: lint
```bash
pnpm -F apps/web lint
```
- ESLint rule で `apps/web` 内に `import.*repository`, `import.*wrangler`, `import.*cloudflare:` を ban
- 違反時は CI で error

### ステップ 3: unit test
```bash
pnpm -F apps/web test admin
```
- Phase 4 の test 計画を実行

### ステップ 4: a11y
- Drawer に `role="dialog"` + `aria-labelledby` + focus trap
- Modal に `role="alertdialog"` + escape close
- Switch / Button に visible label
- KVList の table semantics
- @axe-core/playwright で WCAG 2.1 AA の主要違反 0 件

### ステップ 5: 無料枠見積もり

| 操作 | 1 日想定回数 | 月間 |
| --- | --- | --- |
| `/admin` 表示 | 50 | 1,500 |
| `/admin/members` 一覧 | 30 | 900 |
| `/admin/members/:id` 詳細 | 50 | 1,500 |
| `/admin/tags` 表示 | 20 | 600 |
| `/admin/schema` 表示 | 10 | 300 |
| `/admin/meetings` 表示 | 10 | 300 |
| mutations | 30 | 900 |
| 合計 | 200 | 6,000 |

- Workers 100k req/日 の 0.2% → 余裕

### ステップ 6: secret hygiene
- `.env*` がリポジトリに無いことを確認
- `git ls-files | grep env` が空
- `apps/web/src/**/*.{ts,tsx}` で `process.env.AUTH_SECRET` 等の直書きが Server Component / route handler のみ
- Client Component では `NEXT_PUBLIC_*` 以外の env 参照禁止

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 全項目 PASS が GO の前提 |
| Phase 11 | 手動 smoke の前提 |
| Phase 12 | secret hygiene を skill-feedback-report に |

## 多角的チェック観点

| 不変条件 | チェック | 結果 |
| --- | --- | --- |
| #5 | ESLint rule で D1 直接 import を ban | error 検出 |
| #10 (無料枠) | Workers req/月が枠内 | 0.2% 程度 |
| 認可境界 | layout.tsx の admin gate が抜けていない | typecheck pass |
| a11y | Drawer / Modal が WAI-ARIA 準拠 | axe 0 violation |
| secret | client から AUTH_SECRET 等を参照しない | grep 0 件 |

## 無料枠見積もり

| サービス | 想定使用量 | 上限 | 余裕 |
| --- | --- | --- | --- |
| Workers req | 6,000 / 月 | 3M / 月（100k/日） | 99.8% |
| D1 reads | (apps/api 経由) | 500k / 日 | - |
| D1 writes | (apps/api 経由) | 100k / 日 | - |

## secret hygiene チェックリスト

- [ ] `.env*` が `.gitignore` に含まれている
- [ ] `git ls-files` に `.env` が含まれない
- [ ] Server Component 以外で AUTH_SECRET / GOOGLE_CLIENT_SECRET を参照しない
- [ ] Client Component は `NEXT_PUBLIC_*` のみ参照
- [ ] 1Password Environments に開発用 placeholder のみ存在

## a11y チェックリスト

- [ ] Drawer に role="dialog" + aria-labelledby
- [ ] Modal に role="alertdialog"
- [ ] Switch に visible label
- [ ] Button に visible label
- [ ] KVList が table semantics
- [ ] keyboard focus trap が Drawer / Modal で機能
- [ ] Escape で Drawer / Modal 閉じる
- [ ] @axe-core/playwright で violation 0

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | typecheck pass | 9 | pending | branded type |
| 2 | lint pass | 9 | pending | ESLint rule |
| 3 | unit test pass | 9 | pending | vitest |
| 4 | a11y チェック | 9 | pending | axe-core |
| 5 | 無料枠見積もり | 9 | pending | Workers |
| 6 | secret hygiene | 9 | pending | grep |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | チェック結果 |
| メタ | artifacts.json | Phase 9 を completed |

## 完了条件

- [ ] 6 項目すべて PASS
- [ ] 無料枠 99% 以上の余裕
- [ ] a11y violation 0 件
- [ ] secret hygiene チェック完了

## タスク100%実行確認

- 全項目に check 結果
- 不変条件 #5 と #10 が担保
- artifacts.json で phase 9 を completed

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ: 全 PASS 結果を GO 判定の根拠に
- ブロック条件: 1 項目でも FAIL なら差し戻し
