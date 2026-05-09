# Phase 3: rotation script I/F 設計 / 関数シグネチャ確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 上流依存 | Phase 1 policy / Phase 2 型拡張 |

## 目的

`scripts/audit-correlation/rotate-salt.sh` の CLI I/F（4 サブモード）と、`redact.ts` / `correlate.ts` の関数シグネチャを擬似コードレベルで確定する。1Password vault 構造と Cloudflare Secrets 反映フローを I/F 仕様として固定し、Phase 6 / 7 / 8 の実装が本 phase だけを参照すれば書き始められる粒度に落とす。

## 変更対象ファイル一覧（本 phase は spec のみ。実装は Phase 6 / 7 / 8）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `scripts/audit-correlation/rotate-salt.sh` | 新規（Phase 8） | rotation オーケストレーション |
| `scripts/audit-correlation/lib/op-helpers.sh` | 新規（必要時 / Phase 8） | `op item get/edit/create` thin wrapper |
| `apps/api/src/audit-correlation/redact.ts` | 編集（Phase 6） | dual-hash 出力 |
| `apps/api/src/audit-correlation/correlate.ts` | 編集（Phase 7） | v1/v2 跨ぎ merge |

## `rotate-salt.sh` CLI 設計

```text
Usage:
  rotate-salt.sh --dry-run        [--env staging|production]
  rotate-salt.sh --apply          [--env staging|production]
  rotate-salt.sh --rollback       [--env staging|production]
  rotate-salt.sh --end-rotation   [--env staging|production]

Options:
  --env <env>   default: staging。production は明示指定必須（user gate）
  -h | --help   ヘルプ表示
```

| サブモード | 動作 | 副作用 |
| --- | --- | --- |
| `--dry-run` | 新 salt 候補を生成して標準出力、1Password / CF への書込みは行わない | なし（read-only） |
| `--apply` | 1) 現 salt を `AUDIT_CORRELATION_SALT_PREVIOUS` に退避（1Password item 作成 / 上書き）<br>2) 新 salt を生成し `AUDIT_CORRELATION_SALT` に上書き<br>3) Cloudflare Secrets に反映（`scripts/cf.sh secret put` 経由）<br>4) Worker 再 deploy（`scripts/cf.sh deploy`）<br>5) dual-hash 期間開始タイムスタンプを 1Password の note に記録 | 1Password / Cloudflare Secrets / Worker deploy |
| `--rollback` | 1) `_PREVIOUS` の値で `AUDIT_CORRELATION_SALT` を上書き<br>2) `_PREVIOUS` を削除<br>3) Cloudflare Secrets / Worker 再 deploy | 1Password / Cloudflare Secrets / Worker deploy |
| `--end-rotation` | 1) `_PREVIOUS` を 1Password から削除<br>2) Cloudflare Secrets `AUDIT_CORRELATION_SALT_PREVIOUS` を unset（`scripts/cf.sh secret delete`）<br>3) Worker 再 deploy | 1Password / Cloudflare Secrets / Worker deploy |

### exit code 規約

| code | 意味 |
| --- | --- |
| 0 | 成功 |
| 1 | 一般エラー（usage 違反 / 環境未準備） |
| 2 | `op whoami` 失敗（pre-flight 失敗） |
| 3 | 1Password 書込み失敗 |
| 4 | Cloudflare Secrets 書込み失敗 |
| 5 | Worker 再 deploy 失敗 |
| 6 | rollback 対象が存在しない（`_PREVIOUS` not found） |

### stdout / stderr 分離

- 進捗ログ・確認プロンプトは stderr
- 自動化で grep 対象になる「new salt fingerprint（hash の先頭 8 文字）」「rotation timestamp」のみ stdout
- **salt 値そのものは stdout / stderr / log file いずれにも出力禁止**（grep gate で検査）

## `redact.ts` 関数シグネチャ

```typescript
// apps/api/src/audit-correlation/redact.ts

export interface RedactEnv {
  AUDIT_CORRELATION_SALT: string;            // current salt（必須）
  AUDIT_CORRELATION_SALT_PREVIOUS?: string;  // rotation 期間のみ存在
}

export interface RedactInput {
  // 親 FU-01 由来の入力。ここでは省略
  email: string;
  // ...
}

export interface RedactOutput {
  // 親 FU-01 由来の redact 済フィールド + NormalizedAuditEvent bridge shape
  fingerprintVersion: 1 | 2;
  fingerprintHashes: { v1?: string; v2: string };
  // 親 FU-01 から既存の `fingerprintHash`（単一）が export されている場合、
  //   `fingerprintHash = fingerprintHashes.v2` として後方互換維持（Phase 6 で確定）
}

export function redactAndFingerprint(
  input: RedactInput,
  env: RedactEnv,
): RedactOutput;
```

