# 実装ガイド — issue-837-schema-alias-bulk-rollback

本ガイドは Issue #837「schema alias 複数一括 rollback」の実装ガイドである。Part 1（初学者・中学生レベル）と Part 2（開発者・技術者レベル）の 2 部構成で、末尾に VISUAL タスクの視覚証跡計画を記す。

> 本タスクは automation-30 再検証で `implemented_local_evidence_captured` に再分類済み。実コード・focused tests・typecheck は本サイクルで完了し、runtime screenshot / staging smoke は user-gated evidence として残す。

---

## Part 1: やさしい説明（中学生レベル）

### なぜ必要か（先に「困りごと」から）

学校の連絡フォーム（みんなが回答する Google フォーム）を、先生が項目名（「クラス」→「学年・組」など）を書き換えることがあります。書き換えると、古い項目名と新しい項目名を「同じ意味だよ」とコンピューターに教えてあげる作業（これを「確定（resolve）」と呼びます）が必要になります。

ところが、まとめてたくさんの項目を「確定」したあとで「やっぱり間違えた、全部もとに戻したい」となることがあります。今までは **1 件ずつ「戻す」ボタンを押して、毎回「本当に戻していい?」の確認窓を閉じる** 必要がありました。30 件あると 10 分以上かかってしまいます。

### 何をするか（買い物カゴの例え）

ネットショッピングで、カゴにたくさん商品を入れたあとに「やっぱり今日は買わない」と思ったら、商品を 1 個ずつ戻すより **「カゴを空にする（まとめて戻す）」ボタン** があると一瞬で済みますよね。

このタスクで作るのは、まさにその「まとめて戻す」ボタンです。

- **一括確定（bulk resolve）**: すでにある機能。複数の項目を「同じ意味だよ」とまとめて確定する。
- **一括取り消し（bulk rollback）**: 今回つくる機能。確定したものを **まとめて取り消す**（一括確定のちょうど逆の操作）。

### どう使うか（操作の流れ）

1. 確定済みの履歴が並んでいる画面で「まとめて取り消し」モードに切り替えます。
2. 戻したい項目に **チェックを付けます**（「全部選ぶ」ボタンもあります）。今「8 件えらんでいるよ」とバッジで教えてくれます。
3. 「一括取消」ボタンを押すと、確認の窓が開きます。何件・どの項目を戻すか、影響する回答が何件あるかが表示されます。
4. 「実行」を押すと、選んだ項目を **1 件ずつ順番に**（でも自動で）戻していきます。進み具合がその場で見えます。
5. 全部うまく戻せたら窓が閉じて画面が最新になります。一部だけ失敗したら、**成功した分はそのまま戻し、失敗した分だけ理由付きで残して** 「もう一度やり直す」ボタンを出します。

### 安全のための工夫

- 一度に戻せるのは **最大 50 件まで**。それより多いと「分けて実行してね」と教えます（押し間違いで大量に戻してしまう事故を防ぐため）。
- 戻している途中は他のボタンを押せないようにして、混乱を防ぎます。

---

## Part 2: 技術詳細（開発者レベル）

### 全体方針

- **client-only 拡張**。新しい API endpoint も D1 schema 変更も追加しない。
- 既存の単体 rollback endpoint `POST /admin/schema/aliases/:aliasId/rollback`（楽観ロック `If-Match: version=<N>` 付き・Issue #778）を **per-alias で fan-out 呼び出し** する。
- 構造テンプレートは bulk resolve（Issue #776）の `postSchemaAliasBulk` client-side bounded fan-out（concurrency 8 / 50 件上限）。bulk rollback はその対称機能。

### API 契約（新 endpoint なし）

| 種別 | 内容 |
| --- | --- |
| 呼び出す既存 endpoint | `POST /admin/schema/aliases/:aliasId/rollback`（per-alias、1 リクエスト 1 alias） |
| 楽観ロック | `If-Match: version=<N>` を既存 `rollbackSchemaAlias` がヘッダ送信（SSOT・本タスクで重複定義しない） |
| 新規追加 | client helper `rollbackSchemaAliasBulk` のみ（`apps/web/src/lib/admin/api.ts`） |

### client helper 型定義・シグネチャ（`apps/web/src/lib/admin/api.ts` 追加分）

Phase 2 / Phase 5 で確定した型定義をそのまま正本とする（手書きスニペットではなく確定仕様の引用）。

