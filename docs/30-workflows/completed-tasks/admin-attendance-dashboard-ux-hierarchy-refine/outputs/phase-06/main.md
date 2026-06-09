# Phase 6 — テスト拡充方針（fail path / 回帰 guard）

> 上流: `outputs/phase-04/test-plan.md`（正常系 TC-XX）/ `outputs/phase-05/runbook.md`（degrade 分岐）。
> 個別ケースは `./failure-cases.md`（TC-E-XX）。

## 1. 正常系（Phase 4）/ 異常系（Phase 6）責務分担

| 区分 | Phase | 検証対象 | 例 |
| --- | --- | --- | --- |
| 正常系（Green path） | 4 | 描画 / 排他タブ / トーン切替 / a11y / grid クラス | TC-01〜TC-20 |
| 異常系・境界値（fail path） | 6 | error degrade / EmptyState / 境界値トーン / 全 error / 初期タブ / 再 fetch 不変 | TC-E-01〜TC-E-09 |

- Phase 4 は「実装が正しく動く」を Green 化。Phase 6 は「壊れた入力・境界・部分障害でも UI が破綻しない」を担保。
- 両者で `apps/web/src/features/admin/attendance/__tests__/` の同一 spec ファイル群に追記する（新規ファイルは作らず Phase 4 の 3 新規 spec に `describe` ブロックを追加）。

## 2. 拡充の前提（Phase 5 Green 後）

- Phase 5 で `AttendanceDetailTabs` / `attendanceFollowLevel` / hero 化 / `data-attendance-follow` が実装済み。
- 本 Phase は degrade 分岐（`SafeResult.ok` false 経路）と境界値（count = 0/1/多数）を重点的に attack する。
- SafeResult error fixture（`errResult`）は `phase-04/test-plan.md` §0 を流用する。

## 3. カバー観点（failure-cases.md の TC-E にマップ）

| 観点 | TC-E | AC |
| --- | --- | --- |
| (a) overview error → PRIMARY degrade | TC-E-01 | AC-10 |
| (b) 欠席者 0 件 EmptyState | TC-E-02 | AC-10 / AC-4 |
| (c) 全 SafeResult error → 全ゾーン degrade（crash しない） | TC-E-03 | AC-10 |
| (d) Segmented 初期タブ（initialTab 既定 / 明示） | TC-E-04, TC-E-05 | AC-3 |
| (e) 欠席者数境界（0 / 1 / 多数）トーン切替 | TC-E-06, TC-E-07, TC-E-08 | AC-4 |
| (f) フィルタ変更後の再 fetch 挙動不変 | TC-E-09 | AC-10 |

## 4. 回帰 guard の位置づけ

| guard | 種別 | 検証内容 | 連携 Phase | 失敗時の意味 |
| --- | --- | --- | --- | --- |
| `verify-design-tokens` | CI gate（既存） | `apps/web/src/**`（attendance + globals.css）に HEX / `bg-[#xxx]` / `text-[#xxx]` が 0 件（AC-5） | Phase 9（ローカル grep）/ CI（PR gate） | 1 件でも HEX があると fail。runbook §5/§8 の token のみ CSS で保証 |
| playwright visual smoke | E2E（既存・staging 認証済み admin 画面） | 3 層レイアウト（PRIMARY/TREND/DETAIL）の視覚回帰。`/admin/dashboard/attendance` の baseline | Phase 11（baseline 取得・user-gated）| baseline と差分が出た場合に視覚回帰を検出 |
| vitest 対象限定 | unit/component | TC-01〜TC-20 + TC-E-01〜09 の全 Green | Phase 9 | fail path 含む全ケース pass を保証 |

- `verify-design-tokens` は本タスクの AC-5 の機械的 gate。runbook の globals.css 追加分が全て `var(--ubm-color-*)` であることでこの gate を pass する設計。
- playwright visual smoke は VISUAL タスクの回帰 guard。3 層化により大きく見た目が変わるため、Phase 11 で baseline を更新する（既存 baseline からの意図的差分）。これは「破壊」ではなく「意図的更新」であり、Phase 11 で screenshot 比較 + 承認の上で baseline 更新する（user-gated）。

## 5. ローカル実行コマンド

```bash
# fail path 含む全 TC（対象限定・--root . 必須）
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .

# HEX 回帰 guard（AC-5）— 追加行のみ検査
git diff apps/web/src/styles/globals.css | grep -nE '^\+.*#[0-9a-fA-F]{3,6}' && echo "FAIL" || echo "PASS"
bash -lc 'grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/features/admin/attendance && echo "FAIL" || echo "PASS"'
```
