# tag_assignment_queue 管理 repository 実装 - タスク指示書

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | task-imp-02a-tag-assignment-queue-management-001                    |
| タスク名     | tag_assignment_queue 管理 repository 実装                            |
| 分類         | 改善                                                                |
| 対象機能     | タグ割り当てキュー（`tag_assignment_queue`）の CRUD・状態遷移・解決処理 |
| 優先度       | 中                                                                  |
| 見積もり規模 | 中規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | Phase 12（02a parallel-member-identity-status-and-response-repository） |
| 発見日       | 2026-04-27                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02a タスク `parallel-member-identity-status-and-response-repository` では、`apps/api/src/repository/memberTags.ts` を **read-only** として実装した。これは「`member_tags` への書込みは 07a の queue resolve 経路のみで行う」という不変条件を遵守するための設計判断である。

しかし、その前提となる `tag_assignment_queue` テーブル自体の管理 repository（CRUD、状態遷移 enum、idempotency 制御、resolve トランザクション）は、02a スコープ外として明示的に切り離されており、現時点でどの並列タスクにも owner が割り当てられていない。

源証跡:
- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/repository/memberTags.ts`（read-only 制約コメント）
- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/index.md`（スコープ境界の宣言）

### 1.2 問題点・課題

- `tag_assignment_queue` の enqueue/dequeue/resolve を担う repository が存在しない。
- Forms 回答からのタグ自動付与（rule-based / AI-based）と、admin による手動タグ付与の双方が、共通の queue を経由する設計になっているにもかかわらず、queue 書込み口がない。
- 03a（forms schema sync and stablekey alias queue）と 07a（tag assignment queue resolve workflow）のいずれが queue 自体の所有権を持つかが、現仕様書群では未確定である。
- 02a の memberTags.ts は read-only TS 型レベルで `INSERT/UPDATE/DELETE` を塞いでいるが、その前提となる「書込みは別 repository にのみ存在する」という事実が未充足のままになっている。

### 1.3 放置した場合の影響

- Forms 回答 → タグ自動付与のフローが結線できず、MVP の会員タグ表示・絞り込みが空配列のまま動作する。
- admin バックオフィスからの手動タグ付与 UI を実装しても、永続化先がないため即座に失われる。
- 07a の resolve workflow が前提とする「キュー上に未解決エントリが存在する」という入力契約が成立せず、07a 自体が着手できない。
- 02a で固めた read-only 不変条件が、後続タスクでの帳尻合わせ実装によって破られるリスクが残る。

---

## 2. 何を達成するか（What）

### 2.1 目的

`tag_assignment_queue` テーブルに対する CRUD と状態遷移を一元管理する repository を実装し、Forms 取込みと admin 手動操作の双方から利用できるタグ割り当てキューの基盤を提供する。

### 2.2 最終ゴール

- `apps/api/src/repository/tagAssignmentQueue.ts` が存在し、enqueue / list / markResolving / markResolved / markFailed / cancel の関数群が実装されている。
- 02a で確立した「`member_tags` への書込みは 07a resolve 経路のみ」という不変条件が、TS 型レベルでも実行時テストでも維持されている。
- 03a / 07a の双方から本 repository を import できる。

### 2.3 スコープ

#### 含むもの

- `tag_assignment_queue` テーブル（01a schema 内）に対する CRUD（enqueue, fetch by status, mark transition, cancel）。
- 状態遷移 enum: `pending` → `resolving` → `resolved` / `failed` / `canceled`。
- idempotency key（`(member_stable_key, tag_id, source)` の複合 unique）による重複 enqueue ガード。
- resolve トランザクション内で `tag_assignment_queue.status` と `member_tags` の整合更新を行うためのフック関数（実体の `member_tags` 書込みは 07a が呼び出す）。
- 単体テスト（D1 in-memory or Miniflare D1）と、`memberTags.ts` の read-only 性を破らないことを保証する型レベルテスト。

#### 含まないもの

- `member_tags` テーブルへの直接 write 実装（07a resolve workflow が所有）。
- Forms 回答からの enqueue 呼び出し元の実装（03a forms schema sync が所有）。
- admin UI 側の queue 投入 / cancel 操作の画面実装（admin 系タスクの担当）。
- queue の DLQ や retry スケジューラの実装（07a 側の workflow に内包される）。

### 2.4 成果物

- `apps/api/src/repository/tagAssignmentQueue.ts`
- `apps/api/src/repository/tagAssignmentQueue.test.ts`
- `apps/api/src/repository/__type-tests__/memberTags.readonly.test-d.ts`（型レベル禁止テスト）
- 03a / 07a の依存関係を反映した `docs/30-workflows/*/index.md` のクロスリンク更新

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 01a により `tag_assignment_queue` テーブル DDL が D1 マイグレーションに存在すること。
- 02a の `memberTags.ts` read-only 実装が main にマージされていること。
- 03a の stablekey alias queue 設計が確定し、`member_stable_key` の発行が安定していること。

### 3.2 依存タスク

