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
