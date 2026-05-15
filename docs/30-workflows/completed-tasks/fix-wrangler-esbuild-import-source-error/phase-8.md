# Phase 8: リファクタリング

## 8.1 方針

本タスクは hotfix のため、機能的リファクタリングは行わない。
ただし、将来の同種エラー再発防止のため、運用ドキュメント・コメントの **navigation drift** を解消する。

## 8.2 変更テーブル（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| RF-1 | `scripts/cf.sh` 冒頭コメント | "OpenNext build の host/binary mismatch 再発時は root package.json の pnpm.overrides.esbuild を @opennextjs/aws が使用する esbuild version に合わせ、pnpm install 後に build:cloudflare を再検証する" | 同文 + "現在は wrangler 4.85.0 が要求する esbuild 0.27.3 に固定。OpenNext 互換性は build:cloudflare で担保" | 次回 wrangler bump 時の再発時に運用者が辿れる導線を設置 |
| RF-2 | `CLAUDE.md` の Cloudflare 系 CLI セクション | esbuild 関連の運用方針記述なし | （追記しない）今回は変更不要。仕様書側に集約する | CLAUDE.md は薄く保つ |
| RF-3 | `docs/30-workflows/fix-wrangler-esbuild-import-source-error/index.md` | 単体仕様書 | 同上、ただし「再発時の参照導線」セクションを Phase 12 implementation-guide に書く | 仕様書 → 実装ガイド の導線を Phase 12 で確立 |

## 8.3 削除対象（duplicate）

なし。本タスクで新規重複コードは発生していない。

## 8.4 navigation drift 解消

| Drift | 是正方針 |
|-------|---------|
| `cf.sh` の概念的説明と実値の乖離 | RF-1 で吸収 |
| `docs/00-getting-started-manual/` 配下に esbuild override 言及があるか | Phase 5 タスク 6 で確認済み（言及なし）。drift なし |

## 8.5 DoD

- RF-1 のコメント追記がコミットに含まれている（任意・skip 可）。
- `mise exec -- pnpm lint` / `pnpm typecheck` が exit 0 を維持。
- 機能的振る舞いに変化なし（EXT-4〜9 が引き続き exit 0）。
