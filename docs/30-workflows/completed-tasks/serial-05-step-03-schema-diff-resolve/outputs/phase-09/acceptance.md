**[実装区分: 実装仕様書]**

# Phase 09 — 受け入れ基準 (Acceptance Criteria)

## 1. 概要

`serial-05-step-03-schema-diff-resolve` は、既存 `SchemaDiffPanel` を現行 API contract と serial-05 mutation UI 方針へ揃える hardening task である。新規 `SchemaDiffList` / `SchemaDiffResolveForm` を作ること自体は DoD にしない。

## 2. DoD チェックリスト

### 2.1 実装完了

- [ ] `apps/web/app/(admin)/admin/schema/page.tsx` が `fetchAdmin("/admin/schema/diff")` と `SchemaDiffPanel` を維持
- [ ] `SchemaDiffPanel` が `{ total, items }` / `queued|resolved` を正として render
- [ ] `postSchemaAlias()` または `useAdminMutation.trigger` のどちらか一方に mutation 経路が統一されている
- [ ] browser proxy `POST /api/admin/schema/aliases` が呼ばれる
- [ ] 200 apply / 202 retryable / 409 conflict / 422 stable_key_collision の UI feedback が分離されている

### 2.2 品質

- [ ] design token のみ使用（HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止）
- [ ] `process.env.*` 直接参照禁止
- [ ] PII を含むログ出力なし
- [ ] focused component/helper tests が green
- [ ] `mise exec -- pnpm typecheck` exit code 0
- [ ] `mise exec -- pnpm lint` exit code 0
- [ ] `mise exec -- pnpm build` exit code 0

### 2.3 動作確認

- [ ] `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` で `/admin/schema` の 4 ペインが表示される
- [ ] `questionId=null` row は alias 割当不可 alert を表示
- [ ] submit 成功時 `router.refresh()` で再取得される
- [ ] 422 / 409 は fallback ではなく form feedback として表示される
- [ ] 202 retryable continuation は失敗扱いではなく再試行可能として表示される

## 3. 検証コマンド一覧

```bash
mise exec -- pnpm typecheck; echo "typecheck=$?"
mise exec -- pnpm lint; echo "lint=$?"
mise exec -- pnpm test apps/web --run -- SchemaDiffPanel.component.spec.tsx; echo "component_test=$?"
mise exec -- pnpm test apps/web --run -- api.spec.ts; echo "api_test=$?"
mise exec -- pnpm build; echo "build=$?"
grep -rnE 'bg-\[#|text-\[#|process\.env\.' apps/web/app/\(admin\)/admin/schema apps/web/src/components/admin/SchemaDiffPanel.tsx apps/web/src/lib/admin/api.ts; echo "grep_gate=$?"
PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 mise exec -- pnpm e2e:smoke -- admin-schema-diff-resolve; echo "e2e=$?"
```

## 4. 完了判定

上記すべての checkbox が完了し、Phase 11 evidence 5 点セット（typecheck / lint / focused tests / build / grep-gate）が `completed (runtime PASS / verified at <ISO8601>)` または `runtime_pending (CI scheduled)` として揃った時点で Phase 09 受け入れ完了とする。
