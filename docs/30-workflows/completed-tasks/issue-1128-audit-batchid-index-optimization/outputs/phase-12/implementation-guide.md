# 実装ガイド — issue-1128 audit_log batchId index 最適化

本ガイドは「`audit_log` の batchId 検索を JSON full scan から index 列走査へ最適化する」タスクの実装ガイドである。
Part 1（初学者・中学生レベル）と Part 2（開発者・技術者レベル）の 2 部構成で記す。
本タスクは `implemented_local_evidence_captured` として apps/api の実コード差分・local evidence を取得済みである。
下記の検証コマンドは再現手順として定義する。

---

## Part 1: やさしい説明（中学生レベル）

### なぜ必要か（先に「困りごと」から）

このシステムには「だれが・いつ・なにをしたか」を全部書きためていく分厚いノート（記録帳）があります。
管理者がまとめて操作（たとえば大量のメンバーにタグを一括で付ける）をすると、その操作には「ひとまとまりの番号」
（バッチ番号）が付きます。あとから「あの一括操作で何が起きたか」を見返したいとき、システムはこの番号で記録を探します。

ところが今は、その番号がノートの**本文の中**に紛れて書かれていて、探すための見出しになっていません。
だから番号で探そうとすると、システムはノートを**1ページ目から最後まで全部めくって**1件ずつ確かめることになります。
記録がどんどん増えると、この「全部めくる」作業は時間がかかるようになります。

### たとえば（図書館の本の例え）

たとえば、図書館でとても分厚い本から「ある言葉」が書いてあるページを探すとします。
- 索引（さくいん）が無いと、1ページ目からめくって、その言葉が出てくるまで全部のページを目で追わないといけません。
  これはとても大変で、本が分厚いほど時間がかかります。これが今の「全部めくる」探し方です。
- でも、本の巻末に「索引カード」（この言葉は◯ページ、という早見表）があれば、目的のページが**一発で分かります**。

このタスクは、記録帳に「バッチ番号の索引カード」を1枚足してあげる作業です。索引があれば、番号で探すのが速くなります。

### 何をするか（足すだけ・書き換えない）

- **見出し専用の列を1本足す**: バッチ番号だけを取り出して並べた「見出しの列」を作ります。
- **その列に索引を貼る**: 見出しの列に索引（早見表）を付けて、番号で一発で探せるようにします。
- **過去の記録はそのまま**: 昔書いた記録を消したり書き換えたりはしません。記録帳は「足すだけ（あとから書き換えない）」
  という大事なルールを守ったまま、探すのだけが速くなります。

### 今回作ったもの

- 記録帳に「バッチ番号だけを取り出す見出しの列」を作りました。
- その見出しの列に「索引カード」を付けました。
- 画面の使い方は変えず、裏側の探し方だけを速くしました。

### どこまでやるか

今回やるのは「バッチ番号で探すのを速くする」ところだけです。記録の項目を増やしたり、画面の見た目を変えたりはしません。
管理者が使う検索画面のボタンや入力欄も今までどおりで、変わるのは**裏側の探し方だけ**です。

### 専門用語セルフチェック

| 専門用語の例 | 日常語への言い換え例 |
| --- | --- |
| index（インデックス） | 「本の巻末にある索引・早見表」 |
| full scan（フルスキャン） | 「1ページ目から最後まで全部めくって探すこと」 |
| batchId（バッチID） | 「一括操作ひとまとまりに付く番号」 |
| append-only（アペンドオンリー） | 「足すだけ・あとから書き換えないルール」 |
| migration（マイグレーション） | 「データの入れ物（表）の形を変える手順書」 |

---

## Part 2: 技術詳細（開発者レベル）

### 背景 / 問題

`audit_log`（append-only テーブル・定義は `apps/api/migrations/0003_auth_support.sql:32-42`）では、bulk 操作の相関キー
である `batchId` が JSON payload 内に**非対称**に埋め込まれている。

- assign 系は `after_json.$.batchId`
- unassign 系は `before_json.$.batchId`

そのため JSON 列に index が貼れず、`GET /admin/audit?batchId=...` の検索は `apps/api/src/repository/auditLog.ts` の
`listFiltered`（batchId 分岐 `:200-205`）で次のような `json_extract` full scan（`SCAN audit_log`）になっている。

```sql
-- before（full scan）
((json_valid(after_json)  AND json_extract(after_json,  '$.batchId') = ?n)
 OR
 (json_valid(before_json) AND json_extract(before_json, '$.batchId') = ?n))
```

audit_log は行数が増え続ける append-only テーブルなので、行数増大に伴いこの full scan のコストが顕在化する。

### TypeScript インターフェース（既存・signature 不変）

