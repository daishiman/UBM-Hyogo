---
spec_classification: implementation_spec
state: spec_created
phase: 3
phase_name: 設計レビュー
created_at: 2026-05-23
task_type: UI task
visual_category: VISUAL
implementation_mode: new (+ verify_existing)
workflow: docs/30-workflows/admin-ui-prototype-alignment/
depends_on: phase-2-design.md
gate: Gate-A (spec_review)
---

# Phase 3: 設計レビュー (Gate-A)

Phase 2 で確定した設計が Phase 4 (テスト計画) 以降に進める品質基準を満たすか判定する。

---

## 1. レビュー観点

### 1.1 システム視点

| 観点 | 評価指標 | 結果 |
|------|----------|------|
| 単一責務性 (SRP) | 7 共通 component の責務が 1 文で説明可能か | PASS (Phase 2 §2 各 component) |
| 結合度 | server / client 境界が明示されているか | PASS (Phase 2 §1.1) |
| データフロー一方向性 | server → mapper → props → presentation | PASS (Phase 2 §5) |
| 拡張性 | 新 admin route 追加時に共通 component で吸収可能か | PASS (`AdminSectionCard` + `AdminTable` で大半カバー) |

### 1.2 戦略視点

| 観点 | 評価指標 | 結果 |
|------|----------|------|
| ユーザ価値 | staging で全画面エラー → 部分劣化により最低限の閲覧可 | PASS |
| プロトタイプ忠実度 | `pages-admin.jsx` の primitive を 1:1 で再利用 | PASS (新 primitive 増設なし) |
| 1 サイクル完了性 | 5 日以内 | PASS (Phase 2 §9: 3 日) |
| dependency 増加 | 新規 npm package 追加なし | PASS (Phase 2 §6) |

### 1.3 問題解決視点

| 観点 | 評価指標 | 結果 |
|------|----------|------|
| GAP-1 (画面全体エラー) 解消 | `safeServerFetch` + `AdminSectionError` で degrade | PASS |
| GAP-2 (section heading 統一) 解消 | `AdminSectionCard` で集約 | PASS |
| GAP-3 (KPI spacing) 解消 | 既存 `KpiGrid` を `AdminSectionCard` で wrap | PASS |
| GAP-4 (Queue layout) 解消 | `AdminQueuePanel` 新設 | PASS |
| GAP-5 (Table sticky/sort) 解消 | `AdminTable` 新設 | PASS |
| GAP-6 (Empty state) 解消 | `AdminEmptyState` 新設 | PASS |
| GAP-7 (OKLch tone drift) 解消 | `verify-design-tokens` CI gate で検出 | PASS (既存 gate を活用) |

---

## 2. 不変条件チェック

### 2.1 CLAUDE.md 不変条件 (10 項)

| # | 内容 | 本タスクへの影響 | 遵守状況 |
|---|------|------------------|----------|
| 1 | フォーム schema を固定しすぎない | 影響なし (UI alignment のみ) | PASS |
| 2 | consent キー統一 (`publicConsent` / `rulesConsent`) | 影響なし | PASS |
| 3 | `responseEmail` は system field | 影響なし | PASS |
| 4 | Form schema 外は admin-managed として分離 | 影響なし | PASS |
| 5 | D1 直接アクセスは `apps/api` 限定 | `apps/web` → `apps/api` HTTP 経由のみ | PASS (Phase 2 §5) |
| 6 | GAS prototype を本番昇格しない | meetings 派生 design は GAS 参考のみ | PASS |
| 7 | MVP は Google Form 再回答が本人更新経路 | 影響なし | PASS |
| 8 | 新規 test は `*.spec.{ts,tsx}` のみ | Phase 1 §11 全て `.spec.tsx` | PASS |
| 9 | admin form input は `FormField` 経由 | `AdminEmptyState` の CTA / `AdminQueuePanel` 内の form は既存 `FormField` を流用 | PASS |
| 10 | admin mutation は `@/features/admin/hooks/useAdminMutation` | 新規 hook は作らず既存を使用 | PASS |

### 2.2 本ワークフロー固有不変条件 (8 項)

| # | 内容 | 遵守状況 |
|---|------|----------|
| W1 | 既存 API endpoint surface のみ接続 | PASS (Phase 2 §7 contract 表で既存のみ) |
| W2 | OKLch token 正本化 (HEX 禁止) | PASS (`verify-design-tokens` で検証) |
| W3 | プロトタイプ正本順位 (`claude-design-prototype/`) | PASS |
| W4 | D1 直接アクセス禁止 | PASS |
| W5 | `FormField` 経由必須 | PASS |
| W6 | `useAdminMutation` 経由必須 | PASS |
| W7 | テスト命名 `*.spec.{ts,tsx}` | PASS |
| W8 | per-section degrade (画面全体停止禁止) | PASS (Phase 2 §3) |

→ 全 18 項目 PASS。

---

## 3. 4 条件評価

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | HIGH | staging が壊れている現状 → 部分でも閲覧可能になることで運用復旧。プロトタイプ整合で UX 改善。 |
| 実現性 | HIGH | 全 component が既存 primitive 流用、新規 dep ゼロ。Phase 2 §9 で 3 日見積。 |
| 整合性 | HIGH | 不変条件 18 項 PASS。既存 API contract 不変。 |
| 運用性 | MEDIUM | per-section error が増えると section 単位の監視が必要 → correlation ID 表示で sentry / Cloudflare logs と紐付け可能、運用上は許容範囲。 |

