# Phase 2 output: UI 状態機械

[実装区分: 実装仕様書]

## SchemaDiffPanel 新規 component

### `<SchemaDiffPanel.HistoryPane>`

- 同ファイル内の内部 component（外部 export しない）
- props: `aliases: ResolvedAlias[]`
- 表示: 直近 10 件の resolved alias を `<ul role="list">` で表示
- 各行: alias label / stableKey / resolvedAt / actor / `<button>rollback</button>`
- token: `bg-surface` / `text-foreground` / `border-border`

### `<RollbackConfirmModal>`

- focus trap 必須
- 表示項目:
  - alias label / stableKey / resolvedAt / resolver email
  - 影響応答件数（`affectedResponseCount`）
  - 再集計要否 warning（`text-warning-foreground`）
  - 「再集計実行は本タスク外」明示文
  - actor email 再表示（自分が rollback しようとしていることの確認）
  - `<button>キャンセル</button>` / `<button>取り消す</button>`
- token: `bg-surface` / `border-border` / `bg-warning-soft`

### `<UndoToast>`

- resolve 完了直後 5 分間表示
- `<button>取消</button>` link を含む
- `setTimeout(() => setUndoState({kind:"hidden"}), 5 * 60 * 1000)`
- aria-live=polite

## 状態遷移

```
[HistoryPane] idle
  ├── rollback click → confirm_modal
  │     ├── confirm → calling_api → success / error
  │     └── cancel → idle
  └── -

[Toast] resolve_success
  ├── undo click → calling_api (rollback path) → success / error
  ├── 5min timeout → hidden
  └── dismiss → hidden
```

## RollbackModalState 型

```ts
type RollbackModalState =
  | { kind: "idle" }
  | { kind: "confirm"; alias: ResolvedAlias; impact: ImpactInfo | "loading" }
  | { kind: "calling"; alias: ResolvedAlias }
  | { kind: "error"; alias: ResolvedAlias; status: number; message: string };

type UndoState =
  | { kind: "hidden" }
  | { kind: "available"; alias: ResolvedAlias; expiresAt: number };

interface ImpactInfo {
  affectedResponseCount: number;
  recomputeRequired: boolean;
}

interface ResolvedAlias {
  id: string;
  revisionId: string;
  stableKey: string;
  aliasQuestionId: string;
  aliasLabel: string;
  resolvedAt: string;
  resolvedBy: string;
  version: number;
}
```

## API 呼出経路

- helper: `lib/admin/api.ts#rollbackSchemaAlias`
- mutation hook: `@/features/admin/hooks/useAdminMutation`（CLAUDE.md #10）
- error handling: 409 → reload prompt / 404 → already-deleted toast / 500 → retry prompt

## a11y

- rollback button `aria-label="alias <label> の resolve を取り消す"`
- modal `role="dialog" aria-modal="true" aria-labelledby="rollback-title"`
- focus trap: tab で modal 内ループ、Escape で cancel
- undo toast: `role="status" aria-live="polite"`

## visual baseline (Phase 11)

screenshots を 4 screens (desktop-light / desktop-dark / mobile-light / mobile-dark) で記録:
- HistoryPane（resolved 3 件）
- RollbackConfirmModal（recomputeRequired=true）
- UndoToast 表示中
- Error state（409 後の reload prompt）
