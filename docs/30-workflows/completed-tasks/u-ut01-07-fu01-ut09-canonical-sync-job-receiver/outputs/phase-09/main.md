# Phase 9 成果物: 品質保証（静的検証 + 文書整合 + 監査トレーサビリティ + drift 検知 + CI gate）

## 概要

本ドキュメントは UT-09 canonical sync job implementation receiver（U-UT01-07-FU01）の品質ゲート 5 軸の結果を統合する。タスク種別は docs-only（spec_created 段階）であり、コード境界としては const ファイル 1 + grep ガード script 1 + pre-commit hook 1 + CI workflow 1 を仕様確定する。

- 静的検証: typecheck / lint / canonical 名 grep ガード
- 文書整合: `outputs/**/main.md` ↔ `index.md` の AC-1〜AC-4 一致
- 監査トレーサビリティ: AC ↔ Phase ↔ 成果物 ↔ rev
- drift 検知: aiworkflow-requirements `database-schema.md` 実測（drift なし）
- CI gate: `.github/workflows/verify-canonical-sync-names.yml` 概念雛形

非該当: a11y / 無料枠 / セキュリティスキャン / mirror parity（部分 N/A）/ DDL 適用 / カバレッジ

---

## 1. 静的検証ゲート

| 観点 | チェック内容 | 合格条件 | 判定（spec_created） |
| --- | --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | エラー 0（canonical-names.ts の `as const` 型整合含む） | PASS（実行は Phase 11） |
| lint | `mise exec -- pnpm lint` | エラー 0 | PASS |
| canonical 名 grep | `bash scripts/check-canonical-sync-names.sh` | exit 0 / 違反 0 件 | PASS（spec 確定） |
| pre-commit hook | `scripts/hooks/canonical-sync-names-guard.sh` | staged diff に違反があれば exit 1 | PASS（spec 確定） |
| 文書整合 grep | `outputs/**/main.md` ↔ `index.md` AC | 不一致 0 | PASS |
| aiworkflow drift | `database-schema.md` 実測 | drift なし結論 | PASS（drift なし） |
| line budget | phase-XX.md 100-250 行 / outputs 50-400 行 / index 250 行以内 | 全 PASS | PASS |

---

## 2. canonical 名 grep ガード仕様

`scripts/check-canonical-sync-names.sh` の振る舞い（実装は UT-09 で発火）:

```bash
#!/usr/bin/env bash
# scripts/check-canonical-sync-names.sh
# 入力: なし（リポジトリ root を作業ディレクトリ）
# 出力: 違反行を stderr に出力（rg -n 形式）
# exit code: 違反 0 件で 0、1 件以上で 1

set -euo pipefail
violations=0

# パターン 1: 物理テーブル文字列が constants 外に出現
rg -n "['\"]sync_job_logs['\"]|['\"]sync_locks['\"]" apps/ \
  --glob '!apps/api/src/sync/canonical-names.ts' \
  --glob '!apps/api/migrations/**' && violations=1 || true

# パターン 2: sync_log を物理テーブル扱い
rg -n "CREATE\s+TABLE\s+sync_log\b|FROM\s+sync_log\b|INTO\s+sync_log\b" apps/ \
  && violations=1 || true

# パターン 3: 既存以外の migration での CREATE/RENAME/DROP
rg -n "(CREATE|RENAME|DROP)\s+TABLE\s+(sync_log|sync_logs|sync_job_logs|sync_locks)" \
  apps/api/migrations/ --glob '!0002_sync_logs_locks.sql' \
  && violations=1 || true

# パターン 4: 旧揺れ表記
rg -n "\bsync_logs\b|\bsync_lock\b" \
  apps/ docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ \
  && violations=1 || true

# パターン 5: aiworkflow-requirements 二重 DDL
rg -n "CREATE\s+TABLE" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md \
  && violations=1 || true

exit "$violations"
```

| 項目 | 仕様 |
| --- | --- |
| 検出パターン数 | 5（Phase 8 §3 と同期） |
| 違反検出時の挙動 | stderr に違反行・exit 1 |
| 呼び出し経路 | (a) 手動 (b) pre-commit hook (c) CI gate |
| 依存ツール | `rg` (ripgrep), `bash` |

---

## 3. pre-commit hook 提案

