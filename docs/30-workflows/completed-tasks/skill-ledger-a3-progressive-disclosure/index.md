# skill-ledger-a3-progressive-disclosure - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | skill-ledger-a3-progressive-disclosure |
| タスク名 | SKILL.md の Progressive Disclosure 分割 |
| ディレクトリ | docs/30-workflows/skill-ledger-a3-progressive-disclosure |
| Wave | skill-ledger（A-2 → A-1 → **A-3** → B-1） |
| 実行種別 | serial（A-1 完了後に着手・並列 SKILL.md 編集衝突回避） |
| 作成日 | 2026-04-28 |
| 担当 | unassigned |
| 状態 | completed（Phase 1〜12） / Phase 13 は user approval pending |
| タスク種別 | docs-only / NON_VISUAL（`.claude/skills/*/SKILL.md` 分割仕様。コード実装ではないが skill 構造に直接影響） |
| 既存タスク組み込み | 原典 `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md` |
| 組み込み先 | `.claude/skills/*/SKILL.md` および `.agents/skills/*/SKILL.md` (mirror) |
| GitHub Issue | #131 (CLOSED) |
| 優先度 | medium |
| 見積もり規模 | medium |

## 目的

肥大化した `.claude/skills/*/SKILL.md`（500 行超）を 200 行未満の entrypoint に縮め、詳細を `references/<topic>.md` 配下へ Progressive Disclosure 方式で分割する。複数 worktree 並列開発時の SKILL.md 編集衝突を構造的に防ぎ、loader の context 消費も削減する。代表的対象は `task-specification-creator/SKILL.md`。

## 真の論点 (true issue)

- 「単一 SKILL.md にサイズ制約を入れる」ことではなく、「skill loader が必要とする entrypoint 情報（front matter / Anchors / trigger / allowed-tools / 最小 workflow）と、詳細仕様（Phase テンプレ / アセット規約 / 品質ゲート / オーケストレーション）の責務境界を Progressive Disclosure で固定し、worktree 並列編集時の merge conflict を構造的に消す」ことが本タスクの本質。
- ドッグフーディング論点として、`task-specification-creator/SKILL.md` 自身が 200 行を超えており、「200 行未満を推奨」と書いた skill が自身の規約を破る矛盾を最優先で解消する。

## スコープ

### 含む

- `.claude/skills/*/SKILL.md` の棚卸し（200 行超リスト確定）
- `task-specification-creator` を最優先とする対象 skill の分割設計
- `references/<topic>.md` への抽出（単一責務命名）と SKILL.md 入口リライト
- entry に「front matter / 概要 5〜10 行 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow」の固定セットを残置
- canonical (`.claude/skills/...`) → mirror (`.agents/skills/...`) への同期反映と差分検証（`diff -r` = 0）
- skill 改修ガイドへの「fragment で書け」「200 行を超えたら分割」Anchor 追記（小 PR で別出し）

### 含まない

- skill の意味的な書き換え・新規 trigger 追加（entry は要約可、references 本体は既存詳細の移送を原則とする）
- 既に `references/` 分割済みの skill（例: `aiworkflow-requirements`）への変更
- skill loader 本体・doctor スクリプトの実装変更
- skill-creator スキル本体テンプレへの 200 行制約組込み（再発防止策として別タスク化）
- A-1（gitignore）/ A-2（fragment）/ B-1（gitattributes）の実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `task-skill-ledger-a1-gitignore`（Issue #129） | 並列 SKILL.md 編集衝突を避けるための受け皿前提 |
| 上流 | `task-skill-ledger-a2-fragment`（Issue #130） | render script と fragment 規約が前提 |
| 並列 | 他 skill 改修タスク全般 | A-3 着手中は対象 SKILL.md を単独 PR で占有・1 PR = 1 skill 分割 |
| 下流 | `task-skill-ledger-b1-gitattributes` | A-3 完了後に着手（実装順序: A-2 → A-1 → A-3 → B-1） |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md | 原典タスク指示書 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/main.md | 分割方針の確定根拠 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md | Step 1〜5 機械的手順 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | 実装順序・ロールバック戦略 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/file-layout.md | references レイアウト規約 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | 分割対象代表例（最優先） |
| 参考 | .claude/skills/aiworkflow-requirements/SKILL.md | 既に分割済みの参考例 |

## 受入条件 (AC)

本 workflow は A-3 全体像を扱うが、**本 PR（PR-1）の実装対象は `task-specification-creator` 単独**とする。残 4 skill と再発防止 Anchor は独立 revert 性を保つため後続 PR / 未タスクに分離する。

