# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |
| artifact 注記 | Phase 4-13 は spec_created 骨格として作成、実コード実装は Phase 13 ユーザー承認後の別 PR で行う（`artifacts.json.metadata.artifact_schema_note` 準拠） |

## 目的（仕様化のみ）

Phase 3 で PASS（with notes）が確定した base case（案 D = 固定パス + X-Health-Token + WAF / IP allowlist 併用）に対して、`/health/db` 実装が満たすべき **テスト 5 種（T1〜T5）の Red/Green 条件** を仕様レベルで固定する。本 Phase はテストの実走ではなく、Phase 5 / 6 / 11 で参照する **検証コマンド系列の正本** として確定する。実走は実装 PR 側に委譲する。

> **本 Phase は docs-only / spec_created**。テストコード本体は作成しない。実 endpoint 実装は Phase 13 ユーザー承認後の別 PR で行うため、本 Phase は AC-1〜AC-9 をテスト群にトレースする仕様書骨格に閉じる。

## 依存タスク順序（UT-22 完了必須）

> **UT-22（D1 migration SQL 適用）が completed であることが T1〜T5 実走の必須前提である。**
>
> UT-22 未完了で T1〜T5 を実走すると、production / staging で D1 binding が有効化されていないため `c.env.DB` が `undefined` となり、T2（ハンドラ単体）/ T3（成功時 schema）/ T5（認証透過）が runtime レベルで Red 確定 → false negative となる。本 Phase の T1〜T5 は **UT-22 完了後** に Phase 5 / 6 / 11 で順次走らせる位置づけ。Phase 1 §依存境界（1/3）/ Phase 2 §依存タスク順序（2/3）/ Phase 3 §NO-GO 条件（3/3）の 3 重明記を再確認する。

## 実行タスク

1. T1〜T5 の対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けを表に固定する（完了条件: 5 件すべて埋まる）。
2. AC-1〜AC-9 を T1〜T5 にトレースする（完了条件: AC matrix の左軸が網羅されている）。
3. 実走を Phase 5（T1 / T2 / T3 / T7）/ Phase 6（異常系 T4）/ Phase 11（T5 smoke）に委譲する境界を明記する（完了条件: 各 T の実走 Phase が指定）。
4. UT-22 完了前提を本 Phase の前提条件として再明記する（完了条件: §依存タスク順序に明示）。
5. base case = 案 D の `HEALTH_DB_TOKEN` / ヘッダ tokenを T5 の入力として固定する（完了条件: T5 に token / path placeholder の扱いが記述）。
6. docs-only のため本 Phase ではコマンドを実走しないことを明示する（完了条件: §目的 / §統合テスト連携 に記載）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-01.md | AC-1〜AC-9 の左軸 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md | 擬似コード / レスポンス schema / state ownership |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-03.md | base case PASS 判定 / open question / NO-GO 条件 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-02/main.md | レスポンス schema 詳細 |
| 必須 | apps/api/src/index.ts | 実装対象（Phase 5 実走時参照） |
| 必須 | apps/api/wrangler.toml | D1 binding 確認対象（T1） |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-04.md | テスト戦略フォーマット参照 |
| 参考 | https://hono.dev/getting-started/cloudflare-workers#testing | Hono ハンドラ単体テスト |

## 実行手順

1. Phase 2 / Phase 3 の base case と AC-1〜AC-9 を入力として確認する。
2. T1〜T5 を表化し、対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けを埋める。
3. AC × T のトレース表で抜け漏れを確認する。
4. 実走 Phase（5 / 6 / 11）への委譲境界を明記する。
5. docs-only のため本 Phase ではコマンドを走らせないことを確認する。

## テスト一覧（T1〜T5）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点（実装前）の現状値 / **実走 Phase** = 実コマンドを走らせる Phase

### T1: D1 binding 型 typecheck

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 | `Env.DB: D1Database` 型定義 / `Hono<{ Bindings: Env }>` ジェネリクス（AC-1） |
| 検証コマンド | `mise exec -- pnpm typecheck` |
| 期待値 | exit 0。`apps/api/src/index.ts` 内の `c.env.DB` が `D1Database` として解決され、型エラーゼロ |
| Red 状態 | `Env` 型に `DB` が無いため `c.env.DB` が `unknown` または型エラー |
| 失敗時切り分け | (a) `Env` interface に `DB: D1Database` 追記漏れ / (b) `Hono<{ Bindings: Env }>` ジェネリクス未適用 / (c) `@cloudflare/workers-types` の version 不整合 / (d) `apps/api/tsconfig.json` の types 設定漏れ |
| 実走 Phase | Phase 5（実装ランブック Step 7 typecheck） |

