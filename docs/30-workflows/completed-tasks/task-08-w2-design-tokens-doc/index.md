# task-08-w2-design-tokens-doc — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-08-w2-design-tokens-doc |
| タスクID | task-doc-08-w2-design-tokens-doc-001 |
| ディレクトリ | docs/30-workflows/task-08-w2-design-tokens-doc |
| 親 workflow | ui-prototype-alignment-mvp-recovery |
| 元仕様 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-08-w2-par-design-tokens-doc.md |
| Wave | W2 / parallel（task-06 / task-07 と並列実行可） |
| 実行種別 | sequential（単一成果物。Phase 1→13 を直列） |
| 作成日 | 2026-05-07 |
| 状態 | spec_created |
| タスク種別 | docs-only / NON_VISUAL |
| 実装区分 | ドキュメントのみ仕様書（CONST_004 — 主成果物は spec markdown 1 ファイル。Phase 12 正本同期成果物を同一 wave に含める。コード変更を伴わない） |
| 優先度 | priority:high（後続 task-09 / task-10 / task-18 のブロッカー） |
| 担当 | Designer |
| 想定工数 | 0.5 人日 |

## purpose

`docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70 の OKLch カラー / shadow / radius / typography / spacing トークン値を **正本転記**し、Tailwind v4 `@theme` block への直接貼り付け可能な CSS 変数 + JSON の対として `docs/00-getting-started-manual/specs/09b-design-tokens.md` を新規作成する。命名規則は `--ubm-*` prefix で統一し、後続 task-09 の `globals.css` / `tokens.css` と task-10 の primitive variant がそのまま参照できる状態を作る。dark mode 拡張余地は placeholder で確保し、OKLch 非対応ブラウザ向けの sRGB fallback を `@supports not` 構造で正本化する。

本タスクの主成果物はマークダウン仕様書 1 ファイルで、`apps/web` `apps/api` 配下のコード変更を一切含まない。Phase 12 の正本同期成果物（overview link / aiworkflow-requirements indexes / task-workflow / changelog / outputs）は同一 wave の完了条件に含める。値の決定権は本ファイルに閉じる。

## 実装区分の判定根拠（CONST_004）

| 判定軸 | 判定 |
| --- | --- |
| 主成果物 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` 新規作成 1 ファイル |
| 正本同期成果物 | `docs/00-getting-started-manual/specs/00-overview.md`、`09-ui-ux.md` の 09b link 追加、`09c-primitives.md` の 09b anchor / token 名補正、`09f-screen-blueprints-member.md` の旧仮 token link 補正、親 workflow / task-09 / task-18 の旧 token contract 補正、`.claude/skills/aiworkflow-requirements/{indexes,references,changelog}/**`、Phase 11/12 outputs |
| コード変更 | なし（apps/* / scripts/* / .github/* いずれも touch しない） |
| 動作の改善 / 修正 | なし（値は既存 prototype `styles.css` からの転記のみ） |
| ファイル変更・関数追加・API 変更・データモデル変更 | なし |
| 結論 | **ドキュメントのみ仕様書（docs-only / NON_VISUAL）**。apps/packages コード変更は不要だが、正本同期ファイルは scope に含める |

> 後続 task-09 が本ファイルの内容を `apps/web/src/styles/{tokens,globals}.css` に実装する。task-09 は本タスクとは別仕様書として独立する（task-09 仕様書は別途作成）。本仕様書はあくまで「値の正本」を定義することのみを責務とする。

## scope in / out

### scope in

- `docs/00-getting-started-manual/specs/09b-design-tokens.md` 新規作成（380〜540 行目標）
- 章立て §1〜§12（位置づけ / 命名規則 / color / radius / shadow / typography / spacing / motion / JSON / @theme 直結ガイド / dark mode placeholder / 改訂履歴）
- 3 テーマ（stone / warm / cool）の全 token 値を `styles.css` から転記
- `--ubm-*` prefix 統一（60+ 個の CSS 変数を網羅）
- `design-tokens.json` を完全な valid JSON として inline 提示（Style Dictionary 互換）
- Tailwind v4 `@theme inline` 直結テンプレート提示
- sRGB fallback 戦略（`@supports not (color: oklch(0% 0 0))`）
- dark mode placeholder（値未定で structure のみ）
- zone tokens (a..e) を MVP では status tokens の alias として正本化

### scope out

- Tailwind v4 の `@theme` 実装本体（task-09 担当）
- primitive component の variant 実装（task-10 担当）
- CI 検証スクリプト `verify-design-tokens.ts` の実装（task-18 担当）
- token 値の「決定」（プロトタイプ値をそのまま採用。デザイン変更議論は本タスク外）
- dark mode の値確定（別 workflow）
- `apps/web` / `apps/api` 配下のコード変更
- production deploy

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-01 scope-gate-all-screens | scope 確定の前提 |
| 上流 | プロトタイプ `styles.css` L1-L70 | 値の出典 |
| 上流 | `outputs/phase-3/phase-3.md` §3.3（親 workflow） | OKLch 適用ルール |
| 並列 | task-06 ui-ux-contract-rewrite | 09 系 spec 群の並列作成 |
| 並列 | task-07 prototype-mapping-table | 同上 |
| 下流 | task-09 tailwind-v4-setup | `@theme` で本ファイルの token を参照 |
| 下流 | task-10 ui-primitives | variant prop で `--ubm-*` を class-variance-authority に渡す |
| 下流 | task-18 verify-design-tokens | 本ファイルが CI gate の正本 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 元仕様 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-08-w2-par-design-tokens-doc.md | 本タスクの直接の出典 |
| 値の出典 | docs/00-getting-started-manual/claude-design-prototype/styles.css L1-L70 | OKLch / hex 値転記元 |
| 適用ルール | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md §3.3 | status / zone OKLch 適用ルール |
| 親 workflow scope | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 不変条件 / scope 規律 |
| 親 workflow execution order | docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md | W2 並列対象 |
| 出力先 | docs/00-getting-started-manual/specs/09b-design-tokens.md | 新規作成（このタスクの成果物） |

## Acceptance Criteria

| ID | 条件 | 検証方法 |
| --- | --- | --- |
| AC-1 | `09b-design-tokens.md` が 380 行以上で新規作成されている | `wc -l` |
| AC-2 | 章立てが 12 章ある | `grep -c '^## ' specs/09b-design-tokens.md` → 12 |
| AC-3 | 3 テーマ全 token 値が転記済み | §3.4.1 / §3.4.2 / §3.4.3 が存在 |
| AC-4 | `--ubm-*` token 数が 60+ | `grep -cE '\`--ubm-[a-z0-9-]+\`'` ≥ 60 |
| AC-5 | inline JSON が valid | `awk '/^```json$/,/^```$/' \| jq .` 0 exit |
| AC-6 | sRGB fallback が `@supports not (color: oklch(...))` で記述 | grep |
| AC-7 | Tailwind v4 `@theme inline` テンプレートが提示 | grep `@theme inline` |
| AC-8 | dark mode placeholder が記述（値未定で OK） | grep `[data-theme="dark"]` |
| AC-9 | zone tokens (a..e) が status tokens の alias として正本化 | §3.3 / §4.4 表確認 |
| AC-10 | OKLch 値の `styles.css` cross-check が欠落 0 | Phase 9 cross-check script |
| AC-11 | markdown lint error 0 | `pnpm lint:md` |
| AC-12 | `git status --short --untracked-files=all` と `git diff --name-only` が本タスク scope（`09b-design-tokens.md` + `00-overview.md` + `09-ui-ux.md` + `09c-primitives.md` + `09f-screen-blueprints-member.md` + 親 workflow / task-09 / task-18 の旧 token contract 補正 + `docs/30-workflows/task-08-w2-design-tokens-doc/**` + `.claude/skills/aiworkflow-requirements/**` の本 task 同期差分）のみ | Phase 13 scope diff gate |

## phase 一覧

| Phase | ファイル | 目的 |
| --- | --- | --- |
| 1 | phase-01.md | 要件定義 |
| 2 | phase-02.md | 設計（章立て / 命名規則 / token 集合） |
| 3 | phase-03.md | 設計レビュー |
| 4 | phase-04.md | 検証戦略（markdown lint / JSON parse / cross-check） |
| 5 | phase-05.md | 執筆ランブック |
| 6 | phase-06.md | 異常系検証（OKLch 非対応 / theme 上書き漏れ等） |
| 7 | phase-07.md | AC マトリクス |
| 8 | phase-08.md | DRY 化（重複排除 / generator 化方針） |
| 9 | phase-09.md | 品質保証（cross-check / lint / token 数） |
| 10 | phase-10.md | 最終レビュー |
| 11 | phase-11.md | 実装 smoke / evidence（NON_VISUAL 代替） |
| 12 | phase-12.md | ドキュメント更新 |
| 13 | phase-13.md | PR 作成 |

## diff scope 規律

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本タスク完了前に以下を必ず確認:

- `git status --short --untracked-files=all` と `git diff --name-only` の出力が、主成果物 `docs/00-getting-started-manual/specs/09b-design-tokens.md`、正本同期 `docs/00-getting-started-manual/specs/00-overview.md`、`09-ui-ux.md`、`09c-primitives.md`、`09f-screen-blueprints-member.md`、親 workflow / task-09 / task-18 の旧 token contract 補正、本 workflow dir、`.claude/skills/aiworkflow-requirements/**` の本 task 同期差分のみで構成されていること
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
