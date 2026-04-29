# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test / staging 投入確認・name 確認) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |

## 目的

Phase 1〜9 で確定した要件・設計・レビュー・テスト戦略・実装ランブック・異常系・AC マトリクス・DRY 化・QA を統合し、(1) AC-1〜AC-11 全件カバレッジ評価、(2) 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価、(3) Phase 11 staging smoke 着手可否ゲート、(4) Phase 13 ユーザー承認ゲート前チェックリスト、(5) rollback 経路（delete + 再 put）の最終再確認、を実施する。本ワークフローは仕様書整備に閉じるため、最終判定は **「仕様書として PASS / 実 `wrangler secret put` は Phase 13 ユーザー承認後の別オペレーション」** とし、MINOR 指摘（UT25-M-01 / UT25-M-02）の解決済み状態を確認した上で、Phase 12 unassigned-task-detection.md への formalize 方針を明文化する。

## 実行タスク

1. AC-1〜AC-11 を spec_created 視点で評価し、PASS / FAIL / 仕様確定先 を全件付与する（完了条件: 11 件すべてに判定 + 確定先 Phase 番号が付与）。
2. 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価を行う（完了条件: 各観点に PASS/MINOR/MAJOR + 根拠が記述）。
3. Phase 11 staging smoke 着手可否ゲートを確定する（完了条件: 「`scripts/cf.sh` 動作確認」「op CLI 認証確認」「`apps/api/wrangler.toml` の `[env.staging]` 宣言確認」「`.dev.vars` gitignore 除外確認」「op に SA JSON key 保管確認」の 5 件以上）。
4. Phase 13 ユーザー承認ゲート前チェックリストを確定する（完了条件: 「Phase 11 smoke 完了 / staging evidence 取得済み」「production 投入手順の SSOT 参照のみ」「rollback runbook 事前準備」「CLAUDE.md ルール 4 項目 hit」「artifacts.json drift 0」の 5 件以上）。
5. rollback 経路の最終再確認を行う（完了条件: delete + 再 put の 2 ステップ手順 / 担当者 / トリガ条件 / 復旧確認方法が記述）。
6. blocker 判定基準を明文化する（完了条件: 5 件以上、UT-03 / 01b / 01c 上流未完了 / wrangler 直叩き残存 / staging-first 順序違反 / `.dev.vars` 未除外 / op パス未確定 を含む）。
7. MINOR 指摘の解決状況を確認する（完了条件: UT25-M-01 / UT25-M-02 が Phase 5 / 8 / 11 で解決済み、または Phase 12 unassigned へ送る判断が記述）。
8. 最終 GO/NO-GO 判定を確定し、`outputs/phase-10/main.md` に記述する（完了条件: 「仕様書 PASS / 実投入は Phase 13 ユーザー承認後 / status=spec_created」が明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/index.md | AC-1〜AC-11 / Phase 一覧 / 不変条件 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-01.md | 4 条件評価初期判定 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-03.md | 設計レビュー最終判定 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-08.md | DRY 化 SSOT |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-09.md | QA 13 項目 |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | 親タスク仕様 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-10.md | 最終レビュー phase の構造参照 |

## AC × PASS/FAIL マトリクス（spec_created 視点）

> **評価基準**: 「Phase 1〜9 で具体的に確定し、Phase 5 / 11 / 13 で実装・実走可能な粒度に分解されているか」で判定する。実投入は未着手。

