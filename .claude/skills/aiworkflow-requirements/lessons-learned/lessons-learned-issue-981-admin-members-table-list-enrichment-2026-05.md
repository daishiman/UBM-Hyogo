# lessons-learned: issue-981 admin members table list enrichment（2026-05-29）

## 事象

`/admin/members` の会員一覧テーブルが、サーバーから既に届いている `occupation` / `ubmZone` / `ubmMembershipType` / `tags` を描画せず、タグ列をプレースホルダ `—` で空欄扱いにしていた（Issue #981 AC-2）。データ層・API は #968 で実装済みで、欠落は **rendering-only** だった。

`MembersTable.tsx` に既存 `Chip` + `zoneTone`/`statusTone`（`apps/web/src/lib/tones.ts`）を import し、occupation を氏名下、zone/membership type を「区画 / ステータス」列、tags を最大 2 件 + `+N`（空配列/undefined は `未タグ` warning chip fallback）で描画。`apps/api` / `packages/shared` / `MembersTableProps` は無変更。

実装中に顕在化した苦戦箇所と再利用知見を以下に記録する。

## L-I981 系 lessons

- **L-I981-001（rendering-only gap と data-layer gap の判別）**: 「一覧に値が出ない」を見たら、まず data が UI prop まで届いているかを `AdminMemberListView` / `AdminMemberListItemZ`（#968）で確認する。今回は `m.tags` / `m.ubmZone` 等が既に props 上に存在し、欠落は描画のみだった。data 到達済みなら **API / schema / D1 を一切触らず UI 描画追加だけ**で AC を満たせる。逆にここを誤判定すると不要な endpoint 追加（invariant #1 違反）を招く。Phase 2 design で「prop に値が来ているか」を最初の分岐に置く。

- **L-I981-002（既存 primitive 再利用・新規生成禁止）**: chip 表現は `Chip` + `zoneTone(zone)` / `statusTone(status)`（`apps/web/src/lib/tones.ts`）を再利用し、新規 chip component / 新規 tone map を作らない（UI prototype alignment invariant #3「新規 primitive を生やさない」）。tone 関数が未知値を安全な既定 tone に落とすため、enum 化されていない自由入力 zone/type でも fallback が効く。

- **L-I981-003（optional field の条件描画と empty fallback の使い分け）**: optional な enrichment field は描画パターンを 2 種に分ける。(a) occupation / ubmZone / ubmMembershipType は **値が無ければ要素ごと描画しない**（空 chip / 空行を作らない）。(b) tags は **空配列/undefined を `未タグ` warning chip に明示 fallback** する（「タグ未設定」自体が運用上の意味を持つため）。この使い分けを Phase 4 test plan で別 TC（充足行 / 部分欠損行 / 完全空行）に分解する。

- **L-I981-004（tag overflow の `+N` と tooltip 契約）**: tags は `slice(0, 2)` で最大 2 件表示し、残りは `+N` chip に集約、`+N` を包む `<span>` の `title` 属性に全 tag label を ` / ` 連結で持たせる（hover で全件確認可能）。`title` を chip 自体でなく wrapper `<span>` に置くのは、`Chip` が title prop を pass-through しない設計だから。component spec（TC-MT-17）で `+N` の `title` 文字列を固定 assert し、overflow 件数境界（tag 2 件=overflow なし / 3 件=`+1`）を TC で押さえる。

- **L-I981-005（VISUAL_ON_EXECUTION workflow の docs-only close-out 禁止）**: 本 workflow は当初 `spec_created only`（docs-only close-out）として閉じられかけたが、automation-30 / CONST_004 / CONST_005 に従い **要求サイクルが実コード変更を許す implementation/VISUAL workflow は docs-only で閉じてはならない**。実コード + focused spec + strict 7 outputs + aiworkflow-requirements sync を同一 wave で反映し、workflow_state を `implemented_local_evidence_captured` に再分類した。Phase 12 で workflow type（implementation / VISUAL_ON_EXECUTION）を確認し、docs-only 判定との矛盾を排除する。

- **L-I981-006（enrichment component の TC granularity）**: list row enrichment の component spec は、充足行だけでなく **部分欠損の組合せ**を網羅する。TC-MT-06〜20 で occupation/undefined guard、zone のみ / type のみ欠損、tag 0/2/3 件境界、occupation falsy、publishState 共存、混在行の a11y を分解。混在行（一部 enriched / 一部空）の a11y を 1 TC として持つと、条件描画の取りこぼし（空要素の role 残留など）を検出できる。

## 再利用パターン

- **「届いているデータの rendering-only enrichment」**: data layer (#968) が upstream baseline として既に prop を供給している場合、本 workflow は描画 gap のみを own する。API/schema/shared を boundary 外として固定し、UI 側 component + focused spec + local visual screenshot（充足 / 空 fallback の 2 state）で閉じる。staging visual / deploy / commit / PR は user-gated。

## 反映先

- `.claude/skills/aiworkflow-requirements/references/workflow-issue-981-admin-members-table-list-enrichment-artifact-inventory.md`: `## Lessons Learned` 節から本ファイルを参照。
- `.claude/skills/aiworkflow-requirements/changelog/20260529-issue-981-admin-members-table-list-enrichment.md`: `## Lessons Learned` 節を追記。
- `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md`: 「届いているデータの rendering-only list enrichment」パターンを汎化追記（L-RENDGAP-001..005）。
- `.claude/skills/aiworkflow-requirements/lessons-learned/`: 本ファイル。
