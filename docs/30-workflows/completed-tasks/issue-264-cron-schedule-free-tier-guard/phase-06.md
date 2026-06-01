# Phase 6: テスト拡充

| 項目 | 値 |
| --- | --- |
| 目的 | ガードが「壊れたとき確実に fail する」ことの保証と、正当な変更時の運用手順を定義 |

## ガードの役割（再確認）

本テストは値を変更しない回帰ガードである。`wrangler.toml` の cron を将来うっかり / 意図的に変えたとき、
**CI が fail することで初めて意味を持つ**。よって「壊し方ごとに確実に fail するか」を reasoning で固定する。

## 負のシナリオ（guard が fail する経路）

| シナリオ | 操作（仮想） | fail する TC | reasoning |
| --- | --- | --- | --- |
| N-1: 4 本目 cron 追加 | `[triggers].crons` に `"0 0 * * 0"` を追加し 4 要素にする | TC-1（deepEqual 不一致）, TC-4（length 4 > 3） | free-plan の env あたり cron 上限 3 本を超える。TC-4 が account 上限超過を明示的に検知 |
| N-2: legacy hourly 再混入 | どれかのセクションに `"0 * * * *"` を追加 | TC-5（`.toContain` で検出）, TC-1/2/3（deepEqual 不一致） | 撤回済み Sheets hourly cron の再登録を阻止。`*/15` と紛れやすいため専用 assert で固定 |
| N-3: parity 崩れ | staging だけ cron 順序 / 値を変更 | TC-2 or TC-6（staging≠top） | 3 env で cron が乖離するとデプロイ環境ごとに挙動が割れる。parity assert が乖離を検知 |
| N-4: cron 式の typo | `"*/5 * * * *"` を `"*/50 * * * *"` 等に誤記 | TC-1/2/3（deepEqual） | canonical との byte 一致を deepEqual で固定するため誤記も検知 |
| N-5: section 見出し削除 | `[env.production.triggers]` ごと削除 | TC-3（`[]` ≠ CANONICAL） | `extractCrons` が `[]` を返し deepEqual が fail。section 消失を検知 |

> いずれも runtime ではなく静的解析で検知するため、deploy 前（CI / ローカル）に確実に止まる。

## 境界条件

| 境界 | 値 | 期待 |
| --- | --- | --- |
| ちょうど 3 本 | `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` | **pass**（free-plan 上限ぴったり・余裕 0 本） |
| 4 本 | 上記 + 1 本 | **fail**（TC-4 で `length ≤ 3` 違反） |
| 2 本以下 | 例 `["0 18 * * *", "*/15 * * * *"]` | TC-1..3 deepEqual で **fail**（canonical と本数不一致。意図的に減らす場合は CANONICAL 更新が必要） |

## 将来 cron を 1 本増やす正当な変更時の手順

free-plan は env あたり cron **3 本が上限**であり現状で余裕 0 本。よって「1 本増やす」は単純追加では不可能で、
**既存 1 本の統合・削減とのトレードオフ**になる。正当な変更手順は次の通り（このガードは変更を妨げず、追従させるだけ）:

1. **free-plan 上限の再確認**: 4 本目を恒常運用するなら Workers Paid（cron 上限緩和）への移行可否を判断。
   free-tier 制約を維持するなら、既存 cron のいずれかを統合・削除して 3 本を維持する。
2. **CANONICAL 配列を更新**: `wrangler-cron-schedule.guard.spec.ts` の `CANONICAL` を新しい 3 本に書き換える。
   3 セクション（top / staging / production）すべてを同じ値に揃える（parity 維持）。
3. **`wrangler.toml` の 3 セクションを更新**: `L14 / L91 / L173` の `crons` を新値に揃える。
4. **ドキュメント整合**: `deployment-cloudflare.md`（L85-89, L171, L259-269）の cron→ジョブ対応表と
   無料枠予算を更新。`index.md` の「デプロイ済み cron → ジョブ対応」表も同期。
5. **TC-4 の上限維持確認**: `FREE_PLAN_CRON_LIMIT = 3` は free-plan を維持する限り不変。
   Paid へ移行した場合のみこの定数の引き上げ可否を別途判断する。
6. **テスト再実行**: `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` で green を確認。

## 回帰防止としての位置づけ

- 原 issue #264 の「24h 実測タスク」は obsolete。実測の代わりに、**確定済み 3-cron スケジュールを静的に固定**することで、
  リファクタや wrangler.toml 編集時の cron 破壊を CI で恒久的に防ぐ。
- このガードがあることで、cron 変更は「CANONICAL 更新 + wrangler.toml 更新 + docs 整合」をワンセットで
  強制でき、片側だけの変更（=drift）を未然に防ぐ。

## DoD（Phase 6）

- 負のシナリオ N-1..5 が、それぞれどの TC で fail するか reasoning 付きで明記。
- 境界（3 本 pass / 4 本 fail）が表で固定。
- cron を増やす正当な変更手順（CANONICAL + wrangler.toml + docs + free-plan 再確認）が手順化。
