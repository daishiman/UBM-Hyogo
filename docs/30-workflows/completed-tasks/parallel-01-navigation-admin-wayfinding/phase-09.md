[実装区分: 実装仕様書]

# Phase 9: 受入確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | PARALLEL-01-NAV admin sidebar logo→/ 戻り動線 + members drawer→tags link |
| タスクID | PARALLEL-01-NAV |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 受入確認 |
| 前 Phase | 8 (ドキュメント反映) |
| 次 Phase | 10 (後付けリファクタ) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | `apps/web` の AdminSidebar / MemberDrawer 両 component に link を追加した実装差分を、index.md で定義した受入基準 (AC) に照らして実機 / ローカル両面で受入確認する Phase。実コードと振る舞いを評価するため実装仕様書として扱う。 |

---

## 目的

Phase 1〜7 で実装した以下 2 つの動線を、index.md の AC 5〜7 件に照らして受入確認する。

- G1-1: `AdminSidebar.tsx` 上部 logo → `/` 戻り動線
- G1-2: `MemberDrawer.tsx` から `/admin/tags?memberId={memberId}` 遷移リンク

本 Phase は次 Phase（後付けリファクタ）に進む唯一のゲート。

---

## 9-1. 受入対象 Acceptance Criteria（AC）

`index.md` の AC-1〜AC-7 を SSOT として受入する。Phase 9 独自の AC 番号は作らない。

| AC ID | 内容 | 観点 |
| --- | --- | --- |
| AC-1 | AdminSidebar home link | 動線存在 |
| AC-2 | MemberDrawer tags link | 動線存在 |
| AC-3 | `memberId` URL encoding | 安全性 |
| AC-4 | OKLch token only | design token |
| AC-5 | a11y requirements | accessibility |
| AC-6 | design review output | process |
| AC-7 | task breakdown / critical path output | process |

---

## 9-2. 着手前提チェックリスト

| # | 確認項目 | 確認方法 | 期待 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | Phase 1〜7 が completed | `artifacts.json` 確認 | phase-01〜07 が completed | [ ] |
| 2 | typecheck PASS | `mise exec -- pnpm typecheck` | 全 PASS | [ ] |
| 3 | lint PASS | `mise exec -- pnpm lint` | 全 PASS | [ ] |
| 4 | unit test PASS | `mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer` | 両 spec PASS | [ ] |
| 5 | feature ブランチが dev 起点 | `git log --oneline dev..HEAD` | dev 起点で commit 列が確認可 | [ ] |
| 6 | `/admin/tags/page.tsx` の `focusMemberId` searchParam handling が存在 | `grep -n 'focusMemberId' apps/web/src/app/\(admin\)/admin/tags/page.tsx` | 該当行が hit | [ ] |

> 全項目 [x] になるまで受入手順に進まない。

---

## 9-3. 各 AC の検証方法

### AC-1 / AC-3: 動線存在（component test）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.spec
```

**期待:**
- `AdminSidebar.component.spec.tsx` で `getByRole('link', { name: 'ホームに戻る' })` が解決
- `MemberDrawer.spec.tsx` で `getByRole('link', { name: /タグ管理/ })` が解決し `href` 属性に `/admin/tags?memberId=` を含む

### AC-2: keyboard a11y

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar
```

**期待:**
- Tab focus 後に `:focus-visible` ルール由来の outline が computed style に乗る（または `data-state="focused"` 等の assertion で代替）
- `aria-label="ホームに戻る"` が attribute level で確認できる

### AC-4: encodeURIComponent

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.spec
```

**期待:**
- 特殊文字を含む memberId（例: `member/@id`）を props で渡したケースで、link `href` が `/admin/tags?memberId=member%2F%40id` のように percent-encoded となる

### AC-5: 既存 contract 維持

ローカル手動 + E2E smoke:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# http://localhost:3000/admin/members → 任意会員行クリック → drawer → タグ管理リンク → 遷移
# /admin/tags?memberId=<id> で TagQueuePanel に focusMemberId が反映されることを目視確認
```

**期待:**
- 遷移後の URL に `?memberId=<id>` が残る
- `apps/web/src/app/(admin)/admin/tags/page.tsx` の `focusMemberId` 経路が破壊されていない

### AC-6: regression（E2E smoke）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-smoke
```

**期待:**
- 全 9 admin routes (dashboard / attendance / members / tags / schema / meetings / requests / identity-conflicts / audit) で navigation が成立
- console error / 404 が出ない

---

## 9-4. 検証コマンド一覧

| 種別 | コマンド | 目的 |
| --- | --- | --- |
| 静的 | `mise exec -- pnpm typecheck` | 型整合 |
| 静的 | `mise exec -- pnpm lint` | lint PASS |
| unit | `mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar` | AC-1 / AC-2 |
| unit | `mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer` | AC-3 / AC-4 |
| 手動 | dev サーバ起動して `/admin/members` → drawer → tags 遷移 | AC-5 |
| E2E | `playwright test admin-smoke` | AC-6 |
| evidence | `outputs/phase-09/acceptance.md` | 受入結果 SSOT |

---

## 9-5. 受入結果記録テンプレート（acceptance.md 雛形）

`outputs/phase-09/acceptance.md` には以下構造で記録する:

```markdown
# Phase 9 受入結果

