# Phase 7: 受入条件マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 受入条件マトリクス |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (テスト戦略) |
| 次 Phase | 8 (CI / 品質ゲート) |
| 状態 | pending |

## 目的

AC-1〜7 × 検証手段 × evidence ファイル × 不変条件 ID × Phase 番号 の 5 軸マトリクスを `outputs/phase-07/main.md` に固定し、後続 Phase 8〜11 での gate / evidence 取得を一意にトレース可能にする。

## AC マトリクス

| AC | AC 文（要約） | 検証手段 | evidence path（取得 Phase 11） | 不変条件 ID | 関連 Phase |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `apps/api/src/env.ts` が存在し `Env` interface が export されている | (a) ファイル存在確認、(b) `mise exec -- pnpm typecheck` で `import type { Env }` が解決されること | `outputs/phase-11/evidence/file-existence.log`、`outputs/phase-11/evidence/typecheck.log` | #5 | Phase 5 (T1) / Phase 8 / Phase 11 |
| AC-2 | `Env` の各 key が `wrangler.toml` の binding と 1:1 対応（コメントで明示） | (a) `outputs/phase-02/env-binding-table.md` ↔ `apps/api/wrangler.toml` 比較、(b) `apps/api/src/env.ts` 内コメント目視確認 | `outputs/phase-11/evidence/binding-mapping-check.log`（grep / diff 結果） | #5 | Phase 5 (T1) / Phase 11 |
| AC-3 | 02c の `_shared/db.ts` の `ctx()` が `Pick<Env, "DB">` を引数に取り、既存 unit test 全 pass | (a) typecheck、(b) `mise exec -- pnpm test --filter @ubm/api` 全 pass | `outputs/phase-11/evidence/typecheck.log`、`outputs/phase-11/evidence/test.log` | #5 | Phase 5 (T2) / Phase 6 (軸 1, 軸 4) / Phase 8 / Phase 11 |
| AC-4 | 後続タスク向けに `Hono<{ Bindings: Env }>` 使用例が 02c implementation-guide.md および本タスク `outputs/phase-12/implementation-guide.md` に追記されている | (a) 該当ファイルの目視確認、(b) コード block 内のシグネチャが Phase 2 ctx-refactor-contract.md と一致 | `outputs/phase-11/evidence/guide-diff.txt`（git diff） | #5 / #1 | Phase 5 (T3) / Phase 12 / Phase 11 |
| AC-5 | `apps/web/**` から `apps/api/src/env.ts` を import すると boundary lint が error 検出 | apps/web 内ダミー import を一時配置 → `mise exec -- pnpm lint` → exit non-zero 観測 → ダミー削除 | `outputs/phase-11/evidence/boundary-lint-negative.log` | #5 | Phase 5 (T4) / Phase 6 (軸 3) / Phase 9 / Phase 11 |
| AC-6 | refactor 後も `pnpm typecheck` / `pnpm lint` / `pnpm test --filter @ubm/api` がすべて pass | gate-final の 3 コマンド連続実行 | `outputs/phase-11/evidence/typecheck.log`、`lint.log`、`test.log` | #5 | Phase 5 (gate-final) / Phase 8 / Phase 11 |
| AC-7 | secret 値が `env.ts` のコメントや evidence に含まれない | grep `(token\|secret\|hmac\|bearer\|client_secret)` が実値で hit しないこと（プレースホルダのみ許容） | `outputs/phase-11/evidence/secret-hygiene.log` | #5 | Phase 5 (T1, T3) / Phase 9 / Phase 11 |

## 不変条件カバレッジ

| 不変条件 | 観測 evidence 数 | 対応 AC | 充足 |
| --- | --- | --- | --- |
| #5 D1 への直接アクセスは `apps/api` に閉じる | 7 件（typecheck / lint / test / boundary-lint-negative / file-existence / binding-mapping / secret-hygiene） | AC-1 / AC-2 / AC-3 / AC-5 / AC-6 / AC-7 | OK |
| #1 実フォーム schema をコードに固定しすぎない | 1 件（guide-diff.txt） | AC-4 | OK |

