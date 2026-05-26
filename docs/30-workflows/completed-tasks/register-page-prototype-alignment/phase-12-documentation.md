---
phase: 12
title: ドキュメント同期 / Compliance Check
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 12 — ドキュメント同期 / Compliance Check

[実装区分: 実装仕様書]

## 1. 必須成果物（Phase 12 strict 7 + canonical 9 headings）

`outputs/phase-12/` に strict 7 を作成する（別エージェントが詳細サブ成果物を作成、本ファイルでは index と参照のみ提供）:

| # | ファイル | 役割 | ステータス | 担当 |
|---|---------|------|-----------|------|
| 1 | `outputs/phase-12/main.md` | strict 7 の index / Phase 12 サマリ | present | 同一サイクルで作成済 |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装手順 + 中学生レベル概念説明 | present | 同一サイクルで作成済 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | docs/00 / docs/30 への spec 更新影響 | present | 同一サイクルで作成済 |
| 4 | `outputs/phase-12/documentation-changelog.md` | doc 変更ログ | present | 同一サイクルで作成済 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 後続 followup の列挙（visual baseline 更新 / i18n 集約 等）| present | 同一サイクルで作成済 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への feedback | present | 同一サイクルで作成済 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings 準拠の compliance check | present | 同一サイクルで作成済 |

## 2. canonical 9 headings（compliance check 必須）

`phase12-task-spec-compliance-check.md` は逐語で以下 9 見出しを使う:

1. `## Summary verdict`
2. `## Changed-files classification`
3. `## \`workflow_state\` and phase status consistency`
4. `## Phase 11 evidence file inventory`
5. `## Phase 12 strict 7 file inventory`
6. `## Skill/reference/system spec same-wave sync`
7. `## Runtime or user-gated boundary`
8. `## Archive/delete stale-reference gate`
9. `## Four-condition verdict`

独自見出し（例: `## 概要`）は CI parser に拾われないため使わない。

## 3. 中学生レベル概念説明（implementation-guide.md に含める）

```markdown
## なぜこの変更が必要か（中学生レベル説明）

入会案内ページ（/register）は「Google フォームに誘導する」ためのページです。
今は説明が少なく見た目もシンプルなので、ユーザーが「次に何をすればいいか」を
迷ってしまう可能性があります。

今回の作業で、プロトタイプ（社内デザイン）に合わせて 5 つのパーツを並べます:

1. Hero CTA — 大きなボタンで「ここから登録」と示します
2. 登録の流れ — 3 ステップで全体像を見せます
3. フォームの設問プレビュー — 折りたためる形で詳細を見せます
4. よくある質問 — FAQ を折りたたみ形式で並べます
5. 一番下にもう一度 CTA — 読み終わったらすぐ登録できるようにします

色や余白は「サイト全体で使っている共通の決まり（design tokens）」だけを使い、
ページ独自の色を増やしません。
```

## 4. unassigned-task ファイルの扱い

| 候補 | 内容 | 起票判定 |
|------|------|---------|
| visual baseline 更新 | `/register` Playwright visual baseline 更新 | 本サイクルの Phase 11 evidence として取得・更新 |
| copy i18n 集約 | `register.ts` 共通モジュール化 | Phase 8 で TODO 化したもの。後続 followup |
| FormPreviewSections collapsible 横展開 | 他 preview 表示箇所への展開 | 必要性確認の上 followup |

物理移動 / Issue 番号付与は Phase 13 commit 完了後、user-gated で実施。

## 5. Indexes 同期

```bash
mise exec -- pnpm indexes:rebuild
git diff --quiet .claude/skills/aiworkflow-requirements/indexes || echo "drift detected"
```

drift があれば本 PR に含める（CI `verify-indexes-up-to-date` 対策）。

## 6. Stale 参照 grep

```bash
grep -rn "register-page-prototype-alignment" docs/ .claude/ | grep -v "30-workflows/register-page-prototype-alignment/"
```

ヒットした外部参照は内容を確認し、必要に応じて更新。

## 7. gate 検証

```bash
node scripts/gate-metadata-validate.js
node scripts/verify-phase12-compliance.js
```

両方 pass で Phase 12 を closeout 可能。
