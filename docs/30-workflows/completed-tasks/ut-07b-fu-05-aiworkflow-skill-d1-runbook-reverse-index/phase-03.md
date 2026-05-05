# Phase 3: 設計レビューゲート

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト作成) |
| 状態 | completed |
| Gate | MAJOR 判定の場合は Phase 1 または 2 に戻る |

---

## 目的

Phase 2 で確定した 5 設計成果物（`resource-map.md` / `quick-reference.md` 追記文言案、
`topic-map.md` 自動再生成設計、CI gate `verify-indexes-up-to-date` 通過設計、
references / indexes 対応マトリクス）を以下 4 観点でレビューし、
GO / NO-GO（または条件付き GO）を仮判定する。

1. 既存 indexes との重複防止
2. UT-07B-FU-03 references 側 artifact inventory との整合
3. CI gate `verify-indexes-up-to-date` 通過の確度
4. skill 全体構造改修への波及防止（scope 守り）

---

## 実行タスク

1. 4 観点で Phase 2 の設計を採点する
2. alternative 案（少なくとも 3 案）を比較し、PASS / MINOR / MAJOR で判定する
3. ブロッカー一覧を作成する
4. GO / NO-GO 仮判定を出す（最終判定は Phase 10）

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 前 Phase | `phase-02.md` | 5 設計成果物 |
| 正本 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 既存表との重複判定 |
| 正本 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 既存セクションとの重複判定 |
| 正本 | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | references 側 artifact 一覧 |
| CI | `.github/workflows/verify-indexes.yml` | drift gate |

---

## 整合性チェック観点

### 観点 1: 既存 indexes との重複防止

- `resource-map.md` 既存表で `D1 / migration / runbook` を含む行を `rg "d1\b|migration|runbook" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` で抽出し、
  追記行と重複しないことを確認
- `quick-reference.md` に既存の Cloudflare 系 / D1 系セクションがある場合、
  追記行が同セクションに収まるか / 新セクションを追加すべきかを判定

### 観点 2: artifact inventory との整合

- `references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` に列挙されている
  artifact 群と、indexes 追記が指し示すパス群が一致することを確認
- 追記が言及するパスが references 側にも記載されている（drift がない）ことを確認
- references 側にしかない artifact / indexes 側にしかない artifact があれば差分表に列挙

### 観点 3: CI gate `verify-indexes-up-to-date` 通過確度

- `pnpm indexes:rebuild` 実行後の `git diff --exit-code` がゼロになる設計か
- `topic-map.md` の自動再生成範囲が手追記キーワードと整合しているか
- 二度目の rebuild が no-op になる idempotent 性が保たれているか

### 観点 4: skill 全体構造改修への波及防止

- 追記が `indexes/` 3 ファイルに閉じ、`references/` 本文に diff が出ないこと
- `keywords.json` / `quick-reference-search-patterns*.md` / `topic-map-skill-authoring.md` への変更を伴わないこと
- skill 構造責務を踏み越えていないこと

---

## Alternative 案

### 案 A: resource-map に 1 行 + quick-reference に専用セクション 1 つ（推奨）

- `resource-map.md` のクイックルックアップ表に UT-07B-FU-03 行を 1 行追加
- `quick-reference.md` に「UT-07B-FU-03 D1 production migration apply runbook」セクションを 1 つ追加（CLI ラッパー行を含む 3 行）
- `topic-map.md` は `pnpm indexes:rebuild` で再生成

| 観点 | 評価 | 判定 |
| --- | --- | --- |
| 既存重複防止 | 既存に同 task の行は無い | PASS |
| references 整合 | artifact inventory と 1:1 で対応 | PASS |
| CI gate 通過 | キーワード（D1 / migration / runbook）が topic 抽出に乗る | PASS |
| scope 守り | indexes 3 ファイルに閉じる | PASS |

**総合判定: PASS（推奨）**

---

### 案 B: resource-map に 2 行追加 + quick-reference には CLI ラッパー 1 行のみ

