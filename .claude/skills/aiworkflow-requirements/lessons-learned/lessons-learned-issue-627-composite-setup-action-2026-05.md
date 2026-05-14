# Lessons Learned — Issue #627 Composite Setup Action（2026-05-13）

> task: `issue-627-composite-setup-action`
> 関連 spec: `docs/30-workflows/issue-627-composite-setup-action/phase-{1..13}.md`、`docs/30-workflows/issue-627-composite-setup-action/outputs/phase-12/`
> 関連 source: `.github/actions/setup-project/action.yml`、`.github/workflows/ci.yml`、`.github/workflows/e2e-tests.yml`、`.github/workflows/lighthouse.yml`、`.github/workflows/pr-build-test.yml`
> 関連 reference: `references/task-workflow-active.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`、`changelog/20260512-issue-627-composite-setup-action.md`

## 教訓一覧

### L-627-001: composite action の契約用語は単一語彙で固定する（`engine` / `setup-mode` / `runner` / `setup-strategy` の drift 防止）

- **背景**: Phase 1-3 設計時、Node セットアップ戦略を表す input 名が `engine` / `setup-mode` / `runner` / `setup-strategy` と複数案で揺れた。レビュー往復で input 名 / step id / docs の参照が drift し、call site 7 箇所と composite action 本体が同じ概念に異なる名前で結線される寸前まで進んだ。
- **教訓**: composite action の input contract は **Phase 1 のドメイン用語表で 1 つに確定**し、以後の Phase / docs / call site すべてで 1 語のみ使う。本 issue では `setup-strategy` を canonical に採用し、他案語は changelog の苦戦記録としてのみ残した。input 命名が揺れる兆候（PR コメントで別語が再導入される / outputs と inputs で表記揺れ）が出た時点で、契約 freeze の同期 wave を必ず挟む。
- **将来アクション**: `task-specification-creator` の composite action 系 template に「input / output 名は Phase 1 で確定し、Phase 2 以降で名前変更する場合は明示 ADR が必要」ルールを追加。

### L-627-002: composite action は checkout-less に固定し、checkout boundary は caller-owned で明文化する

- **背景**: 初版設計では composite action 内部で `actions/checkout` を呼ぶ案と、caller workflow に残す案の両方が並走し、SHA pinning / submodule / fetch-depth の責務境界が曖昧だった。caller 側で既に checkout 済みのところに再 checkout すると worktree state が壊れる risk があり、逆に composite 側に閉じると caller の特殊 fetch オプションを受けられない。
- **教訓**: composite action は **checkout を呼ばない**ことを契約とし、caller workflow 側で `actions/checkout` を行う。composite action の README / action.yml description / Phase 1 main.md / Phase 12 implementation-guide すべてに「checkout-less / caller-owned」を明記する。SHA pinning は composite 内部の nested actions に対してのみ責任を持つ。
- **将来アクション**: GitHub Actions composite を新規作成する task では、checkout / artifact upload / cache の責務境界を Phase 1 の AC に必ず含める。境界が曖昧なまま Phase 5 (implementation) に入ると、call site 統合で yank が頻発する。

### L-627-003: Phase 12 strict 7 outputs は Phase 11 終了時点で骨組みを作っておく（事後追加すると同期 wave が増える）

- **背景**: Phase 11 まで完了した段階で `outputs/phase-12/` が空のまま Phase 12 fix-up wave に入り、strict 7 files（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）を一括追加することになった。同時に `artifacts.json` の root / outputs mirror、aiworkflow-requirements の resource-map / quick-reference / task-workflow-active / changelog の同期 wave も発生し、レビュー対象が肥大化した。
- **教訓**: Phase 11 を `spec_created` で抜ける時点で、Phase 12 strict 7 files の **空骨組み** を `outputs/phase-12/` に置き、`main.md` だけは「runtime evidence pending」状態の状態文字列で先行記述する。これにより Phase 12 fix-up wave は内容更新のみで済み、ファイル新設に起因する mirror drift（root `artifacts.json` ⇄ `outputs/artifacts.json`）の検出を CI gate に任せられる。
- **将来アクション**: `task-specification-creator` の Phase 11 完了 checklist に「Phase 12 strict 7 files の空骨組みを `outputs/phase-12/` に配置する」を追加。`generate-index.js` / `validate-structure.js` 系 gate に Phase 12 strict 7 file 存在検証を将来追加する余地を残す。

## 適用範囲

- 本 lessons は `.github/actions/<name>/action.yml` を新規追加 / 更新する全 task に適用する。
- L-627-001 / L-627-002 は composite action 設計 task 全般。
- L-627-003 は Phase 11 → Phase 12 遷移を伴う全 spec_created task に適用。

## 追跡 / 未解放事項

| 項目 | 接続先 | 状態 |
| --- | --- | --- |
| Runtime GHA evidence（7 workflow call sites の green run） | Phase 13 user-gated execution | pending_user_approval |
| RB-05 (`mise` と `setup-node` 統一) | unassigned-task-detection.md で out-of-scope 判定 | not created（現契約は両戦略を `setup-strategy` で支持） |
