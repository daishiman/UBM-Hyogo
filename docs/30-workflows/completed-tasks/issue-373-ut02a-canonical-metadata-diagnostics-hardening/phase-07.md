# Phase 7: AC マトリクス — issue-373-ut02a-canonical-metadata-diagnostics-hardening

[実装区分: 実装仕様書]

判定根拠: 本 Phase は元 unassigned task 完了条件 5 項目 + index.md AC 9 項目を、(a) AC ID、(b) 観点、(c) 検証コマンド、(d) 期待出力、(e) 担当 phase、(f) 関連 DT / AB、で 1:1 にマッピングする。実装変更は伴わないが、各 AC の機械検証コマンドが Phase 5 / 6 の実装結果に依存するため CONST_004 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-373-ut02a-canonical-metadata-diagnostics-hardening |
| task_id | UT-02A-FU-DIAG-001 |
| issue | #373 |
| spec | docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/ |
| phase | 7 / 13 |
| wave | ut-02a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 依存 phase | 1, 2, 3, 4, 5, 6 |
| 成果物 | `outputs/phase-07/main.md` |
| user_approval_required | false |

## 目的

Phase 1-6 の設計 / テスト / 実装 / 異常系を、機械検証可能な Acceptance Criteria 6 件 + index.md 既存 AC 9 件に統合し、(1) 検証コマンド、(2) 期待出力、(3) 担当 phase、(4) 関連 DT / AB、で 1:1 トレース可能にする。Phase 9 品質保証 / Phase 10 最終レビュー / Phase 11 evidence 取得の master checklist として使用する。

## 実行タスク

- AC-01〜AC-06 と index.md 既存 AC を対応付ける
- 各 AC の検証コマンド、期待出力、担当 Phase、evidence path を固定する
- Phase 9 / 10 / 11 が使う master checklist として整える

## AC マトリクス（コア 6 件）

### AC-01: manifest 再生成手順が決定論的

| 項目 | 値 |
| --- | --- |
| 観点 | 同一 source spec で 2 回連続実行して byte-identical |
| 検証コマンド | `mise exec -- pnpm regenerate:static-manifest && sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m1 && mise exec -- pnpm regenerate:static-manifest && sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m2 && diff /tmp/m1 /tmp/m2` |
| 期待出力 | diff 出力なし（exit 0）／ /tmp/m1 と /tmp/m2 が同一 hash |
| 担当 phase | Phase 5 Step 2 / Phase 11 evidence |
| 関連 DT | DT-05 / DT-06 / DT-07 |
| 関連 AB | AB-06 |
| evidence path | `outputs/phase-11/evidence/regenerate-determinism.log` |

### AC-02: stale manifest が CI で検出される

| 項目 | 値 |
| --- | --- |
| 観点 | sourceSpecHash drift 時に CI fail（exit 1）／ 健全時に PASS（exit 0） |
| 検証コマンド | (a) 健全: `mise exec -- pnpm verify:static-manifest`、(b) drift: `echo "" >> docs/00-getting-started-manual/specs/01-api-schema.md && mise exec -- pnpm verify:static-manifest 2> /tmp/drift.log; ec=$?; git checkout -- docs/00-getting-started-manual/specs/01-api-schema.md; [ $ec -eq 1 ]` |
| 期待出力 | (a) exit 0 / "OK"、(b) exit 1 / stderr に `sourceSpecHashDrift` |
| 担当 phase | Phase 5 Step 3, Step 8 / Phase 6 AB-01 / Phase 11 |
| 関連 DT | DT-01 / DT-02 / DT-15 |
| 関連 AB | AB-01 / AB-02 / AB-03 |
| evidence path | `outputs/phase-11/evidence/verify-static-manifest.log` |

### AC-03: unknown stable key 件数が構造化ログとして出力される

| 項目 | 値 |
| --- | --- |
| 観点 | `buildSectionsWithDiagnostics()` が unknown 検出時に `code: "UBM-MANIFEST-UNKNOWN-KEY"` で logWarn 1 回呼び、件数 / stableKeys を含む |
| 検証コマンド | `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared/__tests__/builder.diagnostics.test.ts --reporter=verbose` |
| 期待出力 | DT-08 / DT-09 / DT-10 / DT-17 / DT-18 が GREEN |
| 担当 phase | Phase 5 Step 6 / Phase 11 |
| 関連 DT | DT-08 / DT-09 / DT-10 / DT-17 / DT-18 |
| 関連 AB | AB-05 |
| evidence path | `outputs/phase-11/evidence/builder-diagnostics-sample.json` |