- `resource-map.md` を 2 行に分割（runbook 行 + CI gate / scripts 行）
- `quick-reference.md` は既存 Cloudflare 系セクションに `bash scripts/cf.sh d1:apply-prod` 1 行のみ追記

| 観点 | 評価 | 判定 |
| --- | --- | --- |
| 既存重複防止 | 既存 Cloudflare 系セクションと混ざる可能性 | MINOR |
| references 整合 | 1:1 対応は維持 | PASS |
| CI gate 通過 | 問題なし | PASS |
| scope 守り | OK | PASS |

**総合判定: MINOR（quick-reference の探索性が案 A より低い）**

---

### 案 C: skill 全体構造改修（keywords.json / topic-map-skill-authoring.md も更新）

- `keywords.json` に D1 migration runbook 用のキーワードを追加
- `topic-map-skill-authoring.md` に runbook 系の topic を追加
- `references/` も artifact inventory 以外を補強

| 観点 | 評価 | 判定 |
| --- | --- | --- |
| 既存重複防止 | 改修範囲拡大により drift リスク上昇 | MINOR |
| references 整合 | references 本文を触ると本タスク scope 違反 | MAJOR |
| CI gate 通過 | 問題なし | PASS |
| scope 守り | scope 大幅拡大（小タスクの粒度を逸脱）| MAJOR |

**総合判定: MAJOR（本タスク scope を超える、将来検討）**

---

### 案 D（補足）: indexes には何も書かず references の artifact inventory に依存させ続ける

- 現状維持。indexes からは UT-07B-FU-03 が逆引きできない。

| 観点 | 評価 | 判定 |
| --- | --- | --- |
| 既存重複防止 | drift なし | PASS |
| references 整合 | references 単独で完結 | PASS |
| CI gate 通過 | 何もしないので PASS | PASS |
| scope 守り | OK | PASS |
| **本タスクの目的達成** | **未達**（feedback#5 が wave 跨ぎで失効）| **MAJOR** |

**総合判定: MAJOR（タスクの存在意義を満たさない）**

---

## 採点サマリ

| 案 | 既存重複 | references 整合 | CI gate | scope 守り | 目的達成 | 総合 |
| --- | --- | --- | --- | --- | --- | --- |
| A: resource-map 1 行 + quick-reference 専用セクション | PASS | PASS | PASS | PASS | PASS | **採用候補** |
| B: resource-map 2 行 + quick-reference 1 行 | MINOR | PASS | PASS | PASS | PASS | 部分採用可 |
| C: skill 全体構造改修 | MINOR | MAJOR | PASS | MAJOR | PASS | 不採用 |
| D: 何もしない | PASS | PASS | PASS | PASS | MAJOR | 不採用 |

---

## レビュー観点ごとの結論

- **既存重複防止**: 案 A が最も安全。既存表 / 既存セクションのいずれとも語彙衝突しない。
- **references 整合**: 案 A / B が同等。indexes はリンクのみで artifact inventory 本文を重複展開しない。
- **CI gate 通過確度**: いずれの案も `pnpm indexes:rebuild` 実行を前提にすれば PASS。
- **scope 守り**: 案 C のみ NG。案 A / B / D は indexes に閉じている。

---

## ブロッカー一覧

