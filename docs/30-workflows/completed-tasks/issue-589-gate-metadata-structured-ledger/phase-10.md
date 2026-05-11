# Phase 10: 最終レビュー / Issue #549 Backfill 検証 / Phase 12 Compliance Template 反映確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| Source | `outputs/phase-10/phase-10.md` |
| 区分 | レビュー（実装変更なし。差し戻しのみ） |
| 想定所要 | 0.25 人日 |

## 目的

Phase 5-9 完了後に、(a) Issue #549 artifacts.json `gates[]` 構造の正しさ、(b) validator が #549 backfill に対し green、(c) Phase 12 compliance template 更新の整合、(d) AC-1..AC-7 全達成、(e) DoD 全項目達成、を最終確認し、Phase 11 NON_VISUAL evidence 収集の GO 判定を出す。

## 実行タスク

### 10.1 Issue #549 backfill 構造確認

```bash
jq '.metadata.gates' docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json
# 期待: 4 entries (Gate-A passed / Gate-B pending / Gate-C pending / Gate-D waived)
```

確認項目:
- [ ] 4 entries 存在
- [ ] gate_id が `Gate-A` ... `Gate-D`
- [ ] Gate-A の `evidence_path` が存在するファイル
- [ ] Gate-A の `passed_at` が ISO8601
- [ ] Gate-D の `status` が `waived`、`passed_at` が null
- [ ] mirror（outputs/artifacts.json）と byte-identical

### 10.2 validator green 確認

```bash
mise exec -- pnpm gate-metadata:validate
# 期待: exit 0、Issue #549 artifacts.json 2 件で OK 出力
```

### 10.3 Phase 12 compliance template 反映確認

```bash
grep -n 'gate-metadata' .claude/skills/task-specification-creator/references/phase12-checklist-definition.md
# 期待: 「gate-metadata validator green」項目が記述されている
```

### 10.4 AC-1..AC-7 全達成確認表

| AC | 達成根拠 |
| --- | --- |
| AC-1 | TC-1..TC-6, TC-11, TC-12 GREEN（Phase 5 / 9） |
| AC-2 | TC-7 GREEN |
| AC-3 | TC-8, TC-9, TC-10 GREEN |
| AC-4 | TC-13, TC-14, TC-19 GREEN |
| AC-5 | TC-15, TC-16, TC-17 GREEN |
| AC-6 | `.github/workflows/verify-gate-metadata.yml` actionlint clean + paths 設計通り（Phase 8） |
| AC-7 | Issue #549 artifacts.json + outputs/artifacts.json に gates[] 4 件 backfill + validator exit 0（Phase 6 / 10） |

### 10.5 DoD（spec_created + 後続 implementation wave）全項目達成確認

- index.md「完了条件（DoD: spec_created close-out）」5 項目
- index.md「完了条件（DoD: 後続 implementation wave）」7 項目

それぞれを Phase 10 で再確認しチェック化。

### 10.6 Phase 11 GO 判定

- GO 条件: §10.1 ... §10.5 すべて達成。
- NO-GO 条件: AC のいずれかが green でない / DoD 未達 / Phase 12 template 反映漏れ。

## 変更対象ファイル

レビューのみ。差し戻し時のみ前 Phase ファイルへ最小修正。

## 入出力・副作用

- 入力: Phase 5-9 全成果物 + Phase 12 template 更新（実装は Phase 12 で行うが本 Phase で整合確認）。
- 出力: `outputs/phase-10/phase-10.md`（チェック表 + AC 表 + GO 判定根拠）。
- 副作用: なし。

## テスト方針

新規テスト追加なし。Phase 5 / Phase 9 の green を維持。

## ローカル実行・検証コマンド

```bash
jq '.metadata.gates' docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json
mise exec -- pnpm gate-metadata:validate
grep -n 'gate-metadata' .claude/skills/task-specification-creator/references/phase12-checklist-definition.md
diff -q docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json \
        docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/artifacts.json
```

## 統合テスト連携

- Phase 11 は本 Phase の AC 達成根拠を NON_VISUAL evidence に転記する。
- Phase 12 は本 Phase で確認した template 反映を strict 7 outputs に組み込む。

## 多角的チェック観点（AIが判断）

- **template 更新の前後関係**: §10.3 の grep が hit するためには Phase 12 で template 編集が完了している必要がある。本 Phase は Phase 12 編集後に最終確認として再実行することを許容。
- **AC vs TC 完全マッピング**: AC-6 / AC-7 は vitest 外で検証されるため Phase 8 / Phase 6 の成果物との紐付けを明示。

## サブタスク管理

- ST-1: §10.1 #549 構造確認
- ST-2: §10.2 validator green 確認
- ST-3: §10.3 Phase 12 template 反映確認
- ST-4: §10.4 AC-1..AC-7 表化
- ST-5: §10.5 DoD 全項目チェック
- ST-6: §10.6 Phase 11 GO 判定

## 成果物

- `outputs/phase-10/phase-10.md`（チェック表 + AC 表 + DoD チェック + GO 判定）。

## 完了条件（DoD）

- [ ] §10.1 #549 backfill 6 項目すべて確認済み。
- [ ] §10.2 validator exit 0。
- [ ] §10.3 Phase 12 template に `gate-metadata` 記述あり。
- [ ] §10.4 AC-1..AC-7 全達成根拠が表化されている。
- [ ] §10.5 DoD 12 項目（5+7）すべて達成。
- [ ] §10.6 Phase 11 GO 判定根拠記録済み。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-6 すべて完了
- [ ] `outputs/phase-10/phase-10.md` 生成済み
- [ ] Phase 11 着手 GO 判定済み

## 次Phase

[Phase 11: NON_VISUAL Evidence 収集](phase-11.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
- Phase 1 / Phase 2 / Phase 5 outputs and decisions
