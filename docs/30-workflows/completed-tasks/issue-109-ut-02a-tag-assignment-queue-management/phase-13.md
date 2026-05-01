# Phase 13: PR 作成（user 承認ゲート）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-109-ut-02a-tag-assignment-queue-management |
| Issue | #109 [UT-02A] tag_assignment_queue 管理 Repository / Workflow |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval_required | **true** |
| 状態 | pending |

## ユーザー承認確認文 (冒頭必須)

**この Phase は user の明示承認がある場合のみ実行する。承認なしで `git commit` / `git push` / `gh pr create` のいずれも発火しない。**
**approval-gated NON_VISUAL implementation パターン: user 承認 → commit → push & PR の三役ゲート方式で進行する。**

## 目的

Phase 1〜12 の成果物（migration / repository / workflow / test / docs）を feature branch に
5 commit 単位で push し、`feature/issue-109-* → dev` PR を作成する。
NON_VISUAL タスクのため visual evidence は curl / log / coverage に置換する。

## 実行タスク

1. local check 5 コマンド実行 → `local-check-result.md`
2. 変更サマリー作成 → `change-summary.md`
3. PR description 作成 → `pr-info.md`
4. **user 承認ゲート（第1役）**: 変更内容と PR description を提示し、承認を得る
5. **user 承認ゲート（第2役）**: 5 commit 単位で stage & commit
6. **user 承認ゲート（第3役）**: push & `gh pr create` → `pr-creation-result.md`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/ | 全 7 成果物 |
| 必須 | outputs/phase-12/phase12-task-spec-compliance-check.md | 不変条件 trace |
| 必須 | outputs/phase-11/ | 手動 smoke / NON_VISUAL evidence |
| 参考 | .claude/skills/task-specification-creator/references/phase-template-phase13.md | テンプレ |

## 実行手順

