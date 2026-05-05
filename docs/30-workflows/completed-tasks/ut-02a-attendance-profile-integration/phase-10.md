# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (実装 smoke) |
| 状態 | completed |

## 目的

Phase 1〜9 の全成果を統合レビューし、Phase 11 (smoke) 進行の GO / NO-GO を確定する。

## レビュー観点

### 10.1 GO 条件

- [ ] AC-1〜10 のうち、AC-8/AC-9（Phase 11 で取得） を除く全てが Phase 9 までに充足
- [ ] Phase 7 マトリクスで AC × test × evidence × 不変条件のカバレッジに穴がない
- [ ] 02a 既存テスト全 PASS（regression なし）
- [ ] N+1 metric が baseline と一致
- [ ] schema 利用可能（`meeting_sessions` / `member_attendance` 確定）

### 10.2 NO-GO トリガー

- 02a interface に変更が混入している
- N+1 が一部経路で残存
- 02b schema 進行未完で repository が動作しない
- typecheck / lint / build のいずれかが fail

### 10.3 依存タスク確認

| 依存先 | 必要充足項目 | 状態確認方法 |
| --- | --- | --- |
| 02a | `MemberProfile` interface 確定、builder 識別 / status / response 完了 | artifacts.json status |
| 02b | `meeting_sessions` / `member_attendance` schema 利用可能 | apps/api/migrations の git history |

### 10.4 Phase 11 への引き継ぎ

- API curl コマンド（Authorization マスク手順込み）
- UI smoke 観測 markdown のテンプレート
- 期待 evidence 4 ファイル（api-curl 2 + ui-smoke 2）

## 完了条件

- [ ] GO / NO-GO 判定確定
- [ ] NO-GO 時の差し戻し先 Phase が明記
- [ ] Phase 11 への引き継ぎ事項が main.md に記述

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | Phase 10 主成果物 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 10 を completed

## 次 Phase

- 次: Phase 11 (実装 smoke)
- 引き継ぎ: GO 確定後の smoke 取得手順

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
