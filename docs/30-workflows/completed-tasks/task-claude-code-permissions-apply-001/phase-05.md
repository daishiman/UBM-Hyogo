# Phase 5: 実装（実機反映）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（host 環境ファイル書き換え） |
| 作成日 | 2026-04-28 |
| 上流 | Phase 4（テスト作成） |
| 下流 | Phase 6（テスト拡充） |
| 状態 | blocked（Phase 3 Go + user 承認まで実機変更禁止） |
| user_approval_required | false |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |

## 目的

Phase 4 で確定した期待値に従い、実機 host 環境を書き換え、Phase 4 の Red を Green に変える。
**書き換え対象は Claude Code の正本ファイル（`~/.claude/*` および `~/.zshrc`）と `<project>/.claude/*`** であり、コード commit ではない。

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 4 test-scenarios | `outputs/phase-04/test-scenarios.md` | 反映後に PASS させるべき期待値 |
| Phase 4 expected-results | `outputs/phase-04/expected-results.md` | `CC_ALIAS_EXPECTED` 等の正準値 |
| 元タスク runbook | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-5/runbook.md` | Step 1-6 の実行手順の正本 |
| Phase 1 inventory | `outputs/phase-01/inventory.md` | 変更前現値・他 project 影響範囲 |
| Phase 2 topology | `outputs/phase-02/topology.md` | 反映後 topology |

## 変更対象ファイル一覧（[Feedback RT-03] 反映）

### 修正（in-place edit + `.bak.<TS>` 取得）

| パス | 変更内容 |
| --- | --- |
| `~/.claude/settings.json` | root `defaultMode` を `bypassPermissions` |
| `~/.claude/settings.local.json` | 同上（存在する場合のみ） |
| `<project>/.claude/settings.json` | `permissions.allow` / `permissions.deny` を `expected-results.md` の正準値に置換 |
| `~/.zshrc` または `~/.config/zsh/conf.d/<該当>.zsh` | `cc` alias 1 行を `CC_ALIAS_EXPECTED` に置換 |

### 新規作成

| パス | 用途 |
| --- | --- |
| `~/.claude/settings.json.bak.<TS>` | 修正前 backup |
| `~/.claude/settings.local.json.bak.<TS>` | 同上（存在する場合のみ） |
| `<project>/.claude/settings.json.bak.<TS>` | 同上 |
| `~/.zshrc.bak.<TS>`（または該当 zsh conf の `.bak.<TS>`） | 同上 |
| `<project>/.claude/settings.local.json` | 必要な project のみ新規作成 |

`<TS>` は `date +%Y%m%d-%H%M%S` 形式で固定する。

## 手順（runbook.md Step 1-6 を踏襲）

### Step 1: backup 取得

1. `TS=$(date +%Y%m%d-%H%M%S)` を sticky 変数として確定し `runbook-execution-log.md` 冒頭に記録
2. 4 ファイルそれぞれを `<path>.bak.<TS>` として `cp -p` で複製
3. `backup-manifest.md` に各 backup の **絶対パス / サイズ (bytes) / sha256（先頭 16 桁）** を表形式で記録
4. backup ファイルのサイズが元ファイルと一致することを `stat -f%z`（macOS）で確認

### Step 2: グローバル settings 反映

1. `~/.claude/settings.json` の root `defaultMode` を `bypassPermissions` に書き換え（`jq` 経由で in-place、temp 経由）
2. `~/.claude/settings.local.json` も同様（存在する場合のみ）
3. 各書き換え後、`jq empty <path>` で **JSON validity** を検証し `runbook-execution-log.md` に PASS を記録
4. `jq -r '.defaultMode'` 出力が `DEFAULT_MODE_EXPECTED` と一致することを確認

### Step 3: project whitelist 反映

1. `<project>/.claude/settings.json` の `permissions.allow` / `deny` を `expected-results.md` の正準値に置換
2. `jq empty` で JSON validity 検証
3. `jq -S '.permissions'` 出力を `expected-results.md` の期待 JSON と diff 0 確認
4. 必要 project に `<project>/.claude/settings.local.json` を新規作成（テンプレートは元タスク runbook 参照）

### Step 4: alias 反映

1. `~/.zshrc`（または zsh conf.d 該当ファイル）の `cc` alias 1 行を `CC_ALIAS_EXPECTED` に置換
2. 既存の重複 `alias cc=` 行があれば全削除して 1 行のみ残す
3. `grep -cE '^alias cc=' <定義ファイル>` が `1` であることを確認
4. **新シェルで** `type cc` を実行し、その 1 行出力を `runbook-execution-log.md` に転記

### Step 5: smoke テスト

1. Phase 4 `test-scenarios.md` の TC-01〜TC-04 を実行し、各 PASS を `runbook-execution-log.md` に記録
2. TC-R-01 を実行し、他 zsh conf に古い alias が残っていないことを確認
3. TC-05 は前提タスクの結論を引用するのみ（独自検証しない）

### Step 6: rollback 手順整備

1. 各 backup の復元コマンドを `runbook-execution-log.md` に明文化:
   ```
   cp -p ~/.claude/settings.json.bak.<TS> ~/.claude/settings.json
   cp -p <project>/.claude/settings.json.bak.<TS> <project>/.claude/settings.json
   cp -p ~/.zshrc.bak.<TS> ~/.zshrc && exec zsh
   ```
2. rollback の動作確認は実施しない（破壊的なため）。手順記述のみで完了

## 不変条件（実装中に守ること）

- **平文 `.env` / API token / OAuth token / 1Password 実値を `runbook-execution-log.md` 等に転記しない**
- `~/Library/Preferences/.wrangler/config/default.toml` の OAuth トークンを **新規生成・残置しない**（host 編集タスクとして再掲）
- `wrangler` 直接実行は本タスク範囲外だが、誤って起動しない
- グローバル settings 反映後、他 worktree / 他 project への波及を Phase 1 inventory と突合（想定外の override が増えていないこと）

## 成果物

`artifacts.json` の Phase 5 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-05/main.md` | Phase 5 サマリ。Step 1-6 の実行結果、新規作成 / 修正ファイル一覧、Phase 4 Red → Green 結果 |
| `outputs/phase-05/runbook-execution-log.md` | `TS` 値、Step 毎の実行コマンド・stdout・JSON validity 検証結果・`type cc` 出力・rollback 手順 |
| `outputs/phase-05/backup-manifest.md` | 4 ファイルの `.bak.<TS>` 絶対パス・サイズ・sha256 先頭 16 桁、元ファイルとのサイズ一致確認 |

