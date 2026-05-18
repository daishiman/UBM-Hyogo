# Phase 12: ドキュメント / 実装ガイド / システム仕様同期

## Part 1: 中学生レベル概念説明（Why this works）

### 「なぜ Vitest が起動しなかったの？」

パソコンの中には「いま動いているプログラム用の小さな道具箱」がたくさんあります。esbuild という道具は、「**入口の窓口（host）**」と「**実際に手を動かす職人（binary）**」が**ペアで同じバージョン**じゃないと動きません。

ところが、このプロジェクトでは:

- 入口の窓口は **新しいバージョン (0.27.3)**
- 実際の職人は、**親フォルダから古いの (0.25.4) が呼ばれていた**

しかも、職人は「**arm64 用**」と「**x64 用**」の 2 種類がいて、いまの Mac は本当は arm64 で動くべきなのに、Rosetta 2 という変換器のせいで「**x64 用の職人を呼ぶよう**」窓口が指示していました。worktree（作業用フォルダ）の中に x64 用の職人がいなかったので、**親フォルダまで遡って古い職人を捕まえてしまった**のです。

### 「どう直すの？」

3 つのチェック係（verify scripts）を雇います:

1. **arch チェック係**: 「いまの Node は arm64 で動いてる？」を確認
2. **isolation チェック係**: 「呼ぶ職人はちゃんと自分の worktree の中にいる？」を確認
3. **version チェック係**: 「窓口・職人・名簿（pnpm-lock.yaml）の 3 つでバージョンが揃ってる？」を確認

このチェック係を **git push の直前（lefthook）** と **PR を出したとき（GitHub Actions）** に立たせて、ズレてたら止めます。これで二度と同じ事故が起きません。

### 専門用語セルフチェック

| 専門用語 | 日常語への言い換え |
| --- | --- |
| Vitest | プログラム用の小テスト係 |
| esbuild host | 道具を呼び出す入口の窓口 |
| binary | 実際に手を動かす職人 |
| worktree | 同じ家から分けた作業部屋 |
| node_modules | 道具箱置き場 |
| Rosetta 2 | 別の種類の機械向けに動かす変換器 |

## Part 2: 技術者レベル実装ガイド

### Section A. 実装サマリ

- 3 新規 `scripts/verify-*.mjs` を追加（Node 24 + ESM、外部依存なし）
- `package.json` scripts に verify 4 entry と focused Vitest 2 entry を追加し、CI strict pnpm 解決用に root `esbuild@0.27.3` devDependency を固定
- `pnpm-lock.yaml` root importer を更新
- `lefthook.yml` pre-push に gate 追加
- `.github/workflows/verify-esbuild.yml` を `ubuntu-latest` + `macos-14` matrix で追加
- `.mise.toml` に postinstall hook 追加
- runbook を `docs/30-workflows/issue-747-.../runbook.md` に追加
- 旧仕様書 `unassigned-task/parallel-09-followup-002-...md` を `status: consumed` 化

### Section B. システム仕様書同期

- `CLAUDE.md` § よく使うコマンド付近に runbook 参照 1 行を追加
- `aiworkflow-requirements` skill の workflow inventory / quick reference / resource map / active guide / artifact inventory に same-wave sync 済み

### Section C. ドキュメント更新履歴

`docs/30-workflows/issue-747-.../outputs/phase-12/documentation-changelog.md` に:

- 新規 workflow root / scripts / CI / inventory の一覧
- 旧仕様書 frontmatter と本文 status mutation
- CLAUDE.md 1 行追記

を記録する。

### Section D. 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md` に **0 件** を明示。
理由: 残作業はこの active root の runtime blocker として管理し、別 backlog に逃がさない。`pnpm verify:node-arch` の x64 fail は arm64 Node 再 install で解放する環境ブロッカーであり、別タスク化しない。

### Section E. スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` に以下 3 観点で記述:

1. **テンプレ改善**: closed Issue でも真因が当時仕様書から乖離していた場合、後付け canonical workflow を `Refs #<n>` で作る pattern を `references/closed-issue-canonical-workflow-recovery.md` の適用例として補強する
2. **ワークフロー改善**: worktree 開発で **親リポジトリ `node_modules` 漏れ込み**が再現性ある failure mode であることを `references/patterns-troubleshooting-worktree-cloudflare.md` に追記候補として登録
3. **ドキュメント改善**: runbook の escalation 1〜5 を `references/patterns-testing.md`（または近接 reference）に再利用可能 pattern として横展開

### Section F. Compliance Check

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下チェック:

- Required Sections 9 項目（heading SSOT）
- placeholder token 0 件 grep
- dirty apps/ packages/ diff 検出（本タスクは apps/web/src spec を変更しないため期待 0）
- `it.skip` / `test.skip` count 0 件 grep

## Phase 12 strict 7 成果物

Phase 12 は 6 必須タスクに加えて、本体 `main.md` を含む **strict 7 files** を逐語ファイル名で生成する。

1. `outputs/phase-12/main.md`
2. `outputs/phase-12/implementation-guide.md`
3. `outputs/phase-12/system-spec-update-summary.md`
4. `outputs/phase-12/documentation-changelog.md`
5. `outputs/phase-12/unassigned-task-detection.md`
6. `outputs/phase-12/skill-feedback-report.md`
7. `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件（Phase 12）

- 6 必須タスク（impl-guide / system-spec / changelog / unassigned-detection / skill-feedback / compliance-check）と `main.md` の合計 7 output ファイルが揃う
- documentation-changelog.md に新規 / 更新ファイルの実体が列挙される
- root `package.json` / `pnpm-lock.yaml` により `esbuild` が direct devDependency として解決できる
