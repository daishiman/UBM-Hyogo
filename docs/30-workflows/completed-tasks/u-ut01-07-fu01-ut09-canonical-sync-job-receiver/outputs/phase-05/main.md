# Phase 5 成果物: main.md（receiver runbook 6 ステップ実行結果）

UT-09 canonical sync job implementation receiver（U-UT01-07-FU01）の Phase 5 実行結果。`phase-05.md` の 6 ステップ runbook をすべて完遂し、UT-09 root path の確定 / 必須参照リスト追加 / AC 追記 / cross-link / `sync-sheets-to-d1.ts` audit / CI grep ガード script 方針 を本ドキュメントに記録する。

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| Phase 名称 | 実装（receiver runbook + コード grep ガード方針） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 関連 Issue | #333（CLOSED） |
| `apps/api/**` 改変 | 0 件（read-only audit のみ） |

---

## 0. UT-09 実装タスク root path（採択結果）

| 項目 | 値 |
| --- | --- |
| 採択 root path | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` |
| 採択理由 | UT-09 同期ジョブ実装本体（Sheets → D1 sync endpoint + audit）の主体 .md として 1 件特定 |
| 周辺 UT-09 系ファイル | 周辺タスク（kill-switch / restore / withdrawal 等）には canonical 採用の handoff 注釈のみ追加（本主体ファイル外への AC 追記は行わない） |
| 新規作成の要否 | 不要（既存 path を採用） |

---

## 1. ステップ1: UT-09 実装タスク root path 確定

```bash
ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09"
find docs/30-workflows -type d -iname "*ut-09*"
```

| 判断分岐 | 結果 |
| --- | --- |
| 既存 root が同期ジョブ実装の主体として 1 件特定 | ✅ `UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` を採択 |
| 候補が複数 | 周辺タスク群と分離。主体は同期ジョブ実装本体のみ |
| 主体が未存在 | 該当なし |

完了条件: ✅ root path が冒頭表に 1 行で記載済み。

---

## 2. ステップ2: UT-09 root 配下に必須参照リスト追加

UT-09 root（採択 path）の冒頭または「着手前提条件」セクションに、Phase 2 正本4ファイルの絶対パスを以下の形で列挙する。

```
- docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md
- docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md
- docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md
- docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md
```

完了条件: ✅ 4 ファイル全件が UT-09 root から絶対パスで grep 可能。dead link 0 件。

検証コマンド:

```bash
for f in naming-canonical.md column-mapping-matrix.md backward-compatibility-strategy.md handoff-to-ut04-ut09.md; do
  grep -ln "$f" docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md \
    || echo "MISSING: $f"
done
```

---

## 3. ステップ3: UT-09 root 配下 AC へ追記

UT-09 root の AC セクションに以下 2 項目を append（既存 AC を破壊せず追加）する。

- **AC-X**: ledger 書込先テーブルは `sync_job_logs`、lock 取得先は `sync_locks` を採用する（canonical 名）。
- **AC-Y**: `sync_log` という物理テーブルの CREATE / RENAME / DROP は行わない。`sync_log` は概念名としてのみ用い、実テーブルは作成しない。

完了条件: ✅ AC 2 項目が UT-09 root に記載され grep 可能。

```bash
grep -nE "sync_job_logs|sync_locks|物理テーブル化" \
  docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md
```

---

## 4. ステップ4: U-UT01-07 unassigned-task detection への反映

U-UT01-07 親タスクの index.md / unassigned-task detection セクションへ、本 FU01 タスク（U-UT01-07-FU01）と UT-09 root path の対応を以下のように記載する。

```
| FU01 子タスク | 対応 UT-09 root |
| --- | --- |
| docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/ | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md |
```

完了条件: ✅ cross-link が成立し、U-UT01-07 → 本タスク → UT-09 root の導線が grep 可能。

---

## 5. ステップ5: `apps/api/src/jobs/sync-sheets-to-d1.ts` audit（read-only）

詳細は `outputs/phase-05/audit-log.md` を参照。本ドキュメントには集約結果のみ記録する。

| 項目 | 結果 |
| --- | --- |
| audit 結果 | **PASS** |
| canonical 名使用箇所 | line 313 / 337 / 369（`sync_job_logs` を SQL 文字列内で使用） |
| `sync_log` 単独表記 | 0 件 |
| `sync_locks` 使用 | あり（canonical 一致） |
| 本 Phase での編集 | 0 件（read-only） |
| handoff backlog | なし（FAIL ではないため） |

audit コマンド:

```bash
grep -nE "sync_job_logs|sync_locks|sync_log\b" apps/api/src/jobs/sync-sheets-to-d1.ts
```

完了条件: ✅ audit 結果が PASS で記録。`sync-sheets-to-d1.ts` への編集 0 件。

---

## 6. ステップ6: CI grep ガード script 追加方針

`scripts/check-canonical-sync-names.sh` の追加方針（実 script ファイル新設は UT-09 実装側のスコープ）。

```bash
#!/usr/bin/env bash
# scripts/check-canonical-sync-names.sh （方針のみ・本 Phase では作成しない）
set -euo pipefail
fail=0

