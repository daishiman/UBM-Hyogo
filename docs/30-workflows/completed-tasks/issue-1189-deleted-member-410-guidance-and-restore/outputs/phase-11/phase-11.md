# Phase 11: 手動テスト（VISUAL）

> **visualEvidence: VISUAL**（/profile 410 バナーと admin MemberDrawer の見た目が変わるため）。
> **status: implemented_local_evidence_captured**。
> local primary evidence は focused Vitest 3 files / 24 tests PASS。local static visual contract PNG 3 点も present。staging 認証付き runtime screenshot と D1 mutation は user-gated。

## 参照資料

| 種別 | パス |
|------|------|
| WF SSOT | [../../index.md](../../index.md) |
| 手動テスト結果 | [manual-test-result.md](manual-test-result.md) |
| スクリーンショット計画 | [screenshot-plan.json](screenshot-plan.json) |
| スクリーンショット coverage | [screenshot-coverage.md](screenshot-coverage.md) |
| capture metadata | [screenshots/phase11-capture-metadata.json](screenshots/phase11-capture-metadata.json) |
| 最終レビュー仕様（AC-T マトリクス） | [../phase-10/phase-10.md](../phase-10/phase-10.md) |
| compliance check | [../phase-12/phase12-task-spec-compliance-check.md](../phase-12/phase12-task-spec-compliance-check.md) |

## local primary evidence

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"
```

結果: **PASS**（3 files / 24 tests、2026-06-12 JST）。

## 3 層評価

| 層 | 判定 | 根拠 |
|----|------|------|
| Semantic | PASS | `data-cause="session-410"` 維持、retry link 非表示、`actionHref="/"`、`member-restore-button`、confirm cancel / 409 / 404 / network / loading 二重送信を focused tests で確認 |
| Visual | PASS_WITH_STAGING_PENDING | DOM と primitive 配線は local tests で確認済み。PNG 3 点を `outputs/phase-11/screenshots/` に保存し、主要文言・ボタン・復元後状態を目視確認済み |
| AI UX | PASS_WITH_STAGING_PENDING | 退会済み理由・問い合わせ・トップ導線・管理者復元導線は文言/role レベルで確認済み。staging 実データでの折返し確認のみ user-gated |

## 完了条件

- [x] MT-1〜MT-2 が local focused Vitest で PASS
- [x] MT-3 は user-gated 境界を維持（ユーザー承認なしに staging D1 mutation を行っていない）
- [x] スクリーンショット 3 点が canonical 名で `outputs/phase-11/screenshots/` に保存されている（local static visual contract）
- [x] `outputs/phase-11/screenshots/phase11-capture-metadata.json` と `outputs/phase-11/screenshot-coverage.md` が present
- [x] manual-test-result.md の local 実結果を実測へ更新
- [x] 3 層評価を記録

## 成果物

| 成果物 | 状態 |
|--------|------|
| [manual-test-result.md](manual-test-result.md) | present（local focused evidence 記録済み） |
| [screenshot-plan.json](screenshot-plan.json) | present（local static PNG present / staging pending 計画） |
| [screenshot-coverage.md](screenshot-coverage.md) | present |
| `screenshots/` 配下 PNG 3 点 | present |
| [screenshots/phase11-capture-metadata.json](screenshots/phase11-capture-metadata.json) | present |
| staging 実機復元操作 | pending_user_gate |
