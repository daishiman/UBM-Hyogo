# Phase 8: リファクタリング

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 8 / 13 |
| taskType | implementation |
| implementation_mode | `edit`（既存 error-handler / safe-fetch / diagnose script 編集 + api-cd.yml 新規） |
| visualEvidence | VISUAL_ON_EXECUTION（4 タスクとも NON_VISUAL・UI 描画不変） |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

T01〜T04 の DoD 達成後・同一サイクル内に行うリファクタリングを、**対象 / Before / After / 理由**のテーブルで記録する（Feedback RT-03 準拠）。本 WF は「削除でなく新規追加中心」の観測性付与であり、リファクタリングは (1) notFound ログ payload 構築の helper 化（T01 由来の重複導出を 1 箇所へ集約）、(2) smoke probe（healthz / 認証 me）の共通関数化（T02 の `runtime-admin-api.sh` 内の curl + status 判定の重複圧縮）、(3) api-cd.yml と web-cd.yml の重複 step を共有 composite action 化するか否かの判断（**過剰共通化を避ける根拠を含め非採用と確定**）の 3 点に限定する。各リファクタリングの rollback 単位（ファイル単位 checkout・api-cd.yml は新規ゆえ削除で revert）と、適用しない場合の fail-fast 縮退条件を明示する。

> 本 Phase は「DoD 達成後・契約不変のまま内部構造を整える」工程であり、AC を一切緩めない。リファクタリングで focused vitest / `bash -n` / yaml 構文ゲートに赤が出る場合は、当該リファクタリングを縮退（適用見送り）し、機能成果（T01〜T04 の payload/probe/CD）を正本として保持する。

## 実行タスク

### 8.1 リファクタリング方針（対象 / Before / After / 理由）

| # | 対象 | Before（T01〜T04 実装直後） | After（本 Phase 適用後） | 理由 |
| --- | --- | --- | --- | --- |
| R-1 | notFound ログ payload 構築（`apps/api/src/middleware/error-handler.ts` `notFoundHandler`） | `notFoundHandler` 本体に `URL` parse の try/catch・`hasAuthorization`（`c.req.header("authorization") !== undefined`）・`hasSessionCookie`（cookie ヘッダの `__Secure-authjs.session-token` 包含判定）・`context` オブジェクト組立がインラインで並ぶ | `notFoundHandler` 内に **`buildNotFoundDiagnosticContext(c): { reason; method; path; hasAuthorization; hasSessionCookie }`** という純関数 helper（同ファイル内 module-local・非 export）を切り出し、`notFoundHandler` は `const context = buildNotFoundDiagnosticContext(c)` を `ApiError` の `context` に渡すだけにする。path 解決の try/catch・cookie/authorization の boolean 導出はすべて helper 内に閉じる | 「path 解決」「secret を boolean 化する診断 context 構築」という 2 つの関心が `notFoundHandler` 本体に混在する。helper 化で boolean 化ルール（値・JWT 生文字列を出さない AC-9 の要）を 1 関数に局所化し、テスト（NF-1〜NF-5）が helper 出力を直接 assert できる。応答生成（`ApiError`→`errorHandler`）と診断 context 組立を分離する |
| R-2 | smoke probe 共通化（`scripts/smoke/runtime-admin-api.sh`） | `runtime-admin-api.sh` 内で probe-1（`GET {API_BASE}/me/healthz`）と probe-2（`GET {API_BASE}/me` cookie 付き）が、curl 実行・HTTP status 抽出・期待 200 判定・evidence への status 行追記を**それぞれ別ブロックでベタ書き**し、curl オプション（`-s -o /dev/null -w '%{http_code}'`・タイムアウト）と redaction 配慮が 2 箇所に重複する | probe を **`probe_status(label, url, expected, [cookie_header])` という単一 shell 関数**（status 抽出 + 期待値比較 + evidence への `label=status` 1 行追記・cookie は `Cookie:` ヘッダ送信のみで evidence へは書かない）に集約し、probe-1 は `probe_status me_healthz "{API_BASE}/me/healthz" 200`、probe-2 は `probe_status me "{API_BASE}/me" 200 "$cookie_header"` の 2 呼び出しにする | curl オプション・status 判定・redaction（cookie を evidence へ出さない）の規約を 1 関数へ集約すると、probe 追加時に regression 面（secret 漏洩・判定漏れ）が 1 箇所で担保される。`runtime-admin-web.sh` の既存 probe 関数があれば同型シグネチャに揃え、雛形踏襲の一貫性を保つ |
| R-3 | api-cd.yml × web-cd.yml の重複 step | api-cd.yml（新規）と web-cd.yml が `actions/checkout@v4`・`./.github/actions/setup-project`（`setup-strategy: mise`）・prereq skip 分岐・redaction grep gate・`upload-artifact` という骨格を**ほぼ同型で個別保持** | **共有 composite action 化は採用しない**（現状維持）。代わりに api-cd.yml の各 step に「web-cd.yml と同型（正本テンプレ）」のコメントを 1 行付し、差分（deploy 対象 config・probe URL・log 名・env prefix）だけが両 workflow の違いであることを可読化する | composite action 化は (a) deploy/smoke の中核差分（config path・probe URL・env prefix・OIDC/secret 配線）が多く、共通化すると分岐パラメータが増え可読性が下がる、(b) GitHub Actions の `environment:`（`staging` / `staging-runtime-smoke`）と `secrets` 参照は composite action へ透過的に渡せず再配線が要る、(c) web/api の deploy パイプラインは将来独立に変わり得る（api は build step 無し・web は OpenNext build あり）ため疎結合が望ましい、という 3 点で**過剰共通化のコストが共通化の利得を上回る**。重複は「同型テンプレのコメント明記」で意図を担保し、コード重複自体は許容する（YAGNI） |

