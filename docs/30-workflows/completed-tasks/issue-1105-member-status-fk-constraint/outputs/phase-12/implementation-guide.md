# 実装ガイド — issue-1105 member_status.member_id への FK 制約導入

> 区分: 実装仕様書 / NON_VISUAL / implementation_mode: new
> status: `implemented_local_evidence_captured`（local実装済み。remote D1 apply / commit / PR は user-gated）
> 対象: `apps/api/migrations/0026_member_status_fk_constraint.sql`（新規）/ `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts`（新規）/ 既存 D1 test fixtures（FK 前提 fixture 追従）。`apps/web` diff 0

本ガイドは 2 部構成。Part 1 は前提知識のない読者（中学生レベル）向けに「なぜ必要か → 何をするか」を例え話で説明し、Part 2 は実装者向けに SQL・テスト・検証コマンド・エッジケースを記述する。識別子はすべて `index.md` / `phase-10-final-review.md` の確定事実から引用しており、手書きによる drift はない。

---

## Part 1 — やさしい説明（前提知識ゼロ向け）

### 背景（なぜ必要か）

会員サイトのデータベースには 2 つの「カード入れ」があります。1 つは会員の名前そのものを並べた **名簿**（`member_identities`）。もう 1 つは「この会員は公開してよいか」「退会済みか」などの **設定カード**（`member_status`）です。設定カードには「どの会員の設定か」を示す番号（`member_id`）が書かれています。

ところが今までのデータベースには、ひとつ困ったことがありました。**名簿に載っていない番号の設定カード**を作ろうとしても、データベースが止めてくれなかったのです。名簿から名前が消えたのに設定カードだけ棚に残ってしまう、いわば「迷子カード」が生まれても、データベースは平気で受け入れていました。

人の手やプログラムのちょっとした手違いで迷子カードが生まれると、後で「この設定カードの持ち主は誰？」と探しても見つからず、画面のエラー（404）の原因になります。親タスクではアプリ側で「カードを作るときは必ず名簿も確認する」よう手当てしましたが、それは人がルールを守るだけの約束で、**データベース自身が迷子カードを拒否する仕組み**ではありませんでした。

### 要約（何をするか）

この変更では、データベースに **鍵（FOREIGN KEY 制約）** をかけます。「設定カードの番号は、必ず名簿に載っている番号でなければならない」というルールを、データベース自身に覚えさせます。こうすると、名簿に無い番号の設定カードを作ろうとした瞬間、データベースが「その番号は名簿にありません」と自動で突き返してくれます。つまり迷子カードを **そもそも作れなくする** のです。

SQLite というデータベースは、すでにあるテーブルに後から鍵を足すことができないので、いったん **鍵つきの新しい棚を作り直して、中身を丸ごと引っ越す** 方法をとります。引っ越しの間だけ鍵の見張り役を一時的に外し（`PRAGMA foreign_keys` を OFF）、引っ越しが終わったら見張り役を戻します（ON）。

### 実装ステップ（順番にやること）

1. 鍵の見張り役を一時停止する（`PRAGMA foreign_keys = OFF`）。
2. 鍵つきの新しい棚 `member_status_new` を作る（中身の形=現行10個の列は今と全く同じ）。
3. 今の棚 `member_status` の中身を 10 列すべて新しい棚にコピーする。
4. 古い棚を捨てて、新しい棚の名前を `member_status` に付け替える。
5. 検索を速くするための索引 `idx_member_status_public` を作り直す（引っ越しで一度消えるため）。
6. 見張り役を元に戻す（`PRAGMA foreign_keys = ON`）。

### 既知の制限（気をつけること）

- 引っ越しの前に「名簿に無い番号の設定カード（迷子カード）」が残っていると、鍵をかける途中で引っかかります。これは親タスクの片付け（backfill = `0025_backfill_member_status.sql`）で迷子カードがゼロになっている前提で安全に進みます。
- Cloudflare D1（本番のデータベース）では、鍵の見張り役を「接続ごとに ON にする必要があるか」が実機でしか最終確認できません。テストでは ON 下で確実に動くことを示し、本番の挙動は runbook（手順メモ）に書き残し、実機確認は user の承認後に行います。
- この変更はデータベースの中身の整合性を守るだけで、画面（UI）は何も変わりません。だから画面のスクリーンショットは不要です。

---

## Part 2 — 実装者向け技術仕様

### 背景（root cause）

