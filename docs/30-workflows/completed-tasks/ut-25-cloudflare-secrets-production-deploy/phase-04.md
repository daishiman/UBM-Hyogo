# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（オペレーション検証 / name 確認 / .gitignore grep / `--env` 漏れ防止 / rollback リハーサル） |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending（仕様化のみ完了 / 実走は別オペレーション） |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |

## 目的

Phase 3 で PASS（MINOR 2 件 = UT25-M-01 / UT25-M-02）が確定した base case（A1: cf.sh ラッパー / B1: staging-first / C1: `.dev.vars` あり / D1: `op read | stdin` / E1: delete + 再 put rollback）に対して、**Phase 5 着手前に「何を満たせば Green か」を 5 種のオペレーション検証（T1〜T5）として確定する**。本タスクは実コード実装を伴わないため、ユニットテストは存在しない。代わりに「name 確認 / `.gitignore` 静的検査 / `--env` 漏れフェイルセーフ / stdin 改行保全 / rollback リハーサル」の 5 件に絞り、**機能疎通検証は UT-26 に完全委譲する**境界を明示する。

> **本 Phase は仕様化のみ**。実 `wrangler secret put` / `secret delete` は Phase 13 ユーザー承認後の別オペレーション。本 Phase ではコマンドを記述するが**実行は禁止**。

## 機能検証の境界（UT-26 委譲）

| 検証種別 | 本タスク（UT-25） | UT-26 |
| --- | --- | --- |
| secret 名の存在確認 | T1（`wrangler secret list` name 確認） | - |
| 値の正当性 / 改行保全 | 構造的保証（stdin パイプの仕様で担保） | Sheets API 認証成功で実証 |
| `private_key` 復号成功 | - | Sheets API 401/403 が返らないことを確認 |
| Sheets API 疎通 | - | E2E smoke |

> 値読取不能前提（`wrangler secret list` は name のみ表示）のため、本 Phase で値の機能テストを設計しない。改行破壊や JSON 破損は UT-26 の認証失敗として顕在化する。

## 実行タスク

- タスク1: T1〜T5 の対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けを表化する。
- タスク2: MINOR UT25-M-01（`.gitignore` 除外確認）を T2 として固定する。
- タスク3: MINOR UT25-M-02（`--env` 漏れ）の予防チェックを T3 として固定し、異常系本体は Phase 6 へ引き渡す。
- タスク4: 実走を Phase 5 / 6 / 11 / 13 に委譲する境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-02.md | lane 1〜4 設計 / state ownership / 投入経路 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-02/main.md | bash 仕様レベル系列 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-03.md | base case PASS / NO-GO 条件 / MINOR 2 件 |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md §苦戦箇所 | 履歴汚染 / `--env` 切替 / 改行 / 値読取不能 / .dev.vars |
| 必須 | scripts/cf.sh | ラッパー実装（op 注入経路） |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-04.md | テスト戦略フォーマット参照 |

## 実行手順

1. Phase 2 設計（4 lane / 投入経路 bash 系列）と Phase 3 PASS 判定 / MINOR 2 件を入力として確認する。
2. T1〜T5 の対象 lane / 検証コマンド / 期待値 / Red 状態を表に落とす。
3. 本 Phase ではコマンドを実走しないことを Phase 5 ランブック側に明示的に引き渡す。

## 統合テスト連携

T1〜T5 は別オペレーション側で Phase 5（実装ランブック）/ Phase 6（異常系）/ Phase 11（手動 smoke）/ Phase 13（ユーザー承認後 PUT）の gate として実走する。本 Phase はテスト仕様の正本化のみを行う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-04/main.md | T1〜T5 のテスト一覧 / 検証コマンド / 期待値 / 失敗時切り分け |
| メタ | artifacts.json `phases[3].outputs` | `outputs/phase-04/main.md` |

## テスト一覧（オペレーション検証 / NOT EXECUTED）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点（投入前）の現状値 / **対応 lane** = Phase 2 §SubAgent lane の番号

### T1: `wrangler secret list` name 確認（投入後の存在確認）

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 | lane 2 / lane 3（staging / production 投入直後） |
| 検証コマンド | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \| tee outputs/phase-13/secret-list-evidence-staging.txt \| grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b'` / 同 production |
| 期待値 | grep が exit 0 を返し、`GOOGLE_SERVICE_ACCOUNT_JSON` の行が evidence ファイルに記録されている。値は表示されない |
| Red 状態 | grep が exit 1（name 未出現 = put 失敗 or `--env` 別環境への投入）/ evidence ファイル未生成 |
| 失敗時切り分け | (a) `--env` 値が wrangler.toml の env 宣言と乖離（→ T3 / Phase 6）/ (b) put コマンド自体が exit 0 でない（権限・token 失効）/ (c) 1Password から op read 失敗で空 stdin が流れた |

