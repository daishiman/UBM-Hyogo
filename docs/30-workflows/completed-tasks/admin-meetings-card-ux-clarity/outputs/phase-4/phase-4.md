# Phase 4: テスト作成（TDD 設計）

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 4 / 13 |
| created_at | 2026-06-10 |
| taskType | implementation |
| 実装区分 | `[実装区分: 実装仕様書]`（VISUAL UI task） |
| 対象 branch | `feat/admin-meetings-card-ux-clarity` |
| 関連 AC | AC-3 / AC-4 / AC-5 / AC-6 / AC-10（一部 AC-1 / AC-2 の構造側面） |
| 関連 MINOR | M-01（Phase 3 起票・本 Phase で確認） |

## 目的

実装（Phase 5）に先立ち、追加テストケースの**期待値・query 方法・配置先**を確定する。本タスクは純粋な表現層（CSS + wrapper 付与）改修であるため、テストは**構造検証のみ**に限定し、視覚（px / 色 / 影 / @media）を一切 assert しない。SSOT は `../../shared-context.md` §9。

## jsdom 制約の明示（最重要・本 Phase の前提）

- **jsdom は CSS / `@media` を評価しない**。`getComputedStyle` で色・余白・影・gap の実値を取得しても CSS は適用されないため、**視覚（px / 色 / box-shadow / レスポンシブ）を assert してはならない**。
- したがって本 Phase で追加するテストは以下のみを検証する:
  - **className の付与**（`element.classList.contains(...)` / `container.querySelector(".admin-attendee-row")` の hit）
  - **見出しテキストの存在**（`getByRole("heading", ...)` / `textContent` の部分一致）
  - **出席者人数の表示**（`(N名)` 文字列が見出しに含まれる）
  - **既存 `role` / `data-testid` / `data-member` の保持**
- 視覚的に「分離されているか」「影が消えたか」「余白が十分か」（AC-1 / AC-2 の見た目側面）は **Phase 11 の staging screenshot（user-gated）で人手検証**する。jsdom では検証しない。

## 実行タスク

| ID | 内容 | 対象ファイル |
|---|---|---|
| T4-1 | M-01 確認: 既存 spec が `出席者` 文字列で heading を query していないか調査し結果を記録 | （調査・本ファイルに記録） |
| T4-2 | DR-1 / DR-2 / DR-3 を `MeetingAttendanceDrawer.spec.tsx`（T1）に追加 | `__tests__/MeetingAttendanceDrawer.spec.tsx` |
| T4-3 | TL-1 を `MeetingTimeline.spec.tsx`（T2）に追加 | `__tests__/MeetingTimeline.spec.tsx` |
| T4-4 | 既存 4 spec を回帰ベースラインとして破壊しないことを確認 | 既存 spec 群 |

> Phase 4 は**テスト先行設計**。実 DOM 改修は Phase 5。追加ケースは実装前は RED（または未定義 class で hit 0）になる想定で、Phase 5 完了後に GREEN へ転じる。

## M-01 確認結果（T4-1・実コード調査済み）

**結論: 出席者見出しの文字列を `出席者` → `出席者 (N名)` に変更しても、既存 spec の assert に当たらない（安全）。**

調査根拠（`apps/web/src/features/admin/components/_meetings/__tests__/` 実 Read）:

| spec | `出席者` 文字列で heading を query しているか | query 手段 |
|---|---|---|
| `MeetingAttendanceDrawer.spec.tsx` | **No** | `screen.getByTestId("attendance-attendee-sess-1")` の `textContent` で氏名・memberId を検証。見出しテキスト `出席者` には一切依存しない |
| `MeetingTimeline.spec.tsx` | **No** | `getByTestId` / `getByRole("button", { name: /…の出席を記録・編集/ })` / `data-attendance-level` 属性。出席者見出し文字列に依存しない |

→ 見出しを `出席者 (${attended.size}名)` に変更しても既存 2 spec は破壊されない。M-01 は「部分一致への書き換え不要」で解決。追加の DR-2 は `(N名)` を**新規 assert**として追加する（既存 assert の改変ではない）。

## 追加テストケース仕様

### T1: `MeetingAttendanceDrawer.spec.tsx`（DR-1 / DR-2 / DR-3）

共通 render 前提（既存 spec と同型・external prop 駆動）:

```tsx
render(
  <MeetingAttendanceDrawer
    meeting={meeting}                                  // sessionId: "sess-1"
    candidates={[{ memberId: "m_1", fullName: "山田 太郎" }]}
    attended={new Set(["m_1"])}                        // ← DR-2/DR-3 用に人数を制御
    onAddAttendance={vi.fn()}
    onBulkAddAttendance={vi.fn()}
    onRemoveAttendance={vi.fn()}
    onUpdateMeeting={vi.fn()}
    onSoftDelete={vi.fn()}
  />,
);
```

#### DR-1: 展開ドロワーに3セクション見出しが存在する

