# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (ut-gov-003-codeowners-governance-paths) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| Wave | 0（governance） |
| 実行種別 | serial |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |

## 目的

Phase 2 の設計（順序設計表 / 棚卸し / errors 検証 / ロールバック）に対して、4 つ以上の代替案（案 A: 全パス具体的指定 + global fallback / 案 B: global fallback のみ / 案 C: team handle 採用 / 案 D: 個人ハンドル採用 = base case）を 4 条件 + 5 観点で比較し、PASS / MINOR / MAJOR を確定する。最終判定は **base case (= 案 D = 個人ハンドル全パス具体的指定 + global fallback) を PASS** で確定し、NO-GO 条件として「`doc/` → `docs/` 棚卸し未実施」「`gh api .../codeowners/errors` 未検証」「順序設計表逸脱」「正規 `docs/00-getting-started-manual/` 誤置換」を Phase 5 着手の gate に置く。

## 実行タスク

1. Phase 2 の順序設計、棚卸し、errors 検証、ロールバックをレビュー入力として固定する。
2. 代替案 A〜D を PASS / MINOR / MAJOR で比較し、base case を選定する。
3. `doc/` / `docs/` 棚卸し、errors 検証、順序設計、branch protection 境界の NO-GO 条件を定義する。
4. open question を後続 Phase または unassigned-task へ割り当てる。

> **案の再分類について**: 原典スペックおよび本タスクの問題定義上、「全パス具体的指定 + global fallback」を実現する owner ハンドルとして (1) team handle、(2) 個人ハンドル の 2 系統が存在する。Phase 3 ではこれを別案として独立に評価する。すなわち:
> - 案 A: 全パス具体的指定 + global fallback（**抽象構造**）
> - 案 B: global fallback のみ（最小構造）
> - 案 C: 案 A の owner を team handle で実装
> - 案 D: 案 A の owner を個人ハンドル `@daishiman` で実装 = **base case**

## 真の論点 (true issue)

- solo 運用 + `require_code_owner_reviews=false` の制約下で、owner 表明の **正確性 / 検証可能性 / ロールバック容易性 / 将来拡張余地** をすべて満たす案を選定する。
- team handle (案 C) は将来拡張余地は最大だが、現時点では team の repo 権限を事前付与できておらず silently skip リスクが残る。個人ハンドル (案 D) は本タスクのフェーズに最適。

## 依存タスク順序（NO-GO 条件 = 重複明記）— 1/1

> **以下のいずれかが未充足の場合、Phase 4 への着手は強制 NO-GO となる:**
> 1. `doc/` → `docs/` 棚卸し（`rg ...`）が未実施
> 2. 順序設計表（Phase 2 §2）から逸脱した CODEOWNERS 設計
> 3. `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` の `errors: []` 検証が Phase 5 / 11 のステップとして仕様化されていない
> 4. 正規 `docs/00-getting-started-manual/` を誤置換する設計が混入している

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-02/main.md | 順序設計表 / 棚卸し / errors 検証 / ロールバック |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-01.md | AC-1〜AC-10 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | 原典スペック §8 苦戦箇所 |
| 参考 | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners | team 権限要件 / glob 仕様 |

## 代替案比較

### 案 A: 全パス具体的指定 + global fallback（抽象構造）

- 概要: 順序設計表に従い 5 系列の governance パスを具体的に指定し、global fallback `* @daishiman` を冒頭に配置（owner ハンドルの種別は問わない抽象構造）。
- 利点: 最終マッチ勝ち仕様に最適化された明示性。すべての governance パスに owner が表明される。
- 欠点: ハンドル種別が決まらないと実装できない（案 C / D へ分岐）。

### 案 B: global fallback のみ（最小構造）

- 概要: `* @daishiman` の 1 行のみ。governance パスの個別指定は省略。
- 利点: 設定が最小、構文エラーリスクほぼゼロ、棚卸しも最小限。
- 欠点: ownership の **領域別表明ができない**。GitHub UI suggested reviewer 表示は global fallback で全件 @daishiman にはなるが、領域責務の文書化価値は失われる。AC-2〜AC-6（target paths 5 系列の owner 明示）が **不充足**。**価値性 MAJOR**。

### 案 C: team handle 採用（`@daishiman/maintainers` 等）

- 概要: 案 A の構造を維持しつつ owner を team handle で記述。
- 利点: 将来 contributor 増加時に team メンバーを追加するだけで CODEOWNERS を変更不要にできる。
- 欠点: team が当該 repo に **write 以上の権限** を持っていないと silently skip される（原典 §8.3）。GitHub 組織側の事前権限付与が必要で、solo 運用フェーズでは過剰投資。**実現性 MINOR**（将来移行は可能だが現時点では不適）/ **運用性 MINOR**。

### 案 D: 個人ハンドル `@daishiman` 採用（= base case）

