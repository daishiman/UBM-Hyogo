# Phase 7: カバレッジ確認（変更行 / branch coverage）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認（変更行 / branch coverage） |
| 作成日 | 2026-04-28 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending（仕様化のみ完了 / 実走は別 PR） |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

T1〜T10 で構成されるテスト群に対して、**変更ブロックの line / branch カバレッジ 100%** を要求する。本タスクはアプリコード（apps/web / apps/api）を触らないため、従来型の Vitest line coverage ではなく **「git diff で変更された行 / hook script の guard 分岐 / smoke の merge path」をカバレッジスコープ** として定義する。「全ファイル一律 X%」のような薄いゴールは禁止。

## 実行タスク

- タスク1: gitignore 差分、hook guard、smoke merge path の 3 スコープを定義する。
- タスク2: T1〜T10 とカバレッジスコープの対応を表にする。
- タスク3: 実走証跡の保存先を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-04.md | T1〜T5 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-06.md | T6〜T10 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-05.md | 3 コミットの diff 範囲 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | smoke コマンド系列 |

## 実行手順

1. Phase 4 / Phase 5 / Phase 6 の T1〜T10 と実装ランブックを一覧化する。
2. 3 スコープの line / branch 被覆を対応表へ落とす。
3. 実走レポートは実装 PR 側の `coverage-report.md` に委譲する。

## 統合テスト連携

Phase 9 / 10 の品質判定で、本 Phase のカバレッジ対応表を gate 入力として再利用する。

依存成果物として Phase 5 の実装ランブックと Phase 6 の異常系検証を必ず参照し、coverage gap が Phase 9 / Phase 10 へ流れ込まないようにする。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-07/main.md | カバレッジ計画 / スコープ定義 / 証跡保存先 |
| 証跡（実走時） | outputs/phase-07/coverage-report.md | 実装担当者が別 PR で記入。本ワークフローでは骨格のみ |
| メタ | artifacts.json `phases[6].outputs` | `outputs/phase-07/main.md` |

## カバレッジスコープ

「全ファイル一律 X%」ではなく **以下 3 スコープの line / branch を 100%** とする。

### スコープ 1: `.gitignore` の差分行（lane 1）

| 項目 | 内容 |
| --- | --- |
| 対象 | `chore(skill): add A-1 gitignore globs ...`（コミット 1）の diff |
| 期待カバレッジ | 追記行 4 行 × T1 / T8 / T9 / T10 で 100% line 被覆 |
| 検証手段 | `git show <commit-1> -- .gitignore` の追記行を T1〜T10 が網羅していることを表で対応付け |
| 失敗条件 | 追記行のうち T1 で hit が確認できない行が 1 行でもある |

### スコープ 2: hook script の guard 分岐（lane 3）

| 項目 | 内容 |
| --- | --- |
| 対象 | `chore(hooks): add idempotency guard ...`（コミット 3）で追加された分岐 |
| 期待カバレッジ | 「存在 → スキップ」分岐 / 「未存在 → 再生成」分岐 / 「canonical を書かない」契約の 3 ブランチ 100% |
| 検証手段 | T3（再生成後 status 空）で「存在 → スキップ」、T6（regression）で「canonical を書かない」、初回再生成（T4 worktree-1）で「未存在 → 再生成」を被覆 |
| 失敗条件 | 3 ブランチのいずれかが T 群でカバーされていない |

### スコープ 3: 4 worktree smoke の merge path（lane 4）

| 項目 | 内容 |
| --- | --- |
| 対象 | Phase 2 §「4 worktree smoke 検証コマンド系列」全体（worktree 作成 / 並列再生成 / 順次 merge / unmerged カウント） |
| 期待カバレッジ | 4 worktree × 並列再生成 × 順次 merge（3 回）の path を T4 で 100% 通過 |
| 検証手段 | Phase 11 で `outputs/phase-11/manual-smoke-log.md` に NOT EXECUTED のコマンド系列を記録し、実装 PR 側で exit 0 を追記 |
| 失敗条件 | merge path のいずれかで `git ls-files --unmerged` が 0 でない |

