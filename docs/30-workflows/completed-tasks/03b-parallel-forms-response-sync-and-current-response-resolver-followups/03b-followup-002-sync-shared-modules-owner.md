# sync 共通モジュール（_shared/ledger.ts / sync-error.ts）の owner 表確立 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| タスクID     | 03b-followup-002-sync-shared-modules-owner                                                          |
| タスク名     | sync 共通モジュール（_shared/ledger.ts / sync-error.ts）の owner 表確立                             |
| 分類         | ガバナンス整備                                                                                      |
| 対象機能     | 03a / 03b 並列 wave で共同保守する sync 共通モジュールの責任所在明確化                              |
| 優先度       | 中                                                                                                  |
| 見積もり規模 | 小規模                                                                                              |
| ステータス   | 未実施                                                                                              |
| 発見元       | 03b Phase 12 unassigned-task-detection #3                                                           |
| 発見日       | 2026-04-28                                                                                          |
| 引き取り候補 | 03a / 03b 共同保守、`docs/30-workflows/_design/` 配下に owner 表を追加する spec PR                  |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

03a（forms-list cursor sync）と 03b（forms-response sync / current-response resolver）は並列 wave として設計されており、両者ともに以下の sync 共通モジュールを参照する。

- `apps/api/src/jobs/_shared/ledger.ts` — `sync_jobs` テーブルへの `start()` / `succeed()` / `fail()` 書き込み、cursor 読み書き、lock 取得・解放
- `apps/api/src/jobs/_shared/sync-error.ts` — sync 系エラーコード / リトライ可否判定 / metrics_json への redact ロジック

しかし 03b 実装着手時、これらの **正本実装を 03a と 03b のどちらが担うか** が spec 段階で固定されておらず、並列開発で同一ファイルを同時編集してしまうリスクがあった。最終的には「03a 先行実装、03b は consumer に徹する」という運用判断で逃げたが、これは spec 上の合意ではなく実装側の暗黙了解にすぎない。

### 1.2 問題点・課題

- `docs/30-workflows/_design/` ディレクトリ自体がまだ存在しない（2026-04-28 時点で未作成）
- 各 task の index.md / dependency matrix には「owner」列がなく、共有モジュールの責任所在が記録されていない
- 後続の sync wave（例: 仮想的な 03c 以降や、`job_type` 追加タスク）が同じ曖昧さを再生産する
- skill-feedback-report 1.1 / 1.4 で指摘された通り、`sync_jobs` の `job_type` enum / `metrics_json` schema / lock TTL も同じ owner 不在問題を抱える

### 1.3 放置した場合の影響

- 03a と 03b が同じ `_shared/ledger.ts` を別の責務で書き換え、merge 衝突・semantic drift が発生する
- `metrics_json` の schema / `job_type` enum 値が wave ごとに微妙に違う形で増え、cron / observability 側で集計不能になる
- `_shared/sync-error.ts` の redact 漏れが片方のタスクで放置され、PII 流出経路が分岐する
- 後続タスクが「どちらの実装に従えばよいか」を実コード grep で判断する負債が固定化する

---

## 2. 何を達成するか（What）

### 2.1 目的

`_shared/ledger.ts` / `_shared/sync-error.ts` を含む sync 共通モジュール群について、**どのタスクが正本（owner）で、どのタスクが consumer（co-owner）か** を spec 文書に明文化し、並列 wave での実装競合を spec 段階で防ぐ。

### 2.2 最終ゴール

- `docs/30-workflows/_design/` ディレクトリが新規作成されている
- `_design/sync-shared-modules-owner.md`（または同等の owner 表）が存在し、対象モジュール × owner / co-owner / 変更ルールが表形式で記録されている
- 03a / 03b の index.md（または dependency matrix）から owner 表へのリンクが張られている
- 03a / 03b 以降に sync 系を生やす task が「owner に変更提案 PR を出す」フローで進められる

### 2.3 スコープ

#### 含むもの

- `docs/30-workflows/_design/` ディレクトリの新規作成
- `_design/sync-shared-modules-owner.md`（仮称）の新規作成
  - 対象ファイル一覧（`apps/api/src/jobs/_shared/ledger.ts` / `sync-error.ts` 等）
  - owner / co-owner の task ID
  - 変更時のレビュー必須者・PR 起票ルール
  - 後続 wave が consumer として参加する手順
- 03a / 03b の index.md / dependency matrix からのリンク追記
- 関連する未割当タスク #7（`sync_jobs` job_type enum / metrics_json schema 集約）との関係性の記載

#### 含まないもの

- `_shared/ledger.ts` / `_shared/sync-error.ts` 自体の実装変更
- `sync_jobs` テーブルの DDL 変更（01a 責務）
- `job_type` enum 値の追加・削除（個別 sync task の責務）
- task-specification-creator skill 本体の dependency matrix テンプレ改修（skill-feedback-report 1.1 の本格対応は別タスク）

