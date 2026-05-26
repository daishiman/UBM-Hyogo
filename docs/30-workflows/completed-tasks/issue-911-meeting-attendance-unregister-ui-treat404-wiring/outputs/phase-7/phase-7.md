**[実装区分: 実装仕様書]**

# Phase 7: observability / 監査ログ

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `implemented_local_evidence_captured` |
| 入力 | Phase 1-6 |
| 責任境界 | API = audit event 発火 / UI = logger.info / error のみ |

## 1. API 側 audit event（既存・無改変）

`apps/api/src/routes/admin/meetings.ts:200-249` の attendance endpoint は POST `attended:false` ブランチで `removeAttendance` を呼び、その内部で **`attendance.remove` audit event を既に発火している**（line 241-248）。

| 項目 | 値 |
|---|---|
| event name | `attendance.remove` |
| actor | API session の admin user |
| target | `meeting_id` + `member_id` |
| timestamp | API 側 D1 insert 時刻 |
| 発火条件 | `removeAttendance` が `affected > 0` の場合（既存実装に従う） |
| 404 路（既に解除済） | 既存実装どおり audit event は発火しない（state 変化なしのため正） |

**結論: UI 側で追加の audit 実装は不要**。本 task は audit observability に対して **no-op**。

## 2. UI 側 logger 呼出（最小限）

| 場面 | logger | 目的 |
|---|---|---|
| 404 success path | `logger.info({ event: "attendance.unregister.already_removed", meetingId, memberId })` | client-side トレーシング補助。API 側 audit に紐づかない race の追跡 |
| 409 / 422 / 5xx | `logger.error({ event: "attendance.unregister.failed", meetingId, memberId, status, error })` | admin error pattern 整合 |
| network error | `logger.warn({ event: "attendance.unregister.network", meetingId, memberId, error })` | offline retry の運用観察 |

すべて **既存 `apps/web` logger surface 経由**で、新規 logger 構築や transport 設定は行わない。

## 3. observability 追加実装の禁止事項

| 項目 | 理由 |
|---|---|
| 新規 audit event 名の追加 | API 側責任。UI からは発火しない |
| Sentry breadcrumb の event 別カスタム | 既存 default breadcrumb で十分 |
| 専用 metric の追加 | 本 task の規模では過剰 |
| 専用 dashboard / alert IaC | 既存 admin error boundary alert (`issue-863`) で網羅 |

## 4. 既存 audit との突き合わせ運用

| 観察 | 手段 |
|---|---|
| 404 success path が race か bug か区別したい | API 側 audit に `attendance.remove` 行があれば race / 無ければ既に削除済 (= 真の no-op) |
| 連打 race の頻度 | UI logger.info の出現数で観察 |

## 5. PII / 安全性

| 項目 | 取り扱い |
|---|---|
| `memberId` | UUID。直接 PII ではないが logger.info に留め、error stack には出さない |
| `meetingId` | 同上 |
| `actor email` | UI logger には載せない（API audit に閉じる） |

## 6. Phase 7 完了条件

- [x] API 側既存 audit (`attendance.remove`) が無改変で要件を満たすことを明示
- [x] UI 側追加実装は不要であることを明示
- [x] UI 側 logger 呼出を最小 3 種類に確定
- [x] 禁止事項を列挙
- [x] PII 取り扱いを確定

## 7. 次 Phase への引き継ぎ

Phase 8 では本 Phase で確定した「UI 側は無追加 audit」「logger 3 種類のみ」を前提に、想定リスクと緩和策を洗い出す。
