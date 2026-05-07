# Lessons Learned: Issue #517 follow-up auto-summary foundation (2026-05)

> task: `issue-517-followup-auto-summary-task-spec`
> ブランチ: `docs/issue-517-followup-auto-summary-task-spec`
> 関連 spec: `references/deployment-gha.md`（Post-release 30day auto-summary セクション）、`references/task-workflow-active.md`（Issue #517 行）、`references/lessons-learned-issue-351-post-release-dashboard-2026-05.md`（前段の post-release-dashboard 教訓）
> 関連 source: `.github/workflows/post-release-30day-auto-summary.yml`、`scripts/post-release-dashboard/30day-summary.sh`、`scripts/post-release-dashboard/__tests__/30day-summary.bats`、`scripts/post-release-dashboard/__tests__/fixtures/`
> 関連 reference: `docs/30-workflows/issue-517-followup-auto-summary/outputs/phase-12/`（implementation-guide / system-spec-update-summary / documentation-changelog / skill-feedback-report）

## 概要

Issue #351（09c post-release dashboard automation）が確立した日次収集基盤の上に、月次で 30 日間の release 観測サマリを自動生成し、open PR として上げる follow-up タスク。`schedule` cron + `workflow_dispatch` の二経路を備えつつ、月次 idempotency / Slack channel manual bootstrap 境界 / fixture 日付動的展開 / shell test plain bash 化 / Phase-12 strict filename drift 再発防止 など、cron 駆動 automation 特有の罠を多数踏み抜いた。本ドキュメントは subagent 監査により判明した 6 件の苦戦箇所を、症状 / 原因 / 解決 / 再発防止の 4 項目で記録する。

本タスクが踏襲する前提:

- 観測対象は Cloudflare Workers（apps/api、apps/web）のリリース後 30 日間の error rate / p95 latency / 5xx ratio / deployment frequency
- 収集元は Issue #351 で整備した `scripts/post-release-dashboard/collect.sh`（日次 artifact）
- 出力は Markdown サマリ + open PR 形式で、レビュー不要・solo merge 運用に整合
- 依存 secret は `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` / `SLACK_WEBHOOK_POST_RELEASE` の 2 件
- branch 命名・PR タイトル prefix・Slack channel 名はすべて月次 idempotency と整合した規約に従う

本 lessons-learned は同領域の後続タスク（D+60 / D+90 集計、quarterly review 自動化など）の事前読了 reference として位置付ける。

なお、本タスクは solo dev 運用ポリシーに従い、PR レビューア 0 名・CI gate のみで quality を担保する前提で設計されている。CI gate（actionlint / shellcheck / bats / typecheck / lint）が pass しても、外部 secret 投入が未済のまま merge すると cron 実行時に空文字 secret 参照で fail するため、Phase 13 user approval 直前に `gh secret list` で 2 件（`CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`、`SLACK_WEBHOOK_POST_RELEASE`）の存在を必ず確認する運用を組み込んでいる。

この 2 段階の確認（CI gate + secret 投入確認）が揃って初めて、本 automation は production cron として安全に動作する。

## 苦戦箇所と学び

### L-517-001: schedule-only gate 判定 — `workflow_dispatch` と cron の両方をサポートする際、cron 由来のみ実施処理を分岐させる判定設計

- **症状**:
  初期実装では `workflow_dispatch` トリガでも 30 日サマリを生成し open PR を立てる作りだったため、開発中の動作確認 dispatch が誤って月次 PR ブランチを上書きする事故が発生した。逆に cron 由来でも dry-run 相当に落ちてしまうケースもあり、「いつ open PR を立てるべきか」が曖昧だった。
- **原因**:
  GitHub Actions の `github.event_name` 判定を action step 内に分散させており、(1) PR 作成 step の if 句、(2) summary 生成 step の if 句、(3) Slack 通知 step の if 句、がそれぞれ別の真理値を持っていた。`workflow_dispatch` のテスト用パラメータ（`inputs.dry_run` 等）を導入する際にも各 step の整合性が崩れた。
