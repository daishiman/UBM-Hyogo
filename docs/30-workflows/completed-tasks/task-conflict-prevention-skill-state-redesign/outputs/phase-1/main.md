# Phase 1 成果物: 要件定義

## 1. 既存 ledger 棚卸し

`.claude/skills/` 配下を再帰的に走査し、コンフリクト原因となる共有 ledger を抽出した。

| # | パス | 性質 | 行独立 / 構造体 | 正本 / 派生 | 想定施策 |
| --- | --- | --- | --- | --- | --- |
| 1 | `.claude/skills/aiworkflow-requirements/LOGS.md`（555 行） | append-only 利用ログ | 行独立 | 派生（hook 自動追記） | A-1 + A-2 |
| 2 | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 全文検索 index | 構造体（JSON） | 派生（generate-index.js） | A-1 |
| 3 | `.claude/skills/aiworkflow-requirements/indexes/index-meta.json` | カウンタ・統計 | 構造体（JSON） | 派生 | A-1 |
| 4 | `.claude/skills/aiworkflow-requirements/SKILL.md`（190 行） | skill 本体 | 章単位 | 正本 | A-3（暫定・閾値ぎり） |
| 5 | `.claude/skills/task-specification-creator/SKILL.md`（511 行） | skill 本体 | 章単位 | 正本 | A-3（必須） |
| 6 | `.claude/skills/task-specification-creator/SKILL-changelog.md`（310 行） | append-only changelog | 行独立 | 正本 | A-2 |
| 7 | `.claude/skills/task-specification-creator/LOGS.md` | append-only 利用ログ | 行独立 | 派生 | A-1 + A-2 |
| 8 | `.claude/skills/*/EVALS.json` | 評価結果 | 構造体 | 派生 | A-1 |
| 9 | `.claude/skills/*/lessons-learned-*.md`（将来発生） | append-only 学び | 行独立 | 正本 | A-2 |

判定基準:

- **派生**: hook / script で再生成可能。人手の意味付与なし
- **正本**: 人手追記の意味があり履歴保持必須
- **行独立**: 各行が単独で意味を持つ（`merge=union` 適用可）
- **構造体**: JSON / YAML / 入れ子。`merge=union` 不可

## 2. 機能要件 (FR)

| # | 要件 | 観測可能な成立条件 |
| --- | --- | --- |
| FR-1 | A-1 対象は「hook 自動再生成可能」かつ「人手意味なし」のみ | `.gitignore` に列挙された path が `git ls-files` で 0 件 |
| FR-2 | A-2 fragment 名は時刻 + escaped branch + nonce で衝突不能 | 同秒・同 branch でも 8hex nonce により実質衝突確率 < 1/2^32 |
| FR-3 | render script は読み取り専用・副作用なし | exit 後に working tree が変化しない（`git status` 差分 0） |
| FR-4 | A-3 適用後の SKILL.md は index 役のみ | 200 行未満かつ詳細は `references/<topic>.md` に存在 |
| FR-5 | B-1 は行独立フォーマット限定 | `.gitattributes` に列挙された path がいずれも JSON/YAML/構造体でない |

## 3. 非機能要件 (NFR)

| # | 要件 | 検証方法 |
| --- | --- | --- |
| NFR-1 | 4 worktree 並列 commit でも ledger 由来コンフリクト 0 件 | Phase 4 シミュレーションで `git merge` 衝突件数 |
| NFR-2 | render script は O(N)（N=fragment 数） | 1k / 10k fragment でほぼ線形 |
| NFR-3 | 既存 skill 利用フローを破壊しない | SKILL.md からの Progressive Disclosure 参照が有効 |
| NFR-4 | 本タスク生成物は Markdown / JSON / `.gitkeep` のみ | コードファイル（.ts/.js/.sh）の追加 0 |

## 4. 4 worktree 並列シナリオ

4 worktree が同一 `main` から派生し、それぞれ別 feature を進めている前提。

| シナリオ | 各 worktree の振る舞い | 現状で衝突する理由 | A-1〜B-1 適用後に解消する理由 |
| --- | --- | --- | --- |
| S-1: 同時 hook 再生成 | post-commit が `keywords.json` の `totalKeywords` を更新 | 同一 key を異なる値で書く 3-way merge 不可 | A-1 で untrack。各 worktree がローカル再生成 |
| S-2: LOGS 並列追記 | 4 worktree が `LOGS.md` 末尾に 1 行追加 | 末尾位置の競合（同一バイト位置に異内容） | A-2 で別ファイル fragment 化 → 衝突源消滅 |
| S-3: SKILL.md 同時編集 | 異 worktree が異なる章を加筆 | 1 ファイルが肥大しているので近接行に集中 | A-3 で `references/<topic>.md` に分離 → 編集箇所が散る |
| S-4: changelog 追記 | 異版数の release note を同時追加 | 末尾追記の競合 | A-2: `changelog/<semver>.md` 1 ファイル 1 release |
| S-5: 暫定期間中の LOGS.md 直接更新 | A-2 移行完了前 | 末尾追記競合 | B-1 `merge=union` で行単位自動マージ |

## 5. 因果ループ

| 種別 | ループ | 対応施策 |
| --- | --- | --- |
| 強化（悪循環） | ledger 肥大 → 追記増加 → conflict 増加 → rework 増加 → 更にログ追記 | A-2 / A-3 で共有可変ファイルを物理分割 |
| バランス（緩和） | fragment 増加 → 可読性低下 → render 需要 → 読取専用集約で可読性回復 | render-api を Phase 2 で固定 |
| 強化（移行期） | A-2 未適用ファイル → B-1 union で延命 → A-2 移行で `.gitattributes` から削除 | Phase 2 / Phase 7 で解除手順固定 |

優先順位: **A-2 fragment 化 → A-1 派生物 untrack → A-3 entrypoint 縮小 → B-1 暫定 union**。

## 6. 完了条件チェック

- [x] ledger 棚卸し完了（9 件分類）
- [x] FR-1〜FR-5 / NFR-1〜NFR-4 文書化
- [x] 並列シナリオ S-1〜S-5 を Phase 4 / Phase 11 が利用できる形に整理
- [x] AC-1 / AC-9 の素地を確定（対象パス列挙 + 生成物種別の制限）