## 完了条件

- [ ] `TS` 値が固定され全 backup ファイル名で一貫している
- [ ] `backup-manifest.md` に 4 件の backup が記録され、サイズが元と一致
- [ ] `~/.claude/settings.json` / `~/.claude/settings.local.json` / `<project>/.claude/settings.json` の `jq empty` が PASS
- [ ] `jq -r '.defaultMode'` が 3 ファイルすべてで `bypassPermissions`
- [ ] `<project>/.claude/settings.json` の `permissions` が期待 JSON と diff 0
- [ ] `grep -cE '^alias cc=' <定義ファイル>` が `1`
- [ ] 新シェルでの `type cc` 出力が `CC_ALIAS_EXPECTED` 由来の文字列と完全一致
- [ ] Phase 4 TC-01〜TC-04 が全 PASS（runbook-execution-log.md に記録）
- [ ] rollback 手順 3 行が `runbook-execution-log.md` に明文化
- [ ] artifacts.json `phases[4].outputs` と本 Phase 成果物が完全一致

## 検証コマンド

```bash
# JSON validity
jq empty ~/.claude/settings.json
jq empty ~/.claude/settings.local.json 2>/dev/null || echo "settings.local.json 不在"
jq empty "$PWD/.claude/settings.json"

# defaultMode 確認
jq -r '.defaultMode' ~/.claude/settings.json
jq -r '.defaultMode' ~/.claude/settings.local.json 2>/dev/null

# alias 重複検出
grep -cE '^alias cc=' ~/.zshrc

# backup サイズ一致確認
stat -f%z ~/.claude/settings.json ~/.claude/settings.json.bak.<TS>

# 新シェルでの alias 確認
zsh -i -c 'type cc'
```

## 依存 Phase

- 上流: Phase 4（test-scenarios.md / expected-results.md）
- 下流: Phase 6（fail-path 実注入）/ Phase 7（カバレッジ確認）
- carry-over: 実機編集ログと rollback 履歴を Phase 6 / 7 で参照

## 想定 SubAgent / 並列性

- **単一 agent で直列実行**（host 環境編集のため並列禁止）
- backup 取得（Step 1）と manifest 記録は一連で実施

## ゲート判定基準

- 完了条件すべて PASS で Phase 6 着手可
- いずれか FAIL → 該当ファイルを Step 6 rollback で復旧し Phase 4 にループバック

## リスクと対策

| リスク | 対策 |
| --- | --- |
| backup 取得漏れで rollback 不能 | Step 1 を最優先で実施、`backup-manifest.md` で 4 件存在を完了条件化 |
| JSON 不正で Claude Code 起動不能 | 各書き換え後 `jq empty` を必須実行、失敗時は即 rollback |
| `cc` alias 重複で意図しないモード起動 | Step 4 で重複検出 (`grep -c` = 1) を完了条件化、Phase 6 で fail injection 検証 |
| グローバル波及で他 project 起動不能 | Phase 1 inventory と差分突合し、想定外 override がないことを `main.md` に記録 |
| 平文シークレット混入 | runbook-execution-log.md / backup-manifest.md に **絶対パスとメタデータのみ**記録、ファイル中身は転記しない |
| OAuth トークン残置 | `~/Library/Preferences/.wrangler/config/default.toml` を本 Phase 中に生成しない（`wrangler login` を打たない） |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
