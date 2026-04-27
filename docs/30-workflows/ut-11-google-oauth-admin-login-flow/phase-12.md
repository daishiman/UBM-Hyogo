# Phase 12: ドキュメント更新: 6 成果物生成（implementation close-out）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 12 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-11（手動 smoke / VISUAL） |
| 下流 | phase-13（PR 作成） |
| close-out type | implementation |

## 目的

implementation-guide（Part1 中学生レベル / Part2 技術者レベル）/ system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check の **6 成果物** を生成し、本タスク（管理者 Google OAuth + PKCE ログインフロー）の `apps/web` 実装と仕様を後続タスク（管理画面機能タスク群、UT-03 連携）が消費できる状態にする。本タスクは implementation であり、`apps/web` runtime 実装と `docs/30-workflows/ut-11-google-oauth-admin-login-flow/` close-out を対象にする。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜ管理者ログインが必要かを、日常生活の例え話（「会員制施設の入口で身分証を見せる」）で説明する
- [ ] OAuth / PKCE / state / Cookie / JWT といった専門用語はその場で短く説明する（例: PKCE は「途中で誰かに鍵をすり替えられないようにする仕組み」）
- [ ] 何を作るかより先に、困りごと（管理画面が誰でも触れたら危険）と解決後の状態（Google アカウントの本人確認 + ホワイトリスト + Cookie で守る）を書く

### Part 2: 開発者・技術者レベル

- [ ] `apps/web` の route handler / middleware の TypeScript シグネチャを記載
- [ ] PKCE / state / JWT / allowlist の helper 関数 signature を一覧化
- [ ] session JWT の TypeScript 型定義（`SessionJwt = { sub, email, isAdmin, iat, exp }`）
- [ ] env / secrets / redirect URI 一覧、`wrangler secret put` 実行コマンド、Workers 互換 preview 動作確認コマンド
- [ ] エラーハンドリング（state mismatch → 400、ホワイトリスト外 → 403、token error → 502）

## 実行タスク

1. implementation-guide.md（OAuth + PKCE フロー / admin gate / 環境別 redirect URI / UT-03 secret 共有説明）
2. system-spec-update-summary.md（specs/ 改訂候補 5 件）
3. documentation-changelog.md（本タスクで作成した 13 phase + outputs の変更履歴）
4. unassigned-task-detection.md（本タスクで触れない責務、B-02 / B-04 の記録）
5. skill-feedback-report.md（task-specification-creator skill への feedback）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/architecture.md | OAuth + PKCE Mermaid 構造図 |
| 必須 | outputs/phase-02/api-contract.md | endpoint signature |
| 必須 | outputs/phase-02/admin-gate-flow.md | middleware 責務 |
| 必須 | outputs/phase-02/secrets.md | env / secrets / redirect URI |
| 必須 | outputs/phase-05/runbook.md | 実装ランブック |
| 必須 | outputs/phase-07/ac-matrix.md | AC-1〜AC-13 trace |
| 必須 | outputs/phase-10/main.md | GO 判定 + B-01〜B-04 |
| 必須 | outputs/phase-11/main.md | smoke 結果（VISUAL evidence） |
| 必須 | CLAUDE.md | 不変条件 #5 / #6、シークレット管理方針 |
| 参考 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | OAuth client 共有・secret 名衝突確認 |

## 実行手順

### ステップ 1: implementation-guide.md（Part 1 中学生レベル → Part 2 技術者レベル）

**Part 1（中学生レベル）**
- 「Google でログイン」ボタンが管理者の主導線。Google アカウントで本人確認できた人だけが管理画面に入れる
- 「管理者リスト（ホワイトリスト）に書いてある email」だけが OK。書いてない人は 403（拒否画面）
- 入った後は **Cookie**（小さな通行証）が 24 時間有効。期限切れたら再ログイン
- 通行証の中身は「email と『管理者です』」の最小情報のみ。本人の詳細プロフィールは入れない（漏れても被害最小）
- 通信途中で誰かに鍵をすり替えられないように **PKCE** という仕組みを使う（合鍵を行きと帰りで突き合わせる）
- 偽の callback 攻撃を防ぐため **state** という使い捨てのチケットを行きで発行し、帰りで照合する
- ローカル開発は Workers 互換 preview を使う。secret は `.dev.vars` に書き、git には絶対に push しない（`.gitignore` 済み）

