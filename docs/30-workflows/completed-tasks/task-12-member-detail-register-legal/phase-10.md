# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 10 |
| task | task-12-member-detail-register-legal |
| state | implemented-local / implementation / runtime evidence pending_user_approval |
| 区分 | 実装仕様書 |
| 対象画面 | `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 一次原典 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md` |

## 目的

task-12（公開会員詳細・入会登録・法務 2 画面の 4 画面再構成）について、Phase 4-9 で確定した実装契約が一次原典の §1〜§8 と完全整合しているかを最終レビューする。`index.md` の AC 13 項目を walkthrough し、不変条件 / OKLch token 規律 / data-stable-key 焼き込み / diff scope 規律（SCOPE.md §6）を機械的に確認する。

## 実行タスク

- [ ] 一次原典 §3「コンポーネント分解とシグネチャ」と実装差分（apps/web 配下）を 1 ファイル単位で diff レビュー
- [ ] `index.md` AC 13 項目を本 Phase の AC walkthrough チェックリストへ転記し、各項目に evidence path を紐付け
- [ ] §0.5 不変条件 7 件 / §8 不変条件チェックリストを本 Phase の不変条件 walkthrough で再確認
- [ ] `git diff --name-only dev...HEAD` の出力が §2「変更対象ファイル表」 + 本 task package 配下に限定されるか確認
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`（§6 diff scope 規律）
- `docs/00-getting-started-manual/specs/design-tokens.md`（task-08 正本）
- `apps/web/src/styles/tokens.css`（task-09 OKLch tokens 正本）
- `apps/web/src/components/ui/`（task-10 ui-primitives）
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-10/ac-walkthrough.md`（AC 13 項目チェック表）
- `outputs/phase-10/diff-scope-audit.log`（`git diff --name-only dev...HEAD` の生出力）

## 統合テスト連携

- `apps/web/playwright/tests/public-detail-register-legal.spec.ts`（一次原典 §5.2）の 4 画面 + 404 page smoke は Phase 11 で実測する。本 Phase はテスト spec が存在し、CI からの参照点が壊れていないことのみを構文的に確認する。
- task-18（regression / verify-design-tokens）の走査対象に `apps/web/src/components/{public,legal}/**` が含まれることを確認する（HEX 直書き走査の下流接続点）。

## AC 13 項目 walkthrough（index.md AC 正本と完全一致）

| # | AC | 検証方法 | evidence |
| --- | --- | --- | --- |
| 1 | `/members/[id]` が 200 を返し、ProfileHero / Sections / Tags / Links が visible | Playwright smoke + 目視 | `outputs/phase-11/screenshots/member-detail.png`, `outputs/phase-11/evidence/e2e.log` |
| 2 | `/members/<不在 id>` が `notFound()` 経由で 404 page を返す | Playwright smoke | `outputs/phase-11/screenshots/not-found.png` |
| 3 | `/register` が 200 を返し、CTA `<a target="_blank" rel="noopener noreferrer">` が responderUrl を指す | Playwright smoke + DOM 属性検査 | `outputs/phase-11/evidence/e2e.log` |
| 4 | form-preview 取得失敗時も CTA は `FALLBACK_RESPONDER_URL` で機能する | unit test（`fetchPublic` mock）+ 手動 throttle smoke | `outputs/phase-11/evidence/test.log` |
| 5 | `/privacy` / `/terms` が 200 を返し、`prose` typography が反映済み | Playwright smoke + visual diff | `outputs/phase-11/screenshots/{privacy,terms}.png` |
| 6 | axe-core critical violation = 0（4 ページ + 404 ページ） | Playwright + @axe-core/playwright | `outputs/phase-11/evidence/axe-report.json` |
| 7 | typecheck / lint / vitest / Playwright smoke が全 pass | 各 evidence log | `outputs/phase-11/evidence/{typecheck,lint,test,e2e}.log` |
| 8 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件 | grep gate | `outputs/phase-11/evidence/grep-gate.log` |
| 9 | `apps/web` 内に `D1Database` 参照 0 件（不変条件 #5） | grep | `outputs/phase-11/evidence/d1-isolation.log` |
| 10 | 詳細ページの全 KV row に `data-stable-key` 属性が付く（不変条件 #1） | DOM 監査 + unit test | `outputs/phase-11/evidence/stable-key-audit.log` |
| 11 | 新 endpoint 追加なし（既存 `/public/members/:memberId`, `/public/form-preview` のみ） | `apps/api/src/routes/public/` の diff 確認 | `outputs/phase-10/diff-scope-audit.log` |
| 12 | revalidate 値と consent キーが不変条件に合う | grep gate + code review | `outputs/phase-11/evidence/grep-gate.log` |
| 13 | 後続アンカーが出力されている | selector audit + Playwright | `outputs/phase-11/evidence/stable-key-audit.log`, `outputs/phase-11/evidence/e2e.log` |

## レビュー観点チェックリスト

### コード品質

