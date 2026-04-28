# Phase 3: 設計レビュー - skill-ledger-b1-gitattributes

> **状態**: completed
> **作成日**: 2026-04-28
> **対象タスク**: append-only skill ledger への `merge=union` 適用（B-1）
> **GitHub Issue**: #132
> **入力**: Phase 1 (`outputs/phase-01/main.md`) / Phase 2 (`outputs/phase-02/main.md`)

---

## 1. 代替案比較

B-1 が解決すべき課題（A-2 で吸収しきれない `_legacy.md` 系の並列 worktree 追記行衝突）に対して、4 案を比較評価する。

### 1.1 代替案一覧

| 案 | 名称 | 概要 |
| --- | --- | --- |
| A | 純 `merge=union` 単一行 | `.gitattributes` に `**/_legacy.md merge=union` の 1 行のみ。コメント / 解除条件・解除手順は明文化しない |
| B | skill-ledger 全体に `**/*.md` で広範適用 | `.claude/skills/**/*.md merge=union` のような broad な glob |
| C | custom merge driver 導入 | `.git/config` に登録した custom script で構造体保護つきマージを行う |
| D | B-1 対象限定 + 解除手順明記（**base case**）| `**/_legacy.md` 系の限定 glob のみ + コメントで解除条件・解除手順・適用禁止対象を明記 |

### 1.2 評価マトリクス

| 観点 | 案 A | 案 B | 案 C | 案 D（base case）|
| --- | --- | --- | --- | --- |
| **適用精度** | 中（pattern は限定だがコメント不足） | 低（JSON / YAML / SKILL.md を巻き込む） | 高（script で除外可） | 高（限定 glob + 検証マトリクス） |
| **JSON / YAML 破損リスク** | 低 | **高（致命）** | 低 | 低 |
| **front matter 重複リスク** | 中（pattern 限定で軽減） | **高（致命）** | 低 | 低 |
| **実現コスト** | 低 | 低 | **高**（外部 script 保守 + bootstrap） | 低 |
| **運用コスト（負債化リスク）** | **高**（解除手順不明） | **高**（解除困難） | 中（script を別途解除） | 低（解除条件・手順明記） |
| **ロールバック容易性** | 高（1 コミット revert） | 高（1 コミット revert） | 中（script + config 両方） | 高（1 コミット revert） |
| **CI / 外部依存** | なし | なし | **あり**（script bootstrap） | なし |
| **A-2 整合性** | 中（解除設計弱） | **不整合**（fragment にも当たる） | 中（過剰実装） | 高（解除条件で整合） |
| **チーム / 単独開発適合** | 中 | 低 | 低（script レビューコスト） | 高（標準 Git 機能のみ） |

### 1.3 PASS/MINOR/MAJOR 評価

| 案 | 評価 | 主な指摘 |
| --- | --- | --- |
| A | **MINOR** | pattern 限定は適切だが、解除条件 / 適用禁止 / broad glob 禁止のコメント明記が欠ける。将来の保守者が誤って広げるリスク。Phase 2 のコメント仕様で D に統合可能 |
| B | **MAJOR** | `**/*.md` で front matter 付き structured Markdown / SKILL.md / references 全般を巻き込む。原典スペック §7 / §9 / Phase 1 §1.2 で禁止されている broad glob の典型例。**却下** |
| C | **MAJOR** | 構造体保護は魅力だが、custom merge driver は `.git/config` への登録が各 clone 必須で bootstrap 漏れリスクが高い。外部 script の保守コスト・レビューコストが Wave 0 の単独開発前提に対して過剰。本タスクのスコープ外 |
| D（base case）| **PASS** | 限定 glob + コメント + 解除条件 + 4 worktree smoke + `git check-attr` 二重検証で全リスクをカバー。Git ビルトインのみで完結し外部依存なし。Phase 2 の設計と完全一致 |

---

## 2. PASS/MINOR/MAJOR の総合判定

### 2.1 base case（D）の評価

- **PASS**
- 価値性 / 実現性 / 整合性 / 運用性のすべてで合格基準を満たす
- Phase 2 の設計（pattern 限定 / コメント仕様 / 解除条件 / state ownership / 4 worktree smoke / ロールバック）が D の評価項目を漏れなく網羅している

### 2.2 残課題（PASS with notes）

