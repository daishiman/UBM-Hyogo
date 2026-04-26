# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 3 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 2 (設計) |
| 下流 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 設計に対し alternative を 3 案提示、PASS-MINOR-MAJOR で判定、改善点を Phase 4-5 に反映する。

## 実行タスク

1. alternative 3 案抽出（zod 配置 / Forms package 配置 / branded type 実装）
2. trade-off 比較
3. PASS / MINOR / MAJOR 判定
4. 改善点を Phase 4-5 反映
5. outputs/phase-03/main.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計案 |
| 必須 | outputs/phase-02/module-design.md | module 分割 |

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 4 | テスト戦略 |
| 5 | 実装ランブック |

## 多角的チェック観点（不変条件参照）

- **#1/#5**: 採用案が schema 抽象 / D1 boundary を破らないこと

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | alternative 3 案 | 3 | pending |
| 2 | trade-off | 3 | pending |
| 3 | 判定 | 3 | pending |
| 4 | 改善点 | 3 | pending |
| 5 | outputs | 3 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-03/main.md |
| メタ | artifacts.json |

## 完了条件

- [ ] 3 案比較
- [ ] PASS / MINOR / MAJOR 判定
- [ ] 改善点が Phase 4-5 に伝達

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-03/main.md 配置
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 4
- 引き継ぎ事項: 改善点
- ブロック条件: MAJOR 判定

## Alternative 3 案

### 案 A: zod schema を packages/shared に集約

- pros: import 1 箇所、Wave 4 で再利用容易
- cons: shared が runtime 依存（zod）を持つ
- **判定: PASS（採用）**

### 案 B: zod schema を apps/api に置く

- pros: shared を pure type だけに保てる
- cons: Wave 4 全タスクが apps/api 経由になる、再利用性低下
- **判定: MINOR**

### 案 C: zod schema をタスク 04* で各自定義

- pros: 自由度高い
- cons: 31 項目 × 3 タスクで重複、不変条件 #1 違反リスク
- **判定: MAJOR**

## 採用案

**案 A**: `packages/shared/src/zod/` に集約。

## Forms package 配置

### 案 A1: `packages/integrations/google` 配下

- pros: 後続 google サービス（Calendar / Drive 等）拡張時に統一
- **採用**

### 案 A2: `packages/forms` 単独

- cons: google 共通認証コードを再実装する未来リスク
- **不採用**

## branded type 実装

### 案 B1: `type X = string & { readonly __brand: "X" }` 方式

- pros: runtime 0、tsc レベル保護
- **採用**

### 案 B2: zod `.brand<"X">()` 方式

- pros: zod parse 時に brand 付与
- cons: zod に runtime 依存
- 一部（Forms parse 出力）は B2 と併用、type 単独は B1

## 判定

| 観点 | 判定 |
| --- | --- |
| 案採用整合性 | PASS |
| 不変条件 #1 抽象化 | PASS |
| 不変条件 #5 boundary | PASS（ESLint rule で補強） |
| 4 条件 | 全 HIGH |

**最終: PASS**（MINOR / MAJOR 0 件、Phase 4 へ）
