# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

`/login`（5 状態）と `/profile`（read-only）に対する異常系（401 / 403 / 404 / 422 / 5xx / Magic Link 期限切れ / OAuth callback 失敗 / gate-state 不整合 / editResponseUrl 欠落 / consent 撤回）を網羅し、UI 表示と recovery 動作を確定する。`/no-access` への遷移が一切発生しないことを担保する（不変条件 #9）。

## 実行タスク

1. `/login` × HTTP / Auth.js 異常系
2. `/profile` × HTTP / session 異常系
3. AuthGateState 不整合と URL query tampering
4. Magic Link 期限切れ / 再送 spam / Google OAuth callback 失敗
5. profile read-only 強制（不変条件 #4 / #11）の violation 試行を阻止

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | test ID の起点 |
| 必須 | outputs/phase-05/runbook.md | 正常系手順 |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | 5 状態の境界 |
| 参考 | doc/00-getting-started-manual/specs/02-auth.md | `/no-access` 不採用 |
| 参考 | doc/00-getting-started-manual/specs/07-edit-delete.md | 編集 UI 禁止 |

## 実行手順

### ステップ 1: failure case 表

| ID | 入力 | 期待 status | 期待 UI | 不変条件 |
| --- | --- | --- | --- | --- |
| F-01 | `/login?state=foo`（不正 state） | 200 | `loginQuerySchema` で `input` フォールバック | #8 |
| F-02 | `/login?email=not-an-email&state=sent` | 200 | email 欠落として `state=sent` だけ表示 | #8 |
| F-03 | `/login` で Magic Link 連打（cooldown 内） | 429 想定 / button disabled | UI で button disabled、Toast「60 秒後に再送可」 | - |
| F-04 | Magic Link 期限切れ token で `/api/auth/callback/email` | 302 → `/login?state=input&error=expired` | Banner「リンクの有効期限が切れました」+ 再送 CTA | #9 |
| F-05 | Google OAuth callback で provider error | 302 → `/login?state=input&error=oauth_failed` | Banner「Google ログインに失敗しました」+ 再試行 CTA | #9 |
| F-06 | `/profile` を未ログインで開く | 302 → `/login?redirect=/profile` | middleware redirect | #9 |
| F-07 | `/profile` で session 切れ（API 401） | RSC fetch 失敗 → error.tsx → `/login?redirect=/profile` | Toast「セッションが切れました」 | #5, #9 |
| F-08 | `/profile` で `/me` が 403（admin only ではない、403 は基本起きない） | 500 扱い | error.tsx で「再試行」 | #5 |
| F-09 | `/profile` で member が `isDeleted=true` | API が 404 → page も 404 | not-found.tsx「アカウントが削除されています」 | #5, #11 |
| F-10 | `/profile` で `editResponseUrl` が null | 200 | `EditCta` の button disabled + tooltip「Google Form 再回答 URL を取得中」 | #4 |
| F-11 | `/profile` で `MemberProfile.fields` が空 | 200 | EmptyState「プロフィール情報がまだありません」+ responderUrl CTA | #4 |
| F-12 | `/profile` で 5xx | 500 | error.tsx「一時的なエラー」+ retry button | #5, #10 |
| F-13 | `/profile?edit=true` 等で URL 経由の編集 mode 起動試行 | 200 | edit query は無視、read-only 維持 | #4 |
| F-14 | `/login?state=deleted` でログイン form を表示しようと URL 改ざん | 200 | deleted 状態 Banner のみ、form は描画しない | #9 |
| F-15 | `/login` で `localStorage` 経由の state 復元試行（不採用案） | lint error | grep / ESLint で阻止 | #6, #8 |
| F-16 | consent 撤回後の `/profile`（`publicConsent=declined`） | 200 | 状態サマリで「公開許可: 撤回」表示、再回答 CTA を強調 | #2, #4 |
| F-17 | `/login` の Magic Link form で email 形式不正 | 422（クライアント側 zod） | FormField error「正しいメールアドレスを入力してください」 | - |

### ステップ 2: AuthGateState 不整合と URL tampering

