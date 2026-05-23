# Phase 12: 振り返り・正本仕様 sync

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. 必須 7 outputs（path existence pre-check）

`outputs/phase-12/` 配下に以下 7 ファイルを必ず生成。**1 件欠落で FAIL 固定**（skill `phase12-checklist-definition.md` 規約）。

| # | path | 役割 |
|---|------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 全体サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | 中学生レベル概念説明（Phase 12 強制要件） |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 8+ 点 compliance チェック（quality-gates §7 準拠） |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements への反映概要（contract test 単体のため反映 minimum） |
| 5 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への feedback |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（`DeleteBodyZ` の shared 昇格は今回目的に不要な no-op として記録） |
| 7 | `outputs/phase-12/documentation-changelog.md` | spec 追加 + route 3 ファイル微修正に伴う変更ドキュメント一覧 + canonical absolute path |

## 2. implementation-guide.md（Part 1 / Part 2）

Part 1 は中学生レベル説明として以下 7 セクション必須:

1. このタスクで何を作ったか（1 文で）
2. なぜ必要だったか（UI mock と API contract が drift したら何が起きるか）
3. どこに保存されているか（`apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`）
4. どう動くか（zod schema を import → fixture object を `parse()` に通す流れを順序で）
5. zod schema とは何か / contract test とは何か
6. 失敗したらどうなるか（CI で 2a/2b/2c の Playwright spec より先に red）
7. 次に拡張するならどうするか（cascade preview API 実装後に endpoint を追加。`DeleteBodyZ` の shared 昇格は同種 consumer が複数化するまで行わない）

Part 2 は技術者向け説明として、shared schema 正本（`MergeIdentityResponseZ` shape）、route 3 ファイル named export 化の必要性、`expectTypeOf` による type-level 同型、CONST_007（schema 重複禁止）、evidence command、状態語彙、CI/user-gate の 7 項目を必須とする。用語セルフチェック表も含める。

## 3. compliance check 8 点（quality-gates §7）

| # | 項目 | 確認 |
|---|------|------|
| 1 | 対象 spec の列挙 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| 2 | 1 行実行コマンド | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| 3 | 実行前提と自動化スクリプト | `pnpm install`（追加依存なし） |
| 4 | un-skip 不変条件 | skip = 0 |
| 5 | 外部依存の不在 | DB / network / FS / Cloudflare binding 一切触れない pure unit |
| 6 | dev server 不要 | contract test のため不要 |
| 7 | CI gate 化 | `apps/api` Vitest job で自動拾い（命名規則 `*.test.ts` 適合） |
| 8 | E2E lines coverage gate との関係 | contract test 単体は coverageTier `standard` の加点対象外（green の有無のみ） |
| 9 | schema 重複禁止 (CONST_007) | `z.object(` count = 0 |
| 10 | shared schema 正本（`MergeIdentityResponseZ` shape） | fixture が `archivedSourceMemberId` + `auditId` を含む |
| 11 | `DeleteBodyZ` shared 昇格は no-op | 本 PR では route named export で目的達成 |
| 12 | route 3 ファイル diff 粒度 | 各 +1 字句〜+1 行に収まる |

## 4. unassigned-task-detection.md（次タスク候補）

新規未タスク検出は 0 件とする。

| 候補 | 判定 | 理由 |
|------|------|------|
| `DeleteBodyZ` の `packages/shared/src/schemas/` 昇格 | no-op | route named export で schema 重複禁止を満たし、今回の contract test 目的に追加の共有 schema 再編は不要 |
| 親 workflow の旧 merge response shape 補正 | no-op | 親 `completed-tasks/e2e-quality-uplift-stage-2/phase-4.md` / `phase-5.md` は現時点で shared schema shape に補正済み |
| 2a/2b/2c spec fixture 補正 | no-op | 2b sub-task spec は `archivedSourceMemberId` + `auditId` を明記済み。2d は今後の drift gate として機能する |

## 5. dirty-code gate

```bash
git status --porcelain apps/ packages/
```

期待: 以下 4 件のみ。
- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（新規）
- `apps/api/src/routes/admin/member-delete.ts`（+1 字句）
- `apps/api/src/routes/admin/requests.ts`（+1 行）
- `apps/api/src/routes/admin/audit.ts`（+1 行）

`apps/web` / `packages/shared` / `apps/api/src/routes/admin/identity-conflicts.ts` / migrations の dirty diff は分類・分離記録なしに PASS しない。

## 6. placeholder token 0 件 gate

```bash
rg -n "token-sized|09b-token-value|token-mix|TODO\\(.*\\)|FIXME" outputs/phase-12/ apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts
```

期待: spec 内 / outputs 内ともに 0 件。

## 7. 状態確定

| 条件 | workflow_state |
|------|---------------|
| 7 outputs 揃い + 12 点 compliance PASS + dirty-code gate PASS + placeholder 0 | `implemented_local_evidence_captured` |
| 1 件でも欠落 / FAIL | `runtime_pending` 維持、Phase 11 へ revert |
