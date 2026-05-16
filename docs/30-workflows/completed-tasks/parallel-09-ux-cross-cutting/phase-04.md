# Phase 4: タスク分解（実装サブタスク化）

[実装区分: 実装仕様書]

> **実装区分判定根拠**: G9-1〜G9-9 の primitive 統一を `apps/web/src/components/ui/`・`apps/web/src/components/admin/`・`apps/web/src/lib/`・`apps/web/src/styles/globals.css` に対し **実コードとして実装する**サブタスクへ分解する Phase。仕様策定単独では完結せず、後続 Phase 5〜8 はここで固定したサブタスクを入力とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー GO 判定) |
| 次 Phase | 5 (実装計画) |
| 状態 | pending |

---

## 目的

Phase 3 設計レビューの GO 判定（FormField / EmptyState 拡張 / Pagination / Icon / Breadcrumb / globals.css `@layer components` 追記 / useAdminMutation 編集）を入力として、全実装作業を **単一責務原則 (SRP)** に沿った T1〜T11 のサブタスクへ分解する。各サブタスクの依存・所要時間・DoD を Phase 5 へ引き渡せる形で固定する。

責務境界（同 workflow 内 兄弟 spec との分担）:

| spec | 責務 | 本タスクとの関係 |
| --- | --- | --- |
| parallel-03-prototype-ux-css | プロトタイプ準拠 token / rhythm / `@layer components` 基盤 | `globals.css @layer components` を共同編集（section コメントで物理的分離） |
| parallel-01〜08（除 03/09） | 各 route 群の UI 実装 | 本タスクが提供する primitive を import して利用 |
| **parallel-09（本タスク）** | **横断 primitive 統一（G9-1〜G9-9）** | parallel-01〜08 の前提として primitive を提供 |

---

## 実行タスク

- [ ] Phase 02/03 成果物（9 設計ドキュメント + 設計レビュー GO 判定）を確認する
- [ ] T1〜T11 のサブタスクテーブルを `outputs/phase-04/task-breakdown.md` に固定する
- [ ] 各サブタスクの「単一責務」「変更ファイル候補」「上流依存」「所要時間目安」「DoD」を埋める
- [ ] サブタスクのクリティカルパスを `outputs/phase-04/critical-path.md` に図示する
- [ ] T7（FormField の `useAdminMutation` 連携テスト）が T6（hook 編集）より後段に配置されていることを確認する
- [ ] parallel-03 との `globals.css` 共同編集ガード（section コメントで物理的分離）が T9 のサブタスクに含まれることを確認する
- [ ] artifacts.json の phase-04 を completed に更新する手順を確認する

---

