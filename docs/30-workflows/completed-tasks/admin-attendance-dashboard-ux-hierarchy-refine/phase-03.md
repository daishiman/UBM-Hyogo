# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 上流 | Phase 2（設計） |
| 下流 | Phase 4（テスト作成） |
| 状態 | spec_created |

## 目的

Phase 2 で確定した 3 層 topology・`AttendanceDetailTabs` 設計・状態所有権に対し、**3 案以上の代替を出してトレードオフを比較**し、PASS / MINOR / MAJOR 判定を下す。4 条件（価値性 / 実現性 / 整合性 / 運用性）を評価し、Phase 4 開始条件と Phase 13 blocked 条件を確定する。MINOR 指摘は追跡テーブルに登録する。

## 実行タスク

1. **代替案の文書化**: 「全面再構成 / 最小限調整 / タブ vs アコーディオン / ヒーロー単一 KPI vs 2 枚」を `outputs/phase-03/alternatives.md` に書き、却下理由を明記する。
2. **採用理由の確定**: 「階層リファイン + Segmented タブ + 2 枚ヒーロー」を採用する根拠を `outputs/phase-03/main.md` に記録する。
3. **4 条件評価**: 価値性 / 実現性 / 整合性 / 運用性を判定する。
4. **PASS / MINOR / MAJOR 判定**: 戻り先を明記する。
5. **Phase 4 開始条件 / Phase 13 blocked 条件の確定**。
6. **MINOR 追跡テーブル作成**: Phase 5 / Phase 12 への申し送りを記録する。

## PASS / MINOR / MAJOR 判定（サマリ）

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 3 層 topology（PRIMARY/TREND/DETAIL） | PASS | 既存 8 セクションを情報の優先順位で 3 層に再配置。データ取得・型を変えず表現層に閉じる |
| 新規 primitive ゼロ | PASS | `AttendanceDetailTabs` は feature 層コンポーネント（`Segmented` を内部利用）。`components/ui/` 追加なし（AC-6） |
| API/D1/shared 型不変 | PASS | bundle 取得・型を変更しない。`AttendanceDetailTabs` props は既存 shared 型のみ（AC-7） |
| Segmented internal state | PASS | タブ選択を `useState` に固定（[VSCPKR-03]）。Phase 4 のテスト操作対象が明確 |
| degrade 維持 | PASS | ゾーン/タブ単位 `AdminSectionErrorClient`（AC-10） |
| token 正本 | PASS | layout-blueprint の色/余白が `tokens.css` 実在値のみ（AC-5） |
| route 二重 className 整理（D-1） | MINOR | `page.tsx` と `AttendanceAnalyticsPage` の `attendance-analytics-page` / testid 二重を実装時に整理。機能影響なしだが testid 衝突に注意 |
| 要フォロー属性名（`data-attendance-follow`） | MINOR | issue-1112 の `data-attendance-level`（none/normal/high）と別意味のため命名分離。混同回避は設計済だが Phase 5 で命名を実装に固定する必要 |
| 既存 spec 追従範囲 | MINOR | `KpiPanel.spec.tsx` 等のレイアウト変更追従。挙動不変だが testid 維持確認が必要 |
| 重大 blocker | なし | MAJOR 該当なし |

総合判定: **PASS（MINOR 3 件は許容、Phase 4 へ進む）**

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか定義されているか | PASS | 管理者の「何を判断すべきか分からない」認知コストを 3 層階層 + 焦点（出席率特大 / 要フォロー強調）で低減。最重要 2 判断が最上部に到達 |
| 実現性 | 初回スコープで実装可能な厚みか | PASS | 既存 primitive + token + 6 endpoint で 1 サイクル完了。新規は `AttendanceDetailTabs` 1 件 + globals.css クラス追加のみ |
| 整合性 | 責務境界 / 依存 / 状態所有権が矛盾なく閉じるか | PASS | 表現層（apps/web feature）に閉じる。filter（hook）/ タブ（local state）/ データ（server fetch）の所有権が分離。AC-7 で API/D1/shared 不変 |
| 運用性 | verify / 回帰保護が破綻しないか | PASS | `verify-design-tokens`（HEX 0）+ vitest component spec + playwright visual smoke で回帰保護。SafeResult degrade で部分障害に強い |

## Phase 4 開始条件 / Phase 13 blocked 条件

