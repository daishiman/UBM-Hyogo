# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 2 (設計) |
| 下流 | Phase 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の module 構造を **採用案 A** とし、3 案以上の alternative と比較する。dep-cruiser のみ / ESLint のみ / 両方 / runtime guard 等の境界戦略を比較し、PASS / MINOR / MAJOR で判定する。

## alternative 案

### 案 A（採用）: 5 repo + boundary tooling 二重防御 + `_shared/` 02c 正本

- 内容: dep-cruiser config + ESLint no-restricted-imports + 5 repo + 02a/02b に `_shared/` を export
- 強み:
  - CI で dep-cruiser が境界違反を 100% 検出（forbidden severity error）
  - ローカル開発で ESLint が即時 feedback（red squiggle）
  - `_shared/` を 02c 正本で重複ゼロ
  - auditLog の append-only / magicTokens の single-use を API 不在で守る
  - syncJobs の ALLOWED_TRANSITIONS が 02b と統一
- 弱み:
  - dep-cruiser config の維持コスト（rule 増加で読みにくくなる）
  - ESLint plugin 設定が apps/web に必要

### 案 B（却下）: dep-cruiser のみ

- 内容: ESLint rule を入れず、CI の dep-cruiser だけで境界を守る
- 強み: tooling 1 種で済む、設定簡素
- 弱み:
  - ローカル開発で違反を見逃す（push してから CI で初めて気付く）
  - apps/web エンジニアが「import 候補」に repository が出てしまい誤って選ぶリスク
- 判定: **MAJOR**（事故率 → 採用しない）

### 案 C（却下）: ESLint のみ

- 内容: dep-cruiser を使わず、ESLint だけで no-restricted-imports
- 強み: 単一 tooling
- 弱み:
  - import path の文字列マッチに依存、再 export 経由で escape されるリスク
  - 02a/02b 間の相互 import 禁止を ESLint で書くのが冗長
  - CI gating として依存グラフ可視化が無い
- 判定: **MAJOR**（境界の網羅性が落ちる）

### 案 D（却下、即時 reject）: runtime guard

- 内容: repository 関数の冒頭で `if (typeof window !== 'undefined') throw` を入れる
- 強み: import を許してから落とすため柔軟
- 弱み:
  - bundle に repository が混入する → bundle size 肥大、不変条件 #5 の精神に反する
  - 静的検出にならない、production で落ちる
- 判定: **MAJOR**（即却下）

### 案 E（却下）: 5 repo を 1 ファイル admin.ts に統合

- 内容: 5 機能を 1 ファイルに集約、import path を 1 種に
- 強み: import 簡素
- 弱み:
  - 1 ファイル肥大（>2000 LOC 想定）
  - 並列着手不能（複数下流タスクで競合）
  - test の責務分離が崩れる
- 判定: **MAJOR**

## PASS / MINOR / MAJOR

| 案 | 判定 | 理由 |
| --- | --- | --- |
| A | PASS | 二重防御 + 共有最適、運用コストは許容範囲 |
| B | MAJOR | ローカル feedback 欠如 |
| C | MAJOR | 境界網羅性不足 |
| D | MAJOR | 静的検出にならない |
| E | MAJOR | 並列性 / 保守性損失 |

## ハイレベル PR 観点

| 観点 | 採用案の対応 |
| --- | --- |
| 不変条件 #5 D1 boundary | dep-cruiser + ESLint 二重 |
| 不変条件 #6 GAS prototype 昇格 | seed/fixture を dev only と明記 |
| 不変条件 #11 admin 本文編集禁止 | adminNotes / auditLog で `member_responses` 触らない |
| 不変条件 #12 adminNotes 分離 | builder 経路に存在しない構造 |
| append-only | auditLog UPDATE/DELETE 不在 |
| single-use | magicTokens.consume で usedAt set |
| 02a/02b 整合 | `_shared/` 正本 02c、相互一方向 import |

## 実行タスク

1. alternatives.md に 5 案比較を表で記述
2. PASS / MINOR / MAJOR 判定を main.md に記録
3. 採用案 A の弱み（dep-cruiser config 維持）を Phase 8 DRY 化で監視する申し送り

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 2 outputs/phase-02/main.md | 採用案の根拠 |
| 必須 | doc/02-application-implementation/README.md | 不変条件 #5/#6 の正本 |
| 参考 | doc/02-application-implementation/02a-... / 02b-... | 並列タスクの境界整合 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案 A の boundary tooling を verify suite に変換 |
| Phase 8 | dep-cruiser config の DRY 化対象 |
| Phase 10 | GO/NO-GO の根拠 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 比較案数 | — | 5 案以上 |
| MAJOR 判定根拠 | — | 4 案で MAJOR 理由が明記 |
| 採用案弱みの追跡 | — | Phase 8 申し送り |
| boundary 二重防御 | #5 | dep-cruiser + ESLint で網羅 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 案 A 採用根拠 | 3 | pending | 二重防御 + 共有 |
| 2 | 案 B/C/D/E reject 理由 | 3 | pending | MAJOR x4 |
| 3 | PASS 判定 | 3 | pending | A |
| 4 | 弱み 申し送り | 3 | pending | dep-cruiser config 維持 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | PASS 判定 + ハイレベル PR 観点 |
| ドキュメント | outputs/phase-03/alternatives.md | 5 案比較 |

## 完了条件

- [ ] 3 案以上の alternative
- [ ] PASS 判定が記述
- [ ] 採用案の弱みが Phase 8 に申し送り

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜4 が completed
- [ ] outputs/phase-03/{main,alternatives}.md が配置済み
- [ ] artifacts.json の Phase 3 を completed に更新

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ事項: 採用案 A、boundary tooling 二重防御
- ブロック条件: PASS 根拠が薄ければ Phase 2 に戻す
