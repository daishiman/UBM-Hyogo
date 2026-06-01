# wrangler.toml binding 定義 ↔ 正本仕様（env.ts / 棚卸し表）ドリフト検出 CI gate - タスク指示書

## メタ情報

```yaml
issue_number: 1054
```


## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | issue-57-followup-001-wrangler-binding-drift-ci-gate                                 |
| タスク名     | wrangler.toml binding 定義と正本仕様(env.ts / deployment-cloudflare.md 棚卸し表)のドリフト検出 CI gate |
| 分類         | 改善                                                                                |
| 対象機能     | CI gate / binding 棚卸しドリフト検出                                                 |
| 優先度       | 中                                                                                  |
| 見積もり規模 | 中規模                                                                              |
| ステータス   | 未実施                                                                              |
| 発見元       | Issue #57 (issue-57-kv-r2-guardrail-degrade-design) Phase 12 skill-feedback-report + 独立検証 |
| 発見日       | 2026-05-31                                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #57（`issue-57-kv-r2-guardrail-degrade-design`）の調査で「正本仕様 ↔ コード実体」の
binding ドリフトが現実化していたことが判明した。

- 正本 runbook `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
  は「R2 binding 未適用」「KV binding 未追加」と断言していた。
- しかし実体では `apps/api/wrangler.toml` に `UBM_AUDIT_COLD_STORAGE`（Issue #514）と
  `UBM_AUDIT_APP_COLD_STORAGE`（Issue #315）の R2 binding が production / staging 両方に
  存在し、`scripts/audit-log/export-to-r2.ts` が `bucket.put()` で実際に書き込んでいた。
- `apps/api/src/env.ts` の `Env` interface にも対応する `R2Bucket` property が定義済みだった。

Issue #57 はこのドリフトを「正本仕様の手動更新 + binding 棚卸し表の新設」で是正した。
棚卸し表は `deployment-cloudflare.md` の「Current KV/R2 binding inventory（Issue #57 / 2026-05-31）」
節（5 行: `UBM_AUDIT_COLD_STORAGE`=active / `UBM_AUDIT_APP_COLD_STORAGE`=active /
`ALERT_DEDUP_KV`=optional・user-gated / `SESSION_KV`=未実装 / `R2_BUCKET`=未実装）として
SSOT 化されている。

### 1.2 問題点・課題

- 棚卸し表は static snapshot であり、binding を追加 / 削除しても自動では更新されない。
- 今後 `apps/api/wrangler.toml` に binding を追加 / 削除しても、`env.ts` の `Env` interface
  型・棚卸し表が手動更新されない限り、再びドリフトが発生し誰も気づかない。
- ドリフトの機械検出（CI gate）は Issue #57 のスコープ外として明示的に分離され、将来
  follow-up 候補（＝本タスク）として残された。

### 1.3 放置した場合の影響

- binding 追加 / 削除のたびに「宣言 ↔ 型 ↔ 棚卸し表」の三者乖離が再発し、Issue #57 で
  起きた「稼働中の R2 binding を runbook が『未適用』と断言する」状態が再現する。
- 正本仕様を信頼した別タスクが誤った前提で設計され、調査コストが増える。
- binding 漏れ（型未定義 / runbook 未記載）が deploy まで気づかれず、運用境界の判断材料が
  欠落する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/api/wrangler.toml` の binding 宣言を解析し、(a) `apps/api/src/env.ts` の `Env`
interface に対応 property が存在するか、(b) `deployment-cloudflare.md` の「KV/R2 binding
inventory」表に該当行があるか、を突合して **ドリフトがあれば非ゼロ exit する CI gate**
（読み取り専用解析スクリプト + GitHub Actions job）を新設する。

### 2.2 最終ゴール

- `wrangler.toml ↔ env.ts ↔ 棚卸し表` の三者整合が CI で常時検証され、ドリフトがあると
  job が fail する。
- ローカルでも `pnpm` script から同じ gate を実行でき、PR を出す前にドリフトを検出できる。
- gate のエラーメッセージが「どの binding が、どの正本（型 / 棚卸し表）から欠落しているか」を
  具体的に提示し、修正先を即特定できる。

### 2.3 スコープ

#### 含むもの