> R-1/R-2 は T01/T02 の DoD（payload / probe の固定）を**一切変えず内部構造のみ整える**。R-3 は「共通化しない」という判断そのものがリファクタリング成果であり、新規コードを増やさない（コメント 1 行のみ）。

### 8.2 リファクタリング適用順序と DoD 不変の担保

| 順序 | リファクタリング | 適用前提 | 不変担保（再実行ゲート） |
| --- | --- | --- | --- |
| 1 | R-1（notFound helper） | T01 実装 DoD（NF-1〜NF-5 green）達成後 | `error-handler.spec.ts`（NF-1〜NF-5）を helper 化後も**無変更で再 green**。payload の key 集合（`reason`/`method`/`path`/`hasAuthorization`/`hasSessionCookie`）と boolean 値が helper 化前と byte 一致 |
| 2 | R-2（probe 関数） | T02 実装 DoD（CD-3 = `bash -n` PASS・probe-1/probe-2 構造）達成後 | `bash -n scripts/smoke/runtime-admin-api.sh` exit 0。probe-1=`/me/healthz` 200 判定・probe-2=`/me` 200 判定が関数化後も残存（grep で 2 呼び出し確認） |
| 3 | R-3（コメントのみ） | T02 実装 DoD 達成後 | `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/api-cd.yml'))"` parse 成功。step 構造は不変（コメント追加のみで job/step の数・順序・条件が変わらない） |

> R-1〜R-3 は対象ファイルが排他（error-handler.ts / runtime-admin-api.sh / api-cd.yml）のため、1 つの縮退が他へ波及しない。各リファクタリングは「DoD green を保ったまま」が合格条件であり、green を崩す場合は §8.4 の縮退（適用見送り）へ落とす。

### 8.3 エラーパターン / fail-fast / NO-GO 条件

