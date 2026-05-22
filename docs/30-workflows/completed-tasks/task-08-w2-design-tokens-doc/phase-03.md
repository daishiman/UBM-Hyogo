# Phase 3: 設計レビュー

実装区分: ドキュメントのみ仕様書

## レビュー観点

Phase 2 で確定した設計に対し、下記 6 観点で齟齬がないことを確認する。

### 1. 命名衝突

- `--ubm-*` prefix が他ライブラリ（Tailwind / Radix 等）と衝突しないこと
- prototype の素朴名（`--bg` / `--text` / `--accent`）と本ファイル正本での新名（`--ubm-color-surface-bg` / `--ubm-color-text-primary` / `--ubm-color-accent`）の写像が 1:1 で曖昧でないこと

### 2. 下流契約整合

| 下流 | 期待する export | 本仕様での対応 |
| --- | --- | --- |
| task-09 `tokens.css` | `--ubm-*` 全 65 token を `:root` / `[data-theme="warm"]` / `[data-theme="cool"]` で宣言 | §3.4 / §10 で template 提示 |
| task-09 `globals.css` | `@theme inline` で Tailwind utility に bridge | §10 で template 提示 |
| task-10 ui-primitives | `class-variance-authority` で `--ubm-color-*` を variant prop に | 命名規則表（§2）で全変数列挙 |
| task-18 `verify-design-tokens.ts` | HEX 直書き 0 件 / `bg-[#...]` 0 件 / 65 token 名一致 | §6.3 input 契約として明記 |

### 3. 不変条件遵守

| 不変条件 | 確認 |
| --- | --- |
| `styles.css` 値の不変 | 値改変なし |
| `--ubm-*` prefix 統一 | OK |
| accent / status は面積要素用、テキストは `-ink` | §3.2 に規範記述 |
| zone は MVP では status alias | §3.3 alias 表で正本化 |
| dark mode placeholder のみ | §11 / 値未定 |
| OKLch fallback | §3.5 / `@supports not` |
| JSON は valid | §9 / Phase 9 jq parse gate |

### 4. 文量と粒度

- 380 行以上 540 行以下を目標
- §3.4 の値表が 3 テーマ x 約 20 行で密度を担保
- §9 inline JSON が 70〜90 行を占める

### 5. リスク再点検

元仕様 §9 のリスク表を本タスクのリスク登録簿としてそのまま採用:

| リスク | 緩和策 |
| --- | --- |
| OKLch 非対応ブラウザでの色化け | §3.5 fallback / task-09 で実装 |
| token 名 prefix 衝突 | `--ubm-*` 専用 prefix |
| 3 テーマで上書き漏れ | §3.4 末尾注記「stone と共通」 |
| dark mode 値未定で実装が止まる | §11 placeholder / `09-ui-ux.md` §6 整合 |
| JSON / CSS 二重メンテ drift | §9 を正本、§10 / §3.4 は派生位置付け（MVP 手動 OK） |
| zone 色独自化要求 | §3.3 alias 構造、`--ubm-color-zone-*` 書き換えで対応 |

### 6. 親 workflow との整合

| 整合先 | 確認 |
| --- | --- |
| `SCOPE.md` 不変条件 #2 OKLch トークン正本化 | 本ファイルが正本 |
| `phase-3.md` §3.3 OKLch 適用ルール | 値表で吸収 |
| `EXECUTION-ORDER.md` W2 並列対象 | task-06 / task-07 と並列実行可能（編集ファイル無被り） |

## レビュー結論

Phase 2 設計は下流 4 タスク（task-09 / task-10 / task-18 + 親 workflow）の契約を全て満たし、設計上のブロッカーは無い。Phase 4 へ進む。

## 完了条件

- [ ] 6 観点全てで blocker 0 件
- [ ] 下流契約整合表で全 4 下流タスクが ✓
- [ ] リスク登録簿が phase-09 検証ゲートと対応している
