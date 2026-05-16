# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 9 (品質検証) |
| 次 Phase | 11 (VISUAL Evidence) |
| 状態 | pending |

## 目的

AC-1..AC-10 全件の充足を最終確認し、Phase 11 以降（証跡 / 正本同期 / PR）に進める状態を確定する。

## AC 充足チェックリスト

| AC | 内容 | 充足証跡 |
| --- | --- | --- |
| AC-1 | useAdminMutation の I/O 契約 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| AC-2 | router.refresh + toast | `useAdminMutation.spec.ts` TC-03/TC-04 green |
| AC-3 | NoteForm の POST/PATCH 切替 | `NoteForm.spec.tsx` TC-14/TC-17 green |
| AC-4 | MemberDrawer notes section | `MemberDrawer.notes.integration.spec.tsx` IT-01..03 green |
| AC-5 | client validation 1-2000 字 | `NoteForm.spec.tsx` TC-12/TC-13 green |
| AC-6 | unit test green & coverage >=80% | Phase 9 G-3, G-4 |
| AC-7 | design-token 違反 0 | Phase 9 G-6 |
| AC-8 | typecheck / lint green | Phase 9 G-1, G-2 |
| AC-9 | coverage-guard exit 0 | Phase 9 G-4 |
| AC-10 | step-02..05 が import 可能 | barrel `hooks/index.ts` で export 済 |

## 不変条件チェック

- [ ] API endpoint surface 不変（`apps/api/src/routes/admin/member-notes.ts` 改変なし）
- [ ] D1 直接 access 無し（Phase 9 G-8 pass）
- [ ] OKLch token のみ（Phase 9 G-6 pass）
- [ ] `process.env.*` 直接参照無し（Phase 9 G-9 pass）
- [ ] test suffix `*.spec.{ts,tsx}` のみ（Phase 9 G-7 pass）
- [ ] 新規 primitive 生成無し

## docs 整合

- [ ] index.md / artifacts.json の Phase 10 を `completed`、Phase 11 を `runtime_pending` に更新
- [ ] Phase 1-9 の成果物がすべて `outputs/phase-N/` 配下に存在
- [ ] CLAUDE.md の関連セクションと衝突する記述 0

## 完了条件

- [ ] AC-1..AC-10 全件充足
- [ ] 不変条件 6 件すべて pass
- [ ] docs 整合確認済
- [ ] `outputs/phase-10/final-review.md` 作成

## タスク100%実行確認【必須】

- [ ] AC 充足表 / 不変条件表が証跡付きで埋まる

## 次Phase

Phase 11 (VISUAL Evidence): UI 実装のため screenshot 取得が必須。
