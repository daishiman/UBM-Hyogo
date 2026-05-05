# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | completed |

## 目的

正常系では検出できない境界 / 失敗 / 競合シナリオを洗い出し、各シナリオで挙動を確定する。

## 異常系ケース

| # | シナリオ | 期待挙動 | 検証方法 |
| --- | --- | --- | --- |
| F-1 | `MemberId[]` が空 | SQL 発行 0 回、空 Map 返却 | 単体テスト U-8 + spy |
| F-2 | `MemberId` が null / undefined 混入 | 型レベルで弾かれる（`ReadonlyArray<MemberId>` 制約） | typecheck |
| F-3 | bind 上限を超える 250 件 | chunk(80) で 4 回呼ばれ全件マージ | 単体テスト U-7 + spy |
| F-4 | `meeting_sessions` に存在しない session 1 件 | 該当 attendance が結果から除外 | 単体テスト U-6 |
| F-5 | D1 接続 timeout | repository 層で例外 propagation、builder で握り潰さない | mock D1 で reject |
| F-6 | provider 未注入 | `attendance: []` フォールバック | 統合テスト I-3 |
| F-7 | provider 注入されたが内部で例外 | builder は例外を上位に伝播（部分 fallback しない） | mock provider で reject |
| F-8 | 同一 `MemberId` を重複指定 | 重複は dedup されて SQL 発行 | repository 内で `new Set` 化 |
| F-9 | 02a 既存テストが破壊された | 即 STOP、Phase 5 へ差し戻し | 02a test 全実行 |
| F-10 | `MeetingSessionId` を既存 `MemberId` 期待箇所へ誤って渡した | typecheck で reject | 型エラー再現テスト |
| F-11 | API レスポンスサイズ過大（attendance 数千件） | 現スコープでは制限なし、観測のみ。将来 pagination 候補へ unassigned 化 | smoke 時にレスポンスサイズ計測 |
| F-12 | 02b 進行遅延で schema 不在 | Phase 5 Step 1 で停止、02b 待機 / 独立タスク化を user に escalate | runbook の判断分岐 |

## 異常系で守るべき不変条件

- N+1 が異常系でも発生しない（F-3, F-8）
- 02a interface 不変（F-9, F-10）
- D1 直接アクセスが apps/api に閉じる（F-5）
- secret / token が evidence に混入しない（F-11 時のレスポンス保存時）

## 完了条件

- [ ] failure-cases.md に F-1〜F-12 が網羅
- [ ] 各ケースに「期待挙動」「検証方法」が明記
- [ ] Phase 4 test matrix と相互参照されている

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Phase 6 主成果物 |
| 異常系 | outputs/phase-06/failure-cases.md | F-1〜F-12 詳細 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 6 を completed

## 次 Phase

- 次: Phase 7 (AC マトリクス)
- 引き継ぎ: F-1〜F-12 を Phase 7 マトリクスに統合（AC × 正常 × 異常 × 不変条件）

## 実行タスク

- [ ] Phase 固有の成果物を作成する
- [ ] 完了条件と次 Phase への引き継ぎを確認する
- [ ] artifacts.json の該当 Phase status を実行時に更新する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/index.md | workflow 全体仕様 |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/artifacts.json | Phase status / outputs 契約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md | legacy source / Canonical Status |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | AC と test matrix の対応を維持 |
| Phase 9 | typecheck / lint / build / regression gate に接続 |
| Phase 11 | NON_VISUAL runtime evidence に接続 |
| Phase 12 | system spec sync と compliance check に接続 |
