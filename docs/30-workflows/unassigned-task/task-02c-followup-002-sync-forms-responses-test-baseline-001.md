# sync-forms-responses test baseline 修復 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| タスクID     | task-02c-followup-002-sync-forms-responses-test-baseline-001                                      |
| タスク名     | `apps/api/src/jobs/sync-forms-responses.test.ts` の pre-existing 4 件 fail を解消し test baseline を健全化 |
| 分類         | 改善 / test baseline repair                                                                       |
| 対象機能     | `apps/api` response sync job（write-cap / cursor / status 期待値）と vitest test suite             |
| 優先度       | 中                                                                                                |
| 見積もり規模 | 小規模                                                                                            |
| ステータス   | unassigned                                                                                        |
| 発見元       | 02c-followup-002 Phase 9 main.md（pre-existing failure 切り出し）                                  |
| 発見日       | 2026-05-01                                                                                        |
| taskType     | implementation                                                                                    |
| visualEvidence | NON_VISUAL                                                                                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02c-followup-002（`__fixtures__` / `__tests__` の prod build 除外設定 foundation）の Phase 9 品質保証で `mise exec -- pnpm --filter @ubm-hyogo/api test` を実行したところ、`Test Files 1 failed | 82 passed (83), Tests 4 failed | 506 passed (510)` という結果になった。失敗はすべて `apps/api/src/jobs/sync-forms-responses.test.ts`（response sync の write-cap / cursor / status 期待値）に集中している。

02c-followup-002 の差分（`apps/api/tsconfig.build.json` 新設 / `apps/api/package.json` build script 変更 / `.dependency-cruiser.cjs` boundary rule 追加 / 02c implementation-guide.md 補強）には runtime コード・test 設定の変更が一切含まれず、Phase 9 main.md の表で **pre-existing failure** と判定済み。したがって 02c-followup-002 の AC-2「`pnpm test` が引き続き通る」は FULL PASS にできず、本タスクで test baseline 健全化を担う。

### 1.2 問題点・課題

- `apps/api/src/jobs/sync-forms-responses.test.ts > AC-9` が cursor / status 期待値で fail
- 同 ファイル内 `AC-10 writeCap` が per-sync write 上限到達時の `status: 'failed'` / `'succeeded'` 期待値で fail
- 残り 2 件は同 test ファイル内の関連 case
- `apps/api` の test 全体が常時 RED 状態となり、後続タスク（02c-followup-002 含む）が test 緑化を AC として宣言できない

### 1.3 放置した場合の影響