`member_status.member_id` は論理的に `member_identities(member_id)`（PRIMARY KEY）を参照するが、`0002_admin_managed.sql` の定義に FOREIGN KEY 宣言がない。`grep -rn "FOREIGN KEY\|REFERENCES" apps/api/migrations/*.sql` は 0 件、`PRAGMA foreign_keys`（apps/api 全体）も 0 件で、本リポジトリには FK 前例が存在しない。親タスクの止血（backfill `0025` + `ensureMemberStatusRow`）はアプリ／データ層を手当てしたが、DB レベルの構造的ガードは未導入。

### 要約（goal）

`member_status` を **FK 付きで再構築** し、orphan を DB レベルで構造的に禁止する。SQLite は `ALTER TABLE ... ADD CONSTRAINT` で FK を後付けできないため、テーブル再構築（新テーブル作成 → 全列 INSERT SELECT → DROP → RENAME → INDEX 再作成）で実現する。あわせて D1 上の `PRAGMA foreign_keys` 実効性を検証・文書化する。

### 実装ステップ — 再構築 migration SQL（`0026_member_status_fk_constraint.sql`）

完全な構造（0002 の9カラム + 0020 の `notification_opt_out` = 現行10カラムを保持）:

```sql
-- 0026_member_status_fk_constraint.sql
-- member_status.member_id -> member_identities(member_id) への FK 制約導入（テーブル再構築）
-- 前提: 0025_backfill_member_status.sql 適用済み（orphan ゼロ）

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS member_status_new;

-- 1) FK 付き新テーブル（現行10カラム・既存と同一構成 + FK 宣言）
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

-- 2) 現行全カラムを明示列挙でコピー（orphan があれば fail-fast）
INSERT OR IGNORE INTO member_status_new (
  member_id, public_consent, rules_consent, publish_state,
  is_deleted, hidden_reason, last_notified_at, updated_by, updated_at,
  notification_opt_out
)
SELECT
  member_id, public_consent, rules_consent, publish_state,
  is_deleted, hidden_reason, last_notified_at, updated_by, updated_at,
  notification_opt_out
FROM member_status;

PRAGMA foreign_keys = OFF;

-- 3) 旧テーブル削除 → RENAME
DROP TABLE IF EXISTS member_status;
ALTER TABLE member_status_new RENAME TO member_status;

-- 4) INDEX 再作成（再構築で消失するため必須・AC-9）
CREATE INDEX IF NOT EXISTS idx_member_status_public
  ON member_status (public_consent, publish_state, is_deleted);

PRAGMA foreign_keys = ON;
```

> `INSERT INTO ... (col列挙) SELECT col列挙` と `CREATE INDEX IF NOT EXISTS` により、再適用（AC-4 冪等）でも列順・INDEX が安定する。`DROP/RENAME` は再適用時は新スキーマ前提で同等に成立する（2 回目は既に FK 付き構造を再構築する形になり、データ・スキーマ不変）。

### FK 制約定義の要点

- `FOREIGN KEY (member_id) REFERENCES member_identities(member_id)`：参照先は `member_identities` の PRIMARY KEY `member_id`。
- 削除挙動（`ON DELETE` 等）は宣言しない＝SQLite 既定（`NO ACTION`）。親 identity 削除時に子 status が残る挙動の変更は本タスク範囲外（既存挙動非回帰 AC-7）。
- `idx_member_status_public` は `(public_consent, publish_state, is_deleted)` の複合 INDEX。`0002` L81-82 と同一定義で再作成する（AC-9）。

### PRAGMA foreign_keys 検証手順（AC-6）

SQLite では FK は **スキーマ宣言だけでは強制されず**、接続単位の `PRAGMA foreign_keys = ON` で初めて実効化する。検証は 2 層:

1. **in-memory test 層**: test 内で `PRAGMA foreign_keys = ON` を設定し、(a) `PRAGMA foreign_key_list(member_status)` で FK 宣言の存在を確認、(b) 未登録 `member_id` の INSERT が `FOREIGN KEY constraint failed` で reject されることを確認。
2. **runbook 記録層**: Cloudflare D1 binding 経由の接続が PRAGMA を接続単位で要するかは実機でのみ最終確認できるため、本番接続単位の ON 要否・適用方針を runbook（`outputs/phase-11/manual-test-result.md` 参照系）へ記録する。実機適用は user-gated。

### TypeScript test 構造（`0026_member_status_fk_constraint.spec.ts`）

