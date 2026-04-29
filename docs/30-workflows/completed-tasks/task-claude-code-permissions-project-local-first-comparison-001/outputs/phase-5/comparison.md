# 比較表本体（4 層 × 5 軸 × 3 案 + rollback + ハンドオフ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 区分 | 実装成果物（比較設計の正本） |
| 作成日 | 2026-04-28 |
| visualEvidence | NON_VISUAL |
| 採用案 | **ハイブリッド（B を default、A の global 変更のみ fallback。alias 強化は deny 実効性確認後）** |

---

## Section 1: 4 層責務表（AC-1）

### 1.1 表

| 階層 | パス（例） | 想定利用者 | 変更頻度 | git 管理可否 | 担当キー（例） | 主な責務 |
| --- | --- | --- | --- | --- | --- | --- |
| global | `~/.claude/settings.json` | マシン所有者 | 低 | 管理外 | `defaultMode` / `permissions.allow` / `permissions.deny` / `env`（key 名のみ） | マシン横断の既定 |
| global.local | `~/.claude/settings.local.json` | マシン所有者（override） | 中 | 管理外（実機固有） | `defaultMode`（マシン上書き）/ 機微値 | 実機固有の override |
| project | `<project>/.claude/settings.json` | プロジェクト共有 | 低 | コミット | `permissions.allow` / `permissions.deny` / 共有モード | チーム横断の共有設定 |
| project.local | `<project>/.claude/settings.local.json` | 個人開発者（当該プロジェクト） | 中〜高 | gitignore | `defaultMode`（個人開発時 bypass）/ 個人秘密 | 当該プロジェクト限定の個人 override |

### 1.2 precedence notation

- 評価順序（読み込み）: `global → global.local → project → project.local`
- 勝ち優先順位（最終値）: `project.local > project > global.local > global`

> 出典: Anthropic 公式 Claude Code settings docs（https://docs.anthropic.com/en/docs/claude-code/settings）および `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §1。

### 1.3 本タスクで触るかどうか

| 階層 | 本タスク（spec_only） | apply タスク |
| --- | --- | --- |
| global | 読み取りのみ | 採用案ハイブリッドの fallback で書き換え対象 |
| global.local | 触らない（実値含むため Read 自体しない） | 触らない |
| project | 読み取りのみ | 採用案次第（基本触らない） |
| project.local | 読み取りのみ | 採用案ハイブリッドの主配置先 |

---

## Section 2: project-local-first の再発判定（AC-2）

### 2.1 結論（1 行）

**project-local-first（案 B）単独では、新規 worktree / fresh プロジェクトで `defaultMode` が default に戻り prompt 復帰が発生する（再発する）。**

### 2.2 根拠

| 項目 | 内容 |
| --- | --- |
| 公式 docs | Claude Code settings docs の `defaultMode` と settings 階層説明を参照（https://docs.anthropic.com/en/docs/claude-code/settings）。未指定時に project.local が補完される仕様は確認できない |
| 実機観測 | 本タスクでは実書き換え禁止のため未実施。`<project>/.claude/settings.local.json` は通常 gitignore のため、新 worktree 作成時には未配置。`scripts/new-worktree.sh` も当該設定を生成しないことを apply タスクの事前確認項目へ渡す |
| 帰結 | fresh worktree では、project.local が未配置 + global で `bypassPermissions` 未設定 → prompt 復帰 |

### 2.3 補強オプション（apply タスクへのハンドオフ）

- (a) `scripts/new-worktree.sh` への `.claude/settings.local.json` テンプレ配置を組み込む（未タスク化候補）
- (b) ハイブリッドで global fallback を持つ（本タスクで採用）
- (c) project.local のテンプレを別パスに用意し、worktree 作成時に手動 cp（運用負荷あり）

---

## Section 3: 3 案 × 5 軸比較表（AC-3, AC-7）

### 3.1 評価値

