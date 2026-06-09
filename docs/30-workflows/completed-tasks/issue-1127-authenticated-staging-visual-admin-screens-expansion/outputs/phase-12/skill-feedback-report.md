# Skill Feedback Report — issue-1127

## テンプレート改善

- **再利用基盤の横展開タスク（reuse-pattern expansion）の Phase 1 チェック項目候補**:
  本タスクは「汎用基盤を複数画面へ展開する」型。Phase 1 のカバレッジ調査で「候補リストのうち既実装済みを除外する」
  ステップが効いた（/admin/tags が既に done だった）。task-specification-creator skill の Phase 1 テンプレートに
  「横展開候補 × current 実装状況の突合表（既実装はスコープ除外）」を reuse-pattern expansion 向けサブセクションとして
  追加すると、陳腐化した候補をそのまま実装してしまう事故を防げる。
  - **Applied in review**: `.claude/skills/task-specification-creator/references/phase-template-phase1.md` に
    `Reuse-pattern Expansion Inventory Gate` として反映済み。

## ワークフロー改善

- **read-only / mutation 副作用境界の判定テーブルの標準化**:
  staging 共有 D1 を持つ E2E/visual タスクでは「画面ごとの mutation トリガー列挙 + 非クリック + ガード assertion(count 0)」が
  再利用パターンとして有効。SubAgent の「フォーム表示=危険」という過剰判定（実際は非クリックなら安全）を正しく裁くため、
  Phase 11 の撮影計画に「副作用境界判定表（route / mutation トリガー / read-only ガード）」を置く。
  - **Applied in review**: `.claude/skills/task-specification-creator/references/phase-template-phase11.md` に
    `Authenticated staging visual 横展開の read-only boundary` として反映済み。

## ドキュメント改善

- **`VISUAL_ON_EXECUTION` + `implemented_local_runtime_pending` の Phase 11 evidence inventory パターン**:
  「local spec 実装は完了したが、実 capture は user-gated で未実行」のとき、manual-test-result.md=present /
  screenshot=n/a の組み合わせが compliance gate を通る正しい形。このパターン（implemented_local_runtime_pending VISUAL
  タスク）の Phase 11 evidence inventory 例を `phase12-compliance-check-template.md` の例示に追加すると、同型タスクでの drift を減らせる。
  - **Applied in review**: `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` に
    authenticated staging visual runtime pending inventory 例として反映済み。

- **明確な implementation target を `spec_created` のまま閉じない close-out gate**:
  本タスクの初期仕様は「5 spec 追加が必須」と明記しながら物理作成を user-gated にしていた。task-specification-creator の
  2026-06-05 ルール（implementation target が明確なら同一 cycle で apps 実装・focused tests・Phase 12 sync まで完了）に従い、
  Playwright spec 5 本を local 実装して `implemented_local_runtime_pending` に昇格した。同型の visual spec 横展開では、user-gated に残すのは
  staging capture / baseline / commit / PR だけに限定する。
  - **Applied in review**: `SKILL.md` / `SKILL-changelog.md` に issue-1127 close-out entry を追加済み。

## 改善点なしの領域

- canonical 名管理（spec 名・screenshot 名・selector の中央集約）: 既存 lessons（FB-LLM-MOD-05-001）に従い backbone 中央集約 +
  lane 配布で drift 0 を達成。追加改善なし。
