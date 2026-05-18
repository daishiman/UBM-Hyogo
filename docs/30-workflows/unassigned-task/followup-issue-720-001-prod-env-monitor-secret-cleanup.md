# followup-issue-720-001 production environment monitor secret cleanup - タスク指示書

## メタ情報

```yaml
issue_number: 772
```

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | followup-issue-720-001-prod-env-monitor-secret-cleanup                        |
| タスク名     | `cf-audit-log-monitor.yml` 移行完了後の production environment 側 monitor secret 削除 |
| 分類         | 整理（Governance / Security cleanup）                                         |
| 対象機能     | GitHub Actions `production` environment / repository-level secrets           |
| 優先度       | 低（runtime 安定後の整理タスク・blocker なし）                                |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施（runtime stability 達成までブロック）                                  |
| 発見元       | issue-720-cf-audit-monitor-env-protection-fix / Phase 12 unassigned-task-detection |
| 発見日       | 2026-05-16                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-720 で `cf-audit-log-monitor.yml` から `environment: production` 1行を削除し、必要 secrets / variables を repository-level に同名複製する案B'を採用した。移行期間中は production environment 側の同名 secret を**残したまま** repo-level に複製することで rollback 可能性を確保している。runtime stability（workflow_dispatch dry_run 成功 + hourly schedule 6 連続 success）が達成された後、二重保持のままにすると以下の不整合が発生する。

- 同一 secret が production env / repository 両方に存在し、value rotation 時に片方更新漏れが起きる
- production environment scope を retain している意図が不明瞭になり、誰が・なぜそこに置いたかが追跡困難になる
- secret inventory（`gh secret list --env production` と `gh secret list`）の差分監査ノイズが増える

### 1.2 問題点・課題

- production environment 側の monitor secret は移行完了後 **deploy 系 workflow からも・monitor 系 workflow からも参照されない孤児状態** になる
- 削除は破壊的・user-gated 操作であり、Codex / Claude が自律実行することは禁止
- 削除タイミングを誤ると hourly snapshot が再 fail する（先に repo-level 投入とのレース）
- 移行期間が無期限に延びると security audit 上「未使用 secret 放置」を指摘される

### 1.3 放置した場合の影響

