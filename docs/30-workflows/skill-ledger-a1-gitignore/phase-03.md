# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-28 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 2 の設計に対して、4 つ以上の代替案を比較し、観点（責務境界 / 依存タスク順序の固定 / 価値とコスト / ロールバック設計 / 状態所有権）と 4 条件（価値性 / 実現性 / 整合性 / 運用性）に対して PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通す。判定結果は **PASS（with notes）** とし、notes は Phase 5 / 11 / 12 への申し送り事項として明記する。

## 実行タスク

1. 代替案を 4 案以上列挙する（A: gitignore + untrack + hook 冪等化 = base case / B: hook 単独で再生成（gitignore せず .gitignore は触らない） / C: skill ledger を別 submodule / D: 派生物を別ブランチ管理）（完了条件: 4 案以上が比較表に並ぶ）。
2. 5 観点 + 4 条件 × 案で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（案 A）を選定理由付きで確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載）。
5. 着手可否ゲートを定義し、A-2 完了を NO-GO 条件として明記する（完了条件: A-2 未完了 = NO-GO が記述）— 重複明記 3/3。
6. 残課題（open question）を Phase 4 / 5 / 11 / 12 に振り分ける（完了条件: open question 全件に受け皿 Phase が指定されている）。

## 依存タスク順序（A-2 完了必須）— 重複明記 3/3

> **A-2（task-skill-ledger-a2-fragment）が completed でなければ、本 Phase の着手可否ゲートは強制 NO-GO となる。**
> これは原典スペック §9 で「最重要苦戦箇所」として明記されている履歴喪失事故の唯一の再発防止策であり、Phase 1 §依存境界・Phase 2 §依存タスク順序・本 Phase §着手可否ゲートの 3 箇所で重複明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-02/main.md | base case 構造 |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | runbook の代替案検討経緯 |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md §9 | 苦戦箇所（順序事故） |
| 参考 | https://git-scm.com/docs/gitsubmodules | 案 C 評価のため |

## 代替案比較

### 案 A: gitignore + untrack + hook 冪等化（base case = Phase 2 採用）

- 概要: 正本 `.gitignore` に 4 系列 glob を追加し、tracked 派生物を `git rm --cached` で untrack。post-commit / post-merge hook に「存在 → スキップ」の冪等ガードを追加。
- 利点: 既存 lefthook 運用と整合的、ロールバックが 1〜2 コミット粒度、4 worktree smoke で即時検証可能、コスト最小。
- 欠点: A-2 完了が必須前提（順序事故リスク）。

### 案 B: hook 単独で再生成（.gitignore は触らない）

- 概要: 派生物は tracked のままにし、hook で「上書きしないガード」だけ強化。
- 利点: `.gitignore` を触らないので順序事故リスクが低減。
- 欠点: tracked のままでは並列 worktree が異なる JSON を書き込み続け、merge conflict は本質的に減らない。**価値性 MAJOR**。

### 案 C: skill ledger を別 submodule に切り出す

- 概要: `.claude/skills` 全体を別 repo / submodule 化し、メイン repo の git index から外す。
- 利点: 完全に分離可能。
- 欠点: lefthook / 開発フロー全体の再設計が必要。MVP スコープ外。**実現性 MAJOR**。

### 案 D: 派生物を別ブランチ管理（artifact branch）

- 概要: `derived-artifacts` ブランチで派生物だけ管理、`main` には含めない。
- 利点: 履歴は残る。
- 欠点: 開発者が常時 2 ブランチを意識する必要があり、運用負荷大。pnpm / lefthook の rebuild flow と整合しにくい。**運用性 MAJOR**。

### 代替案 × 評価マトリクス

| 観点 | 案 A (base) | 案 B (hook 単独) | 案 C (submodule) | 案 D (artifact branch) |
| --- | --- | --- | --- | --- |
| 価値性 (conflict 0 化) | PASS | MAJOR | PASS | PASS |
| 実現性 | PASS | PASS | MAJOR | MINOR |
| 整合性（不変条件 / 既存運用） | PASS | PASS | MAJOR | MINOR |
| 運用性 | PASS | MINOR | MAJOR | MAJOR |
| 責務境界 | PASS（hook = 派生物のみ） | MINOR（canonical 上書き残） | PASS | MINOR |
| 依存タスク順序の固定 | PASS（A-2 必須を 3 重明記） | PASS（A-2 不要） | N/A | N/A |
| 価値とコスト | PASS（コスト最小） | MINOR（価値が出ない） | MAJOR | MINOR |
| ロールバック設計 | PASS（1〜2 コミット） | PASS | MAJOR（submodule 解体要） | MINOR |
| 状態所有権 | PASS（hook が canonical を書かない） | MINOR | PASS | MINOR |

### 採用結論

