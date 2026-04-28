# Phase 3: 設計レビュー詳細 — task-worktree-environment-isolation

レビュー対象: `outputs/phase-2/design.md`

---

## 1. 受け入れ条件との対応チェック

| AC | 設計セクション | 検証手段 | 判定 | コメント |
| --- | --- | --- | --- | --- |
| AC-1 skill symlink 撤去方針 | §1 | EV-1 (`find -type l \| wc -l = 0`) | OK | インベントリ取得 → 撤去 → 検証の三段で具体化済み。Rollback も明記 |
| AC-2 tmux session-scoped state | §2 | EV-2, EV-3 | OK | global / session の差分を出力で検証可能。`update-environment` の最小化が肝 |
| AC-3 gwt-auto lock | §3, §5 | EV-4, EV-5 | 条件付 OK | macOS の `flock(1)` 不在問題は §3.5 で言及済みだが最終選択は Phase 5 |
| AC-4 NON_VISUAL evidence | §6 | EV-1〜EV-7 | OK | コマンド列・期待値が表形式で再現可能 |

判定: 4 項目すべて対応あり。AC-3 のみ実装系で最終確定が必要。

---

## 2. aiworkflow-requirements 仕様との整合

参照: `.claude/skills/aiworkflow-requirements/SKILL.md`、`references/resource-map*.md`

| 観点 | 確認結果 |
| --- | --- |
| 出力フォーマットの規約 | `outputs/phase-N/main.md` + 補助ファイルの構成は task-specification-creator の規範と一致 |
| Progressive Disclosure | 本タスクは docs-only / NON_VISUAL なので、quick-reference 上の必読項目は最小（worktree / shell / tmux 周りの operational doc）。設計内で過剰参照なし |
| ユビキタス言語 | 「worktree」「session-scoped」「lock」「symlink」など resource-map で用いられる用語と一致 |

設計内の用語・出力構造に違反は検出されない。

---

## 3. CLAUDE.md 重要不変条件との衝突有無

| 不変条件 | 衝突有無 | 根拠 |
| --- | --- | --- |
| 1. 実フォームの schema をコードに固定しすぎない | なし | フォーム関連の変更を含まない |
| 2. consent キーは `publicConsent` / `rulesConsent` 統一 | なし | フォーム関連無関係 |
| 3. `responseEmail` は system field | なし | 同上 |
| 4. Google Form schema 外データは admin-managed として分離 | なし | 同上 |
| 5. D1 への直接アクセスは `apps/api` に閉じる | なし | 設計サンプルに D1 直接アクセスを含めていない |
| 6. GAS prototype を本番昇格させない | なし | GAS 参照なし |
| 7. MVP では Google Form 再回答が本人更新の正式経路 | なし | 認証・本人更新の議論なし |
| 8（運用）. `wrangler` 直接実行禁止 | なし | docs サンプルに `wrangler` 単体呼び出しなし |
| 9（運用）. 平文 `.env` をコミット・読み取りしない | なし | lock メタ情報に secret を含めない設計（§3.2）|
| 10（運用）. ユーザー承認なしの commit / push / PR 作成禁止 | なし | 本タスクは docs-only、Phase 13 まで pending |

衝突は検出されない。

---

## 4. 横断依存タスクとの整合性

`artifacts.json.cross_task_order` 順:

1. `task-conflict-prevention-skill-state-redesign`（依存元・完了前提）
2. `task-git-hooks-lefthook-and-post-merge`
3. **`task-worktree-environment-isolation`（本タスク）**
4. `task-github-governance-branch-protection`
5. `task-claude-code-permissions-decisive-mode`

| 隣接タスク | 整合性 | 申し送り |
| --- | --- | --- |
| skill-state-redesign（上位） | 本タスクは「skill 側 state」ではなく「worktree 側 symlink」を扱うため責務分離 OK | skill 内部 state の持ち方は上位タスクで完結している前提 |
| lefthook-and-post-merge（前段） | symlink 検出 hook を本タスクから委譲する旨を §7 リスク表に記載済み | 「pre-commit で `find .claude/skills -type l` を検出する」案を正式申し送りとする |
| branch-protection（後段） | lock の意味論は branch protection と独立。worktree-local な排他 | 影響なし |
| permissions-decisive-mode（後段） | shell の `OP_*` トークン unset 推奨は permissions 設計と関係するが副次的 | §4.2 の `unset` ガイダンスは permissions タスク側で正式化される可能性あり |

責務境界に重大な衝突なし。

---

## 5. 検出した懸念点・追加で詰めるべき事項

| ID | 懸念 | 対応案 |
| --- | --- | --- |
| C-1 | macOS 標準に `flock(1)` がない。Homebrew 依存にするか mkdir フォールバックを正本にするか未確定 | Phase 5 ランブックで確定。デフォルト推奨は mkdir 方式（依存ゼロ）、flock は opt-in |
| C-2 | `.worktrees/.locks/` の `.gitignore` 状態が未確認 | Phase 5 で `.gitignore` を確認し、必要なら追記 |
| C-3 | 既存 tmux セッションが既に `UBM_WT_*` 以外の env で汚染されている可能性 | Phase 11 で baseline を取り、手動 cleanup 手順を `outputs/phase-11/manual-smoke-log.md` に残す |
| C-4 | 開発者が個別に再導入する skill symlink を継続的に検出する仕組みは本タスクでは構築しない | C-1 と同様、lefthook タスクへ正式申し送り |
| C-5 | `BRANCH_SLUG` の最大 64 文字制限が短すぎる場合（長いブランチ名運用） | Phase 4 テスト設計で境界値テストを追加 |
| C-6 | 既存 worktree 上で本タスクの設計を遡及適用する手順 | Phase 5 で「既存 worktree のクリーンアップ手順」を記載 |

---

## 6. 残課題・次 Phase 申し送り

| 申し送り先 | 内容 |
| --- | --- |
| Phase 4 テスト設計 | §3.5（flock / mkdir）両系統 / 日本語パス / `BRANCH_SLUG` 境界値 / lock メタ情報フォーマット検証 |
| Phase 5 ランブック | C-1 の最終選択（mkdir 方式推奨）、C-2 の `.gitignore` 確認、C-6 の既存 worktree 遡及手順 |
| Phase 6 失敗ケース | lock 競合 / stale lock / hostname 不一致（NFS 想定外）/ flock(1) 不在環境のシナリオ |
| Phase 11 手動テスト | EV-1〜EV-7 + tmux baseline 取得 + skill symlink インベントリ取得 |
| Phase 12 documentation | `CLAUDE.md` の「ワークツリー作成」セクションに lock 仕様への参照リンクを追記する案 |
| 横断: `task-git-hooks-lefthook-and-post-merge` | 「`.claude/skills` 配下の symlink を pre-commit で検出する」を正式申し送り |

---

## 7. レビュー結論

- 設計は受け入れ条件を網羅し、CLAUDE.md 不変条件・上位タスクとの矛盾なし。
- 残懸念 C-1〜C-6 は後続 Phase で吸収可能であり、Phase 2 設計を **条件付き Go** とする。
- Phase 4 へ進行可。