## カバレッジ × テスト対応マトリクス

| スコープ | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `.gitignore` 差分行 | ◎ | - | - | - | - | - | - | ◎ | ◎ | ◎ |
| hook guard 分岐 | - | - | ◎ | ◎(初回) | ◎ | ◎ | - | - | - | - |
| smoke merge path | - | - | - | ◎ | - | - | ◎(rollback) | - | - | - |

> 凡例: ◎ = 主たる被覆、◎(注記) = 補助被覆。- = 該当なし。
> 全 3 スコープに ◎ が 1 つ以上あること = カバレッジ要件 PASS。

## 「変更ブロック 100%」の運用ルール

1. PR の diff（コミット 1〜3）に対して `git diff --stat <base>..HEAD` を取得。
2. 追加行 / 変更行のうち、上記 3 スコープに該当するものを 100% カバレッジ対象として列挙。
3. 各行・各分岐を T1〜T10 のいずれかが踏むことを表で 1:N で対応付け。
4. 全ファイル一律 X% という閾値表記は **禁止**（本タスクはアプリコードを触らないため意味を持たない）。

## 証跡保存先

| 種別 | パス | 記入タイミング |
| --- | --- | --- |
| カバレッジ計画（本仕様） | outputs/phase-07/main.md | 本ワークフロー（spec 作成時） |
| カバレッジレポート（実走証跡） | outputs/phase-07/coverage-report.md | 実装担当者が別 PR で実走後に記入 |
| smoke ログ | outputs/phase-11/manual-smoke-log.md | Phase 11 では NOT EXECUTED、実装 PR で実走ログ追記 |

> 本ワークフローでは `coverage-report.md` の **骨格テンプレ** のみ用意する余地を残す。実値記入は実装 PR 側。

## 完了条件

- [ ] スコープ 3 件（gitignore 差分 / hook guard 分岐 / smoke merge path）が `outputs/phase-07/main.md` に定義されている
- [ ] スコープ × テストの対応マトリクスが空セルなく埋まっている（◎ が各スコープ最低 1 件）
- [ ] 「全ファイル一律 X%」表記が **無い** ことが確認されている
- [ ] 証跡保存先が 3 種類明記されている
- [ ] 実走（coverage-report.md 記入）は別 PR に委ねる旨が明示されている

## 検証コマンド（仕様確認用）

```bash
test -f docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-07/main.md
rg -q "全ファイル一律" docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-07/main.md && echo NG || echo OK
# => OK（一律閾値が記述されていないこと）
rg -c "◎" docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-07/main.md
# => 6 以上（3 スコープ × 最低 1 つの主被覆 + 補助被覆）
```

## 苦戦防止メモ

1. **「全ファイル X%」を書かない**: `apps/*` を触らないため、Vitest 由来の line coverage 数値は意味を持たない。スコープ 3 件で 100% を要求する。
2. **hook guard の 3 ブランチ被覆**: T3 / T5 / T6 の組み合わせで「存在」「未存在」「canonical を書かない」を必ず分けて被覆する。
3. **smoke merge path は 1 件で 100%**: T4 が通れば 4 worktree × 3 merge を通過。失敗時は exit code を `outputs/phase-11/manual-smoke-log.md` に記録して切り分ける。
4. **PR diff ベースで列挙**: 実装担当者が PR 作成時に `git diff --stat` を貼り、変更行と T 群の対応表を `coverage-report.md` に記入する。
5. **本 Phase は計画のみ**: 実走 / 数値記入は別 PR。

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - 3 スコープ 100% カバレッジを Phase 9 品質保証 / Phase 10 GO/NO-GO の根拠に再利用
  - `coverage-report.md` の記入を実装担当者に申し送り
- ブロック条件:
  - スコープのいずれかが 100% カバー不可能（テスト不在）
  - 「全ファイル一律 X%」表記が混入
