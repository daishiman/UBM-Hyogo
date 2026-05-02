# Phase 11: 手動 smoke / 実測 evidence — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 11 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 06b-C） |
| 作成日 | 2026-05-02 |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |
| capture mode | SCREENSHOT + E2E（Playwright） |

## 目的

実装完了後、ローカル / staging 環境で `/profile` の申請 UI を実際に操作し、Phase 1 で定義した AC-1..AC-7 と user scenario S1..S6 を**実 UI**で検証する。
本 Phase は VISUAL_ON_EXECUTION ポリシーに従い、screenshot と E2E evidence（Playwright trace / video / console log）を `outputs/phase-11/` 配下に保存する。

> **重要**: 仕様書作成段階では実 screenshot / E2E artifact は**取得しない**。本ドキュメントは「実装完了後に Phase 11 を実行する際の手順・保存先・命名規則」を規定する。

## 実行可否（Pre-conditions）

| GATE | 条件 | 確認方法 |
| --- | --- | --- |
| PRE-1 | Phase 10 が PASS または MINOR 判定 | `outputs/phase-10/main.md` |
| PRE-2 | 06b-A-me-api-authjs-session-resolver が `completed` で staging 環境の `/api/auth/session` が `user.memberId` を返す | curl による疎通 |
| PRE-3 | 06b-B 実装本体（Phase 5）が main / dev に対し未 push でも、ローカル worktree でビルド・起動可能 | `pnpm build && pnpm --filter @repo/web preview` |
| PRE-4 | API Worker が staging で `POST /me/visibility-request` `POST /me/delete-request` を 202/409/422 で応答可能 | `bash scripts/cf.sh d1 ...` で staging 確認 |
| PRE-5 | テスト用会員（`rulesConsent=consented`、`publishState=public`）が staging D1 に存在 | seed スクリプトで投入 |

> Pre-condition 不成立時は Phase 11 を実行せず、blocker を `outputs/phase-11/main.md` の「BLOCKED」セクションに記録し、Phase 10 / 06b-A へ差し戻す。

## 環境

| 項目 | 値 |
| --- | --- |
| ブラウザ | Chrome stable（Playwright bundled chromium） |
| viewport | 1280 × 800（desktop 主） / 必要に応じ 390 × 844（mobile sanity） |
| 動作環境 | (a) ローカル `pnpm --filter @repo/web dev` + API staging、または (b) staging Cloudflare Pages + staging API Worker |
| テーマ | system default（ライト固定。本タスクはダーク UI 切替を提供しないため `--dark` 撮影は対象外） |
| 認証 | Auth.js Google OAuth or Magic Link で staging 用テストアカウントにログイン |

## 取得対象 screenshot 一覧（命名規則）

保存先: `outputs/phase-11/screenshots/`

ファイル名規則: `TC-{番号}-{state}-{theme}.png`（テーマは `light` 固定）

| TC | 画面状態 | route / 操作 | ファイル名 | 紐付く AC |
| --- | --- | --- | --- | --- |
| TC-01 | profile ページの申請パネル初期表示（publishState=public） | `/profile` 表示直後 | `TC-01-request-panel-default-public-light.png` | AC-1, AC-2 |
| TC-02 | profile ページの申請パネル初期表示（publishState=hidden、再公開ボタン表示） | `/profile`（hidden 会員でログイン） | `TC-02-request-panel-default-hidden-light.png` | AC-2 |
| TC-03 | 公開停止 dialog 開いた状態 | TC-01 から「公開を停止する」をクリック | `TC-03-visibility-dialog-open-light.png` | AC-1 |
| TC-04 | 退会 dialog 開いた状態（不可逆性表記 + 二段確認チェック未完） | TC-01 から「退会を申請する」をクリック | `TC-04-delete-dialog-open-light.png` | AC-3 |
| TC-05 | 退会 dialog の二段確認チェック完了状態（submit ボタン enabled） | TC-04 で確認チェック ON | `TC-05-delete-dialog-confirmed-light.png` | AC-3 |
| TC-06 | 二重申請 409 エラー表示（banner + ボタン disabled） | 既に pending 状態でもう一度同種申請 → 409 | `TC-06-duplicate-409-light.png` | AC-4 |
| TC-07 | 申請成功後の pending banner 表示 | 公開停止 submit → 202 受信後 | `TC-07-pending-banner-after-submit-light.png` | AC-1 |
| TC-08 | a11y キーボード focus 表示（dialog 開で focus trap が見える） | TC-03 で Tab 操作後 | `TC-08-dialog-focus-trap-light.png` | AC-7 |
| TC-09 | エラー role=alert 表示（network failure / 5xx） | API を network error にして submit | `TC-09-error-alert-light.png` | AC-7 |