- 概要: 案 A の構造を `@daishiman` 個人ハンドルで実装。Phase 2 §3 のテキストに対応。
- 利点: 即時実装可能、silently skip リスクなし、AC-1〜AC-10 を全充足、ロールバック 1 コミット粒度。
- 欠点: 将来 contributor 増加時に CODEOWNERS の owner 列を一括書き換える必要がある（ただし数行のため軽微）。

### 代替案 × 評価マトリクス

| 観点 | 案 A (抽象) | 案 B (fallback のみ) | 案 C (team handle) | 案 D (個人 = base) |
| --- | --- | --- | --- | --- |
| 価値性（領域責務文書化） | PASS | MAJOR | PASS | PASS |
| 実現性（即時実装可能） | N/A（抽象） | PASS | MINOR（権限付与要） | PASS |
| 整合性（solo 運用 / 不変条件 #5） | PASS | PASS | PASS | PASS |
| 運用性（silently skip 回避） | N/A | PASS | MINOR | PASS |
| 責務境界（AC-2〜AC-6 充足） | PASS | MAJOR | PASS | PASS |
| 依存タスク順序（doc/ 棚卸し → 編集） | PASS | PASS（棚卸し不要） | PASS | PASS |
| 価値とコスト | PASS | MINOR | MINOR（権限付与コスト） | PASS（コスト最小） |
| ロールバック設計（1 コミット粒度） | PASS | PASS | PASS | PASS |
| 状態所有権（branch protection 不書き境界） | PASS | PASS | PASS | PASS |
| 検証可能性（`errors: []`） | PASS | PASS | MINOR（team 不在で error 化リスク） | PASS |

### 採用結論

- **base case = 案 D（個人ハンドル `@daishiman`、全パス具体的指定 + global fallback）を採用**。
- 理由:
  1. solo 運用フェーズで silently skip リスクなく即時実装可能。
  2. 9 観点すべて PASS（案 D 列）。
  3. AC-1〜AC-10 を全充足する唯一の案（案 B は AC-2〜AC-6 不充足、案 C は AC-8 不充足リスク）。
  4. ロールバック 1 コミット粒度で運用負荷ゼロ。
- 案 C（team handle）は将来 contributor 体制移行時の候補として Phase 12 unassigned-task-detection.md に登録する（GitHub 組織側で team の repo write 権限付与が完了次第、別タスクとして起票）。
- 案 B は AC 充足不能のため不採用。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点 + AC-1〜AC-10 をすべて満たす。Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 / 11 / 12 で補足対応が必要だが、Phase 4 への移行は許可。 |
| MAJOR | block。Phase 4 へ進めない。Phase 2 へ差し戻すか、open question として MVP スコープ外に明確化する。 |

## base case 最終 PASS / MINOR / MAJOR 判定（案 D）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 5 系列に owner 表明、suggested reviewer / 監査説明 / `doc/` 表記揺れ是正の同時達成 |
| 実現性 | PASS | `.github/CODEOWNERS` 編集 + `gh` CLI のみで完結 |
| 整合性 | PASS | solo 運用ポリシー（`required_pull_request_reviews=null`）と整合、不変条件 #5 を侵害しない |
| 運用性 | PASS | `git revert` 1 コミット粒度、`require_code_owner_reviews=false` のため運用詰みなし |
| 責務境界 | PASS | AC-2〜AC-6 を全充足、global fallback で残余を捕捉 |
| 依存タスク順序 | PASS | `doc/` 棚卸し → 置換 → 編集 → errors 検証 を Phase 2 で順序固定 |
| 価値とコスト | PASS | 編集対象は CODEOWNERS 1 ファイル + 数件の置換 |
| ロールバック設計 | PASS | Case A（CODEOWNERS のみ revert）で 1 コミット |
| 状態所有権 | PASS | branch protection を書かない境界が state ownership 表で明示 |

**最終判定: PASS**

notes:
- 将来 contributor 体制に移行する場合は案 C（team handle）への切替を別タスクで起票する。
- `require_code_owner_reviews` を有効化する判断は本タスクのスコープ外（UT-GOV-001 / 将来タスク）。
- 多段 `**` glob（`.claude/skills/**/references/**`）の挙動は Phase 11 の `gh api .../codeowners/errors` 実走で実証する。

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [x] 代替案 4 案以上が評価マトリクスに並んでいる（案 A〜D）
- [x] base case (案 D) の最終判定が全観点 PASS
- [x] MAJOR が一つも残っていない
- [x] MINOR がある場合、対応 Phase（11 / 12）が指定されている
- [x] AC-1〜AC-10 すべてが base case で充足可能

### NO-GO 条件（一つでも該当）

