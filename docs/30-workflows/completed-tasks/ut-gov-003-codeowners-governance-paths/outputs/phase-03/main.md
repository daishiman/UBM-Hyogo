# Phase 3 成果物: 設計レビュー詳細

## 1. レビューサマリ

Phase 2 の設計（順序設計表 / 棚卸し / errors 検証 / ロールバック）に対し、4 案を比較。**base case = 案 D（個人ハンドル `@daishiman`、全パス具体的指定 + global fallback、6 行構成）** を最終判定 **PASS** で確定。NO-GO 条件 4 件（棚卸し未実施 / errors 未検証 / 順序逸脱 / 正規 `docs/00-getting-started-manual/` 誤置換）を Phase 5 着手前の gate として明文化した。

## 2. 代替案 4 案

### 2.1 案 A: 全パス具体的指定 + global fallback（抽象構造）

**概要**: 5 系列 governance パスを具体的に指定 + 冒頭に `* @<owner>`。owner ハンドル種別は問わない抽象構造。

**評価**: 構造として完成しているが、owner 種別が決まらないと実装不可。案 C / D に分岐する。

### 2.2 案 B: global fallback のみ（最小構造）

**概要**: `* @daishiman` のみ。

**評価**:
- 利点: 最小、構文エラーリスクほぼゼロ。
- 欠点: 領域責務文書化が **不可能**。AC-2〜AC-6（5 系列の owner 明示）が **不充足** = **価値性 MAJOR**。
- 結論: **不採用**。

### 2.3 案 C: team handle 採用

**概要**: 案 A の structure を `@org/team` 形式で実装。

**評価**:
- 利点: 将来 contributor 増加時の owner 列一括書き換えが不要。
- 欠点: team が当該 repo に **write 以上の権限** を持つ必要があり、未付与だと silently skip（原典スペック §8.3）。GitHub 組織側で事前権限付与が必要で、solo 運用フェーズでは過剰投資。AC-8 (`errors: []`) で error が出るリスクもある。
- 結論: 将来候補として Phase 12 unassigned-task-detection.md に登録。本タスクでは **不採用**。

### 2.4 案 D: 個人ハンドル `@daishiman` 採用（base case）

**概要**: 案 A の structure を `@daishiman` 個人ハンドルで実装。Phase 2 §3 のテキストに対応。

**評価**:
- 利点: 即時実装可能、silently skip リスクなし、AC-1〜AC-10 全充足、ロールバック 1 コミット粒度。
- 欠点: 将来 contributor 増加時に owner 列を一括書き換える必要（数行のため軽微）。
- 結論: **採用 (base case)**。

## 3. 評価マトリクス（10 観点 × 4 案）

| 観点 | 案 A (抽象) | 案 B (fallback) | 案 C (team) | 案 D (個人 = base) |
| --- | --- | --- | --- | --- |
| 価値性（領域責務文書化） | PASS | **MAJOR** | PASS | PASS |
| 実現性（即時実装） | N/A | PASS | MINOR | PASS |
| 整合性（solo 運用 / 不変条件 #5） | PASS | PASS | PASS | PASS |
| 運用性（silently skip 回避） | N/A | PASS | MINOR | PASS |
| 責務境界（AC-2〜AC-6 充足） | PASS | **MAJOR** | PASS | PASS |
| 依存タスク順序（doc/ 棚卸し） | PASS | PASS | PASS | PASS |
| 価値とコスト | PASS | MINOR | MINOR | PASS |
| ロールバック設計（1 コミット） | PASS | PASS | PASS | PASS |
| 状態所有権（branch protection 不書き） | PASS | PASS | PASS | PASS |
| 検証可能性（`errors: []`） | PASS | PASS | MINOR | PASS |

**MAJOR**: 案 B のみ（価値性・責務境界）。案 D は MAJOR / MINOR ゼロ。