- **解決**:
  workflow 冒頭の `env:` セクションで `IS_SCHEDULE: ${{ github.event_name == 'schedule' }}` を一度だけ計算し、PR 作成 / Slack 通知など「cron 由来でのみ実施したい処理」の if 句をすべて `env.IS_SCHEDULE == 'true'` に統一した。`workflow_dispatch` は (a) script 単体検証、(b) fixture 経由 smoke、の 2 用途に限定し、PR 作成は行わない方針を `outputs/phase-12/implementation-guide.md` に明記。
- **再発防止**:
  cron + manual の両経路を持つ workflow では、`env:` ブロックで `IS_SCHEDULE` / `IS_DISPATCH` を明示的に算出し、step level の if 句では再判定しない。`task-specification-creator` skill の `WORKFLOW_AUTOMATION` モードに「event_name 判定は workflow env で集約」のテンプレ条項を追加する。
- **補足コンテキスト**:
  GitHub Actions の `if:` 句は YAML 評価エンジン上で再帰的に展開されるため、step ごとに `github.event_name == 'schedule'` を書くと、cron / dispatch / repository_dispatch の三系統に拡張する際に組合せ爆発する。`env:` 集約は将来の trigger 追加時に diff が一箇所で済む利点がある。
- **観測 metric**:
  workflow_dispatch を許可する step が 3 個以下（"verify", "smoke", "manual-rerun" 用途のみ）であること、PR 作成 / 通知 step は `env.IS_SCHEDULE == 'true'` 排他であることを compliance check で grep する。

### L-517-002: open PR idempotency 確保 — 月次 branch 命名と PR タイトル prefix による silent skip パターン

- **症状**:
  cron が「同月内に複数回起動する」可能性（手動 retrigger / 障害 retry）を考慮せず、毎回 `auto/post-release-30day-summary` という固定 branch を強制 push していたため、既存 PR が close→新規作成のループに入り、レビュー履歴が消える / 不要な通知が連発される事故を発生させた。
- **原因**:
  「月次に 1 PR」という運用契約を実装側で表現していなかった。branch 名に月情報がなく、PR タイトル prefix も汎用語だったため、`gh pr list` で「同月内既存 PR の検出」ができず idempotent にならなかった。
- **解決**:
  branch 命名を `auto/post-release-30day-summary-YYYYMM`（例: `auto/post-release-30day-summary-202605`）に変更し、PR タイトル prefix を `[auto-summary] post-release-dashboard 30d` に固定。workflow は `gh pr list --search "in:title [auto-summary] post-release-dashboard 30d $YYYYMM"` で同月既存 PR を検索し、ヒットしたら **silent skip**（exit 0、Slack 通知のみ "skipped: existing PR #N" を送信）するパターンを採用した。
- **再発防止**:
  cron 駆動で外部状態（PR / Issue / branch）を作成する workflow は **「同期間内に既存成果物がある場合は silent skip」** を idempotency 契約として明記する。branch 命名 / タイトル prefix / 検索クエリの三点セットを `references/deployment-gha.md` の Post-release 30day auto-summary セクションに記載し、`task-specification-creator` skill の cron テンプレに idempotency-by-naming 条項を追加。
- **補足コンテキスト**:
  GitHub Actions では `concurrency:` group も併用可能だが、`concurrency` は同時実行のキャンセル制御であり「同月内 1 PR」という業務契約は表現できない。命名規約による idempotency は state を Git 側に持たせる pull-based パターンであり、外部 KVS 不要で堅牢。
- **観測 metric**:
  `gh pr list --state all --search "[auto-summary] post-release-dashboard 30d"` を月次で実行し、各月（YYYYMM）に対して PR が高々 1 件であることを smoke check に組み込む。複数件発生時はアラート。

### L-517-003: Slack channel manual bootstrap 境界 — Phase 11 preflight でユーザー手動操作が必要な範囲と cron 自動実行が引き継ぐ範囲の分離

