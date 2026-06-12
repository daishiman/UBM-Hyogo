# Phase 5: 実装仕様

**[実装区分: 実装仕様書]**

## 実行タスク

1. `SidebarNavItem.tsx` の collapsed icon-box 高さを `h-10` → `h-[18px]` に修正する。
2. `SidebarShell.tsx`（公開サイトに戻るリンク）の同等 icon-box も `h-10` → `h-[18px]` に修正する。
3. `SidebarNavItem.spec.tsx` に Phase 4 設計の回帰テスト（TC-1〜TC-4）を追加する。
4. RED（TC-1/TC-2 fail）→ 実装 → GREEN を確認する。

## 参照資料

- Phase 4（テスト設計 / RED 条件）
- Phase 2 縦リズム構造分析（icon-box 高さのみが差の発生源）
- `apps/web/src/components/shell/icons.tsx`（ShellIcon = 固定 18×18px グリフ）

## 1. 変更ファイル一覧（Feedback RT-03）

| 種別 | パス | 内容 |
|------|------|------|
| 修正 | `apps/web/src/components/shell/SidebarNavItem.tsx` | L35 icon-box collapsed 高さ |
| 修正 | `apps/web/src/components/shell/SidebarShell.tsx` | L36 公開サイトに戻るリンク icon-box collapsed 高さ |
| 修正 | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 回帰テスト TC-1〜TC-4 追加 |

**新規作成ファイル: なし。**

## 2. before / after className diff

### 2-1. `SidebarNavItem.tsx`（L35）

```diff
   <span
     aria-hidden="true"
-    className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}`}
+    className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-[18px] w-10" : "h-[18px] w-[18px]"}`}
   >
     <ShellIcon id={item.icon} />
   </span>
```

- `w-10`（横幅 40px）は据え置き → 折りたたみ列の水平タップ領域とアイコン中央寄せを維持。高さのみ 40px→18px に縮小。
- 水平中央寄せは link 側 `w-full justify-center`（L30）と span 内 `justify-center` が担保（不変）。

### 2-2. `SidebarShell.tsx`（L36）

```diff
   <span
     aria-hidden="true"
-    className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}`}
+    className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-[18px] w-10" : "h-[18px] w-[18px]"}`}
   >
     <ShellIcon id="home" />
   </span>
```

- AC-5（公開サイトに戻るリンクも統一）を満たす。

## 3. 縦ピッチの期待値

| 状態 | py-2 | icon-box 高 | 行ピッチ（概算） |
|------|------|------------|----------------|
| expanded | 16px | ~20px | ~36px |
| collapsed（修正前） | 16px | 40px | ~56px |
| collapsed（修正後） | 16px | 18px | ~36px |

→ AC-1（折りたたみピッチ == 展開ピッチ ±2px）を満たす。`<ul> gap-0.5`(2px) は両状態共通で無罪（変更しない）。

## 4. h-[18px] 不足時の昇格判断

- 確定値は `h-[18px]`(18px)。collapsed 行ピッチ ≈ 36px で expanded と一致見込み。
- Phase 11 screenshot で ±2px を超える差（expanded より collapsed が約 2px 低く見える等）が観測された場合のみ、icon-box を `h-5`(20px) へ昇格してよい。
  - 昇格時は `SidebarNavItem.tsx` / `SidebarShell.tsx` の collapsed 値を `h-[18px]` → `h-5` に揃え、Phase 4 テストの期待値（`h-[18px]`）も `h-5` に同期更新する。
- グリフは固定 18px のため、box 高 18〜20px のいずれでも見た目（グリフサイズ）は不変。WCAG 2.5.8（最小タップ高）は py-2 込みで 34〜36px となり充足。

## 5. DoD（Definition of Done）

| 項目 | 合否基準 |
|------|---------|
| typecheck | `mise exec -- pnpm typecheck` exit 0 |
| lint | `mise exec -- pnpm lint` exit 0 |
| 対象 vitest | `pnpm exec vitest run --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` 全 PASS（既存 + TC-1〜TC-4） |
| ピッチ一致 | Phase 11 screenshot で collapsed ピッチ == 展開ピッチ（±2px） |
| apps/api diff | `git diff --stat apps/api` が空（0 行）= AC-6 |
| HEX 0 | 変更行に HEX / `bg-[#...]` / `text-[#...]` を含まない = AC-6 |

## 6. 非該当事項

- canUseTool / SDK callback（claude-agent-sdk）系の権限制御は本タスク非該当（CSS className 変更のみ・ツール実行ゲートを伴わない）。
