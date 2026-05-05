# UT-06-FU-E-GHA-BACKUP-MONITORING-EXTENSION-001: GHA backup schedule monitoring extension

> 発生元: `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-12/unassigned-task-detection.md`

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | UT-06-FU-E-GHA-BACKUP-MONITORING-EXTENSION-001                      |
| タスク名     | GHA backup schedule monitoring extension                            |
| 分類         | follow-up / monitoring                                              |
| 対象機能     | `.github/workflows/d1-backup.yml`（UT-06-FU-E Phase 5 で新設予定）+ UT-05-FU-003 monitoring 統合 |
| 優先度       | 中                                                                  |
| 見積もり規模 | 小〜中規模                                                          |
| ステータス   | open                                                                |
| 発見元       | Phase 12 / unassigned-task-detection.md                             |
| 発見日       | 2026-05-01                                                          |
| taskType     | implementation                                                      |
| visualEvidence | NON_VISUAL                                                        |
| 親タスク     | UT-06-FU-E（D1 backup long-term storage）                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06-FU-E Phase 9 の C4 意思決定で、D1 export の主経路は **GitHub Actions schedule**（`bash scripts/cf.sh d1 export` を GHA job 内で実行）に確定した。Cloudflare cron triggers は Workers 30 秒制約と `wrangler` CLI 実行不可制約により、R2 latest object healthcheck と UT-08 alert 補助経路に責務分離されている（phase-09.md C4 表）。  
GHA schedule を主経路にするということは、backup 信頼性の根が GitHub Actions の実行成否に依存する、ということを意味する。Phase 10 の R5 段階では「3 日連続 cron 失敗」を rollback トリガにしており、Phase 11 S-19 では production cron 失敗 → UT-08 critical alert の到達を破壊的 smoke として要求している。

### 1.2 問題点・課題

現状、UT-05-FU-003（GHA monitoring 基盤）は CI 系 workflow の failed run / Actions minutes 使用量を扱う設計だが、`.github/workflows/d1-backup.yml`（UT-06-FU-E Phase 5 で新設される backup 専用 schedule workflow）は監視 union に未統合。そのため:

- backup workflow が `failure` / `cancelled` / `timed_out` で終わっても通知基盤に届かない（UT-05-FU-003 の対象外）。
- Phase 9 C4 で見積もった「日次 5 分 × 30 = 150 分（GHA 月 2,000 分の 7.5%）」前提が drift しても気付けない。日次 export が 5 分超に伸びたまま放置されると Actions minutes が圧迫される。
- Cloudflare cron healthcheck（R2 latest object missing 検知）と GHA workflow failure を同一 event type に丸めると、原因切り分け（GHA 側障害 / R2 側障害）が困難になる。

### 1.3 放置した場合の影響

- **silent failure**: backup が 3 日連続失敗していても UT-08 に critical alert が届かず、Phase 10 R5 の rollback トリガが発火しない。Phase 11 S-19 の AC-5 検証も実体ベースでは満たせない。
- **Actions minutes 圧迫**: 日次 export 時間が drift しても気付かず、月末に 2,000 分上限を侵食して CI が止まる二次被害。
- **二重通知 / alert fatigue**: GHA failure と CF healthcheck stale を同 event にすると、片方の修復で他方も鎮静化したと誤認しやすい。

---

## 2. 何を達成するか（What）

### 2.1 目的

GHA schedule を主経路とした D1 backup について、(a) workflow run failure を UT-08 alert に確実に届ける、(b) Actions minutes 使用量を UT-05-FU-003 月次レポートに統合する、(c) GHA failure と CF healthcheck stale を別 event type として分離する、の 3 点を満たす監視拡張を仕様 + 配線レベルで実装する。

### 2.2 最終ゴール

- `.github/workflows/d1-backup.yml` の `workflow_run` event（`conclusion in [failure, cancelled, timed_out]`）を UT-08 通知 payload に変換する配線が main に merge されている。
- 連続失敗 3 回（Phase 10 R5 rollback トリガ整合）を threshold とした critical alert が、failed workflow fixture / dry-run で再現できる。
- UT-05-FU-003 monthly Actions minutes report に `d1-backup` workflow の minutes が独立 line で出力される。
- event type が `gha-backup-failure`（GHA 側）と `cf-healthcheck-stale`（CF cron 側）に明確に分離された設計書が `docs/30-workflows/` 配下に存在する。

### 2.3 スコープ

#### 含むもの（既存再利用）

- UT-05-FU-003 の GHA monitoring base（failed run 検知 / Actions usage API 集計）に union として `d1-backup.yml` を追加。
- UT-08 alert payload schema（critical / info レベル分離）を再利用。
- Phase 11 S-15（info: empty export）/ S-19（critical: cron failure）で確定済みの通知レベル境界を踏襲。