| # | 段階 | エラー | 検出 | ハンドリング |
| --- | --- | --- | --- | --- |
| E-1 | R-1 適用 | helper 化で NF-1〜NF-5 のいずれかが赤（payload key/値が変わる） | Phase 9 focused vitest | helper の戻り値 key を T01 の payload（`reason`/`method`/`path`/`hasAuthorization`/`hasSessionCookie`）と完全一致へ戻す。一致不能なら §8.4 で helper 化を縮退（インライン維持） |
| E-2 | R-1 適用 | helper が cookie/authorization の**生値**を戻り値に含めてしまう | Phase 9 NF-2/NF-3 の grep assert | 戻り値を boolean のみへ戻す（**AC-9 NO-GO**）。helper の責務は boolean 化であり値透過は禁止 |
| E-3 | R-2 適用 | `probe_status` 関数が cookie を evidence へ書き込む | Phase 9 redaction grep（CD-3 / DG-4 相当） | evidence 追記は `label=status` の 1 行のみへ戻す。cookie は `Cookie:` ヘッダ送信のみ（**AC-9 NO-GO**） |
| E-4 | R-2 適用 | 関数化で probe-2 の期待 200 判定が緩む（404/401 を pass 扱い） | Phase 9 CD-3 grep | `expected` 引数の厳密一致比較を復元。probe-2 は 200 以外すべて fail（S1 検出が壊れる・NO-GO） |
| E-5 | R-3 判断 | composite action 化を誤って実施し `environment`/`secrets` 配線が落ちる | Phase 9 CD-2 grep + yaml parse | composite 化を撤回し同型コメント方針へ戻す（R-3 は「共通化しない」が正本） |
| E-6 | R-1〜R-3 横断 | `pnpm typecheck` / `pnpm lint` exit≠0 | Phase 9 L-1/L-2 | `pnpm lint --fix` → 残件を最小差分で手修正。型不整合（helper 戻り値型）は helper のシグネチャを T01 の context 型へ合わせる |
| E-7 | R-1〜R-3 横断 | リファクタリングが `apps/api` `/me` route / `/profile` UI / D1 / Form へ波及 | Phase 9 G-1 grep（`git diff` で `/me` route・`session-error-display.ts` 差分なし） | 直ちに当該 diff を revert（**AC-6 NO-GO**）。リファクタリングは error-handler.ts / runtime-admin-api.sh / api-cd.yml の 3 ファイルに閉じる |

### 8.4 fail-fast / 縮退条件

- Phase 9 の typecheck / lint / focused vitest / `bash -n` / yaml 構文 / redaction grep ゲートの**いずれか 1 件でも fail したら、当該リファクタリングを縮退**し、commit へ進む前に DoD green の状態へ戻す。
- 縮退の具体:
  - R-1 が NF 系を赤にする → helper 化を見送り、`notFoundHandler` インライン実装（T01 の task-01 §2 の差分そのまま）を正本として保持する。観測性（payload）は不変。
  - R-2 が `bash -n` / redaction を赤にする → probe 関数化を見送り、probe-1/probe-2 のベタ書き（T02 の task-02 §2 骨子そのまま）を保持する。
  - R-3 は元から「共通化しない」が正本のため縮退対象なし（誤って composite 化した場合のみ撤回）。
- **NO-GO 条件**（該当 diff を revert し T01/T02 の DoD 状態へ戻す）:
  - AC-6: `apps/api` `/me` route / `/profile` UI 文言・分岐 / D1 schema / Google Form 仕様への波及（E-7）。
  - AC-9: ログ payload / smoke evidence への cookie・JWT・Bearer・memberId の生値露出（E-2 / E-3）。
  - AC-2 / AC-3: notFound payload の key 欠落（E-1）・probe-2 の 200 判定緩和（E-4）。
- 本サイクルは worktree 内で完結（未 push・commit は user-gated）のため、すべてのリファクタリングは完全に戻せる。

### 8.5 rollback 単位（ファイル単位 revert・api-cd.yml は削除で revert）

| リファクタリング | rollback 単位 | rollback 手順 |
| --- | --- | --- |
| R-1（notFound helper） | `apps/api/src/middleware/error-handler.ts`（ファイル単位） | `git checkout origin/dev -- apps/api/src/middleware/error-handler.ts` で T01 編集ごと巻き戻す / helper 化のみ戻す場合は helper 抽出 commit を `git revert <sha>` し `notFoundHandler` インライン版（task-01 §2）へ戻す。`error-handler.spec.ts` は新規のため別途 `git rm` |
| R-2（probe 関数化） | `scripts/smoke/runtime-admin-api.sh`（**新規ファイル**） | `runtime-admin-api.sh` は T02 で新規追加のため `git rm scripts/smoke/runtime-admin-api.sh` で削除して revert（probe 関数化だけ戻す場合は当該 commit を `git revert` しベタ書き probe へ戻す） |
| R-3（同型コメント） | `.github/workflows/api-cd.yml`（**新規ファイル**） | api-cd.yml は T02 で新規追加のため `git rm .github/workflows/api-cd.yml` で**削除して revert**（コメント追加のみの場合は当該行を Edit で除去）。web-cd.yml は非接触のため影響なし |

