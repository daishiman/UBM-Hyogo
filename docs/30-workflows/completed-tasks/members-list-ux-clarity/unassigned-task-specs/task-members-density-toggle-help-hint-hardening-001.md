# task-members-density-toggle-help-hint-hardening-001 - タスク仕様書

## メタ情報

```yaml
issue_number: 1007
task_id: task-members-density-toggle-help-hint-hardening-001
task_name: /members DensityToggle HelpHint とIDの堅牢化
category: 改善
target_feature: apps/web /members density toggle
priority: 低
scale: 小規模
status: 未実施
source_phase: Phase 12
created_date: 2026-05-28
dependencies:
  - docs/30-workflows/completed-tasks/members-list-ux-clarity/
spec_path: docs/30-workflows/unassigned-task/task-members-density-toggle-help-hint-hardening-001.md
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-members-density-toggle-help-hint-hardening-001 |
| タスク名 | /members DensityToggle HelpHint とIDの堅牢化 |
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`members-list-ux-clarity` では `DensityToggle` に sublabel、visually-hidden description、`<details data-component="help-hint">` を追加した。今回の `/members` ページでは単一配置のため成立しているが、将来同一ページに複数配置した場合の description id 重複や、HelpHint の閉じ方までは仕様化していない。

### 1.2 問題点・課題

- `aria-describedby` の id 生成が複数配置で衝突する可能性がある。
- HelpHint は `<details>` の標準挙動に依存しており、click-outside close / Escape close の期待値が未定義。
- `?` 表示が簡易テキストで、既存 icon system との整合は未評価。

### 1.3 放置した場合の影響

DensityToggle を他の公開ページや admin preview に再利用したとき、a11y id 重複やヘルプ開閉挙動の揺れが発生する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`DensityToggle` の複数配置耐性と HelpHint 操作性を、現行 primitive 方針を壊さずに補強する。

### 2.2 最終ゴール

- 複数 `DensityToggle` を同一ページに置いても description id が衝突しない。
- HelpHint の keyboard / pointer 操作が仕様化され、test で固定される。
- icon 化する場合も新 primitive を増やさず既存 icon / CSS 方針に従う。

### 2.3 成果物

- `DensityToggle.client.tsx` の id / HelpHint 補強
- `DensityToggle.client.spec.tsx` の複数配置・keyboard 操作 test
- 必要に応じた `legacy-public.css` の限定差分

---

## 3. 実行条件

### 3.1 前提条件

- `members-list-ux-clarity` の DensityToggle UX clarity 実装が存在すること。

### 3.2 依存タスク

- `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-a-density-toggle-ux-clarity/`

---

## 4. 完了条件

- 複数配置 test で id 重複がない。
- HelpHint の開閉期待値が test で固定される。
- 新 primitive / HEX 直書きなし。

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260528-120728-wt-8/apps/web/src/components/public/DensityToggle.client.tsx`
- 症状: 今回は新 primitive を作らず `<details>` ベースの feature-local HelpHint に留めたため、再利用境界と a11y id 管理をどこまで一般化するかを Phase 12 で future candidate として分離した。
- 参照: `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-a-density-toggle-ux-clarity/phase-12-documentation.md`, `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/skill-feedback-report.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| HelpHint を汎用 primitive 化してスコープが肥大化する | `DensityToggle` 内部の feature-local component に留める |
| click-outside close 実装で hydration / event listener leak を起こす | `<details>` 標準挙動優先、追加イベントは必要最小限にする |
| icon 化で design token gate に違反する | lucide 既存依存または CSS text fallback を選び、SVG直書きとHEXを避ける |

## 検証方法

### 単体検証

```bash
pnpm exec vitest run apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx
```

期待: 複数配置、aria-describedby、HelpHint 操作 test が PASS。

### 統合検証

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web verify-design-tokens
```

期待: exit code 0。

## スコープ

### 含む

- `DensityToggle` の複数配置 a11y id 対策
- HelpHint keyboard / pointer 操作の仕様化
- focused test 追加

### 含まない

- 汎用 Popover primitive の新設
- `/members` API / URL query 変更
- staging visual baseline 更新
