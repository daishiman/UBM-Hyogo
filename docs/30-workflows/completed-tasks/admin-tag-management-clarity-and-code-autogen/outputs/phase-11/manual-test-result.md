# Phase 11 Manual Test Result

[実装区分: 実装仕様書]

> SSOT: `docs/30-workflows/completed-tasks/admin-tag-management-clarity-and-code-autogen/shared-context.md`

---

## 0. メタ

| 項目 | 値 |
|------|-----|
| slug | `admin-tag-management-clarity-and-code-autogen` |
| workflow_state | `implemented_local_evidence_captured` |
| visual_category | `VISUAL` |
| 証跡の主ソース | focused unit / component spec、web typecheck、web lint、design-token gate、apps/api diff empty。 |
| screenshot を作らない理由 | 認証越し staging visual は deploy / auth state が user-gated のため、実画像の捏造を避けて canonical screenshot 2 点を `staging_visual_pending_user_gate` に分離する。 |
| Phase 11 evidence 昇格 | local deterministic evidence は present。authenticated staging screenshot だけ pending。 |

---

## 1. Local command evidence

下記コマンドを本サイクルで実行し、local deterministic evidence として記録する。

| Command | Result |
|---------|----------------------|
| `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/tagCodeAutogen.spec.ts apps/web/src/lib/admin/__tests__/tagManagementGlossary.spec.ts apps/web/src/components/admin/__tests__/TagManagementGuide.component.spec.tsx apps/web/src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx apps/web/src/components/shell/__tests__/shell-config.spec.ts apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | PASS（6 files / 39 tests） |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS（9 tests） |
| `git diff -- apps/api` | 空（apps/api 非接触） |

---

## 2. Evidence mapping

| ソース | 内容 | AC | Status |
|--------|------|----|--------|
| Vitest（`tagCodeAutogen.spec.ts`） | `generateTagCode` 全分岐が `TAG_CODE_PATTERN` に一致 | AC-3 | present |
| Vitest（`tagManagementGlossary.spec.ts`） | `TAG_MANAGEMENT_GLOSSARY` 必須キー網羅 / `getTagTerm` lookup | AC-8 | present |
| Vitest（`TagManagementGuide.component.spec.tsx`） | variant 別の説明文・相互リンク描画 | AC-6 / AC-7 | present |
| Vitest（`TagDefinitionCreateForm.component.spec.tsx`） | コード自動補完 / 手動上書き / ヒント描画 | AC-1 / AC-2 / AC-4 | present |
| shell / TagQueue focused specs | サイドバー label「タグ割当」・既存 queue DOM contract | AC-5 / AC-12 | present |
| `verify-design-tokens` | HEX 直書き 0 件 | AC-11 | present |
| `git diff -- apps/api` | 空（API/D1/Form 不変） | AC-10 | present |
| screenshot `tag-definition-code-autogen.png` | コード自動補完 + ガイド | AC-1 / AC-4 / AC-6 | staging_visual_pending_user_gate |
| screenshot `tag-assignment-guide-and-rename.png` | ガイド + サイドバー「タグ割当」 | AC-5 / AC-7 | staging_visual_pending_user_gate |
| local auth gate screenshot `outputs/phase-11/screenshots/local-auth-gate-tag-master.png` | local dev `/admin/tag-master` が管理者ログイン画面で止まることを確認 | boundary | present |
| local auth gate screenshot `outputs/phase-11/screenshots/local-auth-gate-tags.png` | local dev `/admin/tags` が管理者ログイン画面で止まることを確認 | boundary | present |

---

## 3. screenshot（canonical 名・capture 計画）

| canonical 名 | 内容 | Status |
|------|------|--------|
| `tag-definition-code-autogen.png` | 表示名入力でコード自動補完 + 自動生成ヒント + `TagManagementGuide variant="definition"` | staging_visual_pending_user_gate |
| `tag-assignment-guide-and-rename.png` | `TagManagementGuide variant="assignment"` + サイドバー「タグ割当」 + 相互リンク | staging_visual_pending_user_gate |

Local dev では `local-auth-gate-tag-master.png` / `local-auth-gate-tags.png` を取得し、どちらも管理者ログイン画面で止まることを確認した。dev server log では Auth.js `MissingSecret` も出ており、認証済み admin session なしでは対象 UI まで到達できない。これらは対象 UI の canonical screenshot ではないため、canonical 2 点は authenticated staging screenshot として user-gated のまま保持する。

---

## 4. 結論

- 本サイクルの Phase 11 local deterministic evidence は present。
- authenticated staging screenshot 2 点のみ `staging_visual_pending_user_gate`。