- 02c-followup-002 を含むすべての後続 follow-up が「pre-existing failure を継承するため AC-2 が PASS にならない」状態を引き継ぎ続け、CI gate / 品質報告のシグナルが鈍る
- response sync job の writeCap / cursor / status 仕様が「実装と test のどちらが正か」が判定されないまま放置されると、本番 cron 実行（response sync）でのバグの早期検知ができなくなる
- `apps/api` の `pnpm test` を緑にしないと、test baseline を前提とする他タスク（D1 boundary / sync job 拡張）の AC で常に「既知の例外」運用が必要になり仕様書ノイズが増える

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/api/src/jobs/sync-forms-responses.test.ts` の 4 件 fail を実装側 / test 側いずれかの修正で解消し、`mise exec -- pnpm --filter @ubm-hyogo/api test` が full PASS となる test baseline を回復する。

### 2.2 最終ゴール

- `mise exec -- pnpm --filter @ubm-hyogo/api test` が `Tests <N> passed (<N>)` で exit 0
- response sync job の writeCap / cursor / status 仕様が runtime と test で一致し、どちらが正かをコード履歴上明確化
- 02c-followup-002 以外の AC-2 系（`pnpm test` PASS 系）も連鎖的に PASS へ復帰可能な状態

### 2.3 スコープ

#### 含むもの

- `apps/api/src/jobs/sync-forms-responses.test.ts` の 4 件 fail の再現と根本原因切り分け
- `apps/api/src/jobs/sync-forms-responses.ts`（または相当する runtime 実装）と test 期待値の整合化（writeCap / cursor / status `failed` / `succeeded`）
- 修正に伴う最小限の周辺整合（同 job が import する shared util / repository 契約のみ）
- Phase 9 main.md の failure 表に対応する evidence ログ（test 出力）の owning workflow への記録

#### 含まないもの

- 02c-followup-002 の build exclusion 差分の reversal（`tsconfig.build.json` / `package.json` build script / `.dependency-cruiser.cjs` rule）
- `__fixtures__` / `__tests__` boundary rule の変更
- response sync job の機能拡張（新規フィールド / 新規エンドポイント連携）
- 02a / 02b の test refactor（fixture 共有契約は 02c 正本のまま）
- commit / push / PR 作成（ユーザ承認前は禁止）

### 2.4 成果物

- `apps/api/src/jobs/sync-forms-responses.ts` または `sync-forms-responses.test.ts` の修正差分
- `mise exec -- pnpm --filter @ubm-hyogo/api test` の full PASS ログ
- 苦戦箇所節の更新（writeCap / cursor / status の判断結果記録）
- owning workflow（02c-followup-002 Phase 9 もしくは新設 follow-up workflow）への evidence ログ追記

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `apps/api` の vitest 実行環境が動く（02c-followup-002 完了済みでも fixture loader は緑）
- response sync job の現行仕様（writeCap / cursor / `succeeded` / `failed` の意味論）を `apps/api/src/jobs/sync-forms-responses.ts` で確認できる
- Phase 9 main.md の failure 表（AC-9 / AC-10 writeCap / 関連 2 件）を参照できる

### 3.2 実行手順

1. `mise exec -- pnpm --filter @ubm-hyogo/api test -- src/jobs/sync-forms-responses.test.ts` で 4 件 fail を再現
2. 各 fail の assertion メッセージから「実装が誤か / test が古か」を判定
3. AC-9（cursor / status 期待値ずれ）の根本原因を `sync-forms-responses.ts` の cursor 進行ロジックから特定
4. AC-10 writeCap（per-sync 上限到達時の status `failed` / `succeeded`）の正解側を仕様（`docs/00-getting-started-manual/specs/`）と照合して確定
5. 実装または test を修正（仕様正本に従って一方向に整合）
6. 修正後 `mise exec -- pnpm --filter @ubm-hyogo/api test` を全体実行し full PASS を確認
7. owning workflow の evidence ログに修正内容と test 結果を追記

### 3.3 受入条件 (AC)

- AC-1: `mise exec -- pnpm --filter @ubm-hyogo/api test -- src/jobs/sync-forms-responses.test.ts` が exit 0
- AC-2: `mise exec -- pnpm --filter @ubm-hyogo/api test` 全体が exit 0（`Test Files 0 failed`）
- AC-3: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` および `mise exec -- pnpm --filter @ubm-hyogo/api build`（tsconfig.build.json）が引き続き PASS
- AC-4: 02c-followup-002 の boundary rule（`.dependency-cruiser.cjs`）が引き続き violation 0 件
- AC-5: writeCap / cursor / status の仕様判定結果が苦戦箇所節 もしくは owning workflow に明記されている

---

## 4. 苦戦箇所【記入必須】

### 4.1 fail している具体ファイルと症状

| 失敗 test | 直接の根本原因（02c Phase 9 推定） | 02c-followup-002 との関連 |
| --- | --- | --- |
| `apps/api/src/jobs/sync-forms-responses.test.ts > AC-9` | response sync 内部の cursor / status 期待値ずれ | 無関係（runtime / test 不変） |
| `apps/api/src/jobs/sync-forms-responses.test.ts > AC-10 writeCap` | per-sync write 上限到達時の status `'failed'` / `'succeeded'` 期待値ずれ | 無関係 |
| 同ファイル内 関連 case 2 件 | AC-9 / AC-10 と同じ cursor / writeCap 系の連鎖 | 無関係 |

参照リンク:

- 検出元 evidence: `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/outputs/phase-09/main.md`（Phase 9 「4. `pnpm --filter @ubm-hyogo/api test`」節）
- 02c-followup-002 タスク仕様: `docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md`
- runtime 実装本体: `apps/api/src/jobs/sync-forms-responses.ts`
- 失敗 test 本体: `apps/api/src/jobs/sync-forms-responses.test.ts`

### 4.2 02c-followup-002 で得た判断知見

- 02c-followup-002 では `tsconfig.build.json` / `package.json` / `.dependency-cruiser.cjs` のみを差分として持ち、runtime / test には触れていない。それにもかかわらず `sync-forms-responses.test.ts` が fail し続けるという事実は、**この failure が build 構成変更以前から存在する pre-existing failure** であることを示している
- `02c-followup-002` の AC-2「`pnpm test` が引き続き通る」は「本タスク差分による regression が無い」と再解釈し、絶対値としての full PASS 要求は本タスクへ委譲する整理を採用済み
- 結果として「02c-followup-002 の build / dep-cruiser / typecheck は緑、test だけ pre-existing failure を継承」という Phase 9 ゲート結果になっており、本タスクが完了しない限り `apps/api` の test 全体緑は復帰しない

---

## 5. リスクと対策

