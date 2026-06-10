# Phase 8: リファクタリング

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- 前提: Phase 1（要件・AC-1..AC-12）/ Phase 2（設計）/ Phase 3（設計レビュー PASS）/ Phase 4〜7（実装・テスト・カバレッジ）
- 本 Phase の責務: 実装後の重複解消・命名整理・SRP 観点の整理を行い、保守性を高める。新機能追加は行わない。

## リファクタリング方針

本タスクの変更対象は `apps/web/src/features/admin/components/_meetings/` / `apps/web/src/components/ui/Checkbox.tsx` / `apps/web/src/lib/admin/api.ts` / `apps/web/src/styles/globals.css` に閉じる。Phase 2 設計で「選択ロジックを `useBulkAttendanceSelection` に集約」「純関数を `bulk-attendance-message.ts` に分離」する DRY 構造を採用済みのため、実装後に発生し得る整理は限定的である。以下に **対象/Before/After/理由** をテーブル形式で列挙し、採否と根拠を明記する（[Feedback RT-03]）。

## 実行タスク（対象 / Before / After / 理由）

### タスク 1: checklist / modal の選択ロジック集約確認（AC-9 / 重複排除）

| 観点 | Before（重複が起きうる形） | After（集約形） | 理由 |
| --- | --- | --- | --- |
| 選択 Set 管理 | `BulkAttendanceChecklist` と `BulkAttendanceModal` が各自 `useState<Set>` + toggle を持つ | 両 UI が `useBulkAttendanceSelection(candidates, attended)` を別 instance で呼ぶ | 選択・絞込・全選択・stale 除去ロジックの単一定義（AC-9）。修正点が 1 箇所に閉じる |
| query 絞込 | 各 UI で `filter(...)` を再実装 | hook の `selectableCandidates` を共有 | 絞込条件（fullName / memberId 部分一致・trim・小文字化）の二重定義回避 |
| 全選択 | 各 UI で実装 | hook の `selectAllFiltered()` | 「絞込結果の未出席のみ全選択」の意味を 1 箇所に固定 |

**採否**: **採用（hook 集約・設計どおり）**。実装で checklist / modal が個別に選択 state を持っていた場合は `useBulkAttendanceSelection` へ巻き取り、重複を排除する。両者は同一 hook の別 instance を使う（選択状態は UI ごとに独立して保持される設計）。

**確認コマンド**:
```bash
# 選択ロジックが hook 経由のみであること（component 内に useState<Set> が残っていないこと）
grep -rn "useState<Set" apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx \
  apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx \
  && echo "[REVIEW: 選択 state が component に残存]" || echo "[PASS: hook 集約]"
```

### タスク 2: 失敗メッセージ純関数の分離確認（SRP / [WEEKGRD-02]）

| 観点 | Before | After | 理由 |
| --- | --- | --- | --- |
| `committed:false` 時の文言生成 | Shell の `onBulkAdd` 内にインラインで `summary` を文字列整形 | `bulk-attendance-message.ts` の `bulkFailureMessage(summary)` 純関数へ分離 | unit test 可能化（Phase 7 で 100% 目標）。例外を投げず文字列返却（純関数ガード）。Shell は呼ぶだけ |

**採否**: **採用（純関数分離・設計どおり）**。`bulkFailureMessage` は `ImportAttendanceSummary` を受け、`duplicate` / `deletedMember` / `unknownMember` / `invalid` の非 0 内訳のみを連結した文字列を返す（例: `「追加できませんでした（出席済 2 / 削除済 1）。選択を見直してください」`）。Shell からはこの関数を import して `setToast(bulkFailureMessage(summary))` のみ行う。

### タスク 3: 不変条件 #10（mutation は useAdminMutation 標準）に対する設計判断の注記

CLAUDE.md 不変条件 #10 は「admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準とする」と定める。本タスクの一括取込は以下の理由でこの標準から外れ、**`MeetingsClientShell` 内で `importAttendance` を直呼びする**設計を許容する。注記として残す（Phase 3 §2 のレビュー判定とも一致）。

| 観点 | 内容 |
| --- | --- |
| 不変条件 #10 の標準 | mutation は `useAdminMutation` でラップし、成功/失敗/refresh を統一抽象で扱う |
| 本 API の特異性 | 一括取込 endpoint は **HTTP 200 で業務的失敗（`committed:false`）を返す**（all-or-nothing）。`useAdminMutation` の `unwrap` は HTTP ステータスで成否を判定するため、200 かつ `committed:false`（attended 不変・選択保持・内訳トースト）の分岐を表現できない |
| 必要な分岐 | レスポンス本文の `committed` / `summary` を直接読み、`committed:true` のみ attended に反映、`committed:false` は `bulkFailureMessage` で内訳トースト + 選択保持（AC-6 / AC-7） |
| 既存前例 | 削除（`removeAttendance`）も `MeetingsClientShell` 内で raw に構築・処理する前例がある（SSOT §1.2 / Phase 2 §2.6）。Shell 直呼びは本コンポーネント群の確立パターン |
| 結論 | mutation 抽象に合わないため Shell 直呼びを許容。`@/lib/admin/api` の `importAttendance` を Shell から呼ぶ。legacy `@/lib/useAdminMutation`（不変条件 #10 が禁止する旧 path）は使用しない |

**採否**: **採用（Shell 直呼びを設計判断として確定・本注記で正当化）**。本注記は Phase 10 不変条件適合表・Phase 12 にも一致記録する。

**確認コマンド**:
```bash
# legacy useAdminMutation への新規参照を増やしていないこと（不変条件 #10）
grep -rn "@/lib/useAdminMutation" apps/web/src/features/admin/components/_meetings \
  && echo "[FAIL: legacy mutation path 参照]" || echo "[PASS: legacy 不使用]"
```

