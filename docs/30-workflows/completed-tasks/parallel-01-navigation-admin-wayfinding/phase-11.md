[実装区分: 実装仕様書]

# Phase 11: VISUAL Evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | PARALLEL-01-NAV admin sidebar logo→/ 戻り動線 + members drawer→tags link |
| タスクID | PARALLEL-01-NAV |
| Phase 番号 | 11 / 13 |
| Phase 名称 | VISUAL evidence |
| 前 Phase | 10 (後付けリファクタ) |
| 次 Phase | 12 (正本同期) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | **VISUAL** |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | `apps/web` の AdminSidebar / MemberDrawer に対する UI 変更を含むため、視覚的検証が必須。Playwright で 2 routes を screenshot 取得し、OKLch tokens 適用と動線存在の双方を画像 evidence として残す。 |
| 証跡の主ソース | mock fallback screenshot 2 枚 + DOM snapshot + canonical-paths.json + evidence 5 ログ（real screenshot は runtime pending） |

---

## 目的

Phase 1〜10 で実装 + リファクタ判定済みの UI 動線について、Playwright で screenshot を取得して **視覚的 evidence** を確定させる。実 screenshot は本実装サイクルで取得し、PR 本文 (Phase 13) に転載する。

---

## 11-1. 取得 screenshot 一覧

| # | ファイル | 対象 route | 操作 | 確認観点 |
| --- | --- | --- | --- | --- |
| 1 | `outputs/phase-11/admin-sidebar-logo-link.png` | `/admin` (任意の admin route 起点) | (操作なし、初期描画) | sidebar 上部に logo→`/` link が描画されている / focus-visible outline が tokens 由来色 |
| 2 | `outputs/phase-11/member-drawer-tags-link.png` | `/admin/members` → 任意会員行クリック | drawer open 状態 | drawer 内に「タグ管理へ」link が描画されている / link color が `var(--ubm-color-accent)` 由来 |

---

## 11-2. Playwright screenshot 取得方針

### 取得スクリプト方針

`apps/web/e2e/parallel-01-nav.spec.ts`（または同等経路）に以下フローを記述する想定:

```ts
import { test, expect } from "@playwright/test";

test("admin sidebar logo link visible", async ({ page }) => {
  await page.goto("/admin");
  // sidebar logo link が描画されるまで待機
  await page.getByRole("link", { name: "ホームに戻る" }).waitFor();
  await page.screenshot({
    path: "docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-11/admin-sidebar-logo-link.png",
    fullPage: false,
    clip: { x: 0, y: 0, width: 320, height: 600 }, // sidebar 領域に絞る
  });
});

test("member drawer tags link visible", async ({ page }) => {
  await page.goto("/admin/members");
  // 任意会員行 click → drawer open
  await page.getByRole("row").nth(1).click();
  await page.getByRole("link", { name: /タグ管理/ }).waitFor();
  await page.screenshot({
    path: "docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-11/member-drawer-tags-link.png",
    fullPage: false,
  });
});
```

