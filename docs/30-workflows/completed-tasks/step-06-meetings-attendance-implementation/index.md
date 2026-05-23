# step-06-meetings-attendance-implementation

**[実装区分: 実装仕様書]**
**[正本: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-06-meetings-attendance/spec.md`]**

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| artifacts | `artifacts.json` |
| 直列順序 | 6 / 8 (serial-05-admin-mutation-ui) |
| 前提 | step-01 useAdminMutation hook + parallel-08 shared-foundation 完了済 |

## 概要

admin/meetings 画面群（一覧 panel `apps/web/src/components/admin/MeetingPanel.tsx` および
詳細 panel `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`）の
**出席登録 / 削除 mutation** を、`useAdminMutation` + 新規 `useConfirmDialog` hook に統一する。

副次成果として、step-07 (requests approve/reject) でも再利用される **`useConfirmDialog` hook の
共通基盤** を `apps/web/src/features/admin/hooks/useConfirmDialog.ts` に新設する。

## 不変条件

1. **既存 API endpoint surface のみ利用**: UI 正本は 06c-E の alias endpoint
   `POST /api/admin/meetings/:id/attendances` (`{ memberId, attended }`) をそのまま使う。
   新 endpoint 追加禁止。legacy API route の単数 `/attendance` は API-only contract として残るが、
   `apps/web/src/lib/admin/api.ts` / `apps/api/src/routes/admin/meetings.ts` / `meetings.contract.spec.ts`
   が示す現行 UI surface は複数形 `/attendances` である。
2. **直接 `fetch` 禁止**: `MeetingAttendancePanel.tsx` の生 `fetch` を `useAdminMutation` 経由に置換する。
3. **`useAdminMutation` は新基盤のみ使用**: `apps/web/src/features/admin/hooks/useAdminMutation` を正本とし、
   legacy `apps/web/src/lib/useAdminMutation` への新規参照を増やさない (CLAUDE.md 不変条件 #10)。
4. **OKLch token 正本化**: HEX 直書き / `bg-[#xxx]` 禁止。
5. **a11y**: confirm dialog は `role="dialog"` / `aria-modal="true"` / `aria-labelledby` を持つ。
6. **新規 test ファイルは `*.spec.{ts,tsx}` のみ** (CLAUDE.md 不変条件 #8)。
7. **`apps/web` → D1 直接アクセス禁止**: API 経由のみ。

## ワークフロー成果物

| Phase | 内容 | パス |
| --- | --- | --- |
| Phase 1 | 要件定義 / SSOT 確定 | [phase-01.md](phase-01.md) |
| Phase 2 | アーキテクチャ設計 | [phase-02.md](phase-02.md) |
| Phase 3 | 詳細設計 (型 / hook API / dialog 構造) | [phase-03.md](phase-03.md) |
| Phase 4 | テスト設計 (vitest + a11y) | [phase-04.md](phase-04.md) |
| Phase 5 | コア実装手順 | [phase-05.md](phase-05.md) |
| Phase 6 | 検証コマンド / 手動確認 | [phase-06.md](phase-06.md) |
| Phase 7 | CI/CD 統合 (既存 gate 整合) | [phase-07.md](phase-07.md) |
| Phase 8 | governance / branch protection | [phase-08.md](phase-08.md) |
| Phase 9 | 移行 / rollout 戦略 | [phase-09.md](phase-09.md) |
| Phase 10 | 監視 / 運用観点 | [phase-10.md](phase-10.md) |
| Phase 11 | evidence 収集 | [phase-11.md](phase-11.md) |
| Phase 12 | ドキュメント・コンプライアンス | [phase-12.md](phase-12.md) |
| Phase 13 | PR 作成 / 承認ゲート | [phase-13.md](phase-13.md) |

## 変更対象ファイル一覧

```
apps/web/src/features/admin/hooks/
  ├── useConfirmDialog.ts        (新規)
  ├── __tests__/useConfirmDialog.spec.tsx  (新規)
  └── index.ts                   (export 追加 — 既存なら edit)

apps/web/src/components/admin/
  ├── MeetingPanel.tsx           (refactor: useConfirmDialog 統合)
  └── __tests__/MeetingPanel.component.spec.tsx  (既存 / ケース追加)

apps/web/app/(admin)/admin/meetings/[id]/
  ├── MeetingAttendancePanel.tsx (refactor: 生 fetch → useAdminMutation)
  └── __tests__/MeetingAttendancePanel.spec.tsx (新規)

apps/web/src/components/ui/
  └── ConfirmDialog.tsx          (新規 — useConfirmDialog 用 presentational 部品)
```

## DoD サマリ

- [x] `useConfirmDialog` hook 実装 + unit test green
- [x] `MeetingPanel.tsx` が `useConfirmDialog` 経由で削除確認を出す
- [x] `MeetingAttendancePanel.tsx` が `useAdminMutation` 経由になり、生 `fetch` が消える
- [x] 誤削除を防ぐ確認 dialog は破壊的操作だけに限定され、出席登録 button には追加しない
- [x] 409 / 422 / 404 が toast でユーザーに伝わる
- [x] `pnpm typecheck && pnpm lint && focused vitest` green
- [x] design token gate (`verify-design-tokens`) green
- [x] attendance Playwright smoke で /admin/meetings 動線が PASS
