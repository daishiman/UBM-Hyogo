# Phase 1 — Requirements

**[実装区分: ドキュメントのみ]**

判定根拠（CONST_004）: 本タスクの最終成果物は 3 ファイルの `.md` 編集（Phase 6 spec §3 への 1 行 note、Phase 10 spec line 130/141 の文言 backfill、`patterns-lessons-and-pitfalls.md` への 2 entry もしくは「集約済みのため不要」判定記録）に限定され、`apps/` / `packages/` 配下のコード変更を一切伴わない。CONST_005 の必須項目（変更対象ファイル / 差分方針 / 実行コマンド / DoD）は本仕様書の Phase 3-10 に網羅する。

## メタ情報

```yaml
issue_number: 884
task_id: serial-06-followup-003-phase6-topology-sync-backfill
classification: docs-only
parent_workflow: docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/
status: spec_created
```

## 1. なぜこのタスクが必要か（Why）

Issue #884 「serial-06 Phase 6 spec ↔ 実装 Playwright topology の sync」の DoD 4 件のうち、調査時点で以下の状況:

| DoD | 状況 | 残作業 |
|-----|------|--------|
| Phase 6 spec path 統一 (`apps/web/playwright/tests/...`) | ✅ 完了済み | なし |
| Phase 6 spec §3 に SSR fetch intercept 制約 note 追記 | ⚠️ implication のみ | 1 行 note 明示追記 |
| `patterns-lessons-and-pitfalls.md` に 2 entry 追加 | ⚠️ 別 reference に体系反映済 | 集約先を本 reference に cross-link 追記 |
| `verify:phase12-compliance` pass | ❓ 未検証 | 検証実行 |

追加 drift（issue 未指摘）: `phase-10-local-verification.md:130,141` に古い `page.route()` 記述が残存し戦略B採用と矛盾。本タスクで一括 backfill する。

## 2. 何を達成するか（What）

- Phase 6 spec §3 に SSR fetch intercept 制約の明示 note を追加
- Phase 10 spec line 130/141 の `page.route()` 記述を mockApi fixture（戦略B）採用に backfill
- `patterns-lessons-and-pitfalls.md` に「Server Component fetch + page.route 不整合」「Playwright testDir 規約」の 2 entry を追加（または既存 reference への集約 cross-link）
- `unassigned-task/serial-06-followup-003-phase-6-playwright-topology-sync.md` を `consumed` 化し本 workflow へ canonical_workflow pointer 付与
- `verify:phase12-compliance` および `gate-metadata:validate` が green

## 3. スコープ

### 含む
- 上記 3 ファイルの編集
- unassigned-task の consumed 化
- 本 workflow の Phase 1-13 spec / artifacts.json / Phase 12 compliance check

### 含まない
- `apps/` / `packages/` 配下のコード変更
- `playwright.config.ts` / fixture の API 変更
- 他 sub-workflow（serial-07 等）の spec 改修
