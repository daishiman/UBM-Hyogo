# Phase 11 — 手動 walkthrough / screenshot evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | serial-05-step-02-identity-conflicts-merge |
| 実装区分 | **実装仕様書** |
| 直列順序 | 2/5 |
| 上流タスク | step-01 useAdminMutation hook |
| 対象画面 | `/admin/identity-conflicts` |
| visualEvidence | **VISUAL**（UI 変更を伴うため screenshot 必須） |
| Phase 11 種別 | UI smoke evidence + manual walkthrough |
| 上流 spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-02-identity-conflicts-merge/spec.md` |

> 上流 spec の DoD §9「modal open/close / mutation 後 list 自動 refetch / error handling (409, 400) / smoke test PASS」を Phase 11 evidence で担保する。CONST_007 に従い、本 Phase 内で全状態の screenshot 取得まで完遂すること。「後続で取る」は許容しない。

---

## 1. 目的

admin/identity-conflicts の既存 row 内 inline 二段階確認について、6 つの interaction state を walkthrough で再現し、screenshot evidence と smoke test 結果で UI 仕様の DoD を満たすこと。

---

## 2. 実行タスク

| # | タスク | 必須 outputs |
| --- | --- | --- |
| T11-1 | 6 状態の interaction を手動再現する | `outputs/phase-11/manual-test-checklist.md` |
| T11-2 | 各状態の screenshot を canonical path に保存する | `outputs/phase-11/<state>.png`（4 枚） |
| T11-3 | walkthrough 結果と所見をまとめる | `outputs/phase-11/manual-test-result.md` / `manual-test-report.md` |
| T11-4 | Apple UI/UX 視覚レビューを記録する | `outputs/phase-11/ui-sanity-visual-review.md` |
| T11-5 | 発見事項（Blocker / Note / Info）を分類する | `outputs/phase-11/discovered-issues.md` |
| T11-6 | screenshot 計画と capture metadata を生成する | `outputs/phase-11/screenshot-plan.json` / `phase11-capture-metadata.json` |
| T11-7 | smoke test (`pnpm e2e:smoke`) を実行し結果を残す | `outputs/phase-11/manual-smoke-log.md` |
| T11-8 | Phase 11 top index を作成する | `outputs/phase-11/main.md` |

---

## 3. インタラクション状態テーブル（6 状態必須）

inline merge confirmation panel の全状態を以下に固定する。screenshot は太字の 4 状態を最小撮影対象とする。残り 2 状態（idle / submitting）は最小要件外だが、`manual-test-checklist.md` で挙動確認は必須。

| # | state | トリガー | 期待 UI / 副作用 | screenshot 必須 | canonical path |
| --- | --- | --- | --- | --- | --- |
| 1 | `idle` | 画面初期表示。inline panel 未表示・一覧 + Merge button 表示のみ | conflict list が list で表示、各行に `Merge` button、inline panel は closed | 任意 | `outputs/phase-11/01-idle.png`（任意） |
| 2 | **`inline-confirm-open`** | 任意行の `merge` button click | row 内に「確認 1/2」panel が開き、source/target member id と操作説明を表示する | **必須** | `outputs/phase-11/02-inline-confirm-open.png` |
| 3 | `submitting` | reason 1 文字以上入力 → `merge 実行` click 直後 | `merge 実行` button / Cancel が disabled。router.refresh() 完了前は row 内 panel を維持 | 任意（取得できれば望ましい） | `outputs/phase-11/03-submitting.png`（任意） |
| 4 | **`success`** | API 200 OK 受信後 | inline panel close、toast「統合しました」表示、router.refresh() 実行 | **必須** | `outputs/phase-11/04-success-toast.png` |
| 5 | **`error-409`** | API が `{ "error": "ALREADY_MERGED" }` を返す | inline panel は閉じない、reason 入力値保持、inline alert / toast「すでに統合済みです」表示、再試行可能 | **必須** | `outputs/phase-11/05-error-409.png` |
| 6 | **`error-400`** | API が `{ "error": "TARGET_MEMBER_MISMATCH" }` を返す | inline panel は閉じない、reason 保持、inline alert / toast「対象 ID が一致しません」表示、再試行可能 | **必須** | `outputs/phase-11/06-error-400.png` |

### 撮影 viewport

- 共通: 1440 × 900（desktop）/ DPR 2
- Apple UI/UX レビュー基準（rhythm 8pt grid / OKLch token / focus ring）を `ui-sanity-visual-review.md` に記録

### 撮影手順（再現性のため固定）

1. `mise exec -- pnpm dev` で開発サーバー起動
2. test admin（`manjumoto.daishi@senpai-lab.com`）で `/admin/identity-conflicts` にログイン
3. Playwright MSW or 開発用 stub で API response を切替（成功 / 409 / 400）
4. 各 state を再現し Playwright `page.screenshot({ path: "outputs/phase-11/<state>.png" })` で保存
5. `screenshot-plan.json` の `mode` は `"VISUAL"`、`taskId` は本タスク ID と一致させる

---

## 4. 参照資料

| 種別 | パス |
| --- | --- |
| 上流 spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-02-identity-conflicts-merge/spec.md` |
| 直列順序 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/EXECUTION-ORDER.md`（存在時） |
| design tokens | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md` |
| step-01 hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts`（step-01 で実装済） |
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/` |
| Phase 11 ガイド | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| screenshot ガイド | `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md` |

