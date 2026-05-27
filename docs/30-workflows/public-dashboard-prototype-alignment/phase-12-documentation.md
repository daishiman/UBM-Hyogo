---
実装区分: 実装仕様書
状態: implementation_reviewed
Phase: 12
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [index.md](./index.md)
前: [phase-11-manual-test.md](./phase-11-manual-test.md)
次: [phase-13-pr.md](./phase-13-pr.md)
---

# Phase 12: ドキュメント同期

## 1. 目的

`spec_created` の実装仕様として、システム仕様書 / aiworkflow-requirements / 本ワークフローの outputs を同期し、後続 execution wave と PR 作成 (Phase 13) に必要な strict 7 成果物を産出する。コード実装・テスト実行・手動評価は本 Phase 12 では完了扱いにしない。

## 2. 必須 7 成果物 (strict 7 / Task 12-0〜12-6)

| Task | 成果物 (path) | 完了条件 |
| --- | --- | --- |
| 12-0 | `outputs/phase-12/main.md` | Phase 12 本体サマリ / strict 7 入口 |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1 (中学生レベル) + Part 2 (技術詳細) |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A / 1-B / 1-C 判定 + Step 2 反映先 |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | 変更したドキュメント一覧 + 差分要約 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも空でなく "0 件" を明示 |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | skill 利用上のフィードバック |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings / Phase 11 evidence 表 / workflow root scan |

## 3. 12-1: implementation-guide.md (Part 1 概念 / Part 2 技術)

### 3.1 Part 1 (中学生レベル)

| 見出し | 内容方針 |
| --- | --- |
| この PR で何を変える? | "ホーム画面の見た目を、デザインのお手本にきれいに合わせる" |
| なぜ必要だった? | "お手本どおりの説明カードや、最近の支部会一覧の見せ方が、まだ実装されていなかったから" |
| どうやって直す? | "Hero (一番上の見せ場) をカードっぽくして、UBM の説明カードを追加し、最近の支部会の見せ方を整える" |
| 例え話 | "本屋さんの店頭ディスプレイを、本部からもらったデザイン見本どおりに作り直す" |
| 影響範囲 | "誰でも見られるトップページ (1 画面)。会員専用ページや管理画面には影響しない" |

### 3.2 Part 2 (技術詳細)

