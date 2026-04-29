# Phase 11: 手動 smoke / NON_VISUAL walkthrough

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke / NON_VISUAL walkthrough |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (ロールアウト・ロールバック) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |
| user_approval_required | false（本 Phase は仕様レベル定義のみ。実走 / 実ファイル更新は Phase 13 ユーザー承認後の別 PR） |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由: 本タスクは HTTP endpoint (`GET /health/db`) の挙動確認であり、UI / Renderer / 画面遷移は一切発生しない。よって screenshot 不要。
- 代替 evidence は **コマンド出力 + ログ + 応答 JSON + Cloudflare Analytics ダッシュボード snapshot ID** の 4 階層で構成する（§4 階層代替 evidence 設計）。
- `outputs/phase-11/screenshots/` ディレクトリは作成しない（NON_VISUAL 整合）。
- 本 Phase では実走しない。Phase 13 ユーザー明示承認後、別 PR / 別オペレーションで実走する。

## 目的

Phase 1〜10 で固定された設計（base case = 案 D：固定パス + X-Health-Token + WAF / IP allowlist 併用 / レスポンス schema 200・503 + `Retry-After: 30` / R1〜R5 のロールアウト手順）に対し、以下を確定する。

1. S 系列 smoke 4 件（**S-03 / S-07 / S-11 / S-15**）のコマンド系列・期待 stdout・失敗時切り分け・evidence 出力先を仕様レベルで固定する
2. NON_VISUAL 4 階層代替 evidence（L1: コマンド出力 / L2: wrangler tail ログ / L3: 応答 JSON / L4: CF Analytics dashboard snapshot ID）の保管先と保存ルールを確定する
3. 既存 `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md` の S-03 / S-07 期待値テンプレと drift しないよう、テンプレ更新方針を本 Phase の実行タスクに含める
4. すべての CLI 実行例が `bash scripts/cf.sh ...` 経由で記述されており、`wrangler` 直接実行が一切現れないことを確定する

## smoke 仕様

> **共通**: S-03 / S-07 / S-11 / S-15 はすべて Phase 13 ユーザー承認後に実走する。本 Phase ではコマンド系列・期待 stdout・失敗時切り分け・evidence 保管先の「仕様レベル固定」のみを行う（**NOT EXECUTED** ステータス）。

### S-03: staging /health/db GET → 200

| 項目 | 内容 |
| --- | --- |
| 観点 | staging 環境で D1 binding が runtime 有効、`SELECT 1` が成功する |
| 前提 | UT-22 D1 migration 適用済 / WAF rule (案 D) 有効 / `HEALTH_DB_TOKEN` staging Secret 注入済 / Phase 10 R1 GO 条件未達状態でも本 smoke 自体は実走可能（GO 判定の入力として用いる） |
| コマンド系列 | `curl -sS -D /tmp/h.txt -H "X-Health-Token: $(op read 'op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN')" "https://<staging-api-host>/health/db" \| jq .` |
| 期待 stdout | `{ "ok": true, "db": "ok", "check": "SELECT 1" }` |
| 期待 status / header | `HTTP/2 200` / `Content-Type: application/json` |
| 失敗時切り分け | (a) 503 応答 → R3 (D1 binding 不一致) または UT-22 未適用を疑う / (b) 403 応答 → WAF rule / Token mismatch / IP allowlist 不一致 / (c) 200 だが schema 不一致 → 実装 drift（Phase 5 PR で修正）/ (d) timeout → Cloudflare Workers 障害 / `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` で観測 |
| AC マッピング | AC-3 / AC-4（成功 schema） / AC-7（テンプレ drift 防止） |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-03 区画（NOT EXECUTED ステータス） |

### S-07: production /health/db GET → 200

