# UT-07A-FU-01 memberTags.assignTagsToMember cleanup

**実装区分**: 実装仕様書（コード変更を伴う）
**source issue**: [#294](https://github.com/daishiman/UBM-Hyogo/issues/294)（CLOSED のまま参照）
**taskType**: implementation / **visualEvidence**: NON_VISUAL
**規模**: 小規模（helper-boundary: コメント・JSDoc 追加 + focused boundary tests + evidence 取得）

## issue との差分（最新コードに最適化）

| issue の前提 | 最新コードでの実態 | 結論 |
| --- | --- | --- |
| `assignTagsToMember` は production caller を失った | `apps/api/src/workflows/tagQueueResolve.ts:178` が唯一の production caller として **生存中** | 削除不可。helper として残存させたまま「直接利用禁止」を明示する経路を採る |
| 受入条件「削除 or test/helper 限定化」 | type-level test (`memberTags.readonly.test-d.ts`) で write keyword gate + allow list + `assign*` 派生禁止 gate が存在 | 現タスクの受入に十分。将来の `assignTagsToMemberBulk` 等も検知対象 |

→ issue が本来意図した「不変条件 #13 を読む後続実装者の誤解防止」は **本体コード (`memberTags.ts`) への JSDoc 警告でのみ未達**。この 1 点を本タスクで根本解決する。

## 根本問題

`apps/api/src/repository/memberTags.ts` 冒頭コメントは「書き込み API は提供しない（不変条件: タグは rule/ai/manual で管理される）」と宣言しているが、同ファイル内に `assignTagsToMember`（INSERT/UPDATE 実行）が export されており **読み手に矛盾を与える**。`tagQueueResolve` workflow 専用 helper であることはテストファイル側にしか書かれておらず、本体コードを単独で読んだ後続実装者は「書き込み API も使ってよい」と誤解する余地が残る。

## スコープ

### 含む

- `apps/api/src/repository/memberTags.ts` の以下 3 箇所への JSDoc / コメント追加
  - ファイル冒頭コメント（L1-2）に `assignTagsToMember` の例外を明記
  - `assignTagsToMember` 関数定義 (L63) に「`tagQueueResolve` workflow 専用 helper、直接呼び出し禁止」JSDoc
  - `MemberTagsProvider` interface 内 `assignTagsToMember` 宣言 (L94) に同趣旨の JSDoc
- `rg` evidence 取得（caller が `tagQueueResolve.ts` のみであることの確認記録）

### 含まない

- `assignTagsToMember` の削除（caller あり、不可）
- 関数名のリネーム（API surface 変更による影響範囲拡大を回避）
- `tagQueueResolve` workflow の仕様変更
- `member_tags` schema 変更
- type-level test (`memberTags.readonly.test-d.ts`) の `assign*` 派生禁止 gate 追加

## Phase 一覧

| Phase | ファイル | 主目的 |
| --- | --- | --- |
| 1 | outputs/phase-01.md | 要件定義・current topology 確認 |
| 2 | outputs/phase-02.md | validation matrix（コマンド・gate） |
| 3 | outputs/phase-03.md | 上位設計（変更モジュール俯瞰） |
| 4 | outputs/phase-04.md | 詳細設計（JSDoc 文面の正本） |
| 5 | outputs/phase-05.md | 実装手順（diff 単位の指示） |
| 6 | outputs/phase-06.md | テスト計画（既存 test の継続 PASS） |
| 7 | outputs/phase-07.md | レビュー観点 |
| 8 | outputs/phase-08.md | リスクと対策 |
| 9 | outputs/phase-09.md | ロールアウト戦略 |
| 10 | outputs/phase-10.md | 運用・監視 |
| 11 | outputs/phase-11.md | evidence 収集（NON_VISUAL） |
| 12 | outputs/phase-12.md | ドキュメント・未タスク検出 |
| 13 | outputs/phase-13.md | commit / PR（ユーザー承認後のみ） |

## DoD（workflow 全体）

1. `apps/api/src/repository/memberTags.ts` の対象 3 箇所に JSDoc が追加され、`pnpm typecheck` / `pnpm lint` が PASS
2. `pnpm --filter @ubm-hyogo/api test -- tagQueue` および `memberTags.readonly` が PASS
3. `rg "assignTagsToMember" apps/api/src packages/shared/src` の結果が分類上、次を満たす
   - 定義 / JSDoc / provider binding: `apps/api/src/repository/memberTags.ts`
   - production caller: `apps/api/src/workflows/tagQueueResolve.ts` (1 箇所)
   - test: `apps/api/src/workflows/tagQueueResolve.contract.spec.ts` / `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` / `apps/api/src/middleware/repository-providers.spec.ts`
   - 固定 hit 数ではなく、production caller が `tagQueueResolve.ts` の 1 箇所に限定されることを `outputs/phase-11/grep-assignTagsToMember.txt` に保存する
4. Phase 12 で strict 7 outputs（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）を生成