### 2.4 成果物

- `docs/30-workflows/_design/sync-shared-modules-owner.md`
- 03a / 03b の index.md 差分（owner 表へのリンク追記）
- 必要に応じて `docs/30-workflows/_design/README.md`（`_design/` ディレクトリの趣旨）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 03a / 03b の Phase 12 outputs を読める
- `apps/api/src/jobs/_shared/` 配下の現状ファイル一覧を把握している
- skill-feedback-report 1.1 / 1.4 の提案内容を理解している

### 3.2 依存タスク

- 03a Phase 12 完了（owner 候補としての確定材料が揃っている）
- 03b Phase 12 完了済み（本タスクの発見元）

### 3.3 必要な知識

- 並列 wave のブランチ戦略（feature/* → dev → main）
- `_shared/` モジュールの責務境界（ledger / sync-error / db）
- 不変条件 #5（D1 アクセスは apps/api に閉じる）

### 3.4 推奨アプローチ

owner 表は以下の最低限の列を持つ表形式で記述する。

| ファイル | owner task | co-owner task | 変更時の必須レビュアー | 備考 |
|----------|-----------|--------------|--------------------|------|
| `apps/api/src/jobs/_shared/ledger.ts` | 03a | 03b | 03a / 03b 双方 | sync_jobs ledger 正本 |
| `apps/api/src/jobs/_shared/sync-error.ts` | 03a | 03b | 03a / 03b 双方 | error code / redact 正本 |

owner / co-owner の確定は **既存実装の歴史的経緯（03a 先行実装）に従う** ことを基本とし、03b は consumer 兼 co-owner として記録する。

---

## 4. 実行手順

### Phase 構成

1. 既存 `_shared/` モジュールの棚卸し
2. owner 表 spec のドラフト作成
3. 03a / 03b の index.md からのリンク追加
4. 関連未割当タスク #7 との関係性整理

### Phase 1: 既存 `_shared/` モジュールの棚卸し

#### 目的

owner 表に載せるべき対象ファイル一覧を確定する。

#### 手順

1. `apps/api/src/jobs/_shared/` 配下のファイルを列挙
2. 03a / 03b それぞれの実装側で参照されている箇所を grep
3. 「正本実装をコミットしたタスク」「consumer として import しているだけのタスク」を分類

#### 成果物

owner 候補対象ファイル一覧と参照グラフ

#### 完了条件

`_shared/` 全ファイルが owner / co-owner 候補にマッピングされている

### Phase 2: owner 表 spec のドラフト作成

#### 目的

`docs/30-workflows/_design/sync-shared-modules-owner.md` を新規作成する。

#### 手順

1. `docs/30-workflows/_design/` ディレクトリを新規作成（必要なら `README.md` も追加）
2. owner 表（3.4 推奨アプローチの形式）を記述
3. 変更ルール（PR 起票、必須レビュアー、co-owner への通知義務）を明記
4. skill-feedback-report 1.4（`sync_jobs` spec 集約）への将来拡張点を追記

#### 成果物

`_design/sync-shared-modules-owner.md`

#### 完了条件

03a / 03b 双方が「自分が owner / co-owner どちらか」を表から一意に読み取れる

### Phase 3: 03a / 03b の index.md からのリンク追加

#### 目的

各タスクの index.md / dependency matrix から owner 表を参照可能にする。

#### 手順

1. 03a の index.md の依存節（または冒頭の参照節）に owner 表へのリンクを追加
2. 03b の index.md にも同じリンクを追加
3. 必要なら dependency matrix に「owner 表参照」の行を追加

#### 成果物

03a / 03b index.md 差分

#### 完了条件

両 index.md から owner 表に 1 ホップで到達できる

### Phase 4: 関連未割当タスク #7 との関係性整理

#### 目的

未割当タスク #7（`sync_jobs` `job_type` enum / `metrics_json` schema 集約）との重複を避け、本タスクが foundation を提供する形に整理する。

#### 手順

1. 未割当 #7 用の follow-up タスク仕様書（別途作成予定）から本 owner 表を参照する旨を備考化
2. 「owner 表 → schema 集約 spec」の順で進める依存関係を `_design/README.md` に記載

#### 成果物

`_design/README.md`（必要なら）と未割当 #7 への参照メモ

#### 完了条件

owner 表と schema 集約 spec の責務境界が文書上で衝突しない

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `docs/30-workflows/_design/sync-shared-modules-owner.md` が存在する
- [ ] owner 表に `_shared/ledger.ts` / `_shared/sync-error.ts` が含まれる
- [ ] owner / co-owner / 必須レビュアー / 変更ルールが記載されている
- [ ] 03a / 03b の index.md から owner 表へのリンクがある

### 品質要件

- [ ] markdown lint（既存ルールがあれば）成功
- [ ] 既存 spec / 未割当タスク表との表記揺れがない（`_shared/ledger.ts` のパス表記等）

### ドキュメント要件

- [ ] `_design/` ディレクトリの趣旨が `_design/README.md` または owner 表冒頭に記述されている
- [ ] 未割当タスク #7（`sync_jobs` schema 集約）との関係性が記載されている

---

## 6. 検証方法

### 検証手順

```bash
# owner 表の存在確認
test -f docs/30-workflows/_design/sync-shared-modules-owner.md

# 03a / 03b index.md からの参照確認
rg -n "sync-shared-modules-owner" docs/30-workflows/03a-*/index.md docs/30-workflows/03b-*/index.md

