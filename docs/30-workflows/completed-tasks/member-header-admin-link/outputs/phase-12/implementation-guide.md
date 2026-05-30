# Phase 12 — Implementation Guide

## Part 1 — 中学生レベル概念説明

### このタスクで何をするの？

会員ページ（マイページ）の上にあるメニューバーに、**管理者だけに見える「管理」ボタン**を足します。

### なぜ必要？

今のメニューバーには「マイページ」「公開ページ」「ログアウト」しかありません。管理者（admin）でログインしても「管理画面（/admin）」に飛ぶリンクがありません。「管理者が管理画面に戻れない」状態になっているので、それを直します。

### どうやって判定する？

`authView` という小さな箱（オブジェクト）を渡して、その中の `kind` が `"admin"` だったら「管理」リンクを出す、それ以外なら出さない、という単純な条件分岐です。

### 何を壊さないように気をつける？

- 既存の `data-testid="member-header"` ラベルはそのまま残す（テストが参照しているから）
- 色を直接 `#abc123` のように書かない（CSS の token を経由する）
- テストファイルは `*.spec.tsx` だけにする（`*.test.tsx` は禁止）

## Part 2 — 技術者レベル実装ガイド

### 1. 変更対象

| ファイル | 種別 | 主要差分 |
|---------|------|----------|
| `apps/web/src/components/layout/MemberHeader.tsx` | 編集 | `authView?: AuthView` prop 追加 / `isAdmin` 分岐で admin link 描画 / `data-auth-state` 属性追加 |
| `apps/web/app/(member)/layout.tsx` | 編集 | sync → async / `await getAuthView()` / `<MemberHeader authView={authView} />` |
| `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 新規 or 編集 | TC-1〜TC-6（Phase 4 §2） |
| `apps/web/src/lib/auth-view/*` | 新規 | `AuthView` / `resolveAuthView()` / `getAuthView()` / barrel |
| `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | 新規 | guest/member/admin 正規化 |

### 2. シグネチャ

`Phase 2 §1.1` と一致。

### 3. ローカル実行

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx
```

### 4. DoD

`index.md` の `## 完了条件（DoD）` 全項目。ローカル実装・typecheck・lint・focused Vitest・grep gate・local header visual sanity は完了済み。

### 5. ロールバック手順

問題発生時は `git revert` で本 workflow の実装差分（`MemberHeader`、`(member)/layout.tsx`、`apps/web/src/lib/auth-view/`、focused tests）を戻す。D1 schema / API 変更を含まないため副作用なし。

### 6. スクリーンショット参照

| 状態 | 参照 |
|------|------|
| member header | `outputs/phase-11/screenshots/member-header-member.png` |
| admin header | `outputs/phase-11/screenshots/member-header-admin.png` |

上記は local header visual sanity。staging `/profile` runtime screenshots は user-gated。

### 7. 後続タスク

- 親 workflow Task G（横断 Playwright e2e）で 3 状態 × `/profile` の `data-auth-state` を結合検証
- staging deploy 後の visual evidence は `outputs/phase-11/screenshots/` に保存（user-gated）
