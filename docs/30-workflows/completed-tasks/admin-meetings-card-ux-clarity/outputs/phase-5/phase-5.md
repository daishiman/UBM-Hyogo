# Phase 5: 実装仕様（CONST_005 必須）

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 5 / 13 |
| created_at | 2026-06-10 |
| 対象 branch | `feat/admin-meetings-card-ux-clarity` |
| CONST_005 適用 | 変更ファイル絶対パス / DOM diff / CSS ブロック / 実行コマンド / DoD を省略しない |
| 関連 AC | AC-1〜AC-9（全 AC の実装本体） |

## 目的

Phase 4 で RED にしたテスト（DR-1 / DR-2 / DR-3 / TL-1）を GREEN にし、AC-1〜AC-9 を満たす最小差分を実装する。**コードは書かない。本ファイルはそのまま着手できる仕様**。真因は apps/web 表現層の視覚情報設計欠如（未定義 BEM クラスの CSS 実体化欠如）であり、API / D1 / Form は不変。

## [Feedback RT-03] 新規作成 / 修正ファイルパス一覧

| # | path（絶対パス基準は worktree ルート） | 種別 | 変更概要 |
|---|---|---|---|
| F1 | `apps/web/src/styles/globals.css` | 編集（追加） | 未定義 BEM の CSS 実体化（`.admin-timeline`, `.admin-timeline__row`, `.admin-timeline__heading`, `.admin-timeline__date`, `.admin-timeline__title`, `.admin-timeline__note`, `.ui-card--flat`, `.admin-meeting-drawer`）＋汎用 primitive 新設（`.admin-detail-section*`, `.admin-attendee-list`, `.admin-attendee-row*`）。全て `var(--ubm-*)` 経由 |
| F2 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 編集 | 展開内3セクションを `.admin-detail-section` 化＋見出し付与、出席者行を `.admin-attendee-row` chrome 化、出席者見出しに `(N名)` を表示。data-testid / aria / role 不変 |
| F3 | `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | 編集 | `.ui-card--flat` 維持の確認のみ（class を剥がさない）。任意で `.admin-timeline__meta` wrapper 追加可。data-testid / aria 不変 |
| T1 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | 編集 | Phase 4 の DR-1 / DR-2 / DR-3 を append（既存ケース無改変） |
| T2 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` | 編集 | Phase 4 の TL-1 を append（既存ケース無改変） |

> **触ってはいけない**: `apps/api/**`（AC-8）/ D1 schema / Google Form / `tokens.css`（新規 token 追加禁止）/ 既存 `data-testid` / `aria-label` / `role` / `<select>` / `<button>` / `<input>`。

## 1. F1: globals.css 追加 CSS ブロック（具体実装）

### 配置先

`apps/web/src/styles/globals.css` の `@layer` 内、**1649 行目（`.admin-timeline__heading .ui-badge[data-attendance-level="high"]` ブロックの閉じ `}`）の直後、1651 行目（`.schema-grid`）の直前**に挿入する。既存の admin-timeline badge 規則群と隣接させ admin 系のまとまりを保つ。インデントは既存に合わせ **2 スペース**（`@layer` 内のため）。

### 追加するルール（全て `var(--ubm-*)` 経由・HEX 0・新規 token 0）

