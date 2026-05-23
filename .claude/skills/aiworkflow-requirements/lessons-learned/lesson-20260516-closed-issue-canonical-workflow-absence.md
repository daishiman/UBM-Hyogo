# Lessons Learned — closed GitHub issue で canonical workflow root が欠落するケース（Issue #718 legacy CF token revocation, 2026-05-16）

> task: `issue-718-legacy-cf-token-revocation`
> 関連 workflow: `docs/30-workflows/issue-718-legacy-cf-token-revocation/`
> 関連 unassigned-task: `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`
> 関連 skill 反映: `.claude/skills/aiworkflow-requirements/changelog/20260516-issue718-legacy-cf-token-revocation.md`
> 関連 reference: `references/deployment-secrets-management.md`

## 背景

Issue #718 は GitHub 上で既に `closed` 状態だったが、issue 本文のリンクは `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md` の 1 ファイル（unassigned task）のみを指しており、**canonical workflow root（`docs/30-workflows/<id>/index.md` + Phase 1-13 outputs）が未生成**だった。結果として Phase 12 strict outputs の物理ファイルも evidence も aiworkflow-requirements skill の traceability index から欠落していた。「closed = 完了 = 触らない」と素直に解釈すると skill 側の正本性が壊れるため、closed issue でも後付け生成する pattern と redaction / approval gate 契約を本 lesson に記録する。

本件特有の難しさは次の 3 点に集約される:

1. **closed なので「触らない」が default 行動**: AI agent は closed issue を skip しがちで、skill traceability gap の発見が遅れる。
2. **Issue 本文リンクの不可逆性**: GitHub issue 本文は履歴に残るため、リンク先ファイルを削除/移動すると dead link が永続化する。`docs/30-workflows/unassigned-task/` の取り扱いに **保持ルール**が必要。
3. **不可逆 mutation の混在**: Cloudflare token revocation は AI が独断実行してはいけない不可逆操作で、approval gate と redaction contract を明示しないと skill が「やってもよい」と誤判断する余地が残る。

## 教訓一覧

### L-I718-001: closed issue でも canonical workflow root は後付け生成する

- **背景**: closed の issue は GitHub 側で「終わったもの」として扱われがちだが、skill traceability 側で root が無いと「どの phase で何が evidence 化されたか」が後追い不能になる。Issue #718 では本文リンク先が unassigned task 1 ファイルしかなく、Phase 5/7/9/11/12 の物理 outputs が全て不在だった。
- **教訓**: closed issue でも skill 正本性の観点で canonical workflow root が必要なら **後付け生成する**。生成タイミングは「skill 側 traceability gap を観測した時点」で OK。closed のままで構わない（GitHub 上の re-open は不要）。
- **将来アクション**: aiworkflow-requirements `topic-map.md` / `resource-map.md` に「closed issue でも canonical workflow root が存在することを期待する」原則を明記し、欠落観測時の generation runbook を `quick-reference.md` に追記する。

### L-I718-002: unassigned-task は削除せず `status: consumed` + `canonical_workflow:` pointer で保持

- **背景**: canonical workflow root を後付け生成した時点で unassigned task は役目を終えるが、Issue 本文リンクが unassigned task を指している以上、**ファイルを削除すると GitHub issue 本文の link が dead link 化**する。
- **教訓**: unassigned task は **物理削除しない**。frontmatter に `status: consumed` と `canonical_workflow: docs/30-workflows/<id>/` を追記し、本文冒頭に「This task has been promoted to <canonical_workflow>」の pointer 行を残す。Issue 本文リンクは温存される。
- **将来アクション**: task-specification-creator skill に「unassigned-task promotion 時の保持規約」として登録する。`status: consumed` を index walker の skip 対象 status として扱う。

### L-I718-003: 不可逆 mutation は `governance_mutation_user_gate: true` で人間承認を必須化

- **背景**: 本 workflow の最終 mutation は Cloudflare API token / GitHub Secret / 1Password Item の revocation という **不可逆** 操作で、AI が独断で実行すると rollback 不能。
- **教訓**: 不可逆 mutation を含む workflow は artifacts.json / index.md frontmatter に `governance_mutation_user_gate: true` を明示する。AI は **read-only evidence の取得までは事前自律実行可能**（`read_only_evidence_allowed_pre_gate: true`）だが、mutation 本体は `outputs/phase-13/user-approval-<id>-<ts>.md` の物理ファイル存在を確認するまで実行しない。
- **将来アクション**: aiworkflow-requirements の `references/deployment-secrets-management.md` に上記 3 keys（`governance_mutation_user_gate` / `user_approval_marker` / `read_only_evidence_allowed_pre_gate`）を契約として登録する。`user-approval-<id>-<ts>.md` は markdown ファイルとして物理保存し、git commit で履歴化する。

### L-I718-004: redaction contract — token 値・preview・suffix・account id は evidence に残さない

- **背景**: Cloudflare token / GitHub Secret 名は機密度が高く、token 値そのものだけでなく **prefix / suffix / preview（先頭末尾数文字）/ account id** も evidence に転写すると、漏洩経路が広がる。`scripts/cf.sh whoami` 等の出力には account id が含まれる。AI agent は「evidence 充実 = 詳細出力をそのまま貼る」という方向に流れがちで、本来 redaction すべき情報を無意識に転写するリスクが高い。
- **教訓**: evidence には **command name / exit code / item name（識別子レベル）のみ**を残す。token 値・preview・suffix・account id・OAuth tokenfile path 等は redacted 表記（`<REDACTED>`）で残し、生出力を貼らない。grep 困難な情報は別途 1Password に保管し、evidence ファイルから 1Password Item 参照のみで辿れる構造にする。AI が誤って転写した場合に備え、`rg` で account id / token prefix を全 workflow 配下から検出する gate を CI に追加するのが望ましい。
- **将来アクション**: `references/deployment-secrets-management.md` の redaction contract セクションに上記 4 種を「evidence 禁止情報」として列挙する。`scripts/verify-redaction.sh` 仮称で `docs/30-workflows/` 配下を grep し、account id pattern / token prefix pattern が混入していないかをチェックする CI gate を追加候補とする。

