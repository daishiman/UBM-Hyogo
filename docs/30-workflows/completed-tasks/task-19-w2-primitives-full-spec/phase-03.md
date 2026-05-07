[実装区分: ドキュメントのみ]

# Phase 3: 設計レビュー

> 理由: task-19 の主成果物はドキュメント作成で完結する。review cycle で検出した隣接 apps/api diff は task-19 primary deliverable から分離して扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | primitives-full-spec |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-07 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト作成) |
| 状態 | completed |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| coverage AC | 適用外（pure-docs） |

## 目的

Phase 2 で確定した 19 セクション topology / 6 サブセクション structure / a11y matrix / token 辞書 / §99 根拠表が、AC-1〜AC-17 と不変条件 1〜7 を完全に支えるかを判定し、Phase 4 開始条件 / Phase 13 blocked 条件を確定する。simpler alternative の検討を記録する。

## 実行タスク

- 設計レビュー実施: 19 セクション topology の網羅性 / 6 サブセクション structure の正本性 / a11y matrix の WAI-ARIA 整合 / token 辞書の名前空間整合
- PASS / MINOR / MAJOR 判定基準の明記
- simpler alternative の検討記録（例: §の分割粒度、派生 primitive の独立 § 化 vs Card 内合流、§99 の inline 化）
- Phase 4 開始条件の確定
- Phase 13 blocked 条件の確定
- MINOR 追跡テーブルの初期化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-17 |
| 必須 | outputs/phase-02/main.md | 19 セクション topology / 6 サブセクション / a11y matrix / token 辞書 |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/primitives.jsx | 行範囲 cross-check |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | DoD §8 / リスク §9 |

## 実行手順

### Step 1: PASS / MINOR / MAJOR 判定基準

| 判定 | 戻り先 | 条件 |
| --- | --- | --- |
| PASS | Phase 4 へ進行 | AC-1〜AC-17 全て topology に展開済 / 不変条件 1〜7 全て AC にマッピング済 / 19 見出し確定 / 6 サブセクション structure 確定 / a11y matrix が WAI-ARIA 整合 / §99 3 件確定 |
| MINOR | Phase 4 と並行追跡 | 派生 primitive の行範囲注記不足 / token カテゴリ命名の暫定（task-08 確定後に追従可能） / link 先 §番号の placeholder（採用例側 task が未完了） |
| MAJOR | Phase 2 へ差戻し | 17 primitive のうち列挙漏れがある / dialog 系 a11y（role=dialog + aria-modal + Esc + focus trap）が欠落 / icon-only Button の aria-label 必須が抜けている / token 値（HEX/oklch/px）が topology や sample に混入 / primitives.jsx 改変前提の設計 |

### Step 2: simpler alternative 検討記録

| 検討案 | 採否 | 理由 |
| --- | --- | --- |
| 19 セクションを「interactive / form / overlay / nav / status / non-interactive」の 6 グループに集約 | 不採用 | grep 可能見出し（タスク正本 §0.7 19 件）が破綻し AC-2 を満たせない |
| 派生 primitive (Card/Input/Select 等) を独立 § にせず Field/Section 内に inline 化 | 不採用 | task-10（実装）が「09c §X.Y を読んで 1 ファイル書ける」決定論を喪失 |
| §99 を別ファイル（09c-not-adopted.md）に分離 | 不採用 | grep 可能見出し `## 99. 不採用 primitive` が 09c から消え AC-7 を満たせない |
| JSX 一字一句転記を要約に縮約 | 不採用 | 不変条件 2（一字一句）違反 / Phase 4 の転記一致検証が成立しない |
| token 値を 09c に併記 | 不採用 | 不変条件 3 違反 / §6.2 grep gate が必ず fail |

### Step 3: Phase 4 開始条件

- [ ] AC-1〜AC-17 が全て topology / a11y matrix / token 辞書 / §99 表に展開済
- [ ] 不変条件 1〜7 が全て AC にマッピング済
- [ ] 19 見出しの確定リストが outputs/phase-02/main.md に存在
- [ ] 6 サブセクション template が固定
- [ ] §6.2 grep gate コマンド 4 種が確定
- [ ] 並列 wave ownership 宣言が yes（owner=本 task）
- [ ] MAJOR 0 件 / MINOR は追跡テーブル化済

### Step 4: Phase 13 blocked 条件

