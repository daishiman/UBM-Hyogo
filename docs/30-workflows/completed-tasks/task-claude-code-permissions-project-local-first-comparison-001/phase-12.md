# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 11 |
| 下流 | Phase 13 (PR 作成) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |
| Issue | #142（CLOSED のまま運用） |

## 目的

Phase 11 までの成果物を SKILL.md 規定の Phase 12 canonical 5 タスクと、本タスク固有の compliance check にまとめ、aiworkflow 正本仕様（`.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`）との同期要否を確定する。本タスクは spec_only のため、実 `~/.claude/settings.json` / `~/.zshrc` の書き換えは行わないが、仕様同期は Phase 12 成果物として扱う。

## 必須成果物（SKILL.md Phase 12 重要仕様準拠）

| Task | 成果物 | 必須 |
| --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 中学生レベル + Part 2 開発者レベル） | ✅ |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md`（Step 1-A〜1-C + Step 2） | ✅ |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**） | ✅ |
| 12-5 | `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須**） | ✅ |
| 補遺 | `outputs/phase-12/phase12-task-spec-compliance-check.md`（4条件の自己検証） | ✅ |

加えて Phase 12 入口として `outputs/phase-12/main.md`（成果物 index）を必ず置く。

## Task 12-1: 実装ガイド（2 パート構成）

### Part 1（中学生レベル / 日常例）

例え話: **「家・部屋・引き出し」の優先順位**

> Claude Code の設定は 4 段の入れ子になっています。
>
> - **家のルール**（`~/.claude/settings.json`）= 家全体に効く一番外側のルール
> - **家の自分メモ**（`~/.claude/settings.local.json`）= 家のルールより優先される自分専用メモ
> - **部屋のルール**（`<project>/.claude/settings.json`）= その部屋（プロジェクト）に入っているときだけ効くルール
> - **部屋の引き出しメモ**（`<project>/.claude/settings.local.json`）= 一番奥の引き出しに入った私物メモで、すべての中で最優先
>
> 同じ項目が複数のメモに書いてあったら、**引き出し（一番内側）を優先**する。家のルールを書き換えると全部屋に影響するけれど、引き出しメモなら自分のその部屋だけで済む。

なぜ必要か:
- 「全部屋（global）」を書き換えると、関係ない部屋（他プロジェクト）でも勝手に確認スキップになる
- 「引き出しだけ（project.local）」だと新しい部屋に引っ越したとき毎回書き直しが要る
- どこまで波及してよいかを最初に決めないと、あとで rollback が面倒になる

何をするか（本タスクの範囲）:
- 4 段の優先順位とそれぞれの責務を 1 表にする
- 「引き出しだけで再発防止できるか」を確認する
- 「全部屋」「引き出しだけ」「両方使うハイブリッド」の 3 案を比較する
- どれを採用するかを 1 つ決め、次の実装タスクに引き継ぐ

### Part 2（開発者レベル）

- 階層優先順位（最終値はより内側が勝つ）:
  ```
  <project>/.claude/settings.local.json
    > <project>/.claude/settings.json
    > ~/.claude/settings.local.json
    > ~/.claude/settings.json
  ```
- 評価対象キー: `defaultMode`, `permissions.allow`, `permissions.deny`
- 比較対象案:
  - 案 A: `~/.claude/settings.json` の `defaultMode` を `bypassPermissions` に変更し、`cc` alias に `--dangerously-skip-permissions` を追加（global + shell 全体）
  - 案 B: `<project>/.claude/settings.local.json` のみで bypass を維持（影響半径は当該プロジェクトに限定）
  - ハイブリッド: 案 B を default、案 A を fallback
- 他プロジェクト副作用観点: `scripts/cf.sh` 経由 Cloudflare CLI 運用、1Password `op run` 注入経路、別 worktree の権限評価
- rollback 手順（global 採用時）: 比較表別ブロックに記載済み内容へリンク
- 視覚証跡: **NON_VISUAL** のため Phase 11 スクリーンショット不要。代替証跡は `outputs/phase-11/manual-smoke-log.md` と `outputs/phase-10/final-review-result.md`
- 実装ハンドオフ先: `task-claude-code-permissions-apply-001`（本ドキュメントを参照欄に追記依頼）

## Task 12-2: システム仕様更新サマリ（`system-spec-update-summary.md`）

### Step 1-A: タスク完了記録

- 「完了タスク」セクションへ本タスク行を追加
- LOGS.md × 2（aiworkflow-requirements / task-specification-creator）への記録要否を判定し、該当なしの場合も理由を記録
- topic-map.md / generated index の同期要否を判定し、該当なしの場合も理由を記録
- close-out ルール: 本タスクは `workflow: spec_created`（実装は別タスク）。Issue #142 は CLOSED 維持

### Step 1-B: 実装状況テーブル

- 本タスクのステータス: `spec_created`（`completed` ではない）
- 実装担当: `task-claude-code-permissions-apply-001`
- 並行参照: `task-claude-code-permissions-deny-bypass-verification-001`

### Step 1-C: 関連タスクテーブル

