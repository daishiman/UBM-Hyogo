# Phase 12 — ドキュメント更新: 6 種ドキュメント生成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 12 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-11（手動 smoke） |
| 下流 | phase-13（PR 作成） |

## 目的

implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check の 6 種を生成し、本タスクの spec を後続実装タスク（06b/06c/08a）が消費できる状態にする。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

1. implementation-guide.md（OAuth flow + admin gate 二段防御 + 05b 共有）
2. system-spec-update-summary.md（specs/ 改訂候補）
3. documentation-changelog.md（本タスクで更新した spec / template）
4. unassigned-task-detection.md（本タスクで触れない責務の洗い出し）
5. skill-feedback-report.md（task-specification-creator skill への feedback）
6. phase12-task-spec-compliance-check.md（template 準拠 chk）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/architecture.md | 接続図 |
| 必須 | outputs/phase-02/admin-gate-flow.md | 二段防御 |
| 必須 | outputs/phase-07/ac-matrix.md | AC trace |
| 必須 | outputs/phase-10/main.md | GO 判定 + B-01〜B-03 |
| 必須 | outputs/phase-11/main.md | smoke 結果 |
| 参考 | doc/02-application-implementation/_templates/phase-meaning-app.md | Phase 定義 |

## 実行手順

### ステップ 1: implementation-guide.md（中学生レベル → 技術者レベル）

**Part 1（中学生レベル）**
- 「Google でログイン」ボタンが主導線。Google アカウントで本人確認 → サイトに入る
- 「会員じゃない人」「ルールに同意してない人」「退会済みの人」は入れない（ログイン入口で出し分ける）
- 管理者ページは「会員リストに admin と書いてある人」だけ入れる
- admin chec は **2 段階**: ページの入口（middleware）と API（requireAdmin）の両方で確認

**Part 2（技術者レベル）**

| 項目 | 詳細 |
| --- | --- |
| task root | docs/30-workflows/05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| key outputs | outputs/phase-02/architecture.md, api-contract.md, admin-gate-flow.md, outputs/phase-05/runbook.md, outputs/phase-07/ac-matrix.md |
| upstream | 02a (findIdentityByEmail), 02c (isAdminMember), 04b (`/me`), 04c (`/admin/*`) |
| downstream | 06a/b/c (画面), 08a (contract test) |
| validation focus | OAuth callback → session-resolve → JWT 構造 + 二段防御 + bypass 阻止 + `/no-access` 不在 |
| shared with 05b | `GET /auth/session-resolve`, `SessionUser` 型, `gateReason` 値 |
| known constraints | B-01 (admin 剥奪は次回ログインで反映), B-03 (Google OAuth verification は MVP 後申請) |

**接続図 (apps/web ↔ apps/api)**:
```
[Browser] --signIn google--> [apps/web Auth.js v5]
   --signIn callback--> [apps/api GET /auth/session-resolve]
   --(internal token)-> [02a findIdentityByEmail + 02c isAdminMember]
   --memberId/isAdmin--> [Auth.js JWT]
   --session cookie--> [Browser]
[Browser] --/admin/*--> [middleware.ts (edge)]
   --auth(req).user.isAdmin--> [next() or redirect]
[Browser] --/admin/* API--> [apps/api requireAuth + requireAdmin]
   --verifyJwt(AUTH_SECRET)--> [memberId/isAdmin]
```

### ステップ 2: system-spec-update-summary.md

| spec | 改訂候補 | 理由 |
| --- | --- | --- |
| 02-auth.md | `/auth/session-resolve` の追記 | 本タスクで追加した内部 endpoint |
| 06-member-auth.md | gateReason 値の固定（"unregistered"/"deleted"/"rules_declined"） | 05b と共有命名 |
| 11-admin-management.md | admin gate 二段防御の責務分離図 | 本タスクの主成果物 |
| 13-mvp-auth.md | session JWT 構造（memberId, isAdmin のみ） | 不変条件 #4/#11 reinforce |
| 08-free-database.md | session が JWT のため `sessions` テーブルを持たないことを明示 | 無料枠戦略 |

### ステップ 3: documentation-changelog.md

| 日付 | 変更 | 影響範囲 |
| --- | --- | --- |
| 2026-04-26 | 05a task spec 作成（15 ファイル） | apps/web auth, apps/api auth, member_identities, admin_users |
| 2026-04-26 | session JWT 採用方針を確定（D1 sessions テーブル不採用） | apps/api, infra 04 |
| 2026-04-26 | admin gate 二段防御方式を確定（middleware + requireAdmin） | 06c, 08a |
| 2026-04-26 | INTERNAL_AUTH_SECRET を新規 secret として追加 | infra 04 secrets リスト |
| 2026-04-26 | `/auth/session-resolve` を 05a/05b で共有 | 05b との ADR 締結 |

