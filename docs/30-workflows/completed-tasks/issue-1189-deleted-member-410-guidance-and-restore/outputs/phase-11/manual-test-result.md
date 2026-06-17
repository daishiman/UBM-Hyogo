# Phase 11: 手動テスト結果（manual-test-result）

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | `TASK-MEMBER-410-DELETED-GUIDANCE-AND-RESTORE-001` |
| visualEvidence | **VISUAL** |
| 実施 wave | **implemented_local_evidence_captured** |
| 実行主体 | Codex local。staging 操作（MT-3）は user-gated |
| 実施日 | 2026-06-12 / 2026-06-13（local static visual PNG 追加） |

## MT-1: /profile 410 退会済み案内表示

| 項目 | 内容 |
|------|------|
| 一次証跡 | focused Vitest T-01〜T-06 |
| コマンド | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" "apps/web/app/(member)/profile/page.spec.tsx" "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"` |
| 期待結果 | title「このアカウントは退会済みです」/ detail「退会手続きが完了しているため」/ 「公開サイトのトップへ戻る」リンク（`href="/"`）あり / 再読み込みリンクなし / `data-cause="session-410"` 維持 |
| 実結果 | **PASS**。`session-error-display.spec.ts` 9 tests PASS、`page.spec.tsx` 9 tests PASS |

## MT-2: MemberDrawer 復元ボタン操作

| 項目 | 内容 |
|------|------|
| 一次証跡 | focused Vitest T-07〜T-12 + Phase 6 E-01〜E-04 |
| コマンド | 同上 |
| 期待結果 | `isDeleted=true` でボタン表示・`isDeleted=false` で非表示 / confirm cancel で API 不呼出 / 成功時 UI 即時更新 + toast / 409・404・network 失敗時は退会済み表示維持 / pending 中は disabled + 二重送信なし |
| 実結果 | **PASS**。`MemberDrawer.restore.spec.tsx` 6 tests PASS。実 `useAdminMutation` 経路を通し、fetch mock で success / cancel / 409 / 404 / network / pending を検証 |

## MT-3: staging 実機での復元操作（user-gated）

| 項目 | 内容 |
|------|------|
| 一次証跡 | staging 実機操作（任意・ユーザー明示承認後のみ） |
| コマンド/手順 | (1) staging D1 に退会済みテストアカウントを用意 (2) `/profile` 410 案内を実機確認 (3) admin MemberDrawer で復元 (4) audit `admin.member.restored` を確認 |
| 実結果 | **pending_user_gate**。D1 mutation / staging authenticated runtime / issue mutation は実行していない |

## スクリーンショット計画

| TC | canonical 名 | 対象 | 状態 |
|----|--------------|------|------|
| TC-11-1 | `screenshots/profile-410-deleted-guidance.png` | /profile 410 退会済み案内 | present（Playwright static local contract） |
| TC-11-2 | `screenshots/admin-member-drawer-restore-button.png` | MemberDrawer 退会済みセクション + 復元ボタン | present（Playwright static local contract） |
| TC-11-3 | `screenshots/admin-member-drawer-after-restore.png` | 復元成功後の drawer | present（Playwright static local contract） |

## スクリーンショット証跡

| TC-ID | スクリーンショット |
| --- | --- |
| TC-11-1 | `screenshots/profile-410-deleted-guidance.png` |
| TC-11-2 | `screenshots/admin-member-drawer-restore-button.png` |
| TC-11-3 | `screenshots/admin-member-drawer-after-restore.png` |

補助証跡: `screenshots/phase11-capture-metadata.json`、`screenshot-coverage.md`。
staging authenticated screenshot と D1 restore mutation は引き続き user-gated。

## まとめ

| カテゴリ | 状態 |
|----------|------|
| local focused evidence | **PASS**（3 files / 24 tests） |
| local static visual screenshot | **present**（3 PNG） |
| staging runtime / authenticated screenshot | **pending_user_gate** |
