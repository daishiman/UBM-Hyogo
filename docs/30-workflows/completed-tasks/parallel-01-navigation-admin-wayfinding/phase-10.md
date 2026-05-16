[実装区分: 実装仕様書]

# Phase 10: 後付けリファクタ（最小スコープ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | PARALLEL-01-NAV admin sidebar logo→/ 戻り動線 + members drawer→tags link |
| タスクID | PARALLEL-01-NAV |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 後付けリファクタ（最小スコープ） |
| 前 Phase | 9 (受入確認) |
| 次 Phase | 11 (VISUAL evidence) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | `AdminSidebar.tsx` / `MemberDrawer.tsx` の link 追加差分に対して、最小スコープで重複検出 / token placeholder 0 件 gate / 既存 layout components との整合確認を行う Phase。本タスクは小規模だがリファクタ範囲確定は本番影響に直結するため実装仕様書として残す。 |

---

## 目的

Phase 9 で AC 全通過した実装差分を対象に、**仕様書段階での計画のみ**を行う最小スコープリファクタ。
本 Phase ではコード再構成は実施せず、以下を文書化する:

1. 重複検出（LogoLink を独立コンポーネントに切り出すかの判定）
2. 既存 layout components との整合確認
3. design tokens placeholder grep 0 件 gate（`token-sized` / `09b-token-value` / 任意の `bg-[#xxx]` / `text-[#xxx]` 直書き）
4. 不採用候補の根拠

> リファクタ範囲は最小限。リファクタ実施そのものは本タスクスコープ外で、別 followup を起票する基準のみ示す。

---

## 10-1. リファクタ判定マトリクス

| 観点 | 判定基準 | 該当時の対応 |
| --- | --- | --- |
| `AdminSidebar.tsx` の logo link JSX の行数 | 15 行超 | `LogoLink` コンポーネントを `apps/web/src/components/layout/` 配下に切り出す候補 |
| logo link の再利用箇所 | 2 箇所以上で同等 JSX が出現 | 切り出し採用 |
| logo link の再利用箇所 | 1 箇所のみ（本タスク導入箇所のみ） | 切り出し **不採用**（YAGNI） |
| `MemberDrawer.tsx` 内 tags link JSX の行数 | 10 行超 | `TagManagementLink` の切り出しを検討 |
| tags link の再利用候補 | 他 drawer や detail view での流用予定 | 切り出し採用 |
| token placeholder grep | `token-sized` / `09b-token-value` / `bg-[#` / `text-[#` のいずれかが hit | Phase 3 まで差し戻し（リファクタではなく実装不備） |
| 既存 layout components 整合 | `apps/web/src/components/layout/` 配下の既存 Logo / NavLink 等と命名 / props 形が重複 | 既存 components 採用へ寄せる |

---

## 10-2. 抽出候補と判定

### 候補 A: AdminSidebar logo link を `LogoLink` 独立コンポーネント化

| 項目 | 内容 |
| --- | --- |
| 抽出先候補 | `apps/web/src/components/layout/LogoLink.tsx` |
| 判定 | **不採用（仕様書段階）** |
| 根拠 | 親仕様（spec.md §4.1）の JSX は 4〜6 行程度で、現時点では本タスク導入の 1 箇所でしか使われない。YAGNI に則り premature abstraction を回避 |
| 将来切り出し条件 | (a) 同等 logo link を public layout や member layout でも採用する需要が出る、または (b) logo link の variant（size / icon-only / text+icon）が 2 種以上必要になった時点で別 followup を起票 |

### 候補 B: MemberDrawer の tags link を `TagManagementLink` に切り出し

| 項目 | 内容 |
| --- | --- |
| 抽出先候補 | `apps/web/src/features/admin/components/_members/TagManagementLink.tsx` |
| 判定 | **不採用（仕様書段階）** |
| 根拠 | spec.md §4.2 の JSX は 5〜7 行で、drawer 内 1 箇所のみで使用。再利用候補は現時点で皆無 |
| 将来切り出し条件 | 会員一覧の row inline action や、members 詳細 page 化で同等 link が必要になった時点で起票 |

### 候補 C: 既存 layout components 整合

| 項目 | 内容 |
| --- | --- |
| 確認対象 | `apps/web/src/components/layout/` 配下の既存 `Logo*` / `*NavLink` / sidebar 関連 component |
| 判定 | **既存命名と衝突しない範囲で最小実装** |
| 根拠 | spec.md §4.1 は AdminSidebar 内部 JSX に直接 `<Link href="/">` を埋め込む方針。新規 component 追加なしで衝突は発生しない |
| 不採用パターン | 既存に `LogoLink` が存在し命名衝突する場合は、本タスクでは既存に寄せて流用する |

---

## 10-3. 既存 layout components 整合確認

### 確認コマンド

```bash
# 既存 layout 配下の component 列挙
ls apps/web/src/components/layout/

# Logo / Link 系の既存定義を grep
grep -rn "export function Logo" apps/web/src/components/layout/ || echo "no existing Logo*"
grep -rn "export function .*Link" apps/web/src/components/layout/ || echo "no existing *Link"

# AdminSidebar.tsx 内の既存 import 確認
grep -n "^import" apps/web/src/components/layout/AdminSidebar.tsx
```

### 期待

