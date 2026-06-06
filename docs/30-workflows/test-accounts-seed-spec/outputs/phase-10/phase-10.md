# Phase 10 — 最終レビュー

> 本タスクは implemented_local_evidence_capturedであり、本フェーズは「Phase 1 で確定した AC-1〜AC-10 が、Phase 2〜9 で確定した設計・生成器・spec によって本 wave で達成可能か」を判定する。
> 実コードは未実装のため、各 AC は「実装で達成可能」見込み判定とする。

---

## 1. 受入基準（AC）達成確認

| AC | 内容（要約） | 達成手段（Phase 2〜9 の確定設計） | 判定 |
|----|--------------|-----------------------------------|------|
| AC-1 | catalog に member 10 / admin 3 / meeting 3、ID 重複なし | `catalog.ts` SSOT に固定リテラルで定義。`catalog.spec.ts` が件数と ID 一意を assert | 実装で達成可能 |
| AC-2 | ログイン可 7（01,02,03,06,07,09,10）/ 不可 3（04 rules_declined / 05 deleted / 08 unknown） | catalog の public_consent / rules_consent / is_deleted から「ログイン3条件」を導出し spec で件数固定 | 実装で達成可能 |
| AC-3 | 公開掲載 5（01,06,07,09,10）/ 非掲載 5 | catalog の public_consent ∧ publish_state ∧ is_deleted から「公開3条件」を導出し spec で件数固定 | 実装で達成可能 |
| AC-4 | `buildSeedSql` が `{seedSql,cleanupSql,manifest}`、seedSql は `BEGIN TRANSACTION;…COMMIT;`、素の `INSERT INTO` を含まない | Phase 8 で `buildInsert` ヘルパに冪等動詞を集約。`build-seed-sql.spec.ts` が構文を assert | 実装で達成可能 |
| AC-5 | in-memory D1 へ seedSql 2 回適用で `TEST-%` 行件数不変 | `INSERT OR REPLACE` / `INSERT OR IGNORE` のみ使用。`test-accounts-seed.contract.spec.ts` が setupD1 で 2 回適用し件数比較 | 実装で達成可能 |
| AC-6 | cleanup 後に対象 10 テーブルすべて 0 件 | `TEST_SEED_TABLES` を逆順に削除する cleanupSql + 末尾の残件検証 SELECT。spec が 0 件を assert | 実装で達成可能 |
| AC-7 | 生成 3 ファイルが committed 版と byte 一致（drift guard） | `gen-test-accounts-seed.mjs` が正規再生成経路。drift spec が再生成して `===` 比較 | 実装で達成可能 |
| AC-8 | manifest が規定 shape、loginable 7 / publicListed 5 / admin active 2 | `buildManifest` が catalog から導出。`build-seed-sql.spec.ts` が shape と件数を assert | 実装で達成可能 |
| AC-9 | 公開掲載 5 件の `response_fields` に `fullName` 存在（空 detail 防止） | catalog の公開掲載 member に answers_json/stable_key を持たせ生成。spec が `fullName` 行存在を assert | 実装で達成可能 |
| AC-10 | `seed-test-accounts.sh --env production`/`prod` が exit 非 0・D1 無変更 | CLI 冒頭で env 値を検査し production/prod を構造的に拒否（local/staging のみ受理） | 実装で達成可能 |

> AC-2 / AC-3 の件数（ログイン可 7 / 不可 3 / 公開掲載 5）は index.md 網羅マトリクスと完全整合。これらが崩れる実装は破壊的回帰とみなす。

---

## 2. blocker 判定

**blocker なし。**

- 新規 D1 schema / migration / API endpoint の追加が不要（既存 surface のみ利用）で、依存追加によるブロックが発生しない。
- 認証 mint は既存 `signSessionJwt`（`packages/shared/src/auth.ts`）と既存 mint 先例（`mint-staging-storage-state.ts`）を再利用するため、新規署名基盤の整備待ちがない。
- in-memory D1 テストは既存 `setupD1` + `vitest.d1.config.ts` を再利用し、新規テスト基盤の整備待ちがない。

---

## 3. MINOR 指摘（Phase 12 未タスク検出へ渡す）

| ID | 指摘 | 区分 | 扱い |
|----|------|------|------|
| MINOR-1 | member_photos はメタデータ行のみ投入し、R2 への写真バイナリ実体は未投入。写真描画の e2e は別関心 | 別関心・スコープ外（index.md「含まない」で明示済） | 写真描画 e2e タスクの **未タスク候補**として Phase 12 へ渡す。本タスクでは manifest にプレースホルダ object_key を記録するのみ |
| MINOR-2 | E2E mint（`mint-test-account-storage-state.ts`）の staging 実行は `STAGING_AUTH_SECRET` 等の env 配線が前提 | 本 wave で設定（user-gated） | 本仕様では env 経由参照を規定。実 secret 投入と staging 実行は実装/運用サイクルで user-gated に実施 |
| MINOR-3 | issue-399 既存 seed と本 seed の execAll 相当を共有依存へ昇格させる共通化余地 | 将来候補（YAGNI 抵触のため今回行わない） | Phase 8 で「既存に手を入れずローカルヘルパに閉じる」と確定。共有化は別タスクの **未タスク候補**として Phase 12 へ渡す |

---

## 4. 総合判定

**GO for implementation.**

- AC-1〜AC-10 はすべて Phase 2〜9 の確定設計で「実装で達成可能」。
- blocker なし。MINOR-1〜3 はいずれも別関心 / user-gated / 将来候補で、本サイクル（CONST_007 1 cycle）の完了を妨げない。
- 不変条件遵守: D1 アクセスは apps/api / scripts に閉じ（不変条件 #5）、E2E は manifest JSON 経由のみ、`*.spec.ts` 統一（不変条件 #2）、新規 schema/migration/endpoint 追加なし（不変条件 #3）、production seed は構造的禁止（AC-10）。
- 次フェーズ: Phase 11 手動テスト（NON_VISUAL 宣言）。
