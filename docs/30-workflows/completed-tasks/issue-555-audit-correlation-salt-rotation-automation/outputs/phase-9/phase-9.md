# Phase 9: runbook / SSOT 反映ドラフト

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 対象 | `docs/runbooks/audit-correlation.md`（既存編集） / `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`（既存編集） / `references/deployment-secrets-management.md`（新規） / `indexes/topic-map.md` / `indexes/keywords.json`（再生成） |
| 実装区分 | runbook / SSOT 反映ドラフト仕様書 |

## 目的

rotation 自動化に伴う運用手順を runbook に追加し、aiworkflow-requirements skill の references / indexes に rotation policy を反映する草案を確定する。実書き込みは Phase 12 の SSOT 反映タスクで行う（本 Phase は仕様 + ドラフト草案のみ）。`pnpm indexes:rebuild` の drift 無し条件を満たすための keyword / topic 候補を列挙する。

## 反映対象一覧

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `docs/runbooks/audit-correlation.md` | 既存編集 | rotation 章 4 節（通常 / 緊急 / 移行 / 終了）追記 |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | 既存編集 | rotation policy / dual-hash 設計 / fingerprintVersion 章追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 既存編集 | 1Password vault 構造（`AUDIT_CORRELATION_SALT` / `_PREVIOUS`）の正本記載 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 再生成 | `salt rotation` / `fingerprintVersion=2` topic 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 再生成 | rotation 関連 keyword 追加 |

> secret / rotation policy は既存 `references/deployment-secrets-management.md` が正本。audit-correlation 専用の並行 `secrets-management.md` は作らない。

## runbook 章構成草案（`docs/runbooks/audit-correlation.md` 追記分）

### 1. 通常 rotation 手順（90 日周期）

```
前提:
- 親タスク FU-01 (issue-516) live wiring が staging / production で稼働中
- `op` CLI 認証済み
- `bash scripts/cf.sh whoami` で Cloudflare 認証確認

手順:
1) staging で dry-run
   bash scripts/audit-correlation/rotate-salt.sh --dry-run --env staging
2) staging で apply
   bash scripts/audit-correlation/rotate-salt.sh --apply --env staging
3) staging で 7 日観察（dual-hash 期間）
   - HIGH alert の連続性を確認（rotation 直前 / 直後で actor group が分裂しない）
4) staging で end-rotation
   bash scripts/audit-correlation/rotate-salt.sh --end-rotation --env staging
   bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
5) production で同手順を user gate 後に実行（--env production --yes 必須）
```

### 2. 緊急 rotation 手順（salt 漏洩疑義時）

```
前提: salt 漏洩 / 内部不正 / op item の意図せざる露出を検知

手順:
1) production で dry-run（観測のみ）
2) production で即時 apply（dual-hash 期間を 24 時間に短縮）
3) 24 時間以内に Worker 再 deploy + HIGH alert 観察
4) end-rotation を実行し previous を即時破棄
5) postmortem を docs/postmortems/ に追加
```

### 3. fingerprintVersion=2 移行手順（dual-hash 期間 7 日想定）

- redact.ts は常に `fingerprintVersion=2` を返す（v1 は merge 用補助）。
- 永続化レコードがある場合（Phase 5 migration 適用済み）、既存行の `fingerprint_version` は `1` のまま、新規 row は `2`。
- correlate.ts の union-find により v1 ↔ v2 が同一 actor として merge される。
- 移行期間は 7 日。期間中は dual-hash の CPU コスト（hash 計算 2 回）を許容。

### 4. rotation 終了手順

- `--end-rotation` 実行 → Cloudflare Secrets `AUDIT_CORRELATION_SALT_PREVIOUS` を delete → Worker 再 deploy。
- 削除忘れ防止のため、`scripts/check-cf-rotation-reminder.sh`（既存）に終了期限の cron 通知を追加する余地を Phase 12 で検討（本 Phase は方針記載のみ）。

## `references/audit-correlation.md` 追記草案

既存 references/audit-correlation.md の末尾に以下章を追加:

