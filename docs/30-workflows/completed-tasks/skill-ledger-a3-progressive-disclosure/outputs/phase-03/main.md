# Phase 3 成果物 — 設計レビュー main.md

タスク: skill-ledger-a3-progressive-disclosure
Phase: 3 / 13（設計レビュー）
作成日: 2026-04-28
状態: spec_created（docs-only / NON_VISUAL）

本書は Phase 2 の設計（`outputs/phase-02/inventory.md` / `outputs/phase-02/split-design.md`）に対する設計レビュー結果をまとめる。代替案比較は `alternatives.md` を参照のこと。

---

## 1. レビュー対象

| 種別 | パス |
| --- | --- |
| base case | `outputs/phase-02/split-design.md` |
| 棚卸し | `outputs/phase-02/inventory.md` |
| 要件 | `outputs/phase-01/main.md` |

---

## 2. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。block にならず、Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 実装時に運用上の補足対応（log / runbook 追記 / Anchor 追加）が必要だが、Phase 4 への移行は許可。 |
| MAJOR | block。Phase 4 に進めない。設計を Phase 2 に差し戻すか、open question として MVP スコープ外に明確化する。 |

---

## 3. base case 最終判定（全観点）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 並列編集 conflict を構造的に削減し、loader context 消費も低減。`task-specification-creator/SKILL.md` 517 行のドッグフーディング矛盾を解消 |
| 実現性 | PASS | A-1 / A-2 完了済み、`aiworkflow-requirements`（190 行 + references）の前例あり、機械的 cut & paste のみで完了 |
| 整合性 | PASS | プロジェクト不変条件 #1〜#7 に touch せず、skill-ledger 内不変条件（canonical/mirror 差分 0、cut & paste のみ、1 PR = 1 skill）をすべて遵守 |
| 運用性 | PASS | 行数検査 / `rg` リンク健全性 / `diff -r` の 3 点で自動検証可能。ロールバックは 1 PR 単位 |
| 参照切れリスク | MINOR → PASS（緩和策あり） | entry 末尾の references リンク表で外部からの旧アンカー誘導を構造化。Phase 5 / 11 で `rg` 検査を完了条件化 |
| 並列衝突 | PASS | 1 PR = 1 skill 厳守 + 着手前の skill 単位 announce。順序は task-specification-creator → automation-30 → skill-creator → github-issue-manager → claude-agent-sdk |
| ドッグフーディング解消（AC-9） | PASS | task-specification-creator を最優先・単独 PR で 200 行未満化（entry 見積もり 165 行） |
| Anchor 追記（AC-10） | PASS | 「fragment で書け」「200 行を超えたら分割」を別小 PR で独立 revert 可能に追記 |
| mirror 同期（AC-5） | PASS | canonical 編集後に rsync 等で `.agents/skills/<skill>/` 同期、`diff -r` = 0 を完了条件化 |
| 意味的書き換え混入 | PASS | 切り出しは「セクション単位の cut & paste」のみ。文言修正は別タスクへ分離。automation-30 の重複ブロック除去は「重複削除」のみで意味変更ではない |

**総合判定: 全観点 PASS。MAJOR ゼロ。MINOR は緩和策で PASS 化済み。**

---

## 4. リスクレビュー

| # | リスク | 影響度 | 発生確率 | 対策 | 受け皿 Phase |
| --- | --- | --- | --- | --- | --- |
| 1 | 既存ドキュメント・他 skill から SKILL.md 内部アンカーへの大量リンクが分割で切れる | 高 | 中 | entry 末尾に references リンク表を必ず置く。`rg -n 'references/'` 健全性検査を完了条件化（AC-7） | Phase 5 / 11 |
| 2 | 並列で同 SKILL.md を編集する他タスクと衝突 | 高 | 中 | A-2 / A-1 完了後に着手。skill 単位 announce。1 PR = 1 skill 厳守 | Phase 5 |
| 3 | 意味的書き換えがメカニカル分割に混入 | 中 | 低 | 切り出しは「セクション単位の cut & paste」のみ。Anchor 追記は別小 PR で独立化 | Phase 5 / 13 |
| 4 | canonical / mirror 同期漏れ | 中 | 中 | `diff -r .claude/skills/<skill> .agents/skills/<skill>` を完了条件化（AC-5） | Phase 5 / 11 |
| 5 | 責務境界判断の skill ごとの揺れ | 中 | 高 | entry 残置の固定 10 要素を共通テンプレで決め打ち。split-design.md で skill ごとに表化 | Phase 2 完了済 |
| 6 | ドッグフーディング矛盾が残存（task-specification-creator が後回し） | 中 | 中 | 表先頭・最優先・単独 PR で固定（AC-9）。Phase 5 実装順 1 番 | Phase 5 / 13 |

---

## 5. AC トレーサビリティ（base case が AC-1〜AC-11 を満たすか）

