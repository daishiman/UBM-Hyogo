# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計：差分マトリクス設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（design review） |

## 目的

Phase 2 の設計（drift-matrix-design.md / canonical-spec-update-plan.md）に対して 3 つ以上の代替案を比較し、4条件（価値性 / 実現性 / 整合性 / 運用性）と各観点（不変条件 / docs-only 境界 / 派生タスク粒度 / Pages vs Workers 判断委譲）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通すこと。

## 実行タスク

1. 代替案を最低 3 つ列挙する（A: 三者 drift マトリクス + 派生タスク委譲（Phase 2 採用） / B: 一括 impl タスク化 / C: 仕様書側のみ更新（drift 起票なし） / D: 監視前提（05a）側を正本に昇格）（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4条件 + 4 観点で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（Phase 2 採用案 = 三者 drift マトリクス + 派生タスク委譲）を選定理由付きで確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載）。
5. 着手可否ゲートを定義する（完了条件: GO / NO-GO 判定基準が Phase 4 移行の前提として明示されている）。
6. 残課題（open question）を Phase 4 以降に明示的に渡す（完了条件: open question が 0 件 or 受け皿 Phase が指定されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md | base case の構造 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/canonical-spec-update-plan.md | base case の更新方針 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | 正本仕様（更新対象） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare 正本仕様 |

## 代替案比較

### 案 A: 三者 drift マトリクス + 派生タスク委譲（base case = Phase 2 採用）

- 概要: docs / code / 観測前提 の三者を比較し、差分マトリクスで分類。docs-only は本タスク内で正本仕様更新、impl 必要は `UT-CICD-DRIFT-IMPL-*.md` を派生起票。
- 利点: 本タスクが docs-only に閉じる、impl 必要差分の責任分界が明確、Pages vs Workers の重い判断を本タスクで抱え込まない。
- 欠点: 派生タスクが多数発生する場合、起票・管理コストが増える。Phase 12 で派生タスク列挙の品質が直接後段の運用に影響する。

### 案 B: 一括 impl タスク化（drift 整理 + yaml 修正を本タスクに統合）

- 概要: 本タスク内で yaml / wrangler.toml の修正まで行う。
- 利点: 1 タスクで完結し、追跡が単純。
- 欠点: docs-only タスクとしてのスコープを大幅に逸脱、Pages vs Workers のような重い判断を 1 タスク内で実施する必要があり実現性 MAJOR、不変条件 #5 / #6 の確認も同タスク内で実施する負荷増、PR の差分が肥大化しレビュー困難。

### 案 C: 仕様書側のみ更新（drift 起票なし）

- 概要: 正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）を実体に合わせて更新するのみ。impl 必要差分の起票はしない。
- 利点: 作業最小、PR 軽量。
- 欠点: 価値性 MAJOR（impl 必要差分が記録されず、05a の cost guardrail が誤った前提のまま稼働し続ける）、AC-7（impl 必要差分の派生タスク起票方針）を満たせない。

### 案 D: 監視前提（05a）側を正本に昇格

- 概要: 05a observability-matrix.md を正本扱いし、`deployment-gha.md` / `deployment-cloudflare.md` を 05a に揃える。
- 利点: 監視前提が正本になることで cost guardrail 設計が容易化。
- 欠点: aiworkflow-requirements skill の references を正本とする既存ガバナンス（CLAUDE.md）と整合しない、整合性 MAJOR。05a は phase-12 成果物であり正本記述の sources of truth ではない。

### 代替案 × 評価マトリクス

| 観点 | 案 A (base) | 案 B (一括 impl) | 案 C (docs のみ) | 案 D (05a を正本) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | MAJOR（impl 差分埋没） | PASS |
| 実現性 | PASS | MAJOR（スコープ過大） | PASS | MINOR |
| 整合性（不変条件 #5/#6） | PASS | MINOR（同タスク内多領域） | PASS | MAJOR（既存ガバナンス逸脱） |
| 運用性 | PASS | MINOR（PR 巨大） | MAJOR（追跡欠落） | MINOR |
| docs-only 境界 | PASS | MAJOR（境界破壊） | PASS | PASS |
| 派生タスク粒度 | PASS | N/A | MAJOR（起票なし） | MINOR |
| Pages vs Workers 判断委譲 | PASS | MAJOR（同タスク内決定） | MINOR | MINOR |
| CLOSED Issue 整合 | PASS | PASS | PASS | PASS |

