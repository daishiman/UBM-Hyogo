# Phase 11: 手動テスト / 視覚証跡（VISUAL_ON_EXECUTION）

> **[実装区分: 実装仕様書]**

> **VISUAL_ON_EXECUTION**: 本タスクは VISUAL（閲覧 UI に datalist 提示要素を追加）。
> 一次証跡は component test / page test の PASS とする。
> staging 認証下の実画面 screenshot は **user-gated**（admin session 必須）であり、
> ユーザー承認後に取得する。

---

## 11.1 評価の3層構造

| 層 | 観点 | 確認内容 |
|----|------|---------|
| Semantic | 構造・機能 | action `<Input>` に `list="audit-action-presets"` 属性、`<datalist id="audit-action-presets">` と 2 option（`identity.merge` / `identity.dismiss`）の DOM 存在。`name="action"` / URL query 契約の不変 |
| Visual | 見た目・token | datalist 候補ドロップダウン提示時のレイアウト崩れ無し。filter form の既存 OKLch トークン外観に変化が無い（HEX 直書きなし） |
| AI UX | ユーザー体験 | action 入力欄を focus / クリックすると identity action 候補が提示され、手打ちせず選べる。任意 action の自由入力も阻害されない明快さ |

---

## 11.2 撮影対象 screenshot（canonical 名一覧）

命名規約: `<component>-<state>.png` 形式（Phase 1 §6 命名規則に準拠）。staging runtime capture 時も同じ canonical 名を使う。

```
outputs/phase-11/screenshots/
  audit-action-filter-datalist-open.png   # action 入力に focus し datalist 候補（identity.merge / identity.dismiss）が提示された状態
  audit-action-filter-restored.png         # ?action=identity.dismiss で開き、Input defaultValue が SSR 復元された状態
  audit-action-filter-freeform.png         # 任意 action（例 member.delete）を自由入力した退化なし状態（AC-3 証跡・任意）
```

> 必須 2 枚は `audit-action-filter-datalist-open.png` と `audit-action-filter-restored.png`。
> `audit-action-filter-freeform.png` は AC-3 の補強証跡として任意撮影。

---

## 11.3 撮影手順（staging / user-gated）

> **admin 認証が必要なため staging deploy 後にユーザー承認を得て実施する。**

1. **`audit-action-filter-datalist-open.png`**:
   - staging の `/admin/audit` を admin session で開く
   - action 入力欄（`name="action"` / placeholder `attendance.add`）を focus またはクリック
   - ブラウザネイティブの datalist 候補リストに `identity.merge` / `identity.dismiss` が表示された状態を撮影
2. **`audit-action-filter-restored.png`**:
   - `https://{staging-url}/admin/audit?action=identity.dismiss` を直接開く
   - action 入力欄の値が `identity.dismiss` に SSR 復元されている状態を撮影（URL query 契約維持の証跡）
3. **`audit-action-filter-freeform.png`（任意）**:
   - action 入力欄に `member.delete` 等の任意文字列を手入力できる（datalist 候補に無い値も入力可能）状態を撮影

> ブラウザによって datalist ドロップダウンの見た目（OS ネイティブ UI）が異なるため、Visual 層の pixel 厳密比較は行わない。Semantic（DOM 存在）を主証跡とする。

---

## 11.4 component / page test を一次証跡とする方針

staging screenshot が user-gated で取得保留になる場合でも、以下の test PASS を AC の一次証跡とする。

| AC | 一次証跡（test） | ファイル |
|----|----------------|---------|
| AC-1 | `<datalist id="audit-action-presets">` と 2 option の存在 assert | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` |
| AC-2 | `?action=identity.dismiss` → Input `defaultValue` 復元 assert | `apps/web/app/(admin)/admin/audit/page.page.spec.ts` |
| AC-3 | 自由入力 `<Input name="action">` 維持・任意文字列入力可 assert | `AuditLogPanel.component.spec.tsx` |
| AC-4 | `buildAuditHref` 無変更（既存 spec 非退化） | 既存 `AuditLogPanel` 関連 spec |
| AC-5 | 上記 2 spec の全 PASS | targeted vitest run |

実行コマンド（リポジトリルートから）:

```bash
mise exec -- pnpm vitest run \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/app/(admin)/admin/audit/page.page.spec.ts
```

---

## 11.5 手動テスト チェックリスト

### 環境

| 項目 | 値 |
|------|-----|
| local dev | `mise exec -- pnpm --filter @ubm-hyogo/web dev`（datalist DOM はローカルでも確認可。SSR 復元は `?action=...` で確認） |
| staging | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/audit` |
| admin アカウント | staging 認証済み admin session（user-gated） |

### チェック項目

- [ ] action 入力欄を focus すると `identity.merge` / `identity.dismiss` の候補が提示される（AC-1）
- [ ] 候補から `identity.dismiss` を選ぶと入力値が `identity.dismiss` になり、検索後 URL が `?action=identity.dismiss` になる（AC-2）
- [ ] `?action=identity.dismiss` を直接開くと入力欄に値が SSR 復元される（AC-2）
- [ ] `member.delete` 等 datalist に無い任意 action も自由に手入力できる（AC-3）
- [ ] 検索結果で次ページに進んでも action filter が next URL に保持される（AC-4）
- [ ] filter form の外観に OKLch トークン外の色が混入していない（DevTools computed style 確認）

---

## 11.6 evidence ファイル構成

実装サイクル完了後に以下を `outputs/phase-11/` に配置する。screenshot が user-gated 未取得の場合は test PASS ログを一次証跡として記録する。

```
outputs/phase-11/
  phase-11.md                   # 本ファイル（チェックリスト記録）
  main.md                       # evidence index（screenshot 一覧 / test 結果）
  manual-test-result.md         # チェックリスト結果記録
  manual-test-report.md         # テスト概要レポート
  discovered-issues.md          # 発見した不具合・懸念点（0 件でも出力）
  ui-sanity-visual-review.md    # 3 層評価メモ
  screenshot-plan.json          # 撮影計画（canonical 名）
  phase11-capture-metadata.json # 撮影実績（timestamp / environment）。未撮影時は user-gated pending を記録
  screenshot-coverage.md        # 撮影対象 vs 撮影済み一覧
  screenshots/
    audit-action-filter-datalist-open.png   # user-gated 取得後に配置
    audit-action-filter-restored.png         # user-gated 取得後に配置
```

---

## 完了条件（Phase 11）

- [ ] 3層評価（Semantic / Visual / AI UX）のチェックリストが全項目 pass、または test PASS を一次証跡として記録済み
- [ ] AC-1..5 の test 一次証跡（component / page spec）が PASS している
- [ ] screenshot は canonical 名（`audit-action-filter-datalist-open.png` / `audit-action-filter-restored.png`）で計画されている
- [ ] staging 実画面撮影は admin 認証 user-gated であり、ユーザー承認後のみ実施している（未承認時は pending として記録）
- [ ] datalist 候補が任意入力を阻害しないこと（AC-3）が確認されている

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
datalist 提示 UI の semantic、visual、AI UX 証跡を取得する。

## 実行タスク
- canonical screenshot を取得する（user-gated）。
- component / page test の PASS を一次証跡として記録する。

## 参照資料
- `outputs/phase-11/screenshot-plan.json`
- `phase-10.md`

## 成果物
- Phase 11 runtime evidence plan and result files

## 統合テスト連携
component / page spec の PASS が Phase 12 compliance の根拠になる。