## evidence ファイル一覧（Phase 11 取得）

| # | evidence path | 取得元 | 形式 | 関連 AC |
| --- | --- | --- | --- | --- |
| 1 | `outputs/phase-11/evidence/file-existence.log` | `ls apps/api/src/env.ts` | text | AC-1 |
| 2 | `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm typecheck` | text | AC-1 / AC-3 / AC-6 |
| 3 | `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm lint` | text | AC-6 |
| 4 | `outputs/phase-11/evidence/test.log` | `mise exec -- pnpm test --filter @ubm/api` | text | AC-3 / AC-6 |
| 5 | `outputs/phase-11/evidence/boundary-lint-negative.log` | apps/web ダミー配置 → lint | text（exit non-zero） | AC-5 |
| 6 | `outputs/phase-11/evidence/binding-mapping-check.log` | wrangler.toml ↔ env.ts grep / diff | text | AC-2 |
| 7 | `outputs/phase-11/evidence/guide-diff.txt` | `git diff` of implementation-guide.md | text | AC-4 |
| 8 | `outputs/phase-11/evidence/secret-hygiene.log` | grep token/secret/hmac/bearer | text | AC-7 |

## AC × Phase × 不変条件 クロステーブル

| AC | 起票 (Phase 1) | 設計 (Phase 2) | 実装 (Phase 5) | 検証 (Phase 6/8/9) | evidence (Phase 11) | 不変条件 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | ステップ 2 | env.ts 設計 | T1 | Phase 8 typecheck gate | typecheck.log + file-existence.log | #5 |
| AC-2 | ステップ 2 | env-binding-table.md | T1 | コメント / 表照合 | binding-mapping-check.log | #5 |
| AC-3 | ステップ 2 | ctx-refactor-contract.md | T2 | Phase 6 軸 1 + 軸 4 | typecheck.log + test.log | #5 |
| AC-4 | ステップ 2 | 後続 contract 出力 | T3 | guide diff 確認 | guide-diff.txt | #5 / #1 |
| AC-5 | ステップ 2 | boundary lint 設計 | T4 | Phase 6 軸 3 + Phase 9 | boundary-lint-negative.log | #5 |
| AC-6 | ステップ 2 | gate-final 定義 | gate-final | Phase 8 CI gate | typecheck.log + lint.log + test.log | #5 |
| AC-7 | ステップ 2 | secret hygiene 方針 | T1 + T3 | Phase 9 secret hygiene | secret-hygiene.log | #5 |

## 多角的チェック観点

- **不変条件 #5 充足**: 7 evidence で多重 gate（型 / lint / test / boundary / 命名 / secret）。
- **不変条件 #1 充足**: AC-4 の guide-diff.txt にて `Env` が schema 構造を持ち込まないことを目視確認可能。
- **AC ↔ evidence の網羅**: 7 AC × 8 evidence で 1:N 対応、欠落なし。
- **Phase 連携**: 各 AC が「設計 Phase / 実装 Phase / 検証 Phase / evidence Phase」の 4 段階で trace 可能。
- **後方互換**: AC-3 が 02c unit test 全 pass を gate として AC-6 と二重で検証。

## 完了条件

- [ ] AC-1〜7 × 検証手段 × evidence × 不変条件 × Phase の 5 軸マトリクスが完成
- [ ] 不変条件 #5 / #1 が 1 件以上の evidence で観測されることを確認
- [ ] evidence ファイル 8 件の取得元 / 形式が明示
- [ ] AC × Phase × 不変条件 クロステーブルが配置
- [ ] `outputs/phase-07/main.md` にマトリクスサマリ記載

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 7 を completed

## 成果物

- `phase-07.md`（本ファイル）
- `outputs/phase-07/main.md`

## 次 Phase

- 次: Phase 8 (CI / 品質ゲート)
- 引き継ぎ: AC マトリクス完成。evidence 8 件の取得点 / 形式を Phase 11 が読み取って実行。