| # | 内容 | 影響 Phase | 解消条件 |
| --- | --- | --- | --- |
| B-1 | UT-07B-FU-03 の references が main 未 merge の場合、indexes が指す先が壊れる | Phase 1 / 5 | Phase 1 で main merge 状態を確認、未 merge なら NO-GO |
| B-2 | `pnpm indexes:rebuild` script が `package.json` に未登録の場合、CI gate ローカル再現が困難 | Phase 5 | script 名を確認し、未登録なら `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 直叩きにフォールバック |
| B-3 | `topic-map.md` 再生成で予期せぬ広範差分が出る | Phase 5 | 追記文言の語彙を topic 抽出規則に合わせて調整 |
| B-4 | `quick-reference.md` の既存 Cloudflare 系セクション位置が不明確 | Phase 2 / 5 | Phase 5 冒頭で再 grep し位置を確定 |

---

## GO / NO-GO 仮判定

- **仮判定: 条件付き GO（案 A 採用）**
- 条件:
  - B-1 が Phase 1 で達成済みとマークされていること
  - B-2 の script 存在が Phase 5 冒頭で確認されること
  - B-3 / B-4 が Phase 5 で解消されること
- 最終判定: Phase 10

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案 A の AC をテスト戦略に展開（`rg` パターン / `git diff --exit-code` を test 化）|
| Phase 5 | Module 設計（Phase 2）と採用案 A を実装ランブックに反映 |
| Phase 10 | 本 Phase の仮判定 + ブロッカー解消状況で最終 GO / NO-GO 判定 |
| Phase 12 | 旧スタブ close-out と skill-feedback#5 resolved マーク |

---

## 多角的チェック観点

- 不変条件 #5: いずれの案も apps/web → D1 直接アクセスを生まない
- 不変条件 #6: GAS prototype を本番仕様に昇格させない（D1 runbook はそもそも独立）
- DRY: 案 A が SSOT（references の artifact inventory）を 1 つに保ち、indexes はリンクのみ
- YAGNI: 案 C は本タスク scope に対して過剰投資（不採用根拠）
- 後方互換: 既存 indexes の他エントリには手を入れない（drift inventory として記録）

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 案 A/B/C/D の比較表作成 | 3 | completed | 採用理由明記 |
| 2 | 4 観点レビュー | 3 | completed | 既存重複 / references 整合 / CI gate / scope |
| 3 | GO / NO-GO 判定 | 3 | completed | MAJOR は Phase 2 戻し |
| 4 | Phase 4 test 条件の確定 | 3 | completed | rg パターン + git diff |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-03/main.md` | alternative 4 案 + 採点表 + GO / NO-GO 仮判定 + ブロッカー一覧 |

---

## 完了条件

- [ ] alternative 案を 3 件以上列挙し、各案に PASS / MINOR / MAJOR 判定を付与
- [ ] 4 観点（既存重複 / references 整合 / CI gate / scope 守り）で全案を採点
- [ ] 採用案を 1 つに絞り、根拠を明記
- [ ] ブロッカー一覧と解消条件が記述されている
- [ ] GO / NO-GO 仮判定が出ている

---

## タスク 100% 実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-03/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- 仮判定が NO-GO の場合、Phase 1 または 2 への戻り経路を明記
- artifacts.json の phase 3 を completed に更新

---

## 次 Phase

- 次: 4 (テスト作成)
- 引き継ぎ事項: 採用案 A / ブロッカー B-1〜B-4 / 仮判定（条件付き GO）
- ブロック条件: 仮判定が NO-GO の場合は Phase 1 または 2 に戻る

---

## 真の論点

- references の artifact inventory が「正本」なのに対し、indexes 側で artifact 名（CI gate workflow ファイル名など）を直接書くと drift 起点になる。
  → 解: 「ファイルパス」だけを書き、「説明文」は references 側に閉じる。
- `quick-reference.md` に既存 Cloudflare 系セクションがある場合、UT-07B-FU-03 専用セクション新設は冗長か。
  → 解: 既存セクションがあれば 1 行追記、無ければ専用セクション新設。Phase 5 冒頭で確定。
- `topic-map.md` 再生成範囲が予測不能な場合、Phase 5 で追記文言を縮める判断が必要になる。
  → 解: Phase 5 で iterative に追記 → rebuild → diff 確認を回す。

---

## 依存境界

- 本タスクが触る: `indexes/resource-map.md` / `indexes/quick-reference.md` / `indexes/topic-map.md`（自動）
- 本タスクが触らない: `references/**` 本文 / `keywords.json` / `topic-map-skill-authoring.md` / D1 migration 実装 / `scripts/d1/*.sh` 本体 / `scripts/cf.sh` 本体 / `.github/workflows/d1-migration-verify.yml` 本体

---

## 価値とコスト

- 初回価値: feedback#5 を formalize し、D1 production migration runbook を skill index 経由で逆引き可能にする
- 初回で払わないコスト: skill 全体構造改修 / references 本文整備 / 他 workflow の reverse index
