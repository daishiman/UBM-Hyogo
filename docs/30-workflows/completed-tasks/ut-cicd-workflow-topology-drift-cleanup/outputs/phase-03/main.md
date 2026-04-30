# Phase 3 成果物: 設計レビュー (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| Phase | 3 / 13（設計レビュー） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（design review） |
| 連動成果物 | phase-02/drift-matrix-design.md, phase-02/canonical-spec-update-plan.md |

---

## 1. 目的

Phase 2 の設計（drift-matrix-design.md / canonical-spec-update-plan.md）に対して **4 件の代替案** を比較し、4 条件（価値性 / 実現性 / 整合性 / 運用性）+ 4 観点（不変条件 / docs-only 境界 / 派生タスク粒度 / Pages vs Workers 判断委譲）に対する **PASS / MINOR / MAJOR 判定** を確定。Phase 4 以降に進む着手可否ゲートを通す。

---

## 2. 代替案列挙

### 案 A: 三者 drift マトリクス + 派生タスク委譲（Phase 2 採用 = base case）

- **概要**: docs / code / 観測前提 の三者を比較し、差分マトリクス（10 件）で分類。docs-only（7 件）は本タスク Phase 12 で正本仕様更新。impl 必要（DRIFT-03 等 1 件、その他は条件付き）は `UT-CICD-DRIFT-IMPL-*.md` を派生起票。Pages vs OpenNext Workers の重い判断は `UT-CICD-DRIFT-IMPL-001-pages-vs-workers-decision` に委譲。
- **利点**: 本タスクが docs-only に閉じる、impl 差分の責任分界が明確、重い判断を抱え込まない、派生タスク命名規則が一意（NNN-slug）。
- **欠点**: 派生タスクが複数発生する場合、起票・管理コストが増える。Phase 12 で派生タスク列挙の品質が後段運用に直結する。

### 案 B: 一括 impl タスク化（drift 整理 + yaml 修正を本タスクに統合）

- **概要**: 本タスク内で yaml / wrangler.toml の修正まで実施し、Pages → OpenNext Workers cutover も含める。
- **利点**: 1 タスクで完結、追跡が単純。
- **欠点**: docs-only としてのスコープ大幅逸脱、Pages vs Workers の重い判断を 1 タスク内で実施する必要があり実現性 MAJOR、PR 差分肥大化、CLAUDE.md の「ブランチ戦略」と CI gate 設計の同時変更が必要、不変条件 #5 / #6 の確認も同タスク内で実施する負荷増。

### 案 C: 仕様書側のみ更新（drift 起票なし）

- **概要**: 正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）を実体に合わせて行単位で書き換えるのみ。impl 必要差分（DRIFT-03 等）の派生起票はしない。
- **利点**: 作業最小、PR 軽量、レビュー負荷小。
- **欠点**: 価値性 MAJOR（impl 必要差分が記録されず、Pages vs Workers 二系統混在が放置され、05a の cost guardrail が誤った前提のまま稼働し続ける）、AC-7（impl 必要差分の派生タスク起票方針）を直接満たせない。

### 案 D: 監視前提（05a）側を正本に昇格

- **概要**: 05a observability-matrix.md を正本扱いし、`deployment-gha.md` / `deployment-cloudflare.md` を 05a に揃える方向で書き換える。
- **利点**: 監視前提が正本になることで cost guardrail 設計が容易化、05a と仕様書の二重管理を解消。
- **欠点**: aiworkflow-requirements skill の `references/` を正本とする既存ガバナンス（CLAUDE.md「主要ディレクトリ」/ Skill 仕様）と整合せず整合性 MAJOR。05a は phase-12 完了済みの成果物であり sources of truth ではない。一般的な docs ガバナンス原則に反する。

---

## 3. 代替案 × 評価マトリクス（4 条件 + 4 観点、空セルなし）