| 案 | AX-1 影響半径 | AX-2 再発リスク | AX-3 rollback コスト | AX-4 他プロジェクト副作用 | AX-5 fresh 環境挙動 |
| --- | --- | --- | --- | --- | --- |
| 案 A: global + `cc` alias に `--dangerously-skip-permissions` | **高（shell + 全プロジェクト）** `[シナリオ A〜D]` | 低（global と alias で固定）`[Phase 3 R-2]` | 中（`~/.claude/settings.json` + `~/.zshrc` の 2 ファイル復元）`[Section 4]` | 中（`~/dev/**` 配下 grep + 全 worktree 一斉 bypass + shell alias 波及）`[impact-analysis §3.3]` | bypassPermissions 維持（CONDITIONAL ACCEPT）`[シナリオ C / D]` |
| 案 B: project-local-first | **低（当該プロジェクトのみ）** `[シナリオ A〜D]` | **高（new worktree / new project で再発）**`[Phase 3 R-2]` | 低（local ファイル削除のみ）`[Section 4]` | 無（直接副作用なし）`[impact-analysis §3.1〜3.3]` | default 挙動に戻る（**再発**）`[シナリオ C / D]` |
| ハイブリッド: B default + A の global 変更のみ fallback | 中（基本は B、fresh 時のみ global へ）`[シナリオ A〜D]` | 中（fallback で抑制）`[Phase 3 R-5]` | 中（state 依存の 1〜2 ファイル復元）`[Section 4]` | 中（fallback 発動条件で変化）`[impact-analysis §3.3]` | bypassPermissions 維持（CONDITIONAL ACCEPT）`[シナリオ C / D]` |

### 3.2 シナリオ A〜D 対応

| シナリオ | 状況 | 案 A 最終値 | 案 B 最終値 | ハイブリッド最終値 |
| --- | --- | --- | --- | --- |
| A | 全層配置 | bypassPermissions | bypassPermissions | bypassPermissions |
| B | project.local のみ | bypassPermissions | bypassPermissions | bypassPermissions |
| C | global + project のみ（fresh worktree） | bypassPermissions | default（再発） | bypassPermissions（global fallback） |
| D | global のみ | bypassPermissions | default（再発） | bypassPermissions（global fallback） |

### 3.3 環境ブロッカー

- `--dangerously-skip-permissions` を採用案に含めるかは `task-claude-code-permissions-deny-bypass-verification-001` の deny 実効性結果待ち
- 結果未着の場合、ハイブリッドの fallback は「global の `defaultMode` を `bypassPermissions` に変更する」だけに限定し、alias 強化は **本タスクの採用案から除外**

### 3.4 採用要素の分解（案 A の粒度補正）

| 要素 | 内容 | 本タスクの扱い |
| --- | --- | --- |
| A1: global `defaultMode` fallback | `~/.claude/settings.json` の `defaultMode` を `bypassPermissions` にする | ハイブリッドの fallback として採用 |
| A2: shell alias 強化 | `cc` alias に `--dangerously-skip-permissions` を追加する | deny 実効性検証完了まで不採用 |

> 3案比較では旧案 A を「global + alias」の複合案として比較し、採用方針では A1 のみを取り込む。これにより比較表と実装ハンドオフの粒度差を明示する。

---

## Section 4: global 採用時の rollback 手順（AC-5）

> 本仕様書では **読み合わせのみ**。実コマンド実行は `task-claude-code-permissions-apply-001` 側で行う。dry-run の TC-04 は実行禁止。

### 4.1 事前: バックアップ取得（apply タスク側）

```bash
# apply タスクで書き換え前に取得しておくバックアップ
TS=$(date +%Y%m%d-%H%M%S)
if [ -f ~/.claude/settings.json ]; then
  cp ~/.claude/settings.json ~/.claude/settings.json.bak.$TS
else
  touch ~/.claude/settings.json.absent.$TS
fi

if [ -f ~/.zshrc ]; then
  cp ~/.zshrc ~/.zshrc.bak.$TS
else
  touch ~/.zshrc.absent.$TS
fi
```

### 4.2 復元手順

```bash
# Step 1: バックアップ確認
ls -la ~/.claude/settings.json.bak.*
ls -la ~/.zshrc.bak.*

# Step 2: settings.json 復元
if [ -f ~/.claude/settings.json.bak.<timestamp> ]; then
  cp ~/.claude/settings.json.bak.<timestamp> ~/.claude/settings.json
elif [ -f ~/.claude/settings.json.absent.<timestamp> ]; then
  rm -f ~/.claude/settings.json
else
  echo "missing settings backup marker" >&2
  exit 1
fi

# Step 3: zshrc 復元（alias 強化を入れた場合のみ。本タスクの採用範囲では不要）
if [ -f ~/.zshrc.bak.<timestamp> ]; then
  cp ~/.zshrc.bak.<timestamp> ~/.zshrc
elif [ -f ~/.zshrc.absent.<timestamp> ]; then
  rm -f ~/.zshrc
fi

# Step 4: 反映
if [ -f ~/.zshrc ]; then
  source ~/.zshrc
fi

# Step 5: JSON validity 確認
node -e "JSON.parse(require('fs').readFileSync(process.env.HOME+'/.claude/settings.json','utf8'))"
```