```text
describe('0026 member_status FK constraint', () => {
  // setupD1(): migrations を 0001..0026 を番号順で全件適用（0025 → 0026 の順序保証 = AC-5）
  const db = await setupD1();

  it('AC-1: FK が宣言されている', async () => {
    const fks = await db.prepare('PRAGMA foreign_key_list(member_status)').all();
    // table=member_identities / from=member_id / to=member_id を 1 件含む
  });

  it('AC-2: 違反 INSERT が拒否される', async () => {
    await db.exec('PRAGMA foreign_keys = ON');
    // 未登録 member_id の member_status INSERT が reject される（rejects.toThrow / FOREIGN KEY constraint failed）
  });

  it('AC-3: 既存データが全カラム不変', async () => {
    // 移行前後で行数一致 + 現行10カラム値一致（欠落・改変 0）
  });

  it('AC-4: 冪等（2 回適用で不変）', async () => {
    // 0026 SQL を再適用 → エラーなし・スキーマ/データ不変
  });

  it('AC-9: idx_member_status_public が同一定義で存在', async () => {
    // PRAGMA index_list / index_info(member_status) で (public_consent, publish_state, is_deleted) を確認
  });
});
```

- test ファイルは `*.spec.ts` のみ（不変条件 #8・`*.test.ts` 禁止）。
- `setupD1()` は番号順適用で 0025（backfill）→ 0026（FK）の順序を保証し、orphan ゼロ前提で FK 違反失敗が起きないこと（AC-5）を担保する。

### 検証コマンド

| コマンド | 目的 |
|---------|------|
| `mise exec -- pnpm verify:d1-migrations` | sequence guard（番号順・unique prefix）。0026 は新規 prefix のため `sequence-exceptions.json` 編集不要 |
| `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` | D1 contract test（FK 宣言 / 違反拒否 / 既存不変 / 冪等 / INDEX 再作成） |
| `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts --no-file-parallelism --maxWorkers=1 apps/api` | FK 導入後も apps/api D1 suite 全体が非回帰 GREEN になることを確認（109 files / 937 tests PASS） |
| `git diff --name-only HEAD \| grep '^apps/web/'` | apps/web diff 0 確認（AC-8・出力 0 行を期待） |

> local GREEN 化は実行済み。commit・push・PR・D1 実 apply はすべて **user-gated**。

### エラーハンドリング / エッジケース（多層防御）

| ケース | 対応 |
|--------|------|
| D1 が PRAGMA を尊重しない / 接続単位で ON が必要 | (1) スキーマ宣言で FK を恒久的に持たせる + (2) test で PRAGMA ON 実効性を実証 + (3) runbook に本番接続単位 ON 要否を記録、の **多層防御**。スキーマ宣言は接続設定に依存せず残るため、将来 PRAGMA 常時 ON 機構（M-3 followup）が入れば即実効化する |
| 移行前に orphan が残存 | backfill `0025` 適用済み（orphan ゼロ）前提（AC-5）。番号順適用で 0025 → 0026 を保証。万一 orphan があれば FK 付き INSERT 時に検出され migration が fail する＝安全側 |
| 再適用（冪等） | `CREATE TABLE IF NOT EXISTS` / 列明示 INSERT / `CREATE INDEX IF NOT EXISTS` で 2 回目も破壊なし（AC-4） |
| 列順 drift | `INSERT (col列挙) SELECT col列挙` で暗黙 `*` を避け、列追加・順序変更の影響を受けない |

### 設定可能パラメータ

| パラメータ | 値 | 備考 |
|-----------|----|----|
| migration 番号 | `0026` | 0024（photos variants）/ 0025（backfill）が占有済みのため次番 |
| INDEX 定義 | `(public_consent, publish_state, is_deleted)` | `0002` L81-82 と同一・変更不可（AC-9） |
| DEFAULT 値 | 現行10カラム（`'unknown'` / `'member_only'` / `0` / `datetime('now')` 等） | `0002` と byte 一致・非回帰（AC-7） |
| `ON DELETE` 挙動 | 未宣言（既定 NO ACTION） | 既存挙動変更は範囲外 |

---

## 視覚証跡

UI/UX 変更なしのため **Phase 11 スクリーンショット不要**（NON_VISUAL / `apps/web` diff 0）。

代替証跡として以下を参照する:

- 設計・AC 充足の最終判定: `phase-10-final-review.md`（AC-1〜AC-9 各 PASS / blocker 0 件 / 不変条件 PASS）
- 手動テスト計画・D1 PRAGMA runbook 記録: `outputs/phase-11/manual-test-result.md`（NON_VISUAL・migration / FK 有効性 / 既存データ不変 / 冪等の手動検証手順と D1 接続単位 PRAGMA 記録）
