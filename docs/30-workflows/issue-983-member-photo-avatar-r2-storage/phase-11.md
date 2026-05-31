# Phase 11: 手動テスト / 視覚証跡（VISUAL_ON_EXECUTION）

> **[実装区分: 実装仕様書]**

> **VISUAL_ON_EXECUTION**: local static screenshot は実装サイクルで取得済み。
> R2 bucket (`ubm-hyogo-member-photos-staging`) 作成 / `R2_*` secret 投入 / staging deploy はすべて **user-gated** であり、
> authenticated staging screenshot は user-gated runtime operation として残す。

---

## 11.1 評価の3層構造

| 層 | 観点 | 確認内容 |
|----|------|---------|
| Semantic | 構造・機能 | photo 有 / 無 の avatar DOM、upload/delete affordance の存在、audit log 記録 |
| Visual | 見た目・token | `<img>` 表示時のレイアウト崩れ無し、placeholder との pixel diff（写真無し時ゼロ要件） |
| AI UX | ユーザー体験 | upload 操作フロー（ファイル選択→確認→成功/失敗）の明快さ、loading state の可視性 |

---

## 11.2 撮影対象 screenshot（canonical 名一覧）

local static evidence は下記パスへ保存済み。staging runtime capture 時も同じ canonical 名を使う。

```
outputs/phase-11/screenshots/
  member-avatar-photo.png              # drawer open / 写真あり avatar 表示
  member-avatar-placeholder.png        # drawer open / 写真なし（hue placeholder）表示
  member-drawer-photo-upload.png       # upload affordance（ファイル選択済みボタン有効状態）
  member-drawer-photo-deleted.png      # 削除後の hue placeholder に戻った状態
  member-avatar-upload-loading.png     # upload 中の spinner / button disabled 状態
  member-avatar-img-error-fallback.png # 写真有だが <img> onError 発生 → hue fallback 状態
```

命名規約: `<component>-<state>.png` 形式（Phase 1 AC 命名に準拠）。

---

## 11.3 Playwright visual 仕様

### テストファイル

```
apps/web/tests/e2e/admin-member-photo-avatar.spec.ts
```

### Baseline 分離方針

| テストシナリオ | Baseline | 説明 |
|--------------|---------|------|
| 写真未登録 member の avatar | `placeholder-baseline` | AC-4 検証。pixel diff = 0 が必須 |
| 写真あり member の avatar | `photo-baseline` | `<img>` が render されることを確認 |
| `<img>` onError 時の fallback | `placeholder-baseline` と同一 | onError 後は hue placeholder と同一 DOM になること |
| upload loading state | `upload-loading-baseline` | ボタン disabled + spinner 確認 |

### capture script パターン（FB-MSO-003 標準化）

```ts
// admin-member-photo-avatar.spec.ts (capture 部分)
test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    await page.goto('/admin/members/{testMemberId}');
    // ... screenshot 取得
    await page.screenshot({
      path: 'outputs/phase-11/screenshots/member-avatar-placeholder.png',
    });
  } finally {
    await browser.close(); // FB-MSO-003: try/finally で必ず close
  }
});
```

> **FB-MSO-003 準拠**: capture script には必ず `try/finally { await browser.close() }` を入れる。
> finally ブロックを省略しない（前サイクルの教訓 L-MSO-003）。

---

## 11.4 R2 bucket / secret 未設定時の fail-soft 確認手順

実装サイクルで staging deploy 前に以下を手動確認する（user-gated runbook）。

1. **R2 bucket 未設定の状態で** `/admin/members/:id` を fetch:
   - 期待: `photoUrl` フィールドが response に**含まれない**（fail-soft = 省略）
   - 期待: detail 本体は `200` を返す（photoUrl 無しで全体 500 にならない）
   - 確認コマンド: `curl -H "Cookie: ..." https://{staging-url}/api/admin/members/{memberId} | jq .`

2. **secret 未設定（presign 失敗）の状態での avatar 表示**:
   - 期待: `MemberAvatar` が hue placeholder を表示する（`<img>` が出ない）
   - 確認: DevTools → Network タブで R2 への無効リクエストが出ていないこと

3. **bucket 設定後の正常系**:
   - `bash scripts/cf.sh secret put R2_ACCOUNT_ID --env staging` 等で secret 投入後
   - `/admin/members/:id` の response に `photoUrl: "https://...r2.cloudflarestorage.com/...?X-Amz-Signature=..."` が含まれること
   - `<img>` が表示され、TTL 300s 経過後に refresh で 403 → fallback になること

