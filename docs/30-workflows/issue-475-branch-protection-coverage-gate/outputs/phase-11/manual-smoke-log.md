# Phase 11 Manual Smoke Log

実行日時: 2026-05-05
実行者: 本タスク自動実行（read-only fresh GET）
ステータス: `runtime_evidence_collected`

## 実行コマンドと結果

### 1) fresh GET（main / dev）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-11/main-protection-after-full.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/dev-protection-after-full.json
```

→ 両ファイル正常取得。

### 2) contexts 確認

```bash
$ jq '.required_status_checks.contexts' outputs/phase-11/main-protection-after-full.json
["ci", "Validate Build", "coverage-gate"]

$ jq '.required_status_checks.contexts' outputs/phase-11/dev-protection-after-full.json
["ci", "Validate Build", "coverage-gate"]
```

→ DoD #1 / #2 充足。

### 3) baseline 取り込み（2026-05-01 evidence）

```bash
# baseline は task-utgov001-references-reflect-001 の Phase 13 evidence から
# normalized projection で phase-1/{main,dev}-protection-baseline.json に配置
```

→ 2026-05-01 baseline = `[ci, Validate Build]`（coverage-gate 含まず）を確認。

### 4) drift / invariant / contexts-preserved

```bash
# drift diff
diff -u phase-1/${b}-protection-baseline.json phase-11/${b}-protection-after-normalized.json

# invariant（contexts 除外）
diff -u <(jq -S 'del(.contexts)' phase-1/${b}-...baseline.json) \
        <(jq -S 'del(.contexts)' phase-11/${b}-...normalized.json)

# contexts preserved
jq '$before - $after' で missing=[]、`$after - $before` で added=["coverage-gate"]
```

結果:
- main: contexts に coverage-gate 1件追加のみ、non-target fields 完全一致
- dev: contexts に coverage-gate 1件追加 + out-of-scope の rpr drift（baseline → null、solo policy 方向、本タスク責務外）

### 5) ssot diff

```bash
git diff .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md \
  | tee outputs/phase-11/ssot-diff.log
```

→ SSOT current applied 表に `coverage-gate` 反映、変更履歴 v1.4.2 追加。

## 観測されなかった項目（Gate B 後に持ち越し）

- 実 throwaway PR による `gh pr view --json mergeable,mergeStateStatus` の `BLOCKED` 観測

## エラー / 例外

なし。すべての fresh GET は HTTP 200 / valid JSON で成功。
