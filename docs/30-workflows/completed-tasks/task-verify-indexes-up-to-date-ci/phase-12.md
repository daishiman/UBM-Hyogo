# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 11 (手動 smoke) |
| 下流 | Phase 13 (PR 作成) |
| 状態 | completed |

## 目的

CI gate `verify-indexes-up-to-date` の存在・運用方法・失敗時の復旧手順を、
**コードを開かずに引き継げる** 状態でドキュメント化する。task-specification-creator skill の Phase 12 仕様に従い、
**5 必須タスク + 整合確認の計 6 種成果物** を `outputs/phase-12/` に出力する。

---

## 必須タスク 1: 実装ガイド作成（2 パート構成）

### 出力先

`outputs/phase-12/implementation-guide.md`

### Part 1: 中学生レベル（日常の例え話）

| 章 | 内容 |
| --- | --- |
| 1.1 困りごと | 「みんなで使う検索リスト（indexes）の更新を、誰かが忘れて古いまま main に入っちゃう」 |
| 1.2 例え話 | 「テストの答え合わせ表が更新されないまま配られると、採点が狂う」「自動採点係（CI）が答え合わせ表のズレを毎回チェックしてくれる」 |
| 1.3 解決後の状態 | PR を出すたびに自動採点係が「答え合わせ表は最新ですか？」と確認してくれる。古ければ赤信号で教えてくれる |

#### 専門用語セルフチェック（必須）

| 専門用語 | 中学生向け言い換え |
| --- | --- |
| GitHub Actions | 「GitHub という箱の中で動く自動係」 |
| workflow | 「自動係に渡すお仕事リスト」 |
| job | 「お仕事リスト 1 行ぶんの作業」 |
| step | 「作業の手順 1 つ」 |
| CI gate | 「合格しないと次に進めない関門」 |
| drift | 「本来一致しているべきものがズレている状態」 |
| index / indexes | 「検索を速くするための目次ファイル」 |
| pnpm indexes:rebuild | 「目次ファイルを作り直す呪文」 |
| git diff --exit-code | 「2 つのファイルを比べて、違ったら怒ってくれるコマンド」 |
| Node 24 / pnpm 10 | 「動かす土台のバージョン」 |
| mise | 「バージョンを揃える管理係」 |

### Part 2: 技術詳細（開発者・技術者レベル）

| 章 | 内容 |
| --- | --- |
| 2.1 workflow YAML 全体構成 | trigger（pull_request / push to main）/ concurrency / job 名 / runs-on / steps |
| 2.2 step ごとの責務 | actions/checkout@v4 → pnpm/action-setup@v4 → actions/setup-node@v4 (Node 24, cache: pnpm) → pnpm install --frozen-lockfile → pnpm indexes:rebuild → git diff --exit-code |
| 2.3 git diff exit code 仕様 | exit 0 = 一致 / exit 1 = drift / その他 = git エラー（fail に倒す） |
| 2.4 actions/setup-node@v4 | `node-version: 24` 固定、`cache: pnpm` で pnpm-lock.yaml ハッシュをキーにキャッシュ |
| 2.5 mise キャッシュ戦略 | actions runner では mise は使わず actions/setup-node を使う（ローカルとの差異の根拠） |
| 2.6 監視対象パス | `.claude/skills/aiworkflow-requirements/indexes/` 配下のみ。それ以外のファイル変更は本 gate で見ない（AC-7） |
| 2.7 失敗時のローカル復旧手順 | `mise exec -- pnpm indexes:rebuild` → `git diff` で確認 → commit → push |
| 2.8 既存 CI との関係 | ci.yml / backend-ci.yml / web-cd.yml / validate-build.yml と独立。job 名 `verify-indexes-up-to-date` で衝突回避 |
| 2.9 やってはいけないこと | post-merge hook に index 再生成を戻す / monorepo 全体の git diff を見る（誤検出原因） / Node バージョン非固定 |

---

## 必須タスク 2: システム仕様書更新（2 ステップ）

