# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | PARALLEL-01-NAV |
| タスク名 | parallel-01-navigation — admin 動線（sidebar logo / members→tags drawer link） |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | pending |
| 実装区分 | **実装仕様書** |
| taskType | implementation |
| visualEvidence | VISUAL |
| 実装区分 判定根拠 | `apps/web/src/components/layout/AdminSidebar.tsx` と `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` の **実コードを編集**し、対応する `*.spec.tsx` を新規追加する実装仕様。Phase 5 はその着手前の変更対象・関数シグネチャ・着手順序を CONST_005 必須項目で固定する。 |

---

## 目的

ソース仕様 `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md` の §3〜§10 を、
Phase 6（実装手順）が即着手できる粒度まで展開する。
本 Phase の中心成果物は `outputs/phase-05/implementation-plan.md` で、変更対象ファイル / 関数シグネチャ / 入出力・副作用 / リスク / 着手順序を CONST_005 で固定する。

---

## 5-1. 変更対象ファイル一覧

spec.md §3 を実装区分付きで展開する。

| 種別 | パス | 役割 | 対応スコープ |
| --- | --- | --- | --- |
| 編集 | `apps/web/src/components/layout/AdminSidebar.tsx` | `<nav>` 直下に `<Link href="/" aria-label="ホームに戻る">` を追加（sidebar 上部のロゴ領域として配置） | G1-1 |
| 編集 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | drawer 内 footer 相当の位置に `<Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}>` を追加 | G1-2 |
| 編集 | `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | logo link の href / aria-label / keyboard focus 検証 | G1-1 |
| 新規 | `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | drawer 内 link の href / encode / link text 検証 | G1-2 |
| 参照（変更なし） | `apps/web/app/(admin)/layout.tsx` | admin grid layout 構造の確認用。本タスクでは編集しない | — |
| 参照（変更なし） | `apps/web/app/(admin)/admin/tags/page.tsx` | 既に `const focusMemberId = sp["memberId"]` で searchParam 受領済み（spec.md §4.2）。**改修不要** | — |

> 削除ファイルなし。`apps/api/` 配下の変更なし。D1 schema 変更なし。新規 endpoint 追加なし。

---

## 5-2. 関数・型シグネチャ（spec.md §5 引用展開）

### AdminSidebar.tsx

既存 export シグネチャは不変。return JSX に Link 要素を追加する差分のみ。

```typescript
export function AdminSidebar(): JSX.Element {
  // return: <nav> の直下（既存 items <ul> の上）に
  //   <Link href="/" aria-label="ホームに戻る" className="logo-link">…</Link>
  // を追加する
}
```

### MemberDrawer.tsx

Props 不変。return JSX に新規 section（タグ管理リンク）を追加する。

```typescript
export interface MemberDrawerProps {
  readonly memberId: string;
  readonly onClose: () => void;
}

export function MemberDrawer({ memberId, onClose }: MemberDrawerProps): JSX.Element {
  // 既存 sections 末尾に下記 section を追加:
  //   <Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}
  //         className="text-sm font-medium text-[var(--ubm-color-accent)]">
  //     タグ管理へ
  //   </Link>
  // onClose の明示呼び出しは不要（next/link の page transition で drawer は自動 unmount）
}
```

---

## 5-3. 入出力・副作用（spec.md §6 引用展開）

### G1-1 sidebar logo link

| 項目 | 内容 |
| --- | --- |
| 入力 | ユーザーの click。keyboard 操作（focused 状態で Enter / Space） |
| 出力 | `/` への navigation |
| 副作用 | browser history に `/` entry を push / admin layout → root layout への transition / focus 移動は Next.js デフォルト挙動に従う |
| a11y | `aria-label="ホームに戻る"` で intent を明確化。focus-visible で `outline-2 outline-offset-2 outline-[var(--ubm-color-accent)]` を適用 |

### G1-2 drawer members→tags link

| 項目 | 内容 |
| --- | --- |
| 入力 | drawer 内 link の click / keyboard 操作（Enter / Space） |
| 出力 | `/admin/tags?memberId={encodeURIComponent(memberId)}` への navigation。drawer は page transition の unmount で自動 close |
| 副作用 | history push のみ。`onClose` callback を本リンク側から明示的に呼ばない（spec.md §6 方針） |
| a11y | link text 「タグ管理へ」が action label として可読。`var(--ubm-color-accent)` で視覚階層を確立 |

---

## 5-4. リスクと対応（spec.md §10 引用展開）

