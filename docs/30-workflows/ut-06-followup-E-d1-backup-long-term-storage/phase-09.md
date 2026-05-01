# Phase 9: パフォーマンス・コスト・無料枠運用

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 9 / 13 |
| Phase 名称 | パフォーマンス・コスト・無料枠運用 |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 (セキュリティ・コンプライアンス) |
| 次 Phase | 10 (ロールアウト・ロールバック・机上演習) |
| 状態 | spec_created |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |
| GitHub Issue | #118 (CLOSED) |
| Wave | 2 / serial |

## 目的

UT-06-FU-E の日次 D1 export → R2 長期保管基盤について、(1) D1 export サイズ試算、(2) R2 ストレージ無料枠（10 GB / 月）の世代管理（30 日ローリング + 月次）累積容量試算、(3) R2 操作料金（class A / class B 無料枠）試算、(4) GHA schedule 主経路と Cloudflare cron healthcheck の併用コスト、(5) export 実行時間 SLO（GHA 30 分上限 / CF healthcheck 30 秒制限）、(6) 復元実行時間 SLO、(7) 圧縮戦略（gzip / zstd）の 7 観点（C1〜C7）を仕様レベルで確定し、Phase 11 smoke および通常運用での drift 検知基準として固定する。本ワークフローは spec_created に閉じ、本 Phase は Phase 5 着手後の実装ランブックと Phase 11 smoke が参照するコスト・SLO の SSOT として記述する。

## 真の論点 (true issue)

- 「export を毎日撮ること」ではなく、**「Cloudflare 無料枠（R2 10 GB / class A 月 100 万 / class B 月 1,000 万 / Workers cron 一定数 / GHA private 月 2,000 分）を daily 30 日 + monthly 12 ヶ月世代管理で圧迫しない容量・操作回数・実行時間境界の確立」** が本 Phase の本質。
- 副次論点:
  1. AC-8 整合（GHA 採用時 UT-05-FU-003 監視対象 / Cloudflare cron healthcheck で二重検知）
  2. AC-7 整合（`bash scripts/cf.sh d1 export` 経由徹底 / wrangler 直接禁止）
  3. AC-6 整合（空 export 許容バリデーションの SLO 上の扱い）
  4. 復元 SLO（runbook 手順での目標時間）を Phase 10 机上演習の合格基準として明示

## コスト・SLO 設計表（C1〜C7）

| # | 観点 | ターゲット / 試算 | 根拠 | 検証 Phase |
| --- | --- | --- | --- | --- |
| C1 | D1 export サイズ試算 | MVP 想定 ≤ 5 MB / 1 export（圧縮前）/ ≤ 1 MB（gzip 後） | 会員数 × 列幅 × 圧縮率（MVP は 100〜500 行規模を想定） | Phase 11 smoke 実測 |
| C2 | R2 ストレージ累積容量 | 30 日ローリング 30 ファイル + 月次 12 ファイル = 計 42 ファイル / 1 MB 平均 = ≤ 50 MB（無料枠 10 GB の 0.5%） | 圧縮後サイズ × 世代管理本数 | 通常運用 |
| C3 | R2 操作料金（class A / B） | PUT (class A) 月 30 + 月次 1 ≈ 31 回（無料枠 100 万の 0.003%）/ GET (class B) restore 演習月 1〜2 + smoke 数回 ≤ 10 回 | Cloudflare R2 公式無料枠 | 通常運用 |
| C4 | cron 実行基盤の選定 | **GHA schedule 主 + Cloudflare cron healthcheck 併用**（AC-8 により UT-05-FU-003 監視対象化） | Worker runtime から `wrangler` CLI は実行できないため、export は GHA 主経路、CF cron は R2 最新オブジェクト確認と UT-08 alert に限定 | Phase 11 smoke |
| C5 | export 実行時間 SLO | GHA export: < 5 分（30 分上限の 17%）/ CF healthcheck: < 30 秒（Workers CPU 制限） | D1 export は MVP 規模では 5 秒程度、R2 latest check は metadata read のみ | Phase 11 smoke 実測 |
| C6 | 復元実行時間 SLO | runbook 手順での復元 < 15 分（前提確認 5 分 + R2 GET 1 分 + schema 適用 2 分 + SQL import 5 分 + smoke 2 分）| Phase 10 机上演習の合格基準 | Phase 10 机上演習 / Phase 11 smoke |
| C7 | 圧縮戦略 | **gzip 採用**（D1 export SQL は標準 Unix ツールで復元容易）/ zstd は MVP では非採用（復元 runbook 簡素化優先） | 復元 runbook の `gunzip` 1 段階で済む / 圧縮率 5x で C2 / C3 試算と整合 | Phase 11 smoke |

