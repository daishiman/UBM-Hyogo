# Phase 5: 実装ランブック（後追い再 PUT 手順）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（dev / main 独立 PUT の後追い再 PUT 手順） |
| 作成日 | 2026-04-30 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク状態 | spec_created（GitHub Issue #202 は CLOSED でも仕様書段階で実 PUT 禁止） |
| タスク分類 | implementation / governance / NON_VISUAL（Phase 13 で実 PUT 実行ゲート） |

## 目的

Phase 4 で確定した検証戦略を、Phase 13 で実行する後追い再 PUT 手順として **時系列で並んだコマンド列とチェックポイント** に落とし込む。dev / main 独立 PUT の原則を直列ステップとして固定し、UT-GOV-004 完了確認 → 適用前 GET → contexts 抽出 → payload 再生成 → dry-run 差分プレビュー → dev PUT → dev 検証 GET → main PUT → main 検証 GET → 全体検証 → 成果物保全 まで網羅する。失敗時の rollback 経路は UT-GOV-001 rollback payload の再利用のみとする。本仕様書段階では実 PUT を実行しない（AC-13）。

## 本 Phase でトレースする AC

- AC-5（dev / main 独立 PUT が REST API で成功し応答 JSON が保存されている）
- AC-8（1 PUT 失敗時の dev / main 独立 rollback 経路が記述されている、rollback payload は UT-GOV-001 由来を再利用）
- AC-10（admin block 回避の rollback 担当・経路の再確認・記述）

## 実行タスク

1. 事前確認チェックリストを定義する（完了条件: UT-GOV-004 完了 / GITHUB_ADMIN_TOKEN scope / UT-GOV-001 applied JSON / rollback payload の 4 項目）。
2. 適用前 GET（dev / main 独立）の手順を記述する（完了条件: 各 GET コマンドと保全先パス）。
3. UT-GOV-004 成果物からの contexts 抽出手順を記述する（完了条件: `contexts-source.json` から `expected-contexts-{dev,main}.json` への変換 1-liner）。
4. payload 再生成手順を記述する（完了条件: 1 段階目 applied JSON から contexts 以外を流用し、contexts のみ書換える `jq` 1-liner）。
5. dry-run 差分プレビュー手順を記述する（完了条件: 差分が contexts のみであることの `jq` 検証）。
6. dev PUT 実行手順を記述する（完了条件: コマンド・期待 HTTP 200・applied JSON 保全先）。
7. dev 検証 GET 手順を記述する（完了条件: 期待 contexts との集合一致確認）。
8. main PUT 実行手順を記述する（完了条件: dev PUT 成功確認後にのみ実行する原則）。
9. main 検証 GET 手順を記述する（完了条件: dev と同等の集合一致確認）。
10. 全体検証手順（drift / 4 条件 / AC）を記述する。
11. rollback 経路を 3 パターン（dev のみ失敗 / main のみ失敗 / 両方失敗）で記述する。
12. admin block 回避 PUT 直前チェックリストを記述する。
13. 終了条件を明記する（applied JSON 保全 / drift-check.md 完成 / Phase 9 / 13 への引き渡し）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-02.md | payload-design.md / expected-contexts-{dev,main}.json |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-03.md | 着手可否ゲート / リスクレジスタ / 運用ルール 5 件 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-04.md | 検証スイート 4 種類 / 失敗時挙動 / 実行順序 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 1 段階目 applied JSON / rollback payload（再利用元） |
| 必須 | UT-GOV-004 成果物（`required-status-checks-contexts.{dev,main}.json`） | 期待 contexts の唯一の入力源 |
| 必須 | CLAUDE.md（Secret hygiene / 禁止事項） | admin token のローカル揮発扱い |
| 必須 | GitHub REST API: `GET/PUT /repos/{owner}/{repo}/branches/{branch}/protection` | スキーマ正本 |

## 事前確認（PUT 開始前の必須チェック）

| # | 確認項目 | 確認手段 | 期待結果 |
| --- | --- | --- | --- |
| 1 | UT-GOV-004 完了 | UT-GOV-004 のタスク状態 / 成果物の存在 | `required-status-checks-contexts.{dev,main}.json` が読み取り可能 |
| 2 | GITHUB_ADMIN_TOKEN scope 確認 | `gh auth status` または `gh api user --include` の `x-oauth-scopes` | `repo`, `admin:repo_hook`（または equivalent）を含む |
| 3 | UT-GOV-001 applied JSON の保全 | `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md` 配下 | dev / main の 1 段階目 applied JSON が読み取り可能 |
| 4 | UT-GOV-001 rollback payload の保全 | 同上 | rollback payload（dev / main 各 1 ファイル）が読み取り可能 |
| 5 | open PR の check-run 進行状況 | `gh pr list` + `gh pr checks <PR>` | 期待 contexts に対応する check が green で揃っている |
| 6 | drift 検査基準（CLAUDE.md / deployment-branch-strategy.md） | 6 値の抜粋 | `outputs/phase-09/drift-check.md` の対応表に転記可能 |

