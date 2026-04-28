# Lessons Learned — Skill Ledger Redesign（2026-04）

> 最終更新日: 2026-04-28
> 出典: `outputs/phase-12/skill-feedback-report.md` / `outputs/phase-12/implementation-guide.md` / 4 つの実装タスク仕様書（A-1 / A-2 / A-3 / B-1）の §9 苦戦箇所
> 目的: task-conflict-prevention-skill-state-redesign 設計時に予見・観測された苦戦箇所と教訓を集約し、再発防止策を canonical reference として残す。

## L-SLR-001: A-2 を A-1 より先に実施しないと履歴が消える

| 項目 | 内容 |
| --- | --- |
| 症状 | A-1（gitignore 化）を A-2 より先に実施し、`.claude/skills/<skill>/LOGS.md` を `.gitignore` に追加した瞬間、それまで append-only で蓄積されてきた `LOGS.md` の履歴が「git 管理対象外」に転落し、worktree 削除や別 PR の checkout で履歴が事実上失われる |
| 原因 | `LOGS.md` は本来正本だが、A-2 完了前は履歴を保持する場所が `LOGS.md` 1 ファイルのみで、`LOGS/_legacy.md` と `LOGS/<timestamp>-<branch>-<nonce>.md` の退避先がまだ作られていない |
| 対応 | implementation-guide §実装順序で **1) A-2 → 2) A-1 → 3) A-3 → 4) B-1** を厳守と規定。Phase 5 runbook §適用範囲で「`LOGS.md` は A-2 完了まで gitignore に入れない」と明記。A-1 タスク §3.1 / §3.2 / §7 / §9 の 4 箇所で A-2 完了を必須前提条件として重複明記 |
| 再発防止 | A-1 PR レビュー時のチェック項目に「`LOGS.md` を gitignore に入れていないこと」「A-2 PR が先行マージ済みであること」を必須化 |

## L-SLR-002: append-only writer の見落とし

| 項目 | 内容 |
| --- | --- |
| 症状 | A-2 fragment 化で writer / hook / 手動運用の append 経路を切替えても、どれか 1 経路が `LOGS.md` 直接追記を続けると A-2 効果（conflict 0 件）が完全に失われる |
| 原因 | append 経路が複数モジュールに散らばっており、grep ベースで全列挙してもレビュー時に見落としが発生する |
| 対応 | A-2 タスク Phase 4 で writer 切替を 1 PR で完結。CI に `git grep 'LOGS\.md' .claude/skills/` の writer ヒット 0 件チェックを追加。Phase 1〜3 は writer 切替前でも legacy 経由で動作するよう設計 |
| 再発防止 | append helper を共通実装に集約し、各モジュールから直接ファイル書き込みを禁止。CI ガードを必須化 |

## L-SLR-003: 同一秒・同一 branch の fragment 衝突

| 項目 | 内容 |
| --- | --- |
| 症状 | 同一秒・同一 branch から fragment が 2 件生成されると path が衝突する |
| 原因 | 当初仕様 `<YYYYMMDD>-<HHMMSS>-<branch>.md` のみでは秒精度が並列追記に耐えなかった |
| 対応 | 8 hex（32bit）nonce を必須化。1 worktree 秒間 1000 ファイル生成でも期待衝突回数 ≈ 1.16×10⁻⁴ に抑制。事前存在チェック → 衝突時は再生成リトライを append helper に組込 |
| 再発防止 | 命名 regex `^LOGS/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$` をスキーマで固定化 |

## L-SLR-004: legacy と新 fragment の混在 render 順序崩れ

| 項目 | 内容 |
| --- | --- |
| 症状 | render script が `_legacy.md` と新規 fragment を timestamp 降順で merge する際、legacy には fragment と同形式の timestamp が無いため順序が崩れる |
| 原因 | legacy は append-only 1 ファイル形式で、entry ごとの timestamp が本文中の自由記述に埋まっている |
| 対応 | render に擬似 timestamp 抽出層を入れる（mtime / 本文末尾 entry 日付 heuristic）。`--include-legacy` 指定時のみ末尾「Legacy」セクションへ連結し、純粋 fragment 群と混在しないようにする |
| 再発防止 | legacy 擬似 timestamp 抽出ロジックをユニットテスト化（`outputs/phase-2/render-api.md`）|

## L-SLR-005: 4 worktree smoke 標準化欠如

| 項目 | 内容 |
| --- | --- |
| 症状 | 4 worktree 並列 smoke で衝突 0 件を保証する手順が標準化されていない |
| 原因 | これまで 2 worktree smoke しか経験がなく、3-way merge と 4-way merge では衝突発生条件が異なる |
| 対応 | `scripts/new-worktree.sh verify/a2-{1,2,3,4}` で 4 worktree 作成 → 各で fragment 生成 → main から順次 merge → `git ls-files --unmerged` 0 行を必須化。証跡を `outputs/phase-11/evidence/<run-id>/` に保存 |
| 再発防止 | 4 worktree smoke を CI の手動 trigger ジョブとして登録。各実装タスク完了条件に組み込む |

