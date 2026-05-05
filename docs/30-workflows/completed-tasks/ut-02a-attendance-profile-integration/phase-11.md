# Phase 11: 実装 smoke（NON_VISUAL 縮約テンプレ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 実装 smoke |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| visualEvidence | NON_VISUAL（API curl + UI 通電 markdown） |

## 目的

ローカル環境で API + UI の通電を確認し、AC-8 / AC-9 の evidence を取得する。本タスクは API / repository 実装が中心のため screenshot は不要、API curl JSON + UI 描画観測 markdown で代替する。

## NON_VISUAL 縮約テンプレ準拠

`docs-only` ではなく `implementation` だが UI 自体は実装しないため、Cloudflare Workers production preflight evidence template に準拠した API + UI 通電 evidence で代替する。

## Smoke 手順

### Step 1: API curl evidence

1. ローカル `wrangler dev` で apps/api 起動
2. session を確立し（local fixture / magic link）、token を環境変数に保持
3. `curl -H "Authorization: Bearer ***" https://localhost:8787/me/profile -o evidence.json`
4. `Authorization` ヘッダー値は evidence に**含めない**（`Bearer ***` でマスク）
5. レスポンスが `{ ..., attendance: [{ meetingSessionId, heldAt, ... }, ...] }` を含むことを確認
6. evidence を保存:
   - `outputs/phase-11/evidence/api-curl/me-profile-attendance.json`
   - `outputs/phase-11/evidence/api-curl/me-profile-attendance.curl.txt`（コマンド + マスク済 header）

### Step 2: UI smoke evidence (mypage)

1. apps/web をローカル起動
2. 同 session でマイページ `/profile` または該当 route にアクセス
3. attendance セクションが描画されることを DevTools Network / DOM で確認
4. evidence を markdown で保存:
   - `outputs/phase-11/evidence/ui-smoke/mypage-attendance-rendered.md`
   - 内容: アクセス URL / 観測時刻 / DOM 要素 selector / attendance 行数 / DevTools Network で `/me/profile` レスポンスサイズ
5. token / cookie 値は markdown に**残さない**

### Step 3: UI smoke evidence (admin 詳細)

1. admin で会員詳細画面を開く
2. attendance 履歴セクションが描画されることを確認
3. evidence: `outputs/phase-11/evidence/ui-smoke/admin-detail-attendance-rendered.md`

### Step 4: 不変条件観測

| 不変条件 | 観測項目 | 結果記録先 |
| --- | --- | --- |
| #1 | attendance が form schema 外として独立配置されている | api-curl JSON |
| #4 | admin-managed data が admin 詳細でのみ表示 | admin-detail markdown |
| #5 | apps/web 側で D1 binding 直接アクセスがない | grep `apps/web` で `D1Database` 直接参照ゼロ |

## Secret Hygiene Check

- evidence 4 ファイルを grep:
  - `Bearer ` の後に実トークンが続いていない
  - `cookie:` ヘッダー値が含まれていない
  - メールアドレス / 個人特定情報がマスクされている

## 完了条件

- [ ] api-curl evidence 2 ファイル取得済み
- [ ] ui-smoke evidence 2 ファイル取得済み
- [ ] secret hygiene check PASS
- [ ] 不変条件 #1 / #4 / #5 が観測ノートで記録
- [ ] AC-8, AC-9 が充足

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 主成果物 |
| Evidence | outputs/phase-11/evidence/api-curl/me-profile-attendance.json | API レスポンス |
| Evidence | outputs/phase-11/evidence/api-curl/me-profile-attendance.curl.txt | コマンド + マスク済 header |
| Evidence | outputs/phase-11/evidence/ui-smoke/mypage-attendance-rendered.md | mypage 通電観測 |
| Evidence | outputs/phase-11/evidence/ui-smoke/admin-detail-attendance-rendered.md | admin 詳細通電観測 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 11 を completed

## 次 Phase

- 次: Phase 12 (ドキュメント更新)
- 引き継ぎ: 取得 evidence 4 ファイル + 不変条件観測ノート

## 実行タスク

- [ ] Phase 固有の成果物を作成する
- [ ] 完了条件と次 Phase への引き継ぎを確認する
- [ ] artifacts.json の該当 Phase status を実行時に更新する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/index.md | workflow 全体仕様 |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/artifacts.json | Phase status / outputs 契約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md | legacy source / Canonical Status |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | AC と test matrix の対応を維持 |
| Phase 9 | typecheck / lint / build / regression gate に接続 |
| Phase 11 | NON_VISUAL runtime evidence に接続 |
| Phase 12 | system spec sync と compliance check に接続 |