### タスク 4: 命名一貫性の最終確認（[FB-SDK-07-4]）

Phase 1 §5 の命名規則実測に対し、実装が整合しているか最終確認する。

| 対象 | 規約（実測） | 本タスクの命名 | 判定確認 |
| --- | --- | --- | --- |
| component | PascalCase `.tsx` | `BulkAttendanceChecklist.tsx` / `BulkAttendanceModal.tsx` / `Checkbox.tsx` | 整合 |
| hook | camelCase `useXxx.ts` | `useBulkAttendanceSelection.ts` | 整合 |
| 純関数モジュール | camelCase / kebab ファイル | `bulk-attendance-message.ts` の `bulkFailureMessage` | 整合（既存 `*-message` / `*-stats` 系に倣う） |
| web client 関数 | camelCase | `importAttendance` | 整合（`addAttendance` / `removeAttendance` と並ぶ） |
| data-testid | `bulk-attendance-*-${sessionId}` | `bulk-attendance-search-` / `-option-` / `-submit-` / `-modal-` | 整合 |
| test | `__tests__/<Name>.spec.ts(x)` | T1..T6 すべて `.spec` | 整合（不変条件 #8） |

**採否**: **確認のみ（実装が逸脱していれば修正）**。命名逸脱があれば本 Phase で是正し、なければ現状維持。

**確認コマンド**:
```bash
# testid の命名一貫性
grep -rn "data-testid" apps/web/src/features/admin/components/_meetings/BulkAttendance*.tsx \
  | grep -oE 'bulk-attendance-[a-z]+' | sort -u
# .test.* が混入していないこと（不変条件 #8）
find apps/web/src/features/admin/components/_meetings/__tests__ apps/web/src/components/ui/__tests__ \
  -name "*.test.ts" -o -name "*.test.tsx" | grep . \
  && echo "[FAIL: .test suffix]" || echo "[PASS: .spec only]"
```

### タスク 5: Checkbox primitive の責務範囲確認（SRP）

| 観点 | 確認 | 判定 |
| --- | --- | --- |
| Checkbox は presentational に閉じているか | 選択 state を持たず `checked` / `onChange` を props で受ける controlled component か | 整合（state は hook 側） |
| FormField への昇格要否 | checklist 各行は label 直結のため FormField 必須にしない。検索 input のみ FormField 経由（不変条件 #9） | 設計どおり・現状維持 |

**採否**: **確認のみ（現状維持）**。Checkbox は color トークン準拠の薄い primitive に留め、選択ロジックを混ぜない。

## 実行手順

### ステップ 1: 集約・分離の実装確認（タスク 1 / 2）

実装で choices state が component に残存していれば hook へ巻き取り、失敗メッセージ整形がインラインなら `bulk-attendance-message.ts` へ抽出する。

### ステップ 2: リファクタ後の回帰確認

```bash
# 型チェック（import パス破壊がないこと）
mise exec -- pnpm typecheck

# リント
mise exec -- pnpm lint

# focused vitest（リファクタ対象 spec を重点確認）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 設計正本 | [phase-2-design.md](phase-2-design.md) | hook 集約 / 純関数分離 / Shell 直呼び判断の根拠 |
| 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | 不変条件 #10 への Shell 直呼び許容（§2）・MINOR 指摘 |
| 要件（AC 正本） | [phase-1-requirements.md](phase-1-requirements.md) | AC-9（ロジック集約）/ AC-10（回帰なし）/ 命名規則（§5） |
| 共有コンテキスト（SSOT） | [outputs/phase-1/shared-context.md](outputs/phase-1/shared-context.md) | シグネチャ・変更ファイル一覧・命名 |
| 変更対象 hook | `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts` | 選択ロジック集約先 |
| 変更対象 純関数 | `apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts` | 失敗メッセージ整形先 |
| 変更対象 shell | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | `onBulkAdd` の Shell 直呼び |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin primitive / form 規約 |

## 成果物

| 成果物 | 種別 | 変更内容 |
| --- | --- | --- |
| `useBulkAttendanceSelection.ts` | 確認/整理 | choices state の hook 集約（AC-9・component 残存を排除） |
| `bulk-attendance-message.ts` | 確認/整理 | `bulkFailureMessage` 純関数分離（例外なし・文字列返却） |
| 本 Phase 8 仕様書 | 文書 | リファクタ対象/Before/After/理由・不変条件 #10 設計判断注記・命名最終確認 |
| リファクタリングログ | 文書 | [outputs/phase-8/refactoring-log.md](outputs/phase-8/refactoring-log.md) |

## 統合テスト連携

- Phase 9 QA で focused vitest を実行し、リファクタによる回帰がないことを確認する。
- 純関数分離（`bulk-attendance-message.ts`）により Phase 7 で 100% カバレッジを取得できる構造を保つ。
- 不変条件 #10 の Shell 直呼び判断は Phase 10 不変条件適合表・Phase 12 と一致記録する。

## 完了条件

1. 選択ロジックが `useBulkAttendanceSelection` に集約され、checklist / modal の component 内に重複 `useState<Set>` が残っていない（AC-9）。
2. 失敗メッセージ整形が `bulk-attendance-message.ts` の純関数 `bulkFailureMessage` に分離され、例外を投げず文字列を返す。
3. 不変条件 #10 に対する Shell 直呼び許容の設計判断が本文に注記されている（200 で業務失敗を返す API 特性・既存 remove 前例）。
4. 命名一貫性（PascalCase component / camelCase hook・関数 / `bulk-attendance-*` testid / `.spec` test）が確認されている。
5. `pnpm typecheck` / `pnpm lint` / focused vitest が全 green である（リファクタによる回帰なし）。
