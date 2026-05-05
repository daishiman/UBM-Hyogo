# Phase 4: テスト作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production observability target diff script (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成 |
| 作成日 | 2026-05-02 |
| 前 Phase | 3 (設計レビューゲート) |
| 次 Phase | 5 (実装) |
| 状態 | spec_created |
| タスク分類 | test-design（unit + golden output + redaction contract） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #329 |

## 目的

Phase 2 / 3 で確定した script interface（入力: Cloudflare Workers / Tail / Logpush / Analytics Engine target inventory、出力: redacted markdown diff）と redaction logic（token-like / sink URL / dataset credential を出力禁止、host / dataset / worker name のみ許可）を、Phase 5 実装前に **検証可能なテストケース** として固定する。本 Phase はテスト本体（`*.test.ts` / `*.bats` 等）を実装するのではなく、**ケース ID / 入力 fixture / 期待 output / redaction 不変条件** を仕様レベルで設計し、Phase 5 で TDD 同等の手順を実行可能にすることが目的である。

## 真の論点

- 「script を動かすこと」ではなく、**「あらゆる Cloudflare API 応答 / observability binding 形態に対して、token / secret / sink credential が一切出力に混入しないことを golden output で機械検証できるテストケース集を確定すること」** が真の論点。
- 副次的論点として、旧 Worker 名（rename 前 entity）と新 Worker 名 `ubm-hyogo-web-production` の両方を fixture に含め、diff 検出ロジックが取りこぼし無くカバーされること。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | Phase 2 設計成果物 (`outputs/phase-02/script-interface-design.md` / `redaction-design.md` / `target-inventory-design.md`) | script I/F・redaction rule・対象 4 軸（Workers Logs / Tail / Logpush / Analytics Engine）の inventory 抽出方法 | テストケース集（TC-01〜TC-08） |
| 上流 | Phase 3 GO 判定 (`outputs/phase-03/main.md`) | 設計レビュー PASS | テスト設計の前提固定 |
| 上流 | 親タスク `route-secret-observability-design.md` | 旧 Worker 名 / 想定 observability binding | fixture 入力データ |
| 並列 | なし | - | - |
| 下流 | Phase 5 実装 | TC-01〜TC-08 の golden output 雛形 | script 実装と golden 一致確認 |
| 下流 | Phase 6 テスト拡充 | 異常系拡張対象一覧 | TC-09 以降の追加 |
| 下流 | Phase 7 カバレッジ | AC × TC トレース表 | カバレッジ最終判定 |

## テストケース一覧

| TC ID | 目的 | カバーAC | 種別 |
| --- | --- | --- | --- |
| TC-01 | 新 Worker のみ（旧 Worker 残存なし）= clean state | AC-1 | golden |
| TC-02 | 旧 Worker 名が Tail target に残存 | AC-1, AC-3 | golden / diff |
| TC-03 | 旧 Worker 名が Logpush job に残存 | AC-1, AC-3 | golden / diff |
| TC-04 | 旧 Worker 名が Analytics Engine binding に残存 | AC-1, AC-3 | golden / diff |
| TC-05 | Logpush sink URL に bearer token が含まれる入力 → 出力で redact | AC-2 | redaction contract |
| TC-06 | Workers Logs binding に dataset credential が含まれる → 出力で redact | AC-2 | redaction contract |
| TC-07 | API plan 制限で Logpush が取得不可（403） → fallback 文言 + dashboard 確認導線 | AC-3 | error handling |
| TC-08 | `bash scripts/cf.sh` ラッパー経由実行・直接 wrangler 呼び出し時 fail-fast | AC-5 | execution path |

### TC-01: clean state

| 項目 | 内容 |
| --- | --- |
| 入力 fixture | `tests/fixtures/observability-clean.json`（4 軸すべて新 Worker `ubm-hyogo-web-production` のみを target） |
| 期待 output | `tests/golden/observability-clean.md`（旧 Worker section が空 / 新 Worker section に 4 軸の binding が列挙 / token-like 文字列 0 件） |
| 不変条件 | output 全文に `secret` / `token` / `bearer` / `Authorization` 文字列が含まれない |

### TC-02〜TC-04: 旧 Worker 残存検出

| 項目 | 内容 |
| --- | --- |
| 入力 fixture | TC-02: Tail に旧名 / TC-03: Logpush job に旧名 / TC-04: Analytics に旧名 |
| 期待 output | `legacy_targets` 節に旧 Worker 名 + 該当軸 + binding 識別子（host / dataset 名のみ）を列挙 |
| 不変条件 | 旧 Worker 名そのものは出力可（diff 目的のため） / sink URL の query string / token は redact |

### TC-05〜TC-06: redaction contract

