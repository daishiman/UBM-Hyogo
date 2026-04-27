# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 7 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-06（異常系検証） |
| 下流 | phase-08（DRY 化） |

## 目的

Phase 1 で確定した AC-1〜AC-13 と、Phase 4 のテスト ID（U-XX / C-XX / E-XX）、Phase 5 のランブック手順（R-XX）、Phase 6 の failure case（F-XX）を一対多で紐付ける表（AC matrix）を `outputs/phase-07/ac-matrix.md` に固定する。未トレース AC 0 件、重複 0 件、責務分離（認証 vs 認可、route vs middleware）の明示を達成し、Phase 8 へ DRY 化候補を引継ぐ。

## 実行タスク

1. AC × test ID × runbook step × failure case の対応表（AC-1〜AC-13）
2. 未トレース AC の検出と是正
3. 重複 / 漏れの排除（特に AC-3〜AC-5 で OAuth 検証段階の責務を分離）
4. UT-03（Service Account 認証）と secret 名共有 AC の整合確認
5. 不変条件 #5 / #6 への参照固定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-13 |
| 必須 | outputs/phase-04/test-matrix.md | unit / contract / E2E test ID |
| 必須 | outputs/phase-05/runbook.md | runbook step |
| 必須 | outputs/phase-06/main.md | failure case F-XX |
| 参考 | docs/30-workflows/unassigned-task/UT-11-google-oauth-admin-login-flow.md | 元仕様の完了条件 13 項目 |
| 参考 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | secret 名共有時の責務分離 |
| 参考 | CLAUDE.md | 不変条件 #5 / #6 |

## 実行手順

### ステップ 1: AC matrix

| AC | 内容 | unit / contract / E2E test ID | runbook step | failure case |
| --- | --- | --- | --- | --- |
| AC-1 | `/api/auth/login` が Google 認可 URL へ 302 redirect | U-01, C-01, E-01 | R-04 | F-01 |
| AC-2 | PKCE (S256) 有効・`code_verifier` HttpOnly Cookie 一時保存 | U-02, U-03, C-01 | R-04 | F-02 |
| AC-3 | callback の state 不一致時 400 | U-04, C-02 | R-05 | F-03 |
| AC-4 | ホワイトリスト外 email で 403 | U-05, C-03, E-02 | R-06 | F-04, F-05 |
| AC-5 | ホワイトリスト合致で session Cookie 発行 + `/admin` 302 | C-04, E-03 | R-07 | F-06 |
| AC-6 | session Cookie 属性 `HttpOnly; Secure; SameSite=Lax` | U-06, C-04 | R-07 | F-07 |
| AC-7 | `/admin/*` 未認証時 `/login` redirect（middleware） | U-07, C-05, E-04 | R-08 | F-08, F-09 |
| AC-8 | `/api/auth/logout` で session Cookie 失効 + `/login` 戻り | U-08, C-06, E-05 | R-09 | F-10 |
| AC-9 | `wrangler pages dev` でローカル動作確認手順が runbook に存在 | E-06（local） | R-01, R-02, R-03 | - |
| AC-10 | `.dev.vars` が `.gitignore` に登録済み | gitleaks（Phase 9）, lint | R-01 | - |
| AC-11 | redirect URI 3 環境分が Google Cloud Console に登録 | smoke（Phase 11） | R-10 | F-01 |
| AC-12 | `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` が Cloudflare Secrets に配置 | smoke + secret list（Phase 9） | R-11, R-12 | - |
| AC-13 | runbook に新規管理者追加手順（allowlist → secret → redeploy） | doc review（Phase 12） | R-13 | F-11 |

> 注: test ID / runbook step / failure case 番号は Phase 4・5・6 の確定値を引用する。本 Phase ではプレースホルダではなく、上流 Phase の正本に対する参照を固定する。

### ステップ 2: 未トレース AC 検出

- AC-1〜AC-13 すべてが (test ID または smoke / doc review) と runbook step に対応
- 未トレース 0 件
- AC-9 / AC-11 / AC-13 は仕様性質上 unit test では covered せず、E2E もしくは smoke / doc review で担保（その旨を本表に明記）

### ステップ 3: 重複 / 漏れ排除

