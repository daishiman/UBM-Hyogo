# Phase 9: 品質検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 目的 | typecheck / lint / focused vitest / secret hygiene grep / workflow path existence gate を実行し、`spec_created_runtime_pending` で close-out する |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| irreversibleOperation | true（production R2 binding / Secrets / 日次実行 evidence は Phase 13 G1-G3） |

## 目的

Phase 5-8 の実装を、production R2 / 実 Cloudflare API に到達せずに検証可能な範囲で品質ゲートを通す。

1. `pnpm typecheck` / `pnpm lint` を green に保つ
2. focused vitest（exporter / restore-drill / redaction-guard / 統合 4 spec）の green を確認
3. **secret hygiene grep**: R2 object へ書かれる JSONL fixture と redaction-guard の出力に `op://` 参照 / 完全 IP / 平文 User-Agent / API Token prefix が混入しないことを repo 全体および snapshot fixture に対して grep で再確認する
4. **workflow path existence gate**: `.github/workflows/cf-audit-log-cold-storage.yml` が repo に実在することを `test -f` で確認（仕様書だけ更新して workflow 未配置のまま PR が出るリグレッション防止）
5. close-out 状態は `spec_created_runtime_pending`。production R2 bucket 作成 / `CF_AUDIT_R2_TOKEN_PROD` 登録 / 初回日次実行の 3 つは runtime gate として Phase 10 / 11 に持ち越す

## 統合テスト連携

NON_VISUAL implementation。Phase 8 で固定した YAML scenario id と Phase 11 runtime evidence の 1:1 対応を Phase 9 で再確認する。

## 品質ゲート一覧

| ゲート | 確認内容 | コマンド | green の定義 |
| --- | --- | --- | --- |
| typecheck | `apps/api` および `scripts/cf-audit-log` 配下の TS 型 | `mise exec -- pnpm typecheck` | exit 0 |
| lint | ESLint / Biome rules | `mise exec -- pnpm lint` | exit 0 |
| unit (focused) | `export-manifest.spec.ts` / `redaction-guard.spec.ts` | `mise exec -- pnpm vitest run scripts/cf-audit-log/__tests__/export-manifest.spec.ts scripts/cf-audit-log/__tests__/redaction-guard.spec.ts` | 全 case pass |
| integration | Phase 8 の 4 spec | `mise exec -- pnpm vitest run scripts/cf-audit-log/__tests__/integration` | 全 case pass |
| secret hygiene grep | snapshot fixture / outputs / scripts に op 参照・完全 IP・API Token prefix が無い | 後述 | grep 0 件 |
| workflow path existence | `.github/workflows/cf-audit-log-cold-storage.yml` 実在 | `test -f .github/workflows/cf-audit-log-cold-storage.yml` | exit 0 |
| migration filename pin | `0015_add_audit_export_manifest.sql` literal が artifacts.json と一致 | `grep '0015_add_audit_export_manifest' apps/api/migrations/0015_add_audit_export_manifest.sql` | 1 hit |
| wrangler.toml R2 binding | `UBM_AUDIT_COLD_STORAGE` が production / preview の両 env で定義 | 後述 | 2 hit |

## secret hygiene grep（詳細）

R2 object 内容（fixture / snapshot / 実出力モック）に PII / secret が混入しないことを以下 5 パターンで確認する。production R2 への書き込みは irreversible なため、Phase 9 の自動チェックを最後の防衛線として運用する。

```bash
# 1. op:// 参照が JSONL / fixture / outputs に混入していないか
grep -RE 'op://[A-Za-z0-9_./-]+' \
  scripts/cf-audit-log/__tests__/integration/fixtures \
  docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs 2>/dev/null \
  && exit 1 || echo "ok: no op:// in fixtures/outputs"

# 2. Cloudflare API Token prefix
grep -RE 'v1\.0-[A-Za-z0-9_-]{40,}' \
  scripts/cf-audit-log \
  docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export 2>/dev/null \
  && exit 1 || echo "ok: no v1.0- token prefix"

# 3. 完全 IPv4（末尾 octet が 0 でない実 IP 形）
grep -RE '\b([0-9]{1,3}\.){3}[1-9][0-9]{0,2}\b' \
  scripts/cf-audit-log/__tests__/integration/fixtures 2>/dev/null \
  | grep -v '0\.0\.0\.0' \
  && exit 1 || echo "ok: no full IPv4 in fixtures"

# 4. 完全 IPv6
grep -RE '\b([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b' \
  scripts/cf-audit-log/__tests__/integration/fixtures 2>/dev/null \
  && exit 1 || echo "ok: no full IPv6 in fixtures"

# 5. 平文 email local-part（hash 化されていない @）
grep -RE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+' \
  scripts/cf-audit-log/__tests__/integration/fixtures 2>/dev/null \
  && exit 1 || echo "ok: no plaintext email in fixtures"
```

ヒット件数 0 を Phase 9 の必須ゲートとする。fixture に意図的に違反パターンを埋める redaction integration test の合成データは別ディレクトリ (`fixtures/violations/`) に分離し、上記 grep の対象から除外する。

## workflow path existence gate