### 出力先

`outputs/phase-12/system-spec-update-summary.md`

### ステップ A: aiworkflow-requirements skill の references 更新AC

| 対象 | 現状 | 本実装AC |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md` | CI job 候補は既に未タスクとして存在するが、path / gate 名 / authoritative 判定が stale | 本実装のACとして「indexes 整合性は CI gate `verify-indexes-up-to-date` が authoritative」と更新 |

> 本 `implementation_completed_pr_pending` タスクでは、正本仕様更新を本実装の明示ACとして固定する。`system-spec-update-summary.md` には「更新対象・現状・本実装AC・検証コマンド」を記録する。

### ステップ B: CLAUDE.md「Git hook の方針」節への CI gate 名追記

| 対象 | 現状 | 本実装AC |
| --- | --- | --- |
| `CLAUDE.md` 「Git hook の方針」節 | post-merge 廃止と `pnpm indexes:rebuild` 経路は記載済み、CI gate 名は未記載 | 本実装のACとして「indexes drift は CI gate `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）で main 流入を阻止」と最小追記 |

> 追記は 1〜2 行に限定。既存節の構造を変えない。

---

## 必須タスク 3: ドキュメント更新履歴作成

### 出力先

`outputs/phase-12/documentation-changelog.md`

```markdown
## 2026-04-28: task-verify-indexes-up-to-date-ci implementation_completed_pr_pending

- 追加: docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci/ 配下 15 root files + outputs
  - index.md / artifacts.json
  - phase-01.md 〜 phase-13.md（13 files）
  - outputs/phase-{01..13}/ サブディレクトリ
- 影響: post-merge hook 廃止後の indexes drift 流入リスクを CI で構造的に防止
- 不変条件: なし（CI gate 追加のみ。CLAUDE.md 不変条件 #1〜#7 への影響なし）
- 関連 Issue: #137 (CLOSED → 本タスクで close 言及)
- 派生元: task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection (C-1)
```

---

## 必須タスク 4: 未タスク検出レポート（0 件でも出力必須）

### 出力先

`outputs/phase-12/unassigned-task-detection.md`

### 検出フロー実行記録（必須）

| ステップ | 実行内容 | 結果 |
| --- | --- | --- |
| 1 | 本タスク scope 内で「設計したが実装担当が決まっていない」項目の洗い出し | 検出 0 件（本タスク自体が CI gate 実装タスクへの spec を提供） |
| 2 | 派生候補の確認（他 skill index への横展開） | 後述「将来候補」に記載（即時タスク化は不要） |
| 3 | 本実装の確認 | `feat/wt-5` は本 spec PR 後に作成し、CI yml / CLAUDE.md / 正本仕様更新を担当 |

### 検出結果

| 項目 | 担当候補 task | 対応 |
| --- | --- | --- |
| （該当なし） | — | 本タスクは CI 実装と仕様同期を同一ブランチで完了し、PR 作成のみユーザー承認待ち |

### 将来候補（即時タスク化しない）

| 項目 | 説明 | 判断 |
| --- | --- | --- |
| 他 skill の indexes 検証 | aiworkflow-requirements 以外の skill が将来 indexes を持つ場合の横展開 | 現時点では対象 skill が存在しないため見送り（YAGNI） |
| dependency-cruiser 検証の CI gate 化 | indexes と同様の構造で展開可能 | 別 issue で起票判断、本タスクの scope 外 |

> **0 件でも本ファイルを必ず出力する**（task-specification-creator skill 規定）。

---

## 必須タスク 5: スキルフィードバックレポート（改善点なしでも出力必須）

### 出力先

`outputs/phase-12/skill-feedback-report.md`

### 適用 skill / template

- task-specification-creator (SKILL.md)
- phase-template-app.md / phase-meaning-app.md / artifacts-template.json

### 改善提案

