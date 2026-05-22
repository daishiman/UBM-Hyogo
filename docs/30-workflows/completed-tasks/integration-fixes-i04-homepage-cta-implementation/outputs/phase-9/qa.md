# Phase 9: 品質保証

| 項目 | 結果 |
|------|------|
| TODO/FIXME/HACK/XXX grep | PASS（該当ファイルに 0 件） |
| describe.skip / it.skip | PASS（0 件） |
| targeted vitest | PASS（`CallToActionCTA` 9 件 + `FORM_RESPONDER_URL` 1 件） |
| typecheck | PASS（`pnpm -F "@ubm-hyogo/web" typecheck`） |
| targeted ESLint | PASS（変更対象 5 ファイル、`--no-warn-ignored`） |
| full lint | PASS（`pnpm lint`） |
| targeted Playwright smoke | PASS（`public-top-and-list.spec.ts` の `/` case、CTA 表示 + link 属性） |
| VISUAL screenshot | PASS（Phase 11 に 3 PNG 保存） |

## 追加補正

- `CallToActionCTA` に外部リンク icon を追加し、属性だけでなく視覚的にも外部遷移を示す。
- `/register` と `/login` の既存 responder URL 直書きを `FORM_RESPONDER_URL` 参照へ集約。
- Playwright public smoke に `call-to-action-cta` の表示と link 属性確認を追加。
