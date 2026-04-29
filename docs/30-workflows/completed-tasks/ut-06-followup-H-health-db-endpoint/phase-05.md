# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（D1 binding 確認 / `Env` 型 / Hono ジェネリクス / `/health/db` ハンドラ / 認証経路 / local smoke / typecheck） |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系・エラーハンドリング) |
| 状態 | spec_created |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |
| artifact 注記 | Phase 4-13 は spec_created 骨格として作成、実コード実装は Phase 13 ユーザー承認後の別 PR で行う（`artifacts.json.metadata.artifact_schema_note` 準拠） |

## 目的

Phase 4 で固定した T1〜T5 を Green にするための **実装ステップ列（Step 1〜7）を仕様レベルで手順書化** する。本 Phase の成果物は実装担当者（人間 / Claude Code / 別 PR 担当者）が **別 PR で逐次実行するためのランブック** であり、本ワークフロー (`ut-06-followup-H-health-db-endpoint`) は **仕様化までで完了**（taskType=implementation / workflow_mode=docs-only / spec_created）。実コード適用・コミット作成・デプロイは本 PR では一切行わない。

> **重要**: 本 Phase は手順書（runbook）の正本化であり、`apps/api/src/index.ts` や `apps/api/wrangler.toml` への実編集は行わない。Step 1〜7 は **Phase 13 ユーザー承認後の別 PR** で実走される位置づけ。

## 実装委譲先

| 役割 | 担当 |
| --- | --- |
| 本 Phase（仕様化） | 本ワークフロー (`ut-06-followup-H-health-db-endpoint`) — Phase 5 仕様書整備のみ |
| **実コード実装** | **Phase 13 ユーザー承認後の別 PR 担当者** が Step 1〜7 を順次実走 |
| typecheck / lint / smoke 実走 | 別 PR 担当者（Phase 5 Step 6 / 7 / Phase 11） |
| デプロイ（staging / production） | UT-06 Phase 11 / Phase 13 担当者（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env <env>`） |

## 依存タスク順序（UT-22 完了必須・3 重明記の最終再確認）

> **UT-22（D1 migration SQL 適用）が completed でなければ、本 Phase の Step 1 以降を別 PR で実走することは禁止である。**
>
> UT-22 未完了で Step 4 ハンドラ実装まで到達しても、production / staging で D1 binding が有効化されていないため runtime で `c.env.DB` が `undefined` となり、ハンドラが catch 節へ落ちて常時 503 を返す（false negative）。これは Phase 1 §依存境界（1/3）/ Phase 2 §依存タスク順序（2/3）/ Phase 3 §NO-GO 条件（3/3）で 3 重明記済みの最重要前提であり、本 Phase Step 1 冒頭で **UT-22 完了確認ゲート** として最終再確認する。
>
> UT-22 未完了時の挙動: Step 1 で D1 binding が空 / Step 4 ハンドラが runtime で常時 catch 節 → 503。**Step 0 ゲートで block する**。

## UT-22 完了の前提確認【実装着手前の必須ゲート / Step 0】

別 PR 実装担当者は **Step 1 に入る前に** 以下を必ず確認する。1 件でも該当した場合は実装着手禁止 → Phase 3 NO-GO 条件へ差し戻す。

```bash
# UT-22 完了確認（必須）
ls docs/30-workflows/completed-tasks/ | rg "ut-22"             # 完了タスクとして配置されているか
gh issue view <UT-22 issue> --json state                       # state: CLOSED
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production   # 適用済み migration が並ぶか
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging      # staging も同様
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| UT-22 task の `status` | `completed` | `pending` / `in_progress` |
| GitHub Issue 状態 | `CLOSED` | `OPEN` |
| `d1 migrations list` 出力 | production / staging で 1 件以上 applied | 空 / error |
| `apps/api/wrangler.toml` の `[[d1_databases]]` | production / staging / development の 3 env で `binding = "DB"` 存在 | いずれかの env で未定義 |

**1 つでも NO-GO 条件に該当 → 実装着手禁止 → 本 Phase を pending に戻し UT-22 完了を待つ。**

## 実行タスク