- **症状**:
  Slack channel `#post-release-30day-summary` の作成 / webhook URL 発行 / GitHub Secret 登録は外部 SaaS の人手操作が必須だが、Phase 11 evidence 取得時に「どこまでがユーザー手動 / どこから cron 自動」かの境界が曖昧で、`state: completed` を主張すると preflight 未済の secret を CI が空文字で参照する事故を引き起こしかけた。
- **原因**:
  Phase 11 の `state: blocked_runtime_evidence` は「実行できない」ことしか表現できず、「contract（コード / workflow / spec）は ready だが、外部 secret 投入だけが pending」という中間状態を表す状態語彙が存在しなかった。そのため契約完成と secret 投入完成が同一フェーズで扱われ、user gate と CI gate の責任が混ざった。
- **解決**:
  新しい状態語彙 `CONTRACT_READY_SECRET_PENDING` を導入し、Phase 11 main.md と artifacts.json で「コード・workflow・bats テストは PASS、Slack channel + webhook + secret 投入のみ user 手動操作待ち」を明示。Phase 12 implementation-guide には **「ユーザー手動 bootstrap checklist（4 項目）」** と **「cron 引き継ぎ後の自動範囲（PR 作成 / Slack 通知 / artifact 保存）」** を別セクションで列挙し、責任境界を一目で識別できるようにした。
- **再発防止**:
  外部 SaaS secret bootstrap を含むタスクは、Phase 11 / 12 で `CONTRACT_READY_SECRET_PENDING` を採用する。`phase12-task-spec-compliance-check.md` の Mandatory Checks に「user manual bootstrap checklist の存在 / cron auto range の分離記述」を追加。`references/deployment-gha.md` の Slack 連携セクションに secret 投入 4 ステップのテンプレを記載する。
- **補足コンテキスト**:
  Slack incoming webhook は app 単位で複数 channel に紐付け可能だが、本 workflow では失敗通知 / 成功通知 / skip 通知の 3 経路を同一 channel に集約するため、webhook URL は 1 本のみ secret 化する。webhook を複数本に分けると secret 管理の複雑度が上がり、CONTRACT_READY 状態の検証コストが増える。
- **観測 metric**:
  Phase 11 main.md に「user_manual_bootstrap_checklist」（4 項目）と「cron_auto_range」（3 項目）の 2 リストを必ず含め、合計 7 項目のチェック状態を artifacts.json の `bootstrap_status` フィールドで個別に追跡する。

### L-517-004: fixture 日付プレースホルダー動的展開 — bats fixture で固定日付を使うと将来 staleness を起こすため、テスト時に動的展開する設計

- **症状**:
  bats テスト初版では fixture JSON に `"created_at": "2026-05-01T00:00:00Z"` のような固定日付を埋め込んでいたため、`30day-summary.sh` が「now - 30d」基準で window フィルタを実行する将来時点では fixture 全件が window 外になり、テストが silent に空件 PASS（false positive）になる構造だった。
- **原因**:
  fixture の役割が「window 内の代表データ」であるにも関わらず、絶対日付で書かれていた。bats 環境で `date` を呼ぶか envsubst を使うかの設計判断が初版では未確定で、時間相対のテストデータを表現する手段がなかった。
- **解決**:
  fixture JSON に `__NOW_MINUS_5D__` / `__NOW_MINUS_15D__` / `__NOW_MINUS_29D__` 等のプレースホルダー文字列を埋め込み、bats `setup()` 内で `date -u -v-5d +%Y-%m-%dT%H:%M:%SZ`（macOS BSD date）と `date -u -d '5 days ago' +%Y-%m-%dT%H:%M:%SZ`（GNU date）両対応の置換関数 `expand_fixture_dates` を実装。テスト実行ごとに `mktemp` で展開済み fixture を生成し、絶対日付を持たない構造を維持した。
