# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

型安全 / lint / test / a11y / 無料枠 / secret hygiene を一括チェックし、Phase 10 GO/NO-GO 判定の根拠を作る。

## 実行タスク

1. 型安全 / lint / test / a11y のチェックリスト
2. 無料枠見積もり（D1 writes / Workers req / mail 送信回数）
3. secret hygiene チェックリスト

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-08/main.md | 命名統一 |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠 |

## 実行手順

### ステップ 1: 品質チェックリスト

| 種別 | コマンド / 手段 | 期待 |
| --- | --- | --- |
| typecheck | `pnpm typecheck` | error 0 |
| lint | `pnpm lint` | error 0、ESLint rule で apps/web → D1 を阻止 |
| unit test | `pnpm test --filter=apps/api` | 12+ 件 green |
| contract test | 08a で実行 | 15+ 件 green |
| a11y | `axe-core` Playwright integration（08b） | violation 0 |
| secret scan | `gitleaks detect` | finding 0 |

### ステップ 2: 無料枠見積もり

| 項目 | 想定 | 無料枠 | 結論 |
| --- | --- | --- | --- |
| D1 writes (token insert) | 100 / day | 100,000 / day | OK（0.1%） |
| D1 reads (gate-state lookup) | 1,000 / day | 5,000,000 / day | OK |
| Workers requests | 5,000 / day | 100,000 / day | OK |
| Mail (Resend) | 100 / day | 100 / day | ぎりぎり、運用監視必要 |

### ステップ 3: secret hygiene

| # | チェック | 確認方法 | 期待 |
| --- | --- | --- | --- |
| H-01 | `MAIL_PROVIDER_KEY` がリポジトリに含まれない | `git grep` + gitleaks | finding 0 |
| H-02 | `AUTH_SECRET` がリポジトリに含まれない | 同上 | finding 0 |
| H-03 | `.env` がコミットされていない | `git ls-files .env*` | 結果なし（.env.example のみ可） |
| H-04 | wrangler.toml に secret の値が書かれていない | `cat wrangler.toml` | name 参照のみ |
| H-05 | placeholder のドキュメントは値を含まない | `grep -r 'sk_live\|re_'` | 0 件 |

### ステップ 4: a11y

| 観点 | 対応 |
| --- | --- |
| `/login` 状態切替 | `aria-live="polite"` で読み上げ |
| メール本文 | plain text alternative |
| token error redirect | `/login?error=...` の error メッセージは `aria-live` で表示（06b 担当） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠 |
| 08a / 08b | 自動 test 実行と本リスト突合 |
| 09a | staging deploy 前のチェック |

## 多角的チェック観点

- 不変条件 #5: lint が apps/web → D1 を error にする
- 不変条件 #8: localStorage で session を持つ箇所が lint で error
- 不変条件 #9: `find apps/web/app/no-access -type d` で 0 件
- 不変条件 #10: 無料枠見積もり表が全項目で OK
- secret hygiene: H-01〜H-05 全て pass

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 品質チェックリスト | 9 | pending | 6 種 |
| 2 | 無料枠見積もり | 9 | pending | 4 項目 |
| 3 | secret hygiene | 9 | pending | H-01〜H-05 |
| 4 | a11y | 9 | pending | 3 観点 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質 + 無料枠 + secret + a11y |
| メタ | artifacts.json | phase 9 status |

## 完了条件

- [ ] 6 種チェックすべて pass の見込み
- [ ] 無料枠 4 項目が OK
- [ ] secret hygiene H-01〜H-05 が pass
- [ ] a11y 3 観点が対応

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- outputs/phase-09/main.md 配置
- 全完了条件にチェック
- 不変条件 #5, #8, #9, #10 への対応が定量化
- 次 Phase へ GO/NO-GO 判定の入力を渡す

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: blocker / minor / pass の集計
- ブロック条件: 無料枠超過の見込みがある場合は進まない
