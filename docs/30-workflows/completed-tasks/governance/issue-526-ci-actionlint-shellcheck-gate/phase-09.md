# Phase 9: 品質保証

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

品質保証として、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 9 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 9 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-08.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 9 specification | `phase-09.md` | 品質保証の記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 5

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## 品質ゲート

```bash
git diff --check
bash -n scripts/observation/create-reminder-issue.sh
bash scripts/observation/test/test-create-reminder-issue.sh
shellcheck scripts/observation/*.sh scripts/observation/test/*.sh
actionlint .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml
unexpected="$(grep -RInE 'secrets\.[A-Z0-9_]+' .github/workflows/post-release-observation-reminder.yml | grep -v 'secrets.GITHUB_TOKEN' || true)"; test -z "$unexpected"
pnpm run indexes:rebuild
git status --short
```

## 追加 grep gate

```bash
rg -n "workflow-shell-lint|shellcheck scripts/observation/\\*.sh" .github/workflows/ci.yml .github/workflows/post-release-observation-reminder.yml
rg -n "actionlint.*post-release-observation-reminder.yml|post-release-observation-reminder.yml" .github/workflows/ci.yml .github/workflows/post-release-observation-reminder.yml
! rg -n "needs: lint" .github/workflows/post-release-observation-reminder.yml
```

## 判定

| Gate | PASS 条件 |
| --- | --- |
| G-1 | syntax / unit / shellcheck / actionlint / secret allowlist grep が exit 0。 |
| G-2 | grep gate が対象限定と runtime 境界を確認できる。 |
| G-3 | aiworkflow index 再生成後に意図しない unrelated diff がない。 |
| G-4 | closed Issue #526 を操作していない。 |

## DoD

- G-1 から G-4 のログが Phase 11 / 12 outputs に保存される。
- ローカル未導入ツールがある場合、未実行理由と CI 代替 evidence を明記する。
