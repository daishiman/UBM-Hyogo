# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL） |
| 上流 | Phase 2（設計 / change-map） |
| 下流 | Phase 4（テスト作成） |
| 状態 | spec_created |

## 目的

Phase 2 の change-map と契約設計を**4 条件（価値性 / 実現性 / 整合性 / 運用性）と Phase ゲート観点**でレビューし、Phase 4 へ進めるか判定する。文字列置換中心のタスクのため、レビューの焦点は「(1) 用語の言い換えが本当に非エンジニアに伝わるか、(2) 言い換えが既存の意味を壊さないか（例: ユニーク出席率→『一度でも参加した人の割合』の正確性）、(3) DOM/テスト/契約の保持、(4) スコープが 1 サイクルに収まるか」に置く。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/outputs/phase-02/{main,change-map}.md | レビュー対象（ファイル別変更マップ・契約設計） |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/_shared-context.md | 用語リネーム正本表・AC・4 条件評価基準 |
| 参考 | docs/00-getting-started-manual/specs/09b-design-tokens.md | HEX 禁止・トークン正本（AC-5 観点） |

## 実行タスク

1. **4 条件評価**: change-map と契約設計を 価値性 / 実現性 / 整合性 / 運用性 の 4 条件で評価し PASS/FAIL を判定する。
2. **用語言い換えの妥当性レビュー**: 各リネーム ID（R/S/J/U）について「言い換えが元の意味を壊していないか」を確認する（特に J-03 ユニーク出席率→一度でも参加した人の割合 の正確性）。
3. **リスク・MINOR 指摘の列挙**: テスト追従漏れ・visual baseline 差分・表記の残し判断など MINOR を列挙し対応方針を決める。
4. **ゲート判定**: Phase 4 へ進む GO/NO-GO を判定する。
5. **代替案の記録**: 採用しなかった設計案（英語併記 / 構造再設計）と不採用理由を `alternatives.md` に残す。

## レビュー観点と判定

### 1. 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 会員/管理者の読解コスト低減が AC-1〜AC-3 で定義済み。英語/専門語 → 平易日本語で「迷わず読める」価値が明確 |
| 実現性 | PASS | 12 ファイルの文字列置換 + 軽微 CSS + テスト追従で 1 サイクル完了可能（CONST_007）。新規 component/primitive/endpoint なし |
| 整合性 | PASS | 責務は web 表現層に閉じる。DOM contract（testid/role/aria キー）保持、契約（formatDelta/PRESETS/ZONE_HELP）保持。invariant #1/#2/#3/#5 違反なし |
| 運用性 | PASS | 既存 vitest + 回帰テスト + `verify-design-tokens` + （必要時）Playwright で回帰保護。grep で英語/専門語残存 0 を機械検証可能 |

### 2. 用語言い換えの妥当性レビュー（意味を壊さないか）

| リネーム | レビュー | 判定 |
| --- | --- | --- |
| ユニーク出席率 → 一度でも参加した人の割合（J-03） | `uniqueAttendanceRate` = 期間内に 1 回以上出席した会員の割合。「一度でも参加した人の割合」は意味的に正確 | PASS |
| セッション → 開催回（S-01〜S-10） | 各 session = 支部会の 1 開催。管理画面の『開催日』とも整合 | PASS |
| 出席回数帯 → 出席回数べつ / 累計の出席回数（J-09/J-10） | zone は累計出席回数のバケット。「回数べつ」「累計の出席回数」で意味保持 | PASS |
| pt → ポイント（J-07） | percentage point。日本語「ポイント」で一般に通じる | PASS |
| TREND → 出席の移り変わり（R-03） | trend = 推移。「移り変わり」は平易で意味保持 | PASS |
| CSVエクスポート → 表計算ファイルで書き出す（R-09） | 実体は CSV ダウンロード。Excel/スプレッドシートで開ける旨が伝わる。ファイル形式自体（.csv）は変えない | PASS（注: ダウンロードされる実ファイルは引き続き CSV。文言は用途を平易表現） |

### 3. リスク・MINOR 指摘

| ID | 指摘 | 重大度 | 対応 |
| --- | --- | --- | --- |
| M-1 | `ZONE_HELP` 変更で Playwright 前方一致（T-06）が壊れる | MINOR | 同一 wave で T-06 を新文言前方一致へ更新（change-map に記載済み）。放置しない |
| M-2 | visual snapshot テスト（`dashboard-attendance.spec.ts`）が文言変更で baseline 差分を出す可能性 | MINOR | Phase 4 で要否判定。staging visual baseline は user-gated。必要なら baseline 再取得を Phase 11/13 タスクに記す |
| M-3 | `期間内延べ出席数` の「延べ」を残す判断（J-12 は hint 補足案） | MINOR | 「延べ」は会計用語的だが一般にも通じる。label は維持しつつ hint で「開催回ごとの出席者数を合計した数」と補足。完全置換は任意（Phase 5 で最終判断） |
| M-4 | `くわしい一覧` 内の補助文に残る「テーブル」 | MINOR | 「一覧」へ寄せる任意改善。必須ではない（Phase 5 で判断） |

> いずれも MINOR。設計を Phase 4 へ進める妨げにはならない。M-2 は Phase 4 で visual baseline 要否を明示する。

### 4. ゲート判定

- **判定: GO（Phase 4 へ進む）**
- 前提充足: change-map.md 完成 / 契約保持設計あり / テスト追従マップあり / スコープ 1 サイクル / invariant 違反なし。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | MINOR M-2（visual baseline 要否）を test-plan に反映 |
| Phase 10 | 本レビューの 4 条件判定を最終レビューで再確認 |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 4 条件評価 | spec_created |
| 2 | 用語言い換えの妥当性レビュー | spec_created |
| 3 | リスク・MINOR 指摘の列挙 | spec_created |
| 4 | ゲート判定（GO/NO-GO） | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビューの実体（4 条件 / 言い換え妥当性 / MINOR / GO 判定） |
| ドキュメント | outputs/phase-03/alternatives.md | 検討した代替案（英語併記案 / 構造再設計案）と不採用理由 |
| メタ | artifacts.json | Phase 3 を spec_created に維持 |

## 完了条件

- [ ] 4 条件（価値性/実現性/整合性/運用性）が PASS で記録されている
- [ ] 用語言い換えの意味保持レビューが全リネーム ID について記録されている
- [ ] MINOR 指摘（M-1〜M-4）が列挙され対応方針が記されている
- [ ] ゲート判定が GO で記録されている
- [ ] `outputs/phase-03/alternatives.md` に代替案（英語併記 / 構造再設計）の不採用理由が記録されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜4 が完了している
- [ ] `outputs/phase-03/{main,alternatives}.md` が配置されている
- [ ] MINOR M-2（visual baseline 要否）が Phase 4 へ申し送られている
- [ ] artifacts.json の Phase 3 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 4（テスト作成）
- 引き継ぎ事項: GO 判定 / MINOR M-1〜M-4 / visual baseline 要否判定の申し送り
- ブロック条件: 4 条件のいずれかが FAIL、または用語言い換えが意味を壊すと判定された場合は Phase 2 へ差し戻す
