# Phase 9: 品質保証: 型安全 / lint / build / secret hygiene / 不変条件 / mirror parity

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 9 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-08（DRY 化） |
| 下流 | phase-10（最終レビュー） |

## 目的

`pnpm typecheck` / `pnpm lint` / `pnpm build` の 3 ゲートと、line budget / link check / mirror parity / gitleaks / 不変条件 #5 違反チェック / 無料枠 / a11y / Edge 互換を一括検査し、Phase 10 の GO/NO-GO 判定の根拠を作る。本タスクで対象となる secrets は `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` の 4 種。

## 実行タスク

1. 品質ゲート（typecheck / lint / build / unit / contract / E2E / a11y / gitleaks）
2. line budget チェック（各 phase ファイルの行数上限）
3. link チェック（相互参照のパス整合）
4. mirror parity チェック（index.md / phase-XX.md / outputs の整合）
5. gitleaks による secret scan（4 種 secrets）
6. 不変条件 #5 違反チェック（apps/web 配下に D1 binding / `apps/api` 直接 import が混入していないこと）
7. 無料枠見積もり（D1 / Workers / OAuth quota）
8. a11y 観点（login ボタン / gate 拒否表示）
9. Edge runtime 互換性（Web Crypto API のみ、`node:crypto` 不使用）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-08/main.md | 命名統一 |
| 必須 | outputs/phase-07/ac-matrix.md | AC × test ID |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 無料枠 |
| 参考 | CLAUDE.md | 不変条件 #5（D1 直接アクセス禁止）/ 無料枠 / シークレット管理 |
| 参考 | docs/30-workflows/unassigned-task/UT-11-google-oauth-admin-login-flow.md | 完了条件 13 項目 |

## 実行手順

### ステップ 1: 品質ゲート

| 種別 | コマンド / 手段 | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | error 0 |
| lint | `mise exec -- pnpm lint` | error 0、`node:crypto` import 禁止ルールが apps/web に効く |
| build | `mise exec -- pnpm build` | apps/web / apps/api ともに success |
| unit test | `mise exec -- pnpm test --filter=apps/web` | Phase 4 の U-XX 全件 green |
| contract test | Phase 4 の C-XX | callback 全分岐 green |
| E2E | `wrangler pages dev` + Playwright（mock OAuth） | E-01〜E-06 green |
| a11y | axe-core Playwright integration | violation 0 |
| gitleaks | `gitleaks detect --no-git -v` | finding 0（4 種 secrets） |

### ステップ 2: line budget

| ファイル | 上限（目安） | 検査方法 |
| --- | --- | --- |
| phase-01.md 〜 phase-13.md | 各 240 行以下 | `wc -l` |
| index.md | 200 行以下 | 同 |
| outputs/phase-XX/main.md | 200 行以下 | 同 |
| outputs/phase-02/architecture.md ほか設計成果物 | 250 行以下 | 同 |

> 超過時は表分割や別 md への切り出しで対応。本タスクは serial 単独タスクのため、phase 数 13 × 平均 150 行を上限の目安とする。

### ステップ 3: link チェック

| 観点 | 検査方法 | 期待 |
| --- | --- | --- |
| 相対パス参照 | `grep -nE '\]\(([^)]+\.md)' docs/30-workflows/ut-11-google-oauth-admin-login-flow/` で参照先存在確認 | 全リンクが解決 |
| 上流タスク参照 | 01c / 02-serial / UT-03 のパスが存在 | 解決 |
| AC 番号参照 | phase-07 の AC-1〜AC-13 が他 phase と一致 | 一致 |
| outputs 参照 | `outputs/phase-XX/main.md` がすべて作成 | 13 ファイル存在 |

### ステップ 4: mirror parity