- `apps/api/wrangler.toml` の binding 宣言解析（top-level および各 env セクション）。
  対象 block: `[[d1_databases]]` / `[[kv_namespaces]]` / `[[r2_buckets]]` /
  `[[analytics_engine_datasets]]` / `[[queues.producers]]`（env prefix 付き
  `[[env.production.r2_buckets]]` 等を含む）。
- コメントアウトされた binding block（`# binding = "..."`）を「未適用」状態として扱う解析。
- 解析した binding 名を `env.ts` の `Env` interface property と突合。
- 解析した binding 名を `deployment-cloudflare.md` の「Current KV/R2 binding inventory」表の
  行と突合。
- ドリフト検出時に非ゼロ exit する CLI スクリプト + ローカル実行用 `pnpm` script。
- 上記スクリプトを起動する GitHub Actions job（`.github/workflows/verify-*.yml` 系）。
- スクリプトの単体テスト（`*.spec.ts`、不変条件 #8 に従い `*.test.*` は禁止）。

#### 含まないもの

- **新規 binding の追加そのもの**（`SESSION_KV` 適用は Issue #88 / UT-13、`R2_BUCKET` は
  UT-12、KV foundation は UT-36 の射程）。
- `wrangler.toml` の `[vars]` 重複整理（Issue #117 / UT-06-FU-D の射程）。
- KV Namespace ID 混入防止の pre-commit guard（Issue #86 の射程）。
- WAF / Cloudflare 側の rate limit ルールやその他インフラ設定。

> 本タスクは「binding 宣言 ↔ 型 ↔ 棚卸し表」の **三者整合 drift 検出に限定** し、上記関連
> Issue の責務とは重ならない（§8 参照）。

### 2.4 成果物

- `scripts/verify-wrangler-binding-drift.mjs`（または `.ts`、新規・読み取り専用解析）
- `scripts/verify-wrangler-binding-drift.spec.ts`（新規・単体テスト）
- `.github/workflows/verify-wrangler-binding-drift.yml`（新規・CI gate job）
- `package.json` の `verify:wrangler-binding-drift` script 追記
- 必要に応じて `deployment-cloudflare.md` の棚卸し表の機械解析可能性に関する注記追記

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #57 がマージ済みで、`deployment-cloudflare.md` に「Current KV/R2 binding inventory」
  表が存在する。
- `apps/api/src/env.ts` の `Env` interface が binding 型の正本である（同ファイル冒頭コメントで
  「wrangler.toml の binding 定義と本ファイルの `Env` interface を一対一対応として運用する」
  と宣言済み）。

### 3.2 依存タスク

- Issue #57（棚卸し表新設・本タスクの直接の親）
- なし（解析対象はすべて既存ファイル。新規 binding の有無に依存しない）

### 3.3 必要な知識

- `wrangler.toml` の binding block 構文（`[[r2_buckets]]` / `[[kv_namespaces]]` /
  `[[d1_databases]]` / `[[analytics_engine_datasets]]` / `[[queues.producers]]`、および
  `[[env.<name>.<kind>]]` の env prefix 形式）。
- 既存の読み取り専用解析 + drift fail の CI gate パターン
  （`scripts/verify-design-tokens.ts` / `scripts/verify-d1-migration-sequence.mjs` /
  `scripts/lint-boundaries.mjs` と、対応する `.github/workflows/verify-*.yml`）。
- aiworkflow-requirements skill の Specification-Driven Development（正本仕様を SSOT とし、
  コードと正本のドリフトを CI で機械検出する思想）。

### 3.4 推奨アプローチ

1. `wrangler.toml` を行単位で走査し、`[[...r2_buckets]]` 等の block ヘッダと直後の
   `binding = "..."` 行から `{ name, kind, applied: true }` を抽出する。先頭が `#` の
   コメント行（`# binding = "ALERT_DEDUP_KV"`）は `applied: false`（未適用）として記録する。
   env prefix（`[[env.production.r2_buckets]]`）は `kind` を正規化して同名 binding を
   1 エントリに集約する。
2. `env.ts` を正規表現または TypeScript AST で走査し、`Env` interface 内の property 名集合を
   取得する（`readonly <NAME>?: ...` 形式。コメントの `wrangler.toml ... binding = "<NAME>"`
   注記も補助情報として利用可）。
3. `deployment-cloudflare.md` の「Current KV/R2 binding inventory」表を行単位で解析し、
   1 列目のバッククォート binding 名と「Current state」列（active / not applied / optional）を
   抽出する。