### L-I718-005: 3 surface（Cloudflare / GitHub Secrets / 1Password）は同一 wave で reconcile

- **背景**: token revocation は (a) Cloudflare 側 token 無効化、(b) GitHub Secrets 側の値更新 or 削除、(c) 1Password Item の archived 化、の **3 surface を同期** しないと「Cloudflare 上は revoked だが GitHub Actions は古い値を保持」等の drift が残る。
- **教訓**: 3 surface の reconcile は **同一 wave** で実施し、Phase 11 evidence に 3 surface 全ての before/after state（item name 単位）を並置する。順序は (a) → (b) → (c) を推奨。途中で失敗した場合の partial state も evidence に残す。
- **将来アクション**: `references/deployment-secrets-management.md` に「3 surface reconcile wave template」を追記し、token / secret rotation workflow の出発点として複製できるようにする。

### L-I718-006: read-only evidence は user approval gate より前に取得して良い

- **背景**: `governance_mutation_user_gate: true` を厳格に解釈すると、approval 取得前は一切操作禁止と読めてしまう。しかし `bash scripts/cf.sh whoami` / `gh secret list` / `op item list` 等の read-only 操作は副作用が無く、approval 判断材料として **事前取得した方が approval 品質が上がる**。
- **教訓**: `read_only_evidence_allowed_pre_gate: true` を契約に含めることで「mutation のみ gate / 観測は事前 OK」の区別を明示する。事前取得した read-only evidence は `outputs/phase-11/` 配下に保存し、approval marker 作成時に reference できるようにする。read-only 判定は (a) `--dry-run` flag、(b) list / get / show 等の read 系コマンド、(c) `--help` の 3 種類に限定する。
- **将来アクション**: `references/deployment-secrets-management.md` の approval gate セクションに「read-only 操作判定基準」の表を追加する（コマンド名 → read-only / mutation 分類）。

### L-I718-007a: AI が「closed = skip」と誤判定するのを防ぐ skill 側 trigger

- **背景**: closed issue は GitHub CLI / API の default filter で除外されることが多く、skill 側の skip 判定も「closed なら触らない」が default になりがち。本件は人間側の skill traceability 観察で初めて gap が見つかった。
- **教訓**: aiworkflow-requirements skill の trigger 列挙に「closed issue + canonical workflow root 不在」を **explicit な探索 trigger** として登録する。`indexes/keywords.json` に `closed-issue-retroactive-root` のような keyword を追加し、quick-reference からの導線を引く。
- **将来アクション**: skill の `references/task-workflow-active.md` に「retroactive root generation candidates」セクションを設け、月次で `gh issue list --state closed --search 'no:linked-pr'` 相当の探索を行うチェックポイントを追加する。

### L-I718-008: closed issue で workflow root を後付け生成する場合の phase 構成

- **背景**: closed issue の後付け root 生成では、既に過去に実施済みの作業が部分的に存在する可能性があり、Phase 1-13 を「過去 work の再構成」+「未実施 work の前向き planning」のハイブリッドで構成する必要が出る。
- **教訓**: 後付け root の Phase 構成は (a) Phase 1-4 = 過去 work の reverse engineering（Issue / 関連 PR / 関連 commit から scope と evidence を再構築）、(b) Phase 5-9 = 未実施 work の前向き planning、(c) Phase 11-12 = 両者を統合した evidence + close-out、で組む。再構成 phase の evidence は出典 commit hash / PR # / issue comment URL を明示する。
- **将来アクション**: task-specification-creator skill に「retroactive workflow root generation」phase template を登録候補として `unassigned-task-detection.md` に記録する。

## 後付け root 生成チェックリスト（closed issue から retroactive workflow を起こす際に転記）

- [ ] Issue 本文リンクの保持対象を列挙（unassigned-task / 別 workflow / 別 issue）
- [ ] 保持対象は **削除せず** `status: consumed` + `canonical_workflow:` pointer に書き換える
- [ ] canonical workflow root `docs/30-workflows/<id>/index.md` を新規作成し artifacts.json frontmatter を初期化
- [ ] artifacts.json に `governance_mutation_user_gate` / `user_approval_marker` / `read_only_evidence_allowed_pre_gate` を明示
- [ ] redaction contract（token 値・preview・suffix・account id）を `documentation-changelog.md` Validator Execution Log に固定
- [ ] 3 surface reconcile（Cloudflare / GitHub Secrets / 1Password）の対象 item 名一覧を Phase 5 で確定
- [ ] approval marker `outputs/phase-13/user-approval-<id>-<ts>.md` を mutation 実行前に物理生成し commit
- [ ] read-only evidence は approval gate 前に取得し `outputs/phase-11/` に保存
- [ ] mutation 実行後の after-state を 3 surface 全てで evidence 化

## 参照

- 親 workflow: `docs/30-workflows/issue-718-legacy-cf-token-revocation/`
- 残置 unassigned-task: `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`（`status: consumed`）
- 関連 skill ref: `references/deployment-secrets-management.md`
- 関連 lesson: `lessons-learned-ci-secret-alignment-followup-002-staging-production-secret-runbook-2026-05.md`
- 関連 artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-issue-718-legacy-cf-token-revocation-artifact-inventory.md`