> いずれかが NG なら PUT に進まない。NG 内容を `outputs/phase-13/local-check-result.md` に記録し中断する。

## 手順（時系列）

### Step 1: 適用前 GET（dev / main 独立）

```bash
gh api -H 'Accept: application/vnd.github+json' \
  /repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-13/branch-protection-current-dev.json

gh api -H 'Accept: application/vnd.github+json' \
  /repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-13/branch-protection-current-main.json
```

- 期待出力: HTTP 200 / `required_status_checks.contexts` が現状値（暫定 `[]` または UT-GOV-004 同期前）
- 失敗時 rollback: 不要（取得のみ）。token / network 問題を解消後に再試行。

### Step 2: UT-GOV-004 成果物から contexts 抽出

```bash
jq '.dev[]' path/to/required-status-checks-contexts.dev.json \
  | jq -s '.' > outputs/phase-02/expected-contexts-dev.json

jq '.main[]' path/to/required-status-checks-contexts.main.json \
  | jq -s '.' > outputs/phase-02/expected-contexts-main.json
```

- 期待出力: dev / main の期待 contexts 配列（実 job/check-run 名のみ・workflow 名混入なし）
- 失敗時 rollback: 不要（抽出のみ）。UT-GOV-004 成果物が不正なら本タスクを中断し UT-GOV-004 側へ差し戻し。

### Step 3: payload 再生成（contexts 以外は UT-GOV-001 applied JSON から流用）

```bash
jq --slurpfile ctx outputs/phase-02/expected-contexts-dev.json \
  '.required_status_checks.contexts = $ctx[0]' \
  docs/30-workflows/completed-tasks/UT-GOV-001-applied-dev.json \
  > outputs/phase-13/branch-protection-payload-dev.json

# main も同様
```

- 期待出力: contexts 値のみが書き換わった payload。他値は完全一致。
- 失敗時 rollback: 不要（payload 再生成のみ）。

### Step 4: dry-run 差分プレビュー（contexts のみであること）

```bash
diff <(jq -S 'del(.required_status_checks.contexts)' outputs/phase-13/branch-protection-payload-dev.json) \
     <(jq -S 'del(.required_status_checks.contexts)' docs/30-workflows/completed-tasks/UT-GOV-001-applied-dev.json)
```

- 期待出力: 0 行（contexts 以外は完全一致）
- 失敗時 rollback: 不要（PUT 未実行）。差分があれば payload を修正。

### Step 5: dev PUT 実行

```bash
gh api -X PUT -H 'Accept: application/vnd.github+json' \
  --input outputs/phase-13/branch-protection-payload-dev.json \
  /repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --include \
  > outputs/phase-13/branch-protection-applied-dev.json
```

- 期待出力: HTTP 200 / response body に書き換え後の protection
- 失敗時 rollback: dev に対してのみ UT-GOV-001 rollback payload を再 PUT（main には触れない）

### Step 6: dev 検証 GET

```bash
gh api -H 'Accept: application/vnd.github+json' \
  /repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-13/branch-protection-verify-dev.json

diff <(jq -S '.required_status_checks.contexts | sort' outputs/phase-13/branch-protection-verify-dev.json) \
     <(jq -S 'sort' outputs/phase-02/expected-contexts-dev.json)
```

- 期待出力: 集合一致 diff 0 行
- 失敗時 rollback: dev に対してのみ rollback 再 PUT。

### Step 7: main PUT 実行（dev PUT 成功確認後）

```bash
gh api -X PUT -H 'Accept: application/vnd.github+json' \
  --input outputs/phase-13/branch-protection-payload-main.json \
  /repos/daishiman/UBM-Hyogo/branches/main/protection \
  --include \
  > outputs/phase-13/branch-protection-applied-main.json
```

- 期待出力: HTTP 200
- 失敗時 rollback: main に対してのみ UT-GOV-001 rollback payload を再 PUT。dev は維持。

### Step 8: main 検証 GET

Step 6 と同等の `jq` 集合一致検証を main 側で実行。

### Step 9: 全体検証（drift / 4 条件 / AC）

- drift 検査 6 値（CLAUDE.md / deployment-branch-strategy.md と applied JSON の照合）→ `outputs/phase-09/drift-check.md`
- 4 条件 PASS の最終記録 → `outputs/phase-10/go-no-go.md`
- AC-1〜AC-14 のトレース確認 → `outputs/phase-07/ac-matrix.md` を参照

