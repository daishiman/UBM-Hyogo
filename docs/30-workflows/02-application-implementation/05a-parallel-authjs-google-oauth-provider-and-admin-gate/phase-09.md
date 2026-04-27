# Phase 9 — 品質保証: 型安全 / lint / 無料枠 / secret hygiene / a11y

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 9 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-08（DRY 化） |
| 下流 | phase-10（最終レビュー） |

## 目的

型安全 / lint / test / a11y / 無料枠 / secret hygiene を一括チェックし、Phase 10 GO/NO-GO 判定の根拠を作る。本タスクの secrets は AUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / INTERNAL_TOKEN の 4 種が対象。

## 実行タスク

1. 型安全 / lint / test / a11y のチェックリスト
2. 無料枠見積もり（D1 reads / Workers req / OAuth API call）
3. secret hygiene チェックリスト（4 種 secrets）
4. a11y 観点（OAuth ボタン、admin 拒否時の error 表示）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-08/main.md | 命名統一 |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 参考 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | secrets 配置 |

## 実行手順

### ステップ 1: 品質チェックリスト

| 種別 | コマンド / 手段 | 期待 |
| --- | --- | --- |
| typecheck | `pnpm typecheck` | error 0 |
| lint | `pnpm lint` | error 0、ESLint rule で apps/web → D1 を阻止 |
| unit test | `pnpm test --filter=apps/api` | 15+ 件 green |
| contract test | 08a で実行 | 20+ 件 green |
| E2E | 08b で Playwright (mock OAuth) | 6+ 件 green |
| a11y | `axe-core` Playwright integration（08b） | violation 0 |
| secret scan | `gitleaks detect` | finding 0 |

### ステップ 2: 無料枠見積もり

| 項目 | 想定 | 無料枠 | 結論 |
| --- | --- | --- | --- |
| D1 reads (session-resolve lookup) | 500 / day（ログイン時のみ）| 5,000,000 / day | OK（0.01%） |
| D1 writes (本タスクは write 無し) | 0 / day | 100,000 / day | OK |
| Workers requests (session-resolve) | 500 / day | 100,000 / day | OK |
| Workers requests (requireAdmin) | 1,000 / day（admin 操作のみ） | 100,000 / day | OK |
| Pages requests (middleware) | 5,000 / day | unlimited (Pages) | OK |
| Google OAuth API call | 500 / day | 10,000 / day（OAuth quota）| OK |
| KV (session 不使用) | 0 | - | N/A |

**結論**: 全項目 OK。session を JWT に閉じることで D1 row 増を完全に回避（不変条件 #10）

### ステップ 3: secret hygiene

| # | チェック | 確認方法 | 期待 |
| --- | --- | --- | --- |
| H-01 | `AUTH_SECRET` がリポジトリに含まれない | `git grep` + gitleaks | finding 0 |
| H-02 | `GOOGLE_CLIENT_ID` がリポジトリに含まれない | 同上 | finding 0 |
| H-03 | `GOOGLE_CLIENT_SECRET` がリポジトリに含まれない | 同上 | finding 0 |
| H-04 | `INTERNAL_TOKEN` がリポジトリに含まれない | 同上 | finding 0 |
| H-05 | `.env` がコミットされていない | `git ls-files .env*` | 結果なし（.env.example のみ可） |
| H-06 | wrangler.toml に secret の値が書かれていない | `cat wrangler.toml` | name 参照のみ |
| H-07 | placeholder のドキュメントは値を含まない | `grep -rE 'GOCSPX-|AIza\|gho_'` | 0 件 |
| H-08 | secrets が infra 04 のリストに含まれている | infra 04 cross-check | 4 種すべて記載 |

### ステップ 4: a11y

| 観点 | 対応 | 担当 task |
| --- | --- | --- |
| `/login` の Google OAuth ボタン | `aria-label="Google でログイン"` を付与 | 06b |
| gate 拒否時の error 表示 | `/login?gate=admin_required` 等を `aria-live="polite"` で表示 | 06b |
| keyboard navigation | OAuth ボタンが Tab 移動可能、Enter で signIn 起動 | 06b |
| screen reader | `prompt: "select_account"` 設定で複数アカウント選択を読み上げ | provider 設定 |

### ステップ 5: Cloudflare Edge runtime 互換性チェック

| # | チェック | 期待 |
| --- | --- | --- |
| E-01 | middleware.ts が Node.js API（fs, child_process 等）を import しない | OK |
| E-02 | `auth.ts` が Edge runtime 互換 module のみ使用 | OK |
| E-03 | JWT verify (HS256) が Edge runtime で動く | OK（Web Crypto API） |
| E-04 | session-resolve への fetch が apps/web edge runtime から実行可能 | OK（fetch API） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠 |
| 05b Phase 9 | secret hygiene の H-01〜H-08 を共有（AUTH_SECRET, INTERNAL_TOKEN は共通）|
| 08a / 08b | 自動 test 実行と本リスト突合 |
| 09a | staging deploy 前のチェック |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5 (apps/web → D1 禁止) | lint が apps/web → D1 を error にする | #5 |
| #8 (localStorage で session 持たない) | Auth.js v5 の jwt strategy + httpOnly cookie | #8 |
| #9 (`/no-access` 不在) | `find apps/web/app/no-access -type d` で 0 件 | #9 |
| #10 (無料枠) | 無料枠見積もり表が全項目で OK | #10 |
| secret hygiene | H-01〜H-08 全て pass | - |
| Cloudflare 互換 | E-01〜E-04 全て OK | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 品質チェックリスト | 9 | pending | 7 種 |
| 2 | 無料枠見積もり | 9 | pending | 7 項目 |
| 3 | secret hygiene | 9 | pending | H-01〜H-08 |
| 4 | a11y | 9 | pending | 4 観点 |
| 5 | Edge runtime 互換 | 9 | pending | E-01〜E-04 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質 + 無料枠 + secret + a11y + edge 互換 |
| メタ | artifacts.json | phase 9 status |

## 完了条件

- [ ] 7 種チェックすべて pass の見込み
- [ ] 無料枠 7 項目が OK
- [ ] secret hygiene H-01〜H-08 が pass
- [ ] a11y 4 観点が対応
- [ ] Edge runtime 互換 E-01〜E-04 が OK

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- outputs/phase-09/main.md 配置
- 全完了条件にチェック
- 不変条件 #5, #8, #9, #10 への対応が定量化
- 次 Phase へ GO/NO-GO 判定の入力を渡す

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: blocker / minor / pass の集計
- ブロック条件: 無料枠超過の見込みがある場合は進まない
