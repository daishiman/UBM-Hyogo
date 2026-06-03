# Implementation guide

> **本書のステータス**: `implemented_local_evidence_captured`（2026-06-03 automation-30 改善で実コードへ反映済み）。
> 下記の型定義・signature・SQL・JSX 配置は apps/api / apps/web に適用済み。authenticated runtime screenshot は user-gated。
> 残（user-gated）は本書末尾「残作業（user-gated）」を参照。

## Part 1: 中学生レベル

会員の管理画面には「だれが・いつ・なにを変えたか」を残しておくノート（監査ログ）がある。
たとえば、まとめて何人もの会員に同じ分類シール（タグ）を貼った／剥がしたとき、その
「いっぺんにやった 1 回の作業」には、レシートの番号のような目印（batchId）が付く。

今までの管理画面では、この目印で「あの一括作業でいったい何が変わったのか」をまとめて
探すことができなかった。番号は記録の中に書いてあるのに、運用する人はノートを 1 ページずつ
めくって目で見比べるしかなく、手間がかかっていた。

そこでこのタスクでは、監査ログの画面にこの目印を入れる検索ボックスを足して、番号を打てば
その一括作業の分だけを一覧できるようにする。さらに、各行にその番号を表示して、ボタン 1 つで
その番号をコピーできるようにする。これで「この番号の作業で何が変わったか」をすばやく追える。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| audit / 監査ログ | だれが・いつ・なにを変えたかのノート |
| batchId | 「この 1 回のまとめ作業」につくレシート番号 |
| filter（フィルタ） | 条件を入れて、当てはまる分だけ表示すること |
| copy（コピー） | 文字をそのまま写し取って、別の場所に貼れるようにすること |
| API / endpoint | 画面と保存場所をつなぐ連絡口 |
| repository | 保存場所へ読み書きする係 |
| json_extract | 記録の中の「入れ子の値」を 1 個だけ取り出すしくみ |

## Part 2: 技術者レベル

### 背景

親 #1036（bulk member tag assign/unassign）は、実 mutation した member×tag 単位で `audit_log` に
`batchId` を埋め込み、1 回の一括操作を相関できるようにした（assign は `after_json.batchId`、
unassign は `before_json.batchId`）。しかし `/admin/audit` 画面・audit API には batchId で一括操作を
検索・表示する導線が無く、運用者は audit JSON を手作業で目視（JSON inspection）して突き合わせる
しかない。`audit_log` には `correlation_id` 列が無く、index も `(target_type, target_id, created_at)` のみ
（DDL: `audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at`）。

### 要約

本タスクは schema を変更せず、(1) audit API（`GET /admin/audit`）に `batchId` query filter を追加し、
(2) repository `listFiltered` で `json_extract` による after/before 両列 OR 検索を行い、(3) 管理画面 UI に
batchId filter input（FormField）・row への batchId 表示・新規 copy ボタン（`BatchIdCopyButton`）を加える。
package は `@ubm-hyogo/api`（Task A）と `@ubm-hyogo/web`（Task B/C）。AC-1..5 を 1 PR にまとめて完了する
（CONST_007・先送り分割ではない）。

### 型定義 / シグネチャ（TypeScript・計画）

repository（`apps/api/src/repository/auditLog.ts`）— `AuditLogListFilters` に batchId を追加する:

```typescript
export interface AuditLogListFilters {
  action?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  fromUtc?: string;
  toUtcExclusive?: string;
  batchId?: string; // ← 追加（JSON 内 batchId の json_extract 検索キー）
  cursor?: { createdAt: string; auditId: string };
  limit: number;
}
```

API route（`apps/api/src/routes/admin/audit.ts`）— `ListAuditQueryZ` / `appliedFilters` に batchId を追加する:

```typescript
export const ListAuditQueryZ = z.object({
  action: z.string().min(1).optional(),
  actorEmail: z.string().email().optional(),
  targetType: z.string().min(1).optional(),
  targetId: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  batchId: z.string().min(1).optional(), // ← 追加
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// AdminAuditListResponseZ.appliedFilters（.strict() 維持のため schema にも追加必須）
appliedFilters: z.object({
  action: z.string().nullable(),
  actorEmail: z.string().nullable(),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  batchId: z.string().nullable(), // ← 追加
  limit: z.number().int().min(1).max(100),
}).strict();
```

web 抽出 helper / client component（`apps/web/src/components/admin/`）:

