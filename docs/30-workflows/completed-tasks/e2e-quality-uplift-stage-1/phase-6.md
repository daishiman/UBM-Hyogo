# Phase 6: テスト拡充（race / fail path / regression guard）

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-09

## 1. 拡充軸

| 軸 | 適用 | 目的 |
|----|------|------|
| race condition 補強 | 1b | round-trip 中に mock 登録順がずれた場合の検出 |
| fail path | 1a / 1b | 「leak が起きた」「pending が消えた」を意図的に再現できるか |
| regression guard | 1a / 1b | 将来 production code を改修した際の自動 fail 経路 |
| flaky 抑制 | 全 | wait / timing の決定論化 |

## 2. race condition 補強（1b）

| ID | 検証内容 | 実装手段 |
|----|---------|---------|
| RC-1 | mock 登録 → goto 順序が逆転すると `/api/me` が unmocked で fetch される | `await page.route(...)` を `await page.goto(...)` の前に置く順序を test 内で固定 |
| RC-2 | round-trip 復帰時に `pendingRequests` が空 → fail | mock を一時的に空配列で fulfill する補助 test を Phase 8 で run（CI には載せない実験） |
| RC-3 | 連続 navigate（`goto('/')` を 2 回連続）でも mock が剥がれない | Playwright `page.route` は明示 `unroute` までの間有効 — assertion で再確認 |

## 3. fail path 検証（手動 run only / CI 非搭載）

| 手法 | 1a | 1b |
|------|----|----|
| 一時的に prod code に `console.log(LEAK_PROBE_EMAIL)` を埋めて run | spec が fail することを目視確認 | — |
| `mockMeWithPending` を空 `pendingRequests` に差替え | — | round-trip 後 pending 消失で fail することを目視確認 |
| dry-run 結果を Phase 8 §動的検証に記録 | yes | yes |

> 上記はローカルでのみ実施する確認手順であり、CI には組み込まない（CONST_007 単一サイクル原則）。

## 4. regression guard マトリクス

| failure-mode | 検出 spec | guard 種別 | 期待挙動 |
|-------------|---------|-----------|---------|
| API が `responseEmail` を public payload に含める | 1a | sentinel exact | fail |
| 任意 email リテラル混入 | 1a | `/@/` probe | fail（false positive 時は probe を後段で disable） |
| client-only pending state（refetch しない） | 1b | round-trip toBeVisible | fail |
| `/api/me` を fetch していない | 1b | mock hit 前提 | mock 未 hit 時に test timeout で fail |

## 5. flaky 抑制

| 対策 | 適用 |
|------|------|
| `toBeVisible({ timeout: 5000 })` を round-trip assertion に固定 | 1b |
| `page.locator('body')` で document level に scope 固定 | 1a |
| `expect.poll` 不採用（過剰） | 全 |
| network idle 待ちは避け、selector visibility を信頼 | 全 |

## 6. 既存 test との非干渉確認

| 既存 test | 1a / 1b 追加による影響 | 検証 |
|----------|----------------------|------|
| `public-flow.spec.ts` desktop full flow | 同 describe 内なので fixture 競合なし | 同 fixture (`anonymousPage`) を共有 |
| `TC-E-01` visibility submit | `mockMeWithPending` は新 test 内のみで route 登録 | test 終了で auto unroute |
| `TC-E-03` delete submit | 同上 | 同上 |
| mobile flow | viewport 設定が独立 | 影響なし |

## 7. coverage 補完観点（Phase 7 への引継ぎ）

| route | 既存 smoke | 1a/1b 後 | コメント |
|-------|-----------|---------|---------|
| `/` | あり | + leak guard | critical |
| `/members` | あり | + leak guard | — |
| `/members/[id]` | あり | + leak guard | — |
| `/profile` | あり | + sticky guard | critical |

## 8. Phase 7 入口条件

- [x] race / fail path 拡充の意図が phase-5 雛形に矛盾しない
- [x] regression guard マトリクス（§4）が Phase 1 受け入れ条件と 1:1
- [x] flaky 対策が CI 時間予算（< 1.5s/spec 増）を超過しない

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 6
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 12 evidence に反映し、Phase 11 は実行ログ・skip count・runner version として分離する。

## 統合テスト連携

- NON_VISUAL implementation phase は Playwright assertion 差分、spec completeness、grep gate、artifact parity を検証する。
- E2E runtime 実行結果は outputs/phase-11/evidence に保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- apps/web/playwright/tests/public-flow.spec.ts、profile-visibility-request.spec.ts、profile-delete-request.spec.ts の assertion 差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E lines >=80%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

