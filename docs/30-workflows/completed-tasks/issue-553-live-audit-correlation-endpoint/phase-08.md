# Phase 8: governance / NON_VISUAL secret hygiene / salt rotation runbook

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| Source | `outputs/phase-8/phase-8.md` |
| 区分 | governance / 確認 / 文書化 |
| 想定所要 | 0.5 人日 |

## 目的

live wiring 化に伴い増える「Cloudflare Secrets / Slack incoming webhook URL / GitHub PAT / fingerprint salt」の流出経路を governance レイヤーで遮断し、salt rotation と `fingerprintVersion` またぎ運用を runbook と SSOT (`.claude/skills/aiworkflow-requirements`) に書き切ることで、後続 oncall が「rotation 中の incident は旧 / 新どちらの hash 系列か」を即時判断できる状態を作る。

親 Issue #516 では rotation 手順が後追い章として Phase 8 に追加された。本 Issue では Phase 1 で確定した内容を Phase 8 で governance 観点に再投影し、CI grep gate / D1 schema 列毎の保存可否表 / SSOT 反映を一括で確定する。

## 実行タスク

1. **secret literal grep gate の live mode 拡張**（`.github/workflows/audit-correlation-verify.yml` の Phase 7 編集分の governance 観点レビュー）
   - 既存検出パターン: `ghp_` / `github_pat_` / `AUDIT_CORRELATION_SALT=`
   - live mode で追加する検出パターン:
     - `https://hooks.slack.com/services/` （Slack incoming webhook URL の literal）
     - `xoxb-` / `xoxp-` （Slack bot/user token の prefix。本 Issue で使う incoming webhook では本来不要だが、誤って bot token が混入したケースの保険）
     - `Bearer ghp_` / `Bearer github_pat_`（HTTP header literal が source / log / D1 row に流出していないか）
     - `AUDIT_CORRELATION_INTERNAL_TOKEN=` （internal token literal）
   - grep 対象: `apps/api/src/audit-correlation` / `apps/api/src/routes/audit-correlation` / `scripts/audit-correlation` / `docs/runbooks/audit-correlation.md` / Phase 11 で取得する staging D1 dump (`outputs/phase-11/d1-grep-gate.log`)。

2. **salt rotation 手順（fingerprintVersion=1 → 2 移行）の runbook 章追加**
   - `docs/runbooks/audit-correlation.md` に「salt rotation 運用」節を追加。記載必須項目:
     1. 旧 salt（v1）と新 salt（v2）を**並列保有する dual-read 期間**を最小 1 cron interval（15 分）×4 = 60 分確保する。
     2. `apps/api/src/audit-correlation/run-correlation.ts` は `fingerprintVersion` を環境変数 `AUDIT_CORRELATION_FINGERPRINT_VERSION`（既定 `1`）で受け取り、`audit_correlation_findings` row には常に `fingerprint_version` 列を埋める。
     3. dual-read 期間中は **新旧両方の hash で並列保存**する（同一 incident に対し v1 row と v2 row が並ぶ）。重複は `fingerprint_hash_prefix + fingerprint_version + observed_at` で識別。
     4. dual-read 期間終了後、`AUDIT_CORRELATION_FINGERPRINT_VERSION=2` に切り替え、旧 v1 secret を `bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT_V1 --env production`（rotation 後 30 日保持）として退避保管する。30 日経過で削除。
     5. rotation の trigger 条件: PAT 漏洩疑義 / salt 漏洩疑義 / セキュリティ監査要請 / 365 日経過（定期 rotation）。
   - rotation 中の Slack 通知: payload に `fingerprintVersion` を必須フィールドとして含め、oncall が hash 系列を識別できるようにする。

3. **fingerprintVersion またぎ運用（旧 v1 incident と新 v2 incident の紐付け）**
   - 同一 incident が rotation 跨ぎで v1 / v2 両方の row として残った場合、運用上は以下で紐付ける:
     - 第 1 join key: `actor_domain + ip_prefix + ua_bucket + observed_at±5min`（redact-safe フィールドのみ。actor email local-part / full IP / full UA は使わない）
     - 第 2 join key: 同一 GitHub `audit_log` `_document_id`（GitHub side のみ。Cloudflare side では `incident_id`）
   - runbook には「v1 / v2 row が同一 incident かどうかは redact-safe フィールド一致 + `_document_id` 一致で oncall が判断する。自動 join はしない（FU-03 の責務）」と明記する。

