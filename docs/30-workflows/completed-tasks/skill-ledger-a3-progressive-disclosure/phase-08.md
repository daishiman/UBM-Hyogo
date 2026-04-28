# Phase 8: DRY 化 / references 重複棚卸し

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化（references 重複棚卸し） |
| 作成日 | 2026-04-28 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（specification-design / refactoring） |

## 目的

Phase 3 で分割した `references/<topic>.md` 群を横断し、同一 skill 内で **重複セクション** が発生していないかを棚卸しする。重複検出時は「共通要素を別 reference に切り出す」または「entry に戻す」の二択で解消し、循環参照（references → references の往復）が発生しない依存グラフを保つ。**skill 横断の共通 reference は本タスクスコープ外**（別タスク化）と明記し、A-3 の機械的 cut & paste 原則を破らない。代表的ケースとして `task-specification-creator` の Phase テンプレと quality-gates の重複を before / after で検証する。

## 依存境界

- 入力: Phase 3 で生成された `.claude/skills/<skill>/references/*.md` 群、Phase 2 split-design、Phase 7 AC マトリクス。
- 出力: `outputs/phase-08/main.md`（重複棚卸し結果） / `outputs/phase-08/before-after.md`（具体例）。
- 非対象: skill 横断の共通 reference 抽出（別タスク化）、意味的書き換え、コミット / PR、`.claude/skills/` 自体の編集。

## 実行タスク

1. 各対象 skill について `references/<topic>.md` を横断 grep し、章タイトル・段落単位で重複候補を列挙する（完了条件: skill ごとに重複候補表が存在）。
2. 重複候補ごとに処理方針（A. 別 reference に共通化 / B. entry に戻す / C. 重複許容＝responsibility 異なる）を判定する（完了条件: 全候補に方針 A/B/C のいずれかが付与）。
3. 循環参照が発生しないことを依存グラフで確認する（完了条件: references → references 間の有向グラフに循環なし）。
4. skill 横断の共通 reference は **本タスクスコープ外**（別タスク化）と明記する（完了条件: スコープ境界が文書化）。
5. `task-specification-creator` の Phase テンプレ章と quality-gates 章の重複を before / after で記述する（完了条件: `outputs/phase-08/before-after.md` に 1 例以上）。
6. 解消後の references 配置と entry 行数への影響を再見積もりする（完了条件: 200 行未満 budget が維持）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-02.md | 分割設計表 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-03.md | 設計レビュー（代替案） |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-05.md | 実装ランブック（切り出し手順） |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-07.md | AC マトリクス |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | 重複検証の代表例 |
| 参考 | .claude/skills/aiworkflow-requirements/references/ | 既分割の参考レイアウト |

## 重複検出のアプローチ

### grep ベースの一次検出

```bash
# skill 単位で references 内の章タイトルを列挙
for skill in .claude/skills/*/; do
  echo "=== $skill ==="
  rg -n '^## ' "$skill/references/" 2>/dev/null || true
done

# 同一フレーズの重複を炙り出す（任意の skill 単位）
rg -c '品質ゲート|Quality Gate|Phase テンプレ' .claude/skills/<skill>/references/
```

### 方針判定マトリクス

| 状況 | 推奨方針 |
| --- | --- |
| 同 skill 内で 2 ファイル以上に同一章が物理コピーされている | A. 別 reference（例: `references/_shared.md`）に切り出して両方から参照 |
| entry SKILL.md に「概要」相当が散ったまま references にも重複 | B. entry に戻し references からは削除 |
| 同名章でも責務が異なる（例: phase-templates の「品質ゲート」と quality-gates の「品質ゲート」が別概念） | C. 重複許容、両方に責務注記を付与 |
| skill 横断（例: 複数 skill で同じ Anchor 説明が出現） | スコープ外（別タスク化） |

## Before / After サンプル（task-specification-creator）

> 実値は `outputs/phase-08/before-after.md` に記述。本仕様書では**観点**のみを固定する。

### Before

- `references/phase-templates.md` 内に Phase 9 品質保証テンプレ章
- `references/quality-gates.md` 内に同一の品質ゲート判定基準章
- 両ファイルが並んで読まれた際、同じチェック項目が二重に提示される

### After

- 共通の判定基準（4 条件 / PASS-MINOR-MAJOR ルール）を `references/quality-gates.md` に集約
- `references/phase-templates.md` からは `quality-gates.md` へ単方向リンク
- 重複削除により entry の references リンク表が 1 件減少しないことを確認（topic 数は維持、本文重複のみ解消）

## 循環参照の禁止と依存グラフ

