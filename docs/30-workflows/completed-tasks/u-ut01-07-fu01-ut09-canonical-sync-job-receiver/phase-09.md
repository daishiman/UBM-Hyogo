# Phase 9: 品質保証（静的検証 + 文書整合 + CI gate）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver (U-UT01-07-FU01) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビューゲート) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| sourceIssue | #333 (CLOSED) |

## 目的

本タスクは UT-09 受け皿確定 + canonical-names const + grep ガード script の追加を含む **implementation** であるため、Phase 9 の品質ゲートは「静的検証 + 文書整合 + 監査トレーサビリティ + drift 検知 + CI gate」の 5 軸で実施する。
具体的には以下を検証し、Phase 10 の Go/No-Go 判定の根拠を揃える。

1. 静的検証: typecheck / lint / canonical 名 grep ガード（pre-commit hook）
2. 文書整合: `outputs/**/main.md` と `index.md` AC の一致 grep
3. 監査トレーサビリティ: AC ↔ Phase ↔ 成果物の rev 表
4. drift 検知: aiworkflow-requirements との同期確認
5. CI gate: `.github/workflows/verify-canonical-sync-names.yml` の概念雛形定義

a11y / 無料枠 / DDL 適用 / カバレッジは本タスクの性質上 **対象外**（UI なし・DDL 0・追加テスト 0 を spec_created 段階で前提）と明記する。

## 実行タスク

1. 静的検証コマンド確定: `pnpm typecheck` / `pnpm lint` / `bash scripts/check-canonical-sync-names.sh` の 3 コマンドを Phase 11 manual-smoke-log で再実行可能な形式で記述する（完了条件: 3 コマンドすべて記述）。
2. pre-commit hook 提案: `scripts/hooks/canonical-sync-names-guard.sh` の入力 / 出力 / exit code 仕様を記述し、`lefthook.yml` への組み込み案を提示する（完了条件: hook 仕様確定）。
3. 文書整合 grep: `outputs/**/main.md` と `index.md` の AC-1〜AC-4 言及が一致しているか rg で確認する（完了条件: 不一致 0）。
4. 監査トレーサビリティ表: AC-1〜AC-4 × Phase 1〜7 × 成果物 × rev（git sha もしくは作成日）を表化する（完了条件: 全 AC が成果物に紐付く）。
5. aiworkflow-requirements drift 実測: `.claude/skills/aiworkflow-requirements/references/database-schema.md` 内の `sync_log` / `sync_job_logs` / `sync_locks` 言及・DDL を rg で実測し drift 表を作成する（完了条件: drift 表完成）。
6. CI gate 雛形定義: `.github/workflows/verify-canonical-sync-names.yml`（概念雛形）の trigger / job / step を仕様として記述する（完了条件: 雛形 1 ファイル分の記述）。
7. 非該当判定明記: a11y / 無料枠 / セキュリティスキャン / mirror parity / DDL 適用 / カバレッジに N/A 理由を記述する（完了条件: 6 観点に理由）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/phase-02/ | 単一正本群 |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/index.md | AC-1〜AC-4 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/ | 親タスクの SSOT |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | 必須参照反映先 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理 canonical の正本（Read のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 実測対象 |
| 必須 | lefthook.yml | hook 組み込み先 |
| 参考 | .github/workflows/verify-indexes.yml | CI gate 書式模倣元 |
| 参考 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/phase-09.md | 書式模倣元 |

## 静的検証ゲート

| 観点 | チェック内容 | 合格条件 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | エラー 0（canonical-names.ts の型整合含む） |
| lint | `mise exec -- pnpm lint` | エラー 0 |
| canonical 名 grep | `bash scripts/check-canonical-sync-names.sh` | exit 0 / 違反 0 件 |
| pre-commit hook | `scripts/hooks/canonical-sync-names-guard.sh` | staged diff に違反があれば exit 1 |
| 文書整合 grep | `outputs/**/main.md` ↔ `index.md` AC | 不一致 0 |
| aiworkflow drift | `database-schema.md` 実測 | drift 表完成（drift あり / なしを結論化） |
| line budget | phase-XX.md 100-250 行 / outputs 50-400 行 / index 250 行以内 | 全 PASS |

## canonical 名 grep ガード仕様

