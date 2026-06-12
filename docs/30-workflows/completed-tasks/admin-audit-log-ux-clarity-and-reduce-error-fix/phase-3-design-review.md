# Phase 3 — 設計レビュー

> 正本: [shared-context.md](./shared-context.md)。本書は Phase 4 へ進めるかを判定する。

## 1. 設計レビュー観点

### システム系
- 因果/責務境界: server=fetch、client/presentational=表示の境界を維持。状態所有権は混在なし（Phase 2 §2）。**PASS**
- 依存関係: 既存 API surface のみ。`appliedFilters` は型・API に既存。新規依存なし。**PASS**

### 戦略・価値系
- 価値提案: 「読める化」「目的明示」「エラー停止」が管理者コストを直接低減。将来拡張（total/export）は未タスクへ分離（OOS-1/2）。**PASS**
- トレードオフ: カード化で縦長になるが、過密テーブルより読解性が高い（ユーザー選択）。**PASS**

### 問題解決系
- 主問題固定: 情報設計欠如（案件1）+ 防御ガード欠如（案件2）。現象でなく原因に対処。**PASS**
- 優先順位: AC-1/2/3（読める化）と AC-6（クラッシュ停止）が最優先。**PASS**

## 2. 4条件評価

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | 管理者の3コスト（読めない/目的不明/エラー）を表現層で低減 |
| 実現性 | PASS | apps/web のみ・新規コンポーネント3+純関数3+防御ガード+CSS。1サイクル可 |
| 整合性 | PASS | API/D1/Form 不変。responsibility 境界・状態所有権が閉じている |
| 運用性 | PASS | OKLch トークン正本・既存 primitive 再利用・回帰 spec で verify 破綻なし |

## 3. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| Lane A/B が `AuditLogPanel.tsx` を同時編集して競合 | Lane A が構造の最終統合責任を持つ。Lane B は新規3ファイル + 差し込み位置を仕様明記。Phase 5 に統合手順を記述 |
| 既存 `AuditLogPanel.component.spec` がカード化で破綻 | 既存 assertion の意図（mask/href/empty/404）を保持し、テーブル DOM 依存箇所のみカード DOM へ最小調整（AC-7） |
| reduce 真因が shape 不整合だった場合の見落とし | Phase 5 冒頭で `safeServerFetch`/`/admin/tags` レスポンス shape を実照合する手順を必須化。防御ガード(a)は無条件で入れる |
| `data-testid` 変更で他テスト破壊 | 既存 id 維持（不変条件8）。新規要素のみ新規 id |
| 旧 `.admin-audit-table*` CSS の未使用判定漏れ | Phase 8 で `grep` 全参照確認。参照ありなら残置（OOS-4） |

## 4. 判定

**Phase 4 へ進行可（GO）**。設計に矛盾・未解決の重大論点なし。実装区分=実装仕様書で確定。