- references 同士の参照は **DAG（有向非巡回グラフ）** であること。
- 検出: `rg -n 'references/' .claude/skills/<skill>/references/` の結果から始点 → 終点を列挙し、トポロジカルソート可能か確認。
- 違反例: `phase-templates.md → quality-gates.md → phase-templates.md`（往復）は禁止。
- 解決: 共通要素を 3 つ目の reference（例: `_shared/judgement-criteria.md`）に切り出し、両者から単方向参照させる。

## skill 横断の共通 reference（スコープ外）

- 複数 skill にまたがる共通章（例: 全 skill 共通の Anchors 規約、共通の trigger 定義）は **本タスクで処理しない**。
- 理由: A-3 は「機械的 cut & paste のみ」「1 PR = 1 skill」を不変条件とし、skill 横断変更は 1 PR の単位を破る。
- 代替: 検出した skill 横断の共通候補は `outputs/phase-12/unassigned-task-detection.md` に未タスクとして記録し、skill-creator 側のテンプレ整備（再発防止策）として別タスク化する。

## 解消後の行数再見積もり

| skill 名 | entry before | entry after（Phase 4 案） | 重複解消後 entry | budget < 200 |
| --- | --- | --- | --- | --- |
| task-specification-creator | TBD（>200） | TBD | TBD | PASS（必達） |
| 対象 skill #N | TBD | TBD | TBD | PASS |

> 重複解消で references 内の本文行数は減るが、entry 側の行数には影響しない（entry は references リンク表で参照するのみ）。budget 監視は AC-1 / AC-6 で継続。

## 実行手順

### ステップ 1: 重複候補の列挙

- 各 skill の `references/` を `rg` で章単位走査。
- 同一フレーズ・同一章タイトルが 2 ファイル以上に出現する候補を表化。

### ステップ 2: 方針判定（A / B / C）

- 候補ごとに方針マトリクス参照で判定。
- C（責務が異なる）の場合は責務注記の追記指示を Phase 5 ランブックへフィードバック。

### ステップ 3: 依存グラフ作成と循環検査

- references 間リンクを列挙し DAG であることを確認。
- 違反検出時は 3 つ目の reference 切り出し案を記述。

### ステップ 4: スコープ境界の明文化

- skill 横断の共通候補を別タスク化リストへ送出。
- `outputs/phase-08/main.md` 末尾に「skill 横断はスコープ外」と明記。

### ステップ 5: Before / After サンプル作成

- `task-specification-creator` の Phase テンプレ × quality-gates 重複を 1 例以上記述。
- `outputs/phase-08/before-after.md` に保存。

### ステップ 6: 行数再見積もり

- 重複解消後も entry < 200 行が維持されることを確認。

## 多角的チェック観点

- 価値性: 重複解消で worktree 並列編集時の衝突面積がさらに縮小するか。
- 実現性: 解消手順がメカニカル cut & paste 原則を破らないか。
- 整合性: 循環参照禁止 / 単方向参照原則 / 1 PR = 1 skill が維持されるか。
- 運用性: 重複解消後も loader が必要とする情報が entry に残存するか。
- スコープ境界: skill 横断は別タスク化として明示されているか。
- 行数: 解消後も AC-1（200 行未満）が維持されるか。

## 統合テスト連携

docs-only / spec_created のためアプリ統合テストは対象外。DRY 化の結果は Phase 4 の検証セットを増やさず、Phase 11 の既存 smoke で確認できる粒度に収める。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | 重複棚卸し結果 / 方針判定 / 依存グラフ / スコープ境界 |
| ドキュメント | outputs/phase-08/before-after.md | task-specification-creator の重複解消サンプル |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 各対象 skill で `references/` 横断の重複候補表が作成
- [ ] 全重複候補に方針 A / B / C のいずれかが付与
- [ ] 循環参照が無い（DAG）ことが依存グラフで確認
- [ ] skill 横断はスコープ外として `outputs/phase-08/main.md` に明記
- [ ] before / after サンプルが `outputs/phase-08/before-after.md` に 1 例以上
- [ ] 重複解消後も entry < 200 行 budget が維持

## タスク 100% 実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物 2 ファイルが `outputs/phase-08/` 配下に配置予定
- 循環参照ゼロが依存グラフで証跡化
- skill 横断の別タスク化リストが Phase 12 の `unassigned-task-detection.md` に引き継ぎ予約
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - 重複解消後の references 配置 → Phase 9 link 検証の前提
  - スコープ外候補リスト → Phase 12 unassigned-task-detection に登録
  - before / after サンプル → Phase 12 implementation-guide.md に転記
- ブロック条件:
  - 重複候補に方針未付与
  - 循環参照が解消できない
  - 解消後 entry が 200 行を超える