```bash
# scripts/check-canonical-sync-names.sh の振る舞い（仕様）
# 入力: なし（リポジトリ root を対象）
# 出力: 違反行を stderr に出力
# exit code: 違反 0 件で 0、1 件以上で 1

# 検出パターン（Phase 8 表と同期）
# 1. 物理テーブル文字列が constants 外に出現
rg -n "['\"]sync_job_logs['\"]|['\"]sync_locks['\"]" apps/ \
  --glob '!apps/api/src/sync/canonical-names.ts' \
  --glob '!apps/api/migrations/**'

# 2. sync_log を物理テーブル扱い
rg -n "CREATE\s+TABLE\s+sync_log\b|FROM\s+sync_log\b|INTO\s+sync_log\b" apps/

# 3. 既存以外の migration での CREATE/RENAME/DROP
rg -n "(CREATE|RENAME|DROP)\s+TABLE\s+(sync_log|sync_logs|sync_job_logs|sync_locks)" \
  apps/api/migrations/ --glob '!0002_sync_logs_locks.sql'

# 4. 旧揺れ表記
rg -n "\bsync_logs\b|\bsync_lock\b" apps/ docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/

# 5. aiworkflow-requirements 二重 DDL
rg -n "CREATE\s+TABLE" .claude/skills/aiworkflow-requirements/references/database-schema.md
```

## pre-commit hook 提案

`lefthook.yml` への追加案:

```yaml
pre-commit:
  commands:
    canonical-sync-names-guard:
      run: bash scripts/hooks/canonical-sync-names-guard.sh {staged_files}
      glob: "{apps/**/*.ts,apps/**/*.sql,docs/**/*.md,.claude/skills/aiworkflow-requirements/references/*.md}"
```

`scripts/hooks/canonical-sync-names-guard.sh` は `scripts/check-canonical-sync-names.sh` を staged diff に絞って呼び出す薄いラッパーとし、本体ロジックは集約 1 本を維持する。

## CI gate 雛形定義

`.github/workflows/verify-canonical-sync-names.yml`（概念雛形）:

| 項目 | 値 |
| --- | --- |
| name | verify-canonical-sync-names |
| trigger | `pull_request`（paths: `apps/**`, `docs/**`, `.claude/skills/aiworkflow-requirements/**`, `scripts/check-canonical-sync-names.sh`） |
| job | `verify-canonical-sync-names` |
| step 1 | `actions/checkout@v4` |
| step 2 | `bash scripts/check-canonical-sync-names.sh`（exit 1 で job fail） |
| 必須化 | branch protection の `required_status_checks` に追加（dev / main） |

## 文書整合 grep 計画

```bash
# AC-1〜AC-4 の言及一致確認
rg -n "AC-1|AC-2|AC-3|AC-4" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/index.md \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/

# canonical 名の言及一致
rg -n "sync_job_logs|sync_locks|sync_log\b" \
  docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/
```

期待値: index.md の AC 文面と outputs の記述が一致、`sync_log` は概念注釈付きでのみ出現。

## 監査トレーサビリティ表（AC ↔ Phase ↔ 成果物 ↔ rev）

| AC | 内容 | 仕様確定 Phase | 成果物 | rev 基準 |
| --- | --- | --- | --- | --- |
| AC-1 | UT-09 実装タスク root の実パス確定 | Phase 2 | `outputs/phase-02/ut-09-receiver-path.md`（または同等） | 作成日 2026-05-01 |
| AC-2 | canonical 名が UT-09 必須参照・AC に反映 | Phase 2 / Phase 5 | `outputs/phase-02/canonical-reference-table.md` + UT-09 receiver path 反映差分 | UT-09 receiver file の commit sha |
| AC-3 | `sync_log` 物理テーブル化禁止が明記 | Phase 2 | `outputs/phase-02/code-scope.md` + grep ガード仕様 | UT-09 実装タスク内の guard evidence |
| AC-4 | U-UT01-08 / 09 / UT-04 直交性維持 | Phase 2 / Phase 7 | `outputs/phase-02/orthogonality-checklist.md` | 作成日 2026-05-01 |

## aiworkflow-requirements drift 実測計画