#### 含まないもの

- `.github/workflows/d1-backup.yml` 本体の新規作成（UT-06-FU-E Phase 5 の責務）。
- R2 bucket / lifecycle rule の mutation。
- production secret（`CLOUDFLARE_API_TOKEN` 等）の登録・rotation。
- Cloudflare cron healthcheck Worker 本体の実装（UT-06-FU-E Phase 5〜6）。

### 2.4 成果物

1. `.github/workflows/d1-backup.yml` の `workflow_run` 失敗 → UT-08 配線追加 PR（UT-05-FU-003 monitoring workflow 側 or 専用 dispatcher）。
2. UT-05-FU-003 monthly Actions minutes report 拡張仕様（`d1-backup` を独立集計 line に追加する diff 仕様）。
3. event type 分離設計書 markdown（`gha-backup-failure` / `cf-healthcheck-stale` の payload 構造・トリガ条件・抑制ルール表）。
4. failed workflow fixture（`outputs/...` 配下に dry-run evidence を保存）。
5. 連続失敗 3 回 threshold ロジックの単体検証 evidence（state store 設計含む）。

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-08 monitoring base が完了し、critical / info レベル分離の payload schema が確定していること。
- UT-05-FU-003 が `spec_created` 以上で、GHA failed run / Actions minutes 集計の base 配線が存在すること。
- UT-06-FU-E Phase 9 C4 の採用判定が「GHA schedule 主経路 + Cloudflare cron healthcheck 補助」で固定されていること（phase-09.md L39-L51 参照）。
- `bash scripts/cf.sh` ラッパー経由の運用ポリシーを遵守できること（AC-7）。

### 3.2 依存タスク

- 上流: UT-08（通知基盤）、UT-05-FU-003（GHA monitoring base）、UT-06-FU-E Phase 5（`d1-backup.yml` workflow 本体）。
- 並走: UT-06-FU-E Phase 10 R5（rollback トリガと threshold 整合）、Phase 11 S-19（critical alert smoke）。

### 3.3 必要な知識

- GitHub Actions schedule（cron 構文、`workflow_run` event、`conclusion` フィールドの値域）。
- GitHub Actions usage API（`/repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing`、billable minutes 集計）。
- UT-08 alert payload schema（`level` / `event_type` / `dedupe_key` の運用）。
- 連続失敗カウンタの状態保存戦略（GitHub Actions cache / repository variable / artifact のいずれかで idempotent に管理）。

### 3.4 推奨アプローチ

UT-05-FU-003 の既存 monitoring workflow に **union として `d1-backup.yml` を追加**するのを基本路線とする。新規 monitoring workflow は作らず、既存の `workflow_run` listener に `workflows: ["CI", "d1-backup"]` の形で workflow 名を追加する。  
event type は payload 生成段階で分離する:

| event type             | 発火源                                  | level    | dedupe_key の例                          |
| ---------------------- | --------------------------------------- | -------- | ---------------------------------------- |
| `gha-backup-failure`   | `d1-backup.yml` の workflow_run conclusion ∈ {failure, cancelled, timed_out} | info（単発）→ critical（連続 3 回） | `gha-backup-failure:{workflow_run_id}`   |
| `cf-healthcheck-stale` | Cloudflare cron healthcheck（R2 latest object missing） | critical | `cf-healthcheck-stale:{date}`            |

連続失敗 3 回の判定は GitHub Actions cache（key: `d1-backup-failure-streak`）に streak counter を JSON で保存する単純化を採る。成功 run で 0 にリセット、失敗 run で +1、3 到達で UT-08 critical へ昇格する。

---

## 4. 実行手順

### Phase 構成

Phase 1（failure 検知配線）→ Phase 2（連続失敗 3 回 threshold）→ Phase 3（Actions minutes 統合）→ Phase 4（event type 分離 + dry-run evidence）の 4 段。Phase 1〜2 は機能の核、Phase 3 は経済リスク、Phase 4 は運用品質。

### Phase 1: failure 検知配線

#### 目的

`d1-backup.yml` の `workflow_run` failure を UT-05-FU-003 monitoring の対象に組み込み、UT-08 へ info レベル alert として届ける。

#### 手順

1. UT-05-FU-003 の monitoring workflow を読み、`workflow_run` listener の `workflows:` 配列に `d1-backup` を追加する diff を起草する。
2. payload 生成箇所で `event_type=gha-backup-failure` / `level=info` / `dedupe_key=gha-backup-failure:{run_id}` を出力する分岐を追加。
3. 既存 CI failure 経路と payload schema 互換であることを確認（フィールド漏れがないこと）。

#### 成果物

- UT-05-FU-003 monitoring workflow の diff（PR draft）。
- payload schema 互換確認メモ。