1. UT-22 完了ゲートを実装着手前の必須確認として固定する（完了条件: §UT-22 完了の前提確認 セクションの存在）。
2. Step 1〜7 の検証コマンド / ロールバック手順 / 想定所要時間 / UT-22 未完了時の挙動を表化する（完了条件: 7 ステップすべてで 4 列が埋まっている）。
3. base case = 案 D（固定パス + X-Health-Token + WAF）の `HEALTH_DB_TOKEN` 注入経路を Step 5 として固定する（完了条件: 1Password / Cloudflare Secrets 経路が記述）。
4. ロールバック設計（endpoint 削除 + secret 廃止 + WAF rule 解除）を 1〜2 コミット粒度で記述する（完了条件: §ロールバック総括）。
5. 本 Phase が docs-only / spec_created であり、実コード適用は Phase 13 後の別 PR で行う旨を 3 箇所以上で明記する（完了条件: §目的 / §実装委譲先 / §成果物 / §タスク100%実行確認 のいずれにも記述）。
6. 不変条件 #5 を多角的チェック観点に含める（完了条件: §多角的チェック観点 に明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md | 擬似コード / レスポンス schema / state ownership |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-03.md | base case = 案 D / open question |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-04.md | T1〜T5（Green 条件） |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-02/main.md | 擬似コード詳細 |
| 必須 | apps/api/src/index.ts | 実装対象（別 PR） |
| 必須 | apps/api/wrangler.toml | D1 binding 確認対象（別 PR） |
| 必須 | CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール | `bash scripts/cf.sh` 経由運用 / 1Password 経由 secret |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-05.md | 実装ランブックフォーマット参照 |
| 参考 | https://hono.dev/getting-started/cloudflare-workers#bindings | Hono Bindings ジェネリクス |
| 参考 | https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/ | D1 prepare/first API |

## 実行手順

1. Step 0 で UT-22 完了を確認し、NO-GO 条件を判定する。
2. Step 1〜5 で D1 binding → 型 → ジェネリクス → ハンドラ → 認証経路を順次組み立てる。
3. Step 6 で local smoke、Step 7 で typecheck / lint を通過させる。
4. ステージング / 本番デプロイは UT-06 Phase 11 / Phase 13 の責務であり、本 Phase の Step では行わない。

## 実装手順（Step 1〜7）

### Step 1: D1 binding 確認（lane 0）

| 項目 | 内容 |
| --- | --- |
| 目的 | `apps/api/wrangler.toml` の `[[d1_databases]]` が production / staging / development の 3 env で `binding = "DB"` を保持していることを確認する（AC-5） |
| 検証コマンド | `rg -n "\[\[d1_databases\]\]" apps/api/wrangler.toml` および `rg -n "binding = \"DB\"" apps/api/wrangler.toml` で env 別の binding 数を確認 |
| 期待値 | production / staging / development の 3 env すべてで `binding = "DB"` が hit |
| ロールバック手順 | 本 Step は read-only の確認のみ。ロールバック不要 |
| 想定所要時間 | 5 分 |
| UT-22 未完了時の挙動 | `[[d1_databases]]` が空 or `database_id` が `placeholder` のままの可能性大 → Step 0 へ差し戻し |

### Step 2: `Env` 型定義の追加（lane 1）

| 項目 | 内容 |
| --- | --- |
| 目的 | `apps/api/src/index.ts`（または専用 `types.ts`）に `interface Env { DB: D1Database; }` を追加（AC-1） |
| 編集対象 | `apps/api/src/index.ts` の `Env` 既存 interface に `DB: D1Database;` を追記。既存 binding は破壊しない |
| 検証コマンド | `mise exec -- pnpm typecheck`（T1 Green 条件） |
| 期待値 | typecheck exit 0 / `c.env.DB` が `D1Database` として解決 |
| ロールバック手順 | 当該 1 行 (`DB: D1Database;`) を revert（**コミット 1** 単位で revert 可能） |
| 想定所要時間 | 5 分 |
| UT-22 未完了時の挙動 | typecheck は通る（型は構造的）が runtime で `c.env.DB` が undefined になる |

### Step 3: Hono ジェネリクス適用（lane 1）

