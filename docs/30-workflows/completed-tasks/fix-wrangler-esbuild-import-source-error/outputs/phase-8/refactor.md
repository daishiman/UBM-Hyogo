# Phase 8 成果物: リファクタリング

## 方針
本タスクは hotfix のため機能的リファクタリングは行わない。再発防止のため運用コメントの drift のみ解消する。

## 変更テーブル
| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| RF-1 | `scripts/cf.sh` 冒頭コメント | 既存運用方針のみ | "現在の override は wrangler 4.85.0 が要求する esbuild 0.27.3 に固定。OpenNext 互換性は build:cloudflare の実走で担保" を 2 行追記 | 次回 wrangler bump 時の再発時に運用者が辿れる導線を設置 |
| RF-2 | `CLAUDE.md` | 変更なし | 同左 | CLAUDE.md は薄く保つ。仕様書側に集約 |

## 削除対象（duplicate）
なし。

## navigation drift 解消
| Drift | 是正 |
|-------|------|
| `cf.sh` の概念的説明と実値の乖離 | RF-1 で吸収 |
| `docs/00-getting-started-manual/` 配下の esbuild 言及 | 該当無し（drift なし） |

## DoD
- RF-1 のコメント追記がコミット対象に含まれている: ✅
- `pnpm lint` / `pnpm typecheck` が exit 0 を維持: ✅
- 機能的振る舞いに変化なし: ✅
