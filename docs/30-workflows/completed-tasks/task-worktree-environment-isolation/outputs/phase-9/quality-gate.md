# Phase 9: 品質ゲート — docs-only / NON_VISUAL

本ドキュメントは `task-worktree-environment-isolation`（docs-only / spec_created / NON_VISUAL）の品質ゲートを定義する。コード変更がないため、従来の `typecheck` / `lint` / `test` ではなく、**ドキュメント整合性**を 4 軸で検証する。

---

## 1. docs-only タスクの品質基準

### 1.1 適用しない項目（理由つき）

| 項目 | 理由 |
| --- | --- |
| `pnpm typecheck` | TypeScript ファイル変更なし |
| `pnpm lint` | リントツール対象ファイル変更なし |
| `pnpm test` / Vitest | テスト対象コード変更なし |
| `pnpm build` | ビルド対象コード変更なし |
| Cloudflare deploy preview | Worker 変更なし |
| Visual diff（Playwright 等） | NON_VISUAL タスク（UI 変更なし） |

### 1.2 適用する品質基準（4 軸）

| 軸 | 基準 | 検証手段 |
| --- | --- | --- |
| **Q-1 リンク整合** | docs 内の相対リンク・Phase 間相互参照がすべて到達可能 | `grep -rn '\](\./\|\](\.\./' docs/30-workflows/task-worktree-environment-isolation/outputs/` で抽出 → 手動で存在確認 |
| **Q-2 schema 整合** | `artifacts.json` の `outputs` と実ファイルが完全一致 | §2 のチェックリスト |
| **Q-3 spec 網羅** | `acceptance_criteria` 4 項目が Phase 1〜8 で追跡可能 | §3 のトレーサビリティ表 |
| **Q-4 不変条件非衝突** | `CLAUDE.md` 7 不変条件と矛盾しない | §5 のチェックリスト |

---

## 2. artifacts.json と outputs/ の一致チェック

### 2.1 チェック項目

| # | チェック内容 | 期待 |
| --- | --- | --- |
| C-1 | `artifacts.json` の各 phase の `outputs[]` に列挙されたパスが実在する | 全件存在 |
| C-2 | `outputs/phase-N/` 配下に列挙外のファイルが無い（stub 残存も含む） | 余剰ファイルゼロ |
| C-3 | Phase 番号と `phase-NN.md` のディレクトリ命名（`outputs/phase-N/`、ゼロ埋めなし）が一致 | 命名規約一致 |
| C-4 | 各成果物の冒頭に「メタ情報」表があり、`タスク名 / Phase / タスク種別 / visualEvidence / workflow` を含む | 5 項目記載 |
| C-5 | `task_name` / `task_path` / `execution_mode` / `metadata.taskType` / `metadata.visualEvidence` の値が docs 本文と一致 | 値一致 |
| C-6 | `phases[].depends_on_phases` が docs 内の「上位依存」記述と一致 | 一致 |
| C-7 | `acceptance_criteria` の 4 項目が docs 本文に少なくとも 1 回出現 | 全件出現 |

### 2.2 実行コマンド例（手動検証用、参考）

```bash
# C-1: outputs[] 列挙との突合
jq -r '.phases[] | .outputs[]' docs/30-workflows/task-worktree-environment-isolation/artifacts.json \
  | while read p; do test -f "docs/30-workflows/task-worktree-environment-isolation/$p" \
  || echo "MISSING: $p"; done

# C-2: 余剰ファイル検出
diff <(jq -r '.phases[] | .outputs[]' artifacts.json | sort) \
     <(find outputs -type f -name '*.md' | sed 's|^|outputs/|' | sort)
```

---

## 3. aiworkflow-requirements / spec 網羅チェック

### 3.1 受け入れ条件トレーサビリティ

| AC | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 | Phase 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 skill symlink 撤去方針 | §4 AC-1 | §1 D-1 | review §AC-1 | test-matrix EV-1 | runbook §1 | failure-cases §1 | coverage §1 | before-after R-1 |
| AC-2 tmux session-scoped state | §4 AC-2 | §2 D-2 | review §AC-2 | test-matrix EV-2/3 | runbook §2 | failure-cases §2 | coverage §2 | before-after R-3 |
| AC-3 gwt-auto lock | §4 AC-3 | §3 D-3 | review §AC-3 | test-matrix EV-4/5 | runbook §3 | failure-cases §3 | coverage §3 | before-after R-2 |
| AC-4 NON_VISUAL evidence | §4 AC-4 | §6 D-5 | review §AC-4 | test-matrix EV-1〜7 | runbook §6 | failure-cases §4 | coverage §4 | before-after サマリ |