| AC | 内容 | 仕様確定先 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `bash scripts/cf.sh` ラッパー経由のみで wrangler を呼び出す | Phase 2 / 5 / 8 / 9 §4 | PASS |
| AC-2 | secret 名 `GOOGLE_SERVICE_ACCOUNT_JSON` を staging / production 両方に投入、staging-first 順序固定 | Phase 2 / 5 / 8 / 13 | PASS |
| AC-3 | SA JSON `private_key` 改行を壊さない stdin 投入経路 | Phase 2 / 5 / 6 | PASS |
| AC-4 | シェル履歴汚染防止（`HISTFILE=/dev/null` / `set +o history` / op 直接 stdin） | Phase 2 / 5 / 6 | PASS |
| AC-5 | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` で name 確認、evidence 保存 | Phase 2 / 8 / 11 / 13 | PASS |
| AC-6 | `apps/api/.dev.vars` 設定 + `.gitignore` 除外確認 | Phase 2 / 5 / 11 (UT25-M-01 解決) | PASS |
| AC-7 | rollback (`wrangler secret delete` + 旧 key 再 put) | Phase 2 / 6 / 8 / 13 | PASS |
| AC-8 | UT-03 runbook への配置完了反映ルート | Phase 12 | PASS |
| AC-9 | 仕様書整備に閉じ、実投入は Phase 13 ユーザー承認後 | index / Phase 1 / 13 | PASS |
| AC-10 | 4 条件全 PASS | Phase 1 / 3 / 10 | PASS |
| AC-11 | Phase 1〜13 が artifacts.json と完全一致 | artifacts.json / 各 phase メタ情報 | PASS |

**合計: 11/11 PASS（spec_created 視点）**

## 4 条件最終再評価

| 条件 | 判定 | 根拠（Phase 9 までの確定事項を統合） |
| --- | --- | --- |
| 価値性 | PASS | UT-26 / UT-09 を unblock し、Sheets API 認証経路を実体化。Phase 1 / Phase 3 で PASS、Phase 8 SSOT で投入手順の再実行コストが最小化（ローテーション容易） |
| 実現性 | PASS | `bash scripts/cf.sh` + `op read` stdin パイプは既存技術範囲、新規依存ゼロ。Phase 9 検証手順で機械検証可能 |
| 整合性 | PASS | 不変条件 #5 を侵害しない（D1 不関与・apps/api 配下のみ）、CLAUDE.md「wrangler 直接禁止 / 平文 .env 禁止 / op 経由注入」と整合、Phase 8 用語統一（staging / production / secret-list-evidence-{env}.txt） |
| 運用性 | PASS | rollback delete + 再 put / `wrangler secret list` evidence 取得 / staging-first 順序固定。Phase 11 staging smoke で本番投入前の最終確認が可能 |

**最終判定: PASS（仕様書として）**

## Phase 11 staging smoke 着手可否ゲート

> Phase 11 で staging 投入確認（実投入を伴う smoke）を実行する**前**に、実行者本人（solo 運用）が以下を確認すること。1 件でも未充足なら NO-GO。

| # | チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | `scripts/cf.sh` 動作確認 | `bash scripts/cf.sh whoami` | Cloudflare account 識別子が表示 |
| 2 | op CLI 認証確認 | `op vault list` | UBM-Hyogo vault が見える |
| 3 | `apps/api/wrangler.toml` の `[env.staging]` 宣言 | `grep -nE '\[env\.staging\]' apps/api/wrangler.toml` | hit |
| 4 | `apps/api/.dev.vars` の `.gitignore` 除外 | `git check-ignore apps/api/.dev.vars` | 除外確認（UT25-M-01） |
| 5 | op に SA JSON key 保管確認 | `op item get "google_service_account_json" --vault UBM-Hyogo --field credential` | 値取得成功（標準出力には流さない） |
| 6 | `--env staging` 引数を含む手順記述 | Phase 11 runbook の grep | hit（UT25-M-02） |

## Phase 13 ユーザー承認ゲート前チェックリスト

> Phase 13 で実 `wrangler secret put` を production に対して実行する**前**に確認すること。1 件でも未充足なら NO-GO。

| # | チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | Phase 11 staging smoke 完了 | `outputs/phase-11/manual-smoke-log.md` 存在 + secret-list-evidence-staging.txt に `GOOGLE_SERVICE_ACCOUNT_JSON` hit | 両方確認 |
| 2 | production 投入手順が SSOT 参照のみ | Phase 13 deploy-runbook.md が Phase 8 SSOT を引用 | 引用 hit |
| 3 | rollback-runbook.md 事前準備 | `outputs/phase-13/rollback-runbook.md` 存在 | 存在 |
| 4 | CLAUDE.md ルール 4 項目（cf.sh / op / 平文禁止 / wrangler login 禁止） | Phase 9 §4 の grep | 全 hit |
| 5 | artifacts.json drift 0 | Phase 9 §2 の jq + diff | drift 0 |
| 6 | staging-first 順序遵守 | deploy-runbook.md で staging 投入記述が production より先 | 順序確認 |
| 7 | secret 名表記揺れ 0 | `GOOGLE_SERVICE_ACCOUNT_JSON` のみ | 揺れ 0 |
| 8 | 旧 key（rollback 用）op 履歴アクセス確認 | `op item get ... --include-archive` で過去版が引ける | 確認済み |
| 9 | user_approval_required: true | artifacts.json `phases[12].user_approval_required` | true |
| 10 | UT-26 引き渡し準備 | UT-26 ワークフロー存在確認 | 存在 |

## rollback 経路の最終再確認

| 項目 | 内容 |
| --- | --- |
| トリガ条件 | (a) staging / production の secret 値が破損 / 誤投入された / (b) ローテーション後に新 key で問題が発生し旧 key へ戻したい |
| 手順 | 1) `bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env "${ENV}"` 2) 旧 key を 1Password 履歴から取得し `op read ... | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env "${ENV}"` |
| 担当者 | 実行者本人（solo 運用） |
| トリガ判断 | UT-26 疎通テスト失敗 / Workers ログで Sheets API 401/403 多発 |
| 復旧確認 | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env "${ENV}"` で `GOOGLE_SERVICE_ACCOUNT_JSON` 再出現 + UT-26 疎通再走 PASS |
| 関連 SSOT | Phase 8 §rollback 統合 / Phase 6 異常系 |
| 注意 | 旧 key は **1Password 履歴**から取得する（新規発行ではない）。新規発行が必要な場合は 01c-parallel-google-workspace-bootstrap の SA key ローテーション手順を別タスク化する |

