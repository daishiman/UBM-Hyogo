# extractTimestampFromLegacy mtime catch 経路の単体テスト追加 - タスク指示書

## メタ情報

```yaml
issue_number: 163
```


## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | ut-a2-cov-001                                                         |
| タスク名     | extractTimestampFromLegacy mtime catch 経路の単体テスト追加           |
| 分類         | テスト改善                                                            |
| 対象機能     | `scripts/skill-logs-render` の `extractTimestampFromLegacy` 関数      |
| 優先度       | 低                                                                    |
| 見積もり規模 | 小規模                                                                |
| ステータス   | 未実施                                                                |
| 発見元       | task-skill-ledger-a2-fragment Phase 7 / Phase 12                      |
| 発見日       | 2026-04-28                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`scripts/skill-logs-render` の `extractTimestampFromLegacy` 関数は、legacy log のタイムスタンプを取得できなかった場合の fallback として `node:fs` の `statSync` を呼び出し、ファイル mtime を利用する設計になっている。`statSync` は同期 API のため例外を投げる可能性があり、実装側では try/catch で包み、失敗時は `0` を返す安全側のフォールバック経路を持つ。

### 1.2 問題点・課題

- `statSync` が同期 reject する状況（権限欠落・symlink 切れ・FS race 等）が現実的な単体テスト環境で発生しないため、catch 経路（`return 0`）が単体テストで通っていない
- Phase 7 の coverage report 上、当該行が未到達枝として残り、coverage 100% の前提が崩れている
- 例外ハンドリングの仕様（失敗時 `0` 返却）が回帰テストで保護されていない

### 1.3 放置した場合の影響

- 例外経路のリグレッションが検知できず、将来 catch 節を削除・改変した際に silently 動作が変わる
- coverage 閾値を厳格化したい際に該当行がブロッカーになる
- legacy log の壊れたファイルに対する挙動仕様が暗黙化する

---

## 2. 何を達成するか（What）

### 2.1 目的

`extractTimestampFromLegacy` の `statSync` 失敗経路を vitest mock で再現し、catch 節の `return 0` 仕様を単体テストで保護する。

### 2.2 最終ゴール

- `statSync` が throw した場合に `extractTimestampFromLegacy` が `0` を返すことを保証するテストが追加されている
- Phase 7 coverage report 上、当該分岐の行/ブランチカバレッジが 100% になっている
- 既存テストが副作用を受けない（mock が他テストへ漏れない）

### 2.3 スコープ

#### 含むもの

- vitest の `vi.mock("node:fs")` を用いた `statSync` throw テストの 1 件追加
- 該当テストファイル（`scripts/skill-logs-render.test.ts` 等）への isolation 設定（`vi.resetModules()` / `vi.restoreAllMocks()`）

#### 含まないもの

- `extractTimestampFromLegacy` 実装ロジックの変更
- coverage 閾値の変更
- 他関数のテスト追加・refactor

### 2.4 成果物

- `scripts/skill-logs-render.test.ts`（または同等のテストファイル）への差分
- `mise exec -- pnpm vitest run --coverage` の該当行 100% を示すログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- task-skill-ledger-a2-fragment が main にマージ済み、または対象ブランチ上で `scripts/skill-logs-render` が利用可能
- vitest および coverage（v8/istanbul）がワークスペースで動作している

### 3.2 依存タスク

- task-skill-ledger-a2-fragment Phase 7 / Phase 12 で識別された未到達枝が現存していること

### 3.3 必要な知識

- vitest の module mock（`vi.mock`, `vi.doMock`, `vi.hoisted`）
- `node:fs` の同期 API と Node 24 における ESM mock の挙動
- coverage report（v8）における branch / line の判定ルール

### 3.4 推奨アプローチ

`vi.mock("node:fs", ...)` で `statSync` のみ throw するように上書きし、当該テスト内で対象関数を import → 実行 → `0` 返却を assert する。mock の漏出を防ぐため、`describe` ブロック単位で `vi.resetModules()` / `vi.restoreAllMocks()` を `afterEach` に設定する。

---

## 4. 実行手順

### Phase構成

1. 既存テスト構造の確認
2. mock 戦略の確定
3. テスト追加と coverage 検証
4. 副作用確認

### Phase 1: 既存テスト構造の確認

#### 目的

`scripts/skill-logs-render.test.ts` 等の既存テストで `node:fs` がどのように扱われているかを把握する。

#### 手順

1. `rg "skill-logs-render" scripts` でテストファイルを特定
2. 既存の `vi.mock` 利用箇所を確認
3. `extractTimestampFromLegacy` の export 形と呼び出し経路を確認

#### 成果物

既存テスト構造メモ

#### 完了条件

mock を追加する適切なファイル / `describe` ブロックが特定されている

### Phase 2: mock 戦略の確定

#### 目的

`statSync` のみを throw させ、他 fs API には影響しない mock を設計する。

#### 手順

1. `vi.mock("node:fs", async (importOriginal) => { const actual = await importOriginal<typeof import("node:fs")>(); return { ...actual, statSync: vi.fn(() => { throw new Error("stat failed"); }) }; })` 形を採用候補にする
2. `vi.hoisted` 利用要否を確認
3. テスト終了時の復元方法（`vi.unmock` / `vi.resetModules`）を決定

#### 成果物

mock 戦略メモ

#### 完了条件

他テストへの副作用が無い設計が確定している

### Phase 3: テスト追加と coverage 検証

#### 目的

catch 経路を踏むテストを実装し、coverage 100% を確認する。

