---
phase: 9
title: リスク表
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 9: リスク表

[実装区分: 実装仕様書]

## 1. リスク一覧

| ID | リスク | 影響度 | 発生確率 | 緩和策 |
|----|--------|--------|----------|--------|
| R-01 | composite action default `24.15.0` と現行 `'24'` の cache key 差分により初回 cache miss | 低 | 中 | 1 回目の install が約 30s 増加するのみ。2 回目以降は hit。許容する |
| R-02 | composite action 経由 install が黙って失敗した場合、後続 step で pnpm not found | 中 | 低 | Phase 6 Step 1 (gh workflow view) と Step 3 (PR run) で必ず検出可能 |
| R-03 | `web-cd.yml` の `mise exec --` prefix を除去することで Node 切替挙動が変わる懸念 | 中 | 低 | CI 上の actions/setup-node は PATH を上書きするため `mise exec` の有無は無関係。staging deploy で動作確認 |
| R-04 | `validate-build.yml` の `if: steps.ready.outputs.value == 'true'` 条件継承漏れ | 高 | 低 | composite action ステップ自体に `if:` を必ず付与（Phase 5 §2-4 で明記） |
| R-05 | composite action 内部の install と workflow 側の install が重複 | 低 | 低 | rollout 時に workflow 側 install step を必ず削除（Phase 5 で明記） |
| R-06 | 共通 composite action の変更が将来全 18 workflow に同時波及する（DRY の本質的リスク） | 中 | 中 | composite action 変更は別 PR で隔離し、その PR は全 workflow への影響レビューを必須化 |
| R-07 | `backend-ci.yml` の Cloudflare secret preflight step が install 順序変化で動かなくなる | 中 | 低 | composite action は actions/checkout の直後に置くため、preflight step との順序は不変 |
| R-08 | `actionlint` / `bats` 等の追加 install step が rollout で誤削除される | 中 | 低 | Phase 5 §2 で各 yaml の保持 step を明記。レビュー時に diff で確認 |
| R-09 | Issue #284 本文が古いまま close され、後続作業者が混乱 | 低 | 中 | PR 本文に Issue 本文との差分（5 yaml → 13 yaml）を明記。Issue close コメントにも記載 |
| R-10 | composite action `setup-project` の OIDC permission が `web-cd.yml` deploy step に影響 | 高 | 低 | composite action は permission を消費しない（pure setup）。OIDC は workflow `permissions:` で別途定義済み |

## 2. ロールバック手順

```bash
# PR merge 後に問題発生した場合
git revert <merge_commit_sha>
git push origin dev
```

revert は 1 commit で 13 yaml を元に戻す。composite action 自体は無変更なので残存問題なし。

## 3. 段階的 rollout の不採用理由

13 yaml を 3 PR に分割する案も検討したが、

- composite action 自体は変更しないので変更内容が同質
- PR 数増による review コストの方が大きい
- revert は 1 PR でも可能

ため 1 PR 集約を採用する（Phase 3 §3 参照）。

## 4. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 9 | リスクを表に明記 |
| 11 | R-03 / R-07 に対する evidence（staging deploy 成功 / preflight log）を取得 |

## 完了条件

- [ ] R-01〜R-10 がリスク表に列挙されている
- [ ] ロールバック手順が §2 に明記されている
