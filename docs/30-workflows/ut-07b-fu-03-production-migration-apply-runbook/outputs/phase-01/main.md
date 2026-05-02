# Phase 1 成果物: 要件定義（実装仕様書化）

> 本ファイルは `phase-01.md` の確定版成果物。実装区分は **[実装仕様書]**（CONST_004 例外）。

## 実装区分判定根拠

ユーザー指定タスク種別は「runbook ドキュメント」だが、目的達成（production D1 への安全な migration apply + 機械検証可能性 + CI gate）にはコード変更が必要なため **実装仕様書** に格上げする。production への実 apply は本タスクで行わない（AC-9）。

## 実装する成果物 F1〜F9

| # | パス | 種別 | 責務 |
| --- | --- | --- | --- |
| F1 | `scripts/d1/preflight.sh` | 新規 | staging/production DB allow-list + `d1 list` + `migrations list` で未適用判定 |
| F2 | `scripts/d1/postcheck.sh` | 新規 | 5 オブジェクト存在検証 |
| F3 | `scripts/d1/evidence.sh` | 新規 | `.evidence/d1/<ts>/` 保存 + redaction grep |
| F4 | `scripts/d1/apply-prod.sh` | 新規 | F1→confirm→apply→F2→F3 オーケストレータ。`DRY_RUN=1` 対応 |
| F5 | `scripts/cf.sh` | 編集 | `d1:apply-prod` サブコマンド追加 |
| F6 | `.github/workflows/d1-migration-verify.yml` | 新規 | PR で staging DRY_RUN を実行する CI gate |
| F7 | `scripts/d1/__tests__/*.bats` | 新規 | bats-core 単体テスト |
| F8 | `outputs/phase-05/main.md` | 編集 | F1〜F5 を呼ぶ runbook 本文（Phase 4-6 で記述） |
| F9 | `package.json` | 編集 | `test:scripts` script 追加 |

## 関数シグネチャ・引数仕様・exit code

### F1 preflight.sh

```
Usage: scripts/d1/preflight.sh <db_name> --env <staging|production> [--json]
Exit: 0=ok, 64=usage, 65=auth, 66=db not found
```

### F2 postcheck.sh

```
Usage: scripts/d1/postcheck.sh <db_name> --env <env>
Exit: 0=ok, 64=usage, 70=table missing, 71=stablekey idx missing,
      72=question idx missing, 73=cursor col missing, 74=status col missing
```

### F3 evidence.sh

```
Usage: scripts/d1/evidence.sh <db_name> --env <env> --preflight <f> --apply <f> --postcheck <f>
Output: .evidence/d1/<UTC ISO8601>/{meta.json,preflight.log,apply.log,postcheck.log}
Exit: 0=ok+redaction PASS, 64=usage, 80=secret detected, 81=mkdir failed
```

### F4 apply-prod.sh

```
Usage: scripts/d1/apply-prod.sh <db_name> --env <env>
Env:   DRY_RUN=1 で apply step skip
Exit: 0=ok, 10=preflight STOP, 20=confirm denied, 30=apply failed,
      40=postcheck failed, 80=evidence redaction failed
```

### F5 cf.sh d1:apply-prod

```
bash scripts/cf.sh d1:apply-prod <db_name> --env <env>
  → exec scripts/d1/apply-prod.sh <db_name> --env <env>
```

## 副作用と入出力

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| F1 | DB 名・env | stdout（JSON） | 認証 token を環境変数で参照（値出力なし） |
| F2 | DB 名・env | stdout（PASS/FAIL） | read-only クエリ |
| F3 | log files | `.evidence/d1/<ts>/` | filesystem write、grep redaction |
| F4 | DB 名・env・DRY_RUN | F1〜F3 の集約 | apply 時のみ DDL 実行 |
| F5 | サブコマンド | F4 へ exec | なし |

## テスト方針

| ファイル | ケース |
| --- | --- |
| `preflight.bats` | 引数欠落=64、pending 0=0、認証失敗=65、DB 不在=66 |
| `postcheck.bats` | 全件存在=0、table 欠損=70、index 欠損=71/72、column 欠損=73/74 |
| `evidence.bats` | 正常=0、Token 混入=80、mkdir 失敗=81 |
| `apply-prod.bats` | DRY_RUN=1=0、preflight STOP=10、apply 失敗=30、postcheck 失敗=40 |

mock wrangler は `PATH` 先頭の shim で実装し、固定 stdout/stderr を返す。

## ローカル実行コマンド

```bash
# bats テスト実行
mise exec -- pnpm test:scripts
# または直接
bats scripts/d1/__tests__/

# staging DRY_RUN（CI gate と等価）
DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging
```

## DoD

- bats テスト全 PASS（`pnpm test:scripts`）
- staging で `DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging` が exit 0
- CI gate `d1-migration-verify` が PR で green
- F3 redaction で機密値混入 0 件
- production 実 apply は別タスクへ委譲

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | F1〜F9 排他、AC-1〜AC-20 一対一 |
| 漏れなし | PASS | runbook 5 セクション × F1〜F5 + CI gate + bats |
| 整合性 | PASS | `cf.sh` 経由のみ・set -x 禁止・直 wrangler 禁止 |
| 依存関係整合 | PASS | 上流 UT-07B / U-FIX-CF-ACCT-01 完了済み |