- secret rotation 手順が二重化し、運用負荷が恒常的に増加
- production environment secret が「読まれない」状態で残存し、incident 時の混乱要因（どちらが live か判別困難）になる
- security boundary documentation（`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の environment-separation ADR）と実態が乖離

---

## 2. 何を達成するか（What）

### 2.1 目的

issue-720 の runtime stability evidence（dry_run success + hourly 6 連続 success）が確定した後、production environment 側に残る monitor 専用 secret 群を user 承認のうえ削除し、repository-level 一本化を完了する。

### 2.2 最終ゴール

- production environment 側から以下の monitor 専用 secret が削除されている（実体名は移行時の inventory に従う）
  - `CF_AUDIT_D1_TOKEN_PROD`
  - `CF_AUDIT_TOKEN_PROD`
  - その他 `outputs/phase-02/secret-migration-plan.md` 列挙の monitor secret
- `gh secret list --env production` の出力に上記が含まれない evidence MD が `docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/outputs/phase-13/post-cleanup-secret-inventory.md` 相当に追記されている
- production environment は deploy 系 secret のみを保持する状態に整理されている
- `15-infrastructure-runbook.md` の environment-separation ADR に「移行完了 → cleanup 済」のステータス追記

### 2.3 スコープ

#### 含むもの

- production environment 側 monitor secret の削除（user 明示承認後のみ）
- 削除前後の `gh secret list --env production` / `gh secret list` 出力比較 evidence
- runbook ADR の cleanup-完了ステータス追記
- 削除後に hourly schedule が継続 success していることの 6h 観測 evidence

#### 含まないもの

- deploy 系 secret（`CLOUDFLARE_API_TOKEN` 等）の操作
- production environment 自体の branch policy / required reviewers 変更
- repository-level secret 側の value rotation
- 新規 monitor workflow 追加・既存 workflow yaml 変更

### 2.4 成果物

- post-cleanup secret inventory MD（before / after diff）
- runbook ADR のステータス更新 commit
- 6h continued success evidence MD

---

## 3. 実施可能になる条件（When）

以下すべてを満たすまで本タスクは**実行禁止**:

1. issue-720 root cause 修正 PR が `dev` → `main` にマージ済
2. `gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref main` が success
3. hourly schedule が **6 連続 success** を runtime evidence MD で記録済
4. D'+0 が user 宣言済（runbook 正本順序）
5. user が「production env secret cleanup を実行可」と明示承認

---

## 4. 苦戦箇所・知見（issue-720 サイクルでの学び）

将来同種タスクで再度ハマらないために、issue-720 で苦戦・判断に時間がかかった箇所を記録する。

### 4.1 GitHub Actions `environment:` の意味再解釈

`environment: production` は deployment gate（branch policy / required reviewers / wait timer）と secret scoping を同時に持つ二重責務であり、read-only monitor workflow に付与すると **branch policy が schedule trigger も縛る**。`dev` branch では起動不可になる挙動が直感に反する。判定 gate: workflow が deploy / mutation を伴わないなら `environment:` を付与しない。

### 4.2 repository-level secret の security boundary 広がり

repo-level secret は private repo の **全 workflow からアクセス可能**になる。本来 environment scope で隔離していた secret を repo-level に降ろすことは security boundary の意図的な拡大であり、ADR 明文化が必須（read-only 限定 / mutation-capable 不可）。

### 4.3 CLOSED Issue の fold-state sync

GitHub Issue #720 が CLOSED 済みであっても、原典 unassigned-task の MD が「未実施」のまま残っているケースでは、reopen せずに Phase 12 fold-state sync で `consumed_via_issue_720_followup_spec` 等のステータスを原典に同期する。reopen は workflow 状態管理と乖離を生む。

### 4.4 移行順序の厳格化

`(a) repo secret 投入 → (b) workflow yaml 差分 commit → (c) dry_run → (d) hourly 6h → (e) prod env 側削除` の順序を runbook に明文化。順序を入れ違えると最初の run が 401/403 fail し、復旧確認と root cause 切り分けが困難になる。

### 4.5 placeholder evidence と PASS の混同回避

Phase 11 の `PENDING_USER_GATE` placeholder と runtime PASS evidence を**別ファイル**に分離する。同一ファイルに後追い追記すると「いつ PASS したか」が監査不能になる。

### 4.6 D'+0 起算の責務分離

「6 連続 success = 安定性 evidence」と「D'+0 = root cause 修正 PR merge 後の最初 successful hourly run（user 宣言）」を**別概念**として分離。混同すると recovery workflow の close-out 条件が膨らむ。

---

## 5. 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/` | 親 workflow（runtime stability 達成後 `completed-tasks/` に移動予定） |
| 必須 | `docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/outputs/phase-02/secret-migration-plan.md` | 削除対象 secret 一覧の正本 |
| 必須 | `docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/outputs/phase-12/implementation-guide.md` | 移行手順・user-gated operation 一覧 |
| 必須 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | environment-separation ADR / cleanup-完了ステータス更新先 |
| 必須 | `CLAUDE.md` | secret 管理ルール（1Password / `scripts/cf.sh`） |
| 参考 | https://docs.github.com/en/actions/security-guides/encrypted-secrets#deleting-encrypted-secrets-for-an-environment | gh secret delete 仕様 |

---

## 6. 不変条件

1. 削除は **user 明示承認後のみ** Claude / Codex 実行可。自律削除禁止。
2. runtime stability evidence（hourly 6 連続 success）未達成の状態では本タスクに着手しない。
3. deploy 系 secret（mutation-capable）には触れない。monitor 専用 secret のみが対象。
4. 削除前に `gh secret list --env production` の inventory MD を必ず evidence として保存（before snapshot）。
5. 削除後 6h は hourly schedule の継続 success を monitor し、regression がないことを evidence として記録。