## blocker 判定基準

> 以下のいずれかに該当する場合、Phase 11 / 13 は **着手 NO-GO**。

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | UT-03（sheets-auth.ts 実装）が completed でない | 上流タスク | UT-03 main マージ済み | UT-03 ワークフローの artifacts.json |
| B-02 | 01b-parallel-cloudflare-base-bootstrap が completed でない（apps/api Workers 環境未作成） | 上流タスク | `apps/api/wrangler.toml` に `[env.staging]` / `[env.production]` 宣言 | grep |
| B-03 | 01c-parallel-google-workspace-bootstrap が completed でない（SA JSON key 未発行・op 未保管） | 上流タスク | `op item get google_service_account_json --vault UBM-Hyogo` で値取得 | op CLI |
| B-04 | wrangler 直接呼び出しが runbook 本体に残存 | 設計違反（CLAUDE.md） | runbook を `bash scripts/cf.sh` 経由に置換 | Phase 9 §4 grep |
| B-05 | staging-first 順序が破られている（production 先行記述あり） | 設計違反 | runbook の順序が staging → production | Phase 9 §5 + 目視 |
| B-06 | `apps/api/.dev.vars` が `.gitignore` に未除外（UT25-M-01 未解決） | 運用違反 | `git check-ignore apps/api/.dev.vars` PASS | git CLI |
| B-07 | `--env` 引数が runbook の secret put / list / delete のいずれかで欠落 | 設計違反（UT25-M-02 未解決） | 全 secret 系コマンドが `--env` を含む | grep |
| B-08 | op の SA JSON key 保管パスが Phase 5 / 11 / 13 で食い違い | 表記ドリフト | op パスを 1 箇所で SSOT 化 | grep |

### blocker 優先順位

1. **B-01〜B-03（上流未完了）**: Phase 11 / 13 着手不能。最優先で UT-03 / 01b / 01c の completed を確認。
2. **B-04 / B-05（CLAUDE.md ルール / 順序違反）**: 仕様書整備段階で再検出可能。Phase 8 / 9 で予防。
3. **B-06 / B-07（MINOR 残存）**: UT25-M-01 / UT25-M-02 の解決確認。Phase 5 / 8 / 11 のいずれかで解決済みであること。
4. **B-08（op パス drift）**: Phase 8 SSOT 化で予防。

## MINOR 指摘の解決状況

| MINOR | 解決方針 | 解決 Phase | 状態 |
| --- | --- | --- | --- |
| UT25-M-01: `apps/api/.dev.vars` gitignore 除外 | Phase 5 ランブックで `.gitignore` チェック手順、Phase 11 smoke で `git check-ignore` 確認 | 5 / 11 | 解決済み（spec_created レベル） |
| UT25-M-02: `--env` 引数欠落防止 | Phase 8 SSOT で `--env "${ENV}"` 必須テンプレ化、Phase 5 / 11 / 13 全 runbook で参照 | 5 / 8 / 11 / 13 | 解決済み（spec_created レベル） |