4. 三者を突合し、(a) wrangler で `applied: true` だが `Env` に property が無い、(b) wrangler に
   存在するが棚卸し表に行が無い、(c) 棚卸し表が active と記すが wrangler に block が無い、
   などの矛盾を検出したら、欠落種別ごとにメッセージを出して非ゼロ exit する。
5. 完全に読み取り専用とし、ファイル書き込み・ネットワークアクセスを行わない（不変条件 #5
   に抵触しない）。突合の許容範囲（D1 binding のような既知 always-applied は info 扱い等）は
   既存 verify スクリプトの粒度に合わせる。

---

## 4. 実行手順

### Phase構成

1. wrangler.toml パーサ設計
2. 三者突合ロジック実装
3. CI job 結線
4. テストと dev 体験（ローカル実行 npm script）

### Phase 1: wrangler.toml パーサ設計

#### 目的

`apps/api/wrangler.toml` の binding 宣言を、top-level・各 env セクション・コメントアウト
block を区別したうえで `{ name, kind, applied }` の構造体配列に正規化する読み取り専用
パーサを設計・実装する。

#### 完了条件

`UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE` が `applied: true`、コメントアウト
された `ALERT_DEDUP_KV` / `SCHEMA_ALIAS_BACKFILL_QUEUE` が `applied: false` として抽出され、
env prefix の重複が 1 エントリに集約される単体テストが緑になる。

### Phase 2: 三者突合ロジック実装

#### 目的

パーサ出力を `env.ts` の `Env` interface property 集合と `deployment-cloudflare.md` の棚卸し表
行と突合し、ドリフト種別ごとに分類して非ゼロ exit する core ロジックを実装する。

#### 完了条件

意図的に `env.ts` から 1 binding を削った fixture / 棚卸し表から 1 行を削った fixture で gate が
fail し、整合状態（現行 repo）で exit 0 になる単体テストが緑になる。

### Phase 3: CI job 結線

#### 目的

`.github/workflows/verify-wrangler-binding-drift.yml` を新設し、`apps/api/wrangler.toml` /
`apps/api/src/env.ts` / `deployment-cloudflare.md` のいずれかが変更された PR で gate を起動する。

#### 完了条件

新設 workflow が既存 `verify-*.yml`（例: `verify-design-tokens.yml`）と同じ top-level
permissions / Node 24 セットアップ規約に整合し、gate がドリフト時に job fail する。

### Phase 4: テストと dev 体験（ローカル実行 npm script）

#### 目的

`package.json` に `verify:wrangler-binding-drift` を追加し、ローカルで CI と同一の gate を
実行できるようにする。テスト網羅とエラーメッセージの可読性を確定する。

#### 完了条件

`mise exec -- pnpm verify:wrangler-binding-drift` が現行 repo で exit 0 になり、ドリフト
fixture では「欠落 binding 名 + 欠落した正本（型 / 棚卸し表）」を明示して非ゼロ exit する。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `wrangler.toml` の binding 宣言（top-level / 各 env / コメントアウト）が正しく解析される
- [ ] `applied: true` の binding に `env.ts` の `Env` property 欠落があると gate が fail する
- [ ] `wrangler.toml` に存在する binding が棚卸し表に未記載だと gate が fail する
- [ ] 整合状態（現行 repo）では exit 0 になる

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] 新規スクリプトの単体テスト（`*.spec.ts`）が緑（不変条件 #8: `*.test.*` 禁止）
- [ ] `mise exec -- pnpm lint` 成功
- [ ] gate は読み取り専用（ファイル書き込み / ネットワークアクセスを行わない）

### ドキュメント要件

- [ ] `deployment-cloudflare.md` の棚卸し表が「機械検出対象の SSOT」である旨を注記
- [ ] `package.json` に `verify:wrangler-binding-drift` script を追記

---

## 6. 検証方法

### テストケース

- 現行 repo（整合状態）→ exit 0
- `env.ts` から `UBM_AUDIT_COLD_STORAGE` property を一時的に削った fixture → fail（型欠落を報告）
- 棚卸し表から `UBM_AUDIT_APP_COLD_STORAGE` 行を一時的に削った fixture → fail（棚卸し表欠落を報告）
- コメントアウトされた `ALERT_DEDUP_KV` は「未適用」として扱われ、型 / 棚卸し表に
  optional 行があっても fail しない

### 検証手順