```typescript
export interface SchemaAliasRollbackBulkRow {
  aliasId: string;
  version: number;
  reason?: string;       // 任意。未指定可
}

export interface SchemaAliasRollbackBulkRowResult {
  aliasId: string;
  status: "success" | "error";
  data?: RollbackSchemaAliasResult;
  error?: {
    kind: "version_mismatch" | "not_found" | "forbidden" | "network" | "other";
    message: string;
    httpStatus?: number;
  };
}

export interface SchemaAliasRollbackBulkOptions {
  onRowResult?: (result: SchemaAliasRollbackBulkRowResult, index: number) => void;
  concurrency?: number; // 既定 8
}

export const BULK_ROLLBACK_MAX_ROWS = 50;

export async function rollbackSchemaAliasBulk(
  rows: ReadonlyArray<SchemaAliasRollbackBulkRow>,
  options?: SchemaAliasRollbackBulkOptions,
): Promise<{ results: SchemaAliasRollbackBulkRowResult[] }>;
```

実装方針:

1. `rows.length === 0` → `{ results: [] }` を即 return（fetch しない）。
2. `rows.length > BULK_ROLLBACK_MAX_ROWS` → `new RollbackApiError(0, "bulk_limit_exceeded", ...)` を throw（UI は FR-10 で事前抑止するが、helper も防御的に検証）。
3. `runWithConcurrency(rows, options?.concurrency ?? 8, fn)` で fan-out（入力順保証は `runWithConcurrency` が担保）。
4. 各 row は `rollbackSchemaAlias({ aliasId, version, reason })` を try/catch で呼び、結果を `SchemaAliasRollbackBulkRowResult` に変換。
5. 各 row 確定後に `options?.onRowResult?.(result, index)` を呼ぶ。

### error.kind マッピング表（既存 `RollbackApiError.status` 準拠）

| HTTP status | server error code（schema.ts） | bulk row `error.kind` |
| --- | --- | --- |
| 409 | `version_mismatch` | `version_mismatch` |
| 404 | `not_found` / `already_deleted` | `not_found` |
| 401 / 403 | `unauthorized` / `forbidden` | `forbidden` |
| 0 | `network_error`（非 `RollbackApiError` catch も含む） | `network` |
| 400 / 500 / その他 | `bad_request` / `batch_failed` 等 | `other` |

### 設定可能パラメータ・定数

| 名称 | 値 | 意味 |
| --- | --- | --- |
| `BULK_ROLLBACK_MAX_ROWS` | `50` | 1 回の bulk rollback で許容する最大 alias 件数。超過時は helper が throw、UI は confirm を抑止 |
| `concurrency`（`SchemaAliasRollbackBulkOptions`） | 既定 `8` | fan-out の最大同時実行数。`runWithConcurrency` に渡す |

### transaction 方針（per-alias 独立 commit / 全件 atomic 不採用理由）

- **per-alias 独立 commit を採用**。各 `rollbackSchemaAlias` 呼び出しが単体 rollback endpoint の D1 batch を alias 単位で atomic 実行し、それを client 側 fan-out で積み上げる。
- **全件 atomic は不採用**。`apps/web` 層から D1 binding 横断 transaction を張れず（D1 直接アクセス禁止・不変条件7）、Workers 単発呼び出しは 1 alias 単位のため。1 件の `version_mismatch` が他の成功 row を巻き戻さない（AC-2）。
- Workers timeout は single rollback と同一制約（HTTP 1 本 = 1 alias）。N 件は client 側 concurrency で律速し、50 件超は UI で分割実行を強制する。

### エラーハンドリング・エッジケース

| ケース | 挙動 |
| --- | --- |
| partial failure（一部 409/404） | 成功分は確定（履歴から除去）し、失敗分のみ `error.kind` 付きで modal に残す。「失敗分を再取消」導線を出す（FR-7） |
| all-fail（全件 error） | summary を「全失敗」表示。selection を維持し再 submit 可能にする |
| all-success | modal close + `router.refresh()` で最新 diff/履歴を反映（FR-8） |
| 50 件超過 | UI: 「一括取消」ボタン `disabled` + alert（`aria-live="polite"`）。helper: 防御的に throw（FR-10） |
| 0 件 | helper は `{ results: [] }`。UI は「一括取消」ボタン disabled |
| 想定外例外 | hook の `submit` は `finally { setPhase("done") }` でロック変数を必ず解放（STATE-DETAIL-01） |

### hook / modal / panel 責務分離

