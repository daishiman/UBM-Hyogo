# Phase 8: リファクタリング

> workflow: `issue-981-admin-members-table-list-enrichment`

## 1. 変更記録テーブル（[Feedback RT-03]）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| メンバー列 | 氏名 button のみ（`flex flex-col` 内に button 1 個） | button 下に `m.occupation` small text（存在時のみ） | AC-2a。プロトタイプ L223-276 の name + occupation(small) 整合 |
| 列ヘッダ | `<th>ステータス</th>` | `<th>区画 / ステータス</th>` | AC-2b。zone/type chip 追加に伴うヘッダ意味の明確化（Phase 2 §2） |
| ステータス列セル | `<MemberStateChipRow>` のみ | `flex flex-wrap gap-1.5` 内に zone chip(`zoneTone`) + type chip(`statusTone`) を前置し、`MemberStateChipRow` を維持（additive Option A） | AC-2b。publishState 3 値の info parity を保ちつつ chip を追加（Phase 2 §2 設計判断） |
| タグ列セル | placeholder `<span title="...">—</span>` | `m.tags` の label を最大2件 pill + 3件以上 `+N` chip / 空・undefined は「未タグ」warn chip | AC-2c / AC-2d。placeholder 撤去・実データ描画 |
| 追加 import | — | `Chip`（`../../../../components/ui/Chip`）、`zoneTone`/`statusTone`（`../../../../lib/tones`） | 既存部品の再利用（新規 primitive ゼロ・不変条件 #3/#4） |

> Before/After は「描画される DOM の差分」を主軸に記録。`MembersTableProps` シグネチャ・state ownership・データ層は不変（Phase 2 §4/§6）。

## 2. 抽出判断: tag pill 描画ロジック

tag pill ロジック（`slice(0,2)` + `+N` + 未タグ fallback）を `MembersTable` 内 inline のままにするか、`MemberTagPills.tsx` ヘルパーへ切り出すかを判断する。

| 判断基準 | 評価 |
| --- | --- |
| 再利用箇所が他にあるか | 現時点では `MembersTable` の list 行のみ。MemberDrawer 等での同種描画要求は**未発生** |
| テスト容易性 | inline でも props 注入（`items`）で TC-MT から到達可能。切り出しによるテスト改善は限定的 |
| 行数・可読性 | 該当ブロックは数行。inline でも `MembersTable` の可読性を損なわない |
| 新規 export の負債 | 切り出すと新 export = dead export 検査対象が増える。再利用先なしでは過剰抽象 |

**結論（デフォルト = inline 維持）**:
- tag pill 描画は `MembersTable.tsx` 内 inline のまま維持する。**過剰抽出を回避**する（YAGNI）。
- ただし将来 **MemberDrawer 等で同種の tag pill 描画が必要になった場合は `MemberTagPills.tsx`（`_members/` 配下、`MemberStateChip.tsx` と同階層・PascalCase）へ切り出す**。その時点で再利用 ≥ 2 が成立し抽出が正当化される。
- 切り出す場合の命名・配置は Phase 1 §4 / [FB-SDK-07-4] に従い、`zoneTone`/`statusTone` と同様の規約（camelCase helper or PascalCase component）を踏襲する。

## 3. zone / type chip 描画の抽出判断

- zone chip + type chip の描画も**同様に inline 維持**とする。
- 理由: 既存 `MemberStateChipRow` パターンと一貫させ、ステータス列セルを「`flex flex-wrap gap-1.5` の中に chip を並べる」単一構造に保つ。chip 1〜2 個の条件描画を別ヘルパー化する利得は薄い。
- `zoneTone`/`statusTone` という tone 解決ロジック自体は既に `lib/tones.ts` に抽出済のため、追加抽出の必要はない。

## 4. 重複削除・dead export チェック

| 項目 | 状態 |
| --- | --- |
| 新規 export | **なし**（inline 維持のため `MembersTable` の export のみ。新 component/helper を export しない） |
| dead export | 該当なし（新規 export ゼロ） |
| 重複コード | chip 行レイアウト `flex flex-wrap gap-1.5` は既存 `MemberStateChip.tsx` と同一クラスを流用（重複定義ではなくクラス文字列の一致。共通化不要） |
| placeholder 残骸 | タグ列の旧 placeholder `<span title="...">—</span>` を After で完全撤去（dead markup を残さない） |

## 5. ファイル削除確認 [FB-UI-02-1]

- 本タスクは `MembersTable.tsx` の **in-place 修正のみ**。新規ファイル作成・既存ファイル削除はなし。
- よってファイル削除確認は **N/A**（削除対象が存在しない）。

## 完了条件

- [ ] 変更内容が `対象 / Before / After / 理由` テーブルで記録された（[RT-03]）
- [ ] tag pill 抽出判断が記録され、デフォルト inline 維持 + MemberDrawer 等での再利用発生時に切り出す結論が固定された
- [ ] zone/type chip も inline 維持（MemberStateChipRow パターン一貫）と記録された
- [ ] 新規 export なし = dead export なし、placeholder 残骸撤去が確認された
- [ ] ファイル削除なし（in-place 修正）のため削除確認 N/A が明記された
