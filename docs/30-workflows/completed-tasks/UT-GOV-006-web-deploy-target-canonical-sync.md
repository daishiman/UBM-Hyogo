# apps/web デプロイ先 正本仕様同期 (Pages 残存 → Workers + OpenNext canonical) - 未タスク仕様書

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | UT-GOV-006                                                                          |
| タスク名     | apps/web deploy target canonical sync (現行=Pages / 目標=Workers+OpenNext)          |
| 分類         | ドキュメント整合 / インフラ正本                                                     |
| 対象機能     | apps/web Cloudflare 配信形式の正本仕様統一                                          |
| 優先度       | 中（後続実装者が Pages と Workers のどちらを正とするか迷うため）                    |
| 見積もり規模 | 小〜中規模                                                                          |
| ステータス   | 未実施 (proposed)                                                                   |
| 親タスク     | task-github-governance-branch-protection                                            |
| 発見元       | outputs/phase-12/unassigned-task-detection.md current U-6                           |
| 発見日       | 2026-04-28                                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

CLAUDE.md は apps/web のスタックを「Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare`」と定義しているが、実体（`apps/web/wrangler.toml` の `pages_build_output_dir = ".next"` 等）と GitHub Actions / 各種ドキュメントの間で「Pages」「Workers + OpenNext」が混在している。governance（branch protection / required checks / CODEOWNERS）を整備するうえで、デプロイ先の「正本（canonical）」が複数文書に散在していると、PR ごとに別々の文書が更新されて drift が拡大する。

### 1.2 問題点・課題

- 現行値（applied = 一部 Pages 形式が残存）と正本仕様（target = Workers + OpenNext `.open-next/` 配信）が同一文書内で混在し、後続実装者が古い値を PR に transcribe するリスク
- canonical document が一意に決まっておらず、`.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` / `deployment-gha.md` / specs / CLAUDE.md / `apps/web/wrangler.toml` / `.github/workflows/` のいずれを正とするか不明
- 移行が未完了であることを明示する記述が無く、Pages 残存箇所が「意図された設計」と誤読される

### 1.3 放置した場合の影響

- governance（branch protection の required status checks）に Pages 用 / Workers 用のどちらを登録すべきか判断がブレる
- 後続 PR が Pages 形式の値を踏襲し、`task-impl-opennext-workers-migration-001` の進捗を逆行させる
- `pages_build_output_dir` と Workers 用 `main_module` / `assets` binding の同居による deploy エラー再発

---

## 2. 何を達成するか（What）

### 2.1 目的

apps/web のデプロイ先について、**現行値（applied）と正本仕様（target）を明確に分離**し、canonical document を 1 ファイルに固定したうえで、他の参照箇所はリンクのみに集約する。移行未完了部分は「現行=Pages、目標=Workers、移行タスク=`task-impl-opennext-workers-migration-001`」と明示する。

### 2.2 想定 AC

1. canonical document が 1 ファイルに固定されている（推奨: `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` または `docs/00-getting-started-manual/specs/` 配下のいずれか 1 つ）
2. 棚卸し対象 4 領域（CLAUDE.md / canonical doc / GHA workflow / wrangler.toml）の記述が同一の target 値で一致している
3. 現行（applied）と目標（target）が同一文書に並存する箇所では、明示的に `現行: Pages / 目標: Workers+OpenNext / 移行タスク: task-impl-opennext-workers-migration-001` と注記される
4. canonical 以外の文書は canonical へのリンクのみに集約され、target 値の二重記述が排除されている
5. `pages_build_output_dir` と Workers 用設定（`main_module` / `assets` binding）の同居が無いことを wrangler.toml 上で確認したログが残る

### 2.3 スコープ

#### 含むもの

- 棚卸し対象の 4〜6 ファイルの読み合わせと target 値の統一
  - `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`
  - `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（存在すれば）
  - `docs/00-getting-started-manual/specs/` 配下の technology specs
  - `.github/workflows/` の web デプロイ workflow
  - `CLAUDE.md` のスタック表
  - `apps/web/wrangler.toml`
- canonical document の選定と他文書からのリンク集約
- 移行未完了箇所への注記追加

#### 含まないもの

- 実際の Pages → Workers 移行作業（`task-impl-opennext-workers-migration-001` の責務）
- branch protection 設定の apply（UT-GOV-001）
- required status checks の context 整合（UT-GOV-004）

### 2.4 成果物

- canonical document の確定差分
- 他参照箇所のリンク集約差分
- 棚卸しチェックリスト（4 箇所すべての target 値が一致していることのエビデンス）

---

## 3. 影響範囲

- `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（存在する場合）
- `docs/00-getting-started-manual/specs/00-overview.md` を含む specs 群
- `.github/workflows/` の web 関連 workflow
- `CLAUDE.md` スタック表
- `apps/web/wrangler.toml`
- governance 系後続タスク（UT-GOV-004 required checks 同期）

---

## 4. 依存・関連タスク

- 関連: `task-impl-opennext-workers-migration-001`（実移行タスク。本タスクはその移行進捗を文書側に正しく反映する役割）
- 関連: UT-GOV-001（branch protection apply）
- 関連: UT-GOV-004（required status checks context sync）
- 関連: UT-GOV-005（docs-only / non-visual テンプレ skill 同期）
- 参照: `outputs/phase-12/system-spec-update-summary.md`

---

## 5. 推奨タスクタイプ

documentation / governance-sync

---

## 6. 参照情報

- 兄弟未タスク: `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md`
- CLAUDE.md スタック表（`Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare`）
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/unassigned-task-detection.md` current U-6
- `@opennextjs/cloudflare` 公式 README

---

## 7. 備考

本タスクは「文書整合」のみを扱い、実体（wrangler.toml の Pages 設定撤去 / `.open-next/` ビルド導入）の変更は `task-impl-opennext-workers-migration-001` の責務とする。両タスクは並行可能だが、canonical document の選定だけは本タスクで先行確定させ、移行 PR が canonical を参照しながら進められる状態を作る。

---

## 8. 苦戦箇所・落とし穴

- **現行値と目標値の混在記述**: 同一ドキュメントに applied と target を併記すると、後続実装者が PR で古い値（Pages 形式）を transcribe してしまう。必ず「現行 / 目標 / 移行タスク」の 3 点セットで注記する
- **canonical 未固定による drift**: 正本ドキュメントを 1 つに固定しないと、PR ごとに別文書が更新され drift が拡大する。canonical を選定したら、他文書は target 値の二重記述を排除しリンクのみに集約する
- **wrangler.toml の設定衝突**: Pages 用 `pages_build_output_dir` と Workers 用 `main_module` / `assets` binding は同居不可。誤って残すと deploy エラーになるため、移行完了確認時は両者の排他を必ずチェックする
- **更新漏れによる即時 drift**: CLAUDE.md / canonical doc / GHA workflow / `apps/web/wrangler.toml` の 4 箇所のうち 1 箇所でも更新漏れがあると即座に drift が発生する。棚卸しチェックリストで 4 箇所すべての target 一致を機械的に確認する
- **`deployment-gha.md` 不在の見落とし**: 当該ファイルが存在しない場合は「無いこと」を棚卸し結果に明示記録すること（後続で再生成された際の取りこぼし防止）
- **governance との順序依存**: UT-GOV-004（required checks context sync）の前に本タスクを完了させないと、required checks に Pages 用 / Workers 用のどちらを登録すべきかでブレる