### T2: `.gitignore` 静的検査（UT25-M-01 解決）

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 | lane 1（ローカル `.dev.vars` 設定） |
| 検証コマンド | `grep -E '^\.dev\.vars$' apps/api/.gitignore` / リポジトリ全体: `git check-ignore apps/api/.dev.vars` |
| 期待値 | grep が exit 0（`.dev.vars` が gitignore に含まれる）。`git check-ignore` が exit 0（ignore 対象として認識）。`git status -uno` で `.dev.vars` が untracked に出ない |
| Red 状態 | grep が exit 1（除外漏れ）/ `git check-ignore` が exit 1 / `git status` で `.dev.vars` が untracked として出る |
| 失敗時切り分け | (a) `apps/api/.gitignore` 自体が無い → 新規作成 / (b) パターンが `*.dev.vars` 等で過剰一致 → 厳密化 / (c) 既に commit 済みの履歴 → `git rm --cached` 必要（過去 leak の有無も追跡） |

### T3: `--env` 漏れフェイルセーフ手順検証（UT25-M-02 予防チェック）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 | lane 2 / lane 3（put 実行前） |
| 検証コマンド | (1) `grep -E '^\[env\.(staging\|production)\]' apps/api/wrangler.toml` で env 宣言を確認 → (2) put コマンド実行前に `echo "$ENV_TARGET"` で `--env` 値を変数経由で確認 → (3) 投入後 `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env "$ENV_TARGET"` で同じ env を読み返し |
| 期待値 | wrangler.toml に `[env.staging]` / `[env.production]` の 2 ブロックが存在し、put 直前の `$ENV_TARGET` がそのいずれかと**完全一致**する。読み返し list で name が出る |
| Red 状態 | `--env` 引数省略 / 値が `dev` `prod` `prd` 等の typo / 環境変数で空文字 |
| 失敗時切り分け | (a) `--env` 省略 → top-level Worker（preview 名前空間）に投入される事故（Phase 6 異常系本体） / (b) typo → wrangler.toml に該当 env が無い旨のエラー / (c) 異常系シナリオ自体は Phase 6 T8 として実走 |

### T4: stdin 改行保全の手順検証（構造的保証）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 | lane 2 / lane 3（投入経路） |
| 検証コマンド | (1) `op read 'op://Vault/SA-JSON/credential' \| jq -e 'has("private_key")'`（exit 0 = JSON として valid）→ (2) `op read 'op://Vault/SA-JSON/credential' \| jq -r '.private_key' \| grep -c 'BEGIN PRIVATE KEY'`（>=1）→ (3) put 経路は同じ stdin パイプで `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env <env>` に流す |
| 期待値 | (1)(2) が exit 0 / `BEGIN PRIVATE KEY` が 1 回以上ヒット。stdin パイプは byte 透過のため、jq で valid なら put 後も改行保全される（構造的保証） |
| Red 状態 | (1) jq が parse エラー（JSON 破損）/ (2) `BEGIN PRIVATE KEY` が 0 回（改行が `\\n` 文字リテラルに変換 / コピペで破損）/ tmpfile 経由で改行が CRLF 化 |
| 失敗時切り分け | (a) 1Password 側で SA JSON が文字列として保存されており改行がエスケープ済み → 1Password Item を再保存 / (b) `cat sa.json` 経由（D2 サブ案）に切替 / (c) tty 直接入力（D3）は採用しない |

### T5: rollback リハーサル手順検証（delete + 再 put / E1 採用経路）

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 | lane 2 / lane 3（rollback 経路 / Phase 13 承認後のみ実走） |
| 検証コマンド | (1) `bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging` の exit 0 → (2) `bash scripts/cf.sh secret list --env staging \| grep -v GOOGLE_SERVICE_ACCOUNT_JSON`（name が消えている）→ (3) `op read 'op://Vault/SA-JSON-prev/credential' \| bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging` で旧 key 再投入 → (4) 再度 list で name 復活確認 |
| 期待値 | 4 ステップすべて exit 0。delete 後の中間状態で list に name が無いことを確認できる（fail-fast で誤値が確実に除去される） |
| Red 状態 | delete が exit 0 でも list に残る / 1Password に旧 key（`SA-JSON-prev`）が無く再投入できない / production を staging より先に rollback する誤順序 |
| 失敗時切り分け | (a) 1Password に旧バージョンが保管されていない → ローテーション履歴の運用見直し / (b) delete 後の Workers が認証失敗で稼働停止 → UT-26 で検出 / (c) 上書き put（E2）に retry すると誤値が一時的に runtime に残る → E1 採用維持 |

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| secret 名の存在（AC-5） | T1 で staging / production 両環境を被覆 |
| `.dev.vars` gitignore（AC-6 / UT25-M-01） | T2 で grep + git check-ignore の二重確認 |
| `--env` 切替（AC-2 / UT25-M-02 予防） | T3 で env 宣言と `--env` 値の事前突合 |
| 改行保全（AC-3） | T4 で stdin パイプ前の jq valid 確認 |
| rollback（AC-7） | T5 で delete + 再 put の 4 ステップ被覆 |
| 履歴汚染防止（AC-4） | 構造的（手順内に `set +o history` / `op read` 直接 stdin を必須化）。テストではなく runbook 規約として固定 |

