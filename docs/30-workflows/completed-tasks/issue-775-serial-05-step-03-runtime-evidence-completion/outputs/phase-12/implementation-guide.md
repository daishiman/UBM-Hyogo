# Phase 12 Implementation Guide (Refs #775)

[実装区分: 実装仕様書]

## Part 1: 中学生レベルの説明

### 1. なぜ必要か

親タスクでは `/admin/schema` 画面のコードはできていましたが、実際に画面を開いて写真を撮る証拠が足りませんでした。証拠がないと、「作ったはず」が本当に見える状態なのか後から確認できません。

たとえば、文化祭の準備で看板を作ったあと、先生に「完成しました」と言うだけではなく、看板が入口に置かれている写真を残すようなものです。写真があれば、あとから別の人が見ても「本当に置けていた」と分かります。

### 2. 何をしたか

今回、画面を自動で開く Playwright のテストを追加し、既存の admin fixture と schema diff fixture で、追加・変更・削除・未解決の 4 種類を PC 幅とスマホ幅で撮影しました。さらに、alias 割当の成功・409・422 の表示も撮影しました。

### 今回作ったもの

- Playwright の専用設定と spec
- 11 枚の画面証跡
- 将来の real-D1 検証で使える seed / cleanup SQL
- Phase 11 / Phase 12 の状態更新ドキュメント

### 3. なぜ本物のアプリコードを変えなかったか

目的は「すでにある画面の証拠を完成させること」です。画面そのものを直すと、証拠取得タスクなのか UI 修正タスクなのか分からなくなります。そのため、`SchemaDiffPanel.tsx` や API には触らず、撮影用の Playwright spec と local seed fixture だけを追加しました。

### 4. 用語セルフチェック

| 用語 | 意味 |
| --- | --- |
| runtime evidence | 実際にアプリを動かして取った証拠 |
| canonical workflow root | この作業の正本となる Phase 1-13 の置き場所 |
| refs_only | 閉じ済み Issue を再 close しないため `Refs #775` だけで参照するルール |
| production code freeze | 本番アプリのコードを変更しない境界 |
| Playwright | ブラウザを自動で開いて確認する道具 |
| seed fixture | テスト用の決まったデータを入れる準備ファイル |

## Part 2: 技術者向け実装サマリ

serial-05-step-03 `SchemaDiffPanel` の fixture-backed local runtime evidence を完遂するため、新規 Playwright spec / config / optional D1 seed fixture を追加し、`SchemaDiffPanel` の 4 pane × 2 viewport + resolve 3 状態 = 計 11 PNG を親 workflow `outputs/phase-11/screenshots/` に配置する。production code は不変。

## 2. インターフェース / 型定義

本タスクは production API surface を変更しない。追加した Playwright support の入力契約だけを固定する。

```ts
type SchemaDiffPane = "added" | "changed" | "removed" | "unresolved";

type AliasRequestBody = {
  stableKey?: string;
};

type ResolveFeedbackKind =
  | "success"
  | "conflict_error"
  | "validation_error";

type EvidenceViewportSuffix = "desktop" | "mobile";
```

### APIシグネチャ

Production endpoint shape は既存のまま変更しない。

| Interface | Signature / path | このタスクでの扱い |
| --- | --- | --- |
| Page route | `GET /admin/schema` | Playwright が表示確認と screenshot を取得 |
| Alias route | `POST **/api/admin/schema/aliases` | Playwright route mock で 200 / 409 / 422 を返す |
| Evidence output | `admin-schema-diff-${pane}-${suffix}.png` | 親 workflow Phase 11 screenshot path に保存 |

使用例:

### 使用例

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --config=playwright.admin-schema-diff.config.ts
```

### エラーハンドリング

resolve 失敗時は `data-feedback-kind` で 409 と 422 を分け、Playwright がそれぞれの日本語 feedback を確認する。

### エッジケース

| Case | Evidence | Expected UI feedback |
| --- | --- | --- |
| resolve success | `admin-schema-diff-resolve-success.png` | status region contains `alias を割当てました` |
| 409 collision | `admin-schema-diff-resolve-409.png` | `[data-feedback-kind="conflict_error"]` contains `競合` |
| 422 validation | `admin-schema-diff-resolve-422.png` | `[data-feedback-kind="validation_error"]` contains `入力内容に誤り` |
| mobile pane capture | `admin-schema-diff-*-mobile.png` | resolve feedback tests are skipped on mobile by design |
| evidence directory missing | Playwright `beforeEach` creates the directory | no manual mkdir prerequisite |

### 設定項目と定数一覧

| Name | Default / value | Purpose |
| --- | --- | --- |
| `PLAYWRIGHT_BASE_URL` | `http://127.0.0.1:3000` | local Next.js base URL override |
| `ADMIN_SCHEMA_DIFF_EVIDENCE_DIR` | parent workflow screenshot directory | screenshot output override |
| `INTERNAL_API_BASE_URL` | `http://127.0.0.1:8787` | local API route target for the dev server |
| `NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL` | `http://127.0.0.1:8787` | browser-side API base URL for local evidence |
| `PLAYWRIGHT_TASK17_ADMIN_FIXTURE` | `1` | admin auth fixture gate |
| `workers` | `1` | deterministic evidence capture |
| `fullyParallel` | `false` | avoids screenshot race / state collision |

### テスト構成

| Layer | Command / file | Result |
| --- | --- | --- |
| Typecheck | `mise exec -- pnpm typecheck` | `EXIT_CODE=0` |
| Lint | `mise exec -- pnpm lint` | `EXIT_CODE=0` |
| Web tests | `mise exec -- pnpm --filter @ubm-hyogo/web test -- --run ...` | `EXIT_CODE=0` |
| Build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | `EXIT_CODE=0` |
| Visual | `playwright.admin-schema-diff.config.ts` | `11 passed / 3 skipped` |

## 5. 変更ファイル

### 新規

- `apps/web/playwright.admin-schema-diff.config.ts`
- `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts`
- `apps/web/playwright/.auth/.gitignore`
- `scripts/fixtures/serial-05-step-03/seed-diff.sql` (optional future real-D1 support)
- `scripts/fixtures/serial-05-step-03/seed-cleanup.sql` (optional future real-D1 support)
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/admin-schema-diff-{added,changed,removed,unresolved}-{desktop,mobile}.png` (8 files)
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/admin-schema-diff-resolve-{success,409,422}.png` (3 files)
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/playwright.log`
- `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/**` (本 workflow root 一式)

### 編集

- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/manifest.json`
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence.md`
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/main.md`
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md` (末尾 frontmatter 追記のみ)

### 不変（diff 0 必須）

- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/lib/admin/api.ts`
- `apps/web/src/lib/admin/server-fetch.ts`
- `apps/api/src/routes/admin/schema.ts`
- `apps/api/src/routes/admin/schema.contract.spec.ts`
- `apps/web/app/(admin)/admin/schema/page.tsx`
- `apps/api/migrations/**`

## 6. 実装手順

Phase 4 §1 Step 1-9 を順次実行。

## 7. DoD（Definition of Done）

- Phase 1 §2 AC-1 〜 AC-10 全 PASS
- Phase 6 §1 G1-G9 全 PASS
- Phase 8 §1 状態遷移完了
- `mise exec -- pnpm typecheck && pnpm lint && bash scripts/verify-pr-ready.sh` exit 0

## 8. PR

Phase 13 参照。`gh pr create --base dev` で作成し、本文に `Refs #775` を入れる（`Closes #775` 禁止）。
