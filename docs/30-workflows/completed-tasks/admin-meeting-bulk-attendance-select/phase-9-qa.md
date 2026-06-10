# Phase 9: 品質保証（QA）

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- 前提: Phase 1〜8 完了（要件・設計・実装・テスト・カバレッジ・リファクタ）
- 本 Phase の責務: AC-1..AC-12 の検証手順を一覧化し、全ゲートを通過させる。

## QA 概要

本タスクは `apps/web` のみを変更する（AC-12 で API 無変更を gate）。検証は以下 6 区分で行う:

1. 型チェック・リント（静的解析）
2. Focused vitest（単体テスト）
3. デザイントークン gate（HEX / arbitrary color 禁止確認・AC-11）
4. API 非変更確認（git diff gate・AC-12）
5. 端末焼込み禁止 grep（task-18 regression・ローカル限定 endpoint 非焼込み）
6. AC-1..AC-12 の DOM / a11y 確認（Phase 11 runtime は user-gated 別途）

## 実行タスク

### タスク 1: 静的解析（typecheck / lint）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

**期待結果**: どちらも exit 0（エラー 0 件）。

### タスク 2: focused vitest 実行

```bash
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```

**期待結果**: 以下の spec が全て PASS する。

| spec ファイル | 検証内容（AC） | 期待 |
| --- | --- | --- |
| `Checkbox.spec.tsx`（T1・新規） | label 有無の分岐・`aria-label` / `aria-checked` 反映・controlled `onChange`（AC-11） | PASS |
| `useBulkAttendanceSelection.spec.ts`（T2・新規） | toggle / selectAllFiltered / clear / query 絞込 / attended stale 除去 effect（AC-2/AC-4/AC-9） | PASS |
| `BulkAttendanceChecklist.spec.tsx`（T3・新規） | 未出席候補のみ表示・選択件数ラベル・0 件 disabled・成功時 clear（AC-1/AC-3/AC-4/AC-6/AC-7） | PASS |
| `BulkAttendanceModal.spec.tsx`（T4・新規） | open/close・全選択・選択解除・1 リクエスト送信（AC-8/AC-9） | PASS |
| `MeetingAttendanceDrawer.spec.tsx`（T5・更新） | 新 prop `onBulkAddAttendance` 受領・既存単発 select 回帰なし・多選択 case（AC-10） | PASS |
| `api.attendance-import.spec.ts`（T6・新規） | `importAttendance` が `?dryRun=false` で `{rows:[{memberId}]}` を 1 リクエスト送信（AC-5） | PASS |

### タスク 3: デザイントークン gate（AC-11）

```bash
# (1) globals.css の新規 bulk-attendance / ui-checkbox ブロックに HEX 直書きがないこと
grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/globals.css \
  | grep -iE 'bulk-attendance|ui-checkbox' \
  && echo "[REVIEW: 該当行を確認（コメント/トークン定義は除外）]" || echo "[PASS: 該当ブロックに HEX なし]"

# (2) 新規 TSX に arbitrary color (bg-[#…]/text-[#…]/border-[#…]) がないこと
grep -rnE '(bg|text|border|fill|stroke|accent)-\[#' \
  apps/web/src/features/admin/components/_meetings \
  apps/web/src/components/ui/Checkbox.tsx \
  && echo "[FAIL: arbitrary color found]" || echo "[PASS: no arbitrary colors]"

# (3) Checkbox / 新規 TSX に HEX 直書きがないこと
grep -rnE '#[0-9a-fA-F]{3,8}' \
  apps/web/src/components/ui/Checkbox.tsx \
  apps/web/src/features/admin/components/_meetings/BulkAttendance*.tsx \
  | grep -v '^\s*//' \
  && echo "[FAIL: raw hex in TSX]" || echo "[PASS]"

# (4) 公式 token gate
mise exec -- pnpm verify:tokens
```

**期待結果**: (2)(3)(4) が PASS / green。(1) は該当行があればコメント / トークン変数定義のみであることを目視確認。Checkbox の `accent-color` / border は `var(--color-*)`（OKLch トークン）のみ。

### タスク 4: API 非変更確認（AC-12）