> dark mode 撮影は本タスクで provide しないため対象外。N/A 理由を `outputs/phase-11/screenshot-coverage.md` に記録する。

## 手動 smoke 手順（runbook）

実行前に PRE-1..PRE-5 を全て満たすこと。

### 0. 準備

```bash
# 1. ブランチ・ビルド確認
git status                          # clean を期待
pnpm install
pnpm typecheck && pnpm lint
pnpm --filter @repo/web build

# 2. 別ターミナルで dev / preview 起動
pnpm --filter @repo/web dev         # http://localhost:3000

# 3. テストアカウントの D1 状態確認（staging）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT id, publish_state, rules_consent FROM members WHERE id = '<test-member-id>'"
```

### 1. シナリオ S1: 公開停止申請（公開 → 非公開）

1. `http://localhost:3000/login` から Google OAuth でテストアカウントログイン
2. `/profile` へ遷移、`StatusSummary` が `公開状態: 公開` を表示することを確認
3. **撮影**: `TC-01-request-panel-default-public-light.png`
4. 「公開を停止する」ボタンクリック → Dialog 開く
5. **撮影**: `TC-03-visibility-dialog-open-light.png`
6. reason は空のまま「申請する」クリック
7. 202 受信後 dialog close → pending banner 表示
8. **撮影**: `TC-07-pending-banner-after-submit-light.png`
9. ブラウザ DevTools Network で `POST /me/visibility-request` が `202` を返したこと、response が `{queueId, type:"visibility_request", status:"pending", createdAt}` 形であることを確認

### 2. シナリオ S2: 再公開申請（非公開状態のテストアカウントを別途用意）

1. `publishState=hidden` のテストアカウントでログインし `/profile`
2. 「再公開を申請する」ボタンが表示されていることを確認
3. **撮影**: `TC-02-request-panel-default-hidden-light.png`

### 3. シナリオ S3: 退会申請（取消可能 = pending を admin が approve 前なら本人取消可、本タスクは申請までを検証）

1. publishState=public のテストアカウントで `/profile`
2. 「退会を申請する」クリック → 二段確認 dialog
3. **撮影**: `TC-04-delete-dialog-open-light.png`
4. 「上記を理解しました」チェックを ON、submit ボタン enabled
5. **撮影**: `TC-05-delete-dialog-confirmed-light.png`
6. 「申請する」クリック → 202、pending banner 表示
7. Network で `POST /me/delete-request` が 202 を返したことを確認

### 4. シナリオ S4: 二重申請 409

1. 直前で公開停止申請 pending のままのテストアカウントを使用
2. もう一度「公開を停止する」をクリック → Dialog 内 submit
3. 409 受信 → banner「既に申請を受け付けています。管理者の対応をお待ちください。」表示、ボタン disabled
4. **撮影**: `TC-06-duplicate-409-light.png`

### 5. シナリオ S5: 401 リダイレクト確認

1. DevTools Application で session cookie を削除
2. `/profile` リロード → `/login?redirect=/profile` にリダイレクトされることを確認
3. evidence: ブラウザ URL のスクリーンショット（補助）/ Playwright trace で network 304/302 を記録

### 6. シナリオ S6: rulesConsent !== consented 時の panel 非表示

1. D1 のテスト用会員の `rules_consent` を `not_consented` に更新
2. `/profile` リロード → `RequestActionPanel` 自体が非表示、案内テキスト表示
3. 終了後 `consented` に戻す

### 7. a11y / keyboard

