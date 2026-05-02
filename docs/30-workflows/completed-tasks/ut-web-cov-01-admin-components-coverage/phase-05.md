[実装区分: 実装仕様書]

# Phase 5: 実装ランブック — ut-web-cov-01-admin-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 5 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

Phase 2-4 の設計を反映し、test ファイルへ追加 it ケースを実装する手順を、ファイル着手順 / 具体的 it 名 / 推定行数で確定する。

## 変更対象ファイル一覧

| # | パス | 変更種別 | 推定追加行数 |
| - | --- | --- | --- |
| 1 | `apps/web/src/components/admin/__tests__/MembersClient.test.tsx` | 編集 | +25 |
| 2 | `apps/web/src/components/admin/__tests__/TagQueuePanel.test.tsx` | 編集 | +50 |
| 3 | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` | 編集 | +110 |
| 4 | `apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx` | 編集 | +180 |
| 5 | `apps/web/src/components/admin/__tests__/MeetingPanel.test.tsx` | 編集 | +90 |
| 6 | `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` | 編集 | +70 |
| 7 | `apps/web/src/components/layout/__tests__/AdminSidebar.test.tsx` | 編集 | +15（任意） |

合計推定: 約 540 行

## 着手順（依存少 → 多）

1. **MembersClient** （最小・追加 1 件）
2. **AdminSidebar** （任意 1 件）
3. **TagQueuePanel** （+2 件）
4. **SchemaDiffPanel** （+4 件）
5. **MeetingPanel** （+3 件）
6. **AuditLogPanel** （+3 件）
7. **MemberDrawer** （+7 件、最も影響範囲大）

各 component 完了ごとに `pnpm --filter @ubm-hyogo/web test src/components/admin/__tests__/<file>` を実行し regression なし確認。

## 具体的 it ケース名

### 1. MembersClient.test.tsx
- `it("filter='hidden' で hidden ボタンが aria-pressed=true", ...)`

### 2. AdminSidebar.test.tsx
- `it("管理メニュー nav が aria-label 付きで存在する (accessibility)", ...)`
- `it("7 件のリンクをラベルと href の組で全件レンダーする", ...)`

### 3. TagQueuePanel.test.tsx
- `it("rejected mutation 後 toast=却下完了 を表示し refresh が呼ばれる", ...)`
- `it("status=rejected の行は approve/reject ボタンが両方 disabled", ...)`

### 4. SchemaDiffPanel.test.tsx
- `it("stableKey 既存値あり suggested なしで input defaultValue が既存値", ...)`
- `it("空白のみ stableKey で submit 押下時 fetch を呼ばない", ...)`
- `it("active=null の状態で onSubmit を実行しても fetch を呼ばない", ...)`
- `it("onSelect 後に直前の toast がクリアされる", ...)`

### 5. MeetingPanel.test.tsx
- `it("attended state の member を再 add しても addAttendance は 2 回目呼ばれない", ...)`
- `it("複数 sessionId で pickedMember/attended state が独立する", ...)`
- `it("createMeeting 実行中は submit ボタンが disabled", ...)`

### 6. AuditLogPanel.test.tsx
- `it("isPiiKey が kebab-case (user-email) と snake_case (user_email) を共に検出", ...)`
- `it("PHONE_PATTERN は 8 文字未満を mask しない", ...)`
- `it("配列要素オブジェクト内の PII フィールドが mask される", ...)`

### 7. MemberDrawer.test.tsx
- `it("postMemberNote reject 時に error message を表示", ...)`
- `it("restoreMember reject 時に error message を表示", ...)`
- `it("削除確認 dialog で cancel すると削除 fetch が呼ばれない", ...)`
- `it("fetch throw を catch して error 表示", ...)`
- `it("メモが空白だけの場合 onPostNote を呼ばない", ...)`
- `it("editResponseUrl ありで anchor が target=_blank rel=noopener", ...)`
- `it("editResponseUrl なしで Form 回答編集 link が表示されない", ...)`

## 主要構造（共通テンプレ）

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
```

## 入力・出力・副作用

- 入力: 各 it 内で fixture を inline 構築
- 出力: DOM 要素・mock call 引数の assertion
- 副作用: pushMock / refreshMock / mocked api functions

## テスト方針

- 既存ケースの fixture を可能な限り再利用
- mockResolvedValueOnce / mockRejectedValueOnce で per-it 制御
- userEvent v14 の async API を `await` で待機

## ローカル実行・検証コマンド

```bash
# 着手中ファイル
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/admin/__tests__/MemberDrawer.test.tsx

# 全 web test
mise exec -- pnpm --filter @ubm-hyogo/web test

# coverage（Phase 11 evidence）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

## 完了条件 (DoD)

- 7 ファイルすべての追加 it が PASS
- `pnpm --filter @ubm-hyogo/web test` が green
- `pnpm --filter @ubm-hyogo/web test:coverage` で対象 7 component が Stmts/Lines/Funcs ≥85% / Branches ≥80%
- 既存テスト regression なし

## サブタスク管理

- [ ] MembersClient 追加完了
- [ ] AdminSidebar 追加完了
- [ ] TagQueuePanel 追加完了
- [ ] SchemaDiffPanel 追加完了
- [ ] MeetingPanel 追加完了
- [ ] AuditLogPanel 追加完了
- [ ] MemberDrawer 追加完了
- [ ] coverage threshold 達成確認
- [ ] outputs/phase-05/main.md 作成

## 次 Phase への引き渡し

Phase 6 へ、各 component の異常系/エッジケース網羅性レビューを依頼する。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-11/vitest-run.log`
- `outputs/phase-11/coverage-target-files.txt`

## 成果物/実行手順

- 成果物: `outputs/phase-05/main.md`
- 実行手順: 本 Phase の変更対象と検証コマンドを確認し、結果を outputs に記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
