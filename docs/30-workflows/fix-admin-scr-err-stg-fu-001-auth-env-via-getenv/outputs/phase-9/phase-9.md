# Phase 9: 品質保証

[実装区分: 実装仕様書]

| 項目   | 値                                          |
| ------ | ------------------------------------------- |
| Task ID | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV |
| Phase  | 9 / 13（品質保証）                          |
| 依存   | Phase 7（カバレッジ確認） / Phase 8（リファクタリング） |
| 成果物 | outputs/phase-9/phase-9.md                  |
| 判定方式 | typecheck / lint / test / grep gate の **一括 PASS/FAIL** |

## 1. このPhaseの責務

実装・リファクタ完了後の最終品質判定。typecheck / lint / 対象 test の一括実行に加え、本タスク固有の
**grep gate（AC-1 / AC-2）** と **live import ゼロ確認** を機械的に検証する。AC-1〜AC-8 を検証手順表で
網羅し、すべて PASS でなければ Phase 10（最終レビュー）へ進めない。

## 2. 一括品質検証コマンド（順序固定）

```bash
# ① 型チェック
mise exec -- pnpm typecheck

# ② lint（違反があれば --fix → 残りを手修正）
mise exec -- pnpm lint

# ③ 対象 unit test（targeted run）
mise exec -- pnpm exec vitest run --root=. \
  apps/web/src/lib/auth.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts

# ④ AC-1 grep gate（process.env 直接参照 = 0 件）
grep -n "process\.env" apps/web/src/lib/auth.ts && echo "AC-1 FAIL" || echo "AC-1 PASS: no process.env"

# ⑤ AC-2 grep gate（getCloudflareContext = 0 件）
grep -n "getCloudflareContext" apps/web/src/lib/auth.ts && echo "AC-2 FAIL" || echo "AC-2 PASS: no getCloudflareContext"
```

> ④⑤ は `grep` がマッチ 0 件のとき exit code 1 を返すため、`&& echo FAIL || echo PASS` で 0 件＝PASS を表現する。
> 1 件でもヒットすれば FAIL を出力する。

## 3. AC-1〜AC-8 検証手順表

| AC   | 検証内容                                                    | 検証手順（コマンド / 確認点）                                                                 | 期待 |
| ---- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---- |
| AC-1 | `auth.ts` に `process.env.` 直接参照 0 件                    | `grep -n "process\.env" apps/web/src/lib/auth.ts`                                              | 0 件（出力なし） |
| AC-2 | `auth.ts` に `getCloudflareContext` 0 件（import 含む）      | `grep -n "getCloudflareContext" apps/web/src/lib/auth.ts`                                      | 0 件（出力なし） |
| AC-3 | 全 env 取得が `getAuthEnv()` 経由                           | `grep -n "getAuthEnv" apps/web/src/lib/auth.ts`（env() 内で参照）+ §4 の live import ゼロ確認  | `getAuthEnv` 参照 ≥1 かつ 旧関数参照 0 |
| AC-4 | EnvSchema に必要 9 key（google系4 含む）が揃い safeParse 成功 | `grep -n "GOOGLE_CLIENT_ID\|GOOGLE_CLIENT_SECRET\|AUTH_GOOGLE_ID\|AUTH_GOOGLE_SECRET" apps/web/src/lib/env.ts` + `env.spec.ts` の「wrangler.toml 相当値で safeParse success」テスト green | 4 key 定義 + テスト green |
| AC-5 | typecheck / lint / auth.spec.ts 全ケース green               | §2 ①②③ がすべて exit 0                                                                         | 全 PASS |
| AC-6 | （user-gated）staging runtime smoke                          | Phase 11 の手動テストで実施（本 Phase では判定対象外・記録のみ）                              | 後続 Phase |
| AC-7 | CLAUDE.md「apps/web env アクセス不変条件」整合               | AC-1/AC-2 grep gate PASS + Phase 2/3 設計記述（getAuthEnv が唯一の env 入口）                  | grep PASS + 設計整合 |
| AC-8 | invariant #11（fail-closed）回帰なし                        | `auth.spec.ts`「baseUrl 未設定なら unregistered」「default env() で unregistered」（L27-47, L186-190）green + `env.spec.ts` safeParse fail→`{}` green | 全 green |

## 4. live import ゼロ確認（FB-UI-02-1: stub / 削除どちらでも PASS）

