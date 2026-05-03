# UT coverage wave-2 後の残 coverage gap 層別分析と wave-3 roadmap 作成 - タスク指示書

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | ut-web-cov-05-followup-post-wave2-gap-analysis                        |
| タスク名     | UT coverage wave-2 後の残 coverage gap 層別分析と wave-3 roadmap 作成 |
| 分類         | 設計 / coverage planning                                              |
| 対象機能     | UT coverage wave 計画の継続性確保（wave-2 → wave-3 ブリッジ）         |
| 優先度       | 中                                                                    |
| 見積もり規模 | 中規模                                                                |
| ステータス   | 未実施                                                                |
| 親タスク     | ut-coverage-2026-05-wave (wave-2 完了)                                |
| 発見元       | wave-2 5タスク完了確認時の coverage tracking 二層性検出               |
| 発見日       | 2026-05-02                                                            |
| 委譲先 wave  | wave-3 計画フェーズ                                                   |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT coverage 2026-05 wave では wave-2 として 5 タスク（`ut-web-cov-01` 〜 `ut-web-cov-04` および `ut-08a-01-public-use-case-coverage-hardening`）を並列実装し、各タスクで Phase-12 unassigned-task-detection を完走させた。Phase-12 の判定基準は「タスクスコープ内の追加未タスクがゼロ件」であり、wave-2 5 タスクすべてでゼロ件達成済み。

しかし Phase-12 検出は **単一タスクのスコープ内のみ** が対象であり、以下は別レイヤーで tracking する必要がある:

- `apps/web` / `apps/api` / `packages` 全体での coverage 数値（line / branch / function）
- wave-2 で touch しなかった feature area（layer 横断の取り残し）
- NON_VISUAL coverage task で integration / e2e に倒すべき箇所として backlog 化されたもの

### 1.2 問題点・課題

- **二層性の未整備**: 「unassigned-task-detection ゼロ」≠「coverage 数値ゼロ gap」。後者を集約する場が skill / workflow 上に存在しない
- **wave 単位 vs layer 単位の不整合**: wave は並列実装タスク群、coverage gap は layer 単位（admin / public / shared / api）。wave-3 計画時に手作業マッピングが必要で属人化リスクあり
- **NON_VISUAL evidence 偏り**: skill-feedback-report で「NON_VISUAL coverage task は VISUAL evidence と runtime test を分離せよ」と是正済だが、wave-2 では runtime test を実装した一方で、後続 wave への backlog 化が未整備のままになっている
- **roadmap 不在のまま wave-3 着手するリスク**: 場当たり的なタスク選定で重複・抜け漏れが発生する

### 1.3 放置した場合の影響

- wave-3 タスク選定が場当たり的になり、coverage 数値が伸びない wave を 1 サイクル消費する
- Phase-12 ゼロ件達成 = coverage 完了と誤認するチームメンタルモデルが固定化する
- aiworkflow-requirements 上に roadmap reference がないため、後続オペレーターが wave-2 完了の意味を再解釈する必要が出る

---

## 2. 何を達成するか（What）

### 2.1 目的

wave-2 完了時点の coverage 状況を layer 別に数値化し、wave-3 で着手すべきタスク候補を優先度・規模見積つきで提示する roadmap を作成する。

### 2.2 最終ゴール

- 現行 coverage 数値レポート（layer 別、line / branch / function）が markdown でまとめられている
- layer 別 gap マッピング表が存在し、wave-3 計画の input として使える状態になっている
- wave-3 候補タスクリスト（5〜10 件）が優先度根拠付きで提示されている
- aiworkflow-requirements の active workflow 索引から本 roadmap が参照可能になっている

### 2.3 スコープ

#### 含むもの

- `apps/web` / `apps/api` / `packages` の現行 coverage 数値計測（`vitest --coverage` 実行）
- layer 別（component / hook / lib / use-case / route handler / shared module）の gap マッピング
- visual evidence 不足箇所（NON_VISUAL coverage task で取りこぼした integration / e2e ギャップ）の identification
- wave-3 タスク候補リスト（slug + 概要 + 推定規模 + 優先度根拠）
- aiworkflow-requirements への coverage roadmap reference 追加

#### 含まないもの

- 個別テスト実装（wave-3 以降の実装タスクで実施）
- coverage gate 値の引き上げ（policy 議論として別タスク）
- wave-2 タスクの再オープン・補修

