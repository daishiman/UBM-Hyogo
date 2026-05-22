# Phase 12: ドキュメント整備（6 必須タスク）— 索引

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | implemented-local（staging evidence 完了で `runtime_evidence_collected`） |
| 親 Issue | #555 |
| 親タスク | issue-516 (FU-01) |
| visualEvidence | NON_VISUAL |
| workflow_state ルール | local 実装完了済み。runtime evidence は FU-01 live wiring と user gate まで `blocked_upstream_pending` |

## 目的

task-specification-creator skill 規定の **6 必須タスク** を整備し、`AUDIT_CORRELATION_SALT` rotation 自動化（dual-hash 機構 / fingerprintVersion=2 移行）の判断・実装・運用プロセスを Part 1（中学生レベル）/ Part 2（技術者レベル）両面で説明する。aiworkflow-requirements SSOT を更新し、Phase 11 staging evidence の数値を反映する。

## Step 0: P50 チェック（必須）

- [ ] Phase 10 vitest / shellcheck PASS evidence が `outputs/phase-10/local-evidence/` に存在
- [ ] Phase 11 staging evidence が実体配置済（または `blocked_upstream_pending` のままなら本 Phase は spec のみ整備）
- [ ] aiworkflow-requirements `references/audit-correlation.md` 存在（無い場合は新規作成 spec を含める）
- [ ] aiworkflow-requirements `references/deployment-secrets-management.md` 存在
- [ ] log: `outputs/phase-12/p50-precheck.log`

## 6 必須タスクと成果物

| # | 必須タスク | 成果物 |
| --- | --- | --- |
| 1 | implementation guide（中学生レベル + 技術者レベル） | `outputs/phase-12/implementation-guide.md` |
| 2 | aiworkflow-requirements SSOT 反映ログ | `outputs/phase-12/system-spec-update-summary.md` |
| 3 | docs / SSOT 更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 4 | 残課題（unassigned）検出（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 5 | task-specification-creator skill への feedback | `outputs/phase-12/skill-feedback-report.md` |
| 6 | spec compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 各成果物の必須内容

### 1. `implementation-guide.md`

#### Part 1（中学生レベル / 比喩 = 鍵の交換）

200-300 字で以下を説明:

> 家の鍵を新しいものに替えるとき、いきなり古い鍵で開けられなくなると、家族が困ってしまう。だから「新しい鍵に替えてから、しばらくの間は古い鍵でも新しい鍵でも開けられる期間」を作る。これが dual-hash の考え方。
>
> サイトの裏側でも、誰が同じ人かを判断する「あいことば（salt）」を時々取り替える必要がある。取り替えた瞬間に古いあいことばで作った印が全部使えなくなると、同じ人だと分からなくなる。そこで 7 日間だけ「古いあいことば」と「新しいあいことば」両方の印を残し、時間が経ったら古い方を消す、という手順にしている。

#### Part 2（技術者レベル）

以下を含める。期待行数: 200-400 行。

- **目的**: `AUDIT_CORRELATION_SALT` rotation の自動化と fingerprintVersion=1 → 2 段階移行
- **関数シグネチャ**:
  - `redact(input, { salt, saltPrevious? }) → { fingerprintVersion, fingerprintHashes: { v1?, v2 } }`
  - `correlate(records: AuditRecord[]) → ActorCluster[]`（v1 / v2 cross-version merge）
- **data flow**: `audit ingest` → `redact()` → 単一期 (`v2` only) or dual-hash 期 (`v1 + v2`) → `correlate()` で actor merge → 既存 audit log table に persist
- **dual-hash 期間の不変条件**:
  - 期間: 7 日間（rotation apply から end-rotation まで）
  - `fingerprintHashes.v1` は PREVIOUS salt で計算
  - `fingerprintHashes.v2` は CURRENT salt で計算
  - 値は SHA-256 hex（64 文字）固定
- **rotation 運用 SOP**:
  1. NEW salt を 1Password で生成（256-bit entropy）
  2. `rotate-salt.sh --dry-run --env staging` で副作用なし検証
  3. `rotate-salt.sh --apply --env staging` で `AUDIT_CORRELATION_SALT_PREVIOUS=OLD` / `AUDIT_CORRELATION_SALT=NEW` を Cloudflare Secrets に投入
  4. 7 日間 dual-hash 期間 / HIGH alert 連続性 ≥ 99% を監視
  5. `rotate-salt.sh --end-rotation --env staging` で `AUDIT_CORRELATION_SALT_PREVIOUS` を削除
