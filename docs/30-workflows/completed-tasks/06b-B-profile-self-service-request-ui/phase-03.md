# Phase 3: 設計レビュー — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 3 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial） |
| 作成日 | 2026-05-02 |
| taskType | feature |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 設計に対し矛盾・漏れ・整合性・依存関係をレビューし、PASS / MINOR / MAJOR を判定する。
NO-GO 条件と Phase 4 開始条件を確定する。

## 実行タスク

1. AC-1..AC-7 と Phase 2 設計の対応を逐条で検算する。完了条件: 全 AC が設計上カバーされている。
2. accessibility / i18n / security / D1 直接禁止のレビュー観点で設計を検査する。完了条件: 観点ごとに PASS / MINOR / MAJOR が記録される。
3. 不変条件 #4 / #5 / #11 への抵触リスクを抽出し検出方法を定義する。完了条件: 各リスクに静的検出手段が紐付く。
4. 06b-A 依存（session resolver 完了）の gate 不成立シナリオを NO-GO 条件として明記する。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 成果物 | `outputs/phase-01/main.md` |
| Phase 2 成果物 | `outputs/phase-02/main.md` |
| 仕様書 | `docs/00-getting-started-manual/specs/{05-pages,07-edit-delete,09-ui-ux}.md` |
| 現行 UI / API | `apps/web/app/profile/`、`apps/api/src/routes/me/` |

## 実行手順

### 1. AC × 設計マッピング

| AC | 設計上の根拠 | 判定 |
| --- | --- | --- |
| AC-1 公開停止申請 | `RequestActionPanel` → `VisibilityRequestDialog(desiredState=hidden)` → `requestVisibilityChange()` → 202 後 banner | PASS |
| AC-2 再公開申請 | 同 dialog（`desiredState=public`）。`publishState=hidden` のときだけボタン描画 | PASS |
| AC-3 退会申請 | `DeleteRequestDialog` の二段確認（チェック必須）→ `requestDelete()` → 202 後 banner | PASS |
| AC-4 二重申請 409 | error mapping `DUPLICATE_PENDING_REQUEST` → banner + button disabled | PASS |
| AC-5 本文編集 UI 追加なし | dialog の form field を `desiredState`/`reason`/確認チェックのみに限定。Phase 4 で grep lint | PASS（要 lint） |
| AC-6 D1 直接禁止 | client helper は `fetchAuthed` のみ。`apps/web` 配下で `cloudflare:d1` import を grep して 0 hit を Phase 4 で検証 | PASS（要 grep） |
| AC-7 a11y エラー読み上げ | `RequestErrorMessage` を `role=alert` で実装、dialog は `role=dialog`+`aria-modal` | PASS |

### 2. レビュー観点

| 観点 | 確認内容 | 判定 | 補正 |
| --- | --- | --- | --- |
| accessibility | role=dialog / focus trap / esc close / aria-describedby / 退会の不可逆性表記 | PASS | axe を Phase 9 に組み込む |
| i18n | 文言テーブルが日本語固定。エラー code → 文言マッピングが Phase 1/2 で一致 | PASS | — |
| security | reason 最大 500 文字を client zod でも検証、HTML を escape（React text node のみ） | PASS | — |
| D1 直接禁止 | `apps/web` 配下の `cloudflare:d1` import 0 hit、helper は `fetchAuthed` のみ | PASS | Phase 4 で CI grep 化 |
| 状態同期 | 202 受信後の pending 表示は client local state（reload で消える） | MINOR | Phase 12 で `/me/profile` レスポンスに `pendingRequestTypes` を追加する follow-up を起票 |
| 二重送信 | `submitting` flag + button disabled + idempotent な server 側 409 | PASS | — |
| rate limit 429 | `rateLimitSelfRequest` middleware の挙動。UI は dialog 内 alert で再試行誘導 | PASS | — |
| rules consent gate | `requireRulesConsent` 不通過は panel 非表示。`statusSummary.rulesConsent` を Server Component で判定 | PASS | — |

### 3. 不変条件抵触リスクと検出方法

