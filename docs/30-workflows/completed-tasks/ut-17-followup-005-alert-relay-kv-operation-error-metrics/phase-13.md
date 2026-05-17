# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR・振り返り |
| タスク | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| GitHub Issue | #701（OPEN、`Refs` として参照、`Closes` は使わない） |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | `blocked` |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 判定根拠 | Phase 1-12 で完成した「`alert-relay.ts` 構造化ログ実装 + spec 拡張 + runbook 追記 + 正本同期」を 1 PR に集約し、`dev` ブランチへのマージ準備を完了させる最終 Phase |

---

## 目的

Phase 1-12 の全成果物（コード + テスト + runbook + 設計書 + skill 同期）を 1 PR に集約し、`dev` ブランチへの merge 準備を完了させる。

> ⚠️ **承認ゲート**: 本 Phase は **multi-stage user approval gate (G1-G4)** を必須とする。CLAUDE.md「PR作成の完全自律フロー」が適用される依頼（「PR作成」「PR出して」「diff-to-pr」等）の場合のみ確認質問を挟まずに G1〜G3 まで自律実行し、それ以外はユーザーから明示承認を G1〜G3 各段階で得る。G4 (merge) は **常に user が GitHub UI で実行**する。

---

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| PR タイトル | `feat(api): structured logging for alert-relay KV get/put failures (#701)` |
| ベースブランチ | `dev`（CLAUDE.md「既定ブランチは dev」遵守） |
| 作業ブランチ | `feat/ut-17-followup-005-alert-relay-kv-op-metrics`（または同等の slug） |
| PR 種別 | feature（コード実装あり / NON_VISUAL） |
| 関連 Issue | `#701`（Refs として参照） |

---

## 13-2. PR 本文構成案

PR 本文は以下 6 セクションで構成する（`outputs/phase-13/pr-summary.md` が正本）。

### Summary（3-5 行）

```md
## Summary

- `apps/api/src/routes/internal/alert-relay.ts` の Cloudflare KV `get` / `put` 失敗を構造化 JSON ログ 1 行で emit
- `KV.get` 例外は従来 fail-closed throw だったが、本 PR で **fail-open + log** に変更（Slack 配信は継続、観測可能化）
- 後段 dashboard (UT-17-FU-006 候補) が消費するための **log schema を本 PR で契約固定**
- 既存 HTTP レスポンス shape / dedup hit 挙動 / put 失敗時の `dedupPersisted=false` 維持
- 月次 runbook に「KV 操作エラーログ確認」セクション追記
```

### 変更点リスト（CONST_005 / 3 ファイル）

```md
## 変更ファイル

### apps/api（編集）
- `src/routes/internal/alert-relay.ts`
  - module top で `isolateId = crypto.randomUUID()` を 1 回採番
  - module-local helper `logKvOperationError(op, err, dedupeKey)` を追加
  - `KV.get` 呼び出しを try/catch 化（fail-closed throw → fail-open + log）
  - `KV.put` の既存 catch ブロックを `console.warn(JSON.stringify(...))` ベースの構造化ログ emit に置換
- `src/routes/internal/__tests__/alert-relay.spec.ts`
  - 4 ケース追加: (a) `KV.get` throw → fail-open + 構造化ログ 1 行、(b) `KV.put` throw → 既存レスポンス維持 + 構造化ログ 1 行、(c) 成功 path で `console.warn` 0 回、(d) payload 6 field 完全一致 assertion

### docs（編集）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
  - 「KV 操作エラーログ確認」セクション追記
  - `bash scripts/cf.sh tail --env <env> | grep alert_relay_kv_op_failed` の検索例
  - log schema field 定義表（6 field: `event` / `op` / `errorClass` / `dedupeKeyHash` / `isolateId` / `ts`）
```

### log schema 全文（後段 dashboard 契約）