```typescript
// AuditLogPanel.tsx に追加する pure helper（server-renderable を維持）
export function extractBatchId(item: AdminAuditListItem): string | null;

// 新規 client component（"use client"）の props
export interface BatchIdCopyButtonProps {
  readonly batchId: string;
}
export function BatchIdCopyButton(props: BatchIdCopyButtonProps): JSX.Element;
```

web filter 型（`apps/web/src/components/admin/AuditLogPanel.tsx` / `src/lib/admin/types.ts`）:

```typescript
// AuditSearchValues（filter form 入力値）に追加
readonly batchId?: string;
// AdminAuditFilters（appliedFilters 型）に追加
readonly batchId?: string;
```

### json_extract SQL（repository・計画）

`listFiltered` 内で cursor 句より前に、batchId 専用 WHERE を追加する。`add()` helper は単一 `?` を
1 つの `?N` に置換する前提のため **使わず**、値を 1 回だけ push して同一 `?N` を両 `json_extract` で参照する
（これにより binding 番号がずれない）:

```sql
((json_valid(after_json) AND json_extract(after_json, '$.batchId') = ?N)
 OR (json_valid(before_json) AND json_extract(before_json, '$.batchId') = ?N))
```

```typescript
if (filters.batchId) {
  bindings.push(filters.batchId);            // ← 1 回だけ push
  where.push(
    `((json_valid(after_json) AND json_extract(after_json, '$.batchId') = ?${bindings.length}) ` +
      `OR (json_valid(before_json) AND json_extract(before_json, '$.batchId') = ?${bindings.length}))`,
  );
}
```

- assign は `after_json.$.batchId`、unassign は `before_json.$.batchId` に batchId が入るため両列を OR で検索する（検索漏れ防止）。
- `json_extract` は壊れた JSON 文字列に対して D1/SQLite `malformed JSON` を投げるため、既存の破損 audit row を含む一覧でも落ちないよう `json_valid(...)` guard を必ず併用する。
- 他 filter（action / from / to 等）との AND は既存 `where.join(" AND ")` でそのまま成立する（AC-3）。括弧で OR を AND の 1 項として閉じる。
- ORDER BY / LIMIT / cursor / `add()` の既存挙動は変更しない。

### API query 例

```
GET /admin/audit?batchId=<uuid>
GET /admin/audit?action=admin.member.tag_assigned&batchId=<uuid>        # AC-3 併用
GET /admin/audit?batchId=<uuid>&from=2026-06-01T00:00:00Z&to=2026-06-02T00:00:00Z  # 範囲併用
```

レスポンスの `appliedFilters.batchId` には適用した batchId（未指定時 `null`）が返り、`nextCursor` を
含む next URL は `buildAuditHref(values, nextCursor)` で batchId query を保持する（AC-4）。

### 実装ステップ

