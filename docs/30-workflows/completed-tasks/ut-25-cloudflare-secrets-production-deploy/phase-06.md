# Phase 6: 異常系検証（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（`--env` 漏れ / op 失敗 / 改行破損 / list 遅延 / `.dev.vars` 値ずれ / governance 連携メモ） |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending（仕様化のみ完了 / 実走は Phase 11 / 13） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |

## 目的

Phase 4 の T1〜T5（happy path）に加えて、**fail path / 回帰 guard** を T6〜T11 として固定する。本 Phase は「壊れ方が予想範囲を超えないか」「rollback / 緊急対応が期待通り動くか」「`--env` 漏れで production 誤上書きが起こらないか」「op アクセス失敗時に空 stdin が put されないか」「JSON 改行破損による 401/403 が UT-26 で検出されるか」「`wrangler secret list` の name 表示遅延に runbook が耐えるか」「production 適用後 `.dev.vars` との値ずれを検知できるか」を仕様レベルで網羅する。実走は Phase 11 smoke / Phase 13 ユーザー承認後 put に委譲する。

**MINOR UT25-M-02（`--env` 漏れ）の本体異常系を T6 として確定する。**

## 依存タスク順序

Phase 5 Step 0 ゲート（UT-03 / 01b / 01c / `.gitignore` / Phase 13 承認）が PASS した前提で fail path を扱う。Step 0 NO-GO の場合は本 Phase の T6〜T11 すべてが評価不能となる（前提未充足が異常系発生源）。

## 実行タスク

- タスク1: T6〜T11 の 6 件（`--env` 漏れ / op 失敗 / 改行破損 / list 遅延 / `.dev.vars` 値ずれ / governance 連携メモ）を定義する。
- タスク2: 各 T のシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応を表化する。
- タスク3: 実走を Phase 11 / 13 に委譲する範囲を明記する。
- タスク4: MINOR UT25-M-02 を T6 として固定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-04.md | T1〜T5 happy path |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-05.md | 7 ステップランブック / rollback 骨格 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-02/main.md | 投入経路 / state ownership / wrangler.toml env 切替 |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md §苦戦箇所 | 5 リスク |
| 必須 | scripts/cf.sh | op 注入失敗時の挙動 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-06.md | フォーマット参照 |

## 実行手順

1. Phase 4 happy path と Phase 5 ランブックを確認する。
2. T6〜T11 をシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応に分解する。
3. Phase 7 の AC マトリクス入力として引き渡す。

## 統合テスト連携

T6〜T11 のうち実 put を伴うもの（T6 の `--env` 漏れ実走 / T9 の list 遅延実走）は **Phase 13 ユーザー承認後** の Phase 11 smoke で実走する。本 Phase は fail path 仕様の正本化のみ。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-06/main.md | T6〜T11 のテスト一覧 / 期待値 / 観測手順 |
| メタ | artifacts.json `phases[5].outputs` | `outputs/phase-06/main.md` |

## 異常系テスト一覧

### T6: `--env` 漏れによる top-level 誤上書き（UT25-M-02 本体）

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 観点 | wrangler.toml env 宣言 ↔ `--env` 値の照合（§苦戦箇所 2） |
| シナリオ | `--env` 引数を省略して `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml`（`--env` 不在）→ wrangler が top-level Worker（preview / 既定名前空間）に投入し、staging / production 双方で name が出ない / 誤環境に値配置 |
| 検証コマンド | (1) `--env` 省略コマンドを実走（**Phase 11 smoke で staging 想定でのみ実走、production では絶対実走しない**）→ (2) `bash scripts/cf.sh secret list --env staging` で name 不在を確認 → (3) `bash scripts/cf.sh secret list`（`--env` 省略）で top-level 投入を検出 → (4) top-level に投入された値を即時 delete |
| 期待値 | 省略時に staging / production 両 env list で name が出ない。top-level list で意図せず投入された name が検出され、即時 delete で除去できる |
| Red 状態（仕掛け） | `--env` 省略がエラーで停止せず、top-level に投入される / runbook が「省略時は top-level に行く」事実を記載していない |
| 対応 | runbook で `ENV_TARGET=...` を変数経由で必ず指定し、未設定時に `: "${ENV_TARGET:?ENV_TARGET required}"` で fail-fast。Phase 5 Step 3 / 5 でこのガード手順を必須化。CI 候補として Phase 12 unassigned-task-detection.md に登録 |