---

## 5. 実行手順

```bash
# 1. 依存 & 起動
mise exec -- pnpm install
mise exec -- pnpm dev   # http://localhost:3000

# 2. unit test（先に green を確認）
mise exec -- pnpm test apps/web --run -- IdentityConflictRow.spec.tsx
mise exec -- pnpm test apps/web --run -- IdentityConflictRow.spec.tsx

# 3. smoke test（Phase 11 連携の正本）
mise exec -- pnpm e2e:smoke

# 4. screenshot 取得（Playwright capture script 経由）
node .claude/skills/task-specification-creator/scripts/capture-screenshots.js \
  --workflow docs/30-workflows/serial-05-step-02-identity-conflicts-merge \
  --plan outputs/phase-11/screenshot-plan.json

# 5. 取得後の metadata 同期
jq '.taskId' docs/30-workflows/serial-05-step-02-identity-conflicts-merge/outputs/phase-11/phase11-capture-metadata.json
# → "serial-05-step-02-identity-conflicts-merge" であること
```

---

## 6. 統合テスト連携（smoke test）

| 項目 | 内容 |
| --- | --- |
| コマンド | `mise exec -- pnpm e2e:smoke` |
| 期待結果 | identity-conflicts 関連 scenario が PASS（全 scenarios の件数を `manual-smoke-log.md` に件数記録） |
| 失敗時 | `discovered-issues.md` に Blocker として分類し、Phase 12 進行禁止 |
| 記録項目 | 実行コマンド / 期待結果 / 実測 / PASS or FAIL / vitest or playwright report path |

`manual-smoke-log.md` の最小フォーマット:

| 実行コマンド | 期待 | 実測 | 判定 |
| --- | --- | --- | --- |
| `pnpm e2e:smoke` | 全 scenario PASS | <件数 / 件数> | PASS / FAIL |
| `pnpm test --run IdentityConflictRow.spec.tsx` | 9 test PASS | <件数> | PASS / FAIL |

---

## 7. 多角的チェック観点

| 観点 | チェック内容 |
| --- | --- |
| a11y | inline panel の textarea label / `role="alert"` / `aria-live` / disabled state / keyboard 操作 |
| design token | HEX 直書きなし、`bg-[#...]` / `text-[#...]` なし（task-18 `verify-design-tokens` の grep gate と整合） |
| API contract | POST `/api/admin/identity-conflicts/:id/merge` の request/response が spec §4.1 と一致 |
| state machine | 6 状態（idle / inline-confirm-open / submitting / success / error-409 / error-400）の遷移が全て手動再現可能 |
| error UX | 409 / 400 で inline panel を閉じず reason を保持、再試行可能 |
| optimistic update | step-01 useAdminMutation の挙動と整合（不整合あれば Note 分類） |
| route 影響 | `apps/web/app/(admin)/admin/identity-conflicts/` のみ変更。他 admin route 非影響 |

### ウォークスルーシナリオ発見事項リアルタイム分類欄

