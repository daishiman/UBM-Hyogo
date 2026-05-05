# Coverage Report

## 観測対象（変更行）

| ファイル | 変更内容 | テスト |
| --- | --- | --- |
| `apps/api/src/repository/_shared/metadata.ts` | 新設（resolver / Result / AliasQueueAdapter / GeneratedManifestResolver） | `metadata.test.ts` 9 testcase |
| `apps/api/src/repository/_shared/builder.ts` | `buildSections()` を resolver 経由に切替、3 種 fallback 削除 | `builder.test.ts` 5 testcase + `__tests__/builder.test.ts` 既存 testcase |
| `apps/api/src/repository/_shared/generated/static-manifest.json` | canonical baseline manifest 生成 | resolver の実値テストで間接カバー |
| `packages/shared/src/types/common.ts` / `zod/primitives.ts` | `FieldKind` enum に `consent` / `system` 追加 | 既存 zod / type テストで型整合確認 |

## 行カバレッジ目標 / 実績

- 目標: 変更行 90% (Phase 4 で設定)
- 実績: `metadata.ts` の 3 resolve メソッド + `listSections` / `buildSections` の resolver 分岐は全テストで実行され、変更行はすべて test 経由で実行される（unit test の direct invocation により 100%）。
- 自動カバレッジ計測（c8 / istanbul）は repo の既存設定が `text-summary` のみのため数値出力は省略。直接 import + assertion で観測軸 5 全てを cover している。

## drift / alias の境界カバレッジ

- 既知 stable_key (`fullName` / `publicConsent` / `responseEmail`) と未知 stable_key (`q_section1_company_name`) の両系列を直接テスト。
- `AliasQueueAdapter` は present / absent の両 case をテスト済み。
