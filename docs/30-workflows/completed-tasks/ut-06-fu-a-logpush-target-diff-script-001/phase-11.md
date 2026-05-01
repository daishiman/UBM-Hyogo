# Phase 11: 手動テスト検証（NON_VISUAL 縮約）

## NON_VISUAL 縮約適用宣言【冒頭必須】

> **本 Phase は NON_VISUAL 縮約テンプレを適用する。**
>
> 適用根拠:
> - **visualEvidence = NON_VISUAL**（正本仕様 §1 メタ情報）
> - **taskType = implementation**（observability target 差分検証 script の追加）
> - 本 script は **CLI 出力のみ** を生成し、エンドユーザー向け UI を一切提供しない
> - production observability 設定の変更 / 旧 Worker 削除 / Logpush sink 変更は本タスクスコープ外（読み取り専用 script のみ）
> - したがって **screenshot は不要**。golden output diff / redaction grep（token / secret / sink URL pattern が含まれないこと）/ `bash scripts/cf.sh` 経由実行ログ（key 名のみ）が一次証跡となる
>
> 参照: `.claude/skills/task-specification-creator/references/phase-template-phase11-detail.md` の NON_VISUAL 縮約節 / Phase 10 R-10。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | observability target 差分検証 script 追加 (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト検証（NON_VISUAL 縮約） |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (最終レビュー / ユーザー承認ゲート) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | infrastructure-tooling（manual / non-visual / implementation） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（Phase 10 で取得済み） |

## 目的

Phase 5 で設計した observability target 差分検証 script が以下条件を満たして動作することを、NON_VISUAL 代替 evidence で確認する:

1. `bash scripts/cf.sh` 経由の読み取り専用 API 呼び出しのみで完結（destructive 呼び出し 0 件）
2. golden output ファイルとの diff が一致（再現性確保）
3. redaction が token 値・secret 値・sink URL 実値を全件マスク（grep 0 件）
4. 出力に key 名 / Worker 名 / target 種別のみが残る

実 observability 設定変更・実 Logpush sink 切替・production deploy は本 Phase で実施しない。

## 実行タスク

1. script を local で実行し、golden output ファイルと diff 比較を行う。
2. script 出力を redaction grep（token / OAuth / sink URL pattern）にかけ 0 件確認。
3. `bash scripts/cf.sh` 経由実行ログ（key 名のみ）を採取。
4. shell code block 内の行頭 `wrangler` 直接実行が script 内・spec 内ともに 0 件であることを確認。
5. observability 設定変更呼び出しが script 内に含まれないことを grep 確認。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Script | `scripts/observability-target-diff.sh`, `scripts/lib/redaction.sh` | 検証対象 script |
| Golden | `tests/golden/{diff-mismatch.md,usage.txt}` | 比較用 golden output |
| Phase 11 template | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | NON_VISUAL evidence |
| CLI rule | `CLAUDE.md` | wrapper / secret hygiene |

## screenshot 不要の N/A 理由テーブル

| シナリオ | screenshot が想定されるケース | 本タスクでの状態 | N/A 理由 |
| --- | --- | --- | --- |
| UI 画面の視覚回帰 | アプリ画面のレイアウト・色・テキスト | 該当なし | apps/web の UI を変更しない（CLI script の追加のみ） |
| ダッシュボード表示確認 | Cloudflare ダッシュボード Logpush 画面の目視 | 代替 evidence で対応 | API or `cf.sh` 出力（redaction 後）で記録、画面 PNG 不要 |
| エラーモーダル | 5xx 画面 / 認証エラー画面 | 該当なし | UI なし |
| ブラウザ動作確認 | tail / log の流れる様子 | 該当なし | script は標準出力のみ |
| 多デバイス確認 | mobile / desktop での表示 | 該当なし | UI なし |

> **結論**: 本 Phase の検証対象は CLI 出力 / golden ファイル diff / grep 結果のみで完結し、視覚的回帰・UI 状態を持たない。`outputs/phase-11/screenshots/` ディレクトリは作成しない。

## 代替 evidence 一覧

| ID | 代替 evidence 名 | 取得コマンド / 手段 | 採取先 | 値の取り扱い |
| --- | --- | --- | --- | --- |
| E-1 | manual run log | `bash scripts/cf.sh observability-diff ...` | `outputs/phase-11/manual-run-log.md` | Worker 名 / target 種別のみ。token / secret / sink URL は **redaction 済み** |
| E-2 | diff sample | script 出力の redacted markdown | `outputs/phase-11/diff-sample.md` | 構造的差分のみ記録 |
| E-3 | redaction verification | `bash tests/unit/redaction.test.sh` + grep audit | `outputs/phase-11/redaction-verification.md` | 期待: token-like pattern 0 件 |
| E-4 | cf.sh tail cross-check | `bash scripts/cf.sh tail ...` と Worker 名整合を確認 | `outputs/phase-11/cf-sh-tail-cross-check.md` | key 名のみ、実 token なし |
| E-5 | Phase 11 summary | 実行結果集約 | `outputs/phase-11/main.md` | NON_VISUAL evidence の入口 |

## 検証手順

### ステップ 1: script local 実行（読み取り専用）

1. `bash scripts/cf.sh whoami` で認証確認（E-1）。token 値は表示・転記しない。
2. `bash scripts/cf.sh observability-diff --legacy-worker <旧Worker名> --current-worker ubm-hyogo-web-production` を実行し、出力を `outputs/phase-11/manual-run-log.md` に記録（E-1）。
3. 出力内に token / secret / sink URL の実値が **含まれていない** ことを目視確認（次ステップで grep 自動検証）。

### ステップ 2: golden output 比較

1. `tests/golden/observability-target-diff/expected.json`（または expected.md）と script 実行結果を diff。
2. 環境依存の timestamp / request ID 等は redaction で `<TIMESTAMP>` / `<REQ_ID>` 等のプレースホルダに置換されているため、diff は構造的差異のみ検出する設計。
3. diff 結果を `outputs/phase-11/golden-output-diff.md` に記録（E-3）。0 件を期待。
4. 差異がある場合は構造的相違（追加 / 削除 / 変更）のみ記述し、再現可能な原因（旧 Worker 名相違など）を明記。

### ステップ 3: redaction grep（実値混入チェック）

```bash
# token / OAuth / api key / Logpush sink URL pattern の混入を grep
grep -rnE "(eyJ[A-Za-z0-9_-]{10,}|ya29\.[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|https://[^[:space:]]*logpush[^[:space:]]+|r2://[^[:space:]]+|s3://[^[:space:]]+|https://[^[:space:]]*\.amazonaws\.com[^[:space:]]+)" \
  docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-11/
```

- 期待: 一致 0 件
- 結果を `outputs/phase-11/redaction-grep.md` に記録（E-4）

### ステップ 4: wrangler 直呼び・destructive 呼び出し grep

```bash
# wrangler 直呼び（コメント行除外）
grep -rnE "^[^#]*wrangler " scripts/observability-target-diff.sh scripts/lib/redaction.sh | grep -v 'scripts/cf.sh'

# observability 書き換え系
grep -rnE "(secret put|deploy|logpush (create|update|delete))" scripts/observability-target-diff.sh scripts/lib/redaction.sh
```

- 期待: 両方とも 0 件
- 結果を `outputs/phase-11/manual-verification-log.md` §wrangler-grep / §destructive-grep に記録（E-6 / E-7）

### ステップ 5: cf.sh ラッパー実行ログ整理

- diff script 実行の出力を `outputs/phase-11/manual-run-log.md` に **key 名のみ** で記録。
- 実行コマンド / 実行日時 / 終了コード / 出力先パスを記述。token / secret / sink URL は記録しない。

## セキュリティガード【厳守】

| 禁止事項 | 理由 | 検証方法 |
| --- | --- | --- |
| `.env` の中身を `cat` / `Read` / `grep` 等で表示・読み取らない | AI コンテキストへの実値混入防止（CLAUDE.md「禁止事項」） | grep `Read.*\.env` が 0 件 |
| API Token 値・OAuth トークン値・secret 値・Logpush sink URL を出力やドキュメントに転記しない | 実値漏洩防止 | E-4 redaction grep で 0 件 |
| `wrangler login` でローカル OAuth トークンを保持しない | `.env` op 参照に一本化（CLAUDE.md「禁止事項」） | CLAUDE.md ルール再掲のみ |
| `bash scripts/cf.sh` 以外の `wrangler` 直接実行 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」違反 | E-6 grep で 0 件 |
| observability 設定の書き換え呼び出し（secret put / deploy / logpush create/update/delete） | 読み取り専用スコープ違反 | E-7 grep で 0 件 |
| golden output ファイルに環境依存実値を残す | 再現性破壊 / 値漏洩 | golden ファイル目視 + redaction grep |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の検証列に E-1〜E-7 のパスを記入 |
| Phase 10 | GO 判定の前提として本 Phase の代替 evidence 全件採取を確認 |
| Phase 12 | 検証で判明した運用知見を `unassigned-task-detection.md` / `skill-feedback-report.md` に登録 |
| 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 | observability diff の自動化として spec を申し送り |

## 多角的チェック観点

- 価値性: golden output diff で route cutover 後の observability split-brain を再現性ある形で検出可能か。
- 実現性: 読み取り専用 API のみで完結し、observability 設定への副作用が 0。
- 整合性: CLAUDE.md「wrangler 直接実行禁止」「`.env` 実値非保持」と矛盾なし。E-6 grep で 0 件。
- 運用性: redaction で全パターンマスク、再実行で同 golden に収束。
- 認可境界: token 値・OAuth token 値・sink URL が一切ファイルに残らない。
- Secret hygiene: E-1〜E-7 すべて key 名 / アカウント名 / マスク値のみで構成。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | NON_VISUAL 縮約適用宣言 | 11 | spec_created | 冒頭必須 |
| 2 | screenshot 不要 N/A 理由テーブル | 11 | spec_created | 5 シナリオ |
| 3 | 代替 evidence 一覧（E-1〜E-7） | 11 | spec_created | 7 件 |
| 4 | script local 実行 | 11 | spec_created | E-1 / E-2 |
| 5 | golden output 比較 | 11 | spec_created | E-3 |
| 6 | redaction grep | 11 | spec_created | E-4 |
| 7 | wrangler 直呼び grep | 11 | spec_created | E-6 |
| 8 | destructive 呼び出し grep | 11 | spec_created | E-7 |
| 9 | cf.sh ラッパー実行ログ整理 | 11 | spec_created | E-1 / E-2 統合 |
| 10 | セキュリティガード遵守確認 | 11 | spec_created | 6 禁止事項 |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | 取得手段 | 採取先 | 値の取り扱い | 採取済 |
| --- | --- | --- | --- | --- |
| E-1 whoami | `bash scripts/cf.sh whoami` | outputs/phase-11/cf-sh-wrapper-execution-log.md §1 | アカウント名のみ | TBD |
| E-2 diff script 実行 | `bash scripts/cf.sh observability-diff ...` | outputs/phase-11/cf-sh-wrapper-execution-log.md §2 | redaction 後 | TBD |
| E-3 golden diff | `diff` コマンド | outputs/phase-11/golden-output-diff.md | 構造的差異のみ | TBD |
| E-4 redaction grep | grep ワンライナー | outputs/phase-11/redaction-grep.md | 0 件期待 | TBD |
| E-5 manual log | 手動記録 | outputs/phase-11/manual-verification-log.md | 環境 + 結果 | TBD |
| E-6 wrangler 直呼び grep | grep | outputs/phase-11/manual-verification-log.md §wrangler-grep | 0 件 | TBD |
| E-7 destructive grep | grep | outputs/phase-11/manual-verification-log.md §destructive-grep | 0 件 | TBD |

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | observability 設定の書き換えは本 script スコープ外 | 設定変更による検証 | 親 UT-06-FU-A 配下の手動オペレーション |
| 2 | `bash scripts/cf.sh` ラッパー未対応 API（Logpush jobs list 等）が必要な場合は別途ラッパー拡張が必要 | API 網羅性 | Phase 12 unassigned-task 候補 |
| 3 | golden output の自動更新ワークフロー未整備 | 旧 Worker rename 時に手動更新必要 | Phase 12 unassigned-task 候補 |
| 4 | CI（GitHub Actions）への組込は別タスク | 自動定期実行 | Phase 12 unassigned-task 候補 |
| 5 | NON_VISUAL のため screenshot 不要、CLI 出力 + grep が一次証跡 | 視覚証跡なし | 代替 evidence E-1〜E-7 で補完 |
| 6 | production observability ターゲット（Logpush sink）の URL 変更は本 script で検出するが書き換えはしない | 切替実行 | 別オペレーション |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | 検証実施サマリー / N/A 理由 / 代替 evidence 一覧 / 既知制限 |
| ログ | outputs/phase-11/manual-run-log.md | E-1 手動実行ログ |
| 比較 | outputs/phase-11/diff-sample.md | E-2 redacted diff sample |
| grep | outputs/phase-11/redaction-verification.md | E-3 redaction 検証 |
| 実行ログ | outputs/phase-11/cf-sh-tail-cross-check.md | E-4 cf.sh / tail cross-check |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` 含む 5 ファイル（main + manual-run-log + diff-sample + redaction-verification + cf-sh-tail-cross-check）が `outputs/phase-11/` 配下に揃っている
- [ ] **NON_VISUAL 縮約適用宣言**が Phase 11 冒頭に記載されている
- [ ] screenshot 不要の N/A 理由テーブル（5 シナリオ）が記述
- [ ] 代替 evidence E-1〜E-7 すべての placeholder が manual evidence テーブルに列挙
- [ ] 検証手順（local 実行 / golden 比較 / redaction grep / wrangler grep / destructive grep）が 5 ステップで記述
- [ ] セキュリティガード 6 項目が遵守されている
- [ ] E-3 golden output diff が 0 件
- [ ] E-4 redaction grep で実値混入 0 件
- [ ] E-6 wrangler 直呼び grep で 0 件
- [ ] E-7 destructive 呼び出し grep で 0 件
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] すべての CLI が `bash scripts/cf.sh` 経由
- [ ] 既知制限が 6 項目以上列挙

## タスク 100% 実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 代替 evidence E-1〜E-7 のパス placeholder が `outputs/phase-11/` 配下に配置される設計
- AC1〜AC5 の検証採取手順が定義済み
- observability 設定書き換え / deploy / 実 sink URL 切替が本 Phase スコープ外であることが明記
- `scripts/cf.sh` 経由必須が明記
- artifacts.json の Phase 11 entry が `spec_created` で、completion 時に `completed` へ更新可能

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - E-1〜E-7 採取で得られた知見を Phase 12 `unassigned-task-detection.md` / `skill-feedback-report.md` に渡す
  - 既知制限 #2（cf.sh 拡張）/ #3（golden 自動更新）/ #4（CI 組込）を unassigned-task として formalize
  - script 完成度（golden diff 0 / redaction grep 0）を Phase 12 implementation-guide へ転記
- ブロック条件:
  - manual evidence 7 項目に未採取 / 未 N/A 化が残っている
  - E-4 redaction grep で実値検出
  - E-6 wrangler 直呼び grep で検出
  - E-7 destructive 呼び出し grep で検出
  - golden output diff が構造的相違以外で fail
  - `screenshots/` ディレクトリが誤って作成されている
