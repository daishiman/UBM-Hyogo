# Phase 10: 最終レビュー・rollback 経路

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 目的 | 30 日境界の責務分離 / redaction completeness / restore drill 成功率 / cost 試算を最終レビューし、rollback 経路と G1-G4 分離を確定する |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| irreversibleOperation | true |
| gateModel | G1-G4 |

## 目的

Phase 1-9 の成果物に対する最終レビューを行い、production R2 への書き込み（irreversible）を含む本タスクのリリース経路を G1-G4 分離で確定する。同時に、想定外事態に対する rollback 手順（workflow 無効化 / R2 lifecycle stop / 監視 Token 失効）を文章化する。

## 統合テスト連携

NON_VISUAL implementation。本 Phase は仕様レビューと rollback 設計のみ。runtime evidence は Phase 11 / Phase 13 G1 / G2 / G3-prod 後の `outputs/phase-11/runtime-evidence-pending.md` と `outputs/phase-13/*.log` で取得する。

## G1-G4 分離（[phase-template-phase13.md](../../../.claude/skills/task-specification-creator/references/phase-template-phase13.md) 準拠）

| Gate | スコープ | 承認単位 | 失敗時の取り扱い |
| --- | --- | --- | --- |
| **G1: R2 binding / Secret / bucket preflight** | R2 bucket 作成、lifecycle policy、`CF_AUDIT_R2_TOKEN_PROD` 配備、Worker deploy | `G1 approve` | 失敗時は rollback target version へ戻し、G2 へ進まない |
| **G2: D1 migration apply** | `0015_add_audit_export_manifest.sql` production apply + fresh migrations list | `G2 approve` | 失敗時は rollback SQL を実行し、G3-prod へ進まない |
| **G3-prod: first export / restore drill** | workflow_dispatch で初回日次 export、任意 1 object restore drill、secret hygiene grep | `G3-prod approve` | redaction / restore 不一致時は fail-closed で Issue 起票し、G4 へ進まない |
| **G4: commit / push / PR** | commit、push、draft PR 作成。`Refs #514` のみ | `G4 approve` | push / PR 失敗時は local branch に留め、再実行前に user へ状態共有 |

PR description の Approval セクションは次の 4 行を独立に書く:

```
G1 (R2 binding / Secret / bucket):     ⏸ pending separate approval
G2 (D1 migration apply):               ⏸ pending separate approval
G3-prod (first export / restore drill):⏸ pending separate approval
G4 (commit / push / PR):               ⏸ pending separate approval
```

## レビュー観点

### 観点 1: 30 日境界の責務分離

- [ ] D1 TTL purge（INSERT 後 30 日）と R2 export window（INSERT 後 26-29 日前）が排他かつ 1 日重複していること（Phase 1 契約 C-1）
- [ ] export スクリプトが「30 日境界そのものを変更しない」ことを実装で確認（コード内に `RETENTION_DAYS` literal が現れず、Issue #408 の TTL 設定を import / 参照していること）
- [ ] 26 日未満は export 対象外、29 日超は purge 済みで対象不可、という両端境界の test が Phase 8 YAML に含まれていること

### 観点 2: redaction completeness

- [ ] export スクリプトが cold-storage redaction transform（IP prefix / email domain / UA marker / raw_json drop）を適用してから guard を実行している（Phase 1 契約 C-3）
- [ ] redaction-guard の 5 pattern（API Token / IPv4 / IPv6 / UA / email）が Phase 8 統合テストで全件 fail-closed する
- [ ] `RedactionViolationError` 発生時に R2 PUT が呼ばれない（`mockClient.putObject` not called）ことを test で確認
- [ ] Phase 9 の secret hygiene grep が fixture / outputs / scripts に対して 0 件

### 観点 3: restore drill 成功率