- **再発防止**:
  時間 window フィルタを含む shell テストでは、fixture を絶対日付で書かない。`scripts/post-release-dashboard/__tests__/lib/fixture-helpers.bash` のような共有ヘルパに展開関数を集約し、新規 fixture 追加時もプレースホルダー命名規約（`__NOW_MINUS_<N>D__`）に従う。`task-specification-creator` skill の bats セクションに「relative-date fixture pattern」テンプレを追加。
- **補足コンテキスト**:
  macOS BSD `date` と GNU `date` は日付演算の引数体系が異なる（`-v-5d` vs `-d '5 days ago'`）。CI（GitHub Actions ubuntu-latest）と開発者 macOS の両方で動かすには両対応の wrapper が必要で、`expand_fixture_dates` ヘルパでこの差分を吸収している。
- **観測 metric**:
  bats 実行ログに `expanded fixture: <path> (NOW=<UTC>, <N> placeholders replaced)` を出力し、テストごとに展開件数が期待値と一致することを assert する。0 件の場合は fixture 設計のエラーとして fail させる。

### L-517-005: shell test plain bash 化 — vitest 不採用で 10 ケース PASS 設計に至った判断

- **症状**:
  monorepo の他テストは `vitest` を採用しているため、shell script のテストも vitest + child_process で書く案が初期にあったが、(1) Node プロセス起動コストで実行が秒オーダーに膨らむ、(2) shell exit code / stderr / stdout のアサーションが `execSync` の例外ハンドリング前提で冗長、(3) actionlint / shellcheck の流儀と整合せず CI で 2 系統の lint chain が必要、という問題を抱えた。
- **原因**:
  「monorepo 統一」を優先して TypeScript test runner に寄せようとしたが、対象が pure shell script + workflow YAML である以上、test 言語と被テスト言語のインピーダンスミスマッチが大きかった。shell script を Node 経由で叩く層自体が新規バグの源になる。
- **解決**:
  vitest を不採用とし、`bats-core` で 10 ケース（fixture 展開 / window filter / aggregation / output format / idempotency check / dry-run / error path 等）を直接 shell からアサートする構成を採用。CI の lint chain は `actionlint`（workflow YAML）+ `shellcheck`（shell script）+ `bats`（test runner）の 3 点で完結し、Node 依存ゼロにした。`outputs/phase-12/implementation-guide.md` に「shell-only test stack rationale」セクションを追加して将来の再検討候補から外した。
- **再発防止**:
  pure shell automation のテストは bats を第一選択にする。`task-specification-creator` skill の `WORKFLOW_AUTOMATION` モードに「shell test runner 選定基準」を追加し、対象が shell + YAML のみなら bats、Node ライブラリ呼び出しを含むなら vitest という明確な分岐を記載する。
- **補足コンテキスト**:
  bats は Bash 4+ 必須だが、ubuntu-latest / macOS いずれも mise 経由で安定して導入可能。bats-assert / bats-support などの拡張ライブラリは git submodule ではなく `pnpm` の devDependency に @types を持たない pure shell パッケージとして配置する選択肢もあるが、本タスクは依存最小主義で標準 bats のみを採用した。
- **観測 metric**:
  bats 実行時間（10 ケース）が CI 上 30 秒以内、ローカル macOS で 5 秒以内であることを定常確認する。それを超える場合は fixture 肥大 / 不要な subprocess 呼び出しを疑う。

### L-517-006: Phase-12 strict filename drift 再発防止 — 正本ファイル名固定の重要性

- **症状**:
  Phase 12 close-out 中、`outputs/phase-12/` に `documentation-changelog.md` ではなく `documentation_changelog.md`（underscore 命名）/ `skill-feedback-report.md` ではなく `skill-feedback.md`（短縮命名）でファイルを生成しかけた。compliance-check の grep が strict filename を見ていたため間一髪検出されたが、検出されなければ Phase 13 PR 本文生成時に `implementation-guide.md` のリンク切れ / `skill-feedback-report.md` の欠損として顕在化していた。
