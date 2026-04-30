# Phase 6 — failure-cases（FC-1〜FC-8）

## Status

spec_created

> 本書は `pull_request_target safety gate` 適用に伴って **絶対に発生させてはならない失敗ケース**を FC-1〜FC-8 として固定する。各 FC に静的 / 動的 / レビューの 3 検出手段と是正手順、Severity を必ず付与する。Phase 7 coverage と Phase 9 quality-gate がそのまま参照する正本。

## 1. 失敗ケース一覧（FC-1〜FC-8）

| ID | 失敗ケース | Severity | 検出（静的） | 検出（動的） | 検出（レビュー） | 是正 |
| --- | --- | --- | --- | --- | --- | --- |
| FC-1 | `pull_request_target` workflow が PR head を checkout（`ref: ${{ github.event.pull_request.head.sha }}` 等を triage 側に置く） | MAJOR | `grep -RnE 'github\.event\.pull_request\.head\.(ref\|sha)' .github/workflows/pr-target-safety-gate.yml` で hit / `actionlint` の untrusted ref 警告 / `yq '.jobs[].steps[] \| select(.uses \| test("actions/checkout")) \| .with.ref' .github/workflows/pr-target-safety-gate.yml` で head が出現 | T-3 / T-4 dry-run の `gh run view --log` に PR head SHA / fork ブランチ名がチェックアウト step として現れる | PR diff で triage workflow に `actions/checkout` step が追加されていれば red flag。reviewer チェックリスト ① に該当 | 該当 step を triage 側から削除（必要なら `pull_request` workflow に移送）。本タスクの単一 commit 内で除去し、`git revert` 単位で巻き戻せること |
| FC-2 | `${{ secrets.* }}` を `pull_request_target` workflow / triage job が参照（直接 / `env:` / `with:` 経由いずれも） | MAJOR | `grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-target-safety-gate.yml` が hit、または `yq '.jobs[].steps[] \| .. \| .secrets? // empty' .github/workflows/pr-target-safety-gate.yml` が空でない | T-3 / T-4 の `gh run view --log` に secret 名が echo される、または `***` 以外の値で出現 | reviewer チェックリスト「triage で secrets 参照禁止」に該当。PR diff で `secrets.` 文字列を red flag 化 | secrets 参照を triage から完全除去。trusted context が必要な処理は別 workflow（trusted job）へ分離。`github.token` 経由の最小昇格のみ許可 |
| FC-3 | `actions/checkout` の `persist-credentials: false` が未指定 | MAJOR | `grep -RnE 'persist-credentials:\s*false' .github/workflows/` が、`actions/checkout` 利用箇所数より少ない / `grep -L 'persist-credentials:' .github/workflows/*.yml` で actions/checkout を含む workflow が hit | dry-run 後に job 内 `.git/config` に `extraheader` などのトークン残留が `gh run view --log` で観測される | PR diff で全 checkout step に `persist-credentials: false` が明示されているか目視。reviewer チェックリスト ② | 全 `actions/checkout` step に `persist-credentials: false` を付与。本タスクで `pr-build-test.yml` に明示済み（line 35 で確認）、新規 checkout 追加時もこの不変条件を強制 |
| FC-4 | トップレベル `permissions:` が広範（`write-all` / `actions: write` / `contents: write` / `id-token: write` 等の濫用） | MAJOR | `yq '.permissions' .github/workflows/*.yml` の出力が `{}` または最小昇格以外 / `grep -RnE 'permissions:\s*write-all' .github/workflows/` で hit | run summary の "Job permissions" セクションで広範権限が表示される。`gh run view --log` で `Token Permissions:` の write スコープ多数を観測 | PR diff で permissions 増加に red flag。reviewer チェックリスト ③ | デフォルト `permissions: {}` を全 workflow 冒頭に固定し、job 単位で必要最小のみ昇格（triage = `pull-requests: write`、build-test = `contents: read`） |
| FC-5 | `workflow_run` を介した secrets / token の fork PR build への橋渡し（代替案 D） | MAJOR | `grep -RnE '^\s*workflow_run\s*:' .github/workflows/` で hit、または `gh workflow list --all` の trigger 列に `workflow_run` 出現 | 該当 trigger の job が secrets を引き渡されていることが `gh run view --log` で確認される | PR diff で `workflow_run:` 追加を red flag。reviewer チェックリスト ④ | 該当 trigger を削除。triage と build/test の分離は `pull_request_target` / `pull_request` の trigger 種別だけで完結させ、artifact / output 経由で trusted ↔ untrusted を結ばない |
| FC-6 | fork PR の build/test workflow に secrets / token が流れる（`pull_request` workflow に `secrets.*` 参照や、`env:` への secrets 注入が紛れ込む） | MAJOR | `grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-build-test.yml` で hit / `yq '.jobs[].steps[].env' .github/workflows/pr-build-test.yml` で secrets キー検出 | T-2 fork PR dry-run の `gh run view --log` に secret 値出現、または `***` マスク以外で token 系文字列が観測される | reviewer チェックリスト「pull_request workflow は contents:read のみ」。PR diff で env: に secrets が注入されていないか確認 | secrets 参照を build/test から除去。trusted context が必要な処理（例: production deploy）は別 trusted workflow（`workflow_dispatch` / `push: main`）に切り出し、`pull_request` 側には残さない |
| FC-7 | labeled trigger の権限境界違反（`needs-review` / `auto-merge` ラベルを外部 contributor が任意に付けて triage を駆動できる） | MINOR | 静的では検知不可（GitHub の label 付与権限は repository settings 側）。代替として README / CODEOWNERS / `docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/outputs/phase-3/review.md` S-6 に運用ルール明記 | T-3 dry-run で external user（fork contributor）が label 付与を試行し、許可されないことを確認 | reviewer / maintainer 操作のみで label を許可する運用が CODEOWNERS / repository settings で固定されているか目視。reviewer チェックリスト ⑤ では取り扱わず、運用ルール監査として独立 | repository settings → Collaborators で label 付与権限を maintainer に限定。triage workflow 側は label 名を `if:` / `env:` 経由で評価し、shell 直挿入をしない（既に design.md §2.1 で確立） |
| FC-8 | required status checks 名 drift（job rename 後に branch protection 未更新で merge 不能、または旧 job 名で待機・bypass される） | MAJOR | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection --jq '.required_status_checks.contexts'` および `branches/dev/protection` の `contexts` を、実 workflow の `jobs.*.name`（canonical: `triage` / `build-test`）と diff | dev / main への merge が新 job 名で待機 / 旧 job 名で待機する事象が PR UI で観測される。`gh pr checks <pr-number>` で context 名が一致しない | PR diff で `name:` 変更時に UT-GOV-004 連携タスクが起票されているか確認。reviewer チェックリスト ⑤ | branch protection の `contexts` を新 job 名に同期（UT-GOV-001 の JSON 更新 PR）。本タスクのロールバック PR と branch protection 更新 PR を同期適用。Phase 12 unassigned-task-detection.md に UT-GOV-004 追従起票 |

## 2. Severity 集計

| Severity | 件数 | 内訳 |
| --- | --- | --- |
| MAJOR | 7 | FC-1, FC-2, FC-3, FC-4, FC-5, FC-6, FC-8 |
| MINOR | 1 | FC-7 |

> Phase 9 quality-gate G-1 の判定基準: **MAJOR 0 件**（実走時に上記 7 件のいずれかが新規発生 / 残存していれば NO-GO）。MINOR は許容（FC-7 は運用ルール側の補完で扱う）。

## 3. 検出手段別カバレッジ概観

| 検出手段 | カバーする FC |
| --- | --- |
| 静的（`actionlint` / `yq` / `grep`） | FC-1, FC-2, FC-3, FC-4, FC-5, FC-6 |
| 動的（`gh run view --log`） | FC-1, FC-2, FC-3, FC-4, FC-6, FC-7, FC-8（PR UI 含む） |
| レビュー（PR diff / reviewer チェックリスト） | FC-1, FC-2, FC-3, FC-4, FC-5, FC-7, FC-8 |
| 運用ルール / repository settings | FC-7（静的・動的では原理上検知不能な部分） |

> 全 FC が少なくとも 2 種類以上の検出手段でカバーされている（FC-7 のみ運用ルール ＋ 動的の 2 種類、他は 3 種類）。

## 4. 回帰防止チェックリスト（PR reviewer 用 5 項目）

実 workflow を編集する全 PR の reviewer は以下 5 項目を必ず確認する。1 項目でも不通過なら merge 不可。

1. **① triage workflow に `actions/checkout` が無いか**: `pull_request_target` を使う workflow（canonical: `pr-target-safety-gate.yml`）の `jobs.*.steps[]` に `uses: actions/checkout` が含まれていないこと。`grep -nE 'actions/checkout' .github/workflows/pr-target-safety-gate.yml` が 0 件であること。FC-1 対応。
2. **② 全 `actions/checkout` に `persist-credentials: false` が明示されているか**: `grep -RnE 'actions/checkout' .github/workflows/` の各 hit に対し、直後 / 周辺の `with:` ブロックで `persist-credentials: false` が指定されていること。FC-3 対応。
3. **③ デフォルト `permissions:` が `{}` か**: `yq '.permissions' .github/workflows/*.yml` の各 workflow 出力が `{}` または `null`（未指定）であり、`write-all` / 個別 write の濫用がないこと。FC-4 対応。
4. **④ `workflow_run:` の追加が無いか**: `grep -RnE '^\s*workflow_run\s*:' .github/workflows/` が 0 件であること。新規 trigger として `workflow_run` を導入しないこと。FC-5 対応。
5. **⑤ job 名変更時に branch protection contexts を同期する追従タスクが起票されているか**: PR diff で `jobs.*.name:` または workflow `name:` を変更する場合、UT-GOV-004 への追従起票（または同等の branch protection 更新 PR）が併走していること。FC-8 対応。

## 5. レポート規約（失敗ケース検出時の運用）

失敗ケースが実走で検出された場合、以下の手順で記録する。

1. **GitHub Issue 起票**:
   - title: `[security] FC-<id>: <短い症状>`（例: `[security] FC-1: pull_request_target が PR head を checkout`）
   - labels: `security`, `priority:high`（FC-7 のみ `priority:medium` 許容）, `governance`
   - body 雛形:
     ```
     ## 失敗ケース ID
     FC-<id>

     ## 観測
     - workflow file: .github/workflows/<name>.yml
     - run id: <gh run id>
     - 検出手段: <静的 / 動的 / レビュー>
     - 検出コマンド出力（抜粋）: …

     ## 是正案
     <FC 表の「是正」列を引用 + 具体差分>

     ## 連携タスク
     - 本タスク Phase 8 / 9 への差し戻し有無
     - UT-GOV-004 / 001 / 007 への追従要否
     ```
2. **Phase 12 `unassigned-task-detection.md` への記録**:
   - 失敗ケース 1 件につき 1 行で `FC-<id>` / 起票 Issue 番号 / 検出 Phase を表に追記。
   - 是正が本タスク内で完結しない場合は新規 unassigned-task として独立 Issue を起票（例: `UT-GOV-004-FOLLOW`）。
3. **本タスク Phase 9 quality-gate への反映**: MAJOR 検出は即座に G-1〜G-3 の評価を MAJOR に倒し、Phase 5 / 6 / 8 のいずれかへ差し戻す（gate 不通過時の戻り先ルール）。
4. **secrets 露出疑いがある場合の追加手順**: 当該 secret を即座に rotate する別タスク（UT-GOV-002-SEC 引き継ぎ）を起票し、本 Issue に link。secrets 値そのものは Issue body / コメントに転記しない。

## 6. 次 Phase への引き継ぎ

- Phase 7 coverage.md にて、シナリオ T-1〜T-5 と FC-1〜FC-8 の交差表を作成する入力として本書を使用する。
- Phase 9 quality-gate.md にて、G-1〜G-3 の判定根拠として本書 §1 / §2 を直接参照する。
- 回帰防止チェックリスト 5 項目は Phase 12 `implementation-guide.md` の reviewer 節にも転記する。