| 観点 | 重複候補 | 整理結果 |
| --- | --- | --- |
| state vs PKCE | AC-2（PKCE）と AC-3（state） | 役割分離: PKCE は token 交換時の改ざん防止、state は CSRF 対策。両方必須 |
| 認証 vs 認可 | AC-4（authorize: ホワイトリスト）と AC-5（session 発行） | 認証成功 ≠ 認可成功。AC-4 で deny、AC-5 で allow を分離 |
| route gate vs middleware gate | AC-5（callback redirect）と AC-7（`/admin/*` middleware） | callback は発行のみ、middleware は継続的 gate。二段防御 |
| Cookie 属性 vs Cookie ライフサイクル | AC-6（属性）と AC-8（失効） | 属性 spec と失効 spec を別 AC として保持 |
| secret 配置 vs runbook | AC-12（secret 配置）と AC-13（運用手順） | 配置 fact と運用 procedure を分離 |

### ステップ 4: UT-03 との secret 共有 AC 整合

| 観点 | UT-11 側 | UT-03 側 | 整合状態 |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Authorization Code Flow で利用 | Service Account では別 secret 群（`GOOGLE_SHEETS_SA_*` 想定）を利用 | 名前衝突なし |
| `SESSION_SECRET` | UT-11 専用（新規） | UT-03 では未使用 | 衝突なし |
| `ADMIN_EMAIL_ALLOWLIST` | UT-11 専用（新規） | UT-03 では未使用 | 衝突なし |
| Phase 12 名前空間レビュー | ADR R8 で明記 | 同 | 後続で追跡 |

### ステップ 5: AC vs 不変条件マッピング

| AC | 関連不変条件 | 担保方法 |
| --- | --- | --- |
| AC-4, AC-5, AC-7 | #5（apps/web → D1 禁止） | 本タスクは D1 を使わず、ホワイトリストは Secret、session は JWT Cookie |
| AC-2 | #6（GAS prototype 不昇格） | Web Crypto API で PKCE 実装、GAS の認証ロジックを流用しない |
| AC-10, AC-12 | secret hygiene | `.dev.vars` が `.gitignore`、Cloudflare Secrets で配置 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | session / cookie / state / pkce helper の重複候補を引継ぎ |
| Phase 9 | AC-10 / AC-12 を gitleaks と secret list に紐付け |
| Phase 10 | GO/NO-GO 判定の根拠（全 AC が green か） |
| Phase 11 | AC-11 redirect URI 3 環境を smoke 対象に |
| Phase 12 | AC-13 を implementation-guide の運用手順章へ |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5 (apps/web → D1 禁止) | AC-4, AC-5, AC-7 が D1 を使わず実現される | #5 |
| #6 (GAS prototype 不昇格) | AC-2 が Web Crypto API で実装される | #6 |
| セキュリティ | AC-2（PKCE）, AC-3（state）, AC-6（Cookie 属性）が同時に成立 | - |
| 認可境界 | AC-4（deny path）と AC-5（allow path）が独立した AC として残る | - |
| 観測性 | AC-3 / AC-4 / AC-7 の deny 経路が failure case と紐付く | - |
| 運用性 | AC-9 / AC-11 / AC-13 が runbook / smoke / doc review でカバー | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 表（13 行） | 7 | pending | AC-1〜AC-13 全行 |
| 2 | 未トレース検出 | 7 | pending | 0 件確認 |
| 3 | 重複排除 | 7 | pending | 5 観点で責務分離明示 |
| 4 | UT-03 secret 整合 | 7 | pending | 衝突なし確認 |
| 5 | 不変条件マッピング | 7 | pending | #5 / #6 紐付け |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × test ID × runbook × failure |
| メタ | artifacts.json | phase 7 status |

## 完了条件

- [ ] AC-1〜AC-13 すべてが対応関係を持つ
- [ ] 未トレース 0 件
- [ ] 重複なし（責務分離が 5 観点で明示）
- [ ] UT-03 と secret 名衝突なしを確認
- [ ] 不変条件 #5 / #6 が AC マッピング表に反映

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスクが completed
- [ ] 2 種ドキュメント（main.md, ac-matrix.md）配置
- [ ] 全 13 AC が表に含まれる
- [ ] 不変条件 #5 / #6 への紐付けが明示
- [ ] 次 Phase へ DRY 化対象（pkce / state / session / cookie helper）を引継ぎ

## 次 Phase

- 次: 8（DRY 化）
- 引き継ぎ事項: pkce / state / session / cookies / allowlist の重複候補と命名候補を抽出
- ブロック条件: 未トレース AC があれば進まない