| リスク | 想定される影響 | 対策 |
| --- | --- | --- |
| writeCap ロジックの修正が他 sync job（`apps/api/src/jobs/` 配下）に波及する | 既存緑 test の reversion / cron 動作変化 | 修正は `sync-forms-responses` job ローカルに留め、shared util を変更する場合は呼び出し側 test も同時に再実行して確認 |
| cursor / status 期待値の正解側を test に寄せた結果、本番 response sync の動作意図と乖離する | 本番 cron で response が取りこぼされる / status が誤マーキング | 修正前に `docs/00-getting-started-manual/specs/01-api-schema.md` 等の仕様正本を確認し、仕様 → 実装 → test の片方向で整合を取る。仕様未定義の場合は仕様側を先に追記してから test/実装を合わせる |
| pre-existing failure を本タスクで触ったことで他 02c 系 follow-up と diff が衝突 | レビュー / merge 時のコンフリクト | 本タスクの差分は `apps/api/src/jobs/sync-forms-responses.{ts,test.ts}` に限定し、`tsconfig.build.json` / `.dependency-cruiser.cjs` / `package.json` には一切触れない |

---

## 6. 検証方法

### 6.1 修正後に必ず実行するコマンド

```bash
# 1. 失敗 test の単体実行（修正の直接確認）
mise exec -- pnpm --filter @ubm-hyogo/api test -- src/jobs/sync-forms-responses.test.ts

# 2. apps/api 全体 test（baseline 緑化の最終確認）
mise exec -- pnpm --filter @ubm-hyogo/api test

# 3. 02c-followup-002 の他ゲートに regression が無いことの確認
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api build
mise exec -- pnpm dep-cruise
```

### 6.2 期待結果

| コマンド | 期待結果 |
| --- | --- |
| `pnpm --filter @ubm-hyogo/api test -- src/jobs/sync-forms-responses.test.ts` | exit 0 / `Tests 0 failed` |
| `pnpm --filter @ubm-hyogo/api test` | exit 0 / `Test Files 0 failed` / `Tests 0 failed` |
| `pnpm --filter @ubm-hyogo/api typecheck` | exit 0（02c-followup-002 Phase 9 と同等） |
| `pnpm --filter @ubm-hyogo/api build` | exit 0（tsconfig.build.json 経由） |
| `pnpm dep-cruise` | `no dependency violations found` |

---

## 7. 依存関係

| 種別 | 対象 | 関係性 |
| --- | --- | --- |
| 親タスク | `docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md` | pre-existing failure として切り出された派生タスク |
| 上流ワークフロー | `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/outputs/phase-09/main.md` | failure 4 件の検出元 evidence |
| 同根派生タスク | `task-02c-followup-002-wrangler-dry-run-evidence-001.md` | 親が同じ。本タスクとは独立に実行可。互いにブロッキング無し |
| ブロッキング | なし | 02c-followup-002 は merge 済前提。本タスクは runtime / test レイヤのみ |
| ブロックされる側 | `apps/api` の test baseline 緑化を AC とする後続タスク（D1 boundary 系・sync job 拡張系） | 本タスク完了まで「pre-existing failure 既知例外」運用を強いる |
| 仕様正本 | `docs/00-getting-started-manual/specs/01-api-schema.md` | writeCap / cursor / status 期待値の正解側判定の根拠 |

---

## 8. 完了の定義 (Definition of Done)

- [ ] AC-1〜AC-5 すべて PASS（§3.3）
- [ ] `apps/api/src/jobs/sync-forms-responses.test.ts` の 4 件 fail がゼロ
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` 全体が exit 0（`Test Files 0 failed`）
- [ ] writeCap / cursor / status の判定結果（実装側修正 / test 側修正のいずれか）が苦戦箇所節 もしくは owning workflow の evidence に明記
- [ ] 02c-followup-002 で導入された `tsconfig.build.json` / `package.json` build script / `.dependency-cruiser.cjs` rule に差分なし（§2.3 含まないものに準拠）
- [ ] `pnpm dep-cruise` が `no dependency violations found`
- [ ] owning workflow への evidence ログ追記が完了
- [ ] commit / push / PR はユーザ承認まで実行しない

---

## 9. 関連リソース

- `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/outputs/phase-09/main.md` — pre-existing failure 検出元 evidence
- `docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md` — 親 follow-up タスク仕様
- `apps/api/src/jobs/sync-forms-responses.ts` — response sync job runtime 実装
- `apps/api/src/jobs/sync-forms-responses.test.ts` — 4 件 fail の test 本体
- `docs/00-getting-started-manual/specs/01-api-schema.md` — response / form schema 正本
- `apps/api/tsconfig.build.json` — 02c-followup-002 で導入された build 専用 config（本タスクでは触らない）
- `.dependency-cruiser.cjs` — 02c-followup-002 で導入された fixture boundary rule（本タスクでは触らない）
