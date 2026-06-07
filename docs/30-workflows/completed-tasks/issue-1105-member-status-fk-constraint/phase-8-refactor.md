# Phase 8 — リファクタリング / Elegance Check

> 実装区分: 実装仕様書 / NON_VISUAL / new
> 入力: `phase-5-implementation.md` 〜 `phase-7-coverage.md` / `index.md` / `phase-2-design.md`
> 判定対象: 新規 migration + 新規 test の elegance（重複排除 / 命名 / コメント明瞭さ）
> 出力: PASS → Phase 9（品質保証）へ進行

---

## 8.1 方針（Decision）

本タスクの実装サイクル成果物は FK migration / migration contract test に加え、既存 D1 test fixtures の FK 前提追従を含む。既存製品コードの構造改変・移設は発生しないため、大規模な refactor は対象外とする。リファクタリングは以下 3 観点の **可読性・重複排除** に限定する。

| 観点 | 適用範囲 |
|------|---------|
| (1) SQL コメントの明瞭さ | `0026_*.sql`（前提 / 目的 / AC 参照を明記） |
| (2) DEFAULT 値の SSOT 整合 | `0026_*.sql` の `CREATE TABLE member_status_new`（0002 と完全一致） |
| (3) test の重複削減 | `0026_*.spec.ts`（共通 Arrange helper の検討） |

> **新規ファイルのみのため navigation drift / 既存 import 切り替えは発生しない**（[FB-UI-02-1] の「新規追加 + live import 整合」に該当）。

---

## 8.2 変更内容（対象 / Before / After / 理由）

### (1) SQL コメントの明瞭さ

| 対象 | Before（素の SQL） | After（明瞭化後） | 理由 |
|------|------------------|-----------------|------|
| ファイル冒頭 | コメントなし | `-- 前提: 0025_backfill_member_status.sql 適用済み（orphan 解消済み）` / `-- 目的: member_status.member_id に FK を導入し orphan を DB レベルで構造的に禁止する` | 順序依存（AC-5）と目的（root cause）を migration 自体から自明化。レビュー時に Phase 2 を辿らずとも前提が読める |
| 各ステップ見出し | なし | `-- 1. FK 付き新テーブル` / `-- 2. 既存データを全カラム明示で移行` / `-- 3. 旧テーブル削除 → リネーム` / `-- 4. INDEX 再作成（AC-9）` | 再構築 4 手順の意図をステップ単位で明示。INDEX 再作成漏れ（AC-9）を構造的に防ぐ |
| `PRAGMA` 行 | `PRAGMA foreign_keys = OFF;` | `PRAGMA foreign_keys = OFF;  -- 再構築中は一時 OFF（移行後に ON で検証）` / `PRAGMA foreign_keys = ON;  -- 検証用（実効化は接続単位の運用に依存・AC-6）` | OFF/ON の意図（DROP/RENAME 中の原子性確保 / 接続単位 ON 要否）を行内注記。AC-6 への参照を残す |
| DEFAULT 行 | `DEFAULT 'unknown'` 等 | 同行に `-- DEFAULT は 0002_admin_managed.sql L5-16 と完全一致` を CREATE TABLE 直前へ集約注記 | SSOT が 0002 であることを明示し、将来の手修正による drift を抑止 |

### (2) DEFAULT 値の重複排除（SSOT 整合）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `member_status_new` の 現行10カラム DEFAULT | （独立に再記述するとデフォルト値が drift しうる） | `0002_admin_managed.sql` L5-16 を **唯一の正本** とし、`0026` はそれと **byte 一致** する DEFAULT 句のみを記す（`public_consent='unknown'` / `rules_consent='unknown'` / `publish_state='member_only'` / `is_deleted=0` / `updated_at=(datetime('now'))`） | 移行後の新規 INSERT 既定値が従来と同一になることを保証（非回帰・AC-7）。値の二重定義を「0002 と一致」という制約で論理的に一本化し、不一致は Phase 9 の byte 比較 QA で機械検出する |

