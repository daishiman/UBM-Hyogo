# Phase 12 Implementation Guide

issue-1054-wrangler-binding-drift-ci-gate / implementation / NON_VISUAL

## Part 1: 初学者向け説明

この仕組みは、学校の持ち物リストと実際のかばんの中身を毎回照合する係のようなものです。リストには「ノート」「筆箱」「水筒」と書いてあるのに、かばんに水筒が入っていなければすぐ気付けます。

今回の対象では、かばんの中身が `apps/api/wrangler.toml`、先生の名簿が `apps/api/src/env.ts`、持ち物リストが `deployment-cloudflare.md` の棚卸し表です。3つがずれると、本番やステージングで必要な接続口が見つからないまま進んでしまいます。

そこで `pnpm verify:wrangler-binding-drift` を追加し、R2 や KV の接続口が3つの資料でそろっているかを自動確認します。画面は変わらないため、確認証跡はコマンドの終了コードとテスト結果で残します。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| binding | Cloudflare のサーバーが使う接続口 |
| wrangler.toml | 接続口や環境設定を書いた設定表 |
| Env interface | プログラム側の接続口名簿 |
| R2 bucket | クラウド上の大きなフォルダ |
| KV namespace | クラウド上の小さなメモ帳置き場 |
| CI gate | 変更を通す前の自動確認係 |

## Part 2: 技術者向け詳細

`scripts/verify-wrangler-binding-drift.mjs` は read-only な Node.js CLI である。`parseWranglerBindings`、`parseEnvInterfaceProps`、`parseInventoryRows`、`reconcile` を named export し、Vitest では fixture 文字列で純粋関数を検証する。

入力は `apps/api/wrangler.toml`、`apps/api/src/env.ts`、`.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` の3つで固定する。出力は `ok/drifts/warnings` の構造で、CLI 実行時は drift があれば非ゼロ exit と decisive log を返す。

主な drift code は `ENV_TYPE_MISSING`、`INVENTORY_MISSING`、`INVENTORY_KIND_MISMATCH`、`INVENTORY_ORPHAN` である。未知の棚卸し state は誤 fail を避けるため warning にとどめ、active binding の Env 型欠落、棚卸し欠落、棚卸し Kind 不一致または未分類 Kind を fail させる。

検証コマンド:

```bash
mise exec -- pnpm exec vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts
mise exec -- pnpm verify:wrangler-binding-drift
rg -n "writeFileSync|writeFile|appendFile|fetch\\(|child_process|execSync|spawn" scripts/verify-wrangler-binding-drift.mjs
```

既知制限:

- 棚卸し表の対象は Current Cloudflare binding inventory であり、`applied:true` の D1 / Analytics / R2 / KV / Queue を含む。
- queue binding は現行 wrangler.toml でコメントアウトのため `applied:false` として fail させない。active 化する変更では同じサイクルで inventory 行を追加する。
- GitHub Issue #1054 の mutation、commit、push、PR は user-gated のまま扱う。