| 項目 | 内容 |
| --- | --- |
| 入力 fixture | sink URL に `?token=ya29.<長いトークン>` を含む / dataset binding に credential field |
| 期待 output | `?token=<REDACTED>` / `credential: <REDACTED>` |
| 不変条件 | token 値の prefix / suffix / 長さ・hash すら出力しない（grep で `ya29\.` / `^Bearer ` / 32桁hex 等が 0 件） |

### TC-07: plan 制限 fallback

| 項目 | 内容 |
| --- | --- |
| 入力 fixture | Logpush API が 403 を返す mock |
| 期待 output | `logpush_targets` 節に `fallback: dashboard manual check required (URL: https://dash.cloudflare.com/<account>/workers/logpush)` |
| 不変条件 | account ID は redact、dashboard URL placeholder のみ |

### TC-08: 実行経路の fail-fast

| 項目 | 内容 |
| --- | --- |
| 入力 | `wrangler` 直呼び（ラッパー外）で script を実行 |
| 期待 output | exit code != 0 / stderr に `Use bash scripts/cf.sh wrapper (CLAUDE.md rule)` |
| 不変条件 | `op run` 経由 token 注入が無いと fail-fast |

## redaction 不変条件（全 TC 共通）

- token-like pattern（`ya29\.`, `sk-[A-Za-z0-9]{20,}`, `^Bearer `, 32桁hex UUID, JWT 三段構造）が出力に含まれない
- sink URL の query string / fragment は丸ごと redact
- `Authorization` / `X-Auth-*` / `*-Token` headers の value は redact
- account ID / zone ID は最後 4 桁のみ表示（`<REDACTED>...XXXX`）
- 出力の最大行数 / バイト数は `MAX_OUTPUT_BYTES = 64KB` を超えない

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-04/main.md` | TC-01〜TC-08 の設計サマリー |
| ドキュメント | `outputs/phase-04/golden-output-spec.md` | golden output 雛形と redaction unit assertions |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | TC-01〜TC-08 を Phase 5 で実装するテストファイル（`tests/observability-target-diff/*.test.ts` 想定）にマップ |
| Phase 6 | 異常系拡張（TC-09: timeout / TC-10: 部分応答 / TC-11: 大量 binding）を追加 |
| Phase 7 | AC × TC × golden カバレッジ matrix で 100% カバーを確認 |
| Phase 11 | NON_VISUAL evidence として golden 一致 / redaction grep 結果を転記 |

## 制約

| # | 制約 | 順守方法 |
| --- | --- | --- |
| C-1 | 本 Phase はテスト本体実装をしない（ケース仕様のみ） | 出力は `outputs/phase-04/main.md` と `golden-output-spec.md` のみ |
| C-2 | fixture / golden に実 production の token / secret を書かない | 全 token は `ya29.MOCK...` のような明示モック値 |
| C-3 | `wrangler` 直呼びを fixture / golden に書かない | コマンド例は `bash scripts/cf.sh` のみ |
| C-4 | 旧 Worker 名は親タスク `route-secret-observability-design.md` の固有名詞のみ使用 | 推測命名禁止 |

## リスクと対策

| リスク | 対策 |
| --- | --- |
| redaction pattern 抜け漏れ（新たな token 体系） | TC-05/TC-06 で正規表現テストを継続的に拡張 / Phase 6 で追加 |
| API plan 差で Logpush 取得不可 | TC-07 で fallback 経路を golden 化 |
| fixture が実 API 形式と乖離 | Phase 5 実装時に `bash scripts/cf.sh` の dry-run 出力で fixture を再キャリブレーション |

## 完了条件チェックリスト

- [ ] TC-01〜TC-08 が ID / 入力 / 期待 output / 不変条件 の 4 項目で完成
- [ ] redaction 不変条件 5 項目が全 TC に適用されている
- [ ] AC-1〜AC-5 が TC で 1 件以上カバーされる（AC × TC トレース表）
- [ ] fixture / golden に実 token / secret が含まれていない
- [ ] `wrangler` 直呼びが fixture / golden / コマンド例に 0 件
- [ ] 出力先 2 ファイルが `outputs/phase-04/` 配下に予約されている

## 多角的チェック観点

- 価値性: token / secret 漏洩を出力レベルで遮断する不変条件が機械検証可能か
- 整合性: AC-1〜AC-5 と TC が 1:1 以上でマップされているか
- 運用性: golden 更新時の review 手順が明確か（Phase 6 / Phase 8 で再利用可能か）
- セキュリティ: redaction 不変条件 5 項目に抜けがないか

## 次 Phase への引き継ぎ事項

- TC-01〜TC-08 を Phase 5 実装の TDD ガイドとして使用
- golden output spec を Phase 5 で生成される実 golden file の正本とする
- 異常系（timeout / 部分応答 / 大量 binding）は Phase 6 で TC-09 以降として追加
- ブロック条件:
  - fixture / golden に実 token が混入
  - `wrangler` 直呼びが TC コマンド例に残存
  - AC が未カバー