→ 総合 PASS。

---

## 4. 因果ループ図 (テキスト)

### 4.1 主ループ: 部分劣化導入による正の循環

```
[safeServerFetch 導入]
    ↓ +
[section 単位の degrade]
    ↓ +
[1 endpoint 失敗で全画面停止しない]
    ↓ +
[ユーザが管理画面を最低限利用可能]
    ↓ +
[障害時の運用継続性向上]
    ↓ +
[障害検知 → 修復までの時間に余裕]
    ↓ +
[障害復旧の品質向上]
    → ループ強化
```

### 4.2 副ループ: 共通 component 抽出による正の循環

```
[_shared/ component 抽出]
    ↓ +
[各 page.tsx の boilerplate 削減]
    ↓ +
[新 admin route 追加コスト低下]
    ↓ +
[プロトタイプ準拠の維持コスト低下]
    ↓ +
[UI drift の発生確率低下]
    ↓ +
[verify-design-tokens の fail 頻度低下]
    → ループ強化
```

### 4.3 リスク・ループ (緩和済)

```
[per-section error の増加]
    ↓ +
[section 単位の監視必要性]
    ↓ -  (correlation ID で sentry / Cloudflare logs 紐付け)
[運用負荷]
```

correlation ID 表示でリスク・ループは緩和済。

---

## 5. レビュー判定

**判定: PASS**

| 区分 | 結果 |
|------|------|
| システム視点 | PASS |
| 戦略視点 | PASS |
| 問題解決視点 | PASS |
| 不変条件 (CLAUDE.md 10 + 固有 8) | PASS (18/18) |
| 4 条件評価 | PASS (HIGH×3, MEDIUM×1) |
| 因果ループ整合 | PASS (正ループ 2, 緩和済リスク 1) |

→ Phase 4 (テスト計画) へ進行可。

---

## 6. 残課題と Phase 4 への持ち越し事項

| # | 内容 | 持ち越し先 |
|---|------|-----------|
| C1 | targeted vitest コマンドの具体形 (`pnpm --filter @ubm-hyogo/web test -- <files>` の files 列挙) | Phase 4 |
| C2 | Playwright `admin-degrade.spec.ts` の fixture 設計 (intentional API fail を mock-api 側でどう発火させるか) | Phase 4 |
| C3 | Phase 11 screenshot 対象画面 (4 viewport × 5 key screen = 20 枚) の具体 viewport 値 | Phase 4 / Phase 11 |
| C4 | `KpiCard` と `AdminStat` の関係整理 (dashboard 専用 specialization 化) | Phase 8 (リファクタ) |
| C5 | `AdminSectionError` の retry CTA 追加 | 採用しない。v1 は page reload 導線のみ |
| C6 | `apps/web/src/lib/{result.ts,fetch-admin-safe.ts}` の置き場所と既存 `lib/api-errors.ts` との関係 | Phase 5 (実装手順) |

---

## 7. MINOR 指摘の扱い

| # | 指摘 | 対応 |
|---|------|------|
| M1 | `AdminTable` の sort 状態を URL query に永続化したい | 要件外として採用しない。AC 達成に必須と判明した場合は今回サイクル内で修正 |
| M2 | `AdminEmptyState` icon を `lucide-react` で統一したい | dependency 追加方針に反するため採用しない |
| M3 | `AdminQueuePanel` の 3-col layout (list / detail / activity) 拡張 | 本 task は 2-col のみ。AC 達成に必須なら今回サイクル内で修正 |
| M4 | `error.tsx` の i18n (英語表記併記) | i18n 仕様変更は本 workflow の独立目的ではない |

→ 未タスク化はデフォルトにしない。例外的に必要な場合は理由・実施時期・管理場所を Phase 12 に明記し、ユーザーへエスカレーションする。

---

## 8. Gate-A 決定

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 3
- workflow_state: `implemented_local_runtime_pending`

## 目的

Phase 1〜2 の設計を 4 条件と不変条件でレビューし、Phase 4 へ進む可否を判定する。

## 実行タスク

- 設計・不変条件・依存関係を確認する
- MINOR は今回サイクル内修正または採用しない理由へ分類する
- 未タスク化が必要な場合はユーザーエスカレーション対象にする

## 参照資料

- `phase-1-requirements.md`
- `phase-2-design.md`
- `.claude/skills/task-specification-creator/references/requirements-review.md`

## 成果物/実行手順

- Gate-A 判定を `artifacts.json.metadata.gates[0]` の evidence に対応させる

## 統合テスト連携

- レビューで検出した test gap を Phase 4 の targeted vitest / Playwright smoke に反映する

## 完了条件

- [ ] Gate-A の PASS / FAIL / 条件付き PASS が根拠付きで記録されている

- **Gate-A**: PASS
- **次 Phase**: Phase 4 (テスト計画)
- **artifacts.json 更新**: `gates[0].status = "passed"` (Phase 4 進行開始時に更新)
- **evidence**: 本ファイル (`phase-3-design-review.md`)