```bash
# apps/api / packages への git diff が空であること（SSOT §7 / AC-12）
git diff --name-only -- apps/api packages \
  | grep . \
  && echo "[FAIL: apps/api or packages modified]" || echo "[PASS: apps/api & packages untouched]"

# D1 migration / Google Form schema が変更されていないこと
git diff --name-only -- apps/web/migrations/ \
  | grep . \
  && echo "[FAIL: D1 migration modified]" || echo "[PASS: migrations untouched]"
```

**期待結果**: どちらも PASS（出力なし）。新 endpoint / stub / 削除なし・shared 型変更なし。

### タスク 5: 端末焼込み禁止 grep（task-18 regression）

ローカル限定エンドポイント（`127.0.0.1:8888` 等）を `apps/web/src` 配下へ焼き込まないこと（CLAUDE.md env 不変条件・task-18 regression smoke）。本タスクの新規/変更ファイルに該当がないことを確認する。

```bash
grep -rnE '127\.0\.0\.1|localhost:8888|http://localhost' \
  apps/web/src/features/admin/components/_meetings \
  apps/web/src/components/ui/Checkbox.tsx \
  apps/web/src/lib/admin/api.ts \
  && echo "[FAIL: local endpoint baked in]" || echo "[PASS: no local endpoint]"
```

**期待結果**: PASS（該当なし）。`importAttendance` は相対 path（`/meetings/...`）を `call` 経由で叩くため絶対 URL を持たない。

### タスク 6: a11y 確認項目（DOM レベル・jsdom で確認可能な範囲）

| 対象 | 確認項目 | 検証手段 |
| --- | --- | --- |
| Checkbox | `aria-label`（label 省略時に呼び出し側が付与）・`aria-checked` が `checked` と一致 | T1 spec のアサート |
| Checkbox | controlled（`checked` + `onChange`）で keyboard 操作可能（input[type=checkbox] ネイティブ） | T1 spec |
| BulkAttendanceModal | `role="dialog"` + `aria-modal="true"` | T4 spec で属性アサート |
| BulkAttendanceModal | open 時の focus 管理（panel または初期 focus 要素へ移動）・Escape で `onClose` | T4 spec（focus / keydown）・Phase 11 で実機補完 |
| 検索 input | FormField 経由で `label` と `id` の関連付け（不変条件 #9） | T3 spec |
| 送信ボタン | 選択 0 件で `disabled`・件数ラベルが `aria` 的に読める | T3 spec |

**期待結果**: T1/T3/T4 spec で上記 DOM / aria 属性がアサートされ PASS。focus trap の完全性など pixel/挙動依存は Phase 11 runtime で補完（user-gated）。

## AC-1..AC-12 チェックボックス表

| AC | 条件要旨 | 検証手段 | 判定 |
| --- | --- | --- | --- |
| AC-1 | ドロワー内に未出席候補の複数選択チェックリスト UI（各候補に Checkbox） | `BulkAttendanceChecklist.spec.tsx` PASS / `grep "bulk-attendance-option" apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx` ヒット | [ ] |
| AC-2 | 会員名 / memberId でインクリメンタル検索（絞込） | `useBulkAttendanceSelection.spec.ts`（query 絞込）PASS | [ ] |
| AC-3 | 「選択した N 名を一括追加」ボタン・件数 N 反映・0 件 disabled | `BulkAttendanceChecklist.spec.tsx` PASS | [ ] |
| AC-4 | 出席済はチェック不可 / 一覧除外、選択対象は未出席のみ | `useBulkAttendanceSelection.spec.ts`（attended 除外 + stale）PASS | [ ] |
| AC-5 | 一括追加は `POST .../attendance/import?dryRun=false` に `{rows}` を **1 リクエスト**送信（N 回単発しない） | `api.attendance-import.spec.ts` PASS | [ ] |
| AC-6 | 成功（`committed:true`）時 `summary.ok` 件を attended 反映・`「N 名の出席を追加しました」` toast・選択 clear | `BulkAttendanceChecklist.spec.tsx` / Shell `onBulkAdd` ロジック確認 | [ ] |
| AC-7 | `committed:false` 時 1 件も追加せず・失敗内訳 toast・選択保持 | `bulk-attendance-message.spec` / Shell ロジック確認 | [ ] |
| AC-8 | 「人数が多い時はこちら」→ 全画面モーダル（検索 / 全選択 / 選択解除 / 一括追加） | `BulkAttendanceModal.spec.tsx` PASS | [ ] |
| AC-9 | モーダルも同一 API 契約・状態反映を共有（ロジックを hook に集約） | `useBulkAttendanceSelection.spec.ts` 共有 + Phase 8 §1 grep PASS | [ ] |
| AC-10 | 既存単発「出席を追加」「削除」が回帰なし | `MeetingAttendanceDrawer.spec.tsx`（既存 case 維持）PASS | [ ] |
| AC-11 | Checkbox は `ui/Checkbox.tsx`・色は OKLch トークンのみ・HEX / arbitrary 禁止 | タスク 3 の (2)(3)(4) PASS | [ ] |
| AC-12 | `apps/api` / `packages` / Form schema 非変更（`git diff --name-only -- apps/api packages` 空） | タスク 4 PASS | [ ] |

