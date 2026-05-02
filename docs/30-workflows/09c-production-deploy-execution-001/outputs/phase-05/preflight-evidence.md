# Phase 5 preflight evidence (read-only)

実行種別: **DRY-RUN / read-only preflight**
実行範囲: option A (safe route) — Phase 6 以降の mutation は不実行
実行日時: 2026-05-02 22:00 JST (approx)
実行ブランチ: `docs/issue-353-09c-production-deploy-execution-spec`

## S1: main 昇格 evidence (AC-2)

```
$ git fetch origin main
From https://github.com/daishiman/UBM-Hyogo
 * branch              main       -> FETCH_HEAD

$ git rev-parse origin/main
ac1dd37bd3bdfedfb233932a2a6957fd75cb2d59

$ git log origin/main -1 --pretty=format:'%H %s%n%an %ad' --date=iso
ac1dd37bd3bdfedfb233932a2a6957fd75cb2d59 Merge pull request #421 from daishiman/docs/issue-346-08a-canonical-workflow-tree-restore-task-spec
daishiman 2026-05-02 21:22:03 +0900
```

判定: 取得済。**ただし本ブランチ (`docs/issue-353-...`) はまだ main に merge されていない**ため、現時点の `origin/main` は本タスクの spec PR を含まない。Phase 6 以降を実行するなら **本タスクの spec PR を merge してから再度 PF-1 を取得** する必要がある。

## S2: Cloudflare account identity (AC-3)

```
$ bash scripts/cf.sh whoami
[ERROR] 2026/05/02 22:00:34 "Employee" isn't a vault in this account. Specify the vault with its ID or name.
```

判定: **NO-GO (BLOCKED)**。現在の op CLI session が `.env` 参照先 vault (`Employee`) を解決できない。原因候補:
- 現セッションの op アカウント切替が必要 (`my.1password.com` → `manju.1password.com`)
- `.env` 内の op 参照 vault 名が運用環境とずれている

`op account list` 結果:
```
manju.1password.com    manju.manju.03.28@gmail.com
my.1password.com       daishimanju@gmail.com
```
`op vault list` 現セッション結果: `Personal` のみ (vault `Employee` 不存在)。

差し戻し先: Phase 5 中断。user に op signin (account 切替) を促してから再実行。

## S3: D1 binding confirmation

```
$ rg -n "database_name|binding|database_id" apps/api/wrangler.toml
26:binding = "DB"
27:database_name = "ubm-hyogo-db-prod"
28:database_id = "24963f0a-7fbb-4508-a93a-f8e502aa4585"
52:binding = "DB"
53:database_name = "ubm-hyogo-db-prod"
54:database_id = "24963f0a-7fbb-4508-a93a-f8e502aa4585"
76:binding = "DB"
77:database_name = "ubm-hyogo-db-staging"
78:database_id = "990e5d6c-51eb-4826-9c13-c0ae007d5f46"
```

判定: production D1 binding は `DB` / database_name `ubm-hyogo-db-prod` / database_id `24963f0a-7fbb-4508-a93a-f8e502aa4585`。

⚠️ **DRIFT 検出 (重要)**: 本タスクの spec (phase-02.md, phase-03.md, phase-04.md, phase-05.md, etc.) は production D1 名を **`ubm_hyogo_production`** と記述しているが、実 wrangler.toml は **`ubm-hyogo-db-prod`** (ハイフン区切り)。CLAUDE.md の cf.sh 例も `ubm-hyogo-db-prod` を採用。

修正方針: spec 側を `ubm-hyogo-db-prod` に統一する。Phase 12 の system-spec-update に含める。本セッションでは下流 evidence の DB 名表記は **`ubm-hyogo-db-prod`** に固定する。

## S4: D1 migrations list (dry-run, AC-4 前提)

判定: **NO-GO (BLOCKED)**。S2 と同じ op vault 解決失敗で `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` が起動できない。

差し戻し先: S2 解決後に再実行。

## S5: secrets 7 種存在確認 (AC-5)

判定: **NO-GO (BLOCKED)**。S2 と同じ理由で API / Pages secrets list が起動できない。

差し戻し先: S2 解決後に再実行。

## 直前 production version id (rollback 先) 取得

判定: **NO-GO (BLOCKED)**。同上。

## 集約結果

| Step | 結果 | 備考 |
| --- | --- | --- |
| S1 main 昇格 | PASS (read-only 部分) | ただし本タスク spec PR は未 merge |
| S2 cf.sh whoami | **BLOCKED** | op vault 解決失敗 |
| S3 D1 binding | PASS (drift 検出) | spec は `ubm_hyogo_production`、実 config は `ubm-hyogo-db-prod` |
| S4 migrations list | BLOCKED | S2 依存 |
| S5 secrets list | BLOCKED | S2 依存 |
| prev version id | BLOCKED | S2 依存 |

## Phase 5 G2 ゲート判定

**G2 GO は不可能**。preflight 5 件中 3 件 (cf.sh 経路) が BLOCKED で、残り 2 件のうち D1 binding は spec drift を検出。Phase 6 以降 (production mutation) の起動条件を満たさない。

[DRY-RUN] 2026-05-02T22:00:34+09:00