本タスクは「ファイル削除」ではなく「関数削除（env.ts への集約）」のため、削除した関数への live 参照が
ゼロであることを grep で確認する。stub 化（空関数で残す）でも削除でも、live 参照がゼロなら PASS とする。

```bash
# 削除した auth.ts ローカル関数への live 参照がゼロ（単語境界で readCloudflareEnv 等と区別）
grep -rn "\bcloudflareEnv\b" apps/web/src/lib/auth.ts ; echo "--- expect: 0 (削除 or stub どちらでも live 参照 0)"
grep -rn "\bprocessEnv\b" apps/web/src/lib/auth.ts ; echo "--- expect: 0"

# getAuthEnv が auth.ts の唯一の env 入口になっていること（AC-3）
grep -n "getAuthEnv" apps/web/src/lib/auth.ts ; echo "--- expect: >=1 (env() 内で参照)"

# definedEnv は requestEnv が使うため残る（誤削除していないこと）
grep -n "\bdefinedEnv\b" apps/web/src/lib/auth.ts ; echo "--- expect: >=1"
```

> 判定基準: 削除関数 `cloudflareEnv` / `processEnv` の auth.ts 内 live 参照が **0 件**であれば、関数を物理削除
> しても空 stub で残しても PASS（FB-UI-02-1）。本タスクは Phase 8 で物理削除を選択するため 0 件が期待値。

## 5. `bash scripts/verify-pr-ready.sh` の位置づけ

`verify-pr-ready.sh` は docs-only gate の pre-flight（`verify:phase12-compliance` / `gate-metadata:validate` /
`indexes:rebuild` drift の一括検証）であり、**仕様書（このワークフロー）の構造健全性**を見るものである。

| 区分                          | 本 Phase での扱い                                                              |
| ----------------------------- | ------------------------------------------------------------------------------ |
| コード変更の品質判定          | §2 の typecheck / lint / test + §3 grep gate（AC-1〜AC-5/7/8）が正本            |
| 仕様書（workflow）の構造判定  | `bash scripts/verify-pr-ready.sh` が正本。Phase 13（PR 作成）の pre-flight として実行 |

> 本タスクの `workflow_state` が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（local 実装済み）の段階では `verify-pr-ready.sh` の docs-only gate が
> 主たる検証。コード実装サイクルでは §2/§3 のコード検証が加わる。両者は判定スコープが異なるため併用する。

## 6. 失敗時の切り分け

| 失敗箇所                        | 切り分け                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                | `AuthEnv` 型の import 漏れ / `import type` 混在の `type` 修飾漏れ / `getAuthEnv` 戻り型不一致を確認 |
| `pnpm lint`                     | まず `pnpm lint --fix`。残る unused import（getCloudflareContext 削除漏れ）を手修正            |
| `auth.spec.ts` RED              | mock（`vi.mock("@opennextjs/cloudflare")`）が env.ts 側の `getCloudflareContext` に効いているか。auth.ts が import しなくなっても env.ts 経由で mock が効くこと（Phase 3 §3 で確認済） |
| `env.spec.ts` RED               | `getAuthEnv()` の safeParse fail 分岐が `{}` を返すか / binding 同梱の有無分岐を確認            |
| AC-1/AC-2 grep が 1 件以上       | Phase 8 のリファクタ未完。削除漏れの関数 / import を撤去                                         |
| `verify-pr-ready.sh` FAIL       | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 参照（gate-metadata → phase12-compliance → indexes:rebuild drift の順） |

## 7. 完了条件（このPhaseの DoD）

- [ ] §2 ①②③ がすべて exit 0（typecheck / lint / target test 全 green）
- [ ] AC-1 grep gate = 0 件（`process.env` なし）
- [ ] AC-2 grep gate = 0 件（`getCloudflareContext` なし）
- [ ] AC-3: `getAuthEnv` が auth.ts の唯一の env 入口（旧関数 live 参照 0 件）
- [ ] AC-4: google 系 4 key が env.ts に定義され safeParse success テスト green
- [ ] AC-8: fail-closed 回帰テスト（unregistered 系）green
- [ ] §4 live import ゼロ確認（cloudflareEnv / processEnv = 0、definedEnv = 保持）
- [ ] `bash scripts/verify-pr-ready.sh` の位置づけを記録（Phase 13 pre-flight として実行）
- [ ] AC-7（runtime smoke）は Phase 11 へ申し送り（user-gated・本 Phase 対象外）
