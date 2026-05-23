# Phase 9: runbook / docs 更新


## 目的

Issue #626 RB-01 の Phase 9 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 9 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 更新対象

| パス | 操作 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/e2e-quality-uplift/backlog.md` | 編集 | RB-01 行の Status を `implemented-local-runtime-pending`、Notes を統合先 workflow / Issue #626 / runtime pending 境界に更新 |
| `docs/runbooks/ci-workflow-overview.md` | **存在時のみ編集** | Lighthouse 統合の追記。存在しない場合は本タスクで新規作成しない（不要なドキュメント新設禁止） |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260512-131439-wt-5/docs/30-workflows/issue-626-rb01-share-build-output-lighthouse-pr-build/outputs/phase-12/documentation-changelog.md` | 新規 | Phase 12 で生成。差分を canonical absolute path で列挙 |

## backlog.md 編集ガイド

before:
```
| RB-01 | 3a / parent Stage 3 | low | Stage 4 | open | Share build output between Lighthouse and PR build jobs once both gates exist. |
```

after:
```
| RB-01 | 3a / parent Stage 3 | low | Stage 4 | implemented-local-runtime-pending | Integrated locally into `.github/workflows/pr-build-test.yml` `lighthouse-ci` job sharing the `next-build-${{ github.sha }}` artifact. PR dry-run / merge-time runtime evidence and Phase 13 close-out remain user-gated. Refs #626. |
```

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 9 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 5 (`phase-05.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-09.md`
- Phase 9 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] backlog.md の RB-01 行が正しく更新されている
- 不要なドキュメントを新規作成していない（CLAUDE.md ポリシー遵守）