- 09c-primitives.md の行数が 600〜1200 範囲外
- 19 grep 可能見出しのいずれかが欠落
- §6.2 grep gate（HEX / oklch / Npx / bg-[）が 1 件以上 hit
- 各 §X の 6 サブセクション（X.1〜X.6）のいずれかが欠落
- §99 3 件（TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage）のいずれかが欠落
- dialog 系（§14 Drawer / §15 Modal）に role=dialog + aria-modal + Esc + focus trap のいずれかが欠落
- icon-only Button § で aria-label 必須記載が欠落
- markdown lint で error が 1 件以上
- primitives.jsx に改変差分が存在（`git diff` で hit）

### Step 5: 上流ブロッカー gate 重複明記（3 箇所目）

タスク正本に記載された上流依存（task-01: scope-gate-all-screens 完了）について、Phase 1（前提条件）/ Phase 2（依存順序の wave ownership 宣言）/ **Phase 3（NO-GO 条件）** の 3 箇所で重複明記する（gate 重複明記ルール / T-6 AC-5）。

- 上流ブロッカー: task-01 が未完了の場合は本 Phase で MAJOR 判定とし、Phase 4 へ進行不可
- 確認方法: `gh issue list --label task-01 --state closed` または task-01 の artifacts.json status=completed 確認

### Step 6: MINOR 追跡テーブル（初期化）

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 備考 |
| --- | --- | --- | --- | --- |
| TECH-M-01 | 派生 primitive の行範囲注記が暫定 | Phase 5 | Phase 9 | Card/Input/Select/Sidebar/Stat/EmptyState/Avatar/Banner |
| TECH-M-02 | token カテゴリ命名は task-08 確定値に依存 | Phase 5 | Phase 9 / Phase 10 | 09b 確定後に rename 追従 |
| TECH-M-03 | 09e/09f/09g § 番号は task-20/21/22 確定後に最終化 | Phase 5 | Phase 12 | placeholder 番号を Phase 12 で同期 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | PASS 判定後、grep gate / markdown 構造検証 script の作成に進む |
| Phase 5 | 設計レビュー結果を執筆ガイドラインとして参照 |
| Phase 7 | AC トレースの根拠 |
| Phase 10 | 最終レビュー時に Phase 13 blocked 条件を再評価 |

## 多角的チェック観点（AIが判断）

- 価値性: PASS 判定が「Phase 4 へ進んで良い」と一意に答えられるか
- 実現性: MAJOR 戻し条件が機械的に検証可能か（grep / 行数で判定可能か）
- 整合性: simpler alternative の不採用理由が AC / 不変条件と直接結びついているか
- 運用性: MINOR 3 件が Phase 5 / 9 / 10 / 12 で確実に解決確認される導線になっているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | PASS / MINOR / MAJOR 判定基準確定 | 3 | spec_created | Step 1 |
| 2 | simpler alternative 検討記録 | 3 | spec_created | Step 2（5 案 / 全不採用） |
| 3 | Phase 4 開始条件確定 | 3 | spec_created | Step 3 |
| 4 | Phase 13 blocked 条件確定 | 3 | spec_created | Step 4 |
| 5 | 上流ブロッカー 3 箇所目明記 | 3 | spec_created | Step 5 |
| 6 | MINOR 追跡テーブル初期化 | 3 | spec_created | Step 6 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー結果 / 判定基準 / simpler alternative / Phase 4 開始 / Phase 13 blocked / MINOR 追跡 |
| メタ | artifacts.json | Phase 状態 |

## 完了条件

- [ ] PASS / MINOR / MAJOR 判定基準が main.md に記載
- [ ] simpler alternative 検討記録が 5 件以上記載
- [ ] Phase 4 開始条件チェックリストが記載
- [ ] Phase 13 blocked 条件チェックリストが記載
- [ ] 上流ブロッカー（task-01）の 3 箇所目重複明記済
- [ ] MINOR 追跡テーブルが初期化済
- [ ] 本 Phase の判定が PASS（または MINOR）であり MAJOR でない
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが spec_created
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（topology 不整合 / a11y 欠落 / token 値混入 / primitives.jsx 改変前提）の検討済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の該当 phase を spec_created に更新

## 次 Phase

Phase 4: テスト作成（markdown 構造検証 + grep gate スクリプト整備 / scripts/verify-09c-no-visual-values.sh の作成手順）
