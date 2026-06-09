# Phase 8: リファクタリング（duplicate / drift 削減）

## 目的

Phase 5/6 で着地した実装に対し、重複 SQL 文字列・bindings 連番の手書き drift を除去し、
既存の `listFiltered` 内 `add()` ヘルパ 1 本に集約する。機能挙動・SELECT surface は不変。

## リファクタ対象テーブル（FB-RT-03）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `auditLog.ts` `listFiltered` の batchId 分岐（`:200-205`） | `bindings.push(filters.batchId)` の手書き + `where.push(` で `?${bindings.length}` を 2 回手挿入する full-scan SQL（`json_valid` + `json_extract` の OR 二項） | 方式 A 採用時: `add("batch_id = ?", filters.batchId)` の 1 行 / 方式 B 採用時: `add("correlation_id = ?", filters.batchId)` の 1 行 | 他フィルタ（`action` / `actorEmail` / `targetType` …）は全て `add()` 経由。batchId だけが生 `bindings.push` + `where.push` で連番手書きしており規約 drift。`add()` へ寄せると bindings 連番のバグ表面積が消える |
| `SELECT_COLS`（`:79-80`） | `audit_id AS auditId, ... after_json AS afterJson, created_at AS createdAt` | **不変** | 相関列（`batch_id` / `correlation_id`）は検索専用の派生列・WHERE 句専用で SELECT には含めない。`AuditLogListRow` shape を変えない（query surface 不変・AC-5 非退化の前提） |
| `append`（`:103-138`）INSERT | 方式 A 採用時: 9 列 INSERT（不変） | 方式 A: **不変** / 方式 B: `correlation_id` 列を INSERT 末尾に追加し `?10` で `e.after?.batchId ?? e.before?.batchId ?? null` を bind | 方式 A は派生列のため write path に触れない。方式 B のみ write 1 列増（Phase 5 実装で着地済み・本 Phase では重複除去のみ） |

## After のコード形（方式 A・第一候補）

```ts
// listFiltered 内・既存 add() を流用
if (filters.batchId) add("batch_id = ?", filters.batchId);
```

`add()` は `bindings.push(value)` → `where.push(sql.replace("?", \`?${bindings.length}\`))` を
1 箇所に閉じているため、batchId 分岐から `?${bindings.length}` の手挿入（同じ index を 2 回参照する
旧 OR 句）が完全に消える。連番計算の所有権が `add()` 1 点に統一される。

## After のコード形（方式 B・fallback）

```ts
// listFiltered
if (filters.batchId) add("correlation_id = ?", filters.batchId);

// append（write 1 列増は Phase 5 着地済み・本 Phase は文字列重複の整理のみ）
//   INSERT 列・VALUES 連番・.bind 引数を 1 つずつ増やす。
//   correlation 値は append() 内ローカル const に切り出して可読性を上げる:
//   const correlationId = e.after?.batchId ?? e.before?.batchId ?? null;
```

## navigation / duplicate drift の確認方針

| 確認 | 方法 | 期待 |
| --- | --- | --- |
| batchId 検索 SQL が 1 箇所のみか | `grep -n "batch_id\|correlation_id\|\\$.batchId" apps/api/src/repository/auditLog.ts` | `listFiltered` の `add(...)` 1 行（方式 B は `append` の INSERT も）に集約。旧 `json_valid(after_json) ... OR ... before_json` の二項 full-scan 文字列が残存していないこと |
| `add()` 経由への統一 | 同上 grep で `bindings.push(filters.batchId)` の手書きが消えていること | batchId だけ生 push する drift がゼロ |
| `SELECT_COLS` 不変 | `git diff apps/api/src/repository/auditLog.ts` の `SELECT_COLS` 行に差分なし | AC-5 非退化の前提を維持 |
| 他 list 関数への波及なし | `listRecent` / `listByActor` / `listByTarget` / `listForExport` に差分なし | 相関列は WHERE 専用・SELECT 非追加のため波及しない |

## リファクタ範囲の限界（やらないこと）

- `SELECT_COLS` への相関列追加はしない（query surface 不変・派生列は検索専用）。
- `append-only` 不変条件に触れる変更（UPDATE/DELETE の export）はしない（AC-7）。
- 旧 full-scan 互換コードのフラグ温存はしない（index 列走査へ完全切替・dead branch を残さない）。

## 結論

リファクタは **必要**（batchId 分岐の生 `bindings.push` + 二重 `?${bindings.length}` 手挿入は
他フィルタと規約 drift しており、`add()` への集約で重複・連番バグ表面積を削減できる）。
方式 A では `listFiltered` 1 行のみ、方式 B では `listFiltered` 1 行 + `append` の相関値 const 切り出しに閉じる。
