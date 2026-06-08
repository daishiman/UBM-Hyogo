# Phase 11 出力 — 手動テスト結果（NON_VISUAL 証跡メタ）

> 親: [phase-11.md](../../phase-11.md)。NON_VISUAL タスクの証跡メタ。主ソース = 自動テスト。screenshot を作らない理由を明記する。

## 0. NON_VISUAL 証跡方針

- **タスク種別**: NON_VISUAL（D1 read 関数 + admin read-only JSON endpoint）。
- **証跡の主ソース**: 自動テスト（repository spec + contract spec）の green 結果。endpoint の挙動は JSON shape アサーションで保証され、画面描画を介さない。
- **screenshot 不要**: UI 描画変更ゼロのため視覚証跡は意味を持たない。`screenshots/` ・`.gitkeep` ・`screenshot-plan.json` は**作成しない**（誤誘導回避）。

## 1. 主証跡（自動テスト・2026-06-06 実走）

| spec ファイル | カバー AC | 主要テスト（設計） | pass 件数 |
|---------------|-----------|--------------------|-----------|
| `memberTags.orphan.repository.spec.ts` | AC-2 / AC-3 | 孤児あり / なし / 混在・空集合・ソート（TC-R01〜R07）+ `assignTagsToMember` 未定義 tag skip（TC-R08） | 8 passed |
| `tags.contract.spec.ts` | AC-6 | `GET /admin/tags/orphans` 孤児 0 / 孤児あり（TC-C01〜C04）+ 409 ガード非破壊 | 15 passed |
| `members.contract.spec.ts` | AC-3 / AC-5 | 既存 member fixture 健全性確認（`tag_a`/`tag_b` 定義済み・fixture 差分なし） | 28 passed |
| `tagDefinitions.write.repository.spec.ts` | AC-4 / AC-7 | issue-1070 count guard 非破壊 | 8 passed |

実測 focused vitest: `Test Files 4 passed (4)` / `Tests 59 passed (59)`。

## 2. 実地操作不可と既知制限

- commit / deploy / staging 実データ確認は user-gated。**ローカル / staging のブラウザ手動操作は NON_VISUAL のため実施しない。**
- **代替記録**: 自動テストの seed データに対する孤児検出結果を証跡とする。
- **既知制限**: staging 実データ（実 member_tags 行）に対する孤児検出は §3 の curl 確認（staging deploy 後・user-gated）でのみ観測可能。

## 3. 手動 curl 確認手順（staging・user-gated・参考）

```bash
curl -s -H "Authorization: Bearer <ADMIN_TOKEN>" \
  "https://<staging-api-host>/admin/tags/orphans" | jq .
# 健全: { "ok": true, "count": 0, "orphans": [] }
# 孤児あり: { "ok": true, "count": N, "orphans": [ { "memberId","tagId","source","assignedAt","assignedBy" }, ... ] }
```

- 確認観点: `ok:true` / HTTP 200・`count` と `orphans.length` 一致・read-only ゆえ再実行で同一結果（副作用ゼロ）。