- **目的**: AC-3（編集 / 出席を追加 / 出席者 がサブカードとして見出し付き）。
- **期待値**: 「編集」「出席を追加」「出席者」の3見出しが描画される。
- **query 方法**:
  - 「編集」: `<summary>編集</summary>`（既存）。`screen.getByText("編集")` で hit。
  - 「出席を追加」: 新設 `<h4 class="admin-detail-section__title">出席を追加</h4>`。`screen.getByRole("heading", { name: "出席を追加" })` で取得。
  - 「出席者」: 新設 `<h4 class="admin-detail-section__title">出席者 (1名)</h4>`。`screen.getByRole("heading", { name: /出席者/ })` で部分一致取得（DR-2 と兼用可）。
- **assert 例**:
  ```tsx
  expect(screen.getByText("編集")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "出席を追加" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: /出席者/ })).toBeTruthy();
  ```
- 注意: 「出席を追加」ボタン（`data-testid="add-attendance-sess-1"`・既存）も同じ文字列 `出席を追加` を持つため、見出しは `getByRole("heading", ...)` で **button と区別**して取得する（`getByText` だと複数 hit する可能性に注意）。

#### DR-2: 出席者見出しに人数 `(N名)` が表示される

- **目的**: AC-5（人数表示）。`attended.size` を反映。
- **期待値**: `attended = new Set(["m_1"])` のとき見出しに `(1名)` を含む。
- **query 方法**: `screen.getByRole("heading", { name: /出席者/ })` で見出し要素を取得し `textContent` を検証。
- **assert 例**:
  ```tsx
  const heading = screen.getByRole("heading", { name: /出席者/ });
  expect(heading.textContent).toContain("(1名)");
  ```
- **複数人版**（同一 it 内 or 追加 it）: `attended={new Set(["m_1", "m_2"])}`（candidates も2件渡す）で `(2名)` を確認する。これにより `attended.size` 反映を担保する。

#### DR-3: 各出席者行に `.admin-attendee-row` が付与され、既存 data-testid を保持する

- **目的**: AC-4（行リスト chrome）+ AC-6（contract 保持）。
- **期待値**:
  - 各 `<li>` に `admin-attendee-row` class が付与される。
  - `data-testid="attendance-attendee-sess-1"` / `data-member="m_1"` が `<li>` に保持される。
  - 削除ボタン `data-testid="remove-attendance-sess-1"` / `data-member="m_1"` が保持される。
- **query 方法**: `screen.getByTestId("attendance-attendee-sess-1")` で行要素を取得し class / 属性を検証。`container.querySelector(".admin-attendee-row")` でも class hit を補強。
- **assert 例**:
  ```tsx
  const row = screen.getByTestId("attendance-attendee-sess-1");
  expect(row.classList.contains("admin-attendee-row")).toBe(true);
  expect(row.getAttribute("data-member")).toBe("m_1");
  const remove = screen.getByTestId("remove-attendance-sess-1");
  expect(remove.getAttribute("data-member")).toBe("m_1");
  // class hit の補強（render 結果の container 経由）
  const { container } = render(/* 同上 props */);
  expect(container.querySelector(".admin-attendee-row")).not.toBeNull();
  ```
- 注意: `container.querySelector` を使う場合は `render` の戻り値から `container` を取得する（`screen` には querySelector が無い）。afterEach cleanup を維持。

### T2: `MeetingTimeline.spec.tsx`（TL-1）

共通 render 前提（external prop `items` / `selectedId` 駆動）:

```tsx
const item: MeetingItem = {
  sessionId: "sess-1",
  title: "第1回",
  heldOn: "2025-04-01",
  note: null,
  createdAt: "2025-01-01T00:00:00Z",
};
```

#### TL-1: 各カードに `.ui-card--flat` が付与され、既存 data-testid を保持する

- **目的**: AC-1（カード分離の構造側面）+ AC-6（contract 保持）。
- **期待値**:
  - `article` に `ui-card` と `ui-card--flat` class が付与される。
  - `data-testid="attendance-list-session-sess-1"`（article）/ `meeting-row-sess-1`（li）/ `meeting-attendance-count-sess-1`（badge）が保持される。
- **query 方法**: `screen.getByTestId("attendance-list-session-sess-1")` で article を取得し class を検証。`data-testid` の保持は既存 testid を `getByTestId` で取得できることで担保。
- **assert 例**:
  ```tsx
  render(<MeetingTimeline items={[item]} selectedId={null} onSelect={() => {}} />);
  const card = screen.getByTestId("attendance-list-session-sess-1");
  expect(card.classList.contains("ui-card")).toBe(true);
  expect(card.classList.contains("ui-card--flat")).toBe(true);
  expect(screen.getByTestId("meeting-row-sess-1")).toBeTruthy();
  expect(screen.getByTestId("meeting-attendance-count-sess-1")).toBeTruthy();
  ```
