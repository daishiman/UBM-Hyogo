# Phase 7: 受入条件マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 受入条件マトリクス |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系・エラーハンドリング) |
| 次 Phase | 8 (セキュリティ・コンプライアンス) |
| 状態 | spec_created |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |

## 目的

`index.md` で固定された **AC-1〜AC-9** を左軸、Phase 4 で定義される **happy path テスト T1〜T5**（テスト戦略のトレース対象）と Phase 6 で確定した **異常系シナリオ E1〜E6** を右軸とし、各セルに「該当テスト ID」「N/A」「Phase 11 smoke で確認」のいずれかを記述する trace matrix を作成する。あわせて AC ごとの reverse trace 表（検証 Phase / 検証コマンド / 期待値 / 残存 open question）を最終確定し、Phase 3 で登録した open question 5 件の Phase 配分を最終確認する。本 Phase は仕様化のみで、実走（コマンド出力収集）は Phase 13 ユーザー承認後の別 PR / Phase 11 smoke 実走に委ねる。

## 実行タスク

1. AC × T/E trace matrix（AC-1〜AC-9 × T1〜T5 + E1〜E6 の 9 行 × 11 列）を作成する（完了条件: 全セルが「テスト ID」「N/A」「Phase 11 smoke」のいずれかで埋まる）。
2. AC ごとの reverse trace 表（検証 Phase / 検証コマンド / 期待値 / 残存 open question）を 9 行で確定する（完了条件: 9 行全項目記述）。
3. Phase 3 open question 5 件の最終 Phase 配分を再確認する（完了条件: 5 件すべて受け皿 Phase に紐付き）。
4. AC のうち Phase 11 smoke のみで確認可能な項目（AC-3 / AC-4 / AC-7）を明示する（完了条件: 3 件特定）。
5. AC のうち Phase 1〜3 で完了済みの項目（AC-6 / AC-8 / AC-9）を明示する（完了条件: 3 件特定）。
6. 多角的チェックで不変条件 #5 / カバレッジ穴 / Phase 11 への過剰委譲 を再確認する（完了条件: 3 観点記述）。
7. 引き渡し条件として Phase 8（セキュリティ）に AC-6 / E4 / 案 D 根拠を渡す（完了条件: 引き渡し記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/index.md §受入条件 (AC) | AC-1〜AC-9 の正本 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-04.md | T1〜T5 テスト戦略（spec_created 骨格） |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-06.md | E1〜E6 異常系仕様 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-03.md §open question | 5 件の受け皿 Phase |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md §レスポンス schema | AC-3 / AC-4 期待値 |
| 必須 | CLAUDE.md §重要な不変条件 #5 | AC-9 検証根拠 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | AC-7 smoke S-03 / S-07 期待値テンプレ |

## T1〜T5（Phase 4 入力前提）

> Phase 4 が `spec_created` 骨格段階のため、本 Phase では Phase 1〜3 / Phase 6 から導出される **テスト命題ラベル** を T1〜T5 の暫定スコープとして固定する。Phase 4 確定時に同じ命題で記述されることを前提とし、ラベル変更時は本マトリクスを同期更新する。

| ID | テスト命題（Phase 4 で確定する想定） | 観点 |
| --- | --- | --- |
| T1 | `Env.DB: D1Database` 型定義の存在検証（typecheck） | AC-1 |
| T2 | `GET /health/db` ハンドラ存在 + `SELECT 1` 実行検証（unit / integration） | AC-2 |
| T3 | 成功時 `HTTP 200` + `{ ok: true, db: "ok", check: "SELECT 1" }` 検証 | AC-3 |
| T4 | 失敗時 `HTTP 503` + `{ ok: false, db: "error", error }` + `Retry-After` 検証 | AC-4 |
| T5 | `wrangler.toml` D1 binding（production / staging / development）確認 | AC-5 |

## AC × T/E trace matrix

凡例:
- `T<n>` / `E<n>` = 該当テスト ID
- `N/A` = 当該 AC は別軸で確認、かつ該当テスト無し
- `P11` = Phase 11 smoke 実走で確認（spec / setup レビューでは取り切れない）
- `spec` = Phase 1〜3 仕様レビューで確認済み（テスト不要）