#### 完了条件

- `workflow_run` event のうち `name=d1-backup` かつ `conclusion ∈ {failure, cancelled, timed_out}` で UT-08 info alert が 1 件生成されることが fixture で確認できる。

### Phase 2: 連続失敗 3 回 threshold

#### 目的

Phase 10 R5 の rollback トリガ「3 日連続 cron 失敗」と整合する critical alert 昇格ロジックを実装する。

#### 手順

1. GitHub Actions cache に `d1-backup-failure-streak` を JSON `{streak: number, last_run_id: string}` で保存する設計を確定。
2. monitoring workflow に streak 加算 / 成功時リセットのステップを追加。
3. `streak >= 3` 到達時に `event_type=gha-backup-failure` の `level` を `critical` に昇格させる分岐を追加。
4. 並行 run / cache 競合時の idempotency（`last_run_id` での重複加算抑止）を仕様化。

#### 成果物

- streak counter 設計セクション（event type 分離設計書内）。
- idempotency 仕様メモ。

#### 完了条件

- failed workflow を 3 回連続発火させる fixture で、3 回目の payload が `level=critical` になることを dry-run で確認できる。
- 同 run_id の重複加算が起きないことを fixture で確認できる。

### Phase 3: Actions minutes 統合

#### 目的

UT-05-FU-003 の monthly report に `d1-backup` workflow の billable minutes を独立 line として追加し、Phase 9 C4 の「日次 5 分 × 30 = 150 分」前提の drift を可視化する。

#### 手順

1. UT-05-FU-003 の monthly report 集計箇所を読み、workflow 別 group_by の存在を確認。
2. `d1-backup` を独立 line として出力する diff 仕様を作成（既存 group_by 構造に乗る場合は対象 workflow allowlist のみ拡張）。
3. 月次 budget threshold（例: 200 分 / month を warning、400 分を alert）を仕様化。

#### 成果物

- monthly report 拡張仕様 markdown。
- threshold 表（warning / alert 境界）。

#### 完了条件

- mock の Actions usage API レスポンスに対し、`d1-backup` line が独立して出力されることを dry-run で確認できる。

### Phase 4: event type 分離 + dry-run evidence

#### 目的

`gha-backup-failure`（GHA 側）と `cf-healthcheck-stale`（CF cron 側）の event type 分離を文書化し、双方の dry-run evidence を残す。

#### 手順

1. event type 分離設計書 markdown を `docs/30-workflows/` 配下に新規作成。payload 構造、トリガ条件、相互抑制ルール（片方発火時の他方の挙動）を表形式で固定。
2. failed workflow fixture（`d1-backup` を意図的に exit 1 で終わらせる minimal yaml）を `outputs/` 配下に配置。
3. dry-run evidence（payload JSON / streak transition log / minutes report sample）を 3 件まとめて保存。

#### 成果物

- event type 分離設計書（payload 構造表 + 抑制ルール）。
- failed workflow fixture。
- dry-run evidence 3 種。

#### 完了条件

- 設計書 / fixture / evidence の 3 ファイルが揃い、UT-08 alert payload が 2 つの event type で別個に生成されていることが evidence で確認できる。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `.github/workflows/d1-backup.yml` の `workflow_run` failure → UT-08 info alert 配線が PR に含まれている。
- [ ] 連続失敗 3 回で `level=critical` に昇格するロジックが実装済み。
- [ ] 同 run_id 重複加算抑止が fixture で確認済み。
- [ ] UT-05-FU-003 monthly report に `d1-backup` 独立 line が出力される。
- [ ] event type が `gha-backup-failure` / `cf-healthcheck-stale` で分離されている。

### 品質要件

- [ ] `bash scripts/cf.sh` 経由ポリシー（AC-7）に違反する `wrangler` 直接呼び出しを workflow に追加していない。
- [ ] secret 値 / GitHub token 値が文書・log・evidence に出力されない。
- [ ] failed workflow fixture / dry-run evidence で UT-08 payload 生成を再現可能。

### ドキュメント要件

- [ ] event type 分離設計書 markdown が存在する。
- [ ] monthly report 拡張仕様 markdown が存在する。
- [ ] streak counter idempotency 仕様が記述されている。

---

## 6. 検証方法

### テストケース

| ID | 観点 | 入力 | 期待出力 |
| --- | --- | --- | --- |
| T-1 | 単発 failure | `d1-backup` を 1 回 failure させる fixture | UT-08 に `gha-backup-failure` / `level=info` が 1 件 |
| T-2 | 連続 3 回 failure | 同 fixture を 3 回連続発火 | 3 回目の payload が `level=critical` |
| T-3 | 成功で reset | failure 2 回 → success 1 回 → failure 1 回 | 最後の payload は `level=info`（streak=1） |
| T-4 | 重複 run_id | 同 run_id を 2 回処理 | streak 加算は 1 回のみ |
| T-5 | minutes 集計 | mock usage API | `d1-backup` line が独立出力 |
| T-6 | event type 分離 | GHA failure と CF healthcheck stale を同時発火 | 2 つの event type で別個に payload 生成 |