```bash
mise exec -- pnpm verify:wrangler-binding-drift
mise exec -- pnpm exec vitest run scripts/verify-wrangler-binding-drift.spec.ts
# CI gate のローカル再現（workflow が起動するコマンドと同一であることを確認）
```

---

## 7. リスクと対策

| リスク                                                | 影響度 | 発生確率 | 対策                                                                                          |
| ----------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------- |
| TOML パーサ自作で env prefix / コメント block の解釈漏れ | 中     | 中       | 既存 binding 全種で fixture テストを作り、コメントアウト block / env prefix を明示的に網羅      |
| 棚卸し表の表記揺れ（active / not applied 等）で誤検出  | 中     | 中       | state 値を許容語彙に正規化し、未知語は warn にとどめて誤 fail を避ける                          |
| gate が厳しすぎて正当な未適用 binding を fail 扱いする | 中     | 低       | `applied: false`（コメントアウト）は型 / 棚卸し表 optional を許容し fail させない               |
| 解析対象パスの hard-code でファイル移動時に破綻         | 低     | 低       | 対象パスを定数として 1 箇所に集約し、不存在時は明示的にエラーメッセージを出す                    |

---

## 8. 参照情報

### 関連ドキュメント

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
  （「Current KV/R2 binding inventory（Issue #57 / 2026-05-31）」節 = 棚卸し表の正本）
- `apps/api/src/env.ts`（`Env` interface = binding 型の正本）
- `apps/api/wrangler.toml`（binding 宣言の実体）
- `scripts/verify-design-tokens.ts` / `scripts/verify-d1-migration-sequence.mjs` /
  `scripts/lint-boundaries.mjs`（読み取り専用解析 → drift fail の既存パターン）
- `.github/workflows/verify-design-tokens.yml` / `.github/workflows/verify-d1-migration-sequence.yml`
  相当（CI gate job の既存パターン）

### 関連 OPEN Issue（責務分離の明示）

- Issue #88: `SESSION_KV` binding 適用（本タスクは「適用そのもの」を行わない）
- Issue #117（UT-06-FU-D）: `wrangler.toml` vars 重複整理（本タスクは vars を対象にしない）
- Issue #86: KV Namespace ID 混入防止 pre-commit guard（本タスクは ID 漏洩防止を行わない）

> いずれも本タスク（binding 宣言 ↔ 型 ↔ 棚卸し表の三者整合 drift 検出）とは責務が重ならない。

### 不変条件

- CLAUDE.md 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）に抵触しない読み取り専用解析。
- CLAUDE.md 不変条件 #8（新規 test ファイルは `*.spec.{ts,tsx}` のみ）。

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | Issue #57 着手時、正本仕様（deployment-cloudflare.md）が「R2 binding 未適用 / KV binding 未追加」と断言していたが、コード実体（wrangler.toml + env.ts + export-to-r2.ts）には R2 binding が既に存在し production / staging で稼働していた。仕様とコードが完全に乖離していたが誰も検出できていなかった |
| 原因     | binding 追加（Issue #514 / #315）時に正本仕様・runbook の同期が手動依存で漏れ、ドリフトを機械検出する仕組みが無かった                                          |
| 対応     | Issue #57 では棚卸し表（Current KV/R2 binding inventory）を手動新設し static snapshot で是正したが、機械検出は将来 follow-up（本タスク）に明示的に分離した     |
| 再発防止 | `wrangler.toml ↔ env.ts ↔ 棚卸し表` の三者を突合する CI gate を常設し、binding 追加 / 削除時に必ず正本同期を強制する                                          |

### 補足事項

- 本タスクは Specification-Driven Development の思想に直結する。正本仕様（棚卸し表 / 型）を
  SSOT とし、コード実体とのドリフトを CI で機械検出することで、Issue #57 のような「正本が
  現実を誤って断言する」状態を構造的に排除する。
- gate は既存の `verify-*` 系（`verify-design-tokens` / `verify-d1-migration-sequence` /
  `verify-indexes` / `verify-test-suffix`）と同じ「読み取り専用解析 → drift で job fail」
  パターンを踏襲し、新規概念を増やさない。
- 将来 `SESSION_KV`（Issue #88）や `R2_BUCKET`（UT-12）が適用された際は、本 gate が
  「型 / 棚卸し表の同期漏れ」を即座に fail として顕在化させるため、Issue #57 と同種の
  ドリフト再発を未然に防げる。