### ステップ 1: 最終 local check

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F @apps/api test -- --coverage
mise exec -- pnpm -F @apps/api build
```

### ステップ 2: `local-check-result.md`

- 各コマンドの exit code / 所要時間 / coverage 数値を記録

### ステップ 3: `change-summary.md`

- 変更ファイル一覧（migration / repository / workflow / test / docs に分類）
- AC trace（Issue #109 の受入基準への対応表）
- 不変条件 #5 / #13 compliance 再掲

### ステップ 4: 5 commit 粒度（user 承認後のみ実行）

| # | 粒度 | 対象 | commit message 例 |
| --- | --- | --- | --- |
| 1 | migration | `apps/api/migrations/*.sql` | `feat(db): add tag_assignment_queue table (Refs #109)` |
| 2 | repository | `apps/api/src/db/repositories/tagQueue*.ts` | `feat(api): TagQueueRepository with idempotency (Refs #109)` |
| 3 | workflow | `apps/api/src/routes/admin/tagQueue*.ts` | `feat(api): tag queue workflow with retry/DLQ (Refs #109)` |
| 4 | test | `apps/api/test/**/tagQueue*.test.ts` | `test(api): tag queue repository & workflow (Refs #109)` |
| 5 | docs | `docs/30-workflows/issue-109-*/` | `docs(workflow): UT-02A phase 12 outputs (Refs #109)` |

### ステップ 5: PR title / body テンプレ

```
title: feat(api): UT-02A tag_assignment_queue repository & workflow

body:
## Summary
- tag_assignment_queue テーブル + Repository + Workflow 実装
- idempotency / retry (max 3, exp backoff) / DLQ / 緊急停止 flag を実装
- 02a memberTags.ts は read-only 維持（不変条件 #13 を repository で enforce）
- NON_VISUAL: visual evidence は curl / log / coverage に置換

## Refs
Refs #109   ← Closes は禁止（user 承認後の merge 段階で別途 close 判断）

## Evidence
- outputs/phase-11/curl/*.log
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/local-check-result.md (coverage 数値)

## Risks / Rollback
- migration 失敗時: down migration (`*_down.sql`) で table drop
- 緊急停止: env `TAG_QUEUE_PAUSED=true` を Cloudflare secret から設定し enqueue を 503 短絡
```

### ステップ 6: PR 発行（user 承認後のみ）

```bash
git push -u origin feature/issue-109-ut-02a-tag-assignment-queue-management
gh pr create --base dev \
  --head feature/issue-109-ut-02a-tag-assignment-queue-management \
  --title "feat(api): UT-02A tag_assignment_queue repository & workflow" \
  --body-file outputs/phase-13/pr-info.md
```

## CI 確認項目

| ジョブ | 確認内容 |
| --- | --- |
| typecheck | `pnpm typecheck` が green |
| lint | `pnpm lint` が green |
| test | `apps/api` の vitest が green |
| coverage | apps/api 全体 80% 以上、tagQueue* は 90% 以上 |
| verify-indexes | `pnpm indexes:rebuild` 必要なら実行 |

## rollback 手順

| 種別 | 手順 |
| --- | --- |
| migration | down migration 適用: `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`（down ファイル指定） |
| 緊急停止 flag | Cloudflare secret 経由で `TAG_QUEUE_PAUSED=true` を設定 → enqueue を 503 短絡 |
| PR revert | `gh pr revert <PR_NUMBER>` または revert commit を `dev` へ |

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| dev 環境 | merge 後に staging で smoke 実施 |
| 後続 Issue | 08a / 08b の検索 / 公開タグ表示が本 PR の queue を起点に動作 |

## 多角的チェック観点

| 不変条件 | 最終確認 | 結果 |
| --- | --- | --- |
| #5 D1 直接アクセス禁止 | apps/api 内のみ | OK |
| #13 tag は queue → resolve 経由のみ | repository が enforce | OK |

## 変更サマリー（暫定）

- migration: 1 ファイル（up / down）
- repository: 1 ファイル + types
- workflow: route + handler
- test: unit + integration
- docs: 7 成果物 + spec 3 ファイル更新

## close-out チェックリスト

- [ ] user 承認あり（第1役: 内容承認）
- [ ] user 承認あり（第2役: commit 承認）
- [ ] user 承認あり（第3役: push & PR 承認）
- [ ] local-check-result.md 記録済
- [ ] change-summary.md 記録済
- [ ] pr-info.md / pr-creation-result.md 記録済
- [ ] Phase 12 close-out 済み
- [ ] PR が `feature/issue-109-* → dev`
- [ ] PR body に `Refs #109`（`Closes` 禁止）
- [ ] artifacts.json で phase 13 を completed

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | pending | 5 コマンド |
| 2 | local-check-result.md | 13 | pending | exit code / coverage |
| 3 | change-summary.md | 13 | pending | AC trace |
| 4 | pr-info.md | 13 | pending | description |
| 5 | user 承認（第1役） | 13 | pending | 内容承認 |
| 6 | commit 5 粒度 | 13 | pending | 承認後のみ |
| 7 | user 承認（第2役） | 13 | pending | commit 承認 |
| 8 | push & gh pr create | 13 | pending | 第3役承認後 |
| 9 | pr-creation-result.md | 13 | pending | URL 記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 作成記録 |
| ドキュメント | outputs/phase-13/local-check-result.md | local check 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| ドキュメント | outputs/phase-13/pr-info.md | PR description |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR URL / CI 状態 |
| メタ | artifacts.json | phases[13].status = completed |

## 完了条件

- [ ] user 承認 三役すべて取得
- [ ] local check 全 5 コマンド pass
- [ ] PR 発行 / URL 記録
- [ ] CI（typecheck / lint / test / coverage）green
- [ ] artifacts.json completed

## タスク100%実行確認

- approval gate 三役通過
- PR URL を `pr-creation-result.md` に記録
- artifacts.json で phase 13 を completed

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ: 後続 Issue 08a / 08b
- ブロック条件: user 承認のいずれかが欠ける場合は commit / push / PR 発行を実行しない
