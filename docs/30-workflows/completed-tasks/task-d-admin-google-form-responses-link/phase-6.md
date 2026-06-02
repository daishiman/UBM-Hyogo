# Phase 6: テスト拡充（回帰ガード）

> **Phase 種別**: テスト拡充（境界・回帰ケースの確認）
> **対象タスク**: Task D admin サイドバー nav に Google Form 回答編集画面への外部リンクを追加
> **workflow_state**: `implemented_local_evidence_captured`（実装は dev へ landed 済み: PR #1064 / commit 745c95115）
> **前提**: Phase 5 の実装で TC-1〜TC-5 が green
> **次フェーズ**: Phase 7（カバレッジ確認）

---

## 6.1 このフェーズのゴール

Phase 4/5 で確立した基本振る舞いに対し、回帰しやすい観点（内部 active の維持・collapsed の sr-only・href 定数一致・tabnabbing 防止 rel・role 境界）を回帰ガードとして整理する。
landed 済みの 3 spec が既にこれらの観点をどこまで充足しているかを確認し、**充足済みの観点と、追加で価値があるが現状未カバーの観点を区別**する。

**本タスクは verify_existing**のため、本 Phase の実体は「landed 済み spec の回帰カバー範囲の棚卸し」であり、新規 apps 差分は発生させない。未カバー観点のうち追加すべきものは候補として明示するが、過剰実装を避ける（不変条件 #3 の精神）。

---

## 6.2 回帰ガード観点と現状カバー状況（CONST_005）

| 観点 | 回帰リスク | 検証 spec / TC | 現状 |
|------|-----------|----------------|------|
| R-1 内部 item の active 維持 | external 分岐追加で `<Link>` 側の `data-active`/`aria-current` を壊す | `SidebarNavItem.spec.tsx` TC-3（内部 item active） | **カバー済み** |
| R-2 collapsed で label が sr-only | external の label span 変更で collapsed 分岐を壊す | `SidebarNavItem.spec.tsx` TC-4（collapsed sr-only） | **カバー済み** |
| R-3 href が定数一致（ハードコード防止） | URL 直書きへの退行 | `form-responses.spec.ts` TC-1 + `SidebarNavItem.spec.tsx` TC-2（href=定数） + `shell-config.spec.ts` TC-5（href=定数） | **カバー済み** |
| R-4 tabnabbing / referrer leak 防止 rel | `rel` 欠落・`target` のみ追加への退行 | `SidebarNavItem.spec.tsx` TC-2（`rel="noopener noreferrer"`） | **カバー済み** |
| R-5 external が active 扱いされない | external 分岐が誤って `data-active`/`aria-current` を出す | `SidebarNavItem.spec.tsx` TC-2（aria-current=null / data-active=null） | **カバー済み** |
| R-6 admin items 構成（10 項目・順序） | 項目の重複追加・順序入替・id 重複 | `shell-config.spec.ts`（admin `toHaveLength(10)` + TC-5 form-responses matchObject） | **カバー済み** |
| R-7 viewer/member に form-responses が無い | role 境界破壊（admin 限定項目の公開ロール露出） | `shell-config.spec.ts`（viewer=public のみ / member=public+members）| **カバー済み（暗黙）**。下記候補参照 |
| R-8 icon 網羅型の form-responses 欠落 | union 追加時に PATHS キー追加漏れ | `pnpm typecheck`（`Record<ShellNavItemId,string>` 網羅型） | **型レベルでカバー** |

> R-1〜R-6 は landed 3 spec が直接 assert しており回帰検知できる。R-8 は spec ではなく typecheck（網羅型）が担保する。

---

## 6.3 R-7（role 境界）の補足 — 暗黙カバーと追加候補

`shell-config.spec.ts` の既存ケースは次を assert している。

```typescript
// viewer は public グループのみ（3 item: home/directory/register）
expect(groups[0]!.items.map((i) => i.id)).toEqual(["home", "directory", "register"]);
// member は public + members（profile）
expect(members?.items.map((i) => i.id)).toEqual(["profile"]);
```

`form-responses` は admin グループにしか存在せず、viewer / member の groups にそもそも admin グループが含まれない（`groups.map((g) => g.id)` が `["public"]` / `["public","members"]`）。したがって **viewer/member に form-responses が露出しないことは構造的に保証され、暗黙にカバー済み**である。

### 追加で価値がある境界ケース（候補・任意）

過剰実装を避けつつ、明示性を高めるなら次の 1 ケースを `shell-config.spec.ts` に追加できる（必須ではない・現状の暗黙カバーで AC は充足）。

