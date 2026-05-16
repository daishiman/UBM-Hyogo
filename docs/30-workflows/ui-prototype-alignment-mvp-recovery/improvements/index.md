# UI Prototype Alignment — Improvements (MVP Recovery 後続改善)

**[実装区分: 実装仕様書群]** — 全タスクともコード変更を伴う

## 1. 背景

`ui-prototype-alignment-mvp-recovery` の task-02..22 完了後、コードベース監査 (フェーズ2-A 論理構造 / フェーズ2-B メタ発想 / フェーズ2-C システム戦略) を実施し、以下が検出された:

- 動線2項目 (`admin layout の logo→/` / `admin/members → admin/tags?memberId=`) が欠落
- `RequestActionPanel` mutation 後の `router.refresh()` が未実装で pending banner が即時反映されない
- Prototype の visual feedback (tag pill selected fill / member card hover transition / profile visibility marker) が Tailwind 移行時に断裂
- 管理層 5 機能 (members note / identity-conflicts merge / schema diff resolve / tags assignment / dashboard chart) が画面骨子のみで mutation/可視化 UI 未実装

本 improvements ワークフローはこれらを全て同一サイクルで解消する。

## 2. スコープ

| 含む | 含まない |
|------|----------|
| `apps/web` UI 側の component / page / CSS 変更 | `apps/api` の新規 endpoint 追加 |
| 既存 API endpoint surface の利用拡張 | D1 schema 変更 |
| OKLch token / prototype primitives 準拠の UX 改善 | Google Form schema 変更 |

## 3. 不変条件 (継承)

1. 既存 API endpoint surface のみ利用 (`apps/api/src/routes/` 配下の現行)
2. OKLch token (`apps/web/src/styles/tokens.css`) 正本。HEX 直書き禁止
3. Prototype `docs/00-getting-started-manual/claude-design-prototype/` を UX 正本とする
4. `apps/web` から D1 直接アクセス禁止 (proxy 経由)
5. 新規 test ファイルは `*.spec.{ts,tsx}` のみ

## 4. 責務分離とディレクトリ構成

並列/直列はディレクトリ名で判別する。

```
improvements/
├─ index.md (本書)
├─ parallel-01-navigation/         # G1: 動線欠落 (独立2ファイル)
│  └─ spec.md
├─ parallel-02-state-sync/         # G2: 状態同期 (独立1ファイル)
│  └─ spec.md
├─ parallel-03-prototype-ux-css/   # G3: CSS + 軽量component (独立)
│  └─ spec.md
├─ parallel-04-attendance-paging/  # G4-1: AttendanceList paging (独立)
│  └─ spec.md
├─ parallel-06-public-pages/       # G6: 公開系 (/, register, privacy, terms)
│  └─ spec.md
├─ parallel-07-auth-and-shared/    # G7: /login + error/not-found/loading 共通
│  └─ spec.md
├─ parallel-08-shared-foundation/  # G8: ToastProvider / useAdminMutation export / Error boundary 等の共通基盤
│  └─ spec.md
├─ parallel-09-ux-cross-cutting/   # G9: form validation / empty state / pagination / icon / breadcrumb / responsive / focus / concurrent guard / form preserve
│  └─ spec.md
├─ parallel-10-auth-session-handling/  # G10: 401/403 ハンドリング統一・login redirect
│  └─ spec.md
└─ serial-05-admin-mutation-ui/    # G4-2..9: admin feature 領域 (直列)
   ├─ index.md
   ├─ step-01-members-note/spec.md
   ├─ step-02-identity-conflicts-merge/spec.md
   ├─ step-03-schema-diff-resolve/spec.md
   ├─ step-04-tags-assignment/spec.md
   ├─ step-05-dashboard-chart/spec.md
   ├─ step-06-meetings-attendance/spec.md
   ├─ step-07-requests-approve-reject/spec.md
   └─ step-08-audit-filter-paging/spec.md
```

### 並列/直列判定根拠

