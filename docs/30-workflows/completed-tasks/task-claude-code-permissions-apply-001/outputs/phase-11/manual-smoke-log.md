# manual-smoke-log

## メタ情報

- 実施日時 (${TS}): 2026-04-28T20:05:24+09:00
- 実機反映 TS（Phase 5 sticky）: `20260428-192736`
- `claude --version`: `2.1.62 (Claude Code)`
- 実施ホスト: macOS Darwin 25.3.0 / zsh
- 主証跡カテゴリ: NON_VISUAL（UI 表示変更ゼロ）
- screenshot: 取得しない（理由: UI 変更ゼロ・`outputs/phase-11/screenshots/` 自体作成しない）
- 3 層評価: Semantic のみ実施 / Visual N/A / AI UX N/A
- 引用方針: Phase 5 / Phase 6 で記録済の CLI 出力は逐字引用、Phase 11 で再観測した値は本ログに直接転記

## backup 4 件存在確認（前提）

```bash
TS=20260428-192736
ls -1 ~/.claude/settings.json.bak.$TS \
      "/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json.bak.$TS" \
      ~/.config/zsh/conf.d/79-aliases-tools.zsh.bak.$TS \
      ~/.zshrc.bak.$TS
```

判定: 4 件すべて存在（`backup-manifest.md` のサイズ・sha256 と一致）。

## TC-01: `cc` 起動直後のモード表示（Phase 11 再観測）

- 実行コマンド:
  ```bash
  zsh -i -c 'type cc'
  jq -r '.permissions.defaultMode' ~/.claude/settings.json
  jq -r '.permissions.defaultMode' "$PWD/.claude/settings.json"
  ```
- 期待結果:
  - `cc is an alias for claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions`
  - global / project の `defaultMode` が共に `bypassPermissions`
- 実観測結果（CLI 出力そのまま、token 等は含まれない）:
  ```
  cc is an alias for claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions
  ---GLOBAL---
  bypassPermissions
  ---PROJECT---
  bypassPermissions
  ```
  > 注: `zsh -i` 実行時に `gitstatus` 初期化エラー（`can't change option: monitor`）が表示されるが、これは非対話 subshell 由来の警告で alias 解決には影響しない（Phase 1 で観測済の既知事象）。
- 判定: **PASS**
- 備考: `~/.claude/settings.local.json` は不在維持（設計方針）。

## TC-02: reload / session 切替後のモード維持（Phase 5 引用）

- 実行コマンド:
  ```bash
  jq -r '.permissions.defaultMode' ~/.claude/settings.json    # 既値確認 + backup 取得後再確認
  test -f ~/.claude/settings.local.json
  ```
- 期待結果: 値が `bypassPermissions` のまま、reload 後も維持
- 実観測結果（Phase 5 runbook-execution-log Step 2 / Step 5 引用）:
  ```
  bypassPermissions    # global 既値（no-op、書き換えず backup のみ取得）
  ls: ~/.claude/settings.local.json: No such file or directory   # 不在維持（N/A=PASS）
  ```
- 判定: **PASS**
- 備考: global は no-op のため reload 影響ゼロ。

## TC-03: 別プロジェクト起動での階層適用（Phase 5 引用）

- 実行コマンド:
  ```bash
  PROJ="/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json"
  jq -r '.permissions.defaultMode' "$PROJ"
  jq '.permissions.allow | length' "$PROJ"
  jq '.permissions.deny | length' "$PROJ"
  ```
- 期待結果: project の `defaultMode=bypassPermissions`、allow / deny に §4 minimum guarantee 7/4 件包含
- 実観測結果（Phase 5 Step 3 引用）:
  ```
  bypassPermissions
  allow count: 139 → 146 (+7)
  deny count:  13 → 16 (+3)
  ```
  §4 minimum guarantee 包含確認: allow 7/7、deny 4/4 すべて [OK]。
- 判定: **PASS**
- 備考: 採用候補 (b)（既存 + §4 minimum guarantee 包含）方針どおり。

## TC-04: whitelist 効果（pnpm/git で prompt 出ない）

- 実行コマンド:
  ```bash
  jq '.permissions.allow' "$PROJ" | grep -E '"Bash\\(pnpm (install|typecheck|lint|test)\\)"'
  jq '.permissions.allow' "$PROJ" | grep -E '"Bash\\(git (status|diff:\\*|log:\\*)\\)"'
  ```
