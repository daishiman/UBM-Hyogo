# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | （なし。本タスクの起点） |
| 下流 | Phase 2 (設計) |
| 状態 | pending |

## 目的

並列開発時に skill 配下の共有 ledger ファイルがコンフリクトを多発させている根本原因を、
**ファイル設計レベル**で消滅させるための機能要件・非機能要件・受け入れ基準を確定する。
4 施策（A-1: gitignore 化 / A-2: fragment 化 / A-3: Progressive Disclosure /
B-1: merge=union）について、何を「成立」とみなすかを Phase 2 以降が誤解しない粒度で定義する。

## 真の論点

1. **どの ledger が「自動生成 / 派生物」で、どれが「人手追記の正本」か** を分類する基準を確定する
2. **fragment 化の粒度**: ファイル単位か、エントリ単位か、UUID 単位か
3. **後方互換**: 既存 `LOGS.md` の history を捨てるか、`LOGS/_legacy.md` に退避するか
4. **A-3 の 200 行閾値の根拠**: 何を持って「肥大化」と定義するか
5. **B-1 を恒久策にするか、A-2 への移行までの暫定策にするか**

## 機能要件 (FR)

- FR-1: A-1 対象ファイルは「post-commit / post-merge hook が自動再生成可能」かつ
  「人手で意味を与えていない（カウンタ・index 等派生情報のみ）」を満たすこと
- FR-2: A-2 fragment 命名は **時刻 + escaped branch 名 + nonce**で衝突しないこと
  （同秒・同一 branch の複数 entry でも一意になる）
- FR-3: A-2 の集約 view 用 render script が **読み取り専用 / 副作用なし**で
  `LOGS/` 配下を時系列マージできること
- FR-4: A-3 の SKILL.md は index 役に徹し、**詳細は references/<topic>.md** に配置されること
- FR-5: B-1 の `merge=union` は **行単位独立**フォーマットのみに適用すること
  （YAML / JSON / 構造体には適用しない）

## 非機能要件 (NFR)

- NFR-1: 4 worktree からの並列 commit でも ledger 由来の merge conflict が **0 件** になること
- NFR-2: render script の実行は ledger 規模に対して O(N) で動くこと（N: fragment 数）
- NFR-3: 既存の skill 利用フロー（SKILL.md からの Progressive Disclosure）が壊れないこと
- NFR-4: 本タスクの生成物は Markdown / JSON / `.gitkeep` のみ（コードを書かない）

## 受け入れ基準

- AC-1: A-1 / A-2 / A-3 / B-1 の対象ファイルパスと変更後形式が Phase 2 で明記される
- AC-2: fragment 命名規約が同一秒・同一 branch でも一意になる
- AC-3: A-3 で `SKILL.md` が 200 行未満になる分割案が示される
- AC-4: B-1 の `.gitattributes` パターンが行レベル独立ファイルに限定される
- AC-5: Phase 4 で 4 worktree 並列 commit シミュレーション手順が記述される
- AC-6: Phase 11 で後続実装後に衝突 0 件を検証できる証跡形式が固定される
- AC-7: Phase 12 で `docs/00-getting-started-manual/specs/` 更新手順が changelog と整合する
- AC-8: 既存 `LOGS.md` history 保持方針が Phase 3 で評価される
- AC-9: 本タスクの生成物は Markdown / JSON / `.gitkeep` のみ
特に Phase 1 では AC-1 / AC-9 の素地を確定させる

## 価値とコスト

| 区分 | 内容 |
| --- | --- |
| 初回価値 | 並列開発のコンフリクトに費やしている時間（推定: マージごとに数分 × worktree 数）の削減、衝突起因の rework 撲滅 |
| 払うコスト | render script の維持、fragment ファイル数の増加（git tree への影響は微小） |
| 払わないコスト | skill 機能本体の改修、hook 実体の書き換え（別タスク） |

## 因果ループと優先順位

| 種別 | ループ | 対応 |
| --- | --- | --- |
| 強化ループ | ledger 肥大化 → 追記増加 → merge conflict 増加 → 手動修正増加 → ledger 追記増加 | A-2 / A-3 で共有可変ファイルを減らす |
| バランスループ | fragment 増加 → 可読性低下 → render view 需要増加 → 読み取り専用集約で可読性回復 | render API を Phase 2 で固定 |

改善優先順位は A-2 fragment 化、A-1 派生物 untrack、A-3 entrypoint 縮小、B-1 暫定 union の順とする。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか | PASS | 並列 worktree 開発者全員のマージコスト |
| 実現性 | 無料運用で成立 | PASS | Git native 機能のみ |
| 整合性 | 型 / runtime / data | PASS | 派生物 vs 正本を分類で固定 |
| 運用性 | rollback / handoff | PASS | 各施策は独立で revert 可能 |

## 実行タスク

### タスク 1: 既存 ledger 棚卸し

**目的**: A-1 / A-2 / A-3 / B-1 の対象候補ファイルを全列挙する

**実行手順**:
1. `.claude/skills/` 配下を再帰的に列挙
2. `LOGS*.md` / `*-changelog.md` / `lessons-learned-*.md` / `indexes/*.json` を抽出
3. 各ファイルの「自動生成 or 人手追記」「行独立 or 構造体」「正本 or 派生」を分類
4. 結果を `outputs/phase-1/main.md` に表として記録

### タスク 2: 4 施策の機能要件確定

**目的**: A-1 / A-2 / A-3 / B-1 ごとに FR を文章で固定する

**実行手順**:
1. 各施策に対し FR-N を 2〜5 個書き出す
2. 「どの状態になれば成立か」を観測可能な事実で表現する
3. NFR（パフォーマンス / 後方互換 / 運用性）を独立節で記す

### タスク 3: 4 worktree 並列シナリオ定義

**目的**: 検証で再現すべき並列 commit パターンを Phase 4 / 11 で使える形にする

**実行手順**:
1. 4 worktree が同一 main から派生し、それぞれ別 feature に取り組む状況を文章化
2. 各 worktree が ledger を「触る理由」を列挙（hook 自動再生成、追記、SKILL.md 編集）
3. それぞれのパターンが現状でなぜ衝突するか、A-1〜B-1 適用後になぜ衝突しないかを対応表化

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | 既存 ledger 構造 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | SKILL.md 肥大化事例 |
| 必須 | `.claude/skills/task-specification-creator/SKILL-changelog.md` | append-only changelog 事例 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-1/main.md | 棚卸し / FR / NFR / 並列シナリオ |
| メタ | artifacts.json | Phase 1 → completed |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | FR を設計の入力に使う |
| Phase 4 | 並列シナリオを検証ケースに変換 |
| Phase 11 | 並列シナリオを手動 4 worktree 検証に流用 |

## 完了条件

- [ ] ledger 棚卸し完了（対象ファイル全列挙）
- [ ] FR-1〜FR-5 / NFR-1〜NFR-4 文書化
- [ ] 並列シナリオを Phase 4 / 11 が利用できる形に整理
- [ ] artifacts.json の Phase 1 を completed に更新

## タスク 100% 実行確認【必須】

- [ ] 本 Phase 内の全タスクを 100% 実行
- [ ] outputs/phase-1/main.md が配置
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ事項: ledger 分類表 / FR / NFR / 並列シナリオ
