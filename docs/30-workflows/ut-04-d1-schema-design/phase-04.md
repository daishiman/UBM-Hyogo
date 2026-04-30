# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク分類 | specification-design（test-strategy） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 3 で確定した D1 schema 設計（テーブル定義 / 制約 / index / Sheets→D1 マッピング）に対し、Phase 5 着手前に必要な検証スイート（migration dry-run / apply / rollback / 制約検証 / マッピング契約）を設計する。UT-09 の同期ジョブが本 schema に依存するため、本 Phase では schema 自体の検証と「マッピング契約」の事前定義のみを担当し、UT-09 で実装する Sheets→D1 マッパーの単体テストは契約として固定する。

## 実行タスク

1. migration の dry-run / apply / rollback テスト方針を確定する（完了条件: dev/local/remote の 3 経路で操作手順とアサーションが揃う）。
2. schema 制約テスト（NOT NULL / UNIQUE / FOREIGN KEY 違反）を 8 ケース以上設計する（完了条件: 違反 SQL とエラーコード期待値が記述）。
3. Sheets→D1 マッピング契約テストを定義する（完了条件: 各カラムの source-of-truth・型変換規則・null 許容・default 値が表として固定）。
4. coverage 標準（`coverage-standards.md` 準拠）を本タスクに合わせて適用する（完了条件: schema は宣言的な SQL のため line/branch coverage ではなく「migration 適用成功率 100%」「制約検証ケース通過率 100%」の代替指標で記述）。
5. 検証コマンド集（`scripts/cf.sh d1` 経由）を targeted 実行可能な粒度で列挙する（完了条件: wrangler 直叩きが含まれない）。
6. UT-09 への引き渡し契約（マッピング表 / 型 / null/UNIQUE 規約）を不変条件として明示する（完了条件: UT-09 phase-04 の contract test が本契約を参照可能）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-02/schema-design.md | テーブル定義の検証対象 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-03/main.md | base case の取り込み |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 規約・型・命名 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler d1 migrations 仕様 |
| 必須 | docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md | 完了条件（AC 出典） |
| 参考 | https://developers.cloudflare.com/d1/wrangler-commands/ | d1 migrations コマンド |
| 参考 | https://www.sqlite.org/foreignkeys.html | SQLite FK 制約挙動 |

## 検証スイート設計

### 1. migration テスト（dry-run / apply / rollback）

| 検証種別 | 手段 | アサーション |
| --- | --- | --- |
| dry-run | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev` で未適用一覧確認 | 新規 migration ファイルが「Pending」として表示される |
| apply (local) | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local` | exit 0、`sqlite_master` にテーブル存在 |
| apply (remote dev) | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --remote` | exit 0、`d1_migrations` テーブルに行追加 |
| 冪等性 | apply を 2 回連続実行 | 2 回目は no-op（適用済み migration をスキップ） |
| rollback | `DROP TABLE` を含む rollback 用 SQL を別ファイルで準備し手動実行 | 対象テーブル消失、データバックアップから復元可能 |

### 2. schema 制約テスト

| # | 制約 | 違反 SQL 例 | 期待エラー |
| - | --- | --- | --- |
| 1 | PRIMARY KEY | 同一 PK の 2 件目 INSERT | `UNIQUE constraint failed: <table>.id` |
| 2 | NOT NULL（`response_id`） | NULL を INSERT | `NOT NULL constraint failed` |
| 3 | NOT NULL（`responseEmail`） | 値省略 INSERT | 同上 |
| 4 | UNIQUE（`response_id`） | 既存値 INSERT | `UNIQUE constraint failed` |
| 5 | FOREIGN KEY（`member_id`） | 存在しない親 ID で子 INSERT | `FOREIGN KEY constraint failed`（`PRAGMA foreign_keys=ON` 前提） |
| 6 | FOREIGN KEY（ON DELETE） | 親 DELETE 時の子の挙動が設計通り（CASCADE / RESTRICT） | 設計値と一致 |
| 7 | CHECK（`publicConsent IN (0,1)`） | 範囲外値 INSERT | `CHECK constraint failed` |
| 8 | DATETIME 形式（ISO 8601） | 不正文字列 INSERT | アプリ層検証で reject（D1 自体は TEXT として受理されるため、unit テストで mapper が reject する） |

### 3. Sheets→D1 マッピング契約（UT-09 への入力）

| Sheets 列 | D1 カラム | 型 | NULL 可否 | 変換規則 |
| --- | --- | --- | --- | --- |
| Timestamp | `submitted_at` | TEXT (ISO 8601) | NOT NULL | Sheets 値を `new Date(v).toISOString()` で正規化 |
| Email Address | `responseEmail` | TEXT | NOT NULL | system field（フォーム項目ではない）として注入 |
| 公開承諾 | `publicConsent` | INTEGER (0/1) | NOT NULL | "はい"/"いいえ" → 1/0 |
| 規約同意 | `rulesConsent` | INTEGER (0/1) | NOT NULL | 同上 |
| その他 27 項目 | 別途 mapping 表 | TEXT | カラム別に設定 | section 番号で grouping、空セルは NULL |

> 重要: 本マッピング表は UT-09 の `mapper.ts` contract test が参照する不変条件。本タスク内では「契約」のみ固定し、実装は UT-09 で行う。

### 4. coverage 標準（schema は SQL 宣言）

- line/branch coverage は SQL 宣言的性質のため適用不可。代替指標を採用:
  - migration 適用成功率: 100%（dry-run / local / remote / 冪等の 4 経路全成功）
  - 制約検証ケース通過率: 100%（8 ケース全件で期待エラーが発生）
  - マッピング契約カラム充足率: 100%（Sheets 全項目が D1 カラムに mapping または明示的に「未使用」とマーク）
- mapper の line 80%+ / branch 70%+ は UT-09 phase-04 で計測する（本 Phase ではスコープ外）。

## 検証コマンド集（scripts/cf.sh 経由必須）

```bash
# 適用前確認
bash scripts/cf.sh d1 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev

# local apply（Miniflare 内）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local

# remote dev apply
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --remote

# 制約違反の手動再現（local）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "INSERT INTO member_responses(response_id, responseEmail) VALUES ('r1', NULL)"

# schema 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT name, sql FROM sqlite_master WHERE type='table'"
```

> wrangler 直叩き禁止。CLAUDE.md の不変条件に従い `scripts/cf.sh` 経由で 1Password から token を動的注入する。

## 実行手順

1. 検証スイート 3 種類のマトリクスを `outputs/phase-04/test-strategy.md` に転記する。
2. 制約テスト 8 ケースを SQL コマンド付きで列挙する。
3. Sheets→D1 マッピング契約表を Phase 2 schema-design と相互参照する。
4. 検証コマンドを `scripts/cf.sh` 経由で固定し、wrangler 直叩きが残っていないか目視確認する。
5. UT-09 への契約引き渡し項目を不変条件として明示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 検証コマンドを runbook の Step 3〜5 に連結 |
| Phase 6 | 制約違反 8 ケースを failure case の入力に流用 |
| Phase 7 | AC × 検証種別のトレース表に流し込み |
| UT-09 phase-04 | マッピング契約表を mapper の contract test で参照 |

## 多角的チェック観点

- 価値性: AC-1〜AC-12 が検証種別でカバーされるか。
- 実現性: `scripts/cf.sh` 経由の wrangler 実行で 1Password 認証が確実に通るか。
- 整合性: Phase 2 schema-design と制約テストの ON/OFF が一致するか。
- 運用性: dev/local/remote 3 経路の apply が同一 SQL で成功するか。
- セキュリティ: 検証コマンドに API token / SA JSON が露出していないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | migration 検証 5 経路定義 | spec_created |
| 2 | 制約テスト 8 ケース定義 | spec_created |
| 3 | マッピング契約表確定 | spec_created |
| 4 | coverage 代替指標確定 | spec_created |
| 5 | 検証コマンド集（cf.sh 経由）確定 | spec_created |
| 6 | UT-09 引き渡し契約確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | migration 検証・制約テスト・マッピング契約・coverage 代替指標 |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] migration 検証 5 経路（dry-run / local / remote / 冪等 / rollback）が記述
- [ ] 制約違反 8 ケースが SQL + 期待エラー付きで列挙
- [ ] Sheets→D1 マッピング契約表が全項目埋まっている
- [ ] coverage 代替指標（適用成功率 / 制約通過率 / mapping 充足率）が定義
- [ ] 検証コマンドが `scripts/cf.sh` 経由で固定（wrangler 直叩きゼロ）
- [ ] UT-09 への契約が不変条件として明示

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置済み
- AC-1〜AC-12 すべてに 1 つ以上の検証種別が対応
- wrangler 直叩きが残っていないこと

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - 検証コマンド 5 経路 → runbook Step に紐付け
  - 制約テスト 8 ケース → Phase 6 failure case の入力
  - マッピング契約表 → UT-09 contract test の参照元
- ブロック条件:
  - wrangler 直叩きが残存
  - マッピング契約表に未確定セル
