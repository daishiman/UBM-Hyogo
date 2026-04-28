# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| Wave | 0（governance） |
| 実行種別 | serial（A-2 完了後の単独 PR） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| タスク種別 | docs-only / visualEvidence: NON_VISUAL / scope: infrastructure_governance |

## 目的

本タスクが実適用する 4 施策（A-2 → A-1 → A-3 → B-1）のうち A-1（自動生成 skill ledger の gitignore 化）について、Phase 5 runbook の内容を実行可能な仕様書粒度へ落とし込み、対象 globs / スコープ境界 / 受入条件 / タスク種別を Phase 1 で確定する。「実 gitignore 適用は本ワークフローのスコープ外であり、本ワークフローはタスク仕様書整備に閉じる」という原則を Phase 1 で固定し、後続 Phase が一意に判断できる入力を作成する。

## 真の論点 (true issue)

- 「`.gitignore` に何行追加するか」ではなく、「**A-2 完了前に A-1 を実施しない**という依存順序を仕様書として 3 重に明示することで、`LOGS.md` 履歴の事故的喪失を未来に渡って防ぐ」ことが本タスクの本質。
- 副次的論点として、(1) hook が tracked canonical を上書きしない state ownership 境界、(2) runbook 例示 glob と実態のズレを防ぐ「全 skill 横断棚卸し」要件、(3) ロールバック粒度（1 コミットで `git add -f` 復元）を仕様化すること。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流（必須） | task-skill-ledger-a2-fragment（A-2） | fragment 化と `_legacy.md` 退避が完了し、`LOGS.md` を ignore 化しても履歴を fragment 側で保持できる状態 | A-2 完了を Phase 1 / 2 / 3 の 3 箇所で必須前提として記述 |
| 上流 | task-conflict-prevention-skill-state-redesign Phase 5 | gitignore-runbook.md の対象 glob とロールバック手順 | 本タスク Phase 2 のファイル変更計画として写経・拡張 |
| 並列 | task-skill-ledger-a3-progressive-disclosure（A-3） | skill 改修ガイドへの「派生物は tracked にしない」Anchor 追記タスク | A-1 では Anchor を追加しない（境界明示）|
| 下流 | task-skill-ledger-b1-gitattributes（B-1） | A-1 untrack 後のファイル群への `merge=union` 適用 | A-1 完了状態 = `git ls-files` から派生物が消えていることを前提化 |
| 下流 | task-skill-ledger-hooks（T-6） | 冪等 hook 本体実装 | A-1 で要求する「存在チェック → スキップ」「未存在 → 再生成」ガード仕様 |

## 価値とコスト

- 価値: 4 worktree 並列開発で派生物起因の merge conflict が **0 件** になる。レビュー / マージ作業の継続的な阻害が解消され、derived-artifact の手動マージで生じる index 不整合事故も消える。
- コスト: `.gitignore` 1 ファイル編集 / 数ファイル untrack / hook ガード差分（数行）。実装コストは小だが、A-2 を先行させる順序制約が必須で、これを誤ると履歴喪失の高影響事故に直結する。
- 機会コスト: submodule 分離・別 repo 化と比べると軽量で、既存 lefthook 運用と整合的。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 worktree 並列での派生物 merge conflict 0 件化により継続的な開発阻害を解消 |
| 実現性 | PASS | `.gitignore` / `git rm --cached` / hook ガードはすべて既存 git / lefthook 範囲。A-2 を先行させれば順序事故も回避可能 |
| 整合性 | PASS | 不変条件 #5 を含むいずれの不変条件も侵害しない。skill ledger 派生物 / 正本境界（task-conflict-prevention-skill-state-redesign Phase 5 で確立）を強化する方向 |
| 運用性 | PASS | 1 コミット粒度のロールバック手順あり。hook 冪等化により運用負荷も増えない |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| `.gitignore` セクション | 既存 `.gitignore` の skill 関連エントリ | コメント `# === skill auto-generated ledger (A-1) ===` のラベル形式 |
| 派生物 glob | `.claude/skills/<skill>/indexes/` 以下 | `keywords.json` / `index-meta.json` / `*.cache.json` の 3 系列 |
| rendered view glob | `.claude/skills/<skill>/LOGS.rendered.md` | render script 出力。LOGS.md 本体（A-2 後）と区別 |
| hook 配置 | `lefthook.yml` 経由（`.git/hooks/*` 直接編集禁止） | post-commit / post-merge は lefthook 経由 |
| rebuild コマンド | `pnpm indexes:rebuild` | post-merge から廃止後の正規経路 |

## 実行タスク

