# Phase 7: カバレッジ確認

**[実装区分: 実装仕様書]**

## 実行タスク

1. 変更行（icon-box の collapsed 分岐 className）に限定して line / branch カバレッジを確認する。
2. 広域カバレッジ目標ではなく、変更ブロックのピンポイント covered を証跡に残す。

## 参照資料

- Phase 4 / Phase 6（追加テスト TC-1〜TC-6）
- Phase 5（変更ファイル一覧）

## 1. カバレッジ対象範囲（限定）

Feedback BEFORE-QUIT-002 / Feedback 5 に従い、**変更したファイル / ブロックのみ**を対象とする。
本タスクの変更は className 文字列の二値分岐のみで、新規ロジックは増えない。

| ファイル | 変更ブロック | カバレッジ確認対象 |
|---------|------------|------------------|
| `SidebarNavItem.tsx` | L35 icon-box `collapsed ? "h-[18px] w-10" : "h-[18px] w-[18px]"` | collapsed=true / false 双方の分岐 |
| `SidebarShell.tsx` | L36 icon-box collapsed 分岐 | collapsed 分岐（grep guard + 既存 shell render で従属的に到達） |

## 2. 期待カバレッジ

- `SidebarNavItem.tsx` の icon-box collapsed 三項分岐: TC-1/TC-2（collapsed=true）と TC-3（collapsed=false）で **両 branch を踏破** → 当該 line/branch **100%**。
- 広域（コンポーネント全体・リポジトリ全体）の coverage 数値は本タスクの達成基準にしない。変更行が covered であることのみを証跡化する。

## 3. 証跡コマンド（任意・参考）

```bash
pnpm exec vitest run --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  --coverage
```

- 確認ポイント: `SidebarNavItem.tsx` の icon-box 分岐行が uncovered として残らないこと。
- coverage 閾値 gate は本ピンポイント変更では新規導入しない（既存 web coverage 方針を維持）。

## 4. Phase 6 との分離方針（EMB-005-FB）

- 本タスクは小規模ゆえカバレッジ確認を Phase 6 に統合することも可能だが、ワークフロー上は別ファイルで残す。
- 記載は最小限（変更行 line/branch 100% の証跡方針）に留め、冗長な広域 coverage 分析は行わない。
