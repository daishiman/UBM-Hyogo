# Phase 2 成果物: esbuild バージョン選定設計

## 候補比較サマリ
| 案 | 内容 | 採否 |
|----|------|------|
| A | overrides 削除 | 不採用（host/binary mismatch 再発リスク） |
| B | overrides を `0.27.3` に bump（wrangler exact） | **採用** |
| C | wrangler を 4.84.x へダウングレード | 不採用（security patch 取り込み不能） |
| D | scoped override で wrangler のみ別版 | 不採用（B 失敗時の予備） |

## 採用方針: 案 B
- `pnpm.overrides.esbuild = "0.27.3"` に固定する
- `@opennextjs/cloudflare@1.19.4` は esbuild 直接依存無し。`@opennextjs/aws@3.10.4` は `0.25.4` を要求するため build 実測で互換性を確認する
- `build:cloudflare` が失敗した場合のみ案 D を再検討する

## 変更対象ファイル
| パス | 種別 | 変更内容 |
|------|------|---------|
| `package.json` | 編集 | `pnpm.overrides.esbuild` を `"0.27.3"` に更新 |
| `pnpm-lock.yaml` | 自動再生成 | esbuild 関連 entry を一斉更新 |
| `scripts/cf.sh` | コメント追記 | override 根拠コメント追加 |

## リスク
- esbuild bump で OpenNext build path が別エラーを出す可能性 → Phase 4 で `build:cloudflare` を必須検証コマンドに含める
- `patchedDependencies` に esbuild が含まれていないことを Phase 5 着手前に確認（→ 確認済み、無し）
