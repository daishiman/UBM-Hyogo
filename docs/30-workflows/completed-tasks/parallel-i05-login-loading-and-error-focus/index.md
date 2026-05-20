---
workflow_id: parallel-i05-login-loading-and-error-focus
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: new
---

# parallel-i05-login-loading-and-error-focus — `/login` の loading.tsx 新規作成と error.tsx に focus 管理を追加

[実装区分: 実装仕様書]

## 目的

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md` を発注書として、Phase 1-13 の実装仕様書と実コードを同一サイクルで整合させる。

`parallel-07-auth-and-shared` spec §4.1 / §4.2（DoD line 141, 142）の未達を、本ワークフローで完了した:

- `apps/web/app/login/loading.tsx` — 新規作成済み
- `apps/web/app/login/error.tsx` — h1 への自動 focus / `aria-live="assertive"` / digest 条件表示を実装済み

## スコープ

### IN
- `apps/web/app/login/loading.tsx` 新規作成（OKLch token + a11y 属性）
- `apps/web/app/login/error.tsx` に focus 管理（`useRef` + `useEffect` で h1 へ移譲）
- `apps/web/app/login/error.tsx` に `aria-live="assertive"` 追加、`error.digest` の条件表示
- 関連 vitest spec（loading / error）の追加または更新

### OUT
- root `app/error.tsx` の focus 管理（i06 として別 workflow）
- `app/profile/loading.tsx` の skeleton 化（i07 として別 workflow）
- 新規 `Card` / `CardContent` primitive の実装（既存があれば採用、なければ素の `<section>` で代替）

## 不変条件（CLAUDE.md 継承）

1. 既存 API endpoint surface のみ接続（本 SW では UI のみ変更）
2. OKLch トークン正本性維持（HEX 直書き / `bg-[#xxx]` 禁止、grep gate 0 件）
3. プロトタイプ正本順位を尊重し、新規 primitive を生やさない
4. D1 直接アクセス禁止（本 SW では該当なし）
5. 新規テストは `*.spec.{ts,tsx}` のみ

## Phase 構成

| Phase | ファイル | 概要 |
|-------|----------|------|
| 1 | [phase-01-requirements.md](phase-01-requirements.md) | 要件定義 / 機能・非機能要件 / 受け入れ条件 |
| 2 | [phase-02-architecture.md](phase-02-architecture.md) | 設計（loading / error コンポーネント構造 / focus 管理戦略） |
| 3 | [phase-03-task-breakdown.md](phase-03-task-breakdown.md) | タスク分解 / 依存関係 |
| 4 | [phase-04-data-contract.md](phase-04-data-contract.md) | 型・props・関数シグネチャ契約 |
| 5 | [phase-05-implementation-guide.md](phase-05-implementation-guide.md) | 実装手順（loading.tsx 新規 / error.tsx 修正） |
| 6 | [phase-06-test-plan.md](phase-06-test-plan.md) | テスト計画（vitest + RTL + jest-axe 任意） |
| 7 | [phase-07-quality-gates.md](phase-07-quality-gates.md) | 品質ゲート（typecheck / lint / build / token grep） |
| 8 | [phase-08-dod.md](phase-08-dod.md) | DoD と完了判定基準 |
| 9 | [phase-09-risks.md](phase-09-risks.md) | リスクと緩和策 |
| 10 | [phase-10-local-verification.md](phase-10-local-verification.md) | ローカル検証手順（dev server / screen reader 確認） |
| 11 | [phase-11-evidence-inventory.md](phase-11-evidence-inventory.md) | VISUAL 証跡（screenshot 計画） |
| 12 | [phase-12-compliance-check.md](phase-12-compliance-check.md) | Phase 12 strict 7 成果物 / spec 同期 |
| 13 | [phase-13-commit-pr.md](phase-13-commit-pr.md) | コミット / PR draft |

## 正本順位（衝突時の優先度）

1. CLAUDE.md
2. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
3. 本 workflow `outputs/phase-{1,2,3}/*` および各 phase-NN.md
4. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md`（発注書）
5. `docs/00-getting-started-manual/specs/*.md`

## 関連ワークフロー

- 親: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`
- 発注書: `improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md`
- active sibling specs: i06 (root error focus), i07 (profile loading skeleton)
