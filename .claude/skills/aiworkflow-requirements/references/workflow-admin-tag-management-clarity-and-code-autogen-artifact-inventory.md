# workflow-admin-tag-management-clarity-and-code-autogen-artifact-inventory

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-tag-management-clarity-and-code-autogen/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate` |
| purpose | `/admin/tag-master` と `/admin/tags` の関係を非エンジニア向けに明確化し、タグ定義コードを表示名から自動生成する |
| user gate | authenticated staging screenshots 2, staging deploy, commit, push, PR |

## Implementation Targets

| Path | Role |
| --- | --- |
| `apps/web/src/lib/admin/tagCodeAutogen.ts` | 表示名から `TAG_CODE_PATTERN` 適合 code を決定的に生成する純関数 |
| `apps/web/src/lib/admin/tagManagementGlossary.ts` | タグ定義 / タグ割当 / コード等の用語集 SSOT |
| `apps/web/src/components/admin/TagManagementGuide.tsx` | 2 画面の役割説明と相互リンク |
| `apps/web/src/components/admin/TagDefinitionCreateForm.tsx` | 表示名入力時の code 自動補完、手動上書き停止、平易文言 |
| `apps/web/src/components/shell/shell-config.ts` | admin nav label を「タグ割当」へ統一 |
| `apps/web/app/(admin)/admin/tag-master/page.tsx` | `TagManagementGuide variant="definition"` 挿入 |
| `apps/web/app/(admin)/admin/tags/page.tsx` | `TagManagementGuide variant="assignment"` 挿入と文言平易化 |
| `apps/web/src/components/admin/TagQueuePanel.tsx`, `MemberDrawer.tsx` | ユーザー向け「タグキュー」表記を「タグ割当」へ統一 |

## Evidence

| Gate | Result |
| --- | --- |
| focused Vitest | PASS（6 files / 39 tests） |
| web typecheck | PASS |
| web lint | PASS |
| design-token gate | PASS（9 tests） |
| apps/api diff | empty |

## Invariants

- Existing `GET/POST /admin/tags` and `GET /admin/tags/queue` endpoint surfaces are unchanged.
- `apps/api`, D1 migrations/schema, Google Form schema, and shared public contracts are unchanged.
- `apps/web` remains API-helper driven and does not access D1 directly.
- Authenticated staging screenshots are intentionally pending behind user-gated deploy/auth state.

## Lessons Learned

- **L-TAGMGMT-001（codeDirty で自動生成と手動上書きを両立）**: 表示名からコードを自動補完するフォームは `codeDirty: boolean`（初期 `false`）を持ち、表示名 `onChange` では `if (!codeDirty)` のときだけ再生成、コード欄を手で触った瞬間に `setCodeDirty(true)` で以後の自動上書きを止める。1 つの state で「自動で便利」と「手で決めたら尊重」を両立する。`createTag` 呼び出し shape は不変に保つ。
- **L-TAGMGMT-002（生成関数は throw せず決定的 fallback を返す）**: `generateTagCode` は無効・変換不能な入力でも throw せず、決定的 fallback `tag_<djb2(label) base36>` を返し先頭 `tag_` で `[a-z]` 始まりと `TAG_CODE_PATTERN` 適合を保証する（WEEKGRD-02: ガードは無効値でなく安全な fallback を返す）。漢字主体ラベルはローマ字辞書を持たず fallback 化するが、code は技術識別子で非エンジニアには表示名が重要なため許容する（OOS-2）。
- **L-TAGMGMT-003（命名統一は分散箇所を用語集 SSOT で一元化）**: 「タグキュー」→「タグ割当」の改名はナビ label（`shell-config.ts`）・`TagQueuePanel` aria-label・`MemberDrawer` 導線文言・page title と複数箇所に分散する。`tagManagementGlossary.ts`（`TAG_MANAGEMENT_GLOSSARY` / `TAG_MANAGEMENT_COPY`）を文言 SSOT にして表記揺れと stale 残置を防ぐ。href（`/admin/tags`）は不変で IA 文言のみ変更する。
- **L-TAGMGMT-004（表現層サイクルでは 2 画面統合に踏み込まず説明 UI で意図充足）**: 「タグ定義」と「タグ割当」の 1 画面統合（OOS-1）は tag master CRUD と queue resolve で API・データ構造が別系統のため、表現層のみのサイクルでは破綻する。`TagManagementGuide`（`variant: "definition" | "assignment"`）の役割説明 + 相互リンクで「2 画面の違いが分からない」課題を満たし、統合は将来 Issue へ分離する。
- **L-TAGMGMT-005（skill-sync を close-out と取り違えない）**: 本サイクルは skill-sync であり Phase-13（PR）は user-gated で未実施。並行監査 SubAgent が read-only 指示に反し workflow root を `completed-tasks/` へ移動 + 自己参照 20 箇所を rewrite する誤 close-out を起こしたため、`30-workflows/` root へ revert した。skill-sync は close-out を含まない。検出は監査前後の `git status` 自照合、復旧は dir 戻し + `completed-tasks/<slug>` → `<slug>` の冪等 perl 置換。

anti-pattern:
- ❌ 表示名変更のたびに無条件でコードを上書きし、ユーザーが手入力したコードを消す（`codeDirty` ガードなし）。
- ❌ 変換不能ラベルで `generateTagCode` を throw させ、フォーム描画を壊す（安全な fallback を返さない）。
- ❌ 改名をナビ label 1 箇所だけ直し、Panel / Drawer / page title を「タグキュー」のまま残して表記揺れを生む。
- ❌ 表現層タスクで 2 画面の DOM / データ統合に踏み込み、別系統 API の責務境界を壊す。
- ❌ PR 未実施の skill-sync サイクルで workflow を `completed-tasks/` へ移動して close-out したことにする。
