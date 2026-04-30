# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク分類 | specification-design（runbook） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 4 で確定した検証スイートに対し、初期 schema の DDL ファイル一覧（新規）と migration 適用 runbook を確定する。`apps/api/migrations/0001_init.sql` を起点に、Sheets 入力構造に対応する `member_responses` / admin-managed テーブル / 制約 / index を定義し、dev → production の 2 段階で migration を確実に適用するための手順書を整備する。**wrangler 直叩きは禁止し、`scripts/cf.sh` 経由のみ使用する**。

## 実行タスク

1. 新規作成 SQL ファイル一覧を確定する（完了条件: パス・役割・依存関係を含む表が完成）。
2. 修正ファイル一覧（`wrangler.toml` の D1 binding / migrations_dir 等）を確定する（完了条件: 既存 binding を破壊しない差分が示される）。
3. DDL 擬似コード（CREATE TABLE / INDEX / `PRAGMA foreign_keys=ON`）を記述する（完了条件: AC-5 の制約 4 種を全て含む）。
4. 順序付き runbook（Step 0〜5）を完成する（完了条件: 環境準備 → migration 作成 → DDL 記述 → local apply → dev apply → production apply の順で漏れ無し）。
5. sanity check コマンド集を整備する（完了条件: 適用前後で `sqlite_master` 比較が観測できる）。
6. canUseTool 適用範囲を明記する（完了条件: 本タスク内で人手承認が必要なステップ判定がある）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-02/schema-design.md | テーブル定義の入力 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-04/test-strategy.md | 検証コマンドと runbook の wire-in |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler.toml D1 binding / migrations_dir |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | 命名規約・型規約 |
| 必須 | CLAUDE.md | scripts/cf.sh 経由実行ルール |
| 参考 | https://developers.cloudflare.com/d1/reference/migrations/ | migrations 仕様 |

## 新規作成ファイル一覧

| パス | 役割 | 主な依存 |
| --- | --- | --- |
| `apps/api/migrations/0001_init.sql` | 初期 schema（`member_responses` / `admin_*` / `PRAGMA foreign_keys=ON`） | なし |
| `apps/api/migrations/0002_indexes.sql` | 主要 query 用 index（`response_id` UNIQUE / `submitted_at` / FK index） | 0001 |
| `apps/api/migrations/README.md` | migration 番号規約と命名ルール（`NNNN_<snake_case>.sql`） | なし |
| `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-02/sheets-d1-mapping.md` | Sheets→D1 マッピング表（AC-3） | Phase 4 contract |
| `docs/30-workflows/ut-04-d1-schema-design/outputs/phase-05/implementation-runbook.md` | dev / production の適用手順書（AC-7） | scripts/cf.sh |

## 修正ファイル一覧

| パス | 修正内容 |
| --- | --- |
| `apps/api/wrangler.toml` | `[[d1_databases]]` binding 確認、`migrations_dir = "migrations"` 明示、`[env.dev]` / `[env.production]` 別 database_id 設定 |
| `apps/api/package.json` | （依存追加なし。wrangler は monorepo root の devDependency を使用） |

## DDL 擬似コード

### `0001_init.sql`

```sql
-- 必須: D1 / SQLite では FK は明示有効化が必要
PRAGMA foreign_keys = ON;

-- Google Form 回答（Sheets を正本としつつ D1 にコピー）
CREATE TABLE member_responses (
  response_id     TEXT PRIMARY KEY NOT NULL,           -- Sheets 行の一意キー
  responseEmail   TEXT NOT NULL,                       -- system field（フォーム項目外）
  submitted_at    TEXT NOT NULL,                       -- ISO 8601
  publicConsent   INTEGER NOT NULL CHECK (publicConsent IN (0, 1)),
  rulesConsent    INTEGER NOT NULL CHECK (rulesConsent  IN (0, 1)),
  -- Section 1〜6 の 27 項目（詳細は phase-02 schema-design）
  band_name       TEXT,
  band_genre      TEXT,
  -- ... 省略 ...
  raw_payload     TEXT,                                 -- Sheets 行の JSON snapshot
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- admin-managed: フォーム外で運用者が付与する情報
CREATE TABLE admin_member_profiles (
  member_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id     TEXT NOT NULL UNIQUE,
  display_name    TEXT,
  visibility      TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (response_id) REFERENCES member_responses(response_id) ON DELETE RESTRICT
);
```

### `0002_indexes.sql`

```sql
-- Sheets→D1 同期で response_id ベースの upsert を行うため UNIQUE は PK で担保済み
CREATE INDEX idx_member_responses_submitted_at ON member_responses(submitted_at);
CREATE INDEX idx_admin_profiles_response_id     ON admin_member_profiles(response_id);
```

## runbook