- 上流: 01a serial-cicd-and-d1-schema-bootstrap（schema 提供）
- 上流: 02a parallel-member-identity-status-and-response-repository（read-only 不変条件の確立）
- 上流: 03a forms schema sync and stablekey alias queue（stable key 発行 / enqueue 呼び出し元）
- 下流: 07a tag assignment queue resolve workflow（resolve 経路の利用元）

### 3.3 必要な知識

- Cloudflare D1 と `apps/api` における prepared statement / transaction の扱い。
- TypeScript の `Readonly<T>` / branded type による write 禁止表現。
- Vitest + Miniflare D1 を用いた repository 統合テスト。
- 02a のスコープ境界ドキュメント（read-only 設計判断の経緯）。

### 3.4 推奨アプローチ

1. queue table の status を文字列リテラル union（`"pending" | "resolving" | "resolved" | "failed" | "canceled"`）として `apps/api/src/repository/types.ts` に定義する。
2. enqueue は `(member_stable_key, tag_id, source, payload_hash)` の複合 unique で重複弾きし、`INSERT ... ON CONFLICT DO NOTHING` で idempotent にする。
3. markResolving は `WHERE status = 'pending'` の条件付き UPDATE で、楽観ロック相当の並行制御を行う。
4. resolve 系 API はトランザクションを受け取り、内部で `member_tags` への write を呼び出すコールバック（07a が注入）を呼ぶ形で疎結合にする。
5. memberTags.ts の export 型に `Readonly` を付与し、`type-tests`（`expectError`）で `INSERT` 系関数が存在しないことを証明する。

---

## 4. 実行手順

### Phase構成

Phase A: 型定義と DDL 確認 → Phase B: repository 実装 → Phase C: テスト整備 → Phase D: 03a/07a への結線ドキュメント更新。

### Phase A: 型定義と DDL 確認

#### 目的

queue の状態遷移と idempotency 設計を型と schema の両面で確定させる。

#### 手順

1. `tag_assignment_queue` の最新 DDL を 01a の migration から確認する。
2. status enum と source enum（`rule` / `ai` / `manual`）を `apps/api/src/repository/types.ts` に追加する。
3. idempotency key の unique 制約が DDL に含まれているか確認し、欠けていれば 01a へフィードバックする。

#### 成果物

- `types.ts` 内の queue 関連型定義
- 01a への schema 修正フィードバック（必要時）

#### 完了条件

- TypeScript の型レベルで `Status` と `Source` が閉じた union として参照可能。

### Phase B: repository 実装

#### 目的

CRUD と状態遷移を担う関数群を実装する。

#### 手順

1. `tagAssignmentQueue.ts` に `enqueue` / `listPending` / `markResolving` / `markResolved` / `markFailed` / `cancel` を実装する。
2. resolve 系関数は `(db: D1Database, onApplyMemberTag: ApplyFn) => Promise<Result>` の形でコールバック注入にする。
3. 全ての書込みは prepared statement で実装し、SQL injection 経路を排除する。

#### 成果物

- `tagAssignmentQueue.ts`

#### 完了条件

- typecheck / lint がグリーン。
- 関数 signature が 03a / 07a の依存仕様書と整合している。

### Phase C: テスト整備

#### 目的

queue の不変条件と memberTags read-only 性を自動テストで担保する。

#### 手順

1. Miniflare D1 で in-memory に schema をロードする fixture を用意する。
2. enqueue 重複、status 遷移の合法/不正パス、cancel idempotency をユニットテスト化する。
3. `memberTags.readonly.test-d.ts` で `INSERT/UPDATE/DELETE` 系関数が type 上 export されていないことを `expectError` 系で検証する。

#### 成果物

- `tagAssignmentQueue.test.ts`
- `memberTags.readonly.test-d.ts`

#### 完了条件

- `pnpm test` および `pnpm typecheck` がグリーン。

### Phase D: 03a / 07a への結線ドキュメント更新

#### 目的

queue の所有権境界を仕様書上で明確化する。

#### 手順

1. 03a の index.md に「enqueue 呼び出し元」としての責務を追記する。
2. 07a の index.md に「resolve callback の注入元」としての責務を追記する。
3. 02a Phase 12 unassigned-task-detection.md にクロスリンクを張り、本タスクで解消されたことを記録する。

#### 成果物

- 各 workflow の index.md 更新差分

#### 完了条件

- 03a / 07a / 02a の三方向で参照が双方向リンクされている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `tagAssignmentQueue.ts` に enqueue / listPending / markResolving / markResolved / markFailed / cancel が実装されている
- [ ] idempotency key による重複 enqueue が SQL レベルで弾かれる
- [ ] status 遷移の不正パス（例: resolved → pending）が repository 層で reject される
- [ ] resolve 系関数が `member_tags` の write callback を外部から受け取る形になっている

### 品質要件

