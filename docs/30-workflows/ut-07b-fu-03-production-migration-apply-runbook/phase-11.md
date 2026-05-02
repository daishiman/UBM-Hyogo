# Phase 11: evidence 仕様（NON_VISUAL — bats / staging dry-run / CI gate / grep）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 11 |
| 状態 | spec_created |
| taskType | implementation / operations / runbook + scripts |
| visualEvidence | NON_VISUAL |

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（runbook 文書 + F1-F9 実装仕様 + CI gate） |
| 非視覚的理由 | UI/UX 変更を含まず、文書 + shell scripts + CI 設定の品質保証のみを行う。production D1 への実 apply は本タスクでは実行しない |
| 代替証跡 | (1) bats local 実行ログ / (2) staging `DRY_RUN=1` 模擬実行ログ / (3) CI gate（`d1-migration-verify.yml`）green ログ / (4) grep redaction / (5) 5 オブジェクト存在確認の SQL モデル出力 |
| Screenshot | UI/UX 変更なしのため不要（`screenshot-plan.json` は `screenshotsRequired: false` の NON_VISUAL plan） |

## evidence 構成

本 Phase は **想定 evidence の保存仕様** を確定する Phase で、実走 evidence は Phase 11 実施タスク（別タスク or operator 実施）で取得する。本仕様書では各 evidence ファイルの「期待出力 / 期待スキーマ / 検証手順」を定義する。

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言 + evidence index + 4 条件評価サマリ |
| `outputs/phase-11/manual-smoke-log.md` | bats local 実行（`pnpm test:scripts`）の期待 stdout / exit code |
| `outputs/phase-11/staging-dry-run.md` | `DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging` の期待出力 |
| `outputs/phase-11/grep-verification.md` | 機密値（Token / Account ID / OAuth）混入なし grep 検証手順 |
| `outputs/phase-11/redaction-check.md` | F3 evidence.sh redact 関数の検証（Token / Account ID / 40 文字級英数字の mask 確認） |
| `outputs/phase-11/structure-verification.md` | 5 オブジェクト存在確認の SQL（F2 postcheck.sh）期待出力 |
| `outputs/phase-11/manual-test-checklist.md` | 各 bats ケースのチェックリスト |
| `outputs/phase-11/manual-test-result.md` | 期待結果スキーマ（JSON / TAP 形式） |
| `outputs/phase-11/discovered-issues.md` | 仕様化過程の発見事項 |
| `outputs/phase-11/link-checklist.md` | 仕様書内リンクの整合性 |
| `outputs/phase-11/screenshot-plan.json` | NON_VISUAL のため `screenshotsRequired: false` を持つ plan object |

## 実行タスク

1. F1-F4 scripts と F7 bats の入出力 / 期待 stdout / exit code を本仕様書で確定する。
2. CI gate（F6 `.github/workflows/d1-migration-verify.yml`）の job 構成 / 期待 green ログ形式を確定する。
3. 各補助ファイルへ「期待 evidence」のスキーマ / コマンド / 期待出力を記述する。
4. Phase 11 実施時に operator が evidence を取得する手順を `manual-smoke-log.md` / `staging-dry-run.md` / `grep-verification.md` / `redaction-check.md` に展開する。

## bats unit tests 仕様（F7）

`scripts/d1/__tests__/` に以下 bats ファイル群を配置する想定。

| ファイル | 検証対象 | 主要ケース |
| --- | --- | --- |
| `preflight.bats` | F1 preflight.sh | (a) 対象 DB 名 allow-list 違反で exit=66 / (b) invalid env で exit=64 / (c) pending migration JSON |
| `postcheck.bats` | F2 postcheck.sh | (a) 5 オブジェクト全 hit で exit=0 / (b) 欠落検出 / (c) destructive SQL（DROP/DELETE/TRUNCATE）が含まれない |
| `evidence.bats` | F3 evidence.sh redact | (a) Token-like 40 文字英数字を `***REDACTED***` に置換 / (b) `account_id=[a-f0-9]{32}` を redact / (c) 通常 SQL 出力は redact しない |
| `apply-prod.bats` | F4 apply-prod.sh | (a) `DRY_RUN=1` で実 apply を呼ばず skipped postcheck evidence を保存 / (b) production 確認拒否で exit=20 / (c) preflight 失敗で apply 呼ばず exit=10 |

`pnpm test:scripts` の期待 stdout（TAP 形式）:

```
1..N
ok 1 preflight: rejects unknown db name
ok 2 preflight: requires --env production for prod
ok 3 preflight: propagates migrations list failure
ok 4 postcheck: returns 0 when all 5 objects exist
ok 5 postcheck: returns 4 when any object missing
ok 6 postcheck: contains no destructive SQL
ok 7 evidence: redacts 40+ char alphanumeric token
ok 8 evidence: redacts account_id 32-hex pattern
ok 9 evidence: preserves normal SQL output
ok 10 apply-prod: DRY_RUN=1 skips apply
ok 11 apply-prod: forces DRY_RUN=1 for non-staging in test
ok 12 apply-prod: stops at preflight failure
# all tests passed
```

期待 exit code: `0`。

## staging dry-run 仕様

```bash
DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging
```

期待 stdout（抜粋・staging 用に DB 名差し替え）:

```
[preflight] target db = ubm-hyogo-db-staging  env = staging
[preflight] migrations list (read-only):
  0001_*  applied
  ...
  0008_schema_alias_hardening  pending
[apply-prod] DRY_RUN=1 — skipping wrangler d1 migrations apply
[postcheck] DRY_RUN=1 — skipped schema existence check because migration apply was skipped
[evidence] writing to outputs/phase-11/staging-dry-run.md (redacted)
[apply-prod] exit=0
```

