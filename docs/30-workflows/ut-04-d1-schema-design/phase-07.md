# Phase 7: AC マトリクス / カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス / カバレッジ確認 |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |
| タスク分類 | specification-design（traceability） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

index.md で定義された AC-1〜AC-12 を唯一の AC registry とし、Phase 4（検証スイート）/ Phase 5（実装ファイル）/ Phase 6（failure case）の成果物を縦串で結ぶ。原典 unassigned-task の旧 AC-1〜AC-7 は legacy 入力として扱い、本 Phase では index.md の AC-1〜AC-12 へ拡張してトレースする。同時に、schema は宣言的 SQL のため line/branch coverage ではなく代替指標（migration 適用成功率 / 制約検証通過率 / マッピング充足率）を確定し、4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を更新する。

## 実行タスク

1. AC × 4 列（AC 内容 / 検証 / 実装 / 関連 failure case）の 12 行マトリクスを完成する（完了条件: 空セル無し）。
2. coverage 代替指標（適用成功率 100% / 制約通過率 100% / マッピング充足率 100%）を確定する（完了条件: 計測コマンドと出力先が指定）。
3. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を Phase 4〜6 の成果物を踏まえて更新する（完了条件: 各条件で根拠ファイルが引用される）。
4. 計測の証跡記録方法を定義する（完了条件: dev / production それぞれの実行コマンドと出力先が記述）。
5. Phase 9 への引き継ぎ項目（実測値・gap 分析）を予約する（完了条件: Phase 9 input が箇条書きで明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/index.md | AC-1〜AC-12 の唯一の registry |
| 参考 | docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md | legacy AC 出典（index.md へ拡張済み） |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-04.md | 検証スイート |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-05.md | 実装ファイル |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-06.md | failure case |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | schema 規約 |
| 必須 | CLAUDE.md | scripts/cf.sh 経由実行ルール |

## AC マトリクス

| AC# | AC 内容 | 検証（Phase 4 / 6） | 実装（Phase 5 ファイル） | 関連 failure case（Phase 6） |
| --- | --- | --- | --- | --- |
| AC-1 | D1 テーブル定義（DDL）が設計ドキュメントとして文書化されている | Phase 4「migration 検証」（dry-run）+ Phase 5 outputs/phase-05/implementation-runbook.md の DDL 擬似コード review | `apps/api/migrations/0001_init.sql`、`apps/api/migrations/0002_indexes.sql` | #1（syntax error） |
| AC-2 | Wrangler マイグレーションファイル（`migrations/*.sql`）が作成されている | Phase 4「migration 検証」（apply local/remote） | `apps/api/migrations/0001_init.sql`、`apps/api/migrations/0002_indexes.sql` | #1, #2, #4 |
| AC-3 | Google Sheets の入力項目と D1 カラムのマッピング表が作成されている | Phase 4「Sheets→D1 マッピング契約」 | `outputs/phase-02/sheets-d1-mapping.md` | #5, #10（mapper rejection 経路） |
| AC-4 | dev 環境でのマイグレーション適用が成功している（`d1 migrations apply --local` / `--remote`） | Phase 4「apply (local)」「apply (remote dev)」「冪等性」 | `apps/api/wrangler.toml`（`[env.dev]` database_id 設定）、Phase 5 runbook Step 2〜3 | #3（duplicate）, #13（env mismatch） |
| AC-5 | インデックス・制約（PRIMARY KEY / NOT NULL / UNIQUE / FOREIGN KEY）が適切に定義されている | Phase 4「制約テスト 8 ケース」 | `0001_init.sql`（PK/NOT NULL/UNIQUE/FK/CHECK）、`0002_indexes.sql`（INDEX） | #5, #6, #7, #8, #9, #10 |
| AC-6 | `03-serial-data-source-and-storage-contract` の data-contract.md との整合性レビューが完了している | Phase 4「マッピング契約」レビュー（data-contract と差分ゼロ確認） | `outputs/phase-02/sheets-d1-mapping.md` の data-contract 引用節 | （schema 整合の責務であり個別 case 無し。整合性逸脱は MAJOR で go-no-go に直結） |
| AC-7 | マイグレーション適用手順（dev / main）が runbook として文書化されている | Phase 4「検証コマンド集」+ Phase 6 rollback / DR runbook | `outputs/phase-05/implementation-runbook.md`（dev/production 両環境） | #2, #11, #12, #13, #14 |
| AC-8 | 連番マイグレーション規約が明文化されている | Phase 4 migration list / duplicate apply | `outputs/phase-02/migration-strategy.md` / `apps/api/migrations/README.md` | #3, #13 |
| AC-9 | DATETIME を ISO 8601 TEXT 形式で統一している | Phase 4 CHECK / SELECT 形式確認 | `outputs/phase-02/schema-design.md` | #10 |
| AC-10 | `PRAGMA foreign_keys = ON;` の取り扱いが確定している | FK 採用テーブルがある場合は違反 INSERT、FK 未採用なら N/A 理由を記録 | `outputs/phase-02/migration-strategy.md` | #7, #8, #9（FK 未採用時は N/A） |
| AC-11 | 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS | Phase 10 GO/NO-GO | `outputs/phase-10/go-no-go.md` | MAJOR 判定時は Phase 10 blocker |
| AC-12 | D1 アクセスは `apps/api` に閉じる | spec PR 境界 grep / migration path allowlist | `apps/api/migrations/` / `outputs/phase-13/local-check-result.md` | `apps/web` 参照検出時は即 NO-GO |

## coverage 代替指標と allowlist

### 目標

