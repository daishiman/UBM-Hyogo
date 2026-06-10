# Phase 11: 手動テスト（視覚確認計画・VISUAL）

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- visualEvidence: `VISUAL`（開催日ドロワーの出席追加 UI が単一 select → 複数選択チェックリスト + 大量選択モーダルへ変わる）
- workflow_state: `implemented_local_evidence_captured`（apps/web 実装・focused tests・typecheck/lint/token gate 完了。本 Phase は local evidence と staging visual pending 境界を記録）
- evidence_status: `local_dom_evidence_captured_screenshot_pending_user_gate`（実装後に local fixture / staging 認証済み screenshot を取得。本サイクルでは PNG 実体を作らない）
- 本 Phase の責務: 一括出席追加 UI（AC-1..AC-12）の視覚確認対象・撮影予定の画面状態・canonical screenshot 名案・jsdom 検証境界・代替 evidence・配置先を確定する

> **local evidence 境界明示**: 本タスクはapps/web 実装済み である。
> `outputs/phase-11/manual-test-result.md` は「local PASS evidence と staging visual pending 境界」を記録し、
> `outputs/phase-11/screenshots/` には local fixture PNG 7 枚を保存済み。
> `phase11-capture-metadata.json` の `status` は `local_fixture_screenshots_captured_staging_pending_user_gate` とし、validator が
> local fixture screenshot captured と staging pending を分離する。staging 認証済み baseline は user-gated。

## 目的

jsdom（focused vitest）では検証できない「チェックリストの横並び/縦リスト・選択強調・モーダルの overlay 表示・
toast の見え方」を、local fixture pixel screenshot で確認し、staging 認証済み baseline で再確認する
手順と PASS 観点を確定する。本タスクは `apps/web` のみのスコープで、既存の一括取込 endpoint
（`POST /api/admin/meetings/:sessionId/attendance/import?dryRun=false`）を再利用し、API/D1/Form を変更しない。

## 実行タスク

### 1. 視覚確認対象と evidence 境界

| 対象 | staging route | jsdom で確認可 | staging 実機で確認すべき範囲 |
| --- | --- | --- | --- |
| ドロワー内チェックリスト（主経路） | `/(admin)/admin/meetings`（行クリック → ドロワー展開） | DOM class / `aria-checked` / `data-testid` / 件数文言 | 候補リストのカード化・選択強調の見え方・スクロール時の破綻 |
| 検索（インクリメンタル絞込） | 同上 | 絞込後の DOM 件数 | 入力時の即時絞込み・FormField の配置 |
| 「選択した N 名を一括追加」ボタン | 同上 | `disabled` 属性 / ラベルの N 反映 | 件数バッジの視認性・disabled 状態の見え方 |
| 大量選択モーダル（補助経路） | 同上（「人数が多い時はこちら」起動） | `role="dialog"` / `aria-modal` の DOM 存在 | overlay の全画面表示・スクロール可能リスト・全選択導線 |
| 一括追加成功 / 失敗 toast | 同上 | toast 文言の DOM 存在 | toast の表示位置・色（成功/失敗 tone）・自動消滅 |

> jsdom は class 付与・DOM 文言・属性値（`aria-checked` / `disabled`）までしか保証できず、
> `flex` / `overflow` / overlay の **レンダリング結果** は確認不能。その差分を local fixture screenshot で埋め、
> staging 実機 screenshot は認証済み実データ baseline として user-gated に残す。

### 2. テストケース（撮影予定の画面状態）

> 視覚 TC（`TC-11-*`）は DOM/state 境界を focused tests で確認済み。local fixture pixel screenshot は取得済み。

| テストケース | 確認対象（AC） | 何を見れば PASS か | 撮影予定 screenshot 名案 | 状態 |
| --- | --- | --- | --- | --- |
| TC-11-1 | ドロワー閉（一覧） | 開催日一覧が表示され、行クリックでドロワーが開く起点が分かる | `bulk-attendance-drawer-closed.png` | `PASS_DOM` |
| TC-11-2 | AC-1/AC-4 チェックリスト展開 | ドロワー内に **未出席候補のチェックリスト** が表示。各候補に Checkbox。出席済は本リストに出ない | `bulk-attendance-checklist-expanded.png` | `PASS_DOM` |
| TC-11-3 | AC-1/AC-3 複数選択中 | 複数候補に **チェックが入り選択強調**（`aria-checked=true`）、「選択した {N} 名を一括追加」ボタンに **件数 N が反映** | `bulk-attendance-multi-selected.png` | `PASS_DOM` |
| TC-11-4 | AC-2 検索絞込 | 会員名 / memberId で **インクリメンタル絞込** され、候補リストが該当のみに縮む | `bulk-attendance-search-filtered.png` | `PASS_DOM` |
| TC-11-5 | AC-8 モーダル展開 | 「人数が多い時はこちら」から **全画面モーダル** が開き、検索 / 全選択 / 選択解除 / 一括追加を持つ | `bulk-attendance-modal-expanded.png` | `PASS_DOM` |
| TC-11-6 | AC-6 一括追加成功 toast | 送信後 `「N 名の出席を追加しました」` toast が表示され、選択がクリアされる | `bulk-attendance-success-toast.png` | `PASS_DOM` |
| TC-11-7 | AC-7 一括追加失敗 toast | `committed:false` 時、attended 不変で失敗内訳 toast（例: `追加できませんでした（出席済 2 / 削除済 1）`）が表示され、選択は保持 | `bulk-attendance-failure-toast.png` | `PASS_DOM` |

