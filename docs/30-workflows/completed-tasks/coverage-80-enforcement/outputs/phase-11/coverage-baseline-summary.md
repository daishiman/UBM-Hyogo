# T0 baseline 計測結果テンプレ（spec_created / 実値は `<TBD: T0 実行時に埋める>`）

> **本ファイルは Phase 11 spec walkthrough 時点では枠のみ**。
> 実値は **Phase 13 ユーザー承認後の PR① merge 直後**（`manual-smoke-log.md` ケース 1 = T0 baseline 計測）に実走して埋める。
> spec_created 状態では `<TBD: T0 実行時に埋める>` プレースホルダのまま git に commit する。

## 1. 計測実行コマンド / 実行日時 枠

| 項目 | 値 |
| --- | --- |
| 計測コマンド | `mise exec -- pnpm -r test:coverage` |
| 集計コマンド | `for pkg in apps/web apps/api packages/shared packages/integrations packages/integrations/google; do jq '.total' "$pkg/coverage/coverage-summary.json"; done` |
| 不足 top10 抽出 | `jq '[to_entries[] \| select(.value \| type=="object")] \| sort_by(.value.lines.pct) \| .[0:10]' <pkg>/coverage/coverage-final.json` |
| 実行日時 | `<TBD: T0 実行時に埋める>` |
| 実行者 | `<TBD: T0 実行時に埋める>` |
| 実行環境 | `<TBD: T0 実行時に埋める>`（macOS / Linux / GitHub Actions のいずれか） |
| Node / pnpm バージョン | `<TBD: T0 実行時に埋める>`（mise: Node 24.15.0 / pnpm 10.33.2 期待） |
| vitest バージョン | `<TBD: T0 実行時に埋める>` |
| 計測対象 commit | `<TBD: T0 実行時に埋める>`（PR① merge commit SHA） |
| 関連 actions run | `<TBD: T0 実行時に埋める>`（GitHub Actions run URL） |

## 2. package 別計測結果（5 package × 4 metrics）

各セルは「現状値 / 80%との差分（+ なら 80% 超過 / − なら不足）」を記入する。

### 2.1 apps/web

| metric | 現状値 (pct) | 80% との差分 | 不足ファイル top10 link | 推定追加テスト数 |
| --- | --- | --- | --- | --- |
| lines | `<TBD: T0 実行時に埋める>` | `<TBD>` | `<TBD: apps/web/coverage/top10-unsatisfied.json への link>` | `<TBD: 推定テスト数>` |
| branches | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| functions | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| statements | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |

### 2.2 apps/api

| metric | 現状値 (pct) | 80% との差分 | 不足ファイル top10 link | 推定追加テスト数 |
| --- | --- | --- | --- | --- |
| lines | `<TBD: T0 実行時に埋める>` | `<TBD>` | `<TBD: apps/api/coverage/top10-unsatisfied.json への link>` | `<TBD>` |
| branches | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| functions | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| statements | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |

### 2.3 packages/shared

| metric | 現状値 (pct) | 80% との差分 | 不足ファイル top10 link | 推定追加テスト数 |
| --- | --- | --- | --- | --- |
| lines | `<TBD: T0 実行時に埋める>` | `<TBD>` | `<TBD: packages/shared/coverage/top10-unsatisfied.json への link>` | `<TBD>` |
| branches | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| functions | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| statements | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |

### 2.4 packages/integrations

| metric | 現状値 (pct) | 80% との差分 | 不足ファイル top10 link | 推定追加テスト数 |
| --- | --- | --- | --- | --- |
| lines | `<TBD: T0 実行時に埋める>` | `<TBD>` | `<TBD: packages/integrations/coverage/top10-unsatisfied.json への link>` | `<TBD>` |
| branches | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| functions | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| statements | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |

### 2.5 packages/integrations/google