## 検証コマンドまとめ（一括実行用）

```bash
# 1. 型チェック・リント
mise exec -- pnpm typecheck && mise exec -- pnpm lint

# 2. focused vitest
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts

# 3. デザイントークン gate
grep -rnE '(bg|text|border|fill|stroke|accent)-\[#' \
  apps/web/src/features/admin/components/_meetings apps/web/src/components/ui/Checkbox.tsx \
  && echo "[FAIL]" || echo "[PASS: no arbitrary colors]"
mise exec -- pnpm verify:tokens

# 4. API / migration 非変更
git diff --name-only -- apps/api packages | grep . && echo "[FAIL]" || echo "[PASS: api & packages untouched]"
git diff --name-only -- apps/web/migrations/ | grep . && echo "[FAIL]" || echo "[PASS: migrations untouched]"

# 5. 端末焼込み禁止
grep -rnE '127\.0\.0\.1|localhost:8888' \
  apps/web/src/features/admin/components/_meetings apps/web/src/components/ui/Checkbox.tsx apps/web/src/lib/admin/api.ts \
  && echo "[FAIL]" || echo "[PASS: no local endpoint]"
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| AC 正本 | [phase-1-requirements.md](phase-1-requirements.md) | AC-1..AC-12 定義 |
| 設計正本 | [phase-2-design.md](phase-2-design.md) | hook / component / CSS / a11y 設計の根拠 |
| 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | 不変条件適合・grep gate コマンド参照 |
| 共有コンテキスト（SSOT） | [outputs/phase-1/shared-context.md](outputs/phase-1/shared-context.md) | API 契約・検証コマンド（§7）・不変条件チェックリスト（§6） |
| デザイントークン | `apps/web/src/styles/tokens.css` | token 名確認 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin primitive / form 規約 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 9 仕様書 | 文書 | QA チェックリスト・検証コマンド・AC マッピング・a11y 確認項目 |
| 品質レポート | 文書 | [outputs/phase-9/quality-report.md](outputs/phase-9/quality-report.md) |
| 各 spec の PASS 証跡 | runtime | Phase 11 `manual-test-result.md` に記録 |

## 統合テスト連携

- focused vitest PASS が Phase 10 最終レビューの green 判定根拠となる。
- タスク 3・4 の gate PASS が Phase 10 の AC-11・AC-12 判定根拠となる。
- Phase 11 では本 Phase で確認できない「実 pixel 表示・focus trap 挙動・CSS の効き」を user-gated として追加する。

## 完了条件

1. `pnpm typecheck` / `pnpm lint` が exit 0。
2. focused vitest（T1..T6）が全 PASS。
3. デザイントークン gate（arbitrary color 0 / HEX 0 / `verify:tokens` green）が全 PASS（AC-11）。
4. `git diff --name-only -- apps/api packages` および `apps/web/migrations/` が空（出力なし・AC-12）。
5. 端末焼込み禁止 grep が PASS（ローカル限定 endpoint なし）。
6. a11y 確認項目（Checkbox aria-label/aria-checked・モーダル role=dialog/aria-modal・focus 管理）が T1/T3/T4 でアサートされ、pixel/挙動依存分は Phase 11 runtime 境界として明記されている。
7. AC-1..AC-12 チェックボックスが全チェック済みとなるか、未確認項目が Phase 11 runtime 境界として明記されている。