| 項目 | 提案 | 重要度 |
| --- | --- | --- |
| phase-template-app.md | NON_VISUAL タスクで Phase 11 の screenshot 必須を「条件付き」と明示する文言を追加（現状は visualEvidence で読み替えるが、明文化されていない） | 中 |
| phase-meaning-app.md | docs + CI タスクの典型例として「CI gate 追加」を追加（現状はアプリ実装中心の例しかない） | 低 |
| task-specification-creator SKILL.md | Phase 12 「未タスク 0 件でも出力必須」を SKILL.md 本文に明示（現状は references/ 側で言及） | 低 |

> 改善提案がない場合でも `「改善提案なし（本タスクで適用した範囲では既存テンプレで十分）」` と明示記録する（task-specification-creator skill 規定）。

---

## 追加タスク 6: phase12-task-spec-compliance-check

### 出力先

`outputs/phase-12/phase12-task-spec-compliance-check.md`

### 整合確認表

| 項目 | 期待 | 実態 | 判定 |
| --- | --- | --- | --- |
| phase 数 | 13 | 13（phase-01.md 〜 phase-13.md） | OK |
| 必須セクション | メタ情報 / 目的 / 実行タスク / 参照資料 / 統合テスト連携 / 多角的チェック観点 / サブタスク管理 / 成果物 / 完了条件 / 100%実行確認 / 次 Phase | 全 phase に存在 | OK |
| Phase 1 追加要素 | true issue / 依存境界 / 価値とコスト / 4 条件 | 存在 | OK |
| Phase 2 追加要素 | Mermaid / env / dependency matrix / module 設計 | 存在 | OK |
| Phase 3 追加要素 | alternative 3 案以上 / PASS-MINOR-MAJOR | 存在 | OK |
| Phase 4 追加要素 | verify suite | 存在 | OK |
| Phase 5 追加要素 | runbook + placeholder + sanity check | 存在 | OK |
| Phase 6 追加要素 | failure cases | 存在 | OK |
| Phase 7 追加要素 | AC matrix | 7 AC × 軸 | OK |
| Phase 8 追加要素 | Before/After | 存在 | OK |
| Phase 9 追加要素 | free-tier + secret hygiene + a11y（CI gate のため a11y は N/A 明記） | 存在 | OK |
| Phase 10 追加要素 | GO/NO-GO | 存在 | OK |
| Phase 11 追加要素 | manual evidence（NON_VISUAL のため screenshot なし） | 存在 | OK |
| Phase 12 追加要素 | 5 必須タスク + 整合確認 | このファイル + 5 種 | OK |
| Phase 13 追加要素 | approval gate / local-check / change-summary / PR template | Phase 13 で対応 | TBD |
| visualEvidence | NON_VISUAL | index.md / artifacts.json / Phase 11 で一貫宣言 | OK |

### System Spec Update Step 1-A〜1-C 準拠

| Step | 必須項目 | 本タスクでの扱い |
| --- | --- | --- |
| Step 1-A | 完了タスク記録、関連ドキュメントリンク、変更履歴、LOGS.md×2、topic-map.md | `system-spec-update-summary.md` に implementation_completed_pr_pending 記録、LOGS.md / topic-map.md の本実装AC、関連リンクを明記 |
| Step 1-B | 実装状況テーブル更新 | `verify-indexes-up-to-date` を実装済みとして記録し、Phase 13 はユーザー承認待ちとして分離 |
| Step 1-C | 関連タスク / 未タスク候補テーブル更新 | unassigned-task-detection に本実装と将来候補を分離して記録 |
| Step 2 | 新規インターフェース追加時のみ | 新規 TypeScript interface / API は追加しないため N/A。workflow contract は implementation-guide Part 2 に記録 |

---

## Part 1 / Part 2 要件チェックリスト

### Part 1: 初学者・中学生レベル

- [ ] なぜ CI gate が必要かを日常生活の例え話（テストの答え合わせ表 / 自動採点）で説明する
- [ ] 専門用語を使う場合は「専門用語セルフチェック」表で必ず言い換える
- [ ] 何を作るかより先に「困りごと」「解決後の状態」を書く

