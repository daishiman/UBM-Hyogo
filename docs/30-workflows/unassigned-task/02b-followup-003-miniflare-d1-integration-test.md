# miniflare 経由の本物 D1 統合テスト - タスク指示書

## メタ情報

```yaml
issue_number: 105
```


## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | 02b-followup-003-miniflare-d1-integration-test                                |
| タスク名     | miniflare 経由の本物 D1 統合テスト                                            |
| 分類         | テスト                                                                        |
| 対象機能     | repository 層の contract test                                                 |
| 優先度       | 中                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | 02b Phase 12                                                                  |
| 発見日       | 2026-04-27                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02b（meeting-tag-queue and schema-diff-repository）では repository 層の unit test を `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` の in-memory fake で全網羅した。fake は高速で deterministic だが、SQLite/D1 固有のふるまい（FOREIGN KEY 制約、UNIQUE / PK 制約、WAL モード、トランザクションロック、並行性）まではエミュレートしていない。

### 1.2 問題点・課題

- fake D1 では FOREIGN KEY 違反時の D1 エラー型・メッセージが本物と一致する保証がない
- `member_attendance` の複合 PK 重複時の INSERT 失敗を fake で再現するため PK インデックスを真似た拡張を入れたが、本物 D1 の挙動と乖離している可能性がある
- `tag_assignment_queue` / `schema_diff_queue` の resolve トランザクションが本物 D1 で原子的に動くかが未検証
- 並行 transaction の lock 振る舞いを fake では検証できない

### 1.3 放置した場合の影響

- 本番デプロイ後に CHECK / FK / UNIQUE 制約違反時のエラーハンドリングがズレ、API レイヤーから 500 エラーが漏れる
- 不変条件 #15（重複登録不可、削除済み除外）が本物 D1 上で守られない可能性がある
- repository 契約と D1 実体のドリフトを CI で検知できない

---

## 2. 何を達成するか（What）

### 2.1 目的

repository 層の「fake で振る舞い、miniflare で契約」二層テスト戦略の正本を 08a で確立し、02b で書いた fake D1 unit test と矛盾しない本物 D1 contract test を整備する。

### 2.2 最終ゴール

- `apps/api/test/integration/repository/` 配下に miniflare + 実 D1 binding を使った contract test が存在する
- `member_attendance` の複合 PK 重複 INSERT が本物 D1 で阻止されることが test で実証されている
- `tag_assignment_queue` の状態遷移（pending → resolved / rejected）が本物 D1 で検証される
- `schema_diff_queue` の resolve トランザクションが原子性を保つことが検証される
- 削除済み member_id への FK 違反 INSERT の D1 ふるまいが記録されている
- 並行 transaction の lock 振る舞いの最小スモーク test が存在する

### 2.3 スコープ

#### 含むもの

- `apps/api/test/integration/repository/` の構築（miniflare + 実 D1 binding）
- `member_attendance` PK 制約による INSERT 失敗の実証 test
- `tag_assignment_queue` の状態遷移を本物 D1 で検証
- `schema_diff_queue` の resolve トランザクション検証
- FOREIGN KEY 違反（削除済み member_id への INSERT）の D1 ふるまい確認
- 並行 transaction の lock 振る舞いの最小スモーク

#### 含まないもの

- API 層（Hono ルート）の E2E（07c で扱う）
- 認証層の契約 test（08a 本体で扱う）
- 02b の unit test のリプレース（fake D1 は速度のため残す）

### 2.4 成果物

- `apps/api/test/integration/repository/*.contract.test.ts`
- miniflare + D1 binding 用の test setup（`apps/api/test/integration/_setup/`）
- 二層テスト戦略の runbook 追記（08a Phase 4 test-strategy）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 02b の repository 実装と fake D1 unit test が green
- 08a の API contract test 基盤が決定している
- miniflare 3.x + Wrangler test util が pnpm workspace で動作する

### 3.2 依存タスク

- 08a (api-contract-repository-and-authorization-tests) — 本タスクは 08a 内に取り込む形が望ましい

### 3.3 必要な知識

- miniflare 3 の D1 emulation
- Cloudflare D1（SQLite）の制約・トランザクションモデル
- Vitest の workspace / project 機能（unit と integration の分離）
- `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` の振る舞い

### 3.4 推奨アプローチ

unit test（fake D1、ms 単位）と integration test（miniflare、秒単位）を Vitest project で分離する。CI では両方走らせ、ローカルでは default で unit のみ実行。integration は明示フラグで起動。

---

## 4. 実行手順

### Phase構成

1. miniflare + D1 setup の構築
2. PK / UNIQUE 制約 contract test
3. FOREIGN KEY 制約 contract test
4. transaction / 並行性スモーク test

### Phase 1: miniflare + D1 setup の構築

#### 目的

`apps/api/test/integration/repository/` で miniflare 経由の本物 D1 binding を起動できる setup を作る。

#### 手順

1. Vitest project を `unit` / `integration` に分割
2. `apps/api/test/integration/_setup/d1.ts` で miniflare D1 を立ち上げ migration を流す
3. test ごとに DB を初期化する fixture を用意

#### 成果物

integration test 起動 setup と sample green test 1 件

#### 完了条件

`pnpm test:integration` で miniflare D1 が起動し、最低 1 件の test が緑

### Phase 2: PK / UNIQUE 制約 contract test

#### 目的