| 項目 | 内容 |
| --- | --- |
| 目的 | `new Hono<{ Bindings: Env }>()` で binding 型を Hono に伝播させ、`c.env.DB` を型安全に参照可能にする（AC-1） |
| 編集対象 | `apps/api/src/index.ts` の Hono インスタンス生成箇所。既存ジェネリクスがあれば `Bindings: Env` の追加に留める |
| 検証コマンド | `mise exec -- pnpm typecheck`（T1 Green 継続） |
| 期待値 | `c.env.DB` 参照箇所すべてで型エラーゼロ |
| ロールバック手順 | ジェネリクスを直前の形に revert（Step 2 と同コミットに統合可、**コミット 1** 内） |
| 想定所要時間 | 5 分 |
| UT-22 未完了時の挙動 | 型レベルでは検知不可（typecheck は通る） |

### Step 4: `GET /health/db` ハンドラ実装（lane 2）

| 項目 | 内容 |
| --- | --- |
| 目的 | `SELECT 1` を実行し、成功時 200 / 失敗時 503 + `Retry-After: 30` を返すハンドラを追加（AC-2 / AC-3 / AC-4） |
| 編集対象 | `apps/api/src/index.ts`。Phase 2 §3 擬似コードを実装 |
| 擬似コード | `app.get("/health/db", async (c) => { try { const r = await c.env.DB.prepare("SELECT 1").first(); if (!r) throw new Error("SELECT 1 returned null"); return c.json({ ok: true, db: "ok", check: "SELECT 1" }, 200); } catch (e) { c.header("Retry-After", "30"); return c.json({ ok: false, db: "error", error: e instanceof Error ? e.message : String(e) }, 503); } });` |
| 検証コマンド | T2（ハンドラ単体 mock D1）/ T3（成功 200）/ T4（失敗 503 + Retry-After）/ Phase 4 参照 |
| 期待値 | T2 / T3 / T4 すべて Green |
| ロールバック手順 | ハンドラ登録行と関数本体を revert（**コミット 2** 単位で revert） |
| 想定所要時間 | 15 分 |
| UT-22 未完了時の挙動 | runtime で常時 catch 節へ落ち、503 + Retry-After を返す（false negative）→ Step 0 ゲートで block 必須 |

### Step 5: 認証 / WAF 経路（案 D — 固定パス + X-Health-Token + WAF / IP allowlist）

| 項目 | 内容 |
| --- | --- |
| 目的 | 案 D の defense in depth（固定パス + X-Health-Token + WAF）を有効化（AC-6 / T5 Green） |
| 実装パターン | (a) ヘッダ token: ハンドラ登録パスは `/health/db` に固定し、`HEALTH_DB_TOKEN` を Cloudflare Secrets binding 経由で `c.env.HEALTH_DB_TOKEN` から取得 / (b) WAF rule: Cloudflare WAF dashboard で path `/health/db` への access を許可 IP / rate limit に絞る |
| Secret 注入経路 | 1Password `op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN` → `.env`（op:// 参照のみ）→ `bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env <env>`。CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール 準拠（`wrangler` 直接実行禁止） |
| 検証コマンド | T5（正常 token / token 欠落 / 誤 token の 3 パターン） |
| 期待値 | 正常 200 / 欠落 401 or 403 / 誤 token 404 or 403 |
| ロールバック手順 | (1) ハンドラパスを固定 `/health/db` に戻す → (2) `bash scripts/cf.sh secret delete HEALTH_DB_TOKEN` → (3) WAF rule 解除（dashboard）。逆順で 3 段階 |
| 想定所要時間 | 30 分（WAF rule 設定含む） |
| UT-22 未完了時の挙動 | Secret / WAF 設定自体は UT-22 と独立。ただし Step 4 ハンドラが常時 503 のため smoke は意味をなさない |

### Step 6: ローカル smoke（lane 3）

