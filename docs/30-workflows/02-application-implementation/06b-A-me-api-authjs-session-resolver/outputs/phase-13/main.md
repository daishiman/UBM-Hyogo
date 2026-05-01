# Output Phase 13: PR 作成

## status

NOT_EXECUTED_SPEC_ONLY

## expected evidence when executed

- production/staging の `/me` が Auth.js cookie/JWT で 200 を返す
- 未ログインまたは不正 JWT は 401 を返す
- 削除済み member は 410、rules 未同意は authGateState で表現される
- apps/web は D1 直参照せず cookie forwarding のまま成立する
- dev-only `x-ubm-dev-session` 経路は production で無効のまま維持される

## notes

このファイルはタスク仕様書作成時点の出力枠であり、実装・deploy・外部 smoke の実行結果ではない。