```typescript
it("viewer/member には form-responses external link が露出しない", () => {
  for (const role of ["viewer", "member"] as const) {
    const groups = buildNavForRole(role);
    const ids = groups.flatMap((g) => g.items.map((i) => i.id));
    expect(ids).not.toContain("form-responses");
  }
});
```

> この候補は AC-D4 の「admin 限定」という不変を明示化するもので、回帰検知価値は中程度。landed 環境では既存ケースで構造的に担保されるため、追加は任意とする。

---

## 6.4 充足済み / 不足の区別（明示）

| 区分 | 観点 |
|------|------|
| **充足済み（追加不要）** | R-1 内部 active / R-2 collapsed sr-only / R-3 href 定数 / R-4 rel / R-5 external active-none / R-6 admin items 構成 / R-8 icon 網羅型 |
| **暗黙充足（明示化は任意候補）** | R-7 role 境界（viewer/member 非露出） |
| **不足（本タスクのスコープ外）** | E2E クリック→新規タブ実遷移（jsdom は window.open を実行しない。実遷移は Playwright / 手動 staging の VISUAL 証跡で担保＝Phase 7 で screenshot は user-gated と整理） |

> jsdom では `<a target="_blank">` のクリックで実際に新規タブを開かない（属性検証のみ）。実際の「別タブで Form 編集 URL を開く」挙動（AC-D1 の動的側面）は unit ではなく E2E / 手動確認の領域。本タスクは VISUAL だが screenshot は staging 認証が必要なため user-gated（Phase 7 §7.5 参照）。

---

## 6.5 変更対象ファイル一覧と種別（CONST_005）

| ファイル | 種別 | 本 Phase での扱い |
|---------|------|-------------------|
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 既存（landed） | R-1/R-2/R-4/R-5 を充足。追加変更なし |
| `apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | 既存（landed） | R-3 を充足。追加変更なし |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 既存（landed） | R-3/R-6/R-7 を充足。R-7 明示化は任意候補（6.3） |

> 本 Phase では新規テストファイルを作らない。verify_existing のため既存 3 spec の回帰カバーを棚卸しするのみ。R-7 明示化候補は採否を Phase 7 / レビューに委ねる。

---

## 6.6 入出力・副作用

- **入力**: `buildNavForRole(role)` の role（viewer/member/admin）、`SidebarNavItem` の `item`/`collapsed`/`activePath`、`usePathname()` モック。
- **出力**: nav グループ items 配列、render DOM の属性集合。
- **副作用**: `vi.mock("next/navigation")` の module mock、`afterEach(cleanup)`。DB / ネットワーク無し。

---

## 6.7 ローカル実行コマンド（CONST_005）

```bash
# shell 配下 + 定数 spec をまとめて回帰確認
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/shell \
  apps/web/src/lib/constants/__tests__/form-responses.spec.ts
# web 全 spec
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 6.8 DoD（Definition of Done）

- [ ] R-1〜R-8 の回帰観点を棚卸しし、各観点の検証 spec/TC と現状カバー状況を表で明示
- [ ] R-1/R-2/R-4/R-5/R-6 が landed 3 spec で充足済みであることを確認
- [ ] R-3（href 定数一致）が form-responses / SidebarNavItem / shell-config の 3 spec に渡って検証されていることを確認
- [ ] R-7（role 境界）が既存 viewer/member ケースで暗黙充足であることを記述し、明示化候補ケースを任意として提示
- [ ] R-8（icon 網羅型）が typecheck で担保されることを記述
- [ ] jsdom では実遷移を検証しない（E2E/手動領域）ことを明示し、不足観点を区別
- [ ] 上記コマンドで shell + constants spec が green
- [ ] `git status apps/web/` を確認（verify_existing＝新規 apps 差分ゼロ）

---

## 完了条件

完了条件は次のすべてを満たすことである。

1. 回帰観点 R-1〜R-8 が表で棚卸しされ、各観点を検証する spec/TC と「充足済み / 暗黙充足 / スコープ外」の区分が明示されていること。
2. R-1（内部 active 維持）・R-4（rel タブナビング防止）・R-5（external active-none）が landed 3 spec により回帰検知できることが確認できていること。
3. R-7（viewer/member 非露出）が既存 role ケースで構造的に担保される旨と、任意の明示化候補が記述されていること。
4. shell + constants spec が green で `pnpm typecheck` / `pnpm lint` が緑、`git status apps/web/` がクリーン（verify_existing で新規 apps 差分ゼロ）であること。
