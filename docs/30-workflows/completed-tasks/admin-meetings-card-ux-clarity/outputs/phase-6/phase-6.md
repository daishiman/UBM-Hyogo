# Phase 6: テスト拡充（fail path / 回帰 guard）

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 6 / 13 |
| created_at | 2026-06-10 |
| 対象 branch | `feat/admin-meetings-card-ux-clarity` |
| 関連 AC | AC-4 / AC-5 / AC-6 / AC-10 |
| 関連 MINOR | M-01（Phase 4 確認済）/ M-02（Phase 5 で二重枠回避） |

## 目的

Phase 4 の happy path（DR-1 / DR-2 / DR-3 / TL-1）に加え、**edge / fail path / 回帰 guard** を拡充し、Phase 5 の wrapper 追加・見出し変更が境界条件・既存 contract を壊さないことを機械的に保証する。jsdom 制約（CSS / @media 非評価・視覚 assert 禁止）は Phase 4 と同一で継続。

## jsdom 制約（再掲・継続）

- 構造（class 付与 / 見出しテキスト / 人数 / role / data-testid）のみ検証。
- 視覚（px / 色 / box-shadow / @media レスポンシブ）は assert しない。それらは Phase 11 staging screenshot（user-gated）で人手検証。

## 実行タスク（追加ケース）

### EDGE-1: 出席者0名のとき出席者セクションが非表示を維持する

- **目的**: AC-4 / AC-5 の境界。`{attended.size > 0 && (...)}` の条件が Phase 5 の `.admin-detail-section` 化後も維持されることの回帰 guard。
- **配置先**: `MeetingAttendanceDrawer.spec.tsx`（T1）。
- **render**: `attended={new Set()}`（空集合）。candidates は任意（`[{ memberId: "m_1", fullName: "山田 太郎" }]` でもよい）。
- **期待値**:
  - 出席者見出し（`出席者`）が**存在しない**。
  - 出席者行 `.admin-attendee-row` が**存在しない**。
  - 出席者行 `data-testid="attendance-attendee-*"` が**存在しない**。
- **query / assert 例**:
  ```tsx
  const { container } = render(
    <MeetingAttendanceDrawer meeting={meeting} candidates={[]} attended={new Set()} ... />,
  );
  expect(screen.queryByRole("heading", { name: /出席者/ })).toBeNull();
  expect(screen.queryByTestId("attendance-attendee-sess-1")).toBeNull();
  expect(container.querySelector(".admin-attendee-row")).toBeNull();
  ```
- 注意: `queryBy*`（hit 0 で `null` を返す）を使う（`getBy*` は throw する）。

### EDGE-2: 出席者複数名のとき人数 `(N名)` が件数に追従する

- **目的**: AC-5。`attended.size` の反映を複数件で固定（DR-2 の単数だけでなく境界外の値を担保）。
- **配置先**: `MeetingAttendanceDrawer.spec.tsx`（T1）。
- **render**: `attended={new Set(["m_1", "m_2", "m_3"])}`、candidates は3件以上渡す。
- **期待値**: 見出し `textContent` が `(3名)` を含む。出席者行が3つ描画される。
- **assert 例**:
  ```tsx
  const heading = screen.getByRole("heading", { name: /出席者/ });
  expect(heading.textContent).toContain("(3名)");
  expect(screen.getAllByTestId("attendance-attendee-sess-1")).toHaveLength(3);
  ```
- 注意: `getAllByTestId` は同一 testid が複数あるとき配列を返す（行は全 `attendance-attendee-${sessionId}` で同一 testid のため `getAllBy*` が正しい）。

### EDGE-3: 候補外 memberId の出席者でも行 chrome と削除導線が保持される

- **目的**: AC-4 / AC-6。氏名解決できない memberId（`candidateNameById` miss）でも `.admin-attendee-row` / `remove-attendance-*` が付くこと。既存 spec「候補にない出席者は memberId を表示する」を拡張。
- **配置先**: `MeetingAttendanceDrawer.spec.tsx`（T1）。
- **render**: `candidates={[]}`、`attended={new Set(["m_unknown"])}`。
- **期待値**:
  - 行 `data-testid="attendance-attendee-sess-1"` に `.admin-attendee-row` class が付く。
  - 行 `textContent` に `m_unknown` を含む（氏名 fallback）。
  - 削除ボタン `data-testid="remove-attendance-sess-1"` / `data-member="m_unknown"` が存在。
- **assert 例**:
  ```tsx
  const row = screen.getByTestId("attendance-attendee-sess-1");
  expect(row.classList.contains("admin-attendee-row")).toBe(true);
  expect(row.textContent).toContain("m_unknown");
  const remove = screen.getByTestId("remove-attendance-sess-1");
  expect(remove.getAttribute("data-member")).toBe("m_unknown");
  ```

### EDGE-4: 「出席を追加」見出しと操作 button が role で区別される（contract 回帰 guard）

- **目的**: AC-3 / AC-6。新設見出し `<h4>出席を追加</h4>` を追加しても既存の「出席を追加」**操作ボタン**（`data-testid="add-attendance-*"`）が壊れないこと。同一文言の heading / button 共存の回帰 guard。
- **配置先**: `MeetingAttendanceDrawer.spec.tsx`（T1）。
- **render**: 基本 props（`attended={new Set()}` でも可・出席追加 group は常時描画）。
- **期待値**:
  - heading: `screen.getByRole("heading", { name: "出席を追加" })` が hit。
  - button: `screen.getByTestId("add-attendance-sess-1")` が hit し `tagName === "BUTTON"`。
  - `role="group"` / `aria-label="出席追加"` 要素が存在。
