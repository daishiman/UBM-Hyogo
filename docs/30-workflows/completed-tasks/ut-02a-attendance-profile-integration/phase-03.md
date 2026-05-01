# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |

## 目的

Phase 2 で確定した設計を多角的にレビューし、PASS / MINOR / MAJOR を判定する。alternative 案との比較で「採用案の優位性」と「将来の移行余地」を明文化する。

## レビュー観点

### 3.1 Alternative 比較

| 観点 | 採用案: optional 引数追加 | alt-1: Hono ctx 経由 DI | alt-2: DI container |
| --- | --- | --- | --- |
| 既存呼び出し破壊 | なし | 中（ctx 拡張 path 全更新） | 大（init 経路全更新） |
| テスト容易性 | 高（直接 inject） | 中（ctx mock 必要） | 中（container mock） |
| 段階移行 | 可（optional） | 不可（一括） | 不可（一括） |
| MVP 整合 | ◎ | △ | × |
| 将来拡張 | 必要時に ctx へ昇格 | — | — |
| **判定** | **採用** | 将来候補 | 不採用 |

### 3.2 設計レビューチェック

- [ ] AC-1〜10 を 100% カバー
- [ ] 02a interface 不変条件を破壊していない
- [ ] N+1 が構造的に発生不能（builder が 1 回の `findByMemberIds` でまとめて解決）
- [ ] bind 上限超過が chunk で構造的に防がれている
- [ ] branded type 衝突が module 分離で構造的に防がれている
- [ ] soft-delete 除外が repository 層で完結している
- [ ] 02b との Schema Ownership 衝突なし
- [ ] sort order / tie-break が決定論的

### 3.3 PASS / MINOR / MAJOR

| 区分 | 内容 |
| --- | --- |
| PASS | 上記チェック全 PASS で次 Phase 進行可 |
| MINOR | 命名 / コメント / 軽微な順序 → Phase 5 でまとめて修正可 |
| MAJOR | interface 破壊 / N+1 残存 / bind 制約違反 → Phase 2 へ差し戻し |

### 3.4 リスクサマリ

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| `MemberProfile` interface の破壊的変更が 02a に波及 | 高 | 低 | interface 不変・内部実装のみ修正 |
| builder への引数追加で既存呼び出しが壊れる | 中 | 中 | optional + フォールバック |
| N+1 で D1 bind 上限超過 | 中 | 中 | 80 件 chunk + Promise.all |
| 新設 branded type が既存 ID 型と衝突 | 中 | 低 | 独立 module + `Brand<...>` |
| 02b の schema 進行遅延 | 中 | 中 | Phase 5 着手前に 02b 進捗確認、独立タスク化判断 |
| optional 引数のまま「未注入」呼び出しが将来再発 | 低 | 中 | route wiring tests + Phase 8 DRY 化で helper 検討 |

## 完了条件

- [ ] alternative 比較表が完成
- [ ] チェック全項目 PASS（または MINOR 一覧化）
- [ ] PASS / MINOR / MAJOR 判定確定
- [ ] リスク表が完成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | Phase 3 主成果物 |
| 比較 | outputs/phase-03/alternatives-comparison.md | 採用 vs alt-1 vs alt-2 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] MAJOR 判定なし、または Phase 2 差し戻し済み
- [ ] artifacts.json の phase 3 を completed

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ: 採用設計 + リスク表 + Phase 8 で扱う MINOR 一覧

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
