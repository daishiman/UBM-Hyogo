# task-09-w3-par-tailwind-v4-setup — タスク仕様書 index

[実装区分: 実装仕様書]
判定根拠: 対象タスクは `apps/web` に Tailwind v4 build pipeline を新設するコード変更タスクであり、CONST_004 の例外条件（純粋ドキュメント・調査・合意形成）には該当しない。CONST_005 の必須項目（変更対象ファイル / シグネチャ / 入出力 / テスト / 実行コマンド / DoD）を Phase 2 / 4 / 5 / 6 / 7 / 11 / 12 に分配して具備する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | TASK-W3-TAILWIND-V4-SETUP-001 |
| タスク名 | apps/web に Tailwind v4 build pipeline + OKLch tokens bridge を確立 |
| ディレクトリ | `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/` |
| 出典タスク | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-09-w3-par-tailwind-v4-setup.md` |
| Wave | 3（W3 / 04-design-system） |
| 実行種別 | serial-internal（task-10 への直列前提） |
| 作成日 | 2026-05-08 |
| 担当 | unassigned |
| 状態 | implemented-local |
| タスク種別 | implementation / VISUAL_ON_EXECUTION（ビルド成功 + `/` 200 確認 + token utility 生成確認） |
| visualEvidence | VISUAL_ON_EXECUTION（Phase 11 で `preview:cloudflare` 起動と Workers 200 確認、生成 CSS の grep 確認を evidence 化） |
| implementation_mode | "new"（tokens.css / globals.css / postcss.config.mjs / tailwind.config.ts を新設、`apps/web/app/styles.css` を削除） |
| PR 方針 | **単一 PR で完結**（task-09 のみ。task-10 は本 PR マージ後の別 PR） |
| 既存タスク組み込み | なし（新規 workflow） |
| GitHub Issue | 未起票（Phase 13 直前にユーザー判断） |

## 目的

UBM 兵庫支部会メンバーサイトの UI を、`docs/00-getting-started-manual/claude-design-prototype/` の OKLch ベース design tokens に整合させた **Tailwind v4 build pipeline** を `apps/web` に確立する。task-08 が確定した OKLch 正本値（`--ubm-*` prefix、60+ tokens、3 テーマ）を `tokens.css` に写し、`globals.css` の `@theme inline` で Tailwind utility に bridge し、`bg-accent` / `text-info` / `border-warn` / `bg-zone-a..e` 等が **無設定で使える** 状態を実現する。Cloudflare Workers (`@opennextjs/cloudflare`) ビルド互換性を DoD で保証する。

## スコープ

### 含む

- `apps/web/package.json` への `tailwindcss@~4.0.0` / `@tailwindcss/postcss@~4.0.0` / `class-variance-authority` / `tailwind-merge` / `clsx` 追加
- `apps/web/postcss.config.mjs` の新設（`@tailwindcss/postcss` 単一 plugin 構成）
- `apps/web/src/styles/tokens.css` の新設（09b 正本の 60+ tokens: surface 4 / text 3 / border 2 / accent 3 / status 8 / zone 5 / radius 5 / shadow 4 / font-family 5 / font-size 8 / spacing 10 / duration 3 / easing 4 を `--ubm-*` prefix で定義、`:root` と `[data-theme="warm"]` / `[data-theme="cool"]` を分離、`@supports not (color: oklch())` fallback 含む）
- `apps/web/src/styles/globals.css` の新設（`@import "tailwindcss"` → `@import "./tokens.css"` → `@theme inline { --color-* / --radius-* / --shadow-* / --font-* を var(--ubm-*) に bridge }` → `@layer base` の構成）
- `apps/web/tailwind.config.ts` の新設（v4 minimal config: `content` glob のみ）
- `apps/web/app/layout.tsx` の `import` 切替（`./styles.css` → `@/styles/globals.css`）
- `apps/web/app/styles.css` の削除（400 行・prototype 写経物）
- `apps/web/tsconfig.json` への `paths: { "@/*": ["./src/*"] }` 追加
- `apps/web/src/__tests__/tokens.test.ts` の新設（token 定義の存在 assert）
- HEX 直書き 0 件 grep 検証スクリプトのローカル実行確認（task-18 で正式 CI gate 化）

### 含まない

- Tailwind v3 互換 plugin（`@tailwindcss/forms` / `typography`）の導入（v4 では `@plugin` directive 経由で必要時にのみ追加）
- ダークモードのデザイン確定（token は dark variant の placeholder のみ）
- prototype の `primitives.jsx` の TS 化（task-10 のスコープ）
- `apps/api` 側への Tailwind 導入
- `task-18-verify-design-tokens` の CI gate 本体実装（本タスクではローカル grep の予兆チェックのみ）
- `apps/web` 既存ページの prototype class（`.btn-primary` / `.chip` 等）への primitive 移行（task-10）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-08-design-tokens-doc | OKLch tokens 正本（`specs/09b-design-tokens.md` / `specs/design-tokens.md`）を確定する |
| 下流 | task-10-ui-primitives | `globals.css` の `@theme` 完成が前提。本タスク完了後にのみ着手可 |
| 下流 | task-11..17（screens 7 タスク） | `bg-accent` / `text-info` / `border-warn` 等の utility を直接書ける前提 |
| 下流 | task-18-verify-design-tokens | HEX 直書き 0 件を CI で gate 化（本タスクはローカル grep のみ） |
| 並列 | なし（task-09 単独で同 PR 内に閉じる） | — |

### 並列不可理由

`apps/web/app/styles.css` 撤去後に primitive 経由スタイルへ移行するには task-10 が必要だが、**task-10 は別 PR**で扱う。本タスクは `globals.css` の `@theme` 完成までを範囲とし、primitive 化（`Button` / `Card` / `Badge` 等）は task-09 マージ後に task-10 へハンドオフする。

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-09-w3-par-tailwind-v4-setup.md` | 元タスク仕様（self-contained context、OKLch palette 値、@theme bridge 例、DoD） |
| 必須 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-08-design-tokens-doc.md` | OKLch tokens 正本仕様（task-08 成果物） |
| 必須 | `docs/00-getting-started-manual/specs/09b-design-tokens.md`（task-08 完了後） | design tokens 正本ドキュメント |
| 必須 | `docs/00-getting-started-manual/claude-design-prototype/styles.css` | OKLch palette 出典（L1-L80） |
| 必須 | `apps/web/wrangler.toml` | Cloudflare Workers ビルド互換性確認の前提（変更しない） |
| 参考 | `apps/web/app/styles.css`（撤去対象） | layout reset 系のみ globals.css へ移植 |
| 参考 | Tailwind CSS v4 公式 docs（`@theme` / `@import "tailwindcss"`） | v4 CSS-first 構成の根拠 |
| 参考 | `@opennextjs/cloudflare` の PostCSS pipeline 仕様 | `build:cloudflare` 互換性確保 |

## 受入条件 (AC)

- **AC-1**: `apps/web/package.json` に `tailwindcss@~4.0.0` / `@tailwindcss/postcss@~4.0.0` / `class-variance-authority` / `tailwind-merge` / `clsx` が追加され、`mise exec -- pnpm install` が exit 0 で完了する
- **AC-2**: `apps/web/postcss.config.mjs` が新設され、`@tailwindcss/postcss` のみで構成されている（autoprefixer 等の冗長 plugin なし）
- **AC-3**: `apps/web/src/styles/tokens.css` に 09b 正本の 60+ tokens（surface 4 / text 3 / border 2 / accent 3 / status 8 / zone 5 / radius 5 / shadow 4 / font-family 5 / font-size 8 / spacing 10 / duration 3 / easing 4）が **すべて定義** されている（grep で全 token 名がヒット）
- **AC-4**: `apps/web/src/styles/globals.css` の `@theme inline` ブロックから OKLch token が参照可能で、`bg-accent` / `text-info` / `border-warn` 等の Tailwind utility が生成される（生成 CSS を grep して `.bg-accent` と `var(--ubm-color-accent)` を含むことを確認）
- **AC-5**: OKLch fallback（`@supports not (color: oklch(...))`）が `tokens.css` に宣言されている
- **AC-6**: `apps/web/app/styles.css` が削除され、`apps/web/app/layout.tsx` が `@/styles/globals.css` を import している
- **AC-7**: `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` が 0 error
- **AC-8**: `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0 で完了し、`.open-next/worker.js` が生成される
- **AC-9**: `mise exec -- pnpm --filter @ubm-hyogo/web preview:cloudflare` で起動した Workers が `/` に対して 200 を返す
- **AC-10**: `apps/web/src/__tests__/tokens.test.ts` の token 参照テストが pass する
- **AC-11**: `apps/web/src/` 配下に HEX 直書き（`#xxxxxx` / `bg-[#...]` / `text-[#...]`）が **0 件**（fallback 専用ブロック `@supports not (color: oklch(0 0 0))` 内の sRGB 近似値は例外として許可）
- **AC-12**: `apps/api/**` には一切影響を与えていない（`git diff main...HEAD --name-only` で `apps/api/` パスが出ない）

