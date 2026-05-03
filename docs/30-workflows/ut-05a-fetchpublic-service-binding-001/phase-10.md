# Phase 10: 最終レビュー — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 10 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |

## 目的

Phase 1〜9 の成果物を通読し、Phase 11 実 staging / production deploy 実行に着手して
問題ない状態か最終確認する。AC マトリクスと evidence path 割当の cross-check、
DRY 抽出の最終 GO/NO-GO 判断、wrangler.toml drift 確認を行う。

## 実行タスク

1. `index.md` / `artifacts.json` と各 phase の整合を確認
2. AC マトリクス（AC-1〜AC-6）と evidence path / Layer 割当の整合を確認
3. Phase 8 で検討した DRY 抽出（`fetchSessionResolve` / `fetchPublic` の service-binding
   helper 共通化）の最終 GO/NO-GO 判断 — 抽出する場合は本タスクサイクル内で完了させる
   （CONST_007 に従い別タスクへ deferred しない）
4. 異常系ハンドリング（`env.API_SERVICE` undefined 時の HTTP fallback、API 側 4xx/5xx 時の
   エラー伝搬）と PII / secret 取扱ルールの整合を確認
5. `apps/web/wrangler.toml` の `[[env.staging.services]]` / `[[env.production.services]]`
   が `binding = "API_SERVICE"` `service = "ubm-hyogo-api-staging" / production `service = "ubm-hyogo-api"`` の形で揃っているか drift 確認

## 参照資料

- `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/index.md`
- `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/artifacts.json`
- `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/phase-07.md`
- `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/phase-08.md`
- `apps/web/src/lib/fetch/public.ts`
- `apps/web/src/lib/auth.ts` `fetchSessionResolve`
- `apps/web/wrangler.toml`

## 統合テスト連携

- Phase 11 execution readiness を確認し、runtime execution 自体は user 明示指示まで行わない
- `task-workflow-active.md` の本タスク entry が `spec_created` のまま据え置かれていることを確認

## レビュー観点

| 観点 | 確認内容 |
| --- | --- |
| service-binding 整合 | `apps/web/src/lib/fetch/public.ts` が `env.API_SERVICE.fetch(...)` を優先し、`env.API_SERVICE` undefined 時のみ HTTP fallback に分岐する |
| HTTP fallback 動作 | local `pnpm dev` で `PUBLIC_API_BASE_URL` 経由の HTTP fetch が壊れていない |
| wrangler.toml drift | staging / production の services 設定が同一形式で揃っている |
| system spec 同期準備 | `task-workflow-active.md` 反映ポイントが Phase 12 で曖昧でない |
| spec_created 据え置き | `workflow_state` を勝手に `completed` にしていない |
| secret 露出 | API token / cookie 値 / OAuth token 値が仕様書に書かれていない |
| `wrangler` 直接呼出 | grep で 0 件（`bash scripts/cf.sh` 経由のみ） |
| 仮置きパス | 「<staging>」など placeholder のまま AC 判定していない |

## サブタスク管理

- [ ] 全 phase 通読
- [ ] grep で `wrangler ` 直接呼出が無いことを確認（ただし `wrangler tail` を bash scripts/cf.sh 配下で説明する文は許容）
- [ ] grep で secret 値らしき文字列が無いことを確認
- [ ] AC マトリクスと evidence path の対応表が抜け漏れなし
- [ ] DRY 抽出の GO/NO-GO 判断を outputs/phase-10/main.md に記録
- [ ] outputs/phase-10/main.md に最終レビュー結果を記録
- [ ] outputs/phase-10/grep-checks.md に自動 grep 検査結果を記録

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-10/grep-checks.md`

## 完了条件

- 不整合 / 仮置き / secret 露出がゼロ
- DRY 抽出の GO/NO-GO 判定が記録済み（GO の場合は本タスクサイクル内で完了する計画があること）
- Phase 11 実 staging 実行に着手できる状態

## タスク100%実行確認

- [ ] 全 phase が相互に矛盾しない
- [ ] PII / secret 露出が無い
- [ ] wrangler.toml drift がない

## 次 Phase への引き渡し

Phase 11 へ、最終レビュー済の deploy / verification ランブックを渡す。
