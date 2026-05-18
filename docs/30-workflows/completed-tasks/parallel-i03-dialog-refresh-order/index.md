# parallel-i03-dialog-refresh-order - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/web/app/profile/_components/` 配下 3 component (Visibility / Delete Request Dialog, RequestActionPanel) のコード変更と、対応する component spec のテスト更新を伴うコード実装タスク。設定変更単独では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | PARALLEL-I03 |
| タスク名 | profile request dialog で router.refresh() 呼び出し順序を spec 通りに修正 |
| ディレクトリ | docs/30-workflows/parallel-i03-dialog-refresh-order |
| 親タスク | parallel-02-state-sync (`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-02-state-sync/`) |
| 原典 spec | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i03-dialog-refresh-order/spec.md |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| タスク種別 | implementation / NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| 優先度 | MEDIUM |
| PR base branch | dev |

## 目的

`parallel-02-state-sync` spec §4.2 (line 95-117) が明示する dialog 提出成功時の呼び出し順序固定ルール:

```
1) router.refresh()
2) onSubmitted(res.accepted)
3) onClose()
```

を、dialog component 内で正しく実装する。

現状は `RequestActionPanel.tsx` (line 57 付近) の `onSubmitted` callback 内で `router.refresh()` を呼ぶ実装になっており、dialog が `onClose()` で unmount された後に parent callback が refresh を発火する race condition / unmounted-component warning のリスクがある。

本タスクで refresh の発火点を dialog 内に移し、unmount より前に schedule することで race condition を排除する。

## スコープ

### 含む

- `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` の onSubmit 成功 path で `router.refresh()` を first 発火
- `apps/web/app/profile/_components/DeleteRequestDialog.tsx` 同上
- `apps/web/app/profile/_components/RequestActionPanel.tsx` の `onSubmitted` callback から `router.refresh()` 撤去
- `VisibilityRequestDialog.component.spec.tsx` で呼び出し順序 assertion を追加
- `DeleteRequestDialog.component.spec.tsx` 同上
- `RequestActionPanel.component.spec.tsx` で parent 側 `router.refresh` が呼ばれないことを assert

### 含まない

- mutation endpoint (`requestVisibilityChange` / `requestDeletion`) のシグネチャ変更
- banner UI / `QueueAccepted` 型変更
- error / catch 分岐の挙動変更（success と duplicate pending の refresh ordering のみが対象）
- D1 schema 変更
- 新 API endpoint 追加

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i03-dialog-refresh-order/spec.md | 発注書 spec |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-02-state-sync/ | 親仕様 §4.2 順序ルール |
| 必須 | apps/web/app/profile/_components/VisibilityRequestDialog.tsx | 変更対象 |
| 必須 | apps/web/app/profile/_components/DeleteRequestDialog.tsx | 変更対象 |
| 必須 | apps/web/app/profile/_components/RequestActionPanel.tsx | 変更対象（撤去側） |
| 参考 | https://nextjs.org/docs/app/api-reference/functions/use-router#routerrefresh | useRouter.refresh 仕様 |

## 受入条件 (AC)

- **AC-1**: `VisibilityRequestDialog.tsx` の submit 成功 path で `router.refresh()` → `onSubmitted(res.accepted)` → `onClose()` の順に呼び出される。
- **AC-2**: `DeleteRequestDialog.tsx` の submit 成功 path で同順序が成立する。
- **AC-3**: `RequestActionPanel.tsx` の `onSubmitted` callback から `router.refresh()` が撤去され、未使用となった `useRouter` import も clean up されている。
- **AC-4**: `VisibilityRequestDialog.component.spec.tsx` / `DeleteRequestDialog.component.spec.tsx` に `callOrder.push` 方式の順序検証が追加され、`["refresh", "onSubmitted", "onClose"]` を assert する。
- **AC-5**: `RequestActionPanel.component.spec.tsx` で parent 側からの `router.refresh` が呼ばれないこと（`expect(refresh).not.toHaveBeenCalled()`）を assert する。
- **AC-6**: `pnpm typecheck` / `pnpm lint` / 該当 component spec の test 実行が全て PASS。
- **AC-7**: 変更対象ファイル全てで dialog props / mutation endpoint のシグネチャが不変であることを Phase 03 設計レビューで確認済み。
- **AC-8**: PR base branch は `dev`。Phase 13 のコミット・push・PR 発行は user approval gate。