| 残課題 | 対応 Phase |
| --- | --- |
| `_legacy.md` 命名規約違反検出の CI 化 | A-2 完了後の補助タスクで対応（B-1 スコープ外） |
| 解除レビューチェックリストの A-2 タスク仕様への組み込み | Phase 12 ドキュメント更新で A-2 仕様にクロスリファレンス追加 |
| 4 worktree smoke の自動化 | Phase 11 手動 smoke で完結。CI 化は別タスク（過剰投資となるため B-1 では行わない）|

---

## 3. 着手可否ゲート

### 3.1 ゲート判定

**CONDITIONAL PASS**（仕様作成は完了、派生実装は条件付き着手可）

### 3.2 着手前提条件（必須）

以下がすべて満たされたとき、派生実装タスクの実装着手を許可する。

- [ ] **A-1（task-skill-ledger-a1-gitignore）が main にマージ済み**
- [ ] **A-2（task-skill-ledger-a2-fragment）が main にマージ済み**
- [ ] **A-3（task-skill-ledger-a3-progressive-disclosure）が main にマージ済み**
- [ ] 上記 3 タスクの完了 PR レビューで `_legacy.md` 命名規約に逸脱がないことを確認済み
- [ ] 並列 worktree が対象 ledger を同時編集していないことを announce 済み

### 3.3 NO-GO 条件

以下のいずれかに該当した時点で B-1 着手を **見送る**。

- A-1 / A-2 / A-3 のいずれかが未マージ → 先行適用すると fragment 化対象にまで driver が残り解除コスト増
- A-2 fragment 化で `_legacy.md` 命名規約が固定されていない（命名揺れがある）→ pattern が機械列挙できず誤適用リスク
- 対象 `_legacy.md` のいずれかに front matter / コードフェンス / 階層構造が混入している → Phase 1 行独立性判定で除外され対象 0 件になる場合は B-1 自体が不要
- root `CHANGELOG.md` を B-1 対象に含める要望が出た場合 → スコープ外。別タスクとして仕切る

### 3.4 着手後の継続ゲート

| Phase | ゲート条件 |
| --- | --- |
| Phase 5（実装）| `git check-attr merge` で対象 / 除外双方の期待結果が出る |
| Phase 9（品質保証）| `mise exec -- pnpm typecheck` / `pnpm lint` 成功（コード変更なし想定の確認） |
| Phase 10（最終レビュー）| 解除手順が `.gitattributes` 内コメント + Phase 12 ドキュメントに 2 重明記されている |
| Phase 11（手動 smoke）| 4 worktree 並列追記で衝突 0 件、全追記行保存 |

---

## 4. 4 条件再評価

Phase 1 §7 で実施した 4 条件評価を、Phase 2 設計と代替案比較を踏まえて再評価する。

### 4.1 価値性（Value）

- **PASS（再確認）**
- A-2 fragment 化で吸収しきれない `_legacy.md` の追記衝突を機械マージで 0 件化することは、4 worktree 並列開発という UBM-Hyogo 固有の前提（CLAUDE.md / new-worktree.sh）に対して不可欠
- 代替案 B（broad glob）は価値以上にリスクが大きく不採用。代替案 C（custom driver）は価値増分に対してコストが過剰

### 4.2 実現性（Feasibility）

- **PASS（再確認）**
- Git ビルトイン `merge=union` の挙動は `gitattributes(5)` で安定文書化されており、CI / runtime 影響なし
- `.gitattributes` 1 ファイル / 1 コミットで完結し、ロールバックも `git revert` 1 コミット粒度
- 4 worktree smoke は `scripts/new-worktree.sh` の既存資産で再現可能

### 4.3 整合性（Consistency）

- **PASS（再確認）**
- A-1（派生物 gitignore 化）/ A-2（fragment 化）/ A-3（SKILL.md 分割）の境界設計と整合し、最後のピースを埋める位置付け
- task-conflict-prevention-skill-state-redesign Phase 7 runbook / Phase 2 pattern と矛盾しない
- 不変条件 #5（D1 アクセスは `apps/api` に閉じる）に抵触しない（D1 を一切触らない）

### 4.4 運用性（Operability）

- **PASS（with notes → resolved）**
- Phase 1 評価時の note「解除条件と解除手順の明文化」は Phase 2 §4 / §9 で完了
- A-2 完了レビューチェックリストへの統合は Phase 12 で対応
- 検証は `git check-attr` のみで完結し、専用ツール / 専用 CI 不要

---

## 5. リスクと対策（Phase 1 / Phase 2 由来の集約）

