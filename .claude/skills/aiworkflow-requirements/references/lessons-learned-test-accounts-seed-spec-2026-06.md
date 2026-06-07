# Lessons Learned: test-accounts-seed-spec

`implemented_local_evidence_captured / implementation / NON_VISUAL`（2026-06-03）。
10 member + 3 admin のテストアカウントを単一カタログ(SSOT)から決定論的に seed 生成する実装サイクルで得た知見。

| ID | Lesson |
| --- | --- |
| L-TAS-001 | NON_VISUAL かつ「committed 生成物 + drift guard」型タスクのカバレッジは行/分岐ではなく、`SSOT から生成物が byte 一致で再生成できるか（`gen --check` drift guard PASS）+ in-memory D1 適用後のゲーティング期待値 spec PASS` と読み替える。Phase 7 の文面は行/分岐前提のため、生成物型では「カバレッジ = drift guard + ゲーティング期待値 spec」と毎回明示する。 |
| L-TAS-002 | seed / fixture 系の Phase 11 代替証跡は `committed 生成物 + drift spec + in-memory D1(setupD1) 適用 spec` の 3 点で固定する。NON_VISUAL でスクリーンショットを作らない場合に「証跡が薄く見える」誤解を構造的に避けられる。 |
| L-TAS-003 | テスト用判別を単層（prefix だけ等）にすると実データ誤削除リスクが残る。`TEST-` prefix（全 ID 軸）/ `@test.ubm-hyogo.invalid`（RFC 2606 予約 TLD・配信不能）/ `seed:test-accounts` actor 列 の 3 層規約に分解すると、cleanup の `LIKE 'TEST-%'` が全 ID 軸を一網打尽にしつつ本番データへ波及しない。 |
| L-TAS-004 | カタログ→SQL 生成器の重複は `buildInsert(table, columns, rows)` + `sqlString`/`sqlJson` エスケープヘルパ（`'`→`''`、JSON は `JSON.stringify` 後に同エスケープ）+ `TEST_SEED_TABLES` 単一定数（seed=親→子順 / cleanup=`[...TEST_SEED_TABLES].reverse()` で子→親）に集約する。冪等動詞（`OR REPLACE`/`OR IGNORE`）の選択を 1 関数に閉じ込め、AC-4（素の `INSERT INTO` を含まない）を 1 箇所で保証する。 |
| L-TAS-005 | apps/web(Playwright mint) と apps/api(seed catalog) の疎結合は、shared package barrel への型公開ではなく manifest JSON 経由にする。barrel 衝突を避けつつ、web は manifest + `signSessionJwt`(JWT helper) のみ使用し D1 へ直接アクセスしない（不変条件 #5 維持）。 |
| L-TAS-006 | TypeScript catalog(SSOT) を `node --import tsx` の生成 CLI から `.ts` 拡張子付きで import するため、ルート `tsconfig.json` に `allowImportingTsExtensions: true` が必要。また in-memory D1 の contract spec は `vitest.d1.config.ts` の `D1_INCLUDE` へ明示追加しないと走らない（include allowlist 方式）。この 2 設定変更を忘れると drift check / D1 spec が green に見えて未実行になる。 |
| L-TAS-007 | 実装は本 wave で完結させつつ、production seed apply は CLI(`scripts/seed-test-accounts.sh`) で構造的に拒否し、commit / push / PR / 実 D1 への seed apply を user-gated 境界に分離する。実装と外部副作用を CLI 内ガードで分けることで「コードは完成・実投入は承認待ち」を Gate-B passed / Gate-C pending で正確に表現できる。 |
| L-TAS-008 | 同期 wave では lessons-learned ファイルと artifact-inventory の `## Lessons Learned` 節が漏れやすい（本検証でも両方欠落を検出）。`generate-index.js` は `references/` 直下を scan して topic-map / keywords へ自動登録するため、lessons ファイルは必ず `references/` 直下へ置き、inventory 側にも `## Lessons Learned` 節を持たせて二重に残す。 |