- [ ] 02a の `memberTags.ts` が read-only のまま維持されている
- [ ] 型レベルテストで `member_tags` write 系 API が存在しないことが証明されている
- [ ] queue repository のユニットテストがグリーン
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` 全てグリーン

### ドキュメント要件

- [ ] 03a / 07a の index.md に owner 関係が追記されている
- [ ] 02a Phase 12 の unassigned-task-detection.md に解消ログが追記されている
- [ ] 本ファイルのステータスが「未実施 → 実施中 → 完了」と更新されている

---

## 6. 検証方法

### テストケース

1. 同一 `(member_stable_key, tag_id, source)` で連続 enqueue を行い、件数が 1 件のままであること。
2. pending エントリに対し markResolving → markResolved の正常遷移が成功すること。
3. resolved エントリに対する markResolving が失敗（行更新 0）になること。
4. cancel を二度呼んでも副作用が発生しないこと。
5. memberTags.ts から `insertMemberTag` 等を import しようとすると TS コンパイルエラーになること。

### 検証手順

1. `mise exec -- pnpm --filter @ubm/api test tagAssignmentQueue` を実行。
2. `mise exec -- pnpm --filter @ubm/api typecheck` を実行し、型レベルテストの結果を確認。
3. 03a / 07a の index.md から本タスクの完了ログへリンクが解決できることを目視確認。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| queue 重複 enqueue により同一タグが多重付与される | 高 | 中 | DDL レベルの unique 制約 + `ON CONFLICT DO NOTHING` で二重防御 |
| resolve 失敗時に status が `resolving` のまま固着する | 中 | 中 | 07a の workflow 側で timeout-based fallback と DLQ を設計（本タスクは hook を提供のみ） |
| queue 所有権が 03a / 07a 間で曖昧になる | 中 | 高 | Phase D で双方の index.md に責務記述を追加し、本リポジトリを単一の窓口に固定 |
| 02a の read-only 不変条件が後続実装で破られる | 高 | 低 | 型レベルテスト（`expectError`）と CI 上での typecheck を必須化 |
| D1 の transaction セマンティクスが期待と異なる | 中 | 中 | Miniflare 上で実トランザクションシナリオを再現するテストを追加 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/index.md`
- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/repository/memberTags.ts`
- `doc/00-getting-started-manual/specs/08-free-database.md`（D1 構成）

### 参考資料

- 03a forms schema sync and stablekey alias queue 仕様書
- 07a tag assignment queue resolve workflow 仕様書
- 01a D1 schema migration 仕様書

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 02a で `memberTags.ts` を read-only に閉じた結果、タグ付与の write 経路が宙に浮いた。03a と 07a のどちらに queue 自体の所有権を置くかの判断が難航した |
| 原因 | 02a スコープ定義時に「`member_tags` write は 07a の resolve 経路のみ」という不変条件は明文化したが、queue 自体の管理層（CRUD / 状態遷移）はどのワークフローにも明示的に紐付けていなかった。結果として、Forms 取込み（03a 側）と resolve（07a 側）の中間にある責務がオーナー不在になった |
| 対応 | 本タスクとして queue 管理 repository を独立に切り出し、enqueue 呼び出し元（03a）と resolve callback 注入元（07a）の二方向から利用される共有層と位置付けた。`member_tags` write 禁止は TS の `Readonly` ＋ 型レベルテスト（`expectError`）で二重に塞ぎ、実装時の取り違えを CI で検出できるようにした |
| 再発防止 | スコープ境界を切る際、「禁止する操作」だけでなく「その操作を担う owner」も同時に未確定タスクとして起票する運用に改める。read-only repository と write repository を分離する設計判断を行う場合、必ず write 側の owner と queue 層の owner を同フェーズで決定する |

源証跡: `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md`, `apps/api/src/repository/memberTags.ts`

補足の論点:

- **02a の read-only 設計判断**: `memberTags.ts` を read-only に限定したのは、Forms 取込み・rule engine・AI 分類・admin 手動操作という複数の write 経路が単一テーブルに直接書込むと監査性（rule/AI/manual の出所追跡）が破綻するため。queue を中間層に置くことで「source enum を必ず通過する」という不変条件を構造的に強制した
- **TS 型レベルでの write 禁止**: `memberTags.ts` の export を `Readonly<MemberTag>` ベースに統一し、`InsertMemberTagInput` 等の型を export しない。テストでは `// @ts-expect-error` を用いて、外部から write 系シンボルを参照すると型エラーになることを実行可能ドキュメントとして残す
- **queue 所有権の境界**: 03a は「stable key と enqueue タイミング」を所有、07a は「resolve workflow と DLQ」を所有、本タスク（queue 管理 repository）は両者から呼ばれる純粋な CRUD 層。所有権の三分割を index.md レベルで明記することで、後続 review 時の齟齬を防ぐ

### レビュー指摘の原文（該当する場合）

```
02a Phase 12: memberTags.ts is intentionally read-only. Queue creation and resolution
for tag_assignment_queue still needs a dedicated owner.
- Queue create/update/resolve API is owned by a later task.
- member_tags writes remain outside 02a read repository.
- Auditability of rule/AI/manual tag source is preserved.
```

### 補足事項

- 推奨担当は 03a または 07a だが、queue を共有層として扱うため、必要であれば独立した小タスクとして扱っても良い。
- 本タスク完了をもって、02a の Phase 12 unassigned-task-detection.md における当該項目を `closed` に遷移させること。