```md
## Log Schema（後段契約）

\```json
{
  "event": "alert_relay_kv_op_failed",
  "op": "get" | "put",
  "errorClass": "<err.constructor.name or typeof err>",
  "dedupeKeyHash": "<SHA-256(dedupeKey) hex 先頭 12 文字>",
  "isolateId": "<module top で採番した uuid v4>",
  "ts": "<ISO8601 UTC>"
}
\```

- `console.warn` 経由で **1 行 JSON** として emit される
- `dedupeKey` raw は PII non-leak の観点から hash に短縮（先頭 12 hex = 48bit）
- `isolateId` は同一 isolate 内の 2 emit で一致する（emit ごとに採番しない）
- field 追加は後方互換 (additive) のみ許容、削除・rename は禁止（CONST_007 / 不変条件 7）
```

### behaviour change の明示

```md
## Behaviour Change

| 項目 | Before | After |
| --- | --- | --- |
| `KV.get` 例外 | fail-closed（request 全体が 500 で落ちる、Slack 未配信、ログなし） | **fail-open**（dedup を諦めて Slack 配信続行、構造化ログ 1 行 emit） |
| `KV.put` 例外 | 既存 catch で `console.warn` 非構造化文字列 1 行（grep しづらい）、`{ ok: true, dedupPersisted: false }` 返却 | 構造化 JSON 1 行 emit に置換、`{ ok: true, dedupPersisted: false }` 返却（HTTP shape 不変） |
| HTTP レスポンス shape | `{ ok, deduped }` / `{ ok, attempts, dedupPersisted }` / 502 | **完全不変** |

> `KV.get` の fail-closed → fail-open 化は Phase 3 設計レビュー Gate-A で承認済。背景: 一時的 KV 障害で Slack 配信が止まる方が運用インパクト大。重複配信は後段 dashboard で検出可能化する。
```

### テスト結果サマリ

```md
## Test Results

### Local
- `mise exec -- pnpm typecheck` PASS（`outputs/phase-11/evidence/typecheck.log`）
- `mise exec -- pnpm lint` PASS（`outputs/phase-11/evidence/lint.log`）
- `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay` PASS（追加 4 ケース含む、`outputs/phase-11/evidence/test.txt`）
- grep gate: `alert_relay_kv_op_failed` リテラルが alert-relay.ts / alert-relay.spec.ts / runbook の 3 点で同期（`outputs/phase-11/evidence/grep-gate.txt`）

### Runtime（staging external ops / user-gated）
- staging deploy 後の `wrangler tail | grep alert_relay_kv_op_failed` による実 emit 1 行確認は post-merge external ops で取得（本 PR では `contract_ready_runtime_pending` 状態）
```

### Refs

