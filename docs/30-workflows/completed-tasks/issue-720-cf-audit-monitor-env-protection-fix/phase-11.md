# Phase 11: NON_VISUAL evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | NON_VISUAL evidence |
| 前 Phase | 10 (リファクタ) |
| 次 Phase | 12 (正本同期) |
| 状態 | runtime_pending |
| タスク種別 | NON_VISUAL |

## 目的

本タスクは UI 変更を伴わないため visual diff / Playwright smoke の代わりに、以下の runtime evidence を NON_VISUAL evidence として収集する。

1. workflow_dispatch dry_run の success run URL
2. hourly schedule 6 連続 success の run URL リスト
3. heartbeat variable (`CF_AUDIT_LAST_SUCCESS_AT`) の更新確認

## evidence 出力構造

```
outputs/phase-11/
├── visual-verification-skip.md        # NON_VISUAL 宣言
├── inventory-before.md                # Step 0 で取った secret/var inventory
├── workflow-dispatch-dryrun.md        # dry_run evidence
├── workflow-dispatch-dryrun.json      # gh run view JSON
└── runtime-evidence/
    ├── 6h-success.md                  # 6 連続 success の人間可読サマリ
    ├── hourly-runs.json               # gh run list の生 JSON
    └── heartbeat-after.txt            # CF_AUDIT_LAST_SUCCESS_AT 値
```

## 1. visual-verification-skip.md

```markdown
# Visual verification skip declaration

本タスク (issue-720-cf-audit-monitor-env-protection-fix) は UI 変更を伴わない
GitHub Actions workflow yaml 1 行削除 + secrets / vars 複製のみのタスク。
よって Playwright visual smoke / screenshot diff は対象外。

NON_VISUAL evidence として:
- workflow_dispatch dry_run success
- hourly schedule 6 連続 success
- heartbeat variable 更新確認

を `outputs/phase-11/runtime-evidence/` 配下に保存する。
```

## 2. inventory-before.md

Step 0 で取得した内容を整形して記録:

- repo-level secrets 一覧 (before)
- production env secrets 一覧 (before)
- repo-level variables 一覧 (before)
- production env variables 一覧 (before)
- workflow yaml L36-L42 抜粋
- 直近 10 hourly runs の conclusion 一覧 (failure を確認)

## 3. workflow-dispatch-dryrun.md

```markdown
# workflow_dispatch dry_run evidence

## 実行コマンド

\`\`\`bash
gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev
\`\`\`

## 結果

| 項目 | 値 |
| --- | --- |
| run ID | (numeric) |
| run URL | https://github.com/daishiman/UBM-Hyogo/actions/runs/<id> |
| conclusion | success |
| createdAt | (ISO timestamp) |
| trigger | workflow_dispatch (dry_run=true) |

## job step 結果

| step | conclusion |
| --- | --- |
| Compute window | success |
| Fetch audit logs into D1 | success |
| Analyze and alert | success (dry_run) |
| Build hourly snapshot | success |
| Secret leakage grep | success |
| Evaluate fallback rate notification | success (dry_run) |
| Upload hourly artifact | success |
| Update success heartbeat | success |
```

## 4. runtime-evidence/6h-success.md

```markdown
# Hourly 6 連続 success evidence

## 観察ウィンドウ

- 開始: (ISO timestamp, T9 dry_run 完了直後)
- 終了: 開始 + 6h+
- ブランチ: dev
- trigger: schedule (cron '5 * * * *')

## 連続 6 run 一覧

| # | run ID | createdAt | conclusion | run URL |
| --- | --- | --- | --- | --- |
| 1 | ... | ... | success | ... |
| 2 | ... | ... | success | ... |
| 3 | ... | ... | success | ... |
| 4 | ... | ... | success | ... |
| 5 | ... | ... | success | ... |
| 6 | ... | ... | success | ... |

## 連続性検証

- run 間隔: いずれも 55〜65 分以内
- skip / cancel / failure: なし
- heartbeat variable `CF_AUDIT_LAST_SUCCESS_AT`: 最終 run 完了時刻に近い epoch 秒

## 取得コマンド

\`\`\`bash
gh run list --workflow=cf-audit-log-monitor.yml --branch dev --event schedule --limit 10 \
  --json databaseId,conclusion,createdAt,htmlUrl,event \
  > outputs/phase-11/runtime-evidence/hourly-runs.json
\`\`\`
```

## 5. heartbeat-after.txt

```
CF_AUDIT_LAST_SUCCESS_AT=<epoch seconds>
取得日時: <ISO timestamp>
最終 run との差分: <秒数 (期待: 数分以内)>
```

## evidence の不変条件

1. すべての run URL は `https://github.com/daishiman/UBM-Hyogo/actions/runs/` で始まる実在 URL
2. `conclusion: success` の判定は `gh run view --json conclusion` の戻り値を直接記録（人間記述に依存しない）
3. wallclock 6 時間以上が経過するまで「6 連続 success」を確定しない
4. 6 連続中に 1 件でも fail / cancel が出た場合は再度 6 時間観察を行う

## 完了条件

- [ ] `outputs/phase-11/visual-verification-skip.md` 作成
- [ ] `outputs/phase-11/inventory-before.md` 作成
- [ ] `outputs/phase-11/workflow-dispatch-dryrun.md` 作成 + JSON
- [ ] `outputs/phase-11/runtime-evidence/6h-success.md` 作成 + JSON
- [ ] `outputs/phase-11/runtime-evidence/heartbeat-after.txt` 作成

## 次 Phase

- 次: 12 (正本同期)
- 引き継ぎ事項: Phase 11 evidence を Phase 12 main.md / implementation-guide.md から参照
