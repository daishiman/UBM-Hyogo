# Phase 3 — 設計レビュー

**[実装区分: 実装仕様書 / implementation_mode: new]**

## 1. 4 条件評価（一次結論）

| 条件 | 一次結論 | 根拠 |
|------|---------|------|
| 価値性 | PASS | 管理者の「再取込の所要時間が分からない」コストを直接下げる。durationMs を 1 値表示するだけで性能劣化の早期検知が可能になる（B-1 フィードバックループの断絶を解消） |
| 実現性 | PASS | 変更は 3 production ファイル（型 1 / schema 1 / UI 1）+ test 3 ファイル。新規 endpoint・新規 D1 schema・新規 primitive ゼロ。既存の `options.now` 注入ポイントを再利用するため計時実装も最小 |
| 整合性 | PASS | producer（backend）/ consumer（frontend）の責務境界が明確。状態所有権は backend 単一。route 素通しで自動伝播。`.strict()` と新フィールドの整合を AC-2 で担保。命名（durationMs）は既存 camelCase と一貫 |
| 運用性 | PASS | D1 schema 変更なしのため migration 運用は発生しない。frontend schema を optional にしたことで旧レスポンス・将来別経路に対し parse-safe（後方互換）。回帰テスト（AC-4/5/6）で union・`.strict()`・素通しの退化を防ぐ |

## 2. 補足分析

### 2.1 因果ループの妥当性

- B-1（性能フィードバックループ）: 「durationMs 計測・表示 → 認知 → backfill 調整 → 負荷抑制」のバランスループ。本タスクが計測・表示エッジを成立させてループを初めて閉じる。設計に矛盾なし。

### 2.2 トレードオフ

| 論点 | 採用 | トレードオフ |
|------|------|-------------|
| `ResponseSyncResult` を required / frontend schema を optional | 採用（非対称） | backend は確実に供給するため required が型安全。frontend は後方互換のため optional。非対称だが意図的で、`-` fallback により UI も壊れない |
| 計時を `now()` 経由（壁時計）か monotonic（`performance.now()`）か | `now()` 経由 | monotonic の方が正確だが、既存の `options.now` 注入規約・テスト決定論性を優先。Workers 環境での壁時計差分で運用上十分 |
| `Math.max(0, …)` 防御を入れるか | 入れない | 既存注入規約に依存し副作用を最小化。実運用で負値はほぼ発生せず、AC-1 の非負整数は `getTime()` 差分で満たす |

### 2.3 KJ 法クラスタ（リスク整理）

- クラスタ 1（契約退化リスク）: `.strict()` schema に新フィールドを足さないと parse 失敗 → AC-2 で必須化、AC-5 回帰テストで保護。
- クラスタ 2（route 誤変更リスク）: route を「変更必要」と誤認して二重計測する事故 → O-1 / Phase 2 §1 で「変更不要・素通し」を明記、AC-6 で素通し確認。
- クラスタ 3（別 sync 経路への波及リスク）: `DiffSummary.durationMs` / `manual.ts` を巻き込む事故 → O-2/O-3 でスコープ外明示。

## 3. Phase 4 進行判定

| 判定項目 | 結果 |
|---------|------|
| スコープ確定（含む/含まない） | 確定（Phase 1 §3） |
| AC 確定（AC-1〜AC-6） | 確定（Phase 1 §4） |
| inventory 確定（F-1〜F-6） | 確定（Phase 1 §5） |
| 責務境界・状態所有権の矛盾 | なし（Phase 2 §1） |
| 計時設計の決定論性 | 確保（`options.now` 注入・Phase 2 §2） |
| 命名整合 | 確保（durationMs camelCase・Phase 1 §6） |
| 既存テストの退化防止策 | あり（AC-4/5/6・schema optional 順序・Phase 2 §3） |

→ **Phase 4（テスト作成）へ進行可能**。

## 4. Gate-A 判定

| 項目 | 状態 |
|------|------|
| Gate-A | **passed** |
| passed 理由 | 4 条件すべて PASS。MAJOR blocker なし。設計が実装可能粒度（変更対象ファイルパス・型/関数シグネチャ・差分方針）まで固定されている |
| MINOR 指摘 | なし（命名・責務境界・退化防止がすべて Phase 1/2 で解決済み） |
| 残課題 | Phase 4 テスト作成へ。実装の「実行」（commit/PR/staging）は user-gated |

## 5. Phase 4 への引き継ぎ事項

- TDD Red: F-4/F-5/F-6 に durationMs テストを先に追加し、現行コード（durationMs 未供給）で RED を確認する。
- 計時テストは `options.now` を固定値関数（例: `() => new Date(1000)` → 進行 → `() => new Date(1042)`）として注入し、durationMs の決定論的検証を設計する。`now()` は経路ごとに 2 回以上呼ばれる点（起点 + return 直前）に注意し、テストの now stub は呼び出し回数で値を進めるカウンタ方式を検討する。
- panel spec はテスト操作対象が internal state（`lastResult`）であることを前提に、durationMs を含む mock result を `onSynced`/`applyResponse` 経由で流し込む。
