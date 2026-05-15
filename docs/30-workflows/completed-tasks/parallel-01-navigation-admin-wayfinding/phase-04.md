# Phase 4: タスク分解（実装サブタスク化）

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は Phase 2 設計をコード変更可能な SRP サブタスクに分解し、依存・所要時間・DoD を Phase 5 に引き渡す。実装サブタスクは `apps/web` 配下のコード変更を伴う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | PARALLEL-01-NAV admin ナビゲーション動線改善 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | pending |
| visualEvidence | VISUAL |

---

## 目的

Phase 3 設計レビューの GO 判定（OKLch token / encode 徹底 / spec suffix / admin smoke 回帰）を入力として、
全実装作業を**単一責務原則（SRP）**に沿った T1〜T5 のサブタスクに分解し、
各サブタスクの依存・所要時間・DoD を Phase 5 へ引き渡せる形で固定する。

責務境界:

| タスク | 責務 |
| --- | --- |
| PARALLEL-01-NAV（本タスク） | admin sidebar logo→`/` 戻り動線 + members drawer→tags link 追加 |
| 親 workflow `ui-prototype-alignment-mvp-recovery` | 19 routes UI alignment 全体（本タスクはその improvement パッケージ 1 件） |
| 兄弟 improvement パッケージ | 別タスク（本サイクル範囲外） |
| `apps/api` 側 | 改変なし（既存 `/admin/tags` `focusMemberId` 既実装） |

---

## 実行タスク

- [ ] Phase 02/03 成果物（admin-sidebar-logo-design / member-drawer-tag-link-design / test-strategy / design-review）が GO であることを確認する
- [ ] T1〜T5 のサブタスクテーブルを `outputs/phase-04/task-breakdown.md` に固定する
- [ ] 各サブタスクの「変更ファイル候補」「上流依存」「所要時間目安」「DoD」を埋める
- [ ] サブタスク実行順序（クリティカルパス）を `outputs/phase-04/critical-path.md` に図示する
- [ ] T4（Vitest component test）が T2/T3（実装）の後段、T5（Playwright smoke 更新）が T4 の後段にあることを確認する
- [ ] 並列可能性（T2 と T3 は独立実装可能）を critical-path.md に明示する
- [ ] artifacts.json の phase-04 を completed に更新する手順を確認する

---

## サブタスク分解（T1〜T5）

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | 既存ファイルパス実在確認 + ロゴアセット調査 | Phase 1 で記録した想定パスを実 find / grep で確定 | （調査のみ・コード変更なし） | Phase 03 GO | 0.25h | `AdminSidebar.tsx` / `MemberDrawer.tsx` の確定パスが記録され、`apps/web/public/` 配下のロゴアセット有無が判明 |
| T2 | G1-1 AdminSidebar logo link 実装 | sidebar 上部に `<Link href="/" aria-label="ホームに戻る">` を追加（OKLch token / focus-visible 対応） | 編集 `apps/web/src/components/layout/AdminSidebar.tsx` | T1 完了 | 0.5h | link が render され、`mise exec -- pnpm typecheck` / `pnpm lint` PASS、HEX 直書きなし |
| T3 | G1-2 MemberDrawer tag link 実装 | drawer 最下部に `border-t` 区切り section + `<Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}>` を追加 | 編集 `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | T1 完了 | 0.5h | link が render され、`encodeURIComponent` 経由で href 生成、typecheck / lint PASS、HEX 直書きなし |
| T4 | Vitest + RTL component test 更新 / 追加 | T-A1〜T-A5 / T-D1〜T-D6 を `.spec.tsx` で実装（特殊文字 memberId encode case を含む） | 編集 `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx`、新規 `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | T2 / T3 完了 | 1.0h | `mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar` / `MemberDrawer` で全ケース PASS |
| T5 | Playwright admin smoke 更新 + VISUAL evidence 取得 | T-S1〜T-S5 を `admin-smoke.spec.ts` に追加 / 更新し、Phase 11 用スクリーンショット 2 枚を取得 | 編集 `apps/web/playwright/tests/admin-pages.spec.ts`、新規 `outputs/phase-11/admin-sidebar-logo-link.png` / `outputs/phase-11/member-drawer-tags-link.png` | T4 完了 | 1.0h | admin 9 routes 全 open / link 動線 assertion PASS、スクリーンショット 2 枚が `outputs/phase-11/` に保存 |

> **注記**: T1〜T5 は順序依存があり、T2/T3 は T1 完了後に並列実装可能。T4 は T2/T3 双方完了が前提。T5 は T4 完了後の最終回帰。