| # | シナリオ | 発見事項 | 分類 | 対応方針 |
| --- | --- | --- | --- | --- |
| 1 | inline-confirm-open | ... | Blocker / Note / Info | ... |
| 2 | success | ... | ... | ... |
| 3 | error-409 | ... | ... | ... |
| 4 | error-400 | ... | ... | ... |

---

## 8. サブタスク管理

| サブタスク | 状態 | evidence |
| --- | --- | --- |
| T11-1 6 状態再現 | TODO | `manual-test-checklist.md` |
| T11-2 screenshot 4 枚保存 | TODO | `outputs/phase-11/02..06-*.png` |
| T11-3 walkthrough 結果記録 | TODO | `manual-test-result.md` / `manual-test-report.md` |
| T11-4 視覚レビュー | TODO | `ui-sanity-visual-review.md` |
| T11-5 発見事項分類 | TODO | `discovered-issues.md` |
| T11-6 capture metadata | TODO | `screenshot-plan.json` / `phase11-capture-metadata.json` |
| T11-7 smoke test 実行 | TODO | `manual-smoke-log.md` |
| T11-8 top index | TODO | `main.md` |

---

## 9. 成果物（必須 outputs canonical path）

```
docs/30-workflows/serial-05-step-02-identity-conflicts-merge/outputs/phase-11/
├── main.md                              # Phase 11 top index
├── manual-test-checklist.md             # 6 状態の手動チェックリスト
├── manual-test-result.md                # walkthrough 結果
├── manual-test-report.md                # 実施概要・所見
├── discovered-issues.md                 # Blocker / Note / Info 分類
├── ui-sanity-visual-review.md           # Apple UI/UX 視覚レビュー
├── screenshot-plan.json                 # mode: "VISUAL" / taskId 一致
├── phase11-capture-metadata.json        # capture 実行時 inventory
├── manual-smoke-log.md                  # pnpm e2e:smoke 実行ログ
├── 02-inline-confirm-open.png                    # 必須 (state #2)
├── 04-success-toast.png                 # 必須 (state #4)
├── 05-error-409.png                     # 必須 (state #5)
└── 06-error-400.png                     # 必須 (state #6)
```

---

## 10. 完了条件

- [ ] 6 状態すべてを手動再現し `manual-test-checklist.md` に記録
- [ ] screenshot 必須 4 枚（inline-confirm-open / success / error-409 / error-400）が canonical path に存在
- [ ] `screenshot-plan.json` の `mode == "VISUAL"`、`taskId` が現タスク ID と一致
- [ ] `pnpm e2e:smoke` が PASS（件数・report path を `manual-smoke-log.md` に記録）
- [ ] unit test（IdentityConflictRow.spec.tsx）が green
- [ ] `discovered-issues.md` で Blocker 0 件を確認（Blocker があれば Phase 12 進行不可）
- [ ] `ui-sanity-visual-review.md` で design token 違反 0 件
- [ ] `main.md` の state 表記は `PASS`（VISUAL タスクのため `PASS_BOUNDARY_SYNCED_*` は不使用）

---

## 11. タスク100%実行確認【必須】

| 確認項目 | 確認コマンド | 期待結果 |
| --- | --- | --- |
| 必須 outputs 物理存在 | `ls outputs/phase-11/` | 上記 13 ファイル全て存在 |
| screenshot 4 枚 | `ls outputs/phase-11/*.png \| wc -l` | `4` 以上 |
| screenshot taskId 整合 | `jq -r '.taskId' outputs/phase-11/phase11-capture-metadata.json` | `serial-05-step-02-identity-conflicts-merge` |
| smoke test PASS | `grep -E "PASS\|FAIL" outputs/phase-11/manual-smoke-log.md` | PASS のみ |
| Blocker 0 件 | `grep -c "Blocker" outputs/phase-11/discovered-issues.md` | 0（または 0 件と明記） |
| design token grep | `! rg -n "bg-\\[#\|text-\\[#" apps/web/app/\(admin\)/admin/identity-conflicts/` | 0 hit |

**CONST_007 遵守**: 上記いずれかが満たせない場合、Phase 12 に進めない。「後続タスクで対応」は禁止。

---

## 12. 次 Phase

Phase 12（ドキュメント / 中学生レベル概念説明 / implementation-guide.md 生成）へ進む。Phase 11 の全 outputs が完備していることを Phase 12 着手前に再確認する。
