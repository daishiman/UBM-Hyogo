# Phase 5: GREEN 実装

[実装区分: 実装仕様書]

## 目的

harness page と axe レポート出力ロジックを実装し、Phase 4 の RED test を GREEN に転じる。

## 変更対象ファイル

| ファイル | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/app/(dev)/layout.tsx` | 新規 | env / NODE_ENV gate |
| `apps/web/app/(dev)/primitives-harness/page.tsx` | 新規 | 11 primitive × 代表 variant の render |
| `apps/web/playwright/tests/ui-primitives-visual.spec.ts` | 編集 | axe 結果を `outputs/phase-11/evidence/axe-report.json` に書き出す step を追加 |

## 実装ポイント

### `(dev)/layout.tsx`

```tsx
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

export default function DevLayout({ children }: { children: ReactNode }): JSX.Element {
  const isProd = process.env.NODE_ENV === 'production'
  const isEnabled = process.env.ENABLE_PRIMITIVES_HARNESS === '1'
  if (isProd && !isEnabled) {
    notFound()
  }
  return <>{children}</>
}
```

### `primitives-harness/page.tsx`

- 既存 barrel `@/components/ui` から 11 primitive を import する（追加 import 禁止）。
- 各 variant block は `<section data-primitive data-variant>` で囲む。
- icon が必要な variant は `lucide-react` から取得（既存採用 lib）。
- 文言は en/ja 任意（screenshot 用途のため意味のあるラベル）。

### Playwright spec の axe 出力強化

```ts
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

test('axe: harness page', async ({ page }, testInfo) => {
  const results = await new AxeBuilder({ page }).analyze()
  const evidenceDir = process.env.PLAYWRIGHT_EVIDENCE_DIR ?? testInfo.outputDir
  mkdirSync(evidenceDir, { recursive: true })
  writeFileSync(path.join(evidenceDir, 'axe-report.json'), JSON.stringify(results, null, 2))
  expect(results.violations.filter((v) => !KNOWN_ALLOWLIST.includes(v.id))).toEqual([])
})

const KNOWN_ALLOWLIST: ReadonlyArray<string> = []
```

## 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002 \
  mise exec -- pnpm --filter @ubm-hyogo/web e2e \
  --project=desktop-chromium \
  ui-primitives-visual.spec.ts
```

GREEN 結果ログを `outputs/phase-05/green-result.txt` に保存。

axe-report.json が生成される- [ ] harness page が dev で 200 を返す
- [ ] Playwright spec が GREEN
- [ ] axe-report.json が生成される

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 05 |
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
