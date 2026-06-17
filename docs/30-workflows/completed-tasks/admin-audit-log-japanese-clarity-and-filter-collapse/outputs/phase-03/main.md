# Phase 3 設計レビュー — main

> 上流: `../phase-02/*`。本ファイルは PASS/MINOR/MAJOR 判定・4 条件評価・採用理由・申し送りの実体。

## 1. PASS / MINOR / MAJOR 判定（サマリ）

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| C1 用語集 SSOT 拡張（日本語のみ + raw fallback） | PASS | 既存 `auditGlossary.ts` に map + helper を追加。生コード非表示・未登録のみ fallback でユーザー方針に整合（AC-3/AC-6） |
| C2 フィルタ段階開示（常時 5 + details 3） | PASS | 既存 `FormField` + native `<details>` で実現。新規 primitive ゼロ（AC-2/AC-10） |
| details open（DOM 属性 defaultOpen 算出） | PASS | 内部 state を新設せず uncontrolled。適用中の高度条件を隠さない（AC-2・[VSCPKR-03]） |
| C3 カードブロック整列 | PASS | `globals.css` の flex-wrap / grid 調整のみ。全 `var(--ubm-*)` トークン経由（AC-7/AC-8） |
| API/D1/shared 型不変 | PASS | describe helper は表示専用。`<input name>`（query param キー）不変（AC-9） |
| a11y 維持 | PASS | `FormField` label 関連付け・`<details>`/`<summary>` キーボード・適用フィルタ `aria-label` 維持（AC-11） |
| datalist placeholder 日本語化（R-4） | MINOR | placeholder の日本語例示は実装時に「生コード露出ゼロ」を grep 確認。datalist `id` は英語維持（API 契約）に注意 |
| AuditPurposeGuide 軽微調整の範囲（C3） | MINOR | 用語集グリッド整列に伴う調整は「必要時のみ」。不要なら触らず diff を最小化する判断を Phase 5 で固定 |
| 未登録 action コードの SSOT 網羅 | MINOR | DB 実データ調査が必要。出現時に Phase 12 未タスク化候補として記録（OOS） |
| 重大 blocker | なし | MAJOR 該当なし |

総合判定: **PASS（MINOR 3 件は許容、Phase 4 へ進む）**

## 2. 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか定義されているか | PASS | 非エンジニア管理者の「英語キー名・生コードが分からない」認知コストを日本語ラベル化で低減。8 項目フラットの初見負荷を段階開示で削減 |
| 実現性 | 初回スコープで実装可能な厚みか | PASS | 既存 primitive + token + 既存 endpoint で 1 サイクル完了。新規は map/helper 追加 + details ラッパ + CSS 調整のみ |
| 整合性 | 責務境界 / 依存 / 状態所有権が矛盾なく閉じるか | PASS | 表現層（apps/web component + glossary + globals.css）に閉じる。フィルタ値（既存）/ details open（DOM 算出）/ データ（既存 fetch）の所有権が分離。AC-9 で API/D1/shared 不変 |
| 運用性 | verify / 回帰保護が破綻しないか | PASS | `verify-design-tokens`（HEX 0）+ vitest 4 spec + Phase 11 visual で回帰保護。describe helper の raw fallback で未登録コードも情報欠落しない |

## 3. 採用理由（なぜ「日本語のみ + 2 層段階開示 + DOM 属性 defaultOpen」か）

1. **日本語のみ表示（raw fallback 付き）**（軸 1-A）: ユーザー確定方針「生コード非表示」に整合。未登録のみ raw fallback で情報欠落を防止。操作コード併記案は非エンジニアにノイズになるため却下。
2. **2 層段階開示**（軸 2-A）: よく使う 5 項目を常時表示し、対象/一括処理ID の高度条件を `<details>` に格納。8 項目フラットの初見負荷を削減（AC-2）。フラット維持案は主問題（初見負荷）を解消できない。
3. **DOM 属性 defaultOpen 算出**（軸 3-A）: 内部 `useState` を増やさず uncontrolled に保つ。詳細フィルタに値があれば open で適用中条件を隠さない（AC-2）。内部 state 管理案は不要な状態増加で却下。

3 軸とも採用案がデータ層・型に触れず（AC-9）、新規 primitive を生やさず（AC-10）、1 サイクルで実現可能（実現性◎）。MAJOR blocker なし。

## 4. Phase 4 開始条件 / Phase 13 blocked 条件

| 区分 | 条件 |
| --- | --- |
| Phase 4 開始条件 | (1) 本 Phase の総合判定が PASS（MAJOR 0 件）。(2) C1 helper/map signature と details `defaultOpen` 算出が component-map で確定。(3) AC-1〜AC-12 が test 検証手段にマップ済み |
| Phase 13 blocked 条件 | commit / PR はユーザーの明示承認後のみ実行。承認なしでは Phase 13 を blocked のまま維持する |

## 5. MINOR 追跡テーブル（Phase 5 / Phase 12 申し送り）

| # | MINOR | 申し送り先 | 対応 |
| --- | --- | --- | --- |
| M-1 | datalist placeholder 日本語化 + 生コード露出ゼロ grep | Phase 5（実装） | placeholder を日本語例示にし、`grep` で生コード（`attendance.add` 等）が placeholder/表示に残らないことを確認。datalist `id` は英語維持 |
| M-2 | AuditPurposeGuide 軽微調整の範囲 | Phase 5（実装） | 用語集グリッド整列が `globals.css` だけで足りるなら `AuditPurposeGuide.tsx` は触らず diff 最小化。触る場合は構造（DOM contract）を変えない |
| M-3 | 未登録 action コードの SSOT 網羅 | Phase 12（close-out） | DB 実データで未登録コードが出た場合、SSOT 追記の未タスク化候補として記録（本サイクルは raw fallback で対処） |

## 6. handoff（Phase 4 へ）

1. 採用案: 日本語のみ表示（raw fallback）+ 2 層段階開示 + DOM 属性 defaultOpen。
2. MINOR 3 件（placeholder grep / Guide 範囲 / 未登録 SSOT）を申し送り。
3. details open は DOM 属性（テスト操作対象は `element.open` / `[open]` セレクタ）。
4. describe helper の raw fallback はテスト必須項目（AC-6）。
