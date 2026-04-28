# SKILL.md の Progressive Disclosure 化 - タスク指示書

## メタ情報

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | task-skill-ledger-a3-progressive-disclosure                |
| タスク名     | SKILL.md の Progressive Disclosure 化                      |
| 分類         | リファクタリング                                           |
| 対象機能     | `.claude/skills/*/SKILL.md` の入口ファイル分割             |
| 優先度       | 中                                                         |
| 見積もり規模 | 中規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | task-conflict-prevention-skill-state-redesign Phase 12     |
| 発見日       | 2026-04-28                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`.claude/skills/*/SKILL.md` は skill loader の唯一の entrypoint であり、複数 worktree が並列開発する際にも各タスクが冒頭〜末尾を頻繁に読み書きする中核ファイルである。代表例の `task-specification-creator/SKILL.md` は 500 行超まで肥大化しており、Phase テンプレ／アセット規約／品質ゲート／オーケストレーションが 1 ファイルに同居している。Phase 7 (`skill-split-runbook.md`) では 200 行未満の入口に縮め、詳細を `references/<topic>.md` へ Progressive Disclosure 方式で分割する方針が確定した。

### 1.2 問題点・課題

- 単一 SKILL.md に多責務が集中しており、worktree 間で同じ行帯を編集して merge conflict が発生しやすい
- 局所追記の PR でも diff 範囲が大きくなり、レビューコストが増大する
- skill loader / agent 導線（trigger / allowed-tools / Anchors）と詳細仕様が分離されていないため、loader が必要としない情報まで毎回ロードされる
- 既に分割済みの `aiworkflow-requirements` と未分割の skill とで構造が不揃い

### 1.3 放置した場合の影響

- A-1 / A-2 / B-1 で fragment 化された記録ファイルの効果が、SKILL.md 衝突によって相殺される
- skill 数が増えるほど 200 行超の SKILL.md が積み上がり、後の分割コストが指数的に増える
- entry が長大化し続けると loader 起動時の context 消費が無視できない量になる

---

## 2. 何を達成するか（What）

### 2.1 目的

200 行を超える `.claude/skills/*/SKILL.md` を、200 行未満の entrypoint と `references/<topic>.md` ファミリへ Progressive Disclosure 方式で分割し、worktree 並列編集時の merge conflict を構造的に防ぐ。

### 2.2 最終ゴール

- 対象 SKILL.md がすべて 200 行未満
- 詳細トピックは `references/<topic>.md` に単一責務で分離
- entry には クイックスタート / モード一覧 / agent 導線（trigger・allowed-tools・Anchors）が残存
- SKILL.md → references への参照は片方向、references 同士は循環参照なし
- canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) の差分が 0

### 2.3 スコープ

#### 含むもの

- `.claude/skills/*/SKILL.md` の棚卸し（200 行超リスト確定）
- `task-specification-creator` をはじめとする対象 skill の分割設計
- `references/<topic>.md` への抽出と SKILL.md 入口リライト
- SKILL.md → references 相対リンクの健全性検証
- `.agents/skills/...` mirror への同期反映と差分検証

#### 含まないもの

- skill の意味的な書き換え・新規 trigger 追加（メカニカルな分割のみ）
- 既に `references/` 分割済みの skill（例: `aiworkflow-requirements`）への変更
- skill loader 本体・doctor スクリプトの実装変更
- A-1（gitignore）/ A-2（fragment）/ B-1（gitattributes）施策の実装

### 2.4 成果物

- 分割後 `SKILL.md`（200 行未満）と `references/<topic>.md` 群
- `.agents/skills/...` mirror への反映差分
- 行数検査ログ（全 SKILL.md が `OK` であること）
- リンク健全性検査ログ（未参照 reference 0 件、リンク切れ 0 件）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 本タスク `task-conflict-prevention-skill-state-redesign` Phase 1〜13 が承認済
- A-1（gitignore 化）が完了している（実装順序: A-2 → A-1 → A-3 → B-1）
- 並列で同一 SKILL.md を編集する他タスクが存在しない（タスク開始時に announce）

### 3.2 依存タスク

- `task-skill-ledger-a1-gitignore` 完了（必須前提・並列衝突回避のため）
- `task-skill-ledger-a2-fragment` 完了（render script と fragment 規約が前提）

### 3.3 必要な知識

- skill loader が SKILL.md front matter / Anchors / trigger をどう解決するか
- canonical (`.claude/skills/`) と mirror (`.agents/skills/`) の同期規約
- Progressive Disclosure 原則（entry は最小、詳細は遅延ロード）
- Markdown 相対リンクと `rg` でのリンク検査パターン

### 3.4 推奨アプローチ

`docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md` の Step 1〜5 を機械的に踏襲する。意味的な書き換えは行わず、既存セクションをトピック単位で切り出すのみ。entry には loader が必要とする最小情報（front matter / 概要 5〜10 行 / trigger / Anchors / references リンク表 / 最小 workflow）のみを残し、それ以外は `references/<topic>.md` へ移送する。

---

## 4. 実行手順

### Phase構成

1. 対象 SKILL.md の棚卸し
2. 分割設計（topic 切り出し計画）
3. `references/` への抽出
4. 入口 SKILL.md のリライト
5. リンク健全性検証と mirror 同期

### Phase 1: 対象 SKILL.md の棚卸し

#### 目的

200 行を超える `.claude/skills/*/SKILL.md` を全件抽出し、対象リストを固定する。

#### 手順

1. `for f in .claude/skills/*/SKILL.md; do printf '%5d  %s\n' "$(wc -l < "$f")" "$f"; done | sort -nr` を実行
2. 200 行以上の SKILL.md を対象リストに追加
3. 既に `references/` を持つ skill（例: `aiworkflow-requirements`）はスコープ外として明示
4. 対象リストを Phase 2 設計書として固定

#### 成果物

対象 SKILL.md 一覧（行数つき）

#### 完了条件

200 行超の SKILL.md が漏れなく列挙され、対象 / 対象外が明確になっている

---

### Phase 2: 分割設計（topic 切り出し計画）

#### 目的

各対象 SKILL.md について、entry に残す情報と `references/<topic>.md` へ移す情報の境界を決める。

#### 手順

1. SKILL.md を読み、章単位で「entry 必須」「references 移送」のラベルを付与
2. references の topic 名を単一責務原則で命名（例: `phase-templates.md` / `asset-conventions.md` / `quality-gates.md` / `orchestration.md`）
3. entry に残す要素を確定: front matter / 概要 5〜10 行 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow
4. references 同士の循環参照が出ない依存グラフを作成

#### 成果物

skill ごとの分割設計表（entry 残置項目 / references topic / 行数見積もり）

#### 完了条件

すべての対象 skill で entry が 200 行未満に収まる見積もりが取れている

---

### Phase 3: `references/` への抽出

#### 目的

設計に従って `references/<topic>.md` を新規作成し、SKILL.md から該当セクションを移送する。

#### 手順

1. `mkdir -p .claude/skills/<skill>/references`
2. SKILL.md の対象セクションを `references/<topic>.md` へ切り出し
3. 各 reference の冒頭に front matter（タイトル・責務・親 SKILL.md への戻り参照は禁止）を付与
4. references 内のリンクは references 内で完結させる
5. 機械的なセクション切り出しのみ実施（意味的な書き換えは別タスク）

#### 成果物

`references/<topic>.md` 群（skill ごと）

#### 完了条件

SKILL.md から移送すべきセクションがすべて references に存在し、内容欠損がない

---

### Phase 4: 入口 SKILL.md のリライト

#### 目的

SKILL.md を 200 行未満の entrypoint に縮約し、references への相対リンク表を整備する。

#### 手順

1. SKILL.md から移送済みセクションを削除
2. References 表を追加（`| topic | path |` 形式で `references/<topic>.md` を列挙）
3. クイックスタート / モード一覧 / agent 導線が残っていることを目視確認
4. 行数を計測し 200 行未満を確認
5. canonical を整えた後、`.agents/skills/<skill>/` mirror へ rsync 等で同期

#### 成果物

200 行未満の SKILL.md（canonical / mirror 双方）

#### 完了条件

- 行数 < 200
- entry の必須要素（trigger / Anchors / クイックスタート / モード一覧 / agent 導線）が揃っている
- canonical と mirror の差分が 0

---

### Phase 5: リンク健全性検証と mirror 同期

#### 目的

SKILL.md → references の参照切れがないこと、未参照 reference がないこと、mirror 同期に差分がないことを保証する。

#### 手順

1. 行数検査:
   ```bash
   for f in .claude/skills/*/SKILL.md; do
     lines=$(wc -l < "$f")
     [[ $lines -ge 200 ]] && echo "FAIL: $f = $lines" || echo "OK: $f = $lines"
   done
   ```
2. SKILL.md からのリンク列挙: `rg -n 'references/' .claude/skills/<skill>/SKILL.md`
3. 未参照 reference の検出: `find references -type f` の各 path が SKILL.md で `rg` ヒットすることを確認
4. canonical / mirror 差分: `diff -r .claude/skills/<skill> .agents/skills/<skill>`
5. skill loader 動作確認（loader doctor が提供されている場合）

#### 成果物

検査ログ（行数 / リンク / mirror diff）

#### 完了条件