```md
## Refs

- Issue: #701
- 親タスク: UT-17 `docs/30-workflows/ut-17-cloudflare-analytics-alerts/`
- 先行タスク: UT-17-FU-002（completed-tasks 配下）
- 後続候補: UT-17-FU-006（dashboard 化、本 PR で log schema を契約固定）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 13-3. 振り返り観点（KPT 形式）

| 観点 | 内容 |
| --- | --- |
| **Keep** | 構造化ログを最初から JSON 1 行に固定したことで、後段 dashboard 化 (UT-17-FU-006) が log schema 変更不要で着手可能になった。「ログ schema は後段契約」という方針を Phase 2 設計時点で固めたのが効いた |
| **Keep** | `dedupeKeyHash` を `SHA-256` 先頭 12 hex に短縮することで、PII non-leak と grep 可能性を両立。raw key を出さない設計判断は再利用価値あり |
| **Problem** | 原典 unassigned-task の test path 記述が `__tests__/alert-relay.test.ts` だったが、CLAUDE.md 不変条件 8 (`*.spec.ts` 縛り) と乖離していた。Phase 1 要件定義段階で発見し補正したが、unassigned-task 起票時点で `*.spec.ts` 縛りを check list 化すべき（skill-feedback-report.md に記載） |
| **Problem** | 現コード `KV.get` に try/catch が無いことに、原典仕様作成時には気付けていなかった。Phase 2 設計時にコード実体読み直しで判明し、behaviour change（fail-closed → fail-open）の意思決定が必要になった。原典作成時のコード grep を必須化すべき |
| **Try** | 次の followup (UT-17-FU-006 dashboard) では、本タスクで固定した log schema (`event` / `op` / `errorClass` / `dedupeKeyHash` / `isolateId` / `ts`) を**契約として固定**し、Logpush → Analytics Engine の集計クエリを実装する。schema 変更不要で着手できる前提を維持する |
| **Try** | 構造化ログ helper のパターン（module top で `isolateId` 採番 + JSON 1 行 emit）を `apps/api` 内の他 route にも展開できるか Phase 13 振り返り後に検討する。例: webhook 受信ハンドラ / OAuth callback など |

---

## 13-4. multi-stage approval gate（G1〜G4）

本タスクは behaviour change を伴う（`KV.get` fail-closed → fail-open）ため、Phase 13 を **4 段階の user 明示承認 gate** で進める。AI が autonomous に commit/push しない（CLAUDE.md「PR作成の完全自律フロー」適用時を除く）。

### Gate G1: commit 承認

| 項目 | 内容 |
| --- | --- |
| 対象 | `git add` 範囲確定 + `git commit` 実行 |
| user 明示承認内容 | (1) commit 対象ファイルが 3 ファイル（`alert-relay.ts` / `alert-relay.spec.ts` / `runbook`）+ 仕様書群に限定されている、(2) `apps/web` / `packages/` / `wrangler.toml` / `env.ts` への混入なし、(3) コミットメッセージ案: `feat(api): structured logging for alert-relay KV get/put failures (refs #701)` |
| 自動実行可能条件 | CLAUDE.md「PR作成の完全自律フロー」が適用される依頼の場合のみ確認質問なしで実行 |
| ブロック条件 | dirty-code gate FAIL / placeholder token 残置 / typecheck or lint or test の FAIL |

### Gate G2: push 承認（dev base branch 同期込み）

| 項目 | 内容 |
| --- | --- |
| 対象 | `git fetch origin dev` + ローカル `dev` を `origin/dev` に fast-forward + 作業ブランチへ `dev` を merge + `git push -u origin <feature-branch>` |
| user 明示承認内容 | (1) merge コンフリクト 0、または解消方針が CLAUDE.md「コンフリクト解消の既定方針」に従い妥当、(2) push 先 remote が `origin` であり main ではない |
| 自動実行可能条件 | G1 と同じ |
| ブロック条件 | コンフリクト未解消 / push 先 branch が `main` |

### Gate G3: PR 作成承認

| 項目 | 内容 |
| --- | --- |
| 対象 | `gh pr create --base dev --title "feat(api): structured logging for alert-relay KV get/put failures (#701)" --body <pr-summary.md content>` |
| user 明示承認内容 | (1) PR base が `dev`（`main` ではない）、(2) PR 本文に log schema 全文と behaviour change 表が含まれている、(3) `Refs #701` 記載（`Closes #701` は使わない）、(4) 機密値（secret token / 実 webhook URL / 実メールアドレス）が PR 本文・コミット・コードに含まれていない |
| 自動実行可能条件 | G1 と同じ |
| ブロック条件 | base 誤り / 機密値混入 / log schema 欠落 |

### Gate G4: PR merge

| 項目 | 内容 |
| --- | --- |
| 対象 | GitHub UI で PR を `dev` に merge |
| 実行者 | **常に user（AI は実行しない）** |
| 前提条件 | CI required status checks 全 PASS / 会話解決必須化 (`required_conversation_resolution`) クリア |
| 自動実行可能条件 | **なし**（CLAUDE.md「PR作成の完全自律フロー」適用時でも G4 merge は user 手動） |
| ブロック条件 | CI FAIL / conversation 未解決 |

---

## 13-5. post-merge アクション

PR が `dev` にマージされた後、以下を実施する:

| # | アクション | 担当 |
| --- | --- | --- |
| 1 | `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md` を `docs/30-workflows/completed-tasks/` 配下へ `git mv` | 手動 |
| 2 | staging deploy: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | プロジェクトオーナー |
| 3 | staging で KV binding 一時無効化シナリオを実行し、`bash scripts/cf.sh tail --env staging \| grep alert_relay_kv_op_failed` で実 emit 1 行を取得。`outputs/phase-11/evidence/runtime-staging.log` に追記（follow-up PR） | プロジェクトオーナー |
| 4 | runtime evidence 取得完了後、`artifacts.json` の `implementation_status` を `implementation_completed_external_ops_pending` → `completed` に更新（follow-up PR） | 手動 |
| 5 | production deploy: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | プロジェクトオーナー |
| 6 | dev → main 昇格 PR を別途作成（CLAUDE.md「main は dev→main リリース時のみ」） | 別タスク |

---

## 13-6. 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17-FU-006 dashboard 化（候補） | 本 PR で固定した log schema を契約として消費 | 後続タスク（schema 変更不要で着手可） |
| UT-17 親 workflow | observability 補強の差分通知 | post-merge で 1 行コメント追記のみ |
| ut-17-followup-001 / 002 / 003 / 004 PR | 独立。並走 / 順次どちらも可 | 先行マージ側に rebase で追従 |

---

## 完了条件

- [ ] G1 (commit) で user 明示承認を得ている、または CLAUDE.md「PR作成の完全自律フロー」適用条件が成立している
- [ ] G2 (push) で user 明示承認を得ている、または同上
- [ ] G3 (PR 作成) で user 明示承認を得ている、または同上
- [ ] G4 (merge) は **user が GitHub UI で実行**することが PR 本文 / 振り返りで明示されている
- [ ] ローカルチェック全 PASS（typecheck / lint / test / grep gate / 機密値 grep 0 件）
- [ ] PR が GitHub 上に作成され URL が `outputs/phase-13/pr-summary.md` 末尾に記録されている
- [ ] PR base が `dev` である（`main` ではない）
- [ ] PR タイトルが `feat(api): structured logging for alert-relay KV get/put failures (#701)` である
- [ ] PR 本文に `Refs #701` が記載されている（`Closes #701` ではない）
- [ ] PR 本文に log schema 全文 + behaviour change 表 + 6 field 定義が含まれている
- [ ] 機密値（secret token / 実 webhook URL / 実メールアドレス）が PR 本文 / コミット / コードに含まれていない
- [ ] 振り返り (KPT) が `outputs/phase-13/pr-summary.md` 内または別ファイルに記録されている

---

## タスク 100% 実行確認【必須】

- [ ] G1〜G3 の 3 gate で user 明示承認（または PR 自律フロー適用）が成立
- [ ] G4 merge は user 手動実行が明示されている
- [ ] PR URL が `outputs/phase-13/pr-summary.md` 末尾に記録されている
- [ ] post-merge アクション 6 件のうち #1（unassigned-task 移動）の `git mv` コマンド文が用意されている
- [ ] runtime evidence 取得 (#3) は post-merge external ops として明示分離されている
- [ ] `apps/web` / `packages/` への変更混入が 0 件

---

## 参照

- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-13.md`（NON_VISUAL Phase 13 フォーマット参考）
- `outputs/phase-12/implementation-guide.md`（PR 本文「変更ファイル / log schema / 検証コマンド / DoD」の元データ）
- `outputs/phase-12/unassigned-task-detection.md`（post-merge unassigned-task 移動の元データ）
- CLAUDE.md「PR作成の完全自律フロー」「ブランチ戦略」「Cloudflare 系 CLI 実行ルール」
- index.md AC-1〜AC-10（受入条件）

---

## 次 Phase

- なし（Phase 13 が最終 Phase）
- post-merge: 13-5 の 6 アクションを実施
- ブロック条件: G1〜G3 のいずれかで user 承認が得られない / ローカルチェック FAIL / 機密値混入 / `apps/web` 変更混入 / `wrangler` 直接実行履歴混入の場合は実行しない

## 実行タスク

commit / push / PR はユーザー明示承認後にのみ実行する。現サイクルでは PR 本文案と user-gated runtime evidence の引き継ぎを作る。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-12/implementation-guide.md` | PR 本文元データ |
| 必須 | `outputs/phase-11/evidence/*.txt` | local evidence |

## 成果物/実行手順

Phase 13 は `blocked` state とし、user approval なしに git commit / push / PR を実行しない。
