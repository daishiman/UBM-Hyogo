# Phase 10: 最終レビュー — cf-token-env-contract-and-rotation-retirement

## 目的

Phase 1〜9 の成果（要件 / 設計 / 実装 / リファクタリング / 品質保証）に対し、受入条件 AC-1〜AC-8 の充足を判定し、blocker・MINOR 指摘・partial fix の有無・CONST_007（1サイクル完了）を確認する。本サイクルは `implemented_local_evidence_captured / staging_runtime_pending_user_gate` のため、各 AC は「local 実装 PASS / runtime user-gated」の二軸で記録する。

## AC 判定表（○ / ×）

| AC | 内容 | 仕様充足 | 実装 | 根拠 |
| -- | ---- | :------: | :--: | ---- |
| AC-1 | `provision-staging-secrets.sh` の `SECRETS` に `CLOUDFLARE_API_TOKEN`（op 参照）追加・inventory に出現 | ○ | local PASS / runtime user-gated | 実装行 `op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE` と inventory 自動検証を追加。`ACCOUNT_ID` は repo var のため非追加 |
| AC-2 | CF トークン欠落時に `cf_degraded=1` output で degrade-skip・存在時は実走 | ○ | local PASS / runtime user-gated | `verify-bulk-inputs` step output と後続 step の `if:` に `steps.verify-bulk-inputs.outputs.cf_degraded != '1'` を実装 |
| AC-3 | `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` 欠落は従来通り hard-fail（`exit 1`） | ○ | local PASS | required_missing ループで前提 secret を degrade 対象から分離 |
| AC-4 | drift gate が workflow consumed secrets ⊆ provisioned secrets ∪ documented legacy exemptions を検査・追加前 fail / 追加後 PASS | ○ | local PASS | `verify-runtime-smoke-secret-contract.mts` + Vitest で検証 |
| AC-5 | `cf-token-rotation-reminder.yml` 削除 + runbook 置換（tombstone + 新 runbook） | ○ | local PASS | workflow 削除、新 runbook追加、旧 runbook tombstone、log 追記を反映 |
| AC-6 | 別トークン狭スコープ no-expiry（staging smoke 用 / production deploy 用を分離） | ○ | local PASS / runtime user-gated | 新 runbook に staging / production 分離と scope boundary を記載 |
| AC-7 | `verify-mint-env-contract.mts` / `.yml` 責務不変 | ○ | local PASS | 既存 verifier は変更せず、既存 test 期待値のみ provision inventory 追加に追随 |
| AC-8 | redaction / masking 不変・verifier は name のみ・トークン値非読取 | ○ | local PASS | verifier は secret name のみ抽出。`redact.sh` / `::add-mask::` / redaction grep gate 不変 |

> 凡例: **local PASS** = 本サイクルで実ファイル反映と local verification 完了。**runtime user-gated** = Cloudflare token 発行 / GitHub Secret mutation / 実 staging smoke が必要な外部操作。

## blocker 判定

**なし。** 全 AC が local PASS または明示 user-gated runtime 境界に分離され、設計上の矛盾・実装不能点・前提タスク未完（issue-1081 / mint-env-contract は completed）はない。

## MINOR 指摘（Phase 12 で未タスク化）

| ID | 指摘 | 重大度 | 方針 |
| -- | ---- | ------ | ---- |
| M-1 | 新 drift gate `verify-runtime-smoke-secret-contract.yml` を dev / main の required status check に登録するか | MINOR | branch protection 変更は user-gated（CLAUDE.md ブランチ戦略）。登録する場合は `pull_request.paths` フィルタ footgun（memory issue-1146）を回避するため paths 除去を要検討。本サイクルでは未登録・PR/push トリガのみ。Phase 12 で未タスク化 |
| M-2 | `cf-token-rotation-reminder.yml` 削除後に dead 化する `CF_TOKEN_ISSUED_AT` repo var の物理削除 | MINOR | GitHub 設定操作=user-gated・コード対象外。runbook B2 に「未参照」と記録。物理削除は任意。Phase 12 で未タスク化 |
| M-3 | 1Password item `CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE`（新規）の作成と狭スコープトークン値の投入 | MINOR | operational・user-gated。runbook B2 の手順に従う。実装 landed 後の Gate-C で実施。Phase 12 で未タスク化 |

> MINOR はいずれも本サイクルのコード成果物を blocker にしない。Phase 12 で未タスク（baseline / followup 候補）として記録し、起票要否を判定する。

## CONST_007（1サイクル完了・先送りなし）確認

| 項目 | 確認 |
| ---- | ---- |
| コード変更の完結性 | A1〜A5 / B1〜B4 のコード（provision script / workflow / verifier / test / CI yml / runbook 群）は 1 PR で完了する設計。半端な分割なし |
| operational の位置づけ | トークン発行・1Password 投入・実 secret 登録・実 D1 smoke 実走は user-gated Gate-C として**同サイクル内**に runbook 化して位置づけ。別タスクへ先送りしない |
| partial fix の有無 | **なし。** 真因（provisioning 正本ギャップ）を A1 で直接解消し、A3 で再発を構造封じ、A2 で安全網を張る。症状の一部だけ塞ぐ partial fix ではない |
| MINOR の先送り扱い | M-1〜M-3 は user-gated（branch protection / GitHub 設定 / secret 投入）で、コード成果物の完結性とは独立。CONST_007 の「先送り」には該当しない（Phase 12 で明示記録し起票判定） |

→ **CONST_007 充足: 1 サイクルでコード変更が完結し、partial fix なし。先送りはなし。**

## 4条件 最終評価

| 条件 | 評価 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | ○ | 「毎回赤い CI」を恒久解消・ローテ運用の手間をゼロ化 |
| 実現性 | ○ | 既存 degrade パターン / verifier 構造の再利用で実装可能 |
| 整合性 | ○ | 責務境界（投入正本 / drift gate / mint gate / degrade）が矛盾なく閉じる |
| 運用性 | ○ | drift gate が再発を構造封じ・degrade が安全網・runbook が即時失効を正本化 |

## 完了条件

- [x] AC-1〜AC-8 を ○ / × 判定表で記録し、「local PASS / runtime user-gated」の二軸を明記した。
- [x] blocker なしを確認した。
- [x] MINOR 指摘（M-1〜M-3）を Phase 12 未タスク化方針とともに記録した。
- [x] partial fix なし・CONST_007（1サイクル完了・先送りなし）を確認した。
- [x] 4条件すべて ○ で最終承認した。
