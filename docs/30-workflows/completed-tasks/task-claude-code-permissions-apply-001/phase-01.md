# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| 上流 | - |
| 下流 | Phase 2 (設計) |
| 状態 | pending |
| taskType | implementation（host 環境ファイル書き換え） |
| visualEvidence | NON_VISUAL |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |
| 元タスク | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/` |

## 目的

`task-claude-code-permissions-decisive-mode` で確定した設計（採用案 A: 全層 `bypassPermissions` 統一）を実機反映するための **要件確定 Phase**。
具体的には:

1. 実機 3 層 settings / `cc` alias の **現値 inventory** を取得（実値秘匿）
2. 必須前提タスク 2 件の完了状況を把握し、Go/No-Go 材料を整理
3. taskType=`implementation` / visualEvidence=`NON_VISUAL` をここで確定
4. Phase 2 で書き換え対象となるキー名・行番号・代替パターンを Phase 1 で全部洗い出す

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| 元タスク台帳 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md` | 受入条件 / スコープの正本 |
| 設計入力 (Part 1/2) | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md` | E-1/E-2/E-3 の確定済み設計 |
| 実機 runbook | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-5/runbook.md` | backup・JSON validity 検証手順 |
| 元タスク Phase 1 | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/phase-01.md` | inventory フォーマット参考 |
| 元タスク unassigned-task-detection | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/unassigned-task-detection.md` | 必須前提タスクの根拠 |
| Claude Code 設定リファレンス | `docs/00-getting-started-manual/claude-code-config.md` | 階層優先順位の正本 |

## 真の論点

1. グローバル `~/.claude/settings.json` の `defaultMode` 書き換えが他 project / 他 worktree に silent 波及しないか
2. 必須前提タスク（deny-bypass-verification-001 / project-local-first-comparison-001）が未完了のまま Phase 4 以降へ進めない
3. `cc` alias 定義ファイルの正本が `~/.zshrc` か `~/.config/zsh/conf.d/*-claude.zsh` のどちらかを断定する必要がある
4. backup ファイル `*.bak.<TS>` の保管場所と保持期間を Phase 1 で確定する

## 手順

1. **Claude Code バージョン記録**: `claude --version` の出力を `outputs/phase-01/inventory.md` 冒頭に貼る（実値 OK、秘匿情報なし）
2. **3 層 settings inventory 取得**:
   - `~/.claude/settings.json` / `~/.claude/settings.local.json` / `<project>/.claude/settings.json` / `<project>/.claude/settings.local.json` の各ファイルから `defaultMode`, `permissions.allow`, `permissions.deny`, `env`（**キー名のみ・値は記録禁止**）を抽出
   - 行番号付きで記録（後続 Phase の diff 入力にする）
3. **`cc` alias inventory 取得**:
   - `type cc` 出力 1 行
   - `grep -nE '^alias cc=' ~/.zshrc ~/.config/zsh/conf.d/*-claude.zsh 2>/dev/null` の全ヒット行
   - 「正本ファイル」がどれかを断定（hit 数 1 になるべき）
4. **他 project 走査**:
   - `grep -rn '"defaultMode"' ~/.claude ~/dev 2>/dev/null` 等で他リポジトリ・他 worktree の override を洗い出し（パスとキー名のみ・値は記録するが secrets ではない）
   - 結果を `inventory.md` の「他 project 影響範囲」セクションに記録
5. **必須前提タスクの状態確認**:
   - `task-claude-code-permissions-deny-bypass-verification-001` の completion status を `docs/30-workflows/completed-tasks/` 配下から確認
   - `task-claude-code-permissions-project-local-first-comparison-001` も同様
   - 完了していない場合は **Phase 3 ゲートで block** する旨を `carry-over.md` に明記
6. **要件 / 非要件 / スコープ外の確定**:
   - 機能要件: F-1 (3 層 `bypassPermissions` 統一), F-2 (`cc` alias 正準化), F-3 (whitelist allow/deny 反映), F-4 (backup/rollback 整備)
   - 非機能要件: N-1 (`.env` 実値・API token 不記録), N-2 (他 project 波及最小化), N-3 (NON_VISUAL 主証跡)