各セルが「該当箇所が存在する」ことを Phase 10 で再確認する。**1 件でも欠落していれば No-Go**。

### 3.2 aiworkflow-requirements との整合

| 項目 | 期待 |
| --- | --- |
| Phase 構成（1〜13） | `task-specification-creator` skill の標準フェーズと一致 |
| `taskType: docs-only` | コード変更なし、テスト/ビルド適用外で扱われている |
| `visualEvidence: NON_VISUAL` | UI スクリーンショット・visual diff の欠如が問題視されない |
| `workflow: spec_created` | Phase 13 で `user_approval_required: true` が維持されている |
| `cross_task_order` | 上位 `task-conflict-prevention-skill-state-redesign` 完了前提が守られている |
| Phase 12 中学生レベル概念説明 | 後続 Phase 12 成果物で対応（本 Phase 範囲外、申し送り） |

---

## 4. CLAUDE.md 不変条件との非衝突チェック

| # | 不変条件 | docs 内での扱い | 判定 |
| --- | --- | --- | --- |
| I-1 | 実フォーム schema をコードに固定しすぎない | docs にフォーム schema を引用していない | 衝突なし |
| I-2 | consent キーは `publicConsent` / `rulesConsent` に統一 | 本タスクで言及なし | 衝突なし |
| I-3 | `responseEmail` は system field | 本タスクで言及なし | 衝突なし |
| I-4 | Form schema 外データは admin-managed として分離 | 本タスクで言及なし | 衝突なし |
| I-5 | D1 直アクセスは `apps/api` に閉じる | docs サンプルで D1 アクセスを例示していない | 衝突なし |
| I-6 | GAS prototype を本番仕様に昇格しない | 本タスクで GAS への依存・参照なし | 衝突なし |
| I-7 | MVP では Google Form 再回答が本人更新の正式経路 | 本タスクで言及なし | 衝突なし |
| 補 | `wrangler` 直接実行禁止（`scripts/cf.sh` 経由） | docs サンプルに `wrangler` 直叩きが無いこと | 衝突なし |
| 補 | `.env` 実値を `cat`/`Read` しない | docs に `.env` 実値の例示なし | 衝突なし |
| 補 | ユーザー承認なし commit/push/PR 禁止 | Phase 13 まで pending、本 Phase でも遵守 | 衝突なし |

---

## 5. Go / No-Go 判定基準

### 5.1 Go 条件（全件 AND）

1. §2 のチェック項目 C-1〜C-7 すべて pass。
2. §3.1 トレーサビリティ表のすべてのセルに該当箇所が存在。
3. §3.2 aiworkflow-requirements 整合チェック 6 項目すべて pass。
4. §4 不変条件チェックで「衝突なし」が全件成立。
5. Phase 8 `before-after.md` に R-1〜R-4 の 4 軸が揃っている。
6. ユーザー承認なしの commit / push / PR が発生していない。

### 5.2 No-Go 条件（いずれか 1 つでも該当）

- artifacts.json 列挙ファイルが実在しない、または余剰ファイルが存在する。
- AC-N が Phase X に追跡できない（トレーサビリティ表に空白）。
- CLAUDE.md 不変条件と衝突する記述がある（特に `wrangler` 直叩き例示・D1 直アクセス例示・`.env` 実値）。
- Phase 13 の `user_approval_required: true` が `false` に書き換わっている。

### 5.3 No-Go 時のループバック先

| 不合格項目 | ループバック先 |
| --- | --- |
| schema 整合（C-1/C-2/C-3） | Phase 5（runbook 出力構造の修正） |
| spec 網羅（AC-N 欠落） | Phase 2（設計に該当セクションを追補） |
| 不変条件衝突 | Phase 2 / Phase 8（該当箇所を書き換え） |
| Phase 8 before/after 不足 | Phase 8（直前 Phase へ戻す） |

---

## 6. Phase 10 への引き渡し

Phase 10（最終レビュー）では以下を実施する。

1. 本 §2〜§4 のチェックリストを実走する。
2. §5.1 の Go 条件をすべて満たすか確認する。
3. 結果を `outputs/phase-10/go-no-go.md` に記録する。
4. No-Go の場合、§5.3 に従いループバック指示を出す。

本 Phase の品質ゲート定義はここで固定される。以降の Phase で品質基準を緩めない。
