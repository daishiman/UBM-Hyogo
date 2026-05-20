# Phase 11: NON_VISUAL runtime evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| 前 Phase | 10 (リファクタ) |
| 次 Phase | 12 (正本同期) |
| 状態 | runtime_pending |

## 目的

本タスクは UI 差分なし（cf-audit-log-monitor.yml の挙動変化のみ）のため NON_VISUAL 判定。RT-1〜RT-4（Phase 07 定義）を runtime evidence として収集する placeholder と取得手順を配置する。

## NON_VISUAL 判定根拠

`outputs/phase-11/visual-verification-skip.md` に記載:

- `apps/web` / `apps/api` の UI 差分なし
- 変更は workflow runtime configuration のみ
- visual baseline / playwright smoke の影響なし
- → NON_VISUAL

## evidence ファイル一覧

| ファイル | 用途 | 初期状態 |
| --- | --- | --- |
| `outputs/phase-11/visual-verification-skip.md` | NON_VISUAL 判定根拠 | local spec 作成時に確定記述 |
| `outputs/phase-11/workflow-dispatch-dryrun.md` | RT-1 evidence | PENDING_USER_GATE |
| `outputs/phase-11/runtime-evidence/hourly-runs.json` | RT-2 raw 出力 | PENDING_USER_GATE |
| `outputs/phase-11/runtime-evidence/6h-success.md` | RT-2 evidence | PENDING_USER_GATE |
| `outputs/phase-11/runtime-evidence/heartbeat-after.txt` | RT-4 evidence | PENDING_USER_GATE |

## 取得手順

Phase 06 T-04 / T-05 に転記済。本 Phase ではそれを実行する gate を明示するのみ。

```bash
# RT-1
gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev
# → workflow-dispatch-dryrun.md に run URL + conclusion 追記

# RT-2 (6h 後)
gh run list --workflow=cf-audit-log-monitor.yml --branch dev --event schedule --limit 10 \
  --json databaseId,conclusion,createdAt,htmlUrl,event \
  > outputs/phase-11/runtime-evidence/hourly-runs.json
# 6 連続 success を 6h-success.md に記録

# RT-4
gh api repos/daishiman/UBM-Hyogo/actions/variables/CF_AUDIT_LAST_SUCCESS_AT \
  | jq '{name, value, updated_at}' \
  > outputs/phase-11/runtime-evidence/heartbeat-after.txt
```

## fail 判定と evidence 不成立時の対応

Phase 07「fail 時の対応」表に従い、6 連続 success を妨げる事象を切り分け。本タスクスコープ内で再投入や workflow yaml 改変は行わず、別 issue 切り出しを Phase 12 unassigned-task-detection に記録する。

## 完了条件

- [x] placeholder 配置計画記述
- [x] RT-1〜RT-4 取得手順記述
- [ ] **runtime gate**: user 承認後に上記コマンド実行 + evidence ファイル更新（本 Phase は spec 段階で完了とせず `runtime_pending` のまま）

## 次 Phase

- 次: 12 (正本同期)
- ブロック条件: runtime evidence が揃わなくても Phase 12 の local spec 同期は進められる（最終 close-out は Phase 13）