## 4. base case 最終判定（案 D）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 5 系列 owner 表明、suggested reviewer / 監査 / `doc/` 表記是正の同時達成 |
| 実現性 | PASS | `.github/CODEOWNERS` 編集 + `gh` CLI のみ |
| 整合性 | PASS | solo 運用ポリシー（`required_pull_request_reviews=null`）と整合、不変条件 #5 を侵害しない |
| 運用性 | PASS | `git revert` 1 コミット粒度、`require_code_owner_reviews=false` のため運用詰みなし |
| 責務境界 | PASS | AC-2〜AC-6 全充足 |
| 依存タスク順序 | PASS | 棚卸し → 置換 → 編集 → errors の順序を Phase 2 で固定 |
| 価値とコスト | PASS | CODEOWNERS 1 ファイル + 数件置換で完結 |
| ロールバック設計 | PASS | Case A で 1 コミット |
| 状態所有権 | PASS | branch protection を書かない境界が明示 |

**最終判定: PASS（MAJOR ゼロ、MINOR ゼロ）**

## 5. PASS / MINOR / MAJOR 基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点 + AC-1〜AC-10 をすべて満たす。Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 / 11 / 12 で補足対応が必要だが Phase 4 移行は許可。 |
| MAJOR | block。Phase 4 へ進めない。Phase 2 へ差し戻すか、open question として MVP 外に明確化。 |

## 6. 着手可否ゲート

### 6.1 GO 条件

- [x] 代替案 4 案以上が評価マトリクスに並んでいる
- [x] base case (案 D) が全観点 PASS
- [x] MAJOR ゼロ
- [x] MINOR の対応 Phase（12: team 化）が指定済
- [x] AC-1〜AC-10 が base case で全充足

### 6.2 NO-GO 条件（一つでも該当で Phase 5 着手不可）

| # | NO-GO 条件 | 検出方法 |
| --- | --- | --- |
| 1 | `doc/` → `docs/` 棚卸しコマンド (`rg`) が Phase 5 ステップ 0 として仕様化されていない | Phase 5 ランブック目視 |
| 2 | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` の `errors: []` 検証が Phase 5 / 11 のステップとして仕様化されていない | 同上 |
| 3 | Phase 2 §2 の順序設計表（global fallback 冒頭、`docs/30-workflows/**` 末尾）から逸脱した CODEOWNERS 設計 | Phase 5 PR diff レビュー |
| 4 | 正規 `docs/00-getting-started-manual/` を `docs/` に誤置換する設計が混入 | Phase 5 §棚卸し分類基準で検出 |

## 7. open question

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | `.claude/skills/**/references/**` の多段 `**` glob が GitHub パーサで意図通りマッチするか | Phase 11 | `gh api .../codeowners/errors` 実走で実証 |
| 2 | `docs/00-getting-started-manual/` と `docs/30-workflows/` の正規共存を CLAUDE.md「主要ディレクトリ」表で再確認 | Phase 5 | 棚卸し結果次第で `outputs/phase-05/replacement-rationale.md` に記録 |
| 3 | 案 C（team handle）への将来移行時期 | Phase 12 unassigned | contributor 体制 + 組織側 team write 権限付与が前提 |
| 4 | UT-GOV-001 の branch protection 適用と本タスクの順序 | Phase 12 | 本タスクは独立で先行可能 |

## 8. 案 C 将来候補メモ（Phase 12 引き渡し）

team handle 採用への移行条件:

1. GitHub 組織側で `@daishiman/maintainers`（仮）team を作成。
2. 当該 team に UBM-Hyogo リポジトリへの **write 以上** の権限を付与（silently skip を避けるため必須）。
3. team メンバーに少なくとも 2 名以上の contributor を配置（PR レビュー第二者確保）。
4. `require_code_owner_reviews=true` を有効化する判断と組み合わせて UT-GOV-001 後継タスクで実施。

## 9. notes（Phase 4 / 5 / 11 / 12 への申し送り）

- 将来 contributor 体制への移行時は案 C（team handle）への切替を別タスクで起票（Phase 12 §3）。
- `require_code_owner_reviews` を有効化する判断は本タスクのスコープ外（UT-GOV-001 / 将来タスク）。
- 多段 `**` glob (`.claude/skills/**/references/**`) の挙動は Phase 11 で `gh api .../codeowners/errors` 実走によって実証する（open question #1）。
- 正規 `docs/00-getting-started-manual/` の誤置換防止は Phase 5 §棚卸し分類基準で確実に運用する。

## 10. 結論

**base case = 案 D を Phase 4 への入力として採用する**。NO-GO 条件 4 件が Phase 5 着手前の gate として機能する限り、AC-1〜AC-10 はすべて充足可能。
