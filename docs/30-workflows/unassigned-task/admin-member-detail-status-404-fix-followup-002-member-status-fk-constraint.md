# member_status.member_id への FK 制約導入 - タスク指示書

## メタ情報

```yaml
issue_number: 1105
task_id: admin-member-detail-status-404-fix-followup-002-member-status-fk-constraint
task_name: member_status.member_id への FK 制約導入
```

| 項目         | 内容                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| タスクID     | admin-member-detail-status-404-fix-followup-002-member-status-fk-constraint                          |
| タスク名     | member_status.member_id への FK 制約導入                                                             |
| 分類         | 改善                                                                                                |
| 対象機能     | D1 schema（`apps/api/migrations/` — `member_status` テーブル定義 / FK 不在の現状）                   |
| 優先度       | 低                                                                                                  |
| 見積もり規模 | 中規模                                                                                              |
| ステータス   | 未実施                                                                                              |
| 発見元       | workflow admin-member-detail-status-404-fix / Phase 10 §10.3 MINOR / Phase 12 unassigned-task-detection MINOR-FUT-2 |
| 発見日       | 2026-06-02                                                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク `admin-member-detail-status-404-fix` は、staging の admin 会員管理で
`GET /api/admin/members/{id}` / `PATCH /api/admin/members/{id}/status` が 404 になる問題を
根本解決した。原因は `member_identities` 行はあるが `member_status` 行が欠落した
**orphan 会員**で、詳細・status 系のエンドポイントが行の存在を前提とするため
`return null` → 404 になっていた（`index.md` §1）。

親タスクはこの実害を、migration `0024_backfill_member_status.sql` による既存 orphan の
backfill（`INSERT OR IGNORE`）と、`ensureMemberStatusRow` による予防（ingest 時の既定行保証）で
止血した。ただしこれはアプリ層・データ層の止血であって、**DB レベルで orphan の発生を
構造的に禁止する制約（FK）は依然として存在しない**。

`member_status.member_id` は `member_identities(member_id)`（PRIMARY KEY）を指す関係だが、
`0001_init.sql` / `0002_admin_managed.sql` のいずれにも FOREIGN KEY 制約は宣言されていない。

### 1.2 問題点・課題

- `member_status.member_id` に `member_identities` への FK 制約が無く、DB レベルの
  整合性保証（参照整合性）が存在しない
- アプリ層のバグや ingest 経路の漏れがあれば、`member_status` の無い orphon、あるいは
  存在しない `member_identities` を指す `member_status` 行が、DB 上は許容されてしまう
- 整合の担保が `ensureMemberStatusRow`（予防）と backfill（修復）という
  アプリ／migration 層に分散し、DB 自身が不変条件を強制する単一の構造的ガードが無い

### 1.3 放置した場合の影響

- 将来 ingest 経路や member 作成経路に新たな漏れが生じた場合、再び orphan が発生し
  詳細・status の不整合（あるいは 404 の再発）を招く余地が残る
- ただし親タスクの backfill + `ensureMemberStatusRow` により**現時点の orphan は解消済みで、
  予防策も入っているため即時の実害は無い**。FK は「予防の予防」（多層防御の最下層）であり、
  現状は止血済みであることが優先度を **低** とする根拠である
- SQLite の FK 後付けはテーブル再構築を伴い、移行リスク・Cloudflare D1 上の
  `PRAGMA foreign_keys` 運用検証という独立した判断が必要なため、backfill とは別サイクルでの
  慎重な導入が妥当

---

## 2. 何を達成するか（What）

### 2.1 目的

`member_status.member_id` に `member_identities(member_id)` への FOREIGN KEY 制約を導入し、
orphan（`member_identities` を伴わない `member_status`、および参照先が存在しない `member_status`）の
発生を **DB レベルで構造的に禁止する**。あわせて Cloudflare D1 上での
`PRAGMA foreign_keys` の有効性・運用を検証し、FK が実効化される前提を明文化する。

### 2.2 最終ゴール

- `member_status.member_id` が `member_identities(member_id)` を参照する FK 制約付きの
  テーブル定義へ移行されている（テーブル再構築 migration により実現）
