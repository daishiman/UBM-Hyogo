# Phase 2 main: 設計サマリ

## 採用方針

- **採用案 A（暫定）**: 全層 `bypassPermissions` 統一
- 案 A は元タスク `task-claude-code-permissions-decisive-mode` Phase 2 で確定
- 必須前提タスク 2 件未実施 → Phase 3 で FORCED-GO 判定（ユーザー強行承認）

## 書き換え対象（4 ファイル）

| # | ファイル | 変更概要 |
| --- | --- | --- |
| 1 | `~/.claude/settings.json` | `permissions.defaultMode` は既に `bypassPermissions`。root 直下 `defaultMode` は **書き加えない**（nested に統一）。`permissions.allow` / `deny` は本タスクでは触らない（global 波及防止） |
| 2 | `~/.claude/settings.local.json` | **未存在のため作成しない**（Phase 1 carry-over.md 引き渡し済） |
| 3 | `<project>/.claude/settings.json`（worktree 含む UBM-Hyogo の `.claude/settings.json`） | `permissions.defaultMode` 既設定確認のみ。`permissions.allow` / `deny` は current canonical §4 への準拠方針を Phase 3 で決定（後述 P-2） |
| 4 | `~/.config/zsh/conf.d/79-aliases-tools.zsh:7`（元設計の `~/.zshrc` から差し替え） | alias 行を `CC_ALIAS_EXPECTED` に置換 |

## 適用順序

1. backup（4 ファイル → `*.bak.<TS>`）
2. settings 編集（global → project の順）
3. JSON validity 検証（`jq empty`）
4. alias 編集（`79-aliases-tools.zsh:7`）
5. alias 重複検出（`grep -cE '^alias cc='` ヒット数 == 1）
6. shell reload（`exec zsh -l` または新規 terminal）
7. smoke（`type cc` の expected 文字列照合 / `claude --version` 確認）

## Phase 3 へのレビュー観点引き渡し

| 論点 | 内容 |
| --- | --- |
| **P-1: `defaultMode` 配置キー** | 元設計は root.defaultMode を前提だが実機は `permissions.defaultMode`。Phase 2 では nested に統一する方針（root には書かない）を採用。Phase 3 で公式仕様 / aiworkflow §1 と整合確認 |
| **P-2: whitelist 差分（whitelist-design.md vs §4）** | 大幅な差分あり（後述 topology.md）。Phase 3 で「§4 を採用 / whitelist-design.md を採用 / 既存維持」のいずれを正本とするか決定 |
| **P-3: `cc` alias 効いていない問題** | `type cc` が `/usr/bin/cc` を返す。本タスクでは alias 行修正のみ実施し、source されない原因究明は別タスク（unassigned 候補） |
| **P-4: 他 project の bypass 化副作用** | 未定義 4 project が global 継承で bypass 化される（Phase 1 inventory §4 参照） |

## artifacts.json 整合確認

- `phases[1].outputs` = `["outputs/phase-02/main.md", "outputs/phase-02/topology.md", "outputs/phase-02/validation-path.md"]` と完全一致
