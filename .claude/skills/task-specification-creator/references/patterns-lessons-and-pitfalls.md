# 失敗パターンと教訓集

> 親ファイル: [patterns.md](patterns.md)

## 目的

過去のタスク実行で発生した失敗事例と教訓を記録する。再発防止と初動短縮のためのリファレンス。

---

## Server Fetch / Service Binding

### Admin server-fetch service-binding symmetry

- **状況**: public fetch は Cloudflare `API_SERVICE` service-binding 優先なのに、admin server-fetch だけ `${INTERNAL_API_BASE_URL}` HTTP fetch のみで実装されていた。
- **問題**: 同一 Cloudflare account の `workers.dev -> workers.dev` 外向き fetch が loopback 404 になり、staging `/admin/*` が `ADMIN_FETCH_404` で degrade した。
- **解決策**: production/staging は `API_SERVICE.fetch()` を優先し、`NODE_ENV=test` / `PLAYWRIGHT_TEST=1` では HTTP fallback を維持する。`x-internal-auth` / `cookie` / body / error snippet 契約は focused spec で固定する。
- **教訓**: fetch 経路の root cause は per-route fixture や narrow warn では解消しない。public/admin の transport symmetry を Phase 2/4 gate に入れる。
- **発見日**: 2026-05-28

## スクリプト・正規表現関連

### Markdown見出しレベルの誤検出

- **状況**: 検証スクリプトでMarkdownのH2セクション（`##`）を検出して処理範囲を区切る際
- **問題**: `/^##/` パターンがH3（`###`）やH4（`####`）にもマッチし、予期せずループが早期終了した
- **原因**: 正規表現 `/^##/` は「##で始まる」だけを検査し、その後の文字を考慮していないため
- **教訓**: H2のみを検出したい場合は `/^## [^#]/` または `/^## (?!#)/` を使用する
- **発見日**: 2026-01-24
- **修正ファイル**: `scripts/verify-all-specs.js`

### Markdown見出し検出パターン（正解）

- **指針**:
  - H1のみ: `/^# [^#]/`
  - H2のみ: `/^## [^#]/`
  - H3のみ: `/^### [^#]/`
  - H2以上（H1, H2）: `/^#{1,2} [^#]/`
- **根拠**: 見出しの後にはスペースが続き、より深い見出し（例：###）との誤検出を防ぐ
- **発見日**: 2026-01-24

### validate-phase-output のセクション終端誤判定

- **状況**: `validate-phase-output.js` で「実行タスク」「完了条件」を抽出する際
- **問題**: 終端指定に `\z` を使っており、JavaScript正規表現では終端として解釈されず誤判定の温床になった
- **原因**: Ruby系正規表現の終端表記をNode.jsに持ち込んだ実装差異
- **解決策**: `content + sentinel heading` 方式に変更し、`(?=^##\s+)` のみでセクションを安定抽出
- **教訓**:
  1. Node.jsでは `\z` / `\Z` に依存しない
  2. Markdownセクション抽出は「終端見出しを付与してから切り出す」実装が安全
  3. 検証スクリプト自身の判定結果は、実ファイル内容と合わせて二重確認する
- **修正ファイル**: `.claude/skills/task-specification-creator/scripts/validate-phase-output.js`
- **発見日**: 2026-02-24

---

## Phase 12 関連失敗パターン

### 親 workflow skeleton と現行 route topology の乖離

- **状況**: 親 workflow の Task を子 workflow へ切り出す際、元 skeleton が想定する route 配置・削除対象・package 名が現行 codebase とずれる場合
- **問題**: skeleton をそのまま Phase 5 に流すと、存在しない component の削除、存在しない path の test 追加、誤 package 名の verify command が仕様書に残る
- **原因**: 親 task は設計時点の抽象 skeleton であり、子 workflow 作成時点の `apps/web/app` / `apps/web/src/components` 実態とは独立に stale 化しうる
- **教訓**:
  1. Phase 1 で `rg --files` / `ls` による current topology 実測を先に行う
  2. `元 skeleton の前提 / 実コードベースの実態 / 是正方針` の3列表を index と Phase 1 に置く
  3. route group 移動など user decision が必要な分岐は、Phase 2 以降へ曖昧な候補を残さず、選択済み方針だけを実装手順化する
  4. 実コード未実装の依存がある場合でも、aiworkflow の active ledger / quick-reference / artifact inventory へ `spec_created / implementation_pending` として同 wave 登録する
- **発見日**: 2026-05-29
- **関連タスク**: `task-c-public-member-sidebar-shell-integration`

### 未タスク検出後のtask-workflow.md登録漏れ（TASK-9B-G）

- **状況**: Phase 12で5件の未タスクを検出し、指示書を作成した
- **問題**: 指示書作成のみで完了と誤認し、task-workflow.mdの残課題テーブルへの登録を忘れた
- **原因**:
  1. 「指示書を作成した = 未タスク管理が完了」という誤った認識
  2. unassigned-task-guidelines.mdの「3ステップ必須」規定の見落とし
  3. documentation-changelog.mdに「完了」と記載したため、再検証をスキップ
- **教訓**:
  1. 未タスク検出は**3ステップ全て**を完了して初めて完了: ①指示書作成 → ②task-workflow.md登録 → ③関連仕様書登録
  2. Phase 12完了前に必ずtask-workflow.mdの残課題テーブルを確認
  3. documentation-changelog.mdへの「完了」記載は3ステップ確認後に行う
- **発見日**: 2026-02-03
- **関連タスク**: TASK-9B-G

### ネイティブモジュールNODE_MODULE_VERSION不一致（ENV-INFRA-001）

- **状況**: better-sqlite3がNODE_MODULE_VERSION不一致エラー（127 vs 131）で動作しない
- **問題**: pnpm storeに古いNode.jsバージョン用にコンパイルされたバイナリがキャッシュされ続ける
- **教訓**:
  1. NODE_MODULE_VERSION不一致は**pnpm store prune**でキャッシュクリアが必要
  2. その後**pnpm install --force**で再ビルドを強制
  3. .nvmrc/package.json engines/voltaの三重構造でバージョン管理する
- **修正コマンド**:
  ```bash
  pnpm store prune
  pnpm install --force
  ```
- **発見日**: 2026-02-04
- **関連タスク**: ENV-INFRA-001

### Phase 12 Task 2 Step 1-A更新漏れ（task-imp-search-ui-001）

- **状況**: Phase 12 Task 2実行時、タスク完了記録をシステム仕様書に追加した
- **問題**: 以下の3つの必須更新を漏らした
  1. **LOGS.md×2ファイル更新漏れ**: aiworkflow-requirements/LOGS.mdのみ更新し、task-specification-creator/LOGS.mdを忘れた
  2. **SKILL.md変更履歴更新漏れ**: 両スキルの変更履歴にバージョン番号を追記しなかった
  3. **topic-map.md再生成漏れ**: 仕様書更新後にgenerate-index.jsを実行しなかった
- **教訓**:
  1. Phase 12 Task 2は必ず**Step 1-A〜1-D + Step 2**の全ステップを個別に確認
  2. LOGS.mdは**aiworkflow-requirements + task-specification-creator**の**2ファイル**を更新
  3. SKILL.mdの変更履歴も更新対象（見落としやすい）
  4. 仕様書変更後はgenerate-index.jsで**topic-map.md再生成**が必須
  5. documentation-changelog.mdに各Stepの完了結果を詳細に記録することで漏れを可視化
- **発見日**: 2026-02-04
- **関連タスク**: task-imp-search-ui-001

### Phase 12 の skill root 取り違え（TASK-UI-06-HISTORY-SEARCH-VIEW）

- **状況**: system spec 更新で `.claude/skills/...` と `.agents/skills/...` の両方が存在する repo を扱った
- **問題**: mirror 側 `.agents` だけを更新し、ユーザー指定の `.claude` 正本が stale のまま残りうる
- **教訓**:
  1. system spec 更新先は `.claude/skills/...` を canonical root に固定する
  2. `.agents` は mirror 扱いとし、正本更新の代替にしない
  3. `rg -n "\\.agents/skills/.+references" docs/30-workflows/<workflow>` で workflow / outputs の mirror 参照を確認する
- **発見日**: 2026-03-10
- **関連タスク**: UT-IMP-SKILL-ROOT-CANONICAL-SYNC-GUARD-001

### Phase 12出力要件の漏れ

- **状況**: タスク仕様書（phase-12-documentation.md）作成時
- **漏れた要件**:
  1. `implementation-guide.md` Part 1（中学生レベル概念説明）
  2. `documentation-changelog.md`（システム仕様書更新履歴）
  3. `unassigned-task-detection.md`（0件でも必須）
- **教訓**: Phase 12タスク仕様書作成時は必ずphase-11-12-guide.mdのTask 1-4を確認
- **発見日**: 2026-01-26
- **関連タスク**: TASK-3-1-D

### Notification 統合の段階導入で既存テストを壊さない

- **状況**: `RuntimeSkillCreatorFacade` に通知サービスと before-quit ガードを追加した
- **教訓**:
  1. `notificationService?: INotificationService` の optional DI にすると、既存の `RuntimeSkillCreatorFacade` テスト群を壊さずに段階導入できる
  2. 実行中判定は boolean ではなく `activeExecutionCount` + `try/finally` にすると、並行 execute と before-quit ガードの両方に整合する
  3. Vitest の coverage コマンドはバージョンや cwd で挙動が変わるため、`cd apps/desktop && pnpm exec vitest run ...` のように実際に通ったコマンドを current facts に残す
- **発見日**: 2026-04-02
- **関連タスク**: TASK-NOTIFICATION-SERVICE-001

### 未タスク配置ディレクトリの間違い（TASK-9B-I）

- **状況**: Phase 12 で UT-9B-I-001 を検出し指示書を作成した
- **問題**: 配置先を `docs/30-workflows/unassigned-task/` ではなく `docs/30-workflows/skill-import-agent-system/tasks/` に配置
- **教訓**:
  1. 未タスク指示書は必ず `docs/30-workflows/unassigned-task/` に配置する
  2. 親タスクの `docs/30-workflows/{feature-name}/tasks/` はタスク仕様書の配置先であり、未タスク指示書の配置先ではない
  3. 配置後に `ls docs/30-workflows/unassigned-task/` で物理ファイルの存在を検証する
- **発見日**: 2026-02-12
- **関連タスク**: TASK-9B-I-SDK-FORMAL-INTEGRATION

### テスト数の設計時固定値使用（TASK-9B-I）

- **状況**: Phase 4 で設計した想定テスト数「18」を Phase 12 まで使い続けた
- **問題**: 実装後の実際のテスト数は「13」であり、Phase 12 のドキュメントに不正確な数値が記載された
- **教訓**:
  1. Phase 12 では必ず `grep -c "it\\(" *.test.ts` で実際のテスト数をカウントする
  2. Phase 4 の想定テスト数はあくまで「設計時の見積もり」であり、最終的な数値ではない
- **発見日**: 2026-02-12
- **関連タスク**: TASK-9B-I-SDK-FORMAL-INTEGRATION

### Phase 9/10/台帳のテスト件数ドリフト

- **状況**: Phase 6 で回帰テストを増やした後、Phase 9・Phase 10・台帳の一部だけを更新した
- **問題**: ドキュメント間で `7 files / 264 tests` と `8 files / 267 tests` が混在した
- **教訓**:
  1. テスト件数は「最新実行ログ」を単一ソースに固定する
  2. Phase 6/9/10 + `task-workflow.md` を同時更新してから検証を再実行する
  3. 数値反映後に `rg "264|7ファイル"` で旧値残存0件を確認する
- **発見日**: 2026-03-04
- **関連タスク**: TASK-FIX-SKILL-AUTH-PREFLIGHT-GUARD-001

### artifacts.json Phaseステータスの更新忘れ（UT-FIX-SKILL-IMPORT-INTERFACE-001）

- **状況**: 全Phase完了後に成果物を検証した
- **問題**: artifacts.json の全Phase statusが「pending」のまま残っていた
- **教訓**:
  1. 成果物生成後に必ず artifacts.json の当該 Phase status を `completed` に更新する
  2. Phase 完了時のチェックリストに「artifacts.json 更新」を明示的に含める
  3. 手動生成フローでは complete-phase.js が行う後処理（ステータス更新）を手動で補完する
- **発見日**: 2026-02-21
- **関連タスク**: UT-FIX-SKILL-IMPORT-INTERFACE-001

---

## エージェント実行関連

### 並列エージェント実行時のAPIレートリミット（TASK-9A-C）

- **状況**: Phase 1の4タスクを4つのSubAgentで同時実行した
- **問題**: 4エージェント中3つがAPI rate limitに到達し、エージェントが停止
- **教訓**:
  1. 並列エージェント数は**2-3が上限目安**（4以上はレートリミットリスクが高い）
  2. 重要度の高いタスクを先に実行し、残りを後続バッチで実行する
- **発見日**: 2026-02-19
- **関連タスク**: TASK-9A-C

### complete-phase.jsパス解決誤り（TASK-9A-C）

- **状況**: Phase完了処理で `node scripts/complete-phase.js` を実行した
- **問題**: モジュール未発見エラーが発生しスクリプトが実行できなかった
- **教訓**:
  1. スキルスクリプトは必ず `.agents/skills/{skill-name}/scripts/` パスで参照する
  2. `node scripts/xxx.js` ではなく `node .claude/skills/task-specification-creator/scripts/xxx.js` と完全パスで実行する
- **発見日**: 2026-02-19
- **関連タスク**: TASK-9A-C

### マルチエージェントPhase実行の依存順序違反

- **状況**: Phase 1-12を5エージェント（Phase 1-3, 4-7, 8-10, 11, 12）に分割して全て並列ディスパッチ
- **問題**: Phase 4-7エージェントがPhase 1-3エージェントより先に完了。要件定義前に実装が進行した
- **解決**: ゲートPhase（Phase 3, Phase 10）の前後で並列化区間を分離
- **推奨**: [1→2→3] → [4→5→6→7] → [8→9→10] → [11] → [12]
- **教訓**: 「並列実行できる部分」は依存関係チェーン内ではなく、チェーン間のTask並列化に限定する
- **発見日**: 2026-02-21
- **関連タスク**: UT-FIX-SKILL-REMOVE-INTERFACE-001

### worktree環境でも Phase 11 screenshot は実行可能

- **状況**: Git worktree 上で UI task の Phase 11 を再監査した
- **問題**: Electron 実アプリ起動前提で考えると「worktree では手動テスト不可」と誤認しやすい
- **解決**: Playwright + Vite harness で current worktree の build / route を直接起動し、main shell screenshot を取得した
- **教訓**: worktree を理由に Phase 11 を自動テスト代替へ落とし込まない。UI task は harness capture、docs-only task は walkthrough に切り分ける
- **発見日**: 2026-02-21
- **関連タスク**: UT-FIX-SKILL-REMOVE-INTERFACE-001

### docs-only タスクのプロバイダー依存機能ゲート（UT-02-D1-WAL-MODE）

- **状況**: docs-only タスクとして Cloudflare D1 の WAL モード設定（`PRAGMA journal_mode=WAL`）を仕様書化した
- **問題**: 提案実装がプロバイダー（Cloudflare D1）の特定動作（PRAGMA サポート）に依存していたが、公式サポートの確認ゲートを Phase 1/2 に設けなかったため、仕様書に未確認の前提が混入した
- **原因**: docs-only タスクは実装コードを書かないため「動作確認不要」と誤認しやすく、プロバイダー公式ドキュメントの照合を省略した
- **教訓**:
  1. docs-only タスクでも提案実装がプロバイダーの特定動作に依存する場合は、Phase 1（要件定義）または Phase 2（設計）に **official-support gate** を設ける
  2. 公式ドキュメントで当該機能がサポートされているか確認し、結果を仕様書に明記する
  3. サポートが未確認の場合は「official-support 未確認」として前提化せず、条件付き方針として記録する
  4. runtime mitigation（retry/backoff 等）への委譲を代替案として検討する
- **フィードバック元**: 「Docs-only tasks need an early official-support gate when the proposed implementation depends on provider behavior.」
- **発見日**: 2026-04-26
- **関連タスク**: UT-02-D1-WAL-MODE

### カバレッジ閾値のスコープ解釈あいまいさ

- **状況**: Phase 7でskillHandlers.ts全体のLine Coverage 45.14%が最低基準80%を下回った
- **問題**: バグ修正タスクではファイル全体のカバレッジではなく修正対象関数のカバレッジで判定すべきだが、仕様書上の基準が不明確
- **解決**: skill:remove固有の分岐カバレッジ（全5分岐カバー済み）を別途記録し、PASS判定
- **教訓**: Phase 7テンプレートに「修正対象関数のBranch Coverage 100%」を追加判定基準として明記
- **発見日**: 2026-02-21
- **関連タスク**: UT-FIX-SKILL-REMOVE-INTERFACE-001

---

## 順序事故防止パターン（前提タスク 3 重明記）

> 完了必須の上流タスク（A-2 等）が存在する場合、Phase 1 / Phase 2 / Phase 3 の 3 箇所で重複明記することで順序事故を抑止する。

- **状況**: 派生タスクが上流タスク（前提）の完了を必要とするが、Phase 1 だけに前提を書くと Phase 4 以降の実装着手者が前提存在に気付かない
- **パターン**: 前提タスク完了必須を以下 3 箇所で重複明記
  1. Phase 1 requirements の冒頭（「前提条件」セクション）
  2. Phase 2 design の実施前提条件（設計開始前に再確認）
  3. Phase 3 review の前提条件チェック（レビュアーが順序を確認）
- **効果**: 実装者・レビュアー双方が異なる文脈で順序制約を視認でき、前提漏れを防止
- **発見日**: 2026-04-28
- **関連タスク**: skill-ledger-a1-gitignore（A-2 fragment 化を A-1 の 3 箇所で前提明記）

---

## フェーズ境界遷移パターン（Phase Boundary Transition）

> タスクの12フェーズ実行において、フェーズ間の成果物・知見の引き継ぎが品質を左右する。

| パターン                                | 説明                                                   | 適用場面                                         |
| --------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Phase 3 → Phase 4 ゲート                | レビュー結果に基づくテスト設計方針の引き継ぎ           | 設計レビューで発見した懸念事項をテスト仕様に反映 |
| Phase 7 → Phase 8 カバレッジ→リファクタ | カバレッジ不足の原因分析を元にリファクタリング方針決定 | Function Coverage不足 → forwardRef導入           |
| Phase 10 → Phase 11 品質→手動テスト     | 品質チェック結果を手動テストシナリオに反映             | 自動テスト検証済み項目は手動テストからスキップ   |
| Phase 11 → Phase 12 テスト→ドキュメント | 手動テスト結果と品質メトリクスをドキュメントに統合     | テスト結果サマリーを実装ガイドに含める           |

- **発見日**: 2026-01-30
- **関連タスク**: TASK-7D

---

## 失敗回避パターン（クイックリファレンス）

> Phase実行中に繰り返し発生した失敗を未然に防ぐための回避策。

| パターン                 | 失敗例                                                                 | 回避策                                             |
| ------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------- |
| artifacts.json同期漏れ   | Phase完了後にartifacts.jsonが未更新                                    | 各Phase完了時に必ずartifacts.jsonを更新            |
| 未タスクファイル配置漏れ | Phase 12で検出した未タスクがdocs/30-workflows/unassigned-task/に未配置 | 検出と同時にファイル生成を実行                     |
| topic-map.md再生成忘れ   | システム仕様書更新後にインデックスが古いまま                           | spec更新後は必ずnode scripts/generate-index.js実行 |

- **発見日**: 2026-01-31
- **関連タスク**: TASK-7D

---

## TASK-UT-RT-01 executeAsync / IPC 関連 Pitfall（2026-04-06）

### Pitfall: executeAsync テストで executeMock を使う場合の注意

- **状況**: `skillExecutor.execute` をモックしても structured error パスの `error.message` が undefined になる
- **原因**: `execute()` 内でレスポンスが `SkillExecuteResult` 型に変換されるため
- **対策**: structured error パスのテストは `vi.spyOn(facade, 'execute')` を使い、`RuntimeSkillCreatorExecuteErrorResponse` 型を直接返すこと
- **影響**: Phase 4 のテスト設計時に考慮が必要
- **発見日**: 2026-04-06

### Pitfall: package-local lint script の不在

- **状況**: `apps/desktop/package.json` には `lint` script がない
- **原因**: モノレポ構成で lint は workspace ルートに集約されているため
- **対策**: workspace ルートの `pnpm lint` を使うか、対象ファイルを `eslint` で直接実行する（`pnpm --filter @repo/desktop lint` は実行不可）
- **影響**: 手動テスト手順を package 前提で書くと再現コマンドが失われる
- **発見日**: 2026-04-06

### Pitfall: vitest のファイル指定は直接実行が安定

- **状況**: `pnpm --filter @repo/desktop test -- --testPathPattern "..."` が期待より広い範囲のテストを走らせることがある
- **対策**: `pnpm --filter @repo/desktop exec vitest run <file>` のように対象ファイルを明示する
- **影響**: focused な回帰確認の再現性が上がる
- **発見日**: 2026-04-06

### Pitfall: preload の `safeOn` は tuple 化しないと多引数を落とす

- **状況**: callback 型を `(...rest: unknown[])` にしても TypeScript の型整合性と実行時の意図は一致しないことがある
- **対策**: multi-arg event は `safeOn<T, R extends unknown[]>()` のように tuple で受け渡しの形を固定する
- **影響**: errorMessage のような補助情報が silent drop されるのを防げる
- **発見日**: 2026-04-06

### Pitfall: Renderer での node-only import（browser bundle 破壊）

- **状況**: `node-cron` など Node.js 専用パッケージを renderer 側の UI コンポーネントで直接 import した
- **問題**: Vite ブラウザバンドルのビルド時は通過しても、ルートを開いた瞬間に runtime error が発生しアプリが初期化できなくなる
- **原因**: Node.js 組み込み API（`process`、`fs`、`module` 等）をブラウザ環境で解決できないため
- **対策**:
  1. renderer コンポーネントでは node-only パッケージを直接 import しない
  2. cron / schedule 検証は browser-safe な薄いユーティリティに切り出す（例: 5-field regex で validate するだけの関数）
  3. Phase 11 capture 前に「ブラウザで実際に route を開く smoke test」を必須にする
  4. `apps/desktop/vite.config.ts` の `ssr.noExternal` / `ssr.external` で不意のバンドルを早期検出する
- **影響**: Phase 11 の手動テスト冒頭でブランクスクリーンになり、screenshot 全件がブロックされる
- **発見日**: 2026-04-08
- **関連タスク**: UT-SKILL-WIZARD-W1-par-02b

---

## 苦戦箇所セクション標準テンプレ（T-6 / Issue #161 由来）

タスク仕様 `index.md` の末尾に「苦戦箇所」セクションを配置し、3〜5 件を箇条書きで記録する。各項目は以下 4 要素で構成する:

- **症状**: 観測された具体現象（再現条件込み）
- **影響**: blocking 範囲（gate 失敗、Phase 戻り、CI fail 等）
- **緩和策**: 暫定回避と恒久対策の差を区別
- **関連 AC**: 影響を受ける受け入れ基準 ID（AC-1, AC-2 ... を列挙）

### テンプレ

```md
## 苦戦箇所

1. **症状**: <現象>
   **影響**: <blocking 範囲>
   **緩和策**: <暫定 / 恒久>
   **関連 AC**: AC-X, AC-Y
```

- 配置: `index.md` 末尾（次タスクへの handoff 直前）
- 件数目安: 3〜5 件（多すぎると S/N が下がる）
- 出典: `docs/30-workflows/skill-ledger-t6-hook-idempotency/` workflow（Issue #161 / T-6）

---

## 並列 smoke における `wait` 個別集約パターン

複数 worktree を並列起動して smoke する際、`wait` を引数なしで使うと最後の終了コードしか取れない。pid を配列に積み、個別に `wait` して `rc` を集約する。

```bash
pids=()
for wt in "${WORKTREES[@]}"; do
  run_smoke "$wt" &
  pids+=("$!")
done

rc=0
for pid in "${pids[@]}"; do
  wait "$pid" || rc=$?
done

exit "$rc"
```

- 失敗 worktree の特定: `pid → worktree` の対応表をログに残す
- 出典: T-6 / Issue #161 workflow

---

## smoke 二段構え（小規模再現 → 本番再現）

並列 hook の冪等性検証は以下の 2 段で実施する。

| 段階 | 対象 | 目的 |
| --- | --- | --- |
| 小規模再現 | 2 worktree | ロジック起動・wait 集約の動作確認（短時間でフィードバック） |
| 本番再現 | 4 worktree | 実運用相当の競合密度で race condition / lock starvation を観測 |

- 小規模で fail する設計は本番で必ず fail するため、まず 2 worktree で固める
- 本番再現で初めて顕在化する事象（lock 取得タイムアウト等）は別 issue として記録
- 出典: T-6 / Issue #161 workflow

---

## Resumable Batch / Cron Budget チェック項目（U-UT01-09 由来 / 2026-04-30）

cron-driven / queue-driven / paginated batch（Forms sync / Sheets ingest / D1 backfill 等）の retry / offset / cursor / invocation budget を spec 段階で固定するためのチェックリスト。
相互参照: `.claude/skills/aiworkflow-requirements/references/lessons-learned-u-ut01-09-retry-offset-2026-04.md` の **L-UUT0109-003**（retry/offset canonical 実装契約）。

### Phase 2 設計時の必須チェック項目

| 項目 | 確認内容 | 既定値 / 例 |
| --- | --- | --- |
| **chunk size** | 1 invocation あたりの最大処理件数 | U-UT01-09: 200 行 / chunk |
| **cursor 列名** | 進捗永続化に使う DB 列名（処理済みオフセット） | `processed_offset`（U-UT01-09 では INTEGER NOT NULL DEFAULT 0） |
| **chunk index 単位** | offset の最小増分単位（行 / バッチ / page） | U-UT01-09: 行単位（chunk 終端で flush） |
| **invocation budget** | cron 1 ティックあたりの想定実行時間 / quota | Cloudflare Workers 30s CPU / 50 subrequests |
| **max retry** | 失敗時の最大リトライ回数 | U-UT01-09: 3（旧 5 から下方修正） |
| **backoff** | リトライ間隔 (linear / exponential / jitter) | U-UT01-09: exponential + jitter |
| **invalidation 条件** | cursor を巻き戻す / 無効化する条件 | source schema 変化、checksum mismatch、destructive migration |
| **stable high-water fallback** | 想定外停止時に巻き戻す安全な処理済み境界 | 直前 chunk 終端の processed_offset |

### NG パターン

- chunk / cursor / max retry を spec に書かず実装で決め打ち → 仕様変更追跡不能・combined budget 計算不能
- max retry を上限のみ書き backoff を書かない → cron 衝突 / quota 飽和 を招く
- invalidation 条件を「将来検討」で empty にする → 既存仕様を本番運用で上書き破壊する事故源
- `processed_offset` 列を migration に含めず実装 PR で初出 → spec_created と implementation の責務逆転

### OK パターン

- Phase 2 設計テーブル + Phase 12 main / system-spec-update-summary の双方に retry/offset 数値を併記
- combined budget = `chunk_size × max_retry × invocation interval` を spec に記録
- invalidation 条件を 3 系統（schema 変化 / checksum / destructive migration）で列挙
- 既存 sync / 別タスク（U-UT01-07 / UT-09 等）の現行値を上書きしない場合は「上書き禁止対象」を spec に明記

## Cloudflare Audit Logs / monitoring workflow

issue-408（Cloudflare Audit Logs monitoring）実装で得た知見。Cloudflare 系 audit / monitoring タスクを spec する際の必須前提。

- **CF Audit Logs API retention は 90 日固定**: 90 日超の保管はサポートされず、cold storage（R2 など）への定期 export が必須。長期保管要件があるタスクは spec 段階で「export → R2」を併記し、未対応の場合は followup task（FU）を起票して runtime 完了前に独立タスク化する経路を確保する。issue-408 では `FU-02-cold-storage` として記録。
- **`Audit Logs:Read` scope は Account-level 必須**: Zone-level token では取得不可。Token 発行ガイドや Phase 5 deployment checkpoint に「Account scope 指定」を明示しないと production runtime で 403 が頻発する落とし穴。
- **ml-anomaly 検出は最低 90 日 baseline が必要**: 7 日 baseline では分散が不足し ML 判定不可。FU-03 等で baseline 日数充足を待つ runtime gate を設けるのが既定運用。spec の「着手判断」に `baseline_days >= 90` を明記する。
- **D1 migration 番号衝突**: monitoring 系は新テーブル追加が多く、並列タスクと migration 番号が衝突しやすい。Phase 5 の「D1 migration 番号予約 SOP」に従い、PR description / artifacts.json に予約番号を宣言してから着手する（`phase-5-deployment-checkpoint-standard.md` 参照）。

## dev-sync merge conflict（lint scope / version table）の Phase 仕様反映

dev → feature の sync-merge で発生した conflict 解消ルール（aiworkflow-requirements の `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-016 / L-DEVSYNC-017）を、本 skill で生成するタスク仕様にも反映する。

- **L-DEVSYNC-016 (lint scope glob 収束)**: workflow YAML や lint 対象を `package.json` / CI YAML で explicit list 化する仕様を立てる際は、**Phase 12 implementation-guide に「glob 化されたら glob を採用」のガード**を含める。`actionlint`, `shellcheck`, `yamllint` 等の lint scope 拡張系で「特定 workflow を allowlist に追加」する仕様は将来の sync-merge で時限爆弾化するため、原則 `.github/workflows/*.yml` glob を推奨し、explicit list は permission / gate 差分がある場合のみとする。
- **L-DEVSYNC-017 (version table 両側 row 保持)**: `references/*-gha.md` / `deployment-secrets-management.md` 等の append-only version 表に行を追加する仕様は、Phase 12 で「同 wave の他タスクと version 番号が衝突した場合は dev-sync wave 側を minor bump して上に重ねる」運用ルールを明記する。`spec_created` の changelog 表生成 helper は `LAST_VERSION + 0.0.1` を返すように設計する。
- **L-DEVSYNC-030 (improvements 系 index / completed-tasks のステータス行 3-way conflict)**: `docs/30-workflows/<umbrella>/improvements/<sub>/index.md` および対応する `completed-tasks/<sub>-iNN-*.md` の **ステータス表行** で diff3 conflict が発生した際は、**行単位で両側採用**（HEAD が自スコープ task の完了を、dev が他スコープ task の完了を別行で更新するため）。`||||||| base` セクションは破棄。`completed-tasks/iNN-*.md` 内のメタ情報表は HEAD 側の実装完了情報を base に、dev 側のみが追加した key（`canonical_workflow` / `consumed_by`）を merge して統合する。Phase 12 の implementation-guide で improvements 系 spec の状態遷移を記述する際、**自 task の完了行のみ更新し、他 i 行には触れない**ことを明示し、merge 時の干渉を最小化する。

これら 3 件は本 skill の `evidence-sync-rules.md` / `patterns-phase12-sync.md` で扱う「Phase 12 strict 7 / sync gate」と整合する追加ガード。

- **L-DEVSYNC-043 (`pnpm sync:resolve` 中の worktree `index.lock` 失敗)**: sync-merge を伴う Phase（特に Phase 5 / Phase 12 の skill index 更新 + Phase 13 PR 前）で `pnpm sync:resolve` が `fatal: Unable to create '.../worktrees/<wt>/index.lock'` で失敗するケースを runbook 化する。**仕様書側の Phase 12 implementation-guide / Phase 13 PR pre-flight チェックリスト**に「`pnpm sync:resolve` 失敗時は `rm -f $(git rev-parse --git-dir)/index.lock` を試す」troubleshoot 行を含めること（worktree 環境では `.git` がファイルなので `.git/index.lock` 直接除去はできない）。詳細手順は aiworkflow-requirements skill L-DEVSYNC-043 を参照。
- **L-DEVSYNC-063 (並列WT での local dev 同期判定は `git rev-parse` ハッシュ比較を正本にする)**: 9 並列 worktree 運用では、別 WT のプロセスが同タイミングで fetch/同期を走らせると共有 `dev` ref が読み取り中に更新され、`git log -1 dev` 表示や `git rev-list --count` 初回値が **stale な behind/ahead** を返す。Phase 13 PR pre-flight / sync runbook で local dev 同期判定を記述する仕様には、「**`git rev-parse dev` == `git rev-parse origin/dev` の直接ハッシュ比較を一次ソースにし、`log`/`rev-list` 表示が矛盾したら rev-parse で再確認する**」ガードを含める。両ハッシュ一致なら dev 同期は no-op として skip し、`git rev-list --count origin/dev..dev` による独自コミット検出（中断条件）の誤発火を防ぐ。詳細は aiworkflow-requirements skill L-DEVSYNC-063 を参照。

## enum → route exhaustiveness guard pattern（issue-891）

issue-891（member detail kind exhaustiveness guard）実装で得た知見。zod enum / TypeScript discriminated union を UI 表示分類へ写像するタスク仕様で再利用する。

- **L-I891-001 (型強制パターン)**: allowlist `ReadonlySet<Enum>` を spec の正本にしない。`const ROUTE_MAP = {...} as const satisfies Record<EnumMember, Route>` を SSOT として spec の Phase 4 contracts に明記し、派生集合（`DETAIL_KINDS` 等）は `Object.keys(ROUTE_MAP).filter(k => ROUTE_MAP[k] === route)` で生成する仕様にする。enum 拡張時の silent-skip を `pnpm typecheck` と adapter spec（`Enum.options` parity test）の二段で検知できるよう Phase 6 テスト戦略に含める。
- **L-I891-002 (Route literal union)**: 「除外」と「別 region 表示」を boolean filter で表現する仕様は禁止。最初から `type Route = "primary" | "secondary" | "excluded"` 等の literal union で設計し、新 region 追加は (1) `Route` リテラル拡張 + (2) `ROUTE_MAP` 上書きの 2 点同 wave 修正で済む構造を Phase 2 architecture に書く。
- **L-I891-003 (`__testInternals` 慣行)**: pure adapter / pure function の内部 lookup table を spec から exhaustiveness 検証したいときは、`export const __testInternals = { ROUTE_MAP, DERIVED_SET_A, DERIVED_SET_B } as const` を adapter ファイル末尾 1 行で添える。consumer 側 public API（`toXxxProps` 等）には map 自体を露出しない。Phase 5 implementation-guide で「test-only export 識別子の命名規約」として明記し、`eslint-no-restricted-imports` の対象パターンに含める運用 hook を Phase 7 quality gate に記録する。
- **L-I891-004 (closed issue 再分類)**: GitHub 上 CLOSED の issue を spec 化する際、Phase 1 の最初に `git status` / `git diff` で実差分を確認し、実コード変更が乗る場合は `artifacts.json` の `status` / `workflow_state` / `implementation_status` を `implemented_local_evidence_captured` へ早期確定する。`spec_created` のまま実装に進むと Phase 11 evidence 表生成と `verify-phase12-compliance.js` の evidence 存在ゲートが衝突する。
- **L-I891-005 (unassigned task consumed trace)**: 後続 workflow が unassigned task を吸収したら 3 点同 wave: (1) 元 unassigned file 先頭に `> superseded by <workflow-id> at <date>` 追記、(2) `docs/30-workflows/unassigned-task/` から `docs/30-workflows/completed-tasks/unassigned-task/` へ `git mv`、(3) 吸収先 `artifacts.json metadata.supersedes` にパス記録。削除は永続的に避け、`git log --follow` で起票根拠まで辿れる経路を保つ。

## Playwright / Server Component topology

- **pitfall - Server Component fetch + `page.route()` 不整合**: Next.js SSR fetch は Node 側で起きるため Playwright の `page.route()` で intercept できない。in-process mockApi fixture（`INTERNAL_API_BASE_URL` 差し替え）または standalone mock server を使う。詳細 SSOT: [`server-component-e2e-pattern.md`](./server-component-e2e-pattern.md) / [`quality-gates.md` §SSR fetch](./quality-gates.md) / [`phase-11-screenshot-guide.md`](./phase-11-screenshot-guide.md)。
- **pitfall - Playwright `testDir` の topology**: 本リポジトリの Playwright `testDir` は `apps/web/playwright/tests/`（`apps/web/tests/e2e/` ではない）。Phase 6 spec 起草時は `cat apps/web/playwright.config.ts | grep testDir` を最初に実行して現行 path を確認すること。

## layer-specific helper の horizontal expansion（lib-elevation / Option B）

`apps/web/src/lib/<layer>/<helper>.ts` のような layer-specific helper を他 layer から再利用する spec を書く際は、以下 Option B を既定にする（issue-879 で実証、aiworkflow-requirements の `lessons-learned-issue-879-safe-server-fetch-horizontal-expansion-2026-05.md` L-ISSUE-879-001..005）。

- **Option A (NG)**: 既存 layer path をそのまま共用し、`codePrefix` 等を引数化する。既存 layer 側の spec 全てが破壊的に更新対象になる。
- **Option B (採用)**: 新 path（`apps/web/src/lib/<neutral>/<helper>.ts`）に common を新設し、既存 layer-specific path は **signature 維持の thin adapter (re-export)** に縮小する。既存 spec を一切 touch せず横展開できる。

Phase 仕様で記述する際の必須項目:

- **Phase 1 acceptance**: 既存 layer の error code 文字列（`ADMIN_FETCH_401` 等）が回帰しないことを AC として明記する。
- **Phase 2 design table**: `common` / `<layer>-adapter` の責務分離表を必ず置く。codePrefix / rethrowOn 等の injection 方針も列に立てる。
- **Phase 4 test plan**: 既存 layer spec が touch されない（spec file modification 数 0）ことを「regression guard」項目に書く。
- **Phase 5 implementation**: S-1=新設 common / S-2=adapter 化 / S-3=新 layer 利用、と step を分け commit 順序を「common → adapter → 新 layer」に固定する。
- **Phase 12 system-spec-update-summary**: 共通 helper の path と各 layer adapter path を明記し、CLAUDE.md の不変条件として「helper は共通 path のみ参照、layer-specific は re-export adapter 維持」を加筆候補に挙げる。

### page-fatal error の rethrowOn 設計（同 spec の必須節）

Next.js server component の `redirect()` / `notFound()` を SafeResult に閉じ込めると framework signal が抑止され UX が壊れるため、`safeServerFetch` 系 spec には必ず以下を含める。

- `rethrowOn: ReadonlyArray<new (...args: never[]) => Error>` option を持たせ、fatal class は pass-through。
- Next.js native の `isRedirectError` / `isNotFoundError` を併用する場合は import path を Phase 2 design に明記。
- Phase 4 test plan に「fatal は throw を expect / transient は SafeResultError shape を assert」の 2 系統を必ず置く。

### section degrade primitive の単一化

複数 page で「fetch 失敗時は該当 section だけ degrade」を導入する spec では、`role="alert" aria-live="polite"` 付きの SectionError primitive を 1つだけ作る方針を Phase 2 で固定する。tokens.css に従う class 名のみで配色し、design-token gate（HEX 直書き禁止）を維持する。

## layout / page 共有 UI primitive の責務分離（issue-894 由来汎化）

issue-894（admin topbar breadcrumb 二重描画解消）実装で得た知見を、UI primitive を layout / page で共有する後続タスク（admin actions slot / page-header 系 / public breadcrumb 等）の Phase 仕様に予め埋め込む。詳細は aiworkflow-requirements `lessons-learned-issue-894-admin-topbar-breadcrumb-integration-2026-05.md` L-I894-001..005 参照。

- **L-I894-001 (layout-owned vs page-owned 軸の Phase 3 必須化)**: layout と page が同一 RSC primitive（`Breadcrumb` / `PageHeader` / `StatusBadge` 等）を共有する spec では、Phase 3 component API に「layout-owned / page-owned」の責務軸表を必須セクションとして含める。両層に同じ宣言が出ると差分発生時に表記揺れが起き、後付けの grep gate で再発防止する必要が生じる。
- **L-I894-002 (UI 文字列重複の grep gate 化)**: 「管理」「ホーム」など layout 所有の root 文字列を page から除去する仕様は、Phase 7 quality-gates に `rg '"<root-string>"' apps/web/app/<segment>/**/page.tsx` の 0 hit gate を embed する。実装単発で終わらせると将来の page 追加で再混入する。`source_issue_state_verified` evidence と並列に Phase 11 / Phase 12 で grep gate 結果を保存する。
- **L-I894-003 (RSC 維持のため layout から static 値を slot prop で渡す)**: 「現在地表示」のためだけに `usePathname` で client 化するのは過剰。layout が静的部分を所有し、page が動的部分を server で導出して slot prop として渡せば全段 RSC 境界を維持できる。Phase 2 architecture で「client 化を選ぶ場合の理由（pathname dependency / interactive state）」を明示する選択肢を必須化する。
- **L-I894-004 (ARIA derived state contract の Phase 6 必須化)**: `aria-current="page"` 等の ARIA derived state を持つ primitive は、Phase 6 test-strategy で「href 有無 × 最終 item か否か」の 2 軸を spec で固定する。primitive 側 spec が contract を、consumer 側 spec が wiring を担当する責務分離を明示する。
- **L-I894-005 (CLOSED issue + コード未解決パターン)**: GitHub Issue の状態と実コード状態は乖離しうる。Phase 1 で `gh issue view <num> --json state,number,title` を実行して state を実測し、`CLOSED` で未解決なら reopen ではなく `artifacts.json.metadata.source_issue_relation = "Refs #<num>"` で追加 PR を出す経路を取る。`artifacts.json.metadata.source_issue_state_verified` に実測コマンドと実測日時を明示する。`github-issue-manager` skill の Phase 1 トリアージにも同テンプレートを embed する。


---

## Design-token exempt artifact (third-party brand asset) パターン（Issue #872 / FU-LOGIN-001 由来 / 2026-05-24）

外部ブランドの公式アセット（Google / Apple / Facebook 等）を取り込む際、`verify-design-tokens` (HEX 直書き禁止) と third-party brand color の「色は変えてはいけない」制約が衝突する。Issue #872（Google "G" OAuth button official 4-tone icon）で確立した責務分離パターンを spec に反映する。

### 必須前提

- **HEX 直書き exempt は「特定 directory 配下の `.svg` ファイル名」だけに限定する**。`.tsx` wrapper / nested SVG / `.ts` color 定数 / `.css` 変数 を exempt 対象にしてはいけない。理由: brand 色は SVG の `<path fill="...">` 属性に閉じ込めるべきで、wrapper や CSS に漏らすと「いつのまにか OKLch token 違反箇所が増殖」する逆流リスクがある。
- **exempt scope は正規表現で path/ファイル種別の両方を絞る**。例: `/\/components\/ui\/brand-icons\/[^/]+\.svg$/`。`/brand-icons/` だけで絞ると `.tsx` まで巻き込み事故になる。
- **exempt 境界の単体テストを spec の Phase 6 / 11 に必ず含める**。`scripts/verify-design-tokens.spec.ts` に「`brand-icons/google.svg` は pass」「`brand-icons/Foo.tsx` の HEX 直書きは fail」「`brand-icons/_legacy/inner/foo.svg` も pass しない（一階層 only）」の 3 ケース最低限。
- **wrapper コンポーネントは aria-hidden を固定**し、テキストラベルでアクセシブル名を担保する。SVG path の色は brand 公式値のまま、装飾は OKLch token surface 側で行う責務分離。

### L-BRAND-001 (asset wrapper exempt boundary)

- **NG**: `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` 内に `fill="#4285F4"` を直書きし、verify-design-tokens の exempt list に「`brand-icons` dir 全部」と書く。
- **OK**: `google.svg` に 4 path の HEX を閉じ込め、`GoogleBrandIcon.tsx` は `<img src="/brand-icons/google.svg" />` または静的 import で SVG を render するだけ。exempt は `*.svg` ファイル名にのみ適用。
- **Why**: wrapper を exempt すると将来「ついでに色も足す」運用劣化が必ず起きる。境界を「ファイル種別 + ファイル名 pattern」で物理的に固定するのが SSOT。

### L-BRAND-002 (verify-design-tokens regex 単体テスト先行)

- **NG**: exempt 追加 PR で `verify-design-tokens.ts` の regex を変更しただけで「動いた」とする。
- **OK**: 同 PR 内で `verify-design-tokens.spec.ts` に positive / negative 両ケース（`.svg` pass / `.tsx` fail / dir 外 fail）を追加し、CI gate 化する。
- **Why**: exempt 境界は意図せず広がりやすい (`.tsx` まで巻き込む regex は実例として一度書かれた)。spec 段階で「exempt regex の変更は spec 必須」と書き、Phase 6 acceptance に regex unit test を含める。

### Phase 12 への反映項目

- **system-spec-update-summary.md**: `09b-design-tokens.md` の「HEX exempt 境界」セクション更新を必ず Step として含める。文言例: 「brand asset exempt は `apps/web/src/components/ui/brand-icons/*.svg` のみ。`.tsx` wrapper の HEX 直書きは引き続き fail」。
- **implementation-guide.md**: 「中学生向け説明」で「ブランドの色は変えられないので決まった場所にしまっておく」「決まった場所以外で色を直接書いたら警告が出る」の二段で必ず説明。
- **unassigned-task-detection.md**: 別 OAuth provider (GitHub / Apple / X 等) の brand-icon 追加は、本パターンが拡張テンプレートとして使い回せることが Phase 12 で確認されたなら FU として起票してよい。ただし「採用判断待ち (auth strategy 議論)」を明確な前提条件として記載し、即着手可能タスクと混同しない（Issue #872 では `pending (OAuth provider 採用判断待ち)` で起票）。

### Anti-pattern

- exempt path を「pattern template として汎用化したいから」と理由なく広げる（例: `apps/web/src/components/**/*.svg`）。**brand-icon 専用 dir に物理的に閉じ込める**こと。CONST_007 (unassigned-task は実装過程で実際に発見されたもののみ) に準拠し、speculative な exempt 拡張は避ける。

---

## CSP directive 撤去パターン（issue-924 L-I924-001..005 汎化）

CSP の `style-src-attr` や `script-src-attr` 等 *-attr 系 directive を撤去するとき、または `'unsafe-inline'` を CSP から外すときに繰り返し当たる落とし穴。コード置換と invariant gate を同一サイクルで整える指針。

### L-I924-001 (invariant grep gate は最小トリガを取る)

- **NG**: `style={{` 限定の grep で「inline style ゼロ」を主張する。prop-forward `style={style}` と条件式 `style={cond ? styleA : undefined}` が漏れる。
- **OK**: grep は **`style={` 最低粒度**で検索。除外は CSP 対象外 route の path allowlist で明示。
- **Why**: CSP `style-src-attr` は inline style の **生成経路を問わず** block する。prop か条件か直書きかを区別しない。gate もそれに合わせる。
- **適用 phase**: Phase 4 test-plan で invariant gate の pattern を確定、Phase 5 implementation-plan で除外 path 表を固定。

### L-I924-002 (VISUAL タスクは static-sanity と full-regression を分離)

- **NG**: 19 route の visual baseline が取れなかったため `workflow_state` を fail / pending に倒し、ローカル static evidence まで保留扱いにする。
- **OK**: `outputs/phase-11/screenshots/*-static-sanity.png` 1 枚で **CSS / DOM の local sanity** を closing。`workflow_state = local_static_pass_browser_pending` を採り、full route visual regression は常に user-gated（PASS 表記しない）。
- **Why**: worktree dev server の初回コンパイル遅延等で full regression が取れないケースは構造的に発生する。local sanity と full regression は別 evidence boundary。

### L-I924-003 (`ImageResponse` 等 CSP 非対象 route は path allowlist 除外)

- **NG**: grep の pattern 側で `next/og` import を見て自動除外しようとする。import 形だけで除外可否は決まらず誤検出する。
- **OK**: `apps/web/app/og/**` 等 path allowlist で **明示列挙**。Phase 5 で「除外ファイル」を表化、Phase 11 evidence で「除外確認」と「対象スキャン PASS」を別行で記録。
- **Why**: 除外境界は **物理 path** で固定する（L-BRAND-001 と同じ責務分離パターン）。

### L-I924-004 (置換は A 静的 / B 動的離散 / C 連続値 に分類してから着手)

- **NG**: 全 inline style を「とりあえず className 化」する。`width: ${percent}%` の連続値や bucket 色制約付き動的値で詰まる。
- **OK**: Phase 5 で置換を 3 区分に表化し作業順序を **A → C → B** に固定（B は token 整備が前提のため最後）:
  - 区分 A: 静的 → Tailwind utility / CSS module class
  - 区分 B: 動的・離散有限 → `data-bucket="N"` 等の属性 + CSS rule（`tokens.css` OKLch に集約）
  - 区分 C: 動的・連続値 → SVG `<rect width="...">` に置換し HTML inline style から逃がす
- **Why**: 区分判定なしで進めると「ほぼ完了したが連続値だけ残った」状態で行き詰まり、CONST_007 を口実に B/C を unassigned 切り出ししたくなる。先に分類すれば 1 サイクルで closing できる。

### L-I924-005 (CSP directive 削除と spec assertion 更新を 1 commit に束ねる)

- **NG**: `security-headers.ts` の directive 削除と Vitest / Playwright spec の assertion 更新を別 PR に分ける。
- **OK**: `security-headers.ts` / focused spec / Playwright smoke spec / middleware spec の修正を **1 commit に同梱**。Phase 4 test-plan で「assertion 更新対象」を表化し、Phase 5 で修正順を「directive 削除 → spec 更新 → grep gate 強化 → 置換実装」に固定。
- **Why**: header 値は spec が同じ directive を見ているため、削除側だけ先に merge すると CI が割れる。directive と test は 1 単位。

### Anti-pattern（CSP directive 撤去）

- 「invariant gate を後で追加すれば良い」と Phase 5 で gate 配線を Phase 11 に先送りする。Phase 5 でコード置換を始めると **grep gate なしでの「目視確認」期間** ができ、レビューサイクルで residual がほぼ確実に出る。invariant gate は **コード置換と同 wave** で `pnpm lint` / lefthook に配線するのが正解。

---

---

## DELETE-race UI wiring pattern (Issue #911 / 2026-05-25)

既存 endpoint が「削除済み / 解除済み」を 404 で返す UI caller では、API surface を増やす前に既存 mutation policy で race を success-equivalent に倒せるか確認する。

- **L-I911-001**: `treat404AsSuccess` は解除・削除系 caller のみに付与し、追加・登録系 caller へ流用しない。
- **L-I911-002**: 同じ endpoint でも register/unregister の 404 意味が異なる場合は mutation instance を 2 本に分ける。
- **L-I911-003**: component spec は toast だけでなく payload、DOM state、CTA 消滅/出現を assert する。
- **L-I911-004**: 親 workflow に「caller 未移行」などの stale note がある場合、実装 wave で正本 index も補正する。
- **L-I911-005**: Phase 12 optional summary (`phase-12.md`) と strict 7 inventory を混同しない。

---

## parallel adapter signature extension（dev sync-merge / 2026-05-26）

dev sync-merge で同一の pure adapter / pure function 関数が **HEAD 側と dev 側で独立に signature 拡張**された場合の統合パターン。spec を起草する段階で、adapter signature の進化方針をこの形式に揃えておくと merge 衝突時の解消コストが激減する（aiworkflow-requirements の `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-043）。

- **L-DEVSYNC-043 (signature union 化)**: 同じ関数（`normalizeField(field, ...)` 等）に対し、HEAD = routing 用引数追加（`routeKinds: ReadonlySet<Kind>`）、dev = observability callback 追加（`onUnknownKind?: (field) => void`）のように **orthogonal な拡張**が並列で入ったら、片側 take せず引数列を **必須 → routing → observability → options の順で union** する。spec の Phase 4 contracts に「adapter signature 拡張は this order で並べる」と明示しておく。
- **Phase 2 architecture への反映**: pure adapter を「将来複数 issue から拡張される SSOT」と位置づけ、最初から `interface ToXxxOptions { onXxx?: (...) => void }` を options bag 化して関数末尾に置く。routing 用引数は別 issue が同位置に挿入してくる可能性があるため、`routeKinds` / `route` のような分類引数を**第 2 引数固定**で書く。
- **Phase 4 test plan**: adapter spec の `import { ... }` 行は merge 時に高頻度で conflict する。export 群（`__testInternals` / 公開 schema / 公開関数）を**1 import 行に並べた union**で書く規約を spec に明記し、HEAD/dev 双方が新 export を追加しても 1 行 union で機械的に解消可能な状態を維持する。
- **Phase 6 quality gate**: 統合 commit 後の最初のゲートは `pnpm typecheck`。`satisfies Record<EnumMember, Route>` のような exhaustiveness 強制と callback callback の signature 統合は型レベルで矛盾検出できるため、typecheck → lint → unit spec の順を Phase 6 順序として固定する。
- **Phase 12 sync gate への反映**: `pnpm sync:resolve` の `UNION_MERGE_TARGETS` には **adapter ソース (`apps/web/src/lib/adapters/*.ts`) を意図的に含めない**。コード union は意味壊しのリスクがあるため、本パターンは「手動 union ルール」として spec template / Phase 12 implementation-guide に組み込む。resolver 自動化は doc / index 系のみに留める。

### Anti-pattern

- 片側 take（HEAD のみ採用して dev 側の callback を捨てる、または逆）→ 失われた振る舞いが test green でも実機で silent regression。
- 引数名衝突の自動 union（同じ位置に意味が違う引数を両方差し込む）→ 呼び出し側 type-check fail。意味衝突は最終レポートに記録し人間判断。
- `UNION_MERGE_TARGETS` への adapter ソース追加 → コード union による意味壊しが将来再現するため禁止。
## route group migration × dev primitive swap の二重 conflict（dev sync-merge / 2026-05-26）

dev sync-merge で **HEAD = route group rename（`app/<route>/` → `app/(group)/<route>/`）** と **dev = 同一ファイルでの UI primitive swap（native `<input>` → `<Input>` 等）** が並列発生した際の統合パターン。仕様起草時に import 規約を `@/*` alias 起点に固定しておくと merge 衝突時の正規化コストが消える（aiworkflow-requirements の `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-045）。

- **L-DEVSYNC-045 (route group + primitive swap の二重発生)**: `app/(member)/` / `app/(public)/` / `app/(admin)/` 等の route group migration を含む Phase は、Phase 12 implementation-guide で **import を必ず `@/*` path alias で書く**ことを明示し、relative path (`../../../src/...`) を spec / 実装の両方で禁止する。route group は file system 上は実在セグメントのため、relative depth が `(group)` 1 段分ずれて build break する。
- **正規化ルール**: HEAD 側 alias 形式（`@/lib/api/me-requests.types`, `@/components/ui`）を採用し、dev 側 relative 追記を **alias に正規化して 1 行に統合**。conflict marker の trailing `:path` suffix（`<<<<<<< HEAD:apps/web/app/(member)/...` / `>>>>>>> dev:apps/web/app/...`）が rename 同時発生のシグナル。
- **Phase 12 ガード**: route group migration を伴う仕様には pre-flight として `grep -rn "from \"\.\./" apps/web/app/(member)/` 等の relative-import 検出 gate を含め、merge 後の typecheck 前段で alias 化を強制する。

### Anti-pattern

- 片側 take（HEAD path だけ採用して dev の UI primitive swap を捨てる、または逆で route group 外しに戻す）→ 仕様退行。
- relative path を残したまま route group 配下に移す → file system depth ずれで import 解決失敗、CI typecheck で初めて発覚。
- `UNION_MERGE_TARGETS` への `apps/web/app/**/_components/*.tsx` 追加 → JSX 構造の機械 union は意味壊し、禁止。

## Playwright spec / setup の ESM `__dirname` 対応（2026-05-26）

`apps/web/playwright/playwright.config.ts` が ESM 化されていると、その下の spec / setup / teardown ファイルでも CommonJS の `__dirname` は**未定義**になり実行時 `ReferenceError: __dirname is not defined in ES module scope` で全 test が即 fail する（CI: `authenticated-visual` ジョブで再発確認、Issue #901 PR #946）。lint / typecheck では検出されない（型定義上は globalThis 扱い）ため CI まで気付かない。

- **L-PWESM-001 (`__dirname` 復元パターン)**: Playwright の spec / setup / teardown で `__dirname` を参照する場合は必ず以下 3 行を冒頭に追加する。
  ```ts
  import path from "node:path";
  import { fileURLToPath } from "node:url";
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  ```
  既存実装の正本: `apps/web/playwright/tests/profile-readonly.spec.ts:1-6`。
- **L-PWESM-002 (storageState 参照)**: `test.use({ storageState: join(__dirname, "..", ".auth", "*.json") })` 形式は authenticated visual / e2e で頻出。spec 追加時は spec template に上記 3 行を含めるか、`playwright/fixtures/auth-paths.ts` のような共通モジュールに集約して spec 側から `__dirname` 直参照を排除する。
- **L-PWESM-003 (Phase 4 test plan)**: 新規 Playwright spec を仕様書に書く Phase 4 では「ESM `__dirname` 復元 import 3 行 OR 共通 fixture 経由」を acceptance に含める。typecheck / lint では落ちないため Phase 6 で `pnpm exec playwright test --list` を local で 1 回走らせてエラーが出ないことを確認する gate を含める。
- **L-PWESM-004 (cookie/token leak guard との依存)**: `__dirname` 解決失敗で setup が落ちると teardown も実行されず、`apps/web/playwright/.auth` が残留して後続の `Cookie/token leak guard` step も連鎖 fail する。一見独立した 2 つの fail を見たら、まず setup の ESM エラーを疑う。

### Anti-pattern

- spec / setup を CommonJS 前提のテンプレ（`__dirname` 直書き）で量産する → Playwright config 側を ESM 化したタイミングで全 authenticated spec が同時 fail。
- `import.meta.dirname`（Node 20.11+）への置換 → Playwright が ts-node / esbuild loader 経由で実行する場合に `import.meta.dirname` が undefined になる環境がある（CI ubuntu 上で再現確認）。`fileURLToPath` 経由が最も移植性が高い。

## 環境 secrets 必須 workflow の PR 非ブロック化（2026-05-26）

`staging-*` / `production-*` 系の baseline / smoke workflow は GitHub Environment secrets を必要とし、secrets 投入は **user-gated**（CLAUDE.md / memory `feedback_no_doc_for_secrets.md`）。pull_request event で secrets 未投入のまま起動すると、毎 PR が secrets validation エラーで blocked になり、AI からの自動修復が一切不能になる構造的問題。

- **L-ENVSEC-001 (secrets gate step パターン)**: workflow の最初に `secrets-gate` step を置き、`env:` 経由で secrets を読み取って欠落チェックする。欠落時:
  - `github.event_name == 'workflow_dispatch'` → `exit 1`（user が手動 trigger した場合は厳格 fail）
  - それ以外（`pull_request` 等）→ `echo "skip=true" >> "$GITHUB_OUTPUT"` で success-skip
- **L-ENVSEC-002 (後続 step の guard)**: 各 step に `if: steps.secrets-gate.outputs.skip != 'true'` を付ける。`if: always()` 系も `&& steps.secrets-gate.outputs.skip != 'true'` で AND 結合する。
- **L-ENVSEC-003 (Phase 4 test plan)**: secrets 必須 workflow を新規作成する spec では、Phase 4 contracts に「pull_request event での secrets 未投入時の graceful skip」を必ず含める。後付けで PR を unblock する作業（本 lesson が示すような追従 PR）を発生させない。
- **L-ENVSEC-004 (required status check の整合性)**: branch protection の required status check に当該 workflow を含める場合は、graceful skip success が「実 baseline 撮影 = skip」を意味することを understand。実 baseline 検証は workflow_dispatch / dev push 後の secret 投入完了状態で別途実施する設計を spec に明記する。

### Anti-pattern

- secrets を `vars` に降格させる「妥協」→ secrets 漏洩リスクが上がる。
- workflow から `pull_request` trigger を外す→ workflow file 自体の variation や spec 変更を CI で検知できなくなる。secrets-gate skip で trigger 自体は保持する。
- `continue-on-error: true` で誤魔化す → 真の secrets 欠落と spec バグの双方が無視される。skip 判定を明示的に行う。

## Page-head 統一タスクの panel h1 / page-local `<main>` 二重所有解消（2026-05-26）

admin segment / public segment 等で共通 PageHeader primitive を導入するタスクでは、既存 panel が legacy で `<h1>` を保持しているケースが多く、page-head と二重に h1 が出力され a11y / SEO 双方を壊す。`docs/30-workflows/completed-tasks/admin-ui-task-c-pageheader-token-conformance/` のサイクルで再発確認。

- **L-PGHEAD-001 (二重 h1 検出 gate)**: Phase 4 test plan に「page route で h1 が 1 件のみ」を broad gate として含める。`render(<Page />)` 後 `screen.getAllByRole("heading", { level: 1 })` の length === 1 を全 page で assert する spec を 1 ファイル（例: `admin-page-header-adoption.spec.ts`）に集約し、新 page 追加時は spec の enumeration を更新せず glob で自動拡張する。
- **L-PGHEAD-002 (後方互換 prop で chrome 抑止)**: panel 側の h1 / chrome を物理削除すると、page-head 未採用の caller を壊す。`showHeading?: boolean` / `showChrome?: boolean`（default `true`）で抑止 prop を追加する。Phase 5 spec に「default true で既存 caller 不変」を明示する。
- **L-PGHEAD-003 (id 譲渡契約)**: panel が `aria-labelledby="xxx-h"` で自分の h1 を参照している場合、`PageHeader` に `headingId?: string` props を追加して外部から id 注入を可能にする。`showHeading={false}` の panel は `aria-labelledby` から `aria-label` に切替えて a11y を保つ。Phase 4 contracts にこの 2 系切替を明記。
- **L-PGHEAD-004 (page-local `<main>` 撤去)**: layout が `<main>` を所有する segment で、page.tsx 側に独自 `<main>` が残っているケースを `grep -rn "<main" apps/web/app/<segment>` で全 page enumerate して 0 件を Phase 9 gate にする。Tailwind palette literals (`text-zinc-*` / `text-blue-*` / `bg-zinc-*` 等) も同 gate で `(bg|text|border|divide)-(zinc|blue|red|green|yellow)-` を grep し token 経由 (`var(--ubm-color-*)`) のみ許可。
- **L-PGHEAD-005 (token と spec の同一 wave 同期)**: page-head が新規に使う token（例: `--ubm-color-link-default` / `--ubm-eyebrow-tracking`）を `tokens.css` に追加する場合、`docs/00-getting-started-manual/specs/09b-design-tokens.md` への反映を同一 commit に含める。Phase 12 `system-spec-update-summary.md` に新規 token を列挙する。`verify-design-tokens` は token 名の存在しか見ないため、spec 同期漏れは静かに通る。

### Anti-pattern

- panel h1 を物理削除して page-head に移すだけの「短絡修正」→ page-head 未採用の caller が h1 ロストで a11y 退行。後方互換 prop 経由が正解。
- page-local `<main>` を `<div>` に置換するだけ→ semantic role が失われる。layout の `<main>` 所有を明示し、page は `<section>` で返す。
- token を `tokens.css` だけに追加し spec を後追い→ 命名衝突 / 重複定義の温床。同一 commit で SSOT に追記する。

## Admin shell topbar → page-local owner 移管（2026-05-26）

`admin-shell-topbar-sidebar-integration` の実装サイクルで得た、shell chrome を page-local primitive へ移管する際の汎用パターン。詳細は `aiworkflow-requirements/lessons-learned/lessons-learned-admin-shell-topbar-sidebar-integration-2026-05.md`。

- **L-PGHEAD-006 (shell chrome 撤去契約)**: shell 側の chrome（topbar / breadcrumb / actions slot）を page-local primitive に移管する task では、「空 element も残さない」ことを契約として spec / phase-2-design / phase-12-compliance に明記する。空 element は a11y tree と visual rhythm の両方に残り、page-local primitive と二重 chrome を生む。AC は grep + DOM assertion の両方で固定する。
- **L-SRVCLNT-001 (Server layout × Client interactive 境界)**: auth gating を持つ layout は Server Component で維持し、`usePathname` / `useTransition` 等の hook 依存部分のみを最小単位の Client component に分離する。「sidebar = 1 file = client」のような素直な構造は Server-only auth と衝突する。data resolution は layout (Server) で行い props 注入する。
- **L-PUREFN-001 (active 判定純関数 + 境界 spec)**: pathname prefix-match は `/` と segment root（`/admin`）で必ず誤動作する。判定ロジックを純関数 (`isActive.ts`) として抽出し、`__tests__/isActive.spec.ts` で `/`, `/admin`, `/admin/`, `/admin/<child>`, `/admin/<child>/<id>` の 5 境界を assert する。consumer 側 spec と primitive spec を責務分離し、回帰を pure-function spec で検出する。
- **L-DERIVE-001 (badge / count は既存 endpoint derive)**: UI primitive のために `/admin/<resource>/count` のような専用 endpoint を生やしたくなった時は、既存 endpoint の response から derive できないか先に検討する。UI prototype alignment の「既存 API endpoint surface のみ利用」不変条件と整合する。fetch fail 時は空 fallback で badge=0 に安全に消す。
- **L-VOE-001 (VISUAL_ON_EXECUTION × 既存実装の昇格)**: dirty diff に `apps/web/**` を含む状態で `visualEvidence=VISUAL_ON_EXECUTION` の task を `spec_created / Phase 11 pending` のまま凍結する誘惑が強いが、verifier は workflow_state と差分の矛盾を検出する。同一 cycle で `workflow_state=implemented_local_evidence_captured` に promote し、`PLAYWRIGHT_*_FIXTURE=1` の env-gated fixture を server-fetch 境界に立て、mock API port 起動順に依存しない deterministic Phase 11 screenshot を確定する。staging baseline / commit / PR は引き続き user-gated。

### Anti-pattern

- topbar 撤去で空 `<header>` を残す → page-local primitive と二重 header になり a11y / rhythm を壊す。
- layout 全体を `'use client'` 化して auth + active 判定を 1 ファイルで済ませる → Server-only API（`getSession` / `cookies()`）と Client hook が同居して build fail、auth boundary も client に漏れる。
- active 判定を consumer 側 spec だけで担保する → primitive を後から差し替えた瞬間に prefix-match 誤動作が回帰し、原因切り分けが consumer 群を全部見る O(N) になる。

## API method/path 切替時の Playwright mock fixture 追従（2026-05-26）
## prototype 整合タスクの汎化パターン（2026-05-26 / public-dashboard-prototype-alignment）

### P-PROTO-ALIGN-001 — prototype 整合 task 不変条件 3 点セット

prototype HTML / CSS を実コードへ落とし込む task では、以下 3 点を仕様書 Phase 2-5 で必ず明文化する。

1. **variant の後方互換維持**: 既存 variant prop は破壊変更せず、新 variant 値を union 型に追加する形でのみ表現を増やす（呼び出し元の opt-in 切替）。`satisfies Record<Variant, ...>` で exhaustiveness を compile error 化する。
2. **section header は常時 render**: 空状態でも section の `<h2>` / CTA / aria-labelledby 構造を保ち、list 領域だけ `EmptyState` に差し替える。section ごと unmount しない。
3. **prototype 固定値の出所コメント**: `ZONE_COUNT` / `MEETINGS_PER_YEAR` 等の magic number は module top-level `const` に固定し、`// from <prototype path> L:NN` の出所コメントを必須化する。

### P-E2E-EMPTY-TOGGLE-001 — e2e empty-state は test-only toggle endpoint で扱う

空状態の e2e 検証は production code に `?empty=1` / cookie / build flag を散らさず、`app/__test__/<scope>/empty/route.ts` のような test-only route で in-memory state を flip する設計に統一する。

- **新規 toggle state を足したら必ず `/__test__/reset` に reset 処理を同期追加する**（追加忘れが flaky 化の典型原因）。
- standalone (Next dev) と inline (workers) の 2 経路がある場合、両方の reset 経路を仕様書で点検対象として明示する。
- Playwright 側は `request.post('/__test__/<scope>/empty')` で setup する pattern を Phase 6 test 追加 spec に書く。

## branch-sync 中の mid-flight half-state リカバリ（2026-05-27）

`dev → feature` sync-merge 実行中に「`error: Unable to write index` で merge コマンド自体は exit 1、しかし `git status` は `All conflicts fixed but you are still merging` を返す」half-state を踏んだ事例。ディスク残量逼迫（99% 使用、4.5GiB 空き）と古い `index.lock`（0byte）の合わせ技で発生。AI が `git merge --abort` で巻き戻すと merge 結果ごと破棄してしまうため、状態判定を誤ると正しく解消した自動 merge を失う。

- **L-BRSYNC-001 (half-state 判定)**: `git merge` が非0 exit でも、続けて `git status` を読むこと。`All conflicts fixed but you are still merging` / `git diff --name-only --diff-filter=U` が空 / `git ls-files -u` が空 → merge は実質完了済みで `git commit --no-edit` だけで成立する。`merge --abort` を反射的に打たない。
- **L-BRSYNC-002 (stale index.lock)**: `Unable to create '...index.lock': File exists` を見たら、まず `ls -la <gitdir>/index.lock` でサイズと mtime を確認。0byte で 5分以上経過 / 該当 git 子プロセスが存在しないなら stale 確定。`unlink` 系は `.git` 配下で permission policy が効くため、ユーザ手動 `rm -f` をエスカレーション経路として spec に用意しておく。
- **L-BRSYNC-003 (容量 pre-flight)**: branch-sync spec の Phase 0 に `df -h "$(pwd)"` を含め、空き <5GiB の閾値で警告 / <2GiB で中断ゲートを置く。空きが少ないと `Unable to write index` で merge / commit が mid-flight に倒れ、復旧コストが跳ね上がる。
- **L-BRSYNC-004 (gitdir 解決)**: worktree では `.git` がファイルなため `mkdir -p .git/...` は失敗する。ログ / lock パス組み立ては必ず `git rev-parse --git-dir` の結果を base にする。
- **L-BRSYNC-005 (Red List との両立)**: `index.lock` の削除は通常の `rm` で settings 上 permission prompt になり得る。完全自律実行モードであっても、`.git` 配下の破壊系操作はユーザ手動経路を最終手段として残し、AI 側は detection と提示までに留める設計が安全。

### Anti-pattern

- `git merge` が exit 1 を返した瞬間に `git merge --abort` を打つ → 既に解消済みの auto-merge 結果を破棄。
- ディスク容量を確認せず merge / commit を反復 → 同じ `Unable to write index` を繰り返し、index.lock が増殖。
- `.git` 配下を含む全 `rm -f` を AI 側で強行 → permission policy / 監査要件に抵触。stale lock 検出時はユーザに 1 行コマンドを提示し承認経由で実行する。
- mock fixture の末尾に `response(res, 404, ...)` fallback を残したまま新 endpoint handler 追加を後続 PR に分割 → fallback が新 request を吸収し、UI 側の idempotent 404 分岐に silent fall-through → toast assertion が新 PR で fail。
- mock を always 200 success にする → UI の "既に削除済" toast 分岐が一切踏まれず、本番で初めて該当分岐の regression が出る。
- handler を mock に追加する代わりに `test.skip` / `test.fixme` で逃がす → playwright が API shape の正本検証 gate なのに gate が空洞化する。
- `apps/web/playwright/fixtures/auth.ts` のみ追従し `scripts/e2e-mock-api.mjs` を忘れる → `playwright-smoke` は green になるが `e2e-tests-coverage-gate` (3 shard) が同症状で fail し続け、原因切り分けで時間を浪費する。

## Server Components render error の parity 適用パターン（2026-05-27）

admin 側で既に実装済みの `safeServerFetch` ラップ + env accessor 経路是正パターンを、profile 側 (`apps/web/app/(member)/profile/page.tsx`) へ parity 適用する際に得られた一般化可能な lessons（`profile-server-components-render-error` workflow / `fix-admin-server-components-render-error-stg` の系列タスク）。

- **L-PROFSCR-001 (parity-by-admin-template)**: Server Component の `try/catch + throw err;` パターンは SCR digest を誘発する。admin 側に既存実装がある場合、`safeServerFetch(fn, { codePrefix, rethrowOn: [AuthRequiredError] })` を **template-by-parity** として転用し、`AuthRequiredError` のみ rethrow / それ以外は SectionError UI 降格に固定する。route group 全体への横展開は別 followup タスクへ分離（possible-lessons-learned で済ませる）。
- **L-PROFSCR-002 (partial env accessor 追加)**: full-schema `getEnv()` だけでは `INTERNAL_API_BASE_URL` / `PUBLIC_API_BASE_URL` の片方欠落時に PUBLIC fallback まで到達できない。Phase 4 contracts に **責務分割した部分 accessor**（例: `getApiBaseEnv()`）の追加を明記し、INTERNAL → PUBLIC → fail-fast の優先順位を accessor 内に閉じ込める。route 側で env 解決ロジックを直書きしない。
- **L-PROFSCR-003 (localhost fallback 撤去 + grep gate)**: Cloudflare Workers の Server Component から `http://127.0.0.1:<port>` などの loopback fallback は到達不能。**完全撤去**した上で、focused spec 内に `process.env[` / `127.0.0.1` リテラル 0 件の **静的 grep gate** を置く（spec 自身が contract gate になる）。Phase 6 acceptance grep にも同一パターンを含める。
- **L-PROFSCR-004 (focused regression spec 三点セット)**: env accessor 経路是正タスクの Phase 4 contracts には「accessor spec（partial parse 契約） + fetch helper spec（INTERNAL→PUBLIC→throw + source guard） + page spec（5xx は SectionError / 401 は redirect）」の **focused vitest 3 spec** を固定する。broader lint / build / staging runtime smoke は Phase 13 user-gated に残し、Phase 12 内で混同しない。
- **L-PROFSCR-005 (parity タスクの owning skill 同期)**: parity 適用タスクでも owning skill (`aiworkflow-requirements` の env accessor reference 等) は **applied-with-spec-sync** ルーティングで同一サイクル更新する。「admin 側で既に同期済みだから profile 側は無修正で良い」は誤り — accessor が増えた場合 (`getApiBaseEnv()`) は accessor 一覧の正本に必ず反映する。

### Anti-pattern

- `try/catch` 内で `console.error(err); throw err;` のまま放置 → SCR digest 化を localhost dev では再現しづらく、staging 配備後に初めて表面化する。
- env 解決失敗時に `?? "http://127.0.0.1:8787"` などの defensive default を残す → fail-fast を阻害し、本番の env 欠落を silent に通してしまう。
- accessor 追加だけして spec 側 grep gate を置かない → 将来の refactor で `process.env[` 直接参照が再導入されても CI で検知できない。

## Primitive 採用タスク（admin dashboard 系 / 2026-05-26）

UI primitive (`AdminPageHeader` / `KpiCard` / `AdminTable` / `AdminEmptyState` 等) を既存ページに整流するタスクの仕様で再発する設計判断。Refs: aiworkflow-requirements `lessons-learned-admin-ui-task-d-attendance-primitive-2026-05.md` (L-TASKD-001..006).

- **L-PRIMADOPT-001 (関数 props は client island に閉じる)**: `AdminTable` の `accessor` / `render` / `getRowKey` のような関数 props を持つ primitive を採用する page は、`page.tsx` (Server Component) と `*.client.tsx` (`"use client"`) に責務分離する。page.tsx は fetch + `AdminPageHeader` だけに縮退させ、column 定義は client component 内 const として置く。Phase 2 設計 deliverable に「page.tsx vs client island の責務分離」を必須化する。
- **L-PRIMADOPT-002 (closed-schema wrapper を流用しない)**: `KpiGrid` のように `AdminDashboardView["totals"]` 固定型を持つ wrapper primitive は、対象ドメイン (attendance metrics 等) に schema 拡張せず**下位 primitive (`KpiCard`) を直置き**する。Phase 2 primitive 採択表に `props signature` と `input schema 開放度` (closed / open) を併記する。
- **L-PRIMADOPT-003 (primitive 実 API を逐語 copy)**: primitive contract の正本は仕様文書ではなく `apps/web/src/features/admin/components/_shared/*.tsx` の実 API。`AdminEmptyState.testId` のような未実装 prop を仕様化すると Phase 5 で typecheck fail する。Phase 2 deliverable に「primitive 実 API snapshot (barrel export + props 型)」を必須化し、未実装 prop が必要な場合は別タスクへ切り出す。
- **L-PRIMADOPT-004 (barrel 追記方式)**: `apps/web/src/features/admin/components/index.ts` の barrel への primitive 追加は**追記方式 (既存行を壊さず append)** で行い、既存 import 経路を破壊しない。Phase 5 implementation step に「barrel に 1 行ずつ追記」を default 化する。
- **L-PRIMADOPT-005 (page-scoped grep gate)**: primitive 採用回帰を防ぐため `scripts/verify-primitive-adoption.sh` に **page-scoped 番号付き grep gate (C-N)** を 1 案件 1 number で追記する。pattern は anti-pattern (`<table`, inline class 等) が当該 page path だけに出現していないことを確認する形。Phase 6 quality gate に必須化。

### Anti-pattern

- 関数 props 含む primitive を Server Component 直下に書く → Server→Client serialization 境界で build / runtime fail。
- closed-schema wrapper primitive を別ドメインに流用するため schema 拡張を本タスクに混ぜる → scope crash と review コスト増加。
- primitive 実 API を確認せず仕様文書ベースで prop を仮定する → Phase 5 typecheck fail し戻り。
- barrel を「整理」目的で書き換える → 既存呼び出し経路が壊れ、scope 外の修正が必要になる。

## Phase 11 visual evidence × Playwright mock fixture（2026-05-26）

`VISUAL_ON_EXECUTION` UI タスクが Phase 11 で screenshot evidence を取得する際の mock / evidence 配線パターン。Refs: L-TASKD-005, L-DEVSYNC-* (Playwright ESM).

- **L-VOEFIXTURE-001 (in-process fixture に scenario header)**: 本番 API に依存せず複数状態 (all-ok / error / empty) の screenshot を撮るため、`apps/web/playwright/fixtures/auth.ts` に `x-mock-scenario` header を読む handler を追記する。仕様 Phase 4 contracts に「mock fixture handler 追記」を 1 行で含める。
- **L-VOEFIXTURE-002 (evidence dir 分離)**: screenshot を workflow root 配下に書くため env `PLAYWRIGHT_EVIDENCE_DIR` で出力先を上書きする。spec 側は `process.env.PLAYWRIGHT_EVIDENCE_DIR ?? "test-results"` で resolve。Phase 11 acceptance に `PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/<root>/outputs/phase-11/evidence` の実行コマンドを記録する。
- **L-VOEFIXTURE-003 (二系統 mock の同時追従)**: `apps/web/playwright/fixtures/auth.ts` (in-process) と `scripts/e2e-mock-api.mjs` (stand-alone) の **両方** を追従対象に含めるかは API surface 変更を伴うか否かで判定。primitive 採用のみで API 不変更なら fixture のみで足りる。API method/path 変更を伴う場合は L-APIMETH-004 の両ファイル追従ルールに従う。

### Anti-pattern

- 本番 API に依存して Phase 11 を撮る → flaky / 認証境界で取れない。
- screenshot 出力先を hardcode して workflow root 外に散らす → artifact-inventory での回収が漏れる。

---

## 新規 pattern section heading 命名規約（dev sync-merge union 統合のため）

本ファイル自体が複数 issue から末尾並列に append される SSOT であり、dev sync-merge で日常的に diff3 conflict が発生する。両側 union で安全に統合するため、新規 pattern section の heading には **issue 番号 / lesson ID prefix を必ず含める**。

- **L-PATSEC-001 (heading 一意化)**: 新規 pattern section の見出しは `## <pattern 名>（issue-<N> L-<TAG>-001..M 汎化）` 形式を採る（例: `## CSP directive 撤去パターン（issue-924 L-I924-001..005 汎化）`）。HEAD と dev で同 sprint に偶然同名 pattern を追加しても heading が衝突しないため、resolver の union が重複 heading を生まない。
- **L-PATSEC-002 (末尾 append-only)**: 既存 section の中央に bullet を増やさず、必ず**ファイル末尾に新 section を append**する。中央への追加は L-DEVSYNC-030（table-merge）系の手動 union を要求し、resolver 1 発で完結しない。
- **L-PATSEC-003 (resolver 委譲)**: 本ファイルは `scripts/sync/resolve-skill-merge-conflicts.sh` の `UNION_TARGETS` に登録済（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-046）。仕様書 Phase 12 で本ファイルへ section を追記するタスクは「dev sync-merge での conflict は `pnpm sync:resolve` 自動解消」と前提を置いてよい。

## Admin route 404 観測と prototype alignment（L-AIDC-002..007 汎化）

admin route の UI prototype alignment と staging 404 復旧を 1 サイクルで扱う場合の汎化パターン。

- **L-AIDC-002 (staging 404 の 5 軸切り分け)**: `ADMIN_FETCH_404` は H1 build 未デプロイ / H2 `INTERNAL_API_BASE_URL` mismatch / H3 D1 migration 未適用 / H4 auth 401→404 化 / H5 proxy path strip の 5 軸で、staging tail と curl evidence を順に潰す。仕様 Phase 4 には H1-H5 の確認コマンドと修正対象を表で固定する。
- **L-AIDC-003 (narrow warn event)**: admin fetch の 404 観測は `safe-server-fetch.ts` で `ADMIN_FETCH_404` のみ `logger.warn({ event: "admin_fetch_404", scope: "admin", path, method, code })` として narrow event 化する。一般失敗を全て warn にしないことで Sentry noise を増やさない。
- **L-AIDC-004 (multi-scope AC 分離)**: UI 改修 + runtime bugfix を同一 PR に入れる場合、AC / evidence / user-gated boundary を A 系 UI と B 系 runtime に分離する。Phase 12 の changed-files classification も A/B 列で書く。
- **L-AIDC-006 (PII grep false positive 回避)**: identity 系 route の PII grep gate は raw email リテラル検出に加え、`responseEmailMasked` のような schema field 名を false positive として扱うか、検証結果に除外根拠を明記する。
- **L-AIDC-007 (N/A spec update の根拠表)**: system spec 更新が N/A の場合も、影響し得る spec file と「なぜ更新不要か」を表で列挙する。N/A 単独表記は Phase 12 compliance で漏れに見える。

### Anti-pattern

- 404 復旧を「staging で要確認」の一文だけにする → H1-H5 のどこを直すべきかが後続 agent に伝わらず、実コード変更と ops 証跡が分離する。
- `ADMIN_FETCH_FAILED` など広い失敗をすべて Sentry warn に昇格する → transient network error まで noise 化し、真の 404 復旧可否が見えにくくなる。
- UI alignment の visual evidence と staging runtime evidence を同じ status にする → local で閉じる検証と user-gated 検証の責務境界が崩れる。

## admin section error recovery hint + server fetch diagnostics パターン（admin-tag-queue-ui-and-404-recovery L-ATAGUI-001..005 汎化）

 admin 系画面の section error 表示と server-side fetch の診断ログを同 wave で改良するときの再現テンプレ。`/admin/tags` 整備で確立し、他の admin route （members / meetings / requests / schema / identity-conflicts / audit）へ同形で展開できる。

- **L-ADMSEC-001 (recovery hint 3 軸)**: `AdminSectionError` の code → hint マップは「route mismatch / base-url 誤り / deploy 遅延」「auth session / 管理者権限 / env-secret 不足」の operator が次にとる確認 action を本文に必ず入れる。code 名だけの表示や code-search 動線だけにしない。`/^ADMIN_FETCH_5\d\d$/` で 5xx 系をまとめて env-secret 確認 hint に倒すと code 追加コストが O(1) に収まる。
- **L-SRVOBS-001 (non-prod 診断ログ最小 4 制約)**: `fetchAdmin()` 系の診断 `console.warn` は (1) `process.env.NODE_ENV !== "production"` で gate、(2) `new URL(base).host` だけ抽出し full URL / token / cookie / body を出さない、(3) `try/catch` で URL parse 失敗を `<invalid>` に倒し fetch 例外を増やさない、(4) `{host, path, status}` の 3 フィールドのみ、をテンプレ化する。Phase 6 acceptance に env spec（`server-fetch.env.spec.ts` 雛形）を必ず含める。
- **L-ADMPAGE-001 (admin page 4 ブロック規律)**: admin route を prototype に合わせるときは `page-head + Breadcrumb + 状態 chip 行 + メイン Panel` の 4 ブロックで分解し、Panel 内は `Avatar / Button / Card / Chip / EmptyState / Icon` の既存 primitive 合成で表現できないか先に確認する。新規 primitive を生やすと token / visual baseline / structure gate の 3 系統で追従コストが線形に増える（L-PGHEAD-001..006 と整合）。Panel 改修時は props 契約と data-testid を維持し、focused component spec の再書き直しを避ける。
- **L-UNTASK-001 (user-gated boundary と未タスクの分離)**: `workflow_state: implemented_local_runtime_pending` のときは unassigned-task-detection.md の Rationale に (a) 本 cycle で実装した項目、(b) staging / runtime user-gated step は本 workflow Phase 11 boundary であり別 backlog ではない、の 2 段を必ず書く。両者を混ぜると completed-tasks 移動時に followup issue 数が水増しされる。
- **L-ARTPAR-001 (artifacts.json parity の `cmp -s` 固定)**: root `artifacts.json` と `outputs/artifacts.json` の parity は `cmp -s <root> <outputs>` を Phase 12 system-spec-update-summary.md の Validation command として固定する。`gate-metadata:validate` の `evidence_path` 物理存在検証と組み合わせれば、2 箇所 mirror の drift は実質ゼロに保てる。

### Anti-pattern

- section error code を hint なし `code` 表示だけで返す → operator が code grep に走り、env / deploy 確認に到達するまでに時間がかかる。
- 診断ログに `Cookie` / `Authorization` / request body / full URL を入れる → staging tail / ローカルログで secret が漏れ、incident response 時にログ全削除が必要になる。
- admin route に prototype 整合のため新 primitive を生やす → token / visual baseline / structure gate の 3 系統で追従コストが線形に増え、PR レビューが長期化する。
- staging visual screenshot の pending を unassigned-task として detection に書く → Phase 11 user-gated boundary と二重管理になり、completed-tasks 移動時の followup 件数が水増しされる。

---
---

## Admin page prototype 整合 + observed API 404 同居タスクパターン（admin-schema-page-prototype-alignment-and-diff-fetch-fix L-ASCHEMA-001..005 汎化）

staging で観測された `/admin/<route>` API 404 と、同 route の prototype 乖離（page layout / sidebar 表記）を同一サイクルで解消する標準分割。

- **L-ASCHEMA-001 (Lane A 先行 triage)**: prototype 整合 + observed runtime error の同居タスクは、UI 着手前に Lane A（`scripts/cf.sh tail` / `curl` / deploy 同期 / mount 順）で根本原因を切り分け、Phase 2 design に切り分け表を必須化する。API surface 不変条件を破る修復に滑り込まない gate になる。
- **L-ASCHEMA-002 (panel stats 抑止 prop)**: parent page で stats grid を集約し、child panel に `hideInlineStats?: boolean` (default `false`) を持たせる。`_shared` Primitive へ昇格させず page-local helper に閉じる。多数の派生 panel が child を参照する場合の destructive 削除リスクを断つ。
- **L-ASCHEMA-003 (sidebar 表記併修)**: 1 行 label 統一は単独 issue 化せず、関連 UI prototype 整合タスクと同 PR に同梱し、`AdminSidebar.component.spec` 追記をチェックリスト化する。
- **L-ASCHEMA-004 (contract spec lane 明示)**: `*.contract.spec.ts` は D1 lane（`vitest.d1.config.ts` + `singleFork`）専用。Phase 4 test plan / Phase 9 QA に lane 名と実行コマンド（`pnpm test:coverage:d1`）を明示する。
- **L-ASCHEMA-005 (Playwright fallback chain 順)**: `apps/web/src/lib/admin/server-fetch.ts` の Playwright fallback は task-specific fixture の **後** に append する。chain 先頭挿入は既存 spec の expected fixture を上書きし、UI 404 分岐 regression を silent 200 で吸収するため禁止。

### Anti-pattern

- prototype 整合タスクで API endpoint surface を改修する（不変条件 #1「既存 API surface のみ接続」違反）。
- panel の inline stats を destructive 削除し、`hideInlineStats` 同等の後方互換 prop を経由しない。
- contract spec を unit lane に置いて「実行されない緑」を量産する。spec 数で安心するが CI で carry されていない。
- Playwright fallback を chain 先頭に挿入し既存 fixture を上書きする。観測 404 を fixture が silent 200 で吸収し regression が取れない。

## main 取り込み no-op 構造前提（pr-creation L-MAINNOOP-001..004 汎化）

## Admin route mount drift + UI prototype 整合 dual-task パターン（admin-requests L-ADMREQ-001..005 汎化）

`/admin/requests` の staging `ADMIN_FETCH_404` (mount 落ち) と UI prototype 未整合を 1 サイクルで解消した実装から、admin 系 worker route の dual-task 仕様書テンプレートへ汎化反映。

- **L-MOUNT-001 (worker entry mount gate)**: 既存 route の `*.contract.spec.ts` は `createXxxRoute()` を直接 instantiate するため、`apps/api/src/index.ts` から mount が落ちても全 PASS する。admin / member 系で外部 fetch が 404 を返した場合は、まず `*.mount.spec.ts` を追加し `import worker from "../../index"` → `worker.fetch(req, env, ctx)` で dispatch を検証。`status !== 404` をアサーション。仕様書 Phase 4 (テスト計画) に **「worker entry mount drift gate」** を独立 TC として明示する。
- **L-P11STATUS-001 (Phase 11 evidence status enum 厳守)**: `outputs/phase-12/phase12-task-spec-compliance-check.md` の Phase 11 evidence 表に `pending_user_approval` / `pending_user_gate` 等の独自 enum を書くと `verify:phase12-compliance` が `invalid status` で fail する。正本は `VALID_STATUSES = new Set(["present", "pending", "n/a"])` (`scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts`)。staging baseline 等の user-gated 未撮影は `pending` と書き、承認ニュアンスは「Runtime or user-gated boundary」散文に分離する。
- **L-ADMHEAD-001 (page-head h1 単独所有 + panel hidden h2)**: admin shell 配下の page では route page が `page-enter / page-head / h1` を所有し、panel/section は `<h2 className="sr-only">` + `section[aria-labelledby]` で referent を満たす。panel 側に visible h1 を残すと `document.querySelectorAll('h1').length === 1` semantic gate が fail。仕様書 Phase 2 (設計) の primitive 適用表に役割分担行を必須化する。
- **L-EVDFLAG-001 (env-gated local screenshot capture)**: Phase 11 local authenticated screenshot は `<FEATURE>_EVIDENCE=1` + `PLAYWRIGHT_EVIDENCE_DIR=<workflow>/outputs/phase-11` の組で env-gated 起動する。spec 側で `test.skip(!process.env.<FEATURE>_EVIDENCE, ...)` を最初に置く。CI matrix は default off で smoke のみ走り、evidence capture は手動 1 回で完結する。
- **L-DUALTASK-001 (artifacts.json mirror byte-identical)**: Task A + Task B 等 dual-track を 1 ワークフローでまとめる場合、root `artifacts.json` と `outputs/artifacts.json` の差分が出やすい。`local_evidence_files` / `planned_visual_evidence_files` を片方だけ書くと `gate-metadata:validate` 後段の `cmp` で fail。Phase 12 compliance check の Section 6 (verification commands) に `cmp <root>/artifacts.json <root>/outputs/artifacts.json` を必須行として記載する。

### Anti-pattern

- contract spec だけで route shape を保証したと判断 → mount drift が staging で初めて発火し ADMIN_FETCH_404 ループ。
- Phase 11 evidence 表に `pending_user_approval` 独自 status を書く → `verify:phase12-compliance` fail で PR pre-flight ブロック。
- root `artifacts.json` だけ更新し outputs mirror を忘れる → `gate-metadata:validate` の cmp 段で fail し、原因切り分けに時間を浪費する。
- `is-ancestor` 確認を飛ばして `git merge origin/main` を実行 → no-op merge commit が生まれ PR diff の noise になる
- `gh pr checks` を見ずに「CI 失敗があるはず」と推測修正を積む → 不要コミットで PR review コストを増やす
- no-op だったので lesson を残さない → 次回同種指示で同じ確認手順を再構築する無駄が発生する
- `gh pr checks` が pass だけを見て mergeable を見ない → `DIRTY` 状態の PR を「green」と誤報告し、dev divergence の再 sync が遅れる

## Admin route mount drift + UI prototype 整合 dual-task パターン（admin-audit-prototype-alignment L-AAUDIT-001..005 汎化）

`/admin/<route>` の (a) staging API 404 観測と (b) bare `<form>` / page-local `<h1>` 残存 という 2 軸の課題は、`apps/web` UI 整合（Task A）と `apps/api` root mount 回帰保護（Task B）の dual-task として一括で扱うのが効率的。両 task は独立してレビュー可能で、UI 実装 / local unit test と route 配線確認は並列実行できる。

- **L-ADMROUTE-001 (root mount regression test の必須化)**: admin endpoint を追加・移動する PR では `apps/api/src/index.spec.ts` に root mount 経由で `/admin/<path>?<minimal-query>` を request し **401（404 ではない）** を期待する spec を 1 件必ず追加する。`requireAdmin` middleware 経由で 401/403 が返るのが正解で、404 が返ったら mount 順序 / path duplication / handler 配線崩れの回帰。**Anti-pattern**: contract spec（200 OK with admin auth）のみで mount を保護すると、auth bypass 時の 404 を見逃す。
- **L-ADMBANNER-001 (Banner tone 制約)**: admin UI で error 表示が必要な場合は `Banner tone="warning"` / `tone="danger"` のみを使う。`error` / `info` / `success` tone は存在しない。typecheck で fail するため新 tone 追加は別 RFC 経由。
- **L-ADMLINKBTN-001 (link button は buttonVariants + a)**: 本 repo の `Button` primitive は polymorphic link rendering（`asChild` / `href`）を持たない。リンクとして描画する場合は `<a className={buttonVariants({ variant: "outline" })}>` で構成する。design system invariant のため `Button` を polymorphic 化しない。
- **L-ADMHEAD-002 (page-local h1 撤去契約)**: `AdminPageHeader` を採用する admin page では、配下 panel component の page-local `<h1>` を grep で全撤去し `headingId` 譲渡パターン（`<section aria-labelledby={headingId}>`）に統一する。L-ASHELL-001（admin shell header 撤去契約）と同根。Playwright spec で `h1` count = 1 を assert することで回帰検知。
- **L-OBSREG-001 (staging 観測文字列を regression test input に固定)**: staging で観測した error 文字列（例: `admin api /admin/audit?limit=50 failed: 404`）は必ず `safeServerFetch` 等の reason 展開 regression test の input として保存する。test fixture コメントに staging 観測 timestamp + URL を残すと、同じ文字列が再発した場合に確実に reason 展開される。L-ATAGUI-001（admin-tag-queue-ui-and-404-recovery）と同パターン。

### Anti-pattern

- API contract spec のみで mount を保護 → auth bypass 時の 404 や mount 順序回帰を見逃す
- `Banner tone="error"` を書いてしまう → typecheck で fail。lint で `tone` enum を検査する gate が無いと runtime まで通る場合あり
- `Button asChild` / `<Button href>` を期待する → primitive API ミスマッチ。コードレビューで毎回引っかかる
- `AdminPageHeader` 採用時に panel 内 `<h1>` を残す → axe / playwright で二重 h1 警告。手戻りコスト大
- staging 観測文字列を test に固定せず「直したつもり」で close → 同じ文字列が再発した時に検知できない

## Dev sync 時の sibling-section conflict 解消パターン (2026-05-27)

- 適用場面: feature branch が UI surface (drawer / panel / page) の section 構造を全面刷新中に、dev 側が同ファイル内へ新規 Client Island / Server Component / sibling section を追加した状態で `git merge dev` した時。
- パターン:
  1. import 行は両側採用（HEAD 側の adapter / type 系 + dev 側の新 Component 両方）。
  2. dev が追加した sibling section は HEAD の旧 anchor が消失している可能性が高いため、HEAD 構造内の **semantic に最も近いセクション境界** (同種 section の前後) へ再配置する。
  3. `pnpm sync:resolve` は `*.tsx` を union 対象外にするため、resolver 後の unresolved リストに残る `*.tsx` は機械解消不可と確定。手動 Edit で対応する。
  4. 解消後 `grep -n '<<<<<<<\|=======\|>>>>>>>' <file>` で marker ゼロ + `pnpm typecheck` + `pnpm lint` を gate にしてから `git add`。
- アンチパターン:
  - dev 側が追加した新 Component を「HEAD で消失したセクション内」にそのまま残す → 構造破綻 / 旧 anchor の残骸が新構造と共存する。
  - union 強行 → syntax error / runtime 二重描画 / lint 違反を引き起こす。
  - dev 側追加を完全に捨てる → 新機能（本件は diagnostics panel）が feature merge 後に消える silent regression。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-050

## Dev sync 時の signature 並列リファクタ統合パターン（2026-05-27）

- 適用場面: feature branch が関数 signature を **型方向** で変更（戻り値 null 化 / branding / strict null など）し、dev が同関数の **value 取得経路** を抽象化（accessor 移行 / DI 化 / config-driven 化など）した状態で `git merge dev` した時。
- パターン:
  1. conflict block 内の **型 signature**（戻り型 / 引数型 / generics）は HEAD 側を採用（feature branch のスコープ固有 semantic を保護）。
  2. conflict block 内の **value 取得式**（右辺 expression）は dev 側を採用（global invariant 由来の accessor 移行を遵守）。
  3. **sibling 関数**（同種リファクタを受けた近傍関数）に HEAD 側固有の semantic 変更がなければ、dev 側へ完全追従する（HEAD 側を採用すると invariant 退行になる）。
  4. 統合後 `pnpm typecheck` で呼び出し側（同ファイル内の上位関数 / 他モジュール）の null check / 型整合性を確認。
- アンチパターン:
  - HEAD 側の戻り値型変更を捨てる → fail-fast スコープ要件が退行（本件は env 漏れ時の 500 明示返却が失われる）。
  - dev 側の accessor 移行を捨てる → invariant #11（`process.env` 直接参照禁止）違反が残置し、次回 dev sync で再 conflict。
  - 両側を union 並列で残す → syntax error（同名関数の二重宣言 / 戻り型不一致）。
- Anchor:
  - 「型 = HEAD・実装 = dev」の semantic 統合判定: `git diff origin/dev..HEAD -- <file>` と `git log -1 --stat origin/dev -- <file>` で両側コミットメッセージ確認。HEAD 側が type-level semantic 変更（fail-fast / strict null / branding）なら本パターン適用。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-051

## Provenance JSON metadata の 3-way conflict 解消パターン（2026-05-27）

- 適用場面: `.baseline-meta.json` / `.gate-metadata.json` 等の provenance metadata JSON が、両側で workflow_dispatch 等により独立に生成 / 更新された結果 3-way conflict した時。
- パターン:
  1. **Scalar latest field**（`captured_at` / `passed_at` / `updated_at` 等の ISO8601 timestamp）: 両側比較し新しい側を採用。ペアになる sha / id field（`captured_at_commit_sha` / `commit_sha`）も同じ side を採用（必ず一致させる）。
  2. **Array set field**（`captured_run_ids` / `evidence_paths` / `run_history` 等）: 両側追加要素を union 結合。重複は削除、時系列 / 数値順で order を揃える。
  3. **Narrative field**（`last_refresh_reason` / `notes` 等）: 新しい側の文言を主、古い側を従属節として併記。両側の wave id（issue 番号 / followup id）を文字列内に残し、後追跡可能にする。
  4. **その他 scalar field**（`viewport_dimensions` / `rendering_relevant_paths` 等 schema 不変項目）: 片側採用で OK。
  5. JSON 構文を `python3 -c "import json; json.load(open('<path>'))"` で検証してから `git add`。
- アンチパターン:
  - `--ours` / `--theirs` で片側全採用 → 反対側の `captured_run_ids` / wave reason が失われ provenance 履歴に gap が生じる。
  - timestamp は新しい側を取って sha は古い側を取る → provenance 不整合（後段 validator が SHA に該当する commit を引けず fail）。
  - run_ids を union するが narrative reason を片側だけ採用 → 「なぜ追加 run が走ったか」が読み取れず、stale baseline 判定の根拠を失う。
- Anchor:
  - 「scalar latest + array set + narrative」3 種混在 JSON を見たら本パターン適用。`pnpm sync:resolve` は JSON を union 対象外（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-002）にするため、手動 Edit で対応する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-052

## Playwright `getByRole(name)` substring 一致による strict mode violation の追従パターン（2026-05-27）

- 適用場面: 既存 e2e spec が `getByRole('button', { name: '<member name>' }).click()` を使っており、後続の feature branch で同 row 内に「<name> を編集」「<name> を公開」等 substring が一致する補助 button を追加した時。pre-existing test が CI で `strict mode violation: ... resolved to N elements` で fail する。
- 原因: Playwright の `{ name }` フィルタはデフォルト **case-insensitive substring match**。`{ exact: true }` を付けない限り、accessible name に `<member name>` を含むすべての button が候補に上がる。さらに row 内 Avatar (`role="img"` `aria-label="<name>"`) が button 子要素にある場合、button の accessible name は「<name> <name>」のような連結文字列になるため、`{ exact: true, name: '<name>' }` でも一致しない。
- パターン:
  1. 既存 spec の `getByRole('button', { name: '<text>' })` を grep し、新 feature branch で同 substring を含む aria-label / 子要素を追加していないか確認。
  2. 追加していれば spec 側を **row testid → role=button → `.first()`** 形式に書き換える（例: `page.getByTestId('admin-members-row-mem_alpha').getByRole('button').first().click()`）。
  3. テーブル row には必ず `data-testid={admin-<resource>-row-<id>}` を付与しておく（contract）。spec から安定 selector で参照できる正本になる。
  4. `{ exact: true }` だけでは Avatar `aria-label` 連結問題が解消しないため、accessible name に依存する selector は避ける。
- アンチパターン:
  - feature branch で row 内 button を追加するときに e2e spec を grep せず、CI fail で初めて気付く → dev sync merge 直後に発覚するため「dev sync 起因」と誤認しやすい（実体は feature branch 由来の test gap）。
  - `{ exact: true }` だけで対応 → Avatar が子要素にいる場合は accessible name が `'<name> <name>'` になり依然 fail。
  - `getByText` で代替 → button 以外の span / Avatar が一致して別の strict violation を生む。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-010（fixture 不足は dev sync 起因ではなく feature branch 由来）と同型の盲点パターン

## Legacy CSS specificity 衝突は `:not()` 連鎖ではなく route-group ancestor scope で隔離する（2026-05-27 追加）

dev merge で legacy CSS の汎用 attribute selector（`[data-size]` 等）に `:not(.x):not(.y)` 連鎖が追加された場合、specificity が上がって globals.css の primitive class rule を上書きすることがある。`:not(.ui-avatar)` を追加して specificity を維持しつつ要素除外する誤対処をやると、**公開ページ baseline が globals.css 側 pixel に倒れて全 viewport で diff** になる二次故障を起こす。

- 検出: dev merge 直後の visual-full CI で複数 route group（公開 / admin / member）が同時に diff。`legacy-*.css` の attribute selector に `:not()` が増えていれば本パターン候補。
- 正規パターン: route-group ancestor を前置して selector のスコープを物理分離。
  - 公開専用 legacy: `[data-route-group="public"] [data-size]:not(...)` 形（`apps/web/app/(public)/layout.tsx` の root div 属性に依拠）
  - admin / member: ancestor 不一致で legacy が match せず globals.css primitive が独立に勝つ
- アンチパターン:
  - `:not(.ui-avatar)` で逃がす → 公開 Avatar が globals.css size に倒れ baseline 全乖離
  - baseline を即 refresh → CSS 設計衝突を baseline で覆い隠すため、後続の primitive 改修で再発
  - `!important` で押し切る → cascade origins が混線し、後続 wave で何が勝つか追跡不能
- 適用判断: legacy / scoped CSS と primitive / global CSS が**同名 attribute / 異 pixel** で衝突する全パターン。task spec の Phase 6/9 では「specificity ではなく selector scope で隔離」を invariants として宣言する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-053（dev sync 起因の `[data-size]` specificity 上昇への正対処）

## DOM 構造置換 PR の同一 wave spec 同期と visual baseline 更新（prototype alignment L-MLPA-006..007 汎化）

`apps/web/app/**` の Server Component で DOM tag や `data-component="*"` を置換する PR（prototype alignment / primitive 統一 / component 置換）は、**focused spec だけ更新して legacy critical-route spec の selector を残置**すると `e2e-tests-coverage-gate` が PR 直前に block する。同時に DOM 寸法が変わるため `playwright-visual-full` / `playwright-smoke visual` の `-linux.png` baseline も必ず stale 化する。仕様書 Phase 11/12 で以下を契約する。

- **L-DOMSWAP-001 (selector grep gate)**: `data-component` / `data-role` / tag 名（`table` / `ul` / `section`）を置換する Phase 11 では、`apps/web/playwright/**` 全体を旧 selector で grep し残存ゼロを evidence に添付する。focused spec のみ更新で「他 spec は次回直す」は禁止。
- **L-DOMSWAP-002 (同一 wave commit 同期)**: 旧 selector → 新 selector への置換は **component 実装 commit と同一 commit / 同一 PR** で完結させる。PR 分割すると後発 PR が CI block を起こす。
- **L-DOMSWAP-003 (visual baseline 更新は user-gated workflow_dispatch)**: 寸法変動を伴う PR は同一 wave で `playwright-visual-baseline-update.yml` (`workflow_dispatch` + `visual-baseline-approval` environment) を user 承認で trigger する。Phase 12 implementation-guide に「baseline 再生成は別 workflow 実行・本 PR の commit には含めない」と明示する。
- **L-DOMSWAP-004 (Linux baseline SoT 維持)**: ローカル macOS で `--update-snapshots` を走らせ `-darwin.png` を commit してはならない（Linux runner で再失敗）。baseline は CI runner の `-linux.png` のみが SoT。
- **L-DOMSWAP-005 (Phase 13 acceptance gate)**: Phase 13 acceptance に `gh pr checks <PR>` 必須化に加え `gh run list --workflow=playwright-visual-baseline-update.yml --branch=<feature> --limit=1` の確認を組み込み、baseline 再生成 run が PR push より新しいことを verify する。
- **L-DOMSWAP-006 (寸法変動は pixel diff だけでなく画像サイズ不一致でも顕在化・列/要素追加 enrichment が典型)**: DOM 構造を置換しなくても、**列・要素を追加して既存テーブル/レイアウトの幅が変わる enrichment**（例 admin members に occupation/zone/type/tags 列追加）は `playwright-visual-full` で `Error: ... Expected an image WxH, received W'xH'` の **画像サイズ不一致**として fail する（pixel diff 以前の hard fail で `maxDiffPixels` では救えない）。desktop は収まっても tablet/mobile で overflow して幅増 → viewport 別に fail する。Phase 11 で「列追加・要素追加も寸法変動 PR」として L-DOMSWAP-003 の baseline 更新対象に含め、失敗が touch surface route に限定されることを「feature 起因（baseline 更新で解決）vs 回帰（コード修正）」の判定軸として明記する。dev sync-merge 同居時は **merge 前 commit の run conclusion** を引いて merge 無罪を切り分ける。
- **L-DOMSWAP-007 (bot baseline コミット後の `pull_request` 再発火は実コミット push でも可)**: `playwright-visual-baseline-update.yml` の bot push は GITHUB_TOKEN 由来で `pull_request` を再トリガーしない。Phase 13 で必須 check を最新 head に走らせる手段は `gh pr close && reopen`（[[lessons-learned-visual-baseline-ci-recovery-2026-05]] L-VISBASE-003）だが、**skill 反映・docs 追記など積むべき実コミットがある場合はその push で代替**できる（自分の push は再帰防止対象外）。acceptance には「baseline コミットをローカル ff 同期 → 反映コミットを上に積んで push → 最新 head で visual-full 含む全 pull_request workflow green」を記す。
- **L-DOMSWAP-008 (visual baseline は 3 project family・更新 workflow の網羅漏れを疑う)**: toHaveScreenshot baseline は ①`visual-full-chromium-*`(`tests/visual-full/`) ②`visual-chromium`(`tests/visual/`・smoke の `visual (chromium)` job) ③`sidebar-shell-visual-*`(`tests/sidebar-shell/`・smoke の `visual (sidebar-shell …)` job) の 3 系統に分かれる。`playwright-visual-baseline-update.yml` を dispatch しても **一部 visual job だけ赤が残る**場合、更新 workflow の `--project` 列挙が全 family を覆っていない網羅漏れを疑う（実例: ③`sidebar-shell-visual-*` が再生成対象から漏れ、ReflectionTimingNote/nav 項目数変化で `admin-1280`/`profile-1280` baseline が陳腐化しても更新されず smoke が赤のまま）。対処は **workflow を先に拡張**（regenerate step + commit の `git add` path に `apps/web/playwright/tests/sidebar-shell/` を追加）→ push → 再 dispatch。寸法変動 PR の Phase 11 では `gh run view <smoke> --log-failed` で diff した baseline の project 種別（`*-visual-full-*`/`*-visual-chromium-*`/`*-sidebar-shell-visual-*`）を特定し、再生成対象 project を漏らさない acceptance を書く。[[lessons-learned-visual-baseline-ci-recovery-2026-05]] L-VISBASE-005 と対。

### Anti-pattern

- focused spec だけ更新して legacy critical-route spec を放置 → CI block で merge 不能
- DOM 寸法を変える PR で baseline を更新しない → visual diff で 100% fail
- ローカル `--update-snapshots` の commit → `-darwin.png` 混入で Linux runner 永続 fail
- visual baseline 更新を「次の PR でまとめてやる」と先送り → 後続 PR が常に visual fail で blocked

## dev sync merge 着手前の作業ツリー pre-check と git lock 衝突対応（L-DEVSYNC-050/051 汎化）

「リモート dev を取り込んでコンフリクト解消して push」系のタスク仕様書では、Phase 11 / 12 の手順に着手 pre-check を 2 項目組み込む。AI / 人間どちらが実行しても初手で破綻しないようにするため。

- **L-SYNCPRE-001 (working tree drift pre-check)**: `git merge dev` の前段で `git status --porcelain | awk '{print $1}' | sort | uniq -c` を実行し、`D` (deleted) のみが大量で他種別 (`M` / `A` / `??`) ゼロの状態なら「working tree 物理欠落」パターン。`git restore .` で HEAD 一致に戻してから merge に進む。Why: index・HEAD は正常なのに working tree のみが drift しているケースで、そのまま merge すると spurious deletion が混入する。
- **L-SYNCPRE-002 (stale index.lock 解消手順の明文化)**: `lazygit` / `git gui` / 別 Claude セッションが並走しているリポジトリで 0-byte `index.lock` が残存し restore / merge を阻む。仕様書には「TUI を閉じる」「`lsof` で保持者確認」「最終手段で `rm -f .git/worktrees/<wt>/index.lock`」の 3 段順序を明記する。`rm` が harness 権限で拒否される環境では `! rm -f <path>` をユーザーに依頼する fallback を入れる。
- **L-SYNCPRE-003 (sync:resolve 後の orphan marker grep gate)**: `pnpm sync:resolve` 完走後でも `||||||| ` 単独 marker が残ることがあり（L-DEVSYNC-049）、commit 前に CI と同条件の grep を必ず走らせる。仕様書 Phase 11 evidence に grep 結果（empty を含む）を添付。
- **L-SYNCPRE-004 (verify-pr-ready 一括検証)**: typecheck / lint 単独ではなく `bash scripts/verify-pr-ready.sh` を Phase 12 acceptance に必須化。`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild drift` の 3 軸を一括で確認できるため。

### Anti-pattern

- working tree が 7000+ deletions のまま `git merge dev` を実行 → merge commit に spurious deletion が混入し review 不能
- `rm -f index.lock` を確認なしに実行 → 真に書き込み中の writer がいた場合に index 破損
- `pnpm sync:resolve` 後の `git status` clean だけで commit → `||||||| ` 単独 marker 残存で CI `verify-conflict-markers` FAIL
- typecheck / lint だけで push → `verify-pr-ready.sh` 未実行で gate-metadata schema 違反が pre-push hook で発覚し push 失敗

## accent on accent-soft chip は accent-ink を採る (L-CHIPCONTRAST-001 汎化)

`color-mix(in oklch, var(--ubm-color-accent) 12%, transparent)` を背景に乗せた chip/pill/badge の foreground を `--ubm-color-accent` のままにすると、OKLch lightness 約 0.52（accent）× 約 0.93（tint された surface）の組合せで axe contrast が **4.39:1** に落ち WCAG 2 AA (4.5:1) を切る。仕様書 Phase で chip / badge primitive を扱う場合は次を契約する。

- **L-CHIPCONTRAST-001 (token 選定ルール)**: accent-soft 系の tint を bg に取る chip / pill / badge / status indicator の text/icon foreground は `var(--ubm-color-accent-ink)` を第一候補にする。`-ink` 系（OKLch lightness ~0.36-0.38）は tint surface に対し contrast 7.0+ を確保するため WCAG 2 AA 必達点を上回る。
- **L-CHIPCONTRAST-002 (dot/icon 区別)**: `aria-hidden` な dot / shape は text contrast 要件外のため `var(--ubm-color-accent)` を残し意匠を保つ。**「fg=ink、装飾=accent」を 1 つの chip primitive 内で分離記述**する。
- **L-CHIPCONTRAST-003 (Phase 9 acceptance への組込)**: VISUAL_ON_EXECUTION × public/admin chip primitive を含む仕様書は Phase 9 acceptance に「e2e a11y (axe wcag2aa) で `color-contrast` violation = 0」を必須化し、Phase 11 evidence に axe JSON を添付する。Phase 13 verify では axe violation 数を最終 gate にする。
- **L-CHIPCONTRAST-004 (token 不在時の追加経路)**: zone variant に `-ink` 系が定義されていない場合、`design-tokens.md` へ追加して全 zone (default / cool / warm) parity を取る。仕様書 Phase 8（design tokens）に「accent-soft × accent の contrast = 4.39 (worst)」の実測値も併記し再発を防ぐ。

### Anti-pattern

- `color-mix` で薄めた bg にそのまま `var(--ubm-color-accent)` を fg で使い「token 統一」を理由に放置 → axe で必ず fail
- 1 chip 内の dot/icon にも `-ink` を強制適用 → 装飾の発色が抜けて意匠崩れ
- 仕様書に axe acceptance を入れず、CI で初検出 → wave 末で reverse adjust が発生し coverage / visual baseline と同時 update が必要になる

## L-DEVSYNC-051 visual baseline コンフリクト解消パターン（dev sync-merge / 2026-05-27）

UI 系 feature ブランチ（prototype alignment / dashboard 等）と dev の双方が直近に `chore(visual): update baselines via workflow_dispatch` を持つ状態で sync-merge を行うと、`pnpm sync:resolve` が `apps/web/playwright/tests/visual*/**.png` と `.baseline-meta.json` を `WARN unhandled conflict` で残す。これは「両 branch がそれぞれの UI 変更を反映した正本 baseline を持つため、機械的に merge できない」設計上の正常動作。

- **L-DEVSYNC-051-A (ours 全採用 default)**: visual baseline (`apps/web/playwright/tests/visual-full/**.png` / `apps/web/playwright/tests/visual/**.png` / `.baseline-meta.json`) の WARN unhandled は **`git checkout --ours <paths>` で一括採用**を default にする。feature branch 側に「独自 UI 変更」が含まれているため、dev 側 baseline は feature branch の意図を破壊する。Phase 12 implementation-guide / Phase 13 PR pre-flight に「visual baseline conflict は ours 採用 → `pnpm typecheck && pnpm lint && bash scripts/verify-pr-ready.sh` で検証 → 必要なら merge 後 `playwright-smoke / visual` ジョブで再生成」のフローを明示する。
- **L-DEVSYNC-051-B (theirs 採用例外)**: feature branch が visual に**全く触れていない**（`git log --oneline HEAD ^origin/dev -- apps/web/playwright/tests/visual` が空）かつ dev 側のみ baseline 更新の場合に限り theirs 採用が正解。仕様書では「baseline-only sync」の判定コマンドを runbook に含める。
- **L-DEVSYNC-051-C (Phase 4 risk への登録)**: UI 系 spec の Phase 4 risk table に「visual baseline drift × dev sync-merge の二重発生」を必ず登録し、L-DEVSYNC-050 (HEAD 全採用) と並列で L-DEVSYNC-051 (visual ours 採用) を mitigation として参照する。Phase 13 PR pre-flight check に baseline ours 採用後の `bash scripts/verify-pr-ready.sh` 必達を含める。
- **L-DEVSYNC-051-D (resolver 自動化しない理由)**: `scripts/sync/resolve-skill-merge-conflicts.sh` に visual baseline 自動 ours を追加することは可能だが、theirs 採用例外パスがあるため**手動判定を促す WARN 設計を維持**するのが正。仕様書 Phase 12 では resolver 拡張ではなく runbook documentation を成果物として定義する。

### Anti-pattern

- `git checkout --theirs` を default にして feature branch の独自 UI 変更を失う → visual regression が CI で検出されず merge 後に staging で初発見
- PNG を手動で開いて「どちらが正しいか」目視判定する → スコア化できないため再現不能、SOP として記録すべきは「ours 採用 + ジョブ再生成」の機械化された経路のみ
- `pnpm sync:resolve` が WARN を出した時点で停止せず空 commit で push → CI の `playwright-smoke / visual` が両 baseline 不整合で fail し、誰のせいで baseline がズレたか追跡不能

## L-FETCHCACHE-001 e2e mock API × Next.js fetch cache 不整合の本質修正パターン（2026-05-27）

`pnpm dev:webpack` + e2e mock API のテストでは、Next.js fetch cache (`next: { revalidate: N }`) が SSR 結果を秒単位で hold するため、mock API の state 切替（`setPublicHomeEmpty(true)` 等）が 2 回目の `page.goto()` で SSR に反映されず spec が fail する。これは production code に `?nocache=...` を読む test-only 分岐を入れて凌ぐと technical debt 化するため、**fetcher 層 1 箇所で `isTestOrPlaywright()` 時に `cache: 'no-store'` を強制**するのが本質修正パターン。

- **L-FETCHCACHE-001 (fetcher 層集約)**: test-only no-store branch は **必ず `apps/web/src/lib/fetch/<scope>.ts` の `doFetch()` に閉じる**。page.tsx 側 `revalidate: PUBLIC_API_REVALIDATE.xxx` 呼び出しや、route handler の searchParams 分岐に test-only logic を漏らさない。
- **L-FETCHCACHE-002 (env gate)**: 切替判定は `NODE_ENV === 'test'` か `PLAYWRIGHT_TEST === '1'`。env アクセスは `apps/web/src/lib/env.ts` 経由（invariant: env 直接参照禁止）。Playwright webServer の env で `PLAYWRIGHT_TEST=1` を渡す既存の仕組みを利用する。
- **L-FETCHCACHE-003 (next と cache の同時指定回避)**: Next.js は `next: { revalidate: N }` と `cache: 'no-store'` を同時に持つと runtime warning。`const { next: _next, cache: _cache, ...rest } = init` で剥がしてから `{ ...rest, cache: 'no-store' }` を返す。
- **L-FETCHCACHE-004 (production 無影響の保証)**: 仕様書 Phase 4 acceptance に「`isTestOrPlaywright()` が false の経路で `revalidate` 値が保持されている」ことを spec で確認する unit test を含める。Phase 9 で `production build (NODE_ENV=production, PLAYWRIGHT_TEST=undefined)` での cache hit ratio が変わらないことを Lighthouse 値で確認する。

### Anti-pattern

- spec 側で `page.goto("/?t=" + Date.now())` の query bust → Next.js fetch cache key は外部 fetch URL ベースなので **無効**（page URL の query 変更は SSR fetch result の cache を bypass しない）
- page.tsx に `searchParams.t` 分岐を入れて test 用 cache bypass → production code に test-only logic 混入、`Page` component の propsが test 専用 prop で汚れる
- 該当 spec を `test.skip` で先送り → e2e mock API を使う他 spec も同じ regression を踏むため fundamental fix が常に正解
- `revalidate: 0` に下げて regression を回避 → production で free tier 圧迫（cache hit rate が drop）し本末転倒

## Closed-issue + Parent-implemented Runtime-ops Runbook パターン（2026-05-27 / L-I956-001..005 generalization）

Parent workflow が実装責務（コード/cron/D1 schema 等）を完了済みで、production runtime での recovery 実行手順と evidence boundary だけが canonical 化されていない場合、子 workflow は「実装 task」ではなく「runtime-ops runbook 子 workflow」として独立 canonical root を持たせる。GitHub issue が CLOSED でも `Refs <issue>` で workflow を後付け生成してよい（再 open 不要）。

- **L-RUNBOOK-001 (子は runbook 専用)**: `implementationCategory: runtime-ops-runbook` / `implementation_files: []` / `test_files: []` を artifacts.json metadata に明示する。Phase 5 は「実装手順」ではなく「runtime 実行手順 + redaction 契約」を記述。parent 実装 workflow への pointer (`parent_task`) を root metadata に必ず置く。
- **L-RUNBOOK-002 (runtime-dependent followup 境界)**: Phase 12 unassigned-task-detection で候補を**列挙したうえで `Not created — runtime evidence dependent` と decision を明記**する。同一表に「if observed during the approved runtime cycle, escalate or formalize before close-out」の運用契約を併記する。`spec_created` 段階では 0 件、runtime 発火後に escalation gate で再評価。speculative 起票も未起票放置もどちらも禁止。
- **L-RUNBOOK-003 (consumed pointer 契約)**: source unassigned proto-spec は **物理削除せず**、frontmatter に `status: consumed` / `canonical_workflow: docs/30-workflows/.../<id>/` / `consumed_at: <date>` / `issue_reference_mode: refs-only` を追記し、本文冒頭に canonical workflow への pointer 行を残す。GitHub issue 本文 link / parent Phase 12 detection からの相対リンクの dead link 化を防ぎつつ重複 workflow 生成を抑止する。
- **L-RUNBOOK-004 (runtime PASS claim 禁止)**: Gate-B / Gate-C は `outputs/phase-11/snapshot-after.*` と `snapshot-diff.md` の物理ファイル存在 + AC mapping を必須条件とし、未充足の間は `pending` 固定。`runtime PASS is not claimed` を Phase 12 main.md / inventory / compliance-check 全てで一貫表記する。`spec_created` から `completed` への直接遷移は禁止（中間 `implemented_local_runtime_pending` or `runtime_pending_user_approval` を経由）。
- **L-RUNBOOK-005 (redaction 5 種)**: production secret 投入 / cron tail / D1 SELECT/UPDATE の生出力には機密が混じる。evidence には **識別子 / exit code / row count / next-run timestamp のみ** を残し、(a) secret 値、(b) token preview/prefix/suffix、(c) service-account local part、(d) responder email、(e) フォーム回答本文 の 5 種は `<REDACTED>` 表記とする。「evidence 充実 = 生出力を貼る」方向に AI agent は流れがちなため、Phase 11 ledger の各行に redaction 規約を明記する。

### Anti-pattern

- closed issue を理由に canonical workflow root を生成しない → skill traceability gap が残り、recovery 操作が ad-hoc 化
- runtime-dependent followup を「いつか観測したら」と speculative に起票 → backlog 汚染。逆に detection 表に書かず放置 → runtime 発火時に skip され recovery 機会を失う
- source unassigned task を物理削除 → GitHub issue / parent detection の dead link 化が永続的
- `spec_created` のまま `gates[*].status = passed` に進める → evidence-less PASS で skill 正本性が壊れる
- `scripts/cf.sh tail` 出力をそのまま Phase 11 ledger に貼り付ける → secret/PII 漏洩

## Admin panel dual-h1 strict-mode + visual baseline 更新パターン (2026-05-28)

- **Rule (panel heading)**: admin panel component の root は `<section aria-label="<セクション名>">` で region role を取り、内部に `<h1>` を**置かない**（sr-only h1 も含む）。AdminPageHeader 側が `h-page` h1 を一元提供する場合、panel の `<h1 sr-only>` は Playwright `getByRole('heading', { name })` の strict-mode に必ず抵触する。
  - Why: page-head h1 と panel sr-only h1 が両方とも `heading` role + 同名で resolve され、`strict mode violation: resolved to 2 elements` でCI fail。
  - How to apply: component spec 側は `getByRole('region', { name })` または `getByLabelText(name)` で assert する。**heading role からの離脱**が isolation/統合の両立条件。Phase 4 risk に「panel 内 sr-only h1 は page-head と dual-h1 になる」を登録。
  - 参照: aiworkflow-requirements [[lessons-learned-admin-tag-queue-ui-and-404-recovery-2026-05]] L-ATAGUI-006 + 既存 L-PGHEAD-001..005（headingId 譲渡パターン）と整合。

- **Rule (visual baseline regen)**: redesigned page の visual-full baseline drift は CI artifact `<viewport>-diff.zip` 内の `test-results/<spec>/<snapshot>-actual.png` から差し替える。`test-failed-1.png` は viewport-crop（full-page でない）なので使わない。
  - Why: Linux runner 環境で pixel-perfect な full-page snapshot を生成するのは CI のみで再現可能。ローカル macOS で `--update-snapshots` しても pixel が一致しない（OS/font subpixel 差）。
  - How to apply: `gh api .../actions/runs/<id>/artifacts` で `visual-full-<viewport>-diff` ID 取得 → zip ダウンロード → `<snapshot>-actual.png` を `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` に上書き → commit → CI 再実行で PASS 確認。`file <png>` で full-page サイズを必ず検証。
  - 参照: aiworkflow-requirements [[lessons-learned-admin-tag-queue-ui-and-404-recovery-2026-05]] L-ATAGUI-007 を逐語埋め込み。

## L-DEVSYNC-054 並列 feature の同一 cleanup hotspot / barrel への独立追加パターン（dev sync-merge / 2026-05-28）

並列に進む複数 feature ブランチが、e2e mock API の reset ハンドラ（`apps/web/playwright/fixtures/auth.ts` の `/__test__/reset` および `mockApi.reset()`）や features barrel export（`apps/web/src/features/admin/components/index.ts` 等）の末尾に、互いに独立な `delete state.*` / `state.* = ...` / `export * from "./..."` 行を追加すると、sync-merge 時に必ず add-add 衝突する。`pnpm sync:resolve` の `UNION_MERGE_TARGETS` は `.ts` ソースを対象外のため `WARN unhandled` で残り、手動 union が必須。

- **L-DEVSYNC-054-A (reset ハンドラ手動 union)**: 状態初期化系の cleanup 行（`delete state.X` / `state.X = default`）は両側を順序保持で並べる。同一 key を両側が触る場合のみ後勝ち判定（リセット後の期待値が壊れていないかを spec の `mockApi.reset()` 直後 assertion で確認）。
- **L-DEVSYNC-054-B (barrel export 手動 union)**: barrel ファイル冒頭の「追記方式厳守（再ソート禁止）」コメントは契約。両側追加の `export *` / `export {}` を順序保持で並べ、dev 側を HEAD 側追加群の前に置く（HEAD が「最後に触った人」になるよう末尾を譲る）。逆順は append-only 契約違反で、後続 feature の git blame ノイズが増える。
- **L-DEVSYNC-054-C (Phase 4 risk 登録)**: e2e mock を伴う feature 仕様の Phase 4 risk table に「reset ハンドラ / barrel への独立 add-add は dev sync-merge で構造的に発生」を登録し、Phase 12 implementation-guide に「手動 union → marker grep 0 → typecheck → lint」の 4 step を必達フローとして明示する。
- **L-DEVSYNC-054-D (resolver 拡張しない理由)**: barrel に `const` / `default export` が混在するファイルで union が破壊的になるため、`sync:resolve` 拡張ではなく **WARN として手動 union を促す現行設計を維持**するのが正。barrel-only `.ts` 限定の自動 union を将来追加する場合は、`export *|export \{` 行がファイル行数の 80% 以上であることを resolver 側の gate にする。

### Anti-pattern

- `git checkout --ours` / `--theirs` で reset ハンドラを片側全採用 → 並列 feature の state 初期化が欠落し、別 spec が test 間状態残留で fail（再現に時間がかかり原因特定困難）
- barrel に並列追加された export をアルファベット順に再ソート → append-only 契約違反、PR diff が肥大化、後続 feature が同じ位置に独立 export を追加した際に再衝突
- `pnpm sync:resolve` が WARN を出した時点で `.ts` をスキップして commit → conflict marker (`<<<<<<<`) が source に残ったまま push、CI で `next build` が SyntaxError で fail

## L-DEVSYNC-052 shell 変更を伴う feature 実装での visual baseline 更新漏れ（dev sync-merge / 2026-05-27）

admin shell topbar/sidebar 統合のような **viewport 寸法を変える feature 実装**で、commit 時に `apps/web/playwright/tests/visual/**.png` の baseline を同時更新しない状態で dev を sync-merge すると、コンフリクトは出ない（sync:resolve 通過）が **post-push の `playwright-smoke / visual` CI ジョブで baseline drift fail** が発生する。これは L-DEVSYNC-051 (sync 時 ours 採用) とは別軸の「実装サイクル内 baseline 同期漏れ」問題。

- **L-DEVSYNC-052-A (実装時 baseline 必達)**: shell / layout / global token を触る Task の Phase 12 implementation-guide には「`apps/web/playwright/tests/visual/<scope>.spec.ts-snapshots/*-linux.png` の更新を同一 commit に含めること」を必達 AC として明記する。`viewport size`・`fullPage` を取る spec は寸法 1px でも drift で fail するため、後追い update は CI redo を強要する。
- **L-DEVSYNC-052-B (CI artifact からの baseline 取得経路)**: ローカルが macOS で `-linux.png` を直接再生成できない場合の正規経路は **失敗 CI run の `playwright-visual-artifacts` artifact (`actual.png`) を `gh run download <run_id> --name playwright-visual-artifacts --dir <tmp>` でダウンロード → `cp <tmp>/visual-<spec>/<spec>-actual.png <repo>/apps/web/playwright/tests/visual/<spec>.spec.ts-snapshots/<spec>-visual-chromium-linux.png`**。Phase 12 runbook にこのコマンド列を一行で記録する。
- **L-DEVSYNC-052-C (sync-merge ≠ 原因の区別)**: post-merge CI fail を「sync の責任」と誤帰責しないために、Phase 4 risk table で「baseline drift は実装 commit 時点での同期漏れが原因。sync-merge は遅延発火のトリガに過ぎない」を明示。L-DEVSYNC-051 (sync 時 ours 採用) と L-DEVSYNC-052 (実装時 baseline 必達) は補完関係。

### Anti-pattern

- shell 変更の commit に PNG 更新を含めず「visual baseline は別 Task で更新する」運用 → sync-merge 後の random CI fail を量産、誰の merge で fail し始めたか git bisect 不能
- CI artifact が手元になく Linux baseline を再生成できないからと test を `test.skip` → 同種 fail を量産、本来の regression 検出能力を喪失
- baseline 更新だけの separate PR を切る → branch 数増加・review 負荷増。**実装と同 PR で完結**が正

## L-DEVSYNC-055 happy-path 再確認: skill indexes 2 件のみの sync-merge は `pnpm sync:resolve` 単独で完結（2026-05-28）

admin-ui task A〜E が連続して dev に merge される現フェーズで、後続 task branch (`feat/admin-ui-task-c-pageheader-token-conformance` ← origin/dev) を sync-merge した際、CONFLICT は `.claude/skills/aiworkflow-requirements/indexes/keywords.json` と `indexes/topic-map.md` の 2 件のみ。`patterns-lessons-and-pitfalls.md` は L-DEVSYNC-046 で `UNION_TARGETS` に正式昇格済みのため、両 branch 末尾 section 追加が auto-merge 通過し CONFLICT に至らなかった。`pnpm sync:resolve` 単独で完結し、source code への手動編集ゼロ。

- **SP-DEVSYNC-055-A (仕様への前提化)**: admin-ui prototype alignment 系の後続 task 仕様書は Phase 4 risk table で「dev sync-merge は skill indexes 2 件のみ・resolver 完結」を default 前提として記載してよい。手動 union 行は実装 task が `apps/web/playwright/fixtures/auth.ts` 等の **WARN unhandled hotspot** に追加行を入れる場合のみ Phase 12 implementation-guide に明記。
- **SP-DEVSYNC-055-B (local mod 事前 commit)**: sync-merge 開始前に `git status --porcelain` で local mod を確認し、Conventional Commits prefix 付きの独立 commit (`chore: include all local changes before sync`) で local 状態を確定する。これは仕様起草段階で Phase 13 PR フロー（`scripts/verify-pr-ready.sh`）の前提を満たすために必須。lefthook の commit-msg gate が `chore:` → `fix(scope):` 等に auto-rewrite するケースがあるため、メッセージ内容より prefix の存在を AC とする。
- **SP-DEVSYNC-055-C (resolver 単独完結の閉路)**: 「CONFLICT 発生 → `pnpm sync:resolve` → marker grep 0 → `git commit --no-edit` → `pnpm typecheck && pnpm lint` green → push」を Phase 13 の sync-merge 工程として定型化。手動 union や Edit が発生したら別 lesson (L-DEVSYNC-054 等) を参照し、resolver 単独完結の閉路を逸脱した理由を Phase 12 implementation-guide に記録する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-055、L-DEVSYNC-046 (UNION_TARGETS 昇格)、L-DEVSYNC-042 (skill indexes union 化)。


## L-DEVSYNC-056 manual-merge: admin page-head primitive 移行と panel showHeading bridging の同時 conflict（2026-05-28）

admin route prototype-alignment 系 branch を `origin/dev` に sync-merge する際、`pnpm sync:resolve` 後に残る手動 conflict は「HEAD 側 branch が inline `<header className="page-head">` で page-local h1 を実装し、dev 側で admin-ui Task C の `AdminPageHeader` primitive + `showHeading?: boolean` prop bridge が完了している」二重発生パターンで固定化する。

- **SP-DEVSYNC-056-A (page.tsx 解消手順を仕様で前提化)**: `apps/web/app/(admin)/admin/<route>/page.tsx` の page-head 系 conflict は **HEAD 側 markup の eyebrow / title / description / breadcrumbs / heading id を逐語抽出 → dev 側の `AdminPageHeader` 呼び出しに全 props として移植**を default 手順とする。description は HEAD 優先（branch 作業意図）、`headingId` は HEAD の h1 `id` をそのまま渡す（L-PGHEAD-001 の id ownership 保持）。wrapper element は dev の `<section className="flex flex-col gap-4">` で統一（admin section 階層では `page-enter stack-lg` を使わない）。
- **SP-DEVSYNC-056-B (Panel 側 showHeading bridging)**: dev 側で Panel に `showHeading` prop が新設されている場合、HEAD 側 section 構造（`stack-lg` + `card card-pad` + filter h2 等）と dev の `showHeading` 条件分岐を **3 項統合**する。`aria-labelledby={showHeading ? "<panel-h-id>" : "<filter-h2-id>"}`、`{showHeading ? <h1>…</h1> : null}` の二段 gating で、page.tsx 側 `showHeading={false}` で二重 h1 抑止しつつ、Panel 単独 render の Vitest test（既定 `showHeading=true`）を温存する。default 値を変更しない（test の breakage 連鎖を避ける）。
- **SP-DEVSYNC-056-C (resolver 拡張対象外として明示)**: page-head 系の HEAD inline markup から props を抽出する変換は context-free な text union では成立しない。`scripts/sync/resolve-skill-merge-conflicts.sh` の `UNION_MERGE_TARGETS` 拡張対象**外**として固定し、本 SSOT で手動手順を維持する。Phase 12 implementation-guide の sync-merge 工程では「resolver 完結を前提とし、page-head / panel conflict は SP-DEVSYNC-056 を参照」と一文記載する。
- **SP-DEVSYNC-056-D (検証ゲートの順序固定)**: `grep marker 0` → `pnpm typecheck`（AdminPageHeader prop 型整合）→ `pnpm lint` → focused Panel component spec（`vitest run <X>Panel.component.spec.tsx`）で h1 / filter h2 / aria-label 両 mode 期待 PASS → commit。typecheck 単独 PASS では panel 側 a11y regression を見逃すため、focused spec の execution を AC に含める。

### Anti-pattern

- HEAD/dev のどちらかを `--ours` / `--theirs` で take する → page.tsx の `AdminPageHeader` import が orphan 化、または panel の `showHeading` 既定値が破壊されて test 連鎖 fail
- Panel 側の `showHeading` default を `false` に変えて回避する → 既存 component spec が `<Panel ... />` 引数省略で render しているため、h1 期待が全件 fail。default は dev 側既定値 `true` を絶対に維持
- `headingId` を渡さずに `AdminPageHeader` の自動 id 採番に任せる → HEAD branch の Playwright spec / aria-labelledby 参照（spec 内 fixed `admin-<x>-h`）が外れ、視認できない regression を生む。HEAD の id 値を必ず props で持ち回る
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-056、L-PGHEAD-001（panel/page-head 二重 h1 抑止）、L-DEVSYNC-055（resolver 単独完結 happy-path）。

## L-DEVSYNC-056 page-local 旧 header を抱えた feature と AdminPageHeader primitive 導入後の dev の hybridize（dev sync-merge / 2026-05-28）

並列 wave で進む admin-ui prototype alignment 系 feature branch が **page-local `page-head` / `Breadcrumb` を抱えたまま**、dev 側で **AdminPageHeader primitive 一斉導入** と **Sidebar の GROUPS/props 化** が行われた状態で sync-merge すると、`.tsx` ソース 3 件で「片側 take すると新 primitive 取り逃しか / 旧画面構造の完全消失」two-way 損失が発生する。`pnpm sync:resolve` は `.tsx` を対象外なので resolver 単独完結せず、手動 hybridize 必須。

- **SP-DEVSYNC-056-A (page hybridize の default 方針)**: page-level の `<header className="page-head">…</header>` × `AdminPageHeader` 衝突は、Phase 12 implementation-guide で **「dev の新 primitive 採用を default、HEAD の richer content を新 primitive の actions/children に注入」** を必達手順に明記する。具体的には HEAD 側の `Breadcrumb` import 削除（AdminPageHeader が `breadcrumbs` prop で吸収）+ wrapper を `<section className="flex flex-col gap-4" aria-labelledby="<headingId>" data-page="...">` に統一 + HEAD が画面から撤去したデータ参照（例: `sections.map`）は dev 側のコードでも除去（build fail 防止）。`data-page` 属性は visual baseline spec が selector に使うので HEAD 側から残す。
- **SP-DEVSYNC-056-B (Sidebar add-add の port 規約)**: Sidebar の 1 字差分（label/href/sortOrder）は dev の GROUPS 構造を **全採用**し、HEAD の差分だけを GROUPS 内 NavItemDef に **後付け移植**する。port は機械的（grep + 単一置換）で済むため Phase 12 で 1 line と明記。`AdminSidebarProps` interface 等の export 化変更は dev 側を全採用。
- **SP-DEVSYNC-056-C (`*.component.spec.tsx` legacy stub の扱い)**: dev 側が `describe(... legacy ...).it.skip(...)` の stub に置換済みの場合、HEAD 側の旧 assertions は実装契約更新で意味を失っているため **dev を無条件 overwrite**。Phase 12 implementation-guide には「replacement spec が同 dir に存在することを `ls apps/web/src/components/<dir>/__tests__/ | grep -i <component>` で確認してから overwrite」を pre-condition として記載。
- **SP-DEVSYNC-056-D (Phase 4 risk への登録)**: admin-ui prototype alignment 系 task の Phase 4 risk table に「同一 wave で primitive 一斉導入が dev 側に着地した場合、page-local 旧 header / Sidebar GROUPS / legacy component.spec の 3 軸で sync-merge 時に hybridize が必須」を必ず登録し、L-DEVSYNC-056 を mitigation reference として参照。resolver 拡張ではなく仕様側で risk 化するのが正（L-DEVSYNC-054 と同じ判断）。
- **SP-DEVSYNC-056-E (検証 4 step 必達)**: hybridize 後の検証は **`git diff --diff-filter=U --name-only` 0 件 → `pnpm typecheck` Done × 全 packages → `pnpm lint` Done × 全 packages → `git commit -m "merge: sync <branch> with dev"`** の 4 step を Phase 12 implementation-guide に明記。typecheck が undefined ref を即 fail させるため、`sections.map` 等の前提変数撤去漏れを早期検出できる。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-056、L-DEVSYNC-054 (`.ts` 手動 union)、L-DEVSYNC-055 (resolver 単独完結 happy-path との対比)。

## Admin sidebar 公開復帰 link 配置 + shared primitive 拡張回避パターン (2026-05-28)

`/admin/*` AdminSidebar から旧 `ホーム` grouped nav を撤去し、footer 直前の `data-role="public-return"` anchor として公開サイト復帰 link を再配置する admin-sidebar-public-return-link タスクで確立した、call-site 1 件の特殊用途を shared primitive に逆流させない設計判断パターン。

- **L-ADMRET-001 (grouped nav → footer 隣接 anchor 移設)**: 公開サイト復帰のような **コンテキスト離脱 link** は GROUPS 配列に含めず、`<aside>` 内 footer 直前の独立 anchor として `data-role="public-return" aria-label="公開サイトに戻る"` で配置する。GROUPS 内に置くと管理 route の isActive 判定と意味的に競合し、strict-mode で「現在地ハイライト」誤検出を招くため Phase 4 risk table で配置先を必ず明示する。
- **L-ADMRET-002 (shared primitive 拡張不採用基準)**: 単一 call site の特殊 prop（`dataRole?: string` 等）のために shared primitive (`AdminSidebarNavItem`) を拡張しない。Phase 12 `unassigned-task-detection.md` で「shared primitive 拡張」候補が出たら **call site 数 ≥ 2 を必達条件**として明示し、1 件なら "Rejected. One dedicated anchor is simpler" と決め打ちで rejected の根拠にする。
- **L-ADMRET-003 (DOM 1-hop 直前 assertion)**: 「`<footer>` の直前」のような relative-order 要件は **`nextElementSibling` の 1-hop 比較** で assertion する。Vitest 側 `expect(link.nextElementSibling?.tagName.toLowerCase()).toBe('footer')`、Playwright 側 CSS adjacent combinator `[data-role=public-return] + footer` を contract 化。`toBeVisible()` 単独や `getAllByRole(...)` の存在チェックは "immediately before" の意味を満たさない。
- **L-ADMRET-004 (implementation_files 明示時の state 早期昇格)**: 仕様書 Phase 5 で `implementation_files` が列挙されているタスクは、同サイクル内で実コード変更が確定した瞬間に `spec_created` → `implemented_local_evidence_captured` へ昇格する。`spec_created` のまま `verify:phase12-compliance` を流すと artifacts.json と Phase 5 evidence の dual-state 矛盾を gate-metadata が検出して reject する。skill-feedback-report 「Template Improvement」節に必達 AC として登録する。
- **L-ADMRET-005 (local Playwright visual fixture で Phase 11 自走)**: admin 単一 component の screenshot evidence は staging deploy を待たず **local Playwright visual fixture spec** で取得し `implemented_local_evidence_captured` まで自走する。`apps/web/playwright/tests/<workflow-slug>.spec.ts` で実 component を mount し、overview/hover/focus 3 state を `outputs/phase-11/screenshots/` に保存。`outputs/phase-11/visual-capture-metadata.json` にビューポート/取得時刻/spec path を残し、raw `test-results/` 配下は frozen 扱いで Phase 12 inventory に含めない。

### Anti-pattern

- 単一 call site の特殊 prop のために shared primitive (`AdminSidebarNavItem`) に optional prop を追加し、無関係な nav item の test surface（spec snapshot, axe scan, isActive 計算）まで再走査を強要する
- 「`<footer>` より前にある」を `toBeVisible()` だけで満たしたとみなし、1-hop 直前検証を省略して後続 primitive 再配置 PR の無自覚 regression を許す
- admin 単一 component の screenshot を staging deploy まで待ち、`implemented_local_runtime_pending` で workflow_state を滞留させる（local fixture で取得可能なら同サイクル内に完結させる）
- 実コード変更が確定した後も `workflow_state: spec_created` のまま Phase 12 closeout を流し、artifacts.json と Phase 5 evidence の dual-state 矛盾を残す
- 参照: [[lessons-learned-admin-sidebar-public-return-link-2026-05]] L-ADMRET-001..005、[[lessons-learned-admin-shell-topbar-sidebar-integration-2026-05]]（sidebar shell 親 pattern）と整合。

## L-PWCO Parent workflow Task 切り出し + auth-view discriminated union 配信パターン（2026-05-28）

親 workflow の単一 Task（本件 `public-header-logged-in-nav-cleanup` Task E）を独立 workflow に切り出し、session-aware UI 配信用の最小基盤を同 cycle で実装するパターン。route group `layout.tsx` の async server component 化 + getter 1 回呼び出し + prop drilling を default 構成とする。

- **L-PWCO-001 (依存最小閉包の同 cycle 実装)**: 親 workflow の Task X を独立 workflow 化する場合、依存基盤（`AuthView` resolver / async adapter 等）の「対象 Task に必要な最小境界」だけを同 cycle で実装する。親 workflow 全体の進行を待たない / 基盤を親で実装するまで `spec_created` 凍結しない。Phase 1 で「親 workflow Task X 独立化」を明示、Phase 5 implementation guide に最小実装範囲を列挙。strict 7 は親（集約）と独立（単一 close-out）の 2 レイヤで両立。
- **L-PWCO-002 (discriminated union literal 固定)**: 権限ごとに表示要素が増減する session-aware UI は、`{ kind: "guest" } | { kind: "member"; profileHref } | { kind: "admin"; profileHref; adminHref }` 形式の discriminated union を default 選択肢にする。admin-only field (`adminHref`) を admin variant のみに置き、`isAdmin: boolean` flat shape を避ける。href 値も union field に持たせ、call site で template literal を避ける。静的 grep gate (`rg 'kind: "admin"'`) で全 caller を即時検出可能にする。
- **L-PWCO-003 (`data-<state>` DOM 属性 contract)**: session/state 切替 UI には primitive component に `data-<state-key>` 属性（例 `data-auth-state="member"|"admin"`）を 1 つ用意し、Playwright / Vitest spec は **属性値で assertion する**。TypeScript type を test に import すると union rename で test だけ型エラー化するため、DOM attribute string を contract として固定。属性値リテラルは changelog / inventory に明記して将来の rename を防ぐ。
- **L-PWCO-004 (route group `layout.tsx` async 化 + getter 1 回呼び出し)**: session を 2 箇所以上で必要とする route group は、route group 直下 `layout.tsx` を async server component 化し、`getAuthView()` / `getSession()` 等の getter を **1 回だけ**呼び、子 component へ prop で配信する。child / page 側で getter 再呼び出しを禁止（N+1 binding cold path 防止 / request-scope cache 相当の保証）。child の prop は optional + default で test injection を props 経由に統一。
- **L-PWCO-005 (async adapter は fail-closed guest fallback)**: `getAuthView()` 等の auth resolver adapter は内部で getter throw を try/catch し、最小権限（`{ kind: "guest" }` 等）を返す fail-closed 契約にする。layout 側で握り潰さないことで `app/error.tsx` boundary を保ち、後段 middleware の 401/302 gate で UX 破綻を回避（invariant fail-closed と整合）。
- **L-PWCO-006 (resolver / adapter / consumer の 3 spec 分離)**: discriminated union × server component prop drilling の test は「pure resolver spec」「async adapter spec（getter mock × throw 時 fallback）」「consumer render spec（`authView` injection × `data-*` 属性 assertion）」の 3 focused Vitest 構成を default にする。1 spec 5〜10 test に収め、回帰時の責務切り分けを spec name で即可能にする。

### Anti-pattern

- 親 workflow の進行待ちで独立 workflow を `spec_created` 凍結 → blocker chain で Phase 11 evidence rot
- `isAdmin: boolean` flat prop + 別 href prop → 「admin だが href 未指定」型違反を補足できずランタイム undefined deref
- consumer 側で `getAuthView()` 直接呼び出し → server/client 境界の暗黙化、test の getter mock 強要、N+1 binding cold path
- DOM 属性ではなく TypeScript type export を test に import → UI 契約と test 契約の二重管理、union rename で test だけ型エラー
- async adapter throw を layout で try/catch して握り潰し → error boundary 機能不全、middleware redirect も発火せず空白画面化

参照: [[lessons-learned-member-header-admin-link-2026-05]] L-MHAL-001..006、[[lessons-learned-public-header-session-aware-auth-view-base-2026-05]] L-PHSAV-001..005（`AuthView` 基盤側の対）、`docs/00-getting-started-manual/specs/02-auth.md` `AuthView` / `MemberHeader` admin CTA 接続契約。

## L-PARSUB-001..006 parent + sub-workflow 構造での Phase 12 strict 7 集約と verifier 整合パターン（2026-05-28 / members-list-ux-clarity 由来）

`docs/30-workflows/<workflow>/tasks/<task-id>/` 形式で sub-task を切る workflow では、Phase 12 strict 7 を親 root へ集約しても sub-task root に `index.md` / `artifacts.json` がある限り `verify:phase12-compliance` は sub-task を独立 root として扱う。集約方針と verifier 実装の乖離を吸収する標準パターンとして固定する。

- **L-PARSUB-001 (sub-task 側 compliance-check 必達)**: sub-task root にも `outputs/phase-12/phase12-task-spec-compliance-check.md` を canonical 9 heading 準拠で配置すること。Phase 12 strict 7 行は `status=n/a (parent root 集約)`、自身の compliance-check 行のみ `status=present` とする。本ファイル不在で `missing-file` reject される。
- **L-PARSUB-002 (Phase 11 evidence status enum 固定)**: Phase 11 evidence inventory の Status 列は `present` / `pending` / `n/a` の 3 値固定（`scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` の `VALID_STATUSES`）。`present: 24 PNGs` 等の自由記述は `invalid status` で reject される。件数・注釈は Classification か Path 列に書く。
- **L-PARSUB-003 (Phase 11 evidence path = workflow root 配下の file)**: Path はディレクトリ不可・workflow root 配下の物理ファイル必須。`..` で root 外に抜けるパスも reject。sub-task から親 evidence を参照したい場合は `status=n/a` で path 検査を skip させる。代表 PNG 1 枚を Path に書いて `status=present` でも可。
- **L-PARSUB-004 (sub-task 側 Phase 12 strict 7 表記)**: sub-task `phase12-task-spec-compliance-check.md` の §5 は parent root 集約済の 6 ファイルを `status=n/a (parent root 集約)`、自身の compliance-check を `status=present` で表す。Path は workflow root からの相対（`outputs/phase-12/...`）で書き、`..` で抜けない。
- **L-PARSUB-005 (artifact-inventory に Lessons Learned 節)**: 親 workflow 用 `workflow-<name>-artifact-inventory.md` には `## Lessons Learned` 節を必ず設け、L-<short>-001..NNN 形式で named lesson を記録する。inventory の存在＝同 wave 同期完了の signal にする。
- **L-PARSUB-006 (unassigned-task spec の併合移動)**: workflow を `completed-tasks/` へ移動する際、`docs/30-workflows/unassigned-task/` 配下の関連 follow-up spec も `completed-tasks/<workflow>/unassigned-task-specs/` へ移動し、`outputs/phase-12/unassigned-task-detection.md` の path を sed 補修する。`docs/30-workflows/unassigned-task/` は active staging 用。

### Anti-pattern

- 集約方針を理由に sub-task の compliance-check を省略 → `verify:phase12-compliance` が `missing-file` で fail し、CI gate 通過不能。
- Phase 11 evidence の Status に件数や注釈を併記（`present: 24 PNGs` 等）→ `invalid status` reject。Status は 3 値 enum 固定。
- sub-task から `../../../../outputs/phase-11/` のような root 外 path を `status=present` で書く → path traversal で reject。`n/a` 化するか root 内 file に差し替える。
- workflow を completed-tasks へ移動しても unassigned-task spec を `docs/30-workflows/unassigned-task/` に残置 → 親 detection report の path が stale 化し、close-out の正本順位が破綻する。


## async server component prop 配線パターン（auth-aware public surface / 2026-05-28）

Next.js App Router で公開層 (`/`, `/(public)/*`) の auth-state 出し分けを行う component を **async server component** 化する際の汎用パターン。Task B (`task-b-root-page-public-header-async`) で確立した L-TBPHA-001..005 を仕様起草フェーズに横展開する形で汎化する。

- **L-ASCPROP-001 (auth source 集約 helper)**: 各 layout / page から `getSession()` を直接呼ばず、`apps/web/src/lib/auth-view/getAuthView()` のような **discriminated union (`guest | member | admin`) を返す helper** を 1 層挟む。auth-aware component は async server component かつ props 配線のみで mount し、認可ロジックを再解釈する責務を持たせない。Phase 2 設計で「auth source helper の有無」を必達 design AC として明示する。
- **L-ASCPROP-002 (route group 外 entry の同時更新)**: 公開 component を async 化する Task は、その component を mount している **全 server entry を `rg "<ComponentName" apps/web/app` で grep 列挙**し、route group 内外で wiring を統一する。route 移動 (`app/page.tsx` → `app/(public)/page.tsx`) は `generateMetadata` / OG / canonical URL の再評価が必要になるため default では **route 不動 + 1 await 追加** を採用。Phase 4 risk table に「route group 外 entry の取りこぼし」を必ず登録。
- **L-ASCPROP-003 (NON_VISUAL evidence セット)**: visual screenshot を取らない workflow では (a) `app/__tests__/<entry>.spec.tsx` で `vi.mock` による auth-state 2-3 ケース assert、(b) Phase 11 `static-source-guard.log` で **無 props mount の絶滅 grep**、(c) `data-auth-state="guest|member|admin"` 属性を component root に焼き込んだ DOM 確認 — の 3 点セットを Phase 11 evidence の必達 AC とする。`viewport` 寸法 / Linux baseline PNG は対象外。
- **L-ASCPROP-004 (auth helper の fail-closed)**: 認証取得 helper は `getSession()` throw を `try/catch` で **guest fallback** に閉じ、SSR 全体を 500 に巻き込まない。CLAUDE.md invariant #11 (`getAuthEnv()` safeParse fail-closed) と同じ思想で、fail-closed は認証境界のみ・データ fetch 等の business path では fail-fast を維持する。Phase 2 設計で「helper 内 catch の対象は session 取得のみ」を境界として明記。
- **L-ASCPROP-005 (parent + sub-task の同期境界)**: parent workflow が `spec_created`、sub-task が先行 implementation の場合、`system-spec-update-summary.md` の Step 1-A 同期範囲は **parent index.md の対象 task 行のみ**。parent 全体の workflow_state には触らない。境界宣言を `system-spec-update-summary.md` 末尾「親 workflow 境界」節に明記しておくと、後続 sub-task の close-out で同じ判断を機械的に再現できる。

### Anti-pattern

- 各 layout / page で個別に `getSession()` を呼び、admin 判定 / `profileHref` 等を再計算する → 認可ルール変更で全箇所を再編集する hidden coupling
- async 化対象 component の mount 箇所を grep せずに進める → route group 外の root page で型・実行両面で break
- async 化に伴って route 移動 (`app/page.tsx` → `app/(public)/page.tsx`) を default 採用 → SEO/metadata 影響で本来不要な追加 risk
- `getSession()` throw を握り潰さず SSR 全体に伝播 → guest 訪問で 500 / `app/error.tsx` boundary に押し込む過剰反応

- 参照: [[lessons-learned-task-b-root-page-public-header-async-2026-05]] L-TBPHA-001..005、CLAUDE.md invariant #11 (env fail-closed parity)、`patterns-ui-type-auth.md` (UI 層 auth type design)。


## L-DEVSYNC-057 add-add semantic conflict（両 branch が同 Server Component に safe-fetch + SectionError を独立追加）の branch-owning take パターン（dev sync-merge / 2026-05-28）

- 事象: `fix/login-stale-link-and-profile-me-safefetch` ← `origin/dev` で `apps/web/app/(member)/profile/page.tsx` と `page.spec.tsx` が両側 add-add semantic conflict。両 branch が `safeServerFetch(() => fetchAuthed<MeSessionResponse>("/me"))` ラップ + `if (!meResult.ok)` 早期 return + SectionError 降格を**同方向に**独立追加し、差分は変数型注釈と error title 文字列の 2 点のみ。L-DEVSYNC-056 と異なり構造採用ではなく「branch 責務 (responsibility) に合致する文言/型を持つ側」を一括 take する。
- **SP-DEVSYNC-057-A (構造同一の判定)**: add-add conflict は最初に `git diff :2:<path> :3:<path>` で両 hunk の構造差分のみを抽出。構造が完全同一で差分が文字列/型注釈のみなら hybridize 不要で **branch-owning side を `git checkout --ours`/`--theirs` で一括 take** する。Phase 12 implementation-guide の「sync-merge コンフリクト解消手順」にこの判定を分岐の先頭に置く。
- **SP-DEVSYNC-057-B (branch 責務の機械判定)**: 「どちらが ours か」は `git log --oneline <merge-base>..HEAD -- <path>` のコミットメッセージ主語（`fix(profile)`, `fix(login,profile)` 等）と branch slug の prefix を照合して判定。本ケースでは branch slug `fix/login-stale-link-and-profile-me-safefetch` と commit `fix(login,profile): … /profile /me fetch safe wrap` が一致するため HEAD = branch-owning。Phase 12 implementation-guide に「ours 判定根拠 (commit hash + message)」を 1 行記録。
- **SP-DEVSYNC-057-C (page + spec の pair 同期)**: page.tsx の error title 文字列を ours に揃えたら、`page.spec.tsx` の assert 文字列も**必ず同じ ours 側**を採用する。文字列が page と spec で食い違うと test fail で post-push CI が落ちるため、conflict 解消時に「pair 一致」を 1 行 checklist として明示する。grep 検証: `grep -F "<採用文字列>" apps/web/app/<route>/page.tsx apps/web/app/<route>/page.spec.tsx` で両方 hit すること。
- **SP-DEVSYNC-057-D (resolver 化不適の根拠)**: branch context (slug / commit message) を要する判定なので `pnpm sync:resolve` への拡張は不適切（L-DEVSYNC-054 と同様）。Phase 4 risk table に「`/profile`・`/login`・admin section root などの Server Component error boundary 強化が wave 並列で進む期間は add-add semantic conflict が頻発する」を登録し、本 lesson を mitigation reference として参照する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-057、L-DEVSYNC-056 (structural primitive 採用との対比)、L-DEVSYNC-054 (`.ts` 手動 union との対比)。


## L-DEVSYNC-058 同一 page を両 branch が独立に prototype 整合した結果の 2-way feature × modernization hybridize（dev sync-merge / 2026-05-28）

同じ admin page を **HEAD は feature 拡張軸**（dynamic description / Pagination primitive / barrel import / `density="compact"`）で、**dev は admin-ui modernization 軸**（`eyebrow` / breadcrumbs `href` / token CSS vars / EmptyState icon / `data-route` attrs / `<Link>` 化）で独立に prototype 整合した状態で sync-merge すると、片側 take では feature か visual baseline のどちらかが消える 2-way 損失が発生する。L-DEVSYNC-056 の subtype だが「dev が同じ page を別軸で modernize」している点が異なり、機械化（resolver / `--ours + patch`）の ROI が低く lesson + Phase 4 risk が正。

- **SP-DEVSYNC-058-A (import 経路の SSOT)**: `AdminPageHeader` は features/admin/components の barrel から import を **default** とする。Phase 12 implementation-guide で `_layout/AdminPageHeader` 直 import は redundant として撤去する旨を明記。
- **SP-DEVSYNC-058-B (wrapper attrs hybrid)**: dev 側の `data-route="admin"` + `data-section-rhythm="compact"`（visual baseline spec の selector）は **必ず採用**。HEAD 側の `aria-labelledby` + 独立 `sr-only h1` は AdminPageHeader 内蔵 `<h1>` と二重化するため **撤去**。Phase 4 risk に「page-local sr-only h1 と primitive 内蔵 h1 の二重化」を登録。
- **SP-DEVSYNC-058-C (AdminPageHeader props の axes 統合)**: dev の `eyebrow` + breadcrumbs `[{label:"管理",href:"/admin"},{label:"<page>"}]` を採用しつつ、HEAD の dynamic `description`（`result.ok ? \`<件数> 件\` : "失敗"`）を後付けマージ。両 axes が併存する prop 構造であることを Phase 4 で確認する pre-condition を明記。
- **SP-DEVSYNC-058-D (EmptyState / SectionCard / list の使い分け)**: `EmptyState` は dev の icon + `className="admin-empty-state"` variant 採用（icon-less だと visual baseline が別 selector path に分岐）。`AdminSectionCard density="compact"` + 説明文は HEAD（feature spec AC）採用。`<ul>` class は IdentityConflictRow が card-like primitive なら `flex flex-col gap-3 aria-label=...` を選び `divide-y` は二重 border 防止で撤去。Phase 12 implementation-guide に「card primitive と divide-y list の混在禁止」を明記。
- **SP-DEVSYNC-058-E (Pagination primitive 全採用)**: `Pagination` primitive がある場合は dev の手書き `<Link>` を撤去し HEAD の primitive を全採用。Phase 12 で「prev/next 両方 primitive 内蔵 → 二重化禁止」を明記。
- **SP-DEVSYNC-058-F (Phase 4 risk への登録)**: admin-ui prototype alignment 系 task の Phase 4 risk に「同一 page を両 branch が異軸で prototype 整合した場合、import 経路 / wrapper attrs / primitive props axes / EmptyState variant / list pattern / Pagination の 6 軸で hybridize 必須」を登録し、L-DEVSYNC-058 を mitigation reference として参照。
- **SP-DEVSYNC-058-G (検証 4 step)**: L-DEVSYNC-056 と同じ `git diff --diff-filter=U --name-only` 0 件 → `pnpm typecheck` 全 packages → `pnpm lint` 全 packages → `git commit -m "merge: sync <branch> with dev"` の 4 step を Phase 12 implementation-guide に明記。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-058、L-DEVSYNC-056 (single-side primitive 移行 hybridize)、L-DEVSYNC-046 (UNION_TARGETS)。

## L-USHELL 複数 route group を 1 共通 server shell へ統合するパターン（unified-sidebar-shell / 2026-05）

公開 / 会員 / 管理の 3 route group を独立 shell ではなく共通 `SidebarShell`（role-driven server shell）へ統合する実装パターン。詳細 lesson は [[lessons-learned-unified-sidebar-shell-2026-05]] L-USHELL-001..006。

- **SP-USHELL-A (role 一本化 + fail-closed)**: role 判定は server boundary（`SidebarShellServer`）の `getSession().isAdmin` 1 箇所。throw 時は最小権限 role（viewer）へ fail-closed。各 layout は guard + shell 呼び出しに縮約する。
- **SP-USHELL-B (active は client、server activePath 配線禁止)**: nav active は client `usePathname()` で完結。server から `activePath` prop を配線する設計は、middleware の header 注入（`x-pathname`）とセットでない限り dead code（prop が destructure されず・header も注入されず二重に無意味）。配線追加前に「prop が読まれるか / header が注入されるか」を Phase 4 で確認する。
- **SP-USHELL-C (Playwright anonymous fixture の mockApi)**: auth fixture の anonymous role は mock API を起動しないことがある。public ページを開く anonymous spec は `{ anonymousPage, mockApi }` + `void mockApi` で明示起動する。「手動で mock API を別起動して green」を fixture 完備と誤認しない（CI / 標準実行で落ちる）。
- **SP-USHELL-D (N layout 一括改修の spec 網羅)**: 複数 layout を async server component 化する際は N 個すべての layout spec を `await Layout({children})` → render パターンへ追従させる。dead mock（`vi.mock("next/headers")` 等）も同 wave で除去。1 つの追従漏れは CI で初めて露見する。
- **SP-USHELL-E (削除 + route 移動の spec dangling 同 wave 解消)**: コンポーネント削除（PublicHeader / MemberHeader / AdminSidebar）+ route group 移動を伴う実装は `grep -rn "<削除名>" docs/00-getting-started-manual/specs/` で現行仕様書 dangling を検出し同 wave で解消する。`completed-tasks/**` 等の履歴参照は触らない。
- **anti-pattern**: (1) layer ごとに shell を複製（role-driven 1 shell へ集約すべき）、(2) 使われない server prop の配線、(3) anonymous spec の mockApi 省略、(4) 一括改修での spec 追従漏れ、(5) 実装だけ更新し仕様書 dangling を放置。

## L-DEVSYNC-059 detached HEAD で working-tree に WIP を抱えた状態で dev sync-merge する場合の手順（dev sync-merge / 2026-05-28）

`git worktree add <path> <commit>` で commit 指定 worktree を作成した結果 detached HEAD のまま実装が進み、`branch-sync-and-push` プロンプト時に push 不可かつ `git merge dev` が「local changes would be overwritten」で abort するケース。WIP を捨てずに feature branch を切り、hook 連鎖を 3 commit に分けて吸収してから `pnpm sync:resolve` 経路に乗せる happy-path 救済手順。

- **SP-DEVSYNC-059-A (検出 gate)**: Phase 0 pre-flight で `git branch --show-current` が空文字を返した時点で必ず `git checkout -b feat/<workflow-name>` を発行する。Phase 12 implementation-guide に「detached HEAD 検出時の branch 切り出し手順」を明記し、`branch-sync-and-push` プロンプトの自律スコープ確定（ルール A）が一意に決まる前提を満たす。
- **SP-DEVSYNC-059-B (3 commit 反復)**: pre-commit hook（`block-stable-key-update` 等）が後追いで inventory / lessons / `indexes:rebuild` 差分を生成する場合、1 回の `git add -A && git commit` では収まらない。Phase 12 implementation-guide に「実装本体 → hook 生成の inventory+lessons → indexes 再計算差分」の 3 commit 反復を明記し、各サイクル後に `git status --porcelain | wc -l` が 0 になることを次サイクル進入の pre-condition とする。
- **SP-DEVSYNC-059-C (stash 禁止)**: WIP 退避目的の `git stash` は CONST_003（stash は WT 間共有のため順次・並列禁止）と branch-sync-and-push CONST_019（全変更包含）に抵触する。Phase 4 risk に「detached HEAD + WIP の救済で stash を使うと WT 間副作用が発生する」を登録し、commit 経路に一本化する。
- **SP-DEVSYNC-059-D (`--no-verify` 禁止)**: merge / commit 失敗時に `--no-verify` で hooks を skip する誘惑が出るが、CLAUDE.md「--no-verify の使用は引き続き避け、hook が誤検知する場合は本セクションの方針に沿って hook 自体を改善すること」に反する。Phase 12 implementation-guide で `--no-verify` 禁止を明示し、未コミット変更を SP-DEVSYNC-059-B の 3 commit 反復で処理してから再 `git merge dev` する経路を SSOT とする。
- **SP-DEVSYNC-059-E (検証 4 step)**: `pnpm sync:resolve` 後は L-DEVSYNC-056 と同じ `git diff --diff-filter=U --name-only` 0 件 → `git commit --no-edit`（merge commit、pre-commit hooks 通過）→ `pnpm typecheck` 全 packages → `pnpm lint` 全 packages の 4 step を Phase 12 implementation-guide に明記。今回 2026-05-28 task-c 検証では `.tsx` conflict なし、skill index 2 ファイル（`keywords.json` `--ours+rebuild` / `topic-map.md` union）のみで L-DEVSYNC-055 happy-path 経路と同一。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-059、L-DEVSYNC-055 (skill indexes 2 件 happy-path)、L-DEVSYNC-054 (auth.ts / barrel 並列追加)、CONST_003 (stash 順次・並列禁止)、CONST_019 (全変更包含)。


## Parent-task promotion + DOM auth-slot 検証パターン（2026-05-28）

親 workflow が確立する DOM 契約（`data-auth-state` / `data-role` 系の literal slot 属性）を、横断検証する dependent task が「7+ routes × 3+ states × regression 4+ = 21+ TC」を抱えるとき、親と同一 phase output に同居させると Phase 11 evidence ledger / Gate-A 承認単位 / Phase 12 strict 7 の境界が壊れる。本パターンは「dependent task を独立 workflow に昇格し、契約 owner と検証 owner を 2 workflow に分離する」 + 「3 状態 storageState を setup project + `dependencies` で一括生成する」 + 「DOM literal を型レベルと assertion 両輪で固定する」を組み合わせる。`public-header-auth-slot-e2e` (2026-05-28) が初出。

- **L-PARENTPROMO-001 (昇格判定 3-of-2)**: dependent task の昇格判定は (a) 親実装と独立に test 追加で価値が出る (b) TC 表が親 phase-4 を圧迫する (c) CI matrix 追加が必要、の 3 軸で 2 つ以上 yes なら独立 workflow 化する。spec の Phase 1 §1.X に `parent_workflow:` フィールドで親をリンクし、親側 system-spec-update-summary には `verification_owner:` で子をリンクする双方向参照を必達 AC とする。
- **L-AUTHSLOT-001 (storageState 一括生成)**: 3+ 状態の auth を持つ e2e は `setup-auth.spec.ts` を独立 project にし、Playwright `projects[i].dependencies: ['setup-auth']` で起動順を固定。`playwright/.auth/{state}.json` を `.gitignore` し CI でも setup project から毎回再生成。spec 内 login を禁止する gate を Phase 4 test plan に書く。
- **L-AUTHSLOT-002 (DOM literal 型レベル固定)**: `data-auth-state` などの slot 属性 literal は `type AuthView = 'guest' | 'member' | 'admin'` の単一定義を resolver / consumer / spec の Expectation で共有。spec 側は `Expectation = AuthView | 'redirect'` で TC 表を型付けし、`toHaveAttribute('data-auth-state', expected)` で DOM assertion を打つ。Phase 2 design で「type SSOT path」と「consumer / spec の import 経路」を 1 表に集約する。
- **L-AUTHSLOT-003 (redirect 期待の regex 整合)**: 未認証 redirect 先が middleware / server guard で query 差を持つ場合、assertion は `expect(page).toHaveURL(/\/login(\?|$)/)` で path prefix + regex 化し、query は許容。Phase 4 test plan に「redirect 期待は path prefix + regex で書く」を AC として明記し、middleware 側の redirect 先は単一 query (`?gate=...`) に閉じて 403 直返しを撤去する。
- **L-AUTHSLOT-004 (CI matrix 非破壊追加)**: 新 e2e job は `needs: <既存 smoke>` で起動順固定、`if: github.event_name != 'schedule'` で schedule trigger 除外、`timeout-minutes: 15` で上限明示。`playwright.config.ts` の既存 project に `testIgnore` を both-or-none preflight で対称追加し、`playwright test --list` で二重実行ゼロを検証する。
- **L-AUTHSLOT-005 (TC 名 grepability)**: ROUTES 配列を `{ path, expect: Record<State, Expectation> }` でDRY化しつつ、`test('${state} viewing ${path}', ...)` でTC名を生成。CI fail時のprimary lookup keyを保持し、Phase 4 test planのTC IDとtemplateを同waveで更新するルールをspec内コメントに残す。

### Anti-pattern

- 親 workflow Task G として e2e 21+ TC を抱え込み、親側 Phase 11 evidence ledger と artifacts.json gate を圧迫 → Gate-A 承認単位が曖昧化、`completed-tasks/` 移動の境界が壊れる
- spec 内で個別 login 呼び出しを書き散らし、login API 変更で全 spec を直す → storageState 一括生成パターンを取り入れず、CI 時間と保守コストが線形増
- `data-auth-state` を `string` で受けて typo を CI で検出できない → 型 SSOT 不在で prod DOM 契約が静かに壊れる
- redirect 期待を完全一致文字列で書き、middleware/server guard の経路差で flaky → regex 化を怠ると経路統合の自由度を失う

参照: [[lessons-learned-public-header-auth-slot-e2e-2026-05]] L-AUTHSL-001..006、aiworkflow-requirements `references/workflow-public-header-auth-slot-e2e-artifact-inventory.md` Lessons Learned 節。


## L-WWSL Worker bundle size-budget regression-gate パターン（implementation / 2026-05-29）

Cloudflare Workers 無料プランの Worker bundle gzip 3072KiB 上限超過（`[code: 10027]` で deploy fail）のような「無料プランのリソース上限超過 fix」型 implementation task の汎化。`web-worker-size-limit-fix`（3316KiB > 3072KiB）で抽出。除去（Task A）と再発防止 gate（Task B）の dual-task 分割が定型化できる。

- **L-WWSL-001（spec-only close 禁止の一般化）**: implementation task が具体的な code target（肥大化依存の特定ファイル等）を持つ場合、制約根拠が確定していても spec-only / docs-only で close しない。同サイクルで安全に実装できる範囲は実装まで完遂し `implemented_local_evidence_captured` とする。Phase 1 で task_type=implementation かつ concrete target ありなら Phase 5 実装を必須 gate に置く。
- **L-WWSL-002（adapter/library config key は install 済み型定義で検証）**: 「効きそうな」config key（例: OpenNext の `minify`）を推測で spec に書かない。`node -e \"require.resolve\"` / 型定義 grep で実在を確認してから remediation に採用する。存在しない key は無効設定として regression spec で禁止 assert を入れる。
- **L-WWSL-003（重量依存の除去 + 静的 fallback を第一選択）**: リソース上限が支配的制約のとき、wasm/font を bundle へ焼き込む重量依存（`next/og` 等）は依存撤去 + 静的 asset fallback を優先する。implementation-guide の Part2 に「size-budget 表（依存名 / 焼き込み KB / 削減後 KB）」を必須セクション化すると再現性が上がる。
- **L-WWSL-004（計測対象の正確な特定 + 閾値の単一 SSOT）**: size gate の計測対象を正確に特定する（OpenNext では bootstrap `worker.js` ではなく `server-functions/.../handler.mjs`）。閾値（hard / warn）は計測 script・CI workflow・正本 spec・implementation-guide で必ず一致させ、ドリフトを禁止する。
- **L-WWSL-005（dual-task: 除去 + 再発防止 gate）**: 「肥大化原因の依存撤去（Task A）」と「CI に bundle-budget regression gate 新設（Task B）」を 2 サブタスクに分割し、両 deploy job（staging/production）の build 後・deploy 前に gate を挿入する。除去だけで close せず再太り検知を必ず同梱する。

anti-pattern:
- ❌ 制約根拠が確定済みなのに実装可能な fix を spec-only で先送り。
- ❌ 存在しない adapter config key を推測で追加。
- ❌ 計測対象を bootstrap に当てて軽量と誤判定。
- ❌ 閾値を script だけに書き spec/ドキュメントへ未同期（ドリフト）。
- ❌ 依存撤去のみで再発防止 CI gate を入れずに close。

- 参照: [[web-worker-size-limit-fix]] L-WWSL-001..004、[[workflow-web-worker-size-limit-fix-artifact-inventory]]、[[deployment-cloudflare-opennext-workers]]。


## 届いているデータの rendering-only list enrichment パターン（issue-981 / 2026-05-29）

upstream data layer（別 issue / 別 task が既に実装済の API + zod schema）が **prop まで値を供給しているのに UI が描画していない**「rendering-only gap」を埋めるタスクの汎化。一覧テーブル row に既存 response fields（occupation / zone / membership type / tags 等）を表示する典型。API/schema/D1 を一切触らず UI 描画 + focused component spec + local visual で閉じる。

- **L-RENDGAP-001 (gap の層判定を Phase 2 の最初の分岐に置く)**: 「一覧に値が出ない」を受けたら、まず data が UI prop（list view type / item zod）まで届いているかを確認する。届いていれば本タスクは **rendering-only** で、API / schema / D1 / shared を boundary 外として Phase 1 で固定する。届いていなければ data-layer task（別 issue）であり責務が異なる。この層判定を誤ると不要な endpoint / migration 追加（D1 直接アクセス禁止・API 境界 invariant 違反）を招く。Phase 2 design の冒頭に「prop に値が来ているか」分岐を必須化する。

- **L-RENDGAP-002 (既存 primitive / tone helper の再利用・新規生成禁止)**: chip / badge / tone 表現は既存 UI primitive（`Chip` 等）と既存 tone helper（`zoneTone` / `statusTone` 等の `lib/tones`）を再利用し、新規 component / 新規 tone map を生やさない（UI prototype alignment「新規 primitive を生やさない」invariant）。tone helper が未知値を安全な既定 tone に落とす設計なら、enum 化されていない自由入力値でも fallback が効く。Phase 2 で「再利用する既存 primitive / helper の import 元」を列挙する。

- **L-RENDGAP-003 (optional field は「非描画」と「明示 fallback」を使い分ける)**: optional な enrichment field の描画は 2 系統に分ける。(a) 値が無ければ要素ごと描画しない（空 chip / 空行を作らない）── 値の有無が運用上の意味を持たないフィールド（職業・区画等）。(b) 空を明示 fallback chip で示す（例: tags 空 → `未タグ` warning chip）── 「未設定」自体が運用シグナルのフィールド。どちらを選ぶかを Phase 4 test plan で TC（充足行 / 部分欠損行 / 完全空行）に分解する。

- **L-RENDGAP-004 (overflow 集約と tooltip の pass-through 制約)**: 多値フィールド（tags 等）は `slice(0, N)` で上限表示し残りを `+M` に集約。全件は wrapper `<span title="...">` の tooltip で確認可能にする。`title` を集約 chip 自体でなく wrapper に置くのは、primitive が `title` を pass-through しない設計のため。component spec で `+M` の `title` 文字列と overflow 件数境界（N 件=集約なし / N+1 件=`+1`）を固定 assert する。

- **L-RENDGAP-005 (enrichment component の TC granularity と混在行 a11y)**: list row enrichment の component spec は充足行だけでなく **部分欠損の組合せ**を網羅する（field 単独欠損、多値 0/N/N+1 件境界、falsy 値、既存 state chip との共存）。さらに「一部 enriched / 一部空」の混在行を 1 TC として a11y 検証すると、条件描画の取りこぼし（空要素の role 残留・重複 label 等）を検出できる。

- **anti-pattern**:
  1. data が prop に来ているのに endpoint / migration を追加してしまう（rendering-only を data-layer task と誤判定）。
  2. 既存 tone helper があるのに描画箇所で色分岐をベタ書きする / 新規 chip component を作る。
  3. optional field を全て同じ描画にし、「未設定が運用シグナルのフィールド」の空 fallback を省く。
  4. overflow tooltip を pass-through しない primitive に直接 `title` を渡して効かない（wrapper に置くべき）。
  5. 充足行だけ TC を書き、部分欠損・境界・混在行 a11y を網羅せず条件描画バグを見逃す。
- 参照: aiworkflow-requirements [[lessons-learned-issue-981-admin-members-table-list-enrichment-2026-05]] L-I981-001..006。


## L-DEVSYNC-061 skill-only conflict shape の再現 — resolver 単独完結 happy-path（dev sync-merge / 2026-05-29）

> 採番補正: 当初 L-DEVSYNC-060 として追加されたが aiworkflow 側 L-DEVSYNC-060（`patterns-lessons-and-pitfalls.md union 対象`）と ID 衝突していたため 061 へ採番ずらし（aiworkflow [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-062 留意と同期）。

- 事象: `feat/members-list-ux-clarity` ← `origin/dev` (HEAD `746721996`) sync-merge で発生したコンフリクトが skill md 2 件 (`aiworkflow-requirements/indexes/topic-map.md`, `task-specification-creator/references/patterns-lessons-and-pitfalls.md`) + derived 1 件 (`aiworkflow-requirements/indexes/keywords.json`) のみ。`.ts/.tsx` page-level の手動 hybridize は 0 件で、L-DEVSYNC-055 / L-DEVSYNC-059 と同型 shape の再現確認。
- Why: feature 改修範囲（public members list の UX 整合）と dev 7 commits（admin-ui 系 + google-form-reflection + dev-sync skill 反映）の path 重複が skill 索引行と patterns-lessons 追記行のみで、resolver 対象範囲に完全一致するため。
- How to apply:
  - **SP-DEVSYNC-060-A (resolver 単発判定)**: `git ls-files -u` 列挙が `pnpm sync:resolve` 対象（SKILL.md / indexes md / task-workflow-active.md / keywords.json）に閉じている場合は resolver 単発で完結し、L-DEVSYNC-056/058 の手動 hybridize lesson は invoke しない（不要複雑性回避）。
  - **SP-DEVSYNC-060-B (sync-merge hook policy)**: CLAUDE.md `## sync-merge (main 取り込み) 時の hook 挙動` に従い `MERGE_HEAD` 検出時の `staged-task-dir-guard` / `coverage-guard` は自動スキップされる → sync-merge commit に `--no-verify` を付けない（付けても害は出ないが CONST_017 ポリシー違反になる）。
  - **SP-DEVSYNC-060-C (検証 4 step)**: `git ls-files -u | wc -l` = 0 → `git commit -m "merge: sync <branch> with dev"` → `pnpm typecheck` 6 packages Done → `pnpm lint` Done × 全 packages。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-061、L-DEVSYNC-059 (skill-only shape の前回確認)、L-DEVSYNC-055 (resolver 単独完結 happy-path)。


## L-DEVSYNC-062 dev が ancestor の re-sync は no-op — merge 前の `--is-ancestor` ガードを Phase 12 検証に明記（dev sync-merge / 2026-05-29）

- 事象: `feat/public-header-logged-in-nav-cleanup-pr-20260528` の 2 度目の `origin/dev` 同期で、前回 sync-merge commit に dev が既に取り込まれていたため `git merge dev` = `Already up to date.`（conflict 0 / resolver 不要 / merge commit 新規作成なし）。push 未済 2 commit のみ push。
- Why: 複数回 `merge: sync ... with dev` が積まれた feature branch では、`origin/dev` が進んでいても差分が既存 merge commit に内包済みのことがあり、2 度目の merge は何もしない。
- How to apply:
  - **SP-DEVSYNC-062-A (ancestor ガード)**: sync-merge task の Phase 12 implementation-guide / 検証手順に「`git merge` 実行前に `git merge-base --is-ancestor dev HEAD` を実行し、ancestor 確定なら merge を no-op と判定し resolver / 手動 hybridize lesson を invoke しない」を明記。
  - **SP-DEVSYNC-062-B (push 範囲特定)**: `git rev-list --left-right --count @{u}...HEAD` の右辺で push 未済 commit 数を確定 → typecheck/lint green を確認して `git push` のみ。no-op merge では新規 commit を作らない。
  - **SP-DEVSYNC-062-C (lessons ID 衝突)**: 本 lessons 系は union merge 累積で同一 L-DEVSYNC-NNN ID が複数発生する。新規追記時は `grep '^## L-DEVSYNC'` で最大採番を確認し +1 する（既存重複の遡及補正は採番カスケードを避け title 識別で据え置く運用）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-062、L-DEVSYNC-061 (skill-only shape 再現)。


## L-DEVSYNC-059 skill-only conflict shape の resolver 単独完結を仕様 Phase 12 の default path に固定（dev sync-merge / 2026-05-29 再現）

`feat/issue-958-h3-public-filter-ux`（2026-05-28）と `feat/issue-976-admin-fetch-service-binding`（2026-05-29）の 2 連続で、`origin/dev` sync-merge 時のコンフリクトが **skill md 5 件 (SKILL.md / indexes/{quick-reference,resource-map,topic-map}.md / references/task-workflow-active.md) + derived keywords.json 1 件** の完全同形に収束した。feature branch のコード接触面が dev 側並列実装（admin-ui modernization 等）と orthogonal な期間は、この shape が反復発生する。

- **SP-DEVSYNC-059-A (Phase 12 implementation-guide の default path)**: sync-merge 工程は **「`git merge dev` → 残 unresolved が skill md + keywords.json のみなら `pnpm sync:resolve` 単発 → resolver stdout で `union-resolved` 5 行 + `ours:` 1 行 (`keywords.json`) + `running pnpm indexes:rebuild` 完走 + `all skill / index conflicts resolved` 行を確認 → `git status --porcelain | grep -E '^(UU|AA|DD)'` 空 → `git add -A && git commit -m "merge: sync <branch> with dev"`」** を default 手順として明記する。
- **SP-DEVSYNC-059-B (shape 判定の grep gate)**: resolver 実行の **前** に `git status --porcelain | grep -E '^(UU|AA|DD)'` で unresolved 一覧を取り、全件が `.claude/skills/(aiworkflow-requirements|task-specification-creator)/(SKILL\.md|indexes/.+\.(md|json)|references/task-workflow-active\.md)` regex に match するかを 1 行 grep で確認する。1 件でも外れたら **L-DEVSYNC-056/057/058 の手動 hybridize path に分岐**するよう Phase 12 に分岐表記を残す。
- **SP-DEVSYNC-059-C (resolver 不適 shape の明示)**: `apps/web/**/*.tsx` / `apps/api/**/*.ts` の unresolved が含まれる shape は branch context（slug / commit 主語）依存の hybridize が必須なので resolver を **呼ばない**。Phase 4 risk に「resolver 単独完結を前提とせず、`.tsx/.ts` conflict 発生時は L-DEVSYNC-056/057/058 を mitigation として参照」を 1 行登録する。
- **SP-DEVSYNC-059-D (検証ゲートの順序固定)**: resolver 完結後の検証は **`git diff --check` 空 → `pnpm typecheck` Done × 6 packages → `pnpm lint` Done × 全 packages → `git push`** の 4 step を Phase 12 implementation-guide に明記。stablekey-literal-lint が mode=warning の場合は block 対象外として扱う。
- **SP-DEVSYNC-059-E (lesson 再現の SSOT)**: 同形再現が 2 連続 (a98fd67bb / 2026-05-29 merge) で確認済みのため、admin-ui modernization wave 終息までは Phase 12 implementation-guide の sync-merge 節で本 lesson を **default reference** として 1 行記載する（L-DEVSYNC-056/057/058 は分岐先として 1 行併記）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-059、L-DEVSYNC-055 (resolver 単独完結 happy-path)、L-DEVSYNC-056/057/058 (手動 hybridize 分岐先)、L-DEVSYNC-046 (UNION_TARGETS)。


## Typed Error class 化 × byte-identical message 互換維持パターン（2026-05-30 / L-I991-001..006 generalization）

`issue-991-admin-fetch-error-typed-class` で、素の `Error` を構造化フィールド付き typed class（`status` / `path` / `responseBodySnippet`）へ昇格しつつ、message を逐語 assert する既存テスト / regex consumer を一切壊さなかった汎化。「中身を仕切るがフタのラベルは変えない」が核。

- **SP-I991-A (message byte-identical 維持を AC に固定 / L-I991-001,006)**: `Error` → typed class 化タスクでは、Phase 2 設計に「現状 message を生成する全コードパス × 出力ケース（body あり / なし / 上限超 / 空 / 読取失敗）」の突合マトリクスを置き、新 class の `super()` 出力が byte-identical になることを AC に固定する。各セルを Phase 6 focused test に 1:1 対応付ける。message 上限値（例 256）は定数化せず既存コードと同値を維持し、構造化フィールドは message と分離して追加する。
- **SP-I991-B (共通正規化層は下位ドメイン非 import / L-I991-002)**: public/admin など複数ドメイン共通の正規化層から domain 固有 error の構造化フィールドを使うときは `import { DomainError }` / `instanceof DomainError` を入れず、`(err as { status?: unknown }).status` + `Number.isInteger` の duck typing で読む。既存 message parse（regex）は fallback に残し、structured 値を優先順位 1 位にする。Phase 4 risk に「共通層 → 下位ドメイン import を増やさない（`lint-boundaries` / import grep gate）」を 1 行登録する。
- **SP-I991-C (多段露出する body は redaction 前段 + 独立 slice / L-I991-003)**: error body を message（短）と structured snippet（長）の 2 つ以上の長さで露出する設計では、(1) PII redaction（email / phone 形状）を最前段で適用 → (2) 各上限で **独立** slice（長い方を短い方の再 slice で作らない）の順を Phase 2 で固定。空文字（suffix 抑止だが snippet では null と区別保持）/ null / 上限超を Phase 6 で個別 case 化する。
- **SP-I991-D (Workers cross-module 想定の二段 type guard / L-I991-004)**: Cloudflare Workers ランタイムの custom Error 判定 helper は `instanceof` 単独に頼らず、`instanceof` OR (`name` literal 一致 + 識別 field の `typeof` チェック) の二段にする。bundle 分割 / cross-module で prototype chain が切れても判定が壊れない。
- **SP-I991-E (CLOSED follow-up Issue × 現状コード drift の吸収 / L-I991-005)**: CLOSED な follow-up Issue / 古い仕様から着手するときは Phase 1 で対象コードを実測し、Issue 記述と差分があれば index.md 冒頭に「Issue 記述 vs 現状コード」差分表を置き **現状コードを正本** に AC を再定義する。Issue は reopen せず Phase 12 compliance で CLOSED 維持・`Refs #NNN` のみと明記。P50 チェックに「Issue/spec 記述と現状コードの drift 確認」を含める。
- anti-pattern: typed 化ついでの message 文言整形で逐語 assert を破壊 / 共通層への domain import 漏れ / redaction を slice 後に掛け切れ目に PII 残留 / `instanceof` 単独判定 / CLOSED Issue literal の無検証 AC 化による現状回避策の退行。
- 参照: [[lessons-learned-issue-991-admin-fetch-error-typed-class-2026-05]] L-I991-001..006 + anti-pattern 5。


## optimistic row mutation + rollback + API error body surfacing パターン（issue-988 / 2026-05-30 汎化）

admin 系の一覧 row に対する mutation（merge / dismiss / archive 等）を、server round-trip を待たず即 UI 反映し、失敗時のみ巻き戻す UX を component-local state だけで実装するときの設計 AC。API endpoint / shared hook を拡張せず `*Row.tsx` の中で完結させる前提。

- **L-OPTMUT-001 (可視性 state を dialog stage union から分離)**: 確定対象の可視性/有効性は専用 boolean（例 `optimisticMerged`）に切り出し、dialog 段階管理の `stage` union に新値として混ぜない。`if (optimisticMerged) return null` の 1 行 guard で render を止め、rollback は boolean を false に戻すだけにする。Phase 2 design AC に「即時反映対象の可視性は専用 boolean、dialog/フォーム state とは直交」を登録。
- **L-OPTMUT-002 (API error body を inline alert に surface する pure helper)**: rollback 時の inline error は transport 汎用文言ではなく API レスポンス body の文言を出す。`FetchAuthedError`（`status` / `bodyText`）を JSON.parse し `message ?? error ?? error.message`、parse 失敗時 `bodyText`、非 FetchAuthedError は `.message` を返す副作用なし helper を component 直前に定義。Phase 11 evidence AC に「error 文言が API body と一致すること（generic 文言 drift の検出）」を登録。
- **L-OPTMUT-003 (success と failure で復帰挙動が非対称)**: reject 時のみ rollback（modal 非閉鎖・入力 reason 保持）。success path では row を `return null` のまま維持し再表示しない（消えたものが戻る flicker を回避）。Phase 2 design AC に「optimistic hide は失敗時のみ巻き戻し、成功時は恒久化」を明記。
- **L-OPTMUT-004 (focused test を 3 タイミングに分離)**: (1) pending Promise（`new Promise(() => {})`）中に row が消える、(2) resolve 後も消えたまま、(3) reject（業務 status の error）で再表示し reason/error 残存、の 3 it に分ける。既存の「success 後に操作ボタン再表示」assertion は「row 消失維持」へ更新。assertion は DOM 上の row 識別子有無で行い内部 state を覗かない。Phase 6 test AC に登録。
- **L-OPTMUT-005 (Playwright text locator は exact:true で substring 一致回避)**: 短い ID（`m_src_01`）が長い複合 ID（`m_src_01__m_dst_01`）の prefix になり得る場合は `getByText(id, { exact: true })`。row 特定は `getByText('conflict: <id>').locator('xpath=ancestor::li[1]')` で scope を絞る。Phase 11 e2e AC に登録。
- **L-OPTMUT-006 (VISUAL evidence は env-gated capture で通常 run と同居)**: screenshot は env（`PLAYWRIGHT_<scope>_SCREENSHOT_DIR`）設定時のみ `mkdirSync`+capture する helper にラップし未設定時 no-op。canonical screenshot 名は Phase 1 spec で先に固定し implementation-guide でも同名参照して name drift を防ぐ。VISUAL_ON_EXECUTION task の Phase 11 evidence AC に登録。

anti-pattern:

- 可視性を `stage` union の新値で表現して rollback 分岐を爆発させる（→ L-OPTMUT-001）。
- rollback inline alert に `error.message`（transport 汎用文言）だけを出し 409 等の業務メッセージを落とす（→ L-OPTMUT-002）。
- success 後に optimistic hide を巻き戻して row を一瞬再表示する flicker（→ L-OPTMUT-003）。
- optimistic / success / rollback を 1 test ケースに混ぜて pending 中の hide を検証しない（→ L-OPTMUT-004）。

- 参照: [[lessons-learned-issue-988-optimistic-merged-2026-05]] L-I988-001..006、[[workflow-issue-988-identity-conflicts-merge-optimistic-update-artifact-inventory]]。


## CLOSED-issue same-cycle 実装 + admin manual write レーン分離パターン (2026-05-29)

CLOSED 由来 issue を spec_created で close-out した直後に、同一実行サイクルで実コードと focused tests まで進んだ場合の workflow_state 昇格、および 1 テーブルへ複数 source（自動提案 / 人手キュレーション）が write する admin manual write のレーン分離・冪等 DELETE・soft-delete guard・並行 issue decouple・vitest config 分離を、将来の任意タスクで再利用できる汎化原則として記録する。

### L-CLSCYCLE-001: CLOSED issue の same-cycle 実装で workflow_state を昇格

- 状況: CLOSED 由来 issue を `spec_created` で close-out したワークフローが、同一実行サイクル内で実コード実装 + focused tests green まで到達した。
- 教訓: `spec_created` のまま放置すると system spec / API docs が「target only / not current」と誤読され、docs が現状の local behavior を表さなくなる。実コード差分 + tests green を確認したら速やかに `spec_created` → `implemented_local_runtime_pending` へ再分類し、system spec / API docs を current local behavior として **同一 wave で promote** する（runtime / staging deploy / commit / push / PR は user-gated boundary として分離）。
- 適用条件: CLOSED issue 由来かつ同一サイクルで実コード差分 + focused tests green が確認できるとき。

### L-MULTILANE-001: 同一テーブルへの複数 source write は source 別 helper + type-level allow list

- 状況: 1 テーブルに「自動提案(AI / Form queue)」と「人手キュレーション(admin manual)」など複数の source から write が入る設計になった。
- 教訓: write helper を source ごとに分離して SRP を保ち、各 write path を self-document する。readonly `.test-d.ts` の allow list と JSDoc `@internal` guard で「許可された source 以外から呼ばない」ことを型レベル + ドキュメントで固定し、不変条件コメントも「禁止: XX 以外からの呼び出し」を再定義する。
- 適用条件: 単一テーブルに複数 source（自動 / 手動）から write が入り、source ごとに責務・検証が異なるとき。

### L-HTTP204-001: 冪等 DELETE の 204 No Content を fetch wrapper で吸収

- 状況: REST の冪等 DELETE が body なし 204 No Content を返すのに、汎用 mutation hook が一律で JSON parse して `SyntaxError` を起こした。
- 教訓: `res.status === 204 ? undefined : await res.json()` の status-based type narrowing を hook 層に入れる。contract spec に「204: no-op or successful deletion」を明記し、regression spec で 204 の挙動を固定する。
- 適用条件: 冪等 DELETE / 副作用なし系の endpoint を汎用 mutation hook 経由で呼ぶとき。

### L-SOFTDEL-001: soft-delete entity への write は active guard + エラー境界分離

- 状況: `active=1` の論理削除モデルで、inactive(論理削除済み)entity に write が来て zombie 復活の懸念があった。
- 教訓: write API で active フィルタを検査し、inactive entity への write は 404(not_found) を返して復活を防ぐ。親 entity の削除状態(409 conflict)と子 entity の存在性(404 not_found)はエラーコードを分け、呼び出し側が原因を区別できるようにする。
- 適用条件: soft-delete(active flag)モデルの entity に write / 子 entity 追加が入るとき。

### L-DECOUPLE-001: 並行タスクの critical path を専用 GET endpoint で decouple

- 状況: 別 issue(list enrichment 等)と並行実装する UI が、相手 issue が返すべき data に依存して進行ブロックされそうになった。
- 教訓: `GET /.../:id/...` の専用 endpoint を定義し、UI が必要とする data を同時返却することで相手 issue の完了を待たずに進める。critical path を専用 read endpoint で decouple する。
- 適用条件: 並行 issue 間で data 依存があり、相手の完了待ちが critical path をブロックするとき。

### L-TESTCFG-001: runtime 要件が異なる層は vitest config を分離

- 状況: D1 harness(Miniflare native binding)を jsdom config で動かそうとして失敗した。
- 教訓: data 層は node env config(`vitest.d1.config.ts` 等)、UI 層は jsdom config に分け、各層を独立 config で緑保証する。`package.json` script 名も `test:api` / `test:web` で明示し、どの config がどの層を走らせるか self-document する。
- 適用条件: D1 / Miniflare 等 native binding 系 data 層と jsdom UI 層を同一リポジトリで test するとき。

### Anti-patterns

- spec_created のまま放置して current docs と乖離させる(target only と誤読される)。
- 単一 helper に複数 source(自動 / 手動)の write を詰め込み SRP と write path 検証を曖昧にする。
- 冪等 DELETE の 204 No Content を無条件 JSON parse して SyntaxError を起こす。
- soft-delete entity に active guard なしで write し、論理削除済みを zombie 復活させる。
- 並行 issue の data 依存を専用 read endpoint で decouple せず、相手の完了をブロッキング待ちする。


## L-ASSET Admin-managed binary asset（DBメタ + object storage + presigned URL）+ fail-soft presign パターン（issue-983 / 2026-05-29 汎化）

フォーム/正本 schema が**バイナリ資産（写真・添付等）を集めない**が admin が後付けで管理したい場合、正本 schema をバイナリで汚さず、フロントへ storage credential も露出させない 3 層分離で実装する。read endpoint は未 provision / secret 未注入環境でも壊れない fail-soft を default にする。Phase 1 の Ownership 宣言と Phase 4 risk に以下を必ず登録する。

- **L-ASSET-001 (3層分離を Phase 1 で宣言)**: 正本 schema 外の admin-managed バイナリ資産は「**メタデータDB行**（誰がどの資産を持つか）+ **object storage**（バイナリ本体）+ **API が発行する短命 presigned URL**」の 3 層で分離する。フロントは signed URL 文字列のみ受領し `<img src>`/`<a href>` に渡すだけにして、storage / DB へ直接アクセスしない（DB 直アクセス禁止境界と対称）。Phase 1 の Schema / Ownership 宣言で「正本 schema は不変、資産は別テーブル + 別 binding」を明記する。
- **L-ASSET-002 (presign は fail-soft、read endpoint は成功ステータス維持)**: presign helper は依存値不正 / 対象不在 / 署名ライブラリ throw のいずれでも**例外でなく `null`** を返す。これを利用する read（detail）endpoint は presign 失敗でも**成功ステータス(200)を維持**し optional field を省略する。secret 未注入 / storage 未 provision の local・staging 初期状態で既存 endpoint を壊さないことを AC に含める。
- **L-ASSET-003 (URL 解決は route 層、ViewModel builder は I/O 非依存)**: ViewModel builder は presign 等の外部 I/O 非依存（純粋）に保ち、URL 解決は route 層の resolve helper に切り出す。route で解決した値を `{ ...view, optionalField }` と**後段マージ**する層分離にする。builder のテスト容易性と再利用性を守る。
- **L-ASSET-004 (presigned URL 生成契約を定数化)**: object key 規約（例 `{entity}/{id}/{slot}` で 1 entity 1 asset 上書き）、最大サイズ、許可 MIME allowlist、presign TTL を named const として 1 箇所に集約し仕様書に転記する。署名は S3 互換 presigned GET（query 署名）を用い、object key のパス区切りを保つ encode と TTL の expires query を契約として固定する。
- **L-ASSET-005 (upload 検証順序と HTTP ステータス契約)**: multipart upload は **存在確認(404) → body/field 取得(400) → 型(400) → MIME allowlist(415) → 空(400) → サイズ上限(413)** の順で検証し、各段で正しいステータスを返す。全検証通過後にのみ storage put + DB upsert + audit を行う。この順序を Phase 1 の API 契約に明記する。
- **L-ASSET-006 (shared schema optional + strict 維持、fallback 保持)**: 共有 ViewModel schema に optional field を追加しても `.strict()`（unknown key 拒否）を維持する。UI は資産優先描画しつつ `onError` 等で**既存 fallback（親タスクの placeholder 等）を保持**し、資産不在・URL 省略・ロード失敗の全経路で fallback が出ることを確認する。
- **state**: 外部リソース provision / secret 注入 / remote migration apply / deploy に依存する局面は `implemented_local_runtime_pending` + user-gated 境界として明示し、**local 完了を runtime 完了と混同しない**。

### Anti-pattern

- presign 失敗で 500 を返す → 資産と無関係な detail 表示まで巻き込んで壊れる。null 返却 + 200 維持 + field 省略が正
- ViewModel builder に storage/presign 依存を持ち込む → builder が I/O 依存になりテスト・再利用が難化。route 層 resolve + 後段マージが正
- フロントに storage credential / DB binding を露出する → 3 層分離の意義が崩壊。signed URL 文字列のみ受領が正
- secret 未注入環境で read endpoint が壊れる → fail-soft 契約の欠落。未 provision 初期状態でも 200 を AC で保証する
- shared schema に field を足して `.strict()` を緩める → unknown key 混入を許す退行。strict 維持で optional 追加するのが正
- 参照: [[lessons-learned-issue-983-member-photo-avatar-r2-storage-2026-05]]（aiworkflow-requirements 側 L-I983-001..006 が具体実装の SSOT）。


## SP-DEVSYNC-063 skill-only 3 ファイル variant の resolver 単独完結を再々確認 — conflict marker grep の `====` 誤検知に備え実 conflict 判定は `git status` unmerged を一次ソースに（dev sync-merge / 2026-05-30 再現）

`feat/admin-sidebar-public-return-link` ← `origin/dev` (HEAD `7b2bf0537`) sync-merge で conflict 3 件（`indexes/{resource-map,topic-map}.md` + `references/task-workflow-active.md`）、page-level `.ts/.tsx` 0 件。SP-DEVSYNC-059 の default path がそのまま適用でき、`pnpm sync:resolve` 単発で `all skill / index conflicts resolved` まで完走。merge commit `02b7f00eb` / typecheck 6 packages Done / lint exit 0 / indexes no drift。

- **SP-DEVSYNC-063-A (ファイル数は可変・shape 判定は path regex)**: skill-only shape は 5 件固定ではない（今回は 3 件、`keywords.json`/`quick-reference.md`/`SKILL-changelog.md` が auto-merge 成功で conflict に上がらなかった）。Phase 12 の shape 判定は「件数」ではなく「unmerged 全件が `.claude/skills/**` path regex に match するか」で行う（SP-DEVSYNC-059-B の grep gate を件数非依存で適用）。
- **SP-DEVSYNC-063-B (conflict marker grep の偽陽性回避)**: 残 conflict 確認に `git grep -E '^(<<<<<<<|=======|>>>>>>>)'` を補助で使う場合、committed docs 内の 60 桁 `====` セパレータ等を `=======` が誤検知する。実 conflict 判定は **`git status --porcelain` の unmerged エントリ (`UU`/`AA`/`DD` 等) を一次ソース**にし、grep マーカーヒットは必ず該当ファイルの `git status` と marker 周辺行で実 conflict か再確認する（リテラル `====`/`<<<<` を未解消と誤認して `git commit` を躊躇しない）。
- **SP-DEVSYNC-063-C (lessons ID 採番衝突の進行)**: aiworkflow 側 lessons-learned に L-DEVSYNC-063 が 3 つ累積したため本 variant は L-DEVSYNC-064 を採番。SP-DEVSYNC-062-C の「最大採番 +1 / 旧重複は title 識別で据え置き」運用を継続。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-064、L-DEVSYNC-059/061 (skill-only shape resolver-only path)、SP-DEVSYNC-059 (default path)、SP-DEVSYNC-062-C (採番運用)。


## L-DEVSYNC-064 sync-merge の add/add ソースコンフリクト — 「進化段階差」は行マージ禁止・上位版を丸ごと採用（dev sync-merge / 2026-05-30）

`feat/member-header-admin-link` ← `origin/dev`（`7b2bf0537`）sync-merge で、`pnpm sync:resolve` が `WARN unhandled conflict` を出した `apps/web/src/lib/auth-view/index.ts` と `__tests__/resolveAuthView.spec.ts` が **add/add (`AA`) コンフリクト**で残った。両 side は同一 auth-view 機能だが、HEAD は分割モジュール構造（`index.ts` は re-export のみ・`resolveAuthView(SessionLike)`）で dev の旧 Task A インライン基盤版の上位互換だった。L-DEVSYNC-059 の skill-only shape を超え、resolver 不可の source 混在 shape の判定／解消手順を Phase 12 仕様に固定する。

- **SP-DEVSYNC-064-A (add/add 進化段階差の判定)**: sync-merge task の Phase 12 implementation-guide / 検証手順に「`git status --porcelain` の `AA` 行を見たら `git show :2:<path>`（ours/HEAD）と `git show :3:<path>`（theirs/dev）の構造差を読む。同一 export 名・同一責務で片側が他方を包含するなら *進化段階差* と判定し、自律判断ルール B-3 の行マージを適用しない」を明記。別機能が同名衝突なら従来どおり hybridize（L-DEVSYNC-056/057/058）へ分岐。
- **SP-DEVSYNC-064-B (上位版の特定基準を仕様に列挙)**: 「分割モジュール化済み / 型を literal 固定 / ガード条件がより厳密 / 周辺ファイルが既に片側に存在」の側を上位版と定義し、`git checkout --ours <path> && git add` で丸ごと採用 → 旧基盤版を破棄。Phase 12 の risk 表に「進化段階差を行マージすると実装が壊れる」を 1 行登録。
- **SP-DEVSYNC-064-C (テスト追従の整合ゲート)**: 実装とテスト（`*.spec.ts`）は必ず同じ side を採る。採用実装の signature と不整合なテストを採ると typecheck fail する旨を Phase 12 検証手順に明記（実装=HEAD・テスト=dev の混在を禁止）。
- **SP-DEVSYNC-064-D (resolver WARN ハンドリング)**: `pnpm sync:resolve` の `WARN unhandled conflict: <path>` 行が出たら、その列挙ファイルのみ手動解消し resolver 済の skill 系は再処理しない。最後に `git grep -l '^<<<<<<< '` = 空で全 marker 消滅を確認してから `git commit`。
- **SP-DEVSYNC-064-E (検証ゲート)**: `git diff --check` 空 → `pnpm typecheck` Done × 全 packages → `pnpm lint` Done → `git push` の順を固定。
- anti-pattern: ① add/add を機械的に行マージし旧版コードを残す ② 実装は HEAD・テストは dev を採り signature 不整合で CI fail ③ resolver WARN を無視して skill 系まで手で触り union 結果を壊す ④ 上位版判定をせず `--theirs` で dev 旧基盤版に巻き戻す（**ただし SP-DEVSYNC-065 の「dev が同構造へ進化済み」ケースは除く**） ⑤ marker 残存確認を省略して conflict marker をコミット。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-064、L-DEVSYNC-059 (skill-only resolver-only path)、L-DEVSYNC-056/057/058 (別機能 add/add hybridize 分岐先)、SP-DEVSYNC-065 (再 sync で前提が変わる場合)。


## L-DEVSYNC-065 同一 feature の**再 sync** — 「前回 `--ours` 採用」を盲目踏襲せず dev の進化を再評価（dev sync-merge / 2026-05-30）

`feat/member-header-admin-link` ← `origin/dev`（`7b2bf0537`）の **2 度目** の sync-merge で、前回（L-DEVSYNC-064 / SP-DEVSYNC-064、merge `2a9e5611c`）は dev=inline 単一実装だったため HEAD 分割版を `--ours` 採用した auth-view conflict が再発した。だが今回は dev が sibling branch（L-DEVSYNC-063 の `public-header-session-aware-auth-view-base`、merge `060bab6bf`）経由で **同じ分割モジュール構造へ進化済み**。「進化段階差（inline vs module）」フレームは無効化し、「**同構造の細部相違**」フレームへ切り替えて dev 版を `--theirs` 採用した（前回と逆の結論）。sync-merge task を生成する仕様の Phase 4 risk / Phase 12 implementation-guide にこの再評価ステップを固定する。

- **SP-DEVSYNC-065-A (再 sync は前回判断の前提を再評価)**: N 度目の sync で同一 feature が再 conflict したら、Phase 12 手順に「前回 lesson の `--ours`/`--theirs` 結論をそのまま適用せず、`git show :3:<path>`(theirs/dev) の構造を読み dev が前回から進化していないか確認する」を明記。dev が HEAD と同構造へ追いついていたら進化段階差フレーム（SP-DEVSYNC-064 / L-DEVSYNC-063）を捨て、本 lesson の同構造細部相違フレームへ分岐。
- **SP-DEVSYNC-065-B (同構造細部相違の canonical 判定基準)**: 両 side が同じモジュール構造の場合、上位版判定は構造ではなく品質指標 — ①ガードがより厳密（`trim()` で空白も弾く > `length` のみ）②テストがより網羅的（境界ケース数）③共有型が 1 箇所に集約。これらを多く満たす側を canonical とし `--theirs`/`--ours` を選ぶ。Phase 12 risk に「同構造再 sync では品質指標で canonical を選ぶ」を 1 行登録。
- **SP-DEVSYNC-065-C (consumer 互換の grep + typecheck が採否の最終根拠)**: `--theirs` 成立条件は「HEAD 固有 consumer が dev 版 API で動く」こと。仕様に「`grep -n '<consumer prop>' <consumer files>` で依存契約を確認 → literal→string 等の契約緩和なら無修正可、契約強化なら型 fail で `--ours` 継続 → `pnpm typecheck` + focused vitest(対象 + consumer 層) で機械確認後 commit」を明記。
- anti-pattern: ① 前回 lesson の結論を機械転記し dev の進化を見落とす ② 「`--theirs`=旧基盤巻き戻し」と短絡し進化済み canonical を捨てる（SP-DEVSYNC-064 anti-④ の誤適用）③ consumer 互換を grep/typecheck せず型不整合のまま commit ④ 品質指標を見ずに「HEAD が常に上位」と決めつける。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-065、L-DEVSYNC-063/064 (dev=inline 時の進化段階差)、SP-DEVSYNC-064 (前回 `--ours` 採用)、L-DEVSYNC-024 (import block 両側採用)。


## L-USS-A 親 workflow + nested sub-workflow による単一タスク Phase 1-13 化（2026-05-28）

A-F 等の親 workflow 内で **1 タスクだけを単独サイクル完結** したい時、standalone root を作らず `tasks/<task-id>/` に Phase 1-13 サブworkflow を nest するパターン。`unified-sidebar-shell-public-and-admin` Task A (`SidebarShell` primitive) で検証。

- **L-USS-A-001 (parent + nested topology)**: standalone root (`docs/30-workflows/task-A-...`) を作らず親の `tasks/<task-id>/` 配下に Phase 1-13 を nest。verify:phase12-compliance は `hasCompletedTasksAncestor=true` で許容。standalone を後から `mv` で collapse する場合、artifact-inventory に `collapsed into parent` で吸収。
- **L-USS-A-002 (Server / Client 境界 slot 固定)**: 3 層 layout 共通 shell primitive では `<...Server>` だけが `getSession()` / counts を解決し、Client component には plain props + `ReactNode` slot を渡す。後追い実装の下流タスクが上流 contract を壊さない。
- **L-USS-A-003 (SSR-safe persistent UI state)**: collapse / sidebar state 等の client-only state は「初期値 deterministic + `useEffect` で localStorage hydrate」の 2 段。初期 render で localStorage を読むと Cloudflare Workers / Next.js App Router で hydration mismatch。
- **L-USS-A-004 (`buildNavFor<Role>` pure 関数化)**: nav 構成は component に埋め込まず `<area>-config.ts` 1 箇所に集約。`*-config.spec.ts` で role × ctx 全 branch を網羅し、admin nav drift を CI で防ぐ。
- **L-USS-A-005 (out-of-order 実装でも上流契約を守る)**: 依存タスク (Task B = UserMenu 等) が先行実装されても、上流 (Task A = primitive) は slot 契約 + plain props を維持。下流の細部を上流に逆流させない。
- **L-USS-A-006 (tokens は theme variant 同時追加)**: `--shell-bar-*` 等の surface トークンは default + `[data-theme='cool']` を必ず同時追加。片側だけ追加すると `verify-design-tokens` fail + cool theme drift。
- **anti-pattern**: (a) standalone root を残す (discovery 分裂)、(b) Client に `getSession()` (auth boundary 崩壊)、(c) 初期 render で localStorage 同期読み (SSR mismatch)、(d) nav 構成を component / config の両方に書く (drift 不可避)、(e) tokens を default のみ追加 (theme drift)。
- 参照: [[lessons-learned-unified-sidebar-shell-task-a-2026-05]] L-USS-001..006、[[admin-shell-topbar-sidebar-integration]] (前例 Task A primitive 分離)。


## L-DEVSYNC-061 conflict 0 件 shape（add-only 取込）を sync-merge 判定フローの最上段に固定（dev sync-merge / 2026-05-29）

`feat/task-c-privacy-terms-public-shell-spec` ← `dev` (取込 1 commit `37fe488e8` #1009) の sync-merge で **conflict 0 件**。dev 側差分が `docs/30-workflows/completed-tasks/members-list-ux-clarity/**` への **新規ファイル追加のみ**で、feature branch の接触面（`(public)/{privacy,terms}` + skill 索引）と path が完全 orthogonal だったため、add-add すら起きず resolver / 手動 hybridize の両方が不要だった（merge commit `fa756f644` を `git merge` が即生成）。L-DEVSYNC-059/060 の "skill-only → resolver 単発" よりさらに 1 段クリーンな最頻 shape。

- **SP-DEVSYNC-061-A (判定フロー最上段)**: Phase 12 implementation-guide の sync-merge 節は **(1) `git merge dev --no-edit` → `git ls-files -u | wc -l` 0 → そのまま検証へ（resolver 不起動）/ (2) unresolved 全件 skill resolver 対象 → `pnpm sync:resolve` 単発（SP-DEVSYNC-059/060）/ (3) `.ts/.tsx` 意味的 conflict 残 → 手動 hybridize（L-DEVSYNC-056/058）** の 3 段で、必ず (1) を最初に判定する手順を明記する。`pnpm sync:resolve` を反射的に起動しない。
- **SP-DEVSYNC-061-B (add-only 取込の低リスク評価)**: 取込 commit が completed-tasks への add-only diff（既存ファイル edit ゼロ）なら既存 semantics を変えないため、検証は `pnpm typecheck`（6 packages Done）+ `pnpm lint`（exit 0）で十分。Phase 4 risk へ「add-only 取込は runtime regression リスク低・visual baseline 再取得不要」を 1 行登録できる。
- **SP-DEVSYNC-061-C (warning の扱い継承)**: `stablekey-literal-lint` 等 mode=warning の既存 lint warning は sync-merge 由来でない限り解消成否に含めない（exit code 0 を正）。SP-DEVSYNC-059-D の検証ゲートと同一方針。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-061、L-DEVSYNC-059/060 (skill-only resolver 単発)、L-DEVSYNC-056/058 (手動 hybridize 分岐先)。


## L-VISBASE 視覚回帰 CI 失敗の復旧を Phase 11/13 の visual gate 手順に固定（2026-05-29 PR #1014）

レイアウトを変える PR（header/footer 追加・primitive 差し替え等）で `playwright-visual-full` が `toHaveScreenshot` diff fail したときの復旧フロー。Phase 11 manual-test / Phase 13 PR 手順の「visual gate 失敗時」分岐に明記する。

- **SP-VISBASE-A (真因切り分け)**: `visual-full` fail は `[WebServer] ./app/error.tsx` 等のビルド stdout ノイズに惑わされず、`gh run view --job <id> --log | grep -iE "toHaveScreenshot|[0-9]+ passed|[0-9]+ failed"` でサマリを先読みする。失敗が **PR が触った route に限定**されていれば snapshot diff（baseline 更新で解決）、全 route / 0 passed なら runtime error（コード修正）。
- **SP-VISBASE-B (baseline は CI 環境で再生成)**: snapshot は `-linux` suffix 付きで CI(ubuntu) レンダリング依存。ローカル macOS の `--update-snapshots` は再 diff するため使わない。`gh workflow run playwright-visual-baseline-update.yml -f reason="<why>" --ref <branch>`（`reason` required / `environment: visual-baseline-approval` の user gate あり）で CI 上再生成 → source branch 直 push → ローカル `git pull --ff-only`。CLAUDE.md の「visual baseline user-gated」に従い、ユーザーが CI 解決を明示依頼した場合のみ実施。
- **SP-VISBASE-C (bot push は pull_request 非トリガー → close/reopen)**: `GITHUB_TOKEN` の push は `on: pull_request`/`push` workflow を再トリガーしない仕様。baseline コミット上で PR の `statusCheckRollup` が 0 件・combined status `pending (0 statuses)` になり required checks（`gh api .../branches/dev/protection/required_status_checks -q '.contexts[]'` で列挙）が未実行のままマージ不能化する。**`gh pr close <n> && gh pr reopen <n>`** で `pull_request`(reopened) を発火させ最新 head で全 workflow を再走させる（空コミット push より履歴を汚さない）。`gh pr checks <n> --watch` で全 green を待つ（e2e ~18分は background 実行）。
- 参照: [[lessons-learned-visual-baseline-ci-recovery-2026-05]] L-VISBASE-001/002/003。


## L-DEVSYNC-063 add/add で「分割ファイル構成 vs 単一ファイル inline」の同一 API は分割側 one-way（2026-05-30 feat/task-c-privacy-terms-public-shell-spec）

dev sync-merge で **同一の small public API（`apps/web/src/lib/auth-view/` の `AuthView`/`resolveAuthView`/`getAuthView`）が、HEAD = 複数ファイル分割 + barrel re-export、dev = 単一 `index.ts` に inline、という別設計で並行 add** され add/add conflict になった事例。spec 起草段階でこの形を予防する設計ルール（aiworkflow-requirements の `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-063）。

- **L-DEVSYNC-063-A (分割側 one-way)**: add/add の `index.ts` で片側が `types.ts`/`resolveAuthView.ts`/`getAuthView.ts` 等の **分割ファイルへ re-export**、もう片側が同 API を `index.ts` に inline する場合、分割ファイル群は add-only で merge では消えない。inline 側を採ると分割ファイルと **二重 export してコンパイルエラー** になるため、`git checkout --ours`（分割側）一択で選択の自由度が無い。spec の Phase 4 contracts で「lib 配下の small API は `types.ts` + 実装 + `index.ts` barrel の分割を正本構成とする」と固定し、同一 API を単一ファイル inline する派生実装を生やさない方針を明記すると、この add/add 自体を予防できる。
- **L-DEVSYNC-063-B (barrel 採用なら mock も barrel)**: 解消後 `index.ts` が barrel re-export なら、consumer の import も spec の `vi.mock` 対象も **barrel path に統一**する（submodule path mock を残すと実体を呼んで test fail）。Phase 12 implementation-guide / Phase 11 test 設計で「mock 対象 path = 実体の import path」を 1:1 で揃えるチェックを入れる。
- **L-DEVSYNC-063-C (同一出力型なら入力形差は consumer 非影響)**: 並行 add の 2 実装が入力 session 形（`{user:{memberId,isAdmin}}` vs flat `{memberId,isAdmin}`）で違っても **出力 discriminated union（`AuthView`）が同一**なら consumer は出力のみ消費するので挙動差ゼロ。spec で「resolver の戻り値型を SSOT 化し consumer は戻り値型のみに依存する」設計を徹底すれば、内部実装が分岐しても統合は ours 採用で安全に閉じる。
- **L-DEVSYNC-063-D (focused vitest は root から full path)**: 解消後の検証 vitest は **repo root から `apps/web/...` full path** で実行する（apps/web cwd 相対では root config の include `apps/**` と不一致で `No test files found`）。`(public)` 等の括弧 path はクォート必須。Phase 11 manual-test の実行コマンド例にこの形を固定。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-063 / L-DEVSYNC-061 / L-PATSEC-001..003（末尾 append + lesson ID prefix 命名）。

## SP-DEVSYNC-063 競合 feature の canonical 所在が動くと ours/theirs 判断が反転する — 同一 unit add/add の再発時は「canonical の dev 昇格」を都度再確認（2026-05-30 feat/task-c-privacy-terms-public-shell-spec ← dev #1013）

同一の small public API（`apps/web/src/lib/auth-view/`）を巡り、前回 sync では `--ours`（branch 側 module 分割版）で解消した同一 unit を、**同 branch の次の sync では `--theirs`（dev 側）で解消した**事例。間に sibling branch の canonical 実装が PR #1013 で **dev に昇格**したため、canonical の所在が branch→dev に移動し、wholesale 採用側が反転した（aiworkflow-requirements `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-064、原型は L-DEVSYNC-063 public-header 版の canonical wholesale 採用原則）。

- **SP-DEVSYNC-063-A (canonical 所在で ours/theirs を決める)**: 同一 feature を両側が別設計で実装した add/add conflict は、片側 hybridize ではなく **canonical（full test suite を持つ coherent unit）が存在する側を wholesale 採用**する。canonical がどの統合 branch にマージ済みかは時間で動くため、「この branch は常に ours」と固定化しない。spec の Phase 4 / Phase 12 に「sync-merge で同一 unit conflict を見たら `git log --oneline -5 dev -- <unit dir>` で canonical の dev 昇格を確認し、昇格済みなら theirs 採用」を判定手順として明記。
- **SP-DEVSYNC-063-B (定義欠落側は構造的に不採用)**: conflict 片側が変数/関数の **定義を欠いたまま参照だけ持つ**（例: `layout.tsx` の ours が `publicHeader` 未定義で `{publicHeader}` 参照）なら、その側は単独でコンパイル不能 → もう片側（theirs）が構造的に正しいと一点で確定できる。Phase 11 検証前に「解消後ファイルが自己完結でビルド可能か」を typecheck で必ず通す。
- **SP-DEVSYNC-063-C (conflict しない consumer の API 互換を typecheck で担保)**: task-c 固有の `app/privacy/page.tsx` / `app/terms/page.tsx` は conflict せず ours 保持だが、theirs 採用した `getAuthView`/`AuthView`/`PublicHeader` の API（async server component を JSX mount する形含む）と整合するかは **必ず typecheck で検証**。conflict marker が無いファイルこそ取込側 API 変更の影響を受けやすい盲点。
- **SP-DEVSYNC-063-D (unit は部分採用しない)**: component だけ theirs / module だけ ours のような混在採用は import 経路と DOM 契約が割れて typecheck/test が落ちる。canonical unit は component + spec + module + layout + layout.spec を**一括で同じ側**に揃える。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-064 / L-DEVSYNC-063（task-c 版 ours / public-header 版 theirs の対比）/ L-PATSEC-001..003（末尾 append + lesson ID prefix 命名）。

## SP-DEVSYNC-064 dev sync-merge の conflict 集合は前回実績に依存しない — `git status` unmerged を毎回一次ソースにし、`merge=union` 対象は手動解消しない（2026-05-30 feat/admin-sidebar-public-return-link ← dev #1013 3 回目）

- **SP-DEVSYNC-064-A (conflict 集合の毎回再確認)**: Phase 12 implementation-guide の sync-merge 節に「conflict 対象は sync ごとに変わるため、前回 sync のファイル集合を記憶ベースで当てにせず、毎回 `git status --porcelain | grep -E '^(UU|AA|DD|AU|UA|DU|UD)'` を一次ソースに確認する」を明記。同 branch を複数回 sync すると conflict 集合は別物になる（本例 3 回目は 2 件、2 回目は 4 件）。
- **SP-DEVSYNC-064-B (`merge=union` 対象は手動 Edit しない)**: `.gitattributes` で `merge=union` 指定された append-only ファイル（`SKILL-changelog.md` / `LOGS/_legacy.md` / `lessons-learned/*.md`）は git が自動結合するため conflict marker が出ない。これらを「前回 conflict した記憶」で手動 Edit しようとすると「String not found」になる＝**non-conflict signal**であり失敗ではない。Phase 4 risk に「`merge=union` 対象への手動解消は空振り」を登録。
- **SP-DEVSYNC-064-C (skill-only shape の resolver 単発完結)**: unmerged 全件が `.claude/skills/**` 配下なら `pnpm sync:resolve` 単発 → `git diff --diff-filter=U` 0 件 → `git commit --no-edit` → `pnpm typecheck`（6 packages Done）→ `pnpm lint`（exit 0、lefthook pre-push guard 6 種 pass）。手動 hybridize（SP-DEVSYNC-058 等）は invoke しない。本例 conflict 2 件（`indexes/topic-map.md` + 本ファイル）、merge commit `33debc596`。
- **SP-DEVSYNC-064-D (検証ノイズの一次ソース原則)**: background / 並列 bash の stdout が前後 turn と interleave すると、実在しない commit hash や lesson 採番を誤認しうる。commit/push/ファイル状態の確証は単一 `git log` / `git show <hash>` / `grep -c` を逐次実行して取り直す（並列出力を確証に使わない）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-065 / L-DEVSYNC-061 / L-DEVSYNC-064（skill-only resolver-only path）/ L-DEVSYNC-001/002（`merge=union` と JSON 派生物方針）。


## SP-DEVSYNC-046 page-level の **両側補完追加**は wholesale ではなく prop 合成で解消する（2026-05-30 feat/public-header-auth-slot-e2e ← dev #1013 再 sync）

同一 page (`apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx`) で **両側が独立に PublicShell wrapper を追加**するパターン。HEAD 側 = `currentPath` prop による active state 付与、dev 側 = `data-auth-state` 等の DOM 契約 + `getAuthView()` 配線 + 3 行グリッドラップ。同一 component (`PublicHeader.tsx`) が両方の prop を同時受容できる signature を持っており、片側 wholesale ではどちらか一方の regression が出るため hybrid 採用が必須（aiworkflow-requirements `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-065）。

- **SP-DEVSYNC-046-A (補完 add/add の判定)**: 3-way diff (`<<<<<<< HEAD ... ||||||| <base> ... ======= ... >>>>>>> dev`) で base が空・両側に追加要素が存在し、それらが**同じ component への異なる prop**である場合は wholesale 不可。SP-DEVSYNC-063-A の「canonical 所在で決める」原則の前提（片側陳腐化）が成立しないため判定フローを分岐させる。spec の Phase 4 / Phase 12 に「page-level conflict は `git show :1:<path>` で base 確認 → 両側追加が補完関係なら prop 合成」を判定手順として明記。
- **SP-DEVSYNC-046-B (合成順序の規約)**: dev 側の wrapper 構造（`data-testid`/`data-route-group`/`data-auth-state` 等の DOM 契約）を骨格として採用し、HEAD 側固有の prop（`currentPath` 等の active state 系）を component 呼び出しに**追加**する形で合成。改行/indent は dev 側（prettier 形）を採る（typography 影響なし）。これにより e2e selector と unit test の active state 両方が temporal regression なしに維持される。
- **SP-DEVSYNC-046-C (判定フロー全体)**: ① skill index → `pnpm sync:resolve`、② source の add/add で片側陳腐化 → SP-DEVSYNC-063 wholesale、③ source の add/add で **両側補完** → 本 lesson の prop 合成、④ 解消後は `pnpm typecheck` 6 packages + `pnpm lint` + `bash scripts/verify-pr-ready.sh` を必ず pre-push gate として直列実行。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-065 / SP-DEVSYNC-063（wholesale 原則との対比）。


## SP-DEVSYNC-066 sync-merge task の Phase 12 に「lessons-only conflict → union 解消 → 二重化検証 → indexes:rebuild」の最頻フローを固定（dev sync-merge / 2026-05-30 feat/member-header-admin-link ← dev #1014）

`feat/member-header-admin-link` を再 sync した際、content conflict が `patterns-lessons-and-pitfalls.md` 1 件のみ（前回の auth-view source conflict は取込 dev commit #1014 が orthogonal path だったため再発せず）。lessons/patterns 系の末尾 append 衝突が sync-merge の最頻 shape である一方、union 自動結合は同一 lesson の二重化と indexes drift という 2 つの盲点を残す。sync-merge task を生成する仕様の Phase 4 risk / Phase 12 implementation-guide にこのフローを固定する（aiworkflow-requirements `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-066）。

- **SP-DEVSYNC-066-A (conflict 列挙を最初に分類)**: Phase 12 手順に「`git diff --name-only --diff-filter=U` で content conflict を列挙し、**lessons/patterns/changelog 等の append 系のみ**なら `pnpm sync:resolve` 単発で閉じ、source(`.ts/.tsx`) 0 件を確認したら手動 hybridize を始めない」を明記。前回 sync の conflict ファイル一覧を予測に流用しない（取込 dev commit の触る面で範囲が毎回変わる）。
- **SP-DEVSYNC-066-B (union 後の二重化検証ゲート)**: union-merge は競合ブロック両 side を連結するため同一 lesson の二重化リスクがある。Phase 12 検証手順に「`git show HEAD:<f>` / `git show MERGE_HEAD:<f>` の `grep -c '^## '` と結合後の見出し数を照合 + `grep '^## ' <f> | sort | uniq -d` 空 + 連続重複行なし」を二重化検証として登録。Phase 4 risk に「union 解消は同一見出しを二重化し得る」を 1 行追加。
- **SP-DEVSYNC-066-C (merge 後 indexes:rebuild 必須)**: `indexes/*-map.md` / `keywords.json` は `merge=union` で auto-merge されるが正規生成物と一致しないことがあり、CI `verify-indexes-up-to-date` が fail する。Phase 12 検証ゲートを「conflict 解消 → 二重化検証 → `pnpm indexes:rebuild`（drift を別途 stage）→ `pnpm typecheck` → `pnpm lint` → push」の順で固定。`keywords.json` は JSON 妥当性（`node -e 'JSON.parse(...)'`）も確認。
- anti-pattern: ① append 系のみの conflict で auth-view 等 source 解消手順を反射的に始める ② union 後の二重化検証を省略し同一 lesson を二重 commit ③ merge 直後 clean を信じて `indexes:rebuild` を省き CI gate fail ④ 前回 sync の conflict ファイル一覧を今回の予測に流用する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-066 / L-DEVSYNC-059/060/061（skill-only resolver 単発・conflict 0 shape）/ SP-DEVSYNC-065（再 sync は前提を再評価）。

## SP-DEVSYNC-064 docs 系 feature branch が #1014 (公開ページ source) を取り込むと conflict は skill index 1 件 (`topic-map.md` union) のみ — 最小 resolver-only shape（2026-05-30 docs/web-worker-size-limit-fix-spec ← dev #1014）

source code を一切触らない **docs/spec 系 feature branch**（`docs/web-worker-size-limit-fix-spec`）が、dev 側の公開ページ実装 commit（#1014「privacy/terms に PublicHeader/PublicFooter 適用」= `apps/web/app/{privacy,terms}/**` + 関連 skill 追記）を取り込んだケース。branch の接触面が skill 索引のみのため、`git merge dev` 後の unresolved は `aiworkflow-requirements/indexes/topic-map.md` の **union 1 件だけ** に縮退し、`pnpm sync:resolve` 単発（`union-resolved 1 files` + `indexes:rebuild`）で完結した。SP-DEVSYNC-059/061 の resolver-only path のうち **最小規模 shape**（conflict 1 件・keywords.json の `--ours` すら発生せず）。

- **SP-DEVSYNC-064-A (接触面が skill 索引のみの branch は conflict 1 件に縮退する)**: docs/spec 系 branch は `apps/web/**` / `apps/api/**` を編集しないため、dev 側の source commit を取り込んでも source conflict が原理的に発生しない。残るのは skill 索引（`indexes/*.md` / `references/task-workflow-active.md`）の union のみ。Phase 12 implementation-guide の sync-merge 節に「docs branch の取込 conflict は skill 索引 union に閉じる前提」を 1 行記載できる。
- **SP-DEVSYNC-064-B (keywords.json 不発でも resolver は安全)**: `--ours + rebuild` 対象の `keywords.json` が今回 conflict せず（dev/branch の差分が orthogonal）、resolver stdout は `union-resolved 1 files` + `indexes:rebuild` のみ。`ours:` 行が出ないのは異常ではなく shape 依存。resolver 完走判定は **`git ls-files -u` 0** と `all skill / index conflicts resolved` 行で行い、`ours:` 行の有無に依存させない。
- **SP-DEVSYNC-064-C (取込が visual baseline PNG を含んでも docs branch は再取得不要)**: #1014 は `playwright/.../full-visual-*.png` baseline 更新を含むが、docs branch 側はこれら binary を編集しないため `Auto-merging`（fast 取込）で衝突せず、visual baseline 再取得は不要。Phase 4 risk に「docs branch は取込 PNG を素通し・visual regression リスク無し」を 1 行登録できる。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-065 / L-DEVSYNC-059 / L-DEVSYNC-061（skill-only / 最小 shape）/ SP-DEVSYNC-061-A（判定フロー最上段）。

## Playwright visual baseline 安定化 + completed-task path drift 補正パターン（test-stabilization / 2026-05-30 issue-1005-members-ux-playwright-baseline-stabilization）

既存 visual baseline spec が cold start（dev server 新規起動）で flaky になる、または workflow root を `completed-tasks/` へ移動した後に spec/config が旧 active path を参照する場合に適用。`implementation / VISUAL / test-stabilization` として既存 implementation テンプレートで表現する。

- **L-PWBASE-001 (completed-task path drift は双方向)**: dir 移動の close-out では移動 docs だけでなく、その path をハードコードする非ドキュメント資産（`apps/web/playwright/**` の `workflowRoot` 定数 / config `EVIDENCE_DIR` / env default）を `docs/30-workflows/<slug>` リテラルで grep し、移動先 path へ同 wave 補正する。`grep -v` で自分自身を除外する self-ref 見逃しの「参照する側」版。
- **L-PWBASE-002 (explicit screenshot path は default+override 二段)**: `page.screenshot({ path })` を持つ spec はグローバル env だけで出力先を書き換えられない。spec-local canonical default + task 固有 env override の二段構成にする。
- **L-PWBASE-003 (cold compile warm-up は3点同時)**: cold compile が 120s を超える route は (1) webServer ready URL を実 route 化、(2) `webServer.timeout` 拡張、(3) `beforeAll` warm-up の hook timeout 明示、を**同時**に行う。task-specific flag（既存 flag と同型）で localize する。
- **L-PWBASE-004 (evidence-only spec は default matrix 除外)**: 同名 PNG の multi-project 3 重上書きは flake 面を増やす。evidence flag 未設定時は default matrix から除外し、flag/argv 時のみ単一 project 1 回実行に絞る。非 primary project には ignore を入れる。
- **L-PWBASE-005 (mobile collapsed UI は state 属性 wait + capture-only fallback)**: cold-start hydration 直後の click が state に届かない collapsed UI は `data-expanded=true` を wait し、interaction contract を component test が担保している場合に限り DOM 属性固定の capture-only fallback を許容する。

### Anti-pattern
- test infra のみの変更だからと `implementation / VISUAL` タスクを spec-only で close する（実 flaky 解消・path drift 補正が未検証のまま完了扱いになる。Phase 11 で cold-start evidence を取り `implemented_local_evidence_captured` に倒す）。
- 移動 docs の grep だけで dir 移動を完了扱いにし、spec/config の hardcoded path drift を残す。
- timeout を 1 箇所だけ伸ばし、warm-up hook timeout を default のまま放置する（別箇所で flaky が残る）。
- グローバル `PLAYWRIGHT_EVIDENCE_DIR` 設定だけで explicit screenshot path の drift を補正したつもりになる。
- mobile collapsed UI の toggle 機能検証まで visual baseline spec に背負わせる（interaction は component test、baseline は capture-only に責務分離する）。
- 参照: [[lessons-learned-issue-1005-members-ux-playwright-baseline-stabilization-2026-05]] L-I1005-001..006（aiworkflow-requirements 側 workflow 固有知見）。


## SP-DEVSYNC-065 dev sync 4 回目 — lessons reference 自身の append-conflict は union、生成物 topic-map は rebuild（2026-05-30 feat/admin-sidebar-public-return-link ← dev #1025 4 回目）

`feat/admin-sidebar-public-return-link` ← `origin/dev` (HEAD `061d22bf5`「統一サイドバーシェル基盤を追加 #1025」) の 4 回目 sync-merge。conflict は 2 件のみ: `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（生成物・行番号テーブル差分）と `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md`（本ファイル自身）。`keywords.json` / `quick-reference.md` / `resource-map.md` / `references/task-workflow-active.md` は git auto-merge 成功で conflict に上がらなかった（SP-DEVSYNC-064-A の「conflict 集合は毎回変わる」を再確認）。

- **SP-DEVSYNC-065-A (lessons reference 自身の append-conflict)**: 本ファイル (`references/patterns-lessons-and-pitfalls.md`) は HEAD（SP-DEVSYNC-063 節）と dev（L-USS-A 節）が末尾近くに独立追記しただけの append-conflict だった。SP-DEVSYNC-012 の「追記型 SSOT は両側採用」を適用し、marker 4 種を除去して HEAD→dev の順で両節を連結（`||||||| <base>` セクションは破棄）。lessons / patterns を集約する reference は並行 wave が末尾に節を足すため、それ自身が conflict 源になることを Phase 5 手順に明記する。
- **SP-DEVSYNC-065-B (生成物 topic-map は union せず rebuild)**: `indexes/topic-map.md` は `generate-index.js` の生成物。行番号テーブルを手動 union すると行が二重化するため、`git checkout --theirs -- <topic-map>` で valid 化 → `pnpm indexes:rebuild` で source（references/）から再生成して上書き → `git add` が正解（SP-DEVSYNC-029 の rebuild 内包と整合）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-068、SP-DEVSYNC-064（conflict 集合の毎回再確認）、SP-DEVSYNC-012（追記型 SSOT 両側採用）。

## SP-DEVSYNC-067 同 branch を再々 sync しても conflict shape は取込 dev commit の touch surface で毎回変わる — resolver-only path の件数レンジ追補 + 二重化「既存 vs 当該 merge 由来」切り分けを Phase 12 に固定（dev sync-merge / 2026-05-30 feat/member-header-admin-link ← dev #1032）

source code を一切触らない feature branch に dev の skill 反映付き commit（#1032「Worker サイズ制限超過の修正：next/og 撤去 + 静的 OG 画像化 + CI サイズ gate」）を **3 度目** に取り込んだケース。前回（SP-DEVSYNC-066 / #1014 取込）は content conflict が patterns 1 件のみだったが、今回は `aiworkflow-requirements/indexes/{resource-map.md,topic-map.md}` + `references/task-workflow-active.md` + `task-specification-creator/references/patterns-lessons-and-pitfalls.md` の **4 件（全 resolver 対象・source `.ts/.tsx` 0 件）** に振れた。**同 branch・同種 resolver-only path でも conflict 件数は取込 commit の touch surface で 1→4 と変動する**ことを再確認。

- **SP-DEVSYNC-067-A (resolver-only path の件数非依存収束)**: `git merge dev` 後 `git diff --name-only --diff-filter=U` の全件が `.claude/skills/**`（index/active/lessons/patterns）に閉じるなら、件数が 1 でも 4〜7 でも `pnpm sync:resolve` 単発で `git ls-files -u` 0 まで収束する（SP-DEVSYNC-043 の件数レンジ追補）。Phase 12 sync-merge 節に「resolver 対象のみなら conflict 件数で追加工数を見積もらない」を明記。source `.ts/.tsx` が 1 件でも混在する時のみ SP-DEVSYNC-063/064 の wholesale/hybridize 工数を Phase 11/13 へ積む。
- **SP-DEVSYNC-067-B (二重化検証は「既存 vs 当該 merge 由来」を切り分ける)**: union 後の lessons/patterns で見出し番号重複が grep に出ても即「union 二重化」と断じない。Phase 12 検証手順に **`git show HEAD:<f>` と `git show MERGE_HEAD:<f>` の見出し数を取り、merged ≈ HEAD + (MERGE_HEAD の純増) かを確認** を固定（本例 HEAD=112 / MERGE_HEAD=110 / merged=113 で純増 1。重複見出しは HEAD 時点で既存＝過去 union 累積で当該 merge 由来でない）。当該 merge が見出しを大量複製していないこと（純増が MERGE_HEAD 固有分に収まる）だけをゲートにし、既存重複の手動 dedup は別タスク扱い（CI に見出し一意性 gate は無い）。
- **SP-DEVSYNC-067-C (patterns は見出し行限定 grep で締める)**: `grep -oE 'SP-DEVSYNC-[0-9]+'`（参照行込み）は「参照: SP-DEVSYNC-NNN」を拾い誤検出する。**`grep -E '^#+ .*SP-DEVSYNC-[0-9]+'`（見出し行限定）で重複 0** を確認するのが正しい締め方。
- **SP-DEVSYNC-067-D (merge 後 indexes:rebuild 冪等ゲート)**: `pnpm indexes:rebuild` を 2 回連続実行し 2 回目で working↔index の unstaged drift 0（`git diff --name-only indexes/` 空）を確認してから merge commit を確定。CI `verify-indexes-up-to-date` の fail を予防（SP-DEVSYNC-066 の実行手順固定化・本例 5201 kw 冪等）。
- 検証: `git diff --diff-filter=U` 0 件 + 二重化切り分け (B/C) + `pnpm indexes:rebuild` ×2 冪等 + `git grep -lE '^(<<<<<<<|>>>>>>>)'` 空 + `pnpm typecheck` PASS + `pnpm lint` PASS。merge commit `e0431ed31`。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-067 を唯一の正本。L-DEVSYNC-065/066（同 branch 再 sync は前提を再評価）/ SP-DEVSYNC-043（件数レンジ）/ SP-DEVSYNC-066（最頻フロー）。

## SP-DEVSYNC-068 dev が大量 source を add しても feature が当該 path 未接触なら add-only 素通り — source conflict の有無は「feature の改修 path との交差」と「自 feature の dev landed 有無」で決まり file 数では決まらない、を Phase 4 risk / Phase 12 に固定（dev sync-merge / 2026-05-30 feat/member-header-admin-link ← dev #1025）

source を一切触らない（実態は `MemberHeader` + `lib/auth-view` のみ接触の）feature branch に、dev の **source 大量追加 commit**（#1025「統一サイドバーシェル基盤を追加」= `apps/web/src/components/shell/**` 14 file + `tokens.css` 新規追加）を **4 度目** に取り込んだケース。前回（SP-DEVSYNC-067 / #1032 取込）は content conflict 4 件だったが、今回は `aiworkflow-requirements/indexes/topic-map.md` + `task-specification-creator/references/patterns-lessons-and-pitfalls.md` の **2 件（全 resolver 対象・source `.ts/.tsx` 0 件）** に振れ、**#1025 が追加した 14 source file は全て `A`(add-only) で素通り**した。**「dev が source を多く触った＝source conflict が増える」は誤り**で、conflict は feature の改修 path と dev 取込 path の交差でのみ発生することを 4 度目に確定。

- **SP-DEVSYNC-068-A (source conflict 予測は file 数でなく path 交差で行う)**: sync-merge task の Phase 4 risk 見積りで「dev が source を N file 触ったから source 解消工数を積む」と書かない。`git diff HEAD..dev --name-only` ∩ feature の改修 path（実 diff した `apps/**`）が空なら、dev が新規ディレクトリ群を add しても add/add 衝突に到達せず工数ゼロ。Phase 12 sync-merge 節に「source 解消工数は `git diff --name-only --diff-filter=U` に `.ts/.tsx` が現れた時のみ Phase 11/13 へ積む」を明記。
- **SP-DEVSYNC-068-B (`sync:resolve` の `WARN unhandled conflict` 行ゼロ＝source 混在ゼロの完走シグナル)**: Phase 12 検証手順に、`pnpm sync:resolve` stdout が `all skill / index conflicts resolved` で終わり **`WARN unhandled conflict` / `AA` 残置警告が 0 行**であることを `git ls-files -u` 0 と並ぶ二重ゲートとして固定。WARN が出た時のみ SP-DEVSYNC-063/064 の auth-view wholesale/hybridize 分岐へ（前回 #1013 取込では WARN が出て AA が残ったのと対照）。
- **SP-DEVSYNC-068-C (自 feature の dev landed で source conflict は self-resolve する)**: 同一 feature を再 sync するうち、自 branch の source（例 `lib/auth-view`）が別 PR 経由で dev へ merge され戻ると、以前 add/add（`AA`）だった unit は **non-conflict 化**する。SP-DEVSYNC-064（ours→theirs 逆転）の更に先の段階として「landed 済みなら衝突自体が消滅」を Phase 4 に追記。判定は `git log origin/dev --oneline | grep <feature の該当 commit / PR>`。
- **SP-DEVSYNC-068-D (sync-merge 検証は `typecheck`/`lint` green を test/CI green と混同しない — Phase 12 に `gh pr checks` 確認を固定)**: sync-merge task の Phase 12 検証手順で `typecheck`/`lint` PASS を CI green の代理にしない。**async server component 化（`getAuthView()` 追加等で layout を `async` 化）に伴う spec 追従漏れ**は型エラーにならず test だけ赤になる（`render(<Layout/>)` の同期 render が空 DOM を返す）。修正は canonical `(public)/layout.spec.tsx` パターン（`vi.mock` で `getAuthView` を guest 固定 + `render(await Layout({children}))` + 各 `it` を `async` 化）へ揃える。Phase 12 に「push 後 `gh pr checks <PR>` で `coverage-gate-shard` 等の test gate 含む全 check を確認」を必須ステップとして明記し、既存赤（merge 起因でない潜在 fail）も同列に拾う。
- 検証: `git diff --diff-filter=U` 0 件（skill-only 2 件）+ `sync:resolve` WARN 0 行 + `pnpm indexes:rebuild` md5 一致冪等（topic-map `56253ba6…`）+ `git grep -lE '^(<<<<<<<|>>>>>>>)'` 空 + `pnpm typecheck` PASS + `pnpm lint` PASS + **`gh pr checks <PR>` 全 check green**。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-068 を唯一の正本。SP-DEVSYNC-067（前回 #1032・4 件・件数非依存収束）/ SP-DEVSYNC-063/064（source AA が出た対照例＝今回は WARN 0 で不発）/ SP-DEVSYNC-043（件数レンジ）/ SP-DEVSYNC-066（最頻フロー）。

## SP-DEVSYNC-069 feature branch が full アーキ移行を先行完了 + dev が個別 PR を landed した非対称マージ — DU は移行先存在で削除採用、AA は OURS-superset、`testIgnore` は union、dev 専用 data 属性は新 shell へ port、孤立 `.snap` は `git rm`（dev sync-merge / 2026-05-30 docs/task-f-visual-baseline-smoke-spec ← dev `9d9884958`）

長命 feature branch が unified-sidebar-shell の **Task A–F を一括 landed**（旧 `AdminSidebar`/`MemberHeader`+spec 削除・`privacy`/`terms` を `(public)/` へ移動・`shell/**` 新規）した一方、dev が同テーマの **細粒度 follow-up PR を別々に landed**（#1020/#1026/#1023）し旧構造を保持したまま、という非対称 sync-merge（content/AA/DU 計 23 件）。SP-DEVSYNC-066 の混合 shape を **production source の modify/delete** と **OURS が superset の add/add** へ拡張する。

- **SP-DEVSYNC-069-A (DU = HEAD 削除 / dev 修正 の production source は移行先実在で削除採用)**: SP-DEVSYNC-066-B（workflow root migration の stale dir 削除）と同ロジックを production source へ適用。Phase 12 implementation-guide に「DU は `git log <merge-base>..HEAD -- <path>` で削除起因 commit を確認 → `git ls-tree -r HEAD --name-only | grep <route/basename>` で移行先（例 `(public)/privacy`・`shell/` 置換）の実在を確認 → 削除後に `git grep -n '<deleted import path>' -- 'apps/**/*.ts(x)'` が 0 references なら `git rm`」を手順化。dev 側の当該ファイル修正（prop 追加等）は新構造の上位 layout に吸収される dead と判定。
- **SP-DEVSYNC-069-B (AA superset 判定は方向非依存・OURS-superset の鏡像)**: SP-DEVSYNC-066-A の「他 file の import を grep」を方向非依存で適用。`git show :2:<f>`/`:3:<f>` を diff し、追加 export（例 `roleDisplayLabel`）を **どちら側の他 shell file が参照しているか**を grep。OURS が superset なら `--ours`（本例）、dev が superset なら `--theirs`（SP-DEVSYNC-066-A）。型 1 行 vs フル実装の非対称も同じ grep で決まる。
- **SP-DEVSYNC-069-C (`testIgnore` 等の正規表現/glob 配列 conflict は union)**: 両側が各自の専用 project/test を ignore 配列に足しているだけなら両 entry を残す。片側採用は他方の test を共有 project で二重実行させる。Phase 12 に「playwright.config / vitest config の `testIgnore`/`exclude` 配列 conflict は union 解消」を明記。
- **SP-DEVSYNC-069-D (architecture 置換 layout でも dev 追加 data 属性は新 wrapper へ port)**: 旧 layout を新 shell へ置換する UU で、dev が追加した `data-auth-state` 等の data 属性は visual baseline / playwright DOM assertion の契約。OURS の新 wrapper 最上位 element へ port して test 赤を予防。`schemaDiffCount`/旧 component import など新構造に不在の依存は採用不能なので OURS 構造を基軸にし、保全するのは「副作用のない data 属性のみ」に限定する。
- **SP-DEVSYNC-069-E (OURS spec 採用後の孤立 `.snap` は `git rm`・完走判定に vitest obsolete 0 を追加)**: マージで dev が `__snapshots__/*.snap` を add(A) したが採用した spec が `toMatchSnapshot` 不使用なら vitest が `N obsolete` を報告。snapshot file を `git rm`（dir 空なら消す）。Phase 12 検証ゲートに「focused vitest の `obsolete` 0」を `git ls-files -u` 0 と並べる。
- **SP-DEVSYNC-069-F (PR が `CONFLICTING` だと `pull_request` workflow は走らない / 削除済 component の後続 PR は付随テストごと削除)**: baseline push や 空コミットで CI を再トリガーしても `gh pr checks` が `no checks reported`（`pull_request_target` triage だけ動く）なら、まず `gh pr view <N> --json mergeable` を確認する。`CONFLICTING` だと GitHub は merge ref を作れず `pull_request` workflow を一切起動しない。`git fetch origin <base>` → `git merge origin/<base>` で再 sync し mergeable へ戻してから push する。Phase 12 sync-merge 節に「visual baseline 撮影は『PR mergeable な間に』完結させ、bot push 後に dev が進んだら再 sync してから空コミット」を明記。さらに **後続 PR が HEAD 削除済 component を modify した DU は削除採用 + その component source を `readFile`/import する付随テスト（contract / component spec）も同時に `git rm -f`**（staged 済 add は `-f` 必須）を SP-DEVSYNC-069-A の付帯ルールにする。
- 検証: `git diff --diff-filter=U` 0 件 + marker 残存 `git grep -nE '^(<<<<<<< |>>>>>>> )'` 空 + 削除 import 残参照 `git grep` 0 + `pnpm typecheck`（6 packages Done）+ `pnpm lint`（exit 0）+ shell/layout focused vitest **38 passed / obsolete 0** + `pnpm indexes:rebuild` 冪等。merge commit `e077de317`（初回）/ `f2cffb759`（#1021 再 sync）、`.snap` 削除は別 docs commit。`pull_request` 再起動には mergeable 復帰後の push が必須。
- **SP-DEVSYNC-069-G (per-layer header/sidebar → unified shell 統合 PR は旧 DOM 契約の e2e を同 wave で移行する)**: shell 統合タスクの Phase 4 risk / Phase 12 に「旧 `[data-component="public-header"]` / `[data-testid="member-header"|"admin-shell"]` / `[data-shell="topbar"]` / `main[data-route]` / `data-role="auth-cta|member-cta|admin-cta|public-return"` を assert する e2e 群（auth-slot-coverage / prototype-alignment / shell-scrape）を新 shell 契約へ移行する」を必須化。新契約: app-shell 境界 `[data-shell="app-shell"]`+`data-role`(guest→viewer)、wrapper `[data-route-group]`+`data-theme`、`[data-shell="sidebar"]`(mobile hidden/attached・topbar 廃止)、`data-route`/`data-section-rhythm` は **main でなく content div**、role CTA は `SidebarUserMenu` の `[data-action-id="login|profile|admin-dashboard"]`（member/admin は popover 内＝attached 契約・`[data-shell="sidebar"].first()` に scope）。**これら gate は dev `schedule` で skip され `pull_request` のみ実行**されるため dev 緑を移行完了の証跡にせず、必ず PR 上で `gh pr checks` 確認する（SP-DEVSYNC-068-D の `gh pr checks` 必須化を visual/e2e gate へ拡張）。
- 検証: `git diff --diff-filter=U` 0 件 + marker 残存 `git grep -nE '^(<<<<<<< |>>>>>>> )'` 空 + 削除 import 残参照 `git grep` 0 + `pnpm typecheck`（6 packages Done）+ `pnpm lint`（exit 0）+ shell/layout focused vitest **38 passed / obsolete 0** + `pnpm indexes:rebuild` 冪等。merge commit `e077de317`（初回）/ `f2cffb759`（#1021 再 sync）、`.snap` 削除は別 docs commit。`pull_request` 再起動には mergeable 復帰後の push が必須。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-069 を唯一の正本。SP-DEVSYNC-066（add/add superset --theirs / UD stale-dir / Lessons subsection union の原型＝本 SP はその production-source・OURS-superset 鏡像）/ SP-DEVSYNC-068-D（async layout spec 追従 / `gh pr checks` 必須化）。

## SP-DEVSYNC-066 add/add で HEAD が部分定義 + dev がフル実装 → grep で依存側確認 `--theirs`、modify/delete (UD) は workflow root migration 由来なら削除、両側 `## Lessons Learned` は subsection 分割で union 化（2026-05-30 feat/unified-sidebar-shell-user-menu ← dev #1025）

`feat/unified-sidebar-shell-user-menu` ← `dev` の sync-merge で `pnpm sync:resolve` が **5 件 unhandled** を残した混合 shape。SP-DEVSYNC-063（canonical wholesale）の延長で、add/add の正本判定基準を「**他ファイルの import を grep**」に拡張し、UD（modify/delete）の即決ルール、両側 `## Lessons Learned` 節の subsection 分割パターンを追加。

- **SP-DEVSYNC-066-A (AA add/add の正本は grep で決まる)**: shell-config.ts のように HEAD = `export type ShellRole` 1 行のみ、dev = `buildNavForRole`/`isNavItemActive`/フル実装、という非対称 add/add では、`grep -rn buildNavForRole apps/web/src/components/shell/` で `SidebarShell.server.tsx` + `__tests__/shell-config.spec.ts` が dev 側 API に依存していることを確認 → `git checkout --theirs` で機械的に決定。Phase 12 implementation-guide に「add/add は両側 diff を見る前に、まず conflict file が定義する export name で grep」を判定手順として明記。
- **SP-DEVSYNC-066-B (UD modify/delete は workflow root migration 由来なら削除採用)**: `docs/30-workflows/<name>/...` を dev で削除、HEAD で modify した UD は、dev 側で workflow root が `completed-tasks/<name>/` 配下に migration 済の典型シグナル。`ls docs/30-workflows/<name>/ 2>&1` で stale dir 確認 → `git rm` で即決。HEAD 側の modify は migration 前の旧 path に対する更新で、移動先 path で対応する artifact が dev 側に既存している。
- **SP-DEVSYNC-066-C (両側 `## Lessons Learned` は subsection 分割で union 化)**: changelog / inventory / compliance-check の `## Lessons Learned`（または `## Lessons`）節が両側に純粋追加（base = 空）された場合、`### Task A wave` + `### Task B wave` 等の subsection 分割で両保持する。base が空であることを `||||||| <SHA>` セクションで確認すれば、意味的競合ではなく純粋な semantic union と確定する。同 ID の上書きなら最終レポート対象。
- **SP-DEVSYNC-066-D (resolver unhandled 5 件混合 shape の処理順)**: `pnpm sync:resolve` exit 1 後の手動解消は **(1) AA を grep 判定 → (2) UD を dir 存在判定 → (3) UU の見出し節を subsection 分割 → (4) UU の表 row を `;` 結合**の順が最も早い。AA/UD は即決、UU の Lessons/evidence 系のみ手作業時間を要する。typecheck で AA 解消後の自己完結性を、lint で UU 解消後の文法を即検証。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-066 / L-DEVSYNC-063 / L-DEVSYNC-064（canonical wholesale ours/theirs 反転の系列）。

## L-I1016 CLOSED Issue follow-up の implementation target を spec-only close せず先行未消費 state の消費先を実装するパターン（implementation / VISUAL / 2026-05-31 issue-1016 Task E mobile drawer）

`unified-sidebar-shell` の Task E（mobile drawer responsive）が `implementation / VISUAL` でありながら implementation target を列挙したまま `spec_created` で残っていた close-out を、automation-30 review で実装まで閉じた再発防止パターン。L-USS-A（親 nested sub-workflow topology）の続きとして、後続タスクが「先行タスクの未消費 state を消費先実装で閉じる」契約と VISUAL 二段階 status を汎化する。

- **L-I1016-A (Implementation Target Physical Existence Gate)**: `taskType=implementation` の workflow が具体的 `apps/` target を列挙し、当該ワークツリーで実装可能なら、`spec_created` の散文 close を禁止する。実コード + focused test = Gate-B を成立させ、同一 wave で global skill 反映まで行う。spec_created 誠実性より物理存在 Gate を優先。
- **L-I1016-B (先行未消費 state の消費先実装)**: 親タスクが state（`drawerOpen` / `setDrawerOpen`）や slot を先行実装したが消費先が無い場合、後続タスクは別 backlog を増やさず消費先（Trigger / Drawer）を実装して閉じる。着手時に親 workflow の state / prop surface を grep し未消費 `setX` / slot を scope に組み込む。
- **L-I1016-C (client-only helper は既存 boundary に集約)**: `window.matchMedia` 等は feature component 直呼びせず既存 browser boundary module（`is-browser.ts` の `browserMatchMedia()`）に追加し、SSR / jsdom fallback を helper 側に閉じて focused test で 1 箇所網羅。Phase 3 MINOR で検出しても新 module を増やさず既存 boundary を拡張（baseline 解消）。
- **L-I1016-D (VISUAL 二段階 status)**: VISUAL タスクは focused test で Gate-B、視覚証跡は local screenshot `present` / staging visual `pending` を分離追跡。`implemented_local_runtime_pending` を Gate-C 前の正規 state とし、local capture を「VISUAL 完了」と一括表記しない。
- **L-I1016-E (Phase 3 MINOR の current / baseline 分離)**: unassigned-task-detection で MINOR を current（横展開未タスク）と baseline（本サイクル解消）に必須分離し、各 MINOR の解消手段を 1 行で根拠付け。解消済みを誤って current 未タスク化しない。
- **L-I1016-F (識別子の逐語引用)**: implementation-guide Part 2 で型 / `data-*` / breakpoint / storage key / dialog id を phase-02-design から逐語引用し手書き drift を禁止（`shell-drawer` id ↔ `aria-controls` 不一致防止）。
- **anti-pattern**: ① implementation target があるのに no-code spec close ② 未消費 state を別 backlog 化して放置 ③ feature component で `window.*` 直呼び ④ local screenshot を VISUAL 完了扱い ⑤ baseline 解消済 MINOR を current 未タスク化。
- 参照: [[lessons-learned-issue-1016-sidebar-mobile-drawer-responsive-2026-05]] L-I1016-001..007 / [[lessons-learned-unified-sidebar-shell-task-a-2026-05]] L-USS-001..005。

## SP-STATUS-RECON-001 completed workflow status reconciliation close-out gate（2026-05-30 issue-1008）

実コード、Phase 11 evidence、Phase 12 strict 7 が既に merged / archived 済みでも、root / outputs / sub-task の `artifacts.json` が `spec_created` のまま残ると、dashboard・後続 audit・aiworkflow register が互いに矛盾する。status reconciliation タスクでは「docs-only」でも実ファイルの status 補正を同一 wave で完了させる。

- **SP-STATUS-RECON-001-A (root / outputs parity)**: workflow root と `outputs/artifacts.json` が両方ある場合は target state に補正した後で `diff -u <root> <outputs>` を DoD に入れる。片方だけ補正して PASS にしない。
- **SP-STATUS-RECON-001-B (sub-task artifacts scan)**: parent workflow が `tasks/*/artifacts.json` を持つ場合、root だけでなく sub-task の `status` / `metadata.workflow_state` / Phase 1-12 / Phase 13 user-gated 境界を同時に走査する。sub-task の `spec_created` / `pending` 混在は同 wave で正規化する。
- **SP-STATUS-RECON-001-C (Gate evidence path existence)**: Gate-A/B を `passed` に昇格する前に `evidence_path` の実在を `test -e` または `gate-metadata:validate` で確認する。存在しない `outputs/phase-11/manual-test-result.md` などを `passed` 根拠にしない。
- **SP-STATUS-RECON-001-D (strict 7 physical count)**: Phase 12 strict 7 は `main.md` + 6 補助ファイルの物理存在を確認する。compliance check で `strict 7 present` と書く前に `find <workflow>/outputs/phase-12 -maxdepth 1 -type f` で 7 件を確認する。
- **SP-STATUS-RECON-001-E (skill feedback promotion)**: `skill-feedback-report.md` に status drift / close-out 漏れを記録した場合は、owning reference へ promote するか、既存 rule の path と no-op reason を `system-spec-update-summary.md` に残す。所見だけで閉じない。
- **anti-pattern**: (a) root artifacts だけを直す、(b) Phase 12 strict 7 のうち `main.md` を欠いたまま PASS と書く、(c) pending Gate-C の external evidence path 不在を Gate-A/B passed と混同する、(d) `apps/` 差分ゼロを理由に workflow metadata drift を未修正のまま残す。
- 参照: `docs/30-workflows/completed-tasks/issue-1008-members-list-ux-clarity-artifact-status-reconciliation/outputs/phase-12/skill-feedback-report.md`、`references/phase-12-spec.md` strict 7 rules、`references/phase12-skill-feedback-promotion.md` Skill-feedback No-op Truthfulness Gate。

## SP-DEVSYNC-069 add/add で **両側ともフル実装** → 「新しさ・ファイル数」でなく merge 後 consumer が依存する API 側を `--ours` wholesale、token content conflict は block 手編集、`typecheck`（全 consumer compile）+ consumer spec で機械検証（2026-05-30 feat/admin-layout-sidebar-shell-migration ← dev #1020/#1025）

`feat/admin-layout-sidebar-shell-migration` ← `dev` の sync-merge で `apps/web/src/components/shell/**` 19 file + `tokens.css` が add/add (AA)。SP-DEVSYNC-066（非対称 add/add → `--theirs`）の**鏡像**として、両側ともフル実装のケースの正本判定基準を確立する。merge-base に shell/ は無く、dev = 未配線の基盤コンポーネント（#1025/#1020）、ours = admin layout に実配線した統合版（phase-5 で shell は `<main>` 非描画）。

- **SP-DEVSYNC-069-A (両側フル実装は consumer-API 起点で `--ours`/`--theirs` を一意決定)**: 「どちらが新しいか」「ファイル数が多いか」では決めない。`grep -rln "<dir>/" apps/web/app apps/web/src`（dir 自身除外）で merge 後ツリーの全 consumer を列挙し、各 consumer の import/prop を ours/theirs 双方の export 署名と突合。**全 consumer を満たす側を wholesale**。本件は `(admin)/layout.tsx`（`SidebarShellServer` の no-internal-main 契約 + `SidebarMobileTrigger` 依存）と visual-harness（`SidebarUserMenu role/user/collapsed` + `buildNavForRole`/`isNavItemActive` 依存）の両者が ours で充足 → ours wholesale が唯一整合（dev 採用は `<main>` 二重化 + `SidebarMobileTrigger` 不在で破綻）。Phase 12 implementation-guide に「add/add で両側ともフル実装なら consumer の import grep を正本判定の起点にする」を明記。
- **SP-DEVSYNC-069-B (consumer 配線の有無が正本性を覆す)**: 「dev = staging-validated 正本」は doc には妥当だが**未配線の基盤コンポーネント**には適用しない。dev に landed していても実 layout 未配線（consumer が harness のみ）なら、実配線した feature 側が production 整合の正本。判定は `grep` で実 layout consumer の有無を確認。SP-DEVSYNC-066-A（非対称 → 依存側 = dev）との分岐点は「対称/非対称」かつ「配線済み consumer の所在」。
- **SP-DEVSYNC-069-C (token 等 content conflict は block 手編集・`checkout --ours` 禁止)**: 共通祖先のある content conflict（tokens.css）で `git checkout --ours` を使うとファイル全体を奪い反対側の auto-merge 済 hunk を捨てる。conflict marker block のみ Edit。OKLch lightness は `0.96` 小数形と `96%` パーセント形が等価なので shell 本体採用側に揃え `verify:tokens`（91 tracked）drift を出さない。
- **SP-DEVSYNC-069-D (source wholesale 後は typecheck + consumer spec を Phase 12 必須に)**: ours wholesale 後の `pnpm typecheck` は全 consumer（admin layout + visual-harness）を compile するため API 非互換を型エラーで即検出 = 互換の機械証明。SP-DEVSYNC-068-D の「typecheck/lint green ≠ test green」を踏まえ、source wholesale を伴う sync-merge では consumer spec（本件 shell 32 + layout 11 tests、axe critical 0）を Phase 12 で必ず回す。
- **SP-DEVSYNC-069-E (push 後 CI は必須チェックの赤を fix-gate にし、migration DOM 契約 drift は e2e selector 更新・visual baseline は user-gated dispatch)**: Phase 12/13 に「push 後 `gh pr checks` の赤を**必須 vs 非必須**で切り分ける」を固定。必須セットは `gh api repos/{o}/{r}/branches/dev/protection --jq '.required_status_checks.checks[].context'` で確定（本件 = ci / coverage-gate / e2e-tests-coverage-gate / lighthouse-ci / Validate Build）。必須の赤のみ merge をブロックするので最優先。source wholesale を伴う migration（旧コンポ撤去）では **e2e が旧 DOM 契約（`[data-component="admin-nav-item"]` 等）を assert したまま残り**、typecheck/lint/unit で捕まらず push 後 e2e で初めて顕在化する。`grep -rn '<旧 data-component>' apps/web/` で残存 selector を洗い、撤去で消えた contract のみ新契約（`shell-nav-item`）へ更新・維持された contract は触らない。集約ゲート（`e2e-tests-coverage-gate` 等の matrix 合算）は原因 shard 修正で自動 green。非必須 `visual-full` の admin 系 `toHaveScreenshot` 差分は意図的視覚変化（public/member pass・axe/verify:tokens pass で regression でない）でブロックしないため、`gh workflow run playwright-visual-baseline-update.yml --ref <branch> -f reason=...`（`environment: visual-baseline-approval` user gate）で baseline 再生成を dispatch する（macOS ローカル `--update-snapshots` 不可 = L-VISBASE-002）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-069（正本）/ L-DEVSYNC-066（非対称 add/add `--theirs`＝鏡像）/ L-DEVSYNC-063（canonical wholesale ours の原型）/ L-DEVSYNC-068-D（typecheck/lint ≠ test）。

## SP-DEVSYNC-070 modify/delete (UD) で dev が撤去対象コンポーネントに機能追加していたら、削除採用 + 機能を後継へポートして accepted feature を保全（real-app e2e の DOM 契約が porting 要否を決める）（2026-05-30 feat/admin-layout-sidebar-shell-migration ← dev #1021/#1023）

migration（旧コンポ撤去）feature branch へ sync-merge した dev が、**まさに撤去対象のコンポーネントに新機能を追加**していた UD 衝突。SP-DEVSYNC-066-B（workflow root migration 由来の UD は無条件削除）の例外系として、source code の UD で dev が feature を足していた場合の保全則を確立。

- **SP-DEVSYNC-070-A (UD は撤去 vs 機能追加を見分け、機能追加なら porting)**: Phase 12 に「UD は `git show <dev-commit> -- <path>` で dev 修正を必ず読む」を固定。lint/format でなく feature 追加（本件 = 旧 AdminSidebar に `data-role="public-return"` 公開復帰リンク）なら、`git rm` で削除採用しつつ **feature を後継コンポーネント（SidebarShell）へ porting** する 2 段対応。dev に merge 済 = accepted feature を sync-merge で消すのは regression。
- **SP-DEVSYNC-070-B (real-app e2e の DOM 契約が porting 要否の決め手)**: dev が add した spec を `grep -n 'data-role\|toBeVisible\|toHaveCount\|page.goto\|setContent'` で走査し real-app か fixture かを区別。real-app（本件 `auth-slot-coverage.spec.ts` が `/admin` で `[data-role="public-return"]` visible・guest `/` で count 0）が新 DOM 契約を要求するなら後継へ同契約で実装必須。fixture-only + 削除済 source への source-grep のみなら repoint/削除で可。Phase 4 risk に「dev の新規 real-app e2e は撤去対象の DOM 契約を要求し得る」を登録。
- **SP-DEVSYNC-070-C (source-grep test は後継 source へ repoint・assertion を実 markup に合わせる)**: `readFile('<deleted-file>')` する evidence test は ENOENT 確定 fail。後継ファイルへ path 移設 + assertion 文字列を後継 markup に合わせて緩める（完全一致 `<span>…</span>` → 部分一致 + role ガード）。
- **SP-DEVSYNC-070-D (porting 後は後継 unit/spec で role 別 contract 不変を確認)**: shell へ admin-only 要素を足したら後継 spec（member nav item 数 / admin axe critical 0）を Phase 12 で回し role 別描画が壊れていないことを確認（本件 43 tests pass）。public guest route が後継 shell 非経由なら `data-role` の guest-0 契約は自動成立する点も設計確認に含める。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-070（正本）/ L-DEVSYNC-066-B（workflow root migration UD は無条件削除＝対照）/ L-DEVSYNC-069-E（push 後 CI 必須/非必須切り分け）。

## SP-DEVSYNC-071 同 branch の後続 sync で dev が precursor を superseded したら wholesale 方向を `--ours`→`--theirs` に反転し、branch 固有 delta だけ後継 API へ再適用（2026-05-30 feat/admin-layout-sidebar-shell-migration ← dev #1028 3回目 sync）

SP-DEVSYNC-069（add/add 両側フル実装 → consumer-API 起点で wholesale 方向決定）の**時点依存性**を Phase 12 に明記。同じ 2 branch でも dev が後続 PR で feature の責務を追い越し（#1028 で shell を public/member/admin 3 層統一版へ昇格）たら canonical が dev 側へ移り、前回 `--ours` だった shell/** が今回 `--theirs` へ反転する。

- **SP-DEVSYNC-071-A (wholesale 方向は毎 sync 再評価・前回値を流用しない)**: Phase 12 に「前回 sync の wholesale 方向（ours/theirs）を今回へ流用しない」を固定。`git show origin/dev:<file>` + `grep -rln "<dir>/" apps/web/app`（実 layout consumer 数）で**今回時点の consumer 配線数**を取り直す。dev が member/public/admin を配線し ours が admin のみなら `--theirs` へ反転。SP-DEVSYNC-068-C（自 branch source の dev landed 後 self-resolve）の発展形 = dev が superior 版を作ったら wholesale 側が入れ替わる。
- **SP-DEVSYNC-071-B (反転後は branch 固有 delta のみ後継へ翻訳再適用)**: `--theirs` wholesale 後、`git diff <merge-base>..HEAD -- <branch固有path>` で branch だけの delta（admin-only 機能 / 専用 layout / 固有 test）を洗い、後継の prop/DOM 契約（`routeKey`/`data-shell-block`）へマップして再注入。全部を再実装しない（後継の汎用部分は触らない）。
- **SP-DEVSYNC-071-C (後継が main を内部描画するなら専用 layout の自前 main を撤去)**: 後継 shell が semantic `<main>` を持つ統一版なら、専用 layout（admin）の自前 `<main>` は二重化。`routeKey`/`sectionRhythm` を渡し padding は wrapper div で保持（兄弟 layout = (member)/(public) の消費形を template に）。layout spec の mock stub も渡し props を data 属性で観測する形へ更新（自前 main 撤去で `main[data-route]` assertion が stub 下 0 になるため）。
- **SP-DEVSYNC-071-D (固有 test の selector を後継 DOM 契約へ unit+e2e 一括追従)**: `--theirs` 後、branch 固有 test が旧 DOM 契約を assert したまま残り push 後 CI で落ちる。`grep -rn '<旧 selector>' apps/web/{src,playwright}` で洗い `perl -i -pe` で後継契約へ一括置換。vitest（`SidebarShell.server.spec.tsx`）+ playwright（`admin-shell-topbar-sidebar-integration.spec.ts`）双方を Phase 12 検証前に揃える。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-071（正本）/ L-DEVSYNC-069（反転前 `--ours`）/ L-DEVSYNC-070（public-return porting 初出）/ L-DEVSYNC-068-C（self-resolve 発展形）。

## SP-DEVSYNC-072 skill index/changelog **のみ**の衝突は `pnpm sync:resolve` 単独でゼロ手作業解消＝source-shape 判定を出さない「クリーン基準ケース」（2026-05-31 feat/issue-983-member-photo-avatar-r2-storage ← dev 10 commits）

SP-DEVSYNC-063〜071 の source-shape 判定（wholesale ours/theirs・grep-consumer・graft）が**出番なしになる対照ベースライン**を Phase 12 に固定する。本 branch の変更（admin-managed asset = D1 メタ + R2 バイナリ + presign route）が dev 側 10 commits の touch path と semantic に独立だと、conflict は skill index/changelog 派生物のみに限局し、3 層予防（`.gitattributes` union + resolver + indexes:rebuild 決定性）が単独で吸収する。

- **SP-DEVSYNC-072-A (conflict file の層を最初に仕分ける)**: sync-merge task の Phase 12 implementation-guide に「`git diff --name-only --diff-filter=U` の結果が**全て `.claude/skills/**` 配下なら即 `pnpm sync:resolve`** → `git ls-files -u` 0 確認 → `git commit --no-edit` で完了。source code（`apps/`/`packages/`）が 1 件でも混ざる場合のみ SP-DEVSYNC-063〜071 の shape 判定へ」を固定フローとして記載。無駄な手解析を避ける最上段ゲート。
- **SP-DEVSYNC-072-B (残存確認は `git ls-files -u` を正本)**: `grep '<<<<<<<'` ではなく `git ls-files -u` が空＝完全解消（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-072-B / `git|head` exit-code pitfall と同趣旨）。resolver 内蔵 rebuild が drift を出し切れば merge 後の単独 `chore(indexes)` commit も不要（L-DEVSYNC-012 最良ケース連番）。
- **SP-DEVSYNC-072-C (クリーン基準ケースは branch 非依存・複数回再現する baseline として扱う)**: 2026-05-31 `docs/issue-988-identity-conflicts-merge-optimistic-update` ← dev（ahead 3 / behind 7）でも、issue-983 と**同一の 6 file（同じ skill index/changelog/active 系）のみ衝突** → `pnpm sync:resolve` 単独 → `git ls-files -u` 0 → `git commit --no-edit`（merge commit `af596e806`）でゼロ手作業解消を再現。SP-DEVSYNC-072 は単発でなく「**docs/タスク成果物系 branch が dev の source touch path と semantic 独立な限り常に成立する baseline**」＝Phase 12 では「skill-only conflict は再現性のある既定フロー（resolver 直行）」と明記し、source 混在時のみ shape 判定へ branch する二段ゲートを固定する。
- **SP-DEVSYNC-072-D (feat 系 branch + 衝突 file 数可変でも baseline は不変)**: 2026-05-31 `feat/issue-1007-density-toggle-help-hint-hardening` ← dev（behind 8）の 4 例目再現。衝突は **5 file 全て `aiworkflow-requirements` の index/reference 系のみ**（`indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}` + `references/task-workflow-active.md`）で source 0 件 → `pnpm sync:resolve` 単独（union 4 + keywords.json `--ours`+rebuild 1）→ `git ls-files -u` 0 → `git commit --no-edit`（merge commit `c6d2ed07c`）。衝突 file 数は sync ごとに可変（6→6→2→5）だが「**全て `.claude/skills/**` 配下なら resolver 直行**」の層仕分けは不変。docs 系 branch だけでなく feat 系（DensityToggle help-hint hardening）でも、変更 path が dev の source touch path と独立なら成立することを確認。判定は「衝突したか」を `git diff --name-only --diff-filter=U` で取り、出た file の層だけ見る（union 対象でも CONFLICT が出なければ触らない）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-072（正本・再現確認含む）/ L-DEVSYNC-002（index 派生物 rebuild 決定性）/ L-DEVSYNC-007（3 層予防）/ SP-DEVSYNC-067/071（対照: source code が混ざり shape 判定が要るケース）。

## SP-DEVSYNC-073 playwright `testIgnore`/`testMatch` の「両側が別エントリを追加」型 conflict は片側採用でなく正規表現 union（2026-05-31 docs/issue-1005-members-ux-playwright-baseline-stabilization ← dev 5 commits）

SP-DEVSYNC-072 の「skill-only クリーン基準」に source 1 件（`apps/web/playwright.config.ts`）が混ざった混在 shape の最小例を Phase 12 に固定する。`testIgnore` 配列の 3-way diff3 で **HEAD と dev がそれぞれ base に無い別エントリを追加**しているとき（本例 HEAD=`...membersUxClarityNonPrimaryIgnore` / dev=`/sidebar-shell\/.*\.spec\.ts$/`）、これは「同一行への意味的競合」ではなく**独立追加**なので片側採用は他方の除外パターンを喪失させる。両エントリ保持の union が両 branch の意図を同時に満たす唯一解。

- **SP-DEVSYNC-073-A (配列 conflict はまず「両側追加か / 一方が superset か」を diff3 で判定)**: `||||||| <base>` の base 行を両側と並べ、双方が base に無いエントリを足していれば union 確定。一方が他方の上位集合なら superset 採用（SP-DEVSYNC-067-A と分岐）。`testIgnore`/`testMatch` は除外・選択パターンの**集合**なので和集合がデフォルト正解で、意味的競合（同一 key の値変更）でない限り片側 wholesale を選ばない。
- **SP-DEVSYNC-073-B (union 結果は同 config の兄弟 project の並びで自己検証)**: 同 `playwright.config.ts` 内の類似 project（本例 `mobile-webkit` が既に `sidebar-shell` + `membersUxClarityNonPrimaryIgnore` の両方を保持）を template にして順序を揃える。新規に矛盾した順序を作らず、レビュー時に「兄弟と同形」を整合根拠にする。
- **SP-DEVSYNC-073-C (skill + source 混在は層別に解消経路を分けてから一括確認)**: skill 系は `pnpm sync:resolve`、source（`apps/`/`packages/`）は手動 Edit と経路を分け、両方終えてから `git ls-files -u` 0 / `git diff --check` 0 を**一括で**確認する（SP-DEVSYNC-072-A の混在版）。`.gitattributes` の `merge=union` は source に効かないため source の union は必ず手動。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-073（正本）/ L-DEVSYNC-069（playwright testIgnore union の初出）/ L-DEVSYNC-072（skill-only クリーン基準・本件はその source 混在版）/ SP-DEVSYNC-067-A（一方が superset の add/add）。

## SP-DEVSYNC-069 同一ディレクトリを並行実装した大規模 add/add は resolver 不可・dev 基盤採用 + feature 機能移植の 3-way 設計統合になる（2026-05-30 feat/task-spec-unified-sidebar-shell-task-e-mobile-drawer ← dev #1025 系）

`feat/...-task-e-mobile-drawer` ← `dev` で、**両ブランチが同じ `apps/web/src/components/shell/**` を独立実装**していたため `pnpm sync:resolve` 後も **14 source file + `tokens.css` が手動残置**（resolver 対象は index/inventory の 3 件のみ吸収）。SP-DEVSYNC-066-A の grep 判定の延長だが、ここでは「片方が部分定義」でなく「**両方がフル実装で設計が分岐**（ours=`SidebarShellContext`+`SidebarDrawer`+`collapsed` boolean prop、theirs=dev の `useSidebarState`+`userMenuSlot`+`mode` prop）」という質的に重い衝突で、`--ours`/`--theirs` の二択では機能が壊れる。dev 基盤を正本採用しつつ feature 固有機能を新 API へ移植する 3-way 統合が必要になる。

- **SP-DEVSYNC-069-A (正本は「他 Task 統合が進んだ側」= dev 基盤、を file 群単位で先に固定)**: `git ls-tree -r --name-only HEAD <dir>` と `... dev <dir>` を比較し、**dev 側だけが持つ file 群**（本例 `SidebarUserAvatar/Menu`, `user-menu-config.ts`）の有無で「dev が後続 Task を統合した最新基盤」と判定。feature は dev の旧スナップショット上の実装と確定したら、衝突 file の大半（新 API に他箇所が依存するもの）を `git checkout --theirs` で機械採用する。判定根拠は `git diff :2:<f> :3:<f>` の JSX prop 形（`mode=` vs `collapsed=`）。
- **SP-DEVSYNC-069-B (feature 固有機能は新 API へ移植し、ours 全採用しない)**: feature だけが持つ file（本例 `SidebarDrawer.tsx`/`SidebarMobileTrigger.tsx`）は add/add でないため自動マージで残るが、それを mount する側（`SidebarShell.tsx`）を `--ours` 採用すると dev の新 API（`userMenuSlot`/`DefaultUserChip`）を失う。**mount 側は theirs ベース + feature 機能の差分ブロックだけ手で足す**（drawer の overlay mount を dev 版 `SidebarShell` に追記）。feature が依存する補助 export（本例 `MenuIcon`）が dev 側 icons に無ければ、theirs 版へ和集合で**追加**する（dev=`ShellIcon` のみ → `MenuIcon` を SVGProps 受けで足す）。
- **SP-DEVSYNC-069-C (機能優位な hook は shape 一致を確認して ours 採用)**: 両側が同じ public shape を返す hook（本例 `useSidebarState` は両者とも `{mode,drawerOpen,toggleCollapsed,setDrawerOpen}`）は、**機能が多い側を `--ours` 採用**してよい（ours は `usePathname` で drawer auto-close + viewport 既定 collapse を持つ）。前提は (1) 返り値 shape が theirs と同一で他箇所の利用を壊さない、(2) 依存 util（`browserLocalStorage`/`browserDocument`）が merge 後 tree に存在する、の 2 点を grep で確認。spec も対応する側（ours）を採用。
- **SP-DEVSYNC-069-D (CSS token は和集合 — dev 値を正本に feature 固有 token を追加)**: `tokens.css` の `--shell-*` ブロックが両側で別定義された場合、dev component が参照する値（`--shell-bar-bg`/`--shell-active-bg`）は **dev 値を採用**し、feature の drawer/trigger だけが参照する token（`--shell-fg`/`--shell-overlay`/`--shell-active-fg`）を**追加**する和集合にする。oklch 直値は tokens.css 内なら `verify-design-tokens` の `missing-in-09b` 対象外（`pnpm verify:tokens` で 91 tracked green を確認）。
- **SP-DEVSYNC-069-E (slot を 2 箇所 render する時は `useId` 衝突を避ける)**: 同じ `ReactNode` slot（`userMenuSlot`）を aside と drawer の両方に配置すると、slot 内の `useId`/native `<details>` id が二重化する。**drawer 側は `userMenuSlot` を出さず `DefaultUserChip` のみ**に限定し、aside 側に slot を残す（[[patterns-mobile-ui-primitive-3point-sync]] / L-DTHH-001 の id 衝突回避と同根）。
- 検証: `git diff --diff-filter=U` 0 件 + `git grep -lE '^(<<<<<<<|>>>>>>>)'` 空 + **focused vitest（`apps/web/src/components/shell` 47 PASS）で統合 component の動作を直接確認** + `pnpm typecheck` 6 packages Done + `pnpm lint` exit 0 + `pnpm verify:tokens` 91 tracked。source 大規模 add/add は typecheck/lint だけでなく**該当ディレクトリの focused vitest を必須ゲート**にする（mount 配線ミスは型を通っても test で落ちる）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]]、aiworkflow inventory `workflow-unified-sidebar-shell-public-and-admin-artifact-inventory.md` L-USSTE-007（同知見の workflow 固有版）。SP-DEVSYNC-066-A（部分定義 add/add の grep 判定）/ SP-DEVSYNC-068-A（source conflict は path 交差で決まる）の質的拡張版。

- **SP-DEVSYNC-067-A (両側 API 互換の AA は grep で決まらない → 機能完全性で `--ours`/`--theirs`)**: 同 path の add/add で `grep -rn <export> <dir>` しても **両側が同一の公開 API（例 `SidebarShellServer({activePath, mobileTriggerSlot})`）を持つ**場合、grep-consumer rule（SP-DEVSYNC-066-A）は決着しない。次の tiebreaker は「**どちらが consumer の使う機能を完全に render するか**」。`git show :2:<file> | grep <feature-render>`（例 `import SidebarDrawer` / `<SidebarDrawer open=`）で feature-complete 側を片側 wholesale 採用。**混在採用は dead-code/型不整合を生むので禁止**、片側 wholesale → `pnpm typecheck` で自己完結性検証。SP-DEVSYNC-066-A（型 1 行 vs フル実装で `--theirs`）と**逆の `--ours` になりうる**: 完全集合が HEAD 側のこともある。
- **SP-DEVSYNC-067-B (route-group 移行 vs 旧 path inline 改修は branch goal が方向の正本)**: `app/x/page.tsx` → `app/(group)/x/page.tsx` への route-group 移行 branch と、dev の旧 path inline 改修（例 page 内 `PublicHeader` mount）が衝突した場合、**branch の commit message の goal（「〜へ統合」「旧〜削除」）が supersede 方向の正本**。新方式 page/layout を `--ours` wholesale、旧方式 source（`PublicHeader.tsx` 等）は UD modify/delete なら `git rm` で削除維持、旧 path 配下の stale test も `git rm`。
- **SP-DEVSYNC-067-C (dev の独立 feature が HEAD に未取込なら test を捨てず graft)**: dev 側 PR の feature（例 #1011 認証済み `/login` redirect）が HEAD の同名ファイルに未反映で、dev test だけ取り込まれた場合、**test を削除せず feature guard を HEAD 実装へ手で graft**（両 intent 保持 = regression 回避）。`git show dev:<old-path>` で実装取得 → HEAD の対応位置へ移植 → import path を HEAD の階層に合わせる。
- **SP-DEVSYNC-067-D (file-location conflict で relocate した test は相対 import を route-group 階層分 +1 補正)**: `()` route-group へ relocate した test は 1 階層深くなる。`../page`（同 dir 基準）は不変だが `../../../src/...`（web root 基準）は `../../../../` へ +1 補正。`pnpm exec vitest run <relocated>` で import 解決を即確認。
- **SP-DEVSYNC-067-E (孤児 snapshot は `grep -c toMatchSnapshot`=0 を根拠に `git rm`)**: `--ours` で勝った spec が snapshot 不使用なのに `--theirs` 由来の `__snapshots__/*.snap` が残ると vitest `N obsolete` 警告 → CI ノイズ。`grep -c "toMatchSnapshot\|MatchInlineSnapshot" <spec>` = 0 を確認して即 `git rm`。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-067（同 shell-config.ts AA で L-DEVSYNC-066 と逆の `--ours` を採った対照例 + graft/relocate/snapshot の複合 shape）。

---

## SP-I224: batch fetch 再利用と公開 API opt-in 拡張（Issue #224 / 2026-05-31）

> 公開一覧などで「既存 batch helper を再利用して N+1 を防ぎつつ、後方互換の response shape を維持して項目を増やす」タスクの汎化パターン。

- **SP-I224-A (層責務)**: batch helper はフラット配列を返し、`member_id` 等のキーで Map に整形する groupBy は use-case 層に置く。repository は最小の純粋 I/O に保ち、Map / 配列の整形責務を repository に持ち込まない。
- **SP-I224-B (IN 句安全性)**: `col IN (...)` の placeholder は入力件数から動的生成（`ids.map(() => '?').join(',')`）して `.bind(...ids)` で展開。入力が空配列なら早期 return で query 自体を発行しない（空 IN 句の SQL エラー / 無駄な往復を防ぐ）。
- **SP-I224-C (opt-in 拡張)**: 公開 response の項目追加は `expand` 等の whitelist による opt-in。repeated / comma-separated を両対応で正規化し未知値は黙殺・常に配列化。未指定時は既存 `appliedQuery` の key 集合を厳密維持し query も増やさない。
- **SP-I224-D (fail-close + schema 連動)**: 公開向け値は内部 row をそのまま流さず allow-list で再構成し、`strict()` zod で nested extra field を reject。shared zod・型・test を同一サイクルで連動更新し片側 drift を作らない。
- **anti-pattern**: 再利用する helper の返り値 shape（配列 / Map / null 許容）を実コード未確認のまま Phase 2 設計へ書く（groupBy 配線が破綻する）。Phase 1 で対象 helper / 型の signature を verbatim 引用して固定する（`phase-template-phase1.md` 参照）。
- 参照: [[lessons-learned-issue-224-public-members-tags-batch-fetch-2026-05]] L-I224-001..010。

## SP-CFGUARD zero-dep 設定ファイル invariant を正規表現 guard test で固定するパターン（2026-05-31 issue-264 wrangler cron free-tier guard）

依存追加ゼロで設定ファイル（TOML/INI/YAML/JSON5 等）の section 単位 invariant（値一致・上限・禁止値不在・section 間 parity）を専用パーサなしの正規表現 + 既存 vitest だけで担保する guard test の汎化。CLOSED/obsolete issue の「実測で値を決める」要求を「確定値が drift しない保証」へ再スコープする判定も含む。

- **SP-CFGUARD-001 (section 見出しは `^\[name\]$` 行アンカーで一意化 — substring 一致禁止)**: `"[triggers]"` は `"[env.staging.triggers]"` の suffix。素朴 `text.indexOf("[triggers]")` は他 section を誤ヒットする。`new RegExp('^\\[' + escapeRegExp(name) + '\\]\\s*(?:#.*)?$', 'm')` で行境界に固定し、末尾コメントも許容。設定ファイル系で section 名が他 section の部分文字列になり得る前提を Phase 4 リスクへ登録。
- **SP-CFGUARD-002 (`match.index === 0` を falsy で absent 扱いしない)**: 見出しがファイル先頭にあると `match.index === 0` → `!index` が `true` で「未発見」分岐に誤入する。存在判定は `match == null`、offset は `match.index ?? 0` で補完する。truthy チェックを位置に使わない。
- **SP-CFGUARD-003 (動的 RegExp 埋め込み値は escape + 入力正規化の二段)**: section 名の `.`/`[`/`]` は RegExp メタ文字。`escapeRegExp` でエスケープし、bracketed/非 bracketed 両入力を受ける API は `normalizeSectionHeader`（`^\[`/`\]$` 剥がし）で先に正規化してから RegExp を組む。テストで両入力同結果を assert。
- **SP-CFGUARD-004 (コメント除去 → 値抽出の順序固定 + 配列は `[^\]]*` で改行込みキャプチャ + 次見出しで上界)**: (1) 値抽出前に section body 各行から `#.*$` を除去し commented-out な禁止値を拾わない、(2) 複数行配列は `/key\s*=\s*\[([^\]]*)\]/m` の否定文字クラスで dotAll 不要に改行を跨ぐ、(3) body は `afterHeader.search(/^\s*\[/m)` で次見出し直前までに切り、次 section の値を誤読しない。3 点を個別テストで担保。
- **SP-CFGUARD-005 (文書ではなく実行可能 guard で enforcement — 予算/上限/一致/禁止値/parity を test 化)**: 予算（free-tier 上限 N に対し M 本）は ADR/spec の解析記述で結論できるが、文書は「N+1 本目混入」「legacy 禁止値の再登録」を検知できない。`it.each` で section ごとに canonical 値一致・上限以下・禁止値不在を、加えて default/staging/production の parity を 1 test で固定。zero-dep を守るなら専用パーサを足さず正規表現 + vitest で閉じる（CONST_004 enforcement 化）。
- **SP-CFGUARD-006 (CLOSED/obsolete issue は陳腐化 AC と本質課題を分離して再スコープ)**: 「実測で値を決める」が移行・確定で陳腐化した場合、Issue を再 open せず `artifacts.json.metadata.supersedes` に旧 unassigned task を記録（陳腐化部分）、未達の本質課題（確定値の drift 保証）だけを guard test 成果物へ付け替える。Phase 1 調査で「要求自体の陳腐化」と「未達の核」を分けて結論する。
- **anti-pattern**: (1) substring で section 探索（部分文字列衝突）、(2) `match.index` truthy 判定（先頭 section 落ち）、(3) 動的 RegExp に section 名を素埋め（メタ文字暴発）、(4) コメント除去を値抽出後に回す（commented-out 値混入）、(5) 文書記述だけで「予算 OK」を結論し test を書かない（drift 無検知）。
- 参照: [[lessons-learned-issue-264-cron-schedule-free-tier-guard-2026-05]] L-I264-001..008。implementation-guide の参照実装は素朴 `indexOf`/`split` 版を残さず shipped のアンカー正規表現/`matchAll` 版に揃える（流用時の罠の再生産を防ぐ）。


### SP-DEVSYNC-047: skill-index-only クリーン sync の「衝突 file 数は可変」「sub-worktree の `.git` はファイル」2 ナンスを仕様書 Phase 9 sync-merge 節に固定（2026-05-31 追加）

- 事象: 2026-05-31 `docs/issue-987-identity-conflicts-audit-log-admin-ui` ← dev（9 commits 遅れ）sync-merge。`.gitattributes merge=union` 対象は複数あるが CONFLICT マーカーが残ったのは `indexes/keywords.json` と `indexes/topic-map.md` の **2 file のみ**（残り union 対象は Auto-merging で衝突なし結合）。source conflict 0 件で SP-DEVSYNC-045 / L-DEVSYNC-072 の skill-index-only クリーンケースに該当 → `pnpm sync:resolve` 単独でゼロ手作業解消。
- Why（仕様書に固定すべき 2 点）:
  1. **衝突 file 数は sync ごとに変動**する。union 対象に挙がっていても両 branch が同じ hunk を触らなければ git は自動結合し CONFLICT を出さない。仕様書の sync-merge 節は「union 対象 N file が必ず衝突する」と書かず「`git diff --name-only --diff-filter=U` に出た file だけを resolver 対象にする」と書く。
  2. **sub-worktree の `.git` はファイル**（`gitdir: …` ポインタ）。branch-sync の lock/log を `.git/...` に直書きする手順は sub-worktree で `not a directory` 失敗する。lock/log path は `git rev-parse --git-common-dir` 基準で組む（worktree 固有 dir が要る時のみ `git rev-parse --git-dir`）。
- How to apply（task 仕様書での逐語化）: Phase 9 sync-merge 節に以下を追記:
  1. **衝突判定の正本**: `git diff --name-only --diff-filter=U` の出力が衝突 file の唯一の正本。全て `.claude/skills/**` 配下なら `pnpm sync:resolve` 単独で完結し `git ls-files -u` 0 を確認して `git commit --no-edit`。`apps/`/`packages/` が 1 件でも混ざる場合のみ SP-DEVSYNC-038/044/067 の shape 判定へ。
  2. **sync ツーリング path**: lock/log を扱う手順は `GD=$(git rev-parse --git-common-dir)` を起点にする。`.git/...` 直書きは main worktree 専用と注記。
- 適用範囲外: source code conflict を含む sync（SP-DEVSYNC-038/044/067）、resolver の `index.lock` 偽陽性 fallback（SP-DEVSYNC-045）。
- 検証: CONFLICT 2 → `pnpm sync:resolve` exit 0 → `git diff --diff-filter=U` 0 → merge commit `93f030d2c` → `pnpm typecheck` 6 packages Done → `pnpm lint` exit 0（`publicConsent` 2 件は mode=warning の既存）→ `pnpm indexes:rebuild` 冪等（5207 keywords・drift 0）。
- 参照: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-073、SP-DEVSYNC-045（resolver fallback）、L-DEVSYNC-072（クリーン基準ケース初出）。

## SP-DEVSYNC-070 completed-tasks の playwright/monocart evidence は machine-path 焼き込みで content-conflict 化し resolver(union)対象外 → 1 テストラン単位で同一サイド一括採用、phase12 doc は evidence と同サイド（2026-05-30 feat/issue-982-drawer-tag-pill-editing ← dev #1033/#1028/#1023）

`feat/issue-982-drawer-tag-pill-editing` ← `dev` の sync-merge で `pnpm sync:resolve` が skill index 系 5 件を union 解消した後、`docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/` の **playwright evidence 5 件が `WARN unhandled conflict` で残置**した。SP-DEVSYNC-069 は「両ブランチが同じ source を並行実装した AA」だったが、本件は **両ブランチが各自の worktree で同じ evidence を独立再生成しただけ**の質的に軽い衝突で、解消は機械的な片側 wholesale で済む。タスク仕様書作成時に completed-tasks の evidence を同梱・再生成する Phase 11 を持つ workflow は、後続の sync-merge でこの衝突を必ず生むため設計段階で想定する。

- **SP-DEVSYNC-070-A (evidence content-conflict の実体は worktree 絶対パス焼き込み)**: `playwright-report/results.json` の `configFile`/`rootDir`/`outputDir` や monocart の生成物は実行時の worktree 絶対パス（`…/.worktrees/<task-dir>/…`）を焼き込む。HEAD と dev が別 worktree で再生成すれば必ず content-conflict 化する。`git show :2:<results.json> | grep -m1 configFile` と `:3:` を比べて「両側 path 差のみ・意味等価」を裏取りする。
- **SP-DEVSYNC-070-B (HTML/JSON evidence は 1 ラン単位で同一サイド一括 — 行 union 厳禁)**: monocart `index.{html,json}` と playwright-report `html/index.html`/`results.json` は同一ランの相互参照出力で、`merge=union` で行結合すると壊れた JSON/HTML になる。`sync:resolve` は意図的にこれらを union 対象外（`WARN unhandled conflict`）にしている。解消は **HTML と JSON を別サイドにせず 4 件まとめて `git checkout --ours`（または dev がより完全なら `--theirs`）**。
- **SP-DEVSYNC-070-C (phase12 compliance doc は evidence と必ず同サイド)**: HEAD が `phase12-*.md` を `canonical 9 見出し準拠`へ更新（evidence 再生成と一体）しているなら、evidence も `--ours` に揃える。doc と evidence をサイド分割すると `verify:phase12-compliance` gate（canonical 9 見出し SSOT）と evidence 参照が不整合になる。解消後は `bash scripts/verify-pr-ready.sh` で gate green を push 前に確認。
- **SP-DEVSYNC-070-D (`WARN unhandled conflict` の分類で source 混在と自動生成物残置を切り分ける)**: `pnpm sync:resolve` の `WARN unhandled conflict` 行が出たら path を分類する。`.claude/skills/**` 残置は resolver の見落とし疑い、**`docs/30-workflows/**/outputs/phase-11/evidence/**`（playwright/monocart）は machine-path 焼き込みの自動生成物で union 不可が正常**。後者は片側 wholesale で解消し、source `.ts/.tsx` 衝突 0（L-DEVSYNC-068-A の add-only 素通り）と併せて「実質 source 衝突なし」を確認する。`sync:resolve` の exit 1 は残置 WARN による正常終了で、union 解消自体は成功している。
- **SP-DEVSYNC-070-E (spec 変更 branch は sync-merge 検証に `verify:static-manifest` を追加 — local typecheck/lint/phase12 green でも `ci` が落ちる)**: `docs/00-getting-started-manual/specs/01-api-schema.md` 等の spec を変更する branch は、`apps/api/src/repository/_shared/generated/static-manifest.json` の再生成（`pnpm regenerate:static-manifest`）を伴う。これを忘れると `ci` job の `Verify static manifest (UT-02A-FU-DIAG-001)` が **`reason=sourceSpecHashDrift`** で fail し、`coverage-gate` が `Fail closed on failed shard` で **連鎖 fail**（fail-closed なので root cause は ci 側 1 つ）。typecheck/lint/phase12-compliance では検出されない（生成物 hash の drift は型でも lint でもない）ため、push 後 `gh pr checks` で初めて顕在化する。**対策**: spec を触るタスクは Phase 11/13 の検証コマンドに `pnpm verify:static-manifest` を含め、drift 時は `pnpm regenerate:static-manifest`（diff は `sourceSpecVersion`/`sourceSpecHash`/`generatedAt` のメタ行のみで `sections` 本体不変なら安全）。
- **SP-DEVSYNC-070-F (PR `mergeable=CONFLICTING` は CI 待ちでなく base conflict — dev を追って再 merge、同一 component file の別 feature add/add は「定義並置」で統合)**: 1 回 sync-merge を push しても `gh pr checks` が `triage` 1 件だけで本体 CI が起動しないときは `gh pr view --json mergeable,mergeStateStatus` を見る。`CONFLICTING/DIRTY` なら **base（dev）が先行して merge commit を作れず `pull_request` workflow が起動していない**（CI 遅延ではない）。最新 `origin/dev` を再 merge して解消する。複数 PR が同じ component file に独立機能を足していると source conflict が出る（例: issue-982 の `MemberTagsEditor` と issue-983 の `PhotoUploadAffordance` が同じ `MemberDrawer.tsx`）。**本体（呼び出し側 JSX）が clean merge で両方を参照済みなら、conflict は 2 つの独立定義の並置のみで解消し、どちらも捨てない**。import 文の衝突は **3-way 和集合**（両 branch が足した named import を全部残す）にして `pnpm typecheck` で未使用 import / 型不整合を検出。sync-merge は **`mergeable=MERGEABLE` で CI 本体が green になるまでが 1 サイクル**で、push 一発で終わりにしない。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-069（同知見の lessons 版・merge commit `ec48d08ce`、sourceSpecHashDrift 追補は同節「留意」、CONFLICTING 再 merge は「追補2」）、SP-DEVSYNC-069（両側 source 並行実装の AA との対照）、CLAUDE.md「sync-merge コンフリクト解消の 3 層予防」（`merge=union` 対象に playwright evidence は含まれない点の補足）。

## SP-I1035 read-only repository への write 経路追加は「コード不変条件 + 正本 spec + prefix regression」を同 wave で固定する（2026-06-01 issue-1035-tag-master-write-endpoints）

- **SP-I1035-A (implementation target 明確時は spec-only close しない)**: `taskType=implementation` かつ `implementation_files` / `test_files` が具体化している場合、Phase 12 で「follow-up 実装サイクル」として閉じると CONST_004/005 と衝突する。実コード、focused tests、typecheck/lint、正本 spec 同期まで同 wave で完了し、staging runtime / commit / push / PR だけを user-gated に残す。
- **SP-I1035-B (read-only コメントを緩める変更は二重正本同期)**: repository に「write API は提供しない」等の不変条件コメントがある場合、write 関数追加だけで終えず、同じ wave で正本 spec（例 `docs/00-getting-started-manual/specs/01-api-schema.md`）にも新 write 経路・audit・削除/immutable 境界を同期する。片方だけ更新すると drift する。
- **SP-I1035-C (readonly type-d gate 事前確認)**: write 関数を追加する repository では Phase 3 で `rg "readonly|@ts-expect-error|create|update|delete" apps/api/src/repository/**/*.test-d.ts` 等により type-level write 禁止 gate の有無を確認する。gate がある場合は不変条件変更レビューと test 更新を同 wave に含める。
- **SP-I1035-D (prefix route 追加は既存 route regression を必須化)**: `/tags` と `/tags/queue` のように prefix が重なる route を追加する場合、mount 順の設計だけでなく、既存 route が従来通り 200 を返す contract test を新 route の test に含める。
- 検証: focused D1 Vitest 4 files / 32 tests PASS、`@ubm-hyogo/api` typecheck PASS、repo lint PASS、root/outputs artifacts parity PASS、Phase 12 strict 7 PASS。
- 参照: aiworkflow-requirements `workflow-issue-1035-tag-master-write-endpoints-artifact-inventory.md`、workflow `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/phase12-task-spec-compliance-check.md`。

### dev-sync-merge 後の `.next/types` stale typecheck 失敗（SP-DEVSYNC-069）

resolver 単発で skill-only conflict を解消した後でも、Phase 12/13 の `pnpm typecheck` がローカル build cache 起因で赤になる shape。merge content の型エラーと混同しないための切り分け手順を固定する。

- **SP-DEVSYNC-069-A (sync-merge 後の typecheck 失敗はまず error path で切り分ける)**: `pnpm typecheck` 失敗時、エラー path が **全件 `.next/types/**` かつ TS2307 `Cannot find module '...page.js'/route.js'`** なら merge content は無罪＝ローカル build cache の陳腐化。`packages/*` / `apps/web/src` 側に 1 件でも error があればそちらが本物（spec 追従漏れ等 SP-DEVSYNC-068-D）。判別軸は「error path に `.next/` を含むか」「`src/` 直下 error の有無」の 2 点で、Phase 12 検証手順に固定する。
- **SP-DEVSYNC-069-B (route-group 移行の取込で `.next/types` は必ず stale 化)**: dev 側 PR が `app/x/page.tsx` → `app/(group)/x/page.tsx` の route-group 移行を含むと、移行前生成の `.next/types/app/x/page.ts` が消えた旧 `.js` を import し続け TS2307 を出す。`find apps/web/app -name page.tsx -not -path '*/.next/*'` で実 route が `(public)` 配下へ移ったことを確認すれば stale 確定。
- **SP-DEVSYNC-069-C (`.next` は gitignore 成果物・削除前に check-ignore で安全確認)**: 修正は `apps/web/.next/types` 削除 → `pnpm typecheck` 再実行のみ（次 build で再生成）。削除前に `git check-ignore apps/web/.next` が hit する（追跡外）ことを確認し source を巻き込まない。`rm -rf` が権限拒否される環境は `find apps/web/.next/types -type f -delete` → `find ... -type d -empty -delete` で代替。
- **SP-DEVSYNC-069-D (CI 非再発・ローカル限定として記録し push を止めない)**: CI は clean checkout から build→typecheck するため `.next/types` は常に最新で本エラーは出ない。push ブロック事由にせず、ローカル green を取り戻す cache 掃除として Phase 13 に注記する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-069（skill-only resolver-only path + route-group 移行 stale `.next/types` の切り分け）, L-DEVSYNC-068-D（`.next/types` ではなく spec 追従漏れで test だけ赤になる対照例）。

## SSR-readable preference seed + cookie persistence パターン（first-paint flicker 回避 / 2026-05-31 issue-1024-sidebar-collapse-cookie-persistence）

- L-SSRSEED-001: SSR 可視 layout を変える UI preference は client-only storage だと first-paint mismatch / flash が出る。first-party cookie を server component が `next/headers` の `cookies()` で読み、`initial*` prop として client state owner へ渡す。
- L-SSRSEED-002: split-token な lint 回避（`"local" + "Storage"`）は禁止メカニズムを温存するだけ。boundary rule を満たす永続化経路（cookie）へ機構ごと置換する。
- L-SSRSEED-003: 既存 state owner（`useSidebarState`）に optional initial seed を足す。第 2 のストアを増やさず「server=初期 seed / client=ユーザー操作 + cookie write」の責務分割を保つ。
- Phase 2 design AC / Phase 6 test AC（server seed + client write + cookie helper の focused test 3 分割）に trigger を提供。

### Anti-pattern
- client-only storage で SSR layout preference を持つ（flash 発生）
- substring lint rule を split-token で迂回する
- server seed のために既存 hook と別のグローバルストアを新設する

> 参照: aiworkflow-requirements 側 [[lessons-learned-issue-1024-sidebar-collapse-cookie-persistence-2026-05]] L-I1024-001..003。

## SP-DEVSYNC-074 `pnpm sync:resolve` は段階的かつ冪等 — 並行 git 操作由来の `index.lock` で後段だけ落ちても、lock 存在確認後の再実行で残コンフリクトだけ収束する（2026-05-31 feat/issue-998-members-sync-gate-c-task-spec ← dev 8 commits）

sync-merge task の Phase 12 implementation-guide に、resolver 途中失敗時の復旧手順を固定フローとして記載する。`resolve-skill-merge-conflicts.sh` は ①union-resolve 群 → ②`keywords.json` `--ours`+`pnpm indexes:rebuild` の 2 段で進むため、後段で並行 worktree / dev ff 同期が残した `index.lock` に当たると「union だけ済んだ中間状態」で exit する。これを「全やり直し」と誤認しないこと。

- **SP-DEVSYNC-074-A (resolver 途中失敗は残コンフリクトだけ取り直して再実行)**: `pnpm sync:resolve` が `fatal: Unable to create '…/index.lock'` 等で exit したら、まず `git diff --name-only --diff-filter=U` で**残ったコンフリクトだけ**を確定（多くは `keywords.json` 単独）。前段の union 結果は既にステージ済みなので失われない。resolver は冪等なので**そのまま再実行**すれば union 済みをスキップし残件のみ収束する（二重適用・巻き戻しは起きない）。
- **SP-DEVSYNC-074-B (`index.lock` は `rm` 前に存在確認 — 並行プロセス終了で自然消滅していることが多い)**: stale lock を見ても即 `rm` しない。`git rev-parse --git-path index.lock`（sub-worktree は `…/.git/worktrees/<name>/index.lock`）で正しい path を取り `ls -la` で現存確認。`rm` が権限拒否される環境でも、再確認時点で並行 git が終了し lock が消えていれば削除自体が不要（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-074-B / `git|head` exit-code pitfall と同系）。残っている場合のみ除去 → resolver 再実行。
- **SP-DEVSYNC-074-C (sync-merge 手順は dev ff 同期 → merge → resolver の直列を推奨)**: 根因は dev の ff 同期（main worktree 書き込み）と feature 側 resolver（同一 common-dir の index 操作）の近接実行。Phase 13 検証フローでは **dev ff 同期完了 → `git merge dev` → `pnpm sync:resolve`** を直列に並べ、並行させないことで lock 競合を予防。並行してしまった場合は SP-DEVSYNC-074-A/B で復旧できると割り切る。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-074（正本）, SP-DEVSYNC-072/073（クリーン基準ケース・段階構造の前提）, SP-DEVSYNC-045（resolver fallback）, L-DEVSYNC-002/007（rebuild 決定性・3 層予防）。

## SP-DEVSYNC-075 docs 系 feature でもクリーン基準が成立し、ローカル dev が origin/dev に一致なら ff 同期不要で resolver 単独ゼロ手作業（2026-05-31 docs/issue-1010-auth-view-session-contract-integration-test ← origin/dev 9 commits）

sync-merge task の Phase 12 implementation-guide に、branch 種別（feature/docs/fix）を問わずクリーン基準ケースを最初に試す手順と、ローカル dev 一致時の ff 同期省略を固定フローとして記載する。本件は `docs/issue-1010-...`（ローカル dev = origin/dev 一致＝独自コミット 0、feature は 2 ahead / 9 behind）で `git merge origin/dev` の content conflict が `indexes/{keywords.json,topic-map.md}` の 2 file のみ、`pnpm sync:resolve` 単独 1 回で収束した実例。

- **SP-DEVSYNC-075-A (branch 種別を問わずクリーン基準を最初に試す)**: `CONFLICT` 行が全て `.claude/skills/**`（典型は `indexes/{keywords.json,topic-map.md}`）かを `git diff --name-only --diff-filter=U` で確認し、source code conflict 0 件なら手動 Edit を試みず `pnpm sync:resolve` 直行。docs/test 系成果物は dev の touch path と semantic 独立になりやすく、衝突は派生 index に集約され 1 回で収束する。
- **SP-DEVSYNC-075-B (ローカル dev が origin/dev 一致なら ff 同期を別途走らせない)**: Phase 13 検証フローで `git rev-list --left-right --count dev...origin/dev` が `0\t0` なら dev ff 同期は不要。`git merge origin/dev` を直接使うことで resolver と並行する main worktree への git 書き込みが消え、SP-DEVSYNC-074-C の「直列」を構造的に満たして index.lock 競合（SP-DEVSYNC-074-A/B の復旧対象）を最初から回避できる。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-075（正本）, SP-DEVSYNC-072/073（クリーン基準・衝突 file 数可変の確立）, SP-DEVSYNC-074（index.lock 中間状態・本件は並行書き込み無で回避）。

## SP-DEVSYNC-076 `*-map.md` 3 file 同時衝突 + keywords.json の 4 file でも resolver 単独 1 回で収束する（union 3 + `--ours`+rebuild 1 の混在解消）（2026-06-01 docs/issue-264-cron-schedule-free-tier-guard-spec ← origin/dev 1 commit）

sync-merge task の Phase 12 implementation-guide に、`*-map.md`（quick-reference / resource-map / topic-map）が複数同時に衝突しても resolver が union 対象と `--ours` 派生を自動振り分けする旨を記載し、「衝突 file 増加＝手動介入」誤認を防ぐ。本件は `docs/issue-264-...`（ローカル dev = origin/dev 一致＝独自コミット 0、feature は 4 ahead / 1 behind）で `git merge dev` の content conflict が `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` の 4 file（`*-map.md` 3 種同時 + keywords.json）、`pnpm sync:resolve` 単独 1 回（union 3 + keywords.json ours+rebuild）で収束した実例。SP-DEVSYNC-075（衝突 2 file）に対し `*-map.md` 同時衝突件数の上限を 3 まで実証拡張。

- **SP-DEVSYNC-076-A (`*-map.md` の同時衝突件数に動じずクリーン基準を適用)**: `quick-reference.md` / `resource-map.md` / `topic-map.md` は 3 つ同時衝突でも全て `merge=union` 対象。`git diff --name-only --diff-filter=U` の出力が全て `.claude/skills/**`（`keywords.json` + `*-map.md` 群）なら手動 Edit せず `pnpm sync:resolve` 直行。resolver は union 対象と keywords.json `--ours`+rebuild をファイル種別で自動振り分けする。
- **SP-DEVSYNC-076-B (resolver 後の冪等確認を CI gate と同条件で先取り)**: 解消後 Phase 13 検証で `pnpm indexes:rebuild` を再実行し drift 0（status clean）を確認すると、CI `verify-indexes-up-to-date` gate（`.claude/skills/aiworkflow-requirements/indexes` drift で fail）を push 前にローカル検証できる。本件 rebuild 後 5224 キーワードで status clean。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-076（正本）, SP-DEVSYNC-072/073（クリーン基準・衝突 file 数可変の確立）, SP-DEVSYNC-074（index.lock 中間状態）, SP-DEVSYNC-075（衝突 2 file 前例・本件は `*-map.md` 3 件同時の拡張）。

### dev-sync-merge 残マーカー確認の `git grep '======='` 偽陽性（SP-DEVSYNC-073）

skill-only conflict を `pnpm sync:resolve` で解消した後の「念のための残マーカー確認」を `git grep` ベースで行うと、completed-tasks 配下の evidence/log 文書に頻出する装飾区切り線（`=` 連続行）を conflict marker 中央線 `=======` と誤検知する shape。Phase 12 の解消完了判定を index 状態ベースに固定して偽陽性に振り回されないようにする。

- **SP-DEVSYNC-073-A (解消完了判定は `git ls-files -u` を唯一の正本に)**: `pnpm sync:resolve` 後の残コンフリクト確認は `git ls-files -u | wc -l == 0` を判定基準にする。`git grep -lE '^(<<<<<<<|=======|>>>>>>>)'` は `=======`（7 連以上の `=`）を ASCII 区切り線（例: phase-11 smoke-log の `====...` 60 連）と構造的に区別できず偽陽性を出す。`git ls-files -u` は git index の unmerged stage を直接読むため装飾線に反応しない。
- **SP-DEVSYNC-073-B (grep を併用するなら U-filter と突き合わせ + path 除外)**: 補助的に marker grep を残す場合、ヒットしたファイルが `git diff --name-only --diff-filter=U` の対象かを必ず照合し、対象外なら文書リテラルとして無視する。除外 path は `.spec`/`.test` に加え `completed-tasks/**` の evidence/log/runbook を含める（装飾区切り線の頻出箇所）。
- **SP-DEVSYNC-073-C (Phase 12 検証手順への固定)**: dev-sync の解消検証は「`pnpm sync:resolve` exit 0 → `git ls-files -u` 0 → `git commit --no-edit` → `pnpm typecheck`/`pnpm lint`/`pnpm indexes:rebuild` 冪等」の固定列とし、marker grep の生ヒット数を gate にしない。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-073（同知見の lessons 版・merge commit `1b662cfad`）, L-DEVSYNC-072-B（`git ls-files -u` 正本則の初出）, [[feedback-grep-head-exit-code-pitfall]]（grep ベース判定のピットフォール一般則）。
## SP-I1027 dynamic OG Worker split and size-budget branch gate

Member-specific dynamic OG generation on Cloudflare Free plan exposed a recurring task-design pattern: the real decision is not "add OG route" but "choose the runtime budget owner." Apply this before Phase 2 when a task proposes `next/og`, wasm/font-heavy rendering, or another bundle-heavy feature.

- **SP-I1027-A (architecture branch before design)**: If the options include Paid plan vs dedicated Worker split, ask for and record the user decision in Phase 1. Do not write Phase 2 as if both are still current.
- **SP-I1027-B (budget owner is an implementation target)**: Treat each Worker bundle (`apps/web`, `apps/api`, `apps/og`) as a separate size-budget owner. A split is not complete until the new Worker has its own build, deploy workflow, and `scripts/check-worker-size.sh <dist>` gate.
- **SP-I1027-C (main Worker guard remains active)**: Splitting OG generation out does not relax the main web Worker guard. Phase 4/11 must prove `apps/web` still avoids `next/og` / `ImageResponse`.
- **SP-I1027-D (public metadata envs use accessors)**: Optional public metadata config such as `OG_IMAGE_BASE_URL` must go through the env accessor layer and focused tests. Direct `process.env` reads in SEO helpers are drift.
- **SP-I1027-E (crawler response fails soft)**: OG runtime tests should cover both named member PNG and default fallback PNG. Upstream API failure or unknown member should not produce a broken crawler response.
- **SP-I1027-F (新規 workspace package は aggregate coverage-gate へ同一コミットで配線)**: `apps/og` のような新規 package を足す Phase は「テストが緑」では完了にしない。`scripts/coverage-guard.sh` の集約モードは `apps/*`/`packages/*` を機械列挙するため package.json 追加だけで判定対象に自動流入する一方、`.github/workflows/ci.yml` の `coverage-gate-shard` matrix は手動固定で shard が無いと `coverage-summary.json` が未生成→ aggregate だけ `MISSING` で exit 1（shard 全 success でも fail、merge 後 dev 同期 push で顕在化）。Phase の DoD に **(1) package の `test:coverage` script、(2) coverage-guard.sh の `--group` enum/`run_group`/`group_summary_paths` 3 箇所、(3) ci.yml matrix への group 追加** を必須チェックとして書く。「機械列挙で広がる集合 ≠ 手動固定の shard 集合」の非対称が罠。
- **SP-I1027-G (ランタイム専用コードは `v8 ignore`、純粋ロジックは抽出 unit test で 80% gate を満たす)**: `workers-og`/`ImageResponse` 等 Cloudflare Workers ランタイム依存コードは Node/jsdom で実行不能なため放置すると lines coverage が 80% gate を割る。Phase 設計で「HTML/文字列組成等の純粋関数を export して直接テスト」＋「ランタイム依存ブロックのみ `/* v8 ignore start/stop */` で除外理由コメント付き除外」＋「ルータの catch フォールバックは throw mock でテスト」を指示する。`v8 ignore` は原理的にテスト不能な箇所限定で、純粋ロジックまで握り潰さない（coverage-guard の「exclude は要レビュー」HINT に準拠）。

Anti-patterns:
- Leaving an unassigned follow-up as `open` after the implementation consumed it.
- Marking dynamic OG complete while only the main web Worker size gate is checked.
- Treating local PNG generation as staging runtime evidence when deployment remains user-gated.

### マージ確定後の `git commit` 偽失敗(RC128)と throwaway commit 混入除去（SP-DEVSYNC-075）

issue-1008 sync（`refactor/issue-1008-members-list-ux-clarity-artifact-status-reconciliation` ← dev）の知見。衝突は task-spec skill 2 file（`SKILL.md` / `references/patterns-lessons-and-pitfalls.md`）のみで `pnpm sync:resolve` union 解消（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-075 / merge commit `89ab6af1e`）。仕様書を起草する際、検証手順に以下の harness 運用注意を含める。

- **SP-DEVSYNC-075-A (マージ成否は commit RC でなく ancestor 判定で確認)**: merge が既に確定した後に重ねて `git commit --no-edit` を打つと `fatal: could not read '': No such file or directory`（RC 128）になる。`MERGE_MSG` が消えているだけの benign no-op であり commit 失敗ではない。仕様の Phase 11/13 検証は **`git rev-list --count HEAD..dev == 0` と `git merge-base --is-ancestor dev HEAD`** を成否判定の正本に固定し、commit RC を gate にしない。
- **SP-DEVSYNC-075-B (throwaway/probe commit の push 前除去)**: 切り分けで probe commit（`test: probe ...` 等）を作ったら、push 前に `git log --oneline` で混入を確認し `git reset --mixed <正しい merge commit>` で HEAD を戻して除去する。`git reset --hard` は使わず mixed/soft で index だけ巻き戻し、残骸ファイルは `rm` → `git status --porcelain` clean を確認する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-075（lessons 版）, SP-DEVSYNC-073（`git ls-files -u` 正本則）, L-DEVSYNC-072（skill-only baseline）。

### 衝突 file セット自体が可変（`*-map.md` 3 点トリオ衝突／keywords.json 自動結合）（SP-DEVSYNC-076）

`docs/member-directory-form-reflection-and-admin-link-specs` ← dev の sync-merge 知見（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-076 / merge commit `f5b7f6642`）。content conflict は `aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map}.md` の 3 file のみで、従来典型の `keywords.json` は `Auto-merging` で衝突しなかった。`pnpm sync:resolve` のログは `union-resolving 3 files` → `indexes:rebuild` → `all skill / index conflicts resolved` で 1 回収束。sync-merge task の Phase 12 implementation-guide / Phase 11・13 検証手順に以下を固定する。

- **SP-DEVSYNC-076-A (衝突 file セットを決め打ちしない)**: 検証手順に「典型は keywords.json+topic-map.md が衝突」を前提として書かない。L-DEVSYNC-073 が確立した「衝突 **file 数**可変」に加え、**どの file が衝突するか（file セット）も sync ごとに変わる**（今回は keywords.json が自動結合し quick-reference.md / resource-map.md が衝突）。判定は `git diff --name-only --diff-filter=U` の実出力を唯一の正本にし、全件が `.claude/skills/**` なら組み合わせを問わず `pnpm sync:resolve` 直行と記す。resolver ログの `union-resolving N files` の N は可変（今回 3）。
- **SP-DEVSYNC-076-B (resolver 成功判定は index 状態に固定)**: 仕様の検証列は `pnpm sync:resolve` exit 0 → `git ls-files -u | wc -l == 0` → `git commit --no-edit` → `pnpm typecheck`/`pnpm lint`/`pnpm indexes:rebuild` 冪等（drift 0）の固定列とし、`keywords.json` が衝突しなかった回でも resolver が正常終了する（`--ours` 対象が無いだけ）ことを注記する。`union-resolving N files` の N やどの map が衝突したかを gate にしない。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-076（lessons 版）, SP-DEVSYNC-073（`git ls-files -u` 正本則）, SP-DEVSYNC-075（クリーン基準・ff 省略）, L-DEVSYNC-072（skill-only baseline）。

### cross-skill 6-file conflict も `pnpm sync:resolve` 単一パスで full resolve（SP-DEVSYNC-076）

`docs/issue-1016-mobile-drawer-responsive-spec` ← dev（9 behind / 3 ahead・ローカル dev は origin/dev に既一致で同期は冪等スキップ）の sync 知見。`git merge dev` で `CONFLICT (content)` が **6 file・2 skill 横断**で発生（aiworkflow `indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}` + `references/task-workflow-active.md` + 本ファイル `task-specification-creator/references/patterns-lessons-and-pitfalls.md`）。`apps/**`/`packages/**` の source conflict は 0。`pnpm sync:resolve` **1 回**で full resolve（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-076）。仕様書を起草する際、検証手順に以下を含める。

- **SP-DEVSYNC-076-A (本ファイルも resolver の UNION_TARGETS)**: 衝突が **task-spec `patterns-lessons-and-pitfalls.md` 側にも出た**としても、SP-DEVSYNC 系の並行追記による append-only conflict は `resolve-skill-merge-conflicts.sh` の union 対象（resolver ログ `union-resolving N files` に本ファイルが含まれる）。「task-spec 側に出た = 手動」と誤認せず resolver 直行（[[patterns-lessons-and-pitfalls#L-PATSEC-003]] / L-DEVSYNC-046 UNION_TARGETS 登録の再確認）。
- **SP-DEVSYNC-076-B (keywords.json は union 前提に依存しない)**: resolver は keywords.json を derived file として `--ours` 採用 → `pnpm indexes:rebuild` で再生成する（SP-DEVSYNC-074 / L-DEVSYNC-002 と整合）。過去 changelog に「keywords は merge=union で auto-merge」とある版があるが、union auto-merge されるかは dev 側 hunk 位置依存で不確定。仕様の検証手順は「keywords は常に union」前提を置かず、`pnpm sync:resolve` に委譲する。
- **SP-DEVSYNC-076-C (skill-only なら conflict file 数が増えても単一パス)**: 衝突が 6 file・2 skill 横断でも全て `.claude/skills/**` 配下なら resolver 1 コマンドで完結。手動 hybridize（SP-DEVSYNC-054/056/057/058 等）へ進むのは `apps/**` 等の非 skill conflict が出たときのみ。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-076（lessons 版）, SP-DEVSYNC-074（resolver 段階構造・index.lock）, SP-DEVSYNC-075（issue-1008 task-spec 2-file ケース）, L-DEVSYNC-072（skill-only baseline）。

### union 解消後は「重複混入ゼロ」をヘッダ数 three-way 照合で検証する（SP-DEVSYNC-077）

`docs/issue-1016-mobile-drawer-responsive-spec` ← dev の **2 回目**の sync（1 回目は SP-DEVSYNC-076）。今回の conflict は aiworkflow `indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}` の 4 file のみ（前回含まれた本ファイル・task-workflow-active.md は今回 `Auto-merging` で衝突せず）。`pnpm sync:resolve` 1 回で full resolve。仕様書を起草する際、sync-merge 検証手順に以下の**重複検出ステップ**を含める（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-077）。

- **SP-DEVSYNC-077-A (`git ls-files -u` 0 だけで union 健全性を結論しない)**: marker 消滅は必要条件にすぎない。`merge=union` は行ベース結合なので、両 branch がそれぞれ追記した同名見出しブロックを二重連結し得る。検証手順には **手動管理 index（`quick-reference.md` / `resource-map.md`）の主要 H1/H2 見出しについて `grep -cF '<見出し>'` の値が `now == HEAD == dev` で一致するか**を必ず入れる。一致＝union が片側 unique 行を足しただけで新規重複なし。topic-map.md / keywords.json は `indexes:rebuild` 再生成のため照合不要。
- **SP-DEVSYNC-077-B (重複カウントは `grep -cF` の substring count を正本にする)**: `sort | uniq -d` は trailing `\r`・全角/マルチバイトの sort 挙動で実数と乖離する。仕様の検証コマンドには anchor 付き `grep -E '^## '` + `uniq` ではなく `grep -cF '<見出し全文>'` を three-way（now/HEAD/dev）で比較する形を記す。
- **SP-DEVSYNC-077-C (同一 branch の N 回目 sync でも conflict 集合を前提化しない)**: 前回の conflict file リストを手当て前提に固定せず、毎回 `git diff --name-only --diff-filter=U` で実集合を取り直す（SP-DEVSYNC-076-C / L-DEVSYNC-073 の再確認）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-077（lessons 版）, SP-DEVSYNC-076（同 branch 1 回目・6 file ケース）, SP-DEVSYNC-074（keywords は `--ours`+rebuild）, L-DEVSYNC-002（keywords union 対象外）。

### sync-merge 後 duplicate-ID 検査は見出し限定 grep が正本／同 branch 再 sync は衝突集合を再評価（SP-DEVSYNC-076）

`docs/issue-57-kv-r2-guardrail-degrade-task-spec` の **2 回目 sync-merge**（前回 = L-DEVSYNC-077 / SP-DEVSYNC-047 系の merge `03a0e88ff`、今回 = merge `3a0efc3d5` ← dev 1 commit `#1007`）で得た 2 知見を、sync-merge task の Phase 11/13 検証手順に固定する。前回 4 file 衝突（map 系 3 + `task-workflow-active.md`）→ 今回 3 file 衝突（map 系 3 のみ、`task-workflow-active.md`/`keywords.json` は非衝突）と縮小し、`pnpm sync:resolve` 単独収束・`pnpm typecheck`/`pnpm lint`/`pnpm indexes:rebuild` 冪等（5227 kw）。

- **SP-DEVSYNC-076-A (duplicate-ID 検査は見出し限定 grep — bare grep は過検出)**: L-DEVSYNC-077-A が当初示した `grep -oE 'SP-DEVSYNC-[0-9]+' <file> | sort | uniq -d` は**サブ ID（`-A`/`-B`）・`参照:` 行・自己 xref を含む全言及**を拾い、同一 lesson が自己参照する構造上ほぼ全番号を「重複」と誤検出する。Phase 12/13 の検証コマンドは**見出し行に絞った** `grep -E '^#+.*SP-DEVSYNC-[0-9]+' <file> | grep -oE 'SP-DEVSYNC-[0-9]+' | sort | uniq -d`（aiworkflow は `'^#+ L-DEVSYNC-[0-9]+'`）を正本にする。出力が空＝今回 merge で新規 duplicate-heading なし。
- **SP-DEVSYNC-076-B (既存 duplicate-heading backlog はルーチン sync で清算しない)**: 見出し限定検査でも歴史的な merge=union 蓄積由来の dup（task-spec で `SP-DEVSYNC-063/064/066/069/070/073/075` 等、aiworkflow で `L-DEVSYNC-010/073` 等 ~37 番）が出る。これらは sync が作るものではなく、ルーチン sync の commit に一括 renumber を混ぜると cross-ref を大量破壊する。**今回 sync で連結された新規 1 件のみ renumber**し、backlog は専用 cleanup タスク（`> 採番補正:` 注記付き段階解消）へ切り出す。
- **SP-DEVSYNC-076-C (同 branch 再 sync は衝突 file 集合を前提化しない)**: 同一 feature を時間差で再 sync すると dev delta の縮小（本件 5→1 commit）に伴い衝突 file 集合が変わる（前回 4 → 今回 3、`task-workflow-active.md` が非衝突へ転じた）。Phase 11 見積りは前回値を流用せず毎回 `git diff --name-only --diff-filter=U` で確定する（SP-DEVSYNC-047 の「衝突 file 数は可変」を再 sync 軸で補強）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-078（正本・077-A の grep scope 補正）, L-DEVSYNC-077（duplicate-ID 機序）, SP-DEVSYNC-047（衝突 file 数可変）, SP-DEVSYNC-073（`git ls-files -u` 正本則）。

### native datalist による入力補助は自由入力と query 契約を守る（SP-I1039）

`/admin/audit` action filter のように「よく使う値は提示したいが、任意文字列入力と URL query key は変えられない」場合は、Select 化より native `<datalist>` を優先する。

- **SP-I1039-A (候補提示と自由入力を同時に満たす)**: 既存 `<Input name="...">` に `list="<id>"` を付け、同じ form 近傍に `<datalist id="<id>"><option ... /></datalist>` を置く。`name` と submit path を変えないため deep link / pagination / server restore が壊れない。
- **SP-I1039-B (primitive 変更前に native prop passthrough を確認)**: UI primitive が `InputHTMLAttributes` を透過しているなら、`list` は新規 component API や shared type なしで通せる。primitive expansion は、複数 consumer や制御ロジックが必要になってから検討する。
- **SP-I1039-C (VISUAL は local screenshot と staging user-gated を分ける)**: staging/admin session が user-gated でも、local DOM contract を撮れるなら Phase 11 screenshot を `present` にする。staging screenshot だけを `pending_user_approval` として分離し、Phase 12 で pending のまま PASS と書かない。
- 参照: [[lessons-learned-issue-1039-admin-audit-identity-action-presets-2026-06]] L-I1039-001..003。

### 衝突 file 集合は map 系内でも回ごとに別組になる／`sync:resolve` は union 経路と derived `--ours`+rebuild 経路を 1 pass で振り分ける（SP-DEVSYNC-079）

> 採番補正: 本節は当初 SP-DEVSYNC-078 として起草したが、`feat/issue-224 ← dev` 側が独立に SP-DEVSYNC-078（sub-worktree lock/log path）を採番済みで、後続 sync-merge の union 流入で duplicate-heading 化した。SP-DEVSYNC-076-B の runbook（dev 側 canonical 残置・今回連結側を次の空き番号へ renumber）に従い本ローカル追加分を **SP-DEVSYNC-079** へ採番補正。

`docs/issue-235-sync-audit-tables-necessity-judgement` ← dev（merge `b4b249cd5`・dev 7 commit / feature 2 ahead）。今回の conflict は aiworkflow `indexes/keywords.json`（derived）＋ `indexes/topic-map.md`（union）の **2 file のみ**で、SP-DEVSYNC-077 の「map 系 3 md 衝突・keywords 非衝突」とは**別組**（今回 `quick-reference.md`/`resource-map.md`/`task-workflow-active.md`/`_legacy.md` は Auto-merging）。`pnpm sync:resolve` が union 解消と derived 再生成の 2 経路を 1 pass で処理して収束。sync-merge task の Phase 11/13 検証手順に以下を固定する（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-080）。

- **SP-DEVSYNC-079-A (derived file の content conflict は手動マージ禁止 — `--ours`+rebuild が常に正)**: `indexes/keywords.json` が CONFLICT に出る回がある（両 branch が異内容で再生成した場合）。両版を手で結合せず `pnpm sync:resolve`（内部 `--ours` → `indexes:rebuild`）に委ね、resolver ログの `ours: ...keywords.json` で経路を確認する。手動 fallback 時も `git checkout --ours <keywords.json>` → `pnpm indexes:rebuild` の順を仕様に明記。
- **SP-DEVSYNC-079-B (衝突するのが keywords.json か map md かは回ごとに入れ替わる)**: SP-DEVSYNC-077 は map md 衝突・keywords 非衝突、本件は逆。どれが衝突するかは dev delta の hunk 位置依存で不確定なので、Phase 11 見積りで file 名を前回流用せず毎回 `git diff --name-only --diff-filter=U` で確定する（SP-DEVSYNC-076-C / 077-C の再確認）。`sync:resolve` は `.gitattributes` union 対象と derived を自動で別経路へ振り分けるため、衝突集合がどう転んでも追加判断は不要。
- **SP-DEVSYNC-079-C (`sync:resolve` 後検証は JSON 妥当性 + マーカー残存 0 の 2 点)**: 仕様の検証コマンドに `node -e "JSON.parse(readFileSync('.../keywords.json'))"` の妥当性確認と `git grep -c '^<<<<<<<\|^>>>>>>>\|^=======' -- .claude/skills/` の残存マーカー 0 を含める。両 PASS を commit 前ゲートにする。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-080（正本）, SP-DEVSYNC-077（map md 衝突・keywords 非衝突の逆組）, SP-DEVSYNC-074/076-B（keywords は `--ours`+rebuild）, SP-DEVSYNC-047（衝突 file 数可変）。

### VISUAL implementation の local deterministic evidence と pixel screenshot user-gate 分離（SP-SVC-001）

`implementation / VISUAL` task で route topology や shell UI の実コードは同一 wave で完了できるが、認証済み staging screenshot が external runtime に依存する場合、root state は `spec_created` に据え置かず `implemented_local_evidence_captured` へ昇格する。

- **SP-SVC-001-A (local evidence を主証跡化)**: focused Vitest / typecheck / lint / grep gates が PASS したら、Phase 11 `manual-test-result.md` と Phase 12 compliance に実測コマンド・件数・対象を記録する。
- **SP-SVC-001-B (pixel screenshot は user-gated boundary として分離)**: screenshot canonical names は Phase 11 に固定するが、未取得を PASS 扱いしない。`pixel_screenshot_pending_user_gate` と明記し、commit / push / PR と同じ Gate-C 系に置く。
- **SP-SVC-001-C (`spec_created` drift 禁止)**: 実コード差分が入った後も artifacts / index / compliance が `spec_created` のままなら FAIL。root/output artifacts、Phase 11 result、Phase 12 compliance、aiworkflow 台帳を同一 wave で `implemented_local_evidence_captured` へ揃える。
- **Anti-pattern**: 「VISUAL screenshot 未取得」を理由に、実コード・tests が完了した task を `spec_created` のまま提出する。

### 衝突集合は「数同じ・メンバー入替」もする — resolver を集合非依存の単一経路として使う（SP-DEVSYNC-078）

`feat/issue-230-lefthook-edit-guard` ← dev（6 behind / 3 ahead・ローカル dev は origin/dev に既一致で ff 同期不要）の **2 回目**の sync 知見（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-079）。`git merge dev` の conflict は **3 file**＝aiworkflow `indexes/keywords.json` + `indexes/topic-map.md` + `references/task-workflow-active.md`。直前の SP-DEVSYNC-077 ケース（keywords 非衝突・map 3 本）と**数は同じ 3 のまま中身が真逆に入れ替わった**（keywords が衝突に戻り、map は topic-map 1 本のみ・quick-reference/resource-map は非衝突）。`apps/**`/`packages/**` source conflict 0 → `pnpm sync:resolve` 1 回で full resolve（resolver ログ `union-resolving 2 files` + `taking --ours for 1 derived files`）。仕様書を起草する際の sync-merge 検証手順に以下を含める。

- **SP-DEVSYNC-078-A (衝突集合は縮小/拡大だけでなくメンバー入替もする)**: SP-DEVSYNC-047/076-C/077-C の「衝突 file 数は可変」を一歩進め、**数が同じでも中身（derived の keywords.json と manual map のどれが衝突するか）が dev 側 touch 範囲依存で入れ替わる**。Phase 11 見積りで「keywords は毎回衝突／非衝突」のどちらも固定前提にしない。毎回 `git diff --name-only --diff-filter=U` で実集合を取り直す。
- **SP-DEVSYNC-078-B (resolver は衝突集合のメンバー構成に依らず単独収束)**: keywords.json が衝突する回（`--ours`+rebuild 段が実働）も、しない回（no-op）も、map が 1 本でも 3 本でも `pnpm sync:resolve` の手順は不変。仕様の検証コマンドは集合の中身で分岐させず、resolver → `git ls-files -u` 0 の単一経路に固定する。
- **SP-DEVSYNC-078-C (pre-commit hook 本数は branch 主題で変わる — 本数で異常判定しない)**: lefthook 正本ガード branch（issue-230）では sync-merge の pre-commit が 5 hook（`lefthook-edit-guard` 追加）。他 branch では 4 hook。`lefthook.yml` 未編集の sync では `lefthook-edit-guard` は ack 不要で素通りする。仕様の検証セクションに「hook 本数差 = branch 固有設定の反映であり sync 異常ではない」を明記する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-079（lessons 版）, SP-DEVSYNC-077（直前 sync・keywords 非衝突 / map 3 本の真逆ケース）, SP-DEVSYNC-047/076-C（衝突 file 数可変）, SP-DEVSYNC-074（keywords は `--ours`+rebuild）, L-DEVSYNC-002（keywords union 対象外）。

### sub-worktree の lock/log は git-common-dir 起点／新番号 union 流入の新規 duplicate 判定は after==dev で確定（SP-DEVSYNC-078）

> 採番補正: 本節は当初 SP-DEVSYNC-077 として起草したが、`feat/issue-224 ← dev` の 2 回目 sync-merge（merge 後）で dev 側が独立に SP-DEVSYNC-077（「union 解消後は重複混入ゼロをヘッダ数 three-way 照合で検証する」）を採番済みと判明し duplicate-heading 化した。SP-DEVSYNC-076-B の runbook（今回 sync で連結された側を次の空き番号へ renumber）に従い、本ローカル追加分を **SP-DEVSYNC-078** へ採番補正（dev 側 077 を canonical として残置）。論点は dev 077-A/B（three-way 照合）と一部重なるが、本節は sub-worktree の lock/log path 解決と新番号 union 流入判定を独立に補強する。

`feat/issue-224-public-members-tags-batch-fetch` を sub-worktree（`.worktrees/task-20260531-092816-wt-16`）から sync-merge（merge `b8ee853e6` ← dev 5 commit）して得た 3 知見を branch-sync task の Phase 11/12/13 へ固定する。CONFLICT 4 file（`indexes/{keywords.json, quick-reference, resource-map, topic-map}`、source 衝突 0）→ `pnpm sync:resolve` 単独収束 → `pnpm typecheck`/`pnpm lint` 緑（`stablekey-literal-lint` 2 件は `mode=warning` の既存・非関与）。

- **SP-DEVSYNC-078-A (sub-worktree の lock/log path 解決)**: branch-sync runbook で lock/ログを掘る前に `git rev-parse --git-dir`（worktree 固有）/ `--git-common-dir`（共有）で実 path を解決する。sub-worktree では `.git` が dir でなく `gitdir:` を指すファイルのため `.git/` リテラルは `mkdir: .git: Not a directory` で破綻する。lock=`$GITDIR/.branch-sync.lock`、共有ログ=`$GITCOMMON/branch-sync-logs/`。9+ WT 並列運用の前提条件。
- **SP-DEVSYNC-078-B (新番号 union 流入の新規 duplicate 判定)**: feature が dev の新 lesson 番号（本件 L-DEVSYNC-077/078 を feature 先端が未保持）を取り込む sync では、見出し限定 dup 数を `git show feature先端:F` / `git show dev:F` / merge 後 F の 3 点で比較し **after==dev なら新規衝突ゼロ**と判定（本件 feature 37 / dev 38 / after 38）。git 3-way union が共通祖先考慮で二重連結を避けるため「dup が大量に出た」だけで誤警報しない。backlog は触らず別 cleanup（SP-DEVSYNC-076-B）。dev 077-A/B の three-way 照合則と同型。
- **SP-DEVSYNC-078-C (conflict file 集合は keywords.json も含め毎回 `--diff-filter=U` 確定)**: SP-DEVSYNC-076-C/047 の「衝突 file 集合は可変」を keywords.json についても再確認。L-DEVSYNC-078 では非衝突だった keywords.json が本件で衝突したが `pnpm sync:resolve` が `--ours`+`indexes:rebuild` で機械収束。固定集合を Phase 11 見積りに流用しない。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-079（正本）, L-DEVSYNC-078（見出し限定 grep・backlog 別管理）, SP-DEVSYNC-077（dev 側・union 健全性の three-way 照合）, SP-DEVSYNC-076（duplicate-ID 検査）, SP-DEVSYNC-047/073（衝突 file 数可変・`git ls-files -u` 正本則）。

## SP-I1036 bulk admin write lane（複数 member × 複数 tag 一括 mutation）の仕様化パターン（2026-06-01 issue-1036-bulk-member-tag-assign）

既存の単一 resource admin write（issue-982 の単一 member tag 付与）を **複数対象の直積 bulk write** へ拡張する task の仕様書を起草するときの汎化パターン。同一テーブルへ write lane を 1 本追加する案件全般（bulk note / bulk status / bulk assign 等）に適用する。

- **SP-I1036-A (登録順マッチ framework では static segment route を `:param` route より前に並べる)**: `POST /resources/bulk` 系を `/:resourceId/...` と同 router に置くと `:resourceId="bulk"` 誤マッチが起きうる。Phase 2/3 の API contract で **route 登録順を明示確定**し（static を先）、collision する read endpoint は親 prefix の外（例 `GET /admin/tags`）に mount する設計を仕様に書く。contract spec に「`:param` route が bulk path を奪わない」回帰を入れる。
- **SP-I1036-B (再送冪等は server idempotency store を前提にせず DB 自然冪等を第一候補にする)**: 「bulk 冪等 → Idempotency-Key store（別 issue）必須」と短絡せず、Phase 2 で root assumption を疑う。複合 PK + `INSERT OR IGNORE`（追加）/ `DELETE`（除去）の `meta.changes` 判定で再送 no-op が成立するなら、別タスク（server store）への依存を**設計時に切り離す**。これで未タスク検出を 0 にでき 1 サイクル完結（CONST_007）を阻害しない。仕様書「関連タスク」表に非依存の根拠（DB 自然冪等）を明記する。
- **SP-I1036-C (部分成功レポート + 実 mutation のみ監査を要求するなら all-or-nothing batch でなく逐次 loop を仕様化する)**: `db.batch()` の atomicity は「不在対象を skip して継続」「実 mutation した item だけ audit」と両立しない。Phase 8 リファクタ候補に「単一 helper の N×M ループ呼び」「汎用 BulkPicker primitive」を**却下案として明記**する（理由: N+1 / audit 設計差 / YAGNI）。N+1 は loop 前の master / 対象状態 map 一括取得で回避し、結果は判別共用体（成功 / 冪等 noop / 対象外 skip / 未登録 not_found）で表現して UI 集計を decouple する。
- **SP-I1036-D (schema 変更禁止下の横断相関は payload 埋め込み識別子で担保する)**: 「この 1 回の bulk」を後から引きたいが列追加（例 `correlation_id`）が不変条件で禁止のとき、`crypto.randomUUID()` の `batchId` を audit の before/after JSON payload に埋める設計を仕様化する。schema を変えず相関メタを残す常套手段。
- **SP-I1036-E (新しい write lane は helper 分離 + type-level allow list で self-document し、既存経路を非破壊で温存する)**: 「table への write は限定経路のみ」の不変条件に第 N 経路を足すときは、(1) 専用 helper を SRP で分離、(2) readonly `.test-d.ts` allow list へ追加して type-level 自己文書化、(3) 既存経路のコメント/記述を**削除せず追記**して archive/delete stale-reference gate を壊さない。UI は新規 primitive を生やさず既存 picker primitive と標準 mutation hook を再利用する（prototype 正本順位・admin mutation 不変条件）。
- 参照: aiworkflow-requirements [[lessons-learned-issue-1036-bulk-member-tag-assign-2026-06]] L-I1036-001..008（正本）, [[lessons-learned-issue-982-drawer-tag-pill-editing-2026-05]]（単一 member 版の親パターン・不変条件 #13 第1/第2経路）。

### source conflict あり sync-merge — 2 feature の別 optional field は併存マージ・変数 shadow 改名・diff3 開始マーカー消し忘れ（SP-DEVSYNC-080）

`docs/issue-1029-public-member-photo-display-spec` ← dev（3 behind）の sync-merge（aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-081 の task-spec 版）。**skill index 衝突しか起きない従来 sync と異なり、2 つの feature が同一 source に意味的に両立する変更を入れた source conflict** を含むケースの統合則を branch-sync / public API 拡張 task の Phase 11/12 へ固定する。CONFLICT 12 file のうち `pnpm sync:resolve` は skill index 5 file（union 4 + derived ours 1）のみ収束、残り 7 file（source 6 + reference doc 1）は `WARN unhandled conflict` として手動マージ必須。

- **SP-DEVSYNC-080-A (2 feature の別 optional field は併存マージ — 6 層に同パターン適用)**: dev=#224 で `tags`、HEAD=#1029 で `photoUrl` を同一 view model に追加（3-way base はどちらも未保持）。union でも `--ours/--theirs` でもなく**両 field を 1 object に併存**させる。zod schema / TS interface / view-model source interface / use-case の item 組成 / contract spec / unit spec の **6 層すべてで同じ併存** を機械適用する。仕様起草時に「public list/profile の optional field は後方互換追加（`optional()` / `?`）で重ねる」方針を固定しておくと、複数 feature 並走時の merge コストが消える。
- **SP-DEVSYNC-080-B (両 feature が同名 local を別定義したら一方を改名)**: HEAD `const memberIds`（photo 用・生 string）と dev `const memberIds`（tags 用・`asMemberId` 適用・block scope）が shadow する。dev 側を `tagMemberIds` に**改名して併存**（型も用途も異なり統合不可）。import 衝突は superset 側採用（dev の `afterEach` 追加版が HEAD の `vi` だけ版を包含）。
- **SP-DEVSYNC-080-C (reference doc の衝突は文章結合 + 編集後 indexes:rebuild)**: `references/api-endpoints.md` 等 skill reference の衝突は両 issue 記述を文レベル結合（table cell は両 optional を 1 セル、prose は両 policy 連結）し、**編集後に `pnpm indexes:rebuild`** で topic-map/keywords drift を解消する。reference を sync:resolve 後に手編集すると index が古くなるため、Phase 12 の indexes drift gate 前に必ず rebuild する。
- **SP-DEVSYNC-080-D (diff3 開始マーカー消し忘れ — 解消後は 4 種マーカー全走査 + spec は 2 config 実行)**: `merge.conflictStyle=zealous-diff3` の 3 段マーカー（`<<<<<<<`/`|||||||`/`=======`/`>>>>>>>`）を Edit で部分解消すると、中間・終端だけ消して**開始 `<<<<<<< HEAD` を取りこぼす**ことがある（`git diff --diff-filter=U` は空でも `git grep '^<<<<<<<'` で検出）。解消後は `git grep -nE '^(<<<<<<<|\|\|\|\|\|\|\||=======|>>>>>>>)'` で 4 種全走査する。解消した `*.contract.spec.ts` は unit config の exclude のため `--config=vitest.d1.config.ts` で別途実行する（unit/d1 2 config 分離）。
- Why: skill index 衝突は resolver で機械処理できるが、**2 feature が同一 source に両立変更を入れた衝突は人間の統合判断（field 併存・変数改名・import superset）が必須**で resolver の守備範囲外。ここを機械的に倒すと一方の feature が消える。仕様段階で optional 後方互換追加の方針と 2 config テスト経路を明記しておけば、merge 衝突解消が定型化する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-081（正本）, L-DEVSYNC-080/079/078（skill index は resolver 単独収束・本節は source conflict あり）, SP-DEVSYNC-079（union/derived 1-pass 振り分け）, SP-DEVSYNC-047/073（衝突 file 数可変）。

### 残コンフリクト判定は `git ls-files -u` を正本に — `=======` grep は装飾区切り線を誤検出／衝突 file はフルセット 5 file もある（SP-DEVSYNC-079）

`feat/issue-229-indexes-rebuild-fail-fast-spec-clean ← dev`（sub-worktree wt-8・6 behind / 4 ahead）の sync-merge で確立。content conflict は **5 file フルセット**＝`aiworkflow-requirements/indexes/{keywords.json, quick-reference, resource-map, topic-map}` + `references/task-workflow-active.md`（**keywords.json と task-workflow-active.md が同時衝突**＝SP-DEVSYNC-078 の組合せの真逆）。source conflict 0 → `pnpm sync:resolve` 単独収束（5257 kw 再生成）→ merge commit `50b0a4f73`。typecheck/lint exit 0。

- **SP-DEVSYNC-079-A (残コンフリクト判定は `git ls-files -u` を正本に・`=======` grep を単独根拠にしない)**: resolver / 手動解消の後、残コンフリクトの有無は `git ls-files -u`（空＝収束）で確定する。`git grep -lE '^(<<<<<<<|=======|>>>>>>>)'` は **diff3 の `=======`（7 個）に ASCII アート区切り（`=` 60 個）や Markdown 見出し下線が前方一致して false positive を出す**（本件は `ut-08-monitoring-alert-design/.../manual-smoke-log.md` の装飾区切り線を誤検出したが unmerged 0）。grep を使うなら `^=======$` 等の行末 anchor か `git diff --check`。SP-DEVSYNC-047/073 の「`git ls-files -u` 正本則」を marker 走査の文脈で再確認。[[feedback-grep-head-exit-code-pitfall]] と同系の grep 過検出ピットフォール。Phase 11 の「コンフリクト解消検証」手順には `git ls-files -u` を必須記載する。
- **SP-DEVSYNC-079-B (衝突 file 集合は keywords.json + task-workflow-active のフルセットもある)**: SP-DEVSYNC-078-C の「集合可変」を再々確認。078=両非衝突 / 079(L-DEVSYNC)=keywords のみ / 本件=両方同時衝突、と組合せは sync 毎に変わる。固定 file 名リストを Phase 11 見積りに焼き込まず `git diff --name-only --diff-filter=U` で都度確定し `pnpm sync:resolve` に委譲する。
- **SP-DEVSYNC-079-C (push-race — push 後に PR mergeable を再確認し base 前進なら即再 sync)**: branch-sync task の Phase 4（push）の完了条件に「PR mergeable 確認」を含める。クリーン push（pre-push gate 全緑）でも 9+ WT 並列運用では base `dev` が同時前進し PR が `CONFLICTING / DIRTY` 化する（本件: push 直後に別 PR #1061 が `ba8bbff0c` として dev 着地 → PR #1066 が CONFLICTING、CI は 29 checks 全 success）。push 後に `gh pr view <n> --json mergeable,mergeStateStatus,statusCheckRollup`（read-only・PR mutation ではない）か `git fetch --prune && git merge-base --is-ancestor origin/dev HEAD`（NO=base 前進）で確認し、CONFLICTING なら `git merge origin/dev` → `pnpm sync:resolve` → typecheck/lint → 再 push をもう 1 周。**CI 全 success と mergeable は独立軸**であり「CI 緑＝完了」と早合点しない（Phase 4 検証手順に明記）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-080（正本・80-C が push-race）, L-DEVSYNC-079（sub-worktree path・keywords 可変）, SP-DEVSYNC-078（前回フルセット組合せ）, SP-DEVSYNC-047/073（`git ls-files -u` 正本則の初出）, [[feedback-grep-head-exit-code-pitfall]]。

### 5 file フルセット衝突は routine — 集合サイズで異常判定せず `sync:resolve`（union 4 + `--ours` 1）に委ね `git ls-files -u` 0 を正本にする（SP-DEVSYNC-082）

> 採番補正: 本節は当初 SP-DEVSYNC-080 として起草したが、`docs/task-a-publish-state-backfill-admin-ui-spec ← dev` 側が独立に SP-DEVSYNC-080（SKILL.md×2 を含む 6 file セット）を採番済みで、`#1091 task-b → dev → 本ブランチ` sync-merge の union 流入で duplicate-heading 化した。SP-DEVSYNC-076-B の runbook（dev 側 canonical 残置・今回連結側を次の空き番号へ renumber）に従い本ローカル追加分を **SP-DEVSYNC-082**（dev 最大 081 の次）へ採番補正。

> branch-sync task の Phase 11（コンフリクト解消検証）見積りで、skill index 衝突が **5 file 全集合**（keywords.json + quick-reference + resource-map + topic-map + task-workflow-active）になっても routine として扱う仕様化のための pattern。

- 事象: sub-worktree から `docs/issue-1030-member-photo-transcode-resize-variant-pipeline-spec` を dev へ sync-merge。`git fetch --prune` 後ローカル dev = origin/dev（独自コミット 0 / behind 0）、feature は origin/dev に **3 behind / 3 ahead**。`git merge dev --no-edit` の content conflict は **5 file フルセット**＝`aiworkflow-requirements/indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`（全 `UU`）。source conflict 0 → `pnpm sync:resolve` 単独収束（`union-resolving 4 files` + `taking --ours for 1 derived files`＝keywords.json + `indexes:rebuild` 5265 kw）→ `git ls-files -u` 0 → merge commit `74948b429`（pre-commit 5 hook pass）→ `pnpm typecheck` exit 0 / `pnpm lint` exit 0（warning 2 既存）/ `pnpm indexes:rebuild` drift 0。grep `^(<<<<<<<|=======|>>>>>>>)` は `ut-08-monitoring-alert-design/.../manual-smoke-log.md` の `====...` 罫線を false positive ヒットしたが `git ls-files -u` 0 を正本に無視。
- **SP-DEVSYNC-082-A (5 file フルセット衝突を異常扱いしない)**: 衝突集合が 5 file 全部でも手順は不変。Phase 11 の解消手順に「集合サイズに依らず `pnpm sync:resolve` 1 回 → `git ls-files -u` 0」を記載し、集合の大小で手動介入の要否を分岐させない（dev の index touch 範囲依存で大きさ自体は異常サインではない）。
- **SP-DEVSYNC-082-B (残コンフリクト判定は `git ls-files -u` 一択・grep false-positive 源は固定)**: grep が `ut-08 smoke-log` 等を誤検出しても `git ls-files -u` 空で収束。SP-DEVSYNC-079-A の再確認。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-083（本 pattern の lessons 版・正本）, L-DEVSYNC-080（5 file フルセット初出・push-race）, SP-DEVSYNC-079（`git ls-files -u` 正本・push-race）, SP-DEVSYNC-078（集合可変）。

### ut-08 smoke-log の `=======` false positive は branch をまたいで再現する — 構造的ピットフォールとして仕様に明記（SP-DEVSYNC-080）

`feat/issue-1031-member-self-photo-upload ← dev`（sub-worktree wt-2・4 behind / 3 ahead）の sync-merge で確証。content conflict は SP-DEVSYNC-079 と同じ **5 file フルセット**＝`aiworkflow-requirements/indexes/{keywords.json, quick-reference, resource-map, topic-map}` + `references/task-workflow-active.md`。source conflict 0 → `pnpm sync:resolve` 単独収束（5272 kw 再生成）→ `git ls-files -u` 0 → merge commit `2253d36c7`。typecheck/lint/indexes drift 0 / gate-metadata ERROR 0。documented procedure（079-A の `git ls-files -u` 正本 + SP-DEVSYNC-078-A の sub-worktree `git rev-parse --git-dir` path 解決）で zero-deviation 収束した確証インスタンス。

- **SP-DEVSYNC-080-A (`^=======` 前方一致 grep の false positive は branch 不変で再現する構造的事象)**: SP-DEVSYNC-079-A で報告した `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-11/manual-smoke-log.md`（`=` 60 個の装飾区切り線）の false positive が、別 branch（issue-1031）の sync でも **全く同じ file・同じ 2 行**で再現した。当該 doc は完了タスクとして dev/merge-base に居座り続けるため、`git grep -nE '^=======' ` は**全 branch の sync で決定論的に再発する**。「たまたまの偶発」と誤認して手動介入しない。仕様の「コンフリクト解消検証」手順には `git ls-files -u`（空＝収束）を唯一の正本として必須記載し、marker 走査するなら `^=======$`（行末 anchor で厳密 7 個）か `git grep -nxE '======='` か `git diff --check` を使う。`^=======`（anchor 無し前方一致）は禁止。
- **SP-DEVSYNC-080-B (5 file フルセット + sub-worktree path 罠でも documented procedure は zero-deviation)**: 衝突集合がフルセット（keywords + map 3 + task-workflow-active 同時）でも、sub-worktree（`.git` がファイル）でも、`git rev-parse --git-dir` で lock/log path 解決 → `pnpm sync:resolve` → `git ls-files -u` 0 → typecheck/lint/`indexes:rebuild` drift 0/`gate-metadata:validate --require-gates-for-changed` ERROR 0 の手順を集合非依存の単一経路で回せば追加判断ゼロで収束する。Phase 11 見積りで衝突 file 名を前回流用せず毎回 `git diff --name-only --diff-filter=U` で確定する（079-B / 078-C の再確認）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-081（本節の lessons 版・正本）, L-DEVSYNC-080（ut-08 false positive / push-race の初出）, L-DEVSYNC-079（sub-worktree `.git` ファイル path 罠）, SP-DEVSYNC-079（前回フルセット + `git ls-files -u` 正本則）, SP-DEVSYNC-078-A（sub-worktree git-dir path 解決）, [[feedback-grep-head-exit-code-pitfall]]。

### 衝突集合に SKILL.md（両 skill）が初めて入る 6 file セットもある（keywords.json は逆に非衝突）／重複 H2 は merge 前後 3 点 grep で既存 backlog 判定（SP-DEVSYNC-080）

`docs/task-a-publish-state-backfill-admin-ui-spec ← dev`（sub-worktree wt-3・2 behind / 2 ahead・ローカル dev は origin/dev 一致で ff 不要）の sync-merge で確立（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-081）。content conflict は **6 file**＝`aiworkflow-requirements/SKILL.md` + `aiworkflow-requirements/indexes/{quick-reference, resource-map, topic-map}` + `references/task-workflow-active.md` + `task-specification-creator/SKILL.md`。**両 skill の `SKILL.md` が同時に衝突に入った初例**（SP-DEVSYNC-078/079 は keywords/map/task-workflow-active の組合せで SKILL.md は常に Auto-merging）。**今回は逆に keywords.json が非衝突**（`Auto-merging`・161 行差分はあるが conflict ではない）。source conflict 0 → `pnpm sync:resolve` 単独収束（resolver ログ `union-resolving 6 files`＝SKILL.md×2 + map 3 + task-workflow-active、keywords.json は非衝突で `--ours` 段スキップ・`indexes:rebuild` のみ）→ merge commit `078bd0a2e`。typecheck/lint exit 0・indexes 冪等 drift 0。

- **SP-DEVSYNC-080-A (SKILL.md×2 も衝突集合の member になり得る — union 登録済みなら resolver に委ねる)**: 衝突集合に `aiworkflow-requirements/SKILL.md` / `task-specification-creator/SKILL.md` が出ても手動 merge せず `pnpm sync:resolve` に委ねる（`scripts/sync/resolve-skill-merge-conflicts.sh` の union 対象に両 SKILL.md が含まれる）。「SKILL.md は narrative だから手動が要る」という固定観念を捨て、Phase 11 見積りの衝突 member 候補に SKILL.md も加える。毎回 `git diff --name-only --diff-filter=U` で実集合を確定（SP-DEVSYNC-078-C/079-B の再々確認）。
- **SP-DEVSYNC-080-B (union 解消後の重複 H2 は merge 前後 3 点 grep で backlog 判定)**: union 解消後 `indexes/quick-reference.md` / `resource-map.md` に同一 H2 が複数（例 `## admin-ui-prototype-alignment（2026-05-23）` ×4）見えても即「union 二重連結 artifact」と断じない。`git show dev:F`・`git show HEAD@{1}:F`（merge 前 feature 先端）・作業ツリーの 3 点で `grep -c '^## <heading>'` を比較し、after==dev かつ dev==feature なら既存 backlog（union 無罪）→ 触らず別 cleanup タスク送り（SP-DEVSYNC-078-C / L-DEVSYNC-078-C）。after が両側より増えていれば初めて union artifact を疑う。L-DEVSYNC-079-B の「lessons-file ID dup 3 点照合」を manual map H2 へ適用した変種。spec の Phase 11 検証手順「重複見出し確認」に 3 点 grep 法を明記する。
- **SP-DEVSYNC-080-C (keywords.json 非衝突回は resolver の `--ours` 段が no-op)**: keywords.json が Auto-merging（非衝突）の回は resolver の `--ours`+rebuild 段がスキップされ `indexes:rebuild` のみ走る。それでも commit 前に `pnpm indexes:rebuild` 冪等（drift 0）を必ず確認し、merge が 3-way 自動結合した keywords.json が rebuild 出力と一致することを検証する（Phase 13 local-check に固定）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-081（正本）, L-DEVSYNC-079-B（dup 3 点照合の原型）, SP-DEVSYNC-079（前回フルセット・push-race）, SP-DEVSYNC-078（衝突集合 member 入替）, SP-DEVSYNC-047/073（`git ls-files -u` 正本則）。

### SKILL.md の衝突は片側だけ入る非対称ケースもある（task-spec/SKILL.md は衝突・aiworkflow/SKILL.md は Auto-merging）／衝突集合は file 単位で可変＝「両 SKILL.md か無か」の二択ではない（SP-DEVSYNC-081）

`docs/task-b-manual-form-resync-admin-ui-spec ← dev`（sub-worktree wt-14・2 behind / 0 ahead・ローカル dev は origin/dev 一致で ff 不要）の sync-merge で確立（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-082）。content conflict は **5 file**＝`aiworkflow-requirements/indexes/{quick-reference, resource-map, topic-map}` + `references/task-workflow-active.md` + **`task-specification-creator/SKILL.md` のみ**。**`aiworkflow-requirements/SKILL.md` は Auto-merging（非衝突）**で、SP-DEVSYNC-080 の「両 SKILL.md 同時衝突」とは逆の **片側のみ衝突という非対称**ケース（dev 未取込は #1087 Task A publish-state-backfill・#1067 issue-1024 sidebar collapse cookie）。keywords.json も Auto-merging（SP-DEVSYNC-080 と同傾向）。source conflict 0 → `pnpm sync:resolve` 単独収束（resolver ログ `union-resolving 5 files`）→ `git ls-files -u` 0 → merge commit `7a2fb9b94`。typecheck/lint exit 0・indexes 冪等 drift 0（5272 キーワード）・gate-metadata `--require-gates-for-changed` ERROR 0。

- **SP-DEVSYNC-081-A (SKILL.md の衝突は skill ごとに独立・片側のみもある)**: 衝突集合に片方の SKILL.md しか出なくても異常ではない。dev 側と feature 側の編集行が重なるかで skill 単位に独立に決まるため、「SKILL.md は 2 つセットで衝突する/しない」という対称性を前提にしない。Phase 11 見積りでは「どちらの SKILL.md も衝突し得る／片側だけもある」と幅を持たせ、実集合は `git diff --name-only --diff-filter=U` で確定する。
- **SP-DEVSYNC-081-B (resolver の処理件数 N は回ごとに変わる — 固定値で見込まない)**: `union-resolving N files` の N は本件 5・SP-DEVSYNC-080 は 6 と回ごとに変動する。件数や member 構成が変わっても標準フロー（`git merge dev` → `pnpm sync:resolve` → `git ls-files -u` 0 → `git commit` → `pnpm typecheck && pnpm lint` → `pnpm indexes:rebuild` 冪等確認 → push）は不変。source conflict 0・keywords 非衝突の回は手動介入ゼロ・CI 修正不要で全ゲート即緑になる（本件がその実例）。spec の Phase 11/13 検証手順は件数を断定せず「`--diff-filter=U` の実集合を resolver に渡す」と記述する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-082（正本）, SP-DEVSYNC-080（両 SKILL.md 衝突の 6 file セット・本 lesson の対比元）, SP-DEVSYNC-078-C/079-B（衝突集合は `--diff-filter=U` で都度確定）, SP-DEVSYNC-047/073（`git ls-files -u` 正本則）。

### keywords.json が衝突→非衝突へ隣接サイクルで反転する 4 file 最小セット（map 3 + task-workflow-active のみ・両 SKILL.md と keywords は Auto-merging）（SP-DEVSYNC-083）

`docs/issue-1030-member-photo-transcode-resize-variant-pipeline-spec ← dev`（sub-worktree wt-13・**7 ahead / 2 behind**・ローカル dev は origin/dev 一致で独自コミット 0・ff 不要）の 2 回目 sync-merge で確立（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-085）。content conflict は **4 file**＝`aiworkflow-requirements/indexes/{quick-reference, resource-map, topic-map}` + `references/task-workflow-active.md` のみ。**keywords.json・両 skill の SKILL.md・lessons-learned ファイルは全て Auto-merging（非衝突）**。直前の L-DEVSYNC-084（keywords が衝突集合へ再登場）から **1 サイクルで keywords が非衝突へ反転**＝SP-DEVSYNC-081-A/L-DEVSYNC-084-A の「衝突可否に周期性なし」を隣接反例で実証。source conflict 0 → `pnpm sync:resolve` 単独収束（resolver ログ `union-resolving 4 files`・keywords 非衝突で `--ours` 段スキップ → `indexes:rebuild`）→ `git ls-files -u` 0 → merge commit `ea8e0a8f6`（pre-commit 5 hook pass）→ `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / `pnpm indexes:rebuild` 冪等（drift 0・5278 キーワード）。CI 修正一切不要で全ゲート即緑。

- **SP-DEVSYNC-083-A (衝突集合は 4 file まで縮みうる — サイズで異常判定しない)**: SP-DEVSYNC-080 は 6 file・082 は 5 file・本件は 4 file（map 3 + task-workflow-active）。両 SKILL.md と keywords が同時非衝突だとこの最小セットになる。Phase 11 見積りは集合サイズを断定せず「`git diff --name-only --diff-filter=U` の実集合を resolver に渡す」と記述し、4〜6 file のどれでも標準フロー（`git merge dev` → `pnpm sync:resolve` → `git ls-files -u` 0 → commit → typecheck/lint → `indexes:rebuild` 冪等 → push）不変とする。
- **SP-DEVSYNC-083-B (keywords 衝突可否は隣接サイクルで反転する — 084↔085 連続反例)**: 同一 branch の前回 sync-merge（SP-DEVSYNC-082）では keywords が衝突し `--ours` 段が走ったが、本件では Auto-merging へ戻った。「同じ branch・直近回の挙動」を当てにせず resolver ログの `union-resolving N` と `taking --ours` 行の有無で都度確認する。keywords 非衝突回でも commit 前に `pnpm indexes:rebuild` 冪等（drift 0）を必ず再確認（SP-DEVSYNC-080-C）。
- **SP-DEVSYNC-083-C (sub-worktree の branch-sync lock は git-common-dir 起点)**: branch-sync 系の lock/log を `.git/<name>` に直書きすると sub-worktree では `.git` がファイル（gitdir ポインタ）のため `not a directory` で失敗する。`git rev-parse --git-common-dir` 配下へ置く（SP-DEVSYNC-078 の再確認）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-085（正本）, L-DEVSYNC-084/SP-DEVSYNC-082（同 branch 前回・keywords 衝突回の直前逆相）, SP-DEVSYNC-081（SKILL.md 片側衝突の非対称・集合 file 単位可変）, SP-DEVSYNC-078（lock/log は git-common-dir 起点・集合 member 入替）, SP-DEVSYNC-047/073（`git ls-files -u` 正本則）。

### 衝突集合 7 file（aiworkflow SKILL.md 衝突 + patterns-lessons-and-pitfalls.md 同時衝突 + keywords 再衝突）の最大級セットでも resolver 単一パス／SKILL.md 非対称は SP-DEVSYNC-081 と逆向きも出る／apps/og install 要件は 3 本目で恒常化（SP-DEVSYNC-082）

`feat/issue-1039-admin-audit-identity-action-presets ← dev`（sub-worktree wt-5・11 behind / 2 ahead・ローカル dev は origin/dev 一致で ff 不要）の sync-merge で確立（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-088）。content conflict は **7 file**＝`aiworkflow-requirements/SKILL.md` + `aiworkflow-requirements/indexes/{quick-reference, resource-map, topic-map, keywords.json}` + `references/task-workflow-active.md` + **`task-specification-creator/references/patterns-lessons-and-pitfalls.md`**。**`task-specification-creator/SKILL.md` は Auto-merging（非衝突）**で、SP-DEVSYNC-081（task-spec SKILL.md 衝突・aiworkflow SKILL.md 非衝突）とは **SKILL.md 非対称が逆向き**。`pnpm sync:resolve` 単独収束（resolver ログ `union-resolving 6 files` + keywords `--ours`+rebuild）→ `git ls-files -u` 0 → merge commit `ab0ef6921`。

- **SP-DEVSYNC-082-A (SKILL.md 衝突の非対称は両向き・本ファイル自身も同回に衝突メンバー)**: どちらの SKILL.md が衝突するかは編集行の重なりで回ごと独立決定し、SP-DEVSYNC-081（task-spec 側衝突）とも逆になり得る（本件は aiworkflow 側衝突）。さらに本ファイル（`patterns-lessons-and-pitfalls.md`）自身が SKILL.md 衝突と同回に重なり 7 file の最大級セットになる。仕様の Phase 11 衝突見積りでは file 数も SKILL.md の向きも断定せず、`git diff --name-only --diff-filter=U` の実集合を resolver に委ねると明記する（両 SKILL.md・本ファイルとも union 登録済み）。
- **SP-DEVSYNC-082-B (sync-merge 後の検証はパイプ禁止で終了コードを直接取る — apps/og install 要件は恒常ルール)**: merge 後の `pnpm typecheck` を `| tail` で見ると pipeline 末尾の exit 0 が前段失敗を隠蔽する（bg タスク通知の "exit code 0" も同根）。`pnpm typecheck > file 2>&1; echo $?` で直接終了コードを取る。本件も `apps/og` 新 package の `Cannot find module 'workers-og'`（node_modules missing）で exit 2 が隠れていた→`mise exec -- pnpm install`（lockfile up to date）で解消。#1031 / #1042 / #1039 と 3 本連続で再発しており、新 workspace package を持ち込む dev 取込のたびに install が前提＝恒常ルール。Phase 13 local-check 手順に「検証はパイプ無し終了コード取得」「新 package 取込時は install を先に当てる」を固定記載する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-088（正本）, L-DEVSYNC-087（パイプ偽陽性・apps/og 再発）, SP-DEVSYNC-081（SKILL.md 片側衝突の逆向き対比元）, SP-DEVSYNC-080（両 SKILL.md 衝突の 6 file セット）, SP-DEVSYNC-078-C/079-B（衝突集合は `--diff-filter=U` で都度確定）, SP-DEVSYNC-047/073（`git ls-files -u` 正本則）。

### sync-merge で dev から新規 workspace project が流入した回は `pnpm install` を typecheck の前段必須ゲートにする — install 前 typecheck は `Cannot find module` の偽失敗を出す（SP-DEVSYNC-082）

`docs/issue-1036-bulk-member-tag-assign-spec ← dev`（sub-worktree wt-11・9 ahead / 3 behind・ローカル dev は origin/dev 一致で ff 不要）の sync-merge で確立（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-086）。content conflict は **3 file**＝`aiworkflow-requirements/indexes/{keywords.json, topic-map.md}` + 本ファイル `task-specification-creator/references/patterns-lessons-and-pitfalls.md`（後 2 者は resolver の `UNION_TARGETS` 登録で `.gitattributes` 未 union でも自前 union 解消、keywords は `--ours`+rebuild）。`pnpm sync:resolve` 単独収束（`union-resolving 2 files`）→ `git diff --diff-filter=U` 0 → merge commit `028f38fec`。**ここまでは定型だが、merge 直後の `pnpm typecheck` が `apps/og typecheck: Cannot find module 'workers-og'` ＋ `node_modules missing, did you mean to install?` で exit 2**。原因は型不整合ではなく、dev が新規 workspace `apps/og`（issue-1027）を追加したのに当 sub-worktree で `pnpm install` が未走（worktree は `node_modules` 独立）だったこと。`pnpm install`（lockfile up to date）後に再 typecheck で 8 packages 全 Done 即緑。

- **SP-DEVSYNC-082-A (新規 workspace 兆候の識別)**: sync-merge 後の typecheck 失敗が `TS2307 Cannot find module '<外部 pkg>'` ＋ pnpm `node_modules missing` の併記なら、コード型エラーではなく **dev 側の新規 workspace / 依存追加の未 install** を第一に疑い、まず `pnpm install` を 1 回流す。spec の Phase 11/13 検証手順では「dev 取込後は必ず install→typecheck の順」と明記する。
- **SP-DEVSYNC-082-B (install は標準フローの前段必須ゲート)**: 仕様の sync-merge フロー（`git merge dev` → `pnpm sync:resolve` → `git diff --diff-filter=U` 0 → `git commit` → **`pnpm install`** → `pnpm typecheck && pnpm lint` → `pnpm indexes:rebuild` 冪等確認 → push）の install を任意手順扱いしない。worktree ごとに `node_modules` 独立のため、workspace 構成や依存が 1 つでも増えた回は install を飛ばすと typecheck が確定で偽失敗する。偽失敗回は CI 修正・revert 不要で install→再 typecheck で収束（`pnpm-lock.yaml` 差分なしなら追加コミットも不要）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-086（正本）, SP-DEVSYNC-081-B（resolver 件数 N は可変・標準フロー不変の系列）, SP-DEVSYNC-078-C/079-B（衝突集合は `--diff-filter=U` で都度確定）。

### 残コンフリクト判定 grep の `=======` 罫線 false-positive は 4 本目の branch でも再現／衝突集合が aiworkflow-requirements skill のみ（task-spec 側ゼロ）の回も定型（SP-DEVSYNC-083）

`docs/issue-1043-identity-conflicts-row-fade-animation-spec ← dev`（sub-worktree wt-8・S-SUB・ローカル dev は origin/dev `17a18e1c2` 一致で ff 不要・feature は dev に 2 behind / 2 ahead）の sync-merge。content conflict は **aiworkflow-requirements 6 file のみ**＝`SKILL.md` + index map 3（`quick-reference`/`resource-map`/`topic-map`） + `keywords.json` + `task-workflow-active.md`。`SKILL-changelog.md` / `LOGS/_legacy.md` は `.gitattributes merge=union` で Auto-merging、**本ファイルを含む task-spec 側は衝突 0**、`apps/**`/`packages/**` source 衝突 0（dev 取込分 #1039 + #1035 は source 非重複追加）。`pnpm sync:resolve` 単独収束（union 5 + keywords.json `--ours`+rebuild）→ `git diff --diff-filter=U` 0 → merge commit `f8f75e251` → typecheck/lint exit 0 / `indexes:rebuild` 冪等（5308 kw）。

- **SP-DEVSYNC-083-A (`=======` grep の罫線 false-positive は branch をまたいで恒常再現)**: 残コンフリクト確認に `git grep -lE '^======='` を使うと、完了済 doc（`docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-11/manual-smoke-log.md` の 60 文字 `===` 罫線）が再びヒットする（SP-DEVSYNC-079/080 で既定義・本回が再現 4 例目）。これは merge 由来でない（`git status --porcelain -- <file>` 空・HEAD にも同一行）。**残存判定の正本は `git diff --diff-filter=U` / `git ls-files -u` / `git diff --check`**（index の unmerged stage を見るため markdown 罫線に反応しない）。spec の Phase 11/13 検証手順では残マーカー確認を grep でなく `--diff-filter=U` で記載する。
- **SP-DEVSYNC-083-B (衝突集合が aiworkflow skill のみ＝task-spec 側ゼロの回も普通)**: 衝突が片 skill（aiworkflow-requirements）だけに出て task-spec 側（本ファイル含む）に 1 件も出ない回がある（どの changelog/index 行を各 wave が触ったかに依存）。「衝突 file が少ない＝手動が要る」ではなく、`.claude/skills/**` 配下のみなら従来どおり `pnpm sync:resolve` 一任で full resolve（L-DEVSYNC-076-C 再確認）。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-089（本 lesson の aiworkflow 版・正本）, SP-DEVSYNC-079/080（`=======` 罫線 false-positive の初出・構造的ピットフォール）, SP-DEVSYNC-081-B（衝突集合は `--diff-filter=U` で都度確定）。

### push 後に dev が前進し `mergeable: CONFLICTING` 化した回 — 上流 PR が同一 component に対称機能を着地させた source 衝突は「import 行 union + test helper 両残し」の純 additive に縮退する（SP-DEVSYNC-085）

`docs/issue-1043-identity-conflicts-row-fade-animation-spec`（merge fade = #1043）を push 済の後、`origin/dev` が **#1095（identity-conflicts dismiss 楽観的更新 + row fade 整合）+ #1082（会員写真 transcode）** で前進し、PR #1099 が `gh pr view --json mergeable,mergeStateStatus` で `CONFLICTING`/`DIRTY` に転落。`git merge dev` の content conflict は skill 7 file + **source 2 file**（`apps/web/src/components/admin/IdentityConflictRow.tsx` + `__tests__/IdentityConflictRow.spec.tsx`）。`pnpm sync:resolve` は source を `WARN unhandled conflict` で残し exit 1、skill 6 file のみ解消。`git diff --diff-filter=U` で source 2 file を確定し手動解消。

- **SP-DEVSYNC-085-A (PR 提出後の mergeable 退行は dev 前進のサイン・再 sync-merge で吸収)**: PR を出した後でも base 側 dev が前進すると `mergeable: CONFLICTING` になる。`gh pr view <n> --json mergeable,mergeStateStatus` で検出 → `git fetch` → `git merge dev` → 解消 → 再 push で吸収する（base への push は不要・禁止）。Phase 13 の「push 後に CI/コンフリクト指示が来たら再確認」手順に mergeable 再取得を含める。
- **SP-DEVSYNC-085-B (対称・直交機能の同 component 衝突は import / 追加 helper だけに限局＝union が唯一解)**: 上流 #1095 が **同じ `IdentityConflictRow` に dismiss 側 optimistic を足した**ため merge fade（HEAD）と衝突したが、2 feature は直交（state も分岐先も別）なので component 本体は Auto-merge し、衝突は **`.tsx` の import 行 1 箇所**（`useCallback,useEffect,useRef` を使う HEAD 版が body 実使用と一致＝dev 版の上位集合ゆえ HEAD 採用）と **`.spec.tsx` の helper 宣言 2 つ**（HEAD `getRowRoot()` + dev `dismissRollbackCases[]`・別 test が各々使うため両残し）に限局。片側を捨てると `useCallback is not defined` / 未定義参照で落ちるので union が唯一解（消すのは base の空セクションのみ）。
- **SP-DEVSYNC-085-C (source 衝突解消の正しさは focused test で即検証してから commit)**: typecheck だけでは test fixture 経由の意味崩れを拾えない。該当 component の focused test（`pnpm exec vitest run --root=. --config=vitest.config.ts <spec>`）で merge fade（exiting→removed）+ dismiss optimistic（rollback）両立の 20 test 緑を確認してから merge commit。spec の Phase 11/13 検証手順に「source 衝突回は focused test を typecheck の後段に必ず通す」を明記。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-091（本 lesson の aiworkflow 版・正本）, SP-DEVSYNC-080/081（source 衝突は別 optional field を併存マージする系列）, SP-DEVSYNC-083-A（衝突集合はサイズ非依存・`--diff-filter=U` で実集合確定）, SP-DEVSYNC-084（同一 branch の連続 sync-merge で重さが激変する系列）。

### install 要否は dev デルタの新規 workspace 有無だけで決まる — 既存 package 内のコード追加のみなら `pnpm install` 不要で typecheck 緑（SP-DEVSYNC-082 の対偶）／衝突 4 file・keywords 非衝突なら resolver は union 段のみで完結（SP-DEVSYNC-085・番号衝突で 083→085 リナンバー）

`docs/sidebar-visibility-conditional-and-ux-spec ← dev`（sub-worktree wt-6・1 behind / 2 ahead・ローカル dev は origin/dev 一致で独自コミット 0・ff 不要）の sync-merge で確立（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-091）。HEAD は既存の `Merge branch 'dev'` コミットで、dev 側に #1073 tag master write endpoints の 1 コミットが先行。content conflict は **4 file**＝`aiworkflow-requirements/indexes/{quick-reference, resource-map, topic-map}` + `references/task-workflow-active.md`。**`keywords.json` / 両 `SKILL.md` / `_legacy.md` / `SKILL-changelog.md` は Auto-merging（非衝突）**。source conflict 0 → `pnpm sync:resolve` 単独収束（resolver ログ `union-resolving 4 files`・**keywords 非衝突のため `--ours` 段は no-op**・`indexes:rebuild` のみ）→ `git diff --diff-filter=U` 0 → merge commit `3566b51fc`。**SP-DEVSYNC-082 と対照的に `pnpm install` を挟まず `pnpm typecheck` がそのまま 6 package 全 Done で緑**（#1073 は `apps/api` 内のコード/テスト追加のみで新規 workspace package を持ち込まないため）。lint exit 0・indexes 冪等 drift 0（5297 キーワード）。

- **SP-DEVSYNC-085-A (install 要否は新規 workspace 有無だけで判定 — コード追加だけなら install 不要 = 082 の対偶)**: SP-DEVSYNC-082 は「新規 workspace 流入 → install 必須」だが、その対偶として **dev デルタが既存 package 内のコード/テスト追加のみ（新 `apps/*` / `packages/*` の `package.json` なし）なら install を挟まずに typecheck が緑になる**。merge 後に install するか否かは conflict の有無や behind 数ではなく、`git diff --stat origin/dev~N..origin/dev -- '**/package.json'`（または取込コミットの touch path）で **新規 workspace package の有無**だけを見て決める。本件 #1073 は `apps/api/src/routes/admin/tags.ts` 等のコード追加のみ → install 不要で即緑。新 package を含む回（SP-DEVSYNC-082 / issue-1031・1036）のみ install を一段挟む。
- **SP-DEVSYNC-085-B (衝突 4 file・keywords 非衝突なら resolver は union 段だけで完結)**: 衝突集合が `index map 3 兄弟 + task-workflow-active` の 4 file で `keywords.json` が Auto-merging の回は、resolver の `union-resolving 4 files` で全解消し `--ours`+rebuild 段は no-op（rebuild のみ走る）。SP-DEVSYNC-080-C（keywords 非衝突回の `--ours` no-op）を 4 file 形で再確認。keywords 衝突を前提にした追加手当ては不要で、衝突集合の形は毎回 `git diff --name-only --diff-filter=U` で確定する。
- **SP-DEVSYNC-085-C (残コンフリクト判定は `--diff-filter=U` 正本・grep `^=======` の装飾線偽陽性に注意)**: マーカー残存確認に `git grep -E '^(<<<<<<<|=======|>>>>>>>)'` を使うと `docs/.../manual-smoke-log.md` の装飾区切り線（`=` 60 文字）を `^=======` が偽陽性検出する（SP-DEVSYNC-079-A/080-A 既出の構造的再発）。残存判定の正本は `git diff --name-only --diff-filter=U`（本件 0）と `git ls-files -u`。spec の Phase 11 検証手順に `git ls-files -u` を唯一の正本として固定する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-091（正本）, SP-DEVSYNC-082（新規 workspace → install 必須・本節はその対偶）, SP-DEVSYNC-080-C（keywords 非衝突回の `--ours` no-op）, SP-DEVSYNC-081-B（resolver 件数 N 可変・標準フロー不変）, SP-DEVSYNC-079-A/080-A（grep `^=======` 偽陽性・`git ls-files -u` 正本則）。

### 同一 branch の連続 sync-merge は回ごとに重さが激変する — source 衝突 + 型 cascade の重い回の翌回が skill-doc-only 4 file の軽い回になり、衝突 member（topic-map↔patterns-lessons）も入れ替わる（SP-DEVSYNC-084）

`docs/issue-1030-member-photo-transcode-resize-variant-pipeline-spec ← dev`（sub-worktree wt-13・**13 ahead / 1 behind**・ローカル dev = origin/dev 一致 `17a18e1c2`・独自コミット 0・ff 不要）の最新 sync-merge で確立（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-090）。**同一 branch の直前回が L-DEVSYNC-089（dev 5 behind・source `memberPhotos.ts` 衝突 + additive 列群の型 cascade で呼び出し元/fixture を手修正した重い回）だったのに対し、本回は behind 1（issue-1039 datalist のみ流入）で content conflict が skill-doc-only **4 file**＝`aiworkflow-requirements/indexes/{quick-reference, resource-map}` + `references/task-workflow-active.md` + `task-specification-creator/references/patterns-lessons-and-pitfalls.md`（source conflict 0）。**`indexes/{keywords.json, topic-map.md}` は Auto-merging（非衝突）**。`pnpm sync:resolve` 単独収束（resolver ログ `union-resolving 4 files`・keywords 非衝突で `--ours` 段 0 件 → `indexes:rebuild`）→ `git ls-files -u` 0 → merge commit `d06c98118`（pre-commit 5 hook pass）→ working tree が merge 前 clean かつ新 package 流入なし・install 済み worktree のため `pnpm typecheck` / `pnpm lint` を **install なしで即緑** → `pnpm indexes:rebuild` 冪等（drift 0・5308 キーワード）。

- **SP-DEVSYNC-084-A (前回の衝突像を予測子に使わない — 重い回⇄軽い回が隣接する)**: 同一 branch wt-13 の直前回（SP-DEVSYNC-083 = 4 file 軽い回 → L-DEVSYNC-089 = source 衝突 + 型 cascade の重い回）と本回（再び skill-doc 4 file の軽い回）は、取り込む dev 差分の中身だけで重さが独立に振れる。Phase 11 衝突見積りに「前回が source 衝突 + cascade で重くても次回が軽い skill-doc-only に戻り得る／その逆もある」と幅を持たせ、毎回 `git diff --name-only --diff-filter=U` で実集合を確定し source conflict の有無を `pnpm sync:resolve` の `WARN unhandled conflict` 行で判定する（あれば手動・なければ resolver 単独収束）。
- **SP-DEVSYNC-084-B (衝突 member は同 branch でも入れ替わる — topic-map↔patterns-lessons の交代)**: SP-DEVSYNC-083 は同 wt-13 で `map 3 + task-workflow-active`（topic-map 衝突・patterns 非衝突）の 4 file だったが、本回は同じ 4 file ながら **topic-map が非衝突へ・patterns-lessons-and-pitfalls が衝突へ**入れ替わった。集合サイズが同じでも member は回ごとに置換されるため、「前回衝突した file 名」を見積りに流用しない。両 map・task-workflow-active・本ファイルとも union 登録済みゆえ member がどう入れ替わっても resolver 単一パスで畳める（SP-DEVSYNC-083-A の集合非依存則の member 版）。
- **SP-DEVSYNC-084-C (install 必須は新 package 流入回のみの条件分岐 — 毎回必須ではない)**: SP-DEVSYNC-082-B / 083-B の「新 workspace package 流入時は install 必須」は dev 差分が新 workspace を持ち込んだ回のみ発火する。本回は behind 1 が既存 `apps/**` の datalist 追加のみで新 package なし → install を挟まず typecheck 即緑。install の要否は「取り込んだ dev コミットが新 workspace/依存を含むか」で判断し、無条件に毎回 install を強制しない（無駄な 40〜50s を省く）。ただし判断に迷う回は install を先に当てる方が安全側。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-090（正本）, L-DEVSYNC-089/SP-DEVSYNC（同 branch 直前の source 衝突 + 型 cascade の重い回）, SP-DEVSYNC-083（同 branch 前回・4 file 軽い回・keywords 非衝突の近縁）, SP-DEVSYNC-082-B（install 必須は新 package 回のみ）, SP-DEVSYNC-078-C/079-B（衝突集合は `--diff-filter=U` で都度確定）, SP-DEVSYNC-047/073（`git ls-files -u` 正本則）。

### 衝突集合に aiworkflow `SKILL.md` 本体 + `resource-map.md` が入り keywords.json は非衝突の 5 file セット（task-spec 側ゼロ）も resolver 単一パスで完結（SP-DEVSYNC-086）

`feat/admin-attendance-dashboard-ux ← origin/dev`（sub-worktree wt-10・**3 ahead / 6 behind**・ローカル dev = origin/dev 一致 `4f7fd80fb`・独自コミット 0・dev 同期は冪等スキップ）の sync-merge で確立（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-092）。`git merge origin/dev --no-edit` の content conflict は **aiworkflow-requirements のみ 5 file**＝`SKILL.md` + `indexes/{quick-reference.md, resource-map.md, topic-map.md}` + `references/task-workflow-active.md`（source conflict 0・**task-specification-creator 側ゼロ**）。**`indexes/keywords.json` は Auto-merging（非衝突）**。`pnpm sync:resolve` 単独収束（resolver ログ `union-resolving 5 files`・keywords 非衝突で `--ours` 段 0 件 → `indexes:rebuild`）→ `git diff --name-only --diff-filter=U` 0 → merge commit `99682a85c`（pre-commit 5 hook pass）→ install なしで `pnpm typecheck` / `pnpm lint` 即緑 → `pnpm indexes:rebuild` 冪等（drift 0・5340 キーワード）。

- **SP-DEVSYNC-086-A (SKILL.md + resource-map.md が衝突／keywords.json が非衝突＝SP-DEVSYNC-081/083 の組み合わせが反転して同時発生)**: SP-DEVSYNC-081 は `task-spec/SKILL.md 衝突・aiworkflow/SKILL.md 非衝突` の非対称、SP-DEVSYNC-083 は `keywords.json が衝突→非衝突へ反転` を別々に記録したが、本回は **aiworkflow/SKILL.md が衝突しつつ keywords.json は非衝突**という両者の組み合わせが 1 回で出た。さらに SP-DEVSYNC-084-B でも非衝突だった `resource-map.md` が今回は衝突 member に入った。衝突 member は「どの skill のどの file か」まで含めて回ごとに総入れ替えされ得るため、`SKILL.md／resource-map.md／keywords.json` のいずれについても「常に衝突／常に非衝突」という固定前提を Phase 11 見積りに持ち込まない。
- **SP-DEVSYNC-086-B (衝突が片 skill（aiworkflow）に閉じ task-spec 側ゼロの回は SP-DEVSYNC-083-C の定型 — file 数が 5 でも質は同じ)**: 本回は 5 file と多めだが全て aiworkflow-requirements 配下で task-specification-creator 側は 0 件。SP-DEVSYNC-083-C（task-spec 側ゼロの回も定型）が file 数 5 でも成立することを再確認。union 登録済み member（両 skill の map / task-workflow-active / patterns-lessons-and-pitfalls / SKILL.md）はどちらの skill に偏っても resolver 単一パスで畳めるので、「片 skill 集中＝異常」と扱わない。
- **SP-DEVSYNC-086-C (残コンフリクト判定は `git diff --name-only --diff-filter=U`／`git ls-files -u` 正本・`grep '^======='` の装飾線偽陽性に注意)**: SP-DEVSYNC-085-C / 079-A 既出の構造的再発として、マーカー残存確認の `git grep -E '^(<{7}|={7}|>{7})'` が `docs/.../ut-08-monitoring-alert-design/.../manual-smoke-log.md` の `=` 60 文字装飾区切り線を `^={7}` で偽陽性検出する（本回も再現）。残存判定の正本は `git diff --name-only --diff-filter=U`（本件 0）と `git ls-files -u` であり、grep ヒットは `diff-filter=U` 一覧に無い file なら無視してよい。spec の Phase 11 検証手順にこの偽陽性を明記する。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-092（正本）, SP-DEVSYNC-081（SKILL.md 衝突は非対称）, SP-DEVSYNC-083（keywords 非衝突反転 + task-spec 側ゼロ）, SP-DEVSYNC-084-B（衝突 member は同 branch でも入れ替わる）, SP-DEVSYNC-085-C/079-A（`=======` 装飾線 false-positive）, SP-DEVSYNC-082-B（install 必須は新 package 回のみ）, SP-DEVSYNC-047/073（`git ls-files -u` 正本則）。

### 衝突 5 file（aiworkflow SKILL.md + index map 3 + keywords.json）は SP-DEVSYNC-085 の鏡像 — keywords が衝突して resolver の `--ours`+rebuild 段が発火し `task-workflow-active.md` は Auto-merge・SKILL.md が衝突。union 段の member（SKILL.md ↔ task-workflow-active）と keywords の衝突有無は連動して入れ替わる（SP-DEVSYNC-086）

`docs/issue-1056-kv-alert-policy-drift-detection-spec ← dev`（sub-worktree wt-14・**6 behind / 2 ahead**・ローカル dev = origin/dev 一致 `722f5ff62`・独自コミット 0・ff 不要）の sync-merge で確立（[[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-092）。content conflict は **5 file**＝`aiworkflow-requirements/SKILL.md` + `aiworkflow-requirements/indexes/{quick-reference, resource-map, topic-map, keywords.json}`。**`references/task-workflow-active.md` / 両 `SKILL-changelog.md` / `_legacy.md` / task-spec `SKILL.md` は Auto-merging（非衝突）**。source conflict 0 → `pnpm sync:resolve` 単独収束（resolver ログ `union-resolving 4 files`＝SKILL.md + map 3・**keywords 衝突のため `taking --ours for 1 derived files` 発火** + `indexes:rebuild`）→ `git diff --diff-filter=U` 0 / `git ls-files -u` 0 → merge commit `b97cd2858`。新 package 流入なしのため SP-DEVSYNC-085-A の対偶どおり typecheck は install なしでも緑（本件は念のため install を一段挟み Done 14.8s・新 package 報告なし）→ lint exit 0・indexes 冪等 drift 0（5309 キーワード）。

- **SP-DEVSYNC-086-A (085 の鏡像 — keywords 衝突有無と SKILL.md/task-workflow-active の member 交代は連動する)**: SP-DEVSYNC-085 は「keywords 非衝突（`--ours` no-op）・task-workflow-active 衝突・SKILL.md Auto-merge」で union 4 file =（map 3 + task-workflow-active）だった。本件は完全な鏡像で「**keywords 衝突（`--ours` 発火）・task-workflow-active Auto-merge・SKILL.md 衝突**」となり union 4 file =（SKILL.md + map 3）。union 段の件数 4 は同じでも member（SKILL.md か task-workflow-active か）と keywords の `--ours` 発火有無が回ごとに同時入れ替わる。Phase 11 衝突見積りでは衝突 member 名を固定前提にせず、毎回 `git diff --name-only --diff-filter=U` で実集合を確定して resolver に委ねる。
- **SP-DEVSYNC-086-B (両 SKILL.md・両 map・task-workflow-active・keywords は全て union/`--ours` 登録済 — member がどう入れ替わっても resolver 単一パス)**: 衝突 member が SKILL.md 側に振れても task-workflow-active 側に振れても、全 file が resolver の解消対象に登録済みのため `pnpm sync:resolve` 1 パスで畳める（SP-DEVSYNC-085-B の集合非依存則を member 交代版で再確認）。「SKILL.md が衝突＝手動」と誤認しない。
- **SP-DEVSYNC-086-C (install 要否は新 package 有無だけ — 迷う回は安全側で先に install)**: dev デルタ 6 コミットは既存 `apps/**` のコード追加のみで新 workspace package なし → SP-DEVSYNC-085-A どおり install 不要で typecheck 緑。本件は判断の安全側として install を先に当てたが副作用なし（Done 14.8s）。install の要否は conflict の有無や behind 数でなく取込コミットの新 workspace package 有無で判断し、迷う回は install を先行させてよい。
- 参照: [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-092（正本）, SP-DEVSYNC-085（本節の鏡像・keywords 非衝突 + task-workflow-active 衝突 + SKILL.md Auto-merge の逆構成）, SP-DEVSYNC-082（新規 workspace → install 必須・本節 C はその対偶）, SP-DEVSYNC-080-C（keywords 非衝突回の `--ours` no-op・本件は衝突回の対比）, SP-DEVSYNC-084-B（衝突 member は同 branch でも入れ替わる）, SP-DEVSYNC-047/073（`git ls-files -u` 正本則）。
