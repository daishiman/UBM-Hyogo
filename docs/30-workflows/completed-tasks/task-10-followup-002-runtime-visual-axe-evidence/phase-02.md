# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase 番号 | 2 |
| 名称 | 設計 |
| 前 Phase | Phase 1 |
| 次 Phase | Phase 3 |

## 目的

Phase 1 で確定した AC を満たすための実装設計（変更対象ファイル・関数シグネチャ・データ構造・evidence dir 分岐）を固定する。

## 変更対象ファイル一覧

| ファイル | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/app/(dev)/primitives-harness/page.tsx` | 新規 | 11 primitive × 代表 variant を 1 ページに並べる検証 harness |
| `apps/web/app/(dev)/layout.tsx` | 新規 | `(dev)` route group の env gate（production では `ENABLE_PRIMITIVES_HARNESS=1` のときのみ render し、それ以外は `notFound()`） |
| `apps/web/playwright/tests/ui-primitives-visual.spec.ts` | 新規 | screenshot 取得 + axe スキャンを兼ねる Playwright spec |
| `apps/web/playwright.config.ts` | 編集 | `PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002` 分岐を追加し evidence dir を本 task 配下に向ける |
| `apps/web/src/components/ui/Stat.tsx` | 編集 | axe definition-list violation を解消するため、`dl > dt/dd` 構造を自己完結させる |
| `apps/web/src/components/ui/Sidebar.tsx` | 編集 | harness で landmark 衝突を避けるため、既定 `aside` のまま `as="div"` を選べる後方互換 option を追加 |
| `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/outputs/phase-11/main.md` | 編集 | ledger 行と `workflow_state` の更新（Phase 11 完了時） |
| `.claude/skills/aiworkflow-requirements/references/ui-ux-components.md` | 編集 | evidence reference 追記（Phase 12） |

## 関数・型のシグネチャ

### harness page

```tsx
// apps/web/app/(dev)/primitives-harness/page.tsx
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function PrimitivesHarnessPage(): JSX.Element {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PRIMITIVES_HARNESS !== '1') {
    notFound()
  }
  return (
    <main data-testid="primitives-harness">
      {/* 各 primitive variant を <section data-primitive="Button" data-variant="primary"> で囲む */}
    </main>
  )
}
```

各 variant block は次の data 属性で識別可能とする：

```tsx
<section data-primitive="Button" data-variant="primary" aria-label="Button primary">
  <Button variant="primary">Primary</Button>
</section>
```

### Playwright spec

```ts
// apps/web/playwright/tests/ui-primitives-visual.spec.ts
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const VARIANTS: ReadonlyArray<{ primitive: string; variant: string }> = [
  { primitive: 'Button', variant: 'primary' },
  // ... Phase 1 で確定した全 variant
]

test.describe('ui-primitives-visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/primitives-harness')
    await expect(page.getByTestId('primitives-harness')).toBeVisible()
  })

  for (const { primitive, variant } of VARIANTS) {
    test(`screenshot: ${primitive}/${variant}`, async ({ page }) => {
      const locator = page.locator(`section[data-primitive="${primitive}"][data-variant="${variant}"]`)
      await expect(locator).toBeVisible()
      await locator.screenshot({
        path: `${process.env.PLAYWRIGHT_EVIDENCE_DIR ?? ''}/screenshots/${primitive}-${variant}.png`,
      })
    })
  }

  test('axe: harness page', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze()
    // allowlist は Phase 1 AC-3 により空 or 既知例外のみ
    expect(results.violations).toEqual([])
  })
})
```

### playwright.config.ts への追加分岐

```ts
const isTask10Followup002Run =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === 'task-10-followup-002' ||
  process.argv.some((arg) => arg.includes('ui-primitives-visual.spec.ts'))

// EVIDENCE_DIR 三項演算子チェーンの末尾に追加
//   ...
//   : isTask10Followup002Run
//     ? '../../docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/outputs/phase-11/evidence'
//   : ...
```

`fixtureGatedTestIgnore` への登録は不要（本 spec は fixture API に依存しない）。

## 入力・出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | harness page route `/primitives-harness`（dev 環境限定） |
| 出力 | `outputs/phase-11/evidence/screenshots/*.png`・`outputs/phase-11/evidence/axe-report.json`（axe reporter を JSON 出力する custom step を spec 内に組み込む） |
| 副作用 | 検証成果物生成と ledger/doc 更新のみ。アプリ runtime state や外部サービスへの mutation は行わない |

## エラーハンドリング

- harness page が production で render された場合 `notFound()` を返す。
- Playwright spec で primitive variant が見つからない場合は test fail → Phase 11 で修正。
- axe で未知 violations が出た場合は Phase 11 で allowlist 化判断（user エスカレーション）。

## 設計上のリスクと対策

| リスク | 対策 |
| --- | --- |
| `(dev)` route group が production にデプロイされる | `layout.tsx` 内で `NODE_ENV` ガード + Cloudflare Workers 側でも `ENABLE_PRIMITIVES_HARNESS` env 未設定時は notFound |
| `build:cloudflare` で harness page が bundle 肥大化 | route group `(dev)` 配下のみで、dynamic = 'force-dynamic'。primitive 自体は既存 import なので追加 deps なし |
| axe violations が既存 token 起因で発生 | Phase 11 で内訳を JSON に記録し、token 修正は別 task に切り出さず `allowlist` で対応（CONST_007 に従い、今回サイクル内で完了させる） |
| axe violations が primitive の HTML 意味論起因で発生 | allowlist ではなく、`Stat` / `Sidebar` の後方互換な最小修正で同一サイクル内に解消する |

evidence dir 分岐が既存 config と整合する形で設計されている- [ ] 全変更対象ファイルの role が確定している
- [ ] 主要 signature がレビュー可能な粒度で記述されている
- [ ] evidence dir 分岐が既存 config と整合する形で設計されている

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 02 |
| workflow | task-10-followup-002-runtime-visual-axe-evidence |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| state | runtime_pending |

## 実行タスク

- [ ] 本 Phase の本文に記載した task を実行する。
- [ ] 実行結果を該当 outputs path に保存する。
- [ ] runtime 未実行のものは completed と書かず runtime_pending と記録する。

## 参照資料

| 参照 | パス |
| --- | --- |
| workflow root | docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/ |
| parent workflow | docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/ |
| UI canonical | .claude/skills/aiworkflow-requirements/references/ui-ux-components.md |
| state vocabulary | .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md |

## 成果物/実行手順

| 成果物 | 手順 |
| --- | --- |
| Phase output | 本文の command / checklist に従い outputs 配下へ保存する |
| Evidence | Phase 11 runtime 実行までは runtime_pending とする |

## 統合テスト連携

| 項目 | 値 |
| --- | --- |
| focused e2e | PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002 pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium ui-primitives-visual.spec.ts |
| local gates | typecheck / lint / token gate / artifacts parity |
| external gates | staging deploy / production smoke / commit / push / PR は user-gated |

## 完了条件チェックリスト

- [ ] 必須成果物 path が存在する。
- [ ] 状態語彙が canonical である。
- [ ] 未実行 runtime evidence を completed と表記していない。
