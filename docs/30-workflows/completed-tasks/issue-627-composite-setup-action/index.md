# Issue #627 — Composite setup action for repeated CI setup (RB-02)

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 起票日 | 2026-05-12 |
| 起票元 Issue | [#627](https://github.com/daishiman/UBM-Hyogo/issues/627) |
| 親 Issue | [#608](https://github.com/daishiman/UBM-Hyogo/issues/608) |
| 出典 backlog | `docs/30-workflows/e2e-quality-uplift/backlog.md` RB-02 |
| 担当 | solo (daishiman) |
| 対象 PR base | `dev` |
| feature branch | `feat/issue-627-composite-setup-action` |
| tier | standard（NON_VISUAL / CI infra） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| scope | CI infra composite action |
| implementation_mode | `new`（`.github/actions/` 自体が未存在） |
| workflow_state | `implemented_local_runtime_pending` |

---

## 1. 採用条件の充足判定

| 条件 | 状態 | 根拠 |
|------|------|------|
| 3a Lighthouse CI 稼働 | ✅ 充足 | `.github/workflows/lighthouse.yml` 稼働中 |
| 3b E2E hard gate 稼働 | ✅ 充足 | `.github/workflows/e2e-tests.yml` 稼働中 |
| setup 重複の実測 | ✅ 充足 | checkout 後の Node / pnpm setup + install ブロックが下表のとおり 7 箇所に重複 |
| `.github/actions/` 既存 composite | ❌ 未導入 | `ls .github/actions/` 該当なし |
| 他タスクで解決済み | ❌ 未解決 | `docs/30-workflows/` 配下に composite-setup 系仕様なし |

### 1.1 setup 重複の実測（spec_created 時点）

| workflow | job | 重複ステップ |
|---------|-----|------------|
| `lighthouse.yml` | `lighthouse` | checkout 後 setup-node@v4(24.15.0) + `pnpm install --frozen-lockfile` |
| `e2e-tests.yml` | `e2e-shard` | 同上 |
| `e2e-tests.yml` | `report-merge` | 同上 |
| `ci.yml` | `typecheck` | 同上（node-version: '24'） |
| `ci.yml` | `lint` | 同上 |
| `ci.yml` | `test` | 同上 |
| `pr-build-test.yml` | `pr-build-test` | mise-action + `mise exec -- pnpm install --frozen-lockfile`（mise 版重複） |

→ **重複 7 箇所** を Phase 4 で構造的に集約する。

---

## 2. ゴール

`.github/actions/setup-project/action.yml` という composite action を新規追加し、上記 7 箇所の setup ステップを `uses: ./.github/actions/setup-project` に置換することで:

1. workflow YAML の総 setup 行数を **70% 以上削減**する（実測 Phase 7）
2. Node / pnpm バージョン更新時に修正点を **1 箇所**（composite action 側）に集約する
3. `mise exec` 経由か `setup-node` 経由かを composite action 側の input で切り替えられるようにする（pr-build-test の mise 系統と他の setup-node 系統を統一しない場合の互換性確保）
4. branch protection の required status check 名（`ci` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test` / `workflow-shell-lint`）を **一切変更しない**

---

## 3. 非ゴール

- workflow の job 構成変更（job 追加・削除・名称変更）
- branch protection contexts 追加・削除
- `pnpm-lock.yaml` 更新を伴う依存変更
- `mise` と `setup-node` の統一（別タスクとして RB-05 候補）
- LHCI Server 自前ホスティング（RB-04 別タスク）
- `paths` filter ベースの docs-only skip（RB-03 別タスク）

---

## 4. ディレクトリ構成

```
docs/30-workflows/issue-627-composite-setup-action/
├── index.md                   # 本ファイル（仕様サマリ）
├── phase-1.md                 # 要件定義
├── phase-2.md                 # ドメイン分析
├── phase-3.md                 # アーキテクチャ設計
├── phase-4.md                 # 詳細設計（composite action インターフェース）
├── phase-5.md                 # 環境準備・依存確認
├── phase-6.md                 # 実装（composite action 本体）
├── phase-7.md                 # 実装（呼び出し側 workflow 置換）
├── phase-8.md                 # 単体テスト（act / yamllint / list smoke）
├── phase-9.md                 # 統合テスト（draft PR で実 GHA 実行）
├── phase-10.md                # 受け入れテスト
├── phase-11.md                # evidence・成果物保管
├── phase-12.md                # ドキュメント更新・教訓
└── phase-13.md                # PR / Issue reference
```

---

## 5. 主要参照

| 参照先 | 役割 |
|--------|------|
| `.claude/skills/task-specification-creator/SKILL.md` | 仕様書フォーマット正本 |
| `.claude/skills/task-specification-creator/references/phase-template-core.md` | Phase テンプレート |
| `docs/30-workflows/e2e-quality-uplift/backlog.md` | RB-02 出典 |
| `docs/30-workflows/completed-tasks/3a-lighthouse-ci/phase-8.md` § 1.2 | 候補 B として composite action 設計案あり |
| `.github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml` | 置換対象 |

---

## 6. 全体 DoD

| # | 条件 |
|---|------|
| DoD-1 | `.github/actions/setup-project/action.yml` が存在し、composite action structure / SHA pin gate が pass。workflow YAML は actionlint pass |
| DoD-2 | 上記 7 job が composite action 呼び出しに置換される。削減行数の実測は runtime evidence として `outputs/phase-11/evidence/setup-lines-delta.md` に保存する |
| DoD-3 | draft PR で `ci` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test` / `workflow-shell-lint` の全 required check が green |
| DoD-4 | branch protection の required contexts が変更されていない（`gh api repos/.../branches/dev/protection` 比較） |
| DoD-5 | Issue #627 reference（PR merge と同時） |
