[実装区分: 実装仕様書]

# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 で確定した設計に対し、PR / コミット粒度の alternative 3 案（(a) family 単位を 1 PR に集約 / (b) family ごとに分割 PR / (c) 全 14 ファイル単一コミット）を PASS / MINOR / MAJOR で判定し、本タスクの採用案を確定する。あわせて 4 条件（価値 / 実現 / 整合 / 運用）を再評価し、Phase 4 以降に持ち込む前提を確定する。

## alternative 3 案

### 案 (a): family 単位 1 PR 集約・family 単位コミット【推奨】

- 単一 PR / branch（例: `feat/issue-393-stablekey-cleanup`）
- 7 family を 7 コミットに分割
- 各 commit 後に focused test PASS を確認
- 最終 commit で `scripts/lint-stablekey-literal.test.ts` の strict 期待値を 0 に更新
- 統合検証は PR 1 回分

| 評価軸 | 判定 | 根拠 |
| --- | --- | --- |
| レビュー粒度 | PASS | family ごと commit で diff が物語化 |
| merge コスト | PASS | 1 PR で完結、sync-merge 衝突最小 |
| coverage guard | PASS | lefthook coverage-guard が 1 push で完結 |
| rollback | MINOR | family 単位 revert 可能 |
| 1 サイクル完了 (CONST_007) | PASS | 単一 PR / 1 サイクル実装プロンプト範囲 |

**判定: PASS — 採用**

### 案 (b): family ごと分割 PR

- 7 PR を順次作成（A→B→C→D→E→F→G）
- 各 PR が独立 review / merge
- 最終 PR で strict 期待値更新

| 評価軸 | 判定 | 根拠 |
| --- | --- | --- |
| レビュー粒度 | PASS | 最も粒度が細かい |
| merge コスト | MAJOR | solo 開発で 7 回 sync-merge は過剰、main drift リスク 7 倍 |
| CI 実行回数 | MAJOR | 7 回分の typecheck/lint/vitest が走る |
| 1 サイクル完了 | MAJOR | CONST_007 違反（複数サイクルに分割） |
| 親 03a AC-7 昇格までの latency | MAJOR | 7 PR 全完了を待つ必要 |

**判定: MAJOR — 不採用**

### 案 (c): 全 14 ファイル単一コミット

- 1 PR / 1 commit
- 全置換を 1 コミットで完結
- focused test は最終 1 回のみ

| 評価軸 | 判定 | 根拠 |
| --- | --- | --- |
| レビュー粒度 | MAJOR | 14 ファイル diff の物語性が失われる |
| 段階的 strict count 確認 | MAJOR | family ごとの中間 violation count が evidence に残らない |
| rollback | MAJOR | family 単位 revert 不能 |
| 1 サイクル完了 | PASS | 単一 commit |

**判定: MINOR/MAJOR — 不採用（family 単位コミットの evidence 損失が決定的）**

## 採用案の確定

**案 (a): family 単位 1 PR 集約・family 単位コミット**

- branch: `feat/issue-393-stablekey-literal-legacy-cleanup`
- commit 順序: G → A → B → D → C → E → F → strict-test-update（依存方向: shared utils → sync → repository → public use-case/view-model → admin routes → web → test 期待値）
- 各 commit で `node scripts/lint-stablekey-literal.mjs --strict` の violation count を記録（Phase 7 evidence）
- 最終 commit 後に統合検証 (typecheck / lint / focused vitest / strict 検査) を 1 回実行

## 4 条件再評価

| 条件 | Phase 1 判定 | Phase 3 再評価 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | PASS | PASS | violation 0 / stableKeyCount=31 維持で AC-7 昇格可能 |
| 実現性 | PASS | PASS | 案 (a) で 1 サイクル完了可能 |
| 整合性 | PASS | PASS | identity 置換のため既存挙動不変 |
| 運用性 | PASS | PASS | 単一 PR / family 単位 commit で revert 容易 |

## 多角的チェック観点 (Phase 3 追加)

- sync-merge 中の hook 自動 skip 仕様（CLAUDE.md 記載）と整合 → 単一 PR 案 (a) で問題なし
- coverage guard の `--changed` モードで family 単位コミットが過剰 fail しないか → identity 置換で coverage は不変、PASS
- lefthook の `staged-task-dir-guard` が複数 family commit を阻害しないか → ブランチ名 slug 一致で問題なし

## 統合テスト連携

| 連携先 | 対象 | Phase 4/7 への引き継ぎ |
| --- | --- | --- |
| `scripts/lint-stablekey-literal.test.ts` | strict mode expectation / `stableKeyCount=31` | 最終 test-update commit で violation 期待値を 0 に更新し、count 維持を確認 |
| apps/api focused tests | family A〜D の mapper / repository / route / view-model | Phase 4 test matrix に実在 test path を記録し、存在しない family は統合 vitest で代替 |
| apps/web focused tests | family E〜F の profile / public components | render / state key の identity 置換を確認 |
| packages/shared focused tests | family G consent logic | `publicConsent` / `rulesConsent` の挙動同一性を確認 |

統合テストは新規ロジック追加ではなく identity 置換の退行防止を目的とする。Phase 3 の採用案 (a) では family commit ごとの focused test と、最終 Phase 7 の `typecheck` / `lint` / `lint:stablekey:strict` / focused vitest を二段 gate とする。

## 実行タスク

- [ ] alternative 3 案を PASS/MINOR/MAJOR で判定
- [ ] 案 (a) 採用根拠を明文化
- [ ] commit 順序（G→A→B→D→C→E→F→test-update）を確定
- [ ] 4 条件再評価
- [ ] Phase 4 への前提（commit 単位 focused test 実行）を引き継ぎ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計サマリー |
| 必須 | outputs/phase-02/per-family-plan.md | family 分割の前提 |
| 参考 | CLAUDE.md | sync-merge hook policy / 単一 PR 自律フロー |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | alternative 比較 / 採用案 / 4 条件再評価 |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] 3 案の PASS/MINOR/MAJOR 判定済み
- [ ] 採用案と commit 順序確定
- [ ] 4 条件再評価記録
- [ ] Phase 4 への引き継ぎ整理

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（commit 順序逆転で型解決失敗 / sync-merge 衝突）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 3 を completed

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ: 採用案 (a) / commit 順序 / 4 条件再評価結果
- ブロック条件: 採用案未確定なら Phase 4 の test matrix 設計不可
