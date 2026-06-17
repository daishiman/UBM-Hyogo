# Phase 3: 設計レビュー

[実装区分: 実装仕様書]（VISUAL / コード変更を伴う）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 上流 | Phase 2（設計） |
| 下流 | Phase 4（テスト作成） |
| 状態 | completed |

## 目的

Phase 2 で確定した concern 分割（C1/C2/C3）・C1 helper signature・C2 段階開示・C3 整列 CSS に対し、**代替案を出してトレードオフを比較**し、PASS / MINOR / MAJOR 判定を下す（go/no-go）。4 条件（価値性 / 実現性 / 整合性 / 運用性）を評価し、Phase 4 開始条件と Phase 13 blocked 条件を確定する。MINOR 指摘は追跡テーブルに登録する。

## 実行タスク

1. **代替案の文書化**: 「操作コード併記案 vs 日本語のみ案」「フィルタ全項目フラット維持案 vs 段階開示案」「details open を内部 state 管理 vs DOM 属性 defaultOpen 算出」を `outputs/phase-03/alternatives.md` に書き、却下理由を明記する。
2. **採用理由の確定**: 「日本語のみ表示（raw fallback 付き）+ 2 層段階開示 + DOM 属性 defaultOpen」を採用する根拠を `outputs/phase-03/main.md` に記録する。
3. **4 条件評価**: 価値性 / 実現性 / 整合性 / 運用性を判定する。
4. **PASS / MINOR / MAJOR 判定**: 戻り先を明記する。
5. **Phase 4 開始条件 / Phase 13 blocked 条件の確定**。
6. **MINOR 追跡テーブル作成**: Phase 5 / Phase 12 への申し送りを記録する。

## PASS / MINOR / MAJOR 判定（サマリ）

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

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか定義されているか | PASS | 非エンジニア管理者の「英語キー名・生コードが分からない」認知コストを日本語ラベル化で低減。8 項目フラットの初見負荷を段階開示で削減 |
| 実現性 | 初回スコープで実装可能な厚みか | PASS | 既存 primitive + token + 既存 endpoint で 1 サイクル完了。新規は map/helper 追加 + details ラッパ + CSS 調整のみ |
| 整合性 | 責務境界 / 依存 / 状態所有権が矛盾なく閉じるか | PASS | 表現層（apps/web component + glossary + globals.css）に閉じる。フィルタ値（既存）/ details open（DOM 算出）/ データ（既存 fetch）の所有権が分離。AC-9 で API/D1/shared 不変 |
| 運用性 | verify / 回帰保護が破綻しないか | PASS | `verify-design-tokens`（HEX 0）+ vitest 4 spec（glossary helper / チップ / panel / card）+ Phase 11 visual で回帰保護。describe helper の raw fallback で未登録コードも情報欠落しない |

## Phase 4 開始条件 / Phase 13 blocked 条件

| 区分 | 条件 |
| --- | --- |
| Phase 4 開始条件 | (1) 本 Phase の総合判定が PASS（MAJOR 0 件）。(2) C1 helper/map signature と details `defaultOpen` 算出が component-map で確定。(3) AC-1〜AC-12 が test 検証手段にマップ済み |
| Phase 13 blocked 条件 | commit / PR はユーザーの明示承認後のみ実行。承認なしでは Phase 13 を blocked のまま維持する |

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | レビュー対象（concern 分割 / 状態所有権 / details open 判断） |
| 必須 | outputs/phase-02/layout-blueprint.md | レビュー対象（token 割当 / responsive） |
| 必須 | outputs/phase-02/component-map.md | レビュー対象（C1 signature / props / primitive 対応） |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-12 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計原則 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 段階開示・焦点判定の根拠 |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | 新規 primitive 非追加の裏取り |

## 実行手順

### ステップ 1: 代替案の文書化

- `outputs/phase-03/alternatives.md` に 3 軸の代替案を書く（軸1: 操作コード併記 vs 日本語のみ / 軸2: フラット維持 vs 段階開示 / 軸3: details 内部 state vs DOM 属性算出）。
- 各案のメリット / デメリット / 却下理由を明記する。ユーザーが「日本語のみ」「段階開示」を選択した経緯を記録する。