- **`doc/` → `docs/` 棚卸しコマンドが Phase 5 ステップ 0 として仕様化されていない** ← 順序事故防止の核心
- **`gh api repos/daishiman/UBM-Hyogo/codeowners/errors` の `errors: []` 検証が Phase 5 / 11 のステップとして仕様化されていない** ← AC-8 の唯一の実証手段
- 順序設計表（Phase 2 §2）から逸脱した設計が採用されている
- 正規 `docs/00-getting-started-manual/` を誤置換する設計が混入している
- branch protection で `require_code_owner_reviews=true` を有効化する設計が混入している（本タスクのスコープ外、UT-GOV-001 / 将来タスク）
- 4 条件のいずれかに MAJOR が残る

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | 多段 `**` glob (`.claude/skills/**/references/**`) が GitHub の CODEOWNERS パーサで意図通りマッチするか | Phase 11 | `gh api .../codeowners/errors` 実走で実証 |
| 2 | `docs/00-getting-started-manual/` の正規維持と `docs/30-workflows/` の正規共存を CLAUDE.md「主要ディレクトリ」表で明文化するか | Phase 5 | 棚卸し結果次第で `outputs/phase-05/replacement-rationale.md` に記録 |
| 3 | 案 C（team handle）への将来移行時期 | Phase 12 unassigned | contributor 体制移行 + GitHub 組織側 team 権限付与が前提 |
| 4 | UT-GOV-001 の branch protection 適用と本タスクの順序 | Phase 12 | 本タスクは独立で先行可能。UT-GOV-001 が後続でも問題なし |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜D を `outputs/phase-03/main.md` に記述（A=抽象構造、B=fallback のみ、C=team、D=個人）。

### ステップ 2: 評価マトリクスの作成

- 10 観点（4 条件 + 5 観点 + AC 充足性）× 4 案で空セルなく埋める。

### ステップ 3: base case 最終判定

- 案 D を採用、9 観点すべて PASS で確定。MINOR は無し（将来 team 化のみ Phase 12）。

### ステップ 4: 着手可否ゲートの判定

- NO-GO 条件 4 件（棚卸し / errors 検証 / 順序逸脱 / 誤置換）を Phase 5 着手前の gate として明文化。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case (案 D) を入力にテスト戦略を組む |
| Phase 5 | 棚卸し → 置換 → CODEOWNERS 編集 → errors 検証 の実装ランブック |
| Phase 10 | base case の PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | `gh api .../codeowners/errors` の実走、多段 glob の挙動実証 |
| Phase 12 | open question #3 (team handle 移行) / #4 (UT-GOV-001 順序) を unassigned に登録 |

## 多角的チェック観点

- 責務境界: 5 系列 governance パスに owner 表明があり、global fallback で残余が捕捉されているか。
- 依存タスク順序: 棚卸し → 置換 → 編集 → errors 検証 の順序が逸脱していないか。
- 価値とコスト: 案 D が最小コスト（CODEOWNERS 1 ファイル + 数件置換）で AC 全充足を達成しているか。
- ロールバック設計: Case A（1 コミット粒度）で逆操作可能か。
- 状態所有権: branch protection を書かない境界（UT-GOV-001 のスコープ）が混線していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案の列挙 | 3 | completed | A=抽象 / B=fallback / C=team / D=個人 |
| 2 | 評価マトリクスの作成 | 3 | completed | 10 観点 × 4 案 |
| 3 | base case (案 D) 最終 PASS 判定 | 3 | completed | 9 観点 PASS |
| 4 | PASS / MINOR / MAJOR 基準の定義 | 3 | completed | 3 レベル |
| 5 | 着手可否ゲート定義 + NO-GO 条件明記 | 3 | completed | 4 件の NO-GO |
| 6 | open question の Phase 振り分け | 3 | completed | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・着手可否ゲート |

## 完了条件

- [x] 代替案が 4 案以上比較されている（A / B / C / D）
- [x] 10 観点 × 4 案のマトリクスに空セルが無い
- [x] base case (案 D) の最終判定が全観点 PASS
- [x] PASS / MINOR / MAJOR の判定基準が明文化されている
- [x] 着手可否ゲートで NO-GO 条件 4 件が明記されている
- [x] open question 4 件すべてに受け皿 Phase が割り当てられている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 成果物が `outputs/phase-03/main.md` に配置済み
- 4 条件 + 5 観点すべてが base case で PASS
- MAJOR ゼロ
- MINOR の対応 Phase（12: team 化）が記述
- Phase 3 の状態が `completed`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 D（個人ハンドル `@daishiman`、6 行構成、最終マッチ勝ち順序）
  - lane 1〜4 を Phase 4 のテスト戦略の対象に渡す
  - notes（将来 team 化 / `require_code_owner_reviews` 有効化判断は本タスク外 / 多段 glob 実証は Phase 11）
  - open question 4 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - NO-GO 条件のいずれかに該当
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
