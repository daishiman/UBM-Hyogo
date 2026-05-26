# 2026-05-26 register-page-prototype-alignment

`register-page-prototype-alignment` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期。

- `/register` を prototype `MemberFormPage` に合わせ、Hero CTA / 3-step flow / collapsible FormPreview / 3 FAQ / bottom CTA へ再構成。
- `RegisterCallout` を `RegisterHeroCallout` へ rename しつつ、`data-component="register-callout"` / `data-role="register-cta"` は後方互換で維持。
- 既存 `/public/form-preview` と `FORM_RESPONDER_URL` のみ利用し、D1/API/schema/auth は不変更。
- Phase 12 strict 7、root/output artifacts parity、quick-reference / resource-map / task-workflow-active / artifact inventory を同一 wave で反映。

苦戦箇所は `lessons-learned/lessons-learned-register-page-prototype-alignment-2026-05.md` に L-REGPROTO-001..005 として汎化反映（primitive rename hook 保持 / `<details open>` 初期開閉 / Playwright evidence path / 既存 primitive 構成 / pure function 集計）。

Commit、push、PR、外部 staging observation は user-gated。