- [ ] Phase 8 の `restore-drill-happy-path` が green
- [ ] `restore-drill-corrupt-row-count` で `ok=false` + Issue 起票 mock が `priority:high / type:security` で呼ばれる
- [ ] 半期発火（1 月 / 7 月）の判定ロジックが workflow YAML ではなく `restore-drill.ts` 内の UTC month 判定に倒されている（Phase 3 設計通り）
- [ ] 一時テーブル `cf_audit_log_restore_tmp_<runId>` が CREATE → INSERT → DROP まで完走することを test で確認

### 観点 4: cost 試算

R2 free tier との整合を最終確認する。

| 項目 | 月間想定値 | 算出根拠 | free tier 上限 | 余裕 |
| --- | --- | --- | --- | --- |
| Class A operations (PutObject) | 120 | 最大 4 object × 30 日 | 1,000,000 / 月 | 8,333× |
| Class B operations (GetObject, restore drill) | 1 | 半期に 1 回 / その他は 0 | 10,000,000 / 月 | 10,000,000× |
| storage（標準階層）| ~30 MB / 月（gzip 後想定）| 1 日 1 MB × 30 日 | 10 GB | 333× |
| egress | 半期 1 MB | restore drill のみ | unlimited (R2 zero egress) | 制約なし |

90 日経過後に Infrequent Access 階層に移行する lifecycle policy により、長期保管コストはさらに低下する。auto-delete を含めない方針（Phase 3 / index.md 苦戦箇所 #6）は維持。

### 観点 5: Token 権限境界

- [ ] `CF_AUDIT_R2_TOKEN_PROD`（`Account > R2:Edit`）が監視 Token `CF_AUDIT_TOKEN_PROD`（`Account > Audit Logs:Read`）と独立 entry である
- [ ] 90 日 rotation runbook（U-FIX-CF-ACCT-01-DERIV-03）に export Token の rotation 行が追記されている
- [ ] export Token に `R2:Read` 以外の bucket 削除権限が含まれていない（漏洩時 blast radius 限定）

## Rollback 経路

production への影響度別に 3 段階の rollback を用意する。

### Rollback Tier 1: workflow 無効化（最速・5 分以内）

```bash
# GitHub Actions UI または gh CLI で workflow を即時 disable
gh workflow disable cf-audit-log-cold-storage.yml --repo daishiman/UBM-Hyogo

# 確認
gh workflow list --repo daishiman/UBM-Hyogo | grep cf-audit-log-cold-storage
```

適用シーン: redaction violation 多発 / R2 PUT 失敗の連鎖 / cost spike 検出。日次 schedule の自動発火を即座に止める。

### Rollback Tier 2: R2 lifecycle 停止 + bucket への新規書き込み禁止

```bash
# lifecycle policy を一旦削除（IA 移行も止める）
bash scripts/cf.sh r2 lifecycle delete ubm-hyogo-audit-cold-storage-prod --env production

# Token の R2:Edit 権限を Cloudflare Dashboard で revoke（書き込みのみ停止 / 既存 object は保持）
# 1Password の CF_AUDIT_R2_TOKEN_PROD を新 Token で上書きせず、 status を `revoked` に書き換える
```

適用シーン: redaction policy に致命的な漏れが発覚し、追加 PUT を全て止めたいが既存 object は保全したい場合。

### Rollback Tier 3: 監視 / export Token 失効 + bucket lock