### ステップ 2: 判定と申し送り

- `outputs/phase-03/main.md` に PASS/MINOR/MAJOR 判定・4 条件評価・採用理由・MINOR 追跡を書く。
- MINOR 3 件（datalist placeholder grep / AuditPurposeGuide 範囲 / 未登録 SSOT 網羅）を Phase 5（実装）/ Phase 12（close-out）へ申し送る。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | レビュー PASS を受けて verify suite を起こす。details open（DOM 属性）/ raw fallback をテスト操作対象に固定 |
| Phase 5 | MINOR 3 件（placeholder grep / Guide 範囲 / 未登録 SSOT）を runbook に反映 |
| Phase 10 | GO/NO-GO 判定の上流根拠 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 採用案の責務閉包 | AC-9 | 採用案がデータ層・型に触れず表現層に閉じる（describe helper は表示専用） |
| 操作コード併記の不採用 | AC-3 / 価値性 | ユーザー方針「日本語のみ表示（生コード非表示）」に従い、併記案を却下。未登録のみ raw fallback |
| フラット維持の不採用 | AC-2 / 価値性 | 8 項目フラットは初見負荷が高い。段階開示で常時 5 + 詳細 3 に再構成 |
| details 内部 state の不採用 | [VSCPKR-03] / AC-10 | 内部 `useState` は不要な状態増加。DOM 属性 `defaultOpen` 算出で uncontrolled に保つ |
| 新規 primitive 非追加 | AC-10 | C1〜C3 が既存 primitive + native `<details>` のみで成立する確認 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 3 軸代替案文書化 | 3 | completed | alternatives.md |
| 2 | トレードオフ比較表 | 3 | completed | AC 軸 |
| 3 | PASS/MINOR/MAJOR 判定 | 3 | completed | MINOR 3 件 |
| 4 | 4 条件評価 | 3 | completed | 全 PASS |
| 5 | Phase 4 開始 / Phase 13 blocked 条件 | 3 | completed | main.md |
| 6 | MINOR 追跡テーブル | 3 | completed | Phase 5/12 申し送り |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 判定 + 4 条件 + 採用理由 + Phase 4/13 条件 + MINOR 追跡 |
| ドキュメント | outputs/phase-03/alternatives.md | 3 軸代替案とトレードオフ表・却下理由・ユーザー選択経緯 |
| メタ | artifacts.json | Phase 3 を completed に維持 |

## 完了条件

- [ ] `outputs/phase-03/alternatives.md` に 3 軸代替案（操作コード併記 vs 日本語のみ / フラット維持 vs 段階開示 / details 内部 state vs DOM 属性）が文書化されている
- [ ] トレードオフ比較表が AC 軸で評価されている
- [ ] PASS / MINOR / MAJOR 判定が明示され、戻り先が書かれている（MAJOR 0 件）
- [ ] 4 条件（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で評価されている
- [ ] Phase 4 開始条件 / Phase 13 blocked 条件が `outputs/phase-03/main.md` に記録されている
- [ ] MINOR 追跡テーブルが Phase 5 / Phase 12 への申し送りとして完成している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] `outputs/phase-03/{main,alternatives}.md` が配置済み
- [ ] PASS 判定が下されている（MAJOR 0 件）
- [ ] 採用案がデータ層・型に触れず表現層に閉じることが確認されている（AC-9）
- [ ] ユーザーが「日本語のみ」「段階開示」を選択した経緯が alternatives.md に記録されている
- [ ] artifacts.json の Phase 3 ステータスが completed に整合している

## 次Phase

- 次: Phase 4（テスト作成）
- 引き継ぎ事項: 採用案（日本語のみ + 2 層段階開示 + DOM 属性 defaultOpen）/ MINOR 3 件 / details open は DOM 属性
- ブロック条件: 総合判定が PASS にならない場合は Phase 2 に戻る