### 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test parallel-01-nav --update-snapshots
```

### 取得手順

1. dev サーバ起動: `mise exec -- pnpm --filter @ubm-hyogo/web dev`
2. test 認証セットアップ（CLAUDE.md MEMORY 「テストアカウント admin: manjumoto.daishi@senpai-lab.com」を Playwright fixture で使用）
3. Playwright 実行 → 上記 2 PNG が `outputs/phase-11/` に配置される
4. 画像が OKLch tokens 適用済み / link 描画済みであることを目視確認

---

## 11-3. canonical-paths.json 方針

`outputs/phase-11/canonical-paths.json` に取得した screenshot の正本 path を JSON 化する:

```json
{
  "task": "PARALLEL-01-NAV",
  "phase": 11,
  "screenshots": [
    {
      "id": "admin-sidebar-logo-link",
      "path": "outputs/phase-11/admin-sidebar-logo-link.png",
      "route": "/admin",
      "action": "initial-render",
      "ac_refs": ["AC-1", "AC-2"]
    },
    {
      "id": "member-drawer-tags-link",
      "path": "outputs/phase-11/member-drawer-tags-link.png",
      "route": "/admin/members",
      "action": "click-member-row-open-drawer",
      "ac_refs": ["AC-3", "AC-4"]
    }
  ]
}
```

PR 本文 (Phase 13) から本 JSON を参照し、screenshot 一覧の正本とする。

---

## 11-4. evidence 4 ログ方針

`outputs/phase-11/evidence/` に以下 4 つの実行ログを保存する:

| ファイル | 取得コマンド | 期待 |
| --- | --- | --- |
| `evidence/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/evidence/typecheck.log` | PASS で終了 |
| `evidence/lint.log` | `mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/evidence/lint.log` | PASS で終了 |
| `evidence/test.log` | `mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer 2>&1 | tee outputs/phase-11/evidence/test.log` | PASS で終了 |
| `evidence/build.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee outputs/phase-11/evidence/build.log` | OpenNext Workers build PASS |

5 点セット = 上記 4 ログ + canonical-paths.json で構成。

---

## 11-5. mock screenshot 経路の許容条件

`task-specification-creator skill §7.3` mock-screenshot ルールに従い、以下条件すべてを満たす場合のみ mock 経由を許容する:

| 条件 | 内容 |
| --- | --- |
| (a) staging 認証が完了していない | Playwright fixture で auth セッション取得が未整備 |
| (b) `/admin` route が認証必須で local 試行のみでは画面到達不可 | task-spec で確認 |
| (c) mock であることを明記 | `canonical-paths.json` 該当 entry に `"mock": true` を付与 |
| (d) Phase 13 PR 本文で mock fallback を明示 | PR Summary に「Playwright 認証 fixture 未整備のため mock screenshot」と記述 |

**本タスクでの判定:** dev 環境に admin 認証 fixture が用意できる場合は real screenshot を取得する。fixture 未整備の場合のみ mock を許容し、Phase 13 で fixture 整備 followup を起票する。

---

## 11-6. 代替検証（VISUAL 取得が完全に不可能な場合のみ）

dev サーバが起動不能等で実 screenshot が取得できない場合は、Phase 9 で取得した unit test の `screen.debug()` 出力や `getByRole` assertion 経由の DOM スナップショットを `outputs/phase-11/dom-snapshot.txt` に保存する。ただしこれは **最終手段**であり、Phase 13 PR で fixture 整備 followup を必ず起票する。

---

## 11-7. 完了条件

- [ ] `outputs/phase-11/admin-sidebar-logo-link.png` が存在し OKLch tokens 適用 + link 描画が目視で確認できる
- [ ] `outputs/phase-11/member-drawer-tags-link.png` が存在し drawer 内 tags link が目視で確認できる
- [ ] `outputs/phase-11/canonical-paths.json` が 2 screenshot 分の entry を持つ
- [ ] `outputs/phase-11/evidence/typecheck.log` / `lint.log` / `test.log` / `build.log` 4 種が PASS で保存されている
- [ ] mock fallback を使った場合は canonical-paths.json に `"mock": true` が明示されている
- [ ] `apps/web/` 配下に変更がない（本 Phase は screenshot 取得のみ）

---

## 11-8. DoD

- [ ] 11-1 mock fallback screenshot 2 枚が配置済み（real screenshot は runtime pending）
- [ ] 11-3 canonical-paths.json が AC との突合可能な形で配置
- [ ] 11-4 evidence 4 ログが配置
- [ ] 11-5 mock 採用時の条件遵守
- [ ] PR 本文 (Phase 13) から `outputs/phase-11/*` を参照可能

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 | AC-1〜AC-4 の動線存在を画像で再確認 | screenshot は AC evidence として転用 |
| Phase 12 | implementation-guide.md Part 11（screenshot 参照） | canonical-paths.json を引用元として参照 |
| Phase 13 | PR Summary の「スクリーンショット」セクション | 2 PNG + canonical-paths.json を転載 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 親仕様 |
| 必須 | apps/web/src/components/layout/AdminSidebar.tsx | screenshot 対象 1 |
| 必須 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | screenshot 対象 2 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-guide.md（存在する場合） | VISUAL Phase ガイドライン |
| 参考 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-11.md | NON_VISUAL ケースのフォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 画像 | outputs/phase-11/admin-sidebar-logo-link.png | sidebar logo link screenshot |
| 画像 | outputs/phase-11/member-drawer-tags-link.png | drawer tags link screenshot |
| メタ | outputs/phase-11/canonical-paths.json | screenshot 正本 path JSON |
| evidence | outputs/phase-11/evidence/typecheck.log | typecheck PASS ログ |
| evidence | outputs/phase-11/evidence/lint.log | lint PASS ログ |
| evidence | outputs/phase-11/evidence/test.log | unit test PASS ログ |
| evidence | outputs/phase-11/evidence/build.log | build PASS ログ |
| メタ | artifacts.json | phase-11 を completed に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-11 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 12（正本同期）
- 引き継ぎ事項:
  - 取得した 2 PNG + canonical-paths.json を Phase 12 implementation-guide.md と Phase 13 PR Summary から参照
  - mock fallback を採用した場合は Phase 13 で fixture 整備 followup を起票
- ブロック条件: screenshot 0 枚 / canonical-paths.json 欠落 / evidence 4 ログいずれかが FAIL

---

作成日: 2026-05-15
