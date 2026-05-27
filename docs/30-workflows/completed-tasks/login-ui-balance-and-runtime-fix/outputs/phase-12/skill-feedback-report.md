# スキルフィードバックレポート

## 苦戦点

| ID | 内容 | 提案 |
| -- | ---- | ---- |
| L-LOGIN-001 | detached HEAD で worktree が起動していたため `feat/*` ブランチ立ち上げが追加で必要だった | task-spec-creator の Phase 1 P50 チェックに「detached HEAD 判定」を追加 |
| L-LOGIN-002 | staging console error の中に拡張機能ノイズ（`127.0.0.1:8888` 等）が大量混入し、本物のエラーを切り分ける手順が必要だった | requirement レビュー思考法 references に「browser-extension noise の切り分けチェックリスト」追加 |
| L-LOGIN-003 | `apps/web` の `process.env` 直参照 violation を staging で初めて踏むのは遅すぎる | pre-push hook で grep gate を fail-fast 化（U-002 と整合） |
| L-LOGIN-004 | プロトタイプ assets の CDN SRI 失効は dev only でも体感を壊す | references に「dev-only CDN は SRI 撤去 + version pinning」パターン追加 |

## 改善点なし項目（明示）

- Phase 1〜3 のテンプレートは今回の問題粒度に十分にフィット
- 4 条件評価フレームワークは判断に直接寄与

## skill 反映候補

| 視点 | skill | 候補 |
| ---- | ----- | ---- |
| テンプレ改善 | `task-specification-creator/references/phase-template-core.md` | P50 に detached HEAD / browser extension noise / dev-only CDN drift の確認項目を追加済み |
| ワークフロー改善 | `task-specification-creator/lessons-learned/login-ui-balance-runtime-fix-2026-05.md` | runtime/visual pending を full PASS と誤認しない境界判定を記録済み |
| ドキュメント改善 | `aiworkflow-requirements` indexes / workflow inventory | 正本仕様・索引・workflow artifact inventory への same-wave sync を実施済み |

## promotion result

| ID | route |
| -- | ----- |
| L-LOGIN-001 | `phase-template-core.md` P50 checklist |
| L-LOGIN-002 | `phase-template-core.md` browser-extension noise checklist |
| L-LOGIN-003 | `scripts/verify-no-process-env-internal-api.sh` + workflow spec |
| L-LOGIN-004 | `phase-template-core.md` dev-only CDN note + lesson file |