| metric | 現状値 (pct) | 80% との差分 | 不足ファイル top10 link | 推定追加テスト数 |
| --- | --- | --- | --- | --- |
| lines | `<TBD: T0 実行時に埋める>` | `<TBD>` | `<TBD: packages/integrations/google/coverage/top10-unsatisfied.json への link>` | `<TBD>` |
| branches | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| functions | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |
| statements | `<TBD>` | `<TBD>` | `<TBD>` | `<TBD>` |

## 3. 集計結果サマリ

| 項目 | 値 |
| --- | --- |
| 80% 以上を満たす package（全 4 metrics） | `<TBD: T0 実行時に埋める>`（例: apps/api） |
| 一部 metric のみ 80% 未達 package | `<TBD: T0 実行時に埋める>` |
| 全 metric 80% 未達 package | `<TBD: T0 実行時に埋める>` |
| 最大ギャップの package×metric | `<TBD: T0 実行時に埋める>`（例: packages/shared functions = 35% / 差分 −45pt） |
| 全 package 平均 lines pct | `<TBD: T0 実行時に埋める>` |
| 全 package 平均 branches pct | `<TBD: T0 実行時に埋める>` |
| 全 package 平均 functions pct | `<TBD: T0 実行時に埋める>` |
| 全 package 平均 statements pct | `<TBD: T0 実行時に埋める>` |
| PR② で追加が必要な推定テスト総数 | `<TBD: T0 実行時に埋める>`（package 別推定の合計） |
| PR② を package×metric 単位で分割すべきか判定 | `<TBD: T0 実行時に埋める>`（Phase 3 NO-GO 条件 #2 = 30% 下回ったら sub PR 細分化） |

## 4. NO-GO 条件 trigger 判定（Phase 3 §NO-GO 条件 #2 連携）

| 条件 | 判定 |
| --- | --- |
| `apps/web` の lines pct < 30% | `<TBD: T0 実行時に埋める>`（true なら PR② を package×metric 単位で細分化） |
| `packages/shared` の lines pct < 30% | `<TBD: T0 実行時に埋める>`（true なら同上） |
| いずれかの package で `coverage-summary.json` が生成されない | `<TBD: T0 実行時に埋める>`（true なら Phase 6 異常系検証へ差し戻し） |

## 5. exclude 再評価メモ（Phase 3 §レビュー指摘 R-1 連携）

| 項目 | 値 |
| --- | --- |
| `apps/web` で予期せず exclude 漏れしたファイル | `<TBD: T0 実行時に埋める>`（例: `.open-next/` 配下） |
| `apps/web` で過剰に exclude したファイル | `<TBD: T0 実行時に埋める>`（例: page.tsx を全 exclude しているが server component の logic 部分は計上したい等） |
| Phase 12 で `vitest.config.ts` exclude を更新する必要の有無 | `<TBD: T0 実行時に埋める>` |

## 6. 関連リンク

- 6 ケース手動 smoke 実行ログ: [./manual-smoke-log.md](./manual-smoke-log.md)（ケース 1 = T0 baseline）
- 計測対象 vitest config: [../phase-02/main.md](../phase-02/main.md)（vitest.config.ts 更新仕様）
- coverage-guard.sh I/O 正本: [../phase-02/main.md](../phase-02/main.md)
- Phase 3 NO-GO 条件: [../phase-03/main.md](../phase-03/main.md)
- aiworkflow-requirements 既存正本（更新対象）: [../../../../.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md](../../../../.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md)

## 7. 完了判定

- [ ] 5 package × 4 metrics の現状値が記入された（`<TBD>` がすべて実値に上書きされた）
- [ ] 80% との差分が記入された
- [ ] 不足ファイル top10 link が記入された
- [ ] 推定追加テスト数が記入された
- [ ] 集計サマリ（80% 以上 / 未達 / 最大ギャップ）が記入された
- [ ] NO-GO 条件 trigger 判定が記入された
- [ ] exclude 再評価メモが記入された
- [ ] 関連 actions run URL が記入された

> **本 Phase 11 spec_created 段階では上記すべて未着手で OK**。Phase 13 PR① merge 直後の T0 実走時にすべて [x] へ更新する。
