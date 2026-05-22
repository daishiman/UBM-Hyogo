# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 10 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## GO/NO-GO 判定基準

| 観点 | GO 条件 |
| --- | --- |
| AC 完備 | AC-1〜AC-11 が Phase 11 / Phase 12 で全て満たされる |
| 不変条件 | CLAUDE.md「wrangler 直接呼び出し禁止」を侵害しない |
| 安全性 | rollback 手順（Phase 6）が記載済み |
| ドキュメント | aiworkflow-requirements 同期計画（Phase 12）が立てられている |
| skill 4 条件 | Phase 9 で PASS |

## DoD（最終確認）

- [ ] AC-1: top-level [vars] 削除確認
- [ ] AC-2: apps/api dry-run warning ゼロ
- [ ] AC-3: web-cd.yml が scripts/cf.sh deploy 経路
- [ ] AC-4: `pages deploy` 文字列が消失
- [ ] AC-5: staging green
- [ ] AC-6: production warning ゼロ
- [ ] AC-7: aiworkflow-requirements 同期
- [ ] AC-8: supersede 明記
- [ ] AC-9: 不変条件侵害なし
- [ ] AC-10: skill 4 条件 PASS
- [ ] AC-11: Phase 12 7 ファイル揃い

## NO-GO 時のエスカレーション

- AC-2 未達: top-level bindings（triggers / d1 / analytics）由来 warning なら別タスク化（spec_created）
- AC-5/6 未達: Phase 6 E-3〜E-5 を順に検証

## 完了条件

- [ ] GO/NO-GO 基準が明記されている
- [ ] DoD チェックリストが揃っている

## 成果物

- `outputs/phase-10/main.md`

## 目的

本 Phase の目的を、Issue #331 の runtime warning cleanup と Workers deploy contract へ明確に接続する。

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

## 依存Phase参照

- Phase 2: `phase-02.md` / `outputs/phase-02/main.md`
- Phase 5: `phase-05.md` / `outputs/phase-05/main.md`
