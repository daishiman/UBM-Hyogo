# Phase 4: 検証シナリオ設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 目的 | fixture export / dry-run / redaction grep / restore drill の検証シナリオを契約として確定する |
| 状態 | drafted |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 の契約（30 日境界 / redaction 二重化 / manifest 2-phase commit / 半期 restore drill）と Phase 2 のデータモデル、Phase 3 のアーキテクチャを所与として、以下の検証シナリオを「実装着手前に固定すべきテスト契約」として確定する。

1. fixture audit log（30 日境界をまたぐ合成データ）の生成方針
2. dry-run export（R2 PutObject を skip し manifest と JSONL stdout のみ出力するモード）
3. redaction 検証シナリオ（5 pattern が R2 object に含まれないことの fail-closed 検証）
4. restore drill シナリオ（R2 → 一時 D1 → row count / sha256 照合 → tmp drop）
5. 異常系（D1 制約違反 / R2 PUT 失敗 / GitHub Issue 起票）の境界条件

## 統合テスト連携

NON_VISUAL implementation。本 Phase で確定するシナリオは Phase 6（focused unit test）/ Phase 8（統合テスト）/ Phase 11（runtime evidence）の三段階で再利用する:

- Phase 6: `__tests__/*.spec.ts` で fixture / dry-run / redaction / restore の単体検証
- Phase 8: preview env の R2 / D1 を使った fixture-driven 統合検証
- Phase 11: production initial export の実 evidence（object listing + manifest 行 + restore drill log）

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
| --- | --- | --- |
| `scripts/cf-audit-log/__fixtures__/audit-rows.ts` | 新規 | fixture audit log の合成（30 日境界跨ぎ・redaction 違反パターン込み） |
| `scripts/cf-audit-log/__fixtures__/redaction-violations.ts` | 新規 | 5 pattern の violation サンプル（先頭 32 文字のみ・log にも redacted） |
| `scripts/cf-audit-log/__fixtures__/r2-mock.ts` | 新規 | R2Client interface の in-memory 実装（PutObject / GetObject / listObjects） |
| `scripts/cf-audit-log/__fixtures__/d1-mock.ts` | 新規 | D1 SELECT cursor / manifest INSERT/UPDATE の in-memory 実装 |
| `docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/phase-04.md` | 新規 | 本ファイル |

> 実体（fixture モジュール）の TypeScript は Phase 5 で書く。本 Phase はシナリオ契約と入出力の確定のみ。

## fixture 設計

### F-1. window 境界 fixture

`generateAuditFixture()` は以下 3 区分の行を生成する:

| 区分 | occurred_at | export 対象か | 期待 manifest |
| --- | --- | --- | --- |
| A. window 内（now-29d 〜 now-26d） | UTC 各日 00:30 / 12:30 / 23:30 | 含む | `status='completed'` で 3 行 (`(yyyy, mm, dd)` 単位) |
| B. window 直前（now-30d 〜 now-29d 1 秒前） | UTC 23:59:59 | 含まない | manifest 0 行 |
| C. window 直後（now-26d + 1 秒 〜 now） | UTC 00:00:01 | 含まない | manifest 0 行 |

> 30 日境界レース条件は **「occurred_at < now - 26d AND occurred_at >= now - 29d」** の半開区間で解決する。本 fixture はこの境界条件を所与として生成する。

### F-2. 行数 fixture

- minimum: 0 行（window 内に該当無し → row_count 0 の manifest / 空 JSONL.gz PUT を作成し、当該 partition を監査済みにする）
- typical: 1 日あたり 100 行 × 3 日 = 300 行
- max: 1 日あたり 10,000 行 × 3 日 = 30,000 行（gzip 後の Workers CPU time / sub-request 上限の境界検証）

### F-3. redaction 違反 fixture

5 pattern を cold-storage 変換後も残る列（例: `resource_id` / 追加 metadata column）に意図的に混入させた行を生成する:

