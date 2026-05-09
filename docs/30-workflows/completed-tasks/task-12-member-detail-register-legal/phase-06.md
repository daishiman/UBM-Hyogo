# Phase 6: 異常系検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 6 |
| task | task-12-member-detail-register-legal |
| state | spec-fixed / implementation pending / runtime evidence pending_user_approval |

## 目的

task-12 の 4 画面（`/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）について、API 失敗・空データ・null 値・URL kind 0 件・activity section 欠落・Google Form preview 欠落の異常系シナリオに対する期待挙動と検証方法を固定する。

## 実行タスク

- [ ] 本 Phase の異常系シナリオ表に基づき自動テスト（vitest / Playwright）と手動チェック項目を実装サイクルへ反映する
- [ ] runtime evidence（404 page render / preview-error fallback）は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`（一次原典 §4 状態マトリクス / §5 テスト方針）
- `apps/web/src/lib/fetch/public.ts`（`FetchPublicNotFoundError` の throw 経路）
- `apps/web/app/error.tsx`（task-05 で確立された route segment error boundary）
- `apps/web/app/not-found.tsx`（task-05 で確立された 404 ページ）
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-06/main.md`

## 統合テスト連携

`apps/web/playwright/tests/public-detail-register-legal.spec.ts` および `apps/web/src/components/public/*.test.tsx` で AB-01..09 のうち自動可能なものを reify する。

## 異常系シナリオ

| ID | 画面 | シナリオ | 期待挙動 | 検証方法 | 自動/手動 |
| --- | --- | --- | --- | --- | --- |
| AB-01 | `/members/[id]` | API が 404 を返す | `fetchPublicOrNotFound` が `FetchPublicNotFoundError` を throw → `notFound()` 経由で `apps/web/app/not-found.tsx` を 404 で render | Playwright `/members/__definitely_not_exist__` で status=404 を assert | 自動 |
| AB-02 | `/members/[id]` | API が 500 を返す | `fetchPublicOrNotFound` が generic Error を throw → route segment `error.tsx`（task-05）で boundary 表示 | Playwright fixture（任意）または手動 | 手動 |
| AB-03 | `/members/[id]` | `publicSections=[]` の正常 200 | ProfileHero / Tags / Links / Activity が条件付き render、KV section は出ない、crash しない | vitest TC-U-04 で fixture `sections=[]` を渡し render が空文字列にならないことを assert | 自動 |
| AB-04 | `/members/[id]` | 全 section の `fields=[]` | `MemberDetailSections` は section ごとに `<h2>` も出さず `null` 返却（visibleFields=0 のとき section 自体を skip） | vitest TC-U-04 拡張 | 自動 |
| AB-05 | `/members/[id]` | `field.value === null` | `KVList` の `<dd>` が "—" になる | vitest TC-U-03 | 自動 |
| AB-06 | `/members/[id]` | `field.value` が空配列 | "—" になる（`.length === 0` で fallback） | vitest TC-U-03 | 自動 |
| AB-07 | `/members/[id]` | `tags=[]` | `MemberTags` が `null` 返却（empty section を作らない） | vitest TC-U-08 | 自動 |
| AB-08 | `/members/[id]` | url kind の field が全 section で 0 件 | `MemberLinks` が `null` 返却 | vitest TC-U-06 | 自動 |
| AB-09 | `/members/[id]` | `section.key === "activity"` が存在しない | `MemberActivity` が `null` 返却 | vitest TC-U（MemberActivity）追加 | 自動 |
| AB-10 | `/register` | `fetchPublic("/public/form-preview")` が throw | `previewError` 文言が `<p role="alert" data-role="preview-error">` で表示、CTA は `FALLBACK_RESPONDER_URL` で機能維持 | vitest（page を server component として render するか、fetch を mock した integration test）+ Playwright fixture | 自動 + 手動 |
| AB-11 | `/register` | `preview.responderUrl === null` | CTA は `FALLBACK_RESPONDER_URL` を href にする | vitest（RegisterCallout の page 結合） | 自動 |
| AB-12 | `/register` | `preview.sections.length === 0` | `FormPreviewSections` は header だけ出して section list を出さず crash しない | vitest TC-U-13 | 自動 |
| AB-13 | `/privacy`, `/terms` | API 接続なし（静的） | 完全静的 prerender、build 成功時のみ runtime も 200 | `pnpm --filter @ubm-hyogo/web build` exit 0 + Playwright で 200 確認 | 自動 |
| AB-14 | 全画面 | `<a target="_blank">` の `rel` 不足 | a11y / セキュリティ違反として fail | vitest TC-U-10 / Playwright で `toHaveAttribute("rel", /noopener/)` + `/noreferrer/` を assert | 自動 |
| AB-15 | `/members/[id]` | `data-stable-key` の焼き込み漏れ | task-18 grep gate で fail | vitest で `container.querySelectorAll('[data-stable-key]').length === visibleFields.length + linkFields.length` を assert | 自動 |

## fallback パスの実装責務

| 観点 | 実装責務 | 確認方法 |
| --- | --- | --- |
| `FALLBACK_RESPONDER_URL` の埋め込み先 | `apps/web/app/(public)/register/page.tsx` 上部 const | grep で値が CLAUDE.md 記載と一致 |
| previewError 文言 | 「フォーム情報を取得できませんでした。登録は下のリンクから進めてください。」固定 | i18n 対象外（日本語固定） |
| null/empty 値 | "—"（em-dash）固定 | vitest assert |
| 配列 join | `value.join(", ")`（カンマ + 半角スペース） | vitest assert |

## a11y 個別検証

| 観点 | 期待 | 検証方法 |
| --- | --- | --- |
| 見出し階層 | `<h1>` 1 個 / `<h2>` 段階で skip しない | axe-core + 手動 |
| Avatar の screen reader | `aria-hidden="true"` で decorative、隣接 `<h1>` で fullName が読み上げられる | 手動 (VoiceOver / NVDA) |
| 戻るリンク | キーボード focus 可能、`Tab` で到達 | Playwright `page.keyboard` |
| `<a target="_blank">` | `rel="noopener noreferrer"` 必須 | vitest / Playwright |
| `role="alert"` | preview-error 文言が screen reader にアナウンスされる | 手動 |

## 不変条件への影響

| 不変条件 | 異常系での影響 | 対策 |
| --- | --- | --- |
| #1 stableKey | 異常データで stableKey 重複時 React key warning | `field.stableKey` を server 側 `PublicMemberProfileZ.strict()` で保証、UI 側は信頼 |
| #2 consent キー統一 | `RegisterCallout` の文言で別キーを書くと task-18 grep gate で fail | `publicConsent` / `rulesConsent` 以外を grep で 0 件にする |
| #5 D1 直接禁止 | 異常系でも `D1Database` import を生やさない | `apps/web` 配下の grep で 0 件 |
| #7 Google Form 再回答経路 | preview 取得失敗でも CTA は機能維持（fallback URL） | `RegisterCallout` の href が常に有効な URL になる |

## 完了条件

- [ ] AB-01 / AB-03〜09 / AB-11〜AB-15 が自動テストに reify されている
- [ ] AB-02 / AB-10 が手動チェックリストに記録されている（or 任意 fixture で自動化）
- [ ] `previewError` fallback パスが Playwright で再現可能（API mock or 空 `STAGING_PREVIEW_FAIL=1` フラグ等）
- [ ] axe critical violation = 0（4 ページ + 404 ページ）
- [ ] preview-error 文言 / "—" / 配列 join 仕様の vitest assert が pass
