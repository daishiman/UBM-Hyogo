# Phase 7: カバレッジ確認

> workflow: `issue-981-admin-members-table-list-enrichment`

## 1. カバレッジ対象の限定（[Feedback BEFORE-QUIT-002 / Feedback 5]）

本タスクは UI 描画の additive 変更のみのため、coverage は**変更ファイルの追加描画分岐に限定**して評価する。全ファイル一律の coverage 閾値指定はしない（測定ノイズと無関係ファイルの巻き込みを避ける）。

| カバレッジ計測対象 | 範囲 |
| --- | --- |
| **対象ファイル** | `apps/web/src/features/admin/components/_members/MembersTable.tsx` |
| **対象範囲（行）** | Phase 5 で追加する描画分岐のみ（occupation small text / zone chip / type chip / tag pill + `+N` / 未タグ warn chip） |
| **対象外** | maskEmail / Pagination / checkbox / MemberPublishSwitch / MemberStateChipRow など既存ロジック（本タスクで未変更。回帰は AC-6 で別途担保） |

> 既存の未変更行（`maskEmail`、ページネーション計算等）まで line 100% を要求しない。あくまで**今回追加した条件分岐の網羅**を確認するのが Phase 7 の責務。

## 2. 変更描画分岐とテストケース対応表

Phase 5 で追加される条件分岐は以下 6 系統。各分岐の真偽両側がどの TC-MT ケースで保護されるかを対応づける。

| 分岐 | 条件 | 真（描画される） | 偽（省略される） | 保護ケース |
| --- | --- | --- | --- | --- |
| B1 occupation | `m.occupation ?` | small text 描画 | 要素省略 | TC-MT（occupation あり行）/ TC-MT（occupation なし行で query が見つからないこと） |
| B2 zone chip | `m.ubmZone ?` | `zoneTone` chip 描画 | 要素省略 | TC-MT（ubmZone あり = `data-tone` query）/ TC-MT（ubmZone なし行で chip 非描画） |
| B3 type chip | `m.ubmMembershipType ?` | `statusTone` chip 描画 | 要素省略 | TC-MT（ubmMembershipType あり）/ TC-MT（なし行で非描画） |
| B4 tags 有無 | `m.tags && m.tags.length > 0` | tag pill 描画 | 未タグ warn chip 描画 | TC-MT（tags 1〜2件）/ TC-MT（tags 空・undefined → 未タグ） |
| B5 `+N` chip | `m.tags.length > 2` | `+N` chip 描画 | `+N` 非描画 | TC-MT（tags 3件以上 → `+1` query）/ TC-MT（tags 2件で `+N` 不在） |
| B6 tag slice | `m.tags.slice(0, 2)` | 先頭2件のみ pill 描画 | — | TC-MT（tags 3件以上で表示 pill が 2 件であること） |

### tags 件数の境界網羅（B4/B5/B6 を同時に保護する fixture 設計）

| fixture | tags 件数 | 確認内容 |
| --- | --- | --- |
| 0 件（undefined） | 0 | 未タグ warn chip（`data-tone="warning"`） |
| 0 件（`[]`） | 0 | 同上（空配列も未タグ扱い） |
| 1 件 | 1 | pill 1 個 / `+N` 不在 |
| 2 件 | 2 | pill 2 個 / `+N` 不在（境界下端） |
| 3 件 | 3 | pill 2 個 + `+1` chip（境界上端 = slice + `+N` 同時発火） |

> 0/2/3 件を必ず含めることで B4（空 vs 非空）、B5（`>2` の false/true 境界）、B6（slice の打ち切り）の branch を全て踏む。

## 3. 目標カバレッジ

| 指標 | 目標 |
| --- | --- |
| 変更行（追加描画分岐）の line coverage | **100%** |
| 変更行（B1〜B6）の branch coverage | **100%** |

> 既存未変更行は対象外（§1）。新規追加した三項演算子・論理積条件の真偽両側を §2 の fixture で全て踏むことを実測条件とする。

## 4. coverage 取得コマンド

```bash
# targeted test（既定）
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx

# coverage 付き（プロジェクトに coverage script がある場合の候補）
mise exec -- pnpm --filter @ubm-hyogo/web test --coverage \
  apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx

# changed 限定 coverage script が存在する場合
mise exec -- pnpm test:coverage:changed   # 存在確認の上で実行（無ければ上記 --coverage を正とする）
```

- coverage レポートは `outputs/phase-11/coverage-changed.txt` として記録する（artifact 命名は Phase 1 §5 canonical 準拠）。
- レポート上で `MembersTable.tsx` の追加行が line/branch 100% であることを目視確認し、未踏分岐があれば §2 の fixture を補う。

## 完了条件

- [ ] coverage 対象が変更ファイルの追加描画分岐（B1〜B6）に限定明記された
- [ ] 各分岐の真偽両側が TC-MT ケースに対応づけられた（§2 対応表）
- [ ] tags 件数境界（0 / 2 / 3 件）を含む fixture で B4/B5/B6 を網羅する方針が確定した
- [ ] 変更行 line 100% / branch 100% を目標として固定した
- [ ] coverage 取得コマンドと記録先（`coverage-changed.txt`）が記載された