| pattern | sample 形（fixture 内・grep 対象） |
| --- | --- |
| `api-token` | `Bearer cf_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `ipv4-full` | `203.0.113.42`（truncated でない完全 IPv4） |
| `ipv6-full` | `2001:db8::1234:5678:9abc:def0`（truncated でない完全 IPv6） |
| `user-agent-plain` | `Mozilla/5.0 (Macintosh; Intel ...) AppleWebKit/537.36`（hash されていない平文 UA） |
| `email-plain` | `actor@example.com`（local-part hash 化されていない平文 email） |

各 pattern について: (a) 1 行混入 → export 全体が fail-closed (b) 0 件 → 正常終了。

## dry-run export シナリオ

### D-1. 入出力契約

`exportToR2({ ...opts, dryRun: true })` は以下の挙動を保証する:

- D1 SELECT は実行する（read-only なので副作用無し）
- redaction-guard は実行する（fail-closed の検証は dry-run でも有効）
- JSONL build / sha256 / gzip は実行する
- R2 PutObject は **呼ばない**（R2Client mock の `putObject` 呼び出し回数 = 0）
- manifest INSERT は **行わない**（D1 mock の `cf_audit_log_export_manifest` 行数 = 0）
- 戻り値の `manifests[].status` は `'pending'` で停止し、object key / row_count / sha256 / compressed_bytes だけ算出される
- stdout に JSONL の先頭 5 行と sha256 / object key / 推定 size がログ出力される

### D-2. dry-run の用途

| 用途 | 受け入れ条件 |
| --- | --- |
| 実装後ローカル検証 | `bash scripts/cf.sh r2 export --env preview --dry-run` で exit 0 + JSONL stdout |
| CI smoke gate（Phase 8） | preview env で fixture を流し、object key / row_count を assertion |
| 障害調査 | redaction guard ヒット時に **どの pattern がどの行で出たか** を log だけで再現できる |

## redaction 検証シナリオ

### R-1. fail-closed 契約

| ケース | 期待挙動 |
| --- | --- |
| violation 0 件 | `guardJsonlOrThrow` は return（throw しない） |
| violation 1 件以上 | `RedactionViolationError` を throw、`exportToR2` は manifest INSERT を行わず exit 非 0 |
| dry-run + violation 1 件以上 | dry-run でも throw（dry-run は redaction guard を skip しない） |

### R-2. R2 object 内不在検証（Phase 8 統合テスト）

preview env で実 R2 PUT を行い、対応する object を GetObject → gunzip → 5 pattern の grep を再実行し、ヒット 0 件であることを assertion する。

```bash
# Phase 8 で実行する統合テスト（疑似）
bash scripts/cf.sh r2 export --env preview --dry-run=false
mise exec -- pnpm vitest run scripts/cf-audit-log/__tests__/redaction-guard.integration.spec.ts
```

### R-3. log redaction

violation エラーログ自身に違反値を含めない:

- `RedactionViolation.sample` は **先頭 32 文字のみ** + 末尾 `...redacted`
- GitHub Actions log への出力時も同様（stdout / stderr 双方）
- `console.error(JSON.stringify(violations))` の戻り値も 32 文字以内に切り詰める

## restore drill シナリオ

### Rd-1. 正常系（半期実行・row count / sha256 一致）

| step | 入力 | 期待 |
| --- | --- | --- |
| 1. R2 listObjects | prefix `audit/v1/` | 1 件以上 |
| 2. random-pick 1 | listing からランダム 1 object | 抽選結果 1 object |
| 3. R2 GetObject | 抽選 object | body + metadata（`x-amz-meta-row-count` / `x-amz-meta-sha256`） |
| 4. gunzip + JSON.parse 行毎 | body | row 配列 |
| 5. tmp テーブル CREATE / INSERT | `cf_audit_log_restore_tmp_<runId>` | 全行 INSERT 成功 |
| 6. SELECT COUNT(*) | tmp テーブル | manifest.row_count と一致 |
| 7. sha256 再計算 | JSONL 連結 | manifest.sha256 と一致 |
| 8. tmp DROP | tmp テーブル | DROP 成功 |
| 9. drilled 配列に追加 / ok=true | - | exit 0 |

### Rd-2. 異常系

| ケース | 期待挙動 |
| --- | --- |
| row count 不一致 | `ok=false`、GitHub Issue 起票（`priority:high / type:security`）、tmp は DROP（fail でも掃除）、exit 非 0 |
| sha256 不一致 | 同上（破損 or 改竄の可能性として security label） |
| R2 GetObject 404 | `ok=false`、Issue 起票（`type:operations`）、exit 非 0 |
| 半期外実行（month_utc が 1 / 7 以外） | `restoreDrill` 内で early return、exit 0、no-op log |
| listing 0 件 | `ok=true`（初回運用前・対象 object 不在時は no-op。G3-prod runtime evidence では manifest 行の存在を別途確認する） |

### Rd-3. tmp テーブル衝突

`runId` (workflow run UUID) を suffix に持つため衝突しない前提だが、テストでは:

- 同 runId で 2 回 restoreDrill を呼ぶ → 2 回目で `CREATE TABLE IF NOT EXISTS` が既存を尊重し、INSERT が冪等になることを確認（または明示的に DROP IF EXISTS から始める仕様で固定）

## 異常系シナリオ

| ID | 条件 | 期待挙動 |
| --- | --- | --- |
| E-1 | D1 SELECT 失敗（network） | manifest 未挿入、exit 非 0、retry は workflow 側で 3 回 |
| E-2 | redaction guard ヒット | manifest 未挿入、exit 非 0、Issue 起票（`priority:critical / type:security`） |
| E-3 | R2 PutObject 失敗 | manifest `status='failed'` で UPDATE、exit 非 0、Issue 起票 |
| E-4 | manifest INSERT 失敗（UNIQUE 制約） | 当該 partition を skip（既に completed の冪等動作）、他 partition は続行 |
| E-5 | manifest UPDATE 失敗（PUT 後） | manifest が `pending` のまま残留 → 次回実行で再 PUT は ifNoneMatch で skip、UPDATE のみ retry |
| E-6 | gzip OOM | exit 非 0、Issue 起票（`type:operations`）、partition を細分化する runbook へ誘導 |

## 入力・出力・副作用（Phase 全体まとめ）

- 入力: fixture audit rows（in-memory）、R2Client mock、D1 mock、redaction violation サンプル
- 出力: 検証契約表（本ファイル）、Phase 6 で実装する `__tests__/*.spec.ts` のケース一覧
- 副作用: なし（本 Phase は仕様のみ）

## テスト方針

本 Phase は仕様確定のみのため、テスト実装は Phase 6 で行う。本 Phase で確定するテストケース総数:

| spec ファイル | ケース数 |
| --- | --- |
| `__tests__/export-to-r2.spec.ts` | 8（window 境界 3 + dry-run 2 + 異常 3） |
| `__tests__/restore-drill.spec.ts` | 6（正常 1 + 異常 4 + 半期外 1） |
| `__tests__/redaction-guard.spec.ts` | 10（5 pattern × hit / non-hit 各 1） |
| `__tests__/redaction-guard.integration.spec.ts` | 1（preview env での R2 round-trip 不在検証） |

合計: **25 テストケース**（Phase 6 で全件実装）。

## ローカル実行・検証コマンド

```bash
# 本 Phase は仕様のみなのでテスト実行は Phase 6 から。本 Phase の DoD 検証は典拠ファイル整合のみ。

# 1. 本ファイルと Phase 1-3 の契約 / object key / redaction policy v1 の整合確認
mise exec -- pnpm lint docs/30-workflows/issue-514-cf-audit-logs-cold-storage-r2-export/phase-04.md

# 2. fixture / mock の TypeScript 型整合は Phase 5-6 で確認するため本 Phase では typecheck 対象外
```

## DoD（Phase 4 完了条件）

- [ ] window 境界 fixture (F-1) の 3 区分が UTC 半開区間で定義されている
- [ ] 行数 fixture (F-2) の minimum / typical / max が確定している
- [ ] redaction 違反 fixture (F-3) の 5 pattern それぞれにサンプル形が明記されている
- [ ] dry-run export (D-1) の R2 PUT 0 回 / manifest INSERT 0 件 / 戻り値 manifest preview ありの契約が明記されている
- [ ] redaction fail-closed (R-1) と log redaction (R-3) の契約が明記されている
- [ ] restore drill 正常系 (Rd-1) と異常系 (Rd-2) のシナリオが網羅されている
- [ ] 異常系 E-1 〜 E-6 が網羅され、Issue 起票条件が明示されている
- [ ] Phase 6 で実装するテストケース総数（25）が確定している