| 観点 | 案 A (base) | 案 B (一括 impl) | 案 C (docs のみ) | 案 D (05a を正本) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | **MAJOR**（impl 差分埋没） | PASS |
| 実現性 | PASS | **MAJOR**（スコープ過大、Pages vs Workers cutover 内包） | PASS | MINOR |
| 整合性（不変条件 #5/#6） | PASS | MINOR（同タスク内多領域で抵触リスク増） | PASS | **MAJOR**（既存ガバナンス逸脱） |
| 運用性 | PASS | MINOR（PR 巨大、レビュー困難） | **MAJOR**（追跡欠落） | MINOR |
| docs-only 境界 | PASS | **MAJOR**（境界破壊） | PASS | PASS |
| 派生タスク粒度 | PASS | N/A（派生せず） | **MAJOR**（起票なし） | MINOR |
| Pages vs Workers 判断委譲 | PASS | **MAJOR**（同タスク内決定） | MINOR（判断不在で放置） | MINOR（05a 寄りで歪む） |
| CLOSED Issue #58 整合 | PASS | PASS | PASS | PASS |

空セル: なし（全 4 案 × 8 観点の 32 セル充填）。

---

## 4. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| **PASS** | 4 条件・各観点を完全に満たし、blocker / 残課題なし |
| **MINOR** | 軽微な懸念がある（例: PR 規模が大きいが分割可能、運用上の手間が増えるが許容範囲、判断不在による放置リスクが低レベル） |
| **MAJOR** | 着手不可レベルの懸念（例: 不変条件抵触、既存ガバナンス逸脱、スコープ過大、AC を直接満たせない、価値が出ない） |

---

## 5. base case（案 A）選定理由

案 A を採用する理由（代替案比較から演繹）:

1. **本タスクが docs-only / specification-cleanup として定義**されており（index.md「タスク種別」、phase-01「scope」）、案 B / D はスコープ逸脱（docs-only 境界 MAJOR / 整合性 MAJOR）。
2. **Pages vs OpenNext Workers の重い判断**を本タスクで抱えず派生（`UT-CICD-DRIFT-IMPL-001-pages-vs-workers-decision`）へ委譲できるのは案 A のみ。Phase 2 の判別ルール 4（判断保留 → 派生）と整合。
3. **案 C は AC-7（impl 必要差分の派生タスク起票方針）を直接満たせない**。価値性 MAJOR。
4. **既存ガバナンス**（CLAUDE.md / aiworkflow-requirements skill）が `deployment-gha.md` / `deployment-cloudflare.md` を正本としており、案 D の正本昇格は整合性 MAJOR（既存 skill の `references/` が sources of truth である原則を逸脱）。
5. 案 A の全観点が PASS（MAJOR ゼロ、MINOR ゼロ）。他 3 案はいずれも 1 件以上の MAJOR を含み、着手可否ゲートの GO 基準に到達しない。

---

## 6. 着手可否ゲート判定

| 判定 | 条件 |
| --- | --- |
| **GO** | base case の 4 条件 + 全観点が PASS、open question が 0 件または受け皿 Phase / 派生タスクが指定されている |
| **NO-GO** | base case で MAJOR が 1 件以上、または不変条件 #5 / #6 抵触の懸念が解消できていない |

### 本タスクの判定: **GO**（PASS）

根拠:

- 案 A の 8 観点すべてが PASS（MAJOR ゼロ）
- 不変条件 #5 / #6 抵触なし（drift-matrix-design.md §5 で確認済み）
- open question 3 件すべてに受け皿あり（§7）
- AC-1〜AC-11 のうち、AC-1 / AC-3（部分） / AC-8 / AC-9 / AC-10 / AC-11 は Phase 1 で達成、AC-2 / AC-3（全体） / AC-4 / AC-5 / AC-7 は Phase 2 で達成、AC-6 は Phase 12 で実施予定として方針確定済み

### 最終判定: **PASS**

---

## 7. open question（残課題）と受け皿