---

## クリティカルパス

```
T1 ─┬─→ T2 ─┐
    │       ├─→ T4 ─→ T5
    └─→ T3 ─┘
```

並列可能性:

- **T2 と T3 は独立**: 異なるファイル / 異なる feature。並列実装で短縮可能
- **T4 は両方完了が前提**: spec ファイル 2 件を一括追加
- **T5 は最終回帰 + VISUAL 取得**: T4 PASS 後のみ smoke 更新可

| 区間 | 累積時間（直列） | 並列短縮後 |
| --- | --- | --- |
| T1（前提整備） | 0.25h | 0.25h |
| T2 + T3（実装） | 1.0h | 0.5h（並列） |
| T4（component test） | 1.0h | 1.0h |
| T5（smoke + VISUAL） | 1.0h | 1.0h |
| **合計** | **3.25h** | **2.75h** |

---

## 不変条件チェック（CONST_005 準拠）

- [ ] D1 直接アクセスは `apps/api` に閉じる（本タスクは D1 アクセスなし、`apps/api` 変更なし）
- [ ] OKLch token 経由のみ（HEX 直書き / arbitrary color 禁止 / `verify-design-tokens` CI gate pass）
- [ ] test suffix `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止 / `verify-test-suffix` CI gate pass）
- [ ] 新規 API endpoint 追加なし
- [ ] D1 schema 変更なし
- [ ] Google Form schema 変更なし
- [ ] 新規 primitive 生成なし（既存 `<Link>` / `<Drawer>` 再利用）
- [ ] `encodeURIComponent` 徹底（memberId URL embed 全箇所）
- [ ] a11y（`aria-label` / `focus-visible` / keyboard）担保
- [ ] CONST_007: 全 T1〜T5 を本サイクル内で完了させる（持ち越し禁止）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| 既存 `/admin/tags` page | `focusMemberId` searchParam 既実装 | 改修なし。T5 smoke で回帰確認のみ |
| 親 workflow `ui-prototype-alignment-mvp-recovery` | 19 routes scope | 本タスクは improvement パッケージとして独立 PR |
| 既存 Playwright admin smoke | 9 routes 動線回帰 | T5 で新 link assertion 追加 + 既存破壊なし確認 |
| CI gate `verify-design-tokens` | HEX 直書き検出 | T2/T3 でクリア前提 |
| CI gate `verify-test-suffix` | `*.test.*` 検出 | T4 で `*.spec.tsx` のみ使用前提 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 原典 spec |
| 必須 | phase-02.md | 設計仕様 |
| 必須 | phase-03.md | 設計レビュー GO 判定 |
| 必須 | apps/web/src/components/layout/AdminSidebar.tsx | T2 編集対象 |
| 必須 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | T3 編集対象 |
| 必須 | apps/web/app/(admin)/admin/tags/page.tsx | 参照のみ（`focusMemberId` 既実装） |
| 必須 | apps/web/src/styles/tokens.css | OKLch token 正本 |
| 必須 | CLAUDE.md | 不変条件 / test suffix / branch 戦略 |
| 参考 | https://nextjs.org/docs/app/api-reference/components/link | Next.js `<Link>` 仕様 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/task-breakdown.md | T1〜T5 サブタスクテーブル |
| ドキュメント | outputs/phase-04/critical-path.md | 実行順序とクリティカルパス図 / 並列可能性 |
| メタ | artifacts.json | phase-04 を completed に更新 |

---

## 完了条件

- [ ] T1〜T5 が単一責務原則で分解され、各サブタスクが「責務」「変更ファイル候補」「上流依存」「所要時間」「DoD」を持っている
- [ ] T4（component test）が T2/T3（実装）の後段にあることが確認されている
- [ ] T5（smoke + VISUAL）が T4 の後段にあることが確認されている
- [ ] T2 と T3 の並列可能性が critical-path.md に明示されている
- [ ] CONST_005 の不変条件チェックが全 PASS
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
  - T1〜T5 の DoD を Phase 5 で関数シグネチャ・JSX 構造レベルまで具体化する
  - 変更ファイル候補（パス）を Phase 5 の「変更対象ファイル一覧」に転記する
  - クリティカルパスを Phase 5 の実装順序の根拠とする
  - T2/T3 並列実装の手順整理を Phase 5 で具体化する
- ブロック条件: T1〜T5 のいずれかが単一責務でない、または OKLch / spec suffix / encode 不変条件に違反する設計が混入した場合

---

**作成日**: 2026-05-15
