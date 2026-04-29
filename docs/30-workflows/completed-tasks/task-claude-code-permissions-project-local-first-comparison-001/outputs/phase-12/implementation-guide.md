# Implementation Guide（Part 1 中学生レベル + Part 2 開発者レベル）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 — Task 12-1 |
| 作成日 | 2026-04-28 |
| visualEvidence | NON_VISUAL |
| 採用案 | ハイブリッド（B を default + A の global `defaultMode` 変更のみ fallback。alias 強化は除外） |
| 実装担当 | `task-claude-code-permissions-apply-001` |

---

## Part 1: 中学生レベル — 「家・部屋・引き出し」の優先順位

### たとえ話

Claude Code の設定は **4 段の入れ子** になっています。

- **家のルール**（`~/.claude/settings.json`）= 家全体に効く一番外側のルール
- **家の自分メモ**（`~/.claude/settings.local.json`）= 家のルールより優先される自分専用メモ
- **部屋のルール**（`<project>/.claude/settings.json`）= その部屋（プロジェクト）に入っているときだけ効くルール
- **部屋の引き出しメモ**（`<project>/.claude/settings.local.json`）= 一番奥の引き出しに入った私物メモで、すべての中で最優先

同じ項目が複数のメモに書いてあったら、**引き出し（一番内側）を優先**する。家のルールを書き換えると全部屋に影響するけれど、引き出しメモなら自分のその部屋だけで済む。

### なぜ必要か

- 「全部屋（global）」を書き換えると、関係ない部屋（他プロジェクト）でも勝手に確認スキップになる
- 「引き出しだけ（project.local）」だと新しい部屋に引っ越したとき毎回書き直しが要る
- どこまで波及してよいかを最初に決めないと、あとで rollback が面倒になる

### 何をするか（本タスクの範囲）

- 4 段の優先順位とそれぞれの責務を 1 表にする
- 「引き出しだけで再発防止できるか」を確認する
- 「全部屋」「引き出しだけ」「両方使うハイブリッド」の 3 案を比較する
- どれを採用するかを 1 つ決め、次の実装タスクに引き継ぐ

### 結論

採用は **ハイブリッド**。普段は引き出し（project.local）に書き、新しい部屋に入ったとき家全体（global）が代わりに守る形にした。「危ない alias を全部のドアに付ける」案（`--dangerously-skip-permissions` を `cc` alias に追加）は、別の検証が終わってから判断する。

---

## Part 2: 開発者レベル

### 階層優先順位（最終値はより内側が勝つ）

```
<project>/.claude/settings.local.json   ← 最優先
  > <project>/.claude/settings.json
  > ~/.claude/settings.local.json
  > ~/.claude/settings.json              ← 最下位
```

### 評価対象キー

- `defaultMode`
- `permissions.allow`
- `permissions.deny`

### 比較対象案（再掲、Phase 5 `comparison.md` Section 3）

| 案 | 内容 | 影響半径 | 再発リスク | rollback コスト | 副作用 | fresh 環境 |
| --- | --- | --- | --- | --- | --- | --- |
| A | global `defaultMode = bypassPermissions` + `cc` alias 強化 | 高 | 低 | 中 | 中 | bypass 維持（CONDITIONAL ACCEPT） |
| B | project.local のみで bypass 維持 | 低 | **高（再発する）** | 低 | 無 | default に戻る |
| ハイブリッド | B default + A の global 部分のみ fallback | 中 | 中 | 中 | 中 | bypass 維持（CONDITIONAL ACCEPT） |

### 採用案

**ハイブリッド**:

- 主経路: `<project>/.claude/settings.local.json` の `"defaultMode": "bypassPermissions"`
- Fallback: `~/.claude/settings.json` の `"defaultMode": "bypassPermissions"`（fresh 環境補強）
- 除外: `~/.zshrc` の `cc` alias に `--dangerously-skip-permissions` を追加することは **本タスクの採用案に含めない**（`task-claude-code-permissions-deny-bypass-verification-001` 結果待ち）

### 他プロジェクト副作用観点

| 対象 | 影響 |
| --- | --- |
| `scripts/cf.sh` 経由 Cloudflare CLI 運用 | 直接副作用なし。global の `permissions.deny` に `Bash(wrangler *)` を新設しない |
| `op run --env-file=.env` 注入経路 | settings 階層と独立、直接副作用なし |
| 他 worktree | global 変更時、project.local 未配置の worktree は一斉に bypass 化（CONDITIONAL ACCEPT） |
| `~/dev/**` 配下他リポジトリ | `defaultMode` 明示プロジェクトは勝ち順序により影響なし |

### Rollback 手順（global 採用時）

詳細は `outputs/phase-5/comparison.md` Section 4 を参照。要約:

```bash
ls -la ~/.claude/settings.json.bak.*
cp ~/.claude/settings.json.bak.<timestamp> ~/.claude/settings.json
node -e "JSON.parse(require('fs').readFileSync(process.env.HOME+'/.claude/settings.json','utf8'))"
```

> 本タスクでは読み合わせのみ。実コマンド実行は apply タスクで行う。

### 視覚証跡

**NON_VISUAL** のため Phase 11 スクリーンショット不要。代替証跡は:

- `outputs/phase-11/manual-smoke-log.md`（主証跡 = AC-8）
- `outputs/phase-10/final-review-result.md`（AC 全件判定）

### 実装ハンドオフ先

- 実装タスク: `task-claude-code-permissions-apply-001`
- 並行参照: `task-claude-code-permissions-deny-bypass-verification-001`（deny 実効性確認）
- apply タスク指示書の「参照」欄に本ドキュメントと `outputs/phase-5/comparison.md` を追記する依頼を `unassigned-task-detection.md` / `documentation-changelog.md` に内包

### 実装時のチェックリスト（apply タスク向け）

- [ ] `<project>/.claude/settings.local.json` に `"defaultMode": "bypassPermissions"` を設定 / 確認
- [ ] `~/.claude/settings.json` を timestamp バックアップ（`cp ~/.claude/settings.json ~/.claude/settings.json.bak.$(date +%Y%m%d-%H%M%S)`）
- [ ] `~/.claude/settings.json` の `defaultMode` を `bypassPermissions` に変更（fallback）
- [ ] `~/.zshrc` は **本採用案では変更しない**（alias 強化は除外）
- [ ] `~/dev/**/.claude/settings.json` を grep し件数確認（実値転記禁止）
- [ ] `scripts/cf.sh` / `op run` 経路に副作用がないことを設計レビュー
- [ ] rollback コマンドを dry-run で読み合わせ
- [ ] Issue #142 は CLOSED のまま（本実装タスク完了後も再オープン不要）

## 参照資料

- `outputs/phase-5/comparison.md`
- `outputs/phase-3/impact-analysis.md`
- `outputs/phase-10/final-review-result.md`
- `outputs/phase-11/manual-smoke-log.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`
- CLAUDE.md
