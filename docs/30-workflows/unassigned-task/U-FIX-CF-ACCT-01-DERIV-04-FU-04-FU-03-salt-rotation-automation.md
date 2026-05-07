# U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03: AUDIT_CORRELATION_SALT rotation 自動化 - タスク指示書

## メタ情報

```yaml
parent_issue_number: 516
issue_number: 555
```

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03                                         |
| タスク名     | `AUDIT_CORRELATION_SALT` rotation 自動化と `fingerprintVersion=2` 移行         |
| 分類         | セキュリティ / 運用自動化                                                     |
| 対象機能     | `apps/api/src/audit-correlation/redact.ts` + Cloudflare Secrets + runbook      |
| 優先度       | 中（priority:medium）                                                         |
| 見積もり規模 | 中規模（scale:medium）                                                        |
| ステータス   | 未実施（status:unassigned）                                                   |
| 発見元       | Issue #516 Phase-12 / outputs/phase-12/unassigned-task-detection.md          |
| 発見日       | 2026-05-07                                                                    |
| 親タスク     | `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`     |
| 親 Issue     | https://github.com/daishiman/UBM-Hyogo/issues/516                             |
| 着手判断     | FU-01 の live wiring が staging で 1 回以上成功し、salt 値が実 incident 履歴と紐づいた後（rotation を回す前提が成立してから） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #516 では `fingerprintHash = SHA-256(salt | canonical)` で per-environment salt を導入し、
PII を保存せずに cross-source correlation を実現した。`fingerprintVersion=1` を初期値として
固定し、algorithm / 入力組合せ変更時に増分する設計にしているが、salt rotation のタイミング・
旧 salt との並行運用期間・rotation 検知 runbook は手動運用に留まっている。

### 1.2 問題点・課題

- salt 漏洩疑義時の即時 rotation 手順が runbook 上の手動ステップのみで、自動化されていない。
- `fingerprintVersion=1 → 2` 移行時に「同一 actor の旧 fingerprint と新 fingerprint をどう
  繋ぐか」のロジックが未実装（rotation 期間中は HIGH severity 検知が分裂しうる）。
- secret rotation policy（rotation 周期・承認 workflow・1Password ↔ Cloudflare Secrets 同期）が
  未確定。

### 1.3 放置した場合の影響

- salt の長期使用により hash の経年解析リスクが累積。
- rotation 時に live correlation が壊れ、HIGH alert が一時的に検知失敗する可能性。
- 親タスク Issue #516 の SSOT で「salt rotation は follow-up」と記載した責務が回収されないまま
  Issue #516 が closed される。

---

## 2. 何を達成するか（What）

### 2.1 目的

`AUDIT_CORRELATION_SALT` の rotation を半自動化し、`fingerprintVersion` を 1 → 2 に増分しても
既存 incident 履歴との連続性を保てる仕組みを runbook + コード + 自動 PR ベースで整える。

### 2.2 最終ゴール

- rotation 用 script（`scripts/audit-correlation/rotate-salt.sh` 等）が新 salt 生成 / 1Password 登録
  / Cloudflare Secrets 反映 / `fingerprintVersion` 増分 / dual-hash 期間設定 を 1 コマンドで実行。
- `redact.ts` が rotation 期間中だけ「旧 salt + 新 salt」両方で fingerprintHash を計算し、
  correlate.ts が両 fingerprint を「同一 actor」と扱える dual-hash 機構を提供。
- runbook (`docs/runbooks/audit-correlation.md`) に rotation 自動化手順 / 緊急 rotation 手順 /
  fingerprintVersion=2 への移行手順が追記される。

### 2.3 完了条件（DoD）

- [ ] `scripts/audit-correlation/rotate-salt.sh` が dry-run モードで動作確認済み。
- [ ] `apps/api/src/audit-correlation/redact.ts` が dual-hash モードを optional でサポート。
- [ ] correlate.ts の vitest に `fingerprintVersion=1 → 2` 移行 group 化テスト追加（緑）。
- [ ] runbook に rotation 自動化手順 / 緊急 rotation 手順 / version 移行手順が追記。
- [ ] grep gate が rotation 期間の dual-hash 出力でも secret / salt literal 非露出を維持。
- [ ] secret rotation policy（周期・承認 workflow・1Password vault 構造）が aiworkflow-requirements
      `references/audit-correlation.md` に追記。

---

## 3. どう実現するか（How）

