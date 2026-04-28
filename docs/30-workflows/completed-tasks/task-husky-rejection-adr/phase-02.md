# Phase 02: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 2 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

Phase 1 で確定した要件を基に、ADR-0001 の構成と ADR 集約先ディレクトリを設計する。ADR テンプレート（Context / Decision / Consequences / Alternatives Considered / References）の各セクションに何を書くか、どの派生元から引用するかを設計成果物 (`design.md`) に固定する。

## 実行タスク

- ADR 集約先を一意に確定する（候補: `doc/decisions/` 新設 / `doc/00-getting-started-manual/decisions/` 既存配下）。
- ADR ファイル名を `0001-git-hook-tool-selection.md`（zero-padded 4桁）と決定する。
- ADR 各セクションの記載方針を design.md に整理する。
  - Context: monorepo / pnpm / mise / Cloudflare Workers 環境での hook 運用要件
  - Decision: lefthook 採用の宣言と適用境界（pre-commit / commit-msg / pre-push 等）
  - Consequences: positive（速度・YAML 一元化・並列実行）/ negative（Node 依存・追加バイナリ）
  - Alternatives Considered: husky / pre-commit / native git hooks 各々の不採用理由
  - References: 派生元 workflow outputs / `lefthook.yml` / `doc/00-getting-started-manual/lefthook-operations.md`
- workflow outputs から ADR への backlink 追加箇所（Phase 2 design ADR-01 セクション末尾 / Phase 3 review 第5節末尾）を設計する。

## 参照資料

- Phase 1 成果物（`outputs/phase-1/main.md`）
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md`
- `lefthook.yml`
- `doc/00-getting-started-manual/lefthook-operations.md`

## 依存成果物

- Phase 1: `outputs/phase-1/main.md`

## 実行手順

1. Phase 1 成果物を入力として読み、要件と AC を再確認する。
2. ADR 集約先を一意に確定し、命名規約・番号体系を design.md に明記する。
3. ADR 各セクションに転記すべき派生元テキスト範囲を design.md に列挙する。
4. backlink 追加位置（Phase 2 design / Phase 3 review）を design.md に明記する。
5. design.md と本 Phase main.md を artifacts.json の outputs と一致させる。
6. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: ADR 集約先の選定・命名規約が CLAUDE.md / 既存 `doc/` 構造と衝突しない。
- 漏れなし: Context / Decision / Consequences / Alternatives Considered / References の全セクションに記載方針が割当てられている。
- 整合性あり: 派生元テキストの引用範囲が Phase 3 設計レビューで検証可能な粒度になっている。
- 依存関係整合: Phase 1 の AC-1〜AC-6 を Phase 2 設計が全てカバーしている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| ADR 集約先確定 | completed | outputs/phase-2/design.md |
| ADR ファイル命名規約決定 | completed | outputs/phase-2/design.md |
| 各セクション記載方針整理 | completed | outputs/phase-2/design.md |
| backlink 追加位置設計 | completed | outputs/phase-2/design.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-2/main.md`
- `outputs/phase-2/design.md`

## 統合テスト連携

docs-only / NON_VISUAL のため統合テストは Phase 11 の docs walkthroughで代替する。Phase 2 では設計成果物がリンク整合性検証可能な構造になっていることを保証する。

## 完了条件

- [ ] 設計の成果物が artifacts.json と一致する。
- [ ] ADR 集約先が一意に確定し、命名規約が明記されている。
- [ ] ADR 各セクションの記載方針と派生元テキスト範囲が design.md に列挙されている。
- [ ] backlink 追加位置が設計済みである。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] docs-only / NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 3「設計レビュー」へ Phase 2 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
