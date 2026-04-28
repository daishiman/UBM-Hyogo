# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-28 |
| 上流 | Phase 2 |
| 下流 | Phase 4 (テスト設計) |
| 状態 | pending |

## 目的

Phase 2 で確定した検証プロトコル / alias フォールバック設計に対し、**安全性 / 影響範囲 / 残存リスク**
の観点でレビューを行い、Phase 4 以降に進める前にブロッカーを抽出する。

## レビュー観点

### R-A: 安全性レビュー

| 項目 | 確認内容 | 想定指摘 |
| --- | --- | --- |
| isolated 環境境界 | `cd /tmp/cc-deny-verify-*` から外に出ない手順か | working directory 漏れ防止が runbook に必要 |
| dummy remote 固定 | `git remote -v` で bare path のみ表示されるか | push 試行直前の二重確認手順を必須化 |
| 実 worktree からの隔離 | Claude Code の起動 cwd が実 worktree でないか | 起動前の `pwd` 記録を必須化 |
| バージョン記録 | `claude --version` を必ず記録しているか | 検証ログテンプレートに項目追加 |

### R-B: 影響範囲レビュー（impact-analysis.md）

| 影響対象 | 影響有無 | 説明 |
| --- | --- | --- |
| 実プロジェクトの remote / branch | なし（isolated 限定） | `/tmp/cc-deny-verify-*` から出ない |
| グローバル `~/.claude/settings.json` | なし | 検証 settings は isolated repo 内 |
| `~/.zshrc` | なし | alias は変更しない |
| 上流タスク（decisive-mode）の Phase 3 R-2 | あり（解除予定） | 判定結果を R-2 欄に追記 |
| 下流タスク（apply-001） | あり（前提条件確定） | 判定 YES/NO で alias 差分を切替 |
| MCP / hook 関連タスク（U4） | なし | 別タスクのスコープ |

### R-C: 残存リスク（更新可能リスト）

| リスクID | 内容 | 影響度 | 確率 | 対策 |
| --- | --- | --- | --- | --- |
| R-1 | 公式 docs に該当記述がなく実機検証も判定不能 | 中 | 中 | 「判定不能」を結論として記録、apply-001 で alias 縮小案をデフォルト |
| R-2 | Claude Code バージョン差で挙動が変わる | 中 | 中 | `claude --version` をログ記録、後続バージョンで再検証可能化 |
| R-3 | dummy ref のつもりが実 ref を指していた | 高 | 低 | `git remote -v` を検証開始前と push 試行直前の双方で確認 |
| R-4 | bypass + skip 下で deny が pattern 種別ごとに分岐挙動 | 中 | 低 | 観測 pattern を 4 種（P-01〜P-04）に拡張済み（Phase 2 D-2） |
| R-5 | 検証中に AI が誤って実 worktree のシェルを起動 | 高 | 低 | runbook に `pwd` 確認 step を必須化 |

## レビュー判断

| 判定対象 | レビュー結果 | 条件 |
| --- | --- | --- |
| Phase 4 着手 | 可 | R-1〜R-5 が runbook で対策される前提 |
| Phase 5 着手 | 可 | R-3 / R-5 の対策が runbook に記述される前提 |
| 検証実施 | **本タスクスコープ外** | spec_created で完了 |

## スコープ外

- 検証実施そのもの（spec_created のため未実施）
- 上流タスク R-2 欄の実書き換え（Phase 12 の system-spec-update-summary で扱う）

## 主成果物

- `outputs/phase-3/main.md`（レビューサマリ + 判定）
- `outputs/phase-3/impact-analysis.md`（R-B 詳細）

## 次 Phase へのハンドオフ

- R-C の残存リスクを Phase 4 のテスト設計に反映
- 安全性確認項目（R-A）を Phase 5 の runbook 必須項目化
- impact-analysis を Phase 12 の documentation-changelog 入力にする

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 2: `outputs/phase-2/`
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] R-A / R-B / R-C が成果物に揃う
- [ ] 残存リスクが 0 件または対策付きで記録されている
- [ ] Phase 4 着手判定が確定している

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