- **原因**:
  Phase 12 strict output ファイル名が複数の skill / template で参照されているにもかかわらず、命名規約の正本（reference）が分散していた。前段の Issue #351 lessons-learned でも outputs 実体性 grep gate の話題は扱われたが、ファイル名 drift 自体は明示的に教訓化されておらず、命名揺らぎの再発余地が残っていた。
- **解決**:
  Phase 12 の strict filename を以下 7 件に固定し、`phase12-task-spec-compliance-check.md` の Mandatory Checks に **「strict filename exact match」** を追加: `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `skill-feedback-report.md` / `artifacts.json` / `compliance-check.md`。命名は kebab-case 固定、underscore / 短縮形を禁止。本タスクの compliance-check では `find outputs/phase-12 -maxdepth 1 -type f -name '*.md' | sort` の結果を期待 list と diff 比較する step を追加した。
- **再発防止**:
  Phase 12 strict filename の正本を `task-specification-creator` skill の `references/phase-12-guide.md` に一元化し、各 task spec はそれを参照するだけにする。compliance-check の grep gate は exact-name diff を採用し、部分一致 / 拡張子一致のみの判定を禁止する。本 lessons-learned を `references/lessons-learned-issue-517-followup-auto-summary-2026-05.md` として promoted 先に追加し、後続 cron automation タスクで必ず参照する。
- **補足コンテキスト**:
  ファイル名 drift は単純な typo 由来というより、subagent / template 間で命名規約が局所定義されているときに発生しやすい。kebab-case と snake_case の混在は monorepo の他領域（`apps/api`、`apps/web`）でも事故源であり、Phase 12 outputs に限らず全域で kebab-case を採用するのが安全。
- **観測 metric**:
  `find docs/30-workflows/*/outputs/phase-12 -maxdepth 1 -type f -name '*.md'` の結果集合と期待 list（7 件）の対称差分が空集合であることを compliance-check の必須項目に追加。差分があれば fail。

## タイムライン（参考）

本タスクで踏んだ主要な分岐点を時系列で残す。後続タスクが類似の判断ポイントに到達した際の参照用。

1. **Phase 1〜3（要件 / 設計）**
   - 当初は「Issue #351 の collect.sh を流用して、月次集計だけ別 script で書く」案 / 「collect.sh 自体を月次モード対応に拡張する」案の二案。後者は単一責務原則に反するため、別 script (`30day-summary.sh`) として独立させた。
2. **Phase 5〜7（実装）**
   - workflow_dispatch のみで動く初版を実装後、schedule cron を追加した時点で L-517-001（event_name 分岐の崩れ）が発生。`env.IS_SCHEDULE` 集約に refactor。
   - branch 命名を `auto/post-release-30day-summary` 固定で実装したところ、月次再実行で L-517-002（既存 PR 上書き）が判明。`-YYYYMM` suffix 化と silent skip を導入。
3. **Phase 9（quality gate）**
   - vitest で shell 経由テストを書こうとしたが、step が冗長になり L-517-005 の判断で bats に切り替え。10 ケース PASS 設計に落ち着く。
   - fixture を絶対日付で書いた初版が L-517-004（将来 staleness）の懸念で reject。`__NOW_MINUS_<N>D__` プレースホルダーに統一。
4. **Phase 11（runtime evidence）**
   - Slack channel 作成 / webhook 発行 / secret 投入の境界が曖昧で `state: blocked_runtime_evidence` をそのまま採用しかけたが、L-517-003 の議論を経て `CONTRACT_READY_SECRET_PENDING` 状態語彙を新設。
5. **Phase 12（close-out）**
   - subagent 監査時に L-517-006 のファイル名 drift（underscore / 短縮命名）が間一髪検出され、strict filename exact match を compliance-check に組み込んで再発防止。

## 横断的な学び

6 件の苦戦箇所を俯瞰すると、共通する根本原因は以下 3 点に集約される。

1. **「外部時間 / 外部 SaaS / 外部状態」を含む automation は、契約完成と運用完成を分離した状態語彙が必要**
   - 単なる `state: completed` では実行可能性を保証できないため、`CONTRACT_READY_SECRET_PENDING` のような中間状態を Phase 11 / 12 の正本語彙として持つ必要がある。Issue #351 では runtime gate 3 段階分離（L-351-006）で同じ問題を扱ったが、本タスクでは secret 投入の半自動性が加わるため、より粒度の細かい分離が必要だった。
2. **idempotency は外部 KVS でなく Git / GitHub の自然な状態（branch / PR / Issue）で表現するのが堅牢**
   - 命名規約（時間粒度を含む branch 名）+ 検索クエリ（タイトル prefix）+ silent skip パターンの三点で、外部依存ゼロの idempotency が成立する。pull-based / declarative なパターンを優先する。
3. **shell automation のテストは pure shell stack に閉じる**
   - vitest 経由の Node wrapper は、対象が shell + YAML のみの場合は不要な複雑度を生む。bats + actionlint + shellcheck の 3 点セットで十分な品質ゲートが構築できる。fixture の動的展開も同じ原則に従い、bats setup() に閉じる。

## 反映先（promoted to）

- `references/deployment-gha.md` — Post-release 30day auto-summary セクション新設、`IS_SCHEDULE` env 集約 / 月次 idempotency 命名規約 / Slack secret bootstrap 4 ステップを追記
- `references/task-workflow-active.md` — Issue #517 行に本 lessons-learned へのリンク追加
- `.claude/skills/task-specification-creator/references/phase-11-guide.md` — `CONTRACT_READY_SECRET_PENDING` 状態語彙の正式採用
- `.claude/skills/task-specification-creator/references/phase-12-guide.md`（または同等の正本）— Phase 12 strict filename 7 件の固定リスト、kebab-case 命名規約、exact-name diff gate
- `.claude/skills/task-specification-creator` の `WORKFLOW_AUTOMATION` モードテンプレ — event_name 集約 / idempotency-by-naming / shell test runner 選定基準 / relative-date fixture pattern を追加
- `scripts/post-release-dashboard/__tests__/lib/fixture-helpers.bash`（新規）— `expand_fixture_dates` 関数を共有ヘルパとして配置
- `.claude/skills/aiworkflow-requirements/indexes/{keywords.json,quick-reference.md,topic-map.md,resource-map.md}` — `lessons-learned-issue-517-*` のキーワード / topic / resource エントリ追加

## 再発防止サマリ表

| ID | カテゴリ | 再発防止の正本反映先 | grep / gate キーワード |
|----|----------|-----------------------|--------------------------|
| L-517-001 | workflow 設計 | `references/deployment-gha.md` Post-release 30day セクション | `env.IS_SCHEDULE` |
| L-517-002 | idempotency | `task-specification-creator` cron テンプレ | `auto/post-release-30day-summary-YYYYMM` |
| L-517-003 | secret bootstrap | `phase-11-guide.md` の `CONTRACT_READY_SECRET_PENDING` | `bootstrap_status` (artifacts.json) |
| L-517-004 | fixture 設計 | `__tests__/lib/fixture-helpers.bash` | `__NOW_MINUS_<N>D__` |
| L-517-005 | test stack 選定 | `WORKFLOW_AUTOMATION` モード「test runner 選定基準」 | `bats` / `actionlint` / `shellcheck` |
| L-517-006 | filename drift | `phase-12-guide.md` strict filename list | exact-name diff (7 ファイル) |

## 後続タスクが事前確認すべき運用 checklist

- [ ] 月次 cron が想定 timezone（UTC）で発火することを `schedule:` cron 表記で確認
- [ ] `IS_SCHEDULE` env 集約パターンが新規 step 追加後も維持されているか
- [ ] branch 命名 / PR タイトル prefix が規約と一致し、`gh pr list` での既存検出が機能するか
- [ ] Slack webhook が 1 本に集約され、failure / success / skip の 3 経路が同一 channel に届くか
- [ ] fixture 内の絶対日付混入が grep `[0-9]{4}-[0-9]{2}-[0-9]{2}` でゼロ件であることを check
- [ ] bats 10 ケースの実行時間が CI 30 秒 / local 5 秒以内か
- [ ] Phase 12 outputs strict filename 7 件の対称差分が空であるか
- [ ] `CONTRACT_READY_SECRET_PENDING` 状態語彙が Phase 11 main.md / artifacts.json で一致しているか

## 用語集（本タスクで導入 / 確定した語彙）

- **schedule-only gate**: GitHub Actions workflow 内で `github.event_name == 'schedule'` 由来でのみ実行する処理を、`env.IS_SCHEDULE` で集約判定する設計パターン。step level の if 句に分散させない。
- **idempotency-by-naming**: 月次 / 日次 cron が成果物（branch / PR / Issue）を作成する際、時間粒度を含む命名規約 + タイトル prefix + 検索クエリの三点で「同期間内に既存成果物があれば silent skip」を実現するパターン。外部 KVS 不要。
- **CONTRACT_READY_SECRET_PENDING**: コード / workflow / テストは ready だが、外部 SaaS secret 投入のみが user 手動操作待ちの状態。Phase 11 main.md と artifacts.json で明示的に採用する状態語彙。
- **relative-date fixture pattern**: bats fixture 内に `__NOW_MINUS_<N>D__` 等のプレースホルダーを埋め、テスト実行ごとに `expand_fixture_dates` ヘルパで動的展開するパターン。絶対日付混入を防ぐ。
- **shell-only test stack**: pure shell + YAML 対象の自動化を、vitest を用いず `bats` + `actionlint` + `shellcheck` の 3 点で完結させる test stack 選定方針。
- **strict filename exact match**: Phase 12 outputs の正本ファイル名 7 件を kebab-case で固定し、compliance-check の grep gate で対称差分が空であることを必須化する命名規律。

## 引用元

- workflow: `.github/workflows/post-release-30day-auto-summary.yml`（`IS_SCHEDULE` env、月次 branch 命名、PR silent skip step）
- script: `scripts/post-release-dashboard/30day-summary.sh`（window filter、aggregation、dry-run mode）
- test: `scripts/post-release-dashboard/__tests__/30day-summary.bats`（10 ケース PASS、relative-date fixture）
- fixture: `scripts/post-release-dashboard/__tests__/fixtures/*.json`（`__NOW_MINUS_<N>D__` プレースホルダー）
- spec: `docs/30-workflows/issue-517-followup-auto-summary/outputs/phase-12/implementation-guide.md`、`.../system-spec-update-summary.md`、`.../documentation-changelog.md`、`.../skill-feedback-report.md`
- 前段教訓: `references/lessons-learned-issue-351-post-release-dashboard-2026-05.md`（特に L-351-002 outputs 実体性 grep、L-351-005 actionlint / yamllint / secret negative grep、L-351-006 runtime gate 3 段階分離）
- subagent 監査記録: `outputs/phase-12/main.md` の Audit findings セクション（6 件の苦戦箇所はすべて本監査により抽出された）
- 関連 issue: GitHub Issue #517（本タスクの起票元）、Issue #351（前段の post-release dashboard 基盤）
- 関連 PR: 本タスクの Phase 13 user approval 後に作成される PR（タイトル prefix `[auto-summary] post-release-dashboard 30d <YYYYMM>`）
- 状態語彙: Phase 11 main.md の `state: CONTRACT_READY_SECRET_PENDING`、Phase 12 main.md の `state: completed`（implementation-local、runtime gate は Phase 13 user approval まで blocked）
- compliance-check: `outputs/phase-12/compliance-check.md`（strict filename 7 件の exact-name diff、user manual bootstrap checklist、cron auto range 分離記述、shell-only test stack rationale を Mandatory Checks に追加した版）
