# Phase 11: NON_VISUAL evidence 収集（CI gate fail/pass 双方の証跡）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| Source | `outputs/phase-11/phase-11.md` |
| visualEvidence | NON_VISUAL |
| 状態 | completed |

## 目的

visualEvidence=NON_VISUAL のため UI screenshot は取らない。代わりに CI gate が **fail / pass 双方** で意図通り動くことを log evidence で示す。

## 実行タスク

### 11.1 local PASS 5 点セット

`outputs/phase-11/evidence/` 配下に Phase 9 で取得した log を配置:

- `typecheck.log`
- `lint.log`
- `test.log`
- `build.log`
- `grep-gate.log`

### 11.2 CI gate 動作 evidence

| 種別 | 取得手順 | 配置 path |
| --- | --- | --- |
| pass case | 通常 PR の web build job log を抜粋 | `outputs/phase-11/evidence/ci-pass.log` |
| fail case | 一時的に standalone 出力 `apps/web/.next/standalone/apps/web/.next/server/instrumentation.js` を削除または token を除去した throwaway branch / local reproduction で job 相当を fail させる | `outputs/phase-11/evidence/ci-fail.log` |

> fail case の検証は別 throwaway branch で行い、本タスク branch には rename 差分を残さない。

### 11.3 secret hygiene 確認

- 全 evidence log を `grep -E "DSN|token|secret"` で走査し 0 件であることを `outputs/phase-11/evidence/secret-scan.log` に記録

## 参照資料

- `outputs/phase-9/phase-9.md`
- `outputs/phase-10/phase-10.md`

## 成果物

- `outputs/phase-11/phase-11.md`
- `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate,ci-pass,ci-fail,secret-scan}.log`

## 完了条件

- local PASS 5 点 evidence が canonical path に揃う
- CI gate の pass / fail 両 case の evidence 取得済
- secret 非含有 grep が 0 件
- 状態語彙: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（runtime production deploy は別段ゲート）