```bash
# 仕様書が参照する workflow が repo に実在することを確認
test -f .github/workflows/cf-audit-log-cold-storage.yml || { echo "NG: workflow file missing"; exit 1; }

# 仕様書 / runbook 内で参照される workflow path が全て実在することを確認
rg -o '\.github/workflows/[a-z0-9-]+\.yml' \
  docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export \
  .claude/skills/aiworkflow-requirements/references/observability-monitoring.md \
  docs/00-getting-started-manual/specs/15-infrastructure-runbook.md \
  | sort -u \
  | while read p; do test -f "$p" || { echo "NG: missing $p"; exit 1; }; done
echo "ok: all referenced workflow files exist"
```

## wrangler.toml R2 binding 確認

```bash
# production / preview の両 env で UBM_AUDIT_COLD_STORAGE binding が定義されていることを確認
COUNT=$(grep -c 'binding\s*=\s*"UBM_AUDIT_COLD_STORAGE"' apps/api/wrangler.toml)
test "$COUNT" -ge 2 || { echo "NG: R2 binding count=$COUNT (expected >=2)"; exit 1; }
echo "ok: R2 binding present in $COUNT envs"
```

## PII redact checklist（Phase 9 標準ゲート）

- [ ] **log redact 確認**: `export-to-r2.ts` の console.log / console.error が partition / row count / object key / sha256 prefix / byte size のみを出力し、生 email / 完全 IP / 平文 UA を出していない
- [ ] **manifest_json PII 排除**: D1 `cf_audit_log_export_manifest` 列 (`object_key` / `sha256` / `error_message`) に PII が混入しない（特に `error_message` に request body を引用しない）
- [ ] **エラースタック redact**: `RedactionViolationError` は `pattern` と先頭 32 文字 sample のみを保持し、stack trace に full payload を含めない
- [ ] **Secrets vs Variables 使い分け**: `CF_AUDIT_R2_TOKEN_PROD` は GitHub Secrets / 1Password、bucket 名 `ubm-hyogo-audit-cold-storage-prod` は `wrangler.toml` で平文管理（非機密）

## close-out 状態

| 項目 | 状態 | 理由 |
| --- | --- | --- |
| local typecheck / lint / vitest | green | Phase 9 で確認 |
| R2 bucket production 作成 | runtime pending | 外部 credential 必要 / Phase 13 G1-G3 |
| `CF_AUDIT_R2_TOKEN_PROD` 登録（1Password / GitHub Secrets） | runtime pending | secret 値の取り扱いはユーザー操作 |
| 初回日次 export 実行 evidence | runtime pending | `schedule: '0 2 * * *'` の自然発火 or `workflow_dispatch` で取得 |
| 半期 restore drill evidence | runtime pending | 1 月 / 7 月の半期発火 |

artifacts.json `metadata.runtime_state = "PASS_BOUNDARY_SYNCED_RUNTIME_PENDING"` を維持し、Phase 12 close-out で実 runtime PASS に書き換えない。

Phase 9 は `spec_created_runtime_pending` で close-out し、`docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/outputs/phase-11/runtime-evidence-pending.md` を後続で起票する経路を確保する。

## 入力・出力・副作用

- 入力: Phase 5-8 の成果物（実装 + 統合テスト YAML）
- 出力: 各ゲートの実行ログ（`outputs/phase-09/quality-report.md` に貼付）
- 副作用: なし（read-only / in-memory のみ）

## テスト方針

Phase 9 自体は新規テスト追加なし。Phase 6-8 で追加済みの test を CI で再実行し、grep による hygiene gate を新規追加する。

## ローカル実行・検証コマンド

```bash
# 一括実行
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/cf-audit-log

# secret hygiene grep（5 パターン一括）
bash scripts/cf-audit-log/__tests__/integration/secret-hygiene-grep.sh   # Phase 5 で配置予定

# workflow path existence
test -f .github/workflows/cf-audit-log-cold-storage.yml && echo OK

# wrangler R2 binding 重複確認
grep -c 'UBM_AUDIT_COLD_STORAGE' apps/api/wrangler.toml
```

## DoD（Phase 9 完了条件）

- [ ] `pnpm typecheck` / `pnpm lint` exit 0
- [ ] focused vitest（unit 3 spec + 統合 4 spec）が全て green
- [ ] secret hygiene grep 5 パターンがすべて 0 件（fixtures/violations/ を除外した上で）
- [ ] workflow path existence gate が `.github/workflows/cf-audit-log-cold-storage.yml` の実在を確認
- [ ] wrangler.toml に `UBM_AUDIT_COLD_STORAGE` binding が production / preview の両 env で定義されている
- [ ] migration filename `0015_add_audit_export_manifest.sql` が artifacts.json `metadata.migration_filename` と一致
- [ ] PII redact checklist 4 項目を `outputs/phase-09/quality-report.md` に証跡付きで記録
- [ ] close-out 状態を `spec_created_runtime_pending` に固定し、runtime pending 3 項目（R2 bucket 作成 / secret 登録 / 日次実行 evidence）を Phase 13 G1-G3 へ引き継ぐ
- [ ] artifacts.json `metadata.runtime_state = "PASS_BOUNDARY_SYNCED_RUNTIME_PENDING"` が維持されている
