# Phase 6: テスト拡充（fail path / 回帰 guard / 補助 command）

> **実装区分: 実装仕様書** — 新規 5 spec 内の assertion / fail path / read-only ガードを設計する。
> コードは仕様書内の例として示す（実 capture / commit は user-gated・CONST_002）。

## 6.0 目的

Phase 4 で定義した 5 spec の baseline 取得に対し、本 Phase では次の 3 点を拡充する。

1. **fail path**: 前提未達（storageState 欠落 / heading 未到達 / read-only ガード違反）を
   早期に・明示メッセージで fail させる。snapshot だけでは「login 画面 / 空ページを baseline に焼き込む」退行を検出できないため、
   非 snapshot assertion を snapshot 比較の前段に置く。
2. **回帰 guard**: 既存 4 spec への差分ゼロ（AC-5）と `apps/web/src` / `apps/api` / D1 無変更（AC-6）を grep/diff で機械確認する。
3. **補助 command**: project 認識・特定 spec 単体実行・CI trigger（paths glob）確認。

## 6.1 fail path 一覧

| ID | 前提未達 | 検出方法 | fail メッセージ（例）|
| --- | --- | --- | --- |
| FP-01 | storageState 不在 / 非 admin（login 画面が描画される）| 対象 route 到達後 heading が `toBeVisible` しない（timeout）| `認証付き admin storageState で <route> に到達できませんでした（heading 未表示）。setup.staging-auth.ts の mint を確認` |
| FP-02 | heading 未到達（route 描画失敗 / 認証境界で弾かれる）| `getByRole("heading",{name:...})` の `toBeVisible({timeout:10_000})` が timeout | Playwright timeout（heading locator の name 不一致を切り分け）|
| FP-03 | read-only 違反（mutation 要素を誤操作）| read-only ガード assertion（`getByRole("dialog")` / `getByTestId("bulk-resolve-modal")` 等）の `toHaveCount(0)` が 0 でない | `mutation 要素（dialog/modal/toast）が出現しています = read-only 違反。spec が mutation をクリックしていないか確認（AC-3）` |
| FP-04 | snapshot 不一致 | `toHaveScreenshot` の組込み比較 | Playwright 既定の diff レポート（CI artifact）|

FP-01..03 は `expect(...).toBeVisible(...)` / `toHaveCount(0)` を **snapshot 比較の前に** 置いて落とす。
これにより「未認証の login 画面 / 想定外の mutation 中間状態を baseline として焼き込む」事故を構造的に防ぐ。

```ts
// FP-01 / FP-02: 認証到達と heading を snapshot 前に固める
await page.goto("/admin/requests", { waitUntil: "networkidle" });
await expect(
  page.getByRole("heading", { name: "依頼キュー" }),
  "認証付き /admin/requests に到達できませんでした（heading 未表示）",
).toBeVisible({ timeout: 10_000 });
```

## 6.2 read-only ガード assertion（AC-3 の機械化）

各画面の mutation トリガーが「実行されていないこと」を、mutation 成功時にだけ DOM へ現れる要素の
**non-existence**（count 0）で機械的に保証する。これにより apply/承認/merge/Bulk Resolve/出席操作を
クリックしていない＝staging D1 への破壊的副作用ゼロを証跡化する。

| route | ガード対象（mutation 成功時に出る要素）| assertion | 遮断する mutation |
| --- | --- | --- | --- |
| `/admin/audit` | （なし: pure read-only。検索/リセットは GET のみ）| ガード不要（spec コメントで read-only 根拠を明記）| なし |
| `/admin/requests` | 承認/却下の確認ダイアログ | `await expect(page.getByRole("dialog")).toHaveCount(0)` | 承認/却下（POST resolve）|
| `/admin/identity-conflicts` | merge/別人確定の確認フロー（dialog）| `await expect(page.getByRole("dialog")).toHaveCount(0)` | merge / 別人マーク |
| `/admin/schema` | Bulk Resolve / Bulk Rollback モーダル | `await expect(page.getByTestId("bulk-resolve-modal")).toHaveCount(0)` / `("bulk-rollback-modal")` | alias 割当 / Bulk Resolve / rollback / Bulk Rollback / 再集計 |
| `/admin/meetings` | 出席操作 toast | `await expect(page.getByTestId("attendance-toast")).toHaveCount(0)` | 開催日作成・更新・削除 / 出席追加・削除・更新 |

```ts
// 例: /admin/schema の read-only ガード（mutation modal を一度も開いていないこと）
await expect(
  page.getByTestId("bulk-resolve-modal"),
  "Bulk Resolve modal が開いています = mutation 操作の疑い（AC-3）",
).toHaveCount(0);
await expect(page.getByTestId("bulk-rollback-modal")).toHaveCount(0);
```

加えて、spec は mutation ボタン（承認/却下/merge/割当/Bulk Resolve/Bulk Rollback/再集計/開催日作成/出席追加 等）を
**click しない**（`locator(...).click()` を呼ばない）ことをコードレビュー観点として明記する。
`/admin/audit` は mutation 要素そのものが無い（検索/リセットは GET）ため、ガード assertion ではなく
spec 先頭コメントで「pure read-only」根拠を記録する（AC-7）。

## 6.3 副作用境界判定の記録（AC-7）

