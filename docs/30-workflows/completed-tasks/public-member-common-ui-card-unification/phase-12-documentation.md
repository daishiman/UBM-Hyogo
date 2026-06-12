---
spec_classification: implementation_spec
state: spec_created
phase: 12
phase_name: ドキュメント更新
task_id: public-member-common-ui-card-unification
---

# Phase 12: ドキュメント更新

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| workflow_state | `spec_created`（実装未着手。Phase 12 strict 7 は **spec readiness evidence** として作成済み） |
| 成果物格納先 | `outputs/phase-12/`（spec_created 段階から strict 7 を実体配置し、実装後に実測値へ更新） |

> task-specification-creator の Phase 12 仕様では `main.md` + 6補助ファイルの **strict 7** が物理存在することを必須とする。したがって spec_created 段階でも「実装完了を主張しない spec readiness evidence」として 7 ファイルを配置し、実装後の Phase 12 で実測値・system spec sync・検証結果へ更新する。

---


## 目的

実装ガイド（Part1 中学生レベル＋Part2 技術）・システム仕様同期・未タスク検出・skill feedback・compliance check を Phase 12 strict 7 として定義し、spec_created 段階の false PASS を防ぐ。

## Phase 12 strict 7 成果物（spec_created 段階から物理配置）

| # | 成果物 | path | 責務 | spec_created 時 |
|---|--------|------|------|-----------------|
| 1 | main.md | `outputs/phase-12/main.md` | Phase 12 全体サマリ。`spec_created` と実装未着手を明記 | present / spec readiness |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` | Part 1（概念）＋ Part 2（技術）の2部構成。実装後に PR 本文の正本へ更新 | present / planned contract |
| 3 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 同期、09b 追記要否、root/output artifacts parity を記録 | present / spec sync |
| 4 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` | 本タスクで更新した docs / spec の changelog | present |
| 5 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` | current 0 件 / out-of-scope inventory / baseline 非起票理由を分離 | present |
| 6 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への feedback routing | present |
| 7 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 1-13、strict 7、AC trace、4条件の compliance 確認（Gate-A evidence） | present |

---

## implementation-guide.md の構成要件（2部構成）

### Part 1 — 概念（中学生にもわかる例え話）

- 共通レイアウト層を「**家を建てる時の共通の設計図**」に例える。
  - PageShell =「家の土地と外壁（背景・敷地の広さ・部屋の間隔）」
  - PageHeader =「玄関の表札（見出し・案内文・操作ボタン置き場）」
  - SectionCard / ContentCard =「**全ての情報を、それぞれ専用の箱（カード）にしまう**」棚
  - Prose =「長い文章をきれいに読ませる組版ルール（本のページ割り）」
  - ButtonLink =「どのページでも同じ形・同じ色のボタン（押すところを1種類に揃える）」
- なぜ統一するか:「次に模様替え（デザイン改善）する時、**箱の設計図1枚を直せば全部屋が一斉に変わる**」というメリットを、改善コストの圧縮として平易に説明する。

### Part 2 — 技術詳細

- 新設プリミティブ6種の **props 型シグネチャ**（PageShell/PageHeader/SectionCard/ContentCard/Prose/ButtonLink、Phase 2 §プリミティブ設計を正本）。
- **data 属性**一覧（`data-component` / `data-max-width` / `data-bg` / `data-gap` / `data-tone` / `data-padding` / `data-interactive` / `data-variant` / `data-size`）と CSS 解決（Phase 2 §CSS 入出力表）。
- 新設 **CSS クラス**（`.ui-page-shell` / `.ui-page-header` / `.ui-section-card` / `.ui-content-card` / `.ui-prose` / `.ui-button-link`）と globals.css への組み込み方式。
- 8画面の移行 before/after（カード化マッピング表の trace）と機械可読 ID 保全（I-7）の担保方法。

---

## system-spec 更新候補の判定

| 候補 spec | 判定軸 | 実装後に判定する内容 |
|-----------|--------|---------------------|
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | 新規 layout プリミティブ層は**新しい公開インターフェース（PageShell 等の props / `.ui-*` クラス）の追加**に該当しうる | layout プリミティブ層（背景・最大幅・縦リズム・カード枠・本文タイポの正本）を design-tokens spec に追記すべきか判定。トークンを束ねる「組み立ての正本」として layout 層の存在と data 属性 → トークン解決表を追記する方向で評価する |

> 09b-design-tokens.md はトークンの正本ドキュメント。新層はトークンを**新規に増やすのではなく束ねる**位置づけ（I-4）だが、`.ui-page-shell` 等の data 属性 → トークン解決マッピングは新インターフェースであり、追記の要否を `system-spec-update-summary.md` で確定する。

---

## 未タスク候補（current / out-of-scope / baseline 分離）

| 区分 | 候補 | 記録先 | 扱い |
|------|------|--------|------|
| current | なし | `unassigned-task-detection.md` | 本サイクル対象8画面の共通化・カード化・ButtonLink 統一・Prose 統一は AC と Phase 5/6/9/10 に含め、未タスク化しない |
| out-of-scope inventory | **admin（`/(admin)/**`）への共通レイアウト層適用** | `unassigned-task-detection.md` | 一般ユーザー非対象かつ別 information architecture。今回の要件「一般ユーザーが見れる画面・ログインした一般ユーザーが見れる画面」の外側であり、今回の未修正改善点として扱わない |
| baseline non-issue | 対象外 feature クラスの全面整理 | `unassigned-task-detection.md` | Phase 8 は対象8画面から到達する旧 feature クラスだけを削減。非対象クラス全面整理は本タスクの価値を増やさず、YAGNI として非起票 |

> LegalProse の Prose 縮退は AC-6 / Phase 5 / Phase 6 / Phase 10 に含めるため baseline へ逃がさない。BLOCKER を MINOR に格下げして未タスク化することは禁止。

---

## 実行タスク（spec_created で実施済み / 実装後に更新）

1. strict 7 を `outputs/phase-12/` に物理配置する（spec_created 段階の完了）。
2. implementation-guide.md を Part 1（概念）＋ Part 2（技術）の2部構成で作成する（spec_created では planned contract、実装後に実測値へ更新）。
3. 09b-design-tokens.md への layout プリミティブ層追記の要否を `system-spec-update-summary.md` に記録する。
4. `unassigned-task-detection.md` に current 0 件 / out-of-scope inventory / baseline non-issue を分離して記録する。
5. `documentation-changelog.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` / `main.md` を作成する。
6. `pnpm verify:phase12-compliance` / `pnpm gate-metadata:validate --require-gates-for-changed ...` が PASS することを確認する。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 / 状態語彙 / Task 1-6 の正本 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md` | strict 7 配置・root/output parity の正本 |
| トークン spec | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | 更新候補の判定対象 |
| Phase 2 設計 | `phase-2-design.md` | implementation-guide Part 2 の正本 |
| Phase 1 スコープ外 | `phase-1-requirements.md` §スコープ境界 | 未タスク baseline の根拠 |

---


## 成果物

- `phase-12-documentation.md`
- `outputs/phase-12/` strict 7（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md）

## 完了条件

- [x] strict 7 の責務と作成要件（特に implementation-guide の2部構成）が定義されている。
- [x] system-spec 更新候補（09b-design-tokens.md）の判定方針が記録されている。
- [x] 未タスク候補が current / out-of-scope / baseline non-issue に分離されている。
- [x] spec_created 段階でも strict 7 が物理配置され、実装完了を主張しないことが明記されている。
