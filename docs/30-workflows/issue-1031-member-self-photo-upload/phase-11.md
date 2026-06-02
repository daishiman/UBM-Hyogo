# Phase 11: 手動テスト / 視覚証跡（VISUAL_ON_EXECUTION）

> **[実装区分: 実装仕様書]**

> **VISUAL_ON_EXECUTION**: ローカル component-harness でのスクリーンショット取得は実装サイクルで実施。
> authenticated member session が必要なテスト・R2 bucket 動作確認・staging deploy はすべて **user-gated** であり、
> authenticated staging screenshot は user-gated runtime operation として残す。

---

## 11.1 評価の3層構造

| 層 | 観点 | 確認内容 |
|----|------|---------|
| Semantic | 構造・機能 | photo 有 / 無の profile avatar DOM、upload/delete affordance の存在、audit log 記録、AC-2（own-only mutation）、AC-7（rulesConsent）、AC-8（rateLimitSelfRequest） |
| Visual | 見た目・token | `<img>` 表示時のレイアウト崩れ無し、hue placeholder との pixel diff（写真無し時ゼロ要件 AC-9）、OKLch token のみ使用（HEX 直書きなし） |
| AI UX | ユーザー体験 | upload 操作フロー（ファイル選択→確認→成功/失敗）の明快さ、loading state の可視性、delete confirm Modal の操作性、error 表示（MIME 拒否・サイズ超過・rate limit）の分かりやすさ |

---

## 11.2 撮影対象 screenshot（canonical 名一覧）

local component-harness evidence は下記パスへ保存する。staging runtime capture 時も同じ canonical 名を使う。

```
outputs/phase-11/screenshots/
  member-photo-upload-empty.png          # 写真未登録状態（hue placeholder + upload ボタン）
  member-photo-upload-selected.png       # ファイル選択後（プレビュー表示・upload ボタン有効）
  member-photo-uploaded.png              # 写真登録後（<img> 表示・delete ボタン有効）
  member-photo-delete-confirm.png        # delete confirm Modal 表示状態
  member-photo-upload-loading.png        # upload 中（spinner / button disabled 状態）
  member-photo-upload-error.png          # upload 失敗時（error メッセージ表示）
```

命名規約: `<component>-<state>.png` 形式（Phase 1 AC 命名に準拠）。

> **撮影対象**: `apps/web/app/(member)/profile/` の `PhotoUpload.client.tsx` をマウントした profile ページ。
> component-harness 代替可能（authenticated staging が無い場合は `PhotoUpload.client.component.spec.tsx` の jsdom + `@testing-library/react` でレンダリングした DOM を screenshot ツールで撮影）。

---

## 11.3 Playwright visual 仕様

### テストファイル

```
apps/web/tests/e2e/member-profile-photo-upload.spec.ts
```

### Baseline 分離方針

| テストシナリオ | Baseline | 説明 |
|--------------|---------|------|
| 写真未登録 member の profile avatar | `photo-empty-baseline` | AC-9 検証。pixel diff = 0 が必須（現行 hue placeholder と同一） |
| 写真あり member の profile avatar | `photo-uploaded-baseline` | `<img>` が render されることを確認 |
| upload 中の loading state | `upload-loading-baseline` | ボタン disabled + spinner 確認 |
| delete confirm Modal 表示 | `delete-confirm-baseline` | Modal が表示され backdrop / focus trap が機能していること |

### capture script パターン（FB-MSO-003 標準化）

```ts
// member-profile-photo-upload.spec.ts (capture 部分)
test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    // member session で /(member)/profile を開く
    await page.goto('/(member)/profile');
    // photoUrl 未設定状態で撮影
    await page.screenshot({
      path: 'outputs/phase-11/screenshots/member-photo-upload-empty.png',
    });
    // ... 各状態のスクリーンショットを取得
  } finally {
    await page.close();
    await browser.close(); // FB-MSO-003: try/finally で必ず close
  }
});
```

> **FB-MSO-003 準拠**: capture script には必ず `try/finally { await page.close(); await browser.close() }` を入れる。
> finally ブロックを省略しない（教訓 L-MSO-003）。

---

## 11.4 component-harness 代替の可否

| テストシナリオ | staging 不要で可否 | 代替方法 |
|--------------|-----------------|---------|
| 写真未登録時の hue placeholder 表示（AC-9 baseline） | **可（代替有）** | `PhotoUpload.client.component.spec.tsx` の jsdom render + screenshot ライブラリ、または Storybook/component-test ハーネス |
| upload 中 loading state | **可（代替有）** | `uploading` 状態を直接 mock して render |
| delete confirm Modal | **可（代替有）** | delete ボタンを click する testing-library の act で Modal 表示 |
| upload 成功後の `<img>` 表示 | **要 staging** | `uploadOwnPhoto` を mock すれば代替可（server 実連携は staging で確認） |
| MIME 拒否・413 エラー表示 | **可（代替有）** | `uploadOwnPhoto` を mock し `PhotoRequestError` を throw して UI 確認 |
| presign URL 実動作（TTL / SigV4） | **要 staging** | local では mock。staging で `curl` 確認（RT-OPS-007） |

---

## 11.5 R2 / secret 未設定時の fail-soft 確認手順

実装サイクルで staging deploy 前に以下を手動確認する（user-gated runbook）。

1. **R2 binding 未設定の状態で** `GET /me/profile` を fetch:
   - 期待: `photoUrl` フィールドが response に**含まれない**（fail-soft = 省略）
   - 期待: profile 本体は `200` を返す（photoUrl 無しで全体 500 にならない）
   - 確認コマンド: `curl -H "Cookie: ..." https://{staging-api-url}/me/profile | jq .`