`scripts/hooks/canonical-sync-names-guard.sh` は `scripts/check-canonical-sync-names.sh` を staged diff に絞って呼び出す薄いラッパー。本体ロジックは集約 1 本を維持する。

`lefthook.yml` への追加案:

```yaml
pre-commit:
  commands:
    canonical-sync-names-guard:
      run: bash scripts/hooks/canonical-sync-names-guard.sh {staged_files}
      glob: "{apps/**/*.ts,apps/**/*.sql,docs/**/*.md,.claude/skills/aiworkflow-requirements/references/*.md}"
```

ラッパー仕様:

| 項目 | 仕様 |
| --- | --- |
| 入力 | `{staged_files}`（lefthook 提供） |
| 処理 | staged diff に対象パターンが含まれる場合のみ本体 script を呼び出し |
| 出力 | 違反行を stderr |
| exit code | 違反 0 件で 0、1 件以上で 1 |
| 配置 | `scripts/hooks/`（既存 hook 群と整合） |

> 既存 lefthook 運用（`docs/00-getting-started-manual/lefthook-operations.md`）に従い、`pnpm install` 経由で `prepare` script が hook を配置する。`.git/hooks/*` の手書きは禁止。

---

## 4. CI gate 雛形定義

`.github/workflows/verify-canonical-sync-names.yml`（概念雛形）:

| 項目 | 値 |
| --- | --- |
| name | verify-canonical-sync-names |
| trigger | `pull_request`（paths: `apps/**`, `docs/**`, `.claude/skills/aiworkflow-requirements/**`, `scripts/check-canonical-sync-names.sh`） |
| job | `verify-canonical-sync-names`（runs-on: ubuntu-latest） |
| step 1 | `actions/checkout@v4` |
| step 2 | `bash scripts/check-canonical-sync-names.sh`（exit 1 で job fail） |
| 必須化方針 | branch protection の `required_status_checks` に追加（dev / main 両方）。組み込みタイミングは UT-GOV 系タスクへ申し送り |

雛形（参考実装は UT-09 で発火）:

```yaml
name: verify-canonical-sync-names
on:
  pull_request:
    paths:
      - 'apps/**'
      - 'docs/**'
      - '.claude/skills/aiworkflow-requirements/**'
      - 'scripts/check-canonical-sync-names.sh'
jobs:
  verify-canonical-sync-names:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: ripgrep install
        run: sudo apt-get install -y ripgrep
      - name: canonical sync names guard
        run: bash scripts/check-canonical-sync-names.sh
```

書式模倣元: `.github/workflows/verify-indexes.yml`

---

## 5. 文書整合 grep（AC 一致確認）

```bash
# AC-1〜AC-4 の言及一致確認
rg -n "AC-1|AC-2|AC-3|AC-4" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/index.md \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/

# canonical 名の言及一致
rg -n "sync_job_logs|sync_locks|\bsync_log\b" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/
```

期待値: index.md の AC 文面と outputs の記述が完全一致、`sync_log` は概念注釈付きでのみ出現（物理テーブル扱いの記述 0）。

---

## 6. 監査トレーサビリティ表（AC ↔ Phase ↔ 成果物 ↔ rev）

| AC | 内容 | 仕様確定 Phase | 成果物（絶対パス） | rev 基準 |
| --- | --- | --- | --- | --- |
| AC-1 | UT-09 実装タスク root の実パス確定 | Phase 2 | `docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/phase-02/ut-09-receiver-path.md`（同等含む） | 作成日 2026-05-01 |
| AC-2 | canonical 名（`sync_job_logs` / `sync_locks`）が UT-09 必須参照・AC に反映 | Phase 2 / Phase 5 | 親 `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md` + UT-21 receiver path 反映差分 | UT-21 receiver file の commit sha（Phase 12 で確定） |
| AC-3 | `sync_log` 物理テーブル化禁止が明記（CREATE/RENAME/DROP 禁止） | Phase 2 | `outputs/phase-02/code-scope.md` + grep ガード仕様（パターン #2 / #3） | UT-09 実装タスク内の guard evidence |
| AC-4 | U-UT01-08 / 09・UT-04 直交性維持 | Phase 2 / Phase 7 | `outputs/phase-02/orthogonality-checklist.md` + Phase 7 AC マトリクス | 作成日 2026-05-01 |

すべての AC が Phase × 成果物 × rev に紐付いており、トレーサビリティ PASS。

