# Skill feedback report

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

仕様書作成サイクルで判明した skill（aiworkflow-requirements / task-specification-creator）への feedback 候補。改善点が無くても 3 観点（テンプレート改善 / ワークフロー改善 / ドキュメント改善）で必ず出力する。

## 確認済み skill 規約（本仕様書で適用したもの）

- Phase 1-13 の outputs ディレクトリ構造
- Phase 12 strict 7 outputs を workflow root に集約
- Phase 12 canonical 9 headings（`phase12-task-spec-compliance-check.md`・順序厳守）
- Phase 11 evidence file inventory 表（`| Classification | Path | Status |` 3 列・status は present / pending / n/a の lowercase）
- 状態語彙: `spec_created` → `implemented_local_evidence_captured` → `implemented_local_visual_evidence_captured` → `implementation_completed`
- `*.spec.{ts,tsx}` 命名規約（CLAUDE.md 不変条件 #8）
- CONST_004（実装区分明記）/ CONST_005（実装仕様書 5 必須項目）/ CONST_007（1 サイクル完了スコープ + 例外条件）
- VISUAL_ON_EXECUTION 規範: screenshot は staging・user-gated（Phase 13）
- existing-route-alignment 実装モード（新規 API endpoint / schema 変更を含まない）

## 観点 1 — テンプレート改善

| ID | 内容 | 反映先候補 |
|----|------|------------|
| L-AMCUX-001 | **未定義 BEM クラス（マークアップにあるが CSS 実体なし）の検出は、grep で定義ファイル自身のヒットを「参照」と誤カウントしやすい**。`grep -rn '.admin-timeline' apps/web` は globals.css の **定義行**も拾うため、「CSS 実体あり」と誤判定する。正しくは定義ファイル（`*.css`）を除外して **参照（`.tsx` の className）を数える**＝`grep -rn 'admin-timeline' apps/web/src --include='*.tsx'` と `grep -n 'admin-timeline' apps/web/src/styles/globals.css` を分離し、参照あり・定義なしの組み合わせで「実体化漏れ」を確定する。dead CSS の逆（参照あり定義なし）も同じ罠。 | task-specification-creator `references/patterns-lessons-and-pitfalls.md`（CSS 実体化漏れ検出の grep パターン） |
| L-AMCUX-002 | jsdom は CSS / @media を評価しないため、表現層 CSS タスクの vitest は **構造（クラス付与 / 見出しテキスト / 人数 / role）のみ**を assert し、視覚（色 / 影 / 余白 px）は staging screenshot に委譲する、という分離を Phase 9/11 で明示すると compliance がぶれない。 | task-specification-creator phase-template-phase9 / phase11（jsdom 制約と screenshot 委譲の分離） |

## 観点 2 — ワークフロー改善

| ID | 内容 | 反映先候補 |
|----|------|------------|
| L-AMCUX-003 | 「既存マークアップにある BEM クラスの CSS 実体化」を主、「汎用 primitive 新設」を従とする表現層タスクは、`invariant #3（primitive を増やしすぎない）`との整合を Phase 2 で明示すると、新設 primitive の最小性レビューが容易になる。本タスクは新設 2 系統（`.admin-detail-section*` / `.admin-attendee-row*`）に限定。 | task-specification-creator patterns-lessons（primitive 最小新設の判断軸） |
| L-AMCUX-004 | data-testid 不変を AC 化する場合、`git diff dev -- <dir> | grep '^-' | grep 'data-testid'` の **削除行 0 件**を機械検証コマンドとして DoD に入れると、contract 破壊を CI 前に検出できる。 | task-specification-creator phase-template-phase9（contract 保持 grep gate） |

## 観点 3 — ドキュメント改善

| ID | 内容 | 反映先候補 |
|----|------|------------|
| L-AMCUX-005 | implementation-guide の Part 1（中学生レベル）で CSS 改修を「掲示板の紙のすき間」「お皿への盛りつけ」に例えると、非エンジニアのユーザーが「データは無罪・見た目だけ直す」を直感的に理解できる。表現層タスクの Part 1 定番アナロジーとして再利用可能。 | task-specification-creator phase-template-phase12（Part 1 アナロジー集） |
| L-AMCUX-006 | system-spec-update-summary で Step 2（新規 I/F）が N/A になる表現層タスクは、「CSS クラスは公開 API インターフェースではない」を明記しないと compliance reviewer が誤って I/F 追加扱いしうる。N/A 根拠を 1 行で固定する。 | task-specification-creator phase-template-phase12（Step 2 N/A 根拠の定型文） |

## skill 規約への小修正提案

- （なし — 既存 skill 規約のみで本仕様書を完成できた。）

## 反映プロセス

実装サイクル内で以下に反映済み:

- `.claude/skills/aiworkflow-requirements/references/workflow-admin-meetings-card-ux-clarity-artifact-inventory.md` の `## Lessons Learned` 節（L-AMCUX-001 / 003 / 005）
- `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` 末尾（汎化可能な L-AMCUX-001 / 002 / 004 / 006）
- `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` 末尾（dated entry）