2. **secret 未設定（presign 失敗）の状態での avatar 表示**:
   - 期待: `PhotoUpload` が hue placeholder を表示する（`<img>` が出ない）
   - 確認: DevTools → Network タブで R2 への無効リクエストが出ていないこと

3. **staging で正常系を確認**（RT-OPS-003〜006 完了後）:
   - `POST /me/photo` に jpeg ファイルを送信 → `{ ok: true }` が返ること
   - `GET /me/profile` の response に `photoUrl: "https://...r2.cloudflarestorage.com/...?X-Amz-Signature=..."` が含まれること
   - profile ページで `<img>` が表示され、TTL 300s 経過後に refresh で fallback になること

---

## 11.6 手動テスト チェックリスト

### 環境

| 項目 | 値 |
|------|-----|
| local dev | `mise exec -- pnpm --filter @ubm-hyogo/web dev`（R2 mock 無し → photoUrl 省略で動作確認） |
| staging | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/` |
| テスト member アカウント | staging 認証済み member session（ユーザーが用意） |
| R2 bucket | `ubm-hyogo-member-photos-staging`（#983 で作成済みの場合は継続利用。user-gated 確認） |

### Task A — API / storage 確認（user-gated）

- [ ] `POST /me/photo` に jpeg ファイルを送信 → `{ ok: true }` が返る
- [ ] R2 に `members/{memberId}/avatar` が保存されていることをコンソールで確認
- [ ] D1 `member_photos` 表に行が upsert（`source='self'`）されていること
- [ ] D1 `member_photos.source` が `'self'` であること（`bash scripts/cf.sh d1 ...` 経由で SELECT 確認）
- [ ] audit_log に `member.photo_uploaded` が記録されていること（`actor = session email`）
- [ ] `GET /me/profile` の response に `photoUrl` が含まれ、URL が TTL 300s の署名付きであること
- [ ] 256KB 超ファイルを送信 → `413` が返ること
- [ ] `image/gif` を送信 → `415` が返ること
- [ ] 未認証（Cookie なし）で `POST /me/photo` → `401` が返ること
- [ ] `DELETE /me/photo` → `{ ok: true }` / audit `member.photo_deleted` 確認
- [ ] 写真未登録時に `DELETE /me/photo` → `404` が返ること

### Task B — UI / profile 確認（一部 component-harness 代替可）

- [ ] profile ページを開いた際、写真あり member に `<img>` が表示される（hue ではなく写真）
- [ ] 写真なし member の profile avatar は現行 hue placeholder と変わらない（AC-9）
- [ ] 「写真をアップロード」ボタンを押してファイル選択 → upload 中に spinner / disabled 状態
- [ ] upload 成功後に avatar が写真に差し替わる（router.refresh で Server Component 再取得）
- [ ] 「写真を削除」ボタン → delete confirm Modal → 削除後 hue placeholder に戻る
- [ ] MINOR-4（router.refresh 二重 fetch の体感）を確認し、問題の有無を記録
- [ ] DevTools で `<img src>` の URL が `r2.cloudflarestorage.com` の presigned URL であること
- [ ] OKLch token のみ使用（HEX 直書きなし。DevTools computed style で確認）

### Task C — 認証・rate limit 確認（staging 必要）

- [ ] `rulesConsent` 未同意アカウントで `POST /me/photo` → `403 RULES_CONSENT_REQUIRED` が返ること
- [ ] 60s 以内に 6 回連続 `POST /me/photo` → `429` が返ること

---

## 11.7 evidence ファイル構成

実装サイクル完了後に以下を `outputs/phase-11/` に配置する。

```
outputs/phase-11/
  phase-11.md                   # 本ファイル（チェックリスト記録）
  main.md                       # evidence index（screenshot 一覧）
  manual-test-result.md         # チェックリスト結果記録
  manual-test-report.md         # テスト概要レポート
  discovered-issues.md          # 発見した不具合・懸念点（MINOR-4 の体感結果含む）
  ui-sanity-visual-review.md    # visual 評価メモ
  screenshot-plan.json          # 撮影計画（canonical 名）
  phase11-capture-metadata.json # 撮影実績（timestamp / environment）
  screenshot-coverage.md        # 撮影対象 vs 撮影済み一覧
  screenshots/
    member-photo-upload-empty.png
    member-photo-upload-selected.png
    member-photo-uploaded.png
    member-photo-delete-confirm.png
    member-photo-upload-loading.png
    member-photo-upload-error.png
```

---

## 完了条件（Phase 11）

- [ ] 3層評価（Semantic / Visual / AI UX）のチェックリストが全項目 pass（または user-gated 項目は pending として記録）
- [ ] `outputs/phase-11/screenshots/` に canonical 名の screenshot が揃っている（component-harness 代替含む）
- [ ] AC-9 pixel diff ゼロ（写真未登録 member の baseline と一致）が Playwright または component-harness で確認されている
- [ ] R2 binding 未設定時の fail-soft（profile 200 / photoUrl 省略）が手動確認またはテストで確認されている
- [ ] capture script に `try/finally { page.close(); browser.close() }` が実装されている（FB-MSO-003 準拠）
- [ ] MINOR-4（router.refresh 体感）の確認結果が `discovered-issues.md` に記録されている
- [ ] staging 環境での実施は user-gated runbook に従いユーザー承認後のみ実行している

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
実装サイクル後に member self-photo-upload の profile UI の semantic、visual、AI UX 証跡を取得する。

## 実行タスク
- canonical screenshot を取得する。
- fail-soft と pixel diff を確認する。
- MINOR-4 の体感確認を記録する。

## 参照資料
- `outputs/phase-11/screenshot-plan.json`
- `phase-10.md`

## 成果物
- Phase 11 runtime evidence plan and result files

## 統合テスト連携
Playwright visual spec と manual smoke が Phase 12 compliance の根拠になる。
