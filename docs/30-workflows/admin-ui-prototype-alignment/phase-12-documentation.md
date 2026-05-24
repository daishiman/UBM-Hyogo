---
実装区分: 実装仕様書
状態: completed
Phase: 12
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
親: [index.md](./index.md)
前: [phase-11-manual-test.md](./phase-11-manual-test.md)
次: [phase-13-pr.md](./phase-13-pr.md)
---

# Phase 12: ドキュメント同期

## 1. 目的

実装・テスト・手動評価が完了した状態で、システム仕様書 / aiworkflow-requirements / 本ワークフローの outputs を同期し、PR 作成 (Phase 13) と次サイクル探索に必要な strict 7 成果物を産出する。

## 2. 必須 7 成果物 (strict 7 / Task 12-0〜12-6)

| Task | 成果物 (path) | 完了条件 |
| ---- | ---- | ---- |
| 12-0 | `outputs/phase-12/main.md` | Phase 12 本体サマリ / strict 7 入口 |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1 (中学生レベル) + Part 2 (技術詳細) の 2 部構成 |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A / 1-B / 1-C 判定 + Step 2 反映先 |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | 変更したドキュメント一覧 + 差分要約 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも空でなく "0 件" を明示 |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | skill 利用上のフィードバック |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings / Phase 11 evidence 表 / workflow root scan |

## 3. 12-1: implementation-guide.md

### 3.1 Part 1 (中学生レベル 概念説明)

| 見出し | 内容方針 |
| ---- | ---- |
| この PR で何が変わる? | "管理画面が真っ白になる問題を直し、画面の見た目を設計サンプルに合わせた" |
| なぜ必要だった? | "1 箇所の API が止まるだけで画面全体が壊れていたから" |
| どうやって直した? | "画面を小さなカード単位に分け、壊れたカードだけエラー表示するようにした" |
| 例え話 | "図書館で 1 つの本棚が倒れても、他の棚は普通に使える、という設計に変えた" |
| 影響範囲 | "管理者だけが見る画面 (11 ページ)。一般会員側には影響しない" |

### 3.2 Part 2 (技術詳細)

