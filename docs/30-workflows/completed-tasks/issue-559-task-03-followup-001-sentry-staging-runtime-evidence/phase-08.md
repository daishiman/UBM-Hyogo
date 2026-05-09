# Phase 8: DRY 化

## 1. DRY 観点レビュー

本タスクは大半が既存基盤（親 task-03 / task-02 / `scripts/cf.sh` / `aiworkflow-requirements`）への薄い結線である。新規重複は最小に抑える。

| 観点 | 既存資産 | 本タスクでの扱い |
| --- | --- | --- |
| Sentry init | 親 task-03 の `instrumentation.ts` / `instrumentation-client.ts` / `capture.ts` | **再利用**（編集なし） |
| env schema | task-02 の `apps/web/src/lib/env.ts` `getEnv()` | **拡張**（5 キー追記、既存パターン踏襲） |
| Cloudflare CLI | `scripts/cf.sh` | **再利用**（直接 wrangler 呼ばない） |
| 1Password 連携 | `op run --env-file=.env` / `op read` | **再利用** |
| secret list / put 手順 | task-obs-sentry-dsn-registration-001 / 09b-A | **手順を踏襲**（同様のパターンで `cf.sh secret put` + `secret list` evidence） |
| evidence path 規約 | `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` の skill 規約 | **踏襲**（runtime 5 点 + Sentry screenshot を追加） |
| state 語彙 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING/VERIFIED` | **踏襲**（task-spec-creator skill v2026.05.06 規約） |

## 2. 新規追加コードの最小化

| 候補 | 必要性 | 採否 |
| --- | --- | --- |
| 専用 secret 投入 helper script | `scripts/cf.sh` に既存責務がある | 不採用（既存で十分） |
| Sentry event 受信を polling する自動化 script | 30 分 / 5 件以下のオブザーブで人手承認が現実的 | 不採用（過剰自動化） |
| env schema 5 キー専用 zod 別ファイル | 既存 `env.ts` の object に追加で 5 行程度の差分 | 不採用（同一ファイル拡張） |
| 一時 throw route 専用 | 親 task-04 / task-05 の error route が利用可能なら再利用 | 採用条件付き（既存路線がない場合のみ短期 query 分岐） |

## 3. 重複検出 grep

```bash
# Sentry init を複数箇所で行っていないか
rg -n 'Sentry\.init' apps/web/src/

# DSN を直接焼き込んでいないか
rg -n 'https://.*@.*[.]ingest[.]sentry[.]io' apps/web/src/

# process.env.SENTRY_* の直接参照（getEnv 経由のみ許可）
rg -n 'process\.env\.SENTRY|process\.env\.NEXT_PUBLIC_SENTRY' apps/web/src/
```

すべて 0 件、または `instrumentation*.ts` 1 箇所限定（process.env は instrumentation の NEXT_RUNTIME 判定のみ許容）であること。

## 4. 結論

DRY 違反 0 件。新規追加は最小（env.ts 5 行 + wrangler.toml 6 行 + .dev.vars.example 2 行 + テスト 1 ファイル + ドキュメント）。