1. **Task A（apps/api）**: `ListAuditQueryZ` / `AdminAuditListResponseZ.appliedFilters` / `ListAuditResponse` interface に batchId を追加（`satisfies ListAuditResponse` 維持）。`app.get("/audit", ...)` で safeParse 入力・`listFiltered` 呼び出し spread・`appliedFilters` 返却の 3 箇所に batchId を反映。
2. **Task A（apps/api）**: `AuditLogListFilters` に batchId を追加し、`listFiltered` に json_extract OR 句を追加（同一 `?N` 共有）。AC-5 full scan 方針を Phase 2 §3 の通り記述で充足（schema 変更なし）。
3. **Task B（apps/web）**: `AuditSearchValues` / `AdminAuditFilters` に batchId を追加。`buildAuditHref` / `buildAuditApiPath` / searchParams 解析に batchId plumbing を追加。FilterForm に `<FormField name="batchId">` + `<Input>` を from/to の後・limit の前に配置（grid 列数は変更不要）。helper text で from/to・action 併用を誘導。
4. **Task C（apps/web）**: `extractBatchId` pure helper を `AuditLogPanel.tsx` に追加（探索順 `maskedAfter → afterJson → maskedBefore → beforeJson`）。`AuditRow` に batchId 表示ブロック（`<code>{batchId}</code>` + `BatchIdCopyButton`）を追加。新規 `BatchIdCopyButton.tsx`（"use client"）で `navigator.clipboard.writeText(batchId)` + copied フィードバックを実装。
5. **テスト**: repository / API contract（d1 config 必須）/ component / client component spec を `*.spec.ts(x)` で作成・追記。

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm lint
# OKLch トークン gate（HEX / bg-[#xxx] / text-[#xxx] 混入なしを確認）
```

実行済み evidence は `outputs/phase-11/manual-test-result.md` と `phase12-task-spec-compliance-check.md` に記録する。

### エラーハンドリング / エッジケース

| ケース | 振る舞い（計画） |
| --- | --- |
| `?batchId=<uuid>`（一致あり） | after/before に該当 batchId を持つ行のみ返却（200）。 |
| `?batchId=<uuid>`（不一致） | 空 `items: []` / `nextCursor: null`（200・エラーではない）。 |
| `?batchId=` 空文字 | `c.req.query("batchId") || undefined` で undefined 扱い → filter 適用なし（既存全件挙動）。 |
| invalid query（例: limit 範囲外） | 既存どおり zod safeParse 失敗 → `400 { ok:false, error:"invalid query" }`。batchId は `min(1).optional()` で空文字は上流で undefined 化され 400 を誘発しない。 |
| `?action=...&batchId=...&from=...` 併用 | 全条件 AND（AC-3）。json_extract OR は括弧で AND の 1 項として閉じる。 |
| copy 成功 | `navigator.clipboard.writeText` → "コピー済み" を 1.5s 表示 → "コピー" に戻る。 |
| copy 失敗（clipboard 不在 / 権限拒否） | 例外を握り潰し copied=false 維持。`<code>` 手動選択で代替（fallback）。副作用なし。 |
| batchId 不在行 | row に batchId ブロックを描画しない（noop）。 |

**副作用**: API は read-only（audit_log への mutation なし・append-only 不変を維持）。UI copy は clipboard 書き込みのみ。

### 設定可能パラメータ

| パラメータ | 値 / 既定 | 根拠 |
| --- | --- | --- |
| `limit` query | min 1 / max 100 / default 50 | 既存 audit list 上限（非変更） |
| copy フィードバック表示時間 | 1500ms（`window.setTimeout`） | 短い視覚フィードバック。定数として component 内に保持 |
| batchId filter | `z.string().min(1).optional()` | 空文字は undefined 化（filter 無効）。UUID 想定だが書式は強制しない |
| `BatchIdCopyButton` variant / size | `ghost` / `sm` | 既存 `Button` primitive・OKLch token のみ（HEX 禁止） |

### 既知制限

- **JSON 列 full scan**: `json_extract(after_json, '$.batchId')` は JSON 列に index が無いため `audit_log` の sequential scan になる。緩和策は (a) keyset cursor + LIMIT で 1 ページの取得行数を bound、(b) batchId（UUID v4）の sparse 性で一致行は 1 bulk 分のみ、(c) from/to・action 併用で scan 前に plain 列で範囲を絞る（UI helper text で誘導）。AC-5 はこの方針明記で充足し、schema 変更（`correlation_id` 列 / generated column / JSON index migration）は別関心として scope 外（unassigned-task-detection に baseline 候補として記録）。
- **batchId は bulk 操作のみ**: 単一 endpoint（`POST /:memberId/tags` 等）の audit 行は batchId を持たないため、filter / 表示の対象外（batchId 不在行は描画しない）。
- **copy の環境依存**: `navigator.clipboard` 不在・権限拒否の環境では copied フィードバックを出さず `<code>` の手動選択で代替する。
- **runtime visual**: authenticated screenshot は user-gated。local code/tests は完了済み。

## 視覚証跡（VISUAL_ON_EXECUTION）

実装区分は VISUAL_ON_EXECUTION。UI（batchId filter input / row 表示 / copy ボタン）を変更するため、
authenticated runtime で手動スクリーンショットを取得する（Phase 11）。local 実装は完了済みだが、
admin session が必要な runtime visual は pending_user_gate。canonical 名は Phase 11 / 本ガイド / ledger の 3 か所で一致させる。

| 画面状態 | canonical 名 | 状態 |
| --- | --- | --- |
| batchId filter 未適用（初期表示） | `audit-batchid-filter-empty.png` | pending_user_gate |
| batchId filter 適用（絞り込み結果） | `audit-batchid-filter-applied.png` | pending_user_gate |
| audit row の batchId 表示 + copy ボタン | `audit-row-batchid-copy.png` | pending_user_gate |

> 手動テスト手順・取得証跡は `outputs/phase-11/manual-test-result.md` を参照。

## 残作業（user-gated）

- Phase 11 screenshot（上記 3 canonical 名）を実機で取得する。
- commit / push / PR 作成（ユーザー明示承認後のみ・PR は `Refs #1079`）。
- Issue #1079 は CLOSED 維持（reopen しない）。