副作用: なし（純粋関数）。env 値から `_PREVIOUS` の有無で経路分岐するのみ。

## `correlate.ts` 関数シグネチャ

```typescript
// apps/api/src/audit-correlation/correlate.ts

export interface ActorGroup {
  actorKey: string;        // canonical email-derived key（hash ではなく内部識別子）
  records: NormalizedAuditEvent bridge shape[];
  hashes: Set<string>;     // v1 / v2 hashes 全集合（merge の根拠）
}

export function groupByActor(
  records: NormalizedAuditEvent bridge shape[],
): ActorGroup[];
```

merge ロジック概略:

1. record ごとに `fingerprintHashes.v1` と `fingerprintHashes.v2` をすべて取り出す
2. ある record の hash 集合が他 group の hash 集合と 1 つでも交差するなら同一 group に merge（union-find）
3. 結果として v1 のみ持つ古い record と v2 のみ持つ新 record が、dual-hash 期間中の record（v1+v2）を bridge として merge される

副作用: なし（純粋関数）。

## 1Password vault 構造（SSOT）

| Vault | Item | Field | 存在条件 |
| --- | --- | --- | --- |
| `Production` | `AUDIT_CORRELATION_SALT` | `password` | 常時 |
| `Production` | `AUDIT_CORRELATION_SALT_PREVIOUS` | `password` | rotation 期間（apply 〜 end-rotation の間）のみ |
| `Production` | `AUDIT_CORRELATION_SALT` | `notes`（rotation 履歴） | 常時 |

`.env` には実値ではなく `op://Production/AUDIT_CORRELATION_SALT/password` 参照のみを記述（CLAUDE.md ローカル `.env` 運用ルールに整合）。

## Cloudflare Secrets 反映フロー

```bash
# rotate-salt.sh --apply 内部呼び出し例
echo "$NEW_SALT" | bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT \
  --config apps/api/wrangler.toml --env "$ENV"
echo "$OLD_SALT" | bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT_PREVIOUS \
  --config apps/api/wrangler.toml --env "$ENV"

# --end-rotation 内部呼び出し例
bash scripts/cf.sh secret delete AUDIT_CORRELATION_SALT_PREVIOUS \
  --config apps/api/wrangler.toml --env "$ENV"
```

`scripts/cf.sh` 自体が `op run` ラップで token を 1Password から動的注入するため、`rotate-salt.sh` 側で `CLOUDFLARE_API_TOKEN` を再注入しない。

## 入力・出力・副作用（関数別）

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `redactAndFingerprint` | `RedactInput`, `RedactEnv` | `RedactOutput` | なし |
| `groupByActor` | `NormalizedAuditEvent bridge shape[]` | `ActorGroup[]` | なし |
| `rotate-salt.sh --dry-run` | env, op session | stdout (new salt fingerprint) | なし |
| `rotate-salt.sh --apply` | env, op session | exit code | 1Password / CF Secrets / Worker deploy |
| `rotate-salt.sh --rollback` | env, op session | exit code | 同上 |
| `rotate-salt.sh --end-rotation` | env, op session | exit code | 同上 |

## テスト方針

- `redactAndFingerprint`: Phase 4 シナリオ 1 / 2 / 3 で env 注入 mock により動作確認
- `groupByActor`: Phase 4 シナリオ 4 で v1+v2 mix fixture 経由
- `rotate-salt.sh`: shellcheck（Phase 10）+ `--dry-run` を staging で実行（Phase 11）

## ローカル実行・検証コマンド（spec phase）

```bash
# 既存 redact.ts / correlate.ts の存在確認（FU-01 完了状況）
test -f apps/api/src/audit-correlation/redact.ts && echo "exists" || echo "absent"
test -f apps/api/src/audit-correlation/correlate.ts && echo "exists" || echo "absent"

# scripts/cf.sh 経由の secret put がサポートされているか（dry 確認）
bash scripts/cf.sh --help 2>&1 | head -n 30
```

## Acceptance Criteria

| ID | 内容 |
| --- | --- |
| AC-1 | 4 サブモード仕様 + exit code 規約が SSOT で確定 |
| AC-2 | `redactAndFingerprint` / `groupByActor` のシグネチャが確定 |
| AC-3 | 1Password vault 構造が確定 |
| AC-4 | Cloudflare Secrets 反映フロー（`scripts/cf.sh` 経由）が記録 |
| AC-5 | salt literal 出力禁止が grep gate 設計（Phase 4 / 8）に引き渡し可能 |

## 成果物

- `outputs/phase-3/phase-3.md`（本ファイル）

## 完了条件 (DoD)

- [ ] CLI I/F（4 サブモード + exit code）が確定
- [ ] 関数シグネチャ 2 種が確定
- [ ] 1Password vault 構造が確定
- [ ] Cloudflare Secrets 反映フローが確定
- [ ] Phase 4 着手 GO 判定