- [ ] `app/(public)/members/[id]/page.tsx` で `fetchPublicOrNotFound` の `FetchPublicNotFoundError` だけを `notFound()` に変換、それ以外は再 throw（`error.tsx` boundary に届く設計）
- [ ] `app/(public)/register/page.tsx` で `fetchPublic` 失敗時に `previewError` 文言を立て、CTA は `FALLBACK_RESPONDER_URL` を保持
- [ ] `<a target="_blank">` には `rel="noopener noreferrer"` 必須（RegisterCallout / MemberLinks / 法務 2 画面）
- [ ] `MemberDetailSections` の全 KV row に `data-stable-key={field.stableKey}` を焼く（不変条件 #1）
- [ ] `MemberTags` / `MemberLinks` / `MemberActivity` は 0 件で `null` 返却（empty section を作らない）
- [ ] `LegalProse` は `<article className="prose" data-component="legal-prose">` の薄い wrapper のみ
- [ ] `revalidate`: member-profile=60s / form-preview=600s（不変条件 #10）

### 不変条件（一次原典 §0.5 / §8）

- [ ] `apps/web` から `D1Database` の import / 参照なし（不変条件 #3 / #5）
- [ ] consent キーは `publicConsent` / `rulesConsent` のみ使用（RegisterCallout 文言、不変条件 #2）
- [ ] Google Form は外部 link 遷移、iframe 埋め込みなし、サーバ redirect 不採用（不変条件 #5 / #7）
- [ ] GAS prototype の参照のみ、本番仕様への昇格なし（不変条件 #4）
- [ ] OKLch tokens 経由のみ、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件（不変条件 #7）
- [ ] `stableKey` 経由でのみ field を参照（不変条件 #1）

### 上流契約整合

- [ ] task-08 design-tokens-doc / task-09 tailwind-v4-setup / task-10 ui-primitives がすべて main 取り込み済み
- [ ] `@/components/ui` から `Button` / `Card` / `Badge` / `Avatar` / `EmptyState` の import path が正しい
- [ ] `@ubm-hyogo/shared` から `PublicMemberProfileZ` / `FormPreviewViewZ` を import し、`fetchPublic` 内で strict parse
- [ ] `apps/web/src/lib/fetch/public.ts` の `fetchPublic` / `fetchPublicOrNotFound` 経由のみ（直 `fetch()` 禁止）

### 下流接続点（task-18 / task-11）

- [ ] task-18 の走査対象 `apps/web/src/components/{public,legal}/**` に本 task の新規ファイルが含まれる
- [ ] task-11 詳細ページから `/members` 一覧へ戻る `<a data-role="back">` の data 属性が一致
- [ ] アンカー: `data-page="member-detail" / register / privacy / terms`、`data-component="profile-hero" / register-callout / legal-prose`、`data-section={section.key}`、`data-stable-key={field.stableKey}`、`data-role="back" / preview-error` がすべて DOM に焼かれている

### Diff scope 規律（SCOPE.md §6）

- [ ] `git diff --name-only dev...HEAD` が以下に限定:
  - `apps/web/app/(public)/members/[id]/page.tsx`
  - `apps/web/app/(public)/register/page.tsx`
  - `apps/web/app/privacy/page.tsx`
  - `apps/web/app/terms/page.tsx`
  - `apps/web/src/components/public/ProfileHero.tsx`
  - `apps/web/src/components/public/MemberDetailSections.tsx`
  - `apps/web/src/components/public/MemberTags.tsx`
  - `apps/web/src/components/public/MemberLinks.tsx`
  - `apps/web/src/components/public/MemberActivity.tsx`
  - `apps/web/src/components/public/RegisterCallout.tsx`
  - `apps/web/src/components/public/FormPreviewSections.tsx`
  - `apps/web/src/components/legal/LegalProse.tsx`
  - `apps/web/src/components/public/*.test.tsx`（unit）
  - `apps/web/src/components/legal/LegalProse.test.tsx`
  - `apps/web/playwright/tests/public-detail-register-legal.spec.ts`
  - `docs/30-workflows/task-12-member-detail-register-legal/**`
- [ ] `apps/api/**` / `packages/shared/**` / token 定義 / `app/(public)/members/page.tsx`（一覧、task-11） への変更がない

### Phase 11 evidence 準備

- [ ] `outputs/phase-11/evidence/` directory が作成可能
- [ ] `outputs/phase-11/screenshots/` に 5 ファイル分の保存先が用意されている
- [ ] axe-core / Playwright の dev dependency が `apps/web/package.json` に存在

## 完了条件

- [ ] AC walkthrough 13 項目すべて検証方針と evidence path が確定
- [ ] レビュー観点チェックリスト全項目が [x]
- [ ] `git diff --name-only dev...HEAD` 出力が §2 変更対象ファイル表 + 本 task package 配下のみ
- [ ] 残課題（task-15 デザイン適用 / task-18 token 走査）が `outputs/phase-10/main.md` に明記
- [ ] runtime evidence が必要な項目は Phase 11 に user-gated として明示
