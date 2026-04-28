# Phase 3 — 設計レビュー（review）

## Status
done

> 対象: `outputs/phase-2/design.md`（草案）
> 前提: Phase 1 `outputs/phase-1/main.md` のスコープ・受入条件・横断依存

## 1. レビュー観点

1. **価値性** — 真の論点（複数 worktree × squash-only × 非対称レビュー × pull_request_target 安全化）に答えているか。
2. **実現性** — GitHub Branch Protection / GHA の標準機能のみで成立するか。
3. **整合性** — 横断 4 タスクと衝突せず、CLAUDE.md の不変条件・MEMORY のシークレット運用を破らないか。
4. **運用性** — 設定変更・ロールバック・例外運用（緊急時 lock_branch 等）が文書化された形で取り扱えるか。

---

## 2. トピック別 4 条件評価

| Phase 2 トピック | 価値性 | 実現性 | 整合性 | 運用性 | コメント |
| --- | :-: | :-: | :-: | :-: | --- |
| §1 status check 命名 | ◎ | ○ | ◎ | ○ | 8 target contexts は有用だが、現行 GitHub Actions job と未同期。実適用前に一度成功させる必要あり (MAJOR-1) |
| §2 main protection | ◎ | ◎ | ◎ | ○ | `lock_branch` のスイッチ運用ルールは Phase 5 ランブックで補強要 (MINOR-1) |
| §3 dev protection | ◎ | ◎ | ◎ | ◎ | dev=1名・CODEOWNERS 任意の差分が明確 |
| §4 squash-only | ◎ | ◎ | ◎ | ◎ | repo setting と protection の二層で物理的に merge commit 不可 |
| §5 auto-rebase | ◎ | ○ | ◎ | ○ | pull_request ラベル起点に縮小。base push 起点は対象 PR 列挙が必要なため後続実装へ委譲 (MINOR-2) |
| §6 pr-target safety gate | ◎ | ○ | ◎ | ○ | `pull_request_target` 内で PR code を実行しない形へ補正。dry-run / security review が必要 (MAJOR-2) |
| §7 状態遷移図 | ◎ | ◎ | ◎ | ◎ | feature → dev → main の squash 圧縮が一目で分かる |

---

## 3. 受入条件チェック表（Phase 1 §4）

| AC | 状態 | 根拠 |
| --- | :-: | --- |
| AC-1 main/dev protection JSON | ✅ | design.md §2, §3 |
| AC-2 squash-only 強制 | ✅ | design.md §4（repo setting + linear history の二層） |
| AC-3 auto-rebase workflow 完備 | 条件付き | design.md §5（pull_request 起点は定義済み。base push 起点は後続） |
| AC-4 pr_target safety | 条件付き | design.md §6（`pull_request_target` は triage のみ。untrusted build は `pull_request` へ分離） |
| AC-5 横断境界 | ✅ | design.md §8 |
| AC-6 Phase 13 ゲート | ✅ | 各 main.md / index.md に明記 |
| AC-7 草案宣言 | ✅ | design.md 冒頭注記 |

---

## 4. 指摘事項

### MAJOR

| # | 指摘 | 吸収先 |
| - | --- | --- |
| MAJOR-1 | required status checks 8件が現行 workflow job 名と未同期 | Phase 12 unassigned U-4 / task-git-hooks-lefthook-and-post-merge |
| MAJOR-2 | `pull_request_target` 内で PR code を実行する設計は危険。PR code 実行を `pull_request` に分離する必要 | Phase 2 §6 補正 / Phase 12 unassigned U-2 |

### MINOR

| # | 指摘 | 吸収先 |
| - | --- | --- |
| MINOR-1 | `lock_branch=true` を切り替える運用条件（リリースフリーズ、本番障害対応中等）を明文化していない | Phase 5 implementation runbook |
| MINOR-2 | auto-rebase が rebase conflict で停止した際の **通知経路**（Slack か PR コメントか）が未定義 | task-conflict-prevention-skill-state-redesign 側で吸収（責務委譲） |
| MINOR-3 | 現状 private repo 想定。OSS 化した場合 `pull_request_target` の triage job の権限範囲を再評価する必要 | 将来の repo public 化タスク |

---

## 5. 横断タスクとの責務境界（衝突チェック）

| 横断タスク | 衝突点 | 判定 |
| --- | --- | --- |
| task-git-hooks-lefthook-and-post-merge | CI と hook で **ジョブ名を同一化** する規約。命名側を本タスクが定義（design.md §1） | 衝突なし。むしろ整合 |
| task-conflict-prevention-skill-state-redesign | rebase conflict 時の処理 | 本タスクは「bot は止まる」境界のみ宣言、解消は当該 skill の責務 |
| task-worktree-environment-isolation | env 隔離 | CI は repo 単位で発火するため worktree 不可知。衝突なし |
| task-claude-code-permissions-decisive-mode | 権限最小化 | Claude Code 側と GHA 側は独立レイヤ。最小権限ポリシーが両立 |

CLAUDE.md 不変条件・MEMORY 制約との照合:

- D1 直接アクセス制限 → status check 命名で apps/api と apps/web を分離（design.md §1）に整合。
- `wrangler` 直接実行禁止 → CI で deploy job を扱う場合は `scripts/cf.sh` 経由を **Phase 5 ランブックで強制** すること（MINOR-1 と併せて補足）。
- 平文 `.env` / トークン値の文書転記禁止 → design.md は値の例示なし。OK。

---

## 6. GO / NO-GO 判定

| 観点 | 判定 |
| --- | --- |
| MAJOR の有無 | 2件（条件付き草案として補正済み） |
| AC 充足 | 5 PASS / 2 CONDITIONAL PASS |
| 横断衝突 | なし |
| 草案宣言 | あり |
| Phase 13 ユーザー承認ゲート | 維持される |

**判定: GO（条件付き草案）** — Phase 4（テスト設計）へ進む。MAJOR 2 件は Phase 12 の current 未タスクへ引き継ぎ、実適用前に必ず解消する。

---

## 7. Phase 4 への申し送り

- Phase 4 では design.md §1 の 8 contexts を **テストマトリクスの軸** に流用すること。
- MINOR-1 を Phase 5 ランブック作成時に解決。
- MINOR-2 は当該横断タスクへ参照リンク（責務委譲メモ）として残すこと。
