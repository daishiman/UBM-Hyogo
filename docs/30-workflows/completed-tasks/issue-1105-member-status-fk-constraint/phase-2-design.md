# Phase 2 — 設計

> NON_VISUAL / implementation_mode: new。SQLite テーブル再構築による FK 後付けと、D1 上の PRAGMA foreign_keys 実効性検証を設計する。

## 2.1 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 対象 | 再利用 |
|------|--------|
| test 基盤 `setupD1()` | **再利用**（全 migration 自動適用・新規 0026 も自動適用される） |
| test テンプレート | `0025_backfill_member_status.spec.ts` の構造を踏襲（`@vitest-environment node` / `readFileSync` で SQL 読み込み / `env.db.exec` 適用 / 冪等は 2 回適用） |
| backfill（前提） | `0025` を順序依存として再利用（再実装しない） |

新規実装は migration SQL 1 本 + test 1 本のみ。

## 2.2 再構築 migration SQL 骨子（`0026_member_status_fk_constraint.sql`）

SQLite は `ALTER TABLE ... ADD CONSTRAINT` で FK を後付けできないため「新テーブル作成 → データ移行 → 旧 DROP → RENAME → INDEX 再作成」で再構築する。

```sql
-- 0026_member_status_fk_constraint.sql
-- 前提: 0025_backfill_member_status.sql 適用済み（orphan 解消済み）
-- 目的: member_status.member_id に member_identities(member_id) への FK を導入し
--       orphan を DB レベルで構造的に禁止する。

PRAGMA foreign_keys = ON;  -- orphan が残っていればコピー段階で fail-fast

DROP TABLE IF EXISTS member_status_new;

-- 1. FK 付き新テーブル（0002 の既定値 + 0020 の notification_opt_out を保持）
CREATE TABLE IF NOT EXISTS member_status_new (
  member_id              TEXT PRIMARY KEY,
  public_consent         TEXT    NOT NULL DEFAULT 'unknown',
  rules_consent          TEXT    NOT NULL DEFAULT 'unknown',
  publish_state          TEXT    NOT NULL DEFAULT 'member_only',
  is_deleted             INTEGER NOT NULL DEFAULT 0,
  hidden_reason          TEXT,
  last_notified_at       TEXT,
  updated_by             TEXT,
  updated_at             TEXT    NOT NULL DEFAULT (datetime('now')),
  notification_opt_out   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (member_id) REFERENCES member_identities(member_id)
);

-- 2. 既存データを全カラム明示で移行（orphan があればここで失敗）
INSERT OR IGNORE INTO member_status_new
  (member_id, public_consent, rules_consent, publish_state,
   is_deleted, hidden_reason, last_notified_at, updated_by, updated_at,
   notification_opt_out)
SELECT
   member_id, public_consent, rules_consent, publish_state,
   is_deleted, hidden_reason, last_notified_at, updated_by, updated_at,
   notification_opt_out
FROM member_status;

PRAGMA foreign_keys = OFF;  -- DROP/RENAME の間だけ一時 OFF

-- 3. 旧テーブル削除 → リネーム
DROP TABLE IF EXISTS member_status;
ALTER TABLE member_status_new RENAME TO member_status;

-- 4. INDEX 再作成（DROP で消失した idx_member_status_public を同一定義で回復・AC-9）
CREATE INDEX IF NOT EXISTS idx_member_status_public
  ON member_status(public_consent, publish_state, is_deleted);

PRAGMA foreign_keys = ON;  -- 検証用（実効化は接続単位の運用に依存・AC-6）
```

### 設計上の決定事項

| 決定 | 理由 |
|------|------|
| DEFAULT 値を 0002 / 0020 と完全一致させる | 移行後の新規 INSERT が従来と同一既定値になる（非回帰・AC-7）。`notification_opt_out` を落とさない |
| 全カラム明示 `INSERT ... SELECT` | 列順依存を回避しデータ欠落・改変を防ぐ（AC-3） |
| `PRAGMA foreign_keys = ON` のままコピー | 0025 前提が壊れて orphan が残っている場合、migration を失敗させて違反を温存しない |
| `idx_member_status_public` を末尾で再作成 | DROP TABLE で INDEX が消失するため（AC-9） |
| `CREATE INDEX IF NOT EXISTS` | 冪等性（再適用安全・AC-4） |
| DROP/RENAME 中のみ `PRAGMA foreign_keys = OFF` | 旧テーブル差し替えの一時的不整合だけを限定的に許容 |

### setupD1 splitStatements 整合性

`setupD1()` は SQL を `;` で分割し 1 文ずつ `db.exec` する。上記 SQL は文字列リテラル内に `;` を含まず、`PRAGMA` も独立文のため分割互換。`datetime('now')` の `'now'` は `;` を含まないため安全。

## 2.3 PRAGMA foreign_keys 実効性検証設計（AC-6）

FK を実効化するには接続ごとに `PRAGMA foreign_keys = ON` が必要。Cloudflare D1 が binding 経由でこの pragma を尊重するかを検証する。

| 検証 | 方法 | 期待 |
|------|------|------|
| in-memory（miniflare D1）での FK 実効性 | test 内で migration 適用後 `PRAGMA foreign_keys = ON` → 違反 INSERT を試行 | reject（AC-2） |
| `PRAGMA foreign_key_list(member_status)` | test で FK メタを取得 | `member_identities` への FK 1 件（AC-1） |
| D1 binding 経由の実挙動 | runbook に記録（接続単位 ON 要否） | 文書化（AC-6） |
| D1 が pragma を尊重しない場合 | フォールバック = schema 宣言 + アプリ層 `ensureMemberStatusRow` の多層防御 | リスク節に明記 |

> miniflare D1（test 環境）と本番 D1 で PRAGMA の挙動が異なりうるため、test での PASS は「schema 上 FK が宣言され、PRAGMA ON 下で実効化される」ことの証跡とし、本番 D1 の接続単位挙動は runbook 記録（AC-6）で補完する。

## 2.4 SubAgent lane / validation path

| lane | 対象 | 並列 |
|------|------|------|
| Lane A | Phase 4-7（test plan / implementation / test additions / coverage） | 並列可 |
| Lane B | Phase 8-10（refactor / qa / final review） | 並列可 |
| Lane C | Phase 11 + Phase 12 strict 7 + Phase 13 | 並列可 |
| validation | `verify:phase12-compliance` / `gate-metadata:validate` / `verify:d1-migrations` | 直列で締め |

## 2.5 ロールバック / 移行安全性

migration は `PRAGMA foreign_keys = ON` のコピーで orphan 残存を fail-fast し、DROP/RENAME 中だけ一時 OFF にする。万一 D1 apply 失敗時は `cf.sh rollback` で直前 version へ戻す（user-gated）。