| AC \ Test | T1 | T2 | T3 | T4 | T5 | E1 | E2 | E3 | E4 | E5 | E6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1（`Env.DB: D1Database` 型定義） | T1 | N/A | N/A | N/A | N/A | E1 | N/A | N/A | N/A | N/A | N/A |
| AC-2（`SELECT 1` 実行仕様） | N/A | T2 | T3 | T4 | N/A | N/A | E2 | E3 | N/A | N/A | E6 |
| AC-3（成功 200 + 成功 JSON） | N/A | T2 | T3 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| AC-4（失敗 503 + Retry-After + 失敗 JSON） | N/A | N/A | N/A | T4 | N/A | E1 | E2 | E3 | N/A | N/A | E6 |
| AC-5（`wrangler.toml` binding 確認） | N/A | N/A | N/A | N/A | T5 | E1 | N/A | N/A | N/A | N/A | N/A |
| AC-6（認証 / WAF / IP allowlist 方針） | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | E4 | E5 | N/A |
| AC-7（Phase 11 smoke S-03 / S-07 同期） | N/A | N/A | P11 | P11 | N/A | P11 | P11 | N/A | N/A | N/A | N/A |
| AC-8（taskType / scope / visualEvidence 固定） | spec | spec | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| AC-9（不変条件 #5 侵害なし） | spec | spec | spec | spec | spec | spec | spec | spec | spec | spec | spec |

> 全 AC が最低 1 つの T / E / P11 / spec で被覆されている（カバレッジ穴 = 0）。

### マトリクス読み解き

- **happy path 3 件**: AC-1（T1）/ AC-3（T2 / T3）/ AC-5（T5）。
- **happy + fail 5 件**: AC-2（T2 / T3 / T4 + E2 / E3 / E6）/ AC-4（T4 + E1 / E2 / E3 / E6）。
- **WAF / method 由来 1 件**: AC-6（E4 / E5）。
- **smoke 実走必須 1 件**: AC-7（T3 / T4 / E1 / E2 を P11 で再検証）。
- **spec レビュー完結 2 件**: AC-8 / AC-9（T1〜T5 すべての設計と E1〜E6 すべての仕様で apps/web 不在を確認）。

## AC 個別検証表（reverse trace）

| AC | 検証 Phase | 検証コマンド / 観測手段 | 期待値 | 残存 open question |
| --- | --- | --- | --- | --- |
| AC-1 | Phase 5 Step 4 + T1 | `mise exec -- pnpm --filter api typecheck` | exit 0、`Env.DB: D1Database` が型解決される | なし |
| AC-2 | Phase 5 Step 4 + T2 | コードレビュー（`rg "SELECT 1" apps/api/src/index.ts`）+ 統合テスト | `prepare("SELECT 1").first()` が 1 箇所、ハンドラが `app.get("/health/db", ...)` で登録 | なし |
| AC-3 | Phase 11 smoke S-03 + T3 | `curl -i https://<host>/health/db with X-Health-Token header` | `HTTP/1.1 200`、body `{"ok":true,"db":"ok","check":"SELECT 1"}` | なし |
| AC-4 | Phase 11 smoke S-11 + T4 + E1〜E3 / E6 | D1 ダウン擬似 / binding 解除環境で `curl -i` | `HTTP/1.1 503`、`Retry-After: 30`、body `ok:false / db:error / error:DB health check failed` | open #2（Retry-After 値 30 でよいか）→ Phase 11 smoke + UT-08 合意 |
| AC-5 | Phase 5 Step 0 + T5 | `bash scripts/cf.sh d1 list` + `rg "binding = \"DB\"" apps/api/wrangler.toml` | production / staging / development の各 env で binding 名 `DB` が存在 | なし（UT-22 完了前提） |
| AC-6 | Phase 1〜3 spec + Phase 8 + E4 / E5 | Phase 3 §代替案評価表 / Cloudflare WAF dashboard 確認 | base case = 案 D、E4 で 403、E5 で 405 が確定 | open #1（案 D 採用継続 or 案 B 縮退）→ Phase 5 着手前 / open #3（認証ヘッダ 文字列）→ Phase 5 |
| AC-7 | Phase 11 + P11 列 | `outputs/phase-11/smoke-test-result.md` のテンプレ更新差分 | S-03 期待値が AC-3 と一致、S-07 期待値が AC-4 + E2 と一致 | open #5（FU-I `/health` prefix 整合）→ Phase 12 |
| AC-8 | Phase 1 spec | `rg "scope.*api_health" docs/30-workflows/ut-06-followup-H-health-db-endpoint/artifacts.json` + `index.md` 突合 | `taskType=implementation` / `visualEvidence=NON_VISUAL` / `scope=api_health` がメタと一致 | なし |
| AC-9 | Phase 1〜3 spec + Phase 6 spec | state ownership 表 / E1〜E6 仕様で apps/web 不在を grep | writer / reader / 異常系応答主体すべてが apps/api 内 | なし |