`member_attendance` 複合 PK と queue テーブルの UNIQUE 制約が本物 D1 で阻止されることを検証する。

#### 手順

1. `member_attendance` に同一 (meeting_id, member_id) を二度 INSERT し失敗を確認
2. fake D1 が返すエラー型と本物 D1 のエラー型を比較し差分を記録
3. repository が両方で同一例外型を投げるよう正規化

#### 成果物

PK 重複 contract test と差分メモ

#### 完了条件

fake / 本物 D1 で repository の throw する例外型が一致

### Phase 3: FOREIGN KEY 制約 contract test

#### 目的

削除済み member_id への INSERT で FK 違反が本物 D1 上で発生することを検証する。

#### 手順

1. member を soft delete もしくは hard delete した状態で `tag_assignment_queue` に INSERT
2. D1 の返す FK エラーをキャプチャ
3. repository 層のエラー変換が不変条件 #15 と一致するか確認

#### 成果物

FK 違反 contract test

#### 完了条件

不変条件 #15（削除済み除外）が本物 D1 で実証される

### Phase 4: transaction / 並行性スモーク test

#### 目的

`schema_diff_queue` resolve の原子性と並行 transaction の lock 振る舞いを最小確認する。

#### 手順

1. resolve transaction の途中で意図的に throw し rollback されることを確認
2. 同一行に対する並行 update を 2 本走らせ lock の挙動を観察
3. 観察結果を runbook 化（fake D1 では再現不可な事項リスト）

#### 成果物

transaction / lock スモーク test と runbook

#### 完了条件

resolve の原子性が確認され、fake D1 で再現不可な事項が文書化されている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `apps/api/test/integration/repository/` で miniflare D1 contract test が緑
- [ ] PK / UNIQUE / FK / transaction / 並行性 の 5 観点が網羅されている
- [ ] 02b の AC-2 / AC-3 / AC-7 が本物 D1 で再検証されている
- [ ] fake D1 と本物 D1 で repository が投げる例外型が一致

### 品質要件

- [ ] CI で unit / integration が分離され両方走る
- [ ] integration test の所要時間が CI 全体の 30% 以下
- [ ] `audit-unassigned-tasks.js` の currentViolations = 0

### ドキュメント要件

- [ ] 08a Phase 4 test-strategy に「fake で振る舞い、miniflare で契約」の二層方針が明記
- [ ] fake D1 で再現不可な事項リストが runbook 化

---

## 6. 検証方法

### テストケース

- `member_attendance` 複合 PK 重複 INSERT が D1 で阻止される
- 削除済み member_id への queue INSERT が FK 違反になる
- `schema_diff_queue` resolve の途中失敗で全体 rollback
- 並行 update 時の lock 振る舞いの観察

### 検証手順

```bash
pnpm --filter @ubm/api test:integration
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/02b-followup-003-miniflare-d1-integration-test.md
```

---

## 7. リスクと対策

| リスク                                                  | 影響度 | 発生確率 | 対策                                              |
| ------------------------------------------------------- | ------ | -------- | ------------------------------------------------- |
| miniflare D1 と本番 D1 のふるまいが乖離している         | 中     | 中       | 既知差分を runbook 化し、staging で最終検証する   |
| integration test が CI を遅延させる                     | 中     | 中       | Vitest project で unit と分離、並列実行に最適化   |
| 08a と本タスクの重複                                    | 高     | 中       | 本タスクを 08a Phase 4 配下に取り込み単一化する   |
| fake D1 拡張と本物 D1 のドリフトが再発                  | 中     | 中       | repository 例外型の正規化テストを必須化           |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository/outputs/phase-04/verify-suite.md`
- `docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository/outputs/phase-12/implementation-guide.md` (Section 08a)
- `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`
- 不変条件 #15（重複登録不可、削除済み除外）
- 02b AC-2 / AC-3 / AC-7

### 参考資料

- miniflare 3 D1 公式ドキュメント
- Cloudflare D1 SQLite 制約モデル
- Vitest workspace / project ドキュメント

---

## 9. 備考

### 苦戦箇所【記入必須】

> 02b 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 02b では fake D1 (in-memory Map ベース) で全 unit test 緑だが、CHECK / FOREIGN KEY / UNIQUE 制約が D1 上で同じふるまいをするか fake では証明できなかった                       |
| 原因     | miniflare D1 は worker context が必要で、vitest の通常 unit run では使えない。Wrangler test util との接続方針を 02b 単独で決めると 08a との重複が発生する                     |
| 対応     | 02b では PRIMARY KEY 重複阻止の確認のみ fakeD1 を「PK インデックスを真似る」拡張で再現し、FK / WAL / lock は 08a に切り出した                                                  |
| 再発防止 | repository テストは「fake で振る舞い、miniflare で契約」の二層を 08a で正本化する。Phase 4 の test-strategy が「fakeD1 のみで AC 全網羅」と書きそうな場合に必ず PR レビューでブロックする |

### レビュー指摘の原文（該当する場合）

```
02b Phase 12 unassigned-task-detection.md U-03 として formalize
```

### 補足事項

本タスクは 08a (api-contract-repository-and-authorization-tests) の Phase 4 配下に取り込む形が望ましい。単独タスク化する場合は 08a と scope が重複しないよう調整すること。02b の fake D1 unit test は速度上の利点があるため残し、本タスクは追加レイヤーとして位置付ける。