1. 原典スペック（`docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md`）の §1〜§9 を写経し、本ワークフロー Phase 1〜13 へ分解する（完了条件: AC-1〜AC-11 として `index.md` と一致）。
2. タスク種別を `docs-only` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance` で固定する（完了条件: `artifacts.json.metadata` と一致）。
3. A-2 完了を必須前提として 3 箇所（Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §NO-GO 条件）に明記する設計を Phase 1 で予約する（完了条件: Phase 2 / 3 仕様にも同記述が含まれる）。
4. 対象 globs を runbook 例示ベースで列挙しつつ、実態棚卸し（`git ls-files .claude/skills`）を Phase 2 のステップとして繰り上げる（完了条件: Phase 2 ステップ 1 に「全 skill 横断棚卸し」が記述）。
5. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
6. 本ワークフローのスコープが「タスク仕様書整備に閉じ、実 gitignore 適用は別 PR で行う」ことを Phase 1 §スコープで固定する（完了条件: 本仕様書 §スコープ にその旨が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md | 原典 400 行スペック |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | 対象 glob / ロールバック手順 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | 4 施策実装順序 |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md | 必須前提タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ |
| 参考 | https://git-scm.com/docs/gitignore | glob 解釈 |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備
- Phase 1〜3 成果物本体の作成
- A-2 完了を必須前提とする依存順序の明記
- target globs（`indexes/keywords.json` / `indexes/index-meta.json` / `indexes/*.cache.json` / `LOGS.rendered.md`）の Phase 1 固定
- 4 worktree 並列再生成 smoke の検証コマンドの仕様レベル定義

### 含まない

- 実 `.gitignore` への追記（Phase 5 実装ランブックで実行）
- tracked 派生物の `git rm --cached`（Phase 5 以降）
- hook 冪等ガード本体実装（補助タスク T-6 へ委譲）
- A-2 / A-3 / B-1 の作業
- skill 改修ガイドへの Anchor 追記（A-3）

## 実行手順

### ステップ 1: 原典スペックの写経

- `task-skill-ledger-a1-gitignore.md` §1〜§9 を本仕様書の構造に分解し、`index.md` の AC-1〜AC-11 を確定する。

### ステップ 2: 真の論点と依存順序の固定

- A-2 完了が必須である旨を Phase 1 / 2 / 3 で重複明記する設計を確定する。

### ステップ 3: 4 条件評価のロック

- 4 条件すべてを PASS で確定する。MAJOR があれば Phase 2 へ進めない。

### ステップ 4: タスク種別 / scope / visualEvidence の固定

- `docs-only` / `NON_VISUAL` / `infrastructure_governance` を Phase 1 で固定し、`artifacts.json.metadata` と整合させる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・target globs・依存順序・4 条件評価を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-11 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-11 を使用 |
| Phase 11 | 4 worktree smoke の実走基準として AC-5 / AC-9 を渡す |

## 多角的チェック観点

- 不変条件 #5: D1 への直接アクセスは触らない（本タスクは git index / `.gitignore` のみ）。
- skill ledger 派生物 / 正本境界（task-conflict-prevention-skill-state-redesign Phase 5）が強化されるか。
- 順序事故回避: A-2 完了前に A-1 を着手しない設計が 3 箇所で重複明記されるか。
- ロールバック設計: 1 コミット粒度で `git add -f` による再追跡が可能か。
- 状態所有権: hook が tracked canonical を書かない境界が成立しているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 原典スペックの写経と AC-1〜AC-11 確定 | 1 | completed | index.md と一致 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | completed | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 4 | A-2 完了前提の 3 重明記設計 | 1 | completed | Phase 2 / 3 で再記述 |
| 5 | target globs の確定 | 1 | completed | 4 系列 |
| 6 | スコープ「タスク仕様書整備に閉じる」固定 | 1 | completed | 含む / 含まない明記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 課題 / target globs / スコープ / AC / 4 条件評価） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「A-2 完了前に A-1 を実施しない依存順序の 3 重明記」に再定義されている
- [x] 4 条件評価が全 PASS で確定している
- [x] target globs（4 系列）が Phase 1 で固定されている
- [x] タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance` が固定されている
- [x] スコープ「本ワークフローはタスク仕様書整備に閉じる」が明記されている
- [x] AC-1〜AC-11 が `index.md` と完全一致している
- [x] 不変条件 #5 を侵害しない範囲で要件が定義されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所（順序事故 / runbook 例示と実態のズレ / hook 循環 / `.git/info/exclude` 誤配置 / 4 worktree smoke コスト）が AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = A-2 完了前提の 3 重明記
  - target globs 4 系列
  - 4 条件評価（全 PASS）の根拠
  - スコープ境界（仕様書整備に閉じる）
- ブロック条件:
  - A-2 仕様書（task-skill-ledger-a2-fragment.md）の存在が確認できない
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-11 が index.md と乖離
