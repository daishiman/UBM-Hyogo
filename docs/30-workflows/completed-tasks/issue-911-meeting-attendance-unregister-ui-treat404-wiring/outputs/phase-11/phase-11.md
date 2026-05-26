**[実装区分: 実装仕様書]**

# Phase 11: 手動テスト / runtime evidence 計画

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `implemented_local_evidence_captured` |
| Phase 11 mode | **NON_VISUAL** |
| 入力 | Phase 5 / Phase 9 |

## 1. Phase 11 mode 判定

本 task は admin meeting 出欠 UI に解除 button + 第 2 mutation を追加する component 層の振る舞い変更で、画面構造（layout / typography / color token）は変えない。AC は component spec (RTL + vitest) で完全に検証可能で、screenshot evidence は必要ない。したがって **`NON_VISUAL`** とする。

| 判定軸 | 値 | 根拠 |
|---|---|---|
| UI 構造変更 | あり（CTA 追加） | ただし design token / primitive は無改変 |
| visual regression リスク | 低 | 既存 button primitive の追加配置に閉じる |
| AC が screenshot を要求 | No | AC-1..AC-6 は全て component spec 内 assertion で検証 |
| 親 workflow (UI prototype alignment) の visual baseline 範囲 | 範囲外 | 親側 admin meeting 詳細は既存 baseline カバー外 |

結論: **NON_VISUAL**。screenshot 取得は実施しない。

## 2. runtime evidence 計画

vitest 実行ログを `outputs/phase-11/` 配下に保存する。

| # | evidence | path | 取得コマンド | 期待 |
|---|---|---|---|---|
| 1 | MeetingAttendancePanel spec ログ | `outputs/phase-11/vitest-meeting-attendance-panel.log` | `pnpm exec vitest run "apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx" 2>&1 \| tee <path>` | exit 0 / 14 tests pass |
| 2 | useAdminMutation 無回帰ログ | `outputs/phase-11/vitest-use-admin-mutation.log` | `pnpm exec vitest run apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts 2>&1 \| tee <path>` | exit 0 / 既存 case 全 pass |
| 3 | typecheck ログ | `outputs/phase-11/typecheck.log` | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 \| tee <path>` | exit 0 |
| 4 | lint ログ | `outputs/phase-11/lint.log` | `mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 \| tee <path>` | exit 0 |
| 5 | DELETE-race caller 棚卸し | `outputs/phase-11/delete-race-callers.txt` | `rg -n 'useAdminMutation\([^)]*"DELETE"' apps/web/app apps/web/src -g '*.ts' -g '*.tsx' -g '!**/__tests__/**' -g '!**/*.spec.ts' -g '!**/*.spec.tsx' 2>&1 \| tee <path>` | production caller 0 件 |

## 3. evidence inventory

| Classification | Path | Status |
|---|---|---|
| vitest meeting attendance panel | outputs/phase-11/vitest-meeting-attendance-panel.log | present |
| vitest useAdminMutation 無回帰 | outputs/phase-11/vitest-use-admin-mutation.log | present |
| typecheck | outputs/phase-11/typecheck.log | present |
| lint | outputs/phase-11/lint.log | present |
| DELETE-race caller 棚卸し | outputs/phase-11/delete-race-callers.txt | present |

focused component spec / hook spec / web typecheck / web lint は exit 0。production DELETE caller 棚卸しは 0 件のため、`delete-race-callers.txt` に 0 件であることを明記する。

## 4. fail 時のフロー

| 症状 | 対応 |
|---|---|
| B4 fail（404 が error toast に落ちる） | `MeetingAttendancePanel.tsx` の unregister mutation `options.treat404AsSuccess` 設定漏れを疑う |
| A6b fail（register 側 404 が success 扱い） | mutation を 2 つに分離せず使い回している実装を疑う |
| useAdminMutation spec 無回帰失敗 | hook 本体は無改変のはず。意図せず触っていないか git diff で確認 |

## 5. Phase 11 完了条件

- [x] mode = NON_VISUAL を判定（根拠 4 項目）
- [x] evidence 5 件の path / 取得コマンド / 期待を確定
- [x] inventory を実測ログ保存後の `present` 状態で記載
- [x] fail 時のフローを記述

## 6. 次 Phase への引き継ぎ

Phase 12 strict 7 の `phase12-task-spec-compliance-check.md` の §4 evidence inventory は本 Phase の表を継承する。focused evidence は同 wave で `present` に更新済み。
