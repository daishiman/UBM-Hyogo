# Skill Feedback Report — task-specification-creator

本タスク 05a の実行を通じて得られた、`task-specification-creator` skill への feedback。

| # | 観点 | feedback | 種別 |
| --- | --- | --- | --- |
| 1 | bypass 試行の異常系網羅 | Phase 6 の F-15（`?bypass=true`）/ F-16（偽造 cookie）が template に組み込まれており、admin gate 系タスクで網羅性が確保された | **GOOD（維持）** |
| 2 | 不変条件番号引用 | 不変条件 #5, #11 を Phase 1〜10 全てに紐付ける運用が機能。Phase 12 で多角的チェックがしやすい | **GOOD（維持）** |
| 3 | OAuth provider タスクの補強 | OAuth provider タスクは「Google Cloud Console での OAuth client 取得手順」を Phase 5 (実装ランブック) に必ず含めるべき。本タスクで追加した | **改善提案** |
| 4 | session 型定義の前倒し | session JWT の TypeScript 型定義（`SessionUser` / `GateReason`）を **Phase 2 (設計)** に含めると Phase 8 (DRY 化) で `packages/shared` への抽出が容易になる。今回は Phase 8 で発見して再記述する手間が発生した | **改善提案** |
| 5 | 並列タスクの共有契約 ADR | 並列タスク（05a / 05b のような）の場合、**Phase 2 / Phase 3 で共有 contract の ADR を必ず締結する手順**を template に追加すべき。本タスクでは `GET /auth/session-resolve` の共有がアドホックに決まり、05b と認識を揃えるラウンドトリップが発生した | **改善提案（重要）** |

## 改善提案サマリ（template 反映候補）

1. OAuth provider タスクの Phase 5 に「OAuth client 取得手順」セクションを必須化
2. 認証系タスクの Phase 2 に「session 型定義」セクションを必須化
3. 並列タスクの Phase 2 / Phase 3 に「共有 contract ADR 締結」ステップを追加

## 反映結果（2026-04-29）

上記 3 件は `.claude/skills/task-specification-creator/references/phase-template-core.md` に反映済み。OAuth / session / admin gate 系タスクでは Phase 2 に session 型定義、JWT encode/decode 契約、provider 共有 ADR、実 cookie/token 互換テストを必須化し、Phase 5 で OAuth client runbook を作成するルールを追加した。`.claude/skills/task-specification-creator/SKILL.md` の変更履歴にも `v2026.04.29-05a-auth-session-contract` として記録済み。

## 維持すべき強み

- Phase 6 の異常系（F-XX）番号付け
- 不変条件番号の Phase 跨ぎ引用
- Phase 10 の GO/NO-GO 条件付き判定（B-XX 既知制約とセット）
- Phase 11 の BLOCKED 状態を許容する設計（自動化テスト + checklist による代替）
