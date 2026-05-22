# Lessons Learned — Issue #516 GitHub Audit Log Cross-Source Correlation（2026-05-07）

> task: `issue-516-github-audit-log-cross-source-correlation`（unassigned `U-FIX-CF-ACCT-01-DERIV-04-FU-04-github-audit-merge` から正式昇格）
> 関連 SSOT: `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`
> 関連 source: `apps/api/src/audit-correlation/`, `scripts/audit-correlation/`, `.github/workflows/audit-correlation-verify.yml`, `docs/runbooks/audit-correlation.md`
> 関連 reference: `references/workflow-issue-516-github-audit-log-cross-source-correlation-artifact-inventory.md`、`references/task-workflow-active.md`（issue-516 implemented-local 行）、`indexes/quick-reference.md`（Issue #516 早見）、`indexes/resource-map.md`（issue-516 canonical row）

## 教訓一覧

### L-516-001: cross-source correlation の join key は Phase 1 で **canonical input + redaction policy + salt 取扱い** を一表で確定する

- **背景**: 当初の Phase 1 仕様素案では fingerprint 入力を `email|ip|ua` の 3 要素 hash としていたが、Phase 5 実装中に「同一 actor の IP 急変を HIGH severity として検知する要件」と矛盾することが判明した（IP を hash 入力に含めると同一 actor の IP 変化で別 group に分かれてしまう）。Phase 1 へ巻き戻し、`canonical = "email|<localPart>|<domain>"`（fallback `"network|<ipPrefix>|<uaBucket>"`）に改訂し、IP 変化は group 内 timeline で検知する設計へ修正した。
- **教訓**: cross-source security correlation タスクは Phase 1 で次の 4 点を **同一表** で確定すること: ① redact-safe な canonical input、② 環境別 salt の取扱い（1Password / Cloudflare Secrets 注入、repo に実値を置かない）、③ persisted vs forbidden field の区分、④ severity 判定で参照する「変動前提のフィールド」（IP / UA など）。これを Phase 1 で固めずに Phase 5 で気付くと、types / redact / correlate / fixture / bats 全ての書き直しが発生する。
- **将来アクション**: `task-specification-creator` の Phase 1 テンプレートに「cross-source correlation の join key 確定表」をオプション追加し、`taskKind: implementation` かつ「security signal / log analysis」タグが付いたタスクで Phase-12 strict 検証項目に組み込む（skill-feedback-report.md「テンプレ改善」反映）。

### L-516-002: NON_VISUAL × fixture-only MVP は Phase 11 evidence の代替体系を **2x2 boundary 表** で明示する

- **背景**: 本タスクは `NON_VISUAL`（CLI のみ）かつ live credential out-of-scope（fixture-only MVP）。Phase 11 で「ブラウザ screenshot は無い」「production audit log を読まない」という二重の境界条件が重なり、Phase 12 strict 検証時に「production smoke が無いのは fail なのか」「fixture log で evidence 充足とみなしてよいのか」の判断が遅延した。最終的に `outputs/phase-11/` に typecheck / lint / vitest / bats / shellcheck / actionlint / grep-gate / coverage / high-alert-sample.json / build を揃え、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で確定した。
- **教訓**: `NON_VISUAL` × `live credential out-of-scope` の重畳タスクでは Phase 1 / Phase 11 / Phase 12 で **2x2 boundary 表（fixture vs live × implementation vs operation）** を必須化する。各セルに「今 cycle で証跡を揃えるもの」「runtime_pending_user_approval として template 化するもの」「out-of-scope として follow-up へ送るもの」を明記する。これが無いと Phase 12 close-out で boundary 解釈が割れる。
- **将来アクション**: `task-specification-creator` の `phase-11-non-visual-alternative-evidence.md` に「fixture-only MVP × NON_VISUAL の 2x2 表 template」を追記する（skill-feedback-report.md「ワークフロー改善」反映）。

### L-516-003: redaction の grep-gate は salt literal も pattern に組み込み、salt rotation 時の更新責務を明文化する

- **背景**: `scripts/audit-correlation/grep-gate.sh` は出力 JSON の PII / secret を検出する CI gate だが、当初 pattern は IPv4 / IPv6 / email / UA / PAT のみで、`AUDIT_CORRELATION_SALT` の literal 漏洩検知を含めていなかった。Phase 11 review で「salt そのものが output に紛れ込むケース（debug print 残骸など）」を grep で捕捉できないと salt rotation 設計（FU-03）が機能しないことが判明し、`grep -F` で salt literal を runtime 注入する pattern を追加した。
- **教訓**: redaction gate は「保存禁止フィールド」を全て pattern 化し、特に **環境注入 secret は runtime literal で grep に渡す**こと。さらに salt rotation を行う follow-up を pre-warn しておかないと、rotation 時に grep pattern 更新が漏れて gate が silent pass する。
- **将来アクション**: SSOT `references/audit-correlation.md`「Redaction Policy」表に salt の grep-gate 連動責務を明記済み。FU-03（salt rotation 自動化）の起票時に「grep-gate pattern 更新」を Phase 1 必須項目として継承する。

### L-516-004: Phase 12 example の index 拡張子は **実在ファイルに合わせて `.md`** に統一する

- **背景**: Phase 12 documentation 草案で `resource-map.json` / `topic-map.json` の表記を一部に残していたが、当 repo では canonical index は `indexes/{quick-reference.md, resource-map.md, topic-map.md, keywords.json}` の構成であり、`.json` は `keywords.json` のみ。`resource-map.json` / `topic-map.json` は存在しない。Phase 12 audit で「stale wording」として検出し、全て `.md` 表記に統一した。
- **教訓**: skill 横断 reference を書く Phase 12 ドキュメントは、実在 index ファイルの拡張子を verify した上で記述する。template 由来の stale 表記を rebuild 経由でコピーしない。
- **将来アクション**: `task-specification-creator` の Phase 12 example で `resource-map.md` / `quick-reference.md` / `topic-map.md` を default 表記とし、`.json` 表記は `keywords.json` 言及時のみに限定する（skill-feedback-report.md「ドキュメント改善」反映）。

## メタ

- workflow root: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`
- source unassigned: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-github-audit-merge.md`（formalized_by_issue_516）
- upstream: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`
- Phase-12 verdict: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING（strict 7 files / 4 conditions all PASS）
- 同一 wave 同期完了日: 2026-05-07
- deferred follow-ups: FU-01 live endpoint / FU-02 branch protection required check / FU-03 salt rotation / FU-04 D1 persistence
