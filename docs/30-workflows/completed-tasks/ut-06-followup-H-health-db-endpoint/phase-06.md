# Phase 6: 異常系・エラーハンドリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系・エラーハンドリング |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (受入条件マトリクス) |
| 状態 | spec_created |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |

## 目的

Phase 5 実装ランブック Step 4（`/health/db` ハンドラ実装）で構築する `try / catch + Retry-After` の例外境界に対し、運用上発生し得る異常系シナリオを **E1〜E6** として仕様レベルで網羅する。各 E について「トリガ条件 / 期待応答（HTTP status + body + header）/ ログ出力 / UT-08 通知基盤への通知対象か / 復旧手順」を表化し、Phase 11 smoke S-03 / S-07 期待値テンプレ更新と Phase 7 AC × E trace matrix の入力を確定させる。本 Phase は仕様化のみで、実走（実コード追加）は Phase 13 ユーザー承認後の別 PR に委ねる。

## 依存（Phase 5 実装ランブック Step 4 ハンドラと整合）

- Phase 5 Step 4 で固定された `app.get("/health/db", async (c) => { try { ... } catch { ... } })` の例外境界（Phase 2 §擬似コードを起点）を本 Phase の異常系仕様の唯一の入力とする。
- 本 Phase の E1〜E6 は Step 4 の `try / catch` フローの分岐網羅であり、Phase 4 T1〜T5（happy path + 観点別検証）と相補関係にある。
- UT-22 D1 migration 完了前提（重複明記 3/3）が満たされていない場合、E1（binding 未設定）が常時発火するため、本 Phase の異常系仕様は UT-22 完了後の運用フェーズに対して有効となる。

## 実行タスク

1. E1〜E6 を「トリガ条件 / 期待応答 / ログ出力 / UT-08 通知対象 / 復旧手順」の 5 列で表化する（完了条件: 6 行 × 5 列が空セルなく埋まる）。
2. 各 E の期待応答が Phase 2 §レスポンス schema（成功 200 / 失敗 503 + `Retry-After: 30`）と矛盾しないことを確認する（完了条件: E1 / E2 / E3 / E6 が `503 + Retry-After` の運用境界に整合）。
3. WAF レイヤで弾かれる E4（403）と Hono 側 method 拒否の E5（405）を apps/api 到達前 / 後に分けて記述する（完了条件: 到達境界が表に明記）。
4. UT-08 通知基盤の誤検知抑制方針（短時間バーストでは通知せず、一定閾値超過のみ通知）を E1 / E2 / E3 / E6 に注記する（完了条件: 通知対象列に閾値方針）。
5. Phase 11 smoke S-03（成功）/ S-11（失敗）期待値テンプレへの反映項目を E2 / E1 起点で確定する（完了条件: 同期項目が記述）。
6. 復旧手順を「人手で必要 / 自動回復」に分けて記述する（完了条件: 各 E に復旧主体が記述）。
7. 多角的チェックで不変条件 #5 / 監視誤検知 / Retry-After 欠落 を再確認する（完了条件: 3 観点が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md §擬似コード / §レスポンス schema | E1〜E6 の期待応答の正本 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-03.md §NO-GO 条件 | Retry-After 欠落 NO-GO の根拠 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-05.md Step 4 | ハンドラ try/catch 境界 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | S-03 / S-07 期待値テンプレ |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web からの D1 直接アクセス禁止 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/index.md §AC | AC-3 / AC-4 / AC-7 |
| 参考 | https://developers.cloudflare.com/d1/observability/billing/#timeouts | D1 timeout の運用挙動 |
| 参考 | https://developers.cloudflare.com/waf/ | E4 で apps/api 到達前に 403 を返す層 |

## 実行手順

### ステップ 1: 例外境界の確認

- Phase 5 Step 4 の `try / catch` 分岐を再確認し、catch 側で `Retry-After` を必ず付与する仕様を E1〜E3 / E6 に反映する。

### ステップ 2: E1〜E6 の表化

- 後述「異常系シナリオ一覧」に従い 6 行 × 5 列で表化する。

### ステップ 3: UT-08 通知対象の整理

