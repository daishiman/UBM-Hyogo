[実装区分: ドキュメントのみ]

# task-19-w2-primitives-full-spec - タスク仕様書 index

> 理由: task-19 の主成果物は純粋なドキュメント作成で完結する。2026-05-07 review cycle では `apps/api/src/repository/identity-conflict.ts` の隣接コード差分も検出したため、task-19 本体の evidence から分離して扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | primitives-full-spec |
| ディレクトリ | docs/30-workflows/task-19-w2-primitives-full-spec |
| Wave | W2 |
| 実行種別 | parallel（task-06 / task-07 / task-08 / task-20 / task-21 / task-22 と並列実行可） |
| 作成日 | 2026-05-07 |
| 担当 | Tech Writer |
| 状態 | spec_created（Phase 1〜12 completed / Phase 13 blocked_pending_user_approval） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| scope | 単一の markdown 仕様書 `docs/00-getting-started-manual/specs/09c-primitives.md` の新規作成（600〜1200 行）。隣接コード差分は review-cycle evidence として分離 |
| coverage AC | **適用外（pure-docs / NON_VISUAL タスク）** |
| const ref | CONST_005（仕様書必須項目）/ CONST_007（単一サイクル）/ CONST_004 例外（docs-only） |

## 目的

`docs/00-getting-started-manual/claude-design-prototype/primitives.jsx`（272 行・凍結正本）に存在する全 primitive component の **完全仕様書** `docs/00-getting-started-manual/specs/09c-primitives.md` を新規作成する。各 primitive について「JSX inline 一字一句転記 + props 表 + variants/sizes/states + a11y 仕様 + token 参照名 + link」を 1 セクションに閉じ込め、後続 task-10（ui-primitives 実装）が「09c §X.Y を読んで 1 ファイル書ける」決定論的状態を作る。

## スコープ

### 含む
- primitives.jsx 全 primitive / helper の仕様化（§1〜§18 + §99）
- §99 不採用 primitive 列挙（TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage）
- 09b（値）/ 09a（mapping）/ 09e/09f/09g（採用例）への link 整備
- markdown 構造検証 + 視覚値混入禁止 grep gate の手順整備

### 含まない
- token 値の決定（task-08 / 09b 側責務）
- prototype 行範囲 mapping 表（task-07 / 09a 側責務）
- feature component の仕様（task-20/21/22 / 09e/09f/09g 側責務）
- 実装コード（task-10）
- Storybook 環境構築

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-01（scope-gate-all-screens） | 完了が前提 |
| 下流 | task-10（ui-primitives 実装） | 本仕様に従って primitive を実装 |
| 下流 | task-11..17（各画面実装） | primitive 採用箇所として 09c を参照 |
| 下流 | task-06（contract） | link 先として参照 |
| 並列 | task-06 / task-07 / task-08 / task-20 / task-21 / task-22 | primitive 1 軸に責務が閉じる |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/primitives.jsx | JSX 転記元（272 行・凍結） |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/styles.css | class 名出典のみ（値転記禁止） |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | タスク正本 |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-07-w2-par-prototype-mapping-table.md | task-07 link 先 contract（09a は並列生成物） |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-08-w2-par-design-tokens-doc.md | task-08 link 先 contract（09b は並列生成物） |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 正本順位 |

## 受入条件 (AC)

- AC-1: `09c-primitives.md` が新規作成され 600〜1200 行に収まる
- AC-2: §1〜§18 + §99 の grep 可能見出しが揃う（`primitives.jsx` の実在 const-based primitive / helper set に合わせる）
- AC-3: 各 §X に X.1〜X.6 の 6 サブセクションが揃う（prototype 由来 / props / variants / a11y / token 参照 / link）
- AC-4: HEX (`#xxx`) / `oklch(` / `Npx` / `bg-[` が grep 0 件（タスク正本 §6.2 視覚値混入禁止）
- AC-5: icon-only Button / IconBtn の `aria-label` 必須が §1.4 / 関連 § に明記
- AC-6: dialog / drawer / modal で `role="dialog"` + `aria-modal="true"` + focus trap + Esc close が記述
- AC-7: §99 に TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage の 3 件列挙
- AC-8: 09b / 09a / 09e/09f/09g への link が全 primitive で記述
- AC-9: primitives.jsx は **凍結正本**として一切改変しない（不変条件 1）
- AC-10: JSX inline 転記は prototype excerpt を保持し、visual spec は token 名へ正規化する（値リテラルは残さない）
- AC-11: token 値（HEX / oklch / px）を本ファイルに 0 件含める（不変条件 3）
- AC-12: 値が必要な箇所は token 名（`--ubm-color-accent` 等）で参照し 09b への link を併記（不変条件 4）
- AC-13: EDITMODE 専用 primitive を §99 に列挙し本仕様から除外（不変条件 5）
- AC-14: `aria-*` / `role` を WAI-ARIA Authoring Practices に整合（不変条件 6）
- AC-15: icon-only Button は `aria-label` 必須（不変条件 7）
- AC-16: markdown lint で error 0
- AC-17: primitive / helper 列挙漏れなし（`rg -n '^const ' primitives.jsx` で抽出した checklist との照合）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト作成（markdown 構造検証 / grep gate） | phase-04.md | completed | outputs/phase-04/main.md, outputs/phase-04/verify-scripts.md |
| 5 | 実装（09c-primitives.md 執筆） | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | テスト実行（grep gate / markdown lint） | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | 検証項目網羅性 | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | refactor / DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke test (NON_VISUAL 縮約) | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md |
| 13 | PR作成（要承認） | phase-13.md | blocked_pending_user_approval | outputs/phase-13/main.md |

> **status policy**: Phase 1〜12 は本サイクルで実体化済み。Phase 13 はユーザー承認まで blocked_pending_user_approval。

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント（最終） | docs/00-getting-started-manual/specs/09c-primitives.md | primitive 完全仕様（600〜1200 行・新規） |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-01.md..phase-13.md | Phase 別仕様 |
| 検証スクリプト | scripts/verify-09c-no-visual-values.sh | 視覚値混入禁止 + placeholder 禁止 + §99 必須項目 gate |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1〜AC-17 が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- §6.2 視覚値混入禁止 grep gate が exit 0
- markdown 構造検証 grep が期待値（numbered heading 18+、§99 1 件、JSX block 17+）を満たす
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../ui-prototype-alignment-mvp-recovery/SCOPE.md
- タスク正本: ../ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md
- JSX 転記元: ../../00-getting-started-manual/claude-design-prototype/primitives.jsx
- 出力先（最終成果物）: ../../00-getting-started-manual/specs/09c-primitives.md
