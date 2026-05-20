# step-05 admin dashboard runtime screenshot 取得 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | step-05-followup-001-admin-dashboard-runtime-screenshot-capture                                 |
| タスク名     | step-05 admin dashboard `StatusDistribution` の authenticated runtime screenshot 取得           |
| 分類         | 改善 / evidence completion                                                                      |
| 対象機能     | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` SVG bar chart       |
| 優先度       | 中                                                                                              |
| 見積もり規模 | 小規模（0.25 人日）                                                                             |
| ステータス   | unassigned                                                                                      |
| 発見元       | step-05-dashboard-chart-implementation Phase 11 / Phase 12 user-gated boundary                  |
| 発見日       | 2026-05-18                                                                                      |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/step-05-dashboard-chart-implementation/`
- 親タスク状態: `implemented_local_evidence_captured`
- Phase 11 evidence 状態:
  - local non-visual evidence 5 点 (`typecheck.log` / `lint.log` / `test.log` / `build.log` / `grep-gate.log`) = `present`
  - `screenshots/admin-dashboard-placeholder.png` / `admin-dashboard-chart.png` = placeholder PNG (16x16, 445B) のまま user-gated
  - `a11y-aria-label.txt` / `visual-diff-summary.txt` = `present`
- 関連 outputs:
  - `docs/30-workflows/step-05-dashboard-chart-implementation/outputs/phase-11/discovered-issues.md`（"Runtime chart screenshot requires populated `byStatus` fixture — user-gated"）
  - `docs/30-workflows/step-05-dashboard-chart-implementation/outputs/phase-12/main.md` §6 残課題（authenticated staging/admin context が必要）
  - `.claude/skills/aiworkflow-requirements/changelog/20260518-step-05-dashboard-chart-implementation.md`（User-gated boundary: authenticated runtime screenshots）
- 関連実装:
  - `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`
  - `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx`
  - `apps/api/src/routes/admin/dashboard.ts`（`byStatus` producer）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

step-05-dashboard-chart-implementation で admin dashboard の `StatusDistribution` に SVG bar chart 描画ロジックを追加し、`GET /admin/dashboard` の `byStatus` producer を完了した。Phase 11 evidence inventory のうち non-visual evidence（typecheck / lint / test / build / grep-gate / a11y / visual-diff-summary）はローカルで取得済みだが、`admin-dashboard-placeholder.png` / `admin-dashboard-chart.png` は **inventory 整合のため placeholder PNG（16x16, 445B のダミー）** が物理配置されているのみで、実際の admin 画面の screenshot は authenticated staging/admin context を必要とするため user-gated として残された。

### 1.2 問題点・課題

- Phase 11 inventory 上は `present` となっているが、画像内容は dummy で「`slices === undefined` 時の placeholder 表示」「`slices` populated 時の SVG bar chart 表示」の視覚的回帰検知に使えない
- 後続の visual regression baseline（task-18 visual-design-tokens / task-22 regression smoke）と接続する際、admin dashboard chart の正規 baseline が無いため diff 検知ができない
- `outputs/phase-11/main.md` 内で "placeholder artifact" と注記済みだが、authenticated runtime での真画像が残課題として明示されている

### 1.3 放置した場合の影響

- step-05 ワークフローが `implemented_local_evidence_captured` のままで、authenticated runtime evidence captured へ進めない
- `byStatus` populated 時の SVG bar chart の色（`var(--ubm-color-ok|info|warn)`）が design-tokens 正本と OKLch 値で整合しているかの視覚確認が pending
- admin dashboard UI に regression が混入した場合、placeholder 画像では検知不可

---

## 2. 何を達成するか（What）

### 2.1 目的

step-05 で実装した admin dashboard `StatusDistribution` の **placeholder 表示** と **populated chart 表示** の 2 状態を、authenticated admin context で取得した本物の PNG screenshot に置き換え、Phase 11 evidence claim を `runtime_pending` → `runtime_completed` に更新する。

### 2.2 最終ゴール

- `outputs/phase-11/screenshots/admin-dashboard-placeholder.png` = 本物の admin 画面 PNG（`slices === undefined` 状態）
- `outputs/phase-11/screenshots/admin-dashboard-chart.png` = 本物の admin 画面 PNG（`slices` populated 状態 = `byStatus` 配列に有効値を一時注入）
- 各 PNG は commit 可能サイズ（個別 ≤ 500KB 目安）かつ `role="img"` + `aria-label` の SVG が視認できる
- mock 注入は手順実行後に必ず revert され、`git status apps/web/src/lib/admin/` がクリーン
- Phase 11 `outputs/phase-11/main.md` および Phase 12 `outputs/phase-12/main.md` §6 残課題から authenticated runtime screenshot 項目を consumed に更新

### 2.3 スコープ

#### 含むもの

- staging または local dev で admin アカウントログイン → `/admin` への遷移
- `slices === undefined` の placeholder 表示状態の screenshot 撮影
- `byStatus` 固定値を一時注入した populated chart 表示状態の screenshot 撮影
- mock 注入の revert 確認
- placeholder PNG（16x16 dummy）2 件を本物に置換
- Phase 11 / 12 main.md の状態更新差分

