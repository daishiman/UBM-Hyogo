# Phase 13: PR 作成（user-gated）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 13 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| base ブランチ | `dev`（開発統合ブランチ） |
| 作業ブランチ | `fix/member-profile-google-form-data-reflection` |
| 実行可否 | **blocked**（commit / push / PR・staging mutation・実 screenshot 取得は user 明示承認後のみ。CONST_002・不変条件 #6） |

## 目的

Lane A（qidMap 堅牢化）/ Lane B（fail-silent 検知）/ Lane C（復旧 runbook）の変更を、真因・3 Lane・復旧手順・staging before/after 視覚証跡を含めた PR として `dev` へ作成する計画を確定する。本 phase では PR 本文構成を定義し、**実行（commit / PR）はしない**。

## 実行タスク

> 以下はすべて user 明示承認後のみ実行する。本仕様では計画のみ記述する。

### Task 13-1: PR 本文構成の確定

PR 本文には以下を漏れなく含める:

| 節 | 内容 |
|----|------|
| 真因 | `schema_questions` 空（RC-3）起因の fail-silent。qidMap 空 → 全 answer unmapped → `answers_json={}` + `response_fields` 全 `__extra__:` → 公開詳細全項目空表示 |
| 修正（3 Lane） | A: `deriveStableKey` / `STABLE_KEY_BY_LABEL` named export + `rawFormToStableKeyMap` による schema_questions 非依存 fallback（`{...fromRaw, ...fromSchema}` マージ）／B: response sync の qidMap 空・全 unmapped 検知 + `SYNC_ALERTS` 記録 + サマリー拡張（`qidMapSize` / `fullyUnmappedResponses`）／C: 復旧 runbook（schema sync → 検証 → response sync fullSync → 検証 → 詳細ページ確認） |
| 復旧手順 | Lane C runbook の要約（cf.sh 経由 read-only 診断 + mutation の順序） |
| staging before/after | `outputs/phase-11/screenshots/member-detail-before-recovery.png` / `member-detail-after-recovery.png` を参照（取得済みの場合のみ。pending なら「user-gated capture pending」と明記） |
| 不変条件 | apps/web 非接触（#1）/ migration 非変更（AC-G2）/ cf.sh 経由（#3） |

### Task 13-2: 品質検証（PR 作成前・user 承認後）

PR 作成フローの 4 コマンド（CLAUDE.md「PR作成の完全自律フロー」§5）を実行する:

- `pnpm install --force`
- `pnpm typecheck`
- `pnpm lint`
- `bash scripts/verify-pr-ready.sh`

加えて本タスク固有の validation matrix（phase-2 §5）を確認:

- 表現層非接触: `git diff dev...HEAD --name-only -- apps/web/src` が空
- migration 非変更: `git diff dev...HEAD --name-only -- apps/api/migrations` が空

### Task 13-3: PR 作成

`gh pr create --base dev` で作成する（production リリース時のみ `--base main`。本タスクは `dev`）。

## 残る承認ゲート（blocked 条件）

以下はすべて user 明示指示まで実行しない:

1. staging への mutation 適用（schema sync `POST /admin/sync/schema` / response sync fullSync `POST /admin/sync/responses?fullSync=true`）
2. Phase 11 の authenticated staging runtime screenshot（before / after）取得
3. commit / push / PR（base=dev）作成
4. deploy（staging / production）

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| PR 作成フロー | `CLAUDE.md`「PR作成の完全自律フロー」 | 4 コマンド検証・base=dev |
| PR 本文 Phase 13 仕様 | `.claude/commands/ai/diff-to-pr.md` | 本文体裁 |
| 視覚証跡 | `phase-11.md` / `outputs/phase-11/screenshots/` | before/after 参照 |
| 実装サマリ | `outputs/phase-12/implementation-guide.md` | PR 本文の修正内容 |
| validation matrix | `phase-2.md` §5 | 表現層非接触 / migration 非変更 gate |

## 実行手順

1. （user 承認後）Task 13-2 の品質検証 4 コマンド + validation matrix を実行。
2. （user 承認後）`implementation-guide.md` と本 phase の本文構成に従い PR 本文を作成。
3. （user 承認後）`gh pr create --base dev` で PR 作成。
4. 完了後、PR URL・採用ブランチ・残課題を 1 回だけ報告。

## 統合テスト連携

- PR 作成前に Phase 4-7 の全 test が GREEN であること、Phase 9/10 gate が PASS であることを前提とする。
- staging 復旧（Phase 11）は PR とは独立の運用操作であり、PR マージ後に runbook で実施できる（コード反映と復旧操作の分離）。

## 多角的チェック観点（AIが判断）

- **戦略**: コード修正（再発防止 + 可視化）の PR と、既存壊れデータの復旧（運用操作）を分離する。PR は前者に閉じ、後者は runbook（Lane C）で別途実施。
- **運用性**: staging mutation・screenshot・PR を独立の承認ゲートに分け、誤った自動実行を防ぐ。
- **整合性**: PR 本文の修正内容と implementation-guide / index.md §6 のシグネチャを一致させる。

## サブタスク管理

| ID | 内容 | 状態 |
|----|------|------|
| P13-1 | PR 本文構成確定 | 計画確定 |
| P13-2 | 品質検証コマンド定義 | 計画確定（実行 user-gated） |
| P13-3 | PR 作成 | blocked（user-gated） |

## 成果物

- PR（base=dev）※ user 明示承認後のみ作成。本 phase では作成しない。
- 本 phase の成果物は PR 本文構成・承認ゲート定義（本ファイル）。

## 完了条件

- [x] PR base が `dev` であることが明記されている
- [x] PR 本文に真因・3 Lane・復旧手順・staging before/after screenshot 参照・不変条件を含む構成が定義されている
- [x] 品質検証 4 コマンド + validation matrix（表現層非接触 / migration 非変更）が定義されている
- [x] commit / PR / staging mutation / screenshot 取得が user 明示承認まで blocked と明記されている

## タスク100%実行確認【必須】

- [x] PR 本文構成・品質検証・承認ゲートの計画を確定した
- [x] commit / push / PR / staging mutation / deploy を本 phase で実行していないことを明記した

## 次Phase

なし（最終 Phase）。user 承認後に PR 作成を実行し、PR URL を報告する。