## ベストプラクティス選定（採用根拠）

1. **Tailwind v4 CSS-first 構成（`@theme`）を採用**: v4 は JS-config の theme 拡張を CSS-first に置き換えており、`tailwind.config.ts` は `content` glob のみに絞ることで「設定が 2 箇所に分散する」事故を防ぐ。
2. **token bridge は `@theme inline` を使用**: `inline` キーワードにより生成 CSS は `var(--ubm-color-accent)` などの正本 token 参照を保持するため、`[data-theme="warm"]` / `[data-theme="cool"]` 等のランタイム切替に追従できる（theme 切替が CSS 単独で完結）。
3. **`--ubm-*` prefix を導入**: Tailwind 既定変数名（`--color-*`）への直接定義を禁じ、必ず `var(--ubm-*)` 経由で bridge することで「token 値の正本」と「Tailwind への露出」を分離し、`task-08` 仕様変更時の影響範囲を `tokens.css` 1 ファイルに局所化する。
4. **OKLch fallback を `@supports not` で宣言**: 古い Safari 系の透明化を防ぐため、sRGB 近似 HEX を fallback ブロック内のみで許可する（HEX grep gate の例外として明示）。
5. **`apps/web/app/styles.css` を撤去 → `src/styles/` に移行**: tsconfig の `@/*` alias と一致させ、prototype 写経物への global 依存を本タスクで断絶する。primitive 化は task-10 が引き継ぐ。
6. **`build:cloudflare` を DoD 必須化**: Tailwind v4 と `@opennextjs/cloudflare` の PostCSS pipeline 非互換が最大リスクのため、本タスク内で Workers preview まで通すことを完了条件にする。