7. **taskType / visualEvidence の確定**:
   - taskType=`implementation`、visualEvidence=`NON_VISUAL` を `main.md` に明記し artifacts.json と一致を確認
8. **carry-over.md の記述**:
   - 必須前提タスク 2 件の状態 / Phase 2 で必要な情報の引き渡し項目を列挙

## 成果物

`artifacts.json` の Phase 1 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-01/main.md` | 要件 / 非要件 / スコープ / taskType=implementation / visualEvidence=NON_VISUAL の最終確定。後続 Phase が読む要約 |
| `outputs/phase-01/inventory.md` | Claude Code バージョン、3 層 settings の現値（キー名のみ・行番号付き）、`cc` alias 定義箇所の確定、他 project の `defaultMode` override 洗い出し結果 |
| `outputs/phase-01/carry-over.md` | 必須前提タスク 2 件の完了状況、Phase 2/3 への引き渡し項目（`CC_ALIAS_EXPECTED` 想定値・whitelist 設計入力の所在等） |

## 完了条件

- [ ] `inventory.md` に Claude Code バージョン / 3 層 settings 現値 / `cc` alias 現値 / 他 project 影響範囲の全 4 セクションが揃っている
- [ ] 実値（API key / OAuth token / `.env` 中身）が **一切記録されていない**
- [ ] `carry-over.md` に必須前提タスク 2 件の状態が記録されている
- [ ] `main.md` に taskType=`implementation` / visualEvidence=`NON_VISUAL` が明記されている
- [ ] artifacts.json の `phases[0].outputs` と本 Phase 成果物のパスが完全一致する

## 検証コマンド

```bash
# Claude Code バージョン
claude --version

# 3 層 settings の存在確認（中身は jq で必要キーのみ抽出）
ls -la ~/.claude/settings.json ~/.claude/settings.local.json
ls -la "$PWD/.claude/settings.json" "$PWD/.claude/settings.local.json" 2>/dev/null
jq '{defaultMode, permissions, envKeys: (.env // {} | keys)}' ~/.claude/settings.json

# cc alias 現値
type cc
grep -nE '^alias cc=' ~/.zshrc ~/.config/zsh/conf.d/*-claude.zsh 2>/dev/null

# 他 project の defaultMode override 走査
grep -rn '"defaultMode"' ~/.claude 2>/dev/null
grep -rln '"defaultMode"' ~/dev 2>/dev/null | head -50
```

## 依存 Phase

- 上流: なし
- 下流: Phase 2（inventory.md / carry-over.md を入力として diff 設計を行う）

## 想定 SubAgent / 並列性

- 単一 agent で直列実行（情報収集タスクのため並列化不要）
- inventory 取得と他 project 走査は同一 shell session で連続実行可

## ゲート判定基準

- 全完了条件が ✅ になった時点で Phase 2 着手可
- 必須前提タスク 2 件のうち 1 件でも未着手の場合は **Phase 2 着手は可（設計のみ）だが Phase 4 以降は block**（Phase 3 ゲートで再判定）
- 実値が混入した場合は即座に該当行を削除し履歴ごと再生成

## リスクと対策

| リスク | 対策 |
| --- | --- |
| inventory 取得時に `.env` 実値・API key が誤って混入 | `jq` でキー名のみ抽出するコマンドを使用。`cat` での全文取得を禁止 |
| 他 project の `defaultMode` override 漏れ | `~/dev` 配下を `grep -rln` で網羅走査。検出パスは `inventory.md` に列挙 |
| `cc` alias 定義ファイルの正本断定ミス | `type cc` 出力と grep ヒット行の **完全一致**を確認条件にする |
| 必須前提タスクの状態誤認 | `docs/30-workflows/completed-tasks/` 配下の存在 + 該当 task の `index.md` 状態欄を両方確認 |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