## サブタスク分解（T1〜T11）

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | FormField primitive 実装 | label + error helper + aria 属性注入の責務のみ | 新規 `apps/web/src/components/ui/FormField.tsx` | Phase 03 GO | 1.0h | `FormFieldProps` 4 props 型確定、`React.cloneElement` で children に `aria-invalid` / `aria-describedby` を注入、`pnpm --filter @ubm-hyogo/web typecheck` PASS |
| T2 | EmptyState 拡張 | 既存 children-only 後方互換を保ちつつ icon/title/description/action props を optional 追加 | 編集 `apps/web/src/components/ui/EmptyState.tsx` | Phase 03 GO | 0.75h | 既存 caller が壊れず、4 props がすべて optional、`<EmptyState>テキスト</EmptyState>` 形式が引き続き動作 |
| T3 | Pagination primitive 実装 | meta 表示 + prev/next button の責務のみ（state 管理は caller） | 新規 `apps/web/src/components/ui/Pagination.tsx` | Phase 03 GO | 0.75h | `PaginationProps` 7 props 確定、`nav[aria-label="pagination"]` で wrap、`total` 未提供時の cursor-only 動作を実装 |
| T4 | Icon primitive 実装 | size convention（sm 12 / md 16 / lg 20 / xl 24px）の責務のみ | 新規 `apps/web/src/components/ui/Icon.tsx` | Phase 03 GO | 0.5h | 4 size を `font-size` 切替で表現、`aria-label` 未指定時は `aria-hidden="true"` 自動付与、既存 `icons.ts` に依存しても干渉しない |
| T5 | Breadcrumb primitive 実装 | nav + ol + 最終項目 `aria-current="page"` の責務のみ | 新規 `apps/web/src/components/admin/Breadcrumb.tsx` | Phase 03 GO | 0.75h | `BreadcrumbItem[]` 受け、`href` 無し項目を `<span aria-current="page">` で render、separator は `aria-hidden="true"` |
| T6 | useAdminMutation hook 編集 | concurrent guard + form state preserve の責務のみ | 編集 `apps/web/src/lib/useAdminMutation.ts` | Phase 03 GO | 1.0h | 既存シグネチャ後方互換、`isLoading` 中の 2nd call は `Promise<undefined>` で reject + toast、エラー時 form state に触れない |
| T7 | globals.css `@layer components` 追記 | G9-1（form-field）/G9-6（responsive 補助）/G9-7（focus-visible + motion-reduce）規則のみ追加 | 編集 `apps/web/src/styles/globals.css` | T1 / T3 / T5 完了 | 0.75h | `/* === parallel-09 G9-x === */` section コメントで分離、HEX 直書きなし、`var(--ubm-color-*)` のみ使用 |
| T8 | Vitest + jest-axe ユニットテスト | 全 primitive の構造 + a11y 違反 0 検証 | 新規 `apps/web/src/components/ui/__tests__/{FormField,EmptyState,Pagination,Icon}.spec.tsx` / `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx` / `apps/web/src/lib/__tests__/useAdminMutation.spec.ts` | T1〜T6 完了 | 1.5h | 6 ファイル全て `*.spec.{ts,tsx}` 命名、jest-axe 違反 0、`mise exec -- pnpm --filter @ubm-hyogo/web test` PASS |
| T9 | parallel-03 との `globals.css` 共同編集ガード | section コメントで物理的に分離して merge conflict を回避 | 編集 `apps/web/src/styles/globals.css` | T7 完了 | 0.25h | parallel-03 spec の section コメント (`/* === parallel-03 G3-x === */`) と本タスク (`/* === parallel-09 G9-x === */`) が連続行で衝突せず、`grep -n "=== parallel-" apps/web/src/styles/globals.css` で両 section が確認できる |
| T10 | Playwright visual smoke 拡張 | primitive 4 種 (FormField error / Pagination disabled / Breadcrumb / Icon 4 サイズ) の visual snapshot 追加 | 編集 `apps/web/e2e/visual.spec.ts`（または同等 file） | T8 完了 | 1.0h | `mise exec -- pnpm --filter @ubm-hyogo/web test:visual` PASS、4 primitive 分の snapshot baseline が登録される |
| T11 | ドキュメント更新 | specs/design-tokens.md 整合確認 + 新規 primitive リファレンス追記 | 編集 `docs/00-getting-started-manual/specs/design-tokens.md`（必要時のみ）/ 新規 `docs/00-getting-started-manual/specs/ui-primitives.md` （任意） | T7 / T9 完了 | 0.75h | 既存 token に不足がないこと、新 primitive の使用例が記録される |

> **注記**: T1〜T6 は並列実行可能（依存なし）。T7 は T1/T3/T5 の DOM 構造確定後に着手。T8 ユニットテストは全 primitive 完成後にまとめて実装。T10 visual は T8 PASS 後。

---

## クリティカルパス

```
T1 (FormField) ─┐
T2 (EmptyState)─┤
T3 (Pagination)─┼─→ T7 (globals.css) ─→ T9 (共同編集ガード) ─┐
T4 (Icon) ──────┤                                            ├─→ T8 (Vitest+axe) ─→ T10 (Playwright) ─→ T11 (Docs)
T5 (Breadcrumb)─┤                                            │
T6 (useAdminMutation) ───────────────────────────────────────┘
```

| 区間 | 累積時間（並列考慮） | 備考 |
| --- | --- | --- |
| T1〜T6（primitive + hook 並列） | 1.0h（最長 T1/T6） | 6 並列で実装 |
| T7〜T9（CSS 統合） | 1.0h | parallel-03 共同編集ガード含む |
| T8（テスト） | 1.5h | 6 spec ファイル一括 |
| T10〜T11（visual + docs） | 1.75h | 最終仕上げ |
| **合計（クリティカルパス）** | **5.25h** | 1 営業日想定 |

