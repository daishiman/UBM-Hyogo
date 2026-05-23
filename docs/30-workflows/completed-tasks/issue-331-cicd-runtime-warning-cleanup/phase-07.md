# Phase 7: AC マトリクス

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 7 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## AC × 検証 × 成果物 トレース

| AC | 内容 | 検証 ID | 成果物 |
| --- | --- | --- | --- |
| AC-1 | apps/api top-level [vars] 重複解消 | T-2（grep） | Phase 5 commit (S1) |
| AC-2 | apps/api dry-run vars warning ゼロ | T-3, T-4 | Phase 11 smoke log |
| AC-3 | web-cd.yml が scripts/cf.sh deploy 経路 | T-7 | Phase 5 commit (S2) |
| AC-4 | pages deploy 文字列消失 | T-6 | Phase 5 commit (S2) |
| AC-5 | staging deploy が green | T-8 | Phase 11 CI run URL |
| AC-6 | production CI ログに warning ゼロ | T-9 | Phase 11 CI run URL |
| AC-7 | aiworkflow-requirements 同期 | T-10 | Phase 12 system-spec-update-summary.md |
| AC-8 | supersede 関係明記 | static review | index.md / Phase 12 documentation-changelog.md |
| AC-9 | 不変条件侵害なし | static review | Phase 10 GO/NO-GO |
| AC-10 | skill 検証 4 条件 PASS | Phase 9/10 | Phase 9 main.md |
| AC-11 | Phase 12 7 ファイル揃い | Phase 12 audit | outputs/phase-12/* |

## 完了条件

- [ ] 全 AC について検証 ID と成果物が紐付いている
- [ ] 未トレース AC が存在しない

## 成果物

- `outputs/phase-07/main.md`

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

- Phase 6: `phase-06.md` / `outputs/phase-06/main.md`
