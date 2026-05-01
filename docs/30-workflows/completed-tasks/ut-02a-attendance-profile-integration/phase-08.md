# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

## 目的

実装後のコードを review し、(1) 既存 repository pattern に合わせた整理 (2) chunk / batch helper の共通化候補抽出 (3) Phase 3 で挙がった MINOR の解消を行う。範囲外の refactor には踏み込まない。

## DRY 化対象

| # | 対象 | 内容 | 判断 |
| --- | --- | --- | --- |
| D-1 | chunk(arr, size) | repository 共通 helper として `_shared/util/chunk.ts` に抽出 | 02b 等で既存があれば再利用、なければ新設 |
| D-2 | branded type ファクトリ | `member.ts` / `response.ts` 既存 pattern と signature 揃え | 命名 / export 方法を統一 |
| D-3 | builder fallback | optional 引数未注入時は 02a 互換の `[]` を維持し、route wiring tests で注入漏れを検出 | optional 引数未注入の再発防止 |
| D-4 | sort tie-break | `held_on DESC, session_id ASC` を provider 内で安定化 | テストから参照可能に |
| D-5 | repository module export | `apps/api/src/repository/index.ts` への追加方針を 02a / 02b と揃える | 既存 pattern 踏襲のみ、新規 facade 作らず |

## 範囲外（明示）

- 02a が確定した identity / status / response 部の refactor
- meeting domain 側 repository（02b スコープ）
- Hono ctx への DI 移行（将来候補、本タスクで実施しない）
- DI container 導入

## 完了条件

- [ ] D-1〜D-5 各項目に「採用」「将来」「不採用」を確定
- [ ] 採用した DRY 化が test を破壊していない
- [ ] 範囲外項目を main.md に明記

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Phase 8 主成果物 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 8 を completed

## 次 Phase

- 次: Phase 9 (品質保証)
- 引き継ぎ: DRY 後の最終コードに対する gate 実行

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