- **rollback 手順**: `--apply` 後 24h 以内に問題発覚 → `AUDIT_CORRELATION_SALT=OLD` に戻し `AUDIT_CORRELATION_SALT_PREVIOUS` 削除（OLD で計算した hash と従来 v1 hash が一致するため continuity 保持）
- **fingerprintVersion=2 移行範囲**: rotation apply 後の新規 audit record に対してのみ `fingerprintVersion=2` を付与。既存 v1 record は backfill しない（cross-version correlate で merge）
- **production scope 外宣言**: 本タスクは staging のみ。production rotation は user gate 後の別タスク
- **CI gate 候補**: `shellcheck scripts/audit-correlation/rotate-salt.sh` を将来 `.github/workflows/verify-shell.yml` に追加する候補として記録（本タスクでは gate 化しない）
- **不変条件 / 禁止事項**:
  - salt 実値を log / docs / コミットに残さない
  - `wrangler` 直接実行禁止（`scripts/cf.sh` 経由）
  - production rotation は本タスクスコープ外
  - Issue #555 は CLOSED のまま（reopen / close しない）

### 2. `system-spec-update-summary.md`

aiworkflow-requirements への反映ログ。期待行数: 60-150 行。

- `references/audit-correlation.md`: dual-hash 機構 / fingerprintVersion=2 / cross-version correlate のセクション追加
- `references/deployment-secrets-management.md`: `AUDIT_CORRELATION_SALT` / `AUDIT_CORRELATION_SALT_PREVIOUS` の rotation SOP / rotate-salt.sh の役割追記
- `indexes/topic-map.md`: 新規 topic「salt rotation automation」「fingerprint version migration」を追加
- `indexes/keywords.json`: 追加キーワード（最低 5 件）
  - `audit-correlation-salt-rotation`
  - `dual-hash-window`
  - `fingerprint-version-migration`
  - `rotate-salt-sh`
  - `cross-version-correlate`
- 再生成コマンド: `mise exec -- pnpm indexes:rebuild`、evidence は `outputs/phase-12/indexes-rebuild.log`
- consumed trace: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md` を consumed marker に書き換え（Issue #555 / 本タスク dir への参照を明記）

### 3. `documentation-changelog.md`

新規 / 編集ファイルを表形式で列挙。期待行数: 50-100 行。

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/audit-correlation/redact.ts` | 編集 | dual-hash 生成 / fingerprintVersion=2 出力 |
| `apps/api/src/audit-correlation/correlate.ts` | 編集 | v1 / v2 cross-version merge ロジック |
| `apps/api/src/audit-correlation/__tests__/redact.test.ts` | 編集 | TC-01..03 追加 |
| `apps/api/src/audit-correlation/__tests__/correlate.test.ts` | 編集 | TC-04 追加 |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/baseline.json` | 新規 | rotation 前 fixture |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/dual-hash-window.json` | 新規 | dual-hash 期間 fixture |
| `apps/api/src/audit-correlation/__tests__/fixtures/rotation/post-rotation.json` | 新規 | rotation 後 fixture |
| `scripts/audit-correlation/rotate-salt.sh` | 新規 / 編集 | dry-run / apply / end-rotation サブコマンド |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | 編集 | dual-hash / fingerprintVersion=2 セクション追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | rotation SOP 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 | 新 topic 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | 5 キーワード追加 |
| `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md` | 書き換え | consumed marker |

### 4. `unassigned-task-detection.md`

**0 件でも出力必須**。期待行数: 40-80 行。後続タスク化候補:

- 全 secret 共通 rotation 基盤（`SESSION_SECRET` / `AUTH_SECRET` 等の rotation も同じ dual-hash パターンに乗せる framework 化）
- fingerprintVersion=3 移行 framework（v2 → v3 への汎用パイプライン）
- production rotation 自動化（本タスクは staging のみ。production は user gate + 段階展開タスクが別途必要）
- v1 hash 残置 record の長期保持ポリシー（GDPR / 監査保管期間との整合）