期待 exit code: `0`。本 Phase では `--env production` の実行を **一切記述しない / 実行しない**。

## CI gate 仕様（F6）

`.github/workflows/d1-migration-verify.yml` は次の条件で trigger / job を構成する想定。

| 項目 | 仕様 |
| --- | --- |
| trigger | `pull_request` で `apps/api/migrations/**` または `scripts/d1/**` または `scripts/cf.sh` または `.github/workflows/d1-migration-verify.yml` を変更 |
| job: bats | `pnpm install --frozen-lockfile` → `pnpm test:scripts` を実行、exit=0 を要求 |
| job: list-syntax-check | 任意（authorized PR のみ）staging Token で `bash scripts/d1/preflight.sh ubm-hyogo-db-staging --env staging` を実行 |
| 失敗時 | PR の `Required` checks を fail にして merge をブロック |

CI green の期待 log 抜粋:

```
✓ pnpm test:scripts (bats): 12 tests, 0 failures
✓ list-syntax-check (staging): preflight exit=0
```

## 検証カテゴリ A〜E

### A. 構造検証（runbook 章立て + F2 SQL の対象 5 オブジェクト網羅）

`outputs/phase-11/structure-verification.md` に F2 postcheck.sh の期待 SQL 出力（5 オブジェクト存在確認）と、Phase 5 runbook 本体の章立て grep 結果を記載。

### B. grep verification（対象オブジェクト網羅）

`outputs/phase-11/grep-verification.md` に対象 5 オブジェクト + 運用境界語の grep 結果を記載。期待 hit 件数を全て > 0。

### C. staging dry-run / bats / CI gate

`outputs/phase-11/manual-smoke-log.md`（bats local）+ `outputs/phase-11/staging-dry-run.md`（DRY_RUN=1 実走）+ CI gate green ログのリンクを記載。

### D. redaction 検証

`outputs/phase-11/redaction-check.md` に F3 evidence.sh の redact 関数のユニット結果と、phase-11 全体の grep redaction を記載。

### E. リンク整合 / 発見事項

`link-checklist.md` / `discovered-issues.md` に記録。

## production 値・Token 値・Account ID 値を残さないルール

- F4 apply-prod.sh は CI / staging で `DRY_RUN=1` を明示し、本 Phase の evidence には `DRY_RUN=0` の出力を含めない
- staging で実行する `migrations list` / `DRY_RUN=1 apply` は read-only 系のみ
- F3 evidence.sh の redact 関数で API Token / Account ID / 40 文字級英数字を `***REDACTED***` に置換
- `set -x` / `wrangler --debug` は使用禁止
- production の実 apply 結果は本 Phase で記録しない

## 4 条件評価

| 条件 | 内容 | 判定方法 |
| --- | --- | --- |
| 矛盾なし | bats / staging dry-run / CI gate の期待出力が runbook と F2/F3 SQL と一貫 | A・B・C 検証 cross check |
| 漏れなし | AC-1〜AC-20 が evidence ファイルで言及されている | manual-test-checklist で全 AC マッピング |
| 整合性あり | staging dry-run 出力 / bats stdout が F1-F4 仕様と一致 | C 検証 |
| 依存関係整合 | 上流 UT-07B の migration ファイル名 / オブジェクトと一致 | B 検証 |

## 完了条件

- [ ] bats 12 ケースの期待 stdout / exit code が `manual-smoke-log.md` に記載されている
- [ ] staging `DRY_RUN=1` の期待出力が `staging-dry-run.md` に記載されている
- [ ] CI gate（`d1-migration-verify.yml`）の job 構成と green log 形式が定義されている
- [ ] F3 evidence.sh redact 検証が `redaction-check.md` に記載されている
- [ ] 5 オブジェクト存在確認の期待 SQL 出力が `structure-verification.md` に記載されている
- [ ] grep redaction で Token 値 0 件 / Account ID 値 0 件 / production apply 結果値 0 件が宣言されている
- [ ] NON_VISUAL 宣言が `main.md` 冒頭に明記されている
- [ ] `screenshot-plan.json` が `screenshotsRequired: false` の NON_VISUAL plan object である
- [ ] 4 条件評価が全 PASS で記録されている

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/staging-dry-run.md`
- `outputs/phase-11/grep-verification.md`
- `outputs/phase-11/redaction-check.md`
- `outputs/phase-11/structure-verification.md`
- `outputs/phase-11/manual-test-checklist.md`
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/discovered-issues.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/screenshot-plan.json`

## 関連リンク

- `index.md`
- Phase 5 成果物（runbook 本体 / F1-F4 呼び出し手順）
- Phase 6 成果物（異常系 / exit code 設計）
- Phase 7 成果物（AC マトリクス AC-1〜AC-20）
- F1〜F9 実装仕様
- 上流: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/`

## 苦戦想定

- bats local 実行は spec_created 段階では実走できないため、CI gate green を merge 前提として明記。
- `--env production` を打鍵した時点で production 接続が走るため、本 Phase では `--env production` を **一切記述しない / 実行しない**。
- F3 redact 関数のテストで Token-like 文字列を bats 内に書くため、bats ファイル自体に対しても grep redaction が走るが、`***FAKE_TOKEN_***` 等のサンプル文字列は redact 対象外として扱う運用ルールを `redaction-check.md` に明記する。
- CI gate の `list-syntax-check` job は staging Token を要するため、authorized PR のみ実行とする条件分岐を F6 仕様で明記。