> **境界の核心**: daily 30 日 + monthly 12 ヶ月世代管理の累積容量は無料枠の 1% 未満で運用可能。R2 PUT 回数も class A 無料枠の 0.003% で頭打ち。**コストではなく「実行基盤の選定（C4）」と「復元時間 SLO（C6）」が本 Phase の意思決定対象**。

## C4: cron 実行基盤の選定（AC-8 整合）

| 候補 | 採用判定 | 根拠 | リスク |
| --- | --- | --- | --- |
| GitHub Actions schedule | **主経路（採用）** | `bash scripts/cf.sh d1 export` を実行でき、1Password / R2 upload / UT-08 payload を同一 job で扱える | GHA 月 2,000 分のうち日次 5 分 × 30 = 150 分（7.5%）を消費。AC-8 により UT-05-FU-003 監視対象 |
| Cloudflare cron triggers | **healthcheck（採用）** | R2 最新 daily object の存在確認と missing 時 UT-08 alert に限定すれば Workers 30 秒内で完結 | export 本体は実行しない。GHA 停止時の二重検知役 |

> Phase 2〜3 の確定方針に合わせ、export 本体は GHA schedule、Cloudflare cron triggers は healthcheck に責務分離する。これにより CLI 実行制約と二重検知を同時に満たす。

## C6: 復元実行時間 SLO の内訳（runbook 章立てとの対応）

| ステップ | 想定時間 | runbook 該当章（Phase 10 で詳述） |
| --- | --- | --- |
| 前提確認（R2 アクセス権 / D1 access / migration 状態） | 5 分 | runbook §1 前提確認 |
| R2 から最新 export 取得（`bash scripts/cf.sh r2 object get`）+ `gunzip` | 1 分 | runbook §2 export 取得 |
| schema 適用（必要時。MVP は migration 適用済前提） | 2 分 | runbook §3 schema 適用 |
| SQL import（`bash scripts/cf.sh d1 execute --file <decompressed>.sql`） | 5 分 | runbook §4 SQL import |
| smoke（行数確認 / 主要テーブル SELECT） | 2 分 | runbook §5 smoke |
| **合計 SLO** | **< 15 分** | Phase 10 机上演習の合格基準 |

## 空 export 許容バリデーション（AC-6 / SLO 上の扱い）

| 観点 | 仕様 |
| --- | --- |
| 検出条件 | export ファイルの行数 = 0（schema のみ）または `INSERT` 文が 0 件 |
| 扱い | **失敗ではなく warning ログとして R2 に保管 + UT-08 通知基盤に "info" レベルで通知** |
| SLO 算定 | 空 export は cron 成功率 SLO に含める（行数 0 を許容するバリデーション層が機能した = 成功）|
| 反例（真の失敗） | export コマンド自体が exit code != 0 / R2 PUT 失敗 / 圧縮失敗 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md | AC-1〜AC-9 / 苦戦箇所 |
| 必須 | CLAUDE.md §Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 経由徹底（AC-7） |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 / R2 無料枠 |
| 参考 | https://developers.cloudflare.com/r2/pricing/ | R2 無料枠 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | cron triggers 仕様 |
| 参考 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md | 一次保管の現状 |

## 実行タスク

1. C1〜C7 のコスト・SLO ターゲットを表化する（完了条件: 7 行すべてに値・根拠・検証 Phase が埋まる）。
2. C4 cron 基盤選定の意思決定を AC-8 と整合させる（完了条件: GHA schedule 主 + Cloudflare cron healthcheck 併用の根拠とリスクが記述）。
3. C6 復元 SLO の内訳を runbook 章立てと 1:1 対応させる（完了条件: 5 ステップ + 合計 15 分が記述）。
4. AC-6 空 export 許容バリデーションの SLO 上の扱いを定義する（完了条件: 警告 / 真の失敗の境界が明示）。
5. Phase 11 smoke で実測する drift 検知基準を渡す（完了条件: C1 / C5 / C6 が Phase 11 で実測される旨記述）。
6. Phase 10 机上演習の合格基準として C6 を引き渡す（完了条件: Phase 10 R5 で参照される）。
7. Phase 12 implementation-guide への転記項目を固定する（完了条件: cron 設定 / 圧縮戦略 / SLO が転記対象）。

## 実行手順

### ステップ 1: C1〜C7 表の確定
- C1 export サイズ → C2 累積容量 → C3 操作料金 → C4 基盤選定 → C5 export SLO → C6 復元 SLO → C7 圧縮戦略 の順で論理連鎖を構築。

### ステップ 2: AC-8 整合の明示
- GHA 採用 = UT-05-FU-003 監視対象 / Cloudflare cron triggers = R2 latest healthcheck に責務限定、を C4 表に固定。