**Part 2（技術者レベル）**

| 項目 | 詳細 |
| --- | --- |
| task root | docs/30-workflows/ut-11-google-oauth-admin-login-flow |
| key outputs | outputs/phase-02/architecture.md, api-contract.md, admin-gate-flow.md, secrets.md, outputs/phase-05/runbook.md, outputs/phase-07/ac-matrix.md |
| upstream | 01c-parallel-google-workspace-bootstrap（OAuth client 配置済）, 02-serial-monorepo-runtime-foundation（apps/web/api 構成） |
| downstream | 管理画面機能タスク全般（ログイン済み管理者前提で着手可）, UT-03（OAuth client 共有） |
| validation focus | OAuth callback → state 検証 → token 交換 → ホワイトリスト照合 → session JWT 発行 → admin gate（middleware） |
| shared with UT-03 | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`（同一 OAuth client、Service Account 認証とは別系統） |
| known constraints | B-01（exp 切れたら再ログイン、refresh は MVP 外）, B-02（Google verification 申請は MVP 後）, B-04（プレビュー URL は redirect URI に登録しない） |

**接続図 (apps/web ↔ Google ↔ admin)**:

```
[Browser] --click /login--> [apps/web /api/auth/login]
   --gen verifier+state, set temp Cookie--> [Google OAuth (S256)]
   --consent--> [apps/web /api/auth/callback/google]
   --verify state vs Cookie + token exchange + userinfo--> [verify allowlist]
   --sign JWT (HS256, SESSION_SECRET)--> [Set-Cookie session]
   --302 /admin--> [Browser]
