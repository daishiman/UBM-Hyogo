# Phase 9: 品質保証（4 条件再評価 / 不変条件遵守 / 無料枠見積もり）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証（4 条件再評価 / 不変条件遵守 / 無料枠見積もり） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 8（DRY 化） |
| 下流 | Phase 10（最終レビュー / Go-No-Go） |
| 状態 | spec_created |
| user_approval_required | false |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| workflow_state | spec_created |

## 目的

Phase 8 までに DRY 化された設計成果物全体（仕様書 outputs 配下）に対し、**4 条件再評価（価値性 / 実現性 / 整合性 / 運用性）**、**不変条件 #1 / #4 / #5 の遵守確認**、**Cloudflare Workers Cron Triggers の無料枠見積もり**（pull 方式採択時の月間実行回数 / CPU 時間 / D1 書込量）、**Sheets API quota の上限見積もり**（500 req/100s/project に対する平常時・バックフィル時のヘッドルーム）を機械的に判定し、Phase 10 最終レビューへ提出する quality gate evidence を作成する。本タスクは docs-only のため runtime コードへの影響はゼロだが、副作用ゼロを `pnpm typecheck` / `pnpm lint` で確認し、設計の整合性を仕様書外との grep で検証する。

## 入力

- DRY 化後の本仕様書（`docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-01〜08`）
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-08/main.md` / `outputs/phase-08/before-after.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（Cron Triggers / D1 無料枠基準）
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`（D1 容量見積もり）
- 公式: https://developers.cloudflare.com/workers/platform/limits/ （Workers / Cron 無料枠）
- 公式: https://developers.cloudflare.com/d1/platform/limits/ （D1 無料枠）
- 公式: https://developers.google.com/sheets/api/limits （Sheets API quota）

## 検証コマンド一括（仕様レベル定義）

```bash
# 1. typecheck（docs-only タスクなので副作用ゼロ確認）
mise exec -- pnpm typecheck

# 2. lint（同上）
mise exec -- pnpm lint

# 3. 仕様書内の表記統一確認（Phase 8 統一表記が崩れていないか）
grep -rn "running\|done\|error_status" docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/ || echo "OK: 表記揺れ 0"
grep -rn "trigger_type" docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/ | grep -vE "manual|cron|backfill" || echo "OK: trigger_type 値揺れ 0"

# 4. Cron スケジュール記述の一貫性
grep -rn "Cron\|cron" docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/ | grep -E "[0-9*/ ]+" | sort -u

# 5. quota 値の一貫性（500 req/100s/project が他値で書かれていないか）
grep -rn "req/100s\|req/分\|req/min" docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/

# 6. Progressive Disclosure 行数規約（200 行制限）違反チェック
find docs/30-workflows/ut-01-sheets-d1-sync-design/outputs -name '*.md' -type f \
  -exec sh -c 'wc -l "$1" | awk -v f="$1" "{ if (\$1 > 400) print f, \$1 }"' _ {} \;
# 期待: 仕様書 outputs は 400 行以内が望ましい（references の 200 行制限とは別の運用基準）

# 7. AC マトリクス整合（Phase 7 / Phase 8 の AC GREEN 維持）
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-07/ac-matrix.md
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-08/main.md

# 8. artifacts.json と phase-XX.md の整合
node -e "const a=require('./docs/30-workflows/ut-01-sheets-d1-sync-design/artifacts.json'); console.log(a.phases.map(p=>p.file).join('\n'))"

# 9. 不変条件 #5 遵守（apps/web から D1 直接アクセス記述が仕様書に紛れ込んでいないか）
grep -rn "apps/web" docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/ | grep -i "d1\|database" || echo "OK: apps/web → D1 直接アクセス記述 0"

