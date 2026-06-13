---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 12
phase_name: ドキュメント同期
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 12: ドキュメント同期

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 元 Issue | #1192（**CLOSED のまま維持**・本ワークフローが canonical な実装仕様） |
| workflow_state | `implemented_local_evidence_captured`（実装済み。Phase 12 strict 7 は **local implementation evidence** として作成済み） |
| taskType / visualEvidence | `implementation` / `VISUAL` |
| 成果物格納先 | `outputs/phase-12/`（strict 7 を実体配置し、実装サイクルの実測値へ更新済み） |

> task-specification-creator の Phase 12 仕様では `main.md` + 6 補助ファイルの **strict 7** が物理存在することを必須とする。したがって implemented_local_evidence_captured 段階では「local implementation evidence」として 7 ファイルを配置し、実測値・system spec 同期判定・検証結果まで更新する。

---

## 目的

実装ガイド（Part 1 中学生レベル概念 + Part 2 技術契約）・システム正本仕様の同期判定・未タスク検出・skill feedback・compliance check を Phase 12 strict 7 として定義し、実装済みの local evidence と user-gated 残存項目を分離する。

## Phase 12 strict 7 成果物（implemented_local_evidence_captured 段階から物理配置）

| # | 成果物 | path | 責務 | 状態 |
|---|--------|------|------|-----------------|
| 1 | main.md | `outputs/phase-12/main.md` | Phase 12 全体サマリ。実装済み local evidence・後続 user-gated アクションを明記 | present / implementation evidence |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` | Part 1（概念・例え話）+ Part 2（技術契約）の 2 部構成。後続確認者がこの 1 ファイルで実装内容を把握できる正本。 | present / implemented contract |
| 3 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` | システム正本仕様（`specs/02-auth.md` 等）の更新要否判定と、aiworkflow-requirements 同期計画を記録 | present / 判定 = 更新不要 |
| 4 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` | 本仕様書作成で追加した docs の一覧と、変更していない正本 docs の明記 | present |
| 5 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` | current 0 件 / スコープ外検討痕跡 / CONST_007 分離 0 件を分離記録 | present |
| 6 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator への feedback と反映結果を記録 | present |
| 7 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 構成・strict 7・AC trace・4 条件の compliance 確認（Gate-A evidence）。**別担当が作成** | present（別担当） |

---

## implementation-guide.md の構成要件（2 部構成）

### Part 1 — 概念（中学生にもわかる例え話）

- `/profile` を「会員のマイページ = 自分の部屋」、`/admin` を「管理人室」に例える。
- 本タスクは「**マイページに管理人さん専用の入口案内板を 1 枚足す**」だけの変更であることを平易に説明する。
- 重要な原則: 「**入口で身分確認をやり直さない**」— 受付（API = `/me`）が済ませた名札（`isAdmin`）を読むだけで、web 側で管理者かどうかを判定し直さない。

### Part 2 — 技術契約

- 変更 4 ファイル（新規 `AdminAccessNotice.tsx` / 同 `.spec.tsx`・編集 `page.tsx` / `page.spec.tsx`）。
- Phase 2 D-1 のコンポーネントコード例・D-2 の組み込み位置・D-3 の文言を**逐語**で取り込む。
- DOM 契約: `SectionCard(title="管理者メニュー", tone="accent", data-testid="profile-admin-access-notice", aria-label="管理者向けのご案内")` + 本文 + `ButtonLink(href="/admin", variant="secondary", size="md")`「管理画面を開く」。
- 確定テスト 6 件（T-C1/T-C2/T-C3 + T-P1/T-P2/T-P3）と検証コマンド正本・DoD。
- AC-1〜AC-9 の表（Phase 1 逐語）。
- やってはいけないこと（web への認証判定持込・memberId 露出・新規 CSS/primitive・apps/api 接触）。

---

## 実装サイクルで行った同期

| 同期項目 | 内容 | タイミング |
|---------|------|-----------|
| aiworkflow-requirements への workflow 登録 | `task-workflow-active.md` / `indexes/` / artifact-inventory への登録 | 実施済み |
| system spec 同期判定 | `system-spec-update-summary.md` の判定（本タスクは**更新不要**）を実装後の実差分で再確認 | 実施済み |
| skill feedback 反映 | Issue #1192 で得た Phase 1 前提確定ルールを task-specification-creator へ反映 | 実施済み |
| strict 7 の実測値更新 | 各ファイルの planned / pending 表現を実測結果（テスト件数・検証コマンド exit code 等）へ更新 | 実施済み |

---

## 未タスク候補（current / スコープ外の分離）

| 区分 | 候補 | 記録先 | 扱い |
|------|------|--------|------|
| current | なし（0 件） | `unassigned-task-detection.md` | AC-1〜AC-9 と変更 4 ファイルが本サイクルで完結。未タスク化しない |
| スコープ外（検討痕跡） | session 有効 + D1 drift 時の 401 → `/login` 挙動 | `unassigned-task-detection.md` | 全 member 共通の既存挙動で管理者固有課題ではない（Phase 1 §スコープ外）。未タスク化もしない |
| CONST_007 例外分離 | なし（0 件） | `unassigned-task-detection.md` | 単一サイクル・単一 PR で完了するスコープ |

---

## 実行タスク（実施済み）

1. strict 7 を `outputs/phase-12/` に物理配置する（implemented_local_evidence_captured 段階の完了・compliance-check は別担当）。
2. implementation-guide.md を Part 1（概念）+ Part 2（技術契約）の 2 部構成で作成し、実装後の実測値へ更新する。
3. system spec（`02-auth.md` 等）の更新不要判定を `system-spec-update-summary.md` に記録する。
4. `unassigned-task-detection.md` に current 0 件 / スコープ外検討痕跡 / CONST_007 分離 0 件を分離して記録する。
5. `documentation-changelog.md` / `skill-feedback-report.md` / `main.md` を作成する。
6. `pnpm verify:phase12-compliance` / `pnpm gate-metadata:validate` の PASS を確認し、aiworkflow-requirements 登録を同 wave で行う。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 / 状態語彙の正本 |
| Phase 1 要件 | `phase-1-requirements.md` | AC-1〜AC-9・スコープ外の正本 |
| Phase 2 設計 | `phase-2-design.md` | implementation-guide Part 2 のコード例・DOM 契約の正本 |
| 認証設計正本 | `docs/00-getting-started-manual/specs/02-auth.md` | system spec 更新不要判定の対象 |

---

## 成果物

- `phase-12-documentation.md`（本ファイル）
- `outputs/phase-12/` strict 7（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md ※最後は別担当）

## 完了条件

- [x] strict 7 の責務と作成要件（特に implementation-guide の 2 部構成）が定義されている。
- [x] system spec 更新候補の判定方針（更新不要の根拠）が記録されている。
- [x] 未タスク候補が current 0 件 / スコープ外検討痕跡 / CONST_007 分離 0 件に分離されている。
- [x] implemented_local_evidence_captured 段階で strict 7 が物理配置され、local implementation evidence と user-gated 残存項目が分離されている。
- [x] aiworkflow 登録・system spec 再判定・skill feedback 反映・実測値更新が完了している。