---

## 11.5 手動テスト チェックリスト

### 環境

| 項目 | 値 |
|------|-----|
| local dev | `mise exec -- pnpm --filter @ubm-hyogo/web dev`（R2 mock 無し → photoUrl 省略で動作確認） |
| staging | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/` |
| admin アカウント | `manjumoto.daishi@senpai-lab.com`（staging 認証済み session） |
| R2 bucket | `ubm-hyogo-member-photos-staging`（user-gated: staging deploy 後に作成） |

### Task A — API / storage 確認

- [ ] `POST /admin/members/:id/photo` に jpeg ファイルを送信 → `{ ok: true }` が返る
- [ ] R2 に `members/{memberId}/avatar` が保存されていることをコンソールで確認
- [ ] D1 `member_photos` 表に行が upsert されていること（`bash scripts/cf.sh d1 ...` 経由）
- [ ] audit_log に `admin.member.photo_uploaded` が記録されていること
- [ ] `GET /admin/members/:id` の response に `photoUrl` が含まれ、URL が TTL 300s の署名付きであること
- [ ] 256KB 超ファイルを送信 → `413` が返ること
- [ ] `image/gif` を送信 → `415` が返ること
- [ ] `DELETE /admin/members/:memberId/photo` → `{ ok: true }` / audit `admin.member.photo_deleted` 確認

### Task B — UI / avatar 確認

- [ ] MemberDrawer を開いた際、写真あり member に `<img>` が表示される（hue ではなく写真）
- [ ] 写真なし member の drawer avatar は現行 hue placeholder と変わらない（AC-4）
- [ ] 「写真を変更」ボタンを押してファイル選択 → upload 中に spinner / disabled 状態
- [ ] upload 成功後に avatar が写真に差し替わる（re-fetch / state 更新）
- [ ] 「写真を削除」ボタン → 削除確認後 hue placeholder に戻る
- [ ] DevTools で `<img src>` の URL が `r2.cloudflarestorage.com` の presigned URL であること
- [ ] OKLch token のみ使用（HEX 直書きなし。DevTools computed style で確認）

---

## 11.6 evidence ファイル構成

実装サイクル完了後に以下を `outputs/phase-11/` に配置する。

```
outputs/phase-11/
  phase-11.md                   # 本ファイル（チェックリスト記録）
  main.md                       # evidence index（screenshot 一覧）
  manual-test-result.md         # チェックリスト結果記録
  manual-test-report.md         # テスト概要レポート
  discovered-issues.md          # 発見した不具合・懸念点
  ui-sanity-visual-review.md    # visual 評価メモ
  screenshot-plan.json          # 撮影計画（canonical 名）
  phase11-capture-metadata.json # 撮影実績（timestamp / environment）
  screenshot-coverage.md        # 撮影対象 vs 撮影済み一覧
  screenshots/
    member-avatar-photo.png
    member-avatar-placeholder.png
    member-drawer-photo-upload.png
    member-drawer-photo-deleted.png
    member-avatar-upload-loading.png
    member-avatar-img-error-fallback.png
```

---

## 完了条件（Phase 11）

- [ ] 3層評価（Semantic / Visual / AI UX）のチェックリストが全項目 pass
- [ ] `outputs/phase-11/screenshots/` に canonical 名の screenshot が揃っている
- [ ] AC-4 pixel diff ゼロ（写真未登録 member の baseline と一致）が Playwright で確認されている
- [ ] R2 bucket 未設定時の fail-soft（detail 200 / photoUrl 省略）が手動確認されている
- [ ] capture script に `try/finally { browser.close() }` が実装されている（FB-MSO-003 準拠）
- [ ] staging 環境での実施は user-gated runbook に従いユーザー承認後のみ実行している

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
実装サイクル後に admin member photo avatar の semantic、visual、AI UX 証跡を取得する。

## 実行タスク
- canonical screenshot を取得する。
- fail-soft と pixel diff を確認する。

## 参照資料
- `outputs/phase-11/screenshot-plan.json`
- `phase-10.md`

## 成果物
- Phase 11 runtime evidence plan and result files

## 統合テスト連携
Playwright visual spec と manual smoke が Phase 12 compliance の根拠になる。