```
## Salt Rotation Policy

- 周期: 90 日（通常）/ 即時（漏洩疑義時）
- dual-hash 期間: 7 日（通常）/ 24 時間（緊急）
- 環境変数:
  - `AUDIT_CORRELATION_SALT`: 必須。新 salt（rotation 後の canonical）
  - `AUDIT_CORRELATION_SALT_PREVIOUS`: rotation 期間中のみ設定。削除で rotation 終了
- fingerprintVersion: redact.ts は常に 2 を返す（v1 は merge 用補助）
- group merge: correlate.ts が union-find で v1/v2 hash を 1 group に統合
- 自動化 script: `scripts/audit-correlation/rotate-salt.sh`（4 モード）
- 1Password vault: `op://Production/AUDIT_CORRELATION_SALT/credential` ほか
- runbook: `docs/runbooks/audit-correlation.md` の rotation 章
```

## `references/deployment-secrets-management.md` 追記草案（最小骨子）

```
# secrets-management

aiworkflow-requirements skill の secrets 管理 anchors。
詳細は CLAUDE.md「シークレット管理」と同期する。

## 1Password vault 構造（audit-correlation 関連）

| Vault | Item | Field | 用途 |
| --- | --- | --- | --- |
| Production | AUDIT_CORRELATION_SALT | credential | 現行 canonical salt |
| Production | AUDIT_CORRELATION_SALT_PREVIOUS | credential | rotation 期間中のみ。dual-hash の旧 salt |
| Staging | 同上 | 同上 | staging 用 |

## アクセス経路

- 実値の取得: `op read 'op://<Vault>/<Item>/<Field>'`
- Cloudflare Secrets 反映: `bash scripts/cf.sh secret put <NAME> --env <env>`（stdin 経由）
- `wrangler` 直接実行禁止
- `.env` には実値を書かず `op://` 参照のみ記述

## rotation 運用

詳細は `references/audit-correlation.md`「Salt Rotation Policy」と `docs/runbooks/audit-correlation.md` を参照。
```

## indexes 追加 keyword 候補

`indexes/keywords.json` に追加する keyword は最低限以下:

- `salt rotation`
- `salt-rotation`
- `AUDIT_CORRELATION_SALT`
- `AUDIT_CORRELATION_SALT_PREVIOUS`
- `fingerprintVersion`
- `fingerprintVersion=2`
- `dual-hash`
- `rotate-salt.sh`
- `op://Production/AUDIT_CORRELATION_SALT`

`indexes/topic-map.md` に追加する topic 候補:

- `salt-rotation-automation` (anchor: references/audit-correlation.md / references/deployment-secrets-management.md)
- `dual-hash-correlation` (anchor: references/audit-correlation.md)

実書き込みは Phase 12 で `mise exec -- pnpm indexes:rebuild` を実行し、drift 無しを確認する。

## 実行コマンド（Phase 12 で使用）

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/
# drift 無し（git status clean）が正常
```

## テスト方針（Phase 10 / 12 と連携）

- 本 Phase は文書草案のみのため、ユニットテストは無い。
- Phase 12 SSOT 反映後に CI gate `verify-indexes-up-to-date` が PASS することが完了条件。

## 完了条件（DoD）

- [ ] runbook 4 節（通常 / 緊急 / 移行 / 終了）の構成と本文ドラフトが確定。
- [ ] `references/audit-correlation.md` 追記章のドラフトが確定。
- [ ] `references/deployment-secrets-management.md` 新規骨子のドラフトが確定。
- [ ] indexes 追加 keyword / topic の候補が列挙されている。
- [ ] 実書き込みは Phase 12 で実施する責務分担が明記。
- [ ] `pnpm indexes:rebuild` 後の drift 無し条件と CI gate `verify-indexes-up-to-date` への整合が明記。

## 次 Phase 連携

- Phase 10: 本 Phase の草案には依存しない（テスト Phase）。
- Phase 12: 本草案を実ファイルに書き込み、indexes を再生成する。
- Phase 13: PR 本文に runbook / references 追記の概要を記載する。
