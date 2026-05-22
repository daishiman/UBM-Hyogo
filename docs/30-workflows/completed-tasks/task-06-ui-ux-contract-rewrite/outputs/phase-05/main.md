# Phase 05: 実装ランブック

## サマリ

`docs/00-getting-started-manual/specs/09-ui-ux.md`（旧 160 行）を新 396 行・契約のみ版へ書き換える物理的手順。詳細ステップは `runbook.md` 参照。

## 書き換え方針

- 1 ファイル書き換え（新規作成・削除なし）
- 視覚詳細は §2 / §3 の「視覚詳細 link」列で 09a へ完全委譲
- token 値は §6.3 prefix 名のみ参照、値は 09b へ委譲
- 旧 §3〜§7 視覚詳細を削除し、新 §1〜§10 を構築

## ステップ概要（runbook.md と同期）

1. 旧 09-ui-ux.md を git で参照し、§1（位置づけ）の文言と §8（不採用）の文言は再利用
2. 新 §1 位置づけと正本主義を書く（1.1 「契約のみ」スコープ / 1.2 09a..09h index 表）
3. 新 §2 19 routes 契約一覧を書く（公開 6 / 会員 2 / 管理 8 / 共通 3 + global-error fallback）
4. 各 routes に対し §2 標準 10 列の表で記述（認可 / layout / 主 component / API / 状態 / 主 props / a11y / token / 視覚詳細 link / 不採用）
5. 新 §3 component 契約一覧を書く（3.1 primitives 13 / 3.2 feature components 29）
6. 各 primitive に対し §3 標準 8 列で記述（variants / sizes / props / a11y / state / token / 視覚詳細 link / Storybook）
7. 新 §4 状態列挙を書く（4.1 5 値 / 4.2 login 5 状態 / 4.3 申請 server-pending / 4.4 prototype 19 行 / 4.5 不採用 4 項目）
8. 新 §5 a11y を書く（5.1 共通 / 5.2 dialog drawer / 5.3 form / 5.4 live region）
9. 新 §6 token 参照規則を書く（6.1 決定権委譲 / 6.2 CSS 変数経由 / 6.3 prefix 8 種）
10. 新 §7 Storybook 正本主義 / §8 不採用 / §9 用語集 / §10 改訂履歴 を書く
11. grep gate（HEX/oklch/px/`bg-[`）で 0 件確認
12. structure check（H2=10 / `### 2.`=20 / `### 3.1.`=13）で一致確認
13. markdown lint で exit 0 確認

## ロールバック手順

- 単一ファイル書き換えのため `git checkout HEAD~1 -- docs/00-getting-started-manual/specs/09-ui-ux.md` で完全 rollback 可能
- 後続 task（07/08/09/10/11..17/19..22）は本タスク完了前は着手不可なので連鎖影響なし
- 09a / 09b の link path は本タスクで「path のみ」確定済み（中身は task-07/08 の責務）

## 完了状態

書き換え完了後の実測:
- 行数: 396
- H2（`## `）: 10
- `### 2.`: 20（19 routes + global-error.tsx fallback）
- primitives 列挙: 13（Button/Card/Badge/Input/Select/Table/Tabs/Sidebar/Toast/Skeleton/DataTable/EmptyState/ErrorState）
- HEX/oklch/px/`bg-[` grep gate: すべて 0 件

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | 書き換えステップ確定 | completed |
| 2 | runbook.md 配置 | completed |
| 3 | ロールバック手順記録 | completed |
| 4 | 完了状態の数値記録 | completed |

## 次 Phase

Phase 6（異常系・failure cases）へ。
