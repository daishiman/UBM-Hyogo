# playwright-visual-full — pull_request trigger 自然発火 evidence

| 項目 | 値 |
|------|------|
| 取得日時 | 2026-05-17T12:49:39Z close-out review refresh |
| 対象 workflow | `.github/workflows/playwright-visual-full.yml` |
| trigger | `pull_request` (paths filter removed in this wave) |

## 取得コマンド

```bash
gh run list --workflow=playwright-visual-full.yml --limit 10 \
  --json databaseId,event,headBranch,status,conclusion,createdAt > /tmp/visual-full-runs.json

jq '[.[] | select(.event == "pull_request")]' /tmp/visual-full-runs.json
```

## 期待

PR #760 merge 以降に `event: "pull_request"` の run が 1 件以上存在すること。加えて `.github/workflows/playwright-visual-full.yml` から `pull_request.paths` を削除済みであるため、required 化後の unrelated PR でも check suite が作成される。

## 実取得結果

```json
[
  {
    "databaseId": 25984980417,
    "event": "pull_request",
    "headBranch": "feat/admin-tags-queue-resolver-drawer-mvp-recovery",
    "status": "completed",
    "conclusion": "success",
    "createdAt": "2026-05-17T07:44:50Z"
  },
  {
    "databaseId": 25984292925,
    "event": "pull_request",
    "headBranch": "feat/admin-tags-queue-resolver-drawer-mvp-recovery",
    "status": "completed",
    "conclusion": "success",
    "createdAt": "2026-05-17T07:10:00Z"
  },
  {
    "databaseId": 25982995765,
    "event": "pull_request",
    "headBranch": "task/709-visual-baseline-runtime-capture",
    "status": "completed",
    "conclusion": "success",
    "createdAt": "2026-05-17T06:01:27Z"
  }
]
```

## 結論

- [x] 自然発火 evidence あり
- [x] `pull_request.paths` 削除済み
- [x] required context は実測 `visual-full (desktop|tablet|mobile)` を登録済み