### Part 2: 開発者・技術者レベル

- [ ] workflow YAML の全体構成・各 step の責務を記述
- [ ] git diff exit code 仕様 / actions/setup-node@v4 / cache 戦略 / 監視対象パスを明記
- [ ] 失敗時のローカル復旧コマンド（`mise exec -- pnpm indexes:rebuild`）を記載
- [ ] やってはいけないこと（post-merge 復活禁止 / monorepo 全体 diff 禁止）を明記

---

## 実行タスク

1. `outputs/phase-12/implementation-guide.md` を 2 パート構成で作成（Part 1 中学生レベル + Part 2 技術詳細）
2. `outputs/phase-12/system-spec-update-summary.md` に references 更新ACと CLAUDE.md 更新ACを記載
3. `outputs/phase-12/documentation-changelog.md` を作成
4. `outputs/phase-12/unassigned-task-detection.md` を 0 件でも作成（検出フロー実行記録を必ず含める）
5. `outputs/phase-12/skill-feedback-report.md` を作成（改善点なしでも明示記録）
6. `outputs/phase-12/phase12-task-spec-compliance-check.md` の整合確認表を埋める
7. `outputs/phase-12/main.md` に総括（6 成果物の所在と Phase 13 への引き継ぎ事項）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/02-application-implementation/_templates/phase-template-app.md | 整合確認 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 仕様（5 必須タスク） |
| 必須 | Phase 1〜11 outputs | 内容引用 |
| 必須 | CLAUDE.md「Git hook の方針」節 | 追記対象の現状把握 |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-devops-core.md | 更新ACの現状把握 |
| 参考 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | indexes 生成本体 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | implementation-guide が PR description の base になる |
| 本実装（feat/wt-5） | system-spec-update-summary のACを実適用 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 引き継ぎ完成度 | — | implementation-guide だけで CI gate を実装・運用できる |
| docs + CI | — | 本タスク自体は app コード / D1 に触れない |
| compliance | — | template との整合 OK |
| skill 規定遵守 | — | 5 必須タスク + 整合確認 = 6 種成果物が揃う / 0 件でも出力 / 改善なしでも記録 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md (Part 1+2) | 12 | completed | 中学生 + 技術詳細 |
| 2 | system-spec-update-summary.md | 12 | completed | references + CLAUDE.md |
| 3 | documentation-changelog.md | 12 | completed | エントリ追加 |
| 4 | unassigned-task-detection.md | 12 | completed | 0 件でも出力 |
| 5 | skill-feedback-report.md | 12 | completed | 改善なしでも記録 |
| 6 | phase12-task-spec-compliance-check.md | 12 | completed | 整合確認表 |
| 7 | main.md 総括 | 12 | completed | 引き継ぎ事項 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | 12 phase 総括 |
| ドキュメント | outputs/phase-12/implementation-guide.md | 2 パート構成（中学生 + 技術） |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | references + CLAUDE.md 更新AC |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 履歴エントリ |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 0 件でも出力 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 3 提案 + 「なし」でも記録 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 整合表 |

## 完了条件

- [ ] 6 種成果物全て作成（unassigned 0 件 / skill 提案なし でも出力）
- [ ] implementation-guide が Part 1 / Part 2 の 2 パート構成で、専門用語セルフチェックを含む
- [ ] system-spec-update-summary に references 更新ACと CLAUDE.md 更新ACの **両方** が含まれる
- [ ] compliance check が全 OK（Phase 13 のみ TBD）

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が completed
- [ ] outputs/phase-12/* 7 種が配置済み（main.md + 6 成果物）
- [ ] artifacts.json の Phase 12 を completed に更新

## 次 Phase

- 次: Phase 13 (PR 作成、user 承認必須)
- 引き継ぎ事項: implementation-guide.md（PR description の base）+ system-spec-update-summary.md（PR で実適用する追記の根拠）
- ブロック条件: compliance check に NG / 5 必須タスク欠落があれば該当 Phase に戻る