```bash
# Cloudflare Dashboard で 2 つの Token を即時 delete
#   - CF_AUDIT_R2_TOKEN_PROD (R2:Edit)
#   - CF_AUDIT_TOKEN_PROD    (Audit Logs:Read) — 必要なら
# 既存 R2 object に対する手動 DELETE は本タスクでは行わない（半期監査要件のため保全）

# wrangler.toml の R2 binding を一時的にコメントアウトして apps/api を redeploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

適用シーン: 漏洩疑い / 内部統制の指示で全アクセス遮断が必要な場合。bucket 自体の delete は半期監査要件と相反するため絶対に行わない（手動 runbook で意思決定後のみ可）。

### Rollback で行わないこと

- R2 object の一括 DELETE（半期監査要件と相反）
- D1 `cf_audit_log_export_manifest` テーブルの DROP（過去 export 履歴の retention metadata が失われる）
- Issue #408 fetcher 側の停止（cold storage タスクの責務外）

## artifacts.json metadata 確定

| key | 値 |
| --- | --- |
| `irreversibleOperation` | `true` |
| `gateModel` | `G1-G4` |
| `migration_filename` | `0015_add_audit_export_manifest.sql` |
| `test_counts_ssot` | `outputs/phase-06/main.md` / `outputs/phase-07/main.md` |
| `runtime_state` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| `policy_value_ssot` | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（30 日境界・retention 方針の正本） |

## 入力・出力・副作用

- 入力: Phase 1-9 の成果物
- 出力: `outputs/phase-10/final-review-result.md`（観点 1-5 の判定 + rollback 経路 + Gate 状態）
- 副作用: なし（仕様レビューのみ）

## 判定基準

| 判定 | 条件 | 対応 |
| --- | --- | --- |
| PASS | 観点 1-5 すべて問題なし、rollback 3 階層が文章化済み | Phase 11 へ進行。runtime mutation は G1 / G2 / G3-prod user approval 後 |
| MINOR | redaction 5 pattern のうち軽微な regex 改善余地 / cost 試算の桁違いなし | unassigned task に記録し Phase 11 へ進行 |
| MAJOR | restore drill 失敗 / redaction completeness 不十分 / 30 日境界の責務分離崩れ | Phase 5 or Phase 8 へ戻る |
| CRITICAL | R2 binding が production env に未定義 / migration 番号衝突 / Token 権限分離なし | Phase 1 へ戻りユーザーと再確認 |

## ローカル実行・検証コマンド

```bash
# 30 日境界 literal が outputs に散在していないか
grep -rE '\b(26|29|30)\s*日|RETENTION_DAYS\s*=\s*[0-9]+' \
  docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs 2>/dev/null \
  | wc -l   # 期待: 軽微な参照のみ（policy 値 literal は禁止）

# G1-G4 記述が PR description テンプレに含まれるかの予習確認
grep -E 'G1|G2|G3-prod|G4' \
  docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/phase-10.md
# 期待: G1 / G2 / G3-prod / G4 の 4 行

# rollback Tier 1 ドリル（dry-run）
gh workflow list --repo daishiman/UBM-Hyogo | grep cf-audit-log-cold-storage || echo "not yet deployed (G1 前は OK)"

# migration filename pin 確認
test -f apps/api/migrations/0015_add_audit_export_manifest.sql && echo OK
```

## DoD（Phase 10 完了条件）

- [ ] 観点 1（30 日境界） / 2（redaction completeness） / 3（restore drill 成功率） / 4（cost 試算） / 5（Token 権限境界）の 5 観点が `outputs/phase-10/final-review-result.md` に判定付きで記録されている
- [ ] G1-G4 分離（G1 / G2 / G3-prod / G4）が PR description テンプレートに反映されている
- [ ] Rollback 3 階層（workflow 無効化 / lifecycle 停止 / Token 失効）の手順が `bash` / `gh` コマンド付きで文章化
- [ ] Rollback で行わないこと（R2 object 一括 DELETE / manifest テーブル DROP / fetcher 停止）が明記されている
- [ ] cost 試算が R2 free tier 上限と桁違いの余裕で収まることを表で確認
- [ ] artifacts.json `metadata` に `taskType` / `visualEvidence` / `workflow_state` / `implementation_status` / `runtime_state` / `approval_state` が pin 済み
- [ ] 判定が PASS / MINOR の場合のみ Phase 11 へ進行可、MAJOR / CRITICAL は戻り先を本ファイルで指定済み
- [ ] runtime evidence pending を `outputs/phase-11/runtime-evidence-pending.md` で起票する経路が確認されている