### 2.4 成果物

- coverage 数値レポート markdown（layer 別集計）
- gap マッピング表（layer × coverage 種別）
- wave-3 候補タスクリスト
- aiworkflow-requirements references 追記

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- wave-2 5 タスク（`ut-web-cov-01` 〜 `04` + `ut-08a-01-public-use-case-coverage-hardening`）が main にマージ済
- `vitest --coverage` が `apps/web` / `apps/api` / `packages` の各ワークスペースで実行可能
- aiworkflow-requirements skill が利用可能（references 配下への追記権限）

### 3.2 実行手順

1. wave-2 各タスクの `skill-feedback-report.md` と `phase-12/implementation-guide.md` を読み、既知 backlog を抽出
2. `mise exec -- pnpm --filter <pkg> test --coverage` を `apps/web` / `apps/api` / `packages` 配下で実行し coverage JSON を取得
3. layer 別（admin component / public component / hook / lib / use-case / route handler / shared）に集計し markdown 表を生成
4. NON_VISUAL coverage task の backlog（integration / e2e に委ねる箇所）を抽出し gap マッピング表に統合
5. gap の優先度（業務影響 × 実装規模 × dependency）を評価し wave-3 候補タスクを 5〜10 件抽出
6. `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md` (新規) として roadmap をまとめる
7. `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` に wave-3 roadmap リンクを追記し、`task-workflow-active.md` の active workflow 索引にも反映する
8. `pnpm indexes:rebuild` を実行し、indexes drift がないことを CI gate (`verify-indexes-up-to-date`) で確認

### 3.3 受入条件 (AC)

- AC-1: 現行 coverage 数値レポート（layer 別）が markdown でまとめられている
- AC-2: layer 別 gap マッピング表（line/branch/function カバレッジ % + ギャップ箇所）が存在する
- AC-3: wave-3 候補タスクリスト（5〜10 件）が優先度・規模見積つきで存在する
- AC-4: aiworkflow-requirements の active workflow 索引から本 roadmap が参照できる
- AC-5: indexes drift がなく `verify-indexes-up-to-date` CI gate が green

---

## 4. 苦戦箇所 / 学んだこと（必ず記載）

### 4.1 Coverage 成功条件の二層性

「unassigned-task-detection ゼロ」と「coverage 数値ゼロ gap」は別物である。Phase-12 検出は **単一タスクのスコープ内のみ** を対象とするため、横断的な未着手 area は構造的に検出対象外となる。wave 横断での gap 集約レイヤーが skill 上に存在しないことが本タスクの根本動機。wave-3 以降は「Phase-12 ゼロ + roadmap 上の gap 消化率」の二軸で進捗を測る運用に切り替える必要がある。

### 4.2 NON_VISUAL coverage task の evidence 偏り

skill-feedback-report で「NON_VISUAL coverage task は VISUAL evidence と runtime test を分離する」と指摘され、wave-2 では runtime test の実装までは到達した。しかし integration / e2e に委ねるべき箇所（Auth.js cookie session 経由の動線など）の **後続 wave への backlog 化が未整備** で、各タスクの skill-feedback-report に散在している。本 roadmap で集約しない限り wave-3 で再収集コストが発生する。

### 4.3 Wave 単位と layer 単位の不整合

wave は「同時並列実装タスク群」を単位とするが、coverage gap の自然な単位は layer（admin / public / shared / api）である。wave-2 タスクは feature 横断的に組まれていたため、coverage 数値を layer に変換する際に手作業マッピングが必要となり、wave-3 計画時の属人化要因になる。本タスクで layer 単位の集計テンプレートを確立し、以降の wave で再利用できる形にする。

---

## 5. 関連リソース

- 既存フォーマット参考: `docs/30-workflows/unassigned-task/04b-followup-008-me-profile-ui-consumption.md`
- wave-2 タスク群:
  - `docs/30-workflows/ut-web-cov-01-admin-components-coverage/`
  - `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-02-*`
  - `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-03-*`
  - `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-04-*`
  - `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-08a-01-public-use-case-coverage-hardening`
- 各タスクの `skill-feedback-report.md` および `outputs/phase-12/implementation-guide.md`
- aiworkflow-requirements: `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md`
- aiworkflow-requirements: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- CLAUDE.md（indexes 再生成 / CI gate 方針）
