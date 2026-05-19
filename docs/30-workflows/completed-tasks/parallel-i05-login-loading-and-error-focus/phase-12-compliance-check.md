---
phase: 12
title: ドキュメント更新 / Phase 12 strict 7 成果物
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## 1. Phase 12 strict 7 成果物（必須）

`outputs/phase-12/` 配下に以下を作成:

| ファイル | 責務 |
|---------|------|
| `main.md` | Phase 12 の入口・strict 7 index |
| `implementation-guide.md` | Part 1（中学生レベル概念説明）+ Part 2（技術詳細） |
| `system-spec-update-summary.md` | Step 1-A〜1-C / Step 2 判定 |
| `documentation-changelog.md` | 全 Step の結果記録（該当なしも記録） |
| `unassigned-task-detection.md` | 未タスク（0 件でも出力） |
| `skill-feedback-report.md` | skill 改善点（なしでも出力） |
| `phase12-task-spec-compliance-check.md` | root evidence |

## 2. Task 12-1: implementation-guide.md

### Part 1（中学生レベル）

> Web ページを開いたとき、データを読み込んでいる間は画面が真っ白だと不安になる。本タスクは「読み込み中」のときに灰色の四角を出して、画面が動いていることを知らせる。さらに、エラーが起きたときは、目の見えない人が画面読み上げソフトを使っても「エラーが起きました」と必ず伝わるように、見出しに自動でフォーカスを当てる。

### Part 2（技術者向け）

| 項目 | 内容 |
|------|------|
| 変更ファイル | `apps/web/app/login/{loading.tsx,error.tsx,loading.spec.tsx,error.spec.tsx}` |
| 型 | `LoginErrorProps { readonly error: Error & { digest?: string }; readonly reset: () => void }` |
| API | Next.js App Router boundary（変更なし）|
| 副作用 | `useEffect` で `console.error` + `headingRef.current?.focus({ preventScroll: true })` |
| エラーハンドリング | Error Boundary に委譲、UI は表示のみ |
| 設定 | なし |
| 視覚証跡 | `outputs/phase-11/screenshots/login-{loading-skeleton,error-default,error-with-digest,error-focused-heading}.png` 4 件 |

## 3. Task 12-2: system-spec-update-summary.md（Step 1-A〜1-C / Step 2）

| Step | 内容 | 本 SW での扱い |
|------|------|---------------|
| 1-A | 完了タスク記録 + LOGS.md ×2 + topic-map.md | 親 SW `ui-prototype-alignment-mvp-recovery/LOGS.md` に追記、aiworkflow-requirements の LOGS は該当箇所のみ |
| 1-B | 実装状況テーブル更新（`completed`） | 親 SCOPE.md の関連項目を `completed` に更新 |
| 1-C | 関連タスクテーブル更新 | parallel-07 spec §4.1 / §4.2 を完了に更新 |
| Step 2 | 新規インターフェース追加時のみ | `LoginErrorProps` は internal export のため N/A、または `apps/web/app/login/*` のローカル契約として記録 |

## 4. Task 12-3: documentation-changelog.md

全 Step の結果を個別に明記する（「該当なし」も記録）:

- workflow-local 同期: 本 SW の `index.md` / `artifacts.json` / `outputs/`
- global skill sync: aiworkflow-requirements / task-specification-creator の LOGS.md
- mirror (`.agents/`) sync: 該当なし（本 SW は通常ドキュメントのみ、skill 変更なし）

## 5. Task 12-4: unassigned-task-detection.md（0 件でも出力）

検査ソース:

| ソース | 確認項目 |
|--------|---------|
| 元 spec | `Card` / `CardContent` 採用判定（best-effort のため未採用なら未タスク化候補） |
| Phase 10 MINOR | 任意 a11y 指摘があれば未タスク化 |
| Phase 11 評価 | screenshot 撮影中の発見事項 |
| TODO / FIXME | コード新規追加箇所に存在しないこと |
| describe.skip | 本 SW で skip ブロック導入しないこと |

候補既知:

| 候補 ID | 内容 | 状態 |
|---------|------|------|
| i06 | root `error.tsx` の focus 管理 | 別 SW |
| i07 | `/profile/loading.tsx` の skeleton 化 | 別 SW |
| (任意) | `Card` primitive 採用 | 親 SW で再検討 |

## 6. Task 12-5: skill-feedback-report.md（改善点なしでも出力）

観点:

| 観点 | 記録 |
|------|------|
| テンプレート改善 | （Phase 11 で focus ring 視認確認の標準手順を強化検討） |
| ワークフロー改善 | small-scope in-place fix 用の軽量テンプレートが欲しい |
| ドキュメント改善 | `screenshot-plan.json` の VISUAL default 化を再確認 |

## 7. Task 12-7: phase12-task-spec-compliance-check.md

`assets/phase12-task-spec-compliance-template.md` を雛形に、Phase 1-12 の `outputs/` と `artifacts.json` parity を確認する。identifier consistency を実コードで grep し、`implementation-guide.md` の callback / props 名が実装と一致することを確認（[Feedback W1-02b-3]）。

## 8. インデックス再生成

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
node .claude/skills/task-specification-creator/scripts/generate-index.js \
  --workflow docs/30-workflows/parallel-i05-login-loading-and-error-focus --regenerate
```

## 9. parity 確認

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/parallel-i05-login-loading-and-error-focus
node .claude/skills/task-specification-creator/scripts/verify-all-specs.js \
  --workflow docs/30-workflows/parallel-i05-login-loading-and-error-focus
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
```

## 10. ledger 同期（[FB-04] / [Feedback 5]）

以下 5 ファイルを同一 wave で更新:

- `docs/30-workflows/parallel-i05-login-loading-and-error-focus/index.md`
- `docs/30-workflows/parallel-i05-login-loading-and-error-focus/artifacts.json`
- `docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/artifacts.json`
- 親 SW `docs/30-workflows/ui-prototype-alignment-mvp-recovery/LOGS.md`
- 親 SW completed ledger（該当があれば）


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 12 |
| status | completed |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

/login loading boundary と error focus management を、実装・証跡・仕様の状態語彙が矛盾しない形で完了させる。

## 実行タスク

- 対象 phase の本文に従い、/login の loading / error / test / evidence contract を確認する。
- 実装済み差分と workflow state の整合を維持する。
- Phase 13 の commit / push / PR / runtime screenshot は user approval まで実行しない。

## 参照資料

- docs/30-workflows/parallel-i05-login-loading-and-error-focus/index.md
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/artifacts.json
- docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md

## 成果物

- apps/web/app/login/loading.tsx
- apps/web/app/login/error.tsx
- apps/web/app/login/loading.spec.tsx
- apps/web/app/login/error.spec.tsx
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-11/
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-12/

## 完了条件

- Focused Vitest が exit 0。
- Phase 12 compliance check が exit 0。
- 矛盾なし・漏れなし・整合性あり・依存関係整合の 4 条件が completed。