| 項目 | 内容 |
| --- | --- |
| 目的 | local 環境で `/health/db` が 200 + 期待 JSON shape を返すことを確認（AC-3 / T3 Green） |
| 検証コマンド | `mise exec -- pnpm dev`（apps/api 起動）→ `curl -sS -i "http://localhost:8787/health/db"` |
| 期待値 | HTTP 200 / `{"ok":true,"db":"ok","check":"SELECT 1"}` / `Content-Type: application/json` |
| ロールバック手順 | local 環境の挙動確認のみ。プロセス停止で完了 |
| 想定所要時間 | 10 分 |
| UT-22 未完了時の挙動 | local 用 D1 binding（development 環境）が無いと 503。`bash scripts/cf.sh d1 list` で local D1 の存在を確認 |

### Step 7: typecheck / lint 通過確認（lane 4）

| 項目 | 内容 |
| --- | --- |
| 目的 | Step 2〜5 の編集が typecheck / lint を破壊していないこと（T1 Green の最終ロック） |
| 検証コマンド | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
| 期待値 | 両者 exit 0 |
| ロールバック手順 | 失敗箇所を Step 2〜5 の該当コミットへ revert |
| 想定所要時間 | 5 分 |
| UT-22 未完了時の挙動 | 型レベルでは検知不可（typecheck は通る）。runtime 検証は Phase 11 smoke へ |

## コミット粒度（実装担当者向け）

| # | メッセージ案 | スコープ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | `feat(api): add Env.DB binding type for D1` | Step 2 + Step 3（型 + ジェネリクス） | 型契約 / 既存 binding 破壊なし |
| 2 | `feat(api): add GET /health/db D1 ping endpoint` | Step 4（ハンドラ） | 200 / 503 / Retry-After / 不変条件 #5 閉包 |
| 3 | `chore(api): wire HEALTH_DB_TOKEN header token + WAF` | Step 5（認証経路） | secret 経路 / WAF rule 連動 / token rotation 手順 |

> **3 コミット粒度の理由**: ロールバックを「型」「ハンドラ」「認証」の 3 レイヤで独立に巻き戻せるよう、Phase 2 ロールバック設計に従って分離する。

## ロールバック総括

| シナリオ | 手順 |
| --- | --- |
| ハンドラ自体を撤去 | コミット 2 を revert（endpoint 即時 404 化） |
| 認証経路のみ撤去（endpoint は残す → 案 B / C 縮退） | コミット 3 を revert + WAF rule 解除（Phase 3 open question #1 縮退ルート） |
| 全撤去 | コミット 3 → 2 → 1 の順で逆 revert + `bash scripts/cf.sh secret delete HEALTH_DB_TOKEN` + WAF rule 解除 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | T1〜T5 を Step 2 / 4 / 5 の Green 条件として参照 |
| Phase 6 | Step 4 catch 節の異常系展開（D1 ダウン / binding 未注入 / Retry-After 欠落 / WAF 解除事故） |
| Phase 8 | Step 5 の `HEALTH_DB_TOKEN` 経路をセキュリティ章へ |
| Phase 10 | コミット粒度 3 件をロールアウト / ロールバック設計の根拠に再利用 |
| Phase 11 | Step 4 / Step 5 / Step 6 の smoke 形式を staging / production smoke S-03 / S-07 に展開 |
| Phase 12 | Step 5 の `HEALTH_DB_TOKEN` rotation 手順を運用 SOP として記述（open question #4 解決） |
| Phase 13 | 本ランブックを別 PR 担当者へ受け渡し、ユーザー承認後に実走 |

## 多角的チェック観点

