---
phase: 2
title: Architecture — server/client boundary 切り分け
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 2: アーキテクチャ

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 2 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

アーキテクチャの責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

## 実行タスク

1. 本 Phase の既存本文に定義された要件・手順・判定表を実装時の入力として確認する。
2. Phase 間の依存順序を守り、前 Phase の完了条件を満たしてから次へ進む。
3. 差分が発生した場合は Phase 11 evidence と Phase 12 strict 7 へ同一 wave で同期する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本ファイル: `phase-2-design.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. 全体構成

```
apps/web/app/(admin)/admin/<page>/page.tsx  ← server component（維持）
    └─ <AdminSectionErrorClient ... />      ← "use client" boundary（新規）
            └─ <AdminSectionError onRetry={...} isRetrying={...} ... />  ← server component compatible（props 拡張のみ）
```

| 層 | 種別 | 責務 |
|----|------|------|
| `page.tsx` | server | API fetch（既存）、AdminSectionErrorClient へ serializable props を渡す |
| `AdminSectionErrorClient.tsx` | client | `useRouter().refresh()` + `useTransition()` を組成、retry handler を内包 |
| `AdminSectionError.tsx` | server compatible | DOM 描画、props 拡張のみ（function props も受けるが server 側からは渡さない） |

## 2. server → client boundary の切り方（核心）

- server component の page.tsx で client wrapper component を JSX として配置可能（Next.js App Router の公式パターン）
- page 全体を `"use client"` にすると D1 経由の API fetch / `getSession()` が壊れる（CLAUDE.md 重要な不変条件 #5）
- function props（`onRetry`）は **client wrapper の内部で組み立てる**。server から渡さない
- serializable な props（`sectionLabel`, `code`, `correlationId`, `message`, `className`, `retryLabel`）のみ server → client へ渡す

## 3. retry 機構

| 要素 | 採用 | 理由 |
|------|------|------|
| RSC 再 fetch | `useRouter().refresh()` | App Router 標準・追加依存ゼロ |
| 非同期 transition | `useTransition()` | `isPending` を `isRetrying` として AdminSectionError に渡せる |
| section-scoped cache invalidation | **採用しない** | 別タスク化（CONST_007 適合維持） |
| SWR / React Query | **採用しない** | v1 スコープ外、依存追加を避ける |

## 4. SSR 巻き込み回避

- `AdminSectionErrorClient` は最小限の client 化（`"use client"` 1 行 + hooks のみ）
- 11 採用 page では `<AdminSectionErrorClient />` JSX を error 表示部分にだけ配置する
- `page.tsx` の冒頭に `"use client"` が追加されていないことを Phase 6 で grep 検証

## 5. 既存 Button primitive 再利用方針

- retry button の visual は既存 Button primitive（`apps/web/src/components/ui/Button` 等）の variant に揃える
- 新規 primitive ファイルを追加しない（CLAUDE.md 不変条件3）
- OKLch トークンは既存 Button が `tokens.css` 経由で適用済み

## 6. 一次的な focus 動作

- `router.refresh()` 後も同 button DOM が React reconciliation で維持されるため、focus は自動で保持される
- section 自体が消える場合（error → success 状態遷移）は focus が body へ落ちる可能性があるが、本タスクスコープ外（Phase 9 リスクで言及）

## 7. データフロー図（テキスト）

```
[user click retry button]
      ↓
[startTransition(() => router.refresh())]
      ↓ isPending=true → isRetrying=true → button disabled+aria-busy
      ↓
[Next.js RSC re-fetch（既存 API endpoint 経由）]
      ↓
[server で API 成功 → 正常 JSX] / [失敗 → AdminSectionError 再描画]
      ↓ isPending=false → button enabled
```

## 8. 既存ファイルへの影響範囲

| ファイル | 影響 |
|---------|------|
| `AdminSectionError.tsx` | props 拡張のみ（後方互換） |
| `_shared/index.ts` | export 追加（後方互換） |
| 11 採用 page.tsx | error JSX 部分の 1 箇所差し替え（server compatible 維持） |
| 既存 `AdminSectionError.spec.tsx` | 無修正で pass（既存 case は変えない、追加 case のみ append） |