- 一過性（数十秒以内に自然回復）と継続障害（5 分超過）で通知対象を分ける。E2 / E3 は閾値超過で通知、E1 / E6 は構成事故のため即時通知、E4 / E5 は通知対象外（運用設定 / クライアント不正）。

### ステップ 4: smoke 期待値同期項目の抽出

- S-03（成功）テンプレは E に対応せず、AC-3 期待応答に固定。
- S-11（失敗）テンプレは E2（D1 ダウン）想定で `503 + Retry-After + ok=false` を期待。
- E1 期待値テンプレは S-07 補助ケースとして `error: "DB binding missing"` を別行で固定。

### ステップ 5: 復旧手順の付記

- 構成事故（E1）/ 一時障害（E2 / E3）/ 構成漏れ（E6）/ WAF / クライアント由来（E4 / E5）を区別し、復旧主体（developer / SRE / 自動回復 / クライアント）を明記する。

## 異常系シナリオ一覧（E1〜E6）

### E1: D1 binding 未設定（`c.env.DB` が undefined）

| 項目 | 内容 |
| --- | --- |
| ID | E1 |
| 観点 | 構成事故 / UT-22 未完了の検出 |
| トリガ条件 | `apps/api/wrangler.toml` の `[[d1_databases]]` が当該 env で欠落、または UT-22 migration 未適用で binding が production / staging に未注入。`c.env.DB === undefined` |
| 期待応答 | `HTTP 503` + `{ ok: false, db: "error", error: "DB binding missing" }` + `Retry-After: 30` |
| ログ出力 | `console.error("[/health/db] DB binding missing", { env: <env name> })`（実装ガード分岐） |
| UT-08 通知対象 | **対象（即時）**。構成事故であり一過性ではないため、最初の 1 件で SRE 通知。 |
| 復旧手順 | (1) `wrangler.toml` の `[[d1_databases]]` 設定を SRE が修正 → (2) `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env <env>` で再デプロイ → (3) `/health/db` 実走で 200 を確認 |

### E2: `SELECT 1` 失敗（D1 ダウン / network error）

| 項目 | 内容 |
| --- | --- |
| ID | E2 |
| 観点 | 一時障害 / 監視誤検知抑制 |
| トリガ条件 | `c.env.DB.prepare("SELECT 1").first()` が例外を throw する。Cloudflare D1 のリージョン障害 / network error / 認証失敗等。 |
| 期待応答 | `HTTP 503` + `{ ok: false, db: "error", error: "DB health check failed" }` + `Retry-After: 30` |
| ログ出力 | `console.error("[/health/db] SELECT 1 failed", { error: err.name })` |
| UT-08 通知対象 | **対象（閾値超過時）**。`Retry-After: 30` の意図に従い、5 分間で 503 が継続した場合のみ通知（短時間バースト誤検知抑制）。 |
| 復旧手順 | (1) Cloudflare D1 status page を SRE が確認 → (2) 自動回復を待つ（自然回復が基本） → (3) 30 分以上継続する場合は incident 化 |

### E3: D1 timeout（worker time limit 超過の手前）

| 項目 | 内容 |
| --- | --- |
| ID | E3 |
| 観点 | クエリ遅延 / SLO 超過 |
| トリガ条件 | `SELECT 1` が D1 側で worker time limit（CPU 時間 / wall clock）の手前まで応答せず、`AbortError` 相当の例外で fail-fast する。 |
| 期待応答 | `HTTP 503` + `{ ok: false, db: "error", error: "DB timeout" }` + `Retry-After: 30` |
| ログ出力 | `console.error("[/health/db] DB timeout", { elapsed_ms: <ms>, threshold_ms: <ms> })` |
| UT-08 通知対象 | **対象（閾値超過時）**。E2 と同じ抑制ポリシ（5 分継続で通知）。timeout は単発でも SLO 違反候補として Phase 9 で扱う。 |
| 復旧手順 | (1) Cloudflare D1 status を SRE が確認 → (2) `SELECT 1` という最小クエリの timeout は D1 側障害がほぼ確定 → (3) E2 と同じ incident フロー |

### E4: 認証 / ヘッダ token失敗（WAF rejected）

