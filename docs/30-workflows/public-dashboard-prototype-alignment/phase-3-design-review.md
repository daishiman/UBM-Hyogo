---
spec_classification: implementation_spec
state: spec_created
phase: 3
phase_name: 設計レビュー
created_at: 2026-05-26
task_type: UI task
visual_category: VISUAL
implementation_mode: verify_existing
workflow: docs/30-workflows/public-dashboard-prototype-alignment/
depends_on: phase-2-design.md
gate: Gate-A (spec_review)
---

# Phase 3: 設計レビュー (Gate-A)

Phase 2 で確定した設計が Phase 4 (テスト計画) 以降に進める品質基準を満たすか判定する。

---

## 1. レビュー観点

### 1.1 システム視点

| 観点 | 評価指標 | 結果 |
| --- | --- | --- |
| 単一責務性 (SRP) | 7 component の責務が 1 文で説明可能か | PASS (Phase 2 §2) |
| 結合度 | server / client 境界が明示されているか | PASS (Phase 2 §1.1 — 全て server component) |
| データフロー一方向性 | API → page.tsx → props → presentation | PASS (Phase 2 §1.2) |
| 拡張性 | 新セクション追加時に `data-component` で吸収可能か | PASS |

### 1.2 戦略視点

| 観点 | 評価指標 | 結果 |
| --- | --- | --- |
| ユーザ価値 | プロトタイプ整合により公開トップの第一印象を改善 | PASS |
| プロトタイプ忠実度 | `pages-public.jsx` L4-152 を 1:1 で再現 | PASS |
| 1 サイクル完了性 | 1.5 日 (Phase 2 §9) | PASS |
| dependency 増加 | 新規 npm package 追加なし | PASS |

### 1.3 問題解決視点

| 観点 | 評価指標 | 結果 |
| --- | --- | --- |
| GAP-1 (Hero card 化) 解消 | `data-variant="card"` + radial accent | PASS |
| GAP-2 (Stats sub/badge) 解消 | `data-role="sub"` + `badge-sync` | PASS |
| GAP-3 (About 2-card) 解消 | `AboutUbm` 新規 | PASS |
| GAP-4 (Featured heading 維持) 解消 | wrapper inline + EmptyState | PASS |
| GAP-5 (Timeline tl-row) 解消 | `Timeline` 改修 + fallback | PASS |
| GAP-6 (CSS) 解消 | `legacy-public.css` 追加 | PASS |

---

## 2. 不変条件チェック

### 2.1 CLAUDE.md 不変条件 (10 項)

| # | 内容 | 本タスクへの影響 | 遵守状況 |
| --- | --- | --- | --- |
| 1 | Form schema 固定しすぎない | 影響なし | PASS |
| 2 | consent キー統一 | 影響なし | PASS |
| 3 | `responseEmail` は system field | 影響なし | PASS |
| 4 | Form schema 外は admin-managed | 影響なし | PASS |
| 5 | D1 直接アクセスは `apps/api` 限定 | `apps/web` → HTTP のみ | PASS |
| 6 | GAS prototype を本番昇格しない | 参照のみ | PASS |
| 7 | MVP は Google Form 再回答経路 | 影響なし | PASS |
| 8 | 新規 test は `*.spec.{ts,tsx}` のみ | `__tests__/*.spec.tsx` | PASS |
| 9 | admin form input は `FormField` 経由 | public のみ・影響なし | PASS |
| 10 | admin mutation は `useAdminMutation` | public のみ・影響なし | PASS |

### 2.2 本ワークフロー固有不変条件 (8 項)

| # | 内容 | 遵守状況 |
| --- | --- | --- |
| W1 | 既存 API endpoint surface のみ接続 | PASS (Phase 2 §7) |
| W2 | OKLch token 正本化 (HEX 禁止) | PASS (`verify-design-tokens`) |
| W3 | プロトタイプ正本順位 | PASS |
| W4 | D1 直接アクセス禁止 | PASS |
| W5 | env は `getEnv()` / `getPublicEnv()` 経由のみ | PASS (本タスクでは env 参照ゼロ) |
| W6 | テスト命名 `*.spec.{ts,tsx}` | PASS |
| W7 | data shape fallback (API 不変) | PASS (Phase 2 §3) |
| W8 | 新規 component は `public/` 直下 PascalCase | PASS (`AboutUbm.tsx`) |

→ 全 18 項目 PASS。

---

