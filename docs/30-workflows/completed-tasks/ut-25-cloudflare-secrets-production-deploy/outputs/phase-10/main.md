# Phase 10 成果物 — 最終レビュー

> 状態: **NOT EXECUTED — spec_created**
> 最終判定: **仕様書 PASS / 実 `wrangler secret put` は Phase 13 ユーザー承認後の別オペレーション / status=spec_created**

## 1. AC × PASS/FAIL マトリクス

| AC | 内容 | 仕様確定先 | 判定 |
| --- | --- | --- | --- |
| AC-1 | `bash scripts/cf.sh` 経由のみで wrangler を呼び出す | Phase 2 / 5 / 8 / 9 §4 | PASS |
| AC-2 | secret 名 `GOOGLE_SERVICE_ACCOUNT_JSON` を staging / production 両環境に投入、staging-first 順序固定 | Phase 2 / 5 / 8 / 13 | PASS |
| AC-3 | SA JSON `private_key` 改行を壊さない stdin 投入経路 | Phase 2 / 5 / 6 | PASS |
| AC-4 | シェル履歴汚染防止（`HISTFILE=/dev/null` / `set +o history` / op 直接 stdin） | Phase 2 / 5 / 6 | PASS |
| AC-5 | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` で name 確認、evidence 保存 | Phase 2 / 8 / 11 / 13 | PASS |
| AC-6 | `apps/api/.dev.vars` 設定 + `.gitignore` 除外確認 | Phase 2 / 5 / 11（UT25-M-01 解決） | PASS |
| AC-7 | rollback（delete + 旧 key 再 put） | Phase 2 / 6 / 8 / 13 | PASS |
| AC-8 | UT-03 runbook への配置完了反映ルート | Phase 12 | PASS |
| AC-9 | 仕様書整備に閉じ、実投入は Phase 13 ユーザー承認後 | index / Phase 1 / 13 | PASS |
| AC-10 | 4 条件全 PASS | Phase 1 / 3 / 10 | PASS |
| AC-11 | Phase 1〜13 が artifacts.json と完全一致 | artifacts.json / 各 phase メタ | PASS |

**合計: 11/11 PASS**

## 2. 4 条件最終再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-26 / UT-09 を unblock、Sheets API 認証経路を実体化、Phase 8 SSOT で再実行コスト最小化 |
| 実現性 | PASS | `bash scripts/cf.sh` + `op read` stdin パイプは既存技術範囲、新規依存 0 |
| 整合性 | PASS | 不変条件 #5 不抵触、CLAUDE.md「wrangler 直接禁止 / 平文 .env 禁止 / op 経由」と整合、Phase 8 用語統一 |
| 運用性 | PASS | rollback delete + 再 put、`secret list` evidence 取得、staging-first 順序固定、Phase 11 smoke で本番投入前確認 |

## 3. Phase 11 staging smoke 着手可否ゲート（6 件）

| # | チェック項目 | 確認方法 |
| --- | --- | --- |
| 1 | `scripts/cf.sh` 動作確認 | `bash scripts/cf.sh whoami` |
| 2 | op CLI 認証確認 | `op vault list` で UBM-Hyogo vault 表示 |
| 3 | `apps/api/wrangler.toml` の `[env.staging]` 宣言 | `grep -nE '\[env\.staging\]' apps/api/wrangler.toml` |
| 4 | `apps/api/.dev.vars` の `.gitignore` 除外（UT25-M-01） | `git check-ignore apps/api/.dev.vars` |
| 5 | op に SA JSON key 保管確認 | `op item get google_service_account_json --vault UBM-Hyogo --field credential` |
| 6 | `--env staging` を含む手順記述（UT25-M-02） | Phase 11 runbook の grep |

## 4. Phase 13 ユーザー承認ゲート前チェックリスト（10 件）

| # | チェック項目 | 期待結果 |
| --- | --- | --- |
| 1 | Phase 11 staging smoke 完了 | `outputs/phase-11/manual-smoke-log.md` 存在 + secret-list-evidence-staging.txt に hit |
| 2 | production 投入手順が Phase 8 SSOT 参照のみ | deploy-runbook.md が SSOT 引用 |
| 3 | rollback-runbook.md 事前準備 | `outputs/phase-13/rollback-runbook.md` 存在 |
| 4 | CLAUDE.md ルール 4 項目 hit | Phase 9 §4 の grep 全 hit |
| 5 | artifacts.json drift 0 | Phase 9 §2 の jq + diff |
| 6 | staging-first 順序遵守 | deploy-runbook.md で staging が production より先 |
| 7 | secret 名表記揺れ 0 | `GOOGLE_SERVICE_ACCOUNT_JSON` のみ |
| 8 | 旧 key 1Password 履歴アクセス確認 | `op item get ... --include-archive` で過去版取得可 |
| 9 | user_approval_required: true | artifacts.json `phases[12].user_approval_required` |
| 10 | UT-26 引き渡し準備 | UT-26 ワークフロー存在確認 |

## 5. rollback 経路最終再確認

| 項目 | 内容 |
| --- | --- |
| トリガ条件 | secret 値破損 / 誤投入 / ローテーション後問題発生で旧 key へ戻す |
| 手順 | (1) `bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env "${ENV}"` (2) `op read "op://UBM-Hyogo/google_service_account_json/credential?revision=<旧版>" | bash scripts/cf.sh secret put ... --env "${ENV}"` |
| 担当者 | 実行者本人（solo 運用） |
| 復旧確認 | `bash scripts/cf.sh secret list --env "${ENV}"` で `GOOGLE_SERVICE_ACCOUNT_JSON` 再出現 + UT-26 疎通再走 PASS |
| 関連 SSOT | Phase 8 §5 / Phase 6 異常系 |
| 注意 | 旧 key は 1Password 履歴から取得（新規発行ではない） |

## 6. blocker 判定基準（8 件）

| ID | blocker | 解消条件 |
| --- | --- | --- |
| B-01 | UT-03（sheets-auth.ts）未完了 | UT-03 main マージ済み |
| B-02 | 01b-parallel-cloudflare-base-bootstrap 未完了 | `[env.staging]` / `[env.production]` 宣言確認 |
| B-03 | 01c-parallel-google-workspace-bootstrap 未完了 | op に SA JSON key 保管確認 |
| B-04 | wrangler 直接呼び出し残存 | runbook を `bash scripts/cf.sh` 経由に置換 |
| B-05 | staging-first 順序違反 | runbook が staging → production 順 |
| B-06 | `.dev.vars` gitignore 未除外（UT25-M-01 未解決） | `git check-ignore` PASS |
| B-07 | `--env` 引数欠落（UT25-M-02 未解決） | 全 secret 系コマンドが `--env` を含む |
| B-08 | op 保管パス drift | op パス 1 箇所 SSOT 化 |

### 優先順位

1. **B-01〜B-03（上流未完了）**: 最優先。UT-03 / 01b / 01c が completed でないと前提不成立。
2. **B-04 / B-05（CLAUDE.md / 順序）**: Phase 8 / 9 で予防可。
3. **B-06 / B-07（MINOR 残存）**: Phase 5 / 8 / 11 で解決済み。
4. **B-08（op パス drift）**: Phase 8 SSOT で予防。

## 7. MINOR 解決状況

| MINOR | 解決 Phase | 状態 |
| --- | --- | --- |
| UT25-M-01: `apps/api/.dev.vars` gitignore 除外 | 5 / 11 | 解決済み（spec_created レベル） |
| UT25-M-02: `--env` 引数欠落防止 | 5 / 8 / 11 / 13 | 解決済み（spec_created レベル） |

> 新規 MINOR が Phase 11 / 12 / 13 で発生した場合は Phase 12 `unassigned-task-detection.md` に新規 ID で登録し抱え込まない。

## 8. 最終 GO / NO-GO 判定

### 判定: **PASS（仕様書として）/ status=spec_created**

- 仕様書完成度: PASS（AC 11/11 / 4 条件 PASS / blocker 8 件確定 / rollback 最終再確認済み / MINOR 2 件解決済み）
- 実装ステータス: spec_created（実投入は Phase 13 ユーザー承認後）
- Phase 11 進行可否: §3 ゲート 6 件すべて充足が必須。staging のみ smoke、production は Phase 13。
- Phase 12 進行可否: 本ワークフロー内で実施可能。
- Phase 13 進行可否: 仕様書として可、実投入は user_approval_required: true ゲート + §4 チェックリスト 10 件充足が必須。

### GO 条件チェック

- [x] AC 11 件すべて PASS
- [x] 4 条件最終判定 PASS
- [x] Phase 11 着手可否ゲート 6 件
- [x] Phase 13 ユーザー承認ゲート前チェックリスト 10 件
- [x] blocker 判定基準 8 件
- [x] rollback 経路の手順 / 担当者 / 復旧確認 / トリガ記述
- [x] MINOR UT25-M-01 / UT25-M-02 解決済み
- [x] MAJOR ゼロ

## 9. 次 Phase（11）への引き渡し要旨

- staging smoke を §3 ゲート 6 件確認後に実走。
- 実走経路は Phase 8 SSOT（`put_sa_json(staging)` + `capture_secret_list(staging, 11)`）のみ。
- production は触らない（Phase 13 まで保留）。
- evidence は `outputs/phase-11/secret-list-evidence-staging.txt` に保存。
- `git check-ignore apps/api/.dev.vars` を smoke ログに必ず記録（UT25-M-01 二重保証）。

## 10. 残課題（unassigned 候補）

- GitHub Actions 経由の secret 自動投入（OIDC + Cloudflare API）→ Phase 12 unassigned 候補。
- secret rotation 自動化（定期 op 履歴更新 + 再投入）→ Phase 12 unassigned 候補。
- CLAUDE.md ↔ runbook の二重正本 drift 継続監視 → Phase 12 unassigned 候補。