- FK 違反となる INSERT（存在しない `member_identities` を指す `member_status` 行）が
  DB レベルで拒否される（`PRAGMA foreign_keys = ON` 前提）
- 既存の正常な `member_status` データが移行後も完全に不変であることが検証されている
- Cloudflare D1 上での `PRAGMA foreign_keys` の有効性・運用方法が検証・文書化されている

### 2.3 スコープ

- 既存 orphan の事前解消確認（親 followup の backfill 0024 適用が前提）
- FK 制約付きの `member_status` テーブル再構築 migration の追加
- FK 有効性テスト（FK 違反 INSERT の拒否 / 正常 INSERT の許容）
- 既存データ不変・冪等性・移行安全性の回帰テスト
- `PRAGMA foreign_keys` の D1 上での有効性検証
- 対象は `apps/api` / `apps/api/migrations/` のみ

---

## 3. スコープ

### 含むもの

- 既存 orphan の事前解消確認（migration 0024 backfill 適用済みであることの検証）
- FK 付き `member_status` テーブルの再構築 migration（新テーブル作成 → データ移行 → 旧 DROP → RENAME）
- FK 有効性テスト（違反 INSERT 拒否 / 正常 INSERT 許容）と既存データ不変の回帰テスト
- Cloudflare D1 における `PRAGMA foreign_keys = ON` の有効性・運用の検証と文書化

### 含まないもの

- 新規 endpoint の追加・既存 endpoint surface の変更
- `apps/web` の変更（FK は DB 内部の整合性保証であり UI に影響しない）
- **member 作成経路の統一**（identity と status を必ず同時生成する経路の集約は
  `admin-member-detail-status-404-fix-followup-001`（作成経路統一）の責務であり、
  本タスクには含めない。本タスクは「DB レベルの構造的ガード」に限定し、
  作成経路統一は followup-001 へ委譲する）
- 親タスクで完了済みの backfill / `ensureMemberStatusRow` の再実装
- 他テーブル（`member_attendance` 等）への FK 制約導入（別関心・別スコープ）

---

## 4. 受け入れ基準（AC）

| #    | 基準                                                                                                       | 測定方法                                                              |
| ---- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| AC-1 | 再構築後の `member_status` は `member_id` に `member_identities(member_id)` への FK を持つ                 | migration 適用後の schema（`PRAGMA foreign_key_list(member_status)`）確認 |
| AC-2 | `PRAGMA foreign_keys = ON` のもと、存在しない `member_identities` を指す `member_status` INSERT が拒否される | D1 config test（FK 違反 INSERT が error / rejected）                  |
| AC-3 | 既存の正常な `member_status` データ（全カラム値）が移行後も 1 行も欠落・改変なく保持される                 | 移行前後の行数・全カラム比較 test                                    |
| AC-4 | migration は冪等であり、再適用しても重複・破壊が発生しない                                                 | migration D1 config test（再適用）                                   |
| AC-5 | backfill 0024 適用済み（orphan ゼロ）を前提に、移行時に FK 違反で失敗しない                                 | 0024 適用後に本 migration を適用し成功すること                       |
| AC-6 | Cloudflare D1 上で `PRAGMA foreign_keys` の有効性（接続単位 ON 要否）が検証・文書化されている              | 検証メモ / runbook（D1 binding 経由の挙動記録）                      |
| AC-7 | 既存挙動の非回帰: 正常会員の詳細 / status / 一覧のレスポンスが従来と同一                                   | 親タスクの既存 spec 全 PASS                                         |
| AC-8 | `apps/web` は無変更（diff 0）                                                                              | `git diff --name-only` に `apps/web` を含めない                     |

---

## 5. 実装方針（How）

### 5.1 前提（順序依存）

FK 制約は参照先が欠落していると ON 時に違反となるため、**先に backfill 0024 が適用され
orphan が解消されている必要がある**。本 migration は 0024 より後の番号で配置し、
適用順序（0024 → 本 migration）を保証する。移行前に orphan ゼロを確認する。

### 5.2 テーブル再構築 migration（SQL 骨子）

