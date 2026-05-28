# Task F — AdminSidebar 「公開サイトに戻る」リンク追加

**[実装区分: 実装仕様書]**

## 1. 目的

`AdminSidebar` は既に session 配線済（`userDisplayName` / `userEmail` を受領、`SignOutButton` 配置）であるが、管理者が公開層に戻る導線が無い。「マイページ」リンクは既存だが、公開トップ `/` への明示的な戻り口を追加する。

> 判定根拠: 観測時点で `apps/web/src/components/layout/AdminSidebar.tsx` の nav 配列に `href: "/"` を持つアイテムが「ホーム」ラベルとして既に存在することを確認した。**重複追加にならないよう、本タスクは差分判定を含める**。

## 2. 差分判定（事前チェック）

```bash
rg -n '"/", label: "ホーム"' apps/web/src/components/layout/AdminSidebar.tsx
```

- ヒットあり: 既存「ホーム」を **「公開サイトに戻る」** ラベルに変更しつつ、視覚的に区別できるよう sidebar 最下段に移動する（既存挙動の整理）。
- ヒットなし: 新規追加する。

## 3. 変更対象ファイル

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/src/components/layout/AdminSidebar.tsx` | 編集 |
| 2 | `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | 編集（既存）or 新規 |

## 4. 編集内容

`AdminSidebar.tsx` 内 `NAV_GROUPS`（または等価の定義）に新セクション、または「公開」グループの末尾エントリとして追加:

```ts
{
  title: "公開サイト",
  items: [
    { href: "/", label: "公開サイトに戻る", icon: ICON_HOME, dataRole: "public-return" },
  ],
},
```

レンダリング側で `dataRole` を `<a data-role={...}>` に展開（既存 nav item レンダラーの拡張が必要なら最小差分で）。代替として直接マークアップを挿入する方法も可:

```tsx
<a href="/" data-role="public-return" aria-label="公開サイトに戻る" className={navItemClassName}>
  <span aria-hidden>{ICON_HOME}</span>
  <span>公開サイトに戻る</span>
</a>
```

配置: sidebar 最下段、`SignOutButton` の直上が望ましい（既存セクション順序と整合）。

## 5. テスト方針

`AdminSidebar.spec.tsx`:

1. レンダー後 `data-role="public-return"` を持つ anchor が 1 つ存在
2. その anchor の `href === "/"` かつ `aria-label === "公開サイトに戻る"`
3. 既存 admin nav 全項目（ダッシュボード / 出席分析 / 会員管理 / タグキュー / schema / 開催日 / 依頼キュー / Identity重複 / 監査ログ）が引き続き描画される（regression）
4. `SignOutButton`（`data-testid="sign-out-button"`）が存在
5. `userDisplayName` / `userEmail` props が反映されている（既存挙動）

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/layout/__tests__/AdminSidebar.spec.tsx
```

## 7. DoD

- [ ] `data-role="public-return"` リンクが sidebar に存在し `href="/"`
- [ ] 既存 admin nav 全項目が regression なく描画
- [ ] aria-label が「公開サイトに戻る」
- [ ] typecheck / lint / vitest green
- [ ] HEX 直書きなし

## 8. 依存

- Task A-E と独立に並列実装可
