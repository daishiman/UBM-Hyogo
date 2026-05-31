# Phase 12 / Task 12-5: スキルフィードバックレポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 改善点なしでも出力必須。テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。

---

## 1. テンプレート改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| optimistic state の責務分離 | dialog 表示制御（`stage` union）と row 可視性制御（`optimisticMerged` boolean）を分離する判断は有効だった | 既存 `references/patterns-ui-ipc-modules.md` / Phase 2 設計観点の「責務分離」で吸収可能。新規 skill 変更は no-op |
| cross-row race の構造的回避 | 各 row が独立 component instance のため race は構造的に発生しない | 既存 SRP / component-local state guidance で説明可能。新規 reference 追加は過剰 |

---

## 2. ワークフロー改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| hook 拡張回避の判断 | `useAdminMutation` に optimistic option を追加せず component-local state で完結させる判断が最小差分だった | 既存「implementation target が明確なら同一 cycle で実装」ルールに従い、hook 汎化はしない |
| open issue の状態確認 | Issue #988 は OPEN と記録した | Issue 起点の実状態確認は既存 workflow practice で十分。新規ルール化は no-op |
| `spec_created` UI task の再分類 | 実コード差分が入ったため `spec_created` を撤回し `implemented_local_evidence_captured` へ同波再分類した | `task-specification-creator` 既存 close-out gate に準拠。LOGS に今回の適用例を追記 |

---

## 3. ドキュメント改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| identifier drift 防止 | implementation-guide の確定コード（`setOptimisticMerged` / `optimisticMerged` / `onMerge`）を Phase 1 設計と一致させ、Task 12-6 で grep 確認する運用は drift 防止に有効 | 現行 W1-02b-3 ルールで十分。追加改善なし |
| screenshot canonical 名の早期固定 | 3 枚の screenshot 名を Phase 1 spec で先に確定し implementation-guide でも同名参照したため、Phase 11 実行時の名前ドリフトを予防できる | 現行 FB-VISUAL-CAP-001 ルールで十分。追加改善なし |

---

## 総括

SKILL.md 本体へ昇格すべき新ルール（gate / policy）は検出されなかった。一方、本実装で得た再利用知見（苦戦箇所）は reference 層に体系化した:

- aiworkflow-requirements: `lessons-learned/lessons-learned-issue-988-optimistic-merged-2026-05.md`（L-I988-001..006）を新規作成し、artifact inventory に `## Lessons Learned` 節、dated changelog、SKILL-changelog dated 行を追加。
- task-specification-creator: `references/patterns-lessons-and-pitfalls.md` に「optimistic row mutation + rollback + API error body surfacing パターン」節（L-OPTMUT-001..006 + anti-pattern 4）を汎化し、SKILL-changelog dated 行と `LOGS/_legacy.md` 適用例を追加。

苦戦箇所のうち最大のものは「rollback inline alert が transport 汎用文言になり API body の 409 業務メッセージが落ちる drift」で、`FetchAuthedError.bodyText` を JSON.parse する `errorMessage` helper として同サイクル内で解消した（L-I988-002 / L-OPTMUT-002）。既存の implementation target physical existence gate と same-wave sync rule は維持。