```bash
rg -n "sync_log\b|sync_logs\b|sync_job_logs\b|sync_locks\b|CREATE\s+TABLE" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

| 観点 | 期待結果 | drift 判定 |
| --- | --- | --- |
| `sync_job_logs` / `sync_locks` 言及 | canonical 名のみ | 旧揺れ検出時 drift あり |
| `sync_log` 単独言及 | 注釈付き or 0 件 | 注釈なし → drift あり |
| `CREATE TABLE` の DDL 詳細 | 0 件（migration 参照形式） | 1 件以上 → drift あり |

drift 検出時は AC-2 / AC-3 充足のため Phase 12 で doc-only 更新案を成果物に含める（mirror sync は `.agents` 側にも反映義務）。

## 非該当判定の明記

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| a11y | 対象外 | UI なし・受け皿確定のみ |
| 無料枠 | 対象外 | DDL 適用 0 / D1 書き込み 0 / 既存 migration 改変 0 |
| セキュリティスキャン | 対象外 | Secrets / PII 取り扱い 0 |
| mirror parity | 部分 N/A | `.claude/skills/aiworkflow-requirements/**` を更新する場合のみ Phase 12 で `.agents` 同期発火 |
| DDL 適用 | 対象外 | 既存 `0002_sync_logs_locks.sql` 改変禁止・新規 migration 追加なし |
| カバレッジ | 対象外 | テスト追加 0（const + script のみ。grep ガード script 自体の動作確認は Phase 11 manual smoke で実施） |

## 実行手順

### ステップ 1: 静的検証コマンド確定
- typecheck / lint / canonical 名 grep の 3 コマンドを記述。

### ステップ 2: pre-commit hook 仕様化
- `scripts/hooks/canonical-sync-names-guard.sh` + `lefthook.yml` 追加案を確定。

### ステップ 3: 文書整合 grep
- AC 文面 + canonical 名の一致確認。

### ステップ 4: 監査トレーサビリティ表作成
- AC-1〜AC-4 × Phase × 成果物 × rev。

### ステップ 5: aiworkflow drift 実測
- rg コマンドで drift 表完成。

### ステップ 6: CI gate 雛形定義
- `.github/workflows/verify-canonical-sync-names.yml` 概念雛形を仕様として記述。

### ステップ 7: 非該当判定明記
- 6 観点に N/A 理由。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 静的検証 + 文書整合 + drift + CI gate の結果を Go/No-Go の判定根拠に使用 |
| Phase 11 | 3 コマンド + drift 実測 + grep ガード script を manual-smoke-log で再実行 |
| Phase 12 | drift 結果を documentation で formalize / mirror sync 発火 |
| Phase 13 | CI gate 雛形を PR description に転記 |
| UT-09 | canonical-names.ts import + grep ガード前提を mapper / job 実装に引き継ぎ |

## 多角的チェック観点

- 価値性: CI gate により UT-09 実装後も canonical 違反が PR レベルで検出可能。
- 実現性: const + script + workflow yaml の最小追加で完結。
- 整合性: 不変条件 #5 を維持し、grep ガードは apps/api 配下を対象に閉じる。
- 運用性: pre-commit hook + CI gate の二重防御で drift を防ぐ。
- 認可境界: 本 Phase は仕様確定のみで権限境界を変更しない。
- 直交性: U-UT01-08 / 09 / UT-04 への侵食 0（grep 検出パターンに enum / retry / DDL 詳細を含めない）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 静的検証コマンド確定 | 9 | spec_created | 3 コマンド |
| 2 | pre-commit hook 提案 | 9 | spec_created | lefthook.yml 追加案 |
| 3 | 文書整合 grep | 9 | spec_created | AC 一致 |
| 4 | 監査トレーサビリティ表 | 9 | spec_created | AC × Phase × 成果物 × rev |
| 5 | aiworkflow drift 実測 | 9 | spec_created | rg 実行 |
| 6 | CI gate 雛形定義 | 9 | spec_created | yaml 概念雛形 |
| 7 | 非該当判定明記 | 9 | spec_created | 6 観点 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質ゲート結果（静的検証 / 文書整合 / 監査 / drift / CI gate / 非該当判定） |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] 静的検証 3 コマンド（typecheck / lint / grep ガード）が記述
- [ ] pre-commit hook 仕様 + lefthook.yml 追加案が確定
- [ ] 文書整合 grep で AC 不一致 0
- [ ] AC-1〜AC-4 すべてが Phase × 成果物 × rev に紐付き PASS
- [ ] aiworkflow-requirements drift 実測表が完成
- [ ] CI gate 雛形（trigger / job / step / 必須化方針）が記述
- [ ] a11y / 無料枠 / セキュリティ / mirror / DDL / カバレッジの 6 観点に N/A 理由
- [ ] outputs/phase-09/main.md が作成済み

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-09/main.md` 配置予定
- 静的検証 / 文書整合 / 監査 / drift / CI gate / 非該当の 6 観点すべてに合否判定
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビューゲート)
- 引き継ぎ事項:
  - 静的検証 3 コマンド全 PASS（または逸脱と是正方針）
  - aiworkflow-requirements drift 実測結果
  - AC-1〜AC-4 全 PASS の確認結果
  - CI gate 雛形 + pre-commit hook 仕様
  - 非該当判定（a11y / 無料枠 / セキュリティ / mirror / DDL / カバレッジ）
- ブロック条件:
  - canonical 名 grep ガードが exit 1
  - AC のいずれかが成果物に紐付かない
  - drift 実測未完了
  - CI gate 雛形が未定義
