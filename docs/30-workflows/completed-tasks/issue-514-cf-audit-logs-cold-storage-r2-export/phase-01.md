# Phase 1: 要件定義・GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 目的 | 30 日境界の契約固定・export schedule 決定・redaction policy 継承確認・GO 判定 |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #514（cold storage / R2 export）の Phase 1 として、以下を確定し GO 判定する。

1. **D1 と R2 の境界 = 30 日 TTL を契約として固定する**（FU-02 親仕様の最重要知見）。後続 Phase の設計はすべてこの境界を所与とする。
2. export 周期（日次・UTC 02:00）と半期 restore drill の発火条件を決定する。
3. Issue #408 の D1 schema を入力に、export 時に cold-storage 用 redaction transform を適用し、その後 redaction guard で二重チェックする方針を確定する。
4. GO 判定の前提条件（半期監査要件確定 or D1 容量 50% 継続超過）が満たされているかを点検し、満たさない場合は `held` で停止する手順を明文化する。

## 統合テスト連携

NON_VISUAL implementation。runtime evidence は Phase 11 の「初回 export object PUT 観測 / manifest 行追加観測 / restore drill row count 一致観測」に集約する。Phase 1 の成果物はテキスト仕様のみ。

## 変更対象ファイル一覧

本 Phase は要件確定フェーズのため、コード変更なし。下記の確定事項を後続 Phase に渡す。

| パス | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/index.md` | 編集（次 Phase で必要に応じ） | スコープ・DoD は本 Phase 確定値で固定 |
| 後続 Phase 2-3 の設計書 | 新規 | 本 Phase で固定した契約を前提に作成 |

## 確定事項（契約）

### 契約 C-1: 30 日境界

- D1 `cf_audit_log` の TTL purge は **行 INSERT 時刻から 30 日**（Issue #408 で確定済み）。
- R2 export スクリプトは「INSERT 時刻が 26 日 〜 29 日前」のレコードを対象に PUT する。purge 直前 4 日間を export window とし、日次実行 + manifest completed skip により、通常運用と 1〜3 日の一時失敗の双方で取りこぼしを防ぐ。
- 26 日未満のレコードは export 対象外（D1 で十分）。29 日超は purge 済みのため対象不可。

### 契約 C-2: export schedule

- cron: `0 2 * * *`（UTC 毎日 02:00、JST 11:00）
- 想定実行時間: 1 回 5 〜 15 分（D1 SELECT + gzip + R2 PUT）
- 半期 restore drill: 1 月 / 7 月の 1 日の workflow 実行内で `if: contains(fromJson('[1,7]'), <UTC month>) && <UTC day> == 1` ブランチを取り、ランダム 1 object を復元検証する。

### 契約 C-3: cold-storage redaction policy

- export スクリプトは D1 行をそのまま R2 に出さず、cold-storage 用 redacted row に変換する:
  - `actor_ip`: IPv4 は `/24`、IPv6 は `/48` に切り詰める。
  - `actor_email`: local-part を保存せず `actor_email_domain` のみ残す。
  - `actor_ua`: `redacted-user-agent` に置換する。
  - `raw_json`: R2 へ保存しない。
- export 段階の追加ガード: 変換後 JSONL を grep し、以下のいずれかにヒットした場合 fail-closed:
  - Cloudflare API Token prefix (`v1.0-`)
  - 完全 IP（IPv4 octet 4 つ揃い・IPv6 8 hextet 揃い、ただし `xxx.xxx.xxx.0/24` truncated は許可）
  - 完全 User-Agent 文字列
  - 平文 email
- redaction policy version (`v1`) を manifest に必ず記録する。

### 契約 C-4: GO 判定条件

| 条件 | 必要 | 確認方法 |
| --- | --- | --- |
| Issue #408 fetcher が production で稼働 | 必須 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT MAX(occurred_at) FROM cf_audit_log"` が 24h 以内 |
| 半期監査要件確定 OR D1 容量 50% 継続超過 | いずれか必須 | 監査要件文書 / D1 metrics 30 日平均 |
| R2 bucket 作成権限 Token | 必須 | 1Password `Cloudflare/CF_AUDIT_R2_TOKEN_PROD` |
| GitHub Secrets 登録経路 | 必須 | 既存 `cf-audit-log-monitor.yml` の secrets 参照踏襲 |

いずれか欠けた場合は本タスクを `held` 状態に戻し、index.md `状態` 欄を `held_pending_prerequisite` に書き換えて停止する。

## 関数・型・モジュールのシグネチャ

本 Phase では公開 API は定義しない。Phase 2 で以下を定義する旨を予約する:

```typescript
// Phase 2 で確定する型のプレビュー（本 Phase では概要のみ）
type ExportWindow = {
  fromUtc: Date;  // INSERT 時刻が「この値以降」
  toUtc: Date;    // INSERT 時刻が「この値未満」
  // 日次実行で from = now - 29d, to = now - 26d を想定
};

type RedactionPolicyVersion = "v1";
```

## 入力・出力・副作用

- 入力: 上記 GO 判定条件の現状確認結果（人間オペレーター or workflow による点検）。
- 出力: GO / NO-GO 判定 + 確定契約 (C-1 〜 C-4)。
- 副作用: なし（仕様書のみ）。

## テスト方針

Phase 1 はテキスト仕様のみのためテストコード追加なし。GO 判定の再現性は Phase 11 の runtime evidence collection で担保する。

## ローカル実行・検証コマンド

```bash
# fetcher が稼働していることの確認（GO 判定の前提）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*), MAX(occurred_at) FROM cf_audit_log"

# R2 bucket 作成権限の事前確認（実バケット作成は Phase 5）
bash scripts/cf.sh r2 bucket list

# Token 経路の確認
op item get "CF_AUDIT_R2_TOKEN_PROD" --vault Cloudflare --fields label,type
```

## DoD（Phase 1 完了条件）

- [ ] 契約 C-1 〜 C-4 が本ファイルに明文化されている
- [ ] GO 判定条件 4 項目について、現状の充足状況が確認可能（コマンドが提示されている）
- [ ] redaction policy を fetcher から import で継承する方針が確定している
- [ ] 30 日境界を所与とする旨を「苦戦箇所・知見」と整合する形で固定している（再オープン禁止）
- [ ] Phase 2 / Phase 3 で参照すべき型のプレビューが提示されている
