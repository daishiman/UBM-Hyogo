# Phase 3 成果物: 後方互換性評価 (AC-8)

既存 `LOGS.md`（555 行 / aiworkflow-requirements）と `SKILL-changelog.md`（310 行 / task-specification-creator）の
history 保持方針を 3 案で評価し、推奨案を確定する。

## 1. 評価する選択肢

| # | 方式 | 概要 |
| --- | --- | --- |
| 1 | `_legacy.md` 退避 | 既存ファイルを `LOGS/_legacy.md` などにリネームし、A-2 fragment 群と並存させる |
| 2 | git 履歴のみで保持 | working tree からは削除し、必要時は `git log -p` で参照 |
| 3 | `.gitignore` + 既存 commit 維持 | 追跡解除しつつ working tree には残す |

## 2. 評価マトリクス

| 観点 | (1) `_legacy.md` 退避 | (2) git 履歴のみ | (3) gitignore + 残置 |
| --- | --- | --- | --- |
| history 可視性 | ◎ tree 上で読める | △ git log 必須 | ○ tree 上で読める |
| render script 統合 | ◎ legacy も読み込める設計可 | × 別経路必要 | △ 追跡外なので worktree 間で異なる |
| 並列 commit 衝突 | ◎ 退避後は不変なので衝突源消滅 | ◎ tree から消えるので衝突源なし | × untracked 化前の最終 commit のみ追跡 → 衝突可能 |
| 移行コスト | 低（git mv 1 回） | 中（tree から削除） | 中（cached 削除 + .gitignore） |
| 利用者影響 | 低（path 変更のみ） | 中（参照経路が変わる） | 高（worktree 間で内容差） |
| AC-8 充足 | ◎ | △ | × |

## 3. 推奨: **案 (1) `_legacy.md` 退避方式**

### 理由

1. **history 完全保持**: 555 行の追記 history が tree 上で残り、render script から横断参照可能
2. **衝突源の完全消滅**: 退避後は immutable（A-2 移行後は誰も追記しない）→ 並列 commit 競合 0
3. **render-api との親和性**: render script が `LOGS/_legacy.md` を「特殊 fragment」として扱う設計が低コスト
4. **AC-8 完全充足**: AC-8「history 保持方針が評価済」を最も強く満たす

## 4. 移行手順（実装は別タスク）

```bash
# 例: aiworkflow-requirements skill
SKILL=.claude/skills/aiworkflow-requirements

# 1. fragment ディレクトリを準備
mkdir -p $SKILL/LOGS

# 2. 既存 LOGS.md を _legacy.md として退避
git mv $SKILL/LOGS.md $SKILL/LOGS/_legacy.md

# 3. _legacy.md 冒頭に退避マーカーを付与（実装タスクで行う）
# ---
# legacy: true
# imported_at: 2026-04-28T00:00:00Z
# original_path: LOGS.md
# ---

# 4. commit
git commit -m "refactor(skill): migrate LOGS.md to fragment layout"
```

`SKILL-changelog.md` 同様、`changelog/_legacy.md` へ退避。

## 5. render-api 上の扱い

- `_legacy.md` は front matter `kind: legacy` を持つ単一巨大 fragment として扱う
- render 出力の末尾（最古）に常に表示
- `--since` フィルタには非対応（timestamp が rangeで意味を失うため）

## 6. 既存利用者への影響

| 利用者 | 影響 | 緩和策 |
| --- | --- | --- |
| Claude（skill 経由） | `LOGS.md` 直接 read が動かなくなる | render-api 経由へ誘導。SKILL.md に新ガイドライン追記 |
| 開発者（手動 cat） | 旧 path が消える | `_legacy.md` の path をリリースノート・SKILL.md に明記 |
| hook（自動追記） | 書き込み先の path 変更 | 実装タスク Phase 6 で hook を fragment 生成 API に切替 |
| CI / lint | ledger path を hardcode していたら破壊 | Phase 4 で grep 確認、Phase 9 品質ゲートで再確認 |

## 7. AC-8 充足根拠

- 3 案を比較評価し、推奨を選定
- 推奨案 (1) は history を 100% 保持し、render-api からも参照可
- 既存利用者への影響と緩和策を表で網羅
- 移行手順を git コマンドレベルまで具体化
