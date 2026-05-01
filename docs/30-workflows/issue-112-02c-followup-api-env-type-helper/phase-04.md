# Phase 4: タスク分解

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画 / runbook) |
| 状態 | pending |

## 目的

Phase 2 / 3 で確定した `Env` interface 設計と `ctx()` refactor 契約を、単一責務原則 (SRP) に基づき実装サブタスク **T1〜T4** に分解する。各サブタスクは独立した PR diff として review 可能な粒度に保ち、Phase 5 の runbook がそのまま編集順序を写像できる形で記述する。

## 分解方針

1. **SRP**: 1 サブタスク = 1 ファイル種別 / 1 責務。型定義（T1）/ 既存実装 refactor（T2）/ ドキュメント反映（T3）/ boundary lint 検証（T4）に分離。
2. **依存順序の最小化**: T1 → T2 はコード上の依存（`import type { Env }`）。T3 / T4 は T1+T2 完了後に独立並行可。
3. **後方互換維持**: T2 の refactor は構造的部分型と `D1Db` alias 継続で 02c unit test を破壊しない（Phase 2 ctx-refactor-contract.md 準拠）。
4. **non-code surface**: 本仕様書フェーズではコードを書かず、各 T の入出力・完了条件のみを定義する。

## サブタスク一覧

### T1: `apps/api/src/env.ts` 新規作成（`Env` interface + binding コメント）

| 項目 | 内容 |
| --- | --- |
| 目的 | apps/api Worker の binding 型契約の正本ファイルを新規作成し、9 件の現行 binding を `Env` interface として export する |
| 入力 | Phase 2 `outputs/phase-02/env-binding-table.md`（9 行 binding 表）、`apps/api/wrangler.toml`（binding 定義の正本） |
| 出力 | `apps/api/src/env.ts` 1 ファイル新規作成。`export interface Env { ... }` を含み、各 field 直前に `// wrangler.toml <section> <key>` コメント、末尾に予約欄コメント（SESSIONS / OAUTH_CLIENT_SECRET / MAGIC_LINK_HMAC_KEY / R2_ARCHIVE） |
| 完了条件 | (a) `apps/api/src/env.ts` 存在、(b) `Env` の 9 field が env-binding-table.md と一致、(c) `mise exec -- pnpm typecheck` exit 0、(d) secret 実値がコメントに含まれない |
| 担当 Phase | Phase 5 (実装) → Phase 8 (CI 検証) → Phase 11 (evidence) |
| 依存 | なし（最先行） |
| AC | AC-1 / AC-2 / AC-7 |

### T2: `_shared/db.ts` の `ctx()` を `Pick<Env, "DB">` に refactor

| 項目 | 内容 |
| --- | --- |
| 目的 | 02c で実装済の `ctx(env: { DB: D1Db })` を `ctx(env: Pick<Env, "DB">)` に置き換え、env 型契約を `Env` 単一参照に集約する |
| 入力 | T1 の `apps/api/src/env.ts`、現行 `apps/api/src/repository/_shared/db.ts`、Phase 2 `outputs/phase-02/ctx-refactor-contract.md` |
| 出力 | `apps/api/src/repository/_shared/db.ts` の差分（追加: `import type { Env } from "../../env"` 1 行、変更: `ctx` シグネチャと body の `as unknown as D1Db` bridge）。`D1Db` / `D1Stmt` / `DbCtx` / helper 群は無変更 |
| 完了条件 | (a) `ctx` シグネチャが `(env: Pick<Env, "DB">) => DbCtx`、(b) `D1Db` alias 継続 export、(c) `mise exec -- pnpm typecheck` exit 0、(d) `mise exec -- pnpm test --filter @ubm/api` 02c 関連 unit test 全 pass |
| 担当 Phase | Phase 5 → Phase 6 (テスト戦略) → Phase 11 |
| 依存 | T1 完了（`Env` import が必要） |
| AC | AC-3 / AC-6 |

### T3: 02c implementation-guide.md への `Hono<{ Bindings: Env }>` 使用例追記