| 不変条件 | 抵触リスク | 検出方法（静的） |
| --- | --- | --- |
| #4 本文編集禁止 | dialog に氏名等の `<input>` が紛れ込む | `rg -n 'name=\"(displayName\|email\|kana)\"' apps/web/app/profile/_components/Request*.tsx` → 0 hit を CI で固定 |
| #5 D1 直接禁止 | helper や component が `D1Database` 型 / `cloudflare:d1` を import | `rg -n 'cloudflare:d1\|D1Database' apps/web/` → 0 hit |
| #11 self-service 境界 | URL に `:memberId` を埋め込む | `rg -n '/me/[^/]*/[^"]+' apps/web/src/lib/api/me-requests.ts` → 該当パス 2 種以外 0 hit |
| #7 responseId の漏洩 | client UI が responseId を表示 | `rg -n 'responseId' apps/web/app/profile/_components/Request*.tsx` → 0 hit |

### 4. NO-GO 条件 / Phase 4 開始条件

| 条件 | 内容 | 判定 |
| --- | --- | --- |
| GATE-1 | 06b-A（Auth.js session resolver follow-up）が `completed` でないと smoke 不能 | 06b-A 完了確認なしで Phase 11 に進まない |
| GATE-2 | API 側 `POST /me/visibility-request` `POST /me/delete-request` の 202/409/422 挙動が staging で確認可能 | 確認失敗時 Phase 5 ブロック |
| GATE-3 | 不変条件 #4 / #5 / #11 のいずれかが MAJOR 判定になった場合 | Phase 2 へ差戻し |
| Phase 4 開始 | 上記 NO-GO 条件 0 件、AC × 設計が全て PASS | 満たした時点で Phase 4 着手 |

### 5. リスクと緩和策

| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| pending 状態がリロードで消える | UX 一貫性低下 | Phase 12 で `/me/profile` に pending 情報追加を follow-up 化（owner: 04b 拡張） |
| 退会の不可逆性が伝わらない | 誤申請 | dialog 内に強調文言 + 二段確認 + reason 任意 |
| network 切断中 submit | 無反応に見える | `useTransition` の `isPending` で submit ボタンを spinner 化 |
| 429 多発 | 申請受付不能 | rate limit middleware の窓値を Phase 4 でレビューし、UI 文言で待機を案内 |

## 統合テスト連携

| 判定 | Phase | 内容 |
| --- | --- | --- |
| typecheck / lint gate | Phase 4 開始前 | green であること |
| E2E gate | Phase 11 | S1〜S5 が evidence 化されていること |
| visual diff | Phase 11 | 公開状態 × dialog 状態の組合せ SS が保存される |

## 多角的チェック観点

- AC 全件 × 設計の対応が抜けていないか
- 不変条件 #4 / #5 / #11 の静的検出手段が定義されているか
- 06b-A 完了 gate を Phase 1 / Phase 2 / Phase 3 の 3 箇所で重複明記しているか
- 楽観的更新の不採用が一貫しているか
- 未実装/未実測を PASS と扱っていないか

## サブタスク管理

- [ ] AC × 設計マッピング表を完成
- [ ] レビュー観点 PASS/MINOR/MAJOR を記録
- [ ] 不変条件抵触リスクと検出コマンドを記録
- [ ] NO-GO 条件 / Phase 4 開始条件を確定
- [ ] `outputs/phase-03/main.md` を作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 設計レビュー結果 | `outputs/phase-03/main.md` | AC マッピング / 観点判定 / リスク / NO-GO 条件 |

## 完了条件

- [ ] AC-1..AC-7 すべて PASS（または補正計画あり）
- [ ] 不変条件 #4 / #5 / #11 の検出手段が静的コマンドで定義されている
- [ ] NO-GO 条件 GATE-1..GATE-3 が明記されている
- [ ] MINOR は Phase 12 follow-up に積む計画が記録されている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認【必須】

- [ ] PASS / MINOR / MAJOR の戻り先 Phase が明示されている
- [ ] simpler alternative（楽観的更新を入れない / Server Action を使わない）の検討が記録されている
- [ ] 06b-A 依存 gate が 3 phase で重複明記されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ、AC マッピング、観点判定、不変条件検出コマンド、NO-GO 条件、follow-up MINOR を渡す。