## L-SLR-006: SKILL.md 分割でのリンク切れ

| 項目 | 内容 |
| --- | --- |
| 症状 | 既存ドキュメント・他 skill・workflow から大量のリンクが SKILL.md の特定アンカーを指しており、A-3 分割で参照切れが発生しやすい |
| 原因 | SKILL.md が単一 entrypoint として長期使用され、外部リンクが内部セクション粒度まで深く張られている |
| 対応 | 分割後 SKILL.md 末尾に references リンク表を必ず置き、外部から旧アンカー名で来た参照が references へ自然誘導される構造化。Phase 5 の `rg` 健全性検査を完了条件 |
| 再発防止 | 新規 skill の SKILL.md 作成時点で 200 行未満を満たすテンプレを skill-creator 側に組込み、肥大化を未然防止 |

## L-SLR-007: `merge=union` の誤適用

| 項目 | 内容 |
| --- | --- |
| 症状 | `merge=union` を front matter 付き Markdown / JSON / YAML に誤適用すると `---` が重複したり構造体が静かに破損する |
| 原因 | `merge=union` ドライバは行単位の機械マージしか行わず、構造体の整合性を見ない。`**/*.md` のような広域 glob は front matter 付き fragment まで巻き込む |
| 対応 | pattern を `**/_legacy.md` のような移行猶予対象に限定。Phase 1 で front matter / コードフェンス / 構造体の有無を判定して除外。Phase 3 で `git check-attr merge` を対象 / 除外双方に対して実行し、`unspecified` を確認 |
| 再発防止 | A-2 完了レビューチェックリストに「B-1 attribute 残存確認」を追加。適用禁止対象（JSON / YAML / `SKILL.md` / lockfile）を runbook で明示 |

## L-SLR-008: skill 自身への施策適用漏れ（ドッグフーディング）

| 項目 | 内容 |
| --- | --- |
| 症状 | `task-specification-creator/SKILL.md` が 200 行超のまま「200 行未満を推奨」と書かれており、skill 自身が施策の対象から漏れていた |
| 原因 | skill 改修と本タスクの設計が同時並行で、skill 自身を施策対象に含める方針が固まっていなかった |
| 対応 | A-1〜B-1 実装タスクの **対象に skill 自身を含める**。skill-feedback-report §改善提案 F-1〜F-5 を T-1〜T-4 のスコープに反映 |
| 再発防止 | 「skill 改修 PR の merge conflict 発生率」を観測指標とし、A-1〜B-1 適用前後 30 日比較で効果を計測 |

## L-SLR-009: `_legacy.md` 物理削除の誤発生

| 項目 | 内容 |
| --- | --- |
| 症状 | A-2 移行後にスペース節約目的で `_legacy.md` を物理削除すると履歴が断絶する |
| 原因 | backward-compat 方針（30 日 include window）と削除禁止規約の周知不足 |
| 対応 | Phase 3 backward-compat で **`_legacy.md` 削除禁止** を明記。fragment-spec / overview 双方で重複明記 |
| 再発防止 | レビューチェック項目に「`_legacy.md` の削除有無」を追加 |

## 再発防止サマリ（チェックリスト）

| # | チェック | 適用フェーズ |
| --- | --- | --- |
| C-1 | 実装順序 A-2 → A-1 → A-3 → B-1 を厳守 | 全実装タスク開始時 |
| C-2 | A-1 PR で `LOGS.md` を gitignore に入れていない | A-1 レビュー |
| C-3 | A-2 完了後に CI grep ガードが緑 | A-2 PR |
| C-4 | fragment 命名 regex に nonce 必須 | A-2 実装 |
| C-5 | `--include-legacy` 指定時の順序が壊れない | A-2 単体テスト |
| C-6 | 4 worktree smoke 証跡を保存 | 全施策の完了条件 |
| C-7 | SKILL.md 200 行未満 | A-3 完了条件 |
| C-8 | `merge=union` が JSON / YAML / SKILL.md に当たらない | B-1 検証 |
| C-9 | `_legacy.md` 削除禁止 | 全期間 |
| C-10 | skill 自身に 4 施策が適用済み | T-1〜T-4 完了確認 |

## 関連 references

- `skill-ledger-overview.md`
- `skill-ledger-fragment-spec.md`
- `skill-ledger-gitignore-policy.md`
- `skill-ledger-progressive-disclosure.md`
- `skill-ledger-gitattributes-policy.md`
- `lessons-learned.md`（親 index）
