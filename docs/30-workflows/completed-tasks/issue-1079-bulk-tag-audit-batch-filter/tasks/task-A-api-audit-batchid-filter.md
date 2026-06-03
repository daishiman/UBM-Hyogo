[実装区分: 実装仕様書]

# Task A: audit API の batchId query filter + repository JSON 検索

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | `task-issue-1036-followup-003-bulk-tag-audit-batch-filter` / Task A |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| 対象 | `apps/api`（apps/web と非干渉・独立レーン） |
| 担当 AC | AC-1（batchId 絞り込み）/ AC-3（action + batchId 併用）/ AC-5（full scan 方針明記） |
| 区分 | 実装仕様書（コード変更を伴う・本ファイルは設計） |

> 本ファイルは Task A 単独の実装仕様書（設計）であり、コード実装・runtime 検証は含まない。
> 実装は実装サイクル（03.実装.md）で行う。package 名は `@ubm-hyogo/api`（issue の `@repo/api` は誤り）。

---

## 1. 目的

`/admin/audit`（`GET`）に `batchId` query filter を追加し、親 #1036 が `audit_log` の `after_json`（assign）/
`before_json`（unassign）に埋め込んだ bulk 操作の `batchId` で audit rows を絞り込めるようにする。
repository 層で `json_extract` による JSON 内検索（after / before 両列の OR）を行う。schema 変更は伴わない。

---

## 2. 変更対象ファイル一覧

| パス | 区分 | 変更内容 |
| --- | --- | --- |
| `apps/api/src/routes/admin/audit.ts` | 編集 | `ListAuditQueryZ` / `AdminAuditListResponseZ.appliedFilters` / `ListAuditResponse` interface / route 本体（safeParse・listFiltered 呼び出し・appliedFilters）に batchId 追加。 |
| `apps/api/src/repository/auditLog.ts` | 編集 | `AuditLogListFilters` に `batchId?`、`listFiltered` に json_extract OR の WHERE 句追加。 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 追記 | TC (a)-(f)（Phase 4 §2）+ fail path（Phase 6）。 |
| `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | 追記 | TC (g)-(k)（Phase 4 §3）+ 回帰 / 耐性（Phase 6）。 |

**新規作成ファイル: なし。**

---

## 3. 関数シグネチャ（before / after）

### 3-1. `ListAuditQueryZ`（`audit.ts`）

Before → After: `to` の後・`cursor` の前に 1 行追加。

```ts
  to: z.string().min(1).optional(),
  batchId: z.string().min(1).optional(), // ← 追加
  cursor: z.string().min(1).optional(),
```

### 3-2. `AdminAuditListResponseZ.appliedFilters`（`.strict()`・`audit.ts`）

```ts
    to: z.string().nullable(),
    batchId: z.string().nullable(), // ← 追加
    limit: z.number().int().min(1).max(100),
  }).strict(),
```

### 3-3. `ListAuditResponse.appliedFilters`（interface・`audit.ts`）

```ts
    to: string | null;
    batchId: string | null; // ← 追加
    limit: number;
```

### 3-4. `AuditLogListFilters`（`auditLog.ts`）

Before:

```ts
export interface AuditLogListFilters {
  action?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  fromUtc?: string;
  toUtcExclusive?: string;
  cursor?: { createdAt: string; auditId: string };
  limit: number;
}
```

After（`toUtcExclusive` の後に追加）:

```ts
  toUtcExclusive?: string;
  batchId?: string; // ← 追加
  cursor?: { createdAt: string; auditId: string };
```

### 3-5. `listFiltered(c: DbCtx, filters: AuditLogListFilters): Promise<AuditLogListRow[]>`

シグネチャ非変更。`filters.batchId?` が増えるのみ。

---

## 4. route 本体（`audit.ts` `app.get("/audit")`）3 箇所

(1) safeParse 入力（`to` の後・`cursor` の前）:

```ts
      to: c.req.query("to") || undefined,
      batchId: c.req.query("batchId") || undefined, // ← 追加
      cursor: c.req.query("cursor") || undefined,
```

(2) `listFiltered({ ... })` 呼び出しの spread（`toUtcExclusive` の後・`cursor` の前）:

```ts
      ...(toUtcExclusive ? { toUtcExclusive } : {}),
      ...(parsed.data.batchId ? { batchId: parsed.data.batchId } : {}), // ← 追加
      ...(cursor ? { cursor } : {}),
```

(3) `appliedFilters` 返却（`to` の後・`limit` の前）:

```ts
          to: parsed.data.to ?? null,
          batchId: parsed.data.batchId ?? null, // ← 追加
          limit,
```

---

## 5. SQL（`auditLog.ts` `listFiltered` の WHERE 句）

`toUtcExclusive` 句の後・`cursor` 句の前に挿入する。**`add()` helper は使わない。**

```ts
  if (filters.toUtcExclusive) add("created_at < ?", filters.toUtcExclusive);
  if (filters.batchId) {
    bindings.push(filters.batchId);
    where.push(
      `((json_valid(after_json) AND json_extract(after_json, '$.batchId') = ?${bindings.length}) ` +
        `OR (json_valid(before_json) AND json_extract(before_json, '$.batchId') = ?${bindings.length}))`,
    );
  }
  if (filters.cursor) { /* 既存 keyset 句（非変更） */ }
