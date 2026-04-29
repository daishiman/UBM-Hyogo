# Phase 5: 実装（比較表本体の作成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（比較表本体の作成） |
| 作成日 | 2026-04-28 |
| 上流 | Phase 4 |
| 下流 | Phase 6 (テスト拡充) |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |
| implementation_mode | new (docs) |
| 状態 | pending |

## 目的

> ⚠️ **本タスクは spec_only / docs-only**。`~/.claude/settings.json` / `~/.zshrc` / `<project>/.claude/settings.json` への実書き換えは禁止。
> spec_only 文脈における「実装」とは **比較表本体（4 層責務表 / 3 案 × 5 軸 / rollback 手順 / ハンドオフ箇条書き）の Markdown 生成** を指す。

ソース MD §3〜§4 で定めた Phase 1〜Phase 4 の素材を集約し、`outputs/phase-5/` 配下に「読めば apply タスクが即着手できる」粒度の比較設計ドキュメントを完成させることを宣言する（実体ファイル本体の生成は Phase 5 実行時に行い、本仕様書では構成・章立て・採用方針の根拠ロジックを固定する）。

## 真の論点

- 比較対象は「案 A（global + shell alias 強化）」「案 B（project-local-first）」「ハイブリッド（B を default、A を fallback）」の 3 案
- 5 軸は「影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動」（ソース MD §4 Phase 3 で固定）
- `--dangerously-skip-permissions` を alias に焼き込むかは、`task-claude-code-permissions-deny-bypass-verification-001` の結果未着の場合は採用案から除外する選択肢を維持する
- rollback 手順は「読むだけで実行可能」な粒度で書き、`scripts/cf.sh` / `op run` 経由の他プロジェクト機能を破らない

## 修正対象ファイル一覧

| 種別 | パス | 操作 | 担当 |
| --- | --- | --- | --- |
| 新規 | `outputs/phase-5/main.md` | Phase 5 実装ログ（章立て・採用案決定根拠・ハンドオフ宣言） | 本タスク |
| 新規 | `outputs/phase-5/comparison.md` | 4 層責務表 + 3 案 × 5 軸比較表 + rollback 手順 + 他プロジェクト副作用一覧 + ハンドオフ箇条書き | 本タスク |
| 参照のみ | `~/.claude/settings.json` | 現状値の読み取りのみ（書き換え禁止） | - |
| 参照のみ | `<project>/.claude/settings.local.json` | 現状値の読み取りのみ（書き換え禁止） | - |

## 比較表本体の章立て（`outputs/phase-5/comparison.md` で記述する内容）

### Section 1: 4 層責務表（Phase 1 成果物の集約）

| 層 | 想定利用者 | 変更頻度 | git 管理 | このタスクで触るか |
| --- | --- | --- | --- | --- |
| `~/.claude/settings.json`（global） | 個人 | 低 | 不可（home 配下） | apply タスクで判断 |
| `~/.claude/settings.local.json`（global.local） | 個人 | 中 | 不可 | 触らない |
| `<project>/.claude/settings.json`（project） | チーム / 自分 | 中 | 可 | 触らない |
| `<project>/.claude/settings.local.json`（project.local） | 個人 | 高 | 不可（gitignore） | 現状値読み取りのみ |

settings precedence notation:

- evaluation order: `global → global.local → project → project.local`
- winning precedence: `project.local > project > global.local > global`

### Section 2: project-local-first の再発判定（Phase 2 成果物の集約）

- `defaultMode` 未指定時の組み込み default を公式 docs から引用 or fresh プロジェクトの実機観測ログを引用
- 「`.claude/settings.local.json` は gitignore されるため新規 worktree では再生成されず、prompt 復帰する」が真かを 1 結論で記載
- `scripts/new-worktree.sh` にテンプレ配置を組み込む案を apply タスクへハンドオフする旨を明記

### Section 3: 3 案 × 5 軸比較表

| 案 | 影響半径 | 再発リスク | rollback コスト | 他プロジェクト副作用 | fresh 環境挙動 |
| --- | --- | --- | --- | --- | --- |
| 案 A: global + `cc` alias に `--dangerously-skip-permissions` | shell 全体 + 全プロジェクト | 低（global で固定） | 中（`~/.claude/settings.json` と `~/.zshrc` の 2 ファイル復元） | 高（`scripts/cf.sh` / `op run` 経路は直接影響なしの仮説。Phase 3 / 6 証跡で検証する。他 worktree の評価は変化） | bypass 化（CONDITIONAL ACCEPT 候補） |
| 案 B: project-local-first（`<project>/.claude/settings.local.json` のみ） | 当該プロジェクトのみ | 高（new worktree / new project で再発） | 低（local ファイル削除のみ） | 無し | default に戻る（prompt 復帰） |
| ハイブリッド: B を default + A を fallback | 段階的 | 中 | 中 | 中（fallback 発動条件で変化） | 状況依存 |

