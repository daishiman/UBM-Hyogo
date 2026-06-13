---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 1
phase_name: 要件定義
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 元 Issue | [#1192 [profile-session FU C-4] 管理者アカウントの /profile 専用 UX](https://github.com/daishiman/UBM-Hyogo/issues/1192)（**CLOSED のまま維持**・本仕様書は CLOSED Issue の current-code 再スコープ） |
| 親ワークフロー | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/`（未タスク C-4 が発見元） |
| 元タスク指示書 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/task-admin-account-profile-dedicated-ux.md` |
| taskType | `implementation` |
| visualEvidence | `VISUAL`（`/profile` の見た目を伴う変更） |
| implementation_mode | `new`（管理者分岐 UI の新設） |
| 優先度 | low（元 Issue 準拠） |
| ブランチ | `docs/issue-1192-admin-account-profile-ux-spec` |

## 目的

管理者アカウントが `/profile`（会員マイページ）にアクセスしたときの UX を**明示的に定義・実装**する。現行コードでは管理者向け分岐が一切存在せず、「管理者が `/profile` で何を見るか」が未定義のまま運用されている。

## 実装区分の判定根拠（CONST_004）

**`[実装区分: 実装仕様書]`**

- 目的（管理者向け `/profile` UX の定義と提供）は、`apps/web` 表現層へのコード変更（管理者分岐コンポーネントの新設・`page.tsx` への組み込み・テスト追加）なしには達成不可能。
- 元 Issue・元タスク指示書も「web 表現層への管理者専用分岐の実装」をスコープに含むと明記している。
- よって CONST_004 デフォルトに従い実装仕様書として作成する。CONST_005 必須項目（変更対象ファイル・シグネチャ・入出力・テスト方針・実行コマンド・DoD）は Phase 2 / 4 / 5 / 6 / 9 に展開する。

## P50 前提確認チェック（Issue 記載前提の現行コード検証）

元 Issue（2026-06-09 起票）は「**AC-2 結論待ち（着手不可）**」を前提としていた。本仕様書作成時（2026-06-12・origin/dev = `82971d195`）に現行コードを read-only 調査し、以下の通り**前提を current facts へ再スコープ**した。

| Issue 記載前提 | 現行コードの事実 | 判定 |
| --- | --- | --- |
| 「管理者が member identity/status を持つ/持たないかが未確定（AC-2 の D1 read-only 確認待ち）」 | `resolveSession`（`apps/api/src/use-cases/auth/resolve-session.ts:40-66`）は **member identity（`gate.memberId`）が解決できない email へ session を発行しない**（`unregistered` で fail）。`isAdmin` は `admin_users` テーブル（`apps/api/src/repository/adminUsers.ts:69-75`）から独立判定されるが、**session 保持の前提として member identity が必須**。 | **AC-2 はコード事実で代替確定**: ログイン済み管理者は構造的に必ず member identity を持つ。D1 データ確認を待つ必要はない（データ次第で覆る前提ではなく、コード構造が保証する） |
| 「管理者が member を持たない場合、`/me` 401 → redirect ループや空表示になりうる」 | member identity を持たない管理者（`admin_users` のみの email）は**そもそもログインできない**（session 不発行）ため、`/profile` に到達する session を持ち得ない。middleware（`apps/web/middleware.ts:119-124`）は claims 不在で `/login` へ誘導して終端する。 | 分岐 (a)「管理画面へ誘導」/(c)「profile 非対象の明示」が想定した「member を持たない管理者の `/profile` 到達」は**到達不能状態** |
| 「分岐 (a)/(b)/(c) のいずれかを AC-2 結論に基づいて確定する」 | 上記 2 点より、到達可能なのは「member identity を持つ管理者」のみ。 | **分岐 (b)（member プロフィール表示 + 管理者ロールに応じた補助導線）が構造的必然**。AskUser による分岐選択は不要（コード事実が一意に決める） |
| 「401（identity/status 不在）は redirect 経路でバナー事象とは独立」 | `session-guard.ts:84-92` は session 上の memberId が D1 と整合しない場合のみ 401。これは全 member 共通の drift edge であり管理者固有でない。 | 本タスクのスコープ外で正（§スコープ外参照） |

### 解決済みかどうかの調査結論（重複・既解決の確認）

- `/profile` の現行実装（`apps/web/app/(member)/profile/page.tsx`）に `isAdmin` 参照は **0 箇所**。管理者分岐 UI は存在しない。
- 直近の関連 PR（#1194 観測性向上 / #1214 transport 可観測性 / #1209 全ルート認証必須化 / #1213 共通レイアウト層統一）はいずれも管理者 `/profile` 分岐を**追加していない**（grep + git log で確認）。
- Issue #1192 は 2026-06-12 にコメント・コミットリンクなしで closed（state_reason=completed）されているが、**対応する実装は存在しない**。よって本タスクは必要（既解決ではない）。Issue は CLOSED のまま維持し、本ワークフローを canonical な実装仕様とする。

## 背景（コード調査で確認した現象）

1. `/me`（`apps/api/src/routes/index.ts` + `apps/api/src/middleware/session-guard.ts:104-114`）は既に `isAdmin: boolean` を含む `SessionUser` を返す。web 側 mirror 型 `MeSessionUser.isAdmin`（`apps/web/src/lib/api/me-types.ts:18`）も定義済み。
2. しかし `/profile` page（`apps/web/app/(member)/profile/page.tsx:78-187`）は `me.user.memberId` と `me.authGateState` のみ参照し、`me.user.isAdmin` を**一切利用していない**。
3. その結果、管理者がマイページを開いても「自分が管理者である」ことに紐づく導線（管理画面への入口）が無く、会員サイト層と管理バックオフィス層の行き来が `/profile` 上で分断されている。
4. サイドバー（shell）側には admin 向けリンクの出し分けは存在するが、`/profile` 本文には管理者文脈の表示がゼロであり、元 Issue が指摘した「管理者の `/profile` 体験が未定義」は表現層の課題として現存する。

## 根本原因（コード調査で確定）

- `/me` が返す `isAdmin` を `/profile` 表現層が消費していない（**データは揃っているのに UI 分岐が未実装**）。
- 認証・認可の判定所有権は `apps/api`（session-guard / resolveSession）に正しく閉じており、web 側に必要なのは**既存 session 情報の参照点（`me.user.isAdmin`）を読む表示分岐のみ**。新規認証ロジックは不要。

## 要件（スコープ）

### R-1: 管理者補助導線の新設（分岐 (b) の実装）

`/profile` 認証成功描画において、`me.user.isAdmin === true` のときのみ、管理者向け案内カード（`AdminAccessNotice`）を表示する。

- 内容: 「管理者アカウントでログインしている」旨の案内 + 管理画面（`/admin`）への導線ボタン。
- member プロフィール本体（ProfileHeader / 写真 / 公開状態 / フィールド / 出席履歴等）の表示は**従来通り維持**する（分岐 (b): 管理者も member プロフィールを持つ前提で表示し、補助導線を添える）。

### R-2: 非管理者の表示不変

`me.user.isAdmin === false` のとき、`/profile` の描画 DOM は本変更前と**完全に同一**であること（member 側の既存挙動を巻き込まない）。

### R-3: 認証境界・不変条件の維持

- 管理者判定を web で新規に実装しない。既存 `/me` レスポンスの `isAdmin` を読むのみ（認証判定の所有権は `apps/api/src/middleware/session-guard.ts` に残す・fail-closed 維持）。
- 不変条件 #11: `memberId` を画面・ログ・レスポンスへ新たに露出させない（`AdminAccessNotice` は member データを一切受け取らない静的コンポーネントとする）。

## Acceptance Criteria

| AC | 内容 | 検証方法 |
| --- | --- | --- |
| AC-1 | `me.user.isAdmin === true` のとき `/profile` 認証成功描画に管理者案内カード（`data-testid="profile-admin-access-notice"`）が表示される | jsdom render（`page.spec.tsx`） |
| AC-2 | 管理者案内カードに `/admin` への導線リンク（accessible name「管理画面を開く」・`href="/admin"`）が含まれる | jsdom render（`AdminAccessNotice.component.spec.tsx`） |
| AC-3 | `me.user.isAdmin === false` のとき管理者案内カードが描画されない（query 結果 null） | jsdom render（`page.spec.tsx`） |
| AC-4 | `/me` エラー degrade 分岐（404/410/5xx/transport）の表示は本変更前と不変（既存テスト全 PASS） | 既存 `page.spec.tsx` 全件 PASS |
| AC-5 | `AdminAccessNotice` は props を受け取らず、`memberId`・email 等の member データを描画しない（不変条件 #11） | コンポーネント実装 + spec のテキスト非含有 assertion |
| AC-6 | web 側に新規の認証判定ロジック（cookie 解析・role 解決等）を追加しない。差分は `me.user.isAdmin` の参照のみ | `git diff` レビュー + grep（Phase 9） |
| AC-7 | 色は既存トークン / 既存 primitives（`SectionCard` / `ButtonLink`）経由のみ。HEX 直書き・新規 CSS クラス追加なし | `pnpm verify:tokens` + grep |
| AC-8 | `apps/api` / `packages/` / D1 schema / Google Form 仕様に差分ゼロ | `git diff --name-only -- apps/api packages` が空 |
| AC-9 | typecheck / lint / focused Vitest（`/profile` 配下）全 PASS | Phase 9 検証コマンド |

## スコープ境界（CONST_007）

本仕様書は**単一サイクル・単一 PR で完了するスコープ**であり、分割・先送りは行わない。

### スコープ外（先送りではなく、本 Issue の課題に含まれないもの）

| 項目 | 除外根拠 |
| --- | --- |
| session 有効だが D1 で identity/status が消えた場合の 401 → `/login?redirect=/profile` 挙動（drift edge） | 全 member 共通の既存挙動であり、管理者固有の UX 課題（本 Issue の主題）ではない。元 Issue も「401 redirect はバナー事象と別経路」とスコープ分離済み。本仕様の変更はこの経路に一切触れない |
| `/me` の status 体系・session-guard・resolveSession の変更 | 元 Issue「含まない」明記。認証境界の所有権は api 側に維持 |
| member（非管理者）側の `/profile` UX 変更 | 元 Issue「含まない」明記（AC-3 / R-2 で不変を保証） |
| 管理画面（`/(admin)/**`）側の変更 | 導線の到達先であり変更不要 |
| D1 schema 変更・Google Form 仕様変更 | プロジェクト不変条件 |

## 既存コードベースの命名規則

- `/profile` 配下コンポーネント: `_components/PascalCase.tsx`（例: `ProfileHeader.tsx` / `PublicConsentCallout.tsx`）。client component のみ `.client.tsx` suffix。本タスクの `AdminAccessNotice` は server-renderable な純表示コンポーネントのため suffix なし。
- テスト: 同 directory co-located `*.spec.tsx`（`*.test.*` 禁止・lefthook `block-test-suffix` 対象）。
- 共通 primitives: `@/components/ui/layout`（`PageShell` / `SectionCard` / `ContentCard`）・`@/components/ui/ButtonLink`（PR #1213 で正本化済み）。
- `AdminAccessNotice` の命名衝突: リポジトリ全体 grep で 0 件（Phase 3 で再検査）。

## 実行タスク

1. 現行 `/profile` 実装・`/me` 契約・認証境界の read-only 調査（完了・本書に反映済み）。
2. Issue 前提（AC-2 待ち）の current facts 再スコープと分岐 (b) の確定（完了・P50 表参照）。
3. 要件 R-1〜R-3 / AC-1〜AC-9 の確定（本書）。
4. Phase 2 で `AdminAccessNotice` のシグネチャ・配置・文言・DOM 契約を設計する。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/task-admin-account-profile-dedicated-ux.md` | 元タスク指示書（C-4）・分岐 (a)/(b)/(c) の定義 |
| `apps/web/app/(member)/profile/page.tsx` | 実装対象（組み込み点） |
| `apps/web/src/lib/api/me-types.ts` | `MeSessionUser.isAdmin` 型契約 |
| `apps/api/src/middleware/session-guard.ts` | `/me` の isAdmin 付与・401/410 境界（変更しない） |
| `apps/api/src/use-cases/auth/resolve-session.ts` | session 発行に member identity 必須である根拠（変更しない） |
| `docs/00-getting-started-manual/specs/02-auth.md` | 認証設計正本（session callback と isAdmin 解決） |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | MVP 認証方針 |

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/` の管理する正本仕様と整合: 本タスクは既存 API surface のみ利用（新 endpoint なし）・D1 schema 不変・consent キー非接触・`responseEmail` 非接触。

## 成果物

- 本ファイル（Phase 1 要件定義）。

## 統合テスト連携

- 既存 `page.spec.tsx`（degrade 分岐 guard）を回帰スイートとして全件維持。新規 AC は Phase 4 のテスト計画で focused Vitest に落とす。

## 完了条件

- [x] 実装区分が判定根拠付きで明記されている（実装仕様書）
- [x] Issue 記載前提の現行コード検証（P50）が行われ、AC-2 待ち前提が current facts へ再スコープされている
- [x] 要件 R-1〜R-3 と AC-1〜AC-9 が検証方法付きで確定している
- [x] スコープ外項目が「先送り」ではなく「本 Issue の課題外」である根拠付きで列挙されている（CONST_007 適合・未タスク分離 0 件）
