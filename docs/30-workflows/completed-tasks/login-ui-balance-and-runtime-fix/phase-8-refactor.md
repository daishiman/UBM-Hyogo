# Phase 8 — リファクタリング

## 方針

本タスクはバグ修正主体。過剰な抽象化は避け、重複と navigation drift のみ削る。

## 変更テーブル

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| `apps/web/app/api/auth/magic-link/route.ts` の `FALLBACK_INTERNAL_API` | inline `"http://127.0.0.1:8787"` | top-level `const FALLBACK_INTERNAL_API` | verify route との同値性を明示し、grep 容易化 |
| `apps/web/app/api/auth/magic-link/verify/route.ts` | 同上 | 同上 | 同上 |
| `apps/web/src/styles/legacy-public.css` の `[data-size]` セレクタ | wildcard | `:not([data-component="google-brand-icon"]):not(.ui-input):not(.ui-button)` 列挙 | 副作用範囲を明示し、新規 `<img data-size>` 追加時の連鎖破綻を防ぐ |

## 共通化の見送り判定

- `resolveApiBase()` を `apps/web/src/lib/internal-api.ts` 等に抽出する案 → **見送り**。利用箇所が 2 ファイルのみ、抽出すると import path が深くなり可読性が下がる。3 箇所目が出た時点で抽出する（Phase 12 unassigned 候補にも挙げない）。
- `scripts/verify-no-process-env-internal-api.sh` を `scripts/verify-no-process-env.sh` の汎用化 → **見送り**。将来 env 変数が増えた段階で検討。
- `auth.css` の `:focus-visible` ルールを `Input` primitive に昇格 → **見送り**。`auth-card` scope に閉じる方が破壊リスクが低い。

## navigation drift チェック

| 確認 | 結果 |
| ---- | ---- |
| `apps/web/src/lib/env.ts` への import path（`../../../../src/lib/env`）が深い | OK（既存 route file の慣例どおり） |
| `legacy-public.css` の negative selector で `auth-card` 系統が誤って巻き込まれない | OK（`.ui-input` `.ui-button` を除外列挙） |

## 削除対象

なし。
