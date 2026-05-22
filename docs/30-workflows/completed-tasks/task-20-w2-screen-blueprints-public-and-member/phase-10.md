# Phase 10 — 最終レビュー

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

## 0. 目的

元タスク §8 DoD（11 項目）と本仕様書 AC-1〜13 を最終突合し、GO / NO-GO 判定を確定する。

## 1. 元タスク §8 DoD 再掲チェック

| # | DoD 項目 | 関連 AC | 検証 evidence |
|---|---------|--------|--------------|
| 1 | `09e-screen-blueprints-public.md` が新規作成・公開 6 画面 + §99 を含む | AC-1 | `wc-lines.log` / `section-count.log` |
| 2 | `09f-screen-blueprints-member.md` が新規作成・会員 2 画面 + §99 を含む | AC-2 | `wc-lines.log` / `section-count.log` |
| 3 | 09e に §1〜§6 + §99（公開 6 + 不採用） | AC-3 | `section-count.log` |
| 4 | 09f に §1〜§2 + §99（会員 2 + 不採用） | AC-4 | `section-count.log` |
| 5 | 全 8 画面で実装に必要な 7 以上の節揃い | AC-5 | `section-count.log` sub-section |
| 6 | login 5+1 状態（input/sent/unregistered/deleted/rules_declined/error）が 09f §1.3 mermaid に列挙 | AC-6 | `grep-copy-text.log` |
| 7 | /profile 4 領域（banner/summary/request/delete）が 09f §2 で網羅 | AC-7 | `grep-copy-text.log` |
| 8 | register / privacy / terms は phase-3 §3 派生ルール正本転記 | AC-8 | review note |
| 9 | 視覚値（HEX / oklch / px / bg-arbitrary-class) が §6.2 grep で 0 件 | AC-9 | `grep-visual-values.log` |
| 10 | 現行 API 正本と §X.4 の API 表が一致 | AC-10 | `grep-api-trace.log` |
| 11 | consent キー / responseEmail / D1 直接アクセス禁止 等の不変条件が反映 | AC-11 | `grep-invariants.log` |
| 12 | markdown validation（lint script 未定義時は代替証跡） | AC-12 | `markdown-lint.log` |
| 13 | 09c / 09b / 09d / 09a への link が全画面で記述 | AC-13 | `placeholder.log` |

## 2. AC ↔ DoD 完全対応の確認

| AC | DoD # |
|----|-------|
| AC-1 | 1 |
| AC-2 | 2 |
| AC-3 | 3 |
| AC-4 | 4 |
| AC-5 | 5 |
| AC-6 | 6 |
| AC-7 | 7 |
| AC-8 | 8 |
| AC-9 | 9 |
| AC-10 | 10 |
| AC-11 | 11 |
| AC-12 | 12 |
| AC-13 | 13 |

漏れなし。AC は DoD と 1:1 対応。

## 3. GO / NO-GO 判定基準

| 判定 | 条件 |
|------|------|
| GO | DoD 13 項目すべて PASS、Phase 9 G1〜G10 全 PASS または G9 `PASS_WITH_SUBSTITUTION`、Phase 6 異常系 block 違反 0 |
| NO-GO | 上記いずれか 1 項目でも FAIL or block |

## 4. レビュー観点

### 4.1 spec 整合性

| 観点 | 確認 |
|------|------|
| 章立て | 09e 7 / 09f 3（§99 含む） |
| sub-section | 全 8 画面で実装責務に対応する 7 以上の節 |
| API 表 | 現行 API 正本と一致（method × endpoint × route） |
| mermaid | 標準状態 + login 5+1 状態 |
| 不採用 | §99 4+1 行表 |

### 4.2 不変条件遵守

| 不変条件 | 確認 |
|---------|------|
| #1 form schema 焼き付け禁止 | register §4 で派生ルールのみ |
| #2 consent キー | `publicConsent` / `rulesConsent` のみ |
| #3 responseEmail | system field 注記必須 |
| #4 admin-managed data 分離 | §X.4 に `/admin/*` 不出現 |
| #5 D1 直接アクセス禁止 | D1 binding 不出現 |
| #6 GAS prototype 昇格禁止 | §99 に明記、本編 0 件 |
| #7 Google Form 再回答 | register §4.4 で responderUrl 並記 |

### 4.3 9 series link 戦略

| 確認 | 内容 |
|------|------|
| §X.7 format | token / primitive / icon / prototype-map(optional) の固定順序 |
| placeholder | 並列タスク未確定 §は `§TBD` で明示、Phase 11 までに解決 |
| content copy | なし（§番号のみ） |

## 5. 後続タスク（task-11..14）への引き渡し条件

| 後続 | 必要条件 | 確認 |
|------|---------|------|
| task-11（public top + member list） | 09e §1 / §2 が「読んで 1 ファイル書ける」決定論的状態 | §X.1〜§X.7 全節揃い + API 表完全一致 |
| task-12（detail + register） | 09e §3 / §4 が同上 | 同上 |
| task-13（login） | 09f §1 が login 5+1 状態 mermaid を含む | AC-6 PASS |
| task-14（my profile + requests） | 09f §2 が profile 4 領域を網羅 | AC-7 PASS |

## 6. 最終レビュー成果物

`outputs/phase-10/main.md` に以下を記録:

- DoD 11 項目 × PASS / FAIL 表
- AC ↔ DoD 1:1 対応表
- 不変条件 7 項目遵守確認
- GO / NO-GO 判定（最終 1 行）
- review note（AC-8 の派生ルール転記確認 / G11 不採用要素混入の有無）

## 7. 次フェーズへの引き渡し

phase-11（実装 smoke）に渡す:

- GO 判定（または NO-GO 判定の場合は再走指示）
- evidence path 一覧
- AC ↔ DoD 1:1 トレース完了状態
