# Claude Code Settings 階層優先順位 仕様

> 本ドキュメントは統合システム設計仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/
> 出典: `docs/30-workflows/task-claude-code-permissions-decisive-mode/` Phase 12 skill-feedback-report.md 提案 3.1（HIGH）

---

## 概要

Claude Code の `settings.json` / `settings.local.json` は 4 階層で読み込まれ、上層が下層を完全上書きする。本リファレンスは:

- 4 階層の読み込み優先順位
- `defaultMode` ハイブリッド方針
- `--dangerously-skip-permissions` の保留方針
- `permissions.allow` / `permissions.deny` whitelist 設計
- 関連タスク（`task-claude-code-permissions-decisive-mode` 系 wave）からの参照導線

を一箇所に集約し、worktree / git hooks / GitHub governance タスク間で再利用できる正本を提供する。

---

## 1. 階層優先順位

```
project/.claude/settings.local.json   (最優先 / projectLocal)
  > project/.claude/settings.json     (project)
    > ~/.claude/settings.local.json   (globalLocal)
      > ~/.claude/settings.json       (global / 最弱)
```

| Layer        | Path                                     | 用途                                     |
| ------------ | ---------------------------------------- | ---------------------------------------- |
| projectLocal | `<project>/.claude/settings.local.json`  | 個人のローカル上書き（gitignore 対象）   |
| project      | `<project>/.claude/settings.json`        | リポジトリ共有設定                       |
| globalLocal  | `~/.claude/settings.local.json`          | ユーザーのローカル上書き                 |
| global       | `~/.claude/settings.json`                | ユーザー全体の既定値                     |

### 上書き規則

- 同名キーは **上層が下層を完全上書き**（マージしない）
- `permissions.allow` / `permissions.deny` も配列マージではなく完全上書きを前提とする（実機 TC-04 / TC-05 で再検証する未確認領域）
- enterprise managed settings は本仕様の対象外

---

## 2. `defaultMode` ハイブリッド方針

| 値                   | 用途                                       |
| -------------------- | ------------------------------------------ |
| `acceptEdits`        | 編集を都度確認するモード                   |
| `bypassPermissions`  | 確認をスキップするモード（信頼境界が前提） |

階層がバラバラだと起動時に上位層の値で permission prompt が出る observed 症状が発生する。
`task-claude-code-permissions-project-local-first-comparison-001` の比較結論により、採用方針は **ハイブリッド** とする。

- 主経路: `<project>/.claude/settings.local.json` の `defaultMode = bypassPermissions`
- fallback: `~/.claude/settings.json` の `defaultMode = bypassPermissions`
- 除外: `~/.zshrc` の `cc` alias へ `--dangerously-skip-permissions` を追加しない

| Layer        | 推奨値                                                     |
| ------------ | ---------------------------------------------------------- |
| global       | `bypassPermissions`（fresh worktree / new project 向け fallback） |
| globalLocal  | 既存値を維持（機微値を含むため本 wave では変更対象外） |
| project      | 共有設定のみ。原則として `defaultMode` は projectLocal に寄せる |
| projectLocal | `bypassPermissions`（必要な project の主経路） |

> 信頼境界が確立できないプロジェクトでは project / projectLocal 側で `acceptEdits` を明示し、global fallback を上書きする。

---

## 3. `--dangerously-skip-permissions` 保留方針

`--dangerously-skip-permissions` を `cc` alias に追加する案は、`permissions.deny` の実効性が確認できるまで採用しない。今回の採用案は settings の `defaultMode` に限定し、shell alias は既存形を維持する。

```zsh
# 本仕様では --dangerously-skip-permissions を追加しない
alias cc='claude --verbose --permission-mode bypassPermissions'
```

### 検証必須項目（実機適用前 blocker）

