# Phase 7 成果物 — AC マトリクス

## 1. AC マトリクスサマリ

UT-GOV-001 の AC は **親仕様 AC-1〜8（§2.2）+ 設計追加 AC-9〜14（index.md）= 全 14 件**。本マトリクスで AC × Phase（1-13）× T（T1〜T11）× 成果物（snapshot / payload / rollback / applied / runbook / rollback-rehearsal-log / unassigned-task-detection）の対応を空セルなく埋める。実走を伴わない仕様確認のみ。

## 2. AC × Phase 対応表

| AC | 主担当 Phase | 補助 Phase | 担当成果物 |
| --- | --- | --- | --- |
| AC-1（snapshot 保全） | 5 (Step 1) | 11 (smoke) / 13 (PUT 後再保全) | branch-protection-snapshot-{dev,main}.json |
| AC-2（adapter 正規化 payload） | 5 (Step 2) | 2 (§4 マッピング) / 6 (T6 / T11) | branch-protection-payload-{dev,main}.json / branch-protection-rollback-{dev,main}.json |
| AC-3（contexts UT-GOV-004 同期） | 1 / 2 / 3 (3 重明記) | 5 (Step 0) / 6 (T7) / 13 (第 2 段階再 PUT) | payload の `.required_status_checks.contexts` |
| AC-4（dry-run intended diff） | 5 (Step 3) | 11 (smoke) / 13 (PR 説明に転記) | apply-runbook.md §dry-run-diff |
| AC-5（dev / main 独立 PUT 成功） | 5 (Step 4) | 6 (T10) / 11 (smoke) / 13 (実走) | branch-protection-applied-{dev,main}.json |
| AC-6（rollback double-apply） | 5 (Step 5 + Step 6) | 6 (T8) / 11 (smoke) / 13 (実走) | rollback-rehearsal-log.md |
| AC-7（enforce_admins rollback 担当者） | 2 (§9.2) | 5 (Step 5.2) / 6 (T8) / 11 (apply-runbook.md) | apply-runbook.md §emergency-rollback |
| AC-8（CLAUDE.md ↔ GitHub 整合） | 2 (§7 ステップ 7) | 5 (Step 6.2) / 11 / 12 (documentation-changelog) | rollback-rehearsal-log.md grep 確認 |
| AC-9（branch サフィックス分離 / bulk 化禁止） | 2 (§6 / §10) | 5 (Step 4 / 5 / 6) / 6 (T10) | 全 JSON ファイル名 |
| AC-10（lock_branch=false 明示） | 2 (§4.1) | 5 (Step 2 jq) / 6 (T9) | payload-{dev,main}.json / rollback-{dev,main}.json |
| AC-11（GET ↔ PUT field 差異正規化） | 2 (§4.1 / §4.2) | 5 (Step 2) / 6 (T6 / T11) | payload-{dev,main}.json |
| AC-12（UT-GOV-004 3 重明記） | 1 / 2 / 3 | - | phase-01.md / phase-02.md / phase-03.md |
| AC-13（4 条件 PASS） | 1 / 3 | - | outputs/phase-01/main.md / outputs/phase-03/main.md |
| AC-14（Phase 1-13 = artifacts.json 完全一致） | index.md / artifacts.json | 全 Phase | artifacts.json |

## 3. AC × T（テスト）対応表

| AC | T1 dry-run | T2 adapter | T3 独立 PUT | T4 rollback | T5 2 段階 | T6 422 | T7 contexts | T8 enforce | T9 lock | T10 片側 | T11 drift |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | - | - | - | ◎(snapshot 比較) | - | - | - | - | - | - | - |
| AC-2 | ◎ | ◎ | - | - | - | ◎ | - | - | - | - | ◎ |
| AC-3 | - | ◎(contexts 確認) | - | - | ◎ | - | ◎ | - | - | - | - |
| AC-4 | ◎ | - | - | - | - | - | - | - | - | - | - |
| AC-5 | - | - | ◎ | - | - | - | - | - | - | ◎ | - |
| AC-6 | - | - | - | ◎ | - | - | - | - | - | - | - |
| AC-7 | - | - | - | ◎(緊急 DELETE) | - | - | - | ◎ | - | - | - |
| AC-8 | - | - | - | ◎(末尾 grep) | - | - | - | - | - | - | - |
| AC-9 | - | - | ◎ | - | - | - | - | - | - | ◎ | - |
| AC-10 | - | ◎ | - | - | - | - | - | - | ◎ | - | - |
| AC-11 | ◎ | ◎ | - | - | - | ◎ | - | - | - | - | ◎ |
| AC-12 | -（Phase 1/2/3 引用で被覆） |
| AC-13 | -（Phase 1/3 評価で被覆） |
| AC-14 | -（artifacts.json 整合で被覆） |