| 見出し | 内容 |
| ---- | ---- |
| アーキテクチャ変更 | `_shared/` 6 component + `safeServerFetch` 導入、page で per-section degrade |
| ファイル変更一覧 | Phase 5 §9 の Files to change テーブルを転記 |
| API 変更 | **なし** (不変条件 #5) |
| DB / schema 変更 | **なし** (不変条件 #4) |
| 認証 / 権限変更 | **なし** |
| token / design system | OKLch token 整合のみ (tokens.css 既存値変更なし) |
| 不変条件遵守 | CLAUDE.md #5/#8/#9/#10 遵守確認の根拠 |
| 既知の制約 | MINOR follow-up (Phase 10 §5) |
| 検証方法 | Phase 4-11 の DoD 集約 |
| Rollback 手順 | git revert で完結 (DB migration 等なし) |

## 4. 12-2: system-spec-update-summary.md

### 4.1 Step 1-A (既存 spec 更新の要否)

| spec | 更新要否 | 更新点 |
| ---- | ---- | ---- |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | **要更新** | per-section degrade を画面設計仕様として明記、`_shared/` 6 component の責務追記 |
| `docs/00-getting-started-manual/specs/00-overview.md` | 不要 | 全体構成変更なし |
| `docs/00-getting-started-manual/specs/02-auth.md` | 不要 | 認証 flow 変更なし |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | 不要 | MVP 認証方針変更なし |
| `docs/00-getting-started-manual/specs/08-free-database.md` | 不要 | D1 変更なし |
| `docs/00-getting-started-manual/claude-design-prototype/README.md` (もしあれば) | 不要 | プロトタイプ自体は不変 |

### 4.2 Step 1-B (新規 spec 追加の要否)

| 候補 | 追加要否 | 理由 |
| ---- | ---- | ---- |
| `apps/web/src/features/admin/components/_shared/README.md` | **追加** | 6 component の責務 / 利用例 / props 表 |
| `docs/00-getting-started-manual/specs/09h-admin-error-degrade.md` | 任意 | per-section degrade の正本化が必要なら追加 |

### 4.3 Step 1-C (削除 / 非推奨化)

| 対象 | 判定 |
| ---- | ---- |
| 旧 `apps/web/src/lib/useAdminMutation` 参照ガイド | **無し** (既に CLAUDE.md #10 で禁止済み) |

### 4.4 Step 2 (反映先まとめ)

| 反映先 | 対応 |
| ---- | ---- |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | 1-A 通り更新 |
| `apps/web/src/features/admin/components/_shared/README.md` | 1-B 通り新規 |
| `CLAUDE.md` | 不変条件追加なし (既存 #5/#8/#9/#10 で十分) |
| `.claude/skills/aiworkflow-requirements/indexes` | drift 発生時のみ `pnpm indexes:rebuild` |

## 5. 12-3: documentation-changelog.md

形式:

```md
| date | file | change |
| ---- | ---- | ---- |
| 2026-05-23 | docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md | per-section degrade 設計を追記 |
| 2026-05-23 | apps/web/src/features/admin/components/_shared/README.md | 新規 (6 component 責務) |
| 2026-05-23 | docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-11/manual-test-result.md | 3 層評価結果 |
```

## 6. 12-4: unassigned-task-detection.md

検出条件:
- 本ワークフローのスコープ外に該当する変更案
- Phase 10 §5 で MINOR 化したもののうち、別 task 起票が必要な件
- staging で発見された無関係 bug

形式:

```md
## Detected unassigned tasks: 0 件

(本 task で検出された未タスク化候補は 0 件)
```

> 0 件でも本ファイルは必須出力。

## 7. 12-5: skill-feedback-report.md

| 項目 | 内容 |
| ---- | ---- |
| 使用 skill | `task-specification-creator` |
| 改善点 (発見されれば) | 例: "Phase 4 と Phase 11 で screenshot 重複しないよう責務境界の説明をテンプレに入れたい" |
| 改善点 (なければ) | "本 task で改善要望なし" |

## 8. 12-6: phase12-task-spec-compliance-check.md

### 8.1 Canonical 9 headings (Phase 1-2 で参照)

| # | heading | 該当 phase |
| ---- | ---- | ---- |
| 1 | 概要 | phase-1 §1 |
| 2 | スコープ | index.md §スコープ |
| 3 | 不変条件 | index.md §不変条件 |
| 4 | 設計方針 | phase-2 |
| 5 | テスト戦略 | phase-4 §2 |
| 6 | 実装手順 | phase-5 §1 |
| 7 | 品質保証 | phase-9 §2 |
| 8 | 手動テスト | phase-11 §3 |
| 9 | ドキュメント | phase-12 (本書) |

### 8.2 Phase 11 evidence 表

| 種別 | 件数 | 所在 |
| ---- | ---- | ---- |
| screenshot (normal) | 20 | `outputs/phase-11/admin-{screen}-{viewport}.png` |
| screenshot (degrade) | 5 | `outputs/phase-11/admin-{screen}-degrade-{viewport}.png` |
| route 200 check | 11 | `outputs/phase-11/staging-route-200-check.md` |
| 3 層評価 | 1 | `outputs/phase-11/manual-test-result.md` |

### 8.3 Workflow root scan

`docs/30-workflows/admin-ui-prototype-alignment/` 直下に Phase 1〜13 + index.md + artifacts.json のみ存在し、それ以外の散在ファイルがないこと:

```bash
find docs/30-workflows/admin-ui-prototype-alignment -maxdepth 1 -type f | sort
# 期待: index.md, artifacts.json, phase-1..13-*.md
```

## 9. aiworkflow-requirements との sync

| sync 対象 | 判定 |
| ---- | ---- |
| `indexes/resource-map.md` | **追加要** (本 task を `spec_created / implementation / VISUAL` で登録) |
| `indexes/quick-reference.md` | **追加要** (admin UI alignment の即時導線) |
| `references/task-workflow-active.md` | **追加要** (active workflow として登録) |
| `references/workflow-admin-ui-prototype-alignment-artifact-inventory.md` | **新規追加要** (workflow root / strict 7 / evidence / implementation targets) |
| `changelog/20260523-admin-ui-prototype-alignment.md` | **新規追加要** |
| `LOGS/_legacy.md` | **追記要** |
| `indexes/keywords.json` | generator (`pnpm indexes:rebuild`) で更新 |

drift 発生時:

```bash
mise exec -- pnpm indexes:rebuild
```

drift 無いことを CI gate (`verify-indexes-up-to-date`) で担保。

## 10. artifacts.json / outputs/artifacts.json parity

- `docs/30-workflows/admin-ui-prototype-alignment/artifacts.json` の `gates[].evidence_path` が各 outputs に実在すること:
  - Gate-A → `outputs/phase-12/phase12-task-spec-compliance-check.md`
  - Gate-B → `outputs/phase-11/manual-test-result.md`
  - Gate-C → `outputs/phase-13/pr-creation-result.md`
- `phases[].status` は Phase 11 完了後に `completed` へ更新する。`done` は使わない
- `outputs/artifacts.json` を root `artifacts.json` の mirror snapshot として必ず配置する

検証:

```bash
mise exec -- pnpm exec node scripts/verify-artifacts-parity.mjs \
  docs/30-workflows/admin-ui-prototype-alignment/artifacts.json
```

(該当スクリプトが無い場合は手動 grep で代替)

## 11. 出力サマリ

| Task | Path |
| ---- | ---- |
| 12-0 | `outputs/phase-12/main.md` |
| 12-1 | `outputs/phase-12/implementation-guide.md` |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` |
| 12-3 | `outputs/phase-12/documentation-changelog.md` |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 12. DoD (Phase 12)

- [ ] 12-0〜12-6 の 7 ファイル全て生成済み
- [ ] §4.1 Step 1-A の `09g-screen-blueprints-admin.md` 更新済み
- [ ] §4.2 Step 1-B の `_shared/README.md` 新規追加済み
- [ ] `artifacts.json` の `phases[].status` が `completed` に更新 (実装・Phase 11 evidence 完了後)
- [ ] `pnpm indexes:rebuild` 後の drift 0
- [ ] `bash scripts/verify-pr-ready.sh` PASS

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 12
- workflow_state: `implemented_local_runtime_pending`

## 目的

strict 7 outputs、aiworkflow-requirements 正本同期、Phase 11 evidence inventory を揃える。

## 実行タスク

- `outputs/phase-12/` strict 7 を生成する
- `outputs/artifacts.json` mirror を配置する
- aiworkflow-requirements の resource-map / quick-reference / task-workflow-active / artifact inventory / changelog / LOGS を同期する

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物/実行手順

- Phase 12 strict 7 と same-wave sync 証跡を `phase12-task-spec-compliance-check.md` に集約する

## 完了条件

- [ ] strict 7、outputs/artifacts parity、aiworkflow same-wave sync、4 条件 verdict が揃っている
