# Phase 1: 要件定義

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。本 Phase で scope・受入条件・inventory・命名規則・タスク分類を固定する。

---

## 1. タスク分類（Feedback 1 / Feedback 3 対応）

| 項目 | 値 |
|------|-----|
| タスク種別 | **UI task（VISUAL）** — `apps/web` の閲覧 UI に提示要素を追加するため |
| visualEvidence | `VISUAL_ON_EXECUTION`（Phase 11 で datalist 提示の screenshot を撮影） |
| implementation_mode | `new`（P50 チェック: current branch 未実装・別タスク未解決・upstream 未マージ） |
| docs-only か | いいえ。目的「手入力せず選択できる」は DOM 変更を要するため実装仕様書（CONST_004） |

## 2. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---|---|---|
| current branch に実装が存在する | No（`AuditLogPanel.tsx:181-183` は自由入力のみ） | 通常実装 Phase（RED→GREEN） |
| upstream（dev）にマージ済み | No | 未マージとして扱う |
| 前提タスク（#987 producer）完了済み | Yes（`identity.dismiss` 記録は `identity-conflict.ts:250` で成立） | 依存解消タスク不要 |

## 3. 根本問題（1文）

`/admin/audit` の action フィルタは自由入力テキストのみで、運用者が `identity.merge` / `identity.dismiss` を一字一句正確に手入力しないと identity 操作の監査ログを絞り込めない。よく使う action の入力補助（提示）が欠如している。

## 4. 受け入れ基準（issue AC を最新コードへ写像）

| ID | 受け入れ基準 | 検証方法 |
|----|-------------|---------|
| AC-1 | `/admin/audit` の action フィルタ付近に `identity.merge` / `identity.dismiss` を選べる UI がある | component test: datalist option 存在を assert |
| AC-2 | プリセット選択後も URL query は既存 `action=<value>` 契約を維持し、ページ reload / SSR 初期表示で選択状態が復元される | page test: `?action=identity.dismiss` → Input `defaultValue` 復元 |
| AC-3 | 既存の任意 action 入力（例: `member.delete`, `schema.alias.rollback_notification`）が退化しない | component test: 自由入力 `<Input name="action">` 維持を assert |
| AC-4 | cursor pagination の next URL が action filter を保持する | 既存 `buildAuditHref` テストの非退化（無変更） |
| AC-5 | `AuditLogPanel` component tests と `/admin/audit` page tests が green | `vitest run` で対象 spec PASS |

## 5. 現状コード inventory（実測）

| ファイル | 行 | 現状 |
|---|---|---|
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 181-183 | `<FormField name="action" label="action"><Input name="action" defaultValue={values.action ?? ""} placeholder="attendance.add" /></FormField>` |
| 同上 | 91-107 | `buildAuditHref` が `action` query key を保持（**無変更対象**） |
| `apps/web/src/components/ui/Input.tsx` | 4-23 | `InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">`、`...props` を `<input>` に透過 → **`list` 属性は透過される** |
| `apps/web/app/(admin)/admin/audit/page.tsx` | 40-54 | searchParams → `AuditSearchValues`（`action` は `toSingle(sp["action"])`） |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 100-113 | filter form primitives テスト（`getByLabelText("action")` が単一要素を返す前提） |
| `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | 1-37 | page helper + AdminPageHeader テスト（`safeServerFetch` を mock） |

## 6. 命名規則（既存コードベース分析・FB-01 / FB-SDK-07-4 対応）

| 対象 | 規則 | 本タスクでの採用値 |
|---|---|---|
| datalist `id` | kebab-case（既存 component の id は `admin-audit-h` 等 kebab） | `audit-action-presets` |
| `<Input list>` 値 | datalist `id` と一致 | `list="audit-action-presets"` |
| option `value` | API action 文字列そのまま | `identity.merge` / `identity.dismiss` |
| test 定数 | 既存 spec の describe 文言は日本語混在 | 既存スタイル踏襲 |

> 既存 `Input` は新規 API を追加せず、native HTML 属性 `list` を使うため命名ドリフトは発生しない。

## 7. targeted test 実行ファイルリスト（FB-UI-02-2 対応）

全件 `pnpm test` は重いため、本タスクは以下 2 ファイルへ targeted run する。

```
apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
apps/web/app/(admin)/admin/audit/page.page.spec.ts
```

## 8. carry-over 確認（直近成果物の棚卸し）

`git log --oneline -5` 時点で直近は #1016 / #57 / #1007 / #1010 / #1008 の docs/skill 系。いずれも `AuditLogPanel` / `/admin/audit` に触れていない。本タスクの新規作業（datalist 追加）と重複なし。

## 完了条件（Phase 1）

- [x] タスク分類（UI task / VISUAL）を記録した
- [x] AC-1〜AC-5 を最新コードパスへ写像した
- [x] 現状コード inventory を実測値で固定した
- [x] 命名規則（datalist id = `audit-action-presets`）を確定した
- [x] targeted test ファイルリストを列挙した

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
issue #1039 の scope・受入条件（AC-1〜AC-5）・現状コード inventory・命名規則・タスク分類を固定し、後続 Phase が迷わず実装できる前提を確立する。

## 実行タスク
- タスク分類（UI task / VISUAL）と implementation_mode（new）を記録する。
- 現状コード inventory を実測し、AC を最新コードパスへ写像する。

## 参照資料
- Issue #1039
- `apps/web/src/components/admin/AuditLogPanel.tsx`
- `apps/web/app/(admin)/admin/audit/page.tsx`

## 成果物
- Phase 1 要件定義仕様（本ファイル）

## 統合テスト連携
本 Phase で固定した AC と inventory を Phase 4（テスト作成）の RED 設計が直接参照する。