# 10. クリーン状態確認
git status --porcelain docs/30-workflows/ut-01-sheets-d1-sync-design/
```

## 4 条件再評価

| 条件 | 観点 | 期待 | FAIL 時の戻り先 |
| --- | --- | --- | --- |
| 価値性 | 本仕様書のみで UT-09 が着手可能（AC-9）。設計手戻り削減効果が定量的に説明できる | PASS | Phase 1 / Phase 3（要件・代替案不足） |
| 実現性 | Cron Triggers / D1 / Sheets API のいずれも無料枠で完結（後段の見積もりで定量化） | PASS | Phase 2 / Phase 3（採択方式見直し） |
| 整合性 | 不変条件 #1 / #4 / #5 と整合 / aiworkflow-requirements references と整合 / 上流 3 タスク成果物と整合 | PASS | Phase 8（DRY / 外部正本リンク見直し） |
| 運用性 | Cron 間隔の運用調整余地 / バックフィル時の quota ヘッドルーム / sync_log 保持期間 / 二重実行防止 | PASS（with notes） | Phase 2 / Phase 12（運用調整は MINOR で残置可） |

## 不変条件 遵守確認

| # | 不変条件 | 本タスクでの遵守確認 | 判定方法 |
| --- | --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | Sheets→D1 マッピングはスキーマ層に閉じ、フォーム schema を直接参照しない設計になっているか | `outputs/phase-02/sync-method-comparison.md` / `sync-log-schema.md` を grep で「formId」「schema 直参照」が登場しないことを確認 |
| #4 | Google Form schema 外のデータは admin-managed data として分離 | Sheets 由来の admin-managed data の D1 配置方針が明文化されているか | `outputs/phase-02` 内に admin-managed data 配置の記述が存在することを確認 |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 同期ジョブは `apps/api` のみで実行する旨が固定されているか / 仕様書内に `apps/web` から D1 アクセスする記述がゼロであるか | 検証コマンド 9（grep）で 0 件確認 |

## Cloudflare Workers Cron Triggers 無料枠見積もり（pull 方式採択時）

### 1. Workers 実行回数（無料枠 100,000 req/day）

| Cron 間隔 | 1 日実行回数 | 月間実行回数 | 無料枠ヘッドルーム |
| --- | --- | --- | --- |
| 6h（base case） | 4 | 約 120 | 99.88% 余裕 |
| 1h（高頻度オプション） | 24 | 約 720 | 99.28% 余裕 |
| 5min（最高頻度オプション） | 288 | 約 8,640 | 91.36% 余裕 |

### 2. CPU 時間（無料枠 10ms/req のバースト + 50ms 上限）

| 観点 | 値 | 判定 |
| --- | --- | --- |
| Sheets API 取得（100 行 / batch） | 約 200ms〜1s（外部待ち） | I/O 待ちは CPU 時間にカウントされない |
| D1 書込（UPSERT 100 行） | 約 5〜20ms | 無料枠内 |
| ハッシュ計算（SHA-256 × 100 行） | 約 1〜5ms | 無料枠内 |
| 合計 CPU 時間（実行 1 回あたり） | 約 6〜25ms | 50ms 上限内 |

### 3. D1 書込量（無料枠 100,000 rows/day write）

| シナリオ | 1 日書込行数 | 無料枠ヘッドルーム |
| --- | --- | --- |
| 平常時（差分 10 行 × 4 回 / day） | 40 | 99.96% 余裕 |
| 月次フル同期（1,000 行 × 1 回 / month） | 約 33（月次平均化） | 99.97% 余裕 |
| バックフィル（1,000 行 × 1 回） | 1,000（一過性） | 99% 余裕（バックフィル日のみ） |

### 4. 結論

- 6h Cron + 100 行 batch + UPSERT 設計は **無料枠の 1% 未満** で完結
- 5 分粒度に縮小しても無料枠の 10% 未満
- バックフィル時の一過性負荷も無料枠内
- → **PASS**（実現性確定）

## Sheets API quota 上限見積もり

### 1. 平常時（6h Cron + 100 行 batch）

| 観点 | 値 | quota 比 |
| --- | --- | --- |
| 1 回実行の API 呼び出し数 | 1〜10 req（行数依存） | 0.2〜2% / 100s |
| 1 日の API 呼び出し数 | 4〜40 req | quota は 100s 単位なので per-day 比較不要 |
| ピーク 100s での想定 req 数 | 10 req（1 回の sync 実行内） | 2% / 500 req（98% ヘッドルーム） |

### 2. バックフィル時（1,000 行を 100 行 batch × 10 req）

| 観点 | 値 | quota 比 |
| --- | --- | --- |
| 連続 API 呼び出し数 | 10 req | 2% / 500 req |
| 100s 内に再実行された場合 | 20 req | 4% / 500 req |
| 障害復旧で 5 倍規模（5,000 行）バックフィル | 50 req | 10% / 500 req |

### 3. quota 超過リスク評価

| シナリオ | quota 超過確率 | 対策 |
| --- | --- | --- |
| 平常時 | 極低（< 1%） | Backoff 不要だが防御的に 1〜32s Backoff を残す |
| バックフィル単独 | 低（< 5%） | 100 行 batch + 並列度 1 で安全マージン確保 |
| 他プロジェクトと quota 共有 | 中（環境依存） | Service Account / API Key を UT-01 専用で確保（UT-03 引き継ぎ） |
| 複数 Cron が同時実行 | 低 | 二重実行防止（sync_log `in_progress` レコードで排他） |

### 4. 結論

- 平常時 / バックフィル時とも quota の 10% 以下で完結
- 同一 GCP プロジェクト内に他 API 利用がある場合は UT-03 で quota 配分を確認する義務（MINOR-M-Q-01 として記録）
- → **PASS**

## 一括判定ルール

| Gate | 期待 | FAIL 時の戻り先 |
| --- | --- | --- |
| typecheck | exit 0 | Phase 5 — docs-only で typecheck が壊れることは想定外。壊れた場合は別タスクの巻き込みを疑う |
| lint | exit 0 | Phase 5 — markdown lint で仕様書追記が引っかかる可能性あり |
| 表記統一（trigger_type / status） | grep 揺れ 0 | Phase 8 — DRY 化見直し |
| Cron スケジュール一貫性 | `0 */6 * * *` で統一 | Phase 8 |
| quota 値一貫性 | `500 req/100s/project` で統一 | Phase 8 |
| 行数規約 | outputs 配下 400 行以内 | Phase 2 / Phase 8 — 章立て分割 |
| 不変条件 #5 grep | 仕様書内 `apps/web` × D1 の組み合わせ 0 件 | Phase 2 — 設計見直し |
| AC マトリクス GREEN | 全件 PASS | 該当 Phase へ戻る |
| 4 条件再評価 | 全件 PASS（運用性は with notes 可） | 該当 Phase へ戻る |
| 不変条件 #1/#4/#5 遵守 | 全件 PASS | Phase 2 — 設計見直し |
| Cron 無料枠見積もり | 無料枠の 50% 以下 | Phase 3 — 採択方式見直し（hybrid 切替検討） |
| Sheets API quota 見積もり | 平常時 10% 以下 / バックフィル 50% 以下 | Phase 2 — batch サイズ見直し |

## 実行タスク

1. 検証コマンド 1〜10 を順次実行し、標準出力 / exit code を `outputs/phase-09/main.md` に取り込む
2. 4 条件再評価表を埋め、運用性の with notes 内容を MINOR に紐付ける
3. 不変条件 #1 / #4 / #5 の遵守確認を grep ベースで実施し結果を記録
4. Cron Triggers 無料枠見積もりを `outputs/phase-09/free-tier-estimation.md` に詳細記述（6h / 1h / 5min の 3 シナリオ）
5. Sheets API quota 上限見積もりを同ファイルに記述（平常時 / バックフィル / 障害復旧の 3 シナリオ）
6. quota 配分の MINOR-M-Q-01（UT-03 への申し送り）を Phase 3 MINOR 追跡テーブルに追記
7. AC-1〜AC-10 の各 AC に GREEN マークを Phase 7 マトリクスと連動して付与
8. Phase 10 最終レビューへの引き継ぎ事項を main.md に明記

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `outputs/phase-08/main.md` |
| 必須 | `outputs/phase-08/before-after.md` |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ |
| 参考 | https://developers.cloudflare.com/d1/platform/limits/ |
| 参考 | https://developers.google.com/sheets/api/limits |
| 参考 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/phase-09.md`（フォーマット模倣元） |