## Phase 3 open question 5 件の Phase 配分（最終確認）

| # | 質問 | Phase 3 振り分け | 本 Phase での再確認 | 最終受け皿 |
| --- | --- | --- | --- | --- |
| 1 | 認証要否最終決定（案 D 継続 / 案 B 縮退） | Phase 5 着手前 | AC-6 検証コマンドで Phase 5 / Phase 8 にまたがるため、**Phase 5 着手前を最終受け皿として確定**。Phase 8 セキュリティ章で根拠ドキュメント化。 | Phase 5 着手前（決定）+ Phase 8（根拠記載） |
| 2 | `Retry-After` 値の合意（30 秒で良いか） | Phase 11 smoke 実走 + UT-08 通知基盤閾値合意 | AC-4 / E2 / E3 で 30 秒固定。最終決定は **Phase 11 smoke** 実走時に UT-08 と合意。 | Phase 11（最終決定）+ Phase 12（合意記録） |
| 3 | ヘッダ token文字列の決定 | Phase 5 実装着手前 | E4 で `${HEALTH_DB_TOKEN}` placeholder を採用しているため、具体値生成は **Phase 5** に閉じる。 | Phase 5（決定）+ 1Password（実値） |
| 4 | 認証トークン rotation 手順 | Phase 12 ドキュメント更新 | E4 復旧手順に「1Password から再取得」が記載されており、SOP 化は **Phase 12**。 | Phase 12（SOP） |
| 5 | FU-I（/health）応答 prefix との整合最終確認 | Phase 12 | AC-7 reverse trace で再確認。`{ ok: ... }` 統一の最終確認は **Phase 12**。 | Phase 12（整合記述） |

> 5 件すべて受け皿 Phase に紐付き、本 Phase で新規 open question は発生しない。

## 実行手順

### ステップ 1: matrix の作成

- 9 行 × 11 列を埋め、空セルが無いことを確認する。

### ステップ 2: reverse trace 表の作成

- 9 AC 各々に対し検証 Phase / 検証コマンド / 期待値 / 残存 open question を記述する。

### ステップ 3: open question 配分の最終確認

- 5 件すべての受け皿 Phase が確定していることを表で示す。

### ステップ 4: Phase 11 smoke のみで確認可能な AC の明示

- AC-3 / AC-4 / AC-7 を `P11` 列でマーキング。Phase 11 spec へ直接反映するための入力とする。

### ステップ 5: 多角的チェックの再実行

- 不変条件 #5 / カバレッジ穴 / Phase 11 への過剰委譲 を再確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | AC-6（認証方針）/ E4（WAF 403）/ 案 D 採用根拠を入力として渡す |
| Phase 9 | E3（D1 timeout）を SLO 違反候補として渡す |
| Phase 10 | base case PASS（with notes）+ 全 AC のマトリクス被覆を GO/NO-GO 根拠に再利用 |
| Phase 11 | AC-3 / AC-4 / AC-7 + E1 / E2 を smoke S-03 / S-07 期待値テンプレに反映 |
| Phase 12 | open question #4 / #5 + UT-08 通知閾値合意をドキュメント化 |

## 多角的チェック観点