#### 手順

1. テストケース「`statSync` が throw したとき `extractTimestampFromLegacy` は `0` を返す」を追加
2. `mise exec -- pnpm vitest run scripts/skill-logs-render.test.ts` でテスト緑を確認
3. `mise exec -- pnpm vitest run --coverage` で該当行 / 分岐 100% を確認

#### 成果物

テスト差分と coverage ログ

#### 完了条件

テスト緑かつ該当 branch coverage 100%

### Phase 4: 副作用確認

#### 目的

追加した mock が他テストの結果や coverage に副作用を出さないことを確認する。

#### 手順

1. 全体テスト `mise exec -- pnpm vitest run` を実行
2. coverage report 全体の差分を確認（無関係箇所が変動していないこと）

#### 成果物

全体テスト / coverage 実行ログ

#### 完了条件

全テスト緑、関係箇所以外の coverage 変動なし

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `statSync` throw 時に `extractTimestampFromLegacy` が `0` を返すことを assert するテストが追加されている
- [ ] mock が `afterEach` で確実に復元されている
- [ ] 既存テストが緑のまま

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `mise exec -- pnpm vitest run scripts/skill-logs-render.test.ts` 成功
- [ ] `mise exec -- pnpm vitest run --coverage` で該当行 100%

### ドキュメント要件

- [ ] Phase 7 coverage report の未到達枝記録が更新（または解消ログ）されている

---

## 苦戦箇所

> task-skill-ledger-a2-fragment Phase 1〜12 outputs（implementation-guide.md / runbook.md / fragment-runbook.md / skill-feedback-report.md）から想定される苦戦箇所を記録する。

- `extractTimestampFromLegacy` の `statSync` catch 経路（`return 0`）は実 FS では現実的に再現できず、Phase 7 の coverage report で未到達枝として残ったまま A-2 本体マージとなった。
- vitest の `vi.mock("node:fs", ...)` で `statSync` のみを throw に上書きする際、`importOriginal` の型注釈と spread 順序を誤ると他 fs API も壊れて他テストへ波及するため、isolation 設計（`afterEach` での `vi.resetModules()` / `vi.restoreAllMocks()`）が必須となる想定。
- Node 24 の ESM mock 挙動と `vi.hoisted` 適用要否の判断（hoisted にしないと top-level import で actual が解決される問題）が想定される苦戦箇所で、Phase 2 の mock 戦略確定に時間がかかりやすい。
- coverage provider（v8 / istanbul）でブランチ判定の粒度が異なるため、該当行 100% を示す report が provider 切替で揺れないかを Phase 4 副作用確認で見ておく必要がある。

---

## 6. 検証方法

### テストケース

- `statSync` が throw する mock 環境下で `extractTimestampFromLegacy` が `0` を返す
- 通常経路（既存テスト）は引き続き緑のまま
- 全体テストでの副作用が発生しない

### 検証手順

```bash
mise exec -- pnpm vitest run scripts/skill-logs-render.test.ts
mise exec -- pnpm vitest run --coverage
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 7. リスクと対策

| リスク                                                 | 影響度 | 発生確率 | 対策                                                                                     |
| ------------------------------------------------------ | ------ | -------- | ---------------------------------------------------------------------------------------- |
| mock スコープが他テストへ漏れて副作用                  | 中     | 中       | `afterEach` に `vi.resetModules()` / `vi.restoreAllMocks()` を設定し isolation を担保     |
| Node 24 での `node:fs` ESM mock API 差異               | 中     | 低       | `vi.mock` に `importOriginal` を渡し、actual を spread した上で `statSync` のみ上書き     |
| coverage が istanbul / v8 で挙動差異を起こす           | 低     | 低       | `--coverage` 設定（provider）を既存値で固定し、レポートで line/branch 双方を確認         |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-skill-ledger-a2-fragment/outputs/phase-07/coverage.md`
- `docs/30-workflows/task-skill-ledger-a2-fragment/outputs/phase-12/unassigned-task-detection.md`
- `scripts/skill-logs-render*` 実装

### 参考資料

- vitest `vi.mock` / `importOriginal` 公式ドキュメント
- Node 24 `node:fs` 同期 API 仕様

---

## 9. 備考

### 苦戦箇所【記入必須】

> task-skill-ledger-a2-fragment 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `extractTimestampFromLegacy` の `statSync` failure 経路（catch 節 `return 0`）が単体テストで通らず、Phase 7 coverage report に未到達枝として残った              |
| 原因     | `statSync` が同期 reject する状況（権限欠落・symlink 切れ・FS race 等）はテスト用 fixture では現実的に再現できず、実 FS 経由の経路では catch を踏ませられなかった |
| 対応     | A2 fragment 本体スコープでは catch 経路に対するテスト追加を見送り、未タスクとして切り出して mock ベースの単体テスト追加で 100% を回収する方針とした              |
| 再発防止 | 例外フォールバック節を実装する際は、同一 PR 内で `vi.mock` ベースの failure 経路テストを必ず添付するルールを Phase 12 unassigned-task-detection に記録          |

### レビュー指摘の原文（該当する場合）

```
task-skill-ledger-a2-fragment Phase 7 coverage.md にて extractTimestampFromLegacy の statSync catch 経路が未到達枝として識別され、Phase 12 で未タスクとして切り出し
```

### 補足事項

実装ロジックは変更せず、テストのみで coverage を回収する最小スコープのタスク。`vi.mock` の isolation を確実にすることで、他テストへの副作用を排除する点が最重要。