| # | 残課題 | 受け皿 Phase / タスク | 備考 |
| --- | --- | --- | --- |
| 1 | drift マトリクス 10 件の派生タスク粒度（1 task = 1 diff か、関連 diff グルーピングか） | Phase 5（実装ランブック） | base case では DRIFT-03+07 を 1 派生（pages-vs-workers-decision）にグルーピング。他は起票見送り or 既存タスク委譲。Phase 5 で再確認 |
| 2 | Pages vs OpenNext Workers の最終判断 | 派生タスク `UT-CICD-DRIFT-IMPL-001-pages-vs-workers-decision` | 本タスクでは判断材料整理のみ（drift-matrix-design.md §7） |
| 3 | 05a observability-matrix.md（completed-tasks 配下）への波及更新要否 | Phase 12（派生タスク列挙時に再評価） | 必要時のみ `UT-CICD-DRIFT-IMPL-004-observability-matrix-extend` を起票 |
| 4 | DRIFT-04 / DRIFT-05（Discord 通知）を docs-only 案 a で吸収するか impl 案 b で実装するか | UT-08-IMPL（観測性実装） | base case では a 案（注記吸収）。UT-08-IMPL が通知ステップを実装する前提 |
| 5 | UT-GOV-001 の `required_status_checks` に登録する workflow 名（`ci` / `Validate Build` / `verify-indexes-up-to-date` / `backend-ci` / `web-cd`）の最終確定 | UT-GOV-001（並列タスク） | Phase 11 / Phase 12 で interface 確認 |

すべての open question が受け皿を持つ → GO 判定維持。

---

## 8. 多角的チェック（AI 自己検証）

| 観点 | 結果 |
| --- | --- |
| base case 選定理由が代替案比較マトリクスから演繹的に導かれているか | PASS（§5 で 5 つの根拠を §3 マトリクスから引用） |
| 全代替案 × 全観点でセル空白がないか | PASS（4 案 × 8 観点 = 32 セル充填、§3） |
| MAJOR 判定がついた案を base case に選んでいないか | PASS（案 A は MAJOR ゼロ、案 B/C/D は 1 件以上 MAJOR） |
| 残課題が必ずどこかの Phase / 派生タスクで受け皿を持つか | PASS（5 件すべて受け皿あり、§7） |
| 不変条件 #5 / #6 抵触が代替案比較に組み込まれているか | PASS（「整合性（不変条件 #5/#6）」行が §3 マトリクスに存在） |
| GitHub Issue #58 取扱（CLOSED 維持）が代替案比較に組み込まれているか | PASS（「CLOSED Issue #58 整合」行が §3 マトリクスに存在、全案 PASS） |

---

## 9. 完了条件チェック

- [x] 代替案が 4 件以上列挙されている（A/B/C/D）— §2
- [x] 各代替案 × 4 条件 + 4 観点で空セルがない（32 セル）— §3
- [x] base case（案 A）の選定理由が記述されている — §5
- [x] PASS / MINOR / MAJOR の基準が定義されている — §4
- [x] GO / NO-GO ゲートが定義され、本タスクが GO 判定であることが明記されている — §6（GO / PASS）
- [x] open question が 0 件、または受け皿 Phase / 派生タスクが指定されている — §7（5 件すべて受け皿あり）

---

## 10. 最終判定: **PASS（GO）**

- 案 A を base case として確定
- 4 条件 + 4 観点すべて PASS（MAJOR ゼロ、MINOR ゼロ）
- 不変条件 #5 / #6 抵触なし
- open question 5 件すべて受け皿あり
- AC-1〜AC-11 のロードマップ確定（Phase 1/2 達成済み + Phase 12 で実体更新）

---

## 11. 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎインプット:
  - GO 判定根拠（案 A の全観点 PASS）
  - PASS / MINOR / MAJOR 基準（§4）
  - open question 5 件と受け皿（§7）
  - drift マトリクス 10 件と派生タスク命名一覧
  - canonical-spec-update-plan.md の適用順
- ブロック条件: なし（base case で MAJOR ゼロ、open question すべて受け皿あり、不変条件抵触なし）