- 全 SKILL.md が `OK`
- リンク切れ 0 件・未参照 reference 0 件
- canonical と mirror の差分 0

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 対象 SKILL.md がすべて 200 行未満
- [ ] `references/<topic>.md` が単一責務で命名・配置されている
- [ ] entry に クイックスタート / モード一覧 / agent 導線（trigger・allowed-tools・Anchors）が保持されている
- [ ] SKILL.md → references の参照は片方向、references 同士に循環参照なし
- [ ] canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) の差分が 0

### 品質要件

- [ ] 行数検査スクリプトで全 SKILL.md が `OK`
- [ ] `rg` によるリンク健全性検査でリンク切れ 0 件
- [ ] 未参照 reference 0 件

### ドキュメント要件

- [ ] Phase 1 棚卸し結果が記録されている
- [ ] Phase 2 分割設計表が記録されている
- [ ] Phase 5 検証ログが evidence ディレクトリに保存されている

---

## 6. 検証方法

### テストケース

- 200 行超の SKILL.md が分割後すべて 200 行未満になる
- skill loader が分割後 SKILL.md を entrypoint として解決できる
- references から SKILL.md への戻り参照が存在しない
- 未参照 reference / リンク切れが 0 件
- canonical を変更したとき mirror に同一差分が反映される

### 検証手順

```bash
# 行数検査
for f in .claude/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  if [[ $lines -ge 200 ]]; then
    echo "FAIL: $f = $lines lines"
  else
    echo "OK:   $f = $lines lines"
  fi
done

# リンク健全性
for skill in .claude/skills/*/; do
  rg -n 'references/' "$skill/SKILL.md" || true
done

# canonical / mirror 差分
for skill in .claude/skills/*/; do
  name=$(basename "$skill")
  diff -r ".claude/skills/$name" ".agents/skills/$name" || true
done
```

---

## 7. リスクと対策

