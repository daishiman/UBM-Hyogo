# NON_VISUAL Evidence Index

UI を持たない resolver / builder 改修であるためスクリーンショットは取得しない。代替 evidence は以下:

- `builder-unit-test-result.txt`: 498/498 passed (metadata.test.ts 9 件 + builder.test.ts 5 件を含む)
- `drift-detection-log.md`: schema drift（unknown stable_key）を Result.err として伝搬する観測ログ
- `three-view-parity-check.md`: public / member / admin の 3 view が同一 resolver 出力から導出されることの確認
- `manual-test-result.md`: 手動 smoke 結果（typecheck / lint / unit test）

実装根拠:
- `apps/api/src/repository/_shared/metadata.ts`
- `apps/api/src/repository/_shared/builder.ts`
- `apps/api/src/repository/_shared/generated/static-manifest.json`