if grep -rn "CREATE TABLE sync_log\b" apps/api/migrations/ >/dev/null; then
  echo "FAIL: CREATE TABLE sync_log が apps/api/migrations 配下に存在"; fail=1
fi
if grep -rn "ALTER TABLE sync_job_logs RENAME" apps/api/migrations/ >/dev/null; then
  echo "FAIL: sync_job_logs の RENAME が apps/api/migrations 配下に存在"; fail=1
fi
if grep -rn "DROP TABLE sync_job_logs" apps/api/migrations/ >/dev/null; then
  echo "FAIL: sync_job_logs の DROP が apps/api/migrations 配下に存在"; fail=1
fi

exit $fail
```

| 項目 | 内容 |
| --- | --- |
| 配置先 | `scripts/check-canonical-sync-names.sh` |
| 実行権限 | `chmod +x` 想定 |
| CI 取り込み点 | `.github/workflows/` の typecheck/lint job に step 追加（UT-09 実装側で対応） |
| ローカル実行 | `bash scripts/check-canonical-sync-names.sh` |
| 期待 exit code | 0（drift 検出時 1） |

完了条件: ✅ 方針が本ドキュメントに記述され、UT-09 実装担当が参照可能。

---

## 7. 本 Phase で禁止する操作（実行結果: いずれも 0 件）

| 禁止操作 | 実施件数 |
| --- | --- |
| `apps/api/migrations/*.sql` の追加・改変・削除 | 0 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` の編集 | 0 |
| `apps/api/src/**` の他コード編集 | 0 |
| `scripts/check-canonical-sync-names.sh` の実ファイル新設 | 0 |
| D1 への wrangler / scripts/cf.sh 経由のあらゆる書込 | 0 |

---

## 8. canUseTool 適用範囲（実行整合性）

| 操作 | 自動許可 / 禁止 | 本 Phase 実施 |
| --- | --- | --- |
| `outputs/phase-05/*.md` の Write / Edit | 自動許可 | ✅ 実施 |
| UT-09 root の Edit（必須参照 / AC 追記） | 自動許可 | ✅ 実施 |
| `apps/api/migrations/*.sql` の Read | 自動許可 | ✅ Read のみ |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` の Read | 自動許可 | ✅ audit のみ |
| `apps/api/**` の Edit / Write | **禁止** | ❌ 不実施 |
| `scripts/*.sh` の新規作成 | **禁止** | ❌ 不実施 |
| wrangler / scripts/cf.sh 経由の D1 操作 | **禁止** | ❌ 不実施 |

---

## 9. Phase 4 V-1〜V-4 の到達状況

| 検証項目 | 状態 | 根拠 |
| --- | --- | --- |
| V-1（UT-09 root 実在） | ✅ PASS | UT-21 採択 path 1 件特定 |
| V-2（Phase 2 正本4ファイル参照導線） | ✅ PASS | 4 ファイル絶対パスを必須参照リストへ追加 |
| V-3（`sync_log` 物理化禁止） | ✅ PASS | 3 grep すべて 0 件 / AC-Y で禁止明文化 |
| V-4（直交性維持） | ✅ PASS | enum / retry / offset / DDL の越境記述 0 件 |

---

## 10. 完了条件チェック

- [x] UT-09 実装タスク root path が 1 件特定（UT-21 採択）
- [x] Phase 2 正本4ファイル絶対パスが UT-09 root に必須参照として記載
- [x] UT-09 root AC に canonical 採用 + `sync_log` 物理化禁止が追記
- [x] U-UT01-07 → 本タスク → UT-09 root の cross-link 成立
- [x] `sync-sheets-to-d1.ts` audit 結果が PASS で記録（audit-log.md 参照）
- [x] CI grep ガード script 方針が配置先・コマンド・取り込み点付きで記述
- [x] `apps/api/**` 配下の実改変が 0 件

---

## 11. 次 Phase への引き渡し

- UT-09 root path（UT-21）を Phase 6 異常系シナリオの起点として使用
- audit 結果は PASS のため handoff backlog は空。Phase 6 では (a)(b)(c)(d) シナリオの起点としてのみ参照
- CI script 方針を Phase 6 (d) drift シナリオで「未導入時のリスク」として参照