## rollback 経路（3 パターン）

| パターン | 状態 | rollback 手順 | 備考 |
| --- | --- | --- | --- |
| dev のみ失敗 | dev PUT FAIL / main 未実行 | UT-GOV-001 rollback payload を dev へ PUT。main は触れない。 | rollback payload は **再生成しない**。UT-GOV-001 由来をそのまま使用。 |
| main のみ失敗 | dev PUT 成功 / main PUT FAIL | UT-GOV-001 rollback payload を main へ PUT。dev は維持（適用済の 2 段階目状態を維持）。 | dev は手動で残す合理性あり。事故拡大を防ぐ。 |
| 両方失敗 | dev / main 両 PUT FAIL | dev / main 両方に UT-GOV-001 rollback payload を順次 PUT。 | 並列ではなく直列で実行。 |

> いずれの場合も rollback 後に GET → 集合一致確認を実行し、`outputs/phase-13/branch-protection-applied-{dev,main}.json` を上書きせず別ファイル（`...-rollback.json`）として保存する。

## admin block 回避 PUT 直前チェックリスト

PUT 実行直前 60 秒以内に以下を全項目 PASS で確認:

- [ ] 直前 open PR の HEAD で、期待 contexts に対応する check-run が **すべて green** で完了している
- [ ] 期待 contexts に typo / 廃止 workflow 名が混入していない（Step 2 / 3 / 4 で確認済）
- [ ] rollback payload（UT-GOV-001 由来）への path が手元のターミナルで開かれている
- [ ] PUT 後に GitHub UI で merge 可否を即時確認できる状態にある
- [ ] `enforce_admins=true` 下で admin 自身が block されることを実行者が理解している

## 終了条件

- `outputs/phase-13/branch-protection-current-{dev,main}.json` が保全
- `outputs/phase-13/branch-protection-applied-{dev,main}.json` が HTTP 200 で保全
- 期待 contexts と applied contexts の集合一致が dev / main 両方で確認
- drift 検査 6 値が PASS（`outputs/phase-09/drift-check.md`）
- 4 条件最終判定 PASS（`outputs/phase-10/go-no-go.md`）
- AC-1〜AC-14 が `outputs/phase-07/ac-matrix.md` でトレース完了

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 正常系 runbook の各ステップを異常系 F-1〜F-12 へ展開 |
| Phase 9 | GET / PUT / GET の差分検証とdrift検査へ渡す |
| Phase 11 | NON_VISUAL manual evidence の確認項目へ渡す |
| Phase 13 | user approval 後に本 runbook を逐次実行 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ランブック | outputs/phase-05/apply-runbook-second-stage.md | 事前確認 / 9 ステップ / rollback 3 パターン / admin block チェックリスト / 終了条件 |
| メタ | artifacts.json | Phase 5 状態の更新 |

## 完了条件

Acceptance Criteria for this Phase:

- [ ] 事前確認 6 項目が定義されている
- [ ] Step 1〜9 がコマンド例・期待出力・失敗時 rollback 付きで記述されている
- [ ] rollback 経路 3 パターン（dev のみ / main のみ / 両方）が記述されている（AC-8）
- [ ] admin block 回避 PUT 直前チェックリストが 5 項目以上記述されている（AC-10）
- [ ] dev PUT 成功確認後にのみ main PUT を実行する直列原則が明示されている（AC-5）
- [ ] rollback payload は UT-GOV-001 由来を再利用し本タスクで新規生成しない原則が明文化されている
- [ ] 成果物 `outputs/phase-05/apply-runbook-second-stage.md` が配置設計済み
- [ ] 仕様書段階では実 PUT を実行しない原則が記述されている（AC-13 への接続）

## タスク 100% 実行確認【必須】

- 全実行タスク（13 件）が `spec_created`
- 全成果物が `outputs/phase-05/` 配下に配置設計済み
- 本 Phase でトレースする AC（AC-5 / AC-8 / AC-10）が完了条件にすべて含まれている
- Step 1〜9 で空欄なし
- rollback 経路 3 パターン × admin block チェックリスト 5 項目が記述
- artifacts.json の `phases[4].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - runbook 9 ステップ確定（適用前 GET → 抽出 → payload → dry-run → dev PUT → dev GET → main PUT → main GET → 全体検証）
  - rollback 3 パターン確定
  - admin block 回避チェックリスト 5 項目確定
  - rollback payload は UT-GOV-001 由来再利用のみ・新規生成禁止
  - 仕様書段階では実 PUT 禁止
- ブロック条件:
  - rollback 経路の payload が UT-GOV-001 由来でなく本タスクで再生成されている
  - dev / main 同時 PUT に変更されている
  - 仕様書段階で実 PUT を含む手順になっている