- **不変条件 #5（AC-9）**: T1〜T5 / E1〜E6 すべての検証主体が `apps/api` 内に閉じており、`apps/web` 経由で D1 を叩く検証コマンドが混入していないか。matrix の `spec` セルは Phase 1〜3 で既に確認済み。
- **カバレッジ穴**: 9 AC × 11 列のすべての行に最低 1 つのセルが「テスト ID / P11 / spec」で埋まっているか（空セル = matrix の見落とし）。本 Phase では空行ゼロを完了条件にロックする。
- **Phase 11 への過剰委譲**: AC-7 のように本来 P11 で確認するもののみ P11 とし、Phase 1〜5 で確認可能な AC を P11 に丸投げしていないか（過剰委譲は Phase 11 の負担を膨張させる）。AC-3 / AC-4 は T3 / T4 で先に確認した上で P11 で再検証する二重化方針。
- **monitoring 誤検知（E2 / E3）と AC-4 の整合**: AC-4 が `503 + Retry-After` を要求し、E2 / E3 が「5 分継続で通知」とする閾値方針が矛盾していないか。
- **UT-22 完了前提（AC-5）**: Phase 1 / 2 / 3 で 3 重明記された UT-22 完了が AC-5 reverse trace で「UT-22 完了前提」として再ロックされているか。
- **open question の漏れ**: 5 件すべてが受け皿 Phase に紐付いているか。新規 open question が発生していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC × T/E trace matrix（9 × 11） | 7 | spec_created | 空セルゼロ |
| 2 | AC reverse trace 表（9 行） | 7 | spec_created | 検証 Phase / コマンド / 期待値 / open question |
| 3 | open question 5 件の Phase 配分最終確認 | 7 | spec_created | 全件紐付き |
| 4 | P11-only AC の明示（AC-3 / AC-4 / AC-7） | 7 | spec_created | smoke 入力 |
| 5 | spec-only AC の明示（AC-6 / AC-8 / AC-9 の一部） | 7 | spec_created | テスト不要 |
| 6 | 多角的チェック（不変条件 #5 / 穴 / 過剰委譲） | 7 | spec_created | 3 観点 |
| 7 | Phase 8 への引き渡し（AC-6 / E4 / 案 D） | 7 | spec_created | 入力固定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-07.md | AC × T/E trace matrix / AC 個別 reverse trace 表 / open question 配分最終確認 |

> 本 Phase の成果物は本ファイル（phase-07.md）のみ。`outputs/phase-07/main.md` は本ワークフローでは作成せず、artifacts.json `phases[6].outputs` は空配列のままとする。

## 完了条件

- [ ] AC-1〜AC-9 × T1〜T5 + E1〜E6 の 9 行 × 11 列 matrix に空セルが無い
- [ ] 各 AC が最低 1 つの「テスト ID / P11 / spec」で被覆されている
- [ ] AC reverse trace 表が 9 行で「検証 Phase / 検証コマンド / 期待値 / 残存 open question」の 4 列を埋めている
- [ ] Phase 3 open question 5 件すべての最終受け皿 Phase が再確認されている
- [ ] AC-3 / AC-4 / AC-7 が Phase 11 smoke で確認される旨が明記されている
- [ ] AC-9（不変条件 #5）が T1〜T5 / E1〜E6 全列で `spec` セルとして被覆されている
- [ ] 多角的チェックで不変条件 #5 / カバレッジ穴 / Phase 11 過剰委譲 の 3 観点が記述されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- AC × T/E trace matrix が 9 × 11 の表として本ファイルに収録
- open question 5 件全件が受け皿 Phase に紐付き
- 不変条件 #5 が多角的チェックに記述
- artifacts.json の `phases[6].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 8 (セキュリティ・コンプライアンス)
- 引き継ぎ事項:
  - AC-6（認証 / WAF / IP allowlist 方針）+ 採用案 D の根拠を Phase 8 §防御境界へ
  - E4（WAF 403）/ E5（405）の到達層境界を Phase 8 §threat model へ
  - open question #1（案 D 継続 / 案 B 縮退）を Phase 5 着手前に最終決定する旨を Phase 8 と共有
  - AC-9（不変条件 #5）の matrix 全列 spec 被覆を Phase 8 のコンプライアンスチェックに再利用
- ブロック条件:
  - matrix に空セルが残る（カバレッジ穴）
  - open question のいずれかに受け皿 Phase が紐付かない
  - AC-4 reverse trace で `Retry-After` 期待値が欠落
  - 不変条件 #5 が AC-9 行のいずれかの列で `spec` 化されていない
