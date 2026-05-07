# Phase 1: 要件定義 / redact-safe join key SSOT 確定 / GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| Source | `outputs/phase-1/phase-1.md` |
| 区分 | 設計（実装なし。ただし fingerprint hash 仕様の決定が後続全 phase の前提） |
| 想定所要 | 0.5 人日 |

## 目的

cross-source correlation の SSOT を確定する。最重要は「redact-safe な join key とは何か」を文書化すること。親タスクで actor_email / actor_ip を全 redact した結果 join key を失う手戻りが起きたため、本 phase で hash 種別 / salt 管理 / 導出ルール / PII 非保存ポリシーを最初に決め切る。

## 実行タスク

1. **redact-safe join key の定義**
   - hash 種別: `SHA-256`（Web Crypto API `crypto.subtle.digest('SHA-256', ...)` で算出）。
   - salt: per-environment salt（staging / production で別値）。値は Cloudflare Secrets `AUDIT_CORRELATION_SALT` 経由で注入し、リポジトリには絶対に出力しない。
   - 入力組合せ: email がある場合は `email|<localPart>|<domain>`、email が無い場合は `network|<ipPrefix>|<uaBucket>` を canonical input とする。
     - `normalizedActorEmail`: `lower(trim(local-part))` と domain を hash 入力に使う。local-part 平文は保存禁止、domain は別カラム `actorDomain` として保存可。
     - `truncatedIpPrefix`: IPv4 は `/24`、IPv6 は `/48` までで切り捨て。完全 IP は保存禁止。email があるイベントでは hash 入力に含めず、IP 急変検知用の副情報として保持する。
     - `userAgentBucket`: UA 文字列は保存せず `chrome|safari|firefox|edge|curl|gha-runner|other` のラベル化のみ保持。
   - 出力: `fingerprintHash`（64 hex 文字、SHA-256）と `fingerprintVersion`（algo 変更時の互換性管理用整数、初期値 `1`）。

2. **GitHub Org Owner 権限の前提条件確認**
   - `audit_log` scope が必要であり、PAT は 1Password `op://CloudflareSecurity/GitHubAuditPAT/credential` に登録する想定。
   - 本タスクの fixture verify までは PAT を**使わない**（fixture 駆動）。live wiring は後続 follow-up。

3. **PII 非保存ポリシー**
   - 保存禁止: secret 値、full IP、full UA、actor_email の local-part 平文。
   - 保存可: `fingerprintHash`、`actorDomain`、`ipPrefix`（/24 または /48）、`userAgentBucket`、event timestamp、event type。

4. **GO/NO-GO 判定**
   - GO 条件: 上記 3 項目（join key / 権限前提 / PII ポリシー）が文書化済みかつ Phase 2 アーキテクチャ設計に進める状態。
   - NO-GO 条件: salt 管理経路が確定しない、または fingerprint 入力組合せに保存禁止項目が混入。

## 統合テスト連携

Phase 4 の vitest で「fingerprint hash の決定論性」「salt 違いで hash が異なる」「保存禁止項目が出力に含まれない」契約テストを書く。Phase 7 の grep gate で `secret` / 完全 IPv4 / 完全 IPv6 / 完全 email / salt literal / `User-Agent:` プレフィクス完全文字列を CI 恒久検出する。

## 参照資料

- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-github-audit-merge.md`
- GitHub REST API: `GET /orgs/{org}/audit-log`
- Cloudflare Audit Logs（Issue #408）の正規化済み schema。current canonical root は `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`（不在時は本 phase 内で fallback 仕様を仮置き）
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」

## 成果物

- `outputs/phase-1/phase-1.md`（決定事項を箇条書きで記述）
  - 決定事項 1: hash algo = SHA-256 / version = 1
  - 決定事項 2: salt 管理 = Cloudflare Secrets `AUDIT_CORRELATION_SALT`（per-env）
  - 決定事項 3: 入力組合せ = email あり `email|localPart|domain` / email なし `network|ipPrefix|uaBucket`
  - 決定事項 4: 保存可 / 不可リスト
  - 決定事項 5: GO 判定根拠

## 完了条件（DoD）

- [ ] redact-safe join key の hash algo / salt 管理 / 入力組合せが文書化されている。
- [ ] PII 非保存ポリシー（保存可 / 不可）が表形式で明示されている。
- [ ] GitHub Org Owner 権限 / PAT 入手経路の前提が明記されている（live wiring は本タスク対象外を明示）。
- [ ] Phase 2 着手の GO 判定根拠が記載されている。