検索フィルタの公開 interface は #1079 で確定済みであり、本タスクで**変更しない**。本タスクが変えるのは
`listFiltered` 内部の SQL（full scan → index 列走査）のみで、interface signature は不変である。

```ts
// 既存（#1079 で確定）— 本タスクで変更しない公開 interface
interface AuditLogListFilters {
  batchId?: string;       // ← この filter の検索実装方式を index 走査へ切替える（signature は不変）
  targetType?: string;
  targetId?: string;
  action?: string;
  // ...（他フィルタは省略）
}

// listFiltered のシグネチャも不変
function listFiltered(
  db: D1Database,
  filters: AuditLogListFilters,
  pagination: { limit: number; offset: number },
): Promise<AuditLogRow[]>;
```

### APIシグネチャ

公開 API の signature は変更しない。既存の `GET /admin/audit` が `batchId` query を受け取り、内部 SQL だけが
`json_extract` 条件から `batch_id = ?` へ変わる。

```text
GET /admin/audit?batchId=<batchId>&limit=<1..100>&cursor=<opaqueCursor>
```

### 列方式の決定（A / B / C）

| 方式 | 概要 | ADD COLUMN | append() 変更 | backfill | 採否 |
| --- | --- | --- | --- | --- | --- |
| **A（第一候補）** | VIRTUAL generated column `batch_id` + index | 可（VIRTUAL のみ可） | 不要（派生列） | 不要（index 構築で全行算出） | Phase 2 実測で確定 |
| **B（fallback）** | plain `correlation_id` 列 + backfill UPDATE + index + `append` write 拡張 | 可 | 要 | 要 | A が実測で不可なら採用 |
| C | STORED generated column | **不可**（テーブル再構築が必要） | — | — | **不採用** |

> **方式C 不採用の根拠（issue 鮮度補正の核心）**: SQLite の `ALTER TABLE ... ADD COLUMN` は STORED generated column を
> 拒否する（既存行の再計算＝テーブル再構築が必要なため）。append-only な大テーブルの再構築は高コスト・高リスクであり、
> 元 Issue #1128 の「STORED 第一候補」を VIRTUAL 第一候補へ最適化補正した。

**採用方式の決定基準（Phase 2 / Miniflare D1 実測ゲート）**: Miniflare D1（テストハーネスと同一 SQLite エンジン）で次を実行し、

```sql
EXPLAIN QUERY PLAN SELECT audit_id FROM audit_log WHERE batch_id = 'x';
```

出力に `USING INDEX idx_audit_log_batch_id`（または `SEARCH audit_log USING INDEX ...`）が現れ `SCAN audit_log` でなければ
**方式A 採用**、VIRTUAL 列への index が拒否される / full scan のままなら **方式B（plain `correlation_id`）へ fallback** する。

### SQL シグネチャ（migration DDL）

#### 方式A: `0026_audit_log_batchid_index.sql`

```sql
-- 1. batchId 相関列（VIRTUAL = ADD COLUMN 可・既存行へ自動波及・write path 変更不要）
ALTER TABLE audit_log ADD COLUMN batch_id TEXT
  GENERATED ALWAYS AS (
    COALESCE(
      CASE WHEN json_valid(after_json) THEN json_extract(after_json, '$.batchId') END,
      CASE WHEN json_valid(before_json) THEN json_extract(before_json, '$.batchId') END
    )
  ) VIRTUAL;

-- 2. index（NULL 行は sparse。index 構築で既存行も自動的に検索対象になる）
CREATE INDEX IF NOT EXISTS idx_audit_log_batch_id
  ON audit_log(batch_id, created_at DESC, audit_id DESC)
  WHERE batch_id IS NOT NULL;
```

#### 方式B（fallback）: `0026_audit_log_batchid_index.sql`

```sql
ALTER TABLE audit_log ADD COLUMN correlation_id TEXT;

UPDATE audit_log
   SET correlation_id = COALESCE(
     CASE WHEN json_valid(after_json) THEN json_extract(after_json,'$.batchId') END,
     CASE WHEN json_valid(before_json) THEN json_extract(before_json,'$.batchId') END
   )
 WHERE correlation_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_correlation_id ON audit_log(correlation_id);
```

#### repository SQL（`listFiltered` batchId 分岐 `:200-205`）

```sql
-- after（index 列走査）方式A
WHERE batch_id = ?         -- 既存 add() ヘルパで bindings 連番化
-- 方式B は WHERE correlation_id = ?
```

### 使用例（GET /admin/audit → listFiltered）

```bash
curl "/admin/audit?batchId=batch-1079-abc123"
```