| リスク | 対応 |
| --- | --- |
| logo link の配置が prototype と乖離し UX が崩れる | デザインプロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）の sidebar 上部 sizing と padding に揃える。primitives + tokens 経由で実装する |
| `memberId` の URL encode 漏れによる broken link / XSS surface | `encodeURIComponent()` を必ず通す。Phase 7 component test で `@` `/` `#` などの special char を含む memberId を 1 ケース以上検証する |
| drawer close の二重発火（link クリック時に onClose も走る） | onClose は明示呼び出しせず、next/link の page transition による unmount に統一する |
| 既存 admin smoke E2E（9 routes 巡回）を破壊 | smoke を拡張して `/admin/members → drawer open → link click → /admin/tags` の遷移を 1 シナリオ追加。既存 9 routes 検証は維持する |
| HEX 直書きで `verify-design-tokens` gate を踏む | 色は `var(--ubm-color-accent)` / `var(--ubm-color-accent)` 等の OKLch トークン経由のみ。`bg-[#xxx]` / `text-[#xxx]` 禁止 |

---

## 5-5. 着手順序

| 順 | ステップ | 完了判定 |
| --- | --- | --- |
| 1 | 既存ファイル実在確認（`AdminSidebar.tsx` / `MemberDrawer.tsx` / `app/(admin)/admin/tags/page.tsx` の `focusMemberId` ハンドリング） | 3 ファイルとも present、tags page 側に `sp["memberId"]` の読み出しが存在することを目視確認 |
| 2 | `AdminSidebar.tsx` に `<Link href="/" aria-label="ホームに戻る">` を追加 | typecheck / lint PASS |
| 3 | `AdminSidebar.component.spec.tsx` を更新（href / aria-label / focus 順序） | vitest PASS |
| 4 | `MemberDrawer.tsx` に `<Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}>` を追加 | typecheck / lint PASS |
| 5 | `MemberDrawer.spec.tsx` を新規追加（href / encode / link text） | vitest PASS、special char ケース含む |
| 6 | admin smoke の手動確認（`/admin` → logo クリック → `/`、`/admin/members` → drawer → link → `/admin/tags?memberId=...`） | 双方の遷移が prototype と整合 |

---

## 5-6. 不変条件チェック

- [ ] `apps/api/` 配下のコード変更を行わない（既存 API endpoint surface のみ利用）
- [ ] D1 schema 変更 / 新規 endpoint 追加を行わない
- [ ] HEX 直書き禁止（`var(--ubm-color-*)` トークン経由）
- [ ] `127.0.0.1:8888` などローカル限定エンドポイントを `apps/web/src` に焼き込まない
- [ ] 新規 test ファイルは `*.spec.{ts,tsx}` で命名（`*.test.{ts,tsx}` 禁止）
- [ ] プロトタイプ未掲載画面でも新規 primitive を生やさない

---

## 5-7. 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 仕様正本（§3〜§10） |
| 必須 | apps/web/src/components/layout/AdminSidebar.tsx | 編集対象 |
| 必須 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | 編集対象 |
| 参照 | apps/web/app/(admin)/admin/tags/page.tsx | `focusMemberId` 受領実装の確認 |
| 参照 | docs/00-getting-started-manual/claude-design-prototype/ | sidebar 上部配置の prototype 正本 |
| 参照 | apps/web/src/styles/tokens.css | `--ubm-color-accent` / `--ubm-color-accent` |

---

## 5-8. 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | CONST_005 必須項目を満たす実装計画 |
| メタ | artifacts.json | phase-05 を completed に更新 |

---

## 5-9. 完了条件

- [ ] 5-1 変更対象 4 ファイル（編集 2 / 新規 2）が確定
- [ ] 5-2 関数シグネチャが `AdminSidebar` / `MemberDrawer` 共に既存 export 不変で固定
- [ ] 5-3 入出力・副作用と a11y 要件が記述
- [ ] 5-4 リスク 5 件と対応が記述
- [ ] 5-5 着手順序が 1〜6 の連番で確定
- [ ] 不変条件 6 項目が手順内チェックリストとして保持

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-05 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 6（実装手順）
- 引き継ぎ事項:
  - 5-2 のシグネチャを Phase 6 で JSX 差分まで具体化
  - 5-5 着手順序 (1)〜(6) を S1〜S6 のステップ仕様に展開
  - 5-4 のリスクのうち「memberId encode」「drawer close 二重発火」は Phase 7 テスト計画で必須ケース化

---

作成日: 2026-05-15
