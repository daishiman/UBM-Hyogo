# Phase 7 成果物: カバレッジ計画（NOT EXECUTED — 計画のみ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 種別 | カバレッジ計画（NOT EXECUTED — docs-only / spec_created） |
| 作成日 | 2026-04-28 |

> **NOT EXECUTED**: 本ファイルはカバレッジ「計画」。実走証跡は実装担当者が別 PR で `outputs/phase-07/coverage-report.md` に記入する。

## 基本方針

- 「全ファイル一律 X%」表記は **禁止**（apps/* を触らないため意味を持たない）
- **変更ブロックの line / branch を 100%** カバーする
- カバレッジスコープは 3 件（gitignore 差分 / hook guard 分岐 / smoke merge path）

## カバレッジスコープ定義

### スコープ 1: `.gitignore` の差分行（lane 1）

| 項目 | 内容 |
| --- | --- |
| 対象 | コミット 1 (`chore(skill): add A-1 gitignore globs ...`) の追記行 4 行 |
| 棚卸し対象 | `git ls-files` で全 skill 横断確認（実体パスとの hit 整合） |
| 期待 | 追記行 4 行 × 全 skill のパスが ◎ で対応付くこと |
| 主被覆 T | T1（全マッチ）/ T8（nested）/ T9（broaden 防止）/ T10（正本配置） |

### スコープ 2: hook script の guard 分岐（lane 3）

| 項目 | 内容 |
| --- | --- |
| 対象 | コミット 3 (`chore(hooks): add idempotency guard ...`) で追加された分岐 |
| ブランチ | (a) 存在 → スキップ / (b) 未存在 → 再生成 / (c) canonical を書かない契約 |
| 期待 | 3 ブランチすべてに ◎ |
| 主被覆 T | T3（存在 → スキップ）/ T4 worktree-1 初回（未存在 → 再生成）/ T5（二重実行）/ T6（canonical 書かない regression） |

### スコープ 3: 4 worktree smoke の merge path（lane 4）

| 項目 | 内容 |
| --- | --- |
| 対象 | Phase 2 §「4 worktree smoke 検証コマンド系列」 |
| path | worktree 作成 × 4 / 並列再生成 × 4 / 順次 merge × 3 / unmerged カウント × 1 |
| 期待 | エンドツーエンドで exit 0 / `git ls-files --unmerged \| wc -l` = 0 |
| 主被覆 T | T4 / 補助: T7（rollback merge path） |

## カバレッジ × テスト対応マトリクス

| スコープ | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `.gitignore` 差分行 | ◎ | - | - | - | - | - | - | ◎ | ◎ | ◎ |
| hook guard 分岐 | - | - | ◎ | ◎ | ◎ | ◎ | - | - | - | - |
| smoke merge path | - | - | - | ◎ | - | - | ◎ | - | - | - |

> 凡例: ◎ = 主たる被覆 / - = 該当なし。3 スコープすべてに ◎ が 1 つ以上あること = カバレッジ要件 PASS。

## 棚卸し対象（変更ファイル）

| ファイル | 変更内容 | 確認方法（実装担当者向け） |
| --- | --- | --- |
| `.gitignore` | 4 系列 glob 追記（コミット 1） | `git diff <base>..<commit-1> -- .gitignore` |
| `git ls-files .claude/skills` の出力 | 派生物 untrack（コミット 2） | `git diff <commit-1>..<commit-2> --stat` |
| `lefthook.yml` または hook script | guard 分岐追加（コミット 3） | `git diff <commit-2>..<commit-3>` |

## 証跡保存先

| 種別 | パス | 記入タイミング |
| --- | --- | --- |
| カバレッジ計画（本ファイル） | `outputs/phase-07/main.md` | 本ワークフロー（spec 作成時） |
| カバレッジレポート（実走証跡） | `outputs/phase-07/coverage-report.md` | 実装担当者が別 PR 実走後に記入 |
| smoke ログ | `outputs/phase-11/manual-smoke-log.md` | Phase 11 では NOT EXECUTED、実装 PR で実走ログ追記 |

## coverage-report.md 骨格テンプレ（実装担当者向け）

```markdown
# A-1 カバレッジレポート（実走証跡）

## メタ
- 実走日時:
- 実走者:
- ベースコミット / HEAD:

## スコープ 1: .gitignore 差分行
- diff:
- 追記行 4 行 × T1/T8/T9/T10 hit 表:

## スコープ 2: hook guard 分岐
- 分岐 (a) 存在 → スキップ: T3 / T5 結果:
- 分岐 (b) 未存在 → 再生成: T4 worktree-1 結果:
- 分岐 (c) canonical を書かない: T6 結果:

## スコープ 3: smoke merge path
- T4 コマンド系列参照: outputs/phase-11/manual-smoke-log.md
```

## 完了確認（仕様レベル）

- [x] スコープ 3 件が定義されている
- [x] 対応マトリクスに空セルなし（◎ 各スコープ最低 1 件）
- [x] 「全ファイル一律 X%」表記が無い
- [x] 証跡保存先 3 種が明記されている
- [x] coverage-report.md の骨格テンプレが用意されている
- [ ] 実走（実装担当者の別 PR）

## 申し送り

- Phase 9 品質保証 / Phase 10 GO/NO-GO の根拠として 3 スコープ 100% を再利用
- coverage-report.md 記入は実装担当者
- nested glob 強化（B-1）後はスコープ 1 を再評価