| リスク                                                                   | 影響度 | 発生確率 | 対策                                                                                              |
| ------------------------------------------------------------------------ | ------ | -------- | ------------------------------------------------------------------------------------------------- |
| 既存リンクが大量に SKILL.md を指しており、分割で参照切れが発生           | 高     | 中       | Phase 5 のリンク健全性検査を完了条件にし、リダイレクト用に references 表を SKILL.md 末尾へ必ず追加 |
| entry に残すべき情報と references へ逃すべき情報の境界判断ミス           | 中     | 高       | Phase 2 で分割設計表を作り、loader 必須要素（trigger / allowed-tools / Anchors）を明示的に entry 残置 |
| 並列で同 SKILL.md を編集中の他タスクと衝突                               | 高     | 中       | A-1 / A-2 完了後に着手し、タスク開始時に skill 単位で announce。1 PR = 1 skill 分割を厳守        |
| canonical / mirror 同期漏れ                                              | 中     | 中       | Phase 5 で `diff -r` を完了条件にする                                                              |
| 意味的な書き換えがメカニカル分割に混入                                   | 中     | 低       | 切り出しは「セクション単位の cut & paste」のみ。意味変更は別タスクへ分離                          |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/main.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/file-layout.md`
- `.claude/skills/task-specification-creator/SKILL.md`（分割対象代表例）
- `.claude/skills/aiworkflow-requirements/SKILL.md`（分割済み参考例）

### 参考資料

- Progressive Disclosure 原則（entry は最小、詳細は遅延ロード）
- 1 PR = 1 施策の独立 revert 原則（implementation-guide.md §ロールバック戦略）

---

## 9. 備考

### 苦戦箇所【記入必須】

> Phase 7 / Phase 12 設計時に予見された具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状 1   | 既存ドキュメント・他 skill・workflow から大量のリンクが SKILL.md の特定アンカーを指しており、分割によって参照切れが発生しやすい                                                                                                       |
| 原因 1   | SKILL.md が単一の entrypoint として長期にわたり使われ続けたため、外部リンクが内部セクション粒度まで深く張られている                                                                                                                   |
| 対応 1   | 分割後 SKILL.md 末尾に references リンク表を必ず置き、外部から旧アンカー名で来た場合でも references への誘導が成立するよう構造化する。Phase 5 の `rg` 健全性検査を完了条件とする                                                          |
| 症状 2   | entry に残すべき情報（loader が必要とする最小要素）と references へ逃すべき情報（詳細仕様）の境界判断が skill ごとに揺れる                                                                                                              |
| 原因 2   | skill ごとに front matter / Anchors / トリガー粒度が異なり、共通テンプレ化されていない                                                                                                                                                |
| 対応 2   | Phase 2 で skill ごとの分割設計表を作り、entry 残置項目を「front matter / 概要 5〜10 行 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow」の固定リストに揃える |
| 症状 3   | 並列で同一 SKILL.md を編集する他タスクと衝突し、A-2 / A-1 で fragment 化した効果が SKILL.md 衝突によって相殺されるリスク                                                                                                              |
| 原因 3   | A-3 が SKILL.md 自体を大きく書き換えるため、実装中の他 skill 改修タスクと並走すると merge conflict が確実に発生する                                                                                                                  |
| 対応 3   | 実装順序を A-2 → A-1 → A-3 → B-1 と固定し、A-3 着手前に対象 skill ごとに announce する。1 PR = 1 skill 分割を厳守して影響範囲を局所化する                                                                                              |
| 再発防止 | 新規 skill の SKILL.md を作る時点で 200 行未満を満たすテンプレを skill-creator 側に組み込み、肥大化を未然に防ぐルールを `system-spec-update-summary.md` で正本化する                                                                  |

### レビュー指摘の原文（該当する場合）

```
task-conflict-prevention-skill-state-redesign Phase 12 implementation-guide.md にて
A-3 SKILL.md Progressive Disclosure 化を未着手タスクとして識別。
phase-7/skill-split-runbook.md に分割手順が確定済みであり、A-1 完了後に着手する。
```

### 補足事項

- A-3 は単独で並列衝突しない性質を持つが、A-1 / A-2 で fragment 受け皿が整備された後でないと記録ファイルの衝突対策が不完全になるため、実装順序は固定（A-2 → A-1 → A-3 → B-1）
- 既に `references/` を持つ skill（例: `aiworkflow-requirements`）は対象外
- ロールバックは `references/` 分割の revert で 1 コミット粒度に戻る設計（implementation-guide.md §ロールバック戦略）
- canonical = `.claude/skills/...`、mirror = `.agents/skills/...` の二重管理は本タスクのスコープ内で同期を完結させる

### 苦戦箇所（ドッグフーディング設計時の追加記録）

> `outputs/phase-12/skill-feedback-report.md` F-1 / F-5 / `outputs/phase-12/implementation-guide.md` §実装順序で発見した A-3 関連の追加苦戦箇所。

| 項目     | 内容                                                                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `task-specification-creator/SKILL.md` 自身が 200 行を超えており、「200 行未満を推奨」と書いた skill が自分自身の規約を破っているドッグフーディング矛盾が判明                                                                            |
| 原因     | skill 自身が長期間運用されるなかで Phase テンプレ・アセット規約・品質ゲート・オーケストレーションを 1 ファイルに同居させ続け、Progressive Disclosure 規約整備が後回しになっていた                                                       |
| 対応     | A-3 のスコープに `task-specification-creator/SKILL.md` を最優先対象として含める（feedback F-1）。さらに skill 改修ガイドに「fragment で書け」「200 行を超えたら分割」を Anchor として明文化する（feedback F-5）                            |
| 再発防止 | skill-creator スキルのテンプレに「SKILL.md は 200 行未満」を必須項目として組み込み、新規 skill の SKILL.md 作成時点で `references/` 受け皿を作成。`task-specification-creator` 内 Anchors にも「200 行を超えたら分割」を明記する |

### スコープ（ドッグフーディング由来の追記）

#### 含む（追加）

- `task-specification-creator/SKILL.md` の最優先分割（200 行未満化）
- skill 改修ガイドへの「fragment で書け」「200 行を超えたら分割」Anchor 追記（A-2 で fragment 化された skill 自身の changelog / LOGS への運用ルール反映を含む）

#### 含まない（追加）

- skill-creator スキル本体テンプレへの 200 行制約組込み（再発防止策として別タスク化を許容）
- `aiworkflow-requirements` の再分割（既に `references/` 分割済みのためスコープ外）

### リスクと対策（ドッグフーディング由来の追記）

| リスク                                                                                          | 影響度 | 発生確率 | 対策                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `task-specification-creator/SKILL.md` を分割中に他 skill 改修タスクと衝突する                   | 高     | 中       | A-3 の中でも `task-specification-creator` を最優先・単独 PR で実施し、他 skill 分割は別 PR に分ける                          |
| Anchor 追記による意味的書き換えがメカニカル分割の「cut & paste」原則を破る                      | 中     | 中       | Anchor 追記は分割 PR とは別の小 PR で実施し、A-3 本体の revert を独立可能に保つ                                              |

### 検証方法（ドッグフーディング由来の追記）

```bash
# task-specification-creator/SKILL.md が 200 行未満
wc -l .claude/skills/task-specification-creator/SKILL.md
# => 200 未満

# skill 改修ガイドに「fragment で書け」「200 行を超えたら分割」Anchor が存在
rg -n 'fragment で書け|200 行を超えたら分割' .claude/skills/task-specification-creator/

# 全 SKILL.md が 200 行未満
for f in .claude/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  [[ $lines -ge 200 ]] && echo "FAIL: $f = $lines" || echo "OK:   $f = $lines"
done
```

