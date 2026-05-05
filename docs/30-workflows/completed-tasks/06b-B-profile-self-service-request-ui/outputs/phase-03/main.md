# Phase 3 成果物: 設計レビュー — 06b-B-profile-self-service-request-ui

## 1. レビュー結果サマリ

| 区分 | 件数 | 詳細 |
| --- | --- | --- |
| PASS | 7 AC + 6 観点 | 後段表参照 |
| MINOR | 1 | MINOR-01（pending 状態の reload 永続化） |
| MAJOR | 0 | — |
| NO-GO | 0 | GATE-1..3 が満たされる前提で Phase 4 開始可能 |

## 2. AC × 設計マッピング

| AC | 設計上の根拠 | 判定 |
| --- | --- | --- |
| AC-1 公開停止申請 | `RequestActionPanel` → `VisibilityRequestDialog(desiredState="hidden")` → `requestVisibilityChange()` → 202 後 banner | PASS |
| AC-2 再公開申請 | 同 dialog（`desiredState="public"`）。`publishState==="hidden"` のときのみボタン描画 | PASS |
| AC-3 退会申請 | `DeleteRequestDialog` の二段確認 → `requestDelete()` → 202 後 banner | PASS |
| AC-4 二重 409 | error mapping `DUPLICATE_PENDING_REQUEST` → banner + button disabled | PASS |
| AC-5 本文編集 UI 追加なし | dialog は `desiredState` / `reason` / 確認 checkbox のみ。氏名等 field 無し。Phase 4 で grep lint | PASS |
| AC-6 D1 直接禁止 | helper は `fetchAuthed` のみ。`rg cloudflare:d1 apps/web` で 0 hit を CI 化 | PASS |
| AC-7 a11y | dialog `role=dialog` + `aria-modal=true` + focus trap、エラー `role=alert` | PASS |

## 3. レビュー観点別判定

| 観点 | 判定 | 補正 / follow-up |
| --- | --- | --- |
| accessibility | PASS | axe scan を Phase 9 quality gate に組み込む |
| i18n | PASS | 文言テーブルが Phase 1 / 2 で 1:1 確定済 |
| security | PASS | reason 500 文字制限を client zod で再検証 |
| D1 直接禁止 | PASS | Phase 4 grep を CI 化 |
| 状態同期 | MINOR-01 | 202 受信後 pending 表示が reload で消える。Phase 12 follow-up `/me/profile.pendingRequestTypes` 拡張を起票 |
| 二重送信 | PASS | submitting flag + 409 server-side 抑止 |
| rate limit | PASS | UI 文言で待機誘導 |
| rules consent gate | PASS | panel 非表示で API 403 を未然回避 |

## 4. 不変条件抵触リスクと検出方法

| 不変条件 | リスク | 静的検出コマンド |
| --- | --- | --- |
| #4 本文編集禁止 | dialog に氏名等 `<input>` が混入 | `rg -n 'name=\"(displayName\|email\|kana\|firstName\|lastName)\"' apps/web/app/profile/_components/Request*.tsx` → 0 hit |
| #5 D1 直接禁止 | helper / component が D1 を import | `rg -n 'cloudflare:d1\|D1Database' apps/web/` → 0 hit |
| #11 self-service 境界 | URL に `:memberId` を埋め込む | `rg -n '/me/[^/"]+/' apps/web/src/lib/api/me-requests.ts` → 0 hit（許容パスは `/me/visibility-request` `/me/delete-request` のみ） |
| #7 responseId 漏洩 | UI が responseId を表示 | `rg -n 'responseId' apps/web/app/profile/_components/Request*.tsx` → 0 hit |

これらは Phase 4 のテスト戦略で CI grep として固定し、Phase 9 で再検証する。

## 5. NO-GO 条件 / Phase 4 開始条件

| ゲート | 内容 | 判定方法 |
| --- | --- | --- |
| GATE-1 | 06b-A 完了（Auth.js session resolver） | `docs/30-workflows/06b-A-*/index.md` の `状態` が `completed` |
| GATE-2 | API `/me/visibility-request` `/me/delete-request` の staging 動作確認 | curl smoke 結果を Phase 5 runbook に記録 |
| GATE-3 | 不変条件 #4 / #5 / #11 で MAJOR ゼロ | Phase 3 本書で 0 件確認済 |

Phase 4 開始条件: GATE-1〜3 がすべて満たされ、AC-1..AC-7 がすべて PASS。MINOR-01 は Phase 12 follow-up 化で許容。

## 6. リスクと緩和策

| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| pending 表示が reload で消える | UX 一貫性低下 | Phase 12 で `/me/profile` に pending 情報追加（owner: 04b 拡張）を起票 |
| 退会の不可逆性が伝わらない | 誤申請 | 強調文言 + checkbox + 二段確認 |
| network 切断中 submit | 無反応に見える | `useTransition.isPending` で submit ボタンを spinner 化 |
| 429 多発 | 申請受付不能 | rate limit 設定値を Phase 4 でレビュー、UI 文言で待機案内 |
| 401（session resolver 失敗） | smoke 不能 | GATE-1 で 06b-A 完了を強制 |

## 7. simpler alternative 検討記録

| 検討した代替 | 採否 | 理由 |
| --- | --- | --- |
| Server Action で submit | 不採用 | Workers + OpenNext の動的境界が増えるだけで利得無し。client helper で十分 |
| 楽観的更新 | 不採用 | 管理者承認まで反映されないため state 乖離を生む |
| 単一 form（公開停止/退会を統合） | 不採用 | 退会の不可逆性が薄まり UX 上危険 |
| Form schema を `packages/shared` に新設 | 不採用 | 既存 `MeVisibilityRequestBodyZ` 等を `apps/api` 側で参照のみ。client では同型を type レベルで一致させれば足りる |

## 8. MINOR 追跡

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 備考 |
| --- | --- | --- | --- | --- |
| MINOR-01 | pending 状態が reload で消える | Phase 12（follow-up 起票） | — | 本タスク scope 外。`/me/profile` 拡張は 04b 系の owner |

## 9. Phase 4 への handoff

- AC × 設計マッピング（PASS 全件）
- 不変条件検出コマンド一覧（CI grep 化対象）
- NO-GO 条件 GATE-1..3
- MINOR-01 follow-up 計画
- validation matrix（Phase 2 §7）
