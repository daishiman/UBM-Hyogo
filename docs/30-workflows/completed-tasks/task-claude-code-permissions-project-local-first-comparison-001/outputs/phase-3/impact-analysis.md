# 影響分析（案 A 採用時の他プロジェクト副作用）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 区分 | R-3 影響分析 |
| 作成日 | 2026-04-28 |
| visualEvidence | NON_VISUAL |
| 注意 | 実値・API token・OAuth トークンは一切記録しない。grep メタ情報（件数）のみ記録 |

## 1. apply タスク事前確認手順（読み取りのみ）

```bash
# defaultMode を明示しているプロジェクト件数（値は記録しない）
grep -rln '"defaultMode"' ~/dev/**/.claude/settings.json 2>/dev/null | wc -l

# settings.local.json の存在確認（値は読まない）
ls -la ~/.claude/settings.local.json 2>/dev/null

# cc 関連 alias の有無（key 行のみ）
grep -E '^\s*alias\s+cc=' ~/.zshrc ~/.config/zsh/conf.d/*-claude.zsh 2>/dev/null
```

> 上記はキー / 件数 / 存在のみを得る読み取り操作。実値の `cat` / `Read` は禁止（CLAUDE.md ルール）。

## 2. シナリオ A〜D 別 最終 `defaultMode`

| シナリオ | global | global.local | project | project.local | 案 A 最終値 | 案 B 最終値 |
| --- | --- | --- | --- | --- | --- | --- |
| A | 配置 | 配置 | 配置 | 配置 | bypassPermissions | bypassPermissions |
| B | 配置 | 未配置 | 未配置 | 配置 | bypassPermissions | bypassPermissions |
| C | 配置 | 未配置 | 配置 | **未配置（fresh worktree）** | bypassPermissions（global 経由） | default 挙動（**再発**） |
| D | 配置 | 未配置 | 未配置 | 未配置 | bypassPermissions | default 挙動（**再発**） |

## 3. 他プロジェクト副作用一覧

### 3.1 `scripts/cf.sh` 経由 Cloudflare CLI 運用

| 観点 | 案 A の影響 | 案 B の影響 |
| --- | --- | --- |
| 実行経路 | `scripts/cf.sh` は `op run --env-file=.env` 経由で `wrangler` を起動。Claude Code の settings 階層は経由しない | 同上 |
| `defaultMode` 変更の波及 | なし（CLI は Claude Code session 外で実行されるため） | なし |
| `permissions.deny` への混入リスク | `Bash(wrangler *)` を global の `permissions.deny` に新たに追加するような提案を **しない** | 同上 |
| 結論 | 直接副作用なし。ただし global の `permissions.deny` を新設する案を本タスクから出さない（CLAUDE.md `wrangler` 直接実行禁止に整合） | 直接副作用なし |

### 3.2 `op run --env-file=.env` 注入経路

| 観点 | 案 A の影響 | 案 B の影響 |
| --- | --- | --- |
| 実行経路 | `op run` は 1Password CLI が環境変数を動的注入。Claude Code の settings 階層と独立 | 同上 |
| `cc` alias 強化（`--dangerously-skip-permissions`）の影響 | `cc` を起動した shell session 内では適用されるが、`op run` 自体には波及しない | 該当なし（alias 変更なし） |
| 結論 | 直接副作用なし | 直接副作用なし |

### 3.3 他 worktree（`.worktrees/*`）

| 観点 | 案 A の影響 | 案 B の影響 |
| --- | --- | --- |
| `defaultMode` 最終値 | global の値が全 worktree で適用される（project.local 未配置時） | 当該 worktree の project.local のみで決定。他 worktree に波及しない |
| 新 worktree 作成時の挙動 | `scripts/new-worktree.sh` で project.local が未生成でも global が bypass を保つ | project.local 未配置のため **再発する**（R-2 結論） |
| 結論 | 全 worktree が一斉に bypass 化（CONDITIONAL ACCEPT 候補） | 案 B は worktree ごとに手作業介入が必要 |

### 3.4 `~/dev` 配下の他リポジトリで `defaultMode` 明示プロジェクト

- 件数: apply タスクで上記 §1 の grep コマンドにより現状確認（値は記録しない、件数のみ）
- 案 A 採用後の最終値変化: 各リポジトリの project / project.local が `defaultMode` を明示している場合は、勝ち優先順位（project.local > project > global.local > global）により global 変更の影響を受けない
- 影響を受けるのは「全層で `defaultMode` を明示していない」リポジトリのみ
- apply タスクで全件列挙 + 影響有無を再確認する

## 4. shell alias（`cc`）強化の影響

| 観点 | 内容 |
| --- | --- |
| `--dangerously-skip-permissions` 効果範囲 | `cc` で起動した Claude Code session 全体（プロジェクト横断） |
| `permissions.deny` の実効性 | **未確認**（`task-claude-code-permissions-deny-bypass-verification-001` 待ち）。未着なら本タスクから alias 強化案を除外 |
| rollback 経路 | `~/.zshrc` のバックアップから当該行を復元、`source ~/.zshrc` で反映 |

## 5. 集約判定

| 軸 | 案 A 評価 | 案 B 評価 | ハイブリッド評価 |
| --- | --- | --- | --- |
| 影響半径 | 高（shell + 全プロジェクト） | 低（当該プロジェクト） | 中（基本は B、fresh 時のみ A） |
| 再発リスク | 低 | **高**（再発する） | 中 |
| rollback コスト | 中（2 ファイル復元） | 低（ファイル削除） | 中 |
| 他プロジェクト副作用 | 中（grep 件数 + 全 worktree 一斉 bypass） | 無 | 中 |
| fresh 環境挙動 | bypass 維持（CONDITIONAL ACCEPT） | default 復帰 | bypass 維持（fallback 経由、CONDITIONAL ACCEPT） |

## 6. R-3 結論

- 案 A: CONDITIONAL ACCEPT（個人開発マシン限定 + deny 実効性確認後）
- 案 B: ACCEPT（再発リスクは手作業介入か `scripts/new-worktree.sh` 改修で吸収）
- ハイブリッド: ACCEPT（推奨。R-5 で採用候補に格上げ）

## 7. 参照資料

- `phase-03.md` R-3
- `outputs/phase-2/comparison-axes.md` AX-4
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md`
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」