## base case 選定理由

案 A を採用する理由:

1. 本タスクが docs-only / specification-cleanup として定義されており、案 B / D はスコープを逸脱する
2. Pages vs Workers のような重い判断を本タスクで抱えず派生タスクへ委譲できるのは案 A のみで、Phase 2 の判別ルール 4（判断保留 → 派生）と整合する
3. 案 C は AC-7（impl 必要差分の派生タスク起票方針）を直接満たせない
4. 既存ガバナンス（CLAUDE.md / aiworkflow-requirements skill）が `deployment-gha.md` / `deployment-cloudflare.md` を正本としており、案 D の正本昇格は整合性 MAJOR

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4条件・各観点を完全に満たし、blocker / 残課題なし |
| MINOR | 軽微な懸念がある（例: PR 規模が大きいが分割可能、運用上の手間が増えるが許容範囲） |
| MAJOR | 着手不可レベルの懸念（例: 不変条件抵触、既存ガバナンス逸脱、スコープ過大、AC を直接満たせない） |

## 着手可否ゲート

| 判定 | 条件 |
| --- | --- |
| GO | base case（案 A）の 4条件 + 全観点が PASS、open question が 0 件または受け皿 Phase が指定されている |
| NO-GO | base case で MAJOR が 1 件以上、または不変条件 #5 / #6 抵触の懸念が解消できていない |

本タスクは GO 判定（案 A の全観点が PASS）。

## open question / Phase 4 以降への申し送り

| # | 残課題 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | drift マトリクスの差分件数が多すぎる場合の派生タスク粒度（1 task = 1 diff か、関連 diff グルーピングか） | Phase 5（実装ランブック） | 起票時に判断 |
| 2 | Pages vs Workers の最終判断 | 派生タスク `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` | 本タスクでは扱わない |
| 3 | 05a observability-matrix.md の更新が必要となった場合の起票要否 | Phase 12（派生タスク列挙時） | 必要時のみ別タスク起票 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | GO 判定・PASS/MINOR/MAJOR 基準・open question を test strategy 入力として渡す |
| Phase 5 | 派生タスク粒度の判断指針を実装ランブックの入力として渡す |
| Phase 10 | base case 選定理由を最終 GO/NO-GO 判定の根拠として再利用 |

## 多角的チェック観点（AIが判断）

- base case 選定理由が代替案比較マトリクスから演繹的に導かれているか
- 全代替案 × 全観点でセル空白がないか
- MAJOR 判定がついた案を base case に選んでいないか
- 残課題が必ずどこかの Phase / 派生タスクで受け皿を持つか
- 不変条件 #5 / #6 抵触が代替案比較に組み込まれているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 件以上を列挙 | 3 | spec_created | A/B/C/D |
| 2 | 4条件 + 4 観点マトリクスで判定 | 3 | spec_created | 空セルゼロ |
| 3 | base case 選定理由 | 3 | spec_created | 案 A |
| 4 | PASS/MINOR/MAJOR 基準定義 | 3 | spec_created | 3 段階 |
| 5 | GO/NO-GO ゲート定義 | 3 | spec_created | GO 判定 |
| 6 | open question 受け皿 | 3 | spec_created | 3 件すべて受け皿あり |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビュー主成果物（代替案・マトリクス・選定理由・GO/NO-GO） |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 代替案が 4 件以上列挙されている（A/B/C/D）
- [ ] 各代替案 × 4条件 + 4 観点で空セルがない
- [ ] base case（案 A）の選定理由が記述されている
- [ ] PASS / MINOR / MAJOR の基準が定義されている
- [ ] GO / NO-GO ゲートが定義され、本タスクが GO 判定であることが明記されている
- [ ] open question が 0 件、または受け皿 Phase / 派生タスクが指定されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 全成果物が `outputs/phase-03/` 配下に配置予定
- 不変条件 #5 / #6 抵触懸念が代替案比較に組み込まれている
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - GO 判定根拠（案 A の全観点 PASS）
  - PASS / MINOR / MAJOR 基準
  - open question 3 件と受け皿
- ブロック条件:
  - base case で MAJOR が 1 件以上残存
  - open question に受け皿のないものがある
  - 不変条件 #5 / #6 抵触懸念が解消されていない