| 項目 | 内容 |
| --- | --- |
| ID | E4 |
| 観点 | 不正 access / defense in depth（案 D 採用根拠の検証） |
| トリガ条件 | 認証トークン `${HEALTH_DB_TOKEN}` を含まない URL へのアクセス、または Cloudflare WAF rule の IP / rate 制限に該当。 |
| 期待応答 | **Cloudflare WAF 側で `HTTP 403`**（WAF custom response または default block）。`apps/api` の Hono ハンドラには到達しない。body は WAF response テンプレに依存。 |
| ログ出力 | Cloudflare WAF dashboard の Firewall Events に記録。apps/api 側ログには出ない（到達前に block）。 |
| UT-08 通知対象 | **対象外**。WAF block は意図的な制御であり、誤検知通知すると noisy。Cloudflare 側の Firewall Analytics で監視する。 |
| 復旧手順 | (1) 正規利用者の場合: WAF allowlist / token を 1Password から再取得 → (2) probing の場合: 復旧不要、WAF block 継続 |

### E5: 不正な HTTP method（POST 等）

| 項目 | 内容 |
| --- | --- |
| ID | E5 |
| 観点 | クライアント不正 / 仕様契約 |
| トリガ条件 | `POST /health/db` / `PUT /health/db` 等、`GET` 以外の method でアクセス（WAF を通過した上で）。 |
| 期待応答 | `HTTP 405 Method Not Allowed`（Hono の default 挙動）。body は Hono デフォルト or 空。`Retry-After` 不要。 |
| ログ出力 | apps/api 側で特別なログは出さない（Hono デフォルトに委ねる）。 |
| UT-08 通知対象 | **対象外**。クライアント不正であり障害ではない。 |
| 復旧手順 | クライアント側で正しい method（GET）に修正。サーバ側復旧不要。 |

### E6: D1 部分応答（rows undefined）

| 項目 | 内容 |
| --- | --- |
| ID | E6 |
| 観点 | 構成事故の境界 / `first()` が `null` 返却 |
| トリガ条件 | `c.env.DB.prepare("SELECT 1").first()` が例外を throw せず、`null` / `undefined` 等の予期しない値を返す（D1 SDK 仕様変更 / 部分応答事故）。 |
| 期待応答 | `HTTP 503` + `{ ok: false, db: "error", error: "DB unexpected response" }` + `Retry-After: 30` |
| ログ出力 | `console.error("[/health/db] DB unexpected response", { result: <serialized> })` |
| UT-08 通知対象 | **対象（即時）**。SDK 仕様変更 / 構成事故の徴候であり、E1 と同じ即時通知扱い。 |
| 復旧手順 | (1) D1 SDK / `@cloudflare/workers-types` のバージョン差分を developer が確認 → (2) Phase 5 Step 4 のガード分岐（`if (!result) throw new Error("SELECT 1 returned null")`）が機能しているか再確認 → (3) 必要に応じて Phase 5 を更新し再デプロイ |

## 異常系 × 期待応答サマリ

| ID | HTTP status | body `error` | Retry-After | 到達層 | UT-08 通知 |
| --- | --- | --- | --- | --- | --- |
| E1 | 503 | `DB binding missing` | 30 | apps/api（catch / guard） | 即時 |
| E2 | 503 | `DB health check failed` | 30 | apps/api（catch） | 5 分継続で |
| E3 | 503 | `DB timeout` | 30 | apps/api（catch） | 5 分継続で |
| E4 | 403 | WAF テンプレ | - | Cloudflare WAF | 対象外 |
| E5 | 405 | Hono デフォルト | - | apps/api（routing） | 対象外 |
| E6 | 503 | `DB unexpected response` | 30 | apps/api（guard） | 即時 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | E1〜E6 を AC × E trace matrix の右軸として渡す |
| Phase 8 | E4（WAF 403）/ E1（binding 未設定）をセキュリティ章の防御境界に再利用 |
| Phase 9 | E3（timeout）を SLO 違反候補として CPU 時間 SLO 章に渡す |
| Phase 11 | smoke S-03（成功）/ S-11（失敗）期待値テンプレを E2 / E1 ベースで更新 |
| Phase 12 | UT-08 通知基盤の閾値合意（5 分継続）をドキュメント化 |

