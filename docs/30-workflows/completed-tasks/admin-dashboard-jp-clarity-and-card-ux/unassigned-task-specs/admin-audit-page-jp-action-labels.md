# 解消済みフォローアップ: /admin/audit のアクション/対象 日本語化（dashboardGlossary 共有適用）

- 親タスク: `admin-dashboard-jp-clarity-and-card-ux`
- 区分: same-cycle follow-up / type: improvement / scale: small / area: web/admin-ui
- 状態: resolved_same_cycle（automation-30 レビューで未タスク化の根拠不足を検出し、本サイクル内で実装済み）

## 背景

親タスクで新設する `apps/web/src/lib/admin/dashboardGlossary.ts` の `describeAuditAction` / `describeTargetType` / `describeTarget` は、ダッシュボードの「直近のアクション」を日本語化する共有 SSOT である。

当初 `/admin/audit` の `AuditLogPanel.tsx` も同じ生コードを raw 表示していた:

- `apps/web/src/components/admin/AuditLogPanel.tsx:148` — `<strong>{item.action}</strong>`（生コード）
- `apps/web/src/components/admin/AuditLogPanel.tsx:153` — `<span>{item.targetType ?? "-"}</span>`（生 targetType）

非エンジニア運営者向けには audit 画面も日本語化が望ましい。初期仕様では別サーフェスとして未タスク分離していたが、`dashboardGlossary.ts` をそのまま再利用でき、外部依存・合意未済・大規模独立スコープのいずれにも該当しないため、automation-30 レビューで同サイクル実装へ昇格した。

## 同サイクル実装へ昇格した理由

- 変更は `AuditLogPanel.tsx` の表示変換と既存 component spec の追加 assertion に限定される。
- 検索フォーム・query string・API/D1 契約は raw action / targetType を維持するため、既存運用への影響が小さい。
- ユーザー指定の CONST_008 に照らすと、未タスク化の許容条件（外部依存待ち、合意未済、大規模独立スコープ）を満たさない。

## 実装内容

| 対象 | 変更 |
| --- | --- |
| `apps/web/src/components/admin/AuditLogPanel.tsx:148` | `{item.action}` → `{describeAuditAction(item.action)}`。既知コードは `title` に raw code を保持 |
| `apps/web/src/components/admin/AuditLogPanel.tsx:153` | `{item.targetType ?? "-"}` → `{item.targetType ? describeTargetType(item.targetType) : "-"}` |
| import | `apps/web/src/lib/admin/dashboardGlossary` から `describeAuditAction` / `describeTargetType` |
| test | `AuditLogPanel.component.spec.tsx` に既知コードの日本語表示・raw 保持・未知コード fallback を追加 |

## 受入条件

- [x] audit 一覧のアクション列が日本語化され、未登録コードは raw 表示で情報が欠落しない。
- [x] targetType が日本語化される。
- [x] 既存テスト契約（フィルタ datalist / pagination href / raw query values）を壊さない。
- [x] `apps/api` 非変更。focused vitest 対象に `AuditLogPanel.component.spec.tsx` を追加。

## 前提の解消

親タスク内で `dashboardGlossary.ts` が作成済みのため、同ブランチ内で依存を満たした。