```css
  /* ===== admin-meetings card / drawer / attendee（admin-meetings-card-ux-clarity） ===== */

  /* 6.1 既存 BEM クラスの実体化 */
  .admin-timeline {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-3);
  }

  .admin-timeline__row {
    display: block;
  }

  .ui-card--flat {
    box-shadow: none;
    border: 1px solid var(--ubm-color-border-default);
  }

  .ui-card--flat[data-selected] {
    border-color: var(--ubm-color-accent);
    background: var(--ubm-color-accent-soft);
  }

  .admin-timeline__heading {
    display: flex;
    align-items: center;
    gap: var(--ubm-space-3);
    width: 100%;
    padding: var(--ubm-space-3) var(--ubm-space-4);
    background: transparent;
    border: 0;
    cursor: pointer;
    text-align: left;
  }

  .admin-timeline__heading:hover {
    background: var(--ubm-color-surface-panel-2);
  }

  .admin-timeline__heading:focus-visible {
    outline: 2px solid var(--ubm-color-accent);
    outline-offset: 2px;
  }

  .admin-timeline__date {
    font-variant-numeric: tabular-nums;
    color: var(--ubm-color-text-secondary);
    font-weight: 600;
  }

  .admin-timeline__title {
    font-weight: 700;
    flex: 1 1 auto;
  }

  .admin-timeline__note {
    margin: 0;
    padding: 0 var(--ubm-space-4) var(--ubm-space-3);
    color: var(--ubm-color-text-muted);
    font-size: var(--ubm-text-sm);
  }

  .admin-meeting-drawer {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-3);
    padding: var(--ubm-space-4);
    border-top: 1px solid var(--ubm-color-border-default);
    background: var(--ubm-color-surface-panel-2);
  }

  /* 6.2 新設の汎用 primitive（再利用可能） */
  .admin-detail-section {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-2);
    padding: var(--ubm-space-3);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-sm);
    background: var(--ubm-color-surface-panel);
  }

  .admin-detail-section__title {
    margin: 0;
    font-size: var(--ubm-text-sm);
    font-weight: 700;
    color: var(--ubm-color-text-secondary);
  }

  .admin-detail-section__body {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-2);
  }

  .admin-attendee-list {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-1);
  }

  .admin-attendee-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ubm-space-2);
    padding: var(--ubm-space-2) var(--ubm-space-3);
    border-radius: var(--ubm-radius-sm);
    background: var(--ubm-color-surface-bg);
  }

  .admin-attendee-row__name {
    display: flex;
    align-items: baseline;
    gap: var(--ubm-space-1);
    min-width: 0;
  }
```

> **token 実在性の確認手順（実装着手時に必須）**: 上記で参照する token（`--ubm-space-1/2/3/4`, `--ubm-radius-sm`, `--ubm-color-border-default`, `--ubm-color-border-default`, `--ubm-color-accent`, `--ubm-color-accent-soft`, `--ubm-color-text-secondary`, `--ubm-color-text-muted`, `--ubm-color-surface-panel`, `--ubm-color-surface-panel-2`, `--ubm-color-surface-bg`, `--ubm-text-sm`）が `apps/web/src/styles/tokens.css` に**実在するか grep で確認**する。未定義の token があれば、既存 globals.css 内で実利用されている近縁 token（例: badge ブロックが使う `--ubm-color-accent-soft` / `--ubm-color-accent-ink` / `--status-*-bg`）に倒す。**新規 token は追加しない**（invariant #3 / AC-7）。
> ```bash
> grep -nE -- '--ubm-(space|radius|color|text)' apps/web/src/styles/tokens.css | grep -E 'space-1|space-2|space-3|space-4|radius-sm|border-default|accent|text-secondary|text-muted|surface-panel|surface-bg|text-sm'
> ```

## 2. F2: MeetingAttendanceDrawer.tsx DOM diff（before / after）

> いずれも **className の付与・wrapper 要素・見出しの追加と表示テキストの軽微変更**のみ。`data-testid` / `data-member` / `role` / `aria-label` / `<select>` / `<button>` / `<input>` / state / handler signature は一切変更しない。

### 2.1 「編集」セクション（`<details>` を `.admin-detail-section` でラップ）

**before**（53-88 行付近）:
```tsx
<details>
  <summary>編集</summary>
  <div className="flex flex-col gap-2">
    {/* FormField 群・更新/削除ボタン（無改変） */}
  </div>
</details>
```

**after**:
```tsx
<section className="admin-detail-section">
  <details>
    <summary>編集</summary>
    <div className="admin-detail-section__body flex flex-col gap-2">
      {/* FormField 群・更新/削除ボタン（無改変） */}
    </div>
  </details>
</section>
```
- `<summary>編集</summary>` テキスト維持（DR-1 で `getByText("編集")` 対象）。
- 内部 FormField / Button の data-testid / signature 無改変。

### 2.2 「出席を追加」セクション（`role="group"` 要素を `.admin-detail-section` 化＋見出し追加）

**before**（89-120 行付近）:
```tsx
<div role="group" aria-label="出席追加" className="flex flex-wrap items-end gap-2">
  <label className="flex flex-col gap-1 text-sm">
    会員を選択
    <select data-testid={`attendance-select-${meeting.sessionId}`} ...>...</select>
  </label>
  <Button ... data-testid={`add-attendance-${meeting.sessionId}`}>出席を追加</Button>
</div>
```

