# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 入力 | Phase 1 要件定義 / Phase 2 設計 |
| 判定 | Phase 4 へ進めるか |

## 目的

Phase 2 設計が要件・正本仕様・不変条件と矛盾なく閉じているかを判定し、Phase 4（テスト計画）へのゲートを通す。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
|------|------|------|
| 正本仕様整合 | PASS | 09h §1.6 が既に「/login=shell外 bare」を規定。設計はこの正本へ実装を一致させる drift 解消であり、新仕様の創作ではない。 |
| 責務境界 | PASS | 表示条件の所有を route group（宣言的）へ移し、layout から条件分岐ロジックを排除。SSR pathname の所有を middleware に単一化。 |
| 依存関係 | PASS | 依存（Task A/B/C/E）は dev マージ済み。新規依存なし。 |
| 状態所有権 | PASS | role=server / pathname=middleware→header / collapse=useSidebarState の分離が明確。混在なし。 |
| 不変条件 | PASS | #5（D1 直アクセス禁止）/ #11（admin・profile fail-closed 二段防御）を壊さない。middleware guard ロジックは不変、x-pathname 注入は header 追加のみ。 |
| UI alignment 不変条件 | PASS | 新規 primitive ゼロ（#3）、OKLch トークンのみ（#2）、既存 API surface のみ（#1）。 |
| URL 契約 | PASS | route group はパスに出ず `/login` 不変。redirect/query 契約維持（AC-3）。 |
| import 深度 | 要注意（MINOR） | (public)/login と (auth)/login は同深度で import 不変の見込みだが、移動後に grep 機械確認を Phase 5 に必須化済み。 |
| 回帰リスク | PASS | invariant test（login=shell外）+ middleware spec + layout/shell spec で機械担保。 |

## 検出事項

- **MINOR-1**: route group 移動後の相対 import 破壊リスク。→ Phase 5 Step に「移動後 grep 機械確認」を組込み済み。Phase 4 にも import 解決 smoke を含める。
- **MINOR-2**: `x-pathname` を全 request に付けると static 化が抑止される懸念。→ 該当 route は既に dynamic（session 依存 layout）であり実害なし。redirect レスポンスには付与しない設計を Phase 5 で明記。
- **MINOR-3**: viewer CTA の collapsed 表示。→ icon + sr-only で a11y を担保（Phase 2 §3.1 に反映済み）。

いずれも BLOCKER ではない。Phase 12 の未タスク検出で MINOR の残課題有無を再確認する。

## 4条件 最終評価

| 条件 | 評価 |
|------|------|
| 価値性 | 認証導線の二重化解消 + 全 role でサイドバー表示の予測可能性向上。 |
| 実現性 | 既存 primitives 再利用、新規 primitive ゼロ、1サイクルで完了可能。 |
| 整合性 | 正本 09h へ実装を一致（drift 解消）。route group が表示条件の単一所有者。 |
| 運用性 | invariant/middleware/shell spec で回帰を機械担保。 |

## 判定

**PASS — Phase 4 へ進む。** BLOCKER なし。MINOR 3 件は Phase 4/5 の手順に織り込み済み。

## 参照資料

- Phase 1 / Phase 2
- 09h-shell-and-fixtures.md / 不変条件（CLAUDE.md）

## 完了条件

- [x] 全レビュー観点を判定した（PASS）
- [x] MINOR 検出事項を Phase 4/5 へ織り込んだ
- [x] 4条件を再評価した
- [x] Phase 4 進行可否を判定した（PASS）