| 項目 | 内容 | 引き継ぎ先 |
| --- | --- | --- |
| bypass × deny 優先関係 | `--dangerously-skip-permissions` 下で `permissions.deny` が実効するか未確認。実効しない場合は alias 採用禁止を維持する | `task-claude-code-permissions-deny-bypass-verification-001` → 条件付き実機検証 `task-claude-code-permissions-deny-bypass-execution-001` |
| project-local-first 案との比較 | 比較完了。project-local-first 単独では fresh worktree / new project で prompt 復帰するため、global fallback を併用するハイブリッドを採用 | `task-claude-code-permissions-project-local-first-comparison-001` |
| MCP server / hook permission 挙動 | bypass 下で MCP server / hook がどう振る舞うか | unassigned task 化候補（U4） |

> `~/.zshrc` への `--dangerously-skip-permissions` 追加は、deny 実効性検証完了まで実行しない。`~/.claude/settings.json` の `defaultMode` fallback は apply タスクでバックアップ取得後に実施する。

---

## 4. `permissions.allow` / `permissions.deny` whitelist 設計

```jsonc
{
  "permissions": {
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm lint)",
      "Bash(pnpm test)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ],
    "deny": [
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(rm -rf /:*)",
      "Bash(curl * | sh:*)"
    ]
  }
}
```

- `Edit` / `Write` の whitelist 化は Phase 10 MINOR として保留（実装タスク `task-claude-code-permissions-apply-001` の設計入力）
- deny は bypass 下での実効性が未確認のため、保険として確定させない（U2 検証後に確定）

---

## 5. 公式 docs URL

| Topic | URL |
| --- | --- |
| Claude Code settings | https://docs.anthropic.com/en/docs/claude-code/settings |
| Configure permissions / deny rules | https://code.claude.com/docs/en/permissions |
| Devcontainer warning for `--dangerously-skip-permissions` | https://docs.anthropic.com/en/docs/claude-code/devcontainer |

---

## 6. Reference Contracts (TypeScript)

```ts
type PermissionMode = "acceptEdits" | "bypassPermissions";

interface ClaudeCodeSettingsLayer {
  name: "global" | "globalLocal" | "project" | "projectLocal";
  path: string;
  defaultMode?: PermissionMode;
  permissions?: { allow?: string[]; deny?: string[] };
}

interface ResolvedPermission {
  effectiveMode: PermissionMode;
  sourceLayer: ClaudeCodeSettingsLayer["name"];
  allow: string[];
  deny: string[];
}

function resolvePermission(layers: ClaudeCodeSettingsLayer[]): ResolvedPermission;
```

---

## 7. 関連タスク wave（DevEx 衝突防止）

横断順序:

```
task-conflict-prevention-skill-state-redesign
  → task-git-hooks-lefthook-and-post-merge
  → task-worktree-environment-isolation
  → task-github-governance-branch-protection
  → task-claude-code-permissions-decisive-mode (本仕様の出典)
```

| 関連タスク | 関係 |
| --- | --- |
| `task-worktree-environment-isolation` | upstream 依存 |
| `task-claude-code-permissions-apply-001` | 本仕様の実機反映タスク。指示書は `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md` に存在し、ハイブリッド採用案を反映済み |
| `task-claude-code-permissions-deny-bypass-verification-001` | bypass × deny 検証仕様。`docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001/` に spec_created / docs-only / NON_VISUAL として存在 |
| `task-claude-code-permissions-deny-bypass-execution-001` | verification-001 の条件付き実機検証 follow-up。`docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-execution-001.md` |
| `task-claude-code-permissions-project-local-first-comparison-001` | project-local-first 比較設計（spec_created、ハイブリッド採用を決定） |
| `task-git-hooks-lefthook-and-post-merge` | pre-commit による alias 整合 check 候補 |
| `task-github-governance-branch-protection` | `permissions.deny` の git 操作と整合 |

---

## 8. 適用先システム仕様書

`docs/00-getting-started-manual/claude-code-config.md` への追記方針:

1. 「階層優先順位」セクションの新設（本仕様 §1 を引用）
2. 「`--dangerously-skip-permissions` 保留方針」の追記（本仕様 §3 を引用）
3. 「whitelist 例」の追記（本仕様 §4 を引用）
4. 公式 docs URL の引用（本仕様 §5 を引用）

> 新規ランタイムインターフェースの追加なし。運用ルールの追記のみ。実反映は `task-claude-code-permissions-apply-001` で行う。