| グループ | 並列/直列 | 根拠 |
|---------|----------|------|
| parallel-01 (navigation) | 並列 | `AdminSidebar.tsx` と `MembersClientShell.tsx` は別ファイル・別責務 |
| parallel-02 (state-sync) | 並列 | `RequestActionPanel.tsx` 単一ファイル、他と独立 |
| parallel-03 (prototype-ux-css) | 並列 | `globals.css` 中心 + component class追加。他タスクの編集対象とファイル重複なし |
| parallel-04 (attendance-paging) | 並列 | `AttendanceList.tsx` 単一ファイル |
| parallel-06 (public-pages) | 並列 | `/`, `/register`, `/privacy`, `/terms`。HomePage CTA 追加のみ実改修、他3本は監査 OK |
| parallel-07 (auth-and-shared) | 並列 | `/login` の error/loading 整備 + root error focus 管理。他並列とファイル重複なし |
| parallel-08 (shared-foundation) | 並列 | ToastProvider 配置 / useAdminMutation contract / Error boundary。**serial-05/step-01 実装より前に完了必須**。hook 実体ファイルと barrel export の create owner は serial-05/step-01 |
| parallel-09 (ux-cross-cutting) | 並列 | form validation / empty state / pagination / icon / breadcrumb / responsive / focus-visible / concurrent guard / form preserve の 9 横断 primitive。parallel-03 と globals.css の `@layer components` を同時編集するため merge 注意 |
| parallel-10 (auth-session-handling) | 並列 | API 401/403 統一ハンドリング + login redirect。parallel-08 の useAdminMutation hook の error path で `FetchAuthedError` / `AuthRequiredError` を再利用 |
| serial-05 (admin-mutation-ui) | 直列 | step-01..07 が `useAdminMutation` hook を共有し `apps/web/src/features/admin/` を順次拡張。step-08 は read-only だが同一領域で順序維持。**parallel-08 完了が step-01 着手の前提** |

## 5. 実行フロー

```
[p-01]  [p-02]  [p-03]  [p-04]  [p-06]  [p-07]  [p-08]  [p-09]  [p-10]
   ↓       ↓       ↓       ↓       ↓       ↓       ↓       ↓       ↓
   └───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┘
                            ↓
                 [serial-05/step-01] (parallel-08 完了が前提)
                            ↓
                   step-02 → step-03 → step-04 → step-05
                   → step-06 → step-07 → step-08
```

並列 9 タスクは互いに干渉しないため同時実行可能。**ただし serial-05/step-01 は parallel-08 完了後に着手する**（ToastProvider / ErrorBoundary / route guard と hook contract 固定が前提）。`useAdminMutation.ts` と `hooks/index.ts` の実体作成は serial-05/step-01 が担当する。

## 6. 完了条件 (workflow DoD)

- [ ] 各 spec の DoD がすべて満たされる
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` がローカルでPASS
- [ ] `verify-design-tokens` CI gate がPASS (HEX 直書きなし)
- [ ] Prototype 5画面 (top / members / member detail / profile / admin dashboard) で再現度が prototype 比 "高"
- [ ] 動線12項目すべて ✓ (admin logo→home, members→tags?memberId= を含む)

## 7. 参照

- 監査結果: 本 worktree の会話内で実施 (フェーズ2-A/2-B/2-C 並列分析)
- 上位ワークフロー: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
- Prototype正本: `docs/00-getting-started-manual/claude-design-prototype/`
- Spec正本: `docs/00-getting-started-manual/specs/`

## 8. リスクと前提

| リスク | 対策 |
|--------|------|
| prototype CSS の Tailwind 翻訳ミス | 各 spec で `@layer components` の追加箇所をファイル+セレクタ単位で固定 |
| admin mutation で楽観的更新と server state がズレる | step-01 で確立する `useAdminMutation` hook に `router.refresh()` 必須化を明記 |
| 直列タスクで途中失敗すると後続が連鎖blockする | step ごとに自己完結のDoDを持たせ、失敗時は当該 step のみ revert で復旧可能にする |
