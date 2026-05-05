# Phase 6: Web UI 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 6 / 13 |
| Phase 名称 | Web UI 実装 |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (API / repository 実装) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |

## 目的

`apps/web/app/(admin)/admin/audit/page.tsx` に read-only 監査ログ閲覧画面を追加する。

## 実行タスク

1. AdminSidebar に `/admin/audit` 導線を追加する
2. Server Component または client component から既存 admin proxy 経由で `GET /admin/audit` を呼ぶ
3. action / actorEmail / targetType / targetId / date range filter を作る
4. JSON viewer を初期折り畳み、展開時 masked 表示にする
5. empty / error / loading / mobile layout を実装する
6. edit / delete / rerun 系の操作 UI を置かない

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Admin layout | apps/web/app/(admin)/layout.tsx | admin gate |
| Sidebar | apps/web/src/components/layout/AdminSidebar.tsx | ナビ追加 |
| Fetch | apps/web/src/lib/admin/server-fetch.ts | server fetch |
| Proxy | apps/web/app/api/admin/[...path]/route.ts | API 経由 |

## 実行手順

### ステップ 1: route placement

既存 admin 画面に合わせ、`apps/web/app/(admin)/admin/audit/page.tsx` を作成する。`/admin/audit` URL が成立することを確認する。

### ステップ 2: UI controls

filter は compact な業務 UI とし、action を主 filter、actor / target / date を secondary filter にする。date 入力は JST と明示し、表示も JST に揃える。

### ステップ 3: JSON viewer

collapsed 状態では field summary だけを表示し、PII 値を出さない。expanded 状態でも masked value のみを表示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-11〜TC-16 |
| Phase 7 | AC-5〜AC-10 |
| Phase 11 | screenshot target |

## 多角的チェック観点（AIが判断）

- `/admin/audit` は運用者が繰り返し使う画面なので、密度高めで scan しやすくする
- card 過多にせず table / filter / detail disclosure を中心にする
- PII は DOM に raw 値を置かない

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | route/page 追加 | pending | apps/web |
| 2 | filter UI | pending | query state |
| 3 | JSON viewer / mask | pending | nested PII |
| 4 | Sidebar 導線 | pending | read-only |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Web 実装記録 |
| コード | apps/web/app/(admin)/admin/audit/page.tsx | 画面 |
| コード | apps/web/src/components/layout/AdminSidebar.tsx | 導線 |

## 完了条件

- [ ] `/admin/audit` が admin gate 配下で表示される
- [ ] filter / pagination / JSON viewer が機能する
- [ ] raw PII が DOM に出ない
- [ ] read-only UI が守られている

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置
- [ ] artifacts.json の Phase 6 を completed に更新

## 次Phase

次: 7 (AC マトリクス)。

