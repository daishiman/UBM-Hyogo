# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

型安全 / lint / test / a11y / 無料枠 / secret hygiene を一括チェックし、Phase 10 GO/NO-GO の根拠を作る。

## 実行タスク

1. 品質チェックリスト
2. 無料枠見積もり
3. secret hygiene
4. a11y

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-08/main.md | 命名統一 |
| 参考 | doc/00-getting-started-manual/specs/16-component-library.md | a11y 基準 |

## 実行手順

### ステップ 1: 品質チェック

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `pnpm typecheck` | error 0 |
| lint | `pnpm lint` | error 0、stableKey 直書き禁止 + window.UBM 禁止 |
| unit | `pnpm test --filter=apps/web` | URL zod 6+ 件 green |
| contract | 08a で実行 | 4 page × fixture green |
| E2E | 08b で実行 | 7 件 desktop / mobile pass |
| a11y | axe via Playwright | violation 0 |
| secret scan | gitleaks | finding 0 |

### ステップ 2: 無料枠見積もり

| 項目 | 想定 | 無料枠 | 結論 |
| --- | --- | --- | --- |
| Workers req (apps/web RSC) | 5,000 / day | 100,000 / day | OK |
| Workers req (apps/api 04a) | 5,000 / day | 100,000 / day | OK |
| D1 reads (04a) | 10,000 / day | 5,000,000 / day | OK |
| Cache hit ratio | 70% | - | revalidate 30〜600s で達成想定 |

### ステップ 3: secret hygiene

| # | チェック | 確認 | 期待 |
| --- | --- | --- | --- |
| H-01 | 公開層は secret 不要 | `grep -r "secret\|key" apps/web/app` | 0 件（const のみ） |
| H-02 | `PUBLIC_API_BASE_URL` は public var | wrangler.toml | name のみ |
| H-03 | responderUrl は spec 公開値（CLAUDE.md にあり）リポ commit OK | `git grep "responderUrl"` | spec / page 内のみ |

### ステップ 4: a11y

| 観点 | 対応 |
| --- | --- |
| FilterBar | `<label>` 連動、Tab で操作可 |
| MemberCard | リンクは `aria-label` 完備 |
| Hero | h1 構造正、画像 `alt` |
| LinkPills | 外部リンク `aria-label` |
| EmptyState | `role="status"` |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠 |
| 08a / 08b | 自動 test |
| 09a | staging deploy 前 |

## 多角的チェック観点

- 不変条件 #1: stableKey 直書き禁止 lint pass
- 不変条件 #5: lint で apps/web → D1 直接 import を error
- 不変条件 #6: `window.UBM` grep 0
- 不変条件 #8: density / sort / tag が URL query 正本（lint で localStorage 阻止）
- 不変条件 #10: 無料枠 4 項目 OK

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 品質チェック | 9 | pending | 7 種 |
| 2 | 無料枠見積もり | 9 | pending | 4 項目 |
| 3 | secret hygiene | 9 | pending | H-01〜H-03 |
| 4 | a11y | 9 | pending | 5 観点 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質 + 無料枠 + secret + a11y |
| メタ | artifacts.json | phase 9 status |

## 完了条件

- [ ] 7 種チェック pass の見込み
- [ ] 無料枠 4 項目 OK
- [ ] secret hygiene 3 件 pass
- [ ] a11y 5 観点対応

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- outputs/phase-09/main.md 配置
- 不変条件 #1, #5, #6, #8, #10 への対応が定量化
- 次 Phase へ GO / NO-GO 入力を渡す

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: blocker / minor / pass の集計
- ブロック条件: 無料枠超過の見込みなら進まない
