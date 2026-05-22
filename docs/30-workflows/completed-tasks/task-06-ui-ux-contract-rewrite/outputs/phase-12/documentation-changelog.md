# documentation-changelog.md

## 対象

`docs/00-getting-started-manual/specs/09-ui-ux.md`

## 削除

旧 §3〜§7 の **視覚詳細記述**:

- 旧 §3 レイヤ別 UX（公開 / 会員 / 管理）の視覚詳細
- 旧 §4 一覧 UX（検索 / カード / 空状態）の視覚詳細
- 旧 §5 詳細 UX（公開詳細 / マイページ）の視覚詳細
- 旧 §6 管理 UX（ダッシュボード / メンバー管理 / タグ / スキーマ / 開催日）の視覚詳細
- 旧 §7 コンポーネント方針の視覚詳細（Hero 構成順序 / 密度切替値 / KPI 文言など）
- HEX / oklch() / px / `bg-[#...]` / `text-[#...]` の値直書き（grep gate で 0 件）

## 新規

新 §1〜§10 章立て:

| 章 | 内容 |
| --- | --- |
| §1 | 位置づけと正本主義（1.1 「契約のみ」スコープ / 1.2 09a..09h index 表） |
| §2 | 19 routes 全画面の契約一覧（公開 6 / 会員 2 / 管理 8 / 共通 4） |
| §3 | component 契約一覧（3.1 primitives 13 / 3.2 feature components 29） |
| §4 | 状態列挙の規範（4.1 5 値 / 4.2 login 5 状態 / 4.3 申請 server-pending） |
| §5 | アクセシビリティ契約（5.1 共通 / 5.2 dialog drawer / 5.3 form / 5.4 live region） |
| §6 | token 参照規則（6.1 決定権委譲 / 6.2 OKLch CSS 変数経由 / 6.3 prefix 8 種） |
| §7 | Storybook 正本主義 |
| §8 | 不採用画面・不採用パターン |
| §9 | 用語集（zone / gate-state / visibility-request / identity-conflict / pending banner） |
| §10 | 改訂履歴 |

## link 追加

§1.2 index 表に以下 8 ファイルへの link を追加（path のみ確定。中身は別 task で生成）:

- `09a-prototype-map.md`（task-07 で新設）
- `09b-design-tokens.md`（task-08 で新設）
- `09c-primitives.md`（task-19 で新設）
- `09d-icons.md`（task-22 で新設）
- `09e-screen-blueprints-public.md`（task-20 で新設）
- `09f-screen-blueprints-member.md`（task-20 で新設）
- `09g-screen-blueprints-admin.md`（task-21 で新設）
- `09h-shell-and-fixtures.md`（task-22 で新設）

## same-wave sync

09-ui-ux.md の rewrite に合わせ、以下の台帳・スキル同期も同一 wave の変更範囲として明示する:

- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map,keywords}.md/json`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260507-task-06-ui-ux-contract-rewrite.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-06-ui-ux-contract-rewrite-2026-05.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/LOGS/_legacy.md`

## 変更前後の主要数値

| 項目 | 旧 | 新 |
| --- | --- | --- |
| 行数 | 160 | 396 |
| H2 | 8 | 10 |
| `### 2.` | 部分 | 20 |
| `#### 3.1.` | 部分 | 13 |
| 視覚詳細値 | 散在 | 0（grep gate） |

## 関連 PR / commit

本 changelog は Phase 13（PR 作成）で PR description にリンクされる。