- F-01 / F-02 / F-14 で URL query 改ざんがあっても、`loginQuerySchema` の `safeParse` で正規値に正規化（fallback `state="input"`、`redirect="/profile"`）
- `state="deleted"` でログイン form を再描画する分岐は switch case 内に存在せず、UI 経路で違反不可

### ステップ 3: Magic Link / OAuth callback 障害

- F-03: 60 秒 cooldown は client state（不変条件 #6 抵触なし、ephemeral state のみ）
- F-04: 05b 側で期限切れ判定 → `/login?state=input&error=expired` redirect、UI で error クエリを Banner に変換
- F-05: 05a 側で OAuth callback 失敗 → `/login?state=input&error=oauth_failed` redirect

### ステップ 4: profile read-only 強制（不変条件 #4 / #11）

- F-13: `/profile?edit=true` のような edit 起動 query は読み込まない（URL contract に edit field 不在）
- F-15: ESLint custom rule で `/profile` 配下に `<form>` + onSubmit を ban（Phase 5 ステップ 4 と整合）
- 唯一許容する form は 04b の `POST /me/visibility-request` `POST /me/delete-request` 用 confirm dialog のみ（本タスクでは UI 配置せず後続 wave の責務）

### ステップ 5: consent 撤回後の表示

- F-16: `publicConsent=declined` のとき `StatusSummary` は「公開許可: 撤回」を表示し、`EditCta` で responderUrl を強調する。アプリ内で consent を再取得する form は配置しない（不変条件 #4）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | F-01〜F-17 を AC × test ID 表に組み込む |
| Phase 8 | error / Toast / Banner の DRY 化候補抽出 |
| 08a | F-04, F-05, F-07, F-09 を contract test 化 |
| 08b | F-01, F-03, F-06, F-13 を Playwright 化 |

## 多角的チェック観点

- 不変条件 #2: F-16 で `publicConsent` / `rulesConsent` の表記揺れがないことを確認
- 不変条件 #4: F-10, F-11, F-13, F-15 で profile に編集 form / button が一切出現しない
- 不変条件 #5: F-07, F-08, F-09, F-12 で apps/web から D1 直接 fetch がない（全て 04b 経由）
- 不変条件 #6: F-15 で `localStorage` / `window.UBM` 復活を阻止
- 不変条件 #7: F-09 で `responseId` と `memberId` を取り違えない（404 経路は memberId ベース）
- 不変条件 #8: F-01, F-02, F-14 で URL query の不正値は zod fallback、localStorage 経路なし
- 不変条件 #9: F-04, F-05, F-06, F-07, F-14 すべてで `/no-access` への遷移なし、`/login` で 5 状態を吸収
- 不変条件 #10: F-12 の retry が無限 fetch にならない（error.tsx は手動 retry のみ）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-01〜F-02 query 異常 | 6 | pending | zod fallback |
| 2 | F-03〜F-05 Magic Link / OAuth | 6 | pending | error redirect |
| 3 | F-06〜F-09 session / 404 | 6 | pending | middleware + not-found |
| 4 | F-10〜F-12 profile 表示異常 | 6 | pending | EmptyState / disabled |
| 5 | F-13〜F-15 violation 試行阻止 | 6 | pending | ESLint / switch |
| 6 | F-16 consent 撤回 | 6 | pending | StatusSummary |
| 7 | F-17 form validation | 6 | pending | zod client |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure case 表 + recovery 動作 |
| メタ | artifacts.json | phase 6 status |

## 完了条件

- [ ] F-01〜F-17 が網羅
- [ ] 各 case に期待 status / UI / 不変条件が明記
- [ ] `/no-access` 遷移が全 case で 0 件
- [ ] profile に編集 UI が出現する経路が 0 件

## タスク100%実行確認【必須】

- 全 7 サブタスクが completed
- outputs/phase-06/main.md 配置
- 不変条件 #2, #4, #5, #6, #7, #8, #9, #10 への対応が明記
- 次 Phase へ failure ID 一覧を引継ぎ

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: F-01〜F-17 を AC × test ID × runbook step に紐付け
- ブロック条件: `/no-access` 遷移経路 / profile 編集 UI 経路が 1 つでも残れば進まない