## 多角的チェック観点

- **不変条件 #5 違反**: E1〜E6 のいずれにおいても `apps/web` から D1 を直接叩く形が混入していないか。すべての異常応答は `apps/api/src/index.ts` の catch / guard で生成される。
- **監視誤検知（UT-08 暴走）**: E2 / E3 で 503 を返す瞬間に通知が発火しないか。Retry-After: 30 の意図に従い、5 分継続で初めて通知する閾値が表に明記されているか。
- **Retry-After 欠落**: E1 / E2 / E3 / E6 すべてで `Retry-After: 30` が付与されているか。Phase 3 NO-GO 条件「Retry-After 欠落」を本 Phase で再ロックする。
- **WAF / Hono の境界混乱**: E4 は apps/api に到達せず、E5 は到達して 405 を返す境界が明確か。
- **`first()` null 返却の取り扱い**: E6 で例外でなく null が返るケースを Phase 5 ガード分岐で確実に 503 化しているか。
- **smoke drift**: S-03（成功）/ S-11（失敗）期待値テンプレが E1 / E2 で記述された形と乖離しないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | E1〜E6 の表化（5 列） | 6 | spec_created | 6 行 × 5 列 |
| 2 | 期待応答と Phase 2 schema 整合 | 6 | spec_created | 503 + Retry-After |
| 3 | WAF / Hono の到達境界明示 | 6 | spec_created | E4 / E5 |
| 4 | UT-08 通知対象の閾値方針 | 6 | spec_created | 5 分継続 / 即時 |
| 5 | smoke S-03 / S-07 同期項目の抽出 | 6 | spec_created | Phase 11 へ |
| 6 | 復旧手順の主体明記 | 6 | spec_created | SRE / developer / 自動 |
| 7 | 多角的チェック（不変条件 #5 / 誤検知 / Retry-After） | 6 | spec_created | 3 観点 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-06.md | E1〜E6 の異常系シナリオ表 / 期待応答 / 通知方針 / 復旧手順 |

> 本 Phase の成果物は本ファイル（phase-06.md）のみ。`outputs/phase-06/main.md` は本ワークフローでは作成せず、実装担当者が別 PR で必要に応じて切り出す（artifacts.json `phases[5].outputs` は空配列）。

## 完了条件

- [ ] E1〜E6 が「トリガ条件 / 期待応答 / ログ出力 / UT-08 通知対象 / 復旧手順」の 5 列で空セルなく表化されている
- [ ] E1 / E2 / E3 / E6 の期待応答に `Retry-After: 30` が含まれている
- [ ] E4 が Cloudflare WAF 側で 403、apps/api 未到達である旨が明記されている
- [ ] E5 が `HTTP 405` であり Retry-After 不要である旨が明記されている
- [ ] UT-08 通知対象列に「即時 / 5 分継続 / 対象外」のいずれかが各 E に記述されている
- [ ] 多角的チェックで不変条件 #5 / 監視誤検知 / Retry-After 欠落 の 3 観点が記述されている
- [ ] Phase 11 smoke S-03 / S-07 期待値テンプレ更新項目が抽出されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- E1〜E6 の 6 シナリオが本ファイルに表化済み
- 不変条件 #5 / 監視誤検知 / Retry-After 欠落 が多角的チェックに記述
- artifacts.json の `phases[5].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 7 (受入条件マトリクス)
- 引き継ぎ事項:
  - E1〜E6 を AC × T/E trace matrix の右軸右半分として使用
  - E2 / E1 を Phase 11 smoke S-07 / S-03 期待値テンプレ更新の入力として使用
  - UT-08 通知閾値（5 分継続 / 即時）を Phase 12 ドキュメント化候補として登録
- ブロック条件:
  - E1〜E6 のいずれかで Retry-After が欠落（Phase 3 NO-GO 条件再侵害）
  - E4 / E5 の到達境界が apps/api 到達前 / 後で混線
  - 不変条件 #5 違反（apps/web 経由の D1 access が異常系仕様に混入）