- **不変条件 #5 違反**: Step 1〜5 のいずれの編集も `apps/web/*` を触らないか。ハンドラが `apps/api/src/index.ts` 内に完全閉包されているか。
- **D1 binding 型契約**: Step 2 / Step 3 で `Env.DB: D1Database` + `Hono<{ Bindings: Env }>` が両立しているか。
- **503 + Retry-After 整合**: Step 4 catch 節で `c.header("Retry-After", "30")` が必ず実行されるか（UT-08 通知基盤の閾値合意と整合）。
- **認証 bypass**: Step 5 で `HEALTH_DB_TOKEN` が hardcode されず、Cloudflare Secrets 経由で注入されているか。`wrangler` 直接実行禁止ルールを遵守し `bash scripts/cf.sh` 経由のみ使用しているか。
- **smoke drift**: Step 6 の curl 期待値が Phase 4 T3 / Phase 11 S-03 と完全一致しているか。
- **UT-22 完了前提**: Step 0 ゲートが §UT-22 完了の前提確認 で固定されているか（3 重明記の最終再確認 = Phase 5 内ゲート）。
- **docs-only 境界**: 本 Phase では実コード適用を行わず、Phase 13 後の別 PR が Step 1〜7 を実走する境界が明示されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | UT-22 完了ゲート（Step 0）の固定 | 5 | spec_created | 必須前提・3 重明記の最終再確認 |
| 2 | Step 1〜7 の表化（検証コマンド / ロールバック / 所要時間 / UT-22 未完了時挙動） | 5 | spec_created | 7 ステップ × 4 列 |
| 3 | base case 案 D の `HEALTH_DB_TOKEN` 注入経路 | 5 | spec_created | Step 5 / 1Password / cf.sh |
| 4 | ロールバック設計（3 コミット粒度） | 5 | spec_created | §ロールバック総括 |
| 5 | docs-only / spec_created 明示（実コード実装は別 PR） | 5 | spec_created | §目的 / §実装委譲先 / §成果物 |
| 6 | 不変条件 #5 を多角的チェックへ | 5 | spec_created | §多角的チェック観点 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書（手順書） | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-05.md | 本ファイル（Phase 5 実装ランブック仕様） |
| 別 PR 成果（参考 / 本ワークフローでは生成しない） | `apps/api/src/index.ts` diff（Step 2〜4）/ `wrangler.toml` 確認ログ（Step 1）/ secret 注入ログ（Step 5）/ smoke ログ（Step 6） | **Phase 13 ユーザー承認後の別 PR** で生成 |

> **outputs なし**: `artifacts.json.metadata.artifact_schema_note` の通り、Phase 4-13 は spec_created 骨格として `phase-NN.md` のみを作成し、`outputs/phase-05/main.md` は実コード実装を伴う別 PR で生成する。本ワークフローでは生成しない。

## 完了条件 (Acceptance Criteria for this Phase)

- [x] Step 0 として UT-22 完了確認ゲートが冒頭に固定されている（3 重明記の最終再確認）
- [x] Step 1〜7 が検証コマンド / ロールバック手順 / 想定所要時間 / UT-22 未完了時の挙動の 4 列を埋めている
- [x] base case = 案 D の `HEALTH_DB_TOKEN` 注入経路が Step 5 で `bash scripts/cf.sh` 経由で記述されている
- [x] 3 コミット粒度（型 / ハンドラ / 認証）が分離設計されている
- [x] 本 Phase が docs-only / spec_created であり、実コード実装は Phase 13 ユーザー承認後の別 PR で行う旨が 3 箇所以上で明記されている
- [x] 不変条件 #5 が多角的チェック観点に含まれている
- [x] ロールバック総括が 1〜2 コミット粒度で記述されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- Step 1〜7 の表に空セルなし
- 本 Phase の状態が `spec_created`、`outputs` 配下にファイルを作成していない
- 実コード（`apps/api/src/index.ts` / `apps/api/wrangler.toml`）への編集を一切行っていない（hard rule 準拠）
- artifacts.json の `phases[4].status` が `spec_created`、`phases[4].outputs` が `[]`

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系・エラーハンドリング)
- 引き継ぎ事項:
  - Step 4 catch 節を Phase 6 異常系（D1 ダウン / binding 未注入 / Retry-After 欠落 / WAF 解除事故）の起点に
  - 3 コミット粒度をロールバック設計の根拠として Phase 10 へ
  - Step 5 の `HEALTH_DB_TOKEN` rotation 手順を Phase 12 ドキュメント更新へ
  - Step 6 / Step 7 の検証コマンドを Phase 11 smoke S-03 / S-07 のテンプレ正本へ
- ブロック条件:
  - Step 0（UT-22 完了確認ゲート）が欠落
  - 実コード適用を本 Phase で実施した形跡がある（hard rule 違反）
  - 不変条件 #5 を侵害する Step（`apps/web` 経由で D1）が含まれている
  - `wrangler` 直接実行が Step 5 に混入（CLAUDE.md §Cloudflare 系 CLI 実行ルール 違反）
