# Phase 1: 要件定義

> Phase: 1 / 13
> 名称: 要件定義
> implementation_mode: `implementation`
> task classification: **[実装区分: 実装仕様書]**
> visual classification: **VISUAL**

---

## 目的

`/login`（会員層）と `error.tsx` / `not-found.tsx` / `loading.tsx`（共通層）の未カバー routes について、Prototype 準拠性・OKLch token・a11y（focus / aria-live）・skeleton 統一の改善要件を確定する。

---

## P50 前提確認チェック

| 項目 | 結果 | 対応 |
|------|------|------|
| current branch に対象実装が存在するか | Yes（login/error.tsx, error.tsx, loading.tsx, profile/loading.tsx, not-found.tsx は既存。login/loading.tsx のみ新規） | 既存 5 + 新規 1 を実装 |
| upstream マージ済みか | Yes（dev は origin/dev に同期想定） | Phase 5 で再確認 |
| 前提タスクの完了 | task-08（design-tokens spec）/ task-09（tokens.css）/ task-18（design-tokens CI gate） | 完了済み前提 |
| 既存 primitive | `apps/web/src/components/ui/Card.tsx` の `Card` / `CardContent` | 直接 import で利用 |

---

## taskType / visualEvidence 判定

| 判定軸 | 値 | 根拠 |
|-------|----|------|
| taskType | `implementation` | 既存 5 ファイルの編集 + 新規 1 ファイルの作成（コード変更を伴う） |
| visualEvidence | `VISUAL` | error / loading の見た目改善が中心。Phase 11 でスクリーンショット 4 画面 × light/dark の取得が必要 |
| implementationCategory | `frontend_ui` | `apps/web/app/` のみへの変更（API/D1 変更なし） |

---

## スコープ

### in-scope

- G7-1: `/login` route の Card layout / focus 管理統一
  - `apps/web/app/login/error.tsx` の Card layout 適用 + OKLch styling + focus 管理
  - `apps/web/app/login/loading.tsx` 新規作成（OKLch skeleton + a11y）
- G7-2: root / segment loading の OKLch / skeleton 統一
  - `apps/web/app/loading.tsx` の OKLch token 完全性確認
  - `apps/web/app/profile/loading.tsx` の skeleton 統一
- G7-3: Root error / 404 のブランディング検証
  - `apps/web/app/error.tsx` の focus 管理追加 + Card layout 検討
  - `apps/web/app/not-found.tsx` のブランディング検証（変更不要なら検証ログのみ）

### out-of-scope

- 認証ロジック（Auth.js / Magic Link）の変更
- 新規 UI primitive コンポーネントの作成
- API endpoint 追加 / D1 schema 変更 / Google Form 仕様変更
- 19 routes 全体への波及（対象は 6 ファイルに限定）

---

## 受入条件（DoD）

1. `/login/error.tsx` に `Card` + `CardContent` の構造、`role="alert" aria-live="assertive"`、`h1` への自動 focus が実装されている
2. `/login/loading.tsx` が新規作成され、`role="status" aria-busy="true" aria-live="polite"` + `sr-only` テキスト + OKLch skeleton を備える
3. Root `error.tsx` に `h1` への自動 focus が追加されている（既存 `role="alert"` / `aria-live` は維持）
4. `/profile/loading.tsx` が root loading と統一した skeleton pattern を採用している
5. `not-found.tsx` のブランディング状態が verification log に記録されている
6. OKLch token 完全性: HEX 直書き 0、`verify-design-tokens` gate 通過
7. jest-axe violations 0、Playwright smoke pass
8. Phase 11 で 4 画面 × light/dark = 8 枚のスクリーンショットを `outputs/phase-11/` に保存
9. `pnpm typecheck` / `pnpm lint` / `pnpm test` clean

---

## 不変条件

1. OKLch token のみ（HEX 直書き禁止）
2. 既存 API endpoint surface のみ利用
3. `apps/web` から D1 への直接アクセス禁止
4. 既存 primitive (`Card` / `CardContent`) のみ利用、新 primitive を生やさない
5. テストファイルは `.spec.tsx` 拡張子必須
6. `motion-safe:` prefix 必須（prefers-reduced-motion 尊重）
7. focus 管理は `tabIndex={-1}` + `useEffect(() => ref.current?.focus({ preventScroll: true }), [])` の組み合わせのみ

---

## 命名規約調査

- spec ファイル: `apps/web/__tests__/<feature>.spec.tsx`（`.test.tsx` 禁止）
- skeleton クラス: `bg-surface-2`（tokens.css 由来）
- focus ref: `headingRef`（`useRef<HTMLHeadingElement>`）
- data 属性: `data-state="error"` / `data-state="loading"`

---

## 既存実装 carry-over 確認

| 項目 | 確認結果 |
|------|---------|
| `apps/web/app/login/error.tsx` 現状 | Simple main/section/button、Card layout 未適用、focus 管理なし |
| `apps/web/app/login/loading.tsx` 現状 | 不在（新規作成） |
| `apps/web/app/error.tsx` 現状 | `role="alert"` / `aria-live` 実装済、focus 管理なし |
| `apps/web/app/loading.tsx` 現状 | OKLch skeleton 実装済（OK 想定。Phase 5 で再検証） |
| `apps/web/app/profile/loading.tsx` 現状 | 簡素な text のみ、skeleton 欠落 |
| `apps/web/app/not-found.tsx` 現状 | ブランディング適用済（OK 想定。検証のみ） |
| `apps/web/src/components/ui/Card.tsx` | `Card` / `CardContent` を named export |

---

## ステークホルダー / 利用シーン

| ステークホルダー | 利用シーン |
|----------------|-----------|
| solo developer | `/login` の loading/error 体験を確認しながら改善 |
| screen reader ユーザー | エラー / loading が自動的に読み上げられる |
| prefers-reduced-motion ユーザー | skeleton アニメーションが抑制される |

---

## 次フェーズへの引き継ぎ

Phase 2 では以下を設計する:

1. 4 ファイル（login/error, login/loading, root/error, profile/loading）の JSX 構造
2. Card layout の適用方針（login/error と root/error）
3. focus 管理パターン（`tabIndex={-1}` + `useEffect`）
4. OKLch class 命名（`bg-surface-2` 等）と HEX 撲滅手段