### 3. 画面カバレッジマトリクス

| テストケース | 画面 / 状態 | viewport | 撮影セレクタ / 対象 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-11-1 | 開催日一覧（ドロワー閉） | desktop（≈1280px） | `MeetingTimeline` ページ全体 | — |
| TC-11-2 | ドロワー内チェックリスト | desktop | `[data-testid="bulk-attendance-checklist-${sessionId}"]` | AC-1/AC-4 |
| TC-11-3 | 複数選択中のチェックリスト | desktop | チェックリスト + 送信ボタン（`bulk-attendance-submit-${sessionId}`） | AC-1/AC-3 |
| TC-11-4 | 検索絞込後のチェックリスト | desktop | 検索 input（`bulk-attendance-search-${sessionId}`）+ 候補リスト | AC-2 |
| TC-11-5 | 大量選択モーダル | desktop | `[data-testid="bulk-attendance-modal-${sessionId}"]` | AC-8 |
| TC-11-6 | 成功 toast | desktop | toast 領域 | AC-6 |
| TC-11-7 | 失敗 toast | desktop | toast 領域 | AC-7 |

> N/A（暗黙スキップ禁止の明示記録）:
> - ダークモード: 本タスクは admin 画面でダークテーマ対象外 → N/A。
> - 狭幅 viewport: チェックリスト主経路は既存ドロワー内幅で成立。大量選択はモーダルへ誘導するため狭幅専用 fallback の追加なし → 実装後 desktop のみ撮影、狭幅は N/A。

### 4. jsdom で確認できない描画と staging 実機の境界

| 視覚要素 | jsdom で確認できない理由 | 代替 evidence（jsdom / gate 側） | staging で確認する内容 |
| --- | --- | --- | --- |
| チェックリストの整列・選択強調 | `flex` / hover / `[aria-checked]` の背景描画は jsdom が算出しない | `BulkAttendanceChecklist.spec.tsx`（Checkbox 描画 / `aria-checked` 属性 / disabled）+ `grep ".bulk-attendance" globals.css` | 実際の整列・選択強調・余白 |
| ボタン件数バッジ | ラベル文言は DOM で取れるがバッジの視認性は描画依存 | spec で `「選択した N 名」` 文言・`disabled` を検証 | バッジの視認性・disabled の見え方 |
| モーダル overlay 表示 | `position:fixed` overlay / scroll lock は jsdom 非算出 | `BulkAttendanceModal.spec.tsx`（`role="dialog"` / `aria-modal` / onClose） | 全画面 overlay・スクロール可能リスト |
| toast の tone / 位置 | toast の色・配置は描画依存 | Shell spec で toast 文言を検証 | 成功/失敗 tone・表示位置・自動消滅 |

代替 evidence のコマンド（Phase 9 で確定済を再掲）:

```bash
# focused vitest（DOM class / aria 属性 / 文言 / 件数）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts

# grep gate（CSS 定義 / token / API 非変更）
grep -n "bulk-attendance" apps/web/src/styles/globals.css
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api packages | grep . && echo "[FAIL]" || echo "[PASS: api/packages untouched]"
```

### 5. スクリーンショット取得・配置結果

local fixture Playwright の代表 screenshot は取得済み。staging 認証セッションの baseline は user-gated として残す。

| 配置先 | 内容 | 状態（本仕様作成時点） |
| --- | --- | --- |
| `outputs/phase-11/screenshots/` | local fixture screenshot 置き場 | 7 PNG present |
| `outputs/phase-11/screenshot-plan.json` | 撮影計画（mode: VISUAL / 7 状態） | `present` |
| `outputs/phase-11/phase11-capture-metadata.json` | capture inventory（status: local_fixture_screenshots_captured_staging_pending_user_gate） | `present` |
| `outputs/phase-11/manual-test-result.md` | TC-11-* の PASS 観点・local evidence・staging pending 境界 | `present` |
| `outputs/phase-11/ui-sanity-visual-review.md` | Apple UI/UX 観点の視覚レビュー計画 | `present` |
| staging 認証済み baseline screenshots | 実データ・実認証環境の pixel screenshot | `runtime_pending`（user-gated） |

> local fixture screenshot は取得済み。DOM/state/API 境界は focused tests で PASS 済み。

### 6. Gate-B 状態

`artifacts.json` の Gate-B（evidence_path: `outputs/phase-11/manual-test-result.md`）は
**passed**（local implementation review 完了）である。staging visual baseline / commit / PR は Gate-C user-gated とする。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/phase-1-requirements.md` | AC-1..AC-12 |
| SSOT | `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/outputs/phase-1/shared-context.md` | API 契約 / シグネチャ / all-or-nothing UX |
| テスト計画 | `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/phase-4-test-plan.md` | jsdom 代替 evidence・grep gate |
| QA | `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/phase-9-qa.md` | 検証コマンド・gate・AC マッピング |
| 最終レビュー | `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/phase-10-final-review.md` | AC トレース |
| artifacts | `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/artifacts.json` | Gate-B（evidence_path / pending） |
| phase11 テンプレート | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | VISUAL / local evidence + pending screenshot 境界 |