### T2: ハンドラ単体（mock D1 で `SELECT 1` prepare/first 発火）

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 | `app.get("/health/db", ...)` ハンドラの内部呼び出し（AC-2） |
| 検証コマンド | Vitest ハンドラ単体: `app.request("/health/db", {}, { DB: mockD1 })` で `mockD1.prepare("SELECT 1").first()` の呼び出しを spy で確認 |
| 期待値 | `mockD1.prepare` が `"SELECT 1"` 引数で 1 回 call、戻り値 `.first()` が await 経由で発火 |
| Red 状態 | ハンドラ未実装のため 404 / `prepare` 未呼び出し |
| 失敗時切り分け | (a) ハンドラ未登録 / (b) `prepare` の引数文字列が `"SELECT 1"` でない / (c) `await .first()` が `.run()` などへ誤置換 / (d) mock D1 の binding 注入経路不備 |
| 実走 Phase | Phase 5（実装ランブック Step 4 ハンドラ実装後） |

### T3: 成功時応答 schema 検証（200 + JSON shape）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 | 成功時レスポンス（AC-3） |
| 検証コマンド | `curl -sS -o /tmp/out.json -w "%{http_code}\n" "${API_BASE}/health/db"` および `jq` での shape 検証 |
| 期待値 | HTTP `200` + JSON 本体が **完全一致** で `{"ok":true,"db":"ok","check":"SELECT 1"}` / `Content-Type: application/json` |
| Red 状態 | endpoint 未実装で 404、または 200 だが shape mismatch（`db` キー欠落 / `check` 文字列差異） |
| 失敗時切り分け | (a) endpoint 未登録 / (b) `c.json(...)` の引数 shape 差異 / (c) `check` 文字列が `"SELECT 1"` 以外 / (d) status code が 200 以外（200 でなければ AC-3 違反） |
| 実走 Phase | Phase 5（local smoke Step 6）+ Phase 11（staging / production smoke S-03） |

### T4: 失敗時応答 schema 検証（503 + JSON shape + Retry-After）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 | 失敗時レスポンス（AC-4） |
| 検証コマンド | D1 binding を strip した環境 / mock D1 が `prepare` で throw する状況下で `curl -sS -i "${API_BASE}/health/db"` |
| 期待値 | HTTP `503` + ヘッダに `Retry-After: 30` 存在 + JSON 本体が `{"ok":false,"db":"error","error":"<string>"}` |
| Red 状態 | catch 節未実装で 500 + プレーンテキスト / `Retry-After` ヘッダ欠落 / `db` キーが `"ok"` のまま |
| 失敗時切り分け | (a) try/catch 未実装 → 500 落ち / (b) `c.header("Retry-After", "30")` 漏れ / (c) status code が 503 でない（UT-08 通知基盤の閾値設計と乖離） / (d) `error` フィールドが string でなく object |
| 実走 Phase | Phase 6（異常系検証）/ Phase 11（staging fault injection smoke S-07） |

### T5: 認証 / WAF 透過確認（固定パス + X-Health-Token + WAF / token 不在で 401/403）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 | 案 D（固定パス + X-Health-Token + WAF / IP allowlist）の defense in depth（AC-6） |
| 検証コマンド | (a) 正しい token 経路: `curl -sS -o /dev/null -w "%{http_code}" "${API_BASE}/health/db"` / (b) token なし: `curl -sS -o /dev/null -w "%{http_code}" "${API_BASE}/health/db"` / (c) 誤 token: `curl -sS -o /dev/null -w "%{http_code}" "${API_BASE}/health/db with invalid X-Health-Token"` |
| 期待値 | (a) `200` / (b) `401` または `403`（WAF 経由 403 / endpoint 経由 401 のいずれか）/ (c) `404`（path 不一致）または `403`（WAF block） |
| Red 状態 | (b) / (c) でも `200` が返る → unauth で D1 ping 可能 = 不変条件 #5 周辺リスク露出 |
| 失敗時切り分け | (a) WAF rule 未適用 / 解除事故 / (b) 認証ヘッダ がコードに hardcode されており推測可能 / (c) `HEALTH_DB_TOKEN` の Cloudflare Secrets binding 未注入 / (d) `cf-connecting-ip` allowlist の bypass |
| 実走 Phase | Phase 11（staging smoke で WAF + token 経路確認） |

## AC × T トレース表