### ステップ 3: AC-7 整合（wrangler 直接禁止）
- export コマンドは `bash scripts/cf.sh d1 export` 経由で記述。本 Phase 内の全 CLI 例が wrangler 直接呼び出しを含まないことを確認。

### ステップ 4: AC-6 空 export バリデーションの SLO 化
- warning ログ + UT-08 info 通知 = 成功扱い / exit code != 0 = 失敗扱い の境界を明文化。

### ステップ 5: 復元 SLO の Phase 10 への引渡し
- C6 < 15 分を Phase 10 机上演習の合格基準として明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | C4 基盤選定 / C6 復元 SLO を rollout 段階の前提として渡す |
| Phase 11 | C1 / C5 / C6 を smoke で実測、本 Phase ターゲットとの drift 検知 |
| Phase 12 | implementation-guide.md に cron 設定 / 圧縮戦略 / SLO / コスト試算を転記 |
| UT-08 | 空 export warning / cron 失敗 alert の通知レベル合意 |

## 多角的チェック観点

- **AC-7 整合（wrangler 直接禁止）**: 本 Phase の全コマンド例が `bash scripts/cf.sh ...` 経由か。`wrangler d1 export` 単独記述が混入していないか。
- **AC-8 整合（GHA 無料枠）**: GHA schedule 主 + Cloudflare cron healthcheck 併用の根拠が明示され、UT-05-FU-003 監視対象化が記述されているか。
- **無料枠 drift**: 30 日 + 月次世代管理で R2 容量・class A/B 操作回数が無料枠の何 % かが数値で固定されているか。
- **復元 SLO の現実性**: C6 < 15 分が runbook 5 ステップの合計と整合するか。Phase 10 机上演習で実測 drift した場合の差し戻し経路があるか。
- **空 export の SLO 算定**: AC-6 が「成功扱い」として SLO に含まれる旨が記述され、cron 成功率を不当に下げない構造か。
- **Workers 30 秒制限**: C5 SLO が Workers CPU 制限内に収まる前提で C1 サイズ試算が妥当か（5 MB / 5 秒）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | C1〜C7 コスト・SLO 表作成 | 9 | spec_created | 7 行 |
| 2 | C4 cron 基盤選定（GHA schedule 主 / CF healthcheck）| 9 | spec_created | AC-8 整合 |
| 3 | C6 復元 SLO 内訳（< 15 分 / 5 ステップ）| 9 | spec_created | Phase 10 机上演習合格基準 |
| 4 | AC-6 空 export 許容の SLO 上扱い | 9 | spec_created | warning + info 通知 = 成功 |
| 5 | AC-7 整合（scripts/cf.sh 徹底）| 9 | spec_created | wrangler 直接禁止 |
| 6 | C7 圧縮戦略（gzip 採用）| 9 | spec_created | runbook 簡素化優先 |
| 7 | Phase 11 / 12 への引渡し項目固定 | 9 | spec_created | drift 検知 / 転記対象 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-09.md | 本ファイル（C1〜C7 / cron 基盤選定 / 復元 SLO / 空 export 扱い） |
| メタ | artifacts.json | Phase 9 状態の更新（spec_created） |

## 完了条件

- [ ] C1〜C7 の 7 観点すべてに値・根拠・検証 Phase が記述
- [ ] C4 で GHA schedule 主 / Cloudflare cron healthcheck の根拠とリスクが明示（AC-8 整合）
- [ ] C6 復元 SLO < 15 分が 5 ステップ内訳で記述（Phase 10 机上演習合格基準）
- [ ] AC-6 空 export 許容バリデーションの「成功扱い」境界が明文化
- [ ] AC-7 整合で本 Phase 内の全 CLI 例が `bash scripts/cf.sh ...` 経由（`wrangler` 直接実行ゼロ）
- [ ] R2 累積容量 / class A・B 操作回数が無料枠 % で数値固定
- [ ] Phase 11 smoke で実測する drift 検知項目（C1 / C5 / C6）が引き渡されている

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 本仕様書に `wrangler` 直接実行が一切現れない
- AC-6 / AC-7 / AC-8 が多角的チェックで参照されている
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (ロールアウト・ロールバック・机上演習)
- 引き継ぎ事項:
  - C4 Cloudflare cron triggers 採用根拠
  - C6 復元 SLO < 15 分（Phase 10 机上演習合格基準）
  - C7 gzip 採用（runbook §2 で `gunzip` 単段復元）
  - AC-6 空 export warning 扱い（Phase 11 smoke ケースに反映）
- ブロック条件:
  - C4 cron 基盤選定が AC-8 と整合していない
  - C6 復元 SLO が runbook 章立てと不整合
  - `wrangler` 直接実行が記述に残っている
  - 無料枠試算が % 値で固定されていない
