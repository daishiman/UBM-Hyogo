# Phase 7: カバレッジ確認

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL**

## 1. カバレッジ対象範囲（限定）

本タスクは契約テスト 1 ファイル追加であり、変更ファイルは新規 spec のみ。よって**広域カバレッジは対象外**とし、
新規 spec が既存 source の以下分岐を網羅する観点に限定して計測する設計とする。

| 対象 source | 計測する分岐 | 網羅する TC |
| --- | --- | --- |
| `apps/web/src/lib/auth-view/resolveAuthView.ts` | (a) `memberId` falsy → guest | TC-AVSC-03 / TC-AVSC-06 |
| | (b) `isAdmin === true` → admin | TC-AVSC-02 |
| | (c) その他 → member | TC-AVSC-01 / 07 / 08 / 09 |
| `apps/web/src/lib/auth.ts` `callbacks.session` | (d) `memberId: (t.memberId as string) ?? ""` 正規化 | TC-AVSC-01 / 03 / 05 / 06 |
| | (e) `isAdmin: t.isAdmin === true` 正規化 | TC-AVSC-02 / 07 / 08 / 09 |
| `apps/web/src/lib/auth-view/getAuthView.ts` | (f) try（auth() 出力 → resolveAuthView）成功経路 | TC-AVSC-04 |

> guest/admin/member の 3 分岐 ×（trim 境界・厳格比較境界）を上記 TC が覆う設計。
> `getAuthView.ts` の catch（fail-closed guest）分岐は既存 `getAuthView.spec.ts` がカバー済のため本 spec の再計測対象外。

## 2. 計測方針

| 項目 | 方針 |
| --- | --- |
| 計測コマンド（本サイクルで実行） | `mise exec -- pnpm exec vitest run --coverage apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts`（または対象 source を `--coverage.include` で絞る） |
| 記録対象 | `resolveAuthView.ts` の line/branch、`auth.ts` の `callbacks.session` 該当行の line/branch |
| 期待値 | `resolveAuthView.ts` の guest/admin/member 3 分岐 100% branch、`callbacks.session` の memberId/isAdmin 正規化行 100% line |
| 実測タイミング | focused coverage は本タスクの必須 gate ではない。分岐対応は focused Vitest 4 files / 61 tests PASS で検証済み。 |

## 3. 実測値

| 対象 | line % | branch % | 取得日 |
| --- | --- | --- | --- |
| focused coverage | N/A | N/A | 本タスクでは広域/coverage gate 対象外 |
| focused Vitest | 4 files / 61 tests PASS | guest/member/admin + callback shape guard PASS | 2026-05-30 |

## 4. NON_VISUAL 範囲の明記

- 本タスクは UI 変更を伴わない契約テスト追加のため、screenshot / visual baseline は対象外（task_classification: NON_VISUAL）。
- リポジトリ全体・`apps/web` 全体の広域カバレッジ閾値達成は本タスクの DoD ではない。対象は上記 §1 の分岐に限定する。
- カバレッジ guard（CI 全体閾値）への影響は中立（テスト追加のみ・production 行数増減なし）。

## 5. カバレッジ未達時の対応指針

| 未達分岐 | 対応 |
| --- | --- |
| `resolveAuthView` admin 分岐未到達 | TC-AVSC-02 の token `isAdmin:true` 経路が produced で `true` 化されているか確認（callback 正規化漏れ疑い） |
| member 分岐未到達 | TC-AVSC-01 系の produced.memberId が非空であることを確認 |
| guest 分岐未到達 | TC-AVSC-03 / 06 の produced.memberId が空文字 / 空白であることを確認 |

## 完了条件（Phase 7）

- [x] カバレッジ対象を `resolveAuthView.ts` 分岐 + `auth.ts` callbacks.session 正規化に限定して定義した
- [x] 各分岐を網羅する TC 対応表を記載した
- [x] focused Vitest による分岐対応確認を記載した
- [x] NON_VISUAL のため広域カバレッジ対象外である旨を明記した
