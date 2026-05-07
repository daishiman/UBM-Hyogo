# Phase 3: command dry-run と production guard 確認 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 3 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution） |
| user_approval_required | false |

## 目的

`scripts/capture-profile-evidence.sh` の help 出力と production guard を **実 staging / production に到達する前に** 確認し、想定外 URL が指定された場合に exit 3 で reject されることを確認する。Playwright spec も `--list` で test ケース構造を確認する。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 1 確定の target、Phase 2 確定の `--out-dir`、`scripts/capture-profile-evidence.sh`、`apps/web/playwright/tests/profile-readonly.spec.ts` |
| 出力 | `outputs/phase-03/main.md`（dry-run log + guard 動作確認結果） |
| 副作用 | local 上での bash / playwright の dry 実行のみ。staging への HTTP アクセスは無し |

## 実行手順

### 3.1 wrapper help 確認

```bash
bash /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260504-191418-wt-2/scripts/capture-profile-evidence.sh --help
```

期待出力:
- exit 0
- `--base-url` / `--storage-state` / `--out-dir` / `--project` / `--markers` の usage が表示

### 3.2 wrapper 構文チェック

```bash
bash -n scripts/capture-profile-evidence.sh
```

期待: exit 0（syntax error 0）

### 3.3 production guard 確認（**実行可能な reject ケース**）

production URL を渡しても exit 3 で reject されることを実測する。**実 production にはアクセスしない**（guard が事前に reject する）。

```bash
# 例: production 候補 URL（実在する必要は無い。guard が pattern match で reject する）
bash scripts/capture-profile-evidence.sh \
  --base-url https://ubm-hyogo.example \
  --storage-state /tmp/dummy-state.json \
  --out-dir /tmp/dummy-out \
  --markers M-08 || echo "REJECTED with exit code: $?"
```

期待:
- stderr に `Refusing non-local/non-staging base URL: https://ubm-hyogo.example`
- stderr に `Production evidence requires a separate user approval gate.`
- exit code 3

許容 URL pattern（wrapper 実装の確認）:
- `http://localhost:*`
- `http://127.0.0.1:*`
- `https://staging.*`
- `*.pages.dev` を含む URL

それ以外は exit 3。production URL を本仕様書本文に書く場合は必ず「**禁止 / ガード対象**」と明記する。

### 3.4 storageState 不在ガード確認

```bash
bash scripts/capture-profile-evidence.sh \
  --base-url http://localhost:3000 \
  --storage-state /tmp/does-not-exist.json \
  --out-dir /tmp/dummy-out || echo "REJECTED with exit code: $?"
```

期待: exit 4 + `storageState file not found: /tmp/does-not-exist.json`

### 3.5 Playwright spec --list（test ケース構造の事前確認）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --list \
  playwright/tests/profile-readonly.spec.ts
```

期待:
- exit 0
- M-08 desktop / M-08 mobile / M-09 desktop / M-09 mobile / M-10 desktop / M-10 mobile / M-16 の合計 7 ケース以上が列挙される

### 3.6 mise + pnpm 整合性確認

```bash
mise exec -- node -v   # v24.15.0
mise exec -- pnpm -v   # 10.33.2
```

## 完了条件チェックリスト

- [ ] `--help` 表示が確認できた
- [ ] `bash -n` で syntax error 0
- [ ] production URL が exit 3 で reject された（実測ログを `outputs/phase-03/main.md` に貼る）
- [ ] 不在 storageState で exit 4 が返った
- [ ] `playwright test --list` で M-08〜M-10 / M-16 の test ケースが揃って列挙された
- [ ] Node / pnpm バージョンが期待値（24.15.0 / 10.33.2）

## 失敗時の対応

| 失敗パターン | 対応 |
| --- | --- |
| `--help` が exit ≠ 0 | wrapper を read-only で確認。改修は本タスクの scope 外（先行タスクで起票） |
| production URL が reject されない | **即停止**。先行タスクの guard 実装を確認し直し本タスクは中断 |
| `playwright --list` で 0 ケース | spec ファイル path を確認。`apps/web/playwright/tests/profile-readonly.spec.ts` の存在を `ls` |
| Node version 不一致 | `mise install` を実行して `mise exec --` 経由で再試行 |

## 次 Phase への引き渡し

Phase 4 へ「dry-run PASS / guard 動作確認済み」のメタ情報を引き渡す。Phase 4 は実行条件（viewport / project / timeout）を確定する。
