# Phase 7 — AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 7 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-06（異常系検証） |
| 下流 | phase-08（DRY 化） |

## 目的

Phase 1 で確定した AC-1〜AC-10 と、Phase 4 の test ID（S-XX / G-XX / R-XX / Z-XX / C-XX）、Phase 5 のランブック手順（O-XX / S-XX）、Phase 6 の failure case（F-XX）を一対多で紐付ける表（AC matrix）を outputs/phase-07/ac-matrix.md に固定する。

## 実行タスク

1. AC × test ID × runbook step × failure case の対応表
2. 未トレース AC の検出
3. 重複 / 漏れの排除
4. 05b との session 共有 AC（AC-9）の整合確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-05/runbook.md | runbook step |
| 必須 | outputs/phase-06/main.md | failure case |
| 参考 | doc/02-application-implementation/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-07/ac-matrix.md | 共有 AC の整合 |

## 実行手順

### ステップ 1: AC matrix

| AC | 内容 | unit / contract / E2E test ID | runbook step | failure case |
| --- | --- | --- | --- | --- |
| AC-1 | OAuth → session.user.memberId 一致 | S-01, S-02, R-04, R-05 | S-06, S-07 | F-04, F-09 |
| AC-2 | unregistered email → session 作らない | S-03, R-01 | S-03 | F-04 |
| AC-3 | admin_users 登録 → isAdmin=true | S-02, R-05 | S-07 | - |
| AC-4 | `/admin/*` 画面 gate | G-01, G-02, G-03, G-07, G-08 | S-08, S-10 | F-12, F-15, F-16 |
| AC-5 | `/admin/*` API gate | G-04, G-05, G-06 | S-09 | F-13, F-14 |
| AC-6 | secrets 平文不在 | gitleaks (Phase 9) | wrangler secret put | - |
| AC-7 | infra 04 secrets リスト準拠 | infra 04 cross-check | ステップ 2 | - |
| AC-8 | JWT 改ざん検出 | S-06, G-08 | S-11 | F-09, F-11 |
| AC-9 | OAuth と Magic Link で同 memberId | C-01, C-02, C-03 | session-resolve 共有 | - |
| AC-10 | middleware が edge runtime で動く | E2E (Cloudflare Workers preview) | ステップ 4 | - |

### ステップ 2: 未トレース AC 検出

- AC-1〜AC-10 すべてが test ID と runbook step で対応済み
- 未トレースなし

### ステップ 3: 重複 / 漏れ排除

- AC-4 と AC-5 で「gate」が重複しているように見えるが、AC-4 は middleware（UI 経路）、AC-5 は requireAdmin（API 経路）であり、二段防御として両方必要
- AC-9 の「同 memberId」は 05b 側の AC でもトレースされる（双方の AC matrix に記載）
- AC-7 の infra 04 cross-check は本タスクでは確認のみ。secrets 配置自体は infra 04 が責任

### ステップ 4: 05b との session 共有 AC

| AC | 05a 側 | 05b 側 | 整合状態 |
| --- | --- | --- | --- |
| AC-9 | `/auth/session-resolve` を共有 implementation | 同 endpoint を共有 | OK（ADR で確定） |
| 共通 | session.user shape | 同 | OK（packages/shared の `SessionUser` 型） |
| 共通 | gateReason 値（"unregistered"/"deleted"/"rules_declined"） | 同 | OK |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO 判定の根拠（全 AC が green か） |
| 05b Phase 7 | AC-9 の共有 |
| 08a | contract test 結果と本 matrix を突合 |
| 08b | E2E 結果と本 matrix を突合 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #2 (consent) | AC-2 で rulesConsent 名称を逸脱していない | #2 |
| #5 (apps/web → D1 禁止) | AC-1, AC-2, AC-3 が session-resolve（apps/api 経由）で実現 | #5 |
| #7 (memberId と responseId 分離) | AC-1 の session.user.memberId のみ載る | #7 |
| #9 (`/no-access` 不在) | AC-2, AC-4 で `/login?gate=...` のみ | #9 |
| #10 (無料枠) | AC-7 + Phase 9 で secret hygiene 確認 | #10 |
| #11 (admin gate) | AC-4, AC-5 で二段防御をトレース | #11 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 表 | 7 | pending | 10 行 |
| 2 | 未トレース検出 | 7 | pending | 0 件確認 |
| 3 | 重複排除 | 7 | pending | AC-4/AC-5 の責務分離説明 |
| 4 | 05b 共有 AC 整合 | 7 | pending | AC-9 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × test ID × runbook × failure |
| メタ | artifacts.json | phase 7 status |

## 完了条件

- [ ] AC-1〜AC-10 すべてが対応関係を持つ
- [ ] 未トレース 0 件
- [ ] 重複なし（AC-4/AC-5 の責務分離が明示）
- [ ] 05b との AC-9 整合が確認

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- 2 種ドキュメント配置
- 全 AC が表に含まれる
- 不変条件 #2, #5, #7, #9, #10, #11 が紐付け
- 次 Phase へ DRY 化対象を引継ぎ

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: session callback / requireAdmin / session-resolve の重複候補を抽出
- ブロック条件: 未トレース AC があれば進まない