| 区分 | 条件 |
| --- | --- |
| Phase 4 開始条件 | (1) 本 Phase の総合判定が PASS（MAJOR 0 件）。(2) `AttendanceDetailTabs` の props/state signature（internal `useState`）が component-map で確定。(3) AC-1〜AC-10 が test 検証手段にマップ済み |
| Phase 13 blocked 条件 | commit / PR はユーザーの明示承認後のみ実行。承認なしでは Phase 13 を blocked のまま維持する |

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | レビュー対象（topology / 状態所有権 / degrade） |
| 必須 | outputs/phase-02/layout-blueprint.md | レビュー対象（token 割当 / responsive） |
| 必須 | outputs/phase-02/component-map.md | レビュー対象（Before/After / props/state） |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-10 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計原則 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 階層・焦点判定の根拠 |
| UI/UX admin dashboard | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | ダッシュボード情報設計の妥当性 |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | 新規 primitive 非追加の裏取り |

## 実行手順

### ステップ 1: 代替案の文書化

- `outputs/phase-03/alternatives.md` に 4 案を書く（全面再構成 / 最小限調整 / タブ vs アコーディオン / ヒーロー単一 vs 2 枚）。
- 各案のメリット / デメリット / 却下理由を明記する。

### ステップ 2: 判定と申し送り

- `outputs/phase-03/main.md` に PASS/MINOR/MAJOR 判定・4 条件評価・採用理由・MINOR 追跡を書く。
- MINOR 3 件を Phase 5（実装）/ Phase 12（close-out）へ申し送る。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | レビュー PASS を受けて verify suite を起こす。Segmented internal state をテスト操作対象に固定 |
| Phase 5 | MINOR 3 件（route 二重 / 属性名 / spec 追従）を runbook に反映 |
| Phase 10 | GO/NO-GO 判定の上流根拠 |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 採用案の責務閉包 | AC-7 | 採用案がデータ層・型に触れず表現層に閉じる |
| 全面再構成の不採用 | AC-3 / 価値性 | 8 セクション全廃ではなく「再配置」で価値を出す（情報欠落リスク回避） |
| アコーディオン不採用 | AC-3 / AC-9 | Segmented タブの方が「排他 1 表示 + 既存 primitive + radiogroup a11y」で優位 |
| ヒーロー 2 枚採用 | AC-1 | ユーザーが最重要として選んだ 4 項目のうち、出席率 + 要フォローを hero に昇格（残り 2 は TREND/secondary） |
| 新規 primitive 非追加 | AC-6 | `AttendanceDetailTabs` が primitive ではなく feature コンポーネントである確認 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 案文書化 | 3 | spec_created | alternatives.md |
| 2 | トレードオフ比較表 | 3 | spec_created | AC 軸 |
| 3 | PASS/MINOR/MAJOR 判定 | 3 | spec_created | MINOR 3 件 |
| 4 | 4 条件評価 | 3 | spec_created | 全 PASS |
| 5 | Phase 4 開始 / Phase 13 blocked 条件 | 3 | spec_created | main.md |
| 6 | MINOR 追跡テーブル | 3 | spec_created | Phase 5/12 申し送り |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 判定 + 4 条件 + 採用理由 + Phase 4/13 条件 + MINOR 追跡 |
| ドキュメント | outputs/phase-03/alternatives.md | 4 案詳細とトレードオフ表・却下理由 |
| メタ | artifacts.json | Phase 3 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-03/alternatives.md` に 4 案（全面再構成 / 最小限調整 / タブ vs アコーディオン / ヒーロー単一 vs 2 枚）が文書化されている
- [ ] トレードオフ比較表が AC 軸で評価されている
- [ ] PASS / MINOR / MAJOR 判定が明示され、戻り先が書かれている（MAJOR 0 件）
- [ ] 4 条件（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で評価されている
- [ ] Phase 4 開始条件 / Phase 13 blocked 条件が `outputs/phase-03/main.md` に記録されている
- [ ] MINOR 追跡テーブルが Phase 5 / Phase 12 への申し送りとして完成している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] `outputs/phase-03/{main,alternatives}.md` が配置済み
- [ ] PASS 判定が下されている（MAJOR 0 件）
- [ ] 採用案がデータ層・型に触れず表現層に閉じることが確認されている（AC-7）
- [ ] artifacts.json の Phase 3 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 4（テスト作成）
- 引き継ぎ事項: 採用案（階層リファイン + Segmented タブ + 2 枚ヒーロー）/ MINOR 3 件 / Segmented internal state
- ブロック条件: 総合判定が PASS にならない場合は Phase 2 に戻る