### AC-04: 03a alias queue adapter contract test が GREEN

| 項目 | 値 |
| --- | --- |
| 観点 | `AliasQueueAdapter` interface の dryRun success / failure / unknown transit / 未注入の 4 経路が PASS |
| 検証コマンド | `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts --reporter=verbose` |
| 期待出力 | DT-11 / DT-12 / DT-13 / DT-14 が GREEN（4/4 PASS） |
| 担当 phase | Phase 5 Step 7 / Phase 11 |
| 関連 DT | DT-11 / DT-12 / DT-13 / DT-14 |
| 関連 AB | AB-04 |
| evidence path | `outputs/phase-11/evidence/test-results.log` |

### AC-05: retirement 条件が正本仕様に明記される

| 項目 | 値 |
| --- | --- |
| 観点 | `docs/00-getting-started-manual/specs/01-api-schema.md` に「Static Manifest Retirement Condition」節があり、metadata.ts コメントから参照される |
| 検証コマンド | `grep -q 'Static Manifest Retirement Condition' docs/00-getting-started-manual/specs/01-api-schema.md && grep -q 'Static Manifest Retirement Condition' apps/api/src/repository/_shared/metadata.ts` |
| 期待出力 | 両 grep が exit 0 |
| 担当 phase | Phase 5 Step 5 / Step 9 / Phase 12 |
| 関連 DT | DT-16 |
| 関連 AB | （該当なし） |
| evidence path | `outputs/phase-11/evidence/retirement-condition.log` |

### AC-06: 既存 metadata.test.ts / builder.test.ts が壊れない

| 項目 | 値 |
| --- | --- |
| 観点 | 既存テストが regression なし、追加 case のみ増分 |
| 検証コマンド | `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --reporter=verbose` |
| 期待出力 | 既存テスト全 GREEN + 追加 DT が GREEN（failed=0） |
| 担当 phase | Phase 5 Step 5, Step 6 / Phase 9 |
| 関連 DT | 既存全 + DT-15 / DT-16 / DT-17 / DT-18 |
| 関連 AB | （該当なし） |
| evidence path | `outputs/phase-11/evidence/test-results.log` |

## index.md 既存 AC との突合（補完 9 件）

index.md 87-99 行で定義済の AC を本マトリクスと対応させる。

| index AC | 本マトリクス対応 | 補足 |
| --- | --- | --- |
| `pnpm verify:static-manifest` 健全 PASS / drift FAIL | AC-02 | (a)(b) 双方を 1 AC に統合 |
| `pnpm regenerate:static-manifest` 決定論性 | AC-01 | sha256 一致で実測 |
| `static-manifest.json` に sourceSpecHash / sourceSpecVersion 追加 | AC-01 補足 | DT-05 / DT-06 / DT-07 で構造検証 |
| `buildSectionsWithDiagnostics()` 構造化ログ | AC-03 | logWarn mock spy |
| `alias-queue-adapter.contract.test.ts` PASS（最低 3 ケース） | AC-04 | DT-11/12/13 + DT-14 で 4 ケース |
| `metadata.test.ts` に hash drift simulation 追加 | AC-02 補足 | DT-15 |
| CI に verify-static-manifest gate 追加 | AC-02 補足 | Phase 5 Step 8 / `.github/workflows/ci.yml` |
| `01-api-schema.md` に retirement 条件追記 | AC-05 | grep 検証 |
| typecheck / lint / api test 全 PASS | AC-06 補足 | Phase 9 で再検証 |

すべての index AC が AC-01〜AC-06 に被覆されている（漏れなし）。

## AC 検証実行コマンド一括