各 spec は冒頭コメントに read-only / mutation 副作用境界の判定根拠を記す（Phase 5 §5.3 正本のコメント）。

| route | spec コメント記載の境界根拠 |
| --- | --- |
| `/admin/audit` | `pure read-only。検索/リセットは GET のみ。mutation 要素なし` |
| `/admin/requests` | `never clicks 承認 / 却下 (POST /api/admin/requests/resolve). 確認ダイアログ未オープン` |
| `/admin/identity-conflicts` | `never clicks merge / 別人マーク. 二段確認フロー未進入` |
| `/admin/schema` | `never submits alias 割当 / Bulk Resolve / rollback / Bulk Rollback / 再集計. modal 未オープン` |
| `/admin/meetings` | `never submits 開催日作成, never opens attendance drawer, never triggers 出席追加/削除/更新` |

> この記録（spec コメント + 本表）が AC-7（副作用境界判定の画面ごと根拠付き記録）を満たす。

## 6.4 回帰 guard（既存 4 spec 無改修 + プロダクトコード不変）

新規 5 spec は apps ソースを変更しないため、機能本体の回帰は **「変更が無いこと」を確認すること**で担保する。

| ID | 対象 | 確認手順 | 期待 |
| --- | --- | --- | --- |
| RG-01 | 既存 4 spec（profile / dashboard / tags / bulk-tag）無改修（AC-5）| `git diff --name-only -- apps/web/playwright/tests/visual-staging-authenticated/{profile-authenticated,admin-dashboard-authenticated,admin-tags-authenticated,admin-members-bulk-tag-authenticated}.spec.ts` | 出力 0 行（差分なし）|
| RG-02 | プロダクトコード不変（AC-6）| `git diff --name-only -- apps/web/src apps/api` | 出力 0 行（変更なし）|
| RG-03 | D1 migration 不変（AC-6）| `git diff --name-only -- 'apps/api/migrations/**'` | 出力 0 行 |
| RG-04 | 基盤不変（project / mint / CI）| `git diff --name-only -- apps/web/playwright.config.ts apps/web/playwright/scripts/mint-staging-storage-state.ts .github/workflows/playwright-staging-visual-authenticated.yml` | 出力 0 行（issue-1077 所有・再利用のみ）|
| RG-05 | 追加分が 5 新 spec のみ | `git status --porcelain apps/web/playwright/tests/visual-staging-authenticated/` | `admin-{audit,requests,identity-conflicts,schema,meetings}-authenticated.spec.ts` の 5 件のみが新規 |

> RG-01..05 のいずれかが期待外（既存 spec/プロダクトコード/基盤に差分）になった場合は
> 本タスクのスコープ逸脱を意味する＝即 stop シグナル。

## 6.5 補助 command（project 認識 / 単体実行 / CI trigger 確認）

| 用途 | コマンド | 副作用 |
| --- | --- | --- |
| project 認識（5 spec 列挙 = AC-4）| `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --list` | なし（read-only）|
| 特定 spec 単体実行（例: schema のみ・user-gated）| `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-schema-authenticated` | 実 staging 到達（user-gated）|
| baseline 単体 mint（例: meetings のみ・user-gated）| `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-meetings-authenticated --update-snapshots` | snapshot 生成（user-gated）|
| CI trigger（paths glob）確認 | `.github/workflows/playwright-staging-visual-authenticated.yml` の `on.push.paths` / `pull_request.paths` に `apps/web/playwright/tests/visual-staging-authenticated/**` が含まれることを確認（5 新 spec が追加設定なしで CI 認識）| なし（read-only）|

## 6.6 NON_VISUAL / VISUAL 判定

本タスクは **VISUAL_ON_EXECUTION**。

| 観点 | 判定 |
| --- | --- |
| 実 capture 時 | screenshot baseline（5 枚）+ Phase 11 evidence（5 枚）を生成する＝VISUAL |
| implemented_local_runtime_pending 時点 | baseline 未生成（`--update-snapshots` は user-gated）＝visual evidence は **n/a** |
| evidence ledger | Phase 11 の VISUAL evidence 行は execution 時に `present` 化。現時点（implemented_local_runtime_pending）は `n/a` |

> spec コードは確定済みだが、実 staging への到達・capture・commit はすべて user-gated（CONST_002）。
> implemented_local_runtime_pending 時点では baseline を生成しない。

## 6.7 Phase 6 完了条件

- [x] FP-01..04 の fail path（storageState 欠落 / heading 未到達 / read-only ガード違反 / snapshot 不一致）を設計に明記した
- [x] read-only ガード assertion（dialog/modal/toast の count 0）が 5 画面の AC-3 を機械化していることを §6.2 に固定した
- [x] 副作用境界判定を spec コメント + 表で 5 画面分記録した（AC-7 / §6.3）
- [x] 回帰 guard RG-01..05（既存 4 spec 無改修 / apps・D1・基盤不変）を grep/diff 手順で定義した（AC-5/AC-6）
- [x] 補助 command（--list / 単体実行 / CI paths glob 確認）を §6.5 に列挙した
- [x] VISUAL_ON_EXECUTION 判定（implemented_local_runtime_pending 時点は baseline n/a）を §6.6 に明記した
- [ ] （execution 時）fail path / read-only ガードが実 staging 実行で意図通り発火することを確認 → **user-gated**