### 3.1 想定モジュール

| パス                                              | 種別 | 役割                                                          |
| ------------------------------------------------- | ---- | ------------------------------------------------------------- |
| `scripts/audit-correlation/rotate-salt.sh`        | 新規 | 新 salt 生成 + 1Password / Cloudflare Secrets 反映 + version 増分 |
| `apps/api/src/audit-correlation/redact.ts`        | 編集 | dual-hash 計算（rotation 期間中のみ）                          |
| `apps/api/src/audit-correlation/correlate.ts`     | 編集 | 旧/新 fingerprint を group merge する補助ロジック              |
| `apps/api/src/audit-correlation/__tests__/`       | 編集 | rotation 移行テスト追加                                       |
| `docs/runbooks/audit-correlation.md`              | 編集 | rotation 自動化 / 緊急 rotation / version 移行手順             |

### 3.2 設計方針

- dual-hash モードは「rotation 開始時刻 + 終了時刻」で wrap し、終了後は新 salt のみで動作する
  ように feature flag 化する（永続的な dual-hash は計算コスト 2 倍のため避ける）。
- `fingerprintVersion` は payload に含め、incident 永続化レコードの schema に必ず保存
  （遡及 migration 不要にする）。
- 1Password vault は `Production / AUDIT_CORRELATION_SALT` と
  `Production / AUDIT_CORRELATION_SALT_PREVIOUS` の 2 item 体制にし、rotation script が
  PREVIOUS を上書きしてから CURRENT を生成する。

### 3.3 検証方法

1. fixture を旧 salt で hash → rotation script dry-run → 新 salt で hash → correlate が同一 actor として
   merge することを vitest で検証。
2. grep gate を rotation 期間の output に対して実行し、salt literal / secret 非露出を確認。
3. runbook に従って staging で実 rotation を 1 回行い、HIGH alert が rotation 直前/直後で
   分裂しないことを観察。

---

## 4. 苦戦箇所（親タスクからの教訓）

### 4.1 Issue #516 で苦戦した点

- **redact-safe join key の改訂**: `email|ip|ua` 入力では HIGH severity の「IP 急変検知」と
  矛盾するため email-based 方式へ Phase 1 改訂が必要だった。**再現対策**: rotation 設計でも
  「同一 actor の identity 連続性」と「IP 変化検知」が両立する hash 入力か Phase 1 で確認する。
- **salt literal 非露出の grep gate**: secret pattern 検出が緩く、`ghp_*` / `github_pat_*` 検出を
  PR レビューで追加した。**再現対策**: dual-hash 期間中は「旧 salt の literal が cache / log に
  残っていないか」を grep gate に明示追加する。
- **fixture 駆動と live 運用のギャップ**: Issue #516 は fixture-only スコープにとどめたため、
  rotation の実 incident 連続性は未検証。**再現対策**: 本タスクは FU-01 の live wiring が
  staging で動いた後に着手する着手判断を必ず守る。

### 4.2 本タスク固有の予想苦戦点

- 1Password CLI (`op`) の rotation 自動化はインタラクティブ承認が必要なケースがあり、CI から
  完全 headless にできない可能性がある。Phase 1 で `op` の non-interactive モード制約を確定する。
- dual-hash 期間中の D1 永続化レコード schema 変更（`fingerprintVersion` カラム追加）の migration
  が FU-01 の永続化設計と coupling する。

---

## 5. システム仕様書への反映

- aiworkflow-requirements `references/audit-correlation.md` に rotation 章を追記。
- `indexes/keywords.json` に `salt rotation` / `fingerprintVersion` キーワードを追加。
- 1Password vault 構造を `references/secrets-management.md`（既存があれば編集）に反映。

---

## 6. スコープ

### 含む
- rotation script + dual-hash 機構 + version 移行ロジック
- runbook 更新
- secret rotation policy ドキュメント化

### 含まない
- live audit-correlation Worker route 実装（FU-01 の責務）
- branch protection 登録（FU-02 の責務）
- 全 secret 共通の rotation 基盤（本タスクは AUDIT_CORRELATION_SALT に限定）

## 7. 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/516
- 親タスク: `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/`
- runbook: `docs/runbooks/audit-correlation.md`
- 検出元: `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/outputs/phase-12/unassigned-task-detection.md`
- 関連: CLAUDE.md「シークレット管理」「ローカル `.env` の運用ルール」
