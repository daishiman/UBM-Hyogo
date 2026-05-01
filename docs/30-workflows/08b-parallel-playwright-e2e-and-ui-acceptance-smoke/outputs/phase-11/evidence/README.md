# Phase 11 evidence ディレクトリ

> 本タスク（08b spec_created）では実 evidence は **未取得**。プレースホルダのみ配置。
> 後続実装 task が `outputs/phase-11/main.md` の手順で実 evidence をここへ書き出す。

## ディレクトリ構造

```
evidence/
├── README.md                      ← 本ファイル（命名規約 + 必須リスト）
├── desktop/                       ← desktop screenshot 29 枚
│   ├── .gitkeep
│   ├── SCREENSHOT_LIST.md
│   └── *.png                      ← 後続実装 task が配置
├── mobile/                        ← mobile screenshot 15 枚
│   ├── .gitkeep
│   ├── SCREENSHOT_LIST.md
│   └── *.png                      ← 後続実装 task が配置
├── playwright-report/             ← Playwright HTML report
│   ├── README.md
│   ├── index.html                 ← 後続実装 task が配置
│   └── data/                      ← 後続実装 task が配置
├── axe-report.json                ← a11y 集約 JSON（プレースホルダ）
├── ci-workflow.yml                ← .github/workflows/e2e-tests.yml の copy
├── public-run.log                 ← 後続実装 task が配置
├── login-run.log                  ← 後続実装 task が配置
├── profile-run.log                ← 後続実装 task が配置
├── admin-run.log                  ← 後続実装 task が配置
├── search-run.log                 ← 後続実装 task が配置
├── density-run.log                ← 後続実装 task が配置
├── attendance-run.log             ← 後続実装 task が配置
└── a11y-run.log                   ← 後続実装 task が配置
```

## 命名規約

### screenshot

```
{viewport}/{screen}[-{state}].png
```

- `{viewport}`: `desktop` | `mobile`
- `{screen}`: `landing` | `members-list` | `members-detail` | `register` | `login` | `profile` | `admin-dashboard` | `admin-members` | `admin-tags` | `admin-schema` | `admin-meetings` | `search` | `density` | `attendance`
- `{state}` (任意): `input` | `sent` | `unregistered` | `rules-declined` | `deleted` | `after-reload` | `edit-response-url` | `forbidden-member` | `redirect-login` | `q` | `zone-status` | `tag` | `sort` | `combo` | `comfy` | `dense` | `list` | `dup-toast` | `deleted-excluded`

例:
- `desktop/login-unregistered.png`
- `mobile/members-list.png`
- `desktop/profile-edit-response-url.png`
- `desktop/attendance-dup-toast.png`

### 命名禁止事項

- email / token / cookie 値をファイル名に含めない（secret hygiene）
- 日付・タイムスタンプはファイル名に含めない（git diff ノイズ防止）
- `IMG_xxx.png` のような自動生成名は禁止

## 撮影トリガ

| トリガ | 撮影タイミング | 仕組み |
| --- | --- | --- |
| 全 test 完了時 | `await page.screenshot({ path })` | 各 spec の末尾で明示呼び出し |
| failure 時 | `playwright.config.ts` の `use.screenshot: 'only-on-failure'` | 自動取得（Playwright builtin） |
| trace 取得時 | `use.trace: 'retain-on-failure'` | trace.zip 内に snapshot 同梱 |

## 必須 screenshot リスト（44 枚）

詳細は以下を参照:

- desktop: `desktop/SCREENSHOT_LIST.md`（29 枚）
- mobile: `mobile/SCREENSHOT_LIST.md`（15 枚）

→ AC-7「screenshot ≥ 30 枚」充足（44 ≥ 30）

## secret hygiene チェック

evidence commit 前に以下を確認:

- [ ] log ファイルに email / token / cookie 値が含まれない（`grep -E '(@|Bearer|token=|sess=)' *.log` で 0 hit）
- [ ] screenshot に email / 個人名（テストデータ以外）が映っていない
- [ ] axe-report.json に DOM 内 PII が含まれない

## 関連ドキュメント

- `../main.md` — 実行手順
- `../../phase-04/verify-matrix.md` — verify row 一覧
- `../../phase-07/ac-matrix.md` — AC ↔ screenshot 1:1 トレース