**after**:
```tsx
<div role="group" aria-label="出席追加" className="admin-detail-section">
  <h4 className="admin-detail-section__title">出席を追加</h4>
  <div className="admin-detail-section__body flex flex-wrap items-end gap-2">
    <label className="flex flex-col gap-1 text-sm">
      会員を選択
      <select data-testid={`attendance-select-${meeting.sessionId}`} ...>...</select>
    </label>
    <Button ... data-testid={`add-attendance-${meeting.sessionId}`}>出席を追加</Button>
  </div>
</div>
```
- `role="group"` / `aria-label="出席追加"` / `data-testid` 維持（contract 保持）。
- 新設 `<h4 class="admin-detail-section__title">出席を追加</h4>`（DR-1 が `getByRole("heading", { name: "出席を追加" })` で取得）。ボタンの可視テキスト `出席を追加` と重複するが、**heading は `<h4>`、button は `<button>`** なので role で区別される。

### 2.3 「出席者」セクション（`.admin-detail-section` 化＋人数表示＋行 chrome）

**before**（136-168 行付近）:
```tsx
{attended.size > 0 && (
  <div>
    <h4 className="text-sm font-semibold">出席者</h4>
    <ul className="flex flex-col gap-1">
      {[...attended].sort().map((mid) => {
        const fullName = candidateNameById.get(mid);
        return (
          <li
            key={mid}
            data-testid={`attendance-attendee-${meeting.sessionId}`}
            data-member={mid}
            className="flex items-center gap-2"
          >
            <span>
              {fullName ?? mid}
              {fullName ? <span className="text-xs text-muted"> ({mid})</span> : null}
            </span>
            <Button ... data-testid={`remove-attendance-${meeting.sessionId}`} data-member={mid}>
              削除
            </Button>
          </li>
        );
      })}
    </ul>
  </div>
)}
```

**after**:
```tsx
{attended.size > 0 && (
  <div className="admin-detail-section">
    <h4 className="admin-detail-section__title">出席者 ({attended.size}名)</h4>
    <ul className="admin-attendee-list">
      {[...attended].sort().map((mid) => {
        const fullName = candidateNameById.get(mid);
        return (
          <li
            key={mid}
            data-testid={`attendance-attendee-${meeting.sessionId}`}
            data-member={mid}
            className="admin-attendee-row"
          >
            <span className="admin-attendee-row__name">
              {fullName ?? mid}
              {fullName ? <span className="text-xs text-muted"> ({mid})</span> : null}
            </span>
            <Button ... data-testid={`remove-attendance-${meeting.sessionId}`} data-member={mid}>
              削除
            </Button>
          </li>
        );
      })}
    </ul>
  </div>
)}
```
- 見出しを `出席者 ({attended.size}名)` に（DR-2 / AC-5）。`attended.size === 0` のときは既存条件 `{attended.size > 0 && (...)}` でセクションごと非表示（Phase 6 の edge guard 対象）。
- `<ul>` を `.admin-attendee-list`、各 `<li>` を `.admin-attendee-row`、氏名 `<span>` を `.admin-attendee-row__name` に（DR-3 / AC-4）。
- `data-testid="attendance-attendee-*"` / `data-member` / `remove-attendance-*` / Button の `data-member` 全維持（AC-6）。

### 2.4 一括追加（`BulkAttendanceChecklist` / `BulkAttendanceModal`）

- **二重枠回避**: `.bulk-attendance` は既にスタイル済（globals.css 198-250）。`.admin-detail-section` で囲まない（M-02・Phase 3 確定）。呼び出しは無改変。

## 3. F3: MeetingTimeline.tsx DOM diff

- `article` の `className="ui-card ui-card--flat"` は**そのまま維持**（TL-1 が class hit を検証）。F3 では class を剥がさないことが必須。
- `button.admin-timeline__heading` / `.admin-timeline__date` / `.admin-timeline__title` / badge span / `.admin-timeline__note` は既存マークアップのまま（F1 で CSS 実体化されることで視覚が整う）。
- 任意: title + badge を `<span className="admin-timeline__meta">` で軽くまとめてよい（レイアウト微調整用）。採用する場合も badge span の `data-testid="meeting-attendance-count-*"` / `data-attendance-level` を子要素として保持する。**採用しない（現状 DOM 維持）でも AC を満たす**ため、最小差分を優先し原則 F3 は class 変更なしで可。
- `data-testid="meeting-row-*"` / `attendance-list-session-*` / `meeting-attendance-count-*` / `aria-label` / `aria-expanded` 全維持。

## 4. T1 / T2 追加（Phase 4 仕様の反映）

- T1: `MeetingAttendanceDrawer.spec.tsx` に DR-1 / DR-2 / DR-3 を append（既存2ケース無改変）。期待値・query は Phase 4 §「追加テストケース仕様」を正本とする。
- T2: `MeetingTimeline.spec.tsx` に TL-1 を append（既存7ケース無改変）。