| 対 | 検査内容 | 期待 |
| --- | --- | --- |
| index.md ↔ phase-XX.md | Phase 一覧表の名称・ファイル名・状態が一致 | 完全一致 |
| phase-XX.md ↔ outputs/phase-XX/ | 成果物表のパスがすべて outputs に存在 | 完全一致 |
| artifacts.json ↔ phase ファイル | 各 phase status / wave / 種別が一致 | 完全一致 |
| AC 番号 | index.md AC-1〜AC-13 と phase-07 ac-matrix が一致 | 完全一致 |

### ステップ 5: secret hygiene（gitleaks）

| # | チェック | 確認方法 | 期待 |
| --- | --- | --- | --- |
| H-01 | `SESSION_SECRET` の値がリポジトリに存在しない | `gitleaks detect` + `git grep -nE 'SESSION_SECRET\s*=\s*[^$]'` | finding 0 |
| H-02 | `ADMIN_EMAIL_ALLOWLIST` の値（実 email）が docs / code に存在しない | `git grep -nE '@(gmail|example)\.com'` を docs/30-workflows 限定で確認 | example.com のみ |
| H-03 | `GOOGLE_CLIENT_ID` の値（`*.apps.googleusercontent.com`）がリポジトリに含まれない | `git grep -nE 'apps\.googleusercontent\.com'` | finding 0（プレースホルダのみ） |
| H-04 | `GOOGLE_CLIENT_SECRET`（`GOCSPX-*`）がリポジトリに含まれない | `git grep -nE 'GOCSPX-'` | finding 0 |
| H-05 | `.env` / `.dev.vars` がコミットされていない | `git ls-files | grep -E '\.dev\.vars$|\.env$'` | 結果なし（`.env.example` のみ可） |
| H-06 | `wrangler.toml` に secret 値が書かれていない | `cat apps/web/wrangler.toml`（手動レビュー） | name 参照のみ |
| H-07 | docs に placeholder 以外の認証値が含まれない | `grep -rE 'AIza|GOCSPX-|gho_'` docs/ | 0 件 |
| H-08 | `.dev.vars` が `.gitignore` に登録 | `grep -nE '^\.dev\.vars' .gitignore` | hit |

### ステップ 6: 不変条件 #5 違反チェック（D1 直接アクセス禁止）

| # | チェック | 確認方法 | 期待 |
| --- | --- | --- | --- |
| I5-01 | `apps/web/` 配下に D1 binding 名（例: `DB`）参照がない | `git grep -nE 'env\.DB|D1Database|drizzle' apps/web/` | finding 0 |
| I5-02 | `apps/web/wrangler.toml` に `[[d1_databases]]` セクションがない | `grep -nE 'd1_databases' apps/web/wrangler.toml` | hit なし |
| I5-03 | `apps/web/` から `apps/api/src/repository/*` 系の直接 import がない | `git grep -nE "from\s+['\"].*apps/api" apps/web/` | finding 0 |
| I5-04 | session 検証が D1 lookup を伴わない（JWT Cookie 完結） | session.ts コードレビュー | OK |
| I5-05 | allowlist 参照が `env.ADMIN_EMAIL_ALLOWLIST`（Secret）であり D1 ではない | allowlist.ts コードレビュー | OK |

### ステップ 7: 無料枠見積もり

| 項目 | 想定 | 無料枠 | 結論 |
| --- | --- | --- | --- |
| D1 reads | 0 / day（本タスク不使用） | 5,000,000 / day | OK |
| D1 writes | 0 / day | 100,000 / day | OK |
| Workers requests (login + callback + logout) | 50 / day（管理者数名 × 数回） | 100,000 / day | OK |
| Workers requests (middleware on `/admin/*`) | 5,000 / day | 100,000 / day | OK |
| KV | 0 | - | N/A |
| Google OAuth API call | 50 / day | 10,000 / day | OK |

**結論**: session を JWT Cookie に閉じることで D1 row 増を完全に回避（不変条件 #5 / 無料枠両立）

### ステップ 8: a11y

