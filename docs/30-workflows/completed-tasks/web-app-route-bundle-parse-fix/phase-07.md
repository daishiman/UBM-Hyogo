# Phase 7: 整合性検証

## 目的

修正が CLAUDE.md 不変条件 / 既存 SSOT / `wrangler.toml` 構成 / Auth.js 仕様と整合することを確認する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local |

## 整合性チェック項目

| ID | 確認対象 | 期待 |
| --- | --- | --- |
| C-1 | `apps/web` env アクセス不変条件（`getEnv()` / `getPublicEnv()` 経路維持） | 影響なし（ビルダ層変更のためソースに触れない） |
| C-2 | D1 直接アクセスは `apps/api` に閉じる（不変条件 #5） | 影響なし |
| C-3 | service binding `API_SERVICE`（NFR-2） | 影響なし。`wrangler.toml` 無編集 |
| C-4 | 1Password / `scripts/cf.sh` 経路（NFR-3） | 影響なし。secret 投入経路は変えない |
| C-5 | `apps/web/next.config.ts` の `turbopack.root` 設定 | webpack 経路では Next が無視する。残置で害なし |
| C-6 | `apps/web/open-next.config.ts` の `buildCommand` | `pnpm build` 経由のため、`scripts.build` の変更は自動的に拾われる |
| C-7 | `scripts/patch-open-next-worker.mjs`（auth env bridge） | webpack 経路でも post-build patch がそのまま適用可能 |
| C-8 | Auth.js v5 (`next-auth: 5.0.0-beta.30`) の App Route Handler 仕様 | webpack 出力での動作は OpenNext 既存実績あり |
| C-9 | CLAUDE.md ブランチ戦略（dev base, solo 運用） | PR は `--base dev` で作成、main へは別 release cycle |
| C-10 | `prototype 正本順位` (UI prototype alignment workflow) | 本タスクは UI に触れない。tokens.css / primitives 不変 |

## NO-GO 条件

| 条件 | 戻り先 |
| --- | --- |
| `pnpm --filter @ubm-hyogo/web build:cloudflare` が webpack 経路で fail | Phase 3 へ戻り別案（B / C）検討 |
| staging deploy 後 Server Component pages（`/`, `/members` 等）が回帰し 5xx を返す | Phase 3 へ戻る |
| staging で `/api/auth/error` が依然 500 + `Could not parse module` を出す | Phase 1 真因再評価へ戻る |

## 完了条件

- [x] C-1〜C-10 全て期待値どおり
- [x] NO-GO 条件を明示

## 出力

- `phase-07.md`

## 参照資料

- `CLAUDE.md`
- `phase-02.md`
- `apps/web/wrangler.toml`