| AC | 充足見込み | 根拠 |
| --- | --- | --- |
| AC-1 全対象 SKILL.md が 200 行未満 | OK | split-design.md で 5 skill すべて 200 未満見積もり（最大 183 行） |
| AC-2 references が単一責務命名 | OK | topic 命名規則（`requirements-review` / `phase-12-deepdive` / `mode-collaborative` 等）を Phase 2 で確定 |
| AC-3 entry に固定 10 要素保持 | OK | 全 skill の設計表で 10 要素全行存在 |
| AC-4 references 同士に循環参照なし | OK | 全 skill の依存グラフが entry → references の片方向のみ |
| AC-5 canonical / mirror 差分 0 | OK | 各 PR 内に同期コミットを含める計画 |
| AC-6 行数検査 OK | OK | AC-1 と同根拠 |
| AC-7 リンク健全性 0 件 | OK（要 Phase 11 検証） | entry リンク表 + Phase 5 / 11 で `rg` 検査完了条件 |
| AC-8 未参照 reference 0 件 | OK | references はすべて entry リンク表に列挙される設計 |
| AC-9 task-specification-creator 最優先・単独 PR | OK | split-design.md 表先頭 / PR 順 1 番 / `feat/skill-ledger-a3-task-specification-creator` |
| AC-10 Anchor 追記 | OK | 別小 PR で独立 revert 可能に追記 |
| AC-11 4条件最終判定 PASS | OK | 上表「base case 最終判定」全 PASS |

---

## 6. 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たす）

- [x] 代替案 3 案以上が評価マトリクスに並んでいる（A / B / C / D の 4 案）
- [x] base case の最終判定が全観点 PASS
- [x] MAJOR が一つも残っていない
- [x] MINOR がある場合、対応 Phase（5 / 11）が指定されている
- [x] open question が 0 件、または受け皿 Phase が明記されている
- [x] task-specification-creator の最優先・単独 PR 計画が split-design.md の先頭に固定されている

### NO-GO 条件（一つでも該当）

- [ ] 4条件のいずれかに MAJOR が残る（→ 該当なし）
- [ ] skill-ledger 内不変条件に違反する設計が残っている（→ 該当なし）
- [ ] entry 残置 10 要素のいずれかが欠落している skill がある（→ 該当なし）
- [ ] references 同士に循環参照・相互参照が残っている（→ 該当なし）
- [ ] ドッグフーディング論点（AC-9 / AC-10）が未対応（→ 該当なし）

**判定: GO。Phase 4（テスト戦略）へ進行可能。**

---

## 7. open question（後続 Phase へ引き継ぎ）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | Anchor 追記の小 PR を A-3 本体 PR の前後どちらで出すか | Phase 5 | 推奨: 本体 PR と同時または直後（独立 revert 維持のため別ブランチ）。実装ランブックで最終確定 |
| 2 | references topic の細粒度（4〜5 件か / もっと細かく分けるか）の最終決定 | Phase 5 | split-design.md の topic 数を実装中に再確認。entry が 200 を超えそうなら追加切り出し |
| 3 | skill-creator スキル本体テンプレへの 200 行制約組込み | Phase 12 unassigned | 再発防止策として別タスク化（本タスクスコープ外） |
| 4 | 案 D（skill 個別判断）を将来導入するか | Phase 12 unassigned | 次 Wave 以降の判断 |
| 5 | automation-30 の重複ブロック（L5〜174 と L200〜382）整理を本 PR でやるか別 PR か | Phase 5 | 推奨: 同 PR 内で「重複削除」として実施（意味変更ではないため不変条件遵守）。Phase 5 ランブックで最終確定 |

---

## 8. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用 base case を入力に、行数検査 / `rg` リンク健全性 / `diff -r` のテスト戦略を組む |
| Phase 5 | open question #1 / #2 / #5 を実装で確定 |
| Phase 7 | base case の AC-1〜AC-11 を AC matrix の左軸に再利用 |
| Phase 10 | 4条件 + 9 観点の最終判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | リスク 6 件すべての検証ログ取得 |
| Phase 12 | open question #3 / #4 を unassigned-task-detection.md に登録 |

---

## 9. 完了条件チェック

- [x] 代替案が 3 案以上（4 案）比較されている
- [x] 9 観点 × 4 案のマトリクスに空セルが無い（alternatives.md 参照）
- [x] base case（案 C）の最終判定が全観点 PASS
- [x] PASS / MINOR / MAJOR の判定基準が明文化されている
- [x] リスクレビュー 6 件が対策付きで表化されている
- [x] 着手可否ゲートの GO / NO-GO が記述されている
- [x] open question 5 件すべてに受け皿 Phase が割り当てられている
- [x] 成果物が 2 ファイル（main.md / alternatives.md）に分離されている

---

## 10. 次 Phase への引き渡し

- 採用 base case = 案 C（Progressive Disclosure 固定セット、entry 10 要素 + references 単一責務 topic）
- 行数検査 / `rg` リンク健全性 / `diff -r` mirror diff の 3 点を Phase 4 のテスト戦略入力として渡す
- リスク 6 件を Phase 6（異常系検証）の網羅対象として渡す
- open question 5 件を該当 Phase（5 / 12 unassigned）へ register
- task-specification-creator の最優先・単独 PR 計画を Phase 5 / 13 に引き渡し
- 各 skill の entry 残置範囲・references topic 一覧・行数見積もりは split-design.md を正本として参照