- base case = 案 A を採用。
- 理由: 5 観点 + 4 条件すべて PASS、ロールバック 1〜2 コミット粒度、既存 lefthook 運用と整合、4 worktree smoke で即時検証可能。順序事故リスクは Phase 1 / 2 / 3 の 3 重明記で再発防止する。
- 案 C は将来的な拡張余地として Phase 12 unassigned-task-detection.md に候補列挙のみ行う。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点を満たす。Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 / 11 / 12 で補足対応が必要だが、Phase 4 への移行は許可。 |
| MAJOR | block。Phase 4 へ進めない。Phase 2 へ差し戻すか、open question として MVP スコープ外に明確化する。 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 worktree 並列で派生物 conflict 0 件化 |
| 実現性 | PASS | `.gitignore` / `git rm --cached` / hook ガードはすべて既存技術 |
| 整合性 | PASS | 不変条件 #5 を侵害しない。skill ledger 派生物 / 正本境界を強化する方向 |
| 運用性 | PASS | lefthook 経由で hook 配置、1〜2 コミット粒度のロールバック |
| 責務境界 | PASS | hook = 派生物のみ生成、canonical を書かない |
| 依存タスク順序 | PASS（with notes） | A-2 完了が必須前提。3 重明記済み |
| 価値とコスト | PASS | 編集対象は `.gitignore` 1 ファイル + 数ファイル untrack + hook 数行 |
| ロールバック設計 | PASS | `revert(skill): re-track A-1 ledger files` で 1〜2 コミット復元 |
| 状態所有権 | PASS | hook が canonical を書かない境界を state ownership 表で明示 |

**最終判定: PASS（with notes）**
notes:
- A-2 完了確認は Phase 5 着手前の必須ゲート（NO-GO 条件として再明示）。
- T-6 (hook 本体未実装) の場合、lane 3 は最小限の存在チェックガードに留める。
- 4 worktree smoke は Phase 11 で実走。コマンド系列は Phase 2 で仕様レベル固定済み。

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [x] 代替案 4 案以上が評価マトリクスに並んでいる
- [x] base case の最終判定が全観点 PASS（or PASS with notes）
- [x] MAJOR が一つも残っていない
- [x] MINOR がある場合、対応 Phase（5 / 11 / 12）が指定されている
- [x] open question が全件 Phase 振り分け済み

### NO-GO 条件（一つでも該当）

- **A-2（task-skill-ledger-a2-fragment）が completed でない** ← 履歴喪失事故の主要因（重複明記 3/3）
- 4 条件のいずれかに MAJOR が残る
- hook が canonical を書く設計が残っている
- ロールバックが 3 コミット以上を要求している
- target globs に `LOGS.md` 本体が含まれている（A-2 後の別タスクで対応）

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | T-6（hook 本体実装）が未着手の場合、lane 3 をどこまで踏み込むか | Phase 5 | 最小限の存在チェックガードに留める案を採用 |
| 2 | 4 worktree smoke で `pnpm indexes:rebuild` が落ちた場合の切り分け手順 | Phase 11 | 失敗時の証跡保存先 |
| 3 | 案 C（submodule 化）の将来導入時期 | Phase 12 unassigned | 次 Wave 以降 |
| 4 | B-1（gitattributes / merge=union）との順序 | Phase 12 | A-1 → B-1 が確立順 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜D を `outputs/phase-03/main.md` に記述。

### ステップ 2: 評価マトリクスの作成

- 9 観点（4 条件 + 5 観点）× 4 案で空セルなく埋める。

### ステップ 3: base case 最終判定

- 全 PASS（with notes）であることを確認。MINOR の対応 Phase を明示。

### ステップ 4: 着手可否ゲートの判定

- A-2 completed を NO-GO 条件として再明示。GO の場合のみ artifacts.json の Phase 3 を `completed` にする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力にテスト戦略を組む |
| Phase 5 | open question #1（hook 踏み込み度合い）を実装で確定 |
| Phase 10 | base case の PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | open question #2 を smoke 失敗時の切り分け手順として実走 |
| Phase 12 | open question #3 / #4 を unassigned-task-detection.md に登録 |

## 多角的チェック観点

- 責務境界: hook が canonical を書かない設計が代替案で破綻していないか。
- 依存タスク順序: A-2 必須前提が 3 重明記されたか（本 Phase が 3 重目）。
- 価値とコスト: 案 A が最小コストで最大の価値（conflict 0）を達成しているか。
- ロールバック設計: 1〜2 コミット粒度で逆操作可能か。
- 状態所有権: 4 state（`.gitignore` / 派生物 / `LOGS.md` / hook）の writer / reader が代替案で混線していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | completed | 案 A〜D |
| 2 | 評価マトリクスの作成 | 3 | completed | 9 観点 × 4 案 |
| 3 | base case 最終 PASS（with notes）判定 | 3 | completed | notes 3 件 |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | completed | 3 レベル |
| 5 | 着手可否ゲート定義 + A-2 完了 NO-GO 明記 | 3 | completed | 重複明記 3/3 |
| 6 | open question の Phase 振り分け | 3 | completed | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・着手可否ゲート |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [x] 代替案が 4 案以上比較されている
- [x] 9 観点 × 案のマトリクスに空セルが無い
- [x] base case の最終判定が PASS（with notes）
- [x] PASS / MINOR / MAJOR の判定基準が明文化されている
- [x] 着手可否ゲートで A-2 完了が NO-GO 条件として明記されている（重複明記 3/3）
- [x] open question 4 件すべてに受け皿 Phase が割り当てられている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 成果物が `outputs/phase-03/main.md` に配置済み
- 4 条件 + 5 観点すべてが PASS（with notes）
- MAJOR ゼロ
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 A（gitignore + untrack + hook 冪等化）
  - lane 1〜4 を Phase 4 のテスト戦略の対象に渡す
  - notes 3 件（A-2 完了確認 / T-6 未実装時の lane 3 制限 / Phase 11 smoke 実走）
  - open question 4 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - A-2 が completed でない
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
