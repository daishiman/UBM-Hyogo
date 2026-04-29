# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

採用案 A に対する unit / contract / E2E / authorization の test を設計する。AC-1〜AC-10 を test 行（test ID）と紐付け、Wave 8a の contract test と Wave 8b の Playwright がそのまま流用できる粒度で固定する。

## 実行タスク

1. test 階層と責務分担確定（unit / contract / E2E）
2. AuthGateState 5 状態 × 2 系統（POST / GET）の test 行列
3. token lifecycle test（発行 / 期限切れ / 二重使用）
4. レートリミット test
5. apps/web → apps/api proxy の認可境界 test

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-10 |
| 必須 | outputs/phase-02/api-contract.md | I/O |
| 必須 | outputs/phase-03/main.md | 採用案 |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | gate state 状態 |

## 実行手順

### ステップ 1: verify suite 設計

| layer | 対象 | tool | 担当 task |
| --- | --- | --- | --- |
| unit | gate-state-resolver / magic-token-issuer / verifier | vitest | 本 task |
| contract | `POST /auth/magic-link` / `GET /auth/gate-state` / callback | vitest + miniflare | 08a で全体実行 |
| E2E | `/login` 5 状態 × Magic Link 送信 → callback → `/profile` | Playwright | 08b で全体実行 |
| authorization | gate-state public でも token 発行は条件付き | vitest | 08a |
| security | レートリミット / 列挙攻撃 | vitest + curl | 11 |

### ステップ 2: AuthGateState test matrix

| AC | state | POST 結果 | GET 結果 | D1 magic_tokens insert | mail 送信 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | unregistered | `{state:"unregistered"}` | `{state:"unregistered"}` | 0 件 | なし |
| AC-2 | rules_declined | `{state:"rules_declined"}` | `{state:"rules_declined"}` | 0 件 | なし |
| AC-3 | deleted | `{state:"deleted"}` | `{state:"deleted"}` | 0 件 | なし |
| AC-4 | sent (有効 user) | `{state:"sent"}` | `{state:"input"}` で OK 相当（gate-state はあくまで判定用、UI が "input" 表示） | 1 件 | 1 通 |

### ステップ 3: token lifecycle test

| ID | シナリオ | 期待 |
| --- | --- | --- |
| T-01 | 有効 token を callback に渡す | session 確立 + `used_at` 更新 |
| T-02 | 期限切れ token | `401`、session 作らない（AC-5） |
| T-03 | 二回目使用 | `401`、`used_at` 既存値で判定（AC-6） |
| T-04 | 不正な署名 | `401` |
| T-05 | 別 user の email でアクセス | `401` |

### ステップ 4: レートリミット test

| ID | シナリオ | 期待 |
| --- | --- | --- |
| R-01 | 同一 email で 1h 以内に 6 回 POST | 6 回目以降 `429` |
| R-02 | 異なる email で交互に 100 回 | 各 email 1 回ずつなら全て成功 |

### ステップ 5: 認可境界 test

| ID | シナリオ | 期待 |
| --- | --- | --- |
| Z-01 | apps/web から D1 直接 import 試行 | ESLint で error |
| Z-02 | gate-state の response に memberId を含めない | snapshot test |
| Z-03 | session callback で `isAdmin` を解決し session に積む | 単体 test |

### ステップ 6: a11y / UI 観点（08b へ引き渡し）

- `/login` 状態切替時の `aria-live` を確認
- メール本文に plain text alternative を含む

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | test ID を実装ランブックの完了条件に組み込む |
| Phase 6 | 異常系の追加（ネットワーク障害、mail provider 502） |
| Phase 7 | AC × test ID 対応表 |
| 08a | contract test の入力 |
| 08b | E2E シナリオの入力 |

## 多角的チェック観点

- 不変条件 #5: Z-01 で apps/web → D1 直接 import を阻止
- 不変条件 #9: `/login` の 5 状態 E2E が `/no-access` redirect を行わないことを確認
- 不変条件 #10: R-01 のレートリミット成立で D1 writes を抑制
- 認可境界: Z-02 で memberId 漏洩防止

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite 表 | 4 | pending | layer × tool |
| 2 | AuthGateState matrix | 4 | pending | AC-1〜AC-4 |
| 3 | token lifecycle test | 4 | pending | T-01〜T-05 |
| 4 | rate limit test | 4 | pending | R-01〜R-02 |
| 5 | 認可境界 test | 4 | pending | Z-01〜Z-03 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 サマリ |
| ドキュメント | outputs/phase-04/test-matrix.md | AC × test ID × layer × tool |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] AC-1〜AC-10 がいずれかの test ID と紐付き
- [ ] token lifecycle が T-01〜T-05 で網羅
- [ ] レートリミット test が設計済み
- [ ] ESLint rule で apps/web → D1 を阻止する Z-01 が記載

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- 2 種ドキュメント（main.md / test-matrix.md）配置
- 全 AC が test ID と対応
- 不変条件 #5, #9, #10 への対応 test を含む
- 次 Phase へ test ID リストを引継ぎ

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: test ID を runbook の完了条件として参照
- ブロック条件: AC × test ID 対応に欠落があれば進まない

## verify suite

| layer | tool | scope | 期待件数 |
| --- | --- | --- | --- |
| unit | vitest | gate-state-resolver / magic-token-issuer / verifier | 12 件以上 |
| contract | vitest + miniflare | 3 endpoints × 5 状態 | 15 件以上 |
| E2E | Playwright (08b) | `/login` 5 状態 → callback → `/profile` | 5 件以上 |
| authz | vitest | apps/web → D1 直接禁止 lint | 3 件 |
| security | curl + script | レートリミット | 2 件 |
