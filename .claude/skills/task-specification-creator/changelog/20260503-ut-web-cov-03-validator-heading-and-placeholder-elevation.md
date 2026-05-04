# 2026-05-03 — UT-WEB-COV-03 feedback: validator 必須見出し強制と placeholder→実測昇格 SOP

## 由来
- task: `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/`
- skill-feedback-report: `outputs/phase-12/skill-feedback-report.md`
- lessons: `aiworkflow-requirements/references/lessons-learned-ut-coverage-2026-05-wave.md` L-UTCOV-008 (5)(7)

## 反映すべき改善点

### 1. validator 必須見出しの強制
phase-09〜13.md で validator が要求する見出し（例: `## 実行タスク`）が欠けて Phase 12 strict check 直前に事後補正する事故が複数発生。

- 適用対象: `references/phase-12-tasks-guide.md` および phase-09〜13 系テンプレート
- 強制方法: テンプレート生成時に `## 実行タスク` を必須セクションとして埋め込み、`scripts/` 側の structure validator で欠落を fail させる
- 期待効果: Phase 12 直前の事後補正削減

### 2. placeholder（spec_created）→ 実測（implemented-local）昇格 checklist
Phase 9（vitest 実測）/ Phase 10（型・lint・build）/ Phase 11（manual smoke）/ Phase 12（main.md status）の 4 箇所で placeholder を実測値に書き換える SOP がテンプレート側に存在しない。

- 適用対象: `references/patterns-phase12-sync.md` または新規 `references/placeholder-to-actual-elevation-checklist.md`
- 内容:
  - Phase 9: vitest 実行ログから coverage 実測値・PASS 件数を main.md に転記
  - Phase 10: typecheck/lint/build の exit code を main.md に転記
  - Phase 11: manual smoke の actual 結果を `manual-smoke-log.md` に記録、`main.md` の link を更新
  - Phase 12: `main.md` L3 の status を `spec_created` → `implemented-local` → `completed` のいずれかに更新、`handoff:` 行で次フェーズ担当を宣言（参照: L-UTCOV-005）
- 期待効果: wave-2 close 時の placeholder 残留事故を防止

## 適用方針
本 changelog は feedback 記録のみ。テンプレート本体の変更は別タスク（unassigned-task として別途切り出す候補）。

## 関連
- L-UTCOV-005: 3 状態（spec_created / implemented-local / completed）の宣言ルール
- L-UTCOV-008: ut-web-cov-03 で発生した具体的事象
