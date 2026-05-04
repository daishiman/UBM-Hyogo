# Phase 2: 設計 — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 2 / 13 |
| wave | 6b-fu |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

Phase 1 で確定した AC を「Playwright spec + evidence capture script」「screenshot 命名規約」「DOM 検証 selector 一覧」「storageState 取得手順」に落とす。アプリ本体（`apps/web/app/profile/**` / `apps/api/**`）には変更を加えない。

## 実行タスク

1. evidence 取得方式（Playwright headless + storageState）を確定し、staging への安全な接続境界を定義する。
2. screenshot 命名規約・配置先・viewport を確定する。
3. DOM read-only 検証の selector / assert を一意に確定する。
4. capture script（CLI ラッパー）の入出力契約を確定する。
5. redaction 方針（Magic Link URL / email / session token）を確定する。

## 参照資料

- Phase 1 outputs/main.md
- `apps/web/playwright.config.ts`（既存）
- `apps/web/playwright/fixtures/auth.ts`（06b-A 完了で導入予定）
- `docs/00-getting-started-manual/specs/06-member-auth.md`

## 設計

### 2.1 evidence 取得方式

| 区分 | 方式 |
| --- | --- |
| M-08 / M-09 / M-10 / M-16 | Playwright headless（storageState 経由でログイン状態再現） |
| M-14 / M-15 | manual 操作 + Playwright `--headed` で screenshot 取得（Magic Link / Google OAuth は人手が必要） |

storageState は staging 上で **1 回ログイン → `apps/web/playwright/.auth/member-state.json` に保存**（`*.json` は gitignore 必須）。capture script はこの state file を `--storage-state` 引数で渡す。

### 2.2 ファイル配置

| 種別 | パス | 役割 |
| --- | --- | --- |
| 新規 | `apps/web/playwright/tests/profile-readonly.spec.ts` | M-08 / M-09 / M-10 / M-16 を 1 spec に集約 |
| 編集 | `apps/web/playwright.config.ts` | `staging` project（`baseURL` / `storageState` / `viewport` 切替）追加 |
| 新規 | `apps/web/playwright/.auth/.gitkeep` | state.json 配置先（state.json 自体は gitignore） |
| 編集 | root `.gitignore` | `apps/web/playwright/.auth/*.json` を ignore |
| 新規 | `scripts/capture-profile-evidence.sh` | Playwright を起動し screenshot/dom dump を本タスク `outputs/phase-11/` に配置 |
| 編集（実測時のみ） | `outputs/phase-11/manual-smoke-evidence.md` | placeholder 行 → captured 行に更新 |

### 2.3 screenshot 命名規約

```
outputs/phase-11/screenshots/{MARKER}-{viewport}-{YYYYMMDD}.png
```

- MARKER: `M-08` / `M-10` / `M-14` / `M-15` / `M-16`
- viewport: `desktop` (1280x800) / `mobile` (390x844)
- date: `date +%Y%m%d`

DOM dump:
```
outputs/phase-11/dom/{MARKER}-{slug}.json
```
例: `M-09-no-form-{desktop,mobile}.json` / `M-10-edit-query-ignored-{desktop,mobile}.json`

### 2.4 DOM read-only 検証 selector

| 観点 | selector | 期待 count |
| --- | --- | --- |
| 編集 form | `form[data-edit], form[action*="profile"], form[method="post"]` | 0 |
| input 要素 | `input:not([type="hidden"]):not([type="search"])` | 0 |
| textarea | `textarea` | 0 |
| submit ボタン | `button[type="submit"], input[type="submit"]` | 0 |
| 編集遷移 link | `a[href*="/profile/edit"]` | 0 |
| 申請 UI（許容） | `[data-testid="request-action-panel"] button` | 任意（本文編集ではないので除外） |

DOM dump JSON 構造:

```json
{
  "url": "https://staging.example/profile",
  "capturedAt": "2026-05-03T12:00:00Z",
  "counts": { "form": 0, "input": 0, "textarea": 0, "submit": 0, "editLink": 0 },
  "raw": { "form": [], "input": [], "textarea": [], "submit": [], "editLink": [] }
}
```

### 2.5 capture script の入出力契約

```bash
scripts/capture-profile-evidence.sh \
  --base-url https://staging.example \
  --storage-state apps/web/playwright/.auth/member-state.json \
  --out-dir docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11 \
  --markers M-08,M-09,M-10,M-16
```

- 内部で `pnpm --filter @ubm-hyogo/web exec playwright test profile-readonly --reporter=line` を呼ぶ
- `--markers M-14,M-15` 時は `--headed` 強制 + ユーザー手動操作の標準出力ガイド
- exit code: 0=success / 2=DOM count 違反 / 3=network 失敗 / 4=storageState 不在

### 2.6 redaction 順序（screenshot 取得「前」に必ず実行）

| 種別 | 対象 | 方法 |
| --- | --- | --- |
| email | DOM 表示 | Playwright で `[data-testid="member-email"]` の textContent を `***@***` に上書き |
| Magic Link URL | URL bar | manual capture 時は撮影前に `about:blank` 経由 or URL bar を crop で除外 |
| session token | DevTools 表示 | DevTools を開いた状態で screenshot しない（運用ルール） |

## 統合テスト連携

- 06b-A 由来の auth fixture を再利用する。未導入なら本 Phase 設計に簡易 storageState 取得手順を含める（CLI: `pnpm --filter @ubm-hyogo/web exec playwright codegen --save-storage=...`）。
- 09a staging visual smoke は profile readonly 部分を本 spec から流用可能。

## 多角的チェック観点

- invariant #4 / #5 / #8 / #11 を selector レベルで実測しているか
- staging-only に閉じる構造（production URL を baseURL にしない安全装置）か
- storageState を gitignore で除外しているか
- redaction が screenshot 取得「前」に行われているか

## サブタスク管理

- [ ] 取得方式の確定
- [ ] ファイル配置の確定
- [ ] screenshot 命名規約の確定
- [ ] DOM selector / assert 表の確定
- [ ] capture script CLI 契約の確定
- [ ] redaction 順序の確定
- [ ] outputs/phase-02/main.md に設計要約を記載

## 成果物

| 成果物 | パス |
| --- | --- |
| 設計書 | `outputs/phase-02/main.md` |

## 完了条件 (DoD)

- [ ] Playwright spec / config 編集 / capture script の 3 ファイルが「変更種別 × 配置先 × 役割」で記述されている
- [ ] DOM selector 表と期待 count が確定している
- [ ] redaction 順序が確定している
- [ ] アプリ本体への変更が含まれていない

## タスク100%実行確認

- [ ] 設計が Phase 1 AC をすべてカバーしている
- [ ] `apps/web/app/profile/**` や `apps/api/**` に変更が入る設計になっていない

## 次 Phase への引き渡し

Phase 3 へ、設計表・selector 表・CLI 契約・redaction 順序を渡す。