### 検証手順

1. failed workflow fixture を `outputs/` に配置し、monitoring workflow を dry-run モードで起動。
2. 生成された UT-08 payload JSON を evidence ファイルに保存し、T-1〜T-6 の期待値と diff 比較。
3. `bash scripts/cf.sh` 経由でない `wrangler` 直接呼び出しが diff に含まれないか grep で確認。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| GHA schedule failure が沈黙する | 高 | 中 | `workflow_run` listener に `d1-backup` を追加し、failure / cancelled / timed_out を UT-08 critical alert（連続 3 回時）に接続する |
| Actions minutes を圧迫する | 中 | 中 | 月次 usage を UT-05-FU-003 の monthly report に独立 line で統合し、200/400 分 threshold で warning / alert |
| Cloudflare cron healthcheck と二重通知になる | 中 | 高 | event type を `gha-backup-failure` と `cf-healthcheck-stale` に分離し、dedupe_key も別系で管理。設計書で相互抑制ルールを明示 |
| streak counter の cache 競合で誤通知 | 中 | 低 | `last_run_id` での idempotency 確認を必須化し、並行 run でも同 run_id は 1 度しか加算しない |
| secret / token の意図しない混入 | 高 | 低 | payload 生成時に許可フィールドのみ通す allowlist を採用、evidence 保存時に redact 確認手順を追加 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-09.md`（C4: GHA schedule 主経路 + AC-8 整合）
- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-10.md`（R5: rollback と UT-08 alert 連携）
- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-11.md`（S-19: critical alert 破壊的 smoke）
- `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-12/unassigned-task-detection.md`（発生元）
- UT-05-FU-003 GHA monitoring spec（`docs/30-workflows/` 配下、Actions minutes / failed run base）
- UT-08 monitoring base（通知 payload schema / level 分離）
- `.github/workflows/d1-backup.yml`（UT-06-FU-E Phase 5 で新設予定の対象 workflow。本タスク開始時に存在しない場合は、Phase 5 完了後に配線 PR を出す）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（`scripts/cf.sh` 経由ポリシー）

### 参考資料

- GitHub Actions: `workflow_run` event documentation
- GitHub Actions: `/repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing` API
- GitHub Actions cache を state store として使う際の concurrency 注意点

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | UT-06-FU-E Phase 9 で C4 を「GHA schedule 主経路」と確定した際、UT-05-FU-003 監視 union への追加が AC-8 整合の前提条件であることを忘れやすく、Phase 10 R5 / Phase 11 S-19 の整合チェック時に「監視配線が空欄」のまま rollback 仕様だけ書かれている状態を作りそうになった。 |
| 原因 | Phase 9 の意思決定（cron 基盤の選定）と Phase 10 の rollback 仕様、Phase 11 の smoke 仕様が別 phase に分かれており、監視配線という横串タスクが 3 phase をまたぐため漏れが生じた。 |
| 対応 | Phase 12 の unassigned-task-detection で `GHA backup monitoring extension` を独立タスクとして切り出し、本指示書で event type 分離 / streak threshold / minutes 統合の 3 観点に分解して責務を明示した。発生元: `outputs/phase-12/unassigned-task-detection.md`。 |
| 再発防止 | 「cron 基盤を選定する Phase」では、選定結果に応じて発生する **監視配線タスク** を必ず Phase 12 検出シートに 1 行明示する運用にする。AC-8（GHA 採用 = UT-05-FU-003 監視対象化）のような「採用と監視のペア義務」を Phase 9 のチェックリストに常設する。 |

### レビュー指摘の原文（該当する場合）

```
（Phase 12 unassigned-task-detection.md の Current Items 行: "GHA backup monitoring extension | conditional follow-up | formalized as docs/30-workflows/unassigned-task/UT-06-FU-E-gha-backup-monitoring-extension-001.md"）
```

### 補足事項

- 本タスクは UT-06-FU-E Phase 5（`d1-backup.yml` 本体）が main に存在することを前提にする。Phase 5 が未完了の段階では、本タスクは設計書 + fixture 雛形まで先行進行し、配線 PR は Phase 5 完了後に出す。
- `bash scripts/cf.sh` 経由ポリシーは monitoring workflow 側でも遵守する（仮に diagnostics で `wrangler` を呼ぶ必要が生じても直接実行禁止）。
- secret 値 / GitHub token 値は payload allowlist で除外し、evidence 保存前に redact 確認を必須にする。
