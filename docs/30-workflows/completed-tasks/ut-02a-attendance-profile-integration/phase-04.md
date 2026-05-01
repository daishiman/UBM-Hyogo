# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |

## 目的

AC-1〜10 を保証する単体・統合テスト matrix を確定し、N+1 / chunk / soft-delete / regression を網羅する。

## テスト Matrix

### 4.1 単体テスト（AttendanceRepository）

| # | ケース | 入力 | 期待 | 関連 AC |
| --- | --- | --- | --- | --- |
| U-1 | 0 件取得 | 0 件登録の `MemberId` 1 件 | Map サイズ 0（または key なし） | AC-2, AC-4 |
| U-2 | 1 件取得 | 1 件登録の `MemberId` 1 件 | `[AttendanceRecord]` 長さ 1 | AC-2, AC-4 |
| U-3 | 複数件取得 | 5 件登録の `MemberId` 1 件 | 長さ 5、`held_on` 降順 | AC-2, AC-4 |
| U-4 | 複数 member | 3 名分の混在データ | 各 `MemberId` ごとに分離 | AC-2, AC-4 |
| U-5 | 同一 member の同一 meeting 重複 | DB に 2 行 | 2 件返却（dedup しない） | AC-4 |
| U-6 | meeting 不在除外 | `meeting_sessions` に存在しない session | 結果から除外 | AC-4 |
| U-7 | 100 件超 chunk | `MemberId` 250 件 | chunk(80) で 4 回呼ばれ全件マージ | AC-3, AC-4 |
| U-8 | 空配列入力 | `MemberId[]` = [] | 空 Map、SQL 発行 0 回 | AC-4 |
| U-9 | sort tie-break | 同 `held_on` 2 件 | `session_id` 昇順で安定 | AC-4 |

### 4.2 統合テスト（builder integration）

| # | ケース | 期待 | 関連 AC |
| --- | --- | --- | --- |
| I-1 | provider 注入あり / 単一 member | attendance 実データが MemberProfile に注入 | AC-1 |
| I-2 | provider 注入あり / 複数 member | 1 回の `findByMemberIds` で全件解決（N+1 不発生） | AC-1, AC-2 |
| I-3 | provider 未注入 | attendance: [] フォールバック | AC-1 |
| I-4 | 02a 既存テスト全 PASS | identity / status / response 部に影響なし | AC-5 |

### 4.3 型 / lint / build

| # | ケース | 期待 | 関連 AC |
| --- | --- | --- | --- |
| T-1 | `pnpm typecheck` | 0 error | AC-6 |
| T-2 | `pnpm lint` | 0 error | AC-6 |
| T-3 | `pnpm build` | success | AC-6 |
| T-4 | `MemberId` / `ResponseId` import 不変 | 既存 path 改変 0 件 | AC-7 |

### 4.4 N+1 計測

- 単体 + 統合テストで `D1Database.prepare` 呼び出し回数を spy
- 期待値: chunk 数（`Math.ceil(memberIds.length / 80)`）
- baseline と比較し regression 検知

### 4.5 通電テスト（Phase 11 で実取得）

- API curl: `/me/profile`（または相当）レスポンスに `attendance` フィールドが配列で含まれる
- UI smoke: マイページ / admin 詳細を開き attendance 行が描画される（NON_VISUAL: 描画ログ + DOM 観測 markdown）

## 完了条件

- [ ] test-matrix.md に U-1〜U-9 / I-1〜I-4 / T-1〜T-4 を記載
- [ ] 各テストの AC 紐付けが Phase 7 マトリクスへ流せる形式
- [ ] N+1 計測手順が確定

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 主成果物 |
| Matrix | outputs/phase-04/test-matrix.md | 全 test ケース表 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 4 を completed

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ: test matrix を runbook の検証ステップに 1:1 で接続

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