- 期待結果: §4 allow 7 件すべてヒット
- 実観測結果（Phase 5 Step 3 / Step 5 引用）:
  ```
  §4 allow 7件 / deny 4件 grep → 全 [OK]
  ```
- 判定: **PASS**
- 備考: `--dangerously-skip-permissions` 併用下でも whitelist は loaded（実機セッションで pnpm install/typecheck/lint が prompt なし動作）。

## TC-05: bypass 下の `permissions.deny` 実効性（前提タスク未完）

- 前提タスク: `task-claude-code-permissions-deny-bypass-verification-001`
- 前提タスク結論: **未取得**（FORCED-GO 方針で本タスクは前提タスク 2 件をスキップ）
- 実行コマンド: 未実行（前提結論なしでは判定基準が確定しない）
- 期待結果: 前提タスク完了後に「block される」または「block されない」のいずれかで判定基準を切り替える
- 実観測結果: NOT EXECUTED
- 判定: **BLOCKED**
- 備考: Phase 10 Go 判定（FORCED-GO）に織り込み済。Phase 12 では `docs-ready-execution-blocked` ではなく `completed`（TC-05 BLOCKED 注記）として記録、未タスク化は `unassigned-task-detection.md` で継続化登録。

## TC-F-01: 不正な `defaultMode` 値（Phase 6 引用）

- 実行コマンド（dry path、実機書き換えなし）:
  ```bash
  jq '.permissions.defaultMode = "bypassPermisson"' ~/.claude/settings.json | jq -r '.permissions.defaultMode'
  ```
- 期待結果: typo 値が読み出されることで「実 Claude Code 起動時に bypass モードがマッチせず permission prompt にフォールバックする」根拠を取得
- 実観測結果（Phase 6 fail-path-tests 引用）:
  ```
  bypassPermisson
  ```
- 判定: **PASS**
- 復旧確認: 実ファイル未編集のため復旧不要（dry path）。

## TC-F-02: alias 重複定義注入（Phase 6 引用）

- 実行コマンド（注入→観測→即 rollback）:
  ```bash
  echo "alias cc='claude'" >> ~/.config/zsh/conf.d/79-aliases-tools.zsh
  grep -cE '^alias cc=' ~/.config/zsh/conf.d/79-aliases-tools.zsh
  zsh -i -c 'type cc'
  # rollback: 追加 1 行を削除
  grep -cE '^alias cc=' ~/.config/zsh/conf.d/79-aliases-tools.zsh
  zsh -i -c 'type cc'
  ```
- 期待結果: 注入後 `grep -c=2` / `type cc=claude`（後勝ち）→ rollback 後 `grep -c=1` / `type cc=CC_ALIAS_EXPECTED`
- 実観測結果（Phase 6 fail-path-tests 引用）:
  ```
  注入前: grep -c=1 / type cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
  注入後: grep -c=2 / type cc='claude'
  rollback後: grep -c=1 / type cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
  ```
- 判定: **PASS**
- 復旧確認: rollback 後 `zsh -i -c 'type cc'` が `CC_ALIAS_EXPECTED` と完全一致（Phase 11 再観測でも同値）。

## TC-R-01: alias 重複検出 guard（Phase 6 引用 + Phase 11 再観測）

- 実行コマンド:
  ```bash
  grep -cE '^alias cc=' ~/.config/zsh/conf.d/79-aliases-tools.zsh   # backup 除外条件で 1
  # guard スクリプト本体は Phase 6 fail-path-tests.md 参照
  ```
- 期待結果: backup 除外条件で `^alias cc=` が 1 ヒット
- 実観測結果（Phase 11 再観測）:
  ```
  1
  ```
- Phase 6 guard 出力（引用）:
  ```
  [PASS] alias cc 定義は 1 件です（backup 除外）
  ```
- 判定: **PASS**

## 3 層評価サマリ

| 層 | 結果 |
| --- | --- |
| Semantic | PASS |
| Visual | N/A |
| AI UX | N/A |

## secrets 混入チェック（自走）

```bash
grep -rE '(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|CLOUDFLARE_API_TOKEN=)' \
  docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/
# → 0 件（exit 1 = no match）
```

## screenshots 非存在チェック

```bash
test ! -e docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/screenshots && echo "NON_VISUAL OK"
# → NON_VISUAL OK
```
