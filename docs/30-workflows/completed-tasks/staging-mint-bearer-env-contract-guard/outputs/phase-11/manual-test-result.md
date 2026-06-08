# Phase 11 Manual Test Result（NON_VISUAL 証跡）— staging-mint-bearer-env-contract-guard

> 前提: [phase-11.md](./phase-11.md), [phase-10.md](../phase-10/phase-10.md)。
> 本ファイルは NON_VISUAL タスクの手動/自動テスト証跡メタと実施チェックリスト・実行記録テンプレートである。
> 本サイクルは **implemented_local_evidence_captured**。実コード実装後の source-level 自動テスト / actionlint 証跡を記録する。

## 1. 固定フレーズ（NON_VISUAL）

> **NON_VISUAL のため Phase 11 スクリーンショットは不要。**

| 項目 | 値 |
| ---- | -- |
| visualEvidence | NON_VISUAL（CI workflow / Node script / shell のみ。UI 表示物の追加・変更なし・screenshot 不要） |
| screenshots を作らない理由 | mint script・gate script・workflow は CLI / CI 専用でレンダリングされる画面を持たない。視覚的回帰の対象が存在しない |
| 代替証跡の主ソース | (1) 自動テスト = `mint-staging-bearers.spec.ts` の role-scoping ケース群 + `verify-mint-env-contract.spec.ts`、(2) `actionlint`（workflow 構文） |
| 証跡ファイル（固定） | `outputs/phase-11/evidence/mint-role-scope-test.log`（vitest）・`outputs/phase-11/evidence/verify-mint-env-contract-actionlint.log`（actionlint） |
| `outputs/phase-11/screenshots/` | **作成しない**（`.gitkeep` も置かない） |

## 2. 実施情報

| 項目 | 値 |
| ---- | -- |
| workflow_state | `implemented_local_evidence_captured` |
| 実施環境 | Node 24.x / pnpm 10.x / local worktree |
| 実行者 / 日時 | Codex / 2026-06-07 JST |
| 実地操作（実 CI / 実 deploy / 実 secret） | **未実施**（user-gated・index.md §2 スコープ外）。source-level 自動テスト + actionlint で代替 |
| secret の扱い | 実値は一切記載しない。env 名のみ（不変条件 #1）。1Password 参照は `op://...` のみ |

### 2.1 証跡メタ（自動テスト名 / 件数）