[Browser] --/admin/*--> [apps/web/middleware.ts]
   --verifySessionJwt + isAdmin--> [next() or /login]
[Browser] --/api/auth/logout--> [Set-Cookie session=; Max-Age=0; --> /login]
```

**TypeScript 型定義（最小版）**

```ts
type SessionJwt = {
  sub: string;     // = email
  email: string;
  isAdmin: true;   // 発行時点でホワイトリスト合致が前提
  iat: number;
  exp: number;     // 24h
};
```

### ステップ 2: system-spec-update-summary.md

| spec | 改訂候補 | 理由 |
| --- | --- | --- |
| .claude/skills/aiworkflow-requirements/references/security-principles.md | 管理者向け OAuth + PKCE フロー、state-bound `next`、Cookie 属性 | 本タスクで確定 |
| .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | `apps/web` Route Handler / middleware がログインフローを所有し、`apps/api` は消費側に留まる境界 | 全体像 |
| .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` / `AUTH_REDIRECT_URI` の配置方針 | Secrets 運用 |
| docs/30-workflows/unassigned-task/UT-11-google-oauth-admin-login-flow.md | implementation 完了マーク、本タスクへのリンク | 元仕様の close-out |

### ステップ 3: documentation-changelog.md

| 日付 | 変更 | 影響範囲 |
| --- | --- | --- |
| 2026-04-27 | UT-11 task spec 作成（13 phase + outputs） | docs/30-workflows/ut-11-google-oauth-admin-login-flow/ |
| 2026-04-27 | 管理者 OAuth + PKCE フロー方針を確定（HS256 JWT Cookie / Web Crypto API） | apps/web auth 系 |
| 2026-04-27 | session JWT に profile / picture / 個人情報を載せない方針を確定 | 不変条件 #5 補強 |
| 2026-04-27 | `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` を新規 secret として追加 | Cloudflare Secrets / `.dev.vars` |
| 2026-04-27 | `AUTH_REDIRECT_URI` を環境別 wrangler vars として追加 | local / staging / production |
| 2026-04-27 | UT-03 と OAuth client を共有（secret 名衝突なしを確認） | UT-03 連携 |

### ステップ 4: unassigned-task-detection.md

| 未割当責務 | 想定 task | 暫定対応 |
| --- | --- | --- |
| Google OAuth verification 申請（外部公開時） | 別タスク（運用） | MVP は testing user で運用、prod release 前に申請（B-02） |
| プレビューデプロイ URL の OAuth redirect 整合 | 別タスク（CI/CD） | プレビュー URL を redirect URI に登録しない方針を遵守（B-04）。staging 固定 URL に集約 |
| session refresh / silent renewal | 別タスク（拡張） | MVP は 24h 期限で十分、refresh は不要（B-01） |
| OAuth callback / allowlist deny の audit log | 別タスク（観測性） | 構造化ログのみ残す。永続 audit log は将来 D1 化 |
| ホワイトリスト管理 UI | 別タスク（運用 UX） | MVP は Secret 文字列直接編集 |
| 通常ユーザー（バンドマン）認証 | 別タスク（Magic Link 等） | 本タスクは管理者専用 |
| 2FA | 別タスク（セキュリティ強化） | MVP では Google アカウント側の 2FA に依存 |

### ステップ 5: skill-feedback-report.md

| 観点 | feedback |
| --- | --- |
| task-specification-creator | OAuth + PKCE 系タスクは Phase 2 で「Cookie 属性まとめ表」「state / verifier / session の 3 Cookie 表」を必ず出すと Phase 6 / Phase 11 のチェック項目が漏れにくい |
| invariants 引用 | 不変条件 #5（apps/web から D1 直接禁止）と #6（GAS prototype 不採用）を Phase 1〜10 全てに番号付きで紐付ける運用が機能した |
| 改善提案 | OAuth provider タスクでは Phase 5 runbook に「redirect URI を Google Cloud Console に 3 環境分登録」を必須項目として template 化したい |
| 改善提案 | session JWT の TypeScript 型定義を Phase 2 で固定すると、後続管理画面タスクが session.user shape を即時利用できる |
| 改善提案 | code wave が入ったタスクでは docs-only/spec_created 表記を残さず、6 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を current facts へ再同期する |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR 本文に implementation-guide / changelog / smoke evidence の URL を記載 |
| UT-03 Phase 12 | OAuth client 共有方針を双方の implementation-guide で参照 |
| 管理画面機能タスク | implementation-guide を参照して画面実装に着手 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5 (apps/web → D1 禁止) | implementation-guide で D1 不使用を明示、ホワイトリストは Secret 読みのみ | #5 |
| #6 (GAS prototype 不採用) | implementation-guide で Web Crypto API 利用を念押し | #6 |
| 無料枠 | session JWT Cookie 採用 / D1 sessions テーブル不採用を changelog に記載 | - |
| 観測性 | callback 主要分岐の構造化ログ仕様を implementation-guide に転記 | - |
| 運用性 | 新規管理者追加 runbook の概要を implementation-guide に再掲 | - |
| secret hygiene | `.dev.vars` `.gitignore` 確認手順を documentation-changelog に記載 | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md | 12 | completed | Part1 + Part2 |
| 2 | system-spec-update-summary.md | 12 | completed | 5 spec |
| 3 | documentation-changelog.md | 12 | completed | 6 件 |
| 4 | unassigned-task-detection.md | 12 | completed | 7 件 |
| 5 | skill-feedback-report.md | 12 | completed | 5 観点 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド（Part1 / Part2） |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 改訂候補 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当責務 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| メタ | artifacts.json | phase 12 status |

## 完了条件

- [ ] 6 成果物 + main.md = 7 ファイルが outputs/phase-12/ に配置
- [ ] implementation-guide が Part1（中学生レベル）+ Part2（技術者レベル）の両構成
- [ ] system-spec-update-summary が specs/ 5 件を列挙
- [ ] documentation-changelog が日付付きで本タスク close-out を記録
- [ ] unassigned-task-detection が B-02 / B-04 / 通常ユーザー認証 / 2FA / refresh / audit log を含む
- [ ] skill-feedback-report が 3 観点以上（5 観点で達成）

## タスク 100% 実行確認

- 全 5 サブタスクが completed
- 6 ファイル配置
- 全完了条件にチェック
- 不変条件 #5 / #6 への対応が記載
- 次 Phase へ PR 本文の入力（implementation-guide / changelog 抜粋）を引継ぎ

## 次 Phase

- 次: 13（PR 作成）
- 引き継ぎ事項: PR 本文に implementation-guide / changelog の URL を含める。implementationとして差分が docs 配下に閉じることを Phase 13 で確認
- ブロック条件: 6 成果物が揃っていない場合は進まない