| レイヤ | ファイル | 責務 |
| --- | --- | --- |
| client helper | `apps/web/src/lib/admin/api.ts`（追加） | fan-out 実行・error.kind 分類・row 結果集約。state を持たない |
| hook | `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts`（新規） | selection state machine（`Set<aliasId>`）・modal row state（`rows`）・submit 進捗（`submitStatus` / `summary` / `isSubmitting`）を所有。正常/部分失敗/全失敗/例外のロック解放経路を担保 |
| modal | `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx`（新規） | 表示専用。`rows` に含まれる選択 alias 一覧・aggregate 影響件数・per-row 進捗バッジ・summary バナー（`data-role="bulk-rollback-summary"`）を描画する |
| panel | `apps/web/src/components/admin/SchemaDiffPanel.tsx`（変更） | HistoryPane に bulk rollback mode トグル・checkbox（`aria-label` 必須）・select-all・件数バッジ・50 件上限 alert を統合し modal を条件 mount |

state ownership: selection / submit 進捗は hook が所有し、modal は props 受け取りのみ。bulk rollback mode と bulk resolve mode は表示領域が分離され、互いの selection state を共有しない。

### hook / modal の主要シグネチャ（識別子は Phase 2/5 と一致）

```typescript
export interface UseSchemaDiffBulkRollbackSelectionResult {
  selectedIds: ReadonlySet<string>;
  toggle: (aliasId: string) => void;
  selectAll: (aliasIds: readonly string[]) => void;
  clearSelection: () => void;
  selectedCount: number;
  modalOpen: boolean;
  rows: BulkRollbackRowState[];
  summary: { succeeded: string[]; failed: string[] } | null;
  isSubmitting: boolean;
  openModal: (aliases: ReadonlyArray<ResolvedAliasItem>) => void;
  closeModal: () => void;
  submit: () => Promise<{ succeeded: string[]; failed: string[] }>;
}
```

`SchemaDiffBulkRollbackModalProps` は `open` / `rows` / `summary` / `isSubmitting` / `onSubmit` / `onClose` を受け取る。失敗分の再実行は modal を開いたまま残った `rows` に対して同じ `onSubmit` を再押下する設計で、別 props は持たない。

### audit log

成功 row ごとに既存 single rollback endpoint が per-alias `schema_alias.rollback` レコードを emit する（AC-3）。bulk 用の batch parent-child audit は API/D1 変更を要するため本タスクのスコープ外（per-alias 記録で追跡可能）。

### design token 遵守

色は OKLch token（CSS custom property `--color-success` / `--color-warning` / `--color-danger` 等）のみ使用。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（不変条件3・`verify-design-tokens` gate green）。

---

## 視覚証跡

本タスクは **VISUAL タスク**。local verification は `outputs/phase-11/typecheck-local.txt` / `focused-vitest-local.txt` に保存済み。以下の screenshot / 計測ログは runtime evidence として user-gated で取得する。

### Phase 11 screenshot references（canonical 名）

| ファイル | 状態 | viewport |
| --- | --- | --- |
| `outputs/phase-11/bulk-rollback-select-desktop-1280.png` | bulk rollback mode で履歴行 checkbox 選択 + 件数バッジ | desktop 1280 |
| `outputs/phase-11/bulk-rollback-modal-desktop-1280.png` | confirm modal（選択 alias 一覧 + aggregate 影響件数） | desktop 1280 |
| `outputs/phase-11/bulk-rollback-partial-failure-desktop-1280.png` | 部分失敗 summary（成功分確定 + 失敗分残留 + 再取消導線） | desktop 1280 |
| `outputs/phase-11/bulk-rollback-success-desktop-1280.png` | 全成功 summary + HistoryPane 更新後 | desktop 1280 |
| `outputs/phase-11/bulk-rollback-select-mobile-375.png` | bulk rollback mode 選択（モバイル） | mobile 375 |
| `outputs/phase-11/bulk-rollback-modal-mobile-375.png` | confirm modal（モバイル） | mobile 375 |

### 補助証跡

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/perf-30rows.md` | NFR-5 性能計測（30 件 bulk rollback が 30 秒以内）。local dev / branch preview で計測 |
| `outputs/phase-11/a11y-manual-check.md` | a11y 手動確認（checkbox `aria-label` / modal `role="dialog"`・`aria-modal`・focus trap・Escape・jest-axe violations 0） |

### capture metadata

| 項目 | 値 |
| --- | --- |
| desktop viewport | 1280 幅 |
| mobile viewport | 375 幅 |
| playwright project | `desktop-chromium`（mobile は viewport 指定の同 project capture） |
| capture spec | `playwright/tests/issue837-schema-bulk-rollback.spec.ts` |
| 起動コマンド | `PLAYWRIGHT_EVIDENCE_TASK=issue-837-schema-alias-bulk-rollback mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/issue837-schema-bulk-rollback.spec.ts --project=desktop-chromium` |

> 上記 runtime 証跡は user-gated。capture 後、`phase11-capture-metadata.json` / 本ガイドの参照先 / completed ledger を同一 wave で canonical 名に揃える（FB-VISUAL-CAP-001 対応）。