### T7: 1Password アクセス失敗による空 stdin put

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 観点 | `op read` 失敗時の fail-fast |
| シナリオ | 1Password CLI 未認証 / vault 名間違い / Item 名間違い / network 切断 → `op read` が exit 1 を返すが、shell pipefail 未設定だと空 stdin が wrangler に流れて空文字列 secret が登録される |
| 検証コマンド | (1) `set -o pipefail` を runbook 冒頭で必須化していることを確認 → (2) 故意に存在しない参照 `op read 'op://NoSuch/NoSuch/NoSuch' \| bash scripts/cf.sh secret put ... --env staging` を staging で実行 → (3) pipefail で全体が exit 1、name が **list に出現しない** ことを確認 |
| 期待値 | pipefail で put 全体が失敗 / staging list に name が出現しない / log に `op read` のエラーメッセージが残る |
| Red 状態 | pipefail 未設定で put が exit 0 を返し、空文字列 secret が runtime に配置される（UT-26 で 401 として検出されるが、原因特定が遅れる） |
| 対応 | runbook の冒頭に `set -euo pipefail` を必須化。`op` 認証状態を Step 0 で確認（`op whoami` の exit 0）。Phase 11 smoke で staging で意図的に故意失敗ケースを実走 |

### T8: JSON `private_key` 改行破損による 401/403

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 観点 | `private_key` の `\n` 改行保全（§苦戦箇所 3） |
| シナリオ | 1Password Item に SA JSON が文字列として保存されており、`private_key` 内の改行が `\\n` リテラルにエスケープ済み → put 後の Workers Secret は文字列としては valid だが、Sheets API 認証時に `private_key` 復号失敗で 401/403 |
| 検証コマンド | (1) put 前 `op read 'op://...' \| jq -r '.private_key' \| grep -c 'BEGIN PRIVATE KEY'` が >=1 であることを確認（T4 と同等）→ (2) put 後の機能確認は **UT-26 に委譲**（UT-25 では値読取不能のため検出できない）→ (3) UT-26 で 401/403 を検出した場合は本 T8 のシナリオを疑い rollback |
| 期待値 | put 前 jq で `BEGIN PRIVATE KEY` ヒット / UT-26 で 401/403 が出ない |
| Red 状態 | jq では valid だが UT-26 で 401/403 が返る（=改行破損が put 経路ではなく 1Password 側の保管形式に起因） |
| 対応 | put 前 jq 検査を Phase 5 Step 2 で必須化（T4）。401/403 検出時の rollback 経路（rollback-runbook.md §5.2 緊急 rollback）に「改行破損疑い」を記載。1Password Item 再保存ガイドを runbook 注記化 |

### T9: `wrangler secret list` の name 表示遅延

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 観点 | put 直後の eventual consistency |
| シナリオ | put コマンドが exit 0 を返した直後に list を実行すると、Cloudflare Edge の伝播遅延（数秒〜十数秒）で name が出ない場合がある → 「失敗した」と誤認して再 put や rollback を走らせる |
| 検証コマンド | (1) put 直後に `bash scripts/cf.sh secret list --env staging` を 1 回実行 → (2) name 不在なら 30 秒待機 → list 再実行 → (3) 3 回までリトライしてから失敗判定 |
| 期待値 | 30 秒以内のリトライで name 出現 / リトライ後も不在なら真の失敗として rollback 経路へ |
| Red 状態 | 1 回目の不在で即時 rollback を走らせ、name は実は配置済みのところに delete + 再 put を重ねて lap 状態を作る |
| 対応 | Phase 5 Step 4 / 6 のリストにリトライ手順（30 秒 × 最大 3 回）を runbook 必須化。Phase 11 smoke で実走時間を計測しベースラインに反映 |