---

## 不変条件チェック（CONST_005 準拠）

- [ ] D1 直接アクセスは `apps/api` に閉じる（本タスクは `apps/web` 配下のみで D1 アクセスなし）
- [ ] 既存 API endpoint surface に変更を加えない（`apps/api/src/routes/` 触らない）
- [ ] HEX 直書き禁止（`bg-[#xxx]` / `border-[#xxx]` / `text-[#xxx]` 一切なし）
- [ ] OKLch token 正本（`apps/web/src/styles/tokens.css`）の既存 token のみ参照
- [ ] 新規 test ファイルは `*.spec.{ts,tsx}` 命名（`*.test.*` 禁止）
- [ ] parallel-03 と `globals.css @layer components` の同時編集を section コメントで物理分離
- [ ] CONST_007: 全 T1〜T11 を本サイクル内で完了させる（持ち越し禁止）

---

## 統合連携（横断的影響）

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| parallel-01（公開ディレクトリ） | EmptyState / Pagination 利用 | 本タスク完了後に primitive を import |
| parallel-02（管理 members） | FormField / Breadcrumb / useAdminMutation 利用 | 同上 |
| parallel-03（プロトタイプ準拠 CSS） | `@layer components` 共同編集 | T9 で section コメント分離 |
| parallel-04（attendance） | Pagination 利用 | primitive 提供のみ |
| parallel-05〜08（admin 画面群） | FormField / Breadcrumb / Icon / useAdminMutation 利用 | primitive 提供のみ |
| task-09 (OKLch tokens) | token 不足が判明したら feedback | T11 で確認 |
| task-18 verify-design-tokens CI gate | HEX 直書き 0 件保証 | T8 / T10 で fail しないことを確認 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md | 原典 |
| 必須 | phase-02.md | 9 設計成果物のメタ |
| 必須 | phase-03.md | 設計レビュー GO 判定 |
| 必須 | apps/web/src/styles/tokens.css | OKLch token 正本 |
| 必須 | apps/web/src/styles/globals.css | `@layer components` 既存内容 |
| 必須 | apps/web/src/components/ui/EmptyState.tsx | 既存 primitive（後方互換確認） |
| 必須 | apps/web/src/lib/useAdminMutation.ts | 既存 hook（後方互換確認） |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-* | `@layer components` 共同編集 spec |
| 参考 | https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ | Breadcrumb a11y |
| 参考 | https://www.w3.org/WAI/ARIA/apg/practices/hiding-semantics/ | aria-hidden / aria-label 規約 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/task-breakdown.md | T1〜T11 サブタスクテーブル |
| ドキュメント | outputs/phase-04/critical-path.md | 実行順序とクリティカルパス図 |
| メタ | artifacts.json | phase-04 を completed に更新 |

---

## 完了条件

- [ ] T1〜T11 が単一責務原則で分解され、各サブタスクが「責務」「変更ファイル候補」「上流依存」「所要時間」「DoD」を持っている
- [ ] T7 が T1/T3/T5 完了後に配置されていることが確認されている
- [ ] T8 が T1〜T6 完了後に配置されていることが確認されている
- [ ] T9 で parallel-03 との共同編集ガードが含まれている
- [ ] CONST_005 不変条件チェックが全 PASS
- [ ] outputs/phase-04 配下が artifacts.json と 1 対 1 整合

---

## タスク 100% 実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-04 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 5（実装計画）
- 引き継ぎ事項:
  - T1〜T11 の DoD を Phase 5 で関数シグネチャ・型定義レベルまで具体化する
  - 変更ファイル候補（パス）を Phase 5 の「変更対象ファイル一覧」に転記する
  - クリティカルパスを Phase 5 の実装順序の根拠とする
  - parallel-03 共同編集リスクを Phase 5 のリスク章に転記する
- ブロック条件: T1〜T11 のいずれかが単一責務でない、または `@layer components` 共同編集ガードが設計に含まれていない場合
