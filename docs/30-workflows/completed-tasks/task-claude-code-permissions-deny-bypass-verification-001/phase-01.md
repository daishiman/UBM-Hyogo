# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-deny-bypass-verification-001 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| 上流 | - |
| 下流 | Phase 2 (設計) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |

## 目的

`--dangerously-skip-permissions` 適用時に `permissions.deny` が実効するか否かの判定に必要な
**入力情報を確定する**。具体的には、Anthropic 公式 docs の該当ページ群を一次調査し、明示記述の
有無を確定したうえで、Phase 2 以降の検証プロトコル設計に必要な要件 / 非要件 / スコープ外を整理する。

## 真の論点

1. Anthropic 公式 Claude Code docs に `permissions.deny` と `--dangerously-skip-permissions` の
   優先関係を **明示する記述** が存在するか
2. 公式記述が存在しない場合に、isolated 環境で **実機検証** を行うために必要な前提条件は何か
3. 検証で観測すべき deny pattern は何か（`Bash(git push --force:*)` / `Bash(rm -rf /:*)` / `Write(/etc/**)` 等）
4. 判定が NO（deny 不実効）と確定した場合、上流タスク（decisive-mode）の設計をどこまで巻き戻すか
5. 検証ログは AI コンテキストに混入しても安全な範囲のみ記録するための非機密化ルールは何か

## P50 チェック

| 項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在するか | No | docs-only / spec_created |
| upstream にマージ済みか | No | - |
| 前提タスクが完了済みか | Yes | task-claude-code-permissions-decisive-mode が spec_created で完了 |

> **本タスクは `workflow: spec_created`**。コードは書かずドキュメントのみ。
> `implementation_mode: "new"` は将来の検証実施タスクが参照する。

## 一次調査要件（公式 docs）

実値・トークンを AI コンテキストへ持ち込まない。記録するのは URL / 見出し / スニペット（最小限の引用）のみ。

| 調査対象 | 想定 URL（要更新） | 抽出すべき情報 |
| --- | --- | --- |
| Claude Code permissions ページ | docs.anthropic.com の Claude Code セクション | `permissions.allow` / `permissions.deny` の評価優先度 |
| Claude Code CLI flags ページ | 同上 | `--dangerously-skip-permissions` の挙動定義 |
| Claude Code settings reference | 同上 | `defaultMode` と `--permission-mode` の関係 |
| changelog / release notes | 同上 | `--dangerously-skip-permissions` 導入時の文脈 / 変更履歴 |

## 既知の事実（上流タスクからの引き継ぎ）

| 観測 | 出典 | 状態 |
| --- | --- | --- |
| `permissions.deny` が skip 環境下で実効するか UNKNOWN | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md` R-2 | BLOCKER |
| skip 環境下の挙動を公式 docs から取得できなかった | 同上 | docs-not-found |
| isolated 検証手順は未策定 | 上流タスクのスコープ外 | 本タスクで策定 |

## 要件

### 機能要件

- F-1: 公式 docs 一次調査観点（URL 候補 / スニペット記録形式 / 該当なし時の扱い）を一意に確定する
- F-2: 実機検証が必要な場合に備え、deny 実効性を観測すべき pattern セットを列挙する
- F-3: 判定 YES / NO / 判定不能の各ケースで下流タスク（apply-001）への反映方針を確定する
- F-4: 公式 docs 由来の出典 URL は半永久的に追跡できるよう、取得日時 / バージョン情報を記録する

### 非機能要件

- N-1: 設計のみで完結し、本タスクで実 settings / 実 alias を変更しない
- N-2: 検証ログには API token / OAuth token / `.env` 実値を一切残さない
- N-3: 検証は必ず isolated 環境（`/tmp/cc-deny-verify-*` / dummy ref / dry-run）に限定
- N-4: Claude Code CLI バージョンを記録し、後続バージョンでの再検証可能性を確保

## スコープ外

- 実 settings ファイル（`~/.claude/settings.json` 等）への書き込み
- `~/.zshrc` の実書き換え
- MCP server / hook の permission 挙動検証（U4 として別タスク）
- whitelist 項目の追加・拡張
- project-local-first 案との比較設計（U3 として別タスク）

## タスク分類

- **タスク種別**: verification (docs-only / spec_created)
- **UI task / docs-only**: docs-only（NON_VISUAL）
- **証跡の主ソース**: `outputs/phase-11/manual-smoke-log.md` / `outputs/phase-11/verification-log.md`

## 受入条件のドラフト

- AC-1〜AC-8 は `index.md` の AC を参照
- 本 Phase 完了条件: `outputs/phase-1/main.md` に「公式 docs 調査観点」「観測対象 deny pattern セット」「要件 / 非要件」「スコープ外」「`docs_inconclusive_requires_execution` の扱い」が揃う

## 主成果物

- `outputs/phase-1/main.md`

## 次 Phase へのハンドオフ

- 公式 docs に明示記述があった場合は Phase 2 で「実機検証不要」案を採用
- 該当なしの場合は Phase 2 で isolated 検証プロトコルを設計
- 観測対象 pattern セット（deny pattern 一覧）を Phase 2 / Phase 4 の入力として渡す

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない
- [ ] 公式 docs 調査結果が一意に確定
- [ ] 観測対象 deny pattern セットが列挙されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
