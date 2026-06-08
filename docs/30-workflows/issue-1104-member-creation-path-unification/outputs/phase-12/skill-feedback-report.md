# Skill Feedback Report — issue-1104

- 区分: 実装仕様書（NON_VISUAL / implemented_local_evidence_captured）
- 対象 skill: `task-specification-creator`

---

## 観点別フィードバック

### テンプレート改善

- 致命的な不足なし。canonical 9 見出し / Phase 11 evidence テーブル構造（`Classification` / `Path` / `Status`・3 値）の SSOT 固定は機能しており、本タスク（implemented_local_evidence_captured / NON_VISUAL）でも逐語適用できた。
- 小改善案: implemented_local_evidence_captured 段階の Phase 11 evidence inventory は「`manual test result` を実体生成して `present`」にするか「`n/a`」にするかの判断が分かれる。本タスクでは manual-test-result.md を実体生成（テスト計画 + 期待値の契約として）したため `present` とした。テンプレに「implemented_local_evidence_captured でも manual-test-result.md を計画文書として実体生成する場合は `present`、生成しない場合は `n/a`」の分岐例を 1 行載せると判断が速い。

### ワークフロー改善

- **核心知見（promotion 候補）**: issue #1104 §5.1 の member 作成経路の**棚卸し表が現行コードに対し不完全**だった。issue は ingest 経路のみ列挙し、**auto-link 経路（`backfillIdentityFromCandidate` → `session-resolve.ts:53`）を見落とし**ていた。これは `member_status` を生成しない現役の orphan 源であり、issue 前提を鵜呑みにすると「ingest だけ直して auto-link を放置」という不完全な設計を生む。さらに issue の行番号・migration 番号も陳腐化していた（`:303→:307` / `:385→:391` / `0024→0025`）。
  - → **改善（promotion 候補）**: issue / unassigned-task に「作成経路の棚卸し表」「呼び出し箇所の行番号」が含まれる場合、**Phase 1 で必ず現行コードを `grep` して棚卸しを再検証する gate** を明示的に置く。本タスクでは `grep -rn "upsertMember|ensureMemberStatusRow|backfillIdentityFromCandidate"` で全経路を再列挙し、issue の欠落（auto-link）と行番号 drift を検出して index §1.2 で補完した。issue が古い／不完全な棚卸しを持つケースは構造的に再発するため、skill references に「issue の棚卸し表は現行 grep で再検証する」手順として蓄積する価値が高い。

### ドキュメント改善

- **判断例の記録**: GitHub Issue #1104 のラベルが docs/予防系であっても、root cause（生成責務の分散 + auto-link 経路の orphan 源）の解消にはコード変更（`createMemberWithStatus` 新設 + 経路差し替え）が必要なため、CONST_004（ラベルより実態優先）に従い**実装仕様書**として作成した。index 冒頭に「実装区分: 実装仕様書」の根拠注記を残し、後続レビューで分類の意図が追えるようにした。

---

## promotion 判断

| 知見 | promotion 結果（implemented_local_evidence_captured 段階） |
| --- | --- |
| issue の作成経路棚卸し表が不完全（auto-link 欠落）→ Phase 1 で現行 grep による棚卸し再検証 gate を必須化 | **反映済み** → 候補先 `task-specification-creator/references/phase-template-phase1.md`（「issue 棚卸し表 / 行番号は現行 grep で再検証する」ステップ強化）+ `references/patterns-lessons-and-pitfalls.md`（L-I1104 として「issue 棚卸しの auto-link 欠落」事例蓄積） |
| implemented_local_evidence_captured 段階で `manual-test-result.md` を実体生成する場合の `present` / `n/a` 判断例 | **反映済み** → `task-specification-creator/references/phase12-compliance-check-template.md` に NON_VISUAL local deterministic evidence の `present` 例と、未実行計画だけなら `n/a` / `pending` を使う境界を追記 |
| docs/予防ラベル → CONST_004 で実装仕様書化（生成責務集約はコード変更必須） | **反映済み** → 既存の CONST_004 判断例に 1 ケース追加 |

> 本 workflow は **implemented_local_evidence_captured**（ローカル実装・証跡取得済み）段階であり、上記 promotion は同 wave で skill references へ反映済み。`aiworkflow-requirements` は公開 API shape 更新は N/A だが、workflow ledger/inventory は同 wave で反映済み。commit / push / PR / completed-tasks への physical move はすべて user-gated。