判定理由は本タスクの SCOPE が `staging only` / `AUDIT_CORRELATION_SALT のみ` であることを明記。

### 5. `skill-feedback-report.md`

task-specification-creator skill への feedback。**3 観点固定**。期待行数: 50-100 行。

1. **テンプレート観点**: dual-hash / cross-version migration を扱うタスクで「rotation 期間 = N 日」という時間軸 evidence が evidence template に組み込めるか（Phase 11 で 7 日 window 監視を NON_VISUAL evidence として扱う必要があった）
2. **ワークフロー観点**: `blocked_upstream_pending`（親タスク完了待ち）と `blocked_pending_user_approval`（runtime apply user gate）の 2 種類の block 状態が共存するケースで、Phase 11 の状態遷移が明示できたか
3. **ドキュメント観点**: secret rotation のような「実値を絶対に書かない」制約を CONST_005「変更対象ファイル」「副作用」セクションで安全に表現できたか

### 6. `phase12-task-spec-compliance-check.md`

compliance 検証チェックリスト。期待行数: 50-100 行。

- [ ] Phase 1-13 すべてに index.md からの参照が通っている
- [ ] artifacts.json の `phases.phase-N.outputs` がすべて実体ファイルと一致
- [ ] Phase 12 の 6 必須成果物がすべて実体配置（implemented-local 以降）
- [ ] Phase 11 が `blocked_upstream_pending` を維持（親 FU-01 未完の間）または evidence 実体配置
- [ ] index.md / artifacts.json の `claudeCodeContext` の値が Phase 13 の `gh pr create` 引数と一致
- [ ] `status:unassigned` ラベルが PR 側に付与されない仕様になっている
- [ ] consumed trace が起票元 unassigned-task spec に反映済
- [ ] CI `verify-indexes-up-to-date` gate clean（`pnpm indexes:rebuild` 後）
- [ ] Issue #555 が CLOSED のまま（reopen / close 操作なし）
- [ ] salt 実値が docs / log / commit に残っていない

## 変更対象ファイル（Phase 12 自身）

| ファイル | 種別 |
| --- | --- |
| `outputs/phase-12/phase-12.md` | 本ファイル（索引） |
| `outputs/phase-12/implementation-guide.md` | 新規 |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 |
| `outputs/phase-12/documentation-changelog.md` | 新規 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 |
| `outputs/phase-12/skill-feedback-report.md` | 新規 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 |
| `outputs/phase-12/indexes-rebuild.log` | 新規（実装完了時） |

## 検証コマンド

```bash
# SSOT 反映後の indexes 再生成
mise exec -- pnpm indexes:rebuild \
  2>&1 | tee outputs/phase-12/indexes-rebuild.log

# CI 整合確認
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Issue 状態確認（CLOSED 維持を確認）
gh issue view 555 --json state,title \
  | tee outputs/phase-12/issue-555-state.log
# 期待: state=CLOSED
```

## 入力 / 出力 / 副作用

- 入力: Phase 10 vitest 結果 / Phase 11 staging evidence（解除後）
- 出力: 6 必須成果物 + indexes-rebuild.log + issue-555-state.log
- 副作用: aiworkflow-requirements references / indexes の編集と再生成（git diff に現れる）

## DoD

- [ ] 6 必須成果物すべて実体配置（`implemented-local` 以降）
- [ ] `implementation-guide.md` に Part 1 / Part 2 両方が含まれる
- [ ] `unassigned-task-detection.md` が 0 件の場合でも判定理由付きで存在
- [ ] `system-spec-update-summary.md` に `pnpm indexes:rebuild` evidence への参照
- [ ] consumed trace が起票元 spec (`U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md`) に反映
- [ ] Issue #555 が CLOSED のまま
- [ ] salt 実値が一切 docs / log に書かれていない（grep 確認）

## 成果物

- `outputs/phase-12/phase-12.md`（本ファイル / 索引）
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/indexes-rebuild.log`
- `outputs/phase-12/issue-555-state.log`

## 次 Phase の前提条件

6 必須成果物すべての実体配置と compliance check PASS。Phase 13（PR 作成）は user 明示承認後にのみ実行。