```

### 落とし穴（必読）

- `add(sql, value)` は `bindings.push(value)` 後 `sql.replace("?", "?N")` で **単一 `?` を 1 つだけ** 置換する前提。
  batchId は **同一値を 2 つの json_extract で参照**するため `add()` は使えない:
  - `add()` を 2 回呼ぶと値が 2 回 push され binding 番号がずれる。
  - 1 回だけ呼ぶと `replace` が最初の `?` のみ置換し 2 つ目が未置換で SQL 破損。
- → `bindings.push(filters.batchId)` で **値を 1 回だけ** push し、`?${bindings.length}` を **両 json_extract に
  同じ番号で手書き**する。既存 cursor 句と同じ「手動付番」様式。
- assign は `after_json.$.batchId`、unassign は `before_json.$.batchId` に batchId が入る（members.ts L761/L770）。
  **両列を OR で検索**することで検索漏れを防ぐ（OR は括弧で 1 項に閉じ、AND 結合の中で安全に共存）。

---

## 6. AC-5: full scan 方針（schema 変更回避の明記）

`json_extract(after_json, '$.batchId')` は JSON 列に index が無いため `audit_log` の sequential scan（full scan）
になる。以下で制限を明記し、schema 変更を別関心として切り離す:

| 緩和策 | 内容 |
| --- | --- |
| (a) keyset cursor + LIMIT | `ORDER BY created_at DESC, audit_id DESC LIMIT ?N`（既存）で 1 ページ取得行数を bound。full table を一度に返さない。 |
| (b) batchId の sparse 性 | batchId は `crypto.randomUUID()`（v4）。一致行は 1 bulk 操作分のみで極めて sparse。 |
| (c) 併用推奨 | from/to 日付・action（`admin.member.tag_assigned` 等）と併用し、plain 列条件で scan 前に範囲を絞る（UI helper text で誘導 = Task B）。 |

**scope 外（別タスク化）**: `correlation_id` 列追加 / generated column（batchId 抽出列）/ JSON index migration は
schema 変更を伴う別関心。将来 audit 行数増で full scan が問題化した際の別タスク候補として
unassigned-task-detection / Phase 12 に記録する。

---

## 7. 入出力・副作用

| ケース | 振る舞い |
| --- | --- |
| `?batchId=<uuid>`（一致あり） | after / before に当該 batchId を持つ行のみ返却（200）。 |
| `?batchId=<uuid>`（不一致） | `items: []`・`nextCursor: null`（200・エラーではない）。 |
| `?batchId=` 空文字 | route 層 `query || undefined` で undefined → filter 未適用（全件・既存挙動）。`appliedFilters.batchId === null`。400 にしない。 |
| `?action=...&batchId=...` 併用 | 全条件 AND（AC-3）。json_extract OR は括弧で AND の 1 項に閉じる。 |
| invalid query（limit 範囲外 / invalid cursor） | 既存どおり 400。batchId 単独の新規 400 経路なし。 |
| broken JSON / batchId 不在行 | json_extract が NULL を返し不一致で除外（クラッシュなし）。 |

**副作用**: read-only。audit_log への mutation なし（append-only 不変維持）。

---

## 8. テストケース一覧

### contract（`audit.contract.spec.ts`・**d1 config 必須**）

| TC | 観点 | 期待 |
| --- | --- | --- |
| (a) | batchId のみ絞り込み（AC-1） | 同一 batchId の assign + unassign 両行のみ。 |
| (b) | action + batchId 併用（AC-3） | action 一致行のみ（AND）。 |
| (c) | appliedFilters.batchId echo | `appliedFilters.batchId === "<uuid>"`。 |
| (d) | cursor pagination で batchId 保持（AC-4 API 側） | 2 ページ周回で batchId filter 維持・他 batch 非混入。 |
| (e) | 不一致 | `items: []`・`nextCursor: null`・200。 |
| (f) | 空文字 batchId | 400 にしない・filter 未適用・`appliedFilters.batchId === null`。 |
| (F-1..F-4) | fail path | 空文字 / 不一致 / invalid limit / invalid cursor（Phase 6 §3）。 |
| (J-1) | broken JSON 共存 | broken 行はクラッシュせず除外。 |

### repository（`auditLog.repository.spec.ts`）

| TC | 観点 | 期待 |
| --- | --- | --- |
| (g) | after_json.batchId 一致（assign） | 当該 1 行。 |
| (h) | before_json.batchId 一致（unassign） | 当該 1 行。 |
| (i) | 両方混在 batch | assign + unassign 両行。 |
| (j) | action と AND 結合（AC-3） | action 一致行のみ。 |
| (k) | 無一致 | 空配列。 |
| (R-2 / R-4 / J-1 / J-2) | 回帰 / 耐性 | 既存複合 filter 不変 / batchId + cursor / broken JSON / batchId 不在行（Phase 6）。 |

新規テストは `*.spec.ts` のみ（`*.test.ts` 禁止・CLAUDE.md 不変8）。命名は既存 describe/it 様式を踏襲。

---

## 9. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test --run \
  src/routes/admin/audit.contract.spec.ts \
  src/repository/__tests__/auditLog.repository.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api lint
```

---

## 10. 完了条件 (DoD)

- `audit.ts` / `auditLog.ts` に batchId が追加され、`?batchId=<uuid>` で after / before 両列 OR の絞り込みが効く（AC-1）。
- action filter と batchId filter が AND 併用できる（AC-3）。
- json_extract が同一 `?N` を両参照し binding がずれない（`add()` 不使用）。
- AC-5 full scan 方針（緩和策 + schema 変更の別タスク化）が記述されている。
- contract / repository spec の TC が全て pass する（実装サイクルで green・Gate-B）。
- 新 endpoint 追加・schema 変更・write 側変更が無い。D1 直アクセスは `auditLog.ts` に閉じる（#5）。