- 注意: `.ui-card--flat` は実コードで既にマークアップに存在する（`MeetingTimeline.tsx:46` `className="ui-card ui-card--flat"`）。TL-1 は **CSS 実体化後も class が剥がれないこと**の回帰 guard であり、F3 で class を消さないことを保証する。

## 参照資料

- `../../shared-context.md` §9（テスト方針）/ §5（変更対象）/ §7（DOM 改修詳細）
- `outputs/phase-1/phase-1.md`（AC-1〜AC-10）
- `outputs/phase-2/phase-2.md`（[VSCPKR-03] props vs internal state / DOM contract マッピング）
- `outputs/phase-3/phase-3.md`（M-01 / M-02 追跡）
- 実コード（調査済み）:
  - `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx`
  - `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx`
  - `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx`
  - `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx`

## 実行手順

1. T4-1（M-01 確認）を実施・本ファイルに記録（**完了済み**: 既存 spec は `出席者` 文字列で heading を query していない）。
2. T1 に DR-1 / DR-2 / DR-3 を `it()` として append（既存2ケースは無改変で残す）。
3. T2 に TL-1 を `it()` として append（既存7ケースは無改変で残す）。
4. 実装前にテストを実行し、DR-1（「出席を追加」heading）/ DR-3（`.admin-attendee-row`）/ DR-2（`(N名)`）が RED であることを確認（heading / class / 人数表記が未実装のため）。TL-1 は `.ui-card--flat` が既存マークアップにあるため実装前から GREEN になり得る（回帰 guard 用途）。
5. RED の確認結果を Phase 5 着手の根拠とする。

実行コマンド（worktree ルートから）:

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx
```

## 統合テスト連携

- 既存4 spec を**回帰ベースライン**とする。本 Phase で破壊しないことが前提:
  - `MeetingsClientShell.spec.tsx`（一括追加 commit / state / toast）
  - `MeetingTimeline.spec.tsx`（empty / badge / onSelect / attendance-level）
  - `MeetingAttendanceDrawer.spec.tsx`（出席者氏名 / ID 表示・候補外 memberId）
  - `BulkAttendanceChecklist.spec.tsx`（複数選択→一括→選択解除）
- API contract spec（`meetings.contract.spec.ts` 等）は**変更しない**（API 不変・AC-8 の裏付け）。

## 多角的チェック観点（AIが判断）

- **[VSCPKR-03] 操作対象は external prop**: DR-1〜DR-3 は `attended`（`ReadonlySet`）/ `candidates` を、TL-1 は `items` / `selectedId` を渡して render する。**internal state（`picked` / `editTitle` 等）のトグルは不要**。見出し・行 chrome・card class はいずれも props から静的に決まる構造であり、state 操作 fixture は作らない。
- **private method テスト方針は本タスク非該当**: 本タスクは純粋な表現層（CSS 実体化 + wrapper className 付与）であり、テスト対象に private method / 内部関数 / safeInvoke 等の境界 API は存在しない。private method 単体テストの検討は不要（該当なし）。
- **脆い assert の禁止**: textContent 完全一致や DOM 階層の深い構造に依存せず、`getByRole` / `getByTestId` / class hit に限定する。視覚（色 / px）は assert しない（jsdom 制約）。
- **回帰 guard の意図**: TL-1 / DR-3 は「既存 data-testid を Phase 5 の wrapper 追加で誤って剥がさない」ことの機械的 guard。

## サブタスク管理

| ID | 内容 | 状態 |
|---|---|---|
| T4-1 | M-01 確認（既存 spec の heading query 調査） | 完了（本ファイルに記録） |
| T4-2 | DR-1 / DR-2 / DR-3 仕様確定 | 完了 |
| T4-3 | TL-1 仕様確定 | 完了 |
| T4-4 | 回帰ベースライン4 spec の非破壊方針確定 | 完了 |

## 成果物

- `outputs/phase-4/phase-4.md`（本ファイル）

## 完了条件

- [x] jsdom 制約（CSS / @media 非評価・視覚 assert 禁止）を明記
- [x] DR-1 / DR-2 / DR-3 / TL-1 の期待値・query 方法（getByRole / getByTestId / container.querySelector）を具体化
- [x] [VSCPKR-03] external prop 駆動を明記
- [x] private method テスト非該当を明記
- [x] M-01 を実コード調査で確認し結果を記録（heading は `出席者` 文字列 query なし → 安全）
- [x] 既存4 spec を回帰ベースラインとし破壊しない方針を明記

## タスク100%実行確認【必須】

- [x] テストケースの query 手段を実在 data-testid / role に基づき記述
- [x] 推測で存在しないファイル / testid を書いていない
- [x] 各ケースを AC に紐付け（DR-1=AC-3 / DR-2=AC-5 / DR-3=AC-4,AC-6 / TL-1=AC-1,AC-6）
- [x] 実装前 RED / 回帰 guard の区別を明記

## 次Phase

Phase 5（実装）。