## 依存Phase明示

- Phase 4 成果物（テスト戦略）を参照する
- Phase 7 成果物（AC マトリクス）に GREEN を付与する
- Phase 8 成果物（DRY 化結果）を入力とする

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-09/main.md` | 検証コマンド標準出力ログ / 4 条件再評価結果 / 不変条件 #1/#4/#5 遵守確認 / 一括判定 / AC GREEN マトリクス / Phase 10 引き継ぎ |
| `outputs/phase-09/free-tier-estimation.md` | Cloudflare Workers Cron Triggers + D1 無料枠見積もり / Sheets API quota 上限見積もり / 3 シナリオ別ヘッドルーム |

`outputs/phase-09/main.md` および `outputs/phase-09/free-tier-estimation.md` は本 Phase 実行時に記入する。期待される章立ては以下：

### `outputs/phase-09/main.md` 期待章立て

1. メタ情報（タスク名 / Phase / visualEvidence=NON_VISUAL / taskType=docs-only）
2. 検証コマンド 1〜10 の実行ログ（標準出力 / exit code 取り込み）
3. 4 条件再評価表（価値性 / 実現性 / 整合性 / 運用性 + 根拠）
4. 不変条件 #1 / #4 / #5 遵守確認結果（grep 出力併記）
5. 一括判定結果（Gate 12 件の PASS / FAIL）
6. AC GREEN マトリクス（Phase 7 連動）
7. MINOR 追記（MINOR-M-Q-01: quota 配分 UT-03 申し送り）
8. Phase 10 最終レビューへの引き継ぎ事項

### `outputs/phase-09/free-tier-estimation.md` 期待章立て

1. Cloudflare Workers 実行回数（6h / 1h / 5min × 月間 / 無料枠比）
2. Workers CPU 時間（外部 I/O 除外 / D1 書込 / ハッシュ計算 / 合計 vs 50ms 上限）
3. D1 書込量（平常時 / 月次フル / バックフィル × 100,000 rows/day 上限）
4. Sheets API quota - 平常時（6h Cron + 100 行 batch）
5. Sheets API quota - バックフィル時（1,000 行 / 5,000 行）
6. quota 超過リスク評価（4 シナリオ）
7. 結論（無料枠完結 PASS / quota 配分 MINOR-M-Q-01）

各章は「実行時に記入」プレースホルダで開始し、実行時に上記 4 条件再評価セクションで提示した数値表を実測ベースで更新する。

## 完了条件 (DoD)

- [ ] 検証コマンド 1〜10 の標準出力 / exit code が `main.md` に記録済み
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0
- [ ] 表記統一 grep（trigger_type / status / Cron / quota）すべて 0 件
- [ ] 不変条件 #5 grep（apps/web × D1）0 件
- [ ] 4 条件再評価で全 PASS（運用性は with notes 可）
- [ ] 不変条件 #1 / #4 / #5 遵守確認で全 PASS
- [ ] Cron 無料枠見積もり（6h / 1h / 5min × 月間 / 無料枠比）が `free-tier-estimation.md` に記載
- [ ] Sheets API quota 見積もり（平常時 / バックフィル / 障害復旧）が同ファイルに記載
- [ ] AC-1〜AC-10 全件 GREEN
- [ ] MINOR-M-Q-01（quota 配分 UT-03 申し送り）が Phase 3 MINOR 追跡テーブルに追記済み
- [ ] FAIL 時の戻り Phase が `main.md` に明記済み

## 苦戦箇所・注意

- **`mise exec` 忘れ**: グローバル node で実行すると Node バージョン差で lint が別挙動になる。必ず `mise exec --` 経由で実行
- **無料枠見積もりの根拠不足**: 数値だけでなく、Cloudflare / Google 公式ドキュメントの URL とアクセス日を `free-tier-estimation.md` に明記し、後日の改版に追従できるようにする
- **quota 配分の見落とし**: GCP プロジェクトを他 API（Forms API / Drive API / OAuth）と共有する場合、Sheets API quota は実質的に少なくなる。MINOR-M-Q-01 で UT-03 へ申し送りを残し、本タスクで握りつぶさない
- **不変条件 #5 grep の偽陰性**: `apps/web` を直接 grep するだけでは「web 経由で API を叩いて API が D1 へ」のパターンを見逃す。仕様書の同期実行主体が **必ず apps/api scheduled handler のみ** であることを文章レベルで再確認する
- **行数規約の境界**: references 配下の 200 行制限は本タスク（仕様書 outputs）には適用されない。本タスクは 400 行を運用上限とし、超過時は章立て分割で対応する
- **with notes 判定の濫用**: 運用性「PASS（with notes）」は MINOR で追跡可能な範囲のみ許可。MAJOR レベルの懸念を with notes で流すと Phase 10 で No-Go になる

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パス 2 点と `artifacts.json` の outputs（`outputs/phase-09/main.md`）の整合を確認する。`free-tier-estimation.md` は補助成果物として `main.md` から参照リンクで紐付ける
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計タスクであり、アプリケーション統合テストは追加しない
- 統合検証は本 Phase の検証コマンド 1〜10 と Phase 11 NON_VISUAL smoke / `artifacts.json` 整合で代替する
- 下流実装（UT-09）の statging 実測で本見積もり値の検証を行う旨を MINOR-M-02（Phase 3 既存）に紐付ける

## 次 Phase

- 次: Phase 10（最終レビュー / Go-No-Go）
- 引き継ぎ: 検証ログ / 4 条件再評価結果 / 不変条件遵守確認 / 無料枠見積もり / quota 見積もり / AC GREEN マトリクス / MINOR-M-Q-01