- AC-1: PR-1 対象の `task-specification-creator/SKILL.md` が 200 行未満になっている
- AC-2: PR-1 で切り出した詳細トピックが `references/<topic>.md` に単一責務で命名・配置されている
- AC-3: `task-specification-creator` entry に front matter / 概要 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow が保持されている
- AC-4: PR-1 新規 references について SKILL.md → references の参照が成立し、A-3 由来の循環参照を増やしていない
- AC-5: canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) の差分が 0（`diff -r`）
- AC-6: 行数検査スクリプトで `task-specification-creator/SKILL.md` が `OK`（200 行未満）。残 4 skill の FAIL は後続 PR として登録する
- AC-7: `task-specification-creator` の SKILL.md → references リンク切れ 0 件。既存 baseline FAIL は後続タスク扱い
- AC-8: PR-1 新規 reference 7 件が `task-specification-creator/SKILL.md` から参照されている。既存 orphan は baseline として後続タスク扱い
- AC-9: `task-specification-creator/SKILL.md` が最優先・単独 PR で 200 行未満化されている
- AC-10: skill 改修ガイドに「fragment で書け」「200 行を超えたら分割」Anchor を追記する後続 PR（PR-N）が未タスクとして明文化されている
- AC-11: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計（分割設計表） | phase-02.md | completed | outputs/phase-02/split-design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md, alternatives.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke | phase-11.md | completed | outputs/phase-11/main.md, manual-smoke-log.md, link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/implementation-guide.md, system-spec-update-summary.md, documentation-changelog.md, unassigned-task-detection.md, skill-feedback-report.md, phase12-task-spec-compliance-check.md, outputs/artifacts.json |
| 13 | PR 作成 | phase-13.md | spec_created | outputs/phase-13/main.md, local-check-result.md, change-summary.md, pr-template.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価・true issue・依存境界） |
| 設計 | outputs/phase-02/split-design.md | skill ごとの分割設計表（entry 残置 / references topic / 行数見積もり） |
| 設計 | outputs/phase-02/inventory.md | 200 行超 SKILL.md 棚卸し結果 |
| レビュー | outputs/phase-03/main.md | 代替案 3 種以上 + PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/test-strategy.md | 行数検査 / リンク健全性 / mirror diff の自動検証戦略 |
| 実装 | outputs/phase-05/implementation-runbook.md | 切り出し手順・per-skill PR 計画 |
| 異常系 | outputs/phase-06/failure-cases.md | 参照切れ / 並列衝突 / 意味的書き換え混入のシナリオ |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 対象 skill のトレーサビリティマトリクス |
| QA | outputs/phase-09/free-tier-estimation.md | 本タスクは無料枠影響なし旨の記録 |
| ゲート | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・blocker 一覧 |
| 証跡 | outputs/phase-11/manual-smoke-log.md | 行数 / `rg` / `diff -r` 実行ログ |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け） + Part 2（技術者向け） |
| ガイド | outputs/phase-12/system-spec-update-summary.md | 仕様書同期サマリー |
| ガイド | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ガイド | outputs/phase-12/unassigned-task-detection.md | 未タスク検出レポート |
| ガイド | outputs/phase-12/skill-feedback-report.md | skill フィードバック |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Git / GitHub | PR 単位での独立 revert | 無料 |
| `rg` (ripgrep) | リンク健全性検査 | ローカル |
| `diff -r` | canonical / mirror 差分検出 | ローカル |
| `wc -l` | SKILL.md 行数検査 | ローカル |

## Secrets 一覧（このタスクで導入・参照）

なし（ローカル docs / skill 構造の再編成のみで Secret 取扱いなし）

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| - | （プロジェクト不変条件 #1〜#7 には touch しない） | 本タスクは `.claude/skills` の構造変更のみ。アプリ層・D1・フォーム schema・admin-managed data・Auth に影響なし |

skill-ledger 内不変条件:
- canonical = `.claude/skills/...` / mirror = `.agents/skills/...` の二重管理（差分 0）を維持
- 分割は意味的書き換えを禁止する。entrypoint は詳細への導線として要約を許可し、詳細仕様は references に保持する
- 1 PR = 1 skill 分割（影響範囲局所化）

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致
- AC-1〜AC-11 が Phase 7 / 10 で完全トレース
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- `task-specification-creator/SKILL.md` が単独 PR で 200 行未満化済み
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦箇所・知見（原典より転載）

**1. 既存リンクが SKILL.md 内部アンカーを大量に指している**
分割で参照切れが発生しやすい。対策: SKILL.md 末尾に references リンク表を必ず置き、外部から旧アンカー名で来た場合の誘導を構造化。Phase 5 の `rg` 健全性検査を完了条件化。

**2. entry / references の責務境界判断が skill ごとに揺れる**
共通テンプレ未整備が原因。対策: Phase 2 で skill ごとの分割設計表を作成し、entry 残置項目を固定リストに揃える。

**3. 並列で同一 SKILL.md を編集する他タスクとの衝突**
A-3 が SKILL.md 自体を大きく書き換えるため確実に発生。対策: 実装順序を A-2 → A-1 → A-3 → B-1 と固定し、着手前に skill 単位で announce、1 PR = 1 skill 分割を厳守。

**4. ドッグフーディング矛盾（`task-specification-creator/SKILL.md` 自身が 200 行超）**
対策: A-3 スコープに最優先対象として含め、skill 改修ガイドに「fragment で書け」「200 行を超えたら分割」を Anchor として明文化。

**5. canonical / mirror 同期漏れ**
対策: Phase 5 で `diff -r .claude/skills/<skill> .agents/skills/<skill>` を完了条件にする。

**6. 意味的書き換えがメカニカル分割に混入**
対策: 切り出しは「セクション単位の cut & paste」のみ。意味変更は別タスクへ分離。

## 関連リンク

- 原典タスク指示書: ../completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md
- 上位ワークフロー: ../task-conflict-prevention-skill-state-redesign/
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/131
