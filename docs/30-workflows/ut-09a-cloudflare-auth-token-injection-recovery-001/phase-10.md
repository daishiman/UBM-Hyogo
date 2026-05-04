# Phase 10: 最終レビュー — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 10 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec) |

## 目的

Phase 1〜9 の成果物を通読し、Phase 11 実 `whoami` 復旧実行に着手して問題ない状態か最終確認する。AC マトリクスと evidence path 割当の cross-check、SOP 抽出（Phase 8）の最終 GO/NO-GO 判断、`scripts/cf.sh` / `scripts/with-env.sh` の drift 確認を行う。

## 実行タスク

1. `index.md` / `artifacts.json` と各 phase の整合を確認
2. AC マトリクス（AC-1〜AC-7）と evidence path / Layer 割当の整合を確認
3. Phase 8 で検討した SOP 抽出（Stage isolation / wrangler login residue / redaction）の最終 GO/NO-GO 判断 — 抽出する場合は本タスクサイクル内で完了させる（CONST_007 に従い別タスクへ deferred しない）
4. 異常系ハンドリングと secret / `wrangler login` / `.env` 取扱ルールの整合を確認
5. `scripts/cf.sh` / `scripts/with-env.sh` の drift 確認結果（Phase 9 shell-syntax.log）を確認
6. secret 値・実 vault 名・実 item 名・account id が仕様書全体に含まれていないことを grep で確認

## 参照資料

- `docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/index.md`
- `docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/artifacts.json`
- `docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/phase-07.md`
- `docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001/phase-08.md`
- scripts/cf.sh / scripts/with-env.sh
- CLAUDE.md（secret / cf.sh 規約 / 禁止事項）

## 統合テスト連携

- Phase 11 execution readiness を確認し、runtime execution 自体は user 明示指示まで行わない
- `task-workflow-active.md` の本タスク entry が `spec_created` のまま据え置かれていることを確認
- 親タスク `ut-09a-exec-staging-smoke-001` Phase 11 が本タスク AC-6 evidence path を解決できることを確認

## レビュー観点

| 観点 | 確認内容 |
| --- | --- |
| 三段ラップ整合 | `scripts/cf.sh` / `scripts/with-env.sh` が op → mise → wrangler の経路を保っている |
| `.env` 取扱 | `.env` の値を読む手順がどこにも含まれていない（キー名抽出のみ） |
| `wrangler login` 禁止 | `wrangler login` を採用する分岐が含まれていない |
| `wrangler` 直接呼出 | grep で 0 件（説明文中の `wrangler whoami` は `bash scripts/cf.sh` 配下の説明として許容） |
| 仮置きパス | `<vault>` `<item>` 等 placeholder のまま AC 判定していない |
| secret 露出 | API Token / OAuth token / cookie / account secret / vault 名 / item 名 が仕様書に書かれていない |
| system spec 同期準備 | `task-workflow-active.md` 反映ポイントが Phase 12 で曖昧でない |
| spec_created 据え置き | `workflow_state` を勝手に `completed` にしていない |
| 親タスク handoff | AC-6 evidence path が親タスク Phase 11 から解決可能 |

## サブタスク管理

- [ ] 全 phase 通読
- [ ] grep で `wrangler ` 直接呼出が無いことを確認（説明文中の `wrangler whoami` は `bash scripts/cf.sh` 配下の説明として許容）
- [ ] grep で secret 値・vault 名・item 名らしき文字列が無いことを確認
- [ ] AC マトリクスと evidence path の対応表が抜け漏れなし
- [ ] SOP 抽出の GO/NO-GO 判断を outputs/phase-10/main.md に記録
- [ ] 親タスク handoff 整合を確認
- [ ] outputs/phase-10/main.md に最終レビュー結果を記録
- [ ] outputs/phase-10/grep-checks.md に自動 grep 検査結果を記録

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-10/grep-checks.md`

## 完了条件

- 不整合 / 仮置き / secret 露出がゼロ
- SOP 抽出の GO/NO-GO 判定が記録済み（GO の場合は本タスクサイクル内で完了する計画があること）
- Phase 11 実 `whoami` 復旧実行に着手できる状態

## タスク100%実行確認

- [ ] 全 phase が相互に矛盾しない
- [ ] secret 露出 / vault 名 / item 名露出が無い
- [ ] `scripts/cf.sh` / `scripts/with-env.sh` drift がない（または最小修正で整合）
- [ ] `wrangler login` 採用分岐が含まれていない

## 次 Phase への引き渡し

Phase 11 へ、最終レビュー済の復旧 / verification ランブックを渡す。