4. **PII 非保存契約の再確認（D1 schema 列毎の保存可 / 不可表）**

   `audit_correlation_findings` table:

   | 列名 | 型 | 保存可否 | 理由 / 備考 |
   | --- | --- | --- | --- |
   | `id` | INTEGER PK | 保存可 | 内部 surrogate key |
   | `fingerprint_hash_prefix` | TEXT (8 chars) | 保存可 | hash の先頭 8 文字のみ。元の email/ip/ua は復元不能 |
   | `fingerprint_version` | INTEGER | 保存可 | rotation 識別用 |
   | `actor_domain` | TEXT | 保存可 | email local-part を含まない domain 部のみ（例: `example.com`） |
   | `ip_prefix` | TEXT | 保存可 | IPv4 は `/24`、IPv6 は `/48` でマスクした prefix |
   | `ua_bucket` | TEXT | 保存可 | `Chrome/Mac` 等の bucket 化済み文字列 |
   | `severity` | TEXT | 保存可 | `LOW` / `MEDIUM` / `HIGH` |
   | `event_type` | TEXT | 保存可 | `login_fail` / `org_member_update` 等の正規化済み enum |
   | `observed_at` | INTEGER (epoch sec) | 保存可 | 秒精度（ミリ秒は切り捨て） |
   | `created_at` | INTEGER (epoch sec) | 保存可 | row 生成時刻 |
   | ~~`actor_email`~~ | — | **保存禁止** | full email は salt 付き hash の入力にのみ使用し row には絶対残さない |
   | ~~`actor_email_local_part`~~ | — | **保存禁止** | local-part 単体でも個人特定リスク |
   | ~~`source_ip`~~ | — | **保存禁止** | full IP は prefix にマスクしてから保存 |
   | ~~`user_agent`~~ | — | **保存禁止** | full UA は bucket 化してから保存 |
   | ~~`raw_payload`~~ | — | **保存禁止** | GitHub / Cloudflare 生 payload を JSON 列に置かない |
   | ~~`pat_token`~~ / ~~`webhook_url`~~ / ~~`salt`~~ | — | **保存禁止** | secret 系は永続化対象外 |

5. **`.claude/skills/aiworkflow-requirements` への SSOT 反映方針**
   - `references/audit-correlation.md` に「live wiring 章」を追記。Phase 1 で確定した内容と上記 D1 schema 列毎の保存可否表を SSOT として転記。
   - `indexes/keywords.json` に追加するキー: `live wiring`、`cron trigger`、`audit-correlation slack`、`fingerprint salt rotation`、`fingerprintVersion`、`dual-read period`。
   - `indexes/{quick-reference.md, resource-map.md, topic-map.md}` に live wiring 節への参照行を追加。
   - `pnpm indexes:rebuild` を実行し、CI gate `verify-indexes-up-to-date` を通す（drift 0 を Phase 11 evidence に記録）。
   - 反映タイミング: 本 Phase で「変更草案」を `outputs/phase-8/phase-8.md` に貼り、実ファイル編集は Phase 12（implementation guide / SSOT sync）で確定。

6. **CODEOWNERS 整合**
   - `.claude/skills/aiworkflow-requirements/references/**` / `apps/api/**` / `.github/workflows/**` の owner が `@daishiman` になっていることを `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` で確認。

7. **branch protection 整合（read-only）**
   - solo 運用ポリシー（`required_pull_request_reviews=null`）を維持。本 Phase で値変更は行わない。
   - 将来必須化したい status check 名候補: `audit-correlation-verify / verify`、`audit-correlation-verify / live-mode-grep-gate`。Phase 12 implementation guide に TODO として記録。

8. **NON_VISUAL evidence ポリシー確認**
   - スクリーンショット不要。Phase 11 で typecheck / lint / test / build / grep-gate / staging cron 1 回成功 log / Slack dry-run payload のみ収集。

## 変更対象ファイル / コマンド対象

| パス | 種別 | 役割 |
| --- | --- | --- |
| `docs/runbooks/audit-correlation.md` | 編集（Phase 12 で確定） | salt rotation 章 / fingerprintVersion またぎ章 / D1 schema 列毎保存可否表 |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | 編集（Phase 12 で確定） | live wiring 章 SSOT |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集（Phase 12 で確定） | live wiring 関連キーワード追加 |
| `.claude/skills/aiworkflow-requirements/indexes/{quick-reference.md,resource-map.md,topic-map.md}` | 編集（Phase 12 で確定） | live wiring 参照行 |
| `.github/workflows/audit-correlation-verify.yml` | 編集（Phase 7 で実装、本 Phase は governance レビュー） | live mode grep gate（Slack webhook URL / Bearer token literal 検出） |

## 実行手順

