# Phase 5: 実装ランブック — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 5 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

Playwright spec / playwright.config.ts 編集 / capture script を「触るファイル × 順序 × 検証コマンド × DoD」まで一意に確定する。本仕様書段階では実装コード作成・commit・push・PR を行わない。

## 実行タスク

1. ステップ 0..7 を順序付け、各ステップに対象ファイル / 関数シグネチャ / I/O / 副作用を割り当てる。
2. 検証コマンドの PASS 条件を表にする。
3. 失敗時の修復方針を明示する。

## 参照資料

| 資料 | パス |
| --- | --- |
| Phase 2 設計 | `outputs/phase-02/main.md` |
| Phase 4 戦略 | `outputs/phase-04/main.md` |
| 既存 Playwright config | `apps/web/playwright.config.ts` |
| 既存 profile page | `apps/web/app/profile/page.tsx`（編集対象外・参照のみ） |
| 既存 profile components | `apps/web/app/profile/_components/*` |

## 実行手順

### ステップ 0: 事前確認（baseline）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
ls apps/web/playwright/tests 2>/dev/null && mkdir -p apps/web/playwright/.auth
rg -n "profile-readonly" apps/web/                                                                # 0 hit (新規)
rg -n "capture-profile-evidence" scripts/                                                         # 0 hit (新規)
```

GREEN でなければステップを進めない。

### ステップ 1: `.gitignore` 編集

| 種別 | パス | 内容 |
| --- | --- | --- |
| 編集 | root `.gitignore` | `apps/web/playwright/.auth/*.json` を追記、`!apps/web/playwright/.auth/.gitkeep` を例外に |

副作用: `member-state.json` / `admin-state.json` がコミット対象から外れる。

### ステップ 2: `apps/web/playwright/.auth/.gitkeep`

| 種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | `apps/web/playwright/.auth/.gitkeep` | 空ファイル |

### ステップ 3: `apps/web/playwright.config.ts` 編集

| 種別 | パス | 編集内容 |
| --- | --- | --- |
| 編集 | `apps/web/playwright.config.ts` | `projects` 配列に `staging` project を追加 |

```ts
{
  name: "staging",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://staging.example",
    storageState: process.env.PLAYWRIGHT_STORAGE_STATE ?? "apps/web/playwright/.auth/member-state.json",
    viewport: { width: 1280, height: 800 },
  },
  testMatch: /tests\/e2e\/.*\.spec\.ts/,
}
```

安全装置: 起動時に `baseURL` が `staging` を含むか確認する `globalSetup` を追加（既存 globalSetup があれば追記）。

### ステップ 4: `apps/web/playwright/tests/profile-readonly.spec.ts`（新規）

| 種別 | パス |
| --- | --- |
| 新規 | `apps/web/playwright/tests/profile-readonly.spec.ts` |

主要関数シグネチャ（spec 内ヘルパー）:

```ts
async function maskPII(page: Page): Promise<void>;
async function readReadonlyCounts(page: Page): Promise<{ form: number; input: number; textarea: number; submit: number; editLink: number }>;
async function dumpDom(page: Page, marker: string, testInfo: TestInfo): Promise<void>;
```

I/O:
- 入力: `baseURL` + `storageState`
- 出力: screenshot (`testInfo.attach("screenshot", ...)`) / DOM dump JSON (`testInfo.attach("dom", ...)`)
- 副作用: ネットワークアクセス（staging 限定）、`page.evaluate` での DOM 上書き（PII mask）

テストケース:

```ts
test.describe("profile read-only", () => {
  for (const v of [{name:"desktop", w:1280, h:800}, {name:"mobile", w:390, h:844}]) {
    test(`M-08 ${v.name} screenshot`, async ({ page }, info) => { ... });
    test(`M-09 ${v.name} no-form`, async ({ page }, info) => { ... });
    test(`M-10 ${v.name} ?edit=true ignored`, async ({ page }, info) => { ... });
  }
  test("M-16 logout redirect", async ({ page }) => { ... });
});
```

assertion: `expect(counts.form).toBe(0)` 等（Phase 4 参照）。

### ステップ 5: `scripts/capture-profile-evidence.sh`（新規）

| 種別 | パス |
| --- | --- |
| 新規 | `scripts/capture-profile-evidence.sh` |

CLI 契約は Phase 2.5 で確定済。

主要処理:

```bash
#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
STORAGE_STATE="${2:-}"
OUT_DIR="${3:-}"
MARKERS="${4:-M-08,M-09,M-10,M-16}"

# 安全装置: production を弾く
[[ "$BASE_URL" == *"staging"* ]] || { echo "baseURL must contain 'staging'"; exit 1; }
[[ -f "$STORAGE_STATE" ]] || { echo "storageState not found"; exit 4; }

mkdir -p "$OUT_DIR/screenshots" "$OUT_DIR/dom"

PLAYWRIGHT_BASE_URL="$BASE_URL" \
PLAYWRIGHT_STORAGE_STATE="$STORAGE_STATE" \
PLAYWRIGHT_OUT_DIR="$OUT_DIR" \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=staging playwright/tests/profile-readonly.spec.ts \
  --reporter=line
```

I/O:
- 入力: 環境変数 4 つ
- 出力: `$OUT_DIR/screenshots/*.png` / `$OUT_DIR/dom/*.json`
- exit code: 0 / 1（baseURL 不正）/ 2（DOM 違反 = playwright fail）/ 3（network）/ 4（state 不在）

副作用: staging への HTTP アクセス、ローカル file 書き出し。

### ステップ 6: 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list playwright/tests/profile-readonly.spec.ts
chmod +x scripts/capture-profile-evidence.sh
bash -n scripts/capture-profile-evidence.sh
```

PASS 条件:

| コマンド | 期待 |
| --- | --- |
| typecheck | error 0 |
| lint | warning/error 0 |
| playwright --list | 7 test ケース（M-08×2, M-09×2, M-10×2, M-16×1）が列挙される |
| bash -n | syntax error 0 |

実測（staging に対する実行）は Phase 11 で行い、本 Phase では dry-run までに留める。

### ステップ 7: 不変条件 grep

```bash
rg -n "form\[data-edit\]|action=\"/profile" apps/web/app/profile/   # 0 hit（編集 form 未追加）
rg -n "PLAYWRIGHT_BASE_URL.*production" apps/web/                    # 0 hit
git ls-files apps/web/playwright/.auth/ | grep -v .gitkeep            # 0 hit
```

### ステップ 8: 失敗時修復

- typecheck: Page / TestInfo の型 import 追加
- lint: `pnpm lint --fix`
- playwright --list 不一致: spec の describe/for ループを再確認
- baseURL チェックが production に通ってしまう: capture script の guard を strengthen

## 統合テスト連携

| Phase | 役割 |
| --- | --- |
| Phase 4 | test plan 採番 |
| Phase 6 | 異常系（401 / staging down / state 期限切れ） |
| Phase 9 | typecheck/lint と coverage 影響確認 |
| Phase 11 | staging 実測 + evidence 配置 |

## 多角的チェック観点

- ステップ番号と触るファイルが 1:1 対応しているか
- `apps/web/app/profile/**` に変更が紛れ込んでいないか
- baseURL の production 誤指定 guard が二重化されているか
- storageState が gitignore でブロックされているか
- spec が `--project=staging` 経由でしか実行されない構造か

## サブタスク管理

- [ ] ステップ 0..8 確定
- [ ] 検証コマンド表確定
- [ ] 安全装置（baseURL guard / gitignore）確定
- [ ] outputs/phase-05/main.md に runbook サマリ記載

## 成果物

| 成果物 | パス |
| --- | --- |
| 実装ランブック | `outputs/phase-05/main.md` |

## 完了条件 (DoD)

- [ ] 触るファイル: 5 ファイル（.gitignore / .gitkeep / playwright.config.ts / profile-readonly.spec.ts / capture-profile-evidence.sh）
- [ ] 各ステップに「変更種別 × I/O × 副作用」が記述されている
- [ ] CONST_005 必須項目（変更ファイル一覧 / 関数シグネチャ / I/O / テスト方針 / 実行コマンド / DoD）が網羅されている
- [ ] 検証コマンドと PASS 条件が表で確定している
- [ ] アプリ本体への変更がない

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 6 へ、ステップ番号 / 安全装置 / 検証コマンドを引き渡す。
