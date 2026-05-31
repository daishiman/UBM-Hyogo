# Phase 1: 要件定義

> workflow: `issue-981-admin-members-table-list-enrichment`
> task type: `UI task` / `VISUAL_ON_EXECUTION` / implementation_mode: `new`（UI lane）+ `verify_existing`（データ層）

## 1. 目的（1 文）

`/admin/members` の list response が既に返している **occupation / ubmZone / ubmMembershipType / tags** を、`MembersTable` の各行で**実データ描画**し、親 workflow が placeholder「—」で hold していた「ざっと見」ギャップを解消する。

## 2. 背景と P50 既実装確認（必須）

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在するか | UI 描画は **未実装**（placeholder「—」/ zone・occupation 列なし） | Phase 5 を通常の実装 Phase とする |
| データ層（API/schema）が upstream にマージ済か | **マージ済**（#968） | データ層は `verify_existing`。Phase 5 で回帰確認のみ |
| 前提タスク（データ enrichment）が完了済か | 完了済 | 依存解消タスク不要 |

### 既実装の正本（参照・変更禁止）

- `apps/api/src/routes/admin/members.ts`（GET `/admin/members`）:
  - SELECT に `(SELECT json_group_array(json_object('code', td.code, 'label', td.label)) FROM member_tags mt JOIN tag_definitions td ON td.tag_id = mt.tag_id WHERE mt.member_id = mi.member_id) AS tags_json`（N+1 回避済 = AC-3 充足）。
  - response mapping で `occupation` / `ubmZone` / `ubmMembershipType` を `answers_json` から派生、`tags` を `parseTagsJson(row.tags_json)` で配列化して返却。
- `packages/shared/src/zod/viewmodel.ts` `AdminMemberListItemZ`:
  ```ts
  occupation: z.string().optional(),
  ubmZone: z.string().nullable().optional(),
  ubmMembershipType: z.string().nullable().optional(),
  tags: z.array(z.object({ code: z.string(), label: z.string() })).optional(),
  ```
- `apps/api/src/routes/admin/members.contract.spec.ts`: enrichment フィールドを assert 済（"prototype list fields are additively derived from answers_json and tags"）。

⇒ **UI から `m.occupation` / `m.ubmZone` / `m.ubmMembershipType` / `m.tags` を参照するだけで実データ描画が可能。API / schema には一切触れない。**

## 3. 受入条件（Issue #981 を現コードへ最適化）

| ID | 受入条件 | 検証手段 |
| --- | --- | --- |
| AC-2a | `MembersTable` の「メンバー」列で `m.occupation` が氏名下に描画される（存在時のみ） | vitest（occupation 文字列 query）+ Phase 11 screenshot |
| AC-2b | 「区画 / ステータス」列に `zoneTone(m.ubmZone)` の zone chip と `statusTone(m.ubmMembershipType)` の type chip が描画される（各々存在時のみ） | vitest（chip text / `data-tone` query） |
| AC-2c | 「タグ」列の placeholder「—」が消え、`m.tags` の label が最大2件 pill 描画、3件以上は `+N` chip が出る | vitest（tag label query / `+N` query） |
| AC-2d | `m.tags` が空 / undefined の行は「未タグ」warn chip（`tone="warning"`）を描画する | vitest（"未タグ" query / `data-tone="warning"`） |
| AC-4 | list 行の tag pill は表示専用（クリックで編集 UI が出ない＝write surface なし） | コードレビュー（onClick handler なし） |
| AC-5 | `apps/web` typecheck green | `pnpm typecheck` |
| AC-6 | 既存 admin filter / pagination / 選択 / drawer open の挙動に regression なし | 既存 TC-MT-01〜05 + a11y が PASS のまま |

## 4. 命名規則の分析（既存コードベース準拠）

| 対象 | 規則 | 根拠（既存ファイル） |
| --- | --- | --- |
| React コンポーネント | PascalCase（`MembersTable`, `MemberStateChipRow`） | `_members/*.tsx` |
| tone ヘルパー | camelCase `zoneTone` / `statusTone` | `apps/web/src/lib/tones.ts` |
| test ファイル | `<Component>.spec.tsx`、`__tests__/` 配下 | `__tests__/MembersTable.spec.tsx` |
| test ケース ID | `TC-MT-0N`（MembersTable 連番） | 既存 spec の `TC-MT-01`〜`05` |
| testid | `admin-members-row-<memberId>` / `member-state-chip-row` | 既存 `MembersTable.tsx` / `MemberStateChip.tsx` |
| chip 構造 | `<Chip tone={...} dot?>{label}</Chip>`、`flex flex-wrap gap-1.5` ラッパ | `MemberStateChip.tsx` |

> **[FB-SDK-07-4 適用]** 新規 API/識別子は追加しないため命名ドリフトリスクは低い。新規ヘルパーを切り出す場合（Phase 8）は `zoneTone`/`statusTone` と同じ camelCase + `lib/tones.ts` 同階層に置く。

## 5. タスク分類（Feedback 1）

- **UI task**（VISUAL）。`screenshot-plan.json` は `mode: "VISUAL"` をデフォルトとする（[Feedback W1-02b-1]）。
- docs-only ではない（CONST_004 判定根拠は index.md 参照）。
- artifact 命名 canonical: `outputs/phase-11/` = `main.md` / `manual-smoke-log.md` / `axe-result.md` / `coverage-changed.txt` / `local-qa.md` / `screenshots/`、`outputs/phase-12/` = strict 7（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）。

## 6. carry-over 確認

- 親 workflow `admin-ui-prototype-alignment-followup-003-...` の Phase 12 unassigned-task-detection で本 Issue #981 が formalize された（tags placeholder hold が発生源）。本タスクはその UI ギャップのみを引き継ぐ。データ層 #968 は完了済のため再実装しない。

## 7. targeted test ファイルリスト（[FB-UI-02-2]）

全件 `pnpm test` は重いため、本タスクは以下に限定実行:

```
apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx
```

（必要時）Playwright: `apps/web/tests/playwright/admin-members-visual.spec.ts`（存在確認の上で実行）。

## 完了条件

- [ ] AC 一覧が Issue #981 の現コード最適化版として固定された
- [ ] P50 既実装確認が記録された（データ層 = verify_existing）
- [ ] 命名規則が既存コードから抽出・記録された
- [ ] タスク分類（UI task / VISUAL）が記録された
</content>
