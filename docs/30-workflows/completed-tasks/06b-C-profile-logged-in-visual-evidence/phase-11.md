# Phase 11: 手動 smoke / 実測 evidence — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 11 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |
| user_approval_required | **true**（staging アクセス / 認証情報の利用） |

## 目的

staging 環境に対して実測 evidence を取得し、`outputs/phase-11/` 配下に配置する。`manual-smoke-evidence.md` の placeholder 行を captured 行に更新する。

## user approval gate

実行前に user に以下を確認する。

1. staging 環境（`https://staging.example`）にアクセスして良いか
2. テスト用 member account（Magic Link / Google OAuth）の認証情報を利用して良いか
3. screenshot を `docs/` 配下にコミットして良いか（PII redaction 済の前提）

approval が得られるまで本 Phase の実行操作は開始しない。

## 実行手順

### 11.1 storageState 取得（一度きり）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright codegen \
  --save-storage=apps/web/playwright/.auth/state.json \
  https://staging.example/login
```

ブラウザ上で Magic Link または Google OAuth でログインし、`/profile` まで到達したら codegen を閉じる。state.json が生成される。**コミットしない**こと（gitignore で保護済）。

### 11.2 自動取得（M-08 / M-09 / M-10 / M-16）

```bash
bash scripts/capture-profile-evidence.sh \
  --base-url https://staging.example \
  --storage-state apps/web/playwright/.auth/state.json \
  --out-dir docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-11 \
  --markers M-08,M-09,M-10,M-16
```

成功条件:
- exit 0
- `outputs/phase-11/screenshots/` に M-08 desktop/mobile + M-10 desktop/mobile + M-16 = 5 枚以上
- `outputs/phase-11/dom/` に M-09-no-form-{desktop,mobile}.json + M-10-edit-query-ignored-{desktop,mobile}.json
- 各 JSON の `counts` がすべて 0

### 11.3 手動取得（M-14 / M-15）

Magic Link:
1. staging で signed-out 状態にする
2. `https://staging.example/login` で email 入力
3. メール受信 → Magic Link クリック → `/profile` 到達
4. Playwright `--headed` で `/profile` 表示中に screenshot 取得 or OS 標準スクショ
5. URL bar / email 表示の redaction を確認した上で `outputs/phase-11/screenshots/M-14-flow-{date}.png` に配置

Google OAuth:
1. signed-out 状態
2. `/login` で「Google でログイン」
3. consent → `/profile` 到達
4. screenshot 取得・redaction → `M-15-flow-{date}.png` に配置

### 11.4 redaction チェック

```bash
# 軽量視覚チェック（手元）
open docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/screenshots/*.png
```

各 screenshot で email / Magic Link URL / session token が見えないことを目視確認。漏れている場合は破棄して再取得。

### 11.5 manual-smoke-evidence.md 更新

`outputs/phase-11/manual-smoke-evidence.md` を以下構造で作成 / 更新:

```md
# 06b-C profile logged-in visual evidence

| Marker | Status | Path | Captured At |
| --- | --- | --- | --- |
| M-08 | captured | screenshots/M-08-desktop-{date}.png, M-08-mobile-{date}.png | {ISO8601} |
| M-09 | captured | dom/M-09-no-form-{desktop,mobile}.json | {ISO8601} |
| M-10 | captured | dom/M-10-edit-query-ignored-{desktop,mobile}.json + screenshots/M-10-desktop-{date}.png | {ISO8601} |
| M-14 | captured | screenshots/M-14-flow-{date}.png | {ISO8601} |
| M-15 | captured | screenshots/M-15-flow-{date}.png | {ISO8601} |
| M-16 | captured | screenshots/M-16-redirect-{date}.png | {ISO8601} |
```

placeholder 行が `pending` / `placeholder` のままなら必ず `captured` に更新する。

### 11.6 invariant 違反時

Phase 6 のフェイル方針に従い、`outputs/phase-11/dom/INVARIANT-VIOLATION-{date}.json` を保存し、Phase 12 の `unassigned-task-detection.md` に follow-up タスク提案を記載する。

## サブタスク管理

- [ ] user approval 取得
- [ ] storageState 取得
- [ ] 自動取得 M-08/M-09/M-10/M-16
- [ ] 手動取得 M-14/M-15
- [ ] redaction 目視確認
- [ ] manual-smoke-evidence.md 更新
- [ ] outputs/phase-11/main.md に実測サマリ記載

## 成果物

| 成果物 | パス |
| --- | --- |
| screenshot 群 | `outputs/phase-11/screenshots/*.png` |
| DOM dump 群 | `outputs/phase-11/dom/*.json` |
| smoke 一覧 | `outputs/phase-11/manual-smoke-evidence.md` |
| 実測サマリ | `outputs/phase-11/main.md` |

## 完了条件

- [ ] M-08〜M-10 / M-14〜M-16 すべての evidence が配置済
- [ ] DOM dump の counts がすべて 0
- [ ] manual-smoke-evidence.md が `captured` で 6 行
- [ ] redaction 漏れなし
- [ ] storageState がコミットされていない（`git ls-files` で 0 hit）

## タスク100%実行確認

- [ ] user approval を取得した上で実行している
- [ ] production を baseURL に指定していない
- [ ] PII を含む screenshot をそのまま保存していない

## 次 Phase への引き渡し

Phase 12 へ、実測結果サマリ・invariant 違反の有無・follow-up 候補を引き渡す。