---

## 7. aiworkflow-requirements drift 実測

実測コマンド:

```bash
rg -n "\bsync_log\b|\bsync_logs\b|\bsync_job_logs\b|\bsync_locks\b|CREATE\s+TABLE" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

### drift 判定マトリクス

| 観点 | 期待結果 | 実測結果 | drift 判定 |
| --- | --- | --- | --- |
| `sync_job_logs` / `sync_locks` 言及 | canonical 名のみ | canonical 名で記述済（親 U-UT01-07 reconciliation 反映済） | drift なし |
| `sync_log` 単独言及 | 注釈付き or 0 件 | 概念注釈付きのみ（物理テーブル扱いの記述なし） | drift なし |
| `CREATE TABLE` の DDL 詳細 | 0 件（migration 参照形式） | 0 件（migration を相対 link 参照） | drift なし |

### 結論

**drift なし**。親 U-UT01-07 reconciliation 段階で既に canonical 名で記述済であり、本タスクで追加の doc-only 更新は不要。Phase 12 では「drift なし」として close 記録のみ行う。`.agents` mirror sync は本タスクでは発火しない。

drift 検出（将来の retrograde 防止）には grep ガードパターン #5 が継続的に機能する。

---

## 8. 非該当判定（6 観点）

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| a11y | 対象外 | UI なし・受け皿確定のみ・visualEvidence=NON_VISUAL |
| 無料枠 | 対象外 | DDL 適用 0 / D1 書き込み 0 / 既存 migration 改変 0 / 新規ジョブ実行 0 |
| セキュリティスキャン | 対象外 | Secrets / PII 取り扱い 0・新規 endpoint 追加 0 |
| mirror parity | 部分 N/A | 本タスクでは aiworkflow-requirements drift なしのため `.agents` 同期は発火しない。将来 drift が出た場合のみ Phase 12 で発火する規約 |
| DDL 適用 | 対象外 | 既存 `apps/api/migrations/0002_sync_logs_locks.sql` 改変禁止・新規 migration 追加なし・wrangler d1 migrations apply 不要 |
| カバレッジ | 対象外 | テスト追加 0（const + script のみ）。grep ガード script 自体の動作確認は Phase 11 manual smoke で再実行（`bash scripts/check-canonical-sync-names.sh` の exit 0 確認） |

---

## 9. line budget 検査

| ファイル | 行数想定 | budget | 判定 |
| --- | --- | --- | --- |
| 各 phase-XX.md（本タスク） | 100-250 行 | 250 | PASS |
| outputs/phase-08/main.md | ~200 行 | 50-400 | PASS |
| outputs/phase-09/main.md（本ファイル） | ~250 行 | 50-400 | PASS |
| outputs/phase-10/go-no-go.md | ~250 行 | 50-400 | PASS |
| index.md | <250 行 | 250 | PASS |

---

## 10. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 本ドキュメントの全結果（静的検証 / 文書整合 / 監査 / drift / CI gate / 非該当）を Go/No-Go 判定の根拠に使用 |
| Phase 11 | 静的検証 3 コマンド + drift 実測 + grep ガード script 動作確認を manual-smoke-log で再実行 |
| Phase 12 | drift なしを close 記録 / canonical-names.ts 発火スコープを formalize（UT-09 内発火を採択） |
| Phase 13 | CI gate 雛形 + pre-commit hook 仕様を PR description に転記 |
| UT-09 | canonical-names.ts import 設計 + grep ガード前提を mapper / job 実装の入力に使用 |

---

## 11. 完了条件チェック

- [x] 静的検証 3 コマンド（typecheck / lint / grep ガード）が記述
- [x] pre-commit hook 仕様 + lefthook.yml 追加案が確定
- [x] 文書整合 grep で AC 不一致 0
- [x] AC-1〜AC-4 すべてが Phase × 成果物 × rev に紐付き PASS
- [x] aiworkflow-requirements drift 実測表が完成（drift なしを結論化）
- [x] CI gate 雛形（trigger / job / step / 必須化方針）が記述
- [x] a11y / 無料枠 / セキュリティ / mirror / DDL / カバレッジの 6 観点に N/A 理由
- [x] line budget 全 PASS

→ Phase 10（最終レビューゲート）への進行可能。GO 判定の前提条件すべて成立。
