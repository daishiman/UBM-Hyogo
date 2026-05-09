# Phase 4: 統合テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-05-08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 上流依存 | Phase 1 policy / Phase 2 型 / Phase 3 シグネチャ |

## 目的

vitest による rotation 4 シナリオ（rotation 期間中 dual-hash / rotation 終了後 single-hash / rotation rollback / v1+v2 mix の同一 actor merge）を fixture 駆動で設計し、grep gate test の組込み・shellcheck 適用方針を確定する。Phase 6 / 7 / 8 / 10 の実装が本 phase の test 設計をそのまま満たす形で進められる粒度に落とす。

## 変更対象ファイル一覧（実装は Phase 10）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/audit-correlation/__tests__/redact.test.ts` | 編集 | dual-hash 期間中・終了後・rollback の 3 ケース追加 |
| `apps/api/src/audit-correlation/__tests__/correlate.test.ts` | 編集 | v1+v2 mix の同一 actor merge ケース追加 |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/previous-current.json` | 新規 | dual-hash 期間 fixture |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/current-only.json` | 新規 | rotation 終了後 fixture |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/rollback.json` | 新規 | rollback 後 fixture |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/v1-v2-mix.json` | 新規 | v1+v2 mix fixture（HIGH alert 連続性検証） |
| `scripts/grep-gate/audit-correlation-secrets.sh` | 編集 or 新規 | salt literal 非露出 gate（既存 grep gate に統合可） |

## vitest 4 シナリオ（SSOT）

### シナリオ 1: rotation 期間中 dual-hash

| 項目 | 値 |
| --- | --- |
| 対象関数 | `redactAndFingerprint` |
| fixture | `previous-current.json`（同一 email × 1 record） |
| env | `AUDIT_CORRELATION_SALT='new'`, `AUDIT_CORRELATION_SALT_PREVIOUS='old'` |
| 期待出力 | `fingerprintVersion === 2` && `fingerprintHashes.v1` non-empty && `fingerprintHashes.v2` non-empty && `v1 !== v2` |
| assertion 追加 | 出力 JSON 文字列が `'old'` / `'new'` literal を含まない（salt 値露出禁止） |

### シナリオ 2: rotation 終了後 single-hash

| 項目 | 値 |
| --- | --- |
| 対象関数 | `redactAndFingerprint` |
| fixture | `current-only.json`（同一 email × 1 record） |
| env | `AUDIT_CORRELATION_SALT='new'`（`_PREVIOUS` 未設定） |
| 期待出力 | `fingerprintVersion === 2` && `fingerprintHashes.v1 === undefined` && `fingerprintHashes.v2` non-empty |
| assertion 追加 | dual-hash 経路に入らない（CPU コスト 2 倍の永続化を防止） |

### シナリオ 3: rotation rollback

| 項目 | 値 |
| --- | --- |
| 対象関数 | `redactAndFingerprint` |
| fixture | `rollback.json`（apply 前後 + rollback 後の 3 record） |
| env | apply 前 `salt=A` / apply 後 `salt=B, _PREVIOUS=A` / rollback 後 `salt=A`（`_PREVIOUS` 削除） |
| 期待出力 | apply 前と rollback 後の v2 hash が一致（同一 email・同一 salt のため） |
| assertion 追加 | rollback 後 record の `v1` フィールドが undefined |

### シナリオ 4: v1+v2 mix の同一 actor merge（HIGH alert 連続性）

| 項目 | 値 |
| --- | --- |
| 対象関数 | `groupByActor` |
| fixture | `v1-v2-mix.json`（同一 email × 100 record。v1-only: 50, v1+v2: 10, v2-only: 40） |
| 期待出力 | `groupByActor(records).length === 1`（全 100 record が単一 group に merge） |
| 連続性しきい値 | 同一 actor 検知率 = 100/100 = 100% ≥ 99% を満たす |
| assertion 追加 | group の `hashes` Set サイズが「v1 unique 数 + v2 unique 数」と一致 |

