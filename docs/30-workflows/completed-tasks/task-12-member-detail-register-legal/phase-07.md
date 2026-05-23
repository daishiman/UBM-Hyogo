# Phase 7: AC マトリクス

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 7 |
| task | task-12-member-detail-register-legal |
| state | spec-fixed / implementation pending / runtime evidence pending_user_approval |

## 目的

`index.md` の Acceptance Criteria（一次原典 §7 DoD と完全整合）を AC マトリクスとして表形式で固定し、各項目を spec / test / runtime evidence にマップする。後続 Phase 9 / Phase 11 がこの表を「不足のないチェックリスト」として消費する。

## 実行タスク

- [ ] 各 AC の `検証方法` / `検証 phase` / `evidence path` が空欄でないことを確認する
- [ ] 各 FR が design / test / 実装ファイルにトレース可能であることを確認する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`（§7 DoD / §8 不変条件チェックリスト）
- 本 workflow `phase-05.md` / `phase-06.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-07/main.md`

## 統合テスト連携

`apps/web/playwright/tests/public-detail-register-legal.spec.ts` および `apps/web/src/components/{public,legal}/*.test.tsx` を AC の根拠として参照する。

## AC マトリクス（index.md 13 項目を正本として参照）

| AC ID | 要件 | 検証方法 | 検証 phase | evidence path |
| --- | --- | --- | --- | --- |
| AC-01 | `/members/[id]` が 200 を返し、ProfileHero / Sections / Tags / Links が visible（存在時） | Playwright `playwright/tests/public-detail-register-legal.spec.ts` の `/members/[id]` test | Phase 9 / 11 | `outputs/phase-11/evidence/playwright-report/` |
| AC-02 | `/members/<不在 id>` が `notFound()` 経由で 404 page を返す | Playwright `__definitely_not_exist__` test で status=404 assert | Phase 9 / 11 | 同上 |
| AC-03 | `/register` が 200 を返し、CTA `<a target="_blank" rel="noopener noreferrer">` が `responderUrl` を指している | Playwright `/register` test で `data-role="register-cta"` の `target` / `rel` 属性 assert | Phase 9 / 11 | 同上 |
| AC-04 | `/register` が外部 CTA・同意説明を表示し、`form-preview` 取得失敗時も CTA は `FALLBACK_RESPONDER_URL` で機能する。iframe 埋め込みは禁止 | vitest（page integration）+ Playwright + grep gate | Phase 9 / 11 | `outputs/phase-11/evidence/test.log` + `outputs/phase-11/evidence/grep-gate.log` |
| AC-05 | `/privacy` / `/terms` が 200 を返し、`prose` typography が反映済み | Playwright で `[data-component="legal-prose"]` visible + axe critical=0 | Phase 9 / 11 | `outputs/phase-11/evidence/playwright-report/` |
| AC-06 | axe-core critical violation = 0（4 ページ + 404 ページ） | Playwright `AxeBuilder().analyze()` 結果が `violations.filter(critical) === []` | Phase 9 / 11 | 同上 + `outputs/phase-11/evidence/axe.json` |
| AC-07 | `pnpm typecheck` / `pnpm lint` / vitest / Playwright smoke が全 pass | local PASS 5 点（Phase 9） | Phase 9 / 11 | `outputs/phase-11/evidence/{typecheck,lint,test,e2e}.log` |
| AC-08 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件（task-18 verify-design-tokens.ts と整合） | grep gate `! rg -n '#[0-9a-fA-F]{3,8}\|bg-\[#\|text-\[#' apps/web/src/components/public apps/web/src/components/legal apps/web/app/{(public)/members/[id],(public)/register,privacy,terms}/page.tsx` | Phase 9 | `outputs/phase-11/evidence/grep-gate.log` |
| AC-09 | `apps/web` 内に `D1Database` の参照 0 件（不変条件 #5） | grep gate `! rg -n 'D1Database' apps/web/src apps/web/app` | Phase 9 | 同上 |
| AC-10 | 詳細ページの全 KV row に `data-stable-key` 属性が付く（不変条件 #1 監査） | vitest で `container.querySelectorAll('[data-stable-key]').length === expected` を assert | Phase 9 | `outputs/phase-11/evidence/test.log` |
| AC-11 | 新 endpoint 追加なし（既存 `/public/members/:memberId`, `/public/form-preview` のみ）。`apps/web` 内の `D1Database` 参照 0 件 | git diff + grep gate | Phase 9 / PR review | `outputs/phase-11/evidence/d1-isolation.log` |
| AC-12 | revalidate 値が member-profile=60s, form-preview=600s。consent キーは `publicConsent` / `rulesConsent` のみ | コードレビュー / grep | Phase 9 | `outputs/phase-11/evidence/grep-gate.log` |
| AC-13 | 後続アンカー（`data-page`, `data-component`, `data-section`, `data-stable-key`, `data-role`）が出力されている | vitest + Playwright selector audit | Phase 9 / 11 | `outputs/phase-11/evidence/stable-key-audit.log` + `outputs/phase-11/evidence/e2e.log` |

## トレーサビリティ（FR ↔ design ↔ test ↔ 実装ファイル）

| 要件 ID | 設計 | テスト | 実装ファイル |
| --- | --- | --- | --- |
| FR-01 ProfileHero | Phase 5 §Step 1-1 / 一次原典 §3.1.2 | `MemberDetailSections.test.tsx` 隣接の ProfileHero 統合（任意）+ Playwright | `apps/web/src/components/public/ProfileHero.tsx` |
| FR-02 MemberDetailSections（stableKey 焼き込み） | Phase 5 §Step 1-2 / 一次原典 §3.1.3 / §0.5 不変条件 #1 | `MemberDetailSections.test.tsx` TC-U-01〜04 | `apps/web/src/components/public/MemberDetailSections.tsx` |
| FR-03 MemberTags（0 件 null） | Phase 5 §Step 1-3 / 一次原典 §3.1.4 | `MemberTags.test.tsx` TC-U-08 | `apps/web/src/components/public/MemberTags.tsx` |
| FR-04 MemberLinks（url kind 集約 / 0 件 null / target=_blank） | Phase 5 §Step 1-4 / 一次原典 §3.1.4 | `MemberLinks.test.tsx` TC-U-05〜07 | `apps/web/src/components/public/MemberLinks.tsx` |
| FR-05 MemberActivity（activity section のみ） | Phase 5 §Step 1-5 / 一次原典 §3.1.4 | vitest（任意） | `apps/web/src/components/public/MemberActivity.tsx` |
| FR-06 RegisterCallout（responderUrl + consent 説明） | Phase 5 §Step 2-1 / 一次原典 §3.2.2 / 不変条件 #2 #7 | `RegisterCallout.test.tsx` TC-U-09〜10 | `apps/web/src/components/public/RegisterCallout.tsx` |
| FR-07 FormPreviewSections（空 sections 安全） | Phase 5 §Step 2-2 / 一次原典 §3.2.1 | `FormPreviewSections.test.tsx` TC-U-13 | `apps/web/src/components/public/FormPreviewSections.tsx` |
| FR-08 LegalProse primitive | Phase 5 §Step 3 / 一次原典 §3.3.1 | `LegalProse.test.tsx` TC-U-11〜12 | `apps/web/src/components/legal/LegalProse.tsx` |
| FR-09 4 page.tsx 改修 | Phase 5 §Step 4 / 一次原典 §3.1.1 / §3.2.1 / §3.3.2 / §3.3.3 | Playwright spec | `apps/web/app/(public)/members/[id]/page.tsx` 他 3 |
| FR-10 e2e smoke（4 page + 404） | Phase 5 §Step 6 / 一次原典 §5.2 | `apps/web/playwright/tests/public-detail-register-legal.spec.ts` | 同 spec |
| FR-11 fallback responderUrl | Phase 5 §Step 4-2 / 一次原典 §4.2 | vitest + 手動 fixture | `apps/web/app/(public)/register/page.tsx` |

## 不変条件への合致確認

| 不変条件 | 検証 AC | grep / test |
| --- | --- | --- |
| #1 stableKey 経由参照 | AC-10 | vitest assert + task-18 grep |
| #2 consent キー統一 | AC-12 | grep gate |
| #5 D1 直接禁止 | AC-09 | grep gate |
| #7 Google Form 再回答経路 | AC-13 / AC-03 | grep gate + Playwright |
| OKLch tokens 必須 | AC-08 | grep gate（task-18 verify-design-tokens.ts と整合） |

## 完了条件

- [ ] AC-01〜15 全てが `検証方法` / `検証 phase` / `evidence path` を持つ
- [ ] FR-01〜11 全てが design / test / 実装ファイルにトレース可能
- [ ] 不変条件 #1 / #2 / #5 / #7 / OKLch 全てが対応 AC を持つ
