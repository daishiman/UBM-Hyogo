# task-members-selected-filters-chip-ux-hardening-001 - タスク仕様書

## メタ情報

```yaml
issue_number: 1006
task_id: task-members-selected-filters-chip-ux-hardening-001
task_name: /members SelectedFiltersBar chip UX 堅牢化
category: 改善
target_feature: apps/web /members filters
priority: 低
scale: 小規模
status: 未実施
source_phase: Phase 10 / Phase 12
created_date: 2026-05-28
dependencies:
  - docs/30-workflows/completed-tasks/members-list-ux-clarity/
spec_path: docs/30-workflows/unassigned-task/task-members-selected-filters-chip-ux-hardening-001.md
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-members-selected-filters-chip-ux-hardening-001 |
| タスク名 | /members SelectedFiltersBar chip UX 堅牢化 |
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`members-list-ux-clarity` で `SelectedTagsBar` を `SelectedFiltersBar` へ一般化し、`q / zone / status / tag` を chip 表示できるようにした。一方、初回実装では「tag code を表示名に変換する」「削除後の focus を戻す」「mobile で chip が多い場合の操作密度を整える」までは扱っていない。

### 1.2 問題点・課題

- tag chip が code 表示のままだと、公開ユーザーに意味が伝わりにくい。
- chip 個別削除後の focus 戻しが未定義で、キーボード操作の連続性が弱い。
- mobile で chip が増えた場合の横スクロール / wrap / clear 配置が仕様化されていない。

### 1.3 放置した場合の影響

フィルタ可視化そのものは成立していても、実データ件数が増えた段階で chip 操作が読みにくくなり、UX clarity の効果が薄れる。

---

## 2. 何を達成するか（What）

### 2.1 目的

`SelectedFiltersBar` の表示名解決、focus management、mobile overflow の3点を補強する。

### 2.2 最終ゴール

- tag chip が user-facing label で表示される。
- chip 削除後に次の chip または filter control へ focus が戻る。
- mobile 幅で chip が増えても clear / result count / filter controls と重ならない。

### 2.3 成果物

- `SelectedFiltersBar.client.tsx` の props / rendering 補強
- `MemberFilters.client.tsx` の label source / focus hook 補強
- focused Vitest と必要に応じた Playwright screenshot

---

## 3. 実行条件

### 3.1 前提条件

- `members-list-ux-clarity` の `SelectedFiltersBar` 実装が取り込まれていること。
- 既存 #222 query parser 共有化とは別責務として扱うこと。

### 3.2 依存タスク

- `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
- 関連だが非依存: GitHub Issue #222 public search query parser shared 化

---

## 4. 完了条件

- tag chip が code ではなく表示名で描画される。
- chip 削除後の focus 遷移が test で固定される。
- mobile screenshot で chip / clear / result count の重なりがない。

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260528-120728-wt-8/apps/web/src/components/public/SelectedFiltersBar.client.tsx`
- 症状: `SelectedTagsBar` から一般化する際、`sort` を chip に含めるかどうかで親ACと実装方針が揺れ、Phase 12で「sort は表示順であり絞り込みではない」と補正した。
- 参照: `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/documentation-changelog.md`, `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| tag label 解決のために Server Component / API contract へ過剰に踏み込む | 既存 props で渡せる label map に限定し、API schema 変更はしない |
| focus 戻しで React state / URL navigation のタイミングが競合する | user-event ベースの focused spec で削除後 focus を固定する |
| mobile chip overflow の CSS が他ページへ波及する | `data-component="selected-filters-bar"` 配下に selector を閉じる |

## 検証方法

### 単体検証

```bash
pnpm exec vitest run apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
```

期待: chip label / focus / clear の期待値が PASS。

### 統合検証

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web verify-design-tokens
```

期待: exit code 0、HEX 直書きなし。

## スコープ

### 含む

- `SelectedFiltersBar` の chip label / focus / mobile overflow 補強
- focused test 追加
- `/members` local screenshot の必要最小更新

### 含まない

- query parser の shared package 移送
- tags API の N+1 解消
- staging deploy / production verification