### Step 0: 事前準備

```bash
# Node 24 + pnpm 10 を保証
mise install
mise exec -- pnpm install

# Cloudflare 認証確認（scripts/cf.sh 経由・wrangler 直叩き禁止）
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
```

### Step 1: migration ファイル作成

```bash
# 連番規約（NNNN_<snake_case>.sql）に従う
# wrangler の create コマンドも cf.sh 経由
bash scripts/cf.sh d1 migrations create ubm-hyogo-db-dev initial
bash scripts/cf.sh d1 migrations create ubm-hyogo-db-dev indexes

# 出力された apps/api/migrations/0001_init.sql に DDL を記述
# （Phase 5「DDL 擬似コード」を参考に AC-5 の制約 4 種をすべて含める）
```

### Step 2: local 適用（Miniflare）

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local

# schema 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

### Step 3: dev (remote) 適用

```bash
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-dev --env dev
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --remote

# d1_migrations 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "SELECT * FROM d1_migrations ORDER BY id DESC LIMIT 5"
```

### Step 4: production 適用前バックアップ

```bash
# production 適用前は必ず export を取得（rollback 用）
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output backup-$(date +%Y%m%d-%H%M%S).sql
```

### Step 5: production 適用

```bash
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production --remote

# 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "SELECT COUNT(*) FROM sqlite_master WHERE type='table'"
```

## sanity check

```bash
# 適用前のテーブル一覧
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT name FROM sqlite_master WHERE type='table'"

# 適用後（差分が新規テーブルのみであることを目視）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT name FROM sqlite_master WHERE type='table'"

# 制約有効化確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "PRAGMA foreign_keys"
```

## canUseTool 適用範囲

- 自動編集を許可: SQL ファイル新規作成（`Write`）、`wrangler.toml` の binding 修正（`Edit`）。
- 人手承認必須: production 環境への migration apply（Step 5）、`d1 export` の出力先選択。canUseTool で `bash scripts/cf.sh d1 migrations apply --env production` を拒否し、人手で承認のうえ実行する。
- 該当なし: dev/local apply は自動承認可（破壊的影響なし）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 検証コマンドを runbook Step 2〜5 にマップ |
| Phase 6 | runbook の例外パス（apply 失敗 / FK 違反 / 重複 apply）を failure case 入力 |
| Phase 9 | migration 適用成功率 100% を実測 |
| Phase 11 | dev / production runbook を staging で smoke |
| UT-09 | 確定 schema を入力に同期ジョブ実装 |

## 多角的チェック観点

- 価値性: runbook 通りに進めれば AC-2/AC-4/AC-7 が満たせるか。
- 実現性: `scripts/cf.sh` の 1Password 注入が dev / production 双方で成立するか。
- 整合性: 既存 `apps/api/wrangler.toml` の binding を破壊しない差分か。
- 運用性: production 適用前のバックアップ取得が必須化されているか。
- セキュリティ: `wrangler` 直叩きが残っていないか、API token がログ出力されていないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 新規ファイル 5 件確定 | spec_created |
| 2 | 修正ファイル（wrangler.toml）確定 | spec_created |
| 3 | DDL 擬似コード記述 | spec_created |
| 4 | runbook Step 0〜5 確定 | spec_created |
| 5 | sanity check 整備 | spec_created |
| 6 | canUseTool 範囲判定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-runbook.md | 新規/修正ファイル一覧・DDL 擬似コード・Step 0〜5 runbook |
| ドキュメント | outputs/phase-05/implementation-runbook.md | dev / production 別の適用手順書（AC-7 直接成果物） |
| ドキュメント | outputs/phase-05/sheets-d1-mapping.md | AC-3 マッピング表（Phase 4 契約から確定） |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] 新規 SQL/Doc ファイル 5 件が一覧化
- [ ] 修正ファイル（wrangler.toml）の差分が明示
- [ ] DDL 擬似コードに `PRIMARY KEY / NOT NULL / UNIQUE / FOREIGN KEY` が全て含まれる
- [ ] runbook が Step 0〜5 で順序付きかつ `scripts/cf.sh` 経由のみ
- [ ] production 適用前のバックアップ取得が必須化
- [ ] canUseTool 適用範囲が明記（production apply は人手承認）

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物 3 件が `outputs/phase-05/` に配置済み
- Phase 4 の検証コマンドが runbook 内で再利用されている
- wrangler 直叩きが本ドキュメント内にゼロ件

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 各 Step の例外パスが Phase 6 failure case の入力
  - production バックアップ手順を Phase 6 DR runbook が再利用
  - マッピング表を UT-09 phase-05 が参照
- ブロック条件:
  - production migration を未バックアップで Phase 6 へ進む
  - wrangler 直叩きが runbook に残存
