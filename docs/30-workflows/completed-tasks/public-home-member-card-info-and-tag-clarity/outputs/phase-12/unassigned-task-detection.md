# 未タスク検出

- task_id: `public-home-member-card-info-and-tag-clarity`
- 検出結果: **0 件**（新規起票なし）

## current（本サイクルで起票すべき未タスク）

**0 件**。本タスクは AC-1..AC-9 を 1 実装サイクル（Lane A + Lane B）で完結する設計であり、スコープ外送りや別タスク化が必要な残件は検出されなかった。

## baseline（記録のみ・本サイクルで吸収または YAGNI）

Phase 3 の MINOR 指摘は、いずれも本サイクル内で吸収できるため起票不要。

| ID | 内容 | 吸収方針（起票不要の根拠） |
| --- | --- | --- |
| M-1 | `app/(public)/page.tsx` の `listMembers` / `listMembersRaw` 経路を実装時に grep 確認 | 実装プロンプト Phase 5 の手順内で grep 確認し `expand=tags` を適切な経路に付与（AC-3）。本サイクル内で解消 |
| M-2 | businessOverview の visibility=public を field schema で実確認 | 実装プロンプト Phase 5 の前提チェックで確認。非 public 判明時は projection しない分岐（設計済み）。本サイクル内で解消 |
| M-3 | `selectCardTags` の business/skill 並びは code 昇順（件数順希望は将来） | 件数順は YAGNI。topTags 集計を要する将来要望が出た時点で別検討。現時点で起票不要 |

## スコープ外（先送りではなく本質的に範囲外・別タスク化対象でもない）

- タグ category 正規分類 / master 再設計（admin tag catalog）: 既存 category で充足。
- ubmZone chip の表記変更: form field 由来でタグとは別系。現行挙動維持。
- seed データの label 修正: Q1 で web 表示変換を選択したため非対象。

## 関連タスク差分確認（既存 public-member 系 workflow との重複チェック）

| 既存 workflow | 関心 | 本タスクとの差分 |
| --- | --- | --- |
| `public-members-tag-filter-ux-refine` | `/members` のタグ絞り込み TagPicker の **CSS レイアウト**（横並び flex-wrap） | 本タスクは TagPicker の **label 正規化（AC-7）** のみ。CSS レイアウトは触らない → 重複なし |
| `public-member-detail-survey-fields-richness` | **メンバー詳細** `/members/[id]` の proto 5 セクション化 + seed 拡充 | 本タスクは **list / card**（home `/` と `/members` 一覧）が対象。詳細ページは触らない → 重複なし |

→ 関心の重複なし。本タスクは「home/list の MemberCard + list endpoint projection + TagPicker label 正規化」に閉じており、既存 workflow と責務が分離している。

## 結論

current 0 件・baseline は本サイクル吸収または YAGNI・関連タスク重複なし。新規未タスク起票は不要。