### ステップ 4: unassigned-task-detection.md

| 未割当責務 | 想定 task | 暫定対応 |
| --- | --- | --- |
| Google OAuth verification 申請 | 別タスク（運用） | MVP は testing user で運用、prod release 前に申請（B-03） |
| admin 剥奪の即時反映（D1 lookup を毎リクエスト） | 別タスク（オプション最適化） | MVP は次回ログインで反映（B-01）、必要時に検討 |
| session refresh / silent renewal | 別タスク（拡張） | MVP は 24h 期限で十分、refresh 機構は不要 |
| OAuth audit log | 07c | 07c の audit-log workflow に gate 拒否を渡す hook |
| INTERNAL_AUTH_SECRET ローテーション | infra 04 | secrets ローテーション運用は infra 側 |
| Magic Link 補助導線 | 05b | 並列タスク、本タスク完了と独立に進む |

### ステップ 5: skill-feedback-report.md

| 観点 | feedback |
| --- | --- |
| task-specification-creator | Phase 6 の bypass 試行 (F-15, F-16) を template に組み込み済 |
| invariants 引用 | 不変条件 #5, #11 を Phase 1〜10 全てに紐付ける運用が機能 |
| 改善提案 | OAuth provider タスクは「OAuth client 取得手順」を Phase 5 に必ず含めるべき（本タスクで追加） |
| 改善提案 | session JWT の TypeScript 型定義を Phase 2 に含めると Phase 8 の DRY 化が容易 |
| 改善提案 | 並列タスク（05a/05b）の場合、Phase 2 と Phase 3 で共有 contract の ADR を必ず締結する手順を template に追加 |

### ステップ 6: phase12-task-spec-compliance-check.md

| 項目 | 期待 | 実績 |
| --- | --- | --- |
| 必須セクション 11 種 | 全 phase に含む | OK（Phase 1〜13 すべて） |
| Phase 別追加 | template 通り | OK |
| 不変条件番号引用 | 多角的チェック観点に番号付き | OK |
| outputs path | `outputs/phase-XX/main.md` 必須 | OK |
| user_approval_required | Phase 13 のみ true | OK |
| Mermaid 図 | Phase 2 に含む | OK |
| Before/After 表 | Phase 8 に含む | OK |
| AC matrix | Phase 7 に含む | OK |
| failure cases | Phase 6 に網羅 | OK（F-01〜F-22） |
| GO/NO-GO 判定 | Phase 10 に明記 | OK（条件付き GO） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR 本文に implementation-guide の URL を記載 |
| 05b Phase 12 | 共有 ADR を双方の implementation-guide に記載 |
| 06b/06c | implementation-guide を参照して画面実装 |
| 08a | api-contract.md を参照して契約 test 実装 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5 (apps/web → D1 禁止) | implementation-guide で apps/web → apps/api 経路を明示 | #5 |
| #6 (GAS prototype 不採用) | implementation-guide で念押し | #6 |
| #9 (`/no-access` 不在) | documentation-changelog で再周知 | #9 |
| #10 (無料枠) | session JWT 採用を changelog に記載 | #10 |
| #11 (admin gate) | implementation-guide の二段防御図 | #11 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | pending | 中学生 + 技術者 |
| 2 | system-spec-update | 12 | pending | 5 spec |
| 3 | documentation-changelog | 12 | pending | 5 件 |
| 4 | unassigned | 12 | pending | 6 件 |
| 5 | skill-feedback | 12 | pending | 5 観点 |
| 6 | compliance-check | 12 | pending | template 準拠 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 改訂候補 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | template 準拠 |
| メタ | artifacts.json | phase 12 status |

## 完了条件

- [ ] 6 種ドキュメント + main.md = 7 ファイルが outputs/phase-12/ に配置
- [ ] compliance-check が全項目 OK
- [ ] changelog が日付付き
- [ ] skill-feedback が 3 観点以上（5 観点で達成）
- [ ] unassigned が B-01, B-03 を含む

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- 7 ファイル配置
- 全完了条件にチェック
- 不変条件 #5, #6, #9, #10, #11 への対応が記載
- 次 Phase へ PR 本文の入力を引継ぎ

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: PR 本文に implementation-guide / changelog の URL を含める
- ブロック条件: 6 種ドキュメントが揃っていない場合は進まない
