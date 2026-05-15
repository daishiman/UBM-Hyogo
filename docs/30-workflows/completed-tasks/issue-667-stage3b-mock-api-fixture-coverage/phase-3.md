# Phase 3: 設計レビュー（ready / minor / major / no-go 判定）

## メタ情報

| key | value |
|-----|-------|
| Phase | 3 |
| Phase Name | 設計レビュー |
| 作成日 | 2026-05-14 |
| 前 Phase | 2 |
| 次 Phase | 4 |
| 分類ラベル | `existing-hardening` |

## 目的

Phase 1 inventory / AC と Phase 2 設計 (concern A-D) について ready / minor / major / no-go を判定し、Phase 4 開始 gate を確定する。no-go であれば Phase 1 or 2 へ戻す。ここでの判定は設計レビューの進行可否であり、実装済み evidence の PASS ではない。

## レビュー観点

### 観点 1: AC measurability

| AC | 検証手段 | 判定 |
|----|---------|------|
| AC-1 | endpoint inventory 行数と mock dispatcher の grep count 一致 | ready（measurable） |
| AC-2 | mock 内 `safeJson` ラッパーで `schema.parse()` を 100% 通すこと、contract test で fail 確認 | ready |
| AC-3 | `scripts/__tests__/e2e-mock-api.contract.spec.ts` exit 0 | ready |
| AC-4 | fixtures.ts 内の `members.length === 3 && zones.size === 2 && membershipTypes.size === 2 && negativeQuery === 'zzz_no_match_zzz' && tagFacets.size === 2` | ready |
| AC-5 | workflow YAML diff に `curl --retry`（または bash loop）+ `upload-artifact@v4` 1 step | ready |
| AC-6 | `pnpm --filter @ubm-hyogo/web e2e` desktop-chromium green | ready |
| AC-7 | `pnpm typecheck` / `pnpm lint` / `coverage-guard.sh` exit 0 | ready |

### 観点 2: 依存方向の健全性

- `packages/contracts/` は `zod` のみ依存（apps / shared への依存禁止）→ ready
- 既存 `packages/shared/src/zod/identity.ts` の identity-conflict schema は contracts 側へ契約を移し、必要なら shared 側を後方互換 re-export にする。`contracts -> shared` 依存を作らないため MINOR-1 は不要。

### 観点 3: simpler alternative の検討

| 代替案 | 採否 | 理由 |
|--------|------|------|
| `packages/contracts/` を作らず `apps/api/src/contracts/` 配下に置く | rejected | apps 間の循環参照禁止の不変条件に抵触（apps/web → apps/api/src の import が必要になる） |
| mock 内に zod schema を inline 定義 | rejected | AC-2 (SSOT) 違反。3 拠点 drift 再発 |
| contract test を Playwright で書く | rejected | `.github/workflows/ci.yml` の unit test 経路から実行する AC-3 と整合しない |
| readiness wait を `wait-on` npm package で書く | rejected | 追加依存を増やすより `curl --retry` のほうが単純 |
| log upload を Slack 通知に置換 | rejected | scope 拡大。AC-5 から逸脱 |

### 観点 4: 上流文書の整合性

- 元 unassigned task `task-e2e-stage3b-mock-api-fixture-coverage-001.md` の AC-MOCK-01..05 と本仕様 AC-1..AC-5 は 1:1 対応 → ready
- lessons-learned L-E2EQU3B-001 で確立した「server-side fetch は別プロセス mock 必須」の前提と整合 → ready

### 観点 5: 型ドリフト / 同名インターフェース

```bash
grep -rn "MergeIdentityRequestZ\|DismissIdentityConflictRequestZ" packages/ apps/ scripts/
```

| 検出箇所 | 対応 |
|---------|------|
| `packages/shared/src/zod/identity.ts` 定義 | contracts 側へ契約を移し、必要なら shared から後方互換 re-export |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` の `@ubm-hyogo/shared` import | Phase 6 で `@ubm-hyogo/contracts` に切替（後方互換のため shared 側 export も維持） |
| `apps/api` 側 route handler の Z schema | 実装 wave で `@ubm-hyogo/contracts` 参照へ寄せる。業務ロジックは変更しない |

→ ready（型ドリフトを contracts SSOT へ収束）

## 判定結果

| 区分 | 件数 | 内訳 |
|------|------|------|
| ready | 5 | AC measurability / simpler alternative / 上流文書整合 / 型ドリフト / endpoint inventory |
| minor | 0 | — |
| major | 0 | — |
| no-go | 0 | — |

### MINOR 追跡テーブル

| minor ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 備考 |
|----------|---------|---------------|---------------|------|
| なし | `contracts -> shared` 依存を設計から除去済み | — | Phase 9 typecheck | `packages/contracts/package.json#dependencies` は `zod` のみ |

## Phase 4 開始 gate（重複明記）

以下が全て成立した場合のみ Phase 4 へ進む:

- [ ] Phase 1 成果物（endpoint-inventory.md / spec-extraction-map.md / acceptance-criteria.md）作成完了
- [ ] Phase 2 成果物（design.md / dependency-matrix.md / validation-matrix.md）作成完了
- [ ] Phase 3 no-go 件数 = 0
- [ ] major 件数 = 0

## Phase 13 blocked 条件

- contract test が red のまま push されないこと（Phase 11 / 12 で確認）
- existing E2E spec が red のまま push されないこと（AC-6）

## 成果物

- `outputs/phase-3/gate-decision.md`
- `outputs/phase-3/minor-tracking.md`

## 完了条件

- [ ] 5 観点すべてレビュー済み
- [ ] `contracts -> shared` 依存禁止が解決方針として記録
- [ ] Phase 4 開始 gate 4 件すべてチェック済み
- [ ] NO-GO / MAJOR 件数 = 0

## タスク100%実行確認【必須】

- [ ] 観点 1-5 全完了
- [ ] 判定結果テーブル作成
- [ ] MINOR 追跡テーブル作成

## 次 Phase

Phase 4: テスト作成（契約テスト + mock 単体テスト）
