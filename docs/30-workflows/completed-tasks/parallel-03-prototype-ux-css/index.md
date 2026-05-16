# parallel-03-prototype-ux-css

> ワークフロー: `parallel-03-prototype-ux-css`
> 上位ワークフロー: `ui-prototype-alignment-mvp-recovery`
> 上位 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-prototype-ux-css/spec.md`
> 担当: 単一実装者（solo dev）
> implementation_mode: `new`
> taskType: `implementation`
> task classification: UI task
> visualEvidence: `VISUAL`
> workflow_state: `implemented_local_runtime_pending`
> evidence_state: `visual_runtime_captured`

---

## 概要

Prototype の visual feedback 3 点を実装側（Tailwind + OKLch token）に翻訳し、視認性を復旧する。state / API 変更なし。実装範囲は CSS、semantic/data 属性、`MemberDetailSections.tsx` 内の local type に限定する。

### スコープ 3 点

| ID | 主題 | 対象 |
|----|------|------|
| G3-1 | Tag pill `aria-pressed="true"` / `data-selected="true"` 時の塗りつぶし配色 | `MemberFilters.client.tsx` + `globals.css` |
| G3-2 | Member card hover transition（border-color / box-shadow） | `MemberCard.tsx`（既存 attr）+ `globals.css` |
| G3-3 | Profile visibility marker（公開/会員/管理者の視覚差別化） | `MemberDetailSections.tsx` / `FormPreviewSections.tsx` + `globals.css` |

### 変更対象ファイル

| パス | 種別 |
|------|------|
| `apps/web/src/styles/globals.css` | 編集（`@layer components` に規則追加） |
| `apps/web/src/components/public/MemberFilters.client.tsx` | 編集（`aria-pressed` / `data-selected` / `data-component="tag-pill"` 付与） |
| `apps/web/src/components/public/MemberCard.tsx` | 編集（transition 確認・最小調整） |
| `apps/web/src/components/public/MemberDetailSections.tsx` | 編集（`data-visibility` 付与） |
| `apps/web/src/components/public/FormPreviewSections.tsx` | 編集（既存 `data-role="visibility"` に CSS を効かせる） |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集 |
| `apps/web/src/components/public/__tests__/MemberDetailSections.component.spec.tsx` | 編集 |
| `apps/web/playwright/tests/visual/visual-feedback.spec.ts` | 新規 |

### Canonical artifacts

| パス | 役割 |
|------|------|
| `artifacts.json` | workflow root metadata / gates / phase status SSOT |
| `outputs/artifacts.json` | root artifacts mirror |
| `outputs/phase-11/main.md` | visual runtime evidence inventory |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 9-section compliance check |

---

## 不変条件

1. OKLch token（`apps/web/src/styles/tokens.css`）正本。HEX 直書き禁止（`verify-design-tokens` CI gate）。
2. 既存 API endpoint surface を変更しない（`apps/api` 無編集）。
3. D1 直接アクセス禁止（`apps/web` から D1 binding を呼ばない）。
4. 新規 primitive を生やさず既存 primitives + tokens で表現する。
5. テストファイルは `*.spec.tsx` のみ（`*.test.*` は禁止）。

---

## Phase 一覧

| Phase | 名称 | 主成果物 |
|-------|------|---------|
| 1 | 要件定義 | scope / 受入条件 / 既存実装インベントリ |
| 2 | 設計 | CSS セレクタ・props 拡張・data 属性方針 |
| 3 | 設計レビュー | Phase 4 進行可否判定 |
| 4 | テスト作成 | Vitest / Playwright / axe テスト命令 |
| 5 | 実装 | 5 ファイルの編集差分 |
| 6 | テスト拡充 | 回帰 guard・fail path 追加 |
| 7 | カバレッジ確認 | tag-pill / visibility / hover 3 系統の coverage（visual runtime は Phase 11 実行待ち） |
| 8 | リファクタリング | duplicate / drift 削減 |
| 9 | 品質保証 | typecheck / lint / token gate / test 一括 |
| 10 | 最終レビュー | DoD 7 項目判定 |
| 11 | 手動テスト | 3 層評価（semantic / visual / a11y）+ screenshot |
| 12 | ドキュメント更新 | implementation-guide（2 パート）/ 未タスク / feedback |
| 13 | PR 作成 | user 明示承認後のみ実施 |

---

## DoD（上位 spec 由来）

- [ ] Tag pill 選択時に背景塗りつぶしで視認可能
- [ ] Member card hover で border-color / box-shadow が transition
- [ ] Profile section に visibility marker（左ボーダー + icon）が表示
- [ ] OKLch token のみで実装、HEX 直書き 0 件
- [ ] `verify-design-tokens` CI gate `completed (exit 0)`
- [ ] 既存 Vitest / Playwright smoke `completed (exit 0)`
- [ ] axe a11y violations 0 維持