### T10: production 適用後の `.dev.vars` 値ずれ

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 観点 | ローカル `.dev.vars` ↔ Cloudflare Secret の正本一致（正本 = 1Password / §苦戦箇所 5） |
| シナリオ | production 適用後にローカル開発者が `.dev.vars` に古い op 参照（旧 vault / 旧 Item 名）を残したまま wrangler dev を起動 → ローカルでは Sheets API 認証成功するが production と異なる SA JSON で動作している lap 状態 |
| 検証コマンド | (1) `.dev.vars` の op 参照値（vault / Item 名）と、production put で使った op 参照値が一致することを目視突合 → (2) `op read '<dev.vars 参照>' \| jq -r '.client_email'` と `op read '<production 投入時参照>' \| jq -r '.client_email'` の出力一致を確認（client_email は表示しても通常 leak リスク低だが、log 残留禁止） |
| 期待値 | 両参照の `client_email` 等メタ情報が一致 / `.dev.vars` が旧参照を保持していない |
| Red 状態 | `.dev.vars` 参照が旧 vault / 旧 Item で、ローカル動作と production 動作が分岐 |
| 対応 | 1Password 正本の参照パス（`op://Vault/SA-JSON/credential`）をプロジェクト規約として README / runbook に固定。`.dev.vars` を更新する手順を runbook §post-rotation に追加 |

### T11: governance 連携メモ（`enforce_admins` の影響なし確認）

| 項目 | 内容 |
| --- | --- |
| ID | T11 |
| 観点 | UT-GOV-001 / UT-GOV-004 の branch protection が UT-25 の secret 配置を block しないことを確認（直接関係ないが governance 連携の取りこぼし防止） |
| シナリオ | UT-25 は `wrangler secret put` という repo 外の操作のため、main の `enforce_admins=true` / `required_status_checks` は **直接影響しない**。ただし「runbook 反映 commit / PR」が main / dev の保護に従う必要があり、Phase 13 PR 作成時に block されないか確認 |
| 検証コマンド | (1) Phase 13 PR 作成時に CI（required_status_checks）が green であることを確認 → (2) `enforce_admins=true` 状態でも solo 運用ポリシー（reviews=null）により merge 可能であることを確認 → (3) UT-25 の commit 内容が secret 値転記を含まないことを `git log -p` で確認 |
| 期待値 | PR が CI green で merge 可能 / commit に secret 値が含まれない |
| Red 状態 | CI gate に必須 contexts が UT-GOV-004 未同期で残っており PR が永遠に block / commit に secret 値が leak |
| 対応 | UT-GOV-001 / UT-GOV-004 完了を Phase 13 着手前に確認（Phase 12 で governance 連携 checklist 化）。commit 内容は evidence ファイル（name のみ）+ runbook のみ |

## fail path × 対応 lane / Phase 早見表

| ID | 観点 | 検出 lane | 対応 Phase / Step |
| --- | --- | --- | --- |
| T6 | `--env` 漏れ | lane 2 / 3 | Phase 5 Step 3 / 5 ガード / Phase 12 CI gate 候補 |
| T7 | op 失敗 | lane 2 / 3 | Phase 5 Step 0 (op whoami) + 冒頭 `set -euo pipefail` |
| T8 | 改行破損 | UT-26 で検出 | Phase 5 Step 2 (T4) / rollback-runbook §5.2 |
| T9 | list 遅延 | lane 2 / 3 | Phase 5 Step 4 / 6 リトライ手順 |
| T10 | `.dev.vars` 値ずれ | lane 1 | runbook §post-rotation / Phase 11 smoke |
| T11 | governance 連携 | Phase 13 PR | Phase 12 governance checklist |

## 完了条件

