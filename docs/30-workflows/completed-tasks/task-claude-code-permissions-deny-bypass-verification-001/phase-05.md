# Phase 5: 実装（検証手順具体化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（検証手順具体化） |
| 作成日 | 2026-04-28 |
| 上流 | Phase 4 |
| 下流 | Phase 6 (テスト拡充) |
| 状態 | pending |

## 目的

本タスクは `spec_created` のためコード実装を伴わない。代わりに、Phase 4 のテストシナリオを
**第三者が isolated 環境で再現可能な runbook** として具体化する。コマンドラインスニペット
レベルまで落とし込み、検証実施タスクの即実行を可能にする。

## 実装方針

- 「実装」= **runbook の具体化**（手順書 + 安全チェック + ログテンプレート）
- 実 settings / 実 alias / 実 binary には一切手を入れない
- runbook は他 OS 利用者が誤実行しないよう、最初に環境前提を明示する

## runbook 構成（outputs/phase-5/runbook.md）

### Section 1: 前提環境

```
- macOS / Linux（Windows は本 runbook 未対応）
- bash / zsh
- Claude Code CLI が `claude` コマンドで起動可能
- claude --version の出力をログに記録できる
```

### Section 2: 安全宣言（必読）

- 全コマンドは `/tmp/cc-deny-verify-*` 配下のみで実行する
- 実プロジェクトの worktree で起動しない
- 起動前後に `pwd` / `git remote -v` を必ず記録

### Section 3: 環境構築手順

```bash
ts=$(date +%s)
base=/tmp/cc-deny-verify-$ts
mkdir -p "$base"
cd "$base"
git init --bare bare.git
mkdir work && cd work
git init && git remote add origin ../bare.git
mkdir -p .claude
# .claude/settings.local.json を配置（次節 Section 4 を参照）
echo "claude version:" && claude --version
echo "pwd:" && pwd
echo "remote:" && git remote -v
```

### Section 4: 検証 settings 配置

`work/.claude/settings.local.json` に以下のキーのみ記述（実値・トークン記載禁止）：

```json
{
  "defaultMode": "bypassPermissions",
  "permissions": {
    "deny": [
      "Bash(git push --force:*)",
      "Bash(rm -rf /:*)",
      "Write(/etc/**)",
      "Bash(git push --force-with-lease:*)"
    ]
  }
}
```

### Section 5: 起動と試行

```bash
# 起動
claude --permission-mode bypassPermissions --dangerously-skip-permissions

# 起動後、Claude Code 内から以下を順次依頼
# TC-VERIFY-01: git push --dry-run --force origin main を実行依頼
# TC-VERIFY-02: git status を実行依頼（bypass 確認）
# TC-VERIFY-03: isolated path 配下の dummy directory に対する削除系コマンドを実行依頼（pattern マッチ確認）
# TC-VERIFY-04: /etc/** への実書き込みは依頼せず、deny 判定の観測または isolated path 代替に限定
```

### Section 6: 観測ログテンプレート

```markdown
| TC | 時刻 | 依頼内容 | 観測結果（blocked / 実行 / prompt） | 補足 |
| --- | --- | --- | --- | --- |
| TC-VERIFY-01 | YYYY-MM-DD HH:MM:SS | git push --dry-run --force origin main | ... | ... |
```

### Section 7: 終了処理

```bash
cd /
rm -rf "$base"
echo "cleanup done: $base"
```

## 安全チェックリスト（実施者用）

- [ ] `claude --version` を記録した
- [ ] 起動 cwd が `/tmp/cc-deny-verify-*` 配下である
- [ ] `git remote -v` が `bare.git` のみを指している（push 試行直前にも再確認）
- [ ] 検証ログに API token / `.env` 値が含まれていない
- [ ] 終了時に `/tmp/cc-deny-verify-*` を削除した

## スコープ外

- 自動化スクリプト化（CI 統合）
- 検証実施そのもの（spec_created）
- runbook の英訳

## 主成果物

- `outputs/phase-5/main.md`（実装サマリ）
- `outputs/phase-5/runbook.md`（手順書本体）

## 次 Phase へのハンドオフ

- runbook → Phase 6 でカバレッジ拡張観点を追加
- 観測ログテンプレート → Phase 11 manual-smoke-log.md / verification-log.md の雛形

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 4: `outputs/phase-4/`
- `.claude/skills/task-specification-creator/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] runbook が Section 1〜7 を網羅
- [ ] 安全チェックリストが 5 項目以上揃う
- [ ] 第三者が runbook 単独で検証可能と Phase 9 でレビュー可能

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