| AC | 内容 | 紐付く T |
| --- | --- | --- |
| AC-1 | `Env.DB: D1Database` 型定義 | T1 |
| AC-2 | `SELECT 1` 実行仕様 | T2 |
| AC-3 | 成功 200 + JSON shape | T3 |
| AC-4 | 失敗 503 + JSON shape + Retry-After | T4 |
| AC-5 | wrangler.toml D1 binding 確認 | T1（typecheck 経由）/ Phase 5 Step 1 |
| AC-6 | 認証 / WAF / IP allowlist 方針（案 D） | T5 |
| AC-7 | Phase 11 smoke 期待値テンプレ整合 | T3 / T4（テンプレ正本として参照） |
| AC-8 | metadata 一致 | （非テスト系 / Phase 12 ドキュメント検証） |
| AC-9 | 不変条件 #5 侵害なし | T2 / T3（apps/api 内閉包の確認）/ Phase 8 |

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| 型契約（`Env.DB: D1Database`） | T1 で 100% 被覆 |
| ハンドラ実装（prepare/first 呼び出し） | T2 で 100% 被覆 |
| 成功 / 失敗の wire format | T3 + T4 で両分岐被覆 |
| 認証 / WAF defense in depth | T5 で正常 / token 欠落 / 誤 token の 3 パターン被覆 |
| AC-1〜AC-9 トレース | AC × T 表で抜け漏れゼロ |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | T1（typecheck）/ T2（ハンドラ単体）/ T3（local smoke 200）の Green を実装着手後に確認 |
| Phase 6 | T4（503 + Retry-After）+ D1 ダウン / binding 未注入 / WAF 解除事故の異常系展開 |
| Phase 7 | AC × T トレース表を AC matrix の左軸に流用 |
| Phase 8 | T5 を案 D（ヘッダ token + WAF）のセキュリティ章エビデンスとして参照 |
| Phase 11 | T3 / T4 / T5 を staging smoke S-03 / S-07 の期待値テンプレ正本として再利用 |

> **本 Phase は実走しない**。T1〜T5 は仕様化のみで Phase 5 へ進み、実走は Phase 5 / 6 / 11 の各 lane が担う。

## 多角的チェック観点

- **不変条件 #5 違反**: T2 / T3 のテストハーネスが `apps/web` 経由で D1 を叩く形になっていないか。`apps/api` 内の Hono ハンドラ単体に閉じているか。
- **D1 binding 型契約**: T1 typecheck で `c.env.DB` が `D1Database` 解決されることが Green 条件として残っているか。
- **503 + Retry-After 整合**: T4 で `Retry-After: 30` のヘッダ存在が assertion に含まれており、UT-08 通知基盤の閾値合意と整合するか。
- **認証 bypass**: T5 の (b)(c) で `200` が返らないことを Red→Green の境界として明示しているか。
- **smoke drift**: T3 / T4 の期待値が Phase 11 smoke S-03 / S-07 のテンプレと完全一致しているか（drift ゼロ）。
- **UT-22 完了前提**: 本 Phase の §依存タスク順序で T1〜T5 実走前提として再確認されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | T1〜T5 の表化 | 4 | spec_created | 5 件すべて記述 |
| 2 | AC × T トレース表 | 4 | spec_created | AC-1〜AC-9 |
| 3 | 実走 Phase（5 / 6 / 11）の委譲境界 | 4 | spec_created | 各 T に明記 |
| 4 | UT-22 完了前提の再明記 | 4 | spec_created | §依存タスク順序 |
| 5 | base case = 案 D の token / path 反映 | 4 | spec_created | T5 |
| 6 | docs-only 明示（本 Phase 実走なし） | 4 | spec_created | §目的 / §統合テスト連携 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-04.md | 本ファイル（Phase 4 タスク仕様書） |

> **outputs なし**: `artifacts.json.metadata.artifact_schema_note` の通り、Phase 4-13 は spec_created 骨格として `phase-NN.md` のみを作成し、`outputs/phase-NN/main.md` は実コード実装を伴う別 PR で生成する。本ワークフローでは生成しない。

## 完了条件 (Acceptance Criteria for this Phase)

- [x] T1〜T5 の 5 件すべてが対象 / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分け / 実走 Phase の 6 列を埋めている
- [x] AC × T トレース表で AC-1〜AC-9 が抜け漏れなく T へ紐付いている
- [x] UT-22 完了前提が §依存タスク順序 に明示されている
- [x] base case = 案 D（固定パス + X-Health-Token + WAF）が T5 の前提として記述されている
- [x] 実走 Phase（5 / 6 / 11）への委譲境界が各 T に明記されている
- [x] 不変条件 #5 が多角的チェック観点に含まれている
- [x] 本 Phase が docs-only / spec_created であり実走しない旨が明記されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- T1〜T5 の表に空セルなし
- 本 Phase の状態が `spec_created`、`outputs` 配下にファイルを作成していない
- artifacts.json の `phases[3].status` が `spec_created`、`phases[3].outputs` が `[]`

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T5 を Phase 5 ステップ 1〜7 の Green 条件として参照
  - T3 / T4 の期待値テンプレを Phase 11 smoke S-03 / S-07 へ
  - T5 を Phase 8 セキュリティ章のエビデンスへ
  - UT-22 完了確認を Phase 5 Step 0 必須ゲートへ
- ブロック条件:
  - UT-22 が completed でない
  - T1〜T5 のいずれかに期待値・検証コマンド欠落
  - AC × T トレース表に抜け漏れ
  - 不変条件 #5 を侵害するテストハーネス（`apps/web` 経由で D1）が含まれている
