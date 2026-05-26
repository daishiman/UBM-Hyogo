---
phase: 4
title: Interface contract
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 4 — Interface contract

[実装区分: 実装仕様書]

## 4.1 member shell の data-* 契約属性

`apps/web/app/(member)/layout.tsx` で出力される属性（**変更なし。検証対象**）:

| 属性 | 値 | 検証 |
|------|-----|------|
| `data-theme` | `"warm"` | grep 必須 |
| `data-route-group` | `"member"` | grep 必須 |
| `data-testid` | `"member-shell"` | waitForSelector 待機キー |
| `data-shell` | `"topbar"` | grep 必須 |
| `data-route` | `"member"` | grep 必須 |
| `data-section-rhythm` | `"comfortable"` | grep 任意 |

## 4.2 Playwright spec シグネチャ

`apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const EVIDENCE_DIR = process.env.PLAYWRIGHT_EVIDENCE_DIR
  ?? '../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11';

test.describe('parallel-03 member shell runtime evidence', () => {
  test('EV-13 / EV-16: scrape member layout data-* + capture screenshot', async ({ page }) => {
    // 認証 fixture 経由で member セッションを mint（既存 fixtures/auth.ts 流用）
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="member-shell"]', { state: 'attached' });

    const html = await page.locator('[data-testid="member-shell"]').evaluate(el => el.outerHTML);
    const lines = html
      .split(/>\s*</)
      .map(s => s.trim())
      .filter(s => /data-(theme|route-group|shell|route|testid|section-rhythm)=/.test(s));

    expect(lines.length).toBeGreaterThan(0);

    const header = [
      `# dom-scrape-member.txt`,
      `# route: /profile (under (member) route group)`,
      `# command: pnpm --filter @ubm-hyogo/web exec playwright test parallel-03-member-shell-scrape.spec.ts --project=desktop-chromium`,
      `# captured_at: ${new Date().toISOString()}`,
      ``,
    ].join('\n');

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    writeFileSync(join(EVIDENCE_DIR, 'dom-scrape-member.txt'), header + lines.join('\n') + '\n');

    mkdirSync(join(EVIDENCE_DIR, 'screenshots'), { recursive: true });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({
      path: join(EVIDENCE_DIR, 'screenshots/member-shell.png'),
      fullPage: false,
    });

    // OKLch 不変条件: HEX 直書きが scrape 出力に混入していない
    expect(lines.join('\n')).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
```

## 4.3 evidence ファイル契約

### `dom-scrape-member.txt`

- 1 行目以降: trace header コメント（`#` プレフィックス 4 行 + 空行）
- 以降: data-* 属性を含む node fragment 1 件 1 行
- 文字コード UTF-8 / 改行 LF

### `screenshots/member-shell.png`

- viewport 1280x800（serial-07 が扱う full chrome multi-viewport とは別）
- fullPage: false
- 非空（>0 byte）

## 4.4 親台帳 EV-13 / EV-16 更新後の行

```md
| EV-13 | DOM scrape (member) | `outputs/phase-11/dom-scrape-member.txt` | present | issue-903 で `/profile` を `(member)` 配下へ移動し `parallel-03-member-shell-scrape.spec.ts` で取得 |
| EV-16 | screenshot (member) | `outputs/phase-11/screenshots/member-shell.png` | present | issue-903 で 1280x800 1 枚 baseline を取得。full chrome multi-viewport baseline は引き続き serial-07 / UT-DSF-07 (#829) |
```
