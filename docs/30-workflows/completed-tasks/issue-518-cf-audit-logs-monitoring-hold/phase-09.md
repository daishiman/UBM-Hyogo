# Phase 9: テスト / 静的検証

`[実装区分: 実装仕様書]`

判定根拠: actionlint / typecheck / lint / 既存テストの PASS が AC-7..AC-9 の達成条件。検証コマンドの厳密化が必要。

---

## 目的

Phase 5-8 の編集後に、`actionlint` / `pnpm typecheck` / `pnpm lint` / 既存 `scripts/cf-audit-log` テストが PASS することを確認する。

## 変更対象ファイル

なし（検証 Phase）。証跡ログを `outputs/phase-09/` に保存。

## 検証コマンド一覧

```bash
TASK_ROOT=docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold

# 1. YAML 静的検証
mkdir -p "$TASK_ROOT/outputs/phase-09"
if command -v actionlint >/dev/null 2>&1; then
  actionlint .github/workflows/cf-audit-log-monitor.yml
else
  go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/cf-audit-log-monitor.yml
fi | tee "$TASK_ROOT/outputs/phase-09/actionlint.log"

# 2. typecheck
mise exec -- pnpm typecheck \
  | tee "$TASK_ROOT/outputs/phase-09/typecheck.log"

# 3. lint
mise exec -- pnpm lint \
  | tee "$TASK_ROOT/outputs/phase-09/lint.log"

# 4. cf-audit-log 既存テスト regression
mise exec -- pnpm vitest run scripts/cf-audit-log \
  | tee "$TASK_ROOT/outputs/phase-09/test-cf-audit-log.log"

# 5. 削除済 watchdog YAML への参照残存チェック
if grep -rn "cf-audit-log-monitor-watchdog" .github/ docs/ scripts/ \
  | grep -v "docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/" \
  | grep -v "docs/30-workflows/runbooks/" \
  | grep -v "docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/" \
  | tee "$TASK_ROOT/outputs/phase-09/watchdog-refs.log"; then
  echo "unexpected watchdog reference remains" >&2
  exit 1
else
  : > "$TASK_ROOT/outputs/phase-09/watchdog-refs.log"
fi
# → 許容外参照が 0 件なら PASS
```

## 期待結果

| 検証 | 期待 |
| --- | --- |
| actionlint | exit 0 / `cf-audit-log-monitor.yml` の lint エラーなし |
| pnpm typecheck | exit 0 |
| pnpm lint | exit 0（既存違反は本タスク責務外。本タスク差分起因の新規違反 0） |
| vitest scripts/cf-audit-log | 全 5 テストファイル PASS（無編集のため regression なし） |
| watchdog 参照 grep | Issue #518 spec / runbook / historical Issue #408 completed workflow 内の記述のみ（実コード・他 workflow からの参照 0） |

## 関数 / シグネチャ

該当なし。

## 入出力 / 副作用

- 出力: `outputs/phase-09/*.log`
- 副作用: なし

## テスト方針

本 Phase 自体が検証 Phase。新規テスト追加なし。

## DoD

- AC-7: typecheck PASS
- AC-7: lint PASS
- AC-8: cf-audit-log 既存テスト PASS
- AC-9: actionlint PASS
- watchdog 参照が他コードに残存しない
- ログ 5 ファイルが `outputs/phase-09/` に保存
