# Phase 12 strict — skill-feedback-report

## skill 利用観察

| skill | 適用箇所 | 観察 |
| --- | --- | --- |
| task-specification-creator | Phase 1-13 構造化、canonical 9 headings (Phase 12)、CONST_007 例外宣言の場所明示 (Phase 1 §5 / Phase 8 §2) | 「観察 → 診断 → 修復」を 1 ワークフローに包含するのが既定だが、本ケースは仮説確定前に修復スコープを切らないと破綻するため Spec-A/Spec-B 分離パターンを採用 |
| aiworkflow-requirements | workflow_state / runtime_boundary / implementation_status の表現 | `implemented_local_runtime_pending` を `implementation_status` に明示し、`runtime_boundary` 文言で staging deploy / Spec-B 起票 / commit / push / PR をまとめて user-gated 宣言する形が機能した |
| github-issue-manager | (本 Spec-A では未使用) | Spec-B 起票時に再利用する。`outputs/phase-12/unassigned-task-detection.md` に起票トリガと優先度候補を 4 件分書いた |

## 改善提案

1. **「仮説確定前は修復を分離」パターンを task-spec-creator の lessons に昇格**
   - 既存事例: regression-evidence の Spec-A/B 分離も同質
   - 本 Spec-A の Phase 1 §5 / Phase 8 §2 の CONST_007 例外文言は再利用テンプレートとして抽象化可能

2. **boolean-only secrets readiness 不変条件の patterns-lessons 追加**
   - Phase 4 §4 / Phase 9 §3 の禁止事項 (length / first-char / last-4 / hash) は admin diagnostics endpoint 一般に適用できる安全則

3. **`outputs/phase-12/unassigned-task-detection.md` の Spec-B 候補表記形式**
   - 起票トリガ / 想定 surface / 想定 PR 規模 / 優先度候補 の 4 列が user 起票判断に最も役立つ

## skill drift 観察

特になし。テンプレート `regression-evidence-ci-gate-foundation/` の構造を踏襲して 18 ファイル + outputs mirror が問題なく揃った。