## 3. 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | HIGH | 公開トップは流入の第一印象。プロト整合で離脱率低下が期待。 |
| 実現性 | HIGH | 1 component 新規 / 5 component 改修 / 1 CSS 追加。新規 dep ゼロ。1.5 日見積。 |
| 整合性 | HIGH | 不変条件 18 項 PASS。既存 API contract 完全不変。 |
| 運用性 | HIGH | server component のみで複雑な state なし。Cloudflare Workers cache (revalidate=60s/30s) の効き方も既存と同じ。 |

→ 総合 PASS。

---

## 4. 因果ループ図 (テキスト)

### 4.1 主ループ: プロトタイプ整合による正の循環

```
[公開トップを prototype 整合化]
    ↓ +
[第一印象 / 情報設計の明確化]
    ↓ +
[/members や /register への遷移意欲向上]
    ↓ +
[公開メンバー数の増加 → Stats が増える]
    ↓ +
[公開トップの説得力向上]
    → ループ強化
```

### 4.2 副ループ: data shape fallback による正の循環

```
[Timeline note / attendees を optional 化]
    ↓ +
[API contract 不変を維持]
    ↓ +
[admin 側 schema 変更が public UI を壊さない]
    ↓ +
[将来の Schema 拡張時の影響半径が小さい]
    → ループ強化
```

### 4.3 リスク・ループ (緩和済)

```
[Meetings/yr=12 をハードコード]
    ↓ +
[年次定例数が変わったときの修正漏れ]
    ↓ -  (constants 経由 + Phase 12 で「年次定例数の正本」を documentation-changelog に記録)
[修正漏れリスク]
```

constants 化 + ドキュメント化でリスク・ループは緩和済。

---

## 5. レビュー判定

**判定: PASS**

| 区分 | 結果 |
| --- | --- |
| システム視点 | PASS |
| 戦略視点 | PASS |
| 問題解決視点 | PASS |
| 不変条件 (CLAUDE.md 10 + 固有 8) | PASS (18/18) |
| 4 条件評価 | PASS (HIGH×4) |
| 因果ループ整合 | PASS (正ループ 2, 緩和済リスク 1) |

→ Phase 4 (テスト計画) へ進行可。

---

## 6. 残課題と Phase 4 以降への持ち越し事項

| # | 内容 | 持ち越し先 |
| --- | --- | --- |
| C1 | targeted vitest コマンドの具体形 | Phase 4 |
| C2 | Playwright `public-home-visual.spec.ts` の viewport 値 | Phase 4 / Phase 11 |
| C3 | Phase 11 screenshot 対象 (4 viewport × 1 screen + empty/full 状態) の確定 | Phase 4 / Phase 11 |
| C4 | `ZoneIntro` を将来削除するかの判定 | Phase 8 (リファクタ) — 本サイクルでは保持 |
| C5 | `Meetings/yr=12` を `apps/web/src/lib/constants/landing.ts` に新設するか component literal にするか | Phase 5 (実装手順) |
| C6 | `--ubm-spacing-grid` / `--ubm-spacing-section` / `--ubm-font-serif` / `--ubm-color-text-muted` / `--ubm-color-border` の `tokens.css` 存在確認 | Phase 5 (未定義なら追加) |

---

## 7. MINOR 指摘の扱い

| # | 指摘 | 対応 |
| --- | --- | --- |
| M1 | Hero の serif フォントを web font として CDN 経由ロードしたい | dependency / network policy に影響。本サイクル対象外 |
| M2 | `Last sync = 数分前` 相対表現 | 非ゴール (Phase 1 §9)、別タスク |
| M3 | `Meetings/yr` を API から取得 | API 不変が前提 (Phase 1 §9)。次サイクルで検討 |
| M4 | `Featured Members` の件数 0 時 CTA を「メンバー登録」に変える | UX 検討対象。本サイクルでは EmptyState のみ |

→ 未タスク化はデフォルトにしない。M2/M3 は Phase 12 `unassigned-task-detection.md` に「却下理由」を明示する。

---

## 8. Gate-A 決定

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 3
- workflow_state: `spec_created`

## 目的

Phase 1〜2 の設計を 4 条件と不変条件でレビューし、Phase 4 へ進む可否を判定する。

## 実行タスク

- 設計・不変条件・依存関係を確認する
- MINOR は今回サイクル内修正または採用しない理由へ分類する
- 未タスク化が必要な場合は Phase 12 へ持ち越す

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
- **artifacts.json 更新**: `gates[0].status = "passed"` (Phase 12 完了時に更新)
- **evidence**: 本ファイル (`phase-3-design-review.md`)
