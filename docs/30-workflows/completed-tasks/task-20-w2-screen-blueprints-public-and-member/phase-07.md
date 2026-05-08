# Phase 07 — AC マトリクス

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

## 0. 目的

AC-1〜13 × 検証コマンド × 不変条件 × evidence の N:M トレーステーブルを確定する。本表は Phase 9 / Phase 10 / Phase 11 で完了判定の唯一の根拠となる。

## 1. AC マトリクス（N:M トレース）

| AC | 検証カテゴリ | 主検証コマンド | 不変条件 | evidence path |
|----|-------------|---------------|---------|--------------|
| AC-1 | T7 行数 inventory | `wc -l 09e-...md` で実体と行数を記録 | — | `outputs/phase-11/evidence/wc-lines.log` |
| AC-2 | T7 行数 inventory | `wc -l 09f-...md` で実体と行数を記録 | — | `outputs/phase-11/evidence/wc-lines.log` |
| AC-3 | T1 章立て | `grep -cE '^## [0-9]+\. ' 09e-...md` = 7 | — | `outputs/phase-11/evidence/grep-section-count.log` |
| AC-4 | T1 章立て | `grep -cE '^## [0-9]+\. ' 09f-...md` = 3 | — | `outputs/phase-11/evidence/grep-section-count.log` |
| AC-5 | T1 sub-section | 全 8 画面で 7 以上の節があり、節タイトルが実装責務に対応 | — | `outputs/phase-11/evidence/grep-section-count.log` |
| AC-6 | T4 コピー原文 | `grep -E 'input\|sent\|unregistered\|deleted\|rules_declined\|error' 09f-...md` で 5+1 状態 hit | #5 D1 直接アクセス禁止（auth は API 経由） | `outputs/phase-11/evidence/grep-copy-text.log` |
| AC-7 | T4 コピー原文 | `grep -E 'banner\|summary\|request\|delete' 09f-...md` で 4 領域 hit | #2 consent / #3 responseEmail | `outputs/phase-11/evidence/grep-copy-text.log` |
| AC-8 | manual review | phase-3 §3 §5.2 派生ルールの転記確認（register / privacy / terms 各 §冒頭） | #1 form schema 焼き付け禁止 / #7 Google Form 再回答 | `outputs/phase-10/main.md` review note |
| AC-9 | T2 視覚値 4 種 | `grep -nE '#[0-9a-fA-F]{3,8}\b\|oklch\(\|\b[0-9]+px\b\|\bbg-\['` 0 件 | #4 admin-managed data 分離（token は 09b 一元管理） | `outputs/phase-11/evidence/grep-visual-values.log` |
| AC-10 | T3 API trace | 現行 API 正本と §X.4 の `(method, endpoint, route)` 集合一致 | #5 D1 直接アクセス禁止 | `outputs/phase-11/evidence/grep-api-trace.log` |
| AC-11 | invariants grep | `grep` で `publicConsent` / `rulesConsent` のみ使用、`responseEmail` system field 注記、D1 binding 不出現 | #2 / #3 / #5 / #6 / #7 | `outputs/phase-11/evidence/grep-invariants.log` |
| AC-12 | T6 markdown validation | lint script 未定義時は JSON parse + grep gates で代替 | — | `outputs/phase-11/evidence/markdown-lint.log` |
| AC-13 | T8 link check | `! grep -nE '§TBD'` / 9 series link 全画面記述 | — | `outputs/phase-11/evidence/link-check.log` |

## 2. 不変条件 × AC 対応

| 不変条件 | 関連 AC | 検証 |
|---------|--------|------|
| #1 実フォーム schema をコードに固定しすぎない | AC-8 | register §4.1 で派生ルールのみ記述、form 項目を spec に焼き付けないことを review |
| #2 consent キー `publicConsent` / `rulesConsent` 統一 | AC-11 | grep で `consent` を含む行が `publicConsent` / `rulesConsent` のいずれかのみ |
| #3 `responseEmail` は system field | AC-11 | grep `responseEmail` が出現する場合は system field 注記を伴う |
| #4 admin-managed data 分離 | AC-9 / AC-10 | §X.4 API 表に `/admin/*` が含まれない |
| #5 D1 直接アクセスは `apps/api` に閉じる | AC-6 / AC-10 / AC-11 | grep `D1` / `d1_databases` 0 件 |
| #6 GAS prototype を本番仕様に昇格させない | §99 不採用 | grep `gas-prototype` が §99 のみに出現（本編 0 件） |
| #7 MVP では Google Form 再回答が本人更新の正式経路 | AC-8 | register §4.4 で responderUrl 外部 link が API 表に並記 |

## 3. 異常系 × AC 対応

| 異常系（Phase 6） | 関連 AC | block レベル |
|------------------|--------|------------|
| 1.1 コピー原文ドリフト | AC-6 / AC-7 | block |
| 1.2 API 表ドリフト | AC-10 | block |
| 1.3 視覚値混入 | AC-9 | block |
| 1.4 login 5+1 状態欠落 | AC-6 | block |
| 1.5 不採用要素混入 | AC-8 / §99 | warn |
| 1.6 mermaid 構文エラー | AC-5 | block |
| 1.7 placeholder 残存 | AC-13 | block |
| 1.8 行数 inventory 欠落 | AC-1 / AC-2 | warn |
| 1.9 不変条件違反 | AC-11 | block |

## 4. 完了判定マトリクス

Phase 11 で全 evidence が PASS のとき、次の集計表が成立する:

| evidence ファイル | 期待 | 担当 AC |
|-----------------|------|---------|
| `wc-lines.log` | 09e / 09f 実体あり、行数記録済 | AC-1, AC-2 |
| `grep-section-count.log` | 09e=7 / 09f=3 + sub-section 全画面充足 | AC-3, AC-4, AC-5 |
| `grep-visual-values.log` | 末尾に `GREP_ZERO_HITS` | AC-9 |
| `grep-api-trace.log` | 現行 API 正本と一致 | AC-10 |
| `grep-copy-text.log` | login 5+1 状態 / profile 4 領域 hit | AC-6, AC-7 |
| `markdown-lint.log` | lint unavailable 時は PASS_WITH_SUBSTITUTION | AC-12 |
| `link-check.log` | placeholder 0 / dead link 0 | AC-13 |
| `grep-invariants.log` | consent / responseEmail / D1 違反 0 | AC-11 |
| review note | phase-3 §3 §5.2 派生ルール転記済 | AC-8 |

## 5. 次フェーズへの引き渡し

phase-08（DRY 化）に渡す:

- AC-13 link 戦略の format 固定対象（§X.7）
- AC-9 / AC-10 / AC-11 の grep gate 確定
