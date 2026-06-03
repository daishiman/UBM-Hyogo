# Phase 3: 設計レビュー

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 3（設計レビュー / ゲート） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| 入力 | Phase 1 受入条件 / Phase 2 設計 |
| 出力 | Phase 4 へ進めるかの判定（PASS / FAIL） |

## 目的

Phase 2 設計が AC-1〜AC-7 を漏れなく満たし、不変条件 I-1〜I-6 と矛盾しないかをレビューゲートで判定する。MINOR 指摘は Phase 12 で未タスク化の要否を判定し、対象不在なら非タスク観察として扱う。

## 実行タスク

### 3.1 AC ↔ 設計トレーサビリティ

| AC | 設計上の充足箇所 | 判定 |
|----|------------------|------|
| AC-1（production→`Secure` 付与） | Phase 2 §2.3 serializer が `secure=true` で `; Secure` append | PASS |
| AC-2（dev→`Secure` 無し・回帰なし） | §2.3 `secure=false` で append しない。`Path`/`Max-Age`/`SameSite` 順序不変（§2.3 設計判断） | PASS |
| AC-3（runtime 判定・`process.env` 増やさない） | §2.2 候補 B 採用。`isSecureRuntimeContext` は `browserDocument()?.location.protocol` のみ参照 | PASS |
| AC-4（cookie 名/value/属性 不変・HttpOnly なし） | §2.3 既存文字列に append のみ。HttpOnly 言及なし | PASS |
| AC-5（parser 無改修・回帰なし） | §2.3 parser 群「無改修」明記。writer は既定引数経由で無改修 | PASS |
| AC-6（focused Vitest green） | §2.4 テストフロー 3 経路（true/false/default） | PASS（テスト設計は Phase 4） |
| AC-7（typecheck/lint green） | §2.1 最小差分。`process.env`/`localStorage` トークン非導入 | PASS |

### 3.2 不変条件チェック

| 不変条件 | 判定 | 根拠 |
|----------|------|------|
| I-1（cookie I/O 単一 source） | PASS | `Secure` 判定を serializer module 内に閉じ込め（§2.5） |
| I-2（cookie 名/value/属性 不変） | PASS | `; Secure` append のみ（§2.3） |
| I-3（HttpOnly なし） | PASS | 付与しない |
| I-4（`process.env` 非導入・`browserDocument()` 経由） | PASS | 候補 B 採用（§2.2） |
| I-5（parser 無改修） | PASS | §2.3 明記 |
| I-6（API/D1/Form/token 不変） | PASS | CSS / API 変更なし |

### 3.3 システム思考レビュー（因果・境界・価値）

- **強化ループ**: cookie 属性ポリシーの一貫性確立 → 将来 cookie 追加時に `Secure` 漏れが起きにくい → セキュリティ監査コスト低減。
- **バランスループ**: `Secure` を dev でも付けると localhost で cookie 不送信 → 永続化が黙って失敗 → 開発体験悪化。これを `location.protocol` 判定で抑止（§2.2 / §2.6）。
- **責務境界**: 判定（serializer）/ 書込（writer）/ 状態（hook）の所有権が混在しない（§2.5）。
- **価値とコスト**: 価値 = 平文 HTTP 経路への cookie 漏出を構造的に防止 + ポリシー一貫性。コスト = serializer 1 関数の引数追加 + ヘルパ 1 + test 4 観点。価値 > コストで均衡。

### 3.4 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | production cookie の `Secure` 化でセキュリティ監査指摘を予防。将来 cookie の標準を確立 |
| 実現性 | PASS | 既存 1 関数の後方互換拡張 + 内部ヘルパ 1。1 サイクル完了 |
| 整合性 | PASS | 判定所有権が serializer に単一集約。parser/writer/hook 無改修で hydration / 永続化に影響なし |
| 運用性 | PASS | lint-boundaries / typecheck / focused Vitest 既存 gate で回帰検出可能。`Secure` 有無は serializer 文字列検証で固定 |

### 3.5 MINOR 指摘（非タスク観察候補）

| # | 指摘 | 重大度 | 扱い |
|---|------|--------|------|
| M-1 | `is-browser.ts` に汎用 `browserLocation()` accessor を設けると `location.protocol` 参照が他箇所でも統一できる | MINOR | 本タスクスコープ外（§1.6）。現時点では参照箇所が単一のため Phase 12 で非タスク観察として判定 |
| M-2 | 他 UI 設定 cookie（density 等）追加時の `Secure` 標準化を doc 化 | MINOR | 対象 cookie がまだ存在しないため Phase 12 で非タスク観察として判定 |

> MINOR は本サイクルの単一責務（collapse cookie の `Secure` 環境分岐）に不要。Phase 12 unassigned-task-detection では formalize 0 件 / backlog 0 件 / 非タスク観察 2 件として扱う。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| Phase 1 | `phase-1-requirements.md` | AC 定義 |
| Phase 2 | `phase-2-design.md` | 設計正本 |
| レビューゲート基準 | `.claude/skills/task-specification-creator/references/review-gate-criteria.md` | ゲート判定基準 |

## 統合テスト連携

レビュー結果として、統合テスト不適用（`Secure` が read 値に出ない）を Phase 4 のテスト戦略に引き継ぐ。serializer 文字列検証 + 既存 shell suite 回帰確認の 2 本立てで品質を担保する設計を承認する。

## 成果物

- 本ファイル（`phase-3-design-review.md`）にゲート判定（PASS）と MINOR 指摘を記録する。

## 完了条件

- 全 AC が設計でトレース可能（§3.1 全 PASS）。
- 不変条件 I-1〜I-6 が PASS（§3.2）。
- ゲート判定 = **PASS**。Phase 4 へ進む。