## Phase 構成と依存

| Phase | 名称 | 並列/直列 | 期待成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義 | 直列 | scope, AC, OKLch tokens inventory |
| 2 | 設計 | 直列 | 変更対象ファイル一覧、@theme bridge map、postcss/tailwind config 設計 |
| 3 | 設計レビュー | 直列 | review-result（v4 互換性 / Workers 互換性 / token prefix 衝突 / fallback 戦略） |
| 4 | テスト作成（RED） | 直列 | `apps/web/src/__tests__/tokens.test.ts`（token 名 assert + fallback assert）/ HEX grep gate（ローカル shell） |
| 5 | 実装（GREEN） | 直列 | 変更対象 8 ファイルの diff（C/M/D 込み） |
| 6 | テスト拡充 | 直列 | bridge 経路の生成 CSS 確認テスト追加（`build` 後の `.open-next/assets/*.css` を grep） |
| 7 | カバレッジ確認 | 直列 | tokens.css の token 数カバレッジ表（required 60+ / actual） |
| 8 | リファクタリング | 直列 | tokens.css のグルーピング再整理 / globals.css のコメント整理 |
| 9 | 品質保証 | 直列 | typecheck / lint / build / preview / test の 5 点セット |
| 10 | 最終レビュー | 直列 | acceptance check（AC-1〜AC-12 を逐次確認） |
| 11 | 手動テスト | 直列 | main.md / preview-200-evidence.md / generated-css-grep.md / hex-grep-zero.md |
| 12 | ドキュメント更新 | 直列 | implementation-guide / system spec 同期 / 6 必須成果物 |
| 13 | PR 作成 | ユーザー承認後 | 単一 PR（base: dev） |

## VISUAL_ON_EXECUTION 宣言

本タスクは UI 実装そのものではないが、**Tailwind utility が OKLch tokens から正しく生成されるか** を Phase 11 で確認する必要があるため `VISUAL_ON_EXECUTION` とする。証跡として以下を採取する:

- `mise exec -- pnpm --filter @ubm-hyogo/web preview:cloudflare` 起動時のログ（exit 0 / Workers listening）
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:8788/` の出力（`200` を期待）
- `.open-next/assets/*.css`（または equivalent）の grep 結果（`.bg-accent` / `var(--ubm-color-accent)` / `oklch(` を含む行）
- `! grep -REn "#[0-9a-fA-F]{3,8}" apps/web/src --include='*.ts' --include='*.tsx'` の HEX 直書きゼロ確認
- 必要に応じてブラウザでの `/` 表示スクリーンショット（dark mode placeholder 動作確認は除外）

## 関連タスク

| Task | 関係 | 状態 |
| --- | --- | --- |
| task-08-design-tokens-doc | 上流（OKLch tokens 正本） | 別 workflow |
| task-10-ui-primitives | 下流（直列） | 別 workflow |
| task-11..17（screens） | 下流（並列着手可、本タスク完了後） | 別 workflow |
| task-18-verify-design-tokens | 下流（CI gate 化） | 別 workflow |

## 未タスク候補（Phase 12 で再判定）

| 候補 | 内容 | 状態 |
| --- | --- | --- |
| TASK-W3-DARK-MODE-VALUE-DETERMINATION | dark mode の OKLch 配色確定（task-08 の延長） | unassigned |
| TASK-W3-VERIFY-DESIGN-TOKENS-CI-GATE | `task-18` 本体（HEX grep gate を CI 化） | task-18 で扱う |

## Phase ファイル一覧

- [phase-1.md](phase-1.md) — 要件定義
- [phase-2.md](phase-2.md) — 設計
- [phase-3.md](phase-3.md) — 設計レビュー
- [phase-4.md](phase-4.md) — テスト作成（RED）
- [phase-5.md](phase-5.md) — 実装（GREEN）
- [phase-6.md](phase-6.md) — テスト拡充
- [phase-7.md](phase-7.md) — カバレッジ確認
- [phase-8.md](phase-8.md) — リファクタリング
- [phase-9.md](phase-9.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動テスト
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成
