# Phase 9: QA

**[実装区分: 実装仕様書]**

## 自動 QA（ローカル実行）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/layout/__tests__/AdminSidebar.spec.tsx \
  src/components/layout/__tests__/AdminSidebar.component.spec.tsx
```

期待: 全て exit code 0。

## grep 系 gate

```bash
# 1. data-role="public-return" が 1 件存在
rg -n 'data-role="public-return"' apps/web/src/components/layout/AdminSidebar.tsx
# → 1 件ヒット

# 2. 旧「ホーム」label が GROUPS から消えている
rg -n 'label: "ホーム"' apps/web/src/components/layout/AdminSidebar.tsx
# → 0 件

# 3. HEX 直書きなし
rg "#[0-9a-fA-F]{3,6}" apps/web/src/components/layout/AdminSidebar.tsx
# → 0 件

# 4. *.test.* 追加なし
rg --files apps/web/src/components/layout/__tests__/ | rg "\.test\."
# → 0 件
```

## 手動 QA（dev server）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

ブラウザで以下を確認:

| 観点 | 期待 |
|------|------|
| `/admin` 配下を開いた状態で sidebar 最下段に「公開サイトに戻る」が見える | ✓ |
| 当該リンクをクリックすると `/`（公開トップ）に遷移する | ✓ |
| 既存 admin nav 全項目（9 件）が描画されている | ✓ |
| Schema badge（count>0）が引き続き表示されている | ✓ |
| `SignOutButton` が引き続き機能 | ✓ |
| Tab キーフォーカスでアウトラインが見える | ✓ |
| ホバー時の背景色が `--ubm-color-surface-hover` を解決した色になる | ✓ |

## アクセシビリティ

- `aria-label` 必須
- icon `<span aria-hidden>` で screen reader からは label のみ読まれる
- フォーカス可能（`<a href>` ネイティブ）

## プロトタイプ整合チェック

```bash
ls docs/00-getting-started-manual/claude-design-prototype/ | rg -i 'admin|sidebar'
```

プロトタイプに該当画面があればフォント / spacing / icon の整合を目視確認する。無ければ本タスクは primitives + tokens 範囲内のため不変条件 #3 に抵触しない。

## DoD

- [ ] 自動 QA 全 pass
- [ ] grep gate 4 件全 pass
- [ ] 手動 QA チェックリスト全 ✓
- [ ] a11y 観点で問題なし
