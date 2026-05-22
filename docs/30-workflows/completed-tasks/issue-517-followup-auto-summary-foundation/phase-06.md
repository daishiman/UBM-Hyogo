# Phase 6: 異常系

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系（trigger / 検知手段 / 期待挙動 / exit code / リカバリ） |
| 作成日 | 2026-05-07 |
| 前 Phase | 5（仕様 runbook） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | spec_created |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |
| タスク分類 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #517（CLOSED 維持） |

## 目的

Phase 5 雛形が producer する 8 種の異常パスを (1) trigger、(2) 検知手段、(3) 期待挙動、(4) exit code、(5) リカバリ手順、(6) 機微情報露出ゼロ保証の 6 軸で固定する。alert / retry の実装は本タスクスコープ外であることを明示し、GitHub Actions 標準通知に依存する範囲も明記する。

---

## 1. 異常系シナリオ表

| # | シナリオ | trigger | 検知手段 | 期待挙動 | exit code | job 結果 | Slack 通知 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E-1 | 30 日 gate 不成立 | 最古 schedule run.createdAt > today - 30d | `is_30day_gate_satisfied` 判定 false | stdout `skipped: 30-day gate not satisfied (oldest=...)` 出力後、副作用なしで終了 | 0 | success | 送信なし |
| E-2 | `gh run list` 失敗（rate limit / network） | 401 / 403 / 5xx / TLS error 等 | `gh run list ... > runs.json` の非 0 終了 / aggregate_runs の jq parse 失敗 | error log を stderr。後続 step を実行しない | 2 / 64 | failure | 送信なし |
| E-3 | 同月内既存 PR 存在 | `find_existing_pr "$YYYYMM"` が非空 URL を返す | gh pr list `in:title` 検索で 1 件以上 | stdout `skipped: existing PR found ($URL)` 出力後、副作用なしで終了 | 0 | success | 送信なし |
| E-4 | Slack Webhook 失敗（4xx/5xx） | curl が非 2xx | `curl -sS -f` 非 0 終了 / post_slack return 3 | stderr に `curl: ...`。PR は残置（既起票成功） | 3 | failure | 送信失敗 |
| E-5 | redaction trigger（機微情報行検出） | summary JSON に `token=` / `Bearer ` / `secret:` / `Authorization:` のいずれかが含まれる | redact_log の sed 置換 hit | 該当行を `(redacted: <pattern>)` に置換し継続。stderr に hit 件数 | 0 | success | 送信あり（redacted 後 payload） |
| E-6 | dry-run mode | `--dry-run` flag / `dry_run: true` input | `DRY_RUN=true` | step 11〜13 を全スキップし stdout に PR_BODY / SLACK_PAYLOAD 出力 | 0 | success | 送信なし |
| E-7 | workflow YAML syntax error | YAML 構文不正で commit | GitHub Actions の workflow load 段階で失敗 | workflow 起動せず Actions UI に error 表示 | n/a | failure | 送信なし |
| E-8 | permissions 不足（`contents: write` / `pull-requests: write` 欠落） | YAML から削除 / token scope 不足 | `git push` または `gh pr create` の 403 | stderr に 403。push / PR 作成失敗 | 非 0（gh の exit code に従う） | failure | 送信なし |

### 1-1. 失敗時の残置物

| シナリオ | 残置物 |
| --- | --- |
| E-2 | `tmp/30day-summary/runs.json`（途中 / 空）。次回実行で上書き |
| E-4 | draft PR（既起票）+ branch（push 済）。次月の実行は重複検出で skip |
| E-7 | 残置なし |
| E-8 | branch 未 push / PR 未起票（前段で fail） |

---

## 2. リカバリ手順 / 再実行ガイド

### 2-1. 手動再実行

```bash
# GitHub Actions UI から再実行
gh workflow run post-release-30day-auto-summary.yml \
  -f dry_run=false

# dry-run 確認のみ
gh workflow run post-release-30day-auto-summary.yml \
  -f dry_run=true
```

### 2-2. シナリオ別リカバリ

| シナリオ | 手順 |
| --- | --- |
| E-2（gh API 失敗） | `gh auth status` で token 確認 → `gh workflow run` で再実行（rate limit は数分待機） |
| E-4（Slack 失敗） | 1. `gh secret list` で `SLACK_WEBHOOK_URL` 設定確認<br>2. 1Password の Webhook URL が valid か確認<br>3. PR は既存なので `find_existing_pr` で次回 silent skip。Slack だけ手動投稿しても可 |
| E-7 | YAML 修正 → 再 commit → push |
| E-8 | YAML の `permissions:` を least-privilege に戻す → workflow 再実行 |

### 2-3. 同月再起票が必要なケース

draft PR を意図的に閉じて再起票したい場合:

```bash
# 既存 draft PR を close
gh pr close <PR_NUMBER>

# branch を削除
git push origin --delete auto/post-release-30day-summary-202605

# 再実行（同月でも find_existing_pr が空を返すため起票される）
gh workflow run post-release-30day-auto-summary.yml
```

---

## 3. アラート設計（本タスクスコープ範囲）

**alert / retry の実装は本タスクスコープ外**（issue body 明示 / CONST_007）。本タスクでは GitHub Actions 標準の以下の通知メカニズムに依存する:

| 通知種別 | 起動条件 | 受信者 |
| --- | --- | --- |
| GHA workflow failure email | job 失敗時（exit 非 0） | リポジトリ owner（GitHub 設定の email） |
| Slack 通知（成功時のみ） | 30 日 gate 成立 + PR 起票成功 | Slack channel `w1618436027-ek2505248` |

将来的な拡張（retry policy / alert routing / Slack failure 通知）は **別 issue** で扱う。本仕様書では `phase-01.md` 「含まない」セクションに既記載。

### 3-1. 失敗時に運用者が気付くまでの導線

1. GitHub Actions UI > workflow runs に failure run が並ぶ
2. GitHub から workflow failure email が届く（GitHub 個人設定で notification 有効が前提）
3. 翌日 cron が自動再実行 → 一過性失敗なら自然回復

---

## 4. 機微情報露出ゼロ保証

### 4-1. 多層防御

| 層 | 防御内容 | 実装位置 |
| --- | --- | --- |
| 1 | `SLACK_WEBHOOK_URL` は GHA Secrets 経由のみ流入 | workflow YAML `env:` |
| 2 | `post_slack` 内で `set +x`、curl の `--data` を log に echo しない | `30day-summary.sh` |
| 3 | redaction（4 パターン）を集計 → PR body 生成の前に適用 | `redact_log` |
| 4 | dry-run 時の Slack payload は `https://example.invalid/dry-run` ダミー URL のみ stdout | エントリポイント dry-run 分岐 |
| 5 | grep audit を Phase 4 検証で必ず実行（PR body / Slack payload の双方） | `outputs/phase-11/evidence/redaction-grep-audit.log` |

### 4-2. grep audit 期待結果

```bash
bash scripts/post-release-dashboard/30day-summary.sh --dry-run \
  | grep -E '(token=|Bearer |secret:|Authorization:)' \
  | wc -l
# 期待: 0
```

0 でない場合は **MAJOR**（Phase 6 ゲートで実装側を Phase 5 に差し戻す）。

### 4-3. webhook URL 露出パスの遮断確認

| 露出可能性のあるパス | 遮断手段 |
| --- | --- |
| script 内の echo / printf | `post_slack` 内の `set +x` + URL は変数経由のみ |
| GHA log の env dump | step に `env` コマンドを書かない |
| PR body / Slack payload | redaction 4 パターンが webhook URL の `secret` キーワードを hit させる（多層防御） |
| README / docs | 「Slack channel: w1618436027-ek2505248」のみ記載、URL は記載しない |
| commit log | `op read` で動的注入し、commit に値を含めない |

---

## 5. 異常系テストの追加方針

Phase 4 TC-01〜TC-07 では base case の主要分岐をカバーした。本 Phase で識別した異常系のうち、以下は将来的に fixture 追加で補強する候補（必須は TC-07 silent skip / TC-03 redaction trigger / TC-06 dry-run の 3 件で base case 充足）:

| 候補 TC | 異常系シナリオ | 実装容易度 |
| --- | --- | --- |
| TC-08（任意） | E-2 gh run list 失敗 stub | gh 関数を `return 1` で stub |
| TC-09（任意） | E-4 Slack 失敗 stub | curl 関数を `return 1` で stub |
| TC-10（任意） | E-3 重複 PR 検出（別月既存） | 別 YYYYMM の PR を返す stub で空文字を確認 |

これらは Phase 9 品質保証で「カバレッジ補強として追加」する余地があれば実装し、必須ではない。

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | E-1〜E-8 の異常パス 8 件が trigger / 検知 / 期待挙動 / exit code / リカバリで網羅。運用者が GHA 標準 email + 翌日 cron で復旧可能 |
| 実現性 | PASS | alert / retry の自前実装を持ち込まず、GitHub Actions 標準と silent skip 設計だけで運用成立 |
| 整合性 | PASS | exit code 0 / 2 / 3 / 64 が Phase 5 表と完全一致。redaction の多層防御と Phase 4 grep audit が連動 |
| 運用性 | PASS | リカバリ手順が個別シナリオごとに明示。同月再起票の手順も提供 |

---

## DoD（Phase 6）

- [ ] 異常系シナリオ E-1〜E-8 が表で網羅
- [ ] 各シナリオの exit code が Phase 5 表と一致
- [ ] リカバリ手順 / 再実行コマンドが個別シナリオに紐付け
- [ ] alert / retry がスコープ外であることが明示
- [ ] 機微情報露出ゼロを多層防御 5 層で保証
- [ ] grep audit 期待結果（0 件）が記述
- [ ] 4 条件評価が全 PASS

---

## 次 Phase への引き渡し

- 次 Phase: 7（AC マトリクス）
- 引き継ぎ事項:
  - 異常系シナリオ E-1〜E-8（AC-1 / AC-4 / AC-5 / AC-7 / AC-8 へマップ）
  - grep audit 期待結果（AC-5 evidence）
  - リカバリ手順（Phase 11 で参照）
- ブロック条件:
  - exit code 表が Phase 5 と乖離
  - 機微情報露出可能性の 1 層でも残存