1. TC-03 の状態で Tab を 5 回押す → focus が dialog 内を循環することを確認
2. **撮影**: `TC-08-dialog-focus-trap-light.png`
3. Esc → dialog close、focus が trigger button に戻ることを確認
4. axe DevTools 拡張または `@axe-core/playwright` を実行し critical / serious 違反 0 件を確認

### 8. エラー UI（network / 5xx）

1. DevTools Network → `/me/visibility-request` を Block request URL
2. 公開停止申請 submit → `RequestErrorMessage`（role=alert）に「通信に失敗しました。再試行してください。」表示
3. **撮影**: `TC-09-error-alert-light.png`

## E2E evidence（Playwright）

| evidence | 保存先 | 取得方法 |
| --- | --- | --- |
| trace.zip | `outputs/phase-11/e2e/trace/` | `playwright test --trace=on` |
| video webm | `outputs/phase-11/e2e/video/` | `use: { video: 'on' }` |
| console log | `outputs/phase-11/e2e/console/{spec-name}.log` | `page.on('console', ...)` で標準出力にダンプ |
| network HAR | `outputs/phase-11/e2e/har/{spec-name}.har` | `recordHar` オプション |
| spec ファイル | `apps/web/playwright/tests/profile-visibility-request.spec.ts`、`apps/web/playwright/tests/profile-delete-request.spec.ts` | Phase 5 で実装 |

実行コマンド例:

```bash
pnpm --filter @repo/web exec playwright test \
  --project=chromium \
  --trace=on \
  --reporter=list \
  e2e/profile.visibility-request.spec.ts e2e/profile.delete-request.spec.ts
```

実行後、artifact を current workflow 配下へコピー:

```bash
mkdir -p docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/outputs/phase-11/e2e/{trace,video,console,har}
cp -r apps/web/test-results/* docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/outputs/phase-11/e2e/
```

## 必須成果物（Phase 11 実行後）

| 成果物 | パス | 必須 | 説明 |
| --- | --- | --- | --- |
| Phase 11 トップ index | `outputs/phase-11/main.md` | 必須 | テスト方式 / 実行サマリ / 必須 outputs リンク |
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | 必須 | TC-01..TC-09 の PASS/FAIL と SS 紐付け |
| 撮影計画 | `outputs/phase-11/screenshot-plan.json` | 必須 | TC × route × action × theme の plan |
| カバレッジレポート | `outputs/phase-11/screenshot-coverage.md` | 必須 | 必須項目 100% / N/A 理由（dark mode 等） |
| 撮影 metadata | `outputs/phase-11/phase11-capture-metadata.json` | 必須 | taskId / generated-at / capture method |
| 視覚レビュー | `outputs/phase-11/ui-sanity-visual-review.md` | 必須 | Apple HIG / WCAG AA 観点の所見 |
| 発見課題一覧 | `outputs/phase-11/discovered-issues.md` | 必須 | Blocker / Note / Info 分類（0 件でも作成） |
| screenshots | `outputs/phase-11/screenshots/TC-*.png` | 必須 | TC-01..TC-09 |
| E2E artifact | `outputs/phase-11/e2e/{trace,video,console,har}/` | 必須 | Playwright 取得物 |
| 手動 smoke 実行ログ | `outputs/phase-11/manual-smoke-log.md` | 推奨 | 実行コマンド / 期待 / 実測 / 環境（commit hash, viewport, datetime） |

## 仕様照合チェックリスト（撮影時）

- [ ] TC-01: `RequestActionPanel` のレイアウトが Phase 2 設計書と一致
- [ ] TC-02: `publishState=hidden` のときだけ「再公開を申請する」ボタンが描画
- [ ] TC-03: dialog が `role=dialog` `aria-modal=true` を持つ
- [ ] TC-04: 退会 dialog に「不可逆」「管理者承認後反映」の文言が含まれる
- [ ] TC-05: 二段確認チェック完了で submit ボタン enabled
- [ ] TC-06: 409 banner 文言が「既に申請を受け付けています。管理者の対応をお待ちください。」と一致
- [ ] TC-07: pending banner が `RequestPendingBanner` コンポーネントで描画
- [ ] TC-08: dialog 内 focus trap が機能、Esc で dialog close
- [ ] TC-09: `role=alert` でエラー読み上げ可能
- [ ] dialog は本文項目（displayName / email / kana 等）の入力欄を持たない（不変条件 #4）
- [ ] DevTools Network で `cloudflare:d1` 由来の直接 binding 呼び出しが発生していない（不変条件 #5）
- [ ] API path が `/me/visibility-request` `/me/delete-request` のみ（不変条件 #11）

