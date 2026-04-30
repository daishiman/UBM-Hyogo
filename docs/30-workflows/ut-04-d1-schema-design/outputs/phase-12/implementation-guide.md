# 実装ガイド — UT-04 D1 データスキーマ設計

## Part 1: 中学生レベル説明（日常の例え話で理解する）

### このタスクは何？

Cloudflare D1 という、クラウド上にある「学校の大きな先生用ノート」に、UBM 兵庫支部会の会員情報を **どう整理して書くか** を決める設計図づくりです。Google フォームに記入された会員情報は、まずスプレッドシート（クラスの名簿のようなもの）に集まり、最終的に先生の公式ノート（D1）へ書き写されます。今回はその「公式ノート」のページ構成（テーブル）と、各ページの欄（カラム）を決める仕事です。

### 例え話 1: クラス名簿と先生の公式ノート

スプレッドシート（Google Sheets）は、教室にある **みんなが見られるクラス名簿** のようなものです。一方、Cloudflare D1 は職員室の鍵付き棚にある **先生の公式ノート** にあたります。クラス名簿は誰でも書き換えられるので、先生は定期的に内容をチェックして公式ノートに正しく写し直します。

公式ノートは「生徒一覧（`member_responses`）」「在籍状態一覧（`member_status`）」のように **章ごとに分かれていて**、各章は何ページめにどんな欄があるかを最初にきちんと決めておく必要があります。今回はその章立て（テーブル）と欄（カラム）に「名前」「学年」「同意したか」のラベルを付ける仕事をしました。

### 例え話 2: 出席番号は世界に 1 つ（PRIMARY KEY と UNIQUE）

クラスに「田中さん」が 2 人いても、出席番号で区別できますよね。それと同じで、公式ノートでも各行に **必ず 1 つだけの番号（PRIMARY KEY）** を振ります。さらに会員フォームでもらう「回答 ID（`response_id`）」も、ノート全体で 1 つしか使えないように **UNIQUE 制約** をかけました。同じ回答 ID で 2 回書き込もうとすると、ノート側が「もう同じ番号が使われています！」と自動で書き込みを拒否してくれます（DB レベルで間違いを防ぐ防御線）。

### 例え話 3: 書き直し手順書（migration ファイル）

ノートのページ構成を後で変えたい場合に備えて、変更の手順を **1 枚ずつ番号付きで保管** します。これが migration ファイルです。`0001_init.sql` は「最初にノートを作った日の手順」、`0002_add_xxx.sql` は「2 番目に欄を追加した日の手順」というように、必ず連番で残します。これがあれば、何かあって新しいノートを買ってきても、手順書通りに書けばまったく同じ構成のノートを再現できます。

### 例え話 4: 部活動と所属の関係（FOREIGN KEY）

「部活動一覧」と「生徒一覧」が別ページにあるとき、生徒のページには「所属している部活の ID」が書いてあります。もし「吹奏楽部」のページを消すと、それを指していた生徒の所属先がいなくなってしまいます。これを防ぐルールが **FOREIGN KEY**（外部キー）です。Cloudflare D1（中身は SQLite）では、このルールを使う前に必ず最初に「外部キーのチェックをオンにする」というおまじない（`PRAGMA foreign_keys = ON`）を唱える必要があります。これを忘れると、ルールを設定しても **何もチェックしてくれません** ので注意。

### このガイドでわかること

- D1 の章立て（テーブル）と欄（カラム）が、どんな約束事で決まっているか
- ノートに書き込むときに自動でチェックされるルール（NOT NULL / UNIQUE / FOREIGN KEY）
- ノートの構成を変える時の正しい手順（migration）
- ノートに書き換えコマンドを送る時に使う「魔法の呼び出し」`scripts/cf.sh`

---

## Part 2: 技術者レベル説明

### スコープ

UT-04 は Cloudflare D1（SQLite ベース）の **初期スキーマ設計タスク** であり、本 PR では仕様書のみを commit する。実 DDL（`apps/api/migrations/*.sql`）は実装 Phase の後続 PR で投入する（spec PR 境界）。

### VISUAL / NON_VISUAL 判定

本タスクは `visualEvidence=NON_VISUAL`。対象は D1 schema / migration / runbook であり、画面・レイアウト・ユーザー操作を変更しない。したがってスクリーンショットは不要で、Phase 11 では CLI 手順仕様と後続実行時に採取する smoke log を代替 evidence とする。

### 主要テーブル（DDL 規約）

| テーブル | 役割 | 主要キー / 制約 |
| --- | --- | --- |
| `member_responses` | Google Form 回答の正本コピー | `response_id TEXT PRIMARY KEY`, `form_id TEXT NOT NULL`, `revision_id TEXT NOT NULL`, `schema_hash TEXT NOT NULL`, `response_email TEXT`, `submitted_at TEXT NOT NULL`, `answers_json TEXT NOT NULL` |
| `member_identities` | response_email 単位の同一人物束ね | `member_id TEXT PRIMARY KEY`, `response_email TEXT NOT NULL UNIQUE`, `current_response_id TEXT NOT NULL` |
| `member_status` | consent / publish_state 等 admin-managed 状態 | `member_id TEXT PRIMARY KEY`, `public_consent TEXT`, `rules_consent TEXT`, `publish_state TEXT`, `is_deleted INTEGER` |
| `response_fields` | フォーム回答の正規化値ストア | PRIMARY KEY (`response_id`, `stable_key`), `value_json`, `raw_value_json` |
| `schema_diff_queue` | フォーム schema 変更の検出キュー | UT-04 / UT-09 連携 |
| `sync_jobs` | Sheets→D1 sync 実行ログ | UT-09 連携 |

