# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 1 |
| 下流 | Phase 3 (設計レビュー) |
| 状態 | pending |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |
| 元タスク | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/` |

## 目的

Phase 1 で取得した inventory を入力として、E-1 / E-2 / E-3 の実機反映 diff を **完全形**で再構築する。
本タスクは「設計の再構築」ではなく、元タスク `task-claude-code-permissions-decisive-mode` の `outputs/phase-2/{settings-diff,alias-diff}.md` と、aiworkflow 正本の `claude-code-settings-hierarchy.md` §4 を **設計入力として再利用**し、実機 inventory に合わせた **適用 topology** と **検証パス** にまとめ直す。

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 1 inventory | `outputs/phase-01/inventory.md` | 実機現値 / 行番号 |
| Phase 1 carry-over | `outputs/phase-01/carry-over.md` | 必須前提タスク状態 |
| 設計入力（settings diff） | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-2/settings-diff.md` | E-1 before/after 完全形 |
| 設計入力（alias diff） | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-2/alias-diff.md` | E-2 before/after |
| 設計入力（whitelist） | `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §4 | E-3 allow/deny の current canonical |
| 元タスク whitelist | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-2/whitelist-design.md` | 差分確認用。current canonical と異なる場合は Phase 3 の論点として記録 |
| implementation-guide | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md` | E-1/E-2/E-3 の実装手順正本 |
| runbook | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-5/runbook.md` | backup・JSON validity 検証手順 |

## 採用方針（前提）

- **採用案 A（provisional）**: 全層 `bypassPermissions` 統一（元タスク Phase 2 で確定済み）
- 案 B（上位層キー削除）は Phase 3 のレビューで採用案 A が他 project に許容できない波及を持つと判定された場合のみフォールバック
- `defaultMode` は JSON root のキーとして扱う。`permissions` 配下には置かない
- `--dangerously-skip-permissions` と `permissions.deny` の優先関係、および project-local-first 比較が完了するまで、Phase 4 以降の実機変更は blocked

## 手順

1. **設計入力の取り込み**:
   - 元タスクの `settings-diff.md` / `alias-diff.md` と aiworkflow 正本 `claude-code-settings-hierarchy.md` §4 を **再利用元**として明示参照（コピペではなく link で扱う）
   - Phase 1 inventory の行番号と突き合わせ、再利用可否を確認
2. **適用 topology の起こし** (`outputs/phase-02/topology.md`):
   - 書き換え対象 4 ファイルを表で列挙: `~/.claude/settings.json` / `~/.claude/settings.local.json` / `<project>/.claude/settings.json` / `~/.zshrc`（または `~/.config/zsh/conf.d/*-claude.zsh`）
   - 各ファイルの「適用前 → 適用後」キー値（実値秘匿、`defaultMode` / `permissions.allow` / `permissions.deny` のみ）
   - backup ファイル命名規則: `<original>.bak.<TS>`、TS は `date +%Y%m%d-%H%M%S`
   - 適用順序: backup → settings 3 ファイル → alias → reload → smoke
3. **settings 階層 diff の再構築** (`topology.md` の subsection):
   - `~/.claude/settings.json`: `defaultMode: "acceptEdits"` → `"bypassPermissions"` の JSON 抜粋（`{...}` で他キー省略）
   - `~/.claude/settings.local.json` / `<project>/.claude/settings.json`: 変更なし（明示確認のみ）
   - `<project>/.claude/settings.json` の `permissions.allow` / `deny` の最終形抜粋
4. **`cc` alias diff の再構築** (`topology.md`):
   - Before: `alias cc='claude --verbose --permission-mode bypassPermissions'`
   - After: `alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'`
   - 環境変数 `CC_ALIAS_EXPECTED` に After 文字列を格納する旨と、後続 Phase の検証コマンドで使う仕様を明記
5. **whitelist allow/deny 一覧** (`topology.md` の subsection):
   - allow: `Bash(pnpm install)`, `Bash(pnpm typecheck)`, `Bash(pnpm lint)`, `Bash(pnpm test)`, `Bash(git status)`, `Bash(git diff:*)`, `Bash(git log:*)`
   - deny: `Bash(git push --force:*)`, `Bash(git push -f:*)`, `Bash(rm -rf /:*)`, `Bash(curl * | sh:*)`
   - `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §4 と完全一致するかを diff で確認した旨を記載
6. **検証パス設計** (`outputs/phase-02/validation-path.md`):
   - JSON validity 検証コマンド（`jq empty <file>` / `python -m json.tool <file> >/dev/null`）
   - alias 重複検出コマンド（`grep -nE '^alias cc=' <定義ファイル>` ヒット数 == 1）
   - `type cc` の expected 文字列との照合方法
   - `defaultMode` 値確認（`jq -r '.defaultMode' <file>`）
   - 各検証コマンドの **PASS 条件**を明示
7. **適用順序とロールバック手順の固定** (`topology.md`):
   - rollback: backup `*.bak.<TS>` を `mv` で原位置に戻し、shell reload
   - 各ステップで失敗した場合の戻し先 backup ファイルを明示

## 成果物

`artifacts.json` の Phase 2 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-02/main.md` | Phase 2 サマリ。採用案 A の最終確定、書き換え対象 4 ファイル、適用順序、Phase 3 へのレビュー観点引き渡し |
| `outputs/phase-02/topology.md` | 4 ファイルの before/after 完全形 diff（settings 3 ファイル + alias）、whitelist allow/deny 一覧、backup 命名、適用順序、ロールバック手順 |
| `outputs/phase-02/validation-path.md` | JSON validity / alias 重複検出 / `type cc` 照合 / `defaultMode` 値確認 の各検証コマンドと PASS 条件 |

## 完了条件

- [ ] `topology.md` に 4 ファイルの before/after diff が完全形（行番号付き、実値秘匿）で記載されている
- [ ] whitelist allow/deny が `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §4 と完全一致している
- [ ] 元タスク `whitelist-design.md` との差分がある場合は Phase 3 レビュー論点に記録されている
- [ ] `validation-path.md` に JSON validity / alias 重複検出 / `defaultMode` 値確認の **3 検証カテゴリすべて** にコマンドと PASS 条件が記載されている
- [ ] backup 命名規則 `*.bak.<TS>` と TS フォーマットが固定されている
- [ ] ロールバック手順が backup → mv 戻し → shell reload の順で記述されている
- [ ] 元タスク Phase 2 設計入力 3 ファイルへのリンクが明示されている
- [ ] artifacts.json の `phases[1].outputs` と本 Phase 成果物のパスが完全一致する

## 検証コマンド

```bash
# JSON validity
jq empty ~/.claude/settings.json
jq empty ~/.claude/settings.local.json
jq empty "$PWD/.claude/settings.json"

# defaultMode 値確認
jq -r '.defaultMode' ~/.claude/settings.json
jq -r '.defaultMode' ~/.claude/settings.local.json
jq -r '.defaultMode' "$PWD/.claude/settings.json"

# alias 重複検出
grep -cE '^alias cc=' ~/.zshrc ~/.config/zsh/conf.d/*-claude.zsh 2>/dev/null

# 期待 alias と type cc の照合（CC_ALIAS_EXPECTED は validation-path.md の正本）
type cc
```

## 依存 Phase

- 上流: Phase 1（inventory.md / carry-over.md）
- 下流: Phase 3（topology.md / validation-path.md をレビュー対象とする）

## 想定 SubAgent / 並列性

- 単一 agent で直列実行（設計の再構築タスクのため並列化不要）
- 設計入力 3 ファイルの読み取りは並列で可

## ゲート判定基準

- 全完了条件 ✅ で Phase 3 着手可
- aiworkflow 正本 `claude-code-settings-hierarchy.md` §4 との完全一致が崩れた場合は Phase 1 inventory 再取得にループバック

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 元タスク設計入力との drift | `topology.md` 冒頭で「再利用元へのリンク + 一致確認済み」を明記。差分があれば必ず注記 |
| backup 命名衝突 | TS に秒粒度を含める (`%Y%m%d-%H%M%S`) ことで衝突回避 |
| `cc` alias 定義ファイル誤特定 | Phase 1 で確定した正本ファイルパスを `topology.md` に固定値として転記 |
| whitelist 既存項目との衝突 | Phase 1 inventory の `permissions` 現値と diff を取り、衝突項目があれば `topology.md` に明示し Phase 3 で判定 |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
