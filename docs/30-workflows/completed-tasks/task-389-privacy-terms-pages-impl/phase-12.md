# Phase 12: ドキュメント更新 — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 12 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

task-specification-creator skill Phase 12 strict 7 files を作成し、本タスクの正本仕様反映と未タスク検出を行う。

## 必須出力（7 ファイル）

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル）の実装ガイド |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements への反映判定（影響なし or 反映 path） |
| 3 | `outputs/phase-12/documentation-changelog.md` | 本タスクで作成/更新したドキュメント一覧 |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | 残課題（0 件でも出力必須） |
| 5 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への改善 feedback（無くても出力必須） |
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 7 ファイル実体確認結果 |
| 7 | `outputs/phase-12/main.md` | Phase 12 サマリ |

## implementation-guide.md 概要

### Part 1（中学生レベル）

「Privacy Policy（プライバシーポリシー）と Terms（利用規約）は、サービスを使う人の情報をどう扱うか、何をしてはいけないかを書いた約束ごとのページ。Google でログインする機能を使うには、Google からこの 2 つのページが必要なので、サイトの中に作って公開する」というレベルで説明。

### Part 2（技術者レベル）

- `apps/web/app/{privacy,terms}/page.tsx` を Next.js App Router の Server Component として実装
- OpenNext for Cloudflare Workers でビルド
- Cloudflare Workers にデプロイし HTTP 200 を確認
- Google Cloud Console の OAuth consent screen に URL を登録

## system-spec-update-summary.md 判定

- aiworkflow-requirements の正本仕様（`13-mvp-auth.md` 等）には**新規記載追加**（Privacy/Terms URL 設置・OAuth verification 要件）。
- Step 1-A: 仕様 SSOT に「公開ページ `/privacy` `/terms` は OAuth consent screen 要件として 200 必須」を追記対象として記録。
- Step 1-B/C: D1 schema / API contract への影響なし。

## unassigned-task-detection.md 観点

- 法務本文面の最終確定 PR が別 PR に切り出される場合、未タスクとして登録（CONST_007 例外）
- Cookie banner / consent management UI（Scope Out）— 将来要件として記録

## skill-feedback-report.md 観点

- VISUAL_ON_EXECUTION + #385 のような外部 blocker を持つタスクで、Phase 11 の `pending` placeholder と blocked status を分離する運用が機能したかをフィードバック

## 完了条件

- [ ] 7 ファイル全て**実体**として作成されている
- [ ] system-spec-update-summary.md が aiworkflow-requirements との整合判定済
- [ ] `outputs/phase-12/main.md` を作成する
