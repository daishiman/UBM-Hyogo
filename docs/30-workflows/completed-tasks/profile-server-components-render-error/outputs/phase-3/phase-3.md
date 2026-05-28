# Phase 3: 設計レビュー

## 3.1 設計レビュー判定: PASS

`fix-admin-server-components-render-error-stg` で確立した parity 設計をそのまま適用する。
仮説 H1 は既に root cause として特定済みのため、Phase 4 → 5 へ直行可能。

## 3.2 4 条件評価

| 観点   | 評価                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| 価値性 | PASS — staging `/profile` 復旧 + focused regression で恒久対策、admin 側との設計対称性確保                       |
| 実現性 | PASS — 修正対象は 2 ファイル（`authed.ts` + `profile/page.tsx`）。1 サイクル完了可能。                            |
| 整合性 | PASS — 既存 env.ts accessor contract・wrangler.toml binding・既存 `safeServerFetch` 経路と矛盾なし                       |
| 運用性 | PASS — focused regression + grep gate で再発を検出。fallback 撤去で silent fallback 事故を 0 にする               |

## 3.3 設計レビュー指摘 (MINOR)

| ID    | 内容                                                                                                | 対応                           |
| ----- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| M-01  | `safeServerFetch` の `rethrowOn` 配列順序                                                            | `AuthRequiredError` のみで十分、他は降格 |
| M-02  | env 解決失敗時の throw メッセージに secret 値が混入しない                                            | URL 値そのものは error message に含めない設計とする |
| M-03  | `public.ts` には同型違反が残る可能性                                                                 | `getPublicFetchEnv()` 経由で env.ts に集約済みのため、本タスクの漏れではない |
| M-04  | `error.tsx` boundary 側のメッセージは変更しない                                                      | UI 不変条件遵守。SectionError 経由の表示も既存メッセージを継承 |

## 3.4 Go/No-Go 決定

| 判定項目                  | 状態 | 備考                                                |
| ------------------------- | ---- | --------------------------------------------------- |
| stack trace 取得計画あり  | ✅   | Phase 2.2 にコマンド列を明記                        |
| 修正 surface 特定済み     | ✅   | `authed.ts` + `profile/page.tsx`                    |
| 不変条件への抵触なし      | ✅   | 修正方向自体が不変条件を満たす方向                  |
| 1 サイクル完了可能性      | ✅   | スコープ外項目を明記 (CONST_007)                    |
| 結論                      | **GO** | Phase 4 着手可                                    |
