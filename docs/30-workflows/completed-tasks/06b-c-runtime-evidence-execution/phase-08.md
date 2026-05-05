# Phase 8: manual-smoke-evidence の同期 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 8 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution + docs sync） |
| user_approval_required | false |

## 目的

`docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/manual-smoke-evidence.md` の `pending` 行を、Phase 7 判定の `captured` / `blocked` / `fail` に書き換える。本タスクのスコープでは M-14 / M-15 もここで取得を試みる。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 7 AC matrix、現状の `manual-smoke-evidence.md` |
| 出力 | 更新済 `manual-smoke-evidence.md`、`outputs/phase-08/main.md` |

## 現状（書き換え前）の `manual-smoke-evidence.md`

```md
| Marker | Status | Path | Captured At |
| --- | --- | --- | --- |
| M-08 | pending_runtime_evidence | screenshots/M-08-desktop-{date}.png, screenshots/M-08-mobile-{date}.png | pending user-approved runtime execution |
| M-09 | pending_runtime_evidence | dom/M-09-no-form-{desktop,mobile}.json | pending user-approved runtime execution |
| M-10 | pending_runtime_evidence | dom/M-10-edit-query-ignored-{desktop,mobile}.json + screenshots/M-10-{desktop,mobile}-{date}.png | pending user-approved runtime execution |
| M-14 | pending_manual_runtime_evidence | screenshots/M-14-flow-{date}.png | pending user-approved Magic Link smoke |
| M-15 | pending_manual_runtime_evidence | screenshots/M-15-flow-{date}.png | pending user-approved Google OAuth smoke |
| M-16 | pending_runtime_evidence | screenshots/M-16-redirect-{date}.png | pending user-approved runtime execution |
```

## 8.1 M-08 / M-09 / M-10 / M-16 の同期

Phase 7 判定に従い書き換える。書き換え例:

```md
| M-08 | captured | screenshots/M-08-desktop-2026-05-04.png, screenshots/M-08-mobile-2026-05-04.png | 2026-05-04T10:23:45Z |
| M-09 | captured | dom/M-09-no-form-desktop.json, dom/M-09-no-form-mobile.json (counts=0) | 2026-05-04T10:23:46Z |
| M-10 | captured | dom/M-10-edit-query-ignored-desktop.json, dom/M-10-edit-query-ignored-mobile.json + screenshots/M-10-desktop-2026-05-04.png, screenshots/M-10-mobile-2026-05-04.png | 2026-05-04T10:23:47Z |
| M-16 | captured | screenshots/M-16-redirect-2026-05-04.png | 2026-05-04T10:23:48Z |
```

FAIL の場合の例:

```md
| M-09 | fail | dom/M-09-no-form-desktop.json (form=2 detected — invariant #4 violation) | 2026-05-04T10:23:46Z |
```

BLOCKED の例:

```md
| M-08 | blocked | reason: storageState expired during execution; retried 3 times (Phase 10) | 2026-05-04T10:30:00Z |
```

## 8.2 M-14 / M-15（手動取得を試みる）

### M-14: Magic Link → `/profile`

1. signed-out 状態にする（cookies / storageState を一旦消去 or new browser profile）
2. `<approved-target>/login` で email を入力（テストアカウント）
3. メール受信 → Magic Link クリック → `/profile` 到達
4. `/profile` 表示状態で OS 標準スクショ または Playwright `--headed` でキャプチャ
5. **redaction**: URL bar に token が映っていたら画像エディタで該当領域を黒塗り
6. `outputs/phase-11/screenshots/M-14-flow-{date}.png` に保存

取得不能な場合（メール環境未接続、SMTP 未設定等）:

```md
| M-14 | blocked | reason: SMTP not configured for <approved-target>; Magic Link mail not delivered | 2026-05-04T10:35:00Z |
```

### M-15: Google OAuth → `/profile`

1. signed-out 状態にする
2. `/login` で「Google でログイン」
3. consent 画面 → `/profile` 到達
4. capture + redaction（OAuth 画面に映る email / avatar も redact 検討）
5. `outputs/phase-11/screenshots/M-15-flow-{date}.png` に保存

取得不能な場合:

```md
| M-15 | blocked | reason: Google OAuth client not registered for <approved-target> | 2026-05-04T10:38:00Z |
```

## 8.3 placeholder の `{date}` 表記の解消

書き換え後の `manual-smoke-evidence.md` には `{date}` プレースホルダを残さない。実 ISO8601 タイムスタンプ（`2026-05-04T10:23:45Z` 形式）と実 file 名に置き換える。

## 完了条件チェックリスト

- [ ] M-08 / M-09 / M-10 / M-16 の status が `captured` / `fail` / `blocked` のいずれかに更新
- [ ] M-14 / M-15 の status が `captured` / `blocked` のいずれかに更新（Issue scope-out だが docs 更新範囲）
- [ ] `pending_runtime_evidence` / `pending_manual_runtime_evidence` の文字列が 0 件
- [ ] `{date}` placeholder が 0 件
- [ ] `outputs/phase-08/main.md` に diff サマリを記録

## 次 Phase への引き渡し

Phase 9 へ「更新済み `manual-smoke-evidence.md`」を引き渡す。Phase 9 は secret 露出の最終確認。
