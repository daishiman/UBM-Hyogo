# Phase 5: API / repository 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 5 / 13 |
| Phase 名称 | API / repository 実装 |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (Web UI 実装) |
| 状態 | spec_created |

## 目的

`audit_log` の複合検索 API を追加し、admin gate 配下で read-only に提供する。

## 実行タスク

1. `apps/api/src/repository/auditLog.ts` に `listFiltered` を追加する
2. `apps/api/src/routes/admin/audit.ts` に `GET /admin/audit` を追加する
3. `apps/api/src/index.ts` または admin router mount に audit route を登録する
4. query validation、JST→UTC 変換、limit cap、cursor を実装する
5. API response は masked view model だけを返し、raw JSON leak を避ける

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| DDL | apps/api/migrations/0003_auth_support.sql | `audit_log` schema |
| Repository | apps/api/src/repository/auditLog.ts | 追加先 |
| Existing route | apps/api/src/routes/admin/members.ts | `listByTarget` 既存利用 |
| Admin mount | apps/api/src/index.ts | route 登録 |

## 実行手順

### ステップ 1: repository

WHERE builder は bind parameter のみを使い、文字列連結で値を埋め込まない。order は `created_at DESC, audit_id DESC` に固定し、cursor も同じ順序で解釈する。

### ステップ 2: route

`requireAdmin` を必ず通し、sync 系 `SYNC_ADMIN_TOKEN` と混ぜない。invalid query は 400、非 admin は既存 middleware と同じ 401/403 に揃える。

### ステップ 3: response

`before_json` / `after_json` は JSON parse に失敗しても一覧全体を落とさない。壊れた JSON は `parseError: true` と raw 非表示で返す。正常 JSON は API projection で `maskedBefore` / `maskedAfter` に変換し、raw column 名を response schema に含めない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-01〜TC-06 を満たす |
| Phase 6 | Web が読む response contract |
| Phase 9 | api typecheck / vitest |

## 多角的チェック観点（AIが判断）

- API projection で mask 済み view を返す。UI 二重 mask は defense-in-depth とする
- 既存単項目 helper は互換維持し、member detail を壊さない
- index が不足して遅い場合は migration 追加の要否を Phase 12 未タスクにも記録する

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | repository listFiltered | pending | 複合 filter |
| 2 | GET /admin/audit | pending | requireAdmin |
| 3 | route tests | pending | Phase 4 TC |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | API 実装記録 |
| コード | apps/api/src/repository/auditLog.ts | repository |
| コード | apps/api/src/routes/admin/audit.ts | route |

## 完了条件

- [ ] `GET /admin/audit` が admin gate 配下で動く
- [ ] 複合 filter / date range / pagination が実装済み
- [ ] route / repository tests が PASS

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置
- [ ] artifacts.json の Phase 5 を completed に更新

## 次Phase

次: 6 (Web UI 実装)。
