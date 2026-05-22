# Phase 12: ドキュメント同期 / 未タスク検出（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-11.md` 完了（evidence 揃い） |
| 出力 | ドキュメント影響棚卸し、未タスク検出結果 |

---

## 1. ドキュメント影響棚卸し

| 対象 | 影響 | 対応 |
|------|------|------|
| `CLAUDE.md` のシークレット管理セクション | なし。`CLAUDE.md` は「CI/CD シークレット = GitHub Secrets」として既に正しい記述。今回の修正は workflow 側を実体に整合させる作業で運用方針の変更ではない | 更新不要 |
| `CLAUDE.md` の「よく使うコマンド」 | なし。`bash scripts/cf.sh deploy ...` 既存記述のまま | 更新不要 |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/` | task-02 で新規作成予定。task-01 では作成しない | 更新不要（task-02 で対応） |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md` | サブタスク状態表（task-01 行）を Phase 13 後に `done` に更新 | Phase 13 後に編集 |
| `docs/00-getting-started-manual/specs/` | 該当なし。secret 名は GitHub Environment 側の運用詳細であり、システム設計仕様ではない | 更新不要 |
| 親 outputs (`outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` / `outputs/phase-3/phase-3.md`) | 該当なし。本 task は親 phase の実装である | 更新不要 |

---

## 2. 中学生レベルの概念説明（必須）

### 2.1 「secret 名 drift」とは何か

GitHub Actions では、ワークフロー（`.github/workflows/*.yml`）の中から「秘密の鍵（secret）」を呼び出すことができる。鍵には**名前**がついていて、ワークフロー側は名前で「この鍵を使いたい」と指定する。

今回の問題は:
- ワークフローは `CF_TOKEN_WORKERS_STAGING` という名前で鍵を呼ぼうとしていた
- ところが GitHub の保管庫には `CLOUDFLARE_API_TOKEN` という名前でしか鍵が置いていなかった

両者の名前がずれていた状態を **drift（ずれ）** と呼ぶ。GitHub は「そんな名前の鍵はないよ」とは教えてくれず、**空文字**を返す。空文字を受け取ったスクリプトは「鍵が無い」と勘違いして、別の手段（`op` というコマンド）で鍵を取りに行こうとし、CI の中には `op` が無いので失敗した。

### 2.2 修正の本質

「保管庫の鍵の名前」と「ワークフローが呼ぶ名前」を**同じにする**だけ。鍵そのものは何も変えない。

### 2.3 `Verify CF token is present` step の役割

「鍵が空っぽだった場合は、すぐに止まって理由を表示する」という見張り番。これがあると、再び drift が起きたときに「op が無い」のような遠回りなエラーではなく、「鍵が空です。`staging` 環境に `CLOUDFLARE_API_TOKEN` を登録してください」という直球なエラーが出る。

---

## 3. 未タスク検出

| 検出項目 | 結果 |
|---|---|
| `CF_TOKEN_WORKERS_*` を参照している他 workflow / コード | `grep -rn "CF_TOKEN_WORKERS" .github/ scripts/ apps/` で 0 件（`web-cd.yml` 編集後） |
| 関連未タスク | task-02（`runtime-smoke-staging` readiness gate）は本ワークフロー内で別仕様書として分離済み。**task-01 起因の追加未タスクなし** |
| backlog 候補 | Phase 8 §3 の BL-01..BL-03。本 PR では実施しない |

未タスク 0 件想定。

---

## 4. 状態遷移

本 cycle では `.github/workflows/web-cd.yml` のローカル実装と静的 evidence 取得までを実施し、commit / push / PR / dev runtime CI はユーザー承認待ちとする。そのため `artifacts.json#metadata.workflow_state` は `implemented_local_runtime_pending`、`implementation_status` は `implementation_complete_pending_runtime_ci` とする。

---

## 5. exit criteria

| # | 条件 |
|---|------|
| EX-01 | ドキュメント影響棚卸しが表で確定している |
| EX-02 | 中学生レベル概念説明（drift / 修正の本質 / Verify step 役割）が記述されている |
| EX-03 | 未タスク検出結果が記録されている（task-01 起因 0 件） |
| EX-04 | spec 状態遷移の手順が明示されている |