- **assert 例**:
  ```tsx
  expect(screen.getByRole("heading", { name: "出席を追加" })).toBeTruthy();
  const addBtn = screen.getByTestId("add-attendance-sess-1");
  expect(addBtn.tagName).toBe("BUTTON");
  expect(screen.getByRole("group", { name: "出席追加" })).toBeTruthy();
  ```

### EDGE-5: select / 編集セクションの contract 保持（回帰 guard）

- **目的**: AC-6。F2 の wrapper 追加で `<select>` / 編集 FormField の testid が剥がれないこと。
- **配置先**: `MeetingAttendanceDrawer.spec.tsx`（T1）。
- **期待値**: `data-testid="attendance-select-sess-1"` の `<select>` が存在し、`<summary>編集</summary>` が存在する。
- **assert 例**:
  ```tsx
  expect(screen.getByTestId("attendance-select-sess-1").tagName).toBe("SELECT");
  expect(screen.getByText("編集")).toBeTruthy();
  ```

### EDGE-6: 選択中カードの `data-selected` 属性保持（Timeline 回帰 guard）

- **目的**: AC-1 / AC-6。`selectedId` 一致時に article へ `data-selected` が付くこと（F1 の `.ui-card--flat[data-selected]` 強調が効く前提の構造）。`MeetingTimeline.tsx:45` の `data-selected={isSelected || undefined}` を回帰 guard。
- **配置先**: `MeetingTimeline.spec.tsx`（T2）。
- **render**: `items={[item]}`, `selectedId="sess-1"`。
- **期待値**: `attendance-list-session-sess-1` の article に `data-selected` 属性が存在。非選択時（`selectedId={null}`）は属性が無い。
- **assert 例**:
  ```tsx
  render(<MeetingTimeline items={[item]} selectedId="sess-1" onSelect={() => {}} />);
  expect(screen.getByTestId("attendance-list-session-sess-1").hasAttribute("data-selected")).toBe(true);
  // 非選択
  cleanup();
  render(<MeetingTimeline items={[item]} selectedId={null} onSelect={() => {}} />);
  expect(screen.getByTestId("attendance-list-session-sess-1").hasAttribute("data-selected")).toBe(false);
  ```

## 回帰ベースライン（破壊しないこと）

| spec | 検証維持事項 |
|---|---|
| `MeetingsClientShell.spec.tsx` | 一括追加 commit / state / toast。F2 の wrapper 追加で `BulkAttendanceChecklist` 呼び出しが壊れない |
| `MeetingTimeline.spec.tsx`（既存7） | empty / badge / onSelect / data-attendance-level |
| `MeetingAttendanceDrawer.spec.tsx`（既存2） | 出席者氏名 / ID 表示・候補外 memberId |
| `BulkAttendanceChecklist.spec.tsx` | 複数選択→一括→選択解除 |

## 参照資料

- `outputs/phase-4/phase-4.md`（happy path 期待値）/ `outputs/phase-5/phase-5.md`（DOM diff）
- `outputs/phase-3/phase-3.md`（M-01 / M-02）
- 実コード: `MeetingAttendanceDrawer.tsx`（136-168 出席者ブロック / 89-120 出席追加 group）/ `MeetingTimeline.tsx`（45 `data-selected`）

## 実行手順

1. EDGE-1〜EDGE-6 を T1 / T2 に append（既存・Phase 4 追加分を無改変で残す）。
2. focused vitest を実行し全 GREEN を確認。
3. 回帰ベースライン4 spec も同時実行し全 PASS を確認。

実行コマンド:

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx
```

## 統合テスト連携

- 拡充ケースは既存 spec ファイルに append。新規 spec ファイルは作らない（`*.spec.tsx` invariant #8 維持）。
- API contract spec 無改変（AC-8）。

## 多角的チェック観点（AIが判断）

- **fail / edge 網羅**: 0名（非表示）/ 複数名（人数追従）/ 候補外 memberId / 同一文言 heading・button 共存 / select 保持 / data-selected の各境界を guard。
- **[VSCPKR-03] external prop 駆動**: 全ケースで `attended` / `candidates` / `items` / `selectedId` を変えて render するだけ。internal state 操作なし。
- **脆さ回避**: `queryBy*`（非存在）/ `getAllBy*`（複数）/ `hasAttribute` / `classList.contains` を適切に使い分け、深い DOM 階層に依存しない。
- **private method 非該当**: 表現層のため対象なし（Phase 4 と同じ）。

## サブタスク管理

| ID | 内容 | 対象 |
|---|---|---|
| EDGE-1 | 0名で出席者セクション非表示 | T1 |
| EDGE-2 | 複数名で `(N名)` 追従 | T1 |
| EDGE-3 | 候補外 memberId の行 chrome / 削除導線 | T1 |
| EDGE-4 | 見出し / 操作ボタン role 区別 | T1 |
| EDGE-5 | select / 編集 contract 保持 | T1 |
| EDGE-6 | data-selected 属性保持 | T2 |

## 成果物

- `outputs/phase-6/phase-6.md`（本ファイル）

## 完了条件

- [x] 0名時の出席者セクション非表示 edge（EDGE-1）を追加
- [x] 複数名 / 候補外 / 同一文言 / contract 保持の fail-path・回帰 guard を追加
- [x] jsdom 制約継続（視覚 assert 禁止）を明記
- [x] queryBy / getAllBy / hasAttribute の使い分けを具体化
- [x] 回帰ベースライン4 spec の非破壊を明記

## タスク100%実行確認【必須】

- [x] 実在 data-testid / role に基づく
- [x] 各 edge を AC に紐付け
- [x] external prop 駆動・private method 非該当を明記

## 次Phase

Phase 7（カバレッジ確認）。