SQLite は `ALTER TABLE ... ADD CONSTRAINT` で FK を後付けできないため、
「新テーブル作成 → データ移行 → 旧 DROP → RENAME」の再構築 migration を用いる。

```sql
-- 00xx_member_status_fk_constraint.sql
-- 前提: 0024_backfill_member_status.sql 適用済み（orphan 解消済み）

PRAGMA foreign_keys = OFF;  -- 再構築中は一時 OFF（移行後に ON で検証）

-- 1. FK 付きの新テーブル（DEFAULT は 0002_admin_managed.sql と完全一致させる）
CREATE TABLE member_status_new (
  member_id        TEXT PRIMARY KEY,
  public_consent   TEXT    NOT NULL DEFAULT 'unknown',
  rules_consent    TEXT    NOT NULL DEFAULT 'unknown',
  publish_state    TEXT    NOT NULL DEFAULT 'member_only',
  is_deleted       INTEGER NOT NULL DEFAULT 0,
  hidden_reason    TEXT,
  last_notified_at TEXT,
  updated_by       TEXT,
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (member_id) REFERENCES member_identities(member_id)
);

-- 2. 既存データを全カラム明示で移行（列順依存を避ける）
INSERT INTO member_status_new
  (member_id, public_consent, rules_consent, publish_state,
   is_deleted, hidden_reason, last_notified_at, updated_by, updated_at)
SELECT
   member_id, public_consent, rules_consent, publish_state,
   is_deleted, hidden_reason, last_notified_at, updated_by, updated_at
FROM member_status;

-- 3. 旧テーブル削除 → リネーム
DROP TABLE member_status;
ALTER TABLE member_status_new RENAME TO member_status;

PRAGMA foreign_keys = ON;  -- 検証用（実効化は接続単位の運用に依存）
```

> NOTE: `member_status` を参照する INDEX / VIEW がある場合は、DROP に伴う再作成が必要。
> 再構築前に依存オブジェクトを棚卸しし、再構築後に同一定義で再作成する。

### 5.3 PRAGMA foreign_keys の検証手順

FK を実効化するには接続ごとに `PRAGMA foreign_keys = ON` が必要。Cloudflare D1 が
binding 経由でこの pragma を尊重するか（接続単位での ON 要否・migration 適用時の挙動）を
検証する。

- D1 config test 上で `PRAGMA foreign_keys = ON` 後に FK 違反 INSERT を試み、拒否を確認（AC-2）
- D1 binding（`apps/api`）経由での実挙動を runbook に記録し、ON が必要なら適用箇所を明示（AC-6）
- D1 が pragma を尊重しない場合のフォールバック（FK は schema 上の宣言＋アプリ層の
  `ensureMemberStatusRow` で多層防御）をリスク節に記載

---

## 6. 関連ファイル

| ファイル                                                  | 役割                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/api/migrations/0002_admin_managed.sql`              | 現行 `member_status` テーブル定義（FK 不在 / DEFAULT 値の正本）    |
| `apps/api/migrations/0001_init.sql`                       | `member_identities` 定義（FK 参照先 `member_id` PRIMARY KEY）      |
| `apps/api/migrations/0024_backfill_member_status.sql`     | orphan backfill（本 FK 導入の前提・適用順序の依存元）             |
| `apps/api/migrations/00xx_member_status_fk_constraint.sql`| 新規: FK 付きテーブル再構築 migration（本タスク成果物）           |
| `apps/api/vitest.d1.config.ts`                            | migration / repository の D1 contract test 設定                   |
| `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/`   | 親ワークフロー（根本原因・採用方針・backfill 0024 の文脈）         |

---

## 7. リスクと緩和策

| リスク                                                                         | 影響度 | 発生確率 | 緩和策                                                                                                          |
| ------------------------------------------------------------------------------ | ------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| テーブル再構築（DROP/RENAME）でデータ損失・カラム欠落が発生する                 | 高     | 低       | 全カラムを明示列挙して `INSERT ... SELECT`（列順依存回避）。移行前後の行数・全カラム比較 test を AC-3 で強制。冪等再適用も AC-4 で検証 |
| Cloudflare D1 が `PRAGMA foreign_keys` を尊重せず FK が実効化されない           | 中     | 中       | D1 config test + binding 経由の実挙動を AC-6 で検証・文書化。尊重されない場合は schema 宣言＋アプリ層 `ensureMemberStatusRow` の多層防御にフォールバック |
| backfill 0024 未適用のまま本 migration を適用し orphan が FK 違反になる         | 中     | 低       | 適用順序を 0024 → 本 migration に固定（番号で保証）。移行前に orphan ゼロを確認（AC-5）                          |
| 移行（テーブル再構築）中の一時的不整合・ダウンタイム                            | 低     | 中       | migration はトランザクション内で実行され原子的。再構築中は `PRAGMA foreign_keys = OFF` で内部整合を保ち、完了後に ON |
| `member_status` を参照する INDEX / VIEW の取りこぼし                            | 低     | 中       | 再構築前に依存オブジェクトを棚卸しし、再構築後に同一定義で再作成（§5.2 NOTE）                                   |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/index.md`
  （§1.2 FK 制約なし / §1.3 安全な後付け INSERT の前提 / §2 採用方針 F-1〜F-5）