| 見出し | 内容 |
| --- | --- |
| アーキテクチャ変更 | `AboutUbm` 1 component 新規、4 component 改修、`legacy-public.css` 追加。`/` の section 配線変更 |
| ファイル変更一覧 | Phase 5 §9 の Files to change テーブルを転記 |
| API 変更 | **なし** (不変条件 #1) |
| DB / schema 変更 | **なし** (不変条件 #4) |
| 認証 / 権限変更 | **なし** (public route) |
| token / design system | OKLch token 整合のみ。`tokens.css` 既存値変更なし。必要 token (`--ubm-spacing-grid` 等) が無い場合のみ追加 |
| 不変条件遵守 | CLAUDE.md #5/#8 遵守確認の根拠 |
| 既知の制約 | MINOR follow-up (Phase 10 §5 FU-1〜FU-4) |
| 検証方法 | Phase 4-11 の DoD 集約 |
| Rollback 手順 | git revert で完結 (DB migration 等なし) |

## 4. 12-2: system-spec-update-summary.md

### 4.1 Step 1-A (既存 spec 更新の要否)

| spec | 更新要否 | 更新点 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | **確認済 / 追記あり** | 既に `/` の section list は `Hero / Stats / About + ThreeZones / Featured / Meetings / CTA` を正本化済み。本 wave では実装 workflow への back-reference を追記 |
| `docs/00-getting-started-manual/specs/00-overview.md` | 不要 | 全体構成変更なし |
| その他 spec | 不要 | — |

### 4.2 Step 1-B (新規 spec 追加の要否)

| 候補 | 追加要否 | 理由 |
| --- | --- | --- |
| `apps/web/src/components/public/AboutUbm` README | 任意 | 1 component のため過剰。仕様書で十分 |

### 4.3 Step 1-C (削除 / 非推奨化)

| 対象 | 判定 |
| --- | --- |
| `ZoneIntro.tsx` | **保持** (Phase 8 RF-2)。`app/page.tsx` からの call 削除で重複は解消し、物理削除は不要 |

### 4.4 Step 2 (反映先まとめ)

| 反映先 | 対応 |
| --- | --- |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | 1-A 通り back-reference 追記 |
| `CLAUDE.md` | 不変条件追加なし |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | quick lookup 追加済み |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Progressive Disclosure entry 追加済み |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 登録済み |

## 5. 12-3: documentation-changelog.md (形式)

```md
| date | file | change |
| ---- | ---- | ---- |
| 2026-05-26 | docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md | 本 workflow への back-reference 追記 |
| 2026-05-26 | docs/30-workflows/public-dashboard-prototype-alignment/outputs/artifacts.json | root artifacts mirror 追加 |
```

## 6. 12-4: unassigned-task-detection.md

```md
## Detected unassigned tasks: 0 件

### 候補と却下理由

| 候補 | 却下理由 |
| ---- | ---- |
| Last sync を relative time formatter で「数分前」表現にする | 未タスクではなく不採用。既存 `lastSyncLabel` / 固定 label の範囲で吸収 |
| `Meetings/yr` を API から取得 | 未タスクではなく不採用。API 拡張禁止のため UI 定数で吸収 |
| Hero serif を web font CDN ロード | 未タスクではなく不採用。system serif fallback で吸収 |
| `ZoneIntro.tsx` を削除 | 未タスクではなく不採用。call 削除で重複解消し、物理削除は不要 |

(本 task で正式起票が必要な未タスク化候補は 0 件)
```

## 7. 12-5: skill-feedback-report.md

| 項目 | 内容 |
| --- | --- |
| 使用 skill | `task-specification-creator` / `aiworkflow-requirements` / `automation-30` |
| 改善点 | skill 定義変更は不要。既存の `spec_created / implementation / VISUAL` と same-wave sync ルールで吸収 |

## 8. 12-6: phase12-task-spec-compliance-check.md

### 8.1 Canonical 9 headings

| # | heading | 該当 phase |
| --- | --- | --- |
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
| --- | --- | --- |
| screenshot (normal) | 4 | `outputs/phase-11/home-{viewport}.png` |
| screenshot (empty) | 2 | `outputs/phase-11/home-empty-{viewport}.png` |
| route 200 check | 1 | `outputs/phase-11/route-200-check.md` |
| 3 層評価 | 1 | `outputs/phase-11/manual-test-result.md` |

### 8.3 Workflow root scan

```bash
find docs/30-workflows/public-dashboard-prototype-alignment -maxdepth 1 -type f | sort
# 期待: index.md, artifacts.json, phase-1..13-*.md
```

## 9. aiworkflow-requirements との sync

| sync 対象 | 判定 |
| --- | --- |
| `indexes/resource-map.md` | **追加済み** (本 task を `spec_created / implementation / VISUAL` で登録) |
| `indexes/quick-reference.md` | **追加済み** |
| `references/task-workflow-active.md` | **追加済み** |
| `references/workflow-public-dashboard-prototype-alignment-artifact-inventory.md` | **新規追加済み** |
| `changelog/20260526-public-dashboard-prototype-alignment.md` | **新規追加済み** |
| `LOGS/_legacy.md` | no-op。直近の正本 ledger は changelog + indexes + artifact inventory で足りる |
| `indexes/keywords.json` | no-op。手編集せず既存 indexes の明示 entry で足りる |

drift 発生時:

```bash
mise exec -- pnpm indexes:rebuild
```

CI gate `verify-indexes-up-to-date` で担保。

## 10. artifacts.json / outputs/artifacts.json parity

- `docs/30-workflows/public-dashboard-prototype-alignment/artifacts.json` の `gates[].evidence_path` が各 outputs に実在すること:
  - Gate-A → `outputs/phase-12/phase12-task-spec-compliance-check.md`
  - Gate-B → `outputs/phase-11/manual-test-result.md`
  - Gate-C → `outputs/phase-13/pr-creation-result.md`
- `phases[11].status` は `runtime_pending`、`phases[13].status` は `pending` を維持する。実装・Phase 11 完了後に `completed` へ更新
- `outputs/artifacts.json` を root `artifacts.json` の mirror snapshot として配置

## 11. 出力サマリ

| Task | Path |
| --- | --- |
| 12-0 | `outputs/phase-12/main.md` |
| 12-1 | `outputs/phase-12/implementation-guide.md` |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` |
| 12-3 | `outputs/phase-12/documentation-changelog.md` |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 12. DoD (Phase 12)

- [ ] 12-0〜12-6 の 7 ファイル全て生成済み
- [ ] §4.1 Step 1-A の `09e-screen-blueprints-public.md` 更新済み
- [ ] `artifacts.json` の `phases[11].status` が `runtime_pending`、`phases[13].status` が `pending` で、実装完了を主張していない
- [ ] `verify-phase12-compliance` / gate metadata validation が PASS

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 12
- workflow_state: `implementation_reviewed`

## 目的

strict 7 outputs、aiworkflow-requirements 正本同期、Phase 11 evidence inventory を揃える。

## 完了条件

- [ ] strict 7、outputs/artifacts parity、aiworkflow same-wave sync、4 条件 verdict が揃っている
