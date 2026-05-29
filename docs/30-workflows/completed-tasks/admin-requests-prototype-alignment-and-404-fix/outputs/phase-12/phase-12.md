# Phase 12 — ドキュメント更新

> 必須 5 タスク全てを満たす。0 件でも出力必須項目あり。

---

## 1. Task 1 — 実装ガイド（2 パート構成）

成果物: `outputs/phase-12/implementation-guide.md`（生成済み）

### Part 1（中学生レベル）

- 「依頼キュー」は会員さんからの「公開してほしい / 退会したい」希望を受け取る窓口の例え。
- これまで窓口の張り紙が古くて 404（見つからない）になっていたのを、窓口自体を引っ越して新しい看板を出すイメージ。
- 看板（UI）も他の管理画面と同じ形に揃える。

### Part 2（技術者レベル）

- 変更ファイル一覧 / 関数シグネチャ / DOM 契約 / 実行コマンドを `tasks/task-A-api-404-fix.md` と `tasks/task-B-ui-prototype-alignment.md` から転記。
- 不変条件 #1〜#11 のチェックリスト最終状態を記載。
- screenshots: Phase 11 §2 のテーブルを転記。

---

## 2. Task 2 — システム仕様書更新（4 サブステップ）

| Step | 対象 | 内容 |
|------|------|------|
| 1-A | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` §7 Requests | 「依頼キュー」セクションに「primitive 整合済（2026-05-27）」を追記。完了タスク行を表に追加 |
| 1-A | `.claude/skills/aiworkflow-requirements/LOGS.md` | 完了 entry を追記 |
| 1-A | `.claude/skills/aiworkflow-requirements/topic-map.md` | admin-requests を追記 |
| 1-A | `.claude/skills/aiworkflow-requirements/artifact-inventory.md` | Lessons Learned 節に L-ADMREQ-xxx を追加 |
| 1-B | 実装状況テーブル（aiworkflow） | `/admin/requests` を `completed` に更新 |
| 1-C | 関連タスクテーブル | 完了状態に同期 |
| 2 | 新規インターフェース追加 | **N/A**（API surface 不変） |

---

## 3. Task 3 — ドキュメント更新履歴

```bash
node scripts/generate-documentation-changelog.js \
  --workflow admin-requests-prototype-alignment-and-404-fix \
  --output outputs/phase-12/documentation-changelog.md
```

---

## 4. Task 4 — 未タスク検出（0 件でも出力必須）

```bash
node scripts/detect-unassigned-tasks.js \
  --scan apps/api/src/routes/admin apps/web/src/components/admin \
  --output .tmp/unassigned-candidates.json
```

候補ソース（必ず確認）:
- 元 spec の「スコープ外」: 新 endpoint / D1 schema / 新 token — 全て **out-of-scope 明示済**、未タスク化しない
- Phase 3/10 MINOR: なし想定
- Phase 11 manual test: HIGH 問題 0 件想定
- TODO/FIXME/HACK/XXX grep: Phase 5 完了時に再走
- `describe.skip`: なし

出力: `outputs/phase-12/unassigned-task-detection.md`（0 件でも生成）。

---

## 5. Task 5 — Skill フィードバックレポート

`outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力必須）に以下観点で記録:
- task-specification-creator: 1 サイクル完結スコープ判定の精度
- aiworkflow-requirements: same-wave sync の運用性

---

## 6. Lessons Learned（候補）

| ID | 内容 |
|----|------|
| L-ADMREQ-001 | `ADMIN_FETCH_404` の root cause は staging bundle drift / URL drift / route mount drift の 3 軸で切り分けるのが最短（Phase 2 §1 決定木） |
| L-ADMREQ-002 | Server Component の `safeServerFetch` は HTTP status をそのまま code 化するため、`ADMIN_FETCH_404` は真の 404 を意味する（fetch エラーを 404 に丸めない） |
| L-ADMREQ-003 | admin shell 整合は wrapper を `page-enter stack-lg` + `page-head` で包むだけで他画面と同調する（新 primitive 不要） |
| L-ADMREQ-004 | page.tsx と panel 両方に h1 があったら page.tsx を h1 担当に固定し panel 側は visually-hidden h2 へ降格（L-PGHEAD-001 と整合） |

---

## 7. DoD

- [x] Task 1〜5 全成果物を `outputs/phase-12/` に配置。
- [x] aiworkflow-requirements 6 surface を same-wave で更新。
- [x] task-specification-creator surface は既存 rule 適用で no-op と記録。
- [ ] `pnpm verify:phase12-compliance` ok。
- [ ] `pnpm gate-metadata:validate` 0 ERROR。
- [ ] `pnpm indexes:rebuild` idempotent。
