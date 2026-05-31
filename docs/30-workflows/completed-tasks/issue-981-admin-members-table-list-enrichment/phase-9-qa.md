# Phase 9: 品質保証

> workflow: `issue-981-admin-members-table-list-enrichment`

## 1. 実行する品質ゲートと期待結果

すべて `mise exec` 経由（Node 24 保証）で実行する。

| # | gate | コマンド | 期待結果 |
| --- | --- | --- | --- |
| G1 | typecheck | `mise exec -- pnpm typecheck` | green（AC-5）。`MembersTableProps` 型不変・新規型エラーなし |
| G2 | lint | `mise exec -- pnpm lint`（残違反は手修正） | 違反 0。自動修正可能分は `mise exec -- pnpm lint --fix` → 残違反のみ手修正 |
| G3 | build | `mise exec -- pnpm build` | 成功（OpenNext Workers 互換 webpack build。`next build --webpack` 正本） |
| G4 | targeted test | `mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | 全 TC-MT + 追加ケース PASS |
| G5 | design token gate | `verify-design-tokens`（CI gate） | PASS。HEX 直書き 0 件・`bg-[#xxx]`/`text-[#xxx]` 0 件 |

> G2 は `--fix` を先に試し、フォーマット系を自動解消した上で残った違反のみ手修正する方針。

## 2. HEX 直書き 0 件確認手順

追加クラスは**トークン変数参照と Chip の data-tone のみ**で構成され、HEX を一切含まないことを確認する。

| 追加要素 | 使用クラス / 機構 | HEX 有無 |
| --- | --- | --- |
| occupation small text | `text-xs text-[var(--ubm-color-text-muted)]` | なし（token 変数） |
| chip 行ラッパ | `flex flex-wrap gap-1.5` | なし（レイアウトのみ） |
| zone / type / tag / 未タグ chip | `<Chip tone={...}>`（色は `data-tone` → `ui-chip` CSS が tokens.css で解決） | なし（Chip 内部で token 解決） |

確認手順（grep gate と整合する手動確認）:

```bash
# 変更ファイルに HEX 直書き / 任意値カラークラスが無いこと（出力 0 行を期待）
mise exec -- pnpm grep -nE "#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#" \
  apps/web/src/features/admin/components/_members/MembersTable.tsx || true
```

- 不変条件 #2 / Phase 2 §7 整合。色解決は `Chip` の `data-tone` 経由に閉じる。

## 3. 既存挙動の regression なし確認（AC-6）

| 確認対象 | 確認方法 | 期待 |
| --- | --- | --- |
| TC-MT-01〜05（既存） | G4 で実行 | PASS のまま（フィルタ / pagination / 行選択 / drawer open） |
| a11y（既存 axe ケース） | G4 内 a11y ケース実行 | violation 0 のまま（追加 chip は `Chip`/既存 markup で a11y 退行なし） |
| filter / pagination / 選択 / drawer | 既存ケースで担保 | 追加描画は純表示のため副作用なし（Phase 2 §4） |

- 追加した chip / occupation は表示専用で onClick handler を持たない（AC-4）。行クリック・選択・drawer 導線に介入しないこと（tag pill は表示専用）を確認する。

## 4. `MembersTableProps` 不変の確認

```bash
# props interface 行に差分が無いこと（出力に MembersTableProps の interface 変更が含まれないこと）
mise exec -- git diff -- apps/web/src/features/admin/components/_members/MembersTable.tsx \
  | grep -nE "MembersTableProps|readonly items|readonly selected|readonly on" || true
```

- `MembersTableProps`（`items` / `selected` / `onToggleSelect` / `onToggleSelectAll` / `onOpenRow` / `page` / `pageSize` / `total` / `onPageChange`）のシグネチャ変更が `git diff` に現れないこと。internal state（`useState`）追加もないこと（Phase 2 §6）。

## 5. admin web grep gate 抵触なし確認

| gate | 該当性 | 結果 |
| --- | --- | --- |
| line 限定エンドポイント（`127.0.0.1:8888` 等）の `apps/web/src` 焼き込み禁止 | 本変更はエンドポイント文字列を追加しない | **N/A**（該当なし） |
| `verify-design-tokens`（HEX/任意値カラー） | §2 で確認済 | PASS 想定 |
| FormField 経由不変条件 #9 / admin mutation 不変条件 #10 | 本変更は `<input>` 追加・mutation 追加なし（表示専用 chip のみ） | **N/A**（該当なし） |

- 上記のうち endpoint 焼き込み・FormField・admin mutation 系は本タスクのスコープ外（描画 additive のみ）のため **N/A**。

## 完了条件

- [ ] G1〜G5 の全 gate を実行し期待結果（typecheck/lint/build/test/design-token）を満たした
- [ ] 変更ファイルに HEX 直書き 0 件を grep で確認した（色は token 変数 + Chip data-tone のみ）
- [ ] 既存 TC-MT-01〜05 + a11y が PASS のまま（regression なし = AC-6）を確認した
- [ ] `git diff` で `MembersTableProps` 不変・internal state 追加なしを確認した
- [ ] endpoint 焼き込み等の既存 grep gate に抵触しない（該当なしは N/A）と記録した
