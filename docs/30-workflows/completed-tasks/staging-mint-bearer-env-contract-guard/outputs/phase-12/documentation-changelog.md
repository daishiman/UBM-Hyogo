# Documentation Changelog — staging-mint-bearer-env-contract-guard

## 作成した仕様書ファイル

| 日付 | 変更 | ファイル |
| ---- | ---- | -------- |
| 2026-06-07 | 仕様書 root 新規作成 + 実装反映（`implemented_local_evidence_captured`） | `docs/30-workflows/completed-tasks/staging-mint-bearer-env-contract-guard/index.md` |
| 2026-06-07 | Phase 1-13 仕様書作成 | `outputs/phase-1..13/phase-N.md` |
| 2026-06-07 | strict 7 outputs 作成 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| 2026-06-07 | `artifacts.json` 作成（Gate-A,B passed / Gate-C pending・status=implemented_local_evidence_captured） | `artifacts.json` |
| 2026-06-07 | Phase 11 NON_VISUAL 証跡作成（screenshot 不要・focused test/actionlint log present） | `outputs/phase-11/phase-11.md`, `outputs/phase-11/manual-test-result.md`, `outputs/phase-11/evidence/*.log` |

> 実装コード（`scripts/smoke/mint-staging-bearers.mts` 等）と test の実体化、focused test / actionlint / shellcheck は本サイクルで実施済み。

## 新 env / 新 CLI 契約の記録（Step 2 = N/A の補足・再現性確保）

ドメイン契約ではないため system spec 正本更新は N/A だが、本タスクで導入する CI/script 層の新インターフェースを記録する:

| 種別 | 名前 | 既定 | 意味 |
| ---- | ---- | ---- | ---- |
| CLI 引数 | `--roles <admin\|me\|admin,me>`（`--roles=<v>` 形式も可） | 未指定（= `admin,me`） | mint する role を指定。要求 role の env のみ必須化 |
| env（入力） | `MINT_ROLES` | 未設定（= `admin,me`） | CLI `--roles` の env 経路。CLI が優先 |
| env（入力フラグ） | `RUNTIME_SMOKE_MINT_DEGRADE` | 未設定（= 非 degrade） | `"1"` 厳密一致で必須 env 不足時 degrade を許可（staging 限定。production 未設定 = hard-fail 維持） |
| env（marker 結果） | `RUNTIME_SMOKE_MINT_DEGRADED` | — | mint step が degrade 発火時に `GITHUB_ENV` へ書く。後続 step の skip 判定用（入力フラグと名前を分離） |
| GITHUB_OUTPUT key | `mint_degraded=1` | — | degrade 時の marker 行（通常時は出さない） |
| 新規 CI gate | `verify-mint-env-contract`（`verify-mint-env-contract.yml` の `verify` job） | — | mint env 契約 drift の静的検出。required status check 登録は user-gated |

## validator 結果（本サイクルで対象とする gate）

| validator | コマンド | 期待 | 本サイクル状態 |
| --------- | -------- | ---- | -------------- |
| phase12-compliance | `pnpm verify:phase12-compliance`（CI gate `verify-phase12-compliance`） | canonical 9 見出し逐語一致 + Phase 11 evidence inventory 整合で ok:true | 仕様書として準拠（実走は close-out / PR 前 pre-flight） |
| gate-metadata | `pnpm gate-metadata:validate` | artifacts.json zod schema 整合・Gate-A passed の evidence_path 実在 | Gate-A evidence_path = `phase12-task-spec-compliance-check.md` 実在 |
| indexes | `pnpm indexes:rebuild` | skill 本体非変更のため drift 0（冪等） | 本タスクは `.claude/skills/**` を変更しないため drift 想定なし |

> 上記コードレベル validator（typecheck / lint / vitest / actionlint / shellcheck）は本サイクルで実行済み。

## current vs baseline

| 観点 | baseline（本タスク前） | current（本タスク後） |
| ---- | ---------------------- | --------------------- |
| mint script の env 必須化 | role に関わらず常に 5 env 必須（admin-only job が ME 系欠落で exit 2） | role-scoping を実装（`--roles admin` で ME 系不要） |
| env 契約 drift の検出時点 | 本番 CI 実行時に初めて顕在化 | 新規 `verify-mint-env-contract` gate を PR 時点で fail-fast 検出するよう仕様確定 |
| provision script の secret 集合 | 旧 static-bearer 集合のみ（JWT-mint 集合と drift） | JWT-mint 集合へ整合・旧 static-bearer は runtime fallback として受け付けるが provision 対象から分離 |
| 必須 env 不足時の挙動 | 一律 hard-fail（exit 2） | staging 限定 degrade（warn + job skip）を仕様確定。production は hard-fail 維持 |

## 変更理由

`bulk-tag-runtime-smoke` job が他責の env 欠落（admin-only job に不要な ME 系 secret）で毎 deploy 失敗し CI 全体を止める drift を、(A) role-scoping で根本解消、(B) drift gate で再発を PR 時点で機械検出、(C) provision 整合で secret inventory と mint 要求の乖離を解消、(D) staging 限定 degrade で過渡期の CI 停止を回避する 4 対策の実装仕様書として作成した（ユーザー承認済み A+B+C+D・CONST_007 で同一サイクルスコープ）。
