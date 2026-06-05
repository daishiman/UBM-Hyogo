# Phase 1 — 要件定義

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 ファイルのコード追加を伴う（CONST_004）。

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1077-bulk-tag-authenticated-staging-visual` |
| task_id | `TASK-ISSUE-1077-BULK-TAG-AUTHENTICATED-STAGING-VISUAL-001` |
| implementation_mode | `new`（成果物 spec は新規追加。ただし機能本体は landed 済み） |
| GitHub issue | [#1077](https://github.com/daishiman/UBM-Hyogo/issues/1077)（**CLOSED 維持**） |

---

## 1.1 真の論点

issue #1077（= `task-issue-1036-followup-001`）の表層は「bulk tag UI の screenshot を取りたい」だが、本質的な論点は次の最適化である:

- **現状**: bulk tag picker の visual 証跡は `apps/web/playwright/tests/issue1036-bulk-member-tags.spec.ts` の `page.setContent()` local fixture でしか取得できていない。実機 `/admin/members` 到達の証跡が無い。
- **issue 作成時の前提（2026-06-01）**: 「手動 user-gated screenshot 取得」だった。
- **その後 landed した基盤**: 認証付き staging Playwright 基盤（issue-901 系）— `setup.staging-auth.ts` が admin storageState を mint し、`staging-visual-authenticated` project が `--project` 指定で CI（`playwright-staging-visual-authenticated.yml`）に乗る。
- **真の最適化**: 手動取得をやめ、既存 authenticated 基盤に乗せた **interaction-gated authenticated staging Playwright spec をコード化**する。これが現行コードに即した恒久解。

機能本体（`BulkActionBar.tsx` の tag bulk）は dev に landed 済み（commit `ca3fb9336` / PR #1085）。本タスクは **テストコード 1 ファイルの新規追加のみ**で、apps/api・apps/web ソース・D1・Google Form は一切変更しない。

---

## 1.2 スコープ in / out

| 状態 | 取得方法 | スコープ |
| --- | --- | --- |
| `bulk-tag-picker-assign-mode` | 認証 staging で member 選択 → tag picker 表示（**read-only**） | ✅ in |
| `bulk-tag-picker-unassign-mode` | 認証 staging で付与/解除トグル切替（**read-only**） | ✅ in |
| `bulk-tag-result-all-success` | 実 `POST .../tags/bulk` mutation 必須（staging D1 副作用） | ❌ out |
| `bulk-tag-result-partial-failure` | 退会済み member + 未登録 tag のデータ投入 + mutation 必須 | ❌ out |

### result 2 状態を除外する理由（CONST_005 例外）

実機での all-success / partial-failure 取得は staging 共有 D1 への **破壊的 mutation** が不可避であり、本サイクル内で完了すると「共有 staging データへの副作用」という整合性破綻を招く。result summary の描画は API レスポンス shape から純粋に決まるため、既に component spec（`BulkActionBar.spec.tsx` TC-BAB-TAG-03）と親 local fixture baseline で担保済み。実施時期は `outputs/phase-12/unassigned-task-detection.md` に未タスクとして記録する。

---

## 1.3 受け入れ基準（index.md と整合）

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | 認証 staging `/admin/members` で複数 member を選択すると `BulkActionBar`（`aria-label="一括操作"`）と tag picker（`aria-label="タグ一括付与・解除"`）が表示される |
| AC-2 | assign モードで `bulk-tag-picker-assign-mode.png` baseline を取得（`toHaveScreenshot`、bulk region locator scoped） |
| AC-3 | 付与モード group（`aria-label="付与モード"`）を「解除」へ切替えて `bulk-tag-picker-unassign-mode.png` baseline を取得 |
| AC-4 | baseline canonical 名が phase-11 / implementation-guide / artifacts ledger と一致する |
| AC-5 | 実行ログに admin storageState 経路・対象 URL・capture command・保存先を残す |
| AC-6 | **mutation を一切実行しない**（apply ボタンを押さない / staging D1 へ副作用ゼロ） |
| AC-7 | apps/api・apps/web ソース・D1 schema・Google Form 仕様を変更しない（テストコード追加のみ） |

---

## 1.4 現状 inventory

| 要素 | 現状 |
| --- | --- |
| `BulkActionBar` | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` に実装済み。`selectedIds.length===0` で `null` を返す。`role="region" aria-label="一括操作"`、tag section `aria-label="タグ一括付与・解除"`、mode group `aria-label="付与モード"`、`付与`/`解除` ボタン（`aria-pressed`）。 |
| members list | `MembersTable.tsx` が行 `data-testid="admin-members-row-{memberId}"`、行内チェックボックス `aria-label="{fullName} を選択"`、ヘッダ全選択 `aria-label="全選択"` を提供。 |
| selection state | `MembersClientShell.tsx` の `selected: Set<string>`。`onToggleSelect` / `onToggleSelectAll` が更新。`BulkActionBar selectedIds={Array.from(selected)}`。 |
| staging 認証基盤 | `setup.staging-auth.ts` が `admin.storageState.json` を mint。`staging-visual-authenticated` project（`playwright.config.ts:376`）が `testDir: ./playwright/tests/visual-staging-authenticated` で setup/teardown 以外を自動登録。snapshot 名前空間は `{arg}-authenticated-staging-visual-{platform}`。 |
| 参照モデル | `admin-dashboard-authenticated.spec.ts`（`test.use({ storageState })` + `goto` + `addStyleTag` + `toHaveScreenshot`）。 |

---

## 1.5 命名規則

- spec ファイル名: 既存 authenticated spec に倣い kebab-case + `-authenticated.spec.ts` →
  `admin-members-bulk-tag-authenticated.spec.ts`
- 変数: camelCase（`bulkRegion`, `firstRow` 等）。
- canonical screenshot 名（`toHaveScreenshot` の arg）:
  - `bulk-tag-picker-assign-mode.png`
  - `bulk-tag-picker-unassign-mode.png`

---

## 1.6 P50（単一責務）チェック

- 機能本体は実装済み（verify_existing 寄り）だが、本タスクの成果物 spec は **新規ファイル 1 つ**であり `implementation_mode = "new"`。
- 単一責務: 「認証 staging 実機で picker 2 状態の visual baseline を取得する」。result mutation 系は本責務に含めない（スコープ外）。

---

## 1.7 targeted test ファイルリスト

| 種別 | パス |
| --- | --- |
| 新規（唯一の実装ファイル） | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |
| 回帰（変更しないが実行する） | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` |
| config 編集 | **不要**（`testDir` + `testIgnore` で自動登録） |