> 凡例: ◎ = 主たる被覆、◎(注記) = 補助被覆、- = 該当なし。AC-12 / AC-13 / AC-14 は T 群ではなく Phase 1〜3 / artifacts.json の構造で直接被覆。

## 4. AC × 成果物 対応表

| AC | 主成果物 | 補助成果物 |
| --- | --- | --- |
| AC-1 | branch-protection-snapshot-{dev,main}.json | apply-runbook.md §snapshot |
| AC-2 | branch-protection-payload-{dev,main}.json | branch-protection-rollback-{dev,main}.json |
| AC-3 | payload の `.required_status_checks.contexts` | apply-runbook.md §contexts-sync |
| AC-4 | apply-runbook.md §dry-run-diff | /tmp/ut-gov-001-diff-{dev,main}.txt |
| AC-5 | branch-protection-applied-{dev,main}.json | apply-runbook.md §apply-result |
| AC-6 | rollback-rehearsal-log.md | branch-protection-rollback-{dev,main}.json |
| AC-7 | apply-runbook.md §emergency-rollback | rollback-rehearsal-log.md §enforce-admins-delete |
| AC-8 | CLAUDE.md（参照）/ rollback-rehearsal-log.md grep 結果 | documentation-changelog.md |
| AC-9 | 全 JSON のファイル名（`{branch}` サフィックス） | apply-runbook.md §dev-main-isolation |
| AC-10 | payload-{dev,main}.json / rollback-{dev,main}.json | apply-runbook.md §lock-branch-policy |
| AC-11 | payload-{dev,main}.json | adapter jq テンプレ（Phase 5 §5.2） |
| AC-12 | phase-01.md §依存境界 / phase-02.md §12 / phase-03.md §着手可否ゲート | - |
| AC-13 | outputs/phase-01/main.md §3 / outputs/phase-03/main.md §5 | - |
| AC-14 | artifacts.json `phases[]` | index.md §Phase 一覧 |

## 5. AC-12（UT-GOV-004 3 重明記）引用

| 箇所 | 引用 |
| --- | --- |
| Phase 1 §依存境界 | 「UT-GOV-004（`required_status_checks.contexts` 実在 job 名同期）が completed であること」（必須前提として記載） |
| Phase 2 §12 | 「未完了時は `contexts=[]` で先行 PUT → UT-GOV-004 完了後に再 PUT する 2 段階適用に切替」 |
| Phase 3 §依存タスク順序（重複明記 3/3）| 「UT-GOV-004（`required_status_checks.contexts` 実在 job 名同期）が completed でなければ、本 Phase の着手可否ゲートは強制 NO-GO となる」 |

## 6. AC-13（4 条件 PASS）引用

| 観点 | Phase 1 判定 | Phase 3 判定 |
| --- | --- | --- |
| 価値性（governance 強制） | PASS | PASS |
| 実現性（gh api + jq + payload で MVP 充足） | PASS | PASS |
| 整合性（CLAUDE.md / scripts/cf.sh 思想 / 不変条件 #5 不侵害） | PASS | PASS |
| 運用性（snapshot / rollback 事前生成 / DELETE 経路） | PASS | PASS |

## 7. AC-14（Phase 1-13 = artifacts.json 完全一致）確認

| Phase | 状態（index.md） | 状態（artifacts.json） | 一致 |
| --- | --- | --- | --- |
| 1 | completed | completed | ✓ |
| 2 | completed | completed | ✓ |
| 3 | completed | completed | ✓ |
| 4 | pending | pending | ✓ |
| 5 | pending | pending | ✓ |
| 6 | pending | pending | ✓ |
| 7 | pending | pending | ✓ |
| 8 | pending | pending | ✓ |
| 9 | pending | pending | ✓ |
| 10 | pending | pending | ✓ |
| 11 | pending | pending | ✓ |
| 12 | pending | pending | ✓ |
| 13 | pending | pending | ✓ |

## 8. 未消化 AC チェック

- AC-1〜AC-14 すべてに **主担当 Phase / 主成果物** が割り当て済み
- AC × T マトリクスで AC-1〜AC-11 に最低 1 件の ◎ あり
- AC-12 / AC-13 / AC-14 は構造的被覆（Phase 1〜3 ドキュメント / artifacts.json）で代替
- 空セル（「-」のみ）の AC 行: なし

## 9. 引き渡し（Phase 8 へ）

- 全 14 件 AC が Phase × T × 成果物の 3 軸でマッピング済み
- 未消化 AC ゼロを Phase 8 DRY 化 / Phase 9 品質保証 / Phase 10 GO/NO-GO で再利用
- AC-7（enforce_admins 担当者明記）/ AC-9（branch サフィックス分離）/ AC-10（lock_branch=false）の 3 件は実装ランブック / runbook 記載の両方が要件のため、Phase 11 apply-runbook.md / Phase 13 PR 説明で再点検
- 実走を伴わない（本 Phase は対応関係の固定のみ）