```bash
# AC-01 determinism
mise exec -- pnpm regenerate:static-manifest && sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m1
mise exec -- pnpm regenerate:static-manifest && sha256sum apps/api/src/repository/_shared/generated/static-manifest.json > /tmp/m2
diff /tmp/m1 /tmp/m2

# AC-02 verify (健全 + drift)
mise exec -- pnpm verify:static-manifest
echo "" >> docs/00-getting-started-manual/specs/01-api-schema.md
mise exec -- pnpm verify:static-manifest 2> /tmp/drift.log; echo "exit=$?"
git checkout -- docs/00-getting-started-manual/specs/01-api-schema.md

# AC-03 / AC-04 / AC-06 test suite
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared --reporter=verbose

# AC-05 retirement condition
grep -q 'Static Manifest Retirement Condition' docs/00-getting-started-manual/specs/01-api-schema.md
grep -q 'Static Manifest Retirement Condition' apps/api/src/repository/_shared/metadata.ts

# Phase 9 全体検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 失敗時の判定基準

| AC | 失敗条件 | 切り分け |
| --- | --- | --- |
| AC-01 | sha256 不一致 | AB-06 切り分け表に従う（Date.now / Object.keys 順序 / 改行） |
| AC-02 | drift で exit 1 にならない | Phase 5 Step 3 の比較ロジック / canonicalize 確認 |
| AC-03 | logWarn 呼び出し回数 ≠ 1 / 引数 mismatch | Phase 5 Step 6 の if ガード位置 / 引数構築確認 |
| AC-04 | DT-11〜DT-14 の 1 つでも fail | Phase 5 Step 7 の adapter 注入経路 / fake モック確認 |
| AC-05 | grep ヒットなし | Phase 5 Step 5 / Step 9 の追記漏れ |
| AC-06 | 既存テストの 1 つでも fail | Step 6 で戻り値 shape を変更してしまった疑い → DT-10 確認 |

## 不変条件マッピング

| 不変条件 | 対応 AC |
| --- | --- |
| #1 schema 固定しすぎない | AC-01 / AC-02（spec → manifest 一方向 + drift 検出） |
| #5 D1 / apps/api 境界 | AC-04（contract test は apps/api 内 fake adapter のみ） |
| #14 free-tier | 全 AC が repo ローカル + GitHub Actions のみで、Cloudflare 課金なし |

## DoD

- [ ] AC-01〜AC-06 6 件が「観点 / コマンド / 期待出力 / 担当 phase / 関連 DT・AB / evidence path」の 6 列で確定
- [ ] index.md 既存 AC 9 件と本マトリクス AC-01〜AC-06 が漏れなく対応
- [ ] 検証コマンドが `mise exec --` プレフィックス付きで再現可能
- [ ] 失敗時切り分けが各 AC に紐づいている
- [ ] 不変条件 #1 / #5 / #14 が AC 単位でマッピング済み
- [ ] CONST_007: 先送り表現なし

## 完了条件

- [ ] AC マトリクス 100% GREEN になることが Phase 11 で実測可能
- [ ] AC 検証実行コマンド一括が Phase 9 / Phase 11 でそのまま実行可能
- [ ] visualEvidence = NON_VISUAL（screenshot 不要）

## 参照資料

- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/phase-01.md`〜`phase-06.md`
- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/index.md`（既存 AC 9 件）
- `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/artifacts.json`
- `apps/api/src/repository/_shared/metadata.ts` / `builder.ts`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `.github/workflows/ci.yml`

## 統合テスト連携

- 上流: Phase 5 実装ランブック（実装完了）/ Phase 6 異常系シナリオ
- 下流: Phase 8 DRY 化（共通化対象抽出）／ Phase 9 品質保証（AC 一括 GREEN 検証）／ Phase 11 evidence

## 多角的チェック観点

- 不変条件 #1 / #5 / #14 が AC マトリクスから漏れていない
- index.md AC 9 件が本マトリクス 6 件で被覆されている（漏れ 0）
- 検証コマンドが Phase 11 evidence path と一致
- AC と DT / AB の対応が双方向（DT/AB から AC を逆引き可能）

## サブタスク管理

- [ ] AC-01〜AC-06 を Phase 11 で実測 log として保存
- [ ] AC 検証実行コマンド一括スクリプトを Phase 9 で `scripts/check-ac-matrix.sh` 等にまとめるか検討（任意・必須ではない）
- [ ] `outputs/phase-07/main.md` を Phase 11 で実測値とともに作成

## 成果物

- `outputs/phase-07/main.md`

## 次 Phase への引き渡し

Phase 8 へ:

- AC-01〜AC-06 と DT-01〜DT-18 / AB-01〜AB-06 の対応表
- AC 検証実行コマンド一括（Phase 9 で再利用）
- evidence path 6 件（regenerate-determinism / verify-static-manifest / diagnostics-sample / test-results / retirement-condition / abnormal/AB-XX）
- DRY 化対象候補（Step 2 / Step 3 で重複する hash 計算ロジック → Phase 8 で共通化検討）