schema は SQL 宣言的性質のため line/branch coverage は適用しない。代替指標を採用:

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| migration 適用成功率 | 100% | dry-run / local / remote(dev) / 冪等 の 4 経路全成功。production は runbook 記述のみで UT-06 承認後に実行 |
| 制約検証通過率 | 100% | 8 ケース全件で期待エラーが発生 |
| Sheets→D1 マッピング充足率 | 100% | Sheets 全 31 項目が D1 カラムに mapping または「未使用」と明示 |

### 計測対象 allowlist（変更ファイル限定）

```
apps/api/migrations/0001_init.sql
apps/api/migrations/0002_indexes.sql
apps/api/migrations/README.md
apps/api/wrangler.toml          # binding/migrations_dir 差分のみ
outputs/phase-02/sheets-d1-mapping.md
outputs/phase-05/implementation-runbook.md
```

### 禁止パターン（広域指定）

```
apps/api/**/*           # 既存ソースが対象に含まれてしまうため禁止
apps/**                 # monorepo 全域は禁止
```

## 計測の証跡記録

```bash
# migration 適用成功率（5 経路）
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-dev  --env dev
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev  --env dev --local
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev  --env dev --remote
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev  --env dev --local   # 冪等
# production apply は本タスクでは実行しない。UT-06 承認後に runbook として実施。

# 制約検証通過率（8 ケース）
# Phase 4 test-strategy.md の SQL を順次実行し期待エラーを観測
# 結果は outputs/phase-09/manual-smoke-log.md に追記

# マッピング充足率（diff チェック）
diff <(grep -c '^|' outputs/phase-05/sheets-d1-mapping.md) \
     <(echo 31)   # Sheets 31 項目との一致確認

# 出力先（Phase 9 で取得）
# outputs/phase-09/manual-smoke-log.md
# outputs/phase-09/manual-smoke-log.md
# outputs/phase-09/sheets-d1-mapping.md
```

## 4 条件評価（更新）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS（高） | AC-1〜AC-12 が Phase 4 検証 / Phase 5 実装 / Phase 6 failure case でトレース完結。UT-09（Sheets→D1 同期）への前提が確立 |
| 実現性 | PASS | `scripts/cf.sh` 経由で 1Password 認証 → wrangler d1 操作が成立する前提（CLAUDE.md `Cloudflare 系 CLI 実行ルール`）。esbuild / Node 24 不整合は cf.sh 内で解決 |
| 整合性 | PASS（要 Phase 11 確認） | data-contract.md / database-schema.md / Phase 2 schema-design / Phase 5 DDL の 4 文書間で diff ゼロを Phase 11 staging smoke で最終確認。AC-6 が責務 |
| 運用性 | PASS | Phase 5 runbook（Step 0〜5）と Phase 6 DR runbook（rollback / export-restore）がコマンドベースで完結。production 適用前バックアップが必須化 |

## 実行手順

1. 12 行 × 4 列の AC マトリクスを `outputs/phase-07/ac-matrix.md` に転記。
2. coverage 代替指標と allowlist を記録。
3. 広域指定の禁止パターンを Phase 8 DRY 化の入力として固定。
4. 4 条件評価を更新し、根拠ファイルを引用する。
5. Phase 9 への引き継ぎ項目を箇条書きで明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 重複定義（DDL の重複・mapping 表の重複）検出時、AC マトリクスの行が崩れないことを確認 |
| Phase 9 | 代替指標 3 種（適用成功率 / 制約通過率 / マッピング充足率）の実測 |
| Phase 10 | go-no-go の根拠として AC マトリクスの空セル無しと 4 条件 PASS を参照 |
| Phase 11 | AC-4 / AC-7 を staging（dev remote）で再確認、AC-6 を data-contract.md と最終 diff |
| UT-09 | 確定 schema と mapping 契約を入力に同期ジョブ実装 |

## 多角的チェック観点

- 価値性: 7 件 AC が抜け漏れなく検証 → 実装 → failure case にトレースされているか。
- 実現性: 代替指標が schema の宣言的性質に適合し、line/branch coverage の誤用を避けているか。
- 整合性: Phase 4 / 5 / 6 のファイル名・case# と差分ゼロ。
- 運用性: 計測コマンドが `scripts/cf.sh` 経由で PR 上から再現可能か。
- 認可境界: production migration apply が canUseTool で人手承認必須化されているか（Phase 5 確認）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC マトリクス 7 行 × 4 列 | spec_created |
| 2 | coverage 代替指標 3 種確定 | spec_created |
| 3 | 4 条件評価更新 | spec_created |
| 4 | 計測の証跡記録手順確定 | spec_created |
| 5 | Phase 9 引き継ぎ項目予約 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 × failure case のトレース表 + 代替指標 + 4 条件評価 |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC マトリクス 7 行 × 4 列に空セル無し
- [ ] 代替指標 3 種が目標値・計測方法付きで定義
- [ ] 広域指定の禁止パターンが例示
- [ ] 計測コマンドが `scripts/cf.sh` 経由で記述
- [ ] 4 条件評価が根拠ファイル引用付きで PASS 判定
- [ ] Phase 9 への引き継ぎ項目が箇条書き

## タスク100%実行確認【必須】

- 実行タスク 5 件が `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置済み
- AC-1〜AC-12 の 12 行が全て埋まる
- 関連 failure case 列が Phase 6 の case# を 1 つ以上参照（AC-6 は責務型のため可空）
- coverage allowlist と Phase 5 の新規ファイル一覧が一致
- wrangler 直叩きが本ドキュメント内にゼロ件

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 go-no-go の根拠として再利用
  - 代替指標 3 種 → Phase 9 で実測値取得
  - 4 条件評価 → Phase 10 最終判定の入力
  - 広域指定禁止ルール → Phase 8 / Phase 9 で逸脱を防ぐ
- ブロック条件:
  - AC マトリクス空セル残存
  - allowlist が広域指定に変質
  - 4 条件のいずれかが FAIL のまま