- [ ] T6〜T11 が `outputs/phase-06/main.md` に表化されている
- [ ] 各テストにシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応が記述されている
- [ ] 6 観点（`--env` 漏れ / op 失敗 / 改行破損 / list 遅延 / `.dev.vars` 値ずれ / governance 連携）がカバーされている
- [ ] MINOR UT25-M-02 が T6 として固定されている
- [ ] 緊急 rollback（T8）が `rollback-runbook.md §5.2` 転記対象として明記されている
- [ ] 実テスト走行は Phase 11 / 13（ユーザー承認後）に委ねる旨が明示されている

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-06/main.md
rg -c "^## [0-9]+\. T(6|7|8|9|10|11):" docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-06/main.md
# => 6
```

## 多角的チェック観点（AIが判断）

- T6 が `--env` 漏れの本体異常系として十分か（変数経由 ENV_TARGET ガード / `: "${ENV_TARGET:?}"` の fail-fast 案内が runbook 反映候補になっているか）。
- T7 が `set -euo pipefail` の必要性を示しており、空 stdin put を構造的に block しているか。
- T8 で「機能確認は UT-26 委譲」境界が崩れていないか（UT-25 内で値の正当性検証を持っていないか）。
- T9 のリトライ秒数 / 回数が現実的か（30 秒 × 3 回 = 最大 90 秒）。
- T10 が op 参照パスの正本固定（README / runbook）に紐付いているか。
- T11 が governance 連携の手戻りを防ぐ checklist として Phase 12 に渡されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | T6 `--env` 漏れ | 6 | pending | UT25-M-02 本体 |
| 2 | T7 op 失敗 | 6 | pending | pipefail |
| 3 | T8 改行破損 | 6 | pending | UT-26 委譲 |
| 4 | T9 list 遅延 | 6 | pending | リトライ手順 |
| 5 | T10 `.dev.vars` 値ずれ | 6 | pending | post-rotation |
| 6 | T11 governance 連携 | 6 | pending | Phase 12 checklist |

## 苦戦防止メモ

1. **T6 / T7 は CI gate 化が望ましい**: 手動 review では `--env` 省略 / pipefail 未設定を見落とす。Phase 12 unassigned-task-detection.md に CI gate 候補化を登録。
2. **T8 は UT-25 では検出できない**: 値読取不能前提のため UT-26 経由の 401/403 でしか顕在化しない。put 前の jq 検査（T4）が事実上の唯一の構造的予防。
3. **T9 のリトライは過剰再投入を招かないよう注意**: list 不在で即時 rollback / 再 put をすると lap 状態（同 name に対する重複 put）になる。30 秒待機の根拠は Cloudflare Edge の通常伝播遅延範囲。
4. **T10 は post-rotation で必ず再点検**: SA JSON ローテーション時に Cloudflare 側だけ更新して `.dev.vars` 参照を放置するとローカル / 本番分岐の lap が発生。
5. **T11 は Phase 13 PR 作成時の最終 checklist**: UT-GOV-001 / UT-GOV-004 完了を確認しないと CI block で PR が永遠に merge できない。
6. **本 Phase は実走しない**: 仕様化のみ。実走は Phase 11 smoke（staging 範囲）/ Phase 13 ユーザー承認後 put（production 含む）。

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が `outputs/phase-06/main.md` に反映
- T6〜T11 の 6 行が `### T(6|7|8|9|10|11):` ヘッダで存在
- artifacts.json の `phases[5].status` は `pending`

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - T1〜T5（happy path）+ T6〜T11（fail path）の合計 11 件を Phase 7 AC マトリクス入力として渡す
  - T6 / T7 を CI gate 候補として Phase 12 に申し送り
  - T8 改行破損疑い時の rollback 経路を Phase 11 apply-runbook / Phase 13 PR 説明に転記
  - T11 governance 連携 checklist を Phase 12 に組み込む
- ブロック条件:
  - 6 観点のいずれかが未カバー
  - MINOR UT25-M-02 が T6 として反映されていない
  - 緊急 rollback（T8）が runbook 転記対象から欠落
  - 機能確認を UT-26 から UT-25 に逆委譲しようとしている