## 不変条件

1. **呼び出し順序の固定**: refresh → onSubmitted → onClose 以外の順序を許容しない。catch / else 分岐はこの順序対象外（既存挙動維持）。
2. **dialog props 不変**: 既存 caller への破壊なし。`onSubmitted: (accepted: QueueAccepted) => void` を維持。
3. **client component 境界**: dialog 群は `"use client"` ディレクティブを保持。`useRouter` を server component 配下で呼ばない。
4. **テストファイル命名**: 新規 / 更新テストは `*.spec.tsx` のみ（`*.test.tsx` 禁止 / lefthook `block-test-suffix` gate）。
5. **D1 / API 不変**: `apps/api` route / D1 schema は変更しない。本タスクは UI client 内完結。
6. **`apps/web` env 参照不変条件**: 本変更は env を触らないが、既存の `getEnv()` / `getPublicEnv()` 経由ルールを破壊しない。
7. **CONST_007 遵守**: Phase 1〜12 と local implementation を本サイクル内で完了。Phase 13 の commit / push / PR は user-gated。
8. **PR base = dev**: `main` 直接 PR 禁止。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `router.refresh()` の二重発火（dialog + parent 両方） | Phase 06 で `RequestActionPanel.tsx` から撤去を確実化。Phase 07 で `not.toHaveBeenCalled()` を assert |
| `useRouter()` を server component で呼び出してしまう | dialog は `"use client"` 確認済み。Phase 02 で再確認 |
| catch 分岐への refresh 漏れ要求 | success は `refresh -> onSubmitted -> onClose`、duplicate pending は `refresh -> onSubmitted`。catch は error toast 単独で refresh 不要、と Phase 02 で確定 |
| Next.js 16 navigation API 差異 | useRouter API は `refresh()` を含み App Router で安定。互換性問題なし |
| 既存 test 資産との衝突 | 既存 component spec の他テストケースは触らず、追記のみで対応 |

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/dialog-refresh-order-design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/task-breakdown.md |
| 5 | 実装計画 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 実装手順 | phase-06.md | completed | outputs/phase-06/implementation-steps.md |
| 7 | テスト計画 | phase-07.md | completed | outputs/phase-07/test-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | outputs/phase-10/refactor-summary.md |
| 11 | NON_VISUAL evidence | phase-11.md | completed | outputs/phase-11/visual-verification-skip.md |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | pending | outputs/phase-13/pr-summary.md |

## Phase マップ

```
phase-01 (要件定義: AC・不変条件・スコープ確定)
   │
   ▼
phase-02 (設計: Before/After snippet・順序契約)
   │
   ▼
phase-03 (設計レビュー: GO/NO-GO)
   │
   ▼
phase-04〜10 (タスク分解 → 実装 → テスト → ドキュメント → 受入 → リファクタ)
   │
   ▼
phase-11 (NON_VISUAL evidence: order assertion を evidence 化)
   │
   ▼
phase-12 (正本同期: 7 出力ファイル)
   │
   ▼
phase-13 (PR・振り返り / user approval gate / base=dev)
```

## 注意点

- 本タスクは UI race condition の排除であり画面表示の差分は実質ない。visualEvidence は `NON_VISUAL` とし、screenshot の代わりに component spec の順序 assertion を evidence とする。
- 親仕様 `parallel-02-state-sync` §4.2 が呼び出し順序の正本。乖離が出た場合は親仕様を優先する。
- 並列タスク i01, i02, i04, i05 とファイル重複なし。マージ衝突リスクは低い。