> 仮に Phase 11 / 12 / 13 で新規 MINOR が発生した場合、Phase 12 `unassigned-task-detection.md` に新規 ID で登録し、本ワークフロー内で抱え込まない。

## 最終 GO / NO-GO 判定

### 判定: **PASS（仕様書として）/ status=spec_created**

- 仕様書としての完成度: **PASS**（AC 11/11 / 4 条件 PASS / blocker 8 件確定 / rollback 経路最終再確認済み / MINOR 2 件解決済み）
- 実装ステータス: **spec_created**（実投入は Phase 13 ユーザー承認後）
- Phase 11 進行可否: 上記 §Phase 11 staging smoke 着手可否ゲート 6 件すべて充足が必須。staging のみで smoke、production は Phase 13。
- Phase 12 進行可否: implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md の整備は本ワークフロー内で可能。
- Phase 13 進行可否: 仕様書として可、実投入は **user_approval_required: true** ゲート + 上記 §Phase 13 ユーザー承認ゲート前チェックリスト 10 件すべて充足が必須。

### GO 条件（すべて満たすこと）

- [x] AC 11 件すべて PASS
- [x] 4 条件最終判定が PASS
- [x] Phase 11 着手可否ゲートが 5 件以上（本仕様では 6 件）
- [x] Phase 13 ユーザー承認ゲート前チェックリストが 5 件以上（本仕様では 10 件）
- [x] blocker 判定基準が 5 件以上（本仕様では 8 件）
- [x] rollback 経路の手順 / 担当者 / 復旧確認 / トリガ条件が記述
- [x] MINOR UT25-M-01 / UT25-M-02 解決済み

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある
- blocker 判定基準が 5 件未満
- rollback 経路が未確定
- Phase 11 / 13 ゲートチェックリストが 5 件未満
- 上流タスク（UT-03 / 01b / 01c）の completed 状態が未確認

## 実行手順

### ステップ 1: AC マトリクス再評価
- AC-1〜AC-11 を spec_created 視点で全件再評価。

### ステップ 2: 4 条件最終再評価
- Phase 1 / Phase 3 base case を継承、Phase 9 QA 結果で再確認。

### ステップ 3: Phase 11 着手可否ゲート確定
- 6 件のチェック項目を確定（cf.sh / op / wrangler.toml / .dev.vars / op SA / `--env`）。

### ステップ 4: Phase 13 ユーザー承認ゲート前チェックリスト確定
- 10 件のチェック項目を確定（Phase 11 完了 / SSOT 参照 / rollback / CLAUDE.md / drift / 順序 / 名前 / 旧 key / approval / UT-26）。

### ステップ 5: rollback 経路最終再確認
- 手順 / 担当者 / トリガ / 復旧確認 / 旧 key 1Password 履歴取得を 1 表に集約。

### ステップ 6: blocker 判定基準作成
- B-01〜B-08 の 8 件を確定、優先順位付き。

### ステップ 7: MINOR 解決状況確認
- UT25-M-01 / UT25-M-02 が Phase 5 / 8 / 11 で解決済みを確認。

### ステップ 8: GO/NO-GO 確定
- `outputs/phase-10/main.md` に「仕様書 PASS / 実投入は Phase 13 ユーザー承認後 / status=spec_created」を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に staging 投入確認 smoke を実走、ゲート 6 件を着手前に確認 |
| Phase 12 | unassigned-task 候補（GitHub Actions 経由の自動投入 / secret rotation 自動化）を formalize、implementation-guide.md にまとめ |
| Phase 13 | GO/NO-GO 結果と承認ゲート前チェックリスト 10 件を PR description に転記、user_approval_required: true ゲート |

## 多角的チェック観点（AIが判断）

