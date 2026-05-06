# Skill Feedback Report — Issue #350

3 観点固定（テンプレ改善 / ワークフロー改善 / ドキュメント改善）。改善点なしでも各章は出力必須。

## 1. テンプレ改善

**所見**: task-specification-creator skill の Phase 11 テンプレに「**外部 user 認証が必要な runtime path をどの語彙で deferral するか**」のガイダンスがあるが、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` + `PENDING_RUNTIME_EVIDENCE` の二重語彙の使い分けが Phase 11 reference 側に集中していて、Phase 12 spec / Phase 13 ゲート側との対応関係が薄い。

**提案**: `references/phase-template-phase11.md` の `runtime PENDING` セクションに「Phase 12 spec_created を維持 / Phase 13 G2 で runtime gate を user に開く」一行リンクを追加する（今回 cycle では skill 側を改変しない — 観察のみ）。

## 2. ワークフロー改善

**所見**: 09c の unassigned-task-detection から本 issue-350 への consumed trace が「行末追記」運用になっており、**多重 consume 発生時にどう連鎖記録するか**が暗黙のままだった。本仕様書では trace を「削除せず追記」「追記順保持」と明文化したが、skill 側の規範に反映されていない。

**提案**: `references/phase-12-spec.md` の Step 2 に「consumed trace は削除禁止・追記順保持」を明文化する（後続 skill 更新タスクで反映）。

## 3. ドキュメント改善

**所見**: `aiworkflow-requirements` の operations reference は `deployment-cloudflare-opennext-workers.md` 一本に集中しがちで、post-release / observation という時系列軸の reference が薄かった。本タスクで `post-release-long-term-observation.md` を追加するが、24h（09c）/ D+7,30（本タスク）/ D+90（未対応）と段階増しで増える可能性がある。

**提案**: `references/` 直下に `post-release-` プレフィックス命名を統一規約として運用する（既に observation reference がこの規約に従っている）。

## DoD

- [ ] 3 章が出力されている（改善点なしの章は「該当なし」と明記でも可）
- [ ] 提案箇所の path が canonical absolute / repo-relative で書かれている
