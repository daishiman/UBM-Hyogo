# Phase 8: リファクタリング

## ステータス: completed

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1129-single-write-batchid-correlation` |
| workflow_state | `implemented_local_evidence_captured` |
| 対象 | `apps/api/src/routes/admin/members.ts`（route 層 2 ブロック） |

> 本ファイルはリファクタリング計画である。実装サイクルで「テスト green を維持したまま」適用判断する。

---

## 1. 変更内容（対象 / Before / After / 理由）

FB-RT-03 に従い、変更内容を対象 / Before / After / 理由テーブル形式で記述する。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 単一 assign の audit payload（`members.ts:833-843`） | `after: { tagId, source: "manual" }` | `const batchId = crypto.randomUUID();` を `if (applied)` 直後に生成し、`after: { tagId, source: "manual", batchId }` へ | bulk #1036 と同一 payload 形・JSON path で、単一 write を既存 `GET /admin/audit?batchId=` 導線に乗せる（AC-2 / AC-4）。生成は audit append 責務を持つ route 層に置く。 |
| 単一 unassign の audit payload（`members.ts:872-883`） | `before: { tagId }` | `const batchId = crypto.randomUUID();` を `if (removed)` 直後に生成し、`before: { tagId, batchId }` へ | bulk unassign と非対称配置（before_json 側）を一致させ、batchId フィルタの OR 検索が改修なしで効く（AC-3 / AC-4）。 |

---

## 2. 重複削減の検討（duplicate / YAGNI 判断）

| 候補 | 判断 |
| --- | --- |
| assign / unassign の 2 箇所に出る `const batchId = crypto.randomUUID();` を共通ヘルパ（例: `newCorrelationId()`）へ抽出する | **しない（インライン維持を妥当と判断）。** 理由: (a) 出現は **2 箇所のみ** で、`crypto.randomUUID()` という標準 API 1 行に対するラッパは抽象化が読みやすさを下げる（rule of three 未成立）。(b) bulk 経路の batchId は `bulkApplyMemberTagsByAdmin`（repository 層）が item を跨ぐため一括生成して返す **別経路** であり、route 層ヘルパに集約しても bulk とは共有できず統一にならない。(c) インラインなら「この audit 行 1 件に対する request-scoped correlation」という意図が呼び出し位置で直読でき、群サイズ1 の意味論がコメントと隣接して保てる。3 箇所目の単一 write correlation が現れた時点で初めてヘルパ化を検討する（その時が抽象化の正しいタイミング）。 |

> 判断結論: **ヘルパ化しない。assign / unassign 各 1 行のインライン生成を維持する。** 2 箇所のみ・bulk は別経路・意図の局所性が理由。

---

## 3. 命名整合（既存規則への準拠確認）

| 項目 | 規則 | 本タスクの命名 | 整合 |
| --- | --- | --- | --- |
| payload 相関キー | bulk 既存の `batchId`（`members.ts:761,770`） | `batchId` | OK（逐語再利用。意味論は correlation id・群サイズ1 だが命名は bulk 揃え） |
| UUID 生成 | `crypto.randomUUID()`（`memberTags.ts:304`） | `crypto.randomUUID()` | OK（同一手段を route 層で使用） |
| JSON path | `$.batchId`（`auditLog.ts:200-205` の OR 検索） | assign=after_json / unassign=before_json | OK（bulk と非対称配置一致） |
| audit action 名 | `admin.member.tag_assigned` / `tag_unassigned` | 変更なし | OK（action 名は不変） |

→ 新規命名の追加 / 改名は不要。既存命名規則に自然に乗る。

---

## 4. navigation drift 確認

| 確認 | 結果 |
| --- | --- |
| navigation drift | **なし。** UI / ルーティング / nav item の変更は一切ない（NON_VISUAL・`apps/web` 非接触）。route 層の audit payload 拡張のみ。 |

---

## 5. リファクタリング後の検証

リファクタリング適用後（または非適用確定後）も、Phase 4 / 6 の全テストが green であることを確認:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts
```

---

## 完了条件

- [x] 変更内容が対象 / Before / After / 理由テーブル（FB-RT-03）で記述されている
- [x] `crypto.randomUUID()` 2 箇所のヘルパ抽出判断（YAGNI・bulk は別経路・インライン維持）が記録されている
- [x] 命名整合が既存規則（`batchId` / `crypto.randomUUID()` / `$.batchId`）と突き合わせて確認されている
- [x] navigation drift なしが明記されている
