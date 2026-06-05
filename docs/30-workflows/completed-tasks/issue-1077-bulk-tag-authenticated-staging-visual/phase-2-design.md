# Phase 2 — 設計

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 ファイルのコード追加を伴う（CONST_004）。

---

## 2.1 spec の topology（実行フロー）

```
test.use({ storageState: admin.storageState.json })   ← admin 認証注入（setup が mint）
  │
  └─ test("staging admin bulk tag picker baselines")
       1. page.goto("/admin/members", { waitUntil: "networkidle" })
       2. 前提 assert: member 行 ≥ 2 / tag picker が空でない
       3. member 2 件のチェックボックスを click（or 全選択）
       4. bulk region（aria-label="一括操作"）が visible を assert
       5. addStyleTag でアニメーション無効化
       6. assign モード（既定）で bulk region を locator scope
          → toHaveScreenshot("bulk-tag-picker-assign-mode.png")
       7. 「解除」ボタンを click（mode group 内）
          → toHaveScreenshot("bulk-tag-picker-unassign-mode.png")
       8. apply ボタン（`{n}人 × {m}タグ を付与`）は一切押さない（AC-6）
```

唯一の `test()` 内で 2 capture を連続実行する（mode は同一 picker 上の state 切替であり、リロード不要）。

---

## 2.2 既存コンポーネント再利用（新規 primitive ゼロ）

本タスクはテストコードのみ。`apps/web/src` 配下に新規コンポーネント・primitive・スタイルを追加しない（CONST 不変条件 #3 / AC-7）。spec は landed 済みの `BulkActionBar` / `MembersTable` が公開する既存 ARIA / data-testid セレクタのみを利用する。

---

## 2.3 セレクタ表（実コードから確定）

| 用途 | セレクタ | 出典 |
| --- | --- | --- |
| member 行 | `[data-testid="admin-members-row-{memberId}"]` | `MembersTable.tsx:107` |
| 行内チェックボックス | `getByRole("checkbox", { name: "{fullName} を選択" })`（実体 `aria-label="${fullName} を選択"`） | `MembersTable.tsx:112` |
| 全選択チェックボックス | `getByRole("checkbox", { name: "全選択" })`（`aria-label="全選択"`） | `MembersTable.tsx:88` |
| bulk region | `getByRole("region", { name: "一括操作" })` | `BulkActionBar.tsx:140-141` |
| tag section | `aria-label="タグ一括付与・解除"`（`getByLabel` / region 内 locator） | `BulkActionBar.tsx:178` |
| mode group | `getByRole("group", { name: "付与モード" })` | `BulkActionBar.tsx:183` |
| 「付与」ボタン | `getByRole("button", { name: "付与" })`（`aria-pressed`） | `BulkActionBar.tsx:184-196` |
| 「解除」ボタン | `getByRole("button", { name: "解除" })`（`aria-pressed`） | `BulkActionBar.tsx:197-209` |
| apply（押さない） | `{selectedIds.length}人 × {selectedTagIds.size}タグ を{付与/解除}` | `BulkActionBar.tsx:249` |

> 注意: 行内「{fullName} を選択」と全選択「全選択」、および「{fullName} を編集」（`MembersTable.tsx:174`）はそれぞれ別 accessible name。選択操作は前者 2 つのみを使う。

---

## 2.4 state ownership

| state | 所有者 | 備考 |
| --- | --- | --- |
| 選択 member 集合 `selected: Set<string>` | `MembersClientShell.tsx:27` | `onToggleSelect` / `onToggleSelectAll` が更新。`BulkActionBar selectedIds={Array.from(selected)}` に渡る。 |
| `tagMode: "assign" \| "unassign"` | `BulkActionBar.tsx:51`（内部 state） | 既定 `"assign"`。「付与」/「解除」ボタンが `setTagMode` で切替。 |
| `available: AdminTagRef[]` | `BulkActionBar.tsx:53` | 初回 `fetchTagMaster()`（read-only `GET /admin/tags`）。失敗時は空 → picker は「付与可能なタグがありません」を表示。 |
| `selectedTagIds: Set<string>` | `BulkActionBar.tsx:52` | 本 spec では tag を選択しない（apply を発火させないため）。`selectedTagIds.size===0` で apply ボタンは disabled。 |

spec 側は state を直接触らず、UI interaction（click）でのみ state を変化させる。

---

## 2.5 snapshot 名前空間設計

`staging-visual-authenticated` project の `snapshotPathTemplate`（`playwright.config.ts:386-387`）:

```
{testDir}/{testFileName}-snapshots/{arg}-authenticated-staging-visual-{platform}{ext}
```

→ baseline 実体パス（例）:

```
apps/web/playwright/tests/visual-staging-authenticated/
  admin-members-bulk-tag-authenticated.spec.ts-snapshots/
    bulk-tag-picker-assign-mode.png-authenticated-staging-visual-darwin.png
    bulk-tag-picker-unassign-mode.png-authenticated-staging-visual-darwin.png
```

local fixture spec（`issue1036-bulk-member-tags.spec.ts`）の baseline は別 project / 別 testDir に格納されるため、**名前空間が物理的に分離**し drift しない。

---

## 2.6 mutation 回避の設計上の保証

- apply ボタンは `selectedTagIds.size===0` で常に disabled（`BulkActionBar.tsx:135,244`）。spec は tag pill を一切 click しないため、apply は構造的に発火不能。
- `runBulkTags`（`POST .../tags/bulk`）は apply ボタンの `onClick` でしか呼ばれない（`BulkActionBar.tsx:245`）。
- 公開/非公開/論理削除ボタン（`run()`）も一切 click しない。
- spec の操作は「チェックボックス click」「mode ボタン click」「screenshot」のみ。これらはすべて client state 変更で、ネットワーク mutation を発火しない（`fetchTagMaster` の GET は read-only）。

---

## 2.7 staging データ前提と前提未達時の振る舞い

| 前提 | 必要値 | 未達時の振る舞い |
| --- | --- | --- |
| member 行数 | ≥ 2 | `admin-members-row-*` が 2 件未満なら明示メッセージで `test.fail`（baseline 生成不可を即可視化）。 |
| tag master | ≥ 1（picker が空でない） | section に「付与可能なタグがありません」のみの場合も assign/unassign の枠は描画されるため capture 自体は可能。空 picker でも baseline は成立するが、前提として tag ≥ 1 を期待しログに残す。 |
| 認証 | admin storageState | setup project（`setup-authenticated-staging`）が mint。未 mint だと dependency により本 project は実行されない。 |

read-only ゆえ staging データが変動しても mutation は起きず、baseline は `--update-snapshots` で再生成可能。