## 5. SDK 配線について（非該当の明記）

- 本タスクは純粋な表現層改修であり、`canUseTool` / preload API / `safeInvoke` / `safeOn` / IPC Bridge などの **SDK 配線は一切該当しない**。Port / service / DI 境界も新設しない。CONST 上の SDK 配線チェックは「該当なし」で確定。

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm install

# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint            # 必要時 pnpm lint --fix

# focused vitest（追加ケース + 回帰ベースライン）
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx

# design token gate
mise exec -- pnpm verify:tokens

# API 不変の検証
git diff dev -- apps/api          # 空であること（AC-8）

# 新規 HEX 0 の確認
grep -rn "bg-\[#\|text-\[#" \
  apps/web/src/features/admin/components/_meetings apps/web/src/styles/globals.css
```

## 参照資料

- `../../shared-context.md` §5 / §6（CSS 契約）/ §7（DOM 改修詳細）
- `outputs/phase-1/phase-1.md`（AC-1〜AC-10）/ `outputs/phase-2/phase-2.md`（DOM contract マッピング）/ `outputs/phase-3/phase-3.md`（M-01 / M-02）
- `outputs/phase-4/phase-4.md`（テスト期待値）
- 実コード（調査済み）: `MeetingAttendanceDrawer.tsx` / `MeetingTimeline.tsx` / `globals.css`（1630-1649 badge ブロック / 198-250 bulk-attendance / 594-636 ui-card）

## 実行手順

1. token 実在確認 grep（§1 の確認手順）。未定義があれば近縁 token に倒す。
2. F1: globals.css の 1649→1651 間に CSS ブロックを挿入。
3. F2: MeetingAttendanceDrawer.tsx の3セクション DOM diff を適用（wrapper / className / 見出し / 人数）。
4. F3: MeetingTimeline.tsx の `.ui-card--flat` 維持を確認（class を剥がさない）。
5. T1 / T2 に Phase 4 の追加ケースを append。
6. §6 のローカル実行コマンドで typecheck / lint / vitest / verify:tokens を全 GREEN にする。
7. `git diff dev -- apps/api` 空 / 新規 HEX 0 を確認。

## 統合テスト連携

- 既存4 spec を回帰ベースラインとして全 PASS 維持（AC-6）。
- API contract spec は無改変（AC-8）。

## 多角的チェック観点（AIが判断）

- **責務境界**: state 所有は `MeetingsClientShell`（不変）。F2 / F3 は view（CSS + wrapper）のみ。境界を越えない。
- **最小差分**: 既存 BEM の CSS 実体化が主、新設 primitive は汎用2系統のみ（invariant #3）。inline style を使わず token 経由 class に倒す（AC-7）。
- **contract 保持**: 全 data-testid / aria / role を維持。wrapper移動で diff 上の削除/追加が出る場合は、同一IDが追加後にも存在し focused tests で利用可能であること。
- **二重枠回避**: bulk セクションを `.admin-detail-section` で囲まない（M-02）。

## サブタスク管理

| ID | 内容 | Phase |
|---|---|---|
| F1 | globals.css CSS 実体化 + primitive 新設 | 5 |
| F2 | MeetingAttendanceDrawer.tsx 改修 | 5 |
| F3 | MeetingTimeline.tsx 確認（class 維持） | 5 |
| T1/T2 | 追加ケース append | 5（仕様は Phase 4） |

## 成果物

- `outputs/phase-5/phase-5.md`（本ファイル）

## 完了条件

- [x] [Feedback RT-03] 変更ファイルパス一覧（F1/F2/F3 + T1/T2）を提示
- [x] F1 の追加 CSS を `var(--ubm-*)` のみの実コードブロックで提示し配置先（1649→1651 間）を指定
- [x] F2 / F3 を before / after DOM diff で提示（data-testid / aria / role 保持を明示）
- [x] SDK 配線（canUseTool 等）非該当を明記
- [x] ローカル実行コマンド・API 不変 / HEX 0 検証手順を提示

## タスク100%実行確認【必須】

- [x] 関数 signature / state を改変しない方針を明記
- [x] 実在 token / data-testid に基づく（token 実在確認 grep 手順あり）
- [x] 各変更を AC に紐付け
- [x] 1 PR 完結（CONST_007）/ commit・push・PR は Phase 13 user-gated

## 次Phase

Phase 6（テスト拡充）。