#### 含まないもの

- `StatusDistribution.tsx` のロジック変更（既存実装をそのまま使う）
- 新規 API endpoint 追加（`byStatus` は既存 endpoint 経由のみ）
- chart dependency 追加（`recharts` / `visx` 等は不変条件4で禁止）
- design-tokens.md の新規 token 追加

### 2.4 成果物

- `outputs/phase-11/screenshots/admin-dashboard-placeholder.png`（authenticated runtime PNG）
- `outputs/phase-11/screenshots/admin-dashboard-chart.png`（authenticated runtime PNG）
- Phase 11 / 12 main.md の evidence claim 更新差分

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 API `byStatus` producer の初期スコープ判定が source-spec boundary だった

タスク仕様策定時点では `GET /admin/dashboard` の `byStatus` producer は absent と判定し「未タスク化候補」として扱う設計だったが、review cycle 中に「既存 endpoint へ追加なら追加で破壊変更にならない」と判断し、同一サイクル内で実装を完了した。結果として Phase 12 `unassigned-task-detection.md` は API producer を 0 件と宣言し、残るは authenticated runtime screenshot のみとなった。

**学び**: VISUAL_ON_EXECUTION タスクで「軽量 producer 不在」を初期判定したら、まず「同一サイクル内で追加完了できないか」を再評価する。完了可能なら未タスク化せず、evidence 側は component-level proof と authenticated runtime proof を分離記録する。

### 3.2 populated chart screenshot を取るための fixture 注入

`byStatus` を populated 状態にするには:

1. API 側で固定値を返す（実 DB に依存しない一時 patch）か、
2. UI 側で `toAdminDashboardUi()` への入力を一時 mock する

のいずれかが必要。本タスクでは **UI 側の一時 mock**（`apps/web/src/lib/admin/admin-dashboard-ui.ts` 直近の caller を patch）を採用する。手順実行後の revert 漏れが構造的リスクのため `git status apps/web/src/lib/admin/` でクリーン確認を AC に含める。

### 3.3 OKLch token と grep-gate の両立

SVG `fill` 属性で `var(--ubm-color-ok|info|warn)` を直接参照することで HEX 直書きを回避している。`grep -nE 'fill="#'` で fail しないことを Phase 11 で確認済み。authenticated runtime screenshot を新規取得した後も grep-gate.log は変化しない想定（実装ロジック自体は触らないため）。

### 3.4 dummy PNG が `present` 扱いで Phase 12 を通過した点

Phase 11 inventory の status は「ファイル存在」で `present` 判定されるため、16x16 dummy PNG でも CI gate は通過する。これは **inventory completeness と content quality の分離**が意図的だが、後続タスクが baseline として参照する際にハマる可能性がある。本タスク完了時に、Phase 12 main.md に "chart screenshot placeholder" → "chart screenshot runtime" のように label を更新して content quality を明示する。

---

## 4. 受入条件 (AC)

- **AC-1**: `outputs/phase-11/screenshots/admin-dashboard-placeholder.png` が authenticated admin context で取得された PNG であり、`公開ステータス` カード内に「分布データは現在集計対象外です」プレースホルダー文言が視認できる
- **AC-2**: `outputs/phase-11/screenshots/admin-dashboard-chart.png` が `byStatus` populated 状態で取得された PNG であり、SVG bar chart の 3 本（ok / info / warn 相当）が描画されている
- **AC-3**: 両 PNG が個別 ≤ 500KB かつ 16x16 dummy ではない（最小 200x100 以上）
- **AC-4**: mock 注入の revert が完了し、`git status apps/web/src/lib/admin/` がクリーン
- **AC-5**: Phase 11 `outputs/phase-11/main.md` および Phase 12 `outputs/phase-12/main.md` §6 残課題で authenticated runtime screenshot 項目が consumed / runtime_completed に更新
- **AC-6**: `outputs/phase-12/unassigned-task-detection.md` に本 followup の consumed 記録が追記される
- **AC-7**: grep-gate.log と a11y-aria-label.txt は再取得後も pass を維持

---

## 5. 参照資料

- `docs/30-workflows/step-05-dashboard-chart-implementation/phase-11.md` §6 screenshot 取得手順
- `docs/30-workflows/step-05-dashboard-chart-implementation/outputs/phase-11/discovered-issues.md`
- `docs/30-workflows/step-05-dashboard-chart-implementation/outputs/phase-11/main.md`
- `docs/30-workflows/step-05-dashboard-chart-implementation/outputs/phase-12/main.md` §6 残課題
- `docs/30-workflows/step-05-dashboard-chart-implementation/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260518-step-05-dashboard-chart-implementation.md`
- `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md`
- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`
- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx`
- `apps/api/src/routes/admin/dashboard.ts`
- `apps/web/src/styles/tokens.css`（`--ubm-color-ok|info|warn` 正本）
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 2/3/4