| 項目 | 内容 |
| --- | --- |
| 観点 | production 環境で D1 binding が runtime 有効、`SELECT 1` が成功する |
| 前提 | R1 (S-03) GREEN / UT-22 production 適用済 / production WAF + Token 注入済 |
| コマンド系列 | `curl -sS -D /tmp/h.txt -H "X-Health-Token: $(op read 'op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN')" "https://<production-api-host>/health/db" \| jq .` |
| 期待 stdout | `{ "ok": true, "db": "ok", "check": "SELECT 1" }` |
| 期待 status / header | `HTTP/2 200` / `Content-Type: application/json` |
| 失敗時切り分け | S-03 と同様。加えて Phase 10 R2 異常時 rollback (`bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production`) を即時発動可能にする |
| AC マッピング | AC-3 / AC-4 / AC-7 |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-07 区画（NOT EXECUTED） |

### S-11: staging /health/db で D1 binding 抜きデプロイ → 503 + Retry-After 確認（任意・破壊的）

| 項目 | 内容 |
| --- | --- |
| 観点 | 失敗系の意図的検証。`apps/api/wrangler.toml` から `[[d1_databases]]` binding を一時削除した branch を **separate environment / isolated 用 staging** にデプロイし、503 応答 + `Retry-After: 30` ヘッダ付与を確認する |
| 前提 | 通常 staging を破壊しないため、`wrangler.toml` に `[env.staging-isolated]` を別途用意（または別 worker 名）。実走は破壊的のため Phase 13 でも skip 可能 |
| コマンド系列 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging-isolated` → `curl -sS -D /tmp/h.txt -H "X-Health-Token: ..." "https://<isolated-api-host>/<path>" \| jq .` |
| 期待 stdout | `{ "ok": false, "db": "error", "error": "<exception message>" }` |
| 期待 status / header | `HTTP/2 503` / `Retry-After: 30` / `Content-Type: application/json` |
| 失敗時切り分け | (a) 200 が返る → binding 削除が反映されていない（deploy 未完了 or キャッシュ） / (b) 500 が返る → `Retry-After` ヘッダ欠落 → 実装 bug、Phase 5 PR 差し戻し / (c) `Retry-After` 欠落 → schema 違反 |
| AC マッピング | AC-4（失敗 schema） |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-11 区画 |
| 注意 | **破壊的 smoke**。実走は任意で、isolated env 以外には絶対に展開しない。後始末として binding 復旧 deploy を必ずペアで実行する |

### S-15: WAF rule 経路で expected token 無しリクエスト → 403 (apps/api 到達なし)

| 項目 | 内容 |
| --- | --- |
| 観点 | 案 D（固定パス + X-Health-Token + WAF）の defense in depth 検証。`X-Health-Token` ヘッダ無し / Token 不一致のリクエストが WAF 層で 403 となり、`apps/api` には到達しないこと |
| 前提 | production / staging いずれも WAF rule + IP allowlist が有効 |
| コマンド系列 | `curl -sS -D /tmp/h.txt "https://<api-host>/health/db"` （X-Health-Token ヘッダ無し）|
| 期待 stdout | `Cloudflare WAF block` 系の HTML / JSON ボディ（具体形式は WAF rule 設定で確定。`apps/api` のレスポンス schema は **返らない**） |
| 期待 status | `HTTP/2 403` |
| 失敗時切り分け | (a) 200 が返る → WAF rule 解除事故（Phase 10 R4 緊急 rollback 順序適用：先に WAF 再適用 → endpoint disable → revert）/ (b) 503 が返る → リクエストが apps/api まで到達 = WAF bypass、最重大 |
| AC マッピング | AC-6（認証 / WAF / IP allowlist 方針） |
| evidence 出力先 | `outputs/phase-11/manual-smoke-log.md` の S-15 区画 |
| 注意 | apps/api 到達がないことを保証するため、Cloudflare Analytics dashboard で当該 timestamp の Workers 呼び出し回数増加が **無い** ことを snapshot ID 単位で確認する（L4 evidence） |

## 4 階層代替 evidence 設計

> NON_VISUAL タスクのため、screenshot ではなく以下 4 階層を組み合わせて evidence を保全する。すべて `outputs/phase-11/` 配下に保管予定（実 evidence 生成は Phase 13 実走時）。

| 階層 | 種別 | 保管先（予定） | 何を保証するか |
| --- | --- | --- | --- |
| **L1** | コマンド出力 (curl stdout / jq 結果 / `bash scripts/cf.sh ...` の stdout) | `outputs/phase-11/manual-smoke-log.md` の各 S 区画 | 実行されたコマンドと応答ボディの完全再現性 |
| **L2** | ログ (`bash scripts/cf.sh tail --config apps/api/wrangler.toml --env <env>` の 5 分間 tail / Workers 例外ログ) | `outputs/phase-11/wrangler-tail-{staging,production}.log` | runtime エラー・exception の有無 / `c.env.DB` undefined 系事故の検出 |
| **L3** | 応答 JSON (HTTP response body + headers raw) | `outputs/phase-11/response-{S-03,S-07,S-11,S-15}.json` + `response-headers-{...}.txt` | レスポンス schema (`{ ok, db, check }` / `{ ok, db, error }`) / `Retry-After: 30` の wire format 一致 |
| **L4** | Cloudflare Analytics ダッシュボード snapshot ID | `outputs/phase-11/cf-analytics-snapshot-ids.md`（dashboard URL + capture timestamp + snapshot ID 文字列のみ。スクショ画像は保管しない） | WAF block 件数 / Workers 呼び出し件数 / 5xx rate の時系列 evidence。S-15 の「apps/api 到達なし」保証に必須 |

> **Token 値・実 IP・実 host を evidence に転記しない**。L3 の response body / L4 の snapshot ID には secret が混入しない形で保管する（CLAUDE.md §シークレット管理）。

## 期待値テンプレ更新方針（drift 防止）

- **更新対象**: `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md`
- **更新理由**: 既存 S-03 期待値が `D1 SELECT OK` という抽象表現で、本 endpoint 実装後の wire format（`{ ok: true, db: "ok", check: "SELECT 1" }`）と drift する余地がある。AC-7（smoke 期待値テンプレ同期）で本 Phase 担当として固定されている。
- **更新内容（仕様レベル）**:
  - S-03 期待列を `HTTP 200 + { "ok": true, "db": "ok", "check": "SELECT 1" }` で確定
  - S-07 期待列を S-03 と同 schema で確定（環境のみ production）
  - S-11 / S-15 を新規行として追加
  - ヘッダ token / Token は `health/db` / `${HEALTH_DB_TOKEN}` placeholder で抽象化
- **本 Phase の扱い**: **実ファイル更新は実施しない**。本 Phase では「更新内容の仕様レベル定義」のみを記述する。実ファイル更新は Phase 13 ユーザー承認後の別 PR で行う。
- **drift 検知手順**: Phase 13 実走時に jq で本 Phase の期待 schema と smoke-test-result.md の S-03 / S-07 行を突合する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md | レスポンス schema / Retry-After 仕様 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-08.md | 認証 (案 D) / Token 注入経路 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-09.md | SLO / 503 許容閾値 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-10.md | R1 / R2 GO 条件 / R4 解除順序 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | S-03 / S-07 期待値テンプレ（drift 防止対象） |
| 必須 | CLAUDE.md §Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 徹底 / `wrangler` 直接実行禁止 |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web から D1 直接アクセス禁止 |
| 必須 | scripts/cf.sh / scripts/with-env.sh | Cloudflare CLI / 1Password 注入の唯一の経路 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 4 階層 evidence プレイブック |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-11.md | NON_VISUAL Phase 11 構造リファレンス |

## 実行タスク

1. S-03 / S-07 / S-11 / S-15 の smoke 仕様を固定する（完了条件: 各 smoke に目的・入力・期待応答がある）。
2. NON_VISUAL 4 階層 evidence を定義する（完了条件: L1〜L4 の保存先がある）。
3. S-03 / S-07 期待値テンプレの drift 防止方針を固定する（完了条件: 既存 UT-06 smoke result への更新観点がある）。
4. screenshots を作成しない方針を明記する（完了条件: NON_VISUAL と矛盾しない）。
5. `Retry-After: 30` と SLO drift の確認基準を Phase 9 から継承する（完了条件: drift 時の差し戻し先がある）。
6. WAF / IP allowlist の遮断 smoke を Phase 8 と接続する（完了条件: apps/api 到達なしを確認する evidence がある）。
7. Phase 12 documentation に渡す smoke evidence 項目を固定する（完了条件: implementation-guide / changelog への転記対象がある）。

## 実行手順

### ステップ 1: S 系列 smoke 4 件の仕様確定

- S-03 / S-07 / S-11 / S-15 の各々について、観点・前提・コマンド系列・期待 stdout・期待 status / header・失敗時切り分け・AC マッピング・evidence 出力先の 8 軸を埋める。

### ステップ 2: 4 階層代替 evidence 設計の固定

- L1〜L4 の保管先・保証範囲・secret 混入防止ルールを表化する。

### ステップ 3: 期待値テンプレ更新方針の明文化

- `smoke-test-result.md` の S-03 / S-07 行と本 Phase wire format との drift 検知手順を記述する。実ファイル更新は実施しないことを明記する。

### ステップ 4: `scripts/cf.sh` 徹底の確認

- 本 Phase の全コマンド例が `bash scripts/cf.sh ...` 経由で記述され、`wrangler` 直接実行が一切現れないことを確認する。

### ステップ 5: 「実走 / 実ファイル更新は Phase 13 ユーザー承認後」の明示

- 本 Phase が仕様レベル定義のみであることを冒頭・成果物・完了条件で 3 重に明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | S-03 GREEN = R1 GO / S-07 GREEN = R2 GO の判定根拠 |
| Phase 12 | smoke-test-result.md テンプレ更新を実 PR として ledger 化 |
| Phase 13 | ユーザー承認ゲート前チェックリスト（UT-22 / WAF / Token / smoke GREEN / `scripts/cf.sh` 徹底）に S-03 / S-07 / S-15 を反映 |
| UT-08 通知基盤 | S-11 (503 + Retry-After) で false alert 抑制閾値が機能するかを別途検証 |

## 多角的チェック観点

- **不変条件 #5 違反**: smoke が `apps/web` から D1 を直接叩く構造を前提にしていないか。すべて `apps/api` の HTTP endpoint 経由で実行されているか。
- **smoke drift**: 本 Phase の期待 wire format と `smoke-test-result.md` の S-03 / S-07 行が乖離していないか。drift 検知手順が記述されているか。
- **Retry-After**: S-11 で `Retry-After: 30` ヘッダ存在が期待値に明示されているか。欠落を schema 違反として検出できるか。
- **監視誤検知**: S-11 (503 意図発火) 実走中に UT-08 通知基盤が暴走しないよう、suppression 経路が Phase 9 / 10 と整合しているか。
- **`scripts/cf.sh` 徹底**: deploy / tail / rollback / d1 等のすべてが `bash scripts/cf.sh ...` 経由で記述されているか。`wrangler` 直接実行が一切残っていないか。
- **secret 混入防止**: L3 / L4 evidence に Token 値・実 IP・実 host・OAuth token が転記されていないか。
- **WAF defense in depth**: S-15 で WAF が apps/api 到達前に 403 を返す設計が evidence で保証可能か（L4 dashboard snapshot ID）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | S-03 (staging GET 200) 仕様確定 | 11 | spec_created | AC-3 / AC-4 / AC-7 |
| 2 | S-07 (production GET 200) 仕様確定 | 11 | spec_created | AC-3 / AC-4 / AC-7 |
| 3 | S-11 (binding 抜き → 503 + Retry-After) 仕様確定 | 11 | spec_created | 任意・破壊的・isolated env |
| 4 | S-15 (WAF block 403) 仕様確定 | 11 | spec_created | AC-6 / defense in depth |
| 5 | 4 階層代替 evidence (L1〜L4) 設計確定 | 11 | spec_created | コマンド出力 / ログ / JSON / dashboard snapshot ID |
| 6 | smoke-test-result.md テンプレ drift 防止方針 | 11 | spec_created | 実ファイル更新は Phase 13 別 PR |
| 7 | `scripts/cf.sh` 徹底 / `wrangler` 直接実行禁止 確認 | 11 | spec_created | CLAUDE.md と整合 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-11.md | 本ファイル（S 系列 smoke 4 件 / 4 階層 evidence / drift 防止方針） |
| メタ | artifacts.json | Phase 11 状態の更新（spec_created） |

> 本 Phase の主成果物は `phase-11.md` 単独。`outputs/phase-11/` 配下のサブ成果物（manual-smoke-log.md / response-*.json / cf-analytics-snapshot-ids.md / wrangler-tail-*.log 等）は **Phase 13 実走時にのみ生成** する。本 Phase では生成しない。`screenshots/` ディレクトリも作成しない（NON_VISUAL 整合）。

## 完了条件

- [ ] S-03 / S-07 / S-11 / S-15 の 4 件すべてが 8 軸（観点 / 前提 / コマンド系列 / 期待 stdout / 期待 status / 失敗時切り分け / AC マッピング / evidence 出力先）で記述されている
- [ ] 4 階層代替 evidence (L1: コマンド出力 / L2: ログ / L3: 応答 JSON / L4: CF Analytics snapshot ID) の保管先と保証範囲が表化されている
- [ ] `smoke-test-result.md` テンプレ更新方針が記述され、「実ファイル更新は Phase 13 別 PR」が明示されている
- [ ] 本 Phase 内の全コマンド例が `bash scripts/cf.sh ...` 経由で記述され、`wrangler` 直接実行が一切現れない
- [ ] `outputs/phase-11/screenshots/` を作成しない方針が明記されている
- [ ] 「実走 / 実ファイル更新は Phase 13 ユーザー承認後」が冒頭・成果物・完了条件で 3 重明記されている
- [ ] 不変条件 #5 / smoke drift / Retry-After / 監視誤検知 の 4 観点が多角的チェックに含まれる
- [ ] 本 Phase の status が spec_created で artifacts.json と整合する

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- `phase-11.md` 配置済み
- `wrangler` 直接実行が文中に存在しない
- 不変条件 #5 / `scripts/cf.sh` 徹底 / `wrangler` 直接実行禁止 が明記されている
- artifacts.json の `phases[10].status` が `spec_created`

## 苦戦防止メモ

1. **screenshots/ を作らない**: NON_VISUAL タスクで `.gitkeep` を作ると validator が VISUAL と誤判定する。
2. **「実走した」と書かない**: 本 Phase は仕様レベル定義のみ。manual-smoke-log.md は Phase 13 実走時に NOT EXECUTED → EXECUTED へ移行する。
3. **smoke-test-result.md を本 Phase で書き換えない**: drift 防止方針の「定義」だけが本 Phase の役割。実書き換えは Phase 13 別 PR。
4. **Token / 実 host を evidence に転記しない**: CLAUDE.md §シークレット管理 / §Cloudflare 系 CLI 実行ルール を厳守。L3 / L4 では ``<host>`` / `${HEALTH_DB_TOKEN}` placeholder のみ。
5. **S-11 は破壊的**: 通常 staging を破壊しないため、isolated env 以外では実行しない。実走後の binding 復旧 deploy をペアで必ず実行する。
6. **S-15 の「apps/api 到達なし」保証**: L1〜L3 だけでは「WAF が 403 を返した」ことしか分からない。L4 (CF Analytics dashboard snapshot ID) で「Workers 呼び出し件数増加なし」を裏取りする必要がある。

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - S-03 / S-07 / S-11 / S-15 のコマンド系列（implementation-guide.md / runbook 化候補）
  - 4 階層代替 evidence (L1〜L4) の保管先テンプレ
  - `smoke-test-result.md` の S-03 / S-07 / S-11 / S-15 行への反映を Phase 13 別 PR タスクとして登録
  - 認証トークン rotation 手順（Phase 3 open question #4）を Phase 12 で確定
- ブロック条件:
  - `wrangler` 直接実行が記述に残っている
  - S 系列 4 件のいずれかが 8 軸を満たしていない
  - 4 階層 evidence のいずれかの保管先が未確定
  - `outputs/phase-11/screenshots/` を作成している
  - smoke-test-result.md を本 Phase で実書き換えしている
  - 不変条件 #5 違反の smoke 経路（apps/web から D1 直接アクセス）が混入