→ route `apps/api/src/routes/admin/audit.ts`（query surface は #1079 確定済・**不変**）が `filters.batchId` を組み立て、
`listFiltered(db, { batchId: "batch-1079-abc123" }, pagination)` を呼ぶ。`listFiltered` は内部 SQL を
`WHERE batch_id = ?`（方式A）/ `WHERE correlation_id = ?`（方式B）として発行し、`idx_audit_log_batch_id`
（または `idx_audit_log_correlation_id`）を走査する。返却 shape は切替前と同一（AC-5 非退化）。

### エラーハンドリング

| 状況 | 挙動 |
| --- | --- |
| NULL batchId（assign/unassign いずれの payload にも batchId が無い行） | generated 列 / `correlation_id` は NULL になり index には sparse に乗る。`WHERE batch_id = ?` は NULL 行に一致しない（= 検索対象外）。これは正しい挙動（batchId 無しの行は batchId 検索の対象外） |
| 不正 JSON 行（`after_json` / `before_json` が JSON として壊れている） | generated expression / fallback backfill のどちらも `json_valid` で guard してから `json_extract` する。壊れた JSON 側は NULL に畳まれ、例外や誤ヒットを起こさない（既存 `json_valid` ガードと同等の堅牢性を維持） |
| migration 適用失敗 | `0026` は単文 DDL のみで構成し（`BEGIN..END` 不使用）、テスト loader（`_setup.ts` の `;` 分割）と sequence guard（`pnpm verify:d1-migrations`）で事前検知する |

### エッジケース

| ケース | 挙動 / 設計意図 |
| --- | --- |
| after/before 非対称 | assign は `after_json.$.batchId`、unassign は `before_json.$.batchId`。`COALESCE(after, before)` で 1 列に畳み込み、双方を 1 index で拾う（AC-3） |
| sparse NULL | batchId を持たない通常の監査行は相関列が NULL。index は sparse になるが、batchId 検索のヒット対象は batchId を持つ行のみなので正しい |
| 既存行（migration 前に書かれた行） | 方式A は VIRTUAL 列のため index 構築時に全既存行へ算出が及び自動的に検索対象になる。方式B は backfill UPDATE で `correlation_id` を埋める（AC-4） |
| query surface | `GET /admin/audit` の batchId param は #1079 で確定済・不変。本タスクは検索実装方式のみ変更（スコープ「含まない」） |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| migration 番号 / ファイル名 | `0026` / `0026_audit_log_batchid_index.sql` |
| 相関列名（方式A） | `batch_id`（VIRTUAL generated column） |
| 相関列名（方式B） | `correlation_id`（plain TEXT 列） |
| index 名（方式A） | `idx_audit_log_batch_id` |
| index 名（方式B） | `idx_audit_log_correlation_id` |
| COALESCE 式 | `COALESCE(CASE WHEN json_valid(after_json) THEN json_extract(after_json,'$.batchId') END, CASE WHEN json_valid(before_json) THEN json_extract(before_json,'$.batchId') END)` |
| rollback（方式A） | `DROP INDEX IF EXISTS idx_audit_log_batch_id;` + `ALTER TABLE audit_log DROP COLUMN batch_id;` |
| rollback（方式B） | `DROP INDEX IF EXISTS idx_audit_log_correlation_id;` + `ALTER TABLE audit_log DROP COLUMN correlation_id;` |

### append-only 維持（AC-7）

backfill は migration 内 SQL（方式B の UPDATE）のみで行い、`auditLog.ts` から UPDATE / DELETE を新規 export しない。
append-only 不変条件（`auditLog.ts:228-229`）を破らない。

### 検証コマンド（実行済み / 再現用）

```bash
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/migrations/__tests__/0026_audit_log_batchid_index.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
```

### テスト構成

| テスト | 目的 |
| --- | --- |
| `apps/api/migrations/__tests__/0026_audit_log_batchid_index.spec.ts` | generated column / index / query plan を検証 |
| `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | after_json / before_json 両方の batchId 非退化と index 使用を検証 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | public route の `batchId` contract / pagination / filter 合成を検証 |

---

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要（NON_VISUAL タスク）。
証跡は Phase 11 の自動テスト出力（`auditLog.repository.spec.ts` / `audit.contract.spec.ts`）と、
`EXPLAIN QUERY PLAN SELECT audit_id FROM audit_log WHERE batch_id='x';` の結果テキストで担保する。

| 代替証跡 | パス | 段階 |
| --- | --- | --- |
| manual test result（自動テスト + EXPLAIN 結果の記録） | `outputs/phase-11/manual-test-result.md` | present |
| EXPLAIN QUERY PLAN ログ | test 内 assertion | present（`idx_audit_log_batch_id` 使用 / `SCAN audit_log` 不在） |

> commit / push / PR / migration apply（staging / production）は user-gated（Phase 13・CONST_002）として残す。
