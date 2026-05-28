---
実装区分: 実装仕様書
Phase: 13
状態: pending_user_approval
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-12-documentation.md](./phase-12-documentation.md)
---

# Phase 13: commit / push / PR

## 13.1 ブランチ

- Base: `dev`
- Working branch: `feat/admin-ui-prototype-alignment`（親 workflow と同一ブランチ）

## 13.2 commit メッセージ案

```
refactor(admin-dashboard-attendance): adopt KpiCard / AdminTable / AdminPageHeader (Task D)

- replace inline KpiCard with _dashboard/KpiCard (×3)
- replace bare <table> with AdminTable (by-session / ranking)
- adopt AdminPageHeader with self-link refresh CTA
- add attendance-page.spec.tsx (snapshot / a11y / data / fail-soft)
- no API / endpoint changes
```

## 13.3 PR タイトル / Body

- Title: `refactor(admin-dashboard-attendance): adopt KpiCard / AdminTable / AdminPageHeader (Task D)`
- Body 構成:
  - Summary（3 行）
  - AC-D1..D9 checklist（Phase 10.1 の検証マトリクス転記）
  - Phase 11 スクリーンショット 3 枚
  - 不変条件チェック（HEX 0 / API 変更 0 / D1 直接アクセス 0）
  - Related: 親 workflow `admin-ui-prototype-alignment` に `Refs` で紐付け

## 13.4 PR 作成コマンド

```bash
gh pr create --base dev --title "refactor(admin-dashboard-attendance): adopt KpiCard / AdminTable / AdminPageHeader (Task D)" --body-file outputs/phase-13/pr-body.md
```

## 13.5 ユーザー承認待ちアクション（user-gated）

- commit
- push
- PR 作成
- required check への登録（必要時）

## 13.7 Phase 13 evidence output

- `outputs/phase-13/pr-body.md`: PR body draft
- `outputs/phase-13/pr-creation-result.md`: user approval 前は `pending_user_approval` と記録。PR 作成後に URL / command / exit code を追記

## 13.6 Definition of Done（全 Phase 統合）

- [ ] `attendance/page.tsx` + `AttendanceDashboardSections.client.tsx` が `AdminPageHeader` + `KpiCard`(×3) + `AdminTable`(×2) で構成
- [ ] inline `function KpiCard` 削除（grep 0）
- [ ] 裸 `<table>` 0 件（grep 0）
- [ ] 既存 3 endpoint への呼び出し / shape / `safeServerFetch` 経由を維持
- [ ] AdminSectionErrorClient による 3 区画 fail-soft 維持
- [ ] T-D-01..D-04 vitest green
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` green
- [ ] OKLch tokens のみ（HEX / `bg-[#xxx]` 0 件）
- [ ] 親 workflow Phase 5 / Phase 12 に Task D 反映が記載
- [ ] 未接続 UI / 新 endpoint 追加を本タスクに残していない
- [ ] Phase 11 ローカル evidence（3 ショット + manual-test-result.md）取得済

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 13 |
| user_gated | commit / push / PR |

## 目的

PR 作成準備と user-gated 操作を分離する。

## 実行タスク

- PR body draft を作る。
- PR 作成結果を user approval 後に記録する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| PR output | `outputs/phase-13/pr-body.md` | PR body draft |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| PR result | `outputs/phase-13/pr-creation-result.md` | PR 作成結果 |

## 完了条件

- [ ] commit / push / PR が user approval 前に実行されていない。