- `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/phase-10.md`（§10.3 MINOR: MINOR-FUT-2）
- `apps/api/migrations/0002_admin_managed.sql`（`member_status` 現行定義・DEFAULT 値）
- `apps/api/migrations/0001_init.sql`（`member_identities` 定義・FK 参照先）
- `apps/api/migrations/0024_backfill_member_status.sql`（前提となる backfill）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 構成・無料構成）

### 責務境界（関連 followup）

- `admin-member-detail-status-404-fix-followup-001`（member 作成経路統一）:
  identity と status を必ず同時生成する経路の集約はこちらの責務。本タスクは
  「DB レベルの構造的ガード（FK）」に限定し、作成経路統一は followup-001 へ委譲する。
  両者は補完関係（作成経路統一＝アプリ層の予防 / FK＝DB 層の最終ガード）。

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `member_identities` 行はあるが `member_status` 行が欠落した orphan 会員が staging に存在し、admin 会員詳細 / status が 404 になった。DB レベルでこの orphan を禁止する制約が無かった |
| 原因     | `member_status.member_id` に `member_identities` への FK 制約が無く（`0001_init.sql` / `0002_admin_managed.sql`）、DB レベルの整合性保証が存在しないため、アプリ層のバグや経路漏れがそのまま orphan として残った |
| 対応     | 親タスク(404-fix)では migration 0024 で既存 orphan を backfill（INSERT OR IGNORE）し、`ensureMemberStatusRow` で予防。FK 制約導入は SQLite のテーブル再構築リスク・D1 PRAGMA 運用検討を伴う独立スコープのため本 followup に分離した |
| 再発防止 | backfill で orphan を解消した上で FK 制約を導入すれば、DB レベルで orphan の発生を構造的に禁止できる。導入前提として backfill 0024 適用済みであることを migration の順序依存として明記する |

### 補足事項

本タスクの優先度が **低** なのは、親タスク `admin-member-detail-status-404-fix` の
backfill（migration 0024）＋ `ensureMemberStatusRow`（ingest 予防）により**現時点の orphan は
解消済みで、再発予防もアプリ層で入っている**ため、即時の実害が無いことによる。
FK 制約は「予防の予防」（多層防御の最下層 = DB 自身による構造的禁止）であり、
止血が済んでいる状況では緊急度が低い。

ただし SQLite は `ALTER TABLE ... ADD CONSTRAINT` で FK を後付けできず、導入には
テーブル再構築（新テーブル → データ移行 → DROP → RENAME）と、Cloudflare D1 上での
`PRAGMA foreign_keys` 運用検証という、backfill とは独立した移行リスク評価を要する。
このため親タスクの止血スコープからは意図的に分離し、独立の中規模タスクとした。

実装着手・migration 追加・D1 適用・commit / push / PR はすべてユーザー承認後に行う。
member 作成経路の統一は本タスクではなく followup-001 の責務として明確に分離する。
