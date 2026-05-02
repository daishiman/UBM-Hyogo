# Phase 2 成果物: 設計（runbook + コードアーキテクチャ）

## スクリプト間データフロー

```
cf.sh d1:apply-prod (F5)
  └→ apply-prod.sh (F4)
       ├→ preflight.sh --json (F1)         exit 0/64/65/66
       ├→ confirm prompt (production only)  exit 20 on deny
       ├→ cf.sh d1 migrations apply         exit 30 on fail
       ├→ postcheck.sh (F2)                 exit 0/70..74
       └→ evidence.sh (F3)                  exit 0/80/81
```

## 引数仕様 / exit code 規約

| Script | Args | Env | Exit codes |
| --- | --- | --- | --- |
| F1 preflight.sh | `<db> --env <e> [--json]` | - | 0,64,65,66 |
| F2 postcheck.sh | `<db> --env <e>` | - | 0,64,70,71,72,73,74 |
| F3 evidence.sh | `<db> --env <e> --preflight <f> --apply <f> --postcheck <f>` | - | 0,64,80,81 |
| F4 apply-prod.sh | `<db> --env <e>` | `DRY_RUN` | 0,10,20,30,40,80 |
| F5 cf.sh d1:apply-prod | `<db> --env <e>` | `DRY_RUN` | F4 を継承 |

共通: `set -eu` 必須、`set -x` 禁止、`--env` は staging|production のみ受理。

## evidence 保存スキーマ

`.evidence/d1/<UTC compact ISO8601>/`
- `meta.json`: db, env, commit_sha, migration_filename, timestamp_utc, timestamp_jst, approver, dry_run, exit_code
- `preflight.log` / `apply.log` / `postcheck.log`

### redaction パターン

```
rg -n "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|sk-[A-Za-z0-9]+|Bearer [A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\."
```

ヒット 0 で PASS、それ以外で exit 80 + 当該ディレクトリ削除。

## CI gate workflow（F6）

- ファイル: `.github/workflows/d1-migration-verify.yml`
- trigger: PR `apps/api/migrations/**` / `scripts/d1/**` / `scripts/cf.sh` 変更
- jobs: `pnpm test:scripts` → `DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging`
- secret: `CLOUDFLARE_API_TOKEN_STAGING` のみ参照（production secret 禁止）

## runbook 章立て × F1〜F5 対応

| # | runbook 章 | 実行対象 | 関連 exit |
| --- | --- | --- | --- |
| 1 | preflight | F1 | 0/65/66 |
| 2 | apply | F4 内部 `cf.sh apply` | F4=30 |
| 3 | post-check | F2 | 0/70..74 |
| 4 | evidence | F3 | 0/80 |
| 5 | failure handling | F4 全体 | 10/20/30/40/80 |

## 承認ゲート × 自動化対応

| Gate | 自動/手動 | 関連 |
| --- | --- | --- |
| G1 commit | 手動 | - |
| G2 PR | 手動 | - |
| G3 CI gate | 自動 | F6 + F1..F4 + F7 |
| G4 merge | 手動 | - |
| G5 user explicit approval | 手動 | runbook 冒頭で確認 |
| G6 runbook 実走 | 手動 | F5 → F4 |

## 不変条件 #5

F1〜F5 はランタイム経路を作らず、`apps/web` からの D1 直接アクセスを新設しない。post-check は read-only。よって侵害なし。

## 4 条件評価

| 条件 | 判定 |
| --- | --- |
| 矛盾なし | PASS |
| 漏れなし | PASS |
| 整合性 | PASS |
| 依存関係整合 | PASS |