### 4.3 案 B 採用時の rollback（参考）

```bash
# project.local を削除するだけで戻る
rm <project>/.claude/settings.local.json
```

---

## Section 5: 他プロジェクト副作用一覧（AC-6）

| 対象 | 案 A の影響 | 案 B の影響 | ハイブリッドの影響 | 備考 |
| --- | --- | --- | --- | --- |
| `scripts/cf.sh` 経由 Cloudflare CLI 運用 | 直接副作用なし。ただし global の `permissions.deny` に `Bash(wrangler *)` を新設しない | なし | A と同じ条件 | `wrangler` 直接実行禁止（CLAUDE.md） |
| `op run --env-file=.env` 注入経路 | settings 階層と独立。直接副作用なし | なし | A と同じ条件 | 1Password CLI による動的注入は session 外 |
| 他 worktree（`.worktrees/*`） | global 変更時、全 worktree が一斉に bypass 化 | 当該 worktree 限定 | fallback 発動時のみ全 worktree に波及 | project.local 未配置時のみ |
| `~/dev/**` 配下の他リポジトリ | `defaultMode` 明示プロジェクトは勝ち順序により影響なし。明示なしは bypass 化 | なし | A と同じ条件 | 件数のみ grep で記録、実値転記禁止 |
| `cc` alias（`--dangerously-skip-permissions`） | shell 全体に波及 | なし | **本タスクの採用案から除外**（deny 検証待ち） | 採用は別タスクで判断 |

---

## Section 6: 採用方針確定とハンドオフ箇条書き（AC-4, AC-9）

### 6.1 採用方針

**採用: ハイブリッド（B を default + A の global `defaultMode` 変更のみ fallback、alias 強化は除外）**

| 採用要素 | 配置 | 値 |
| --- | --- | --- |
| 主経路（B） | `<project>/.claude/settings.local.json` | `"defaultMode": "bypassPermissions"` |
| Fallback（A 部分） | `~/.claude/settings.json` | `"defaultMode": "bypassPermissions"` |
| Alias 強化（A の shell 部分） | `~/.zshrc` | **採用しない**（deny 実効性確認後の別タスクで再評価） |

### 6.2 `task-claude-code-permissions-apply-001` 向けハンドオフテンプレ

- **設定変更対象ファイル**:
  - `<project>/.claude/settings.local.json`（主経路、すでに存在する場合は値確認のみ）
  - `~/.claude/settings.json`（fallback、`defaultMode` のみ書き換え）
- **変更キー**:
  - `defaultMode` を `bypassPermissions` に
  - `permissions.allow` / `permissions.deny` は本タスクの範囲外（影響を変えない）
- **変更対象外**:
  - `~/.zshrc` の `cc` alias 強化（`--dangerously-skip-permissions` の追加）は本タスクの採用案に含めない
- **rollback 手順**: Section 4 を参照
- **依存タスク結果待ち**:
  - `task-claude-code-permissions-deny-bypass-verification-001`（未着なら alias 強化を採用案から除外維持）
- **未タスク化候補**:
  - `scripts/new-worktree.sh` への `.claude/settings.local.json` テンプレ配置組込み

### 6.3 参照欄追記依頼

apply タスク指示書（`docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`）の「参照」欄に、以下を追記する依頼を Phase 12 `documentation-changelog.md` または `unassigned-task-detection.md` に内包する:

- `outputs/phase-5/comparison.md`（本ファイル）
- `outputs/phase-3/impact-analysis.md`
- `outputs/phase-1/main.md`

---

## 参照資料

- `phase-05.md` Section 1〜6
- `outputs/phase-1/main.md`
- `outputs/phase-2/layer-responsibility-table.md` / `comparison-axes.md`
- `outputs/phase-3/main.md` / `impact-analysis.md`
- `outputs/phase-4/test-scenarios.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`
- CLAUDE.md「Claude Code 設定」「シークレット管理」「Cloudflare 系 CLI 実行ルール」
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/`
