# Phase 1 carry-over: Phase 2 / Phase 3 への引き渡し

## 必須前提タスク状態

| タスクID | 状態 | impact |
| --- | --- | --- |
| `task-claude-code-permissions-deny-bypass-verification-001` | **未実施**（指示書のみ） | bypass 下 deny 実効性が UNKNOWN。Phase 3 R-2 は「保険として deny で守られている」前提を採用できない |
| `task-claude-code-permissions-project-local-first-comparison-001` | **未実施**（指示書のみ） | 案 A vs 案 B trade-off が未確定。Phase 3 R-3 は判断材料なし |

→ 通常運用なら Phase 3 で **No-Go**。本タスクではユーザーが選択肢 C（前提タスクスキップ）を明示承認したため、Phase 3 を **FORCED-GO** として進める。Phase 4 着手判定は本タスク仕様書 index.md の `block_reason` に基づき blocked のまま据え置き。

## Phase 2 で必要な引き渡し情報

### CC_ALIAS_EXPECTED 想定値

```
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

### 正本ファイルパス（元設計と差分あり）

| 種別 | 元設計の前提 | 実機確認後の正本 |
| --- | --- | --- |
| `cc` alias 定義 | `~/.zshrc` | `~/.config/zsh/conf.d/79-aliases-tools.zsh`（行 7） |
| globalLocal settings | `~/.claude/settings.local.json` | **存在しない**（新規作成は本タスクで行わない） |
| projectLocal settings | `<project>/.claude/settings.local.json` | **存在しない**（新規作成は本タスクで行わない） |

### `defaultMode` 配置論点（P-1）

- **元設計**: `defaultMode` を JSON root のキーとして扱う
- **実機現状**: `permissions.defaultMode` 配下に `bypassPermissions` が既に設定されている（root は null）
- Phase 2 で aiworkflow §1（上層上書き）と公式 docs から正本キーパスを確定する必要あり
- 仮に root + nested 両方を保持すると `parser` 挙動依存。Phase 2 topology.md で「nested に統一して root には書かない」案を提案する

### whitelist allow/deny 設計入力

- 設計入力 1: `whitelist-design.md`（旧設計、広範な glob）
- 設計入力 2: `claude-code-settings-hierarchy.md` §4（current canonical、簡潔な限定列挙）
- **両者に明確な差分あり**（Phase 2 topology.md / Phase 3 impact-analysis.md AC-2 で明示必須）

### 他 project 波及範囲

- 既存 settings ファイル 13 件のうち、root.defaultMode 明示 override は **0 件**
- `permissions.defaultMode` override は AutoForgeNexus が `acceptEdits` で明示 → global を bypass に変えても影響なし
- 未定義（null）4 project は global 継承で bypass 化される副作用が発生 → Phase 3 R-1 で許容判定

## Phase 3 で確認すべき項目

1. **R-1 波及範囲**: 未定義 4 project（Skill / AIWorkflowOrchestrator / senpAI / n8n）の bypass 化を許容するか
2. **R-2 deny 実効性**: 前提タスク #1 未完了 → BLOCKED 記録 + ユーザー強行承認による FORCED-GO
3. **R-3 project-local-first**: 前提タスク #2 未完了 → BLOCKED 記録 + FORCED-GO
4. **R-4 whitelist 衝突**: 既存 project allow 139 件 / deny 13 件と current canonical §4（allow 7 + deny 4）の差分を解消するか「§4 を minimum guarantee として上書きせず追記する」かを Phase 3 で決定
5. **R-5 不変条件**: `.env` 実値非記録 / wrangler 直接実行禁止 / OAuth 残置禁止 / グローバル波及明文化

## backup ファイル保管場所

- 命名: `<original>.bak.20260428-HHMMSS`
- 保管場所: 元ファイルと同じディレクトリ（権限・パスの追跡を容易にするため）
- 保持期間: 本タスク完了から 30 日（Phase 12 の documentation-changelog.md に明記する想定）