# 対象ファイルが実在し owner 表と整合
ls apps/api/src/jobs/_shared/ledger.ts apps/api/src/jobs/_shared/sync-error.ts
```

### レビュー観点

- 03a / 03b の co-owner / owner 割当に歴史的経緯との矛盾がないか
- 後続 sync wave が consumer として参加する手順が読み取れるか
- 未割当タスク #7 とのスコープ重複がないか

---

## 7. リスクと対策

| リスク                                                                 | 影響度 | 発生確率 | 対策                                                                                               |
| ---------------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------------------------------------- |
| owner 表が実装の実態と乖離し、絵に描いた餅になる                       | 中     | 中       | 対象ファイルを grep ベースで列挙し、git blame で歴史的実装者を確認した上で owner 確定               |
| `_design/` ディレクトリが他の用途（例: ER 図）と混在し責務が曖昧化     | 低     | 中       | `_design/README.md` で「並列 wave 共通モジュールの owner 表専用」の趣旨を明示                       |
| 後続 sync wave が owner 表を更新せずに `_shared/` を増やす             | 中     | 中       | task-specification-creator skill 改修（別タスク）で index.md テンプレに owner 列を強制             |
| 未割当タスク #7 と責務が重複し、二重管理になる                         | 中     | 低       | 本タスクは「ファイル単位の owner」、#7 は「schema / enum の正本」に分離する境界を `_design/` で明示 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/unassigned-task-detection.md` #3
- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/skill-feedback-report.md` 1.1 / 1.4 節
- 03a Phase 12 outputs（owner 候補確定の根拠）
- `apps/api/src/jobs/_shared/ledger.ts`
- `apps/api/src/jobs/_shared/sync-error.ts`

### 参考資料

- 不変条件 #5（D1 アクセスは apps/api に閉じる）
- ブランチ戦略（feature/* → dev → main、solo 運用ポリシー）

---

## 9. 備考

### 苦戦箇所【記入必須】

> 03b 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 03b 実装時に 03a と並列で同じ `_shared/ledger.ts` / `_shared/sync-error.ts` を扱う必要があり、どちらが正本実装をするか曖昧で実装競合のリスクがあった                                |
| 原因     | 並列 wave の dependency matrix に「owner」列がなく、共有モジュールの責任所在が spec 段階で固定されていない。`docs/30-workflows/_design/` 配下に owner 表が存在しない                |
| 対応     | 03a 先行実装、03b は consumer に徹する形で運用判断で逃げた。spec 上の合意ではなく実装側の暗黙了解にすぎない                                                                          |
| 再発防止 | `_design/sync-shared-modules-owner.md` で owner / co-owner を明文化し、index.md から参照させる。さらに task-specification-creator skill の dependency matrix テンプレに owner 列追加を skill-feedback-report 1.1 として提案済 |

### レビュー指摘の原文（該当する場合）

```
03b Phase 12 unassigned-task-detection.md #3:
sync 共通モジュール（_shared/ledger.ts / _shared/sync-error.ts）の owner
引き取り候補: 03a と本 03b の共同保守
状態: 確認要
備考: owner が誰かを明示する必要。_design/ 配下に owner 表を追加すべき
```

```
skill-feedback-report.md 1.1:
並列タスク（03a / 03b）が _shared/ledger.ts / _shared/sync-error.ts を共同保守する
設計だが、index.md の dependency matrix に「owner」列がない。
提案: dependency matrix に owner / co-owner 列を追加し、
共有モジュールの責任所在を spec 段階で固定する。
```

### 補足事項

本タスクは spec 整備のみで実装変更は伴わない。skill-feedback-report 1.4（`sync_jobs` spec 集約 = 未割当 #7）との重複を避けるため、本タスクは「ファイル単位の owner 表」、#7 は「schema / enum 値の正本」に責務を分離する。`_design/` 配下が今後 sync 以外の並列 wave 共通モジュール（例: auth / public-directory 共通）にも拡張される可能性を見込み、`_design/README.md` の枠組みを軽量に確保しておく。
