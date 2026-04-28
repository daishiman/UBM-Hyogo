# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 1 |
| 下流 | Phase 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 の調査結果を踏まえ、deny 実効性検証のための **検証プロトコル**（isolated 環境構築 +
試行コマンド + 観測項目）と、判定 NO 時の **alias フォールバック設計**（`--dangerously-skip-permissions`
を外す案）を成果物として確定する。

## 設計対象

### D-1: 検証プロトコル

公式 docs で確定しなかった場合の実機検証手順を、isolated 環境前提で設計する。

| 項目 | 設計内容 |
| --- | --- |
| 検証ディレクトリ | `/tmp/cc-deny-verify-$(date +%s)/` |
| 構成 | `bare.git`（dummy remote） + `work/`（作業 repo） |
| 配置 settings | `work/.claude/settings.local.json` に検証対象 deny pattern を記述 |
| 起動コマンド | `claude --permission-mode bypassPermissions --dangerously-skip-permissions` |
| 試行コマンド | `git push --dry-run --force origin main` / isolated path での削除系コマンド試行 / `Write(/etc/**)` 相当の安全な代替試行 |
| 観測項目 | blocked / 実行 / prompt 提示の 3 値 + 出力ログ |

### D-2: 観測対象 deny pattern セット

| ID | pattern | 検証目的 |
| --- | --- | --- |
| P-01 | `Bash(git push --force:*)` | 上流タスクで採用予定の主 deny |
| P-02 | `Bash(rm -rf /:*)` | 破壊的シェルコマンドの代表 |
| P-03 | `Write(/etc/**)` | システム書き込み deny |
| P-04 | `Bash(git push --force-with-lease:*)` | force-push 系派生 |

### D-3: 判定 NO 時の alias フォールバック差分

`cc` alias から `--dangerously-skip-permissions` を外し、`--permission-mode bypassPermissions`
のみで運用する案。settings 層の `defaultMode: "bypassPermissions"` で同等の利便性を確保する想定。

成果物 `outputs/phase-2/alias-fallback-diff.md` に before / after の diff を記録する。

### D-4: 判定 YES 時の参照情報

apply-001 タスクへ転記する：
- 公式 docs URL（取得日時付き）
- 実機検証ログテンプレート（`outputs/phase-11/verification-log.md`）パス
- Claude Code バージョン

## 設計判断

| 判断 | 採用 | 却下 | 理由 |
| --- | --- | --- | --- |
| 検証環境 | isolated `/tmp/cc-deny-verify-*` | 既存 worktree 上 | 実プロジェクト remote 誤操作リスク回避 |
| dummy remote | `bare.git` | 実 GitHub | force-push 試行を絶対安全にする |
| 補助 pattern 数 | 4 種（P-01〜P-04） | 2 種 | bypass モード下の評価器が pattern 種別で分岐する可能性を排除 |
| 判定不能時の扱い | apply-001 を alias 縮小案で前進 | apply-001 を保留 | blocker 解除を優先（保守的選択） |

## スコープ外

- whitelist の項目追加（U2 別タスク）
- MCP / hook の挙動（U4 別タスク）
- 実 settings ファイルへの反映（apply-001）

## 主成果物

- `outputs/phase-2/main.md`（設計サマリ）
- `outputs/phase-2/verification-protocol.md`（D-1 / D-2 詳細）
- `outputs/phase-2/alias-fallback-diff.md`（D-3 詳細）

## 次 Phase へのハンドオフ

- 検証プロトコル → Phase 3 で影響範囲レビュー
- alias フォールバック diff → Phase 3 で apply-001 への影響評価
- pattern セット → Phase 4 のテスト設計入力

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 1: `outputs/phase-1/main.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] D-1 / D-2 / D-3 / D-4 が成果物に揃う
- [ ] 設計判断テーブルが完成
- [ ] index.md の AC-2 / AC-5 が phase-2 成果物で達成可能と確認できる

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
