# Phase 3 — review.md

## Status

completed

## 1. 4 条件の詳細評価

### 価値性

| 観点 | 内容 |
| --- | --- |
| 誰の | 全コントリビュータ（特に worktree 並列開発者） |
| どのコストを | (1) 無関係 indexes diff の手動 revert、(2) hook の手動配布、(3) post-merge 由来の review ノイズ |
| どれだけ | PR ごとに 2 ファイル diff (~600 行) の混入を 0 件化。worktree 30+ 件への hook 同期工数を `pnpm install` 1 回に集約。 |

### 実現性

| 観点 | 内容 |
| --- | --- |
| 初回スコープ厚み | yaml 1 + shell 2 + package.json 修正 + runbook 1 本。実装は < 200 行想定。 |
| 技術的不確実性 | 低。lefthook は v1 系で安定。GitHub Actions / Cloudflare Workers との衝突なし。 |
| 依存ブロッカー | `task-conflict-prevention-skill-state-redesign` が先行タスクだが、本タスク設計には影響しない（merge=ours 戦略は前提として保つ） |

### 整合性

| 観点 | 内容 |
| --- | --- |
| 責務境界 | lefthook = local fast gate / GitHub Actions = authoritative gate。両者を混同しない。 |
| 状態所有権 | `lefthook.yml` が単一正本。`.git/hooks/*` は派生物。 |
| 依存関係 | `pnpm install` → `prepare` script → `lefthook install` → `.git/hooks/*` 配置、の一方向フロー |
| 既存仕様との衝突 | `.gitattributes merge=ours` を保持。`scripts/cf.sh` 経由の `wrangler` 強制と衝突しない |

### 運用性

| 観点 | 内容 |
| --- | --- |
| 導入後の verify | `lefthook run pre-commit --files <list>` / CI で hook 出力 diff |
| resume | `pnpm install` で hook が再 install される（idempotent） |
| spec sync | Phase 12 で system-spec / changelog 更新 |
| 監査 | `.git/hooks/*` のヘッダ行が lefthook 由来であることを grep で検証可能 |

## 2. 因果ループ

### 強化ループ R1（旧運用での悪循環）

```
post-merge 自動再生成 → indexes diff が PR に混入 → reviewer 混乱 → revert 工数増
            ↑                                                              ↓
            └──────────── 開発者が再 merge → diff 再発 ←──────────────────┘
```

### バランスループ B1（新運用）

```
lefthook 集約 → hook 設定が yaml 1 ファイル化 → review 性向上 → hook 改修サイクル健全化
                       ↓
              post-merge 副作用なし → PR diff から indexes が消える
```

## 3. KJ 法クラスタ（要件レビュー時に出た論点）

| クラスタ | 論点 | 結論 |
| --- | --- | --- |
| Hook 配布 | `.git/hooks/*` を直書きすると worktree ごとに同期できない | lefthook で集約 |
| 再生成タイミング | post-merge は速いが副作用が強い | 明示コマンドへ分離 |
| CI との重複 | 同じ check を local/CI で 2 重実行 | 速度差で正当化（local = fast feedback / CI = authoritative） |
| 既存資産 | 旧 hook の通知ロジックは有用 | 移植する（削除せず） |

## 4. 戦略仮説

- 仮説: hook を yaml 集約することで、今後の DevEx 系タスク（branch protection / worktree isolation / claude permissions）も yaml/declarative 起点で設計できるようになる。
- 検証: 後続タスク `task-worktree-environment-isolation` 起動時に lefthook lane を流用できるか確認。

## 5. 反対意見への応答

| 反対意見 | 応答 |
| --- | --- |
| 「husky の方が広く使われている」 | husky は Node 必須。Go バイナリの lefthook の方が CI/Worker 環境で安定。 |
| 「post-merge 再生成は便利だった」 | 便利さより無関係 diff のコストが大きい。明示実行 + CI 検証で代替する。 |
| 「shell 化せず yaml inline でよい」 | inline は diff レビュー時に行レベル粒度が粗くなる。スクリプト化を維持。 |

## 6. 結論

設計は GO。Phase 4 でテスト設計に進む。