- 価値性: AC-2 / AC-5 / AC-7（投入 / evidence / rollback）の根拠が Phase 1〜9 で確定。
- 実現性: Phase 9 QA で仕様書整合性 / CLAUDE.md ルール / 不変条件 / secret 一貫性 / MINOR / Phase 11 限定 の 6 観点で機械検証可能。
- 整合性: 不変条件 #5 / Phase 8 SSOT / artifacts.json と一致。CLAUDE.md ↔ runbook の二重正本 drift を grep で検出。
- 運用性: rollback 経路 + Phase 11 / 13 ゲート + 担当者明記 + 旧 key 1Password 履歴経路。
- 認可境界: 新規 secret は本タスクの主成果物（GOOGLE_SERVICE_ACCOUNT_JSON）のみ、それ以外は対象外明記。
- 無料枠: resource 消費なし、対象外明記。
- bulk 化禁止: staging-first 順序固定、per-env 独立 PUT 担保。
- 二重正本: CLAUDE.md ↔ runbook の整合は Phase 9 §4 grep で SSOT 化。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-11 達成状態評価 | 10 | spec_created | 11 件 PASS |
| 2 | 4 条件最終再評価 | 10 | spec_created | PASS |
| 3 | Phase 11 着手可否ゲート確定 | 10 | spec_created | 6 件 |
| 4 | Phase 13 ユーザー承認ゲート前チェックリスト確定 | 10 | spec_created | 10 件 |
| 5 | rollback 経路最終再確認 | 10 | spec_created | delete + 再 put |
| 6 | blocker 判定基準作成 | 10 | spec_created | 8 件 |
| 7 | MINOR 解決状況確認 | 10 | spec_created | UT25-M-01 / 02 解決済み |
| 8 | GO/NO-GO 判定 | 10 | spec_created | 仕様書 PASS / spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC × 4 条件 × Phase 11 / 13 ゲート × rollback × blocker × MINOR × GO/NO-GO 最終判定 |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC 11 件すべて PASS で評価
- [ ] 4 条件最終判定が PASS
- [ ] Phase 11 着手可否ゲートが 5 件以上（本仕様では 6 件）
- [ ] Phase 13 ユーザー承認ゲート前チェックリストが 5 件以上（本仕様では 10 件）
- [ ] rollback 経路の手順 / 担当者 / 復旧確認 / トリガ条件 が記述
- [ ] blocker 判定基準が 5 件以上記述（本仕様では 8 件）
- [ ] MINOR UT25-M-01 / UT25-M-02 が解決済み
- [ ] 最終判定が「仕様書 PASS / 実投入は Phase 13 ユーザー承認後 / status=spec_created」で確定
- [ ] outputs/phase-10/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 `outputs/phase-10/main.md` 配置予定
- AC × 4 条件 × Phase 11 ゲート × Phase 13 ゲート × rollback × blocker × MINOR × GO/NO-GO の 8 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 苦戦防止メモ

- 本ワークフローの最終成果物は「タスク仕様書」。実 `wrangler secret put` は Phase 13 ユーザー承認後の別オペレーション。本 Phase で「実装 PASS」と書かない。常に **「仕様書 PASS / 実投入は Phase 13 ユーザー承認後 / status=spec_created」** と三段で表現する。
- blocker B-01〜B-03（上流未完了）は Phase 11 / 13 着手前ゲートとして必ず確認。UT-03 / 01b / 01c がいずれも completed でないと SA JSON key 投入の前提が成立しない。
- rollback の旧 key 取得は **1Password 履歴**から行う。新規発行が必要な状況は別タスク（SA key ローテーション）として扱う。runbook で混同しないよう warning ボックスで隔離（Phase 8 §rollback 統合）。
- MINOR UT25-M-01 / UT25-M-02 は Phase 5 / 8 / 11 で解決済みだが、Phase 11 staging smoke で `git check-ignore` と `--env` grep を実走時に再確認することで二重保証する。
- Phase 13 ユーザー承認ゲート前チェックリスト 10 件は、実行者本人が 1 件ずつ目視確認する運用。自動化は将来 IaC 化フェーズで再評価（unassigned 候補）。

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test / staging 投入確認・name 確認)
- 引き継ぎ事項:
  - 最終判定: 仕様書 PASS / 実投入は Phase 13 ユーザー承認後 / status=spec_created
  - blocker 8 件（実装 / smoke / 本投入着手前に再確認必須）
  - Phase 11 着手可否ゲート 6 件
  - Phase 13 ユーザー承認ゲート前チェックリスト 10 件
  - rollback 経路（delete + 再 put / 旧 key 1Password 履歴）
  - MINOR UT25-M-01 / UT25-M-02 解決済み状態
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - blocker 判定基準が 5 件未満
  - rollback 経路が未確定
  - Phase 11 / 13 ゲートチェックリストが 5 件未満
  - 上流タスク（UT-03 / 01b / 01c）の completed 確認手順が抜ける