> 4 タスク + 3 リファクタリングは対象ファイルが排他（error-handler.ts / api-cd.yml / runtime-admin-api.sh / safe-fetch.ts / diagnose-profile-session.sh）であり、1 ファイルの revert が他の成果を巻き込まない。T01〜T04 はコード非依存（task-01〜04 §8 で各々単独 revert 可と確定済）のため、リファクタリングの revert も他タスクの DoD を壊さない。api-cd.yml / runtime-admin-api.sh は**新規ゆえ削除で完全に元状態（手動 deploy 依存）へ戻る**。

## 統合テスト連携

R-1〜R-3 の不変担保（§8.2 の再実行ゲート）は Phase 9 の品質保証（typecheck / lint / focused vitest〔error-handler.spec.ts・safe-fetch.spec.ts〕/ `bash -n` / yaml 構文 / redaction grep / apps/api `/me` route 差分なし grep / session-error-display 差分なし grep）に紐づく。E-1〜E-7 の検出は Phase 9 の各ゲートに対応し、NO-GO（AC-2 / AC-3 / AC-6 / AC-9）違反は Phase 10 の最終レビューで blocker 判定の根拠になる。R-1（helper）/ R-2（probe 関数）は「DoD green を保ったまま」が合格条件で、Phase 11 の staging 復旧検証（user-gated）前に完了させる。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界（R-1 helper の boolean 化が侵さない境界） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 契約不変（E-7 / AC-6 NO-GO の根拠） |

- `_shared-context.md` §4（state ownership・リファクタリングが越えない責務境界）/ §6（AC-2/AC-3/AC-6/AC-9）/ §8（inventory）
- `outputs/phase-2/phase-2.md` §2.2（notFound ログ設計）/ §2.3（api CD + smoke gate 設計）/ §2.7（過剰共通化を避ける選定方針 FB-CRONVL-001 類似の予防）
- `outputs/phase-5/task-01-api-notfound-observability.md` §2（notFoundHandler 差分・R-1 の母体）/ §8（rollback）
- `outputs/phase-5/task-02-apps-api-auto-cd-and-smoke-gate.md` §2（probe 骨子・R-2/R-3 の母体）/ §8（rollback）
- `outputs/phase-6/phase-6.md`（NF / CD ケース表・R-1/R-2 の不変担保テスト）
- `.github/workflows/web-cd.yml`（R-3 の正本テンプレ・composite 化しない比較対象）
- `CLAUDE.md`（`bash scripts/cf.sh` 経由 deploy・sync-merge coverage-guard スキップポリシー）

## 成果物

- `outputs/phase-8/phase-8.md`（本ファイル）

## 完了条件

- [x] リファクタリング 3 点（R-1 notFound payload helper 化 / R-2 smoke probe 共通関数化 / R-3 composite action 化の判断）を **対象 / Before / After / 理由** テーブルで記録（Feedback RT-03）
- [x] R-3 で composite action 化を**非採用**とし、過剰共通化を避ける理由（環境/secret 配線・差分多寡・将来の独立変更）を 3 点明記
- [x] 各リファクタリングの DoD 不変担保（再実行ゲート）と適用順序を固定
- [x] E-1〜E-7 のエラーパターンを段階・検出・ハンドリング付きで列挙し NO-GO（AC-2/AC-3/AC-6/AC-9）を明示
- [x] fail-fast / 縮退条件（fail 時は当該リファクタリングを見送り DoD green を保持）を明示
- [x] rollback 単位（ファイル単位 checkout・api-cd.yml / runtime-admin-api.sh は**新規ゆえ削除で revert**）を確定