## 実施日時

YYYY-MM-DD HH:MM (JST)

## 環境

- Node: <node -v 出力>
- pnpm: <pnpm -v 出力>
- ブランチ: <git rev-parse --abbrev-ref HEAD>
- HEAD: <git rev-parse HEAD>

## AC 突合表

| AC ID | 検証コマンド / 手順 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | AdminSidebar.component.spec | link 解決 | _実測_ | [ ] |
| AC-2 | AdminSidebar.component.spec | focus-visible / aria-label | _実測_ | [ ] |
| AC-3 | MemberDrawer.spec | link 解決 + href 形 | _実測_ | [ ] |
| AC-4 | MemberDrawer.spec(special char) | percent-encoded href | _実測_ | [ ] |
| AC-5 | localhost 手動 | focusMemberId 反映 | _実測_ | [ ] |
| AC-6 | playwright admin-smoke | 9 routes PASS | _実測_ | [ ] |

## 実行ログ抜粋

(typecheck / lint / unit / e2e の最終 line を貼り付け)

## 不適合 / 観察事項

- なし / あれば Phase 10 リファクタ対象として記録

## 判定

- [ ] 全 AC PASS → Phase 10 へ
- [ ] 1 件以上 FAIL → Phase 2〜3 へ差し戻し
```

---

## 9-6. AC 突合表（Phase 9 完了時に埋める）

| AC ID | 検証 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | 9-3 AC-1 | link 解決 | _実測転記_ | [ ] |
| AC-2 | 9-3 AC-2 | focus-visible + aria-label | _実測転記_ | [ ] |
| AC-3 | 9-3 AC-3 | drawer link 解決 | _実測転記_ | [ ] |
| AC-4 | 9-3 AC-4 | percent-encoded href | _実測転記_ | [ ] |
| AC-5 | 9-3 AC-5 | focusMemberId 反映 | _実測転記_ | [ ] |
| AC-6 | 9-3 AC-6 | 9 routes PASS | _実測転記_ | [ ] |

---

## 9-7. ロールバック / 差し戻し条件

| 条件 | 退避手順 |
| --- | --- |
| AC-1 / AC-3 のいずれかが FAIL | Phase 2〜3 へ差し戻し。component 構造を再確認 |
| AC-2 が FAIL | Phase 3 で focus-visible utility / `aria-label` 配線を再確認 |
| AC-4 が FAIL | `MemberDrawer.tsx` で `encodeURIComponent(memberId)` を確実に通す形に修正 |
| AC-5 が FAIL | `apps/web/src/app/(admin)/admin/tags/page.tsx` 側を **触らず**、drawer 側 link href の構築を見直す |
| AC-6 が FAIL | 該当 route の navigation を grep し、layout 変更で副作用が出ていないか確認。最悪 link 追加箇所を revert |

> 親仕様（improvements/parallel-01-navigation/spec.md「10. リスク・制約」）の対策方針に従う。

---

## 9-8. DoD

- [ ] 9-2 着手前提 6 項目全 [x]
- [ ] 9-3 各 AC の検証コマンドを実行し結果を取得
- [ ] 9-6 AC 突合表が全 [x]（実測値が「期待」と一致）
- [ ] `outputs/phase-09/acceptance.md` に受入結果が記録
- [ ] 9-7 ロールバック条件が文書化されている

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 10 | AC 受入で観察された改善点をリファクタ候補に記録 | 観察事項として Phase 10 に申し送り |
| Phase 11 | 9-3 AC-5 の手動確認動線を screenshot 取得導線に再利用 | 経路 SSOT |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 親仕様（AC / DoD / リスク） |
| 必須 | apps/web/src/components/layout/AdminSidebar.tsx | 変更対象 1 |
| 必須 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | 変更対象 2 |
| 必須 | apps/web/src/app/(admin)/admin/tags/page.tsx | `focusMemberId` 既存 contract 確認 |
| 必須 | CLAUDE.md「UI prototype alignment」 | 不変条件（既存 API のみ接続 / 既存 endpoint surface） |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/acceptance.md | AC 突合表 + 実測 + 観察事項 |
| メタ | artifacts.json | phase-09 を completed に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-09 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 10（後付けリファクタ）
- 引き継ぎ事項:
  - 9-3 各 AC 実測で観察した「重複コード / token placeholder / a11y 改善」候補を Phase 10 へ送る
  - logo link を独立コンポーネントに切り出すべきかの判断材料（AC-1 / AC-2 実測ログ）を Phase 10 で再評価
- ブロック条件: AC のいずれかが FAIL → Phase 10 に進まず実装 Phase へ差し戻し

---

作成日: 2026-05-15
