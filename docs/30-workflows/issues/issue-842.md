# [#842] useAdminMutation: cross-admin mutation timeout / retry / idempotency reliability policy

## メタ情報

```yaml
issue_number: 842
title: useAdminMutation: cross-admin mutation timeout / retry / idempotency reliability policy
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-05-20
updated_date: 2026-05-20
url: https://github.com/daishiman/UBM-Hyogo/issues/842
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

`apps/web/src/features/admin/hooks/useAdminMutation` を admin destructive mutation の **唯一の reliability policy 注入点** として確立し、timeout / retry / idempotency / 404-as-success の共通 edge case を hook 内部で吸収する。

- 仕様書: [`docs/30-workflows/unassigned-task/admin-mutation-timeout-policy.md`](../blob/dev/docs/30-workflows/unassigned-task/admin-mutation-timeout-policy.md)
- 発見元 workflow: [`docs/30-workflows/step-06-meetings-attendance-implementation/`](../tree/dev/docs/30-workflows/step-06-meetings-attendance-implementation)
- 発見元 evidence: `docs/30-workflows/step-06-meetings-attendance-implementation/outputs/phase-12/unassigned-task-detection.md`（"mutation timeout policy" 行）
- スコープ: cross-admin (features/admin/hooks/useAdminMutation 配下の全 caller)
- 優先度: P2 (medium)
- ステータス: pending

## 背景 (Why)

step-06 (meetings attendance 管理画面) で admin destructive mutation を `useAdminMutation` に統一したが、以下が admin 全体に未整備のまま温存されている:

- **timeout**: fetch ハング時の打ち切り基準 (SLA) 未定義
- **retry**: 一過性 5xx / network error への自動再試行 policy 未定義
- **idempotency**: POST/DELETE 重複押下保護 (client デバウンス + server idempotency-key) 未定義
- **edge case 標準化**: 「他管理者先行解除 404」を success/failure どちらに倒すかが caller ごとに散在
- legacy `apps/web/src/lib/useAdminMutation` と新基盤 `apps/web/src/features/admin/hooks/useAdminMutation` の **二重存在** (CLAUDE.md 不変条件 10 違反リスク)

放置すると admin 配下の長時間ハング → 重複 mutation で audit log 汚染、404 解釈の caller 間揺れによる regression が発生する。

## 目的 (What)

- `useAdminMutation` シグネチャに `timeoutMs` / `retry` / `idempotencyKey` / `treat404AsSuccess` を追加
- `AbortController` ベース timeout + exponential backoff retry (idempotent method 限定) 実装
- `treat404AsSuccess: false | 'silent' | { toast: string }` の 3 値 policy
- `useConfirmDialog` との abort 連携 (dialog close → mutation abort → focus restore)
- legacy `apps/web/src/lib/useAdminMutation.ts` 廃止 or re-export 化判断
- `MeetingAttendancePanel.tsx` の 404 個別実装を hook 経由に移譲

## 苦戦箇所 (step-06 からの引継ぎ)

1. **legacy / 新基盤の同名 hook 二重存在** — endpoint SSOT 判定で手戻り発生。policy 拡張前に強制片寄せ必須
2. **UI surface `/attendances` (複数形) と legacy `/attendance` (単数) の混在** — caller 側 path 直書きが retry 時の 404 success-relaxation を誤発火させる
3. **ConfirmDialog focus trap / restore と timeout abort の責務分離** — caller / hook / dialog 3 者の順序を誤ると focus 戻らない or abort 後成功 toast の regression
4. **404 を「他管理者先行解除」とみなす edge case** — resource 特性依存 (tags の 404 はバグ可能性)。既定は `false` (失敗扱い) に倒して安全側

## 受入条件 (AC) サマリ

- AC-1: `timeoutMs` / `retry` / `idempotencyKey` / `treat404AsSuccess` オプション追加 + 型 + JSDoc
- AC-2: timeout abort 時 AbortError は silent (失敗 toast を出さない)
- AC-3: retry は idempotent method 限定を型レベルで表現
- AC-4: `treat404AsSuccess` 3 値の型表現 + 既定値 `false`
- AC-5: `useConfirmDialog` close で進行中 mutation abort + focus restore
- AC-6: `MeetingAttendancePanel.tsx` 404 ロジックを hook オプション宣言に置換
- AC-7: legacy `lib/useAdminMutation.ts` 処置 (削除 / re-export / deprecate) 決定
- AC-8: 触る caller は新基盤のみ参照 (CLAUDE.md 不変条件 10)
- AC-9: `apps/api` endpoint surface 追加なし (UI prototype alignment 不変条件 1)
- AC-10..11: D1 schema 変更なし / `apps/web` D1 直接アクセスなし (不変条件 5)
- AC-12: `useAdminMutation.spec.ts(x)` に timeout / retry / idempotency / 404 3 値 / abort 連携の 5 観点を追加 PASS
- AC-13..15: `pnpm typecheck` / `pnpm lint` / vitest がローカル PASS

詳細 AC は仕様書 §4 を参照。

## 関連ファイル

- `apps/web/src/features/admin/hooks/useAdminMutation.ts` (拡張対象本体)
- `apps/web/src/features/admin/hooks/useConfirmDialog.ts` (abort 連携対象)
- `apps/web/src/components/ui/ConfirmDialog.tsx` (focus trap / restore)
- `apps/web/src/lib/useAdminMutation.ts` (legacy / 処置判断対象)
- `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` (404 success-relaxation 現行 caller)
- `apps/web/src/components/admin/MeetingPanel.tsx` (ConfirmDialog 経由 mutation 参考実装)