- `task-claude-code-permissions-decisive-mode`（前提・参照）
- `task-claude-code-permissions-apply-001`（実装ハンドオフ先）
- `task-claude-code-permissions-deny-bypass-verification-001`（deny 実効性検証）

### Step 2: システム仕様更新（条件付き判定）

- 対象: `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`
- 同期内容: settings 4 層階層優先順位、採用案（A / B / ハイブリッドの結論）、`scripts/cf.sh` / `op run` への副作用注意、global 採用時の rollback 手順リンク
- 判定: 運用ルールの比較設計を正本仕様へ同期する対象。実 settings / shell alias の書き換えは apply タスクで実施

## Task 12-3: documentation-changelog

- Step 1-A / 1-B / 1-C / Step 2 の各結果を個別ブロックで記録（該当なしも明記）
- workflow-local 同期と global skill sync を別ブロックで記録（[Feedback BEFORE-QUIT-003]）
- ソース MD の `completed-tasks/` 配下と本ディレクトリの mirror parity 状態を記録

## Task 12-4: 未タスク検出（**0 件でも出力必須**）

候補（ソース MD §3.2 / §7 / §9 由来）:

| 候補 | 出典 | 状態 |
| --- | --- | --- |
| 実 settings / `~/.zshrc` 書き換え（apply） | 本タスク §2.3 / §9 補足 | 既存 `task-claude-code-permissions-apply-001` に統合 |
| `--dangerously-skip-permissions` の deny 実効性検証 | §7 リスク・§3.2 並行 | 既存 `task-claude-code-permissions-deny-bypass-verification-001` に統合 |
| `scripts/new-worktree.sh` への `.claude/settings.local.json` テンプレート組込み | §7 対策 | 未タスク化候補（apply 採用案次第で要否確定） |
| MCP server / hook の permission 挙動検証 | §2.3 含まないもの | 未タスク化候補 |

関連タスク差分確認: 既存タスクと重複する場合は統合先 ID を記録。0 件の場合も「該当なし」と明記して出力する。

## Task 12-5: skill-feedback-report（**改善点なしでも出力必須**）

観点（改善点が無い場合も「none」と記載して出力）:
- テンプレート改善: 「比較設計タスク」専用に「他プロジェクト副作用」軸を必須化する案
- ワークフロー改善: NON_VISUAL + spec_only タスクでは Phase 6〜8 の軽量化を検討
- ドキュメント改善: 4 層階層優先順位を `references/` に切り出し再利用可能化

## Task 12-6: phase12-task-spec-compliance-check

- `index.md` Phase 表 / `artifacts.json` / outputs 実体の三者同期確認
- `outputs/phase-12/` に Phase 12 成果物 + `main.md` が揃っているかの ls 突合
- identifier consistency check（タスク ID / `defaultMode` / `bypassPermissions` / `--dangerously-skip-permissions` / `scripts/cf.sh` / `op run` の表記揺れなし）
- ソース MD §8 参照情報の全リンクが本タスク内 outputs から解決可能

## よくある漏れチェック（本タスク特有）

- [ ] **[Feedback 5]** index.md / artifacts.json / outputs 実体の同一 wave 更新
- [ ] **[FB-04]** ledger 同期 5 ファイル
- [ ] documentation-changelog.md が全 Step を「該当なし」も含めて明記
- [ ] LOGS.md × 2 ファイル更新（該当時）
- [ ] NON_VISUAL 判定で `screenshots/` 自体作らない（`.gitkeep` も置かない）
- [ ] Issue #142 を CLOSED のまま運用する旨が記録されている
- [ ] `task-claude-code-permissions-apply-001` の参照欄追記依頼が unassigned-task-detection.md または documentation-changelog.md に記録

## 主成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

> 注: 本 Phase 仕様書の役割は上記 7 ファイルの宣言と要件定義である。実体ファイルは Phase 12 実行時に生成する。

## 完了条件

- [ ] skill 準拠の完了条件を満たす
- [ ] Phase 12 成果物 + `main.md` が揃う
- [ ] artifacts.json の outputs 配列と実体ファイルが同期
- [ ] Issue #142 は CLOSED 維持で運用される旨が明記
- [ ] Phase 13 はユーザー承認待ちで blocked

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする
- docs-only / spec_only の境界を維持する（実 settings / shell alias の書き換えは禁止）

## 参照資料

- ソース MD: `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md`
- Phase 1〜11: `outputs/phase-1/` 〜 `outputs/phase-11/`
- Phase 1: `outputs/phase-1/`
- Phase 2: `outputs/phase-2/`
- Phase 5: `outputs/phase-5/`
- Phase 6: `outputs/phase-6/`
- Phase 7: `outputs/phase-7/`
- Phase 8: `outputs/phase-8/`
- Phase 9: `outputs/phase-9/`
- Phase 10: `outputs/phase-10/`
- Phase 11: `outputs/phase-11/`
- `.claude/skills/task-specification-creator/SKILL.md`（Phase 12 重要仕様）
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`（Step 2 同期対象）
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする
