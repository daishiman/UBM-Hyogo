# Phase 12: 正本同期

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 1〜11 で完成した primitive / hook / CSS / テスト / visual evidence を、aiworkflow-requirements skill / task-specification-creator skill / 関連 SCOPE.md / unassigned-task index へ正本として反映する Phase。docs ファイルとして強制必須の strict 7 outputs を生成する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | 正本同期 |
| タスク | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| GitHub Issue | parallel-09-ux-cross-cutting (UI prototype alignment MVP recovery 配下) |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | pending |
| タスク種別 | implementation / **VISUAL** |

---

## 目的

Phase 1〜11 で完成した 4 primitive + EmptyState 拡張 + useAdminMutation + globals.css 規則 + 12 visual snapshot を、システム仕様書群（aiworkflow-requirements skill / SCOPE.md / ui-primitives.md）と unassigned-task index へ正本として引き継ぐ。

---

## なぜ正本同期が必要か（中学生レベル）

「家のリビングに新しい収納ボックスを 4 個 (FormField / Pagination / Icon / Breadcrumb) を作って、棚 (EmptyState) を改造して、リモコン (useAdminMutation) を直した」だけでは、3 ヶ月後に「あれ、ボックスってどこから取り出すんだっけ？」と本人や別の家族が混乱する。

Phase 12 では「**新しい収納ボックスの場所と使い方を、家の取扱説明書の決まったページに追記する作業**」を行う。

- 取扱説明書（aiworkflow-requirements skill の `frontend-conventions.md` 等）に「2026-05 改修：4 primitive を `@/components/ui/` と `@/components/admin/` から取り出す」と追記
- 「OKLch 色は tokens.css から、影は @layer components から」というルールも追記
- 「parallel-09 の付箋」を「完了済」の箱に移動する

子どもでも分かる言葉で言うと:

| 概念 | 例え |
| --- | --- |
| primitive | 「カテゴリ別に分けた標準サイズの箱」（料理: お皿、洗濯: ハンガー） |
| OKLch token | 「色見本帳」。HEX で書くと色見本を見ずに勝手に塗ってしまうので、必ず見本帳を見るルール |
| `@layer components` | 「家具の組立説明書」のうち「組立後の追加カスタム」のページ。レイヤーで管理して、誰が何を加えたか見える |
| section comment | 「組立説明書の章立て」（「parallel-03 が書いた章」「parallel-09 が書いた章」） |
| visual snapshot | 「完成写真」。写真と実物が違ったらすぐ気づける |
| Phase 12 正本同期 | 「取扱説明書の更新」。今後 6 ヶ月後の自分・他の人が迷わないようにする |

---

## 必須 outputs

| # | output | 出力先 |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` |
| 3 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` |
| 5 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` |
| 7 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

## 12-1. implementation-guide.md（Phase 13 PR 本文に直接転記される）

### Part 1 — 中学生レベル概念説明

| 概念 | 例え |
| --- | --- |
| FormField primitive | 「入力欄の決まった包装紙」。ラベル + 入力 + エラー注意書きを必ずセットで包む |
| EmptyState 拡張 | 「絵 + タイトル + 説明 + 行動ボタン」の 4 点セットの "何もないですよ" カード。今までは1 種類だけだったが、組合せ自由にできるよう改造 |
| Pagination cursor mode | 「ページ番号が分からなくても、次/前ボタンだけ動く」モード。総数が分からない無限スクロール風にも使える |
| Icon size 規約 | 「ロゴ用の大中小サイズを 4 つに統一」。ばらばらに 14px / 18px / 22px と書かれていた問題を解決 |
| Breadcrumb 最終 aria-current | 「今いるページの位置を読み上げソフトに教える特別な印」。視覚障害者の方も今どこにいるか分かる |
| focus-visible 統一 | 「Tab キーで動かすときに必ず青枠が出る」。マウス使いには邪魔にならず、キーボード使いには見やすい |
| concurrent mutation guard | 「保存ボタンを連打しても 1 回しか実行しない」見張り役。同じ送信を 2 回しないで済む |
| form state preserve | 「保存に失敗しても入力欄を消さない」。何度も入力し直すストレスを防ぐ |
| section comment 整理 | 「複数の人が同じノートを使うとき、章番号で区切って混乱を避ける」運用ルール |

### Part 2 — 技術契約（技術者レベル）

| 項目 | 契約 |
| --- | --- |
| FormField API | `<FormField name label error?>{children}</FormField>` で children に `aria-invalid` / `aria-describedby="${name}-error"` を注入 |
| EmptyState API | `{ icon?, title, description?, action?, children? }`。既存 caller の `children` 利用を後方互換維持 |
| Pagination API | `{ current, total?, hasNext, hasPrev, onNext, onPrev }`。`total` 未指定時は cursor-only 表示 |
| Icon API | `IconSize = "sm"\|"md"\|"lg"\|"xl"` (12/16/20/24px) / `name: IconName` |
| Breadcrumb API | `items: ReadonlyArray<{ label: string; href?: string }>`。最終項目は `href` 無視 + `aria-current="page"` |
| useAdminMutation API | `(mutationFn, onSuccess?, onError?) => { mutate, isLoading }`。isLoading 中の 2nd call は reject + toast |
| globals.css 規約 | `@layer components` 内に `/* === parallel-09 G9-x === */` section コメントで分離。parallel-03 セクションと物理位置を分ける |
| OKLch 利用 token | `--ubm-color-danger`, `--ubm-color-danger-soft`, `--ubm-color-accent`, `--ubm-color-text-primary`, `--ubm-color-text-secondary`, `--ubm-spacing-{sm,md,lg,xl}`, `--ubm-text-{xs,sm,lg}`, `--ubm-ease-standard` |
| HEX 直書き禁止 | `bg-[#…]` / `text-[#…]` / `border-[#…]` / `focus:[#…]` は CI gate `verify-design-tokens` で reject |
| API 不変条件 | `apps/api/` / `apps/web/wrangler.toml` / D1 schema に diff なし |
| spec 命名規約 | `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。lefthook + GHA `verify-test-suffix` で gate |

### Part 3 — 変更ファイル一覧（CONST_005）

| 種別 | パス | 役割 |
| --- | --- | --- |
| 新規 | `apps/web/src/components/ui/FormField.tsx` | G9-1 form validation primitive |
| 新規 | `apps/web/src/components/ui/Pagination.tsx` | G9-3 pagination primitive |
| 新規 | `apps/web/src/components/ui/Icon.tsx` | G9-4 icon size convention |
| 新規 | `apps/web/src/components/admin/Breadcrumb.tsx` | G9-5 breadcrumb primitive |
| 編集 | `apps/web/src/components/ui/EmptyState.tsx` | G9-2 API 拡張（後方互換維持） |
| 編集 | `apps/web/src/lib/useAdminMutation.ts` | G9-8/9 mutation guard + form state preserve |
| 編集 | `apps/web/src/styles/globals.css` | G9-1/6/7 CSS layer + parallel-09 section コメント整理 |
| 新規 | `apps/web/src/components/ui/__tests__/{FormField,EmptyState,Pagination,Icon}.spec.tsx` | Vitest + jest-axe |
| 新規 | `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx` | Vitest + jest-axe |
| 新規 | `apps/web/src/lib/__tests__/useAdminMutation.spec.ts` | Vitest |
| 新規 | `apps/web/tests/visual/parallel-09-primitives.spec.ts` | Playwright visual |
| 新規 | `apps/web/app/visual-harness/[name]/page.tsx` | 撮影用 fixture（production ガード付） |
| 新規 | `docs/00-getting-started-manual/specs/ui-primitives.md` | primitive リファレンス |
| 編集（条件付） | `docs/00-getting-started-manual/specs/design-tokens.md` | token 不足判明時のみ feedback 追記 |
| 編集 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | primitive 提供シグナル追記 |
| 確認 | `apps/web/src/styles/tokens.css` | OKLch token 正本（変更しない） |
| 確認 | `apps/api/` 全配下 | 変更しない |
| 確認 | `apps/web/wrangler.toml` | 変更しない |

### Part 4 — 主要関数シグネチャ

```ts
// apps/web/src/components/ui/FormField.tsx
export interface FormFieldProps {
  name: string;
  label: string;
  error?: string;
  children: ReactNode;
}
export function FormField(props: FormFieldProps): JSX.Element;

// apps/web/src/components/ui/Pagination.tsx
export interface PaginationProps {
  current: number;
  total?: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
}
export function Pagination(props: PaginationProps): JSX.Element;

// apps/web/src/components/ui/Icon.tsx
export type IconSize = "sm" | "md" | "lg" | "xl";
export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  size: IconSize;
  name: IconName;
}
export function Icon(props: IconProps): JSX.Element;

// apps/web/src/components/admin/Breadcrumb.tsx
export interface BreadcrumbItem { label: string; href?: string; }
export interface BreadcrumbProps { items: ReadonlyArray<BreadcrumbItem>; }
export function Breadcrumb(props: BreadcrumbProps): JSX.Element;

// apps/web/src/lib/useAdminMutation.ts
export function useAdminMutation<T, E>(
  mutationFn: (data: T) => Promise<unknown>,
  onSuccess?: (data: unknown) => void,
  onError?: (error: E) => void,
): { mutate: (data: T) => Promise<void>; isLoading: boolean };
```

### Part 5 — 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `FormField` | props | JSX | DOM 生成 + aria 属性注入 |
| `Pagination` | props | JSX | button disabled 状態切替 |
| `Icon` | props | JSX | CSS font-size 変更（pure render） |
| `Breadcrumb` | props | JSX | nav + ol 構造生成 |
| `useAdminMutation` | mutationFn, callbacks | { mutate, isLoading } | mutation 実行 + isLoading 更新 + toast 発火 |

### Part 6 — テスト方針

| レイヤ | 対象 | 想定ケース |
| --- | --- | --- |
| Vitest unit | 4 primitive + EmptyState 拡張 + useAdminMutation | DOM 構造 / aria 属性 / 後方互換 / guard 動作 / error 後 state 保存 |
| jest-axe | 4 primitive + EmptyState | violations 0 |
| Playwright visual | 6 種 × 2 scale | snapshot diff 0 (`maxDiffPixels: 0`) |
| 静的 | typecheck / lint / HEX grep / token grep | 全 PASS |

### Part 7 — ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web test:a11y
mise exec -- pnpm --filter @ubm-hyogo/web test:visual
grep -rEn 'bg-\[#|text-\[#|border-\[#|focus:\[#' apps/web/src && echo NG || echo OK
```

### Part 8 — 設計判断

| 判断 | 理由 |
| --- | --- |
| `apps/web/src/lib/` への helper 切り出しを **行わない** | YAGNI。本 task 以外に caller が出るまで抽象化を保留 |
| EmptyState を新規ではなく **拡張** | 既存 caller 5 箇所を破壊しない。optional props 追加で後方互換維持 |
| globals.css を section コメントで分離 | parallel-03 と並走編集する `@layer components` の merge conflict を予防 |
| Pagination に `total?` を optional にする | cursor-only API を返す endpoint（既存 admin/audit 等）にも適用可能にする |
| Icon を `<span style={fontSize}>` で実装 | SVG ライブラリ依存を増やさず、既存 icons.ts と組合せて動作 |
| useAdminMutation で `isLoading` 中の 2nd call を toast + reject | mutation の二重発火（D1 への duplicate write）を防止 |
| visual snapshot を 1x + 2x の 2 scale | Retina 環境での antialiasing 差異による false positive を回避 |
| fixture page を `/visual-harness/` に隔離 + production ガード | 開発時のみ visual evidence を撮影、production 漏れを防止。`__visual__` は App Router private folder 扱いになるため使わない |
| 新規 cron / 新規 D1 migration / 新規 API endpoint を **追加しない** | parallel-09 のスコープは UX primitives 統一のみ。他 parallel と責務分離 |

### Part 9 — 検証手順

ローカル:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web test:a11y
mise exec -- pnpm --filter @ubm-hyogo/web test:visual
```

CI gate:

- `verify-design-tokens` (HEX 直書き 0)
- `verify-test-suffix` (`*.spec.{ts,tsx}` のみ)
- `verify-indexes-up-to-date`（aiworkflow-requirements skill index 整合）

### Part 10 — ロールバック手順

| 範囲 | 手順 |
| --- | --- |
| primitive 単体 | 該当 commit を `git revert`。primitive 利用箇所がない状態に戻す |
| globals.css 変更 | `git checkout dev -- apps/web/src/styles/globals.css` で復元（CSS は副作用なし） |
| EmptyState 拡張 | `git checkout dev -- apps/web/src/components/ui/EmptyState.tsx`。既存 caller は API 後方互換のため復元のみで動作 |
| useAdminMutation | `git checkout dev -- apps/web/src/lib/useAdminMutation.ts`。caller 側で `isLoading` を参照していなければ影響なし |
| 全体 | feature ブランチを破棄。`apps/api` / D1 / wrangler.toml に diff がないため Cloudflare 側へ rollback 不要 |

### Part 11 — DoD（Definition of Done）

- [ ] 4 primitive 新規 + 2 編集 + 1 CSS 編集が完了
- [ ] 6 spec + 1 Playwright spec が `*.spec.{ts,tsx}` 命名で配置
- [ ] 12 PNG visual evidence が `outputs/phase-11/screenshots/` に存在
- [ ] HEX 0 件 / token 整合 / API 変更 0
- [ ] `apps/web/src/lib/` への新規ファイル追加なし
- [ ] ui-primitives.md / SCOPE.md primitive 提供シグナルが記載
- [ ] parallel-03 conflict dry-run で conflict 0（または skip 理由文書化）
- [ ] typecheck / lint / unit / a11y / visual 全 PASS

---

## 12-2. system-spec-update-summary.md（要点）

詳細は `outputs/phase-12/system-spec-update-summary.md` を参照。

| Step | 対象 | 内容 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md` の status を `spec_created` → `implementation_completed` → `completed` に更新。post-merge 後に `completed-tasks/` 配下へ移動するかは ui-prototype-alignment-mvp-recovery 親 workflow の運用に従う |
| Step 1-B | 実装状況 | `spec_created` → `implementation_completed` (Phase 11 完了時) → `completed` (PR merge 後) |
| Step 1-C | 関連タスク | parallel-01〜08 と本 task は独立。primitive 提供シグナル経由で API 共有 |
| Step 2 | システム仕様反映 | `aiworkflow-requirements/references/frontend-conventions.md`（または該当 reference）に「parallel-09 で導入された 4 primitive + EmptyState 拡張 + useAdminMutation」セクションを追記。`indexes/keywords.json` に `FormField` / `Pagination primitive` / `Icon size convention` / `Breadcrumb primitive` / `useAdminMutation` / `OKLch token` / `@layer components section` を追加 |

---

## 12-3. documentation-changelog.md（要点）

詳細は `outputs/phase-12/documentation-changelog.md` を参照。

| ファイル | 種別 | 変更概要 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/ui-primitives.md` | 新規 | 6 primitive リファレンス |
| `docs/00-getting-started-manual/specs/design-tokens.md` | 編集（条件付） | token 不足時のみ「parallel-09 feedback」追記 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 編集 | primitive 提供シグナル追記 |
| `docs/30-workflows/parallel-09-ux-cross-cutting/phase-{09..13}.md` | 新規 | 本サイクルの Phase 仕様書 |
| `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-{09..13}/*.md` | 新規 | 各 Phase の evidence / summary |

---

## 12-4. unassigned-task-detection.md（要点）

詳細は `outputs/phase-12/unassigned-task-detection.md` を参照。

- 本サイクルで新たに発見した unassigned task: **以下 1 件のみ条件付**
  - 「`verifyAriaInvalid` 等の汎用 helper を `apps/web/src/lib/aria-helpers.ts` に切り出す」 → **parallel-01〜08 のいずれかで再利用需要が出た時点で起票**（YAGNI 適用）
- parallel-01〜08 との独立性確認: 本 task は primitive 提供のみ。caller 側 spec は各 parallel が自律的に実装する
- ui-prototype-alignment-mvp-recovery 親 workflow との関係: 本 task 完了で「primitive 統一」フェーズが完結し、各 parallel は自由に primitive を import 可能

---

## 12-5. skill-feedback-report.md（要点）

詳細は `outputs/phase-12/skill-feedback-report.md` を参照。

| skill | feedback |
| --- | --- |
| task-specification-creator | VISUAL タスクの Phase 11 で `visual-verification-skip.md` を採用しないこと、6 種 × 2 scale snapshot を必ず取得することを SKILL.md に明記すべき |
| aiworkflow-requirements | `frontend-conventions.md` に「primitive 統一の原則」セクションを新設し、「@layer components の section コメント分離」「OKLch token 正本」「`apps/web/src/lib/` への premature 切り出し禁止」を明文化すべき |

---

## 12-6. phase12-task-spec-compliance-check.md（要点）

詳細は `outputs/phase-12/phase12-task-spec-compliance-check.md` を参照。

| 項目 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- |
| strict 7 outputs | 7 ファイル全配置 | 7 / 7 | [ ] |
| implementation-guide.md Part 1〜11 | 全 Part 記載 | _実測転記_ | [ ] |
| 中学生レベル概念説明 | Part 1 に存在 | _実測転記_ | [ ] |
| 技術者レベル契約 | Part 2 に存在 | _実測転記_ | [ ] |
| 変更ファイル一覧 | Part 3 に CONST_005 形式で存在 | _実測転記_ | [ ] |
| 関数シグネチャ | Part 4 に存在 | _実測転記_ | [ ] |
| 入出力・副作用 | Part 5 に存在 | _実測転記_ | [ ] |
| テスト方針 | Part 6 に存在 | _実測転記_ | [ ] |
| ローカル実行コマンド | Part 7 に存在 | _実測転記_ | [ ] |
| 設計判断 | Part 8 に存在 | _実測転記_ | [ ] |
| 検証手順 | Part 9 に存在 | _実測転記_ | [ ] |
| ロールバック | Part 10 に存在 | _実測転記_ | [ ] |
| DoD | Part 11 に存在 | _実測転記_ | [ ] |

---

## 完了条件

- [ ] strict 7 outputs（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）が `outputs/phase-12/` に配置されている
- [ ] `implementation-guide.md` に Part 1〜11（中学生レベル + 技術契約 + 変更ファイル + シグネチャ + 入出力 + テスト + コマンド + 設計判断 + 検証 + ロールバック + DoD）が揃っている
- [ ] `system-spec-update-summary.md` に Step 1-A / 1-B / 1-C / Step 2 の判定が明記
- [ ] `unassigned-task-detection.md` に独立性確認と condition 付 unassigned-task が記録
- [ ] `skill-feedback-report.md` に少なくとも 2 件の skill feedback が記録
- [ ] `phase12-task-spec-compliance-check.md` の compliance check が全 [x]

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-12 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次 Phase: Phase 13 (PR・振り返り)
- 引き継ぎ:
  - `implementation-guide.md` Part 3 + 8 + 9 + 10 → PR 本文「変更ファイル / 設計判断 / 検証手順 / ロールバック」
  - `unassigned-task-detection.md` → PR 本文「Summary」と post-merge 「unassigned-task 移動」アクション
  - 12 visual snapshot へのリンク → PR 本文「Screenshots」セクション
- ブロック条件: strict 7 outputs に欠落、または `apps/api` / D1 / wrangler.toml への変更混入が検出された場合は実行しない

---

## 参照

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md`（原典）
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-12.md`（フォーマット参考）
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`（strict 7 outputs ルール）
- `.claude/skills/aiworkflow-requirements/SKILL.md`（同期先正本）