```bash
# 1. secret literal grep gate（live mode 検出パターン込み）
grep -REn 'ghp_|github_pat_|AUDIT_CORRELATION_SALT=|AUDIT_CORRELATION_INTERNAL_TOKEN=|hooks\.slack\.com/services/|xoxb-|xoxp-|Bearer ghp_|Bearer github_pat_' \
  apps/api/src/audit-correlation \
  apps/api/src/routes/audit-correlation \
  scripts/audit-correlation \
  docs/runbooks/audit-correlation.md \
  2>/dev/null && { echo "secret literal detected"; exit 1; } || echo "no leaks"

# 2. CODEOWNERS 整合
gh api repos/daishiman/UBM-Hyogo/codeowners/errors

# 3. branch protection 確認（read-only / drift なし確認）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | grep -E 'required_pull_request_reviews|enforce_admins|lock_branch' || true
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | grep -E 'required_pull_request_reviews|enforce_admins|lock_branch' || true

# 4. SSOT drift 確認（Phase 12 実反映前の事前検査）
mise exec -- pnpm indexes:rebuild --dry-run || true
```

## 検証コマンド / 期待出力

| コマンド | 期待出力 |
| --- | --- |
| 上記 grep gate | `no leaks`（exit 0） |
| `gh api ... codeowners/errors` | `{"errors":[]}` |
| `gh api ... branches/dev/protection` | `required_pull_request_reviews: null` を含む（drift なし） |
| `gh api ... branches/main/protection` | 同上 |

## evidence 配置先

- `outputs/phase-8/phase-8.md`（governance チェック結果）
- `outputs/phase-11/grep-gate.log`（Phase 11 で grep gate 結果を恒久化）
- `outputs/phase-11/codeowners-errors.json`（Phase 11 で CODEOWNERS 検証結果）

## 安全性チェック（secret / 平文露出が無いこと）

```bash
# 仕様書本文 / runbook 草案 / SSOT 草案に literal が混入していないか
grep -REn 'ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|hooks\.slack\.com/services/[A-Z0-9/]+|xox[bp]-[A-Za-z0-9-]+' \
  docs/30-workflows/issue-553-live-audit-correlation-endpoint \
  docs/runbooks/audit-correlation.md \
  .claude/skills/aiworkflow-requirements/references/audit-correlation.md \
  2>/dev/null && { echo "literal leaked"; exit 1; } || echo "ok"

# `op://` 参照のみで実値が書かれていないこと
grep -REn 'AUDIT_CORRELATION_SALT="[^o]' apps/api scripts docs 2>/dev/null \
  && { echo "raw salt literal"; exit 1; } || echo "ok"
```

## 統合テスト連携

- Phase 11 で上記 grep / CODEOWNERS / branch protection の結果を `outputs/phase-11/grep-gate.log` / `outputs/phase-11/codeowners-errors.json` に保存。
- Phase 7 で実装した `.github/workflows/audit-correlation-verify.yml` の live mode grep gate ジョブが green であることを Phase 11 で再確認。

## 参照資料

- CLAUDE.md「シークレット管理」「Governance / CODEOWNERS」「ブランチ戦略」
- 親ワークフロー Phase 8: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-08.md`
- aiworkflow-requirements: `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`

## 成果物

- `outputs/phase-8/phase-8.md`
  - secret hygiene チェックリスト結果（live mode 拡張 grep の検出 0 件 evidence）
  - salt rotation 手順草案（runbook 反映前の draft）
  - fingerprintVersion またぎ運用草案
  - D1 schema 列毎の保存可 / 不可表
  - SSOT 反映方針（Phase 12 で実ファイル編集）
  - CODEOWNERS errors 0 件確認
  - branch protection drift なし確認

## 完了条件（DoD）

- [ ] live mode 拡張 grep（Slack webhook URL / Bearer token literal 含む）が 0 件。
- [ ] salt rotation 手順 + dual-read 60 分以上の運用が runbook 草案に明記。
- [ ] fingerprintVersion またぎ運用（v1/v2 row 紐付け基準）が runbook 草案に明記。
- [ ] D1 `audit_correlation_findings` 列毎の保存可 / 不可表が完成し、保存禁止列に PII / secret が網羅されている。
- [ ] SSOT 反映方針（references / indexes / quick-reference / resource-map / topic-map の編集箇所）が Phase 12 タスクとして列挙されている。
- [ ] CODEOWNERS errors 0 件。
- [ ] branch protection 設定変更なし（solo 運用維持）を記録。
- [ ] `outputs/phase-8/phase-8.md` に上記すべての evidence が貼られている。