## 完了条件

- [ ] T1〜T5 が `outputs/phase-04/main.md` に表化されている
- [ ] 各テストに ID / 対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けが記述されている
- [ ] MINOR UT25-M-01 が T2 として固定されている
- [ ] MINOR UT25-M-02 の予防チェックが T3 に組み込まれ、異常系本体は Phase 6 へ引き渡されている
- [ ] 機能疎通検証を UT-26 に委譲する境界が明記されている
- [ ] 実テスト走行は Phase 5 / 6 / 11 / 13 に委ねる旨が明示されている
- [ ] 本 Phase で `wrangler secret put` / `secret delete` を実行していない（仕様化のみ）

## 検証コマンド（仕様確認用 / NOT EXECUTED）

```bash
test -f docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-04/main.md
rg -c "^## [0-9]+\. T[1-5]:" docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-04/main.md
# => 5
```

## 多角的チェック観点（AIが判断）

- T1〜T5 が AC-2〜AC-7 をカバーしているか（AC-1 / AC-8〜AC-11 は構造的被覆で OK）。
- 機能疎通テストが UT-26 に委譲されており、本 Phase で値の正当性検証を持たないか。
- T2 / T3 が MINOR UT25-M-01 / UT25-M-02 にそれぞれ紐付いているか。
- T5 が delete + 再 put（E1）の 4 ステップで構成され、上書き put（E2）に退化していないか。
- 実走禁止が `outputs/phase-04/main.md` 全体で守られているか（コマンドは記述するが実行しない）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | T1 name 確認 | 4 | pending | lane 2 / 3 |
| 2 | T2 `.gitignore` grep | 4 | pending | UT25-M-01 解決 |
| 3 | T3 `--env` 突合 | 4 | pending | UT25-M-02 予防 |
| 4 | T4 stdin 改行保全 | 4 | pending | jq valid 確認 |
| 5 | T5 rollback リハーサル | 4 | pending | delete + 再 put |

## 苦戦防止メモ

1. **値の機能確認は本 Phase で持たない**: `wrangler secret list` は name のみ。改行破壊 / 復号失敗は UT-26 の Sheets API 401/403 として検出する。
2. **T2 は git check-ignore も併用**: `grep .dev.vars apps/api/.gitignore` だけでは過剰一致パターン（`*.vars` 等）を見落とす。`git check-ignore` で実効性を確認。
3. **T3 は `--env` 値を変数経由で確認**: 直書き `--env staging` だと typo が発見しづらい。`ENV_TARGET=staging` 等で値を一度変数化して echo 確認 → put → list で同変数を使う。
4. **T4 の jq 確認は put 前に必ず実行**: 1Password に保管された JSON が文字列化（改行エスケープ）されていると `BEGIN PRIVATE KEY` がヒットしない。put 後では原因特定困難。
5. **T5 は production を直接実走しない**: rollback リハーサルは staging で完結させ、production は Phase 13 承認後の本番投入時に経路だけ runbook 参照する。
6. **本 Phase は実走しない**: T1〜T5 の Red 確認は Phase 5 着手直前 / Phase 11 smoke / Phase 13 ユーザー承認後の put で行う。仕様化のみで Phase 5 へ進む。

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が `outputs/phase-04/main.md` に反映
- T1〜T5 の 5 行が `### T[1-5]:` ヘッダで存在
- artifacts.json の `phases[3].status` は `pending`（仕様書整備完了状態として保持）

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T5 を Phase 5 ランブック Step 1〜5 の Green 条件として参照
  - T2（`.gitignore` 検査）/ T3（`--env` 突合）を Phase 5 各 Step の確認コマンドに転記
  - T5（rollback リハーサル）は Phase 11 smoke の主要ケース
  - 機能疎通は UT-26 に委譲（本ワークフロー内で持たない）
  - 実走は Phase 13 ユーザー承認後（user_approval_required: true）
- ブロック条件:
  - T1〜T5 のいずれかに期待値・検証コマンドが欠けている
  - MINOR UT25-M-01 / UT25-M-02 が T2 / T3 に反映されていない
  - 機能疎通テストを本 Phase に内包しようとしている
