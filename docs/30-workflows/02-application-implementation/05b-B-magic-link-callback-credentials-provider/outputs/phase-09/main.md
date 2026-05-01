# Output Phase 9: 品質保証

## status

NOT_EXECUTED_SPEC_ONLY

## expected evidence when executed

- `/api/auth/callback/email?token=&email=` が 404 にならない
- 正しい token/email で session cookie が確立される
- 不正 token/email は login error に戻される
- apps/web から D1 直参照せず API/proxy 境界を守る
- 関連 route/auth tests が追加される

## notes

このファイルはタスク仕様書作成時点の出力枠であり、実装・deploy・外部 smoke の実行結果ではない。
