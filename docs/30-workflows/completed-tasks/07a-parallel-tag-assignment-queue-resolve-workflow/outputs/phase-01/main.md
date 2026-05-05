# Phase 1: 要件定義 — outputs

## scope 確定

- endpoint: `POST /admin/tags/queue/:queueId/resolve`
- 入力: path `queueId`、body `{ action: 'confirmed' | 'rejected', tagCodes?: string[], reason?: string }`
- 出力: 200 + `{ queueId, status, resolvedAt, memberId, tagCodes? }`
- error: 400 (zod), 401 (no session), 403 (non-admin), 404 (queueId 不在), 409 (state conflict), 422 (constraint: unknown tag code / deleted member / empty reason)

## 既存コードとの drift 解決方針

既存 02b 実装は status `queued | reviewing | resolved` を採用しており、本仕様の `candidate | confirmed | rejected` と乖離している。
本タスクでは以下の適応戦略をとる（既存マイグレーションを破壊せず、仕様 semantics を実装）:

| 仕様 status | 既存 status マッピング | 備考 |
| --- | --- | --- |
| candidate | `queued`（初期投入） | `enqueueTagCandidate` で投入 |
| confirmed | `resolved`（success path） | member_tags 反映 |
| rejected | **新規追加** | 新マイグレーションで status enum 拡張 + `reason` を必須記録 |

`reviewing` は admin UI の中間状態として維持しうるが、本 workflow では `candidate → confirmed/rejected` の単純化を優先し、resolve 内で `queued → reviewing` への自動昇格は行わず、`queued` から直接 `resolved | rejected` を許容するよう repo の `ALLOWED_TRANSITIONS` を更新する。

## 状態遷移表

| from | to | 条件 | 結果 |
| --- | --- | --- | --- |
| queued (=candidate) | resolved (=confirmed) | tagCodes 全件が tag_definitions に存在 + member 存在 + 未削除 | 200, member_tags 追加, audit log |
| queued (=candidate) | rejected | reason が non-empty | 200, audit log |
| resolved (=confirmed) | resolved (=confirmed) | 同一 tagCodes（idempotent） | 200, audit log 追加なし |
| rejected | rejected | 同一 reason（idempotent） | 200, audit log 追加なし |
| resolved (=confirmed) | rejected | 任意 | 409 |
| rejected | resolved (=confirmed) | 任意 | 409 |
| resolved → queued | - | 任意 | 409 |
| rejected → queued | - | 任意 | 409 |

## AC quantitative

| AC | http | DB 事後状態 | audit_log |
| --- | --- | --- | --- |
| AC-1 | 200 | queue.status='resolved', member_tags +N 行 | admin.tag.queue_resolved × 1 |
| AC-2 | 200 | queue.status='rejected', queue.reason=body.reason | admin.tag.queue_rejected × 1 |
| AC-2 (空 reason) | 400 | 変化なし | 0 |
| AC-3 | 200 | 既存状態を返却 | 0（idempotent） |
| AC-3 (別 action) | 409 | 変化なし | 0 |
| AC-4 | 409 | 変化なし | 0 |
| AC-5 | - | - | 全 resolve 成功で audit 1 件 |
| AC-6 | 422 | 変化なし | 0 |
| AC-7 | 422 | 変化なし | 0 |
| AC-8 | - | tag_assignment_queue +1 行（status=queued） | 0（candidate 投入は audit 対象外） |
| AC-9 | - | UI 側 SWR mutate で queue から消える | - |
| AC-10 | 401/403 | 変化なし | 0 |

## true issue

1. **reject reason は必須**（運用上の説明責任を担保。422 で空文字を弾く）
2. **idempotent は同一 action + 同一 payload のみ**（confirmed→confirmed で tagCodes が異なる場合は 409。これは「結果整合性」より「明示的な状態確認」を優先するため）
3. **candidate 自動投入は 03b の sync 成功後 hook**（cron 不要、即時性優先。既に未解決 queue or member_tags 非空なら skip）
4. **member_tags 行モデルの drift**: 仕様は `tag_code, assigned_via_queue_id` だが既存は `tag_id, source, assigned_by`。本タスクでは tagCodes → tag_id 解決を workflow 内で行い、`source='admin_queue'`, `assigned_by=actorUserId` で記録する

## 不変条件担保案

- **#5（apps/web から D1 直接アクセス禁止）**: resolve workflow は `apps/api/src/workflows/` 配下、UI は `POST /admin/tags/queue/:queueId/resolve` 経由のみ
- **#13（tag は queue resolve 経由のみ）**: `member_tags` への INSERT は本 workflow 内 guarded update 成功後 のみ。直接 INSERT する path がないことを Phase 8/9 で grep 確認

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | tag 品質と監査が両立するか | PASS（admin gate + audit log + reject reason 必須） |
| 実現性 | 04c endpoint + 02b repo + 02c audit で成立するか | PASS（既存 repo 活用 + rejected status 追加 migration のみ追加） |
| 整合性 | 不変条件 #5, #13 を破らないか | PASS（workflow 経由のみ） |
| 運用性 | reject reason / idempotent が運用に耐えるか | PASS（reason 必須、idempotent 透過） |