## fixture 配置

```
apps/api/src/audit-correlation/__tests__/fixtures/rotation/
├── previous-current.json
├── current-only.json
├── rollback.json
└── v1-v2-mix.json
```

各 JSON の schema（Phase 10 実装時に確定）:

```json
{
  "description": "シナリオ説明",
  "env": { "AUDIT_CORRELATION_SALT": "...", "AUDIT_CORRELATION_SALT_PREVIOUS": "..." },
  "inputs": [ { "email": "...", "..." } ],
  "expected": { "fingerprintVersion": 2, "fingerprintHashes": { "v1": "...", "v2": "..." } }
}
```

> fixture 内 salt 値は test 用ダミー（`'test-salt-old' / 'test-salt-new'`）を使い、production 値は使わない。

## grep gate test の組込み

### 方式選定

vitest 内 assertion に **集約**（外部 shell script 呼び出しは行わない）:

- 各シナリオの最終 `expect` で `JSON.stringify(output)` を取得し、env 値の literal が含まれないことを `not.toContain` で検査
- 外部 `scripts/grep-gate/audit-correlation-secrets.sh` は **CI レベル**の補助 gate として、リポジトリ全体（src + dist + log）に対して `git grep` ベースの secret pattern 検出に使う（Phase 8 で実装、Phase 10 で `pnpm test:secrets` のような script 化）

### 検出パターン（grep gate）

```
AUDIT_CORRELATION_SALT\s*=\s*['\"][^'\"]+['\"]    # ハードコード代入
AUDIT_CORRELATION_SALT_PREVIOUS\s*=\s*['\"]
```

ただし `.dev.vars.example` / `op://Production/...` 参照行 / 本タスクの spec docs（自分自身）は除外。

## shellcheck 適用方針

| 対象 | 適用 phase | 適用方法 |
| --- | --- | --- |
| `scripts/audit-correlation/rotate-salt.sh` | Phase 10 ローカル gate | `shellcheck scripts/audit-correlation/rotate-salt.sh` を Phase 10 完了条件に追加 |
| `scripts/audit-correlation/lib/op-helpers.sh`（必要時） | Phase 10 | 同上 |
| CI 反映 | Phase 13 PR 後 | 既存 lefthook / CI workflow に組込済か確認。未組込なら本タスクスコープでは追加せず、別タスクで推進（unassigned 検出に記録） |

## 入力・出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | fixture JSON 4 種、mock env |
| 出力 | vitest pass / fail、grep gate 0 / non-zero exit |
| 副作用 | なし（read-only test） |

## ローカル実行・検証コマンド

```bash
# 該当テストのみ実行
mise exec -- pnpm --filter @ubm-hyogo/api test src/audit-correlation/__tests__/redact.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test src/audit-correlation/__tests__/correlate.test.ts

# grep gate（Phase 8 実装後）
bash scripts/grep-gate/audit-correlation-secrets.sh

# shellcheck
shellcheck scripts/audit-correlation/rotate-salt.sh
```

## Acceptance Criteria

| ID | 内容 |
| --- | --- |
| AC-1 | 4 シナリオ仕様（fixture / env / 期待出力 / assertion）が SSOT で確定 |
| AC-2 | fixture 4 種の配置パスとファイル名が確定 |
| AC-3 | grep gate 組込み方式（vitest 内 + 補助 shell gate）が確定 |
| AC-4 | shellcheck 適用方針（Phase 10 ローカル gate）が確定 |
| AC-5 | HIGH alert 連続性 ≥ 99% がシナリオ 4 で assertion 化されている |

## 成果物

- `outputs/phase-4/phase-4.md`（本ファイル）

## 完了条件 (DoD)

- [ ] 4 シナリオ仕様が確定
- [ ] fixture 4 種のパスとスキーマ概要が確定
- [ ] grep gate 組込み方式が確定
- [ ] shellcheck 方針が確定
- [ ] Phase 5 着手 GO 判定（migration 不要時は Phase 5 スキップ宣言済か確認）