| # | リスク | 影響度 | 発生確率 | 対策（Phase 配置） |
| --- | --- | --- | --- | --- |
| R-1 | JSON / YAML / lockfile への glob 誤適用で構造体が静かに破損 | **高** | 中 | pattern を `**/_legacy.md` 系に限定 + コメントで `**/*.md` 禁止を明記（Phase 2 §3）+ `git check-attr` で除外側 `unspecified` 必須確認（Phase 2 §6）|
| R-2 | front matter 重複・順序逆転で意味破壊 | 中 | 中 | Phase 1 行独立性判定で front matter 持ちは対象除外（Phase 1 §4）+ pattern が `_legacy.md` のみで front matter なし運用前提（A-2 由来）|
| R-3 | 行順非保証で時系列性破壊 | 中 | 低 | 時系列性が必要な ledger は A-2 fragment 化（ファイル名 timestamp）に倒し B-1 対象外（Phase 1 §3.3）|
| R-4 | A-2 fragment 化完了後に attribute が残り技術負債化 | 中 | 中 | `.gitattributes` 内コメントに解除条件を明記 + A-2 完了レビューチェックリストに残存確認を追加（Phase 2 §4 / §9 + Phase 12）|
| R-5 | A-1〜A-3 未完で B-1 を先行適用し fragment 化対象に driver が残る | 中 | 低 | NO-GO 条件として明記（Phase 3 §3.3）+ 着手前提条件を 3 箇所（Phase 1 / 2 / 3）で重複明記 |
| R-6 | skill 自身の `_legacy.md` 命名規約違反で B-1 効果が部分的に失われる | 中 | 中 | A-2 で `_legacy.md` 命名規約を固定（B-1 前提条件）+ Phase 1 棚卸しで skill 自身を必ず含める（Phase 1 §3.1）|
| R-7 | 現役 fragment（`LOGS/<timestamp>-*.md`）に誤って driver が適用 | **高** | 低 | pattern を `**/_legacy.md` のみに限定し `**/*.md` 禁止 + fragment 側 `unspecified` 確認を Phase 2 §6.3 で必須化 |
| R-8 | 適用後に対象ファイルのフォーマットを「行をまたぐ構造」に変更してしまう | 中 | 低 | 原典スペック §9 補足事項で禁止明記 + Phase 12 ドキュメント更新で運用ガイドに転記 |

---

## 6. レビュー結論

### 6.1 結論

- **base case D（B-1 対象限定 + 解除手順明記）を採用**
- ゲート判定: **PASS with notes**（着手可、ただし A-1 / A-2 / A-3 完了が必須前提）
- Phase 2 設計は代替案比較で抽出された全リスクを Phase 配置レベルで網羅しており、追加修正は不要

### 6.2 派生実装タスクへの引き継ぎ事項

| 引き継ぎ先 | 内容 |
| --- | --- |
| Phase 4（テスト戦略） | Phase 2 §6 validation path / §7 4 worktree smoke を testing pyramid に展開 |
| Phase 5（実装ランブック） | Phase 2 §2 ファイル変更計画 / §3 pattern 設計を Step-by-step 化 |
| Phase 6（異常系検証） | Phase 3 §5 リスク R-1〜R-8 を異常系シナリオに展開 |
| Phase 7（AC マトリクス） | Phase 1 §6 AC-1〜AC-11 を検証手段マトリクスに展開 |
| Phase 9（品質保証） | `mise exec -- pnpm typecheck` / `pnpm lint` の副作用なし確認 |
| Phase 10（最終レビュー） | 解除条件・手順の 2 重明記、A-2 完了チェックリスト連動を最終確認 |
| Phase 11（手動 smoke） | Phase 2 §7 コマンド系列で 4 worktree 並列追記実行、証跡保存 |
| Phase 12（ドキュメント更新） | `.gitattributes` 解除条件 + A-2 完了レビューチェックリストへの統合反映 |
| Phase 13（PR 作成） | 単一コミット PR、ロールバック手順を PR description に明記 |

### 6.3 確定事項

1. **採用案**: D（B-1 対象限定 + 解除手順明記）
2. **編集対象**: `.gitattributes` 単一ファイル、1 コミット粒度
3. **適用 pattern**: `**/_legacy.md` 系の限定 glob のみ（`**/*.md` 禁止）
4. **検証**: `git check-attr merge` を対象 / 除外双方に実行 + 4 worktree smoke
5. **解除**: A-2 fragment 化完了レビューで該当行削除（`.gitattributes` コメント + A-2 仕様双方に明記）
6. **ロールバック**: `git revert` 1 コミット粒度、副作用なし
7. **着手前提**: A-1 / A-2 / A-3 main マージ済み（NO-GO 条件として明記）