> SQLite には DEFAULT を共有 import する機構がないため、物理的な重複排除は不可能。代わりに **「0002 を SSOT とし 0026 はその写し」** という制約を明文化し、検証（Phase 9 §9.5）で drift を機械検知する設計とする。これが本タスクにおける「重複排除の考え方」である。

### (3) test の重複削減（共通 Arrange helper）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| 各 test ケースの Arrange | 各 `it` で `member_identities` への seed INSERT を逐次記述すると重複 | 共通 helper `seedIdentity(env, memberId)`（`member_identities` に最小行を INSERT）を test 冒頭に定義し各ケースから呼ぶ | FK の参照先 seed が全ケース共通のため、Arrange の重複を 1 関数へ集約。可読性向上 + seed 仕様変更時の単一修正点化 |
| migration SQL 読み込み | 各ケースで `readFileSync` 反復 | `beforeAll` / module 先頭で `const MIGRATION_SQL = readFileSync(...)` を 1 度だけ読む | I/O 重複排除。`0025_*.spec.ts` の慣習を踏襲 |
| 適用ヘルパ | `env.db.exec(sql)` を散在 | `applyMigration(env)` 薄 helper（任意・冪等 2 回適用ケースで再利用） | 冪等テスト（AC-4）の 2 回適用が同一経路を通ることを保証 |

> 過剰抽象は避ける。helper は `seedIdentity` / `MIGRATION_SQL` 程度の薄いものに留め、test の可読性（Arrange-Act-Assert）を損なわない範囲とする。

---

## 8.3 過剰設計の棄却（Over-Engineering Rejected）

| 棄却項目 | 理由 |
|---------|------|
| 他テーブル（`member_attendance` / `member_tags`）への FK 同時導入 | スコープ外（§10.5 で別タスク候補として記録）。本サイクルは `member_status` 1 テーブルに限定 |
| migration を汎用「FK 後付けユーティリティ」へ一般化 | 前例ゼロの 1 回限り再構築に対し汎用化は YAGNI。1 ファイル直書きが最も読める |
| DEFAULT 値を共有 SQL fragment 化 | SQLite に import 機構がなく、ツールチェーンを増やすだけで価値が出ない。SSOT 制約 + 検証で代替 |
| `PRAGMA foreign_keys` を migration runner 全体で常時 ON 化 | 接続単位の運用機構はスコープ外（§10.5 別 followup 候補）。本タスクは migration 内検証 + runbook 記録に留める |
| test を E2E（実 D1 binding）化 | in-memory（miniflare D1）contract test + runbook（本番 binding）の二段で AC-6 を充足。実 binding test は CI コスト過大で不採用 |

---

## 8.4 navigation / import drift 確認

| 確認 | 結果 |
|------|------|
| 既存ファイルの import 切り替え | **なし**（製品コード非接触） |
| 既存 test の参照先変更 | `member_status` seed / upsert を持つ既存 D1 fixtures のみ FK 前提へ追従 |
| `setupD1()` 経路 | 既存。新規 `0026_*.sql` は `migrations/*.sql` 昇順全件適用で自動的に test に取り込まれる（再配線不要） |

> 新規追加のみのため navigation drift は構造的に発生しない。[FB-UI-02-1] の「新規ファイル追加 + live import 整合」基準に合致。

---

## 8.5 判定

| 判定軸 | 結果 |
|--------|------|
| SQL コメント明瞭さ（前提 / 目的 / AC 参照） | 適用済み |
| DEFAULT 値 SSOT 整合（0002 と byte 一致制約） | 明文化済み（検証は Phase 9） |
| test 重複削減（共通 Arrange helper） | `seedIdentity` / `MIGRATION_SQL` へ集約 |
| 過剰設計棄却 | 5 件記録 |
| navigation / import drift | なし（新規のみ） |
| **総合** | **PASS → Phase 9（品質保証）へ進行** |