## 統合テスト連携

| テスト項目 | 確認内容 | 期待結果 |
| --- | --- | --- |
| API 接続 | `POST /me/visibility-request` | 202 / 409 / 422 を意図通り返却 |
| 認証フロー | Auth.js Google OAuth → session.user.memberId 解決 | 401 にならない |
| データ永続化 | 申請後 D1 `requests_queue` に row 追加 | `bash scripts/cf.sh d1 execute ... "SELECT ..."` で確認 |
| エラーハンドリング | network blocked / 5xx 注入 | role=alert 表示 + retry 導線 |
| a11y | axe scan | critical / serious 0 件 |

## 多角的チェック観点

- 取得した screenshot が Phase 2 設計書の component 配置と一致しているか
- TC × AC × evidence path が 1:1 で対応しているか
- 不変条件 #4 / #5 / #11 が DOM / Network トラフィック上でも違反していないか
- Apple HIG（hierarchy / contrast / whitespace / destructive vs primary / focus 視認性）
- WCAG AA（color contrast / keyboard navigation / role / aria）
- N/A 理由（dark mode 非対応 / mobile 任意）が明記されているか
- 実 screenshot 取得前に capture metadata の `taskId` が `06b-B-profile-self-service-request-ui` と一致しているか
- 未実測を PASS と扱っていないか

## サブタスク管理

- [ ] PRE-1..PRE-5 を確認
- [ ] `screenshot-plan.json` を作成（TC-01..TC-09）
- [ ] dev / preview 起動と疎通確認
- [ ] シナリオ S1..S6 を実行し SS を撮影
- [ ] Playwright spec を実行し trace / video / console / HAR を取得
- [ ] artifact を `outputs/phase-11/` 配下へ集約
- [ ] `manual-test-result.md` / `screenshot-coverage.md` / `ui-sanity-visual-review.md` / `discovered-issues.md` / `phase11-capture-metadata.json` を作成
- [ ] `validate-phase11-screenshot-coverage.js` を実行し PASS を確認
- [ ] `outputs/phase-11/main.md` を更新

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| Phase 11 結果 index | `outputs/phase-11/main.md` | 実行サマリ / 必須 outputs リンク / 判定 |

## 完了条件

- [ ] PRE-1..PRE-5 が全て満たされている
- [ ] TC-01..TC-09 の screenshot が `outputs/phase-11/screenshots/` に保存されている
- [ ] 各 TC が AC-1..AC-7 と紐付いている
- [ ] Playwright trace / video / console / HAR が `outputs/phase-11/e2e/` に保存されている
- [ ] `screenshot-plan.json` / `screenshot-coverage.md` / `phase11-capture-metadata.json` が一致
- [ ] `validate-phase11-screenshot-coverage.js` が PASS
- [ ] axe scan で critical / serious 0 件
- [ ] `discovered-issues.md` が作成されている（0 件でも）
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認【必須】

- [ ] capture metadata の `taskId` が `06b-B-profile-self-service-request-ui` と一致
- [ ] dummy PNG / placeholder で false green を作っていない
- [ ] 06b-A 完了 gate を Phase 11 PRE-2 として明記している
- [ ] 完了済み本体タスクの復活ではなく未反映 UI の実 evidence になっている
- [ ] 実装、deploy、commit、push、PR を Phase 11 単独では実行していない（commit/push/PR は Phase 13 で user approval 取得後）

## 次 Phase への引き渡し

Phase 12 へ、screenshot / E2E artifact path、AC × TC マッピング結果、`discovered-issues.md`、approval gate（Phase 13 PR 作成前の user approval）を渡す。