- 既存に `Logo` / `LogoLink` が存在する場合 → そちらを import して `href="/"` を passthrough
- 既存に該当 component がない場合 → 本タスクでは inline `<Link href="/">` のまま保持
- 既存 `*NavLink` と spec.md §4.1 の class 命名 (`logo-link` / `admin-sidebar__home`) が衝突しないこと

---

## 10-4. design tokens placeholder grep 0 件 gate

CLAUDE.md「OKLch トークン正本化」不変条件に従い、以下 grep が **全て 0 件** であることを確認する:

```bash
# placeholder 文字列
grep -rn "token-sized" apps/web/src/components/layout/AdminSidebar.tsx \
  apps/web/src/features/admin/components/_members/MemberDrawer.tsx \
  || echo "OK: token-sized 0 件"
grep -rn "09b-token-value" apps/web/src/components/layout/AdminSidebar.tsx \
  apps/web/src/features/admin/components/_members/MemberDrawer.tsx \
  || echo "OK: 09b-token-value 0 件"

# HEX 直書き / arbitrary value
grep -rnE "bg-\[#[0-9a-fA-F]" apps/web/src/components/layout/AdminSidebar.tsx \
  apps/web/src/features/admin/components/_members/MemberDrawer.tsx \
  || echo "OK: bg-[# 0 件"
grep -rnE "text-\[#[0-9a-fA-F]" apps/web/src/components/layout/AdminSidebar.tsx \
  apps/web/src/features/admin/components/_members/MemberDrawer.tsx \
  || echo "OK: text-[# 0 件"

# OKLch tokens.css 由来の CSS variable のみ使う
grep -nE "var\(--ubm-color-" apps/web/src/features/admin/components/_members/MemberDrawer.tsx
# 期待: link color などが var(--ubm-color-accent) 等で記述されている
```

**判定:** いずれかが hit したら Phase 3（実装）へ差し戻し。本 Phase は完了させない。

---

## 10-5. 変更対象ファイル一覧（本 Phase の調査範囲のみ）

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/src/components/layout/AdminSidebar.tsx` | **変更なし** — リファクタ計画段階。10-1 マトリクス基準で切り出し不採用 |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | **変更なし** — 同上 |
| `apps/web/src/components/layout/` 配下 | **変更なし** — 既存 Logo / NavLink との整合確認のみ |

> 仕様書段階のため新規ファイル追加なし。将来切り出し条件のみ 10-2 / 10-7 に記録。

---

## 10-6. テスト方針 / 検証コマンド

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| 静的 | `mise exec -- pnpm typecheck` | PASS |
| 静的 | `mise exec -- pnpm lint` | PASS |
| unit | `mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer` | Phase 9 と同じく PASS（振る舞いを変えていない） |
| token gate | 10-4 grep 4 種 | 全 0 件 |
| 既存 layout 整合 | 10-3 grep | 衝突なし |
| design-tokens CI gate | `verify-design-tokens`（task-18 / CLAUDE.md 不変条件） | PASS |

---

## 10-7. リグレッション防止

| リスク | 対策 |
| --- | --- |
| 切り出し不採用判断が将来「実は重複だった」になる | 10-2 将来切り出し条件を明記。需要発生時に followup 起票 |
| design tokens placeholder が CI gate をすり抜ける | 10-4 ローカル grep を Phase 10 DoD に含め、CI gate `verify-design-tokens` と二重防御 |
| 既存 layout components との命名衝突 | 10-3 grep を Phase 10 DoD に含める |

---

## 10-8. DoD

- [ ] 10-1 リファクタ判定マトリクス全項目で判定が記録されている
- [ ] 10-2 候補 A / B / C の採否が記録されている
- [ ] 10-3 既存 layout components 整合確認 grep を実行し結果が記録されている
- [ ] 10-4 token placeholder grep が 4 種全て 0 件
- [ ] `outputs/phase-10/refactor-summary.md` に before/after 行数 + 抽出候補一覧 + 不採用根拠 + 将来切り出し条件が記録
- [ ] typecheck / lint / unit test が Phase 9 と同じ結果（振る舞い不変）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 | AC 受入で観察された改善点をマトリクス判定に反映 | 観察事項の取り込み |
| Phase 11 | リファクタ後（実質は不採用継続）の状態で screenshot 取得 | screenshot 経路 SSOT |
| Phase 12 | 不採用根拠を `documentation-changelog.md` に記録 | 申し送り |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 親仕様 |
| 必須 | CLAUDE.md「UI prototype alignment / 不変条件」 | OKLch tokens 正本化 / HEX 直書き禁止 |
| 必須 | apps/web/src/styles/tokens.css | OKLch tokens 正本（task-09） |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | design tokens 仕様（task-08） |
| 参考 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-10.md | リファクタ判定マトリクスの記述フォーマット |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/refactor-summary.md | リファクタ判定マトリクス + 抽出候補採否 + token gate 結果 + 将来切り出し条件 |
| メタ | artifacts.json | phase-10 を completed に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-10 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 11（VISUAL evidence）
- 引き継ぎ事項:
  - 候補 A / B の将来切り出し条件 → 次回リファクタ起票のトリガー基準
  - token placeholder grep が 0 件 → Phase 11 screenshot で OKLch tokens 実画面適用済みを示せる前提が整う
- ブロック条件: 10-4 token gate に hit / `AdminSidebar.tsx` または `MemberDrawer.tsx` で振る舞い変更 diff が混入

---

作成日: 2026-05-15