| 証跡 | テストファイル | 検証対象 | 期待件数 |
| ---- | -------------- | -------- | -------- |
| mint role-scope | `scripts/smoke/__tests__/mint-staging-bearers.spec.ts` | `parseRoles` / `requiredEnvForRoles` / `findMissingEnv` / `mintStagingBearersForRoles` / 既存後方互換 | 18 tests PASS |
| drift gate | `scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | `detectContractViolations`（step env vs `--roles` 要求 / provision カバー整合 / drift fixture） | 8 tests PASS |
| self verify | `scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts` | minted token self-verify failure guard | 1 test PASS |
| workflow 構文 | （actionlint・テストファイルなし） | `runtime-smoke-staging.yml` / `verify-mint-env-contract.yml` | actionlint 0 件 |

## 3. 仕様判断根拠

| 判断 | 根拠 |
| ---- | ---- |
| screenshot を作らない | NON_VISUAL（CLI / CI / shell のみ・UI なし）。WEEKGRD-03 |
| 実地操作（実 CI 実行）を行わない | 実 secret 整備が user 前提・実 deploy は index.md §2 スコープ外。BEFORE-QUIT-001 に従い user-gated 操作は実施せず source-level + actionlint を代替証跡とする |
| pure 関数を env 引数注入で検証 | 不変条件 #3（`process.env` 直読は `main()` のみ）。real secret なしで全 role-scoping 分岐をオフライン検証可能 |
| env 名のみ出力 | 不変条件 #1（JWT / secret 値を stdout / ログ / エラーに出さない）。`missing env:` も env 名のみ |
| drift gate を fixture で検証 | descriptor 入力（workflow step の env / `--roles`・provision カバー集合）を fixture 化し、実 GitHub 環境なしで violation 判定を網羅（AC-6 / AC-7） |

## 4. 実行記録

> 実行ログは `outputs/phase-11/evidence/` 配下に保存済み。

### 4.1 実施チェックリスト（AC 対応・手動/自動確認手順と期待結果）

| # | AC | 確認手順（自動 / 手動） | 期待結果 | 結果 |
| - | -- | ---------------------- | -------- | ---- |
| C-1 | AC-1 | vitest: `--roles admin` で `mintStagingBearersForRoles(["admin"], env)` を呼ぶケース | `adminBearer` + `memberId` のみ・`meBearer` 不在。`GITHUB_OUTPUT` 行は `admin_bearer` / `member_id` のみ | PASS |
| C-2 | AC-2 | vitest: `parseRoles("me")` / `parseRoles(undefined)` / `parseRoles("admin,me")` | `["me"]` / `["admin","me"]`（既定）/ `["admin","me"]`（重複排除） | PASS |
| C-3 | AC-3 | vitest/CLI: ME 系 env 未設定 + `--roles admin` | missing 0・exit 0 | PASS |
| C-4 | AC-4 | vitest: 要求 role の env を unset | env 名のみ出力（値・JWT 非露出）・exit 2 | PASS |
| C-5 | AC-5 | actionlint + gate: `bulk-tag-runtime-smoke` step の env / `--roles` | `--roles admin` を渡し ME 系 secret 参照を含まない・actionlint 0 件 | PASS |
| C-6 | AC-6 | vitest: drift fixture → `detectContractViolations` | violation 検出 | PASS |
| C-7 | AC-7 | vitest: provision カバー集合 < mint 要求 env の fixture | 不足を violation として検出 | PASS |
| C-8 | AC-8 | actionlint: `verify-mint-env-contract.yml` | 構文 OK・gate workflow present | PASS |
| C-9 | AC-9 | `bash -n scripts/smoke/provision-staging-secrets.sh` + gate | 構文 OK・JWT-mint secret 集合が verifier と一致 | PASS |
| C-10 | AC-10 | vitest + workflow: `RUNTIME_SMOKE_MINT_DEGRADE=1` + 必須 env 不足 | `mint_degraded=1` + exit 0。workflow 後続 bulk smoke は marker で skip | PASS |
| C-11 | AC-11 | workflow 差分: production runtime smoke に `RUNTIME_SMOKE_MINT_DEGRADE` 不在 | production は hard-fail 維持 | PASS |
| C-12 | AC-12 | vitest: 既存 `mint-staging-bearers.spec.ts` / `mint-staging-bearers-self-verify.spec.ts` | 後方互換ケース全 PASS | PASS |

### 4.2 証跡生成と昇格

1. [phase-11.md](./phase-11.md) §11.3 のコマンドを実行し、`evidence/mint-role-scope-test.log`（vitest）・`evidence/verify-mint-env-contract-actionlint.log`（actionlint）を生成済み。
2. 両 log を `outputs/phase-11/evidence/` 配下に **tracked file** として配置済み。
3. ログに secret / JWT の平文が残っていないことを redaction grep で再確認する:
   ```bash
   grep -rEl 'authorization:|Bearer [A-Za-z0-9_-]{20,}|STAGING_AUTH_SECRET=|eyJ[A-Za-z0-9_-]{10,}\.' \
     docs/30-workflows/completed-tasks/staging-mint-bearer-env-contract-guard/outputs/phase-11/evidence/ \
     || echo "redaction OK (no leak)"
   ```
4. [phase-11.md](./phase-11.md) §11.2 inventory の該当行を `present` に昇格済み。
5. `artifacts.json` の Gate-B を `passed`（evidence_path = 本ファイル）に更新済み。

## 5. 完了判定（Phase 11 / spec 段階）

- [x] 固定フレーズ（NON_VISUAL のため Phase 11 スクリーンショット不要）を記載
- [x] 証跡メタ（自動テスト名 / 件数・screenshot を作らない理由）を厚く記録（Feedback 4）
- [x] 実施チェックリスト（AC-1〜AC-12 の確認手順と期待結果）を記録
- [x] 4 セクション構成（固定フレーズ / 実施情報 / 仕様判断根拠 / 実行記録）で構成
- [x] 実行記録をPASS結果で記録
- [x] 実地操作不可（BEFORE-QUIT-001 / user-gated）を明記し source-level 自動テスト + actionlint を代替証跡として宣言
