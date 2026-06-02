# Phase 03 — 設計レビュー（自己批判 / 代替案比較 / リスク / go-no-go）

## 1. 設計の自己批判的レビュー

| 観点 | 懸念 | 評価 / 対応 |
|------|------|-------------|
| regex 抽出の脆さ | wrangler.toml の書式が変わると抽出が壊れる | `extractCrons` を純粋関数として export し、in-memory toml に対する単体テストで挙動を固定（phase-02 §2.4）。現状 3 セクションとも単一行 `crons = [...]` で安定。複数行 array にも `[^\]]*` で対応。 |
| (a) があれば (b)(c)(d) は冗長 | assertion の重複 | **意図的に独立化**。回帰時に「どの不変条件が壊れたか」を失敗メッセージで即判別するため。冗長性はコストでなく可読性向上。 |
| section header の誤マッチ | `[triggers]` が `[env.staging.triggers]` 等と部分一致しないか | 行頭 anchor `^\[...\]$`(multiline) で完全一致。`sectionHeader` を regex escape。`triggers` 抽出時に `env.staging.triggers` を拾わない。 |
| 相対 path の破損 | test ファイル移動で `../../wrangler.toml` が外れる | `import.meta.url` 起点で解決。path が外れれば `readFileSync` が throw しテストが即 fail（silent pass しない＝安全側）。 |
| 24h 実測を省く妥当性 | 実測しないことで見落としは無いか | response は 200 write cap で worst-case が解析的に確定。cron 起動回数は cron 式から決定的。変動要素が cap 済みのため解析で十分（phase-02 §5）。 |

---

## 2. free-tier 整合チェック

| 項目 | 判定 |
|------|------|
| 新規 npm 依存 | **0**（regex のみ。TOML ライブラリ不採用） |
| paid Cloudflare 機能 | **不使用**（test は `node:fs` でローカルファイル読み込みのみ） |
| runtime deploy | **本サイクルなし**（guard test 追加のみで deploy 不要） |
| cron 本数 | 3 = free-plan 上限を guard が固定（超過＝test fail） |
| D1 write 予算 | 最悪 19,200/日 < 100k/日（解析確定） |
| Workers req 予算 | cron 起動 ≈385/日 ≪ 100k/日 |

→ ユーザー必須要求「無料の範囲内」に完全整合。

---

## 3. 代替案比較

### 3.1 cron 抽出方式: regex 抽出 vs TOML ライブラリ追加
| 案 | 長所 | 短所 | 採否 |
|----|------|------|------|
| **regex 抽出（採用）** | 依存追加 0・free/minimal・実行高速 | 書式変更に弱い（→単体テストで担保） | **採用** |
| TOML ライブラリ（`@iarna/toml` 等） | 厳密パース | **依存追加が free/minimal 方針に反する**・bundle/監査増 | 却下 |

free-tier 制約「依存追加 0」が最上位要求のため regex を採用。脆さは extractCrons 単体テストで補償する。

### 3.2 検査機構: guard test vs CI シェルスクリプト
| 案 | 長所 | 短所 | 採否 |
|----|------|------|------|
| **vitest guard test（採用）** | 既存 vitest 基盤に乗る・ローカル/CI 共通・回帰しやすい・純粋関数を再利用可能 | — | **採用** |
| CI 専用 grep スクリプト | 軽量 | ローカルで回らない・grep の偽陽/偽陰・テスト資産にならない | 却下 |

不変条件 #8（`*.spec.ts`）とも整合し、既存テスト実行経路で自動回帰する test を採用。

### 3.3 予算決定: 24h 実測 vs 解析予算
| 案 | 長所 | 短所 | 採否 |
|----|------|------|------|
| **解析予算（採用）** | 即時・staging 占有なし・worst-case を cap で確定 | 実トラフィック分布は見ない（が上限は cap 済） | **採用** |
| 24h staging 実測 | 実値が取れる | 時間/staging コスト・原 issue 前提が obsolete・cap 済で得る情報が少ない | 却下（obsolete） |

response が 200 write cap で頭打ちのため、実測しても worst-case を超えない。解析で十分。

---

## 4. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| wrangler.toml frontmatter/書式変化で regex が壊れる | guard が誤検知 or 見逃し | 堅牢な正規表現（行頭 anchor + escape + 次セクション打ち切り）+ `extractCrons` 単体テストで挙動固定（phase-02 §2.4） |
| 将来 cron を本当に増やす必要が出る | guard が正当な変更を阻む | それが**設計判断ポイント**。ADR-264-01 更新 + free/paid 判断を明示的にレビューさせるのが guard の狙い（fail-fast）。 |
| 複数行 array で書き直される | 抽出漏れ | `[^\]]*` が改行を跨ぐため対応済み。単体テストに複数行ケースを追加して固定 |
| test ファイル移設で相対 path 破損 | テストが落ちる | `readFileSync` throw で即 fail（silent pass にならない＝安全側）。移設時は path を更新 |
| legacy `0 * * * *` が将来 cron 登録される | free-plan デプロイ破壊 | assertion (c) で恒久ブロック |

---

## 5. 不変条件・enum 整合 最終確認

- 不変条件 #8: 新規テストは `wrangler-cron-schedule.guard.spec.ts`（`.spec.ts`）→ OK
- 不変条件 #5: test は wrangler.toml を読むのみ。D1 直接アクセスを増やさない → OK
- enum 整合 #266: 本 guard は cron 値のみ検査し `SyncLogStatus` / `SyncTriggerType` に触れない → 影響なし
- `apps/` 本体コード変更: 本サイクルで追加するのは新規 spec ファイル 1 本のみ。既存コード非改変 → OK

---

## 6. go / no-go 判定

**判定: GO**

- 設計は free-tier 制約（依存 0 / paid なし / deploy なし）を完全充足。
- guard test は 4 assertion + extractCrons 単体テストで回帰を堅牢に検知。
- ADR / 無料枠予算は解析的に成立し、24h 実測不要を正当化。
- 不変条件 #5 / #8 / enum #266 すべて整合。
- 本サイクルの成果物は新規 `*.spec.ts` 1 本 + outputs の ADR/予算記載のみで、既存 `apps/` コードを変更しない。

→ 実装フェーズへ進行可能。