| 観点 | 対応 |
| --- | --- |
| `/login` の Google ログインボタン | `aria-label="Google でログイン"` を付与 |
| gate 拒否表示 | `/login?gate=admin_required` 等を `aria-live="polite"` で表示 |
| keyboard navigation | login ボタンが Tab 移動可能、Enter で `/api/auth/login` GET 起動 |
| screen reader | `prompt=select_account` で複数アカウント選択を読み上げ |

### ステップ 9: Edge runtime 互換性

| # | チェック | 期待 |
| --- | --- | --- |
| E-01 | `apps/web/middleware.ts` が Node.js API（`node:fs` / `node:crypto` / `child_process` 等）を import しない | OK |
| E-02 | `apps/web/src/lib/oauth/pkce.ts` が `crypto.subtle` / `crypto.getRandomValues` のみ使用 | OK |
| E-03 | `apps/web/src/lib/auth/session.ts` の HS256 署名・検証が Web Crypto API ベース | OK |
| E-04 | callback route の `fetch` が Edge runtime で動く（Google token / userinfo） | OK |
| E-05 | lint ルールで `node:crypto` の import を error にする | OK |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠 |
| Phase 11 | smoke で AC-9 / AC-11 / AC-12 を実環境確認 |
| Phase 12 | mirror parity を doc 更新の入口に |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5 (apps/web → D1 禁止) | I5-01〜I5-05 を全 pass、lint で apps/web → D1 を error に | #5 |
| #6 (GAS prototype 不昇格) | E-02 / E-03 で Web Crypto API のみ使用 | #6 |
| secret hygiene | H-01〜H-08 全 pass | - |
| 無料枠 | 6 項目すべて OK | - |
| Edge 互換 | E-01〜E-05 全 OK | - |
| a11y | 4 観点が対応 | - |
| line budget / link / mirror parity | 全 ok（doc-only タスクの品質指標） | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 品質ゲート（typecheck / lint / build / test / a11y / gitleaks） | 9 | pending | 8 種 |
| 2 | line budget | 9 | pending | 全 phase ファイル |
| 3 | link チェック | 9 | pending | 4 観点 |
| 4 | mirror parity | 9 | pending | 4 観点 |
| 5 | secret hygiene | 9 | pending | H-01〜H-08 |
| 6 | 不変条件 #5 違反チェック | 9 | pending | I5-01〜I5-05 |
| 7 | 無料枠 | 9 | pending | 6 項目 |
| 8 | a11y | 9 | pending | 4 観点 |
| 9 | Edge runtime 互換 | 9 | pending | E-01〜E-05 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質ゲート + line budget + link + mirror parity + gitleaks + 不変条件 #5 + 無料枠 + a11y + Edge 互換 |
| メタ | artifacts.json | phase 9 status |

## 完了条件

- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm build` の 3 ゲートが pass の見込み
- [ ] gitleaks finding 0（H-01〜H-08）
- [ ] 不変条件 #5 違反 0 件（I5-01〜I5-05）
- [ ] line budget / link / mirror parity すべて pass
- [ ] 無料枠 6 項目 OK
- [ ] a11y 4 観点が対応
- [ ] Edge runtime 互換 E-01〜E-05 OK

## タスク 100% 実行確認【必須】

- [ ] 全 9 サブタスクが completed
- [ ] outputs/phase-09/main.md 配置
- [ ] 全完了条件にチェック
- [ ] 不変条件 #5 / #6 への対応が定量化（I5-XX / E-02・E-03）
- [ ] 次 Phase へ blocker / minor / pass の集計を引継ぎ

## 次 Phase

- 次: 10（最終レビュー）
- 引き継ぎ事項: 各ゲートの結果集計、blocker / minor / pass の分類、再実行が必要な項目リスト
- ブロック条件: 無料枠超過の見込み、不変条件 #5 違反、または gitleaks finding が残る場合は進まない