> 詳細 DDL は `outputs/phase-02/schema-design.md`（既存 migration からの抽出）と `.claude/skills/aiworkflow-requirements/references/database-schema.md`（正本仕様）を参照。

### TypeScript 型と操作シグネチャ（実装 PR 入力）

```ts
export interface MemberResponseRow {
  response_id: string;
  form_id: string;
  revision_id: string;
  schema_hash: string;
  response_email: string | null;
  submitted_at: string;
  answers_json: string;
}

export interface D1SchemaRepository {
  getMemberResponse(responseId: string): Promise<MemberResponseRow | null>;
  listOpenSchemaDiffs(limit?: number): Promise<SchemaDiffQueueRow[]>;
}
```

使用例:

```ts
const response = await repository.getMemberResponse("R-001");
if (!response) {
  return { status: 404, body: { error: "response_not_found" } };
}
```

エッジケース:

- `response_id` 重複: SQLite の PRIMARY KEY 制約で reject する。
- `submitted_at` 不正形式: D1 は TEXT として受理するため、mapper / repository 層で ISO 8601 を検証する。
- FK: 既存 0001〜0006 は明示 FOREIGN KEY 句を使わない。FK 導入時は `PRAGMA foreign_keys = ON;` と runtime duplex 設定を別 migration で有効化する。

### インデックス戦略

| index | 対象 | 目的 |
| --- | --- | --- |
| `idx_member_responses_email` | `member_responses(email)` | login / 検索の前段 |
| `idx_member_responses_response_id` | UNIQUE 制約と兼用 | sync の冪等 lookup |
| `idx_member_status_status` | `member_status(status)` | バックオフィス filter |
| `idx_response_fields_response_id` | `response_fields(response_id)` | 1:N join |

複合 index は MVP では追加せず、UT-08 monitoring の slow query 観測後に追加判断する。

### マッピング契約

CLAUDE.md 不変条件 #2 / #3 に基づき以下を固定:

- `publicConsent` / `rulesConsent` の **キー名統一**（snake_case 化は DB 列名のみ）
- `responseEmail` は **system field** として扱い、フォーム項目ではない（auth リダイレクト用）
- フォーム schema 外の admin-managed data（`member_status` 等）は **別テーブル分離**（不変条件 #4）

### migration 規約

- 既存: `0001_init.sql`〜`0006_admin_member_notes_type.sql` は変更しない
- 次回追加: `0007_<verb>_<target>.sql` 以降（4 桁 zero-pad）
- FK を導入する migration では先頭で `PRAGMA foreign_keys = ON;` を宣言（D1 は per-connection FK のため）
- DATETIME は `TEXT` (ISO 8601 UTC) で統一（SQLite に DATETIME 型は無い）
- INTEGER PK は rowid と同居（明示的に `INTEGER PRIMARY KEY` で sqlite の rowid alias 化）
- down migration は持たず、復旧は **backup export + 新規 migration** で前進復元（D1 の運用慣行）

### scripts/cf.sh 経由の適用手順

CLAUDE.md「Cloudflare 系 CLI 実行ルール」に従い、`wrangler` 直接呼び出しは禁止。

```bash
# dev 環境への apply
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev

# schema 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --command=".schema"

# migration list 確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev

# production 適用（UT-06 / UT-26 wave）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# rollback（version_id ベース）
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
```

`scripts/cf.sh` は内部で:

1. `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` を 1Password から動的注入（実値はファイル / ログに残らない）
2. `ESBUILD_BINARY_PATH` でグローバル esbuild とのバージョン不整合を解決
3. `mise exec --` 経由で Node 24 / pnpm 10 を保証

### ロールバック方針

D1 / SQLite は ALTER TABLE が制約付きで弱い（DROP COLUMN は最近追加、CHECK 変更不可など）。本プロジェクトは以下に統一:

1. **down migration を持たない**（複雑化を避ける）
2. 障害時は `bash scripts/cf.sh d1 export` で backup → 新規 migration を前向きに追加して復元
3. 本番ロールバックは worker version の rollback（`bash scripts/cf.sh rollback`）と組合せ、DB は前進のみ

### 不変条件チェックリスト（CLAUDE.md 準拠）

- [x] D1 への直接アクセスは `apps/api` に閉じる（`apps/web` 直アクセス禁止 / 不変条件 #5）
- [x] consent キーは `publicConsent` / `rulesConsent` に統一（不変条件 #2）
- [x] `responseEmail` は system field として扱う（不変条件 #3）
- [x] フォーム schema 外データは admin-managed として分離（不変条件 #4）
- [x] GAS prototype は本番仕様に昇格させない（不変条件 #6）
- [x] 実フォーム schema をコードに固定しすぎない（不変条件 #1 / `schema_diff_queue` で吸収）

### 連携タスク

| タスク | 連携内容 |
| --- | --- |
| UT-02 | WAL mode 有効化（D1 では設定箇所が異なる） |
| UT-06 | production deploy / migration apply |
| UT-08 | slow query / FK cascade の本番観測 |
| UT-09 | Sheets→D1 cron sync（mapper / sync_jobs） |
| UT-21 | sync endpoint + audit log 連携 |
| UT-26 | staging-deploy-smoke で本番適用後の整合性最終確認 |
