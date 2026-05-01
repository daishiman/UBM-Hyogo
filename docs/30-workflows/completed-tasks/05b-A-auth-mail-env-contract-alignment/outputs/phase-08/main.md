# Output Phase 8: DRY 化

## status

NOT_EXECUTED_SPEC_ONLY

## expected evidence when executed

- env 名の正本が1つに統一される
- Cloudflare/1Password/runbook の配置先が一致する
- production で未設定時 fail-closed の仕様が明記される
- staging smoke で Magic Link メール送信設定を確認できる
- secret 実値が repo/evidence に残らない

## notes

このファイルはタスク仕様書作成時点の出力枠であり、実装・deploy・外部 smoke の実行結果ではない。