| 項目 | 内容 |
| --- | --- |
| 目的 | 後続タスク（03a / 03b / 04b / 04c / 05a / 05b）が `Env` を一意に参照するための使用例を 02c 親仕様の implementation-guide.md と本タスク `outputs/phase-12/implementation-guide.md` に追記する |
| 入力 | Phase 2 ctx-refactor-contract.md「後続タスクへの contract 出力」節（Hono router 例 / Cron handler 例）、02c implementation-guide.md の現行構成 |
| 出力 | (a) 02c 親仕様 implementation-guide.md の `_shared/db.ts` 節に `Hono<{ Bindings: Env }>` / `ctx(c.env)` 使用例追記、(b) 本タスク `outputs/phase-12/implementation-guide.md` 新規作成（Phase 12 で配置）、(c) wrangler.toml 変更時の運用手順（env.ts 同時更新ルール）を記載 |
| 完了条件 | (a) 2 箇所のガイドに使用例が反映、(b) コード例は markdown ` ```ts ` ブロックで提示、(c) secret 実値を含まない、(d) 03a〜05b の各タスクが「Env を import して Hono に渡す」一行手順で参照可能 |
| 担当 Phase | Phase 5 → Phase 12 (close-out) |
| 依存 | T1 / T2 完了（使用例の正確性担保のため） |
| AC | AC-4 |

### T4: `scripts/lint-boundaries.mjs` の禁止トークン確認 / 必要なら追加 + negative test

| 項目 | 内容 |
| --- | --- |
| 目的 | 不変条件 #5（D1 への直接アクセスは apps/api に閉じる）を boundary lint で機械的に gate する。`apps/web/**` から `apps/api/src/env` を import すると `pnpm lint` が exit non-zero になることを保証する |
| 入力 | `scripts/lint-boundaries.mjs` の現行禁止トークン定義、Phase 9 negative test 設計 |
| 出力 | (a) 禁止トークン現状棚卸し結果（既に `apps/api/**` を含むなら追加不要、含まないなら `apps/api/src/env` を明示追加）、(b) negative test ケース（apps/web 内にダミー import を一時配置 → `pnpm lint` exit code 観測 → 削除）の手順記述、(c) Phase 11 で取得する lint log evidence の形式定義 |
| 完了条件 | (a) `scripts/lint-boundaries.mjs` が `apps/api/src/env` への web からの import を error 検知、(b) negative test exit non-zero を Phase 9 / 11 で記録、(c) false positive（apps/api 内部 import）が発生しない |
| 担当 Phase | Phase 5 → Phase 9 (boundary 検証) → Phase 11 |
| 依存 | T1 完了（`apps/api/src/env.ts` 存在が前提） |
| AC | AC-5 |

## 依存グラフ

```
T1 (env.ts 新規)
 ├── T2 (db.ts refactor)
 │    └── T3 (guide 追記) ※ T1+T2 必要
 └── T4 (boundary lint) ※ T1 のみ必要

実行順: T1 → T2 → (T3 || T4 並行可)
```

## 粒度評価

| サブタスク | 推定 LOC | 単一責務 | review 容易性 |
| --- | --- | --- | --- |
| T1 | +30〜40（コメント込み 1 ファイル） | ✓ 型定義のみ | 高（新規ファイル単独 diff） |
| T2 | ±5〜10（import 1 行 + シグネチャ + cast 1 行） | ✓ ctx() refactor のみ | 高（既存 1 ファイルの最小 diff） |
| T3 | +20〜40（markdown 追記） | ✓ ドキュメント反映のみ | 高（コード変更ゼロ） |
| T4 | ±5（必要時のみ scripts に 1 行追加 + 棚卸しレポート） | ✓ boundary lint のみ | 高（lint script 局所） |

合計新規 LOC は最大でも 100 行未満。small スケールタスク要件を満たす。

## 多角的チェック観点

- **不変条件 #5**: T4 が gate 化を担保。T1 / T2 / T3 はいずれも `apps/api/` 内に閉じる。
- **不変条件 #1**: T1 の `Env` には binding 名と値型のみ。Forms schema 構造を持ち込まない。
- **後方互換**: T2 が構造的部分型と `D1Db` alias 継続で 02c unit test を破壊しない。
- **secret hygiene**: T1 のコメントに secret 実値を貼らない（binding 名のみ）。T3 のガイド例にも実値を含めない。
- **SRP**: 4 サブタスクはそれぞれ「型定義」「refactor」「ドキュメント」「lint gate」と責務が排他。

## 統合テスト連携

| 連携先 Phase | 引き渡す観測 |
| --- | --- |
| Phase 5 | サブタスク 4 件 + 依存グラフ → 編集順序 / runbook へ |
| Phase 6 | T2 の後方互換契約（`Pick<Env, "DB">` + `D1Db` alias）→ テスト戦略 |
| Phase 9 | T4 の boundary lint 設計 → negative test 実行 |
| Phase 11 | 各 T の完了条件に紐づく log evidence 取得点 |

## 完了条件

- [ ] T1〜T4 の目的 / 入力 / 出力 / 完了条件 / 担当 Phase / 依存が表形式で記述
- [ ] 依存グラフ（T1 → T2 → T3 / T4 並行）が明示
- [ ] 各 T の AC 紐付けが AC-1〜7 と整合
- [ ] 粒度評価で合計 LOC が small スケール基準内
- [ ] `outputs/phase-04/main.md` にサブタスク分解サマリ記載

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 4 を completed

## 成果物

- `phase-04.md`（本ファイル）
- `outputs/phase-04/main.md`

## 次 Phase

- 次: Phase 5 (実装計画 / runbook)
- 引き継ぎ: T1 → T2 → T3 / T4 の編集順序、各 T のコマンド、ロールバック手順
