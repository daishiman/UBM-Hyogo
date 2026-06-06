# Phase 8 — リファクタリング

> 本フェーズは実装プロンプトが実コードを書く際に従うべき「重複削減・命名整合・navigation drift」の確定方針である。
> 本タスクは NON_VISUAL（UI/UX 変更なし・D1 seed データと生成スクリプトの追加）であり、リファクタは生成器ロジックと SQL 構築ヘルパに限定する。

---

## 1. 重複削減

カタログ→SQL ジェネレータは「10 メンバー × 複数テーブル（identities / responses / response_fields / status / tags / attendance / photos / deleted_members）」を展開するため、行生成の重複が構造的に発生しやすい。以下を重複削減対象として確定する。

| 対象 | Before（重複の発生源） | After（集約後） | 理由 |
|------|------------------------|-----------------|------|
| member status 行の生成 | 各 member ごとに `member_status` の INSERT 文字列をハンドメイドで 10 回書く | `catalog.members` を入力に取り、`memberStatusRow(member)` を 1 つ定義して `catalog.members.map(memberStatusRow)` で集約 | 10 回の手書きは 10 箇所の修正漏れリスク。SSOT カタログから決定論的に map 展開し、列順・型・actor 列（`updated_by='seed:test-accounts'`）の不整合を構造的に排除する |
| 各テーブルの INSERT 接頭辞 | `INSERT OR REPLACE INTO member_identities (...) VALUES` を各テーブル・各行で文字列リテラルとして反復 | `buildInsert(table, columns, rows)` ヘルパ 1 つに集約し、各テーブルは `(table, columns)` の宣言と `rows` の供給だけを行う | INSERT 句の冪等動詞（`OR REPLACE` / `OR IGNORE`）の選択を 1 箇所に集約し、AC-4（素の `INSERT INTO` を含まない）の不変条件を 1 関数で保証できる |
| SQL 値のエスケープ | 文字列値ごとに `'` の二重化を個別に書く（TEST-MEM-10 の絵文字・特殊文字・長文字列で漏れやすい） | `sqlString(value)` / `sqlJson(obj)` ローカルヘルパに集約（`'` → `''`、JSON は `JSON.stringify` 後に同エスケープ） | TEST-MEM-10 のエッジ描画（長い日本語名・絵文字・特殊文字・全 URL 系キー）で escape 漏れが起きると seed SQL が構文破壊する。エスケープを 1 関数に集約し全行へ一律適用する |
| seed / cleanup の対象テーブル列挙 | seed 側と cleanup 側で「触るテーブル一覧」を別々に列挙 | `TEST_SEED_TABLES` 定数 1 つを seed 投入順（FK 依存の親→子）と cleanup 削除順（子→親の逆順）の双方が参照 | seed が触れたテーブルを cleanup が取りこぼすと残骸が出る。テーブル集合を単一定数化し、cleanup は `[...TEST_SEED_TABLES].reverse()` で導出して AC-6（cleanup 後 0 件）の網羅を構造的に担保する |

### 既存資産との関係（新規ヘルパはローカルに置く）

- 既存 seed 先例 `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` および issue-399 の syntax spec は **手書き SQL** 系であり、本タスクの「カタログ→生成」系とは構築方式が異なる。
- issue-399 と本 seed に「複数 SQL を 1 トランザクションで連続適用する execAll 相当」の共通点はあるが、**既存ファイルには手を入れない**（CONST_005・最小差分）。共通化は `apps/api/src/testing/test-accounts/__tests__/` 配下の **新規ローカルヘルパ**（in-memory D1 へ seed→assert を回す test util）として閉じる。既存 issue-399 spec の execAll を共有依存へ昇格させる作業は本タスクのスコープ外（別関心・将来候補として Phase 10 MINOR / Phase 12 未タスク検出へ渡す）。
- escape / buildInsert ヘルパは `build-seed-sql.ts` 内（生成器ローカル）に置き、生成器以外からは参照させない。汎用ユーティリティ化は YAGNI 抵触のため行わない。

---

## 2. 命名整合

| 観点 | 規約 | 根拠 |
|------|------|------|
| テスト用 ID prefix | `TEST-` を全 ID 軸で一貫（`TEST-MEM-0X` / `TEST-ADM-0X` / `TEST-RES-0X` / `TEST-MTG-0X`）。連番は 2 桁ゼロ埋め | index.md「テスト用判別規約」。prefix 一貫により cleanup の `LIKE 'TEST-%'` が全 ID 軸を一網打尽にできる |
| email ドメイン | `@test.ubm-hyogo.invalid` に統一（RFC 2606 予約 TLD） | 実在せず配信不能。`email LIKE '%@test.ubm-hyogo.invalid'` で判別 |
| actor 列の値 | `created_by` / `updated_by` / `assigned_by` / `uploaded_by` を `seed:test-accounts` に統一 | seed 由来の単一トークンで cleanup 対象を限定 |
| ファイル名 | kebab-case に統一（`build-seed-sql.ts` / `test-accounts-seed.sql` / `test-accounts-cleanup.sql` / `gen-test-accounts-seed.mjs` / `seed-test-accounts.sh` / `mint-test-account-storage-state.ts`） | リポジトリ既存命名規約。`*.spec.ts` のみ（不変条件 #2、`*.test.ts` 禁止） |
| 生成器関数名 | `buildSeedSql(catalog)` / `buildCleanupSql(catalog)` / `buildManifest(catalog)`。動詞 `build` + 目的語で統一 | 純粋関数であることを名前で表明（副作用なし＝drift guard が再実行可能） |

---

## 3. navigation drift

**該当なし。**

理由: 本タスクは NON_VISUAL であり、画面・ルーティング・ヘッダ/フッタ/サイドバーの導線を一切変更しない。追加するのは (1) `apps/api/src/testing/test-accounts/` のカタログ/生成器/spec、(2) `apps/api/migrations/seed/` の生成物 SQL/manifest、(3) `scripts/` の適用 CLI と生成 CLI、(4) `apps/web/playwright/scripts/` の storage-state mint 補助のみで、いずれもユーザー向け画面遷移を持たない。よって navigation drift（既存導線とプロトタイプ正本の乖離）は構造的に発生しない。プロトタイプ正本（`docs/00-getting-started-manual/claude-design-prototype/`）との照合も対象外。

---

## 4. ゲート（実装プロンプト確認用）

- [ ] member 行生成が `catalog.*.map(rowBuilder)` 形で集約され、テーブルごとの手書き反復が残っていない
- [ ] INSERT 句が `buildInsert` 経由に集約され、素の `INSERT INTO`（冪等動詞なし）が 0 箇所（AC-4）
- [ ] 文字列・JSON 値が `sqlString` / `sqlJson` 経由で一律エスケープされ、TEST-MEM-10 の特殊文字でも構文破壊しない
- [ ] 既存 `issue-399-*.sql` / その spec を変更していない（git diff 0）
- [ ] 全 ID が `TEST-` prefix、全 email が `@test.ubm-hyogo.invalid`、actor 列が `seed:test-accounts`
- [ ] navigation 変更 0（UI ファイル差分なし）