### Section 4: global 採用時の rollback 手順

```bash
# Step 1: バックアップ確認
ls -la ~/.claude/settings.json.bak.*
ls -la ~/.zshrc.bak.*

# Step 2: settings.json 復元
cp ~/.claude/settings.json.bak.<timestamp> ~/.claude/settings.json

# Step 3: zshrc 復元
cp ~/.zshrc.bak.<timestamp> ~/.zshrc

# Step 4: 反映
source ~/.zshrc

# Step 5: JSON validity 確認
node -e "JSON.parse(require('fs').readFileSync(process.env.HOME+'/.claude/settings.json','utf8'))"
```

> 本仕様書では手順の **読み合わせ** までで、実コマンド実行は `task-claude-code-permissions-apply-001` 側で行う。

### Section 5: 他プロジェクト副作用一覧

- `scripts/cf.sh` 経由 Cloudflare CLI 運用 → settings 変更は直接通らない想定。ただし Phase 3 / 6 証跡で確認する（`wrangler` 直接実行は新規導入しない）
- `op run --env-file=.env` 注入経路 → settings の `defaultMode` とは独立の想定。ただし Phase 3 / 6 証跡で確認する
- 他 worktree（`.worktrees/*`）→ project.local が gitignore されるため、各 worktree は独立。global 採用時のみ全 worktree が一斉に bypass 化
- `~/dev` 配下の他リポジトリで `defaultMode` 明示プロジェクト → 全件列挙し、案 A 採用後の最終値を表で再確認

### Section 6: 採用方針確定とハンドオフ箇条書き（Phase 4 成果物の集約）

`task-claude-code-permissions-apply-001` 向けハンドオフテンプレ:

- 設定変更対象ファイル: `<決定した採用案に応じて記載>`
- 変更キー: `defaultMode` / `permissions.allow` / `permissions.deny` / shell alias `cc`
- 変更値: `bypassPermissions` / Phase 2 whitelist / `--dangerously-skip-permissions` 付与有無
- rollback 手順: Section 4 を参照
- 依存タスク結果待ち: `task-claude-code-permissions-deny-bypass-verification-001`（未着なら alias 強化を採用案から除外）

## 注意事項

- **平文 `.env` を絶対に Read しない** / `cat` しない（CLAUDE.md ルール）
- API token / OAuth トークンの値は比較表 / 決定ログに転記しない
- `wrangler` 直接実行禁止（`scripts/cf.sh` 経由）— 本タスクとは無関係だが破らない
- 実 `~/.claude/settings.json` / `~/.zshrc` への書き換えは禁止（apply タスクで実施）

## canUseTool 適用範囲と制約

本タスクは LLM SDK の canUseTool callback を使わない（docs-only / spec_only タスクのため）。N/A。

## 主成果物

- `outputs/phase-5/main.md`
- `outputs/phase-5/comparison.md`

## 完了条件

- [ ] 4 層責務表が `outputs/phase-5/comparison.md` に存在する
- [ ] 3 案 × 5 軸（影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動）の比較表が完成している
- [ ] global 採用時の rollback 手順がコマンドレベルで記述されている
- [ ] 他プロジェクト副作用（`scripts/cf.sh` / `op run` / 他 worktree）への言及が 1 行以上ある
- [ ] 採用方針が 1 案に確定し、apply タスクへのハンドオフ箇条書きが記載されている
- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない

## 実行タスク

- 本文に記載済みのタスクを実行単位とする
- docs-only / spec_only の境界を維持する（実書き換えは行わない）

## 参照資料

- Phase 4: `outputs/phase-4/` を参照する
- ソース MD: `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md` §3〜§4
- 関連タスク: `task-claude-code-permissions-decisive-mode`（前提・Phase 3 / Phase 12 成果物を引用）
- 関連タスク: `task-claude-code-permissions-apply-001`（後続ハンドオフ先）
- 関連タスク: `task-claude-code-permissions-deny-bypass-verification-001`（並行・deny 軸の追記元）
- `.claude/skills/task-specification-creator/SKILL.md`

## 成果物/実行手順

- `artifacts.json` の該当 Phase outputs を正本とする
- `outputs/phase-5/main.md` と `outputs/phase-5/comparison.md` を作成し、4層責務表、比較表、rollback、ハンドオフを記録する

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは `task-claude-code-permissions-apply-001` で実行する。ここでは比較表の章立てと採用方針確定までを固定する。
