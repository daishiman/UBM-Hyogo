# Lessons Learned: admin-visual-baseline-admin-routes-task-e

admin 配下 10 必須ルート + 2 env-gated 詳細ルートの staging visual baseline coverage を追加するタスク E の苦戦箇所集。次回の admin 系・大量ルート系 visual baseline 拡張（例: `/admin/audit/[id]`、`/admin/meetings/[id]/attendance` 詳細追加）で同じ落とし穴を踏まないための知見。L-I902-001..004（public 動的ルート版）と相補関係にある。

## L-AVBE-001: 詳細ルートは「両方そろう or 両方撮らない」(both-or-none) を仕様で禁止帯にする

10 必須 + 2 env-gated（`members-detail` / `meetings-detail`）の構成で「片方だけ撮影 → 44 PNG」が技術的には可能になる。この 44 PNG 状態は CI で merge されると次回片方が落ちたとき diff が出るが、もう片方は永久に欠落のままで気付きにくい。各 spec 側で `test.skip(!DETAIL_SEEDS_READY, ...)` の単一フラグ判定にし、ENV は `PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` と `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID` の両方が揃ったときだけ `DETAIL_SEEDS_READY = true` とする both-AND 条件で組んだ。

**Why:** baseline は「セット運用」が前提（40 か 48 のみ正常）。中間状態 44 を許すと、運用上「もう片方の seed どこ行った？」を CI ログから追えなくなる。`test.skip` を spec ごとに独立判定すると、env のどちらか片方だけ注入された瞬間に 44 PNG が成立し得るため、判定変数を 1 箇所に集約する。

**How to apply:** N 件 + M 件の env-gated 構成では「N + M 件すべて成立 = ON / それ以外 = OFF」のシングルフラグで判定する。`playwright-smoke.yml` の `workflow_dispatch.inputs` も対の input は必ずペアで required:false にし、preflight job で両方ある/ない以外を fail させると更に強固。Phase 5 design で「許容枚数」を `default: N、full: N+M、forbidden: N+M-1..N+1` のテーブルとして明文化する。

## L-AVBE-002: admin-shell 専用の Playwright project は `EVIDENCE_DIR` を spec パス由来に自動分岐する

既存の `staging-visual` project は `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/outputs/phase-11/evidence` 固定で report / test-results を出していた。Task E の admin-shell 群を同じ project に相乗りさせると evidence が UT-DSF-07 配下に混じる。`playwright.config.ts` で spec の testDir が `admin-shell/` 配下かを判定し、admin-shell 系は `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-11/evidence` へ自動振り分けする `getEvidenceDir(testPath)` を入れた。

**Why:** evidence path は workflow root と 1:1 で紐づくのが Phase 11 evidence 規約。混在すると `artifacts.json.gates[].evidence_path` が誤参照になり、後の workflow rename / completed-tasks 移動時に L-I902-004 と同じ ERROR 群が発生する。config 側で自動分岐すれば「spec を新しい workflow 配下に置いた瞬間に正しい evidence dir に着地」が保証される。

**How to apply:** 新 visual workflow を追加するときは、(1) testDir 配下にタスク専用サブディレクトリを切る、(2) `playwright.config.ts` の `reporter` / `outputDir` を spec パスから派生計算する関数化、(3) `playwright-smoke.yml` の `upload-artifact` `path:` も同じ workflow root に揃える、を 1 wave で実施する。後付けで分けようとすると baseline PNG ファイル名と project name suffix（`-{project}-linux.png`）の不整合まで連鎖する。

## L-AVBE-003: 既存 `visual-chromium` への `testIgnore` で admin-shell 漏れを止める — project 追加だけでは local 重複実行が残る

`admin-staging-visual-{mobile,tablet,desktop,wide}` 4 project を新規追加しただけだと、既存の local 用 `visual-chromium` project が `tests/visual/**/*.spec.ts` を glob で拾い、admin-shell 配下も local visual 実行に混入する。local では baseline 名が `-visual-chromium-linux.png` 系になり、staging 用 `-admin-staging-visual-{viewport}-linux.png` と二重 baseline 生成・名前不一致 fail を生む。`visual-chromium.testIgnore` に `tests/visual/admin-shell/**` を追加して明示除外した。

**Why:** Playwright project は加算的に testMatch を解決するため、新 project を足しても旧 project から除外されない。`-snapshots/` ディレクトリは project 名で決まる baseline ファイル名を保持するので、同じ spec が 2 project で動くと baseline 名の bake が不安定になる（先に走った方が勝つ）。明示 `testIgnore` がないと local の `pnpm test:visual` が staging baseline と衝突する。

**How to apply:** 既存 project と新 project が testDir を共有する場合は、新 project 追加と同 wave で既存 project に `testIgnore` を必ず足す。逆に新 project の `testMatch` も「自分の subdir 配下のみ」に narrow し、双方向に独立化する。Phase 6 test additions の AC に「local visual run で admin-shell が 0 件」「staging visual run で local-only spec が 0 件」を入れると regression を防げる。

## L-AVBE-004: `snapshotPathTemplate` を project ごとに分けないと viewport 間で baseline が衝突する

4 viewport の project がすべて同じ spec を共有するため、`snapshotPathTemplate` を default のままにすると 4 project の baseline が同じ `-admin-staging-visual-chromium-linux.png` ファイル名に bake され、最後に走った viewport で上書きされ続ける。`snapshotPathTemplate: '{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}-linux{ext}'` を各 admin-staging-visual project に明示し、`{projectName}` を baseline file 名に必ず含めるようにした。

**Why:** Playwright の default snapshot 名は OS suffix を付けるが project 名は条件付きでしか入らない。複数 project が 1 spec を共有する構成では project 名を必ず入れないと baseline が互いに食い合う。実行順は CI runner 次第なので「最後勝ち」の baseline は再現性ゼロ。

**How to apply:** 「N project × 1 spec set」構成は必ず `snapshotPathTemplate` で `{projectName}` を ファイル名に固定する。逆に「1 project × N viewport」を `page.setViewportSize` で内部切替する設計は baseline 名が手動命名になり別の事故源なので、project 分割（本タスクの選択）を推奨する。

## L-AVBE-005: storageState は既存 setup-minted パスを再利用する — 仕様書ドラフト名で新規ファイルを生やさない

Phase 5 design の draft では `apps/web/playwright/.auth/admin-staging.json` を新パスとして書いていたが、実装時に既存 `setup-authenticated-staging` project が `apps/web/playwright/.auth/admin.storageState.json` をすでに mint している事実を確認し、新パスを生やさず既存に揃えた。これにより admin auth mint job を 2 系統運用する負債を回避できる。

**Why:** storageState ファイルが複数あると、(1) どちらが最新か mint タイミングで判別不能、(2) test 用 cookie の TTL 管理が二重化、(3) CI cache 戦略が分岐、の 3 重コスト。`setup-authenticated-staging` を depend する project は同じ storageState を共有するのが Playwright の dependency 設計意図でもある。

**How to apply:** Phase 5 design で path を新設する前に、既存 `setup-*` project の `outputs` / 出力 storageState path を `grep -rn "storageState" apps/web/playwright/` で網羅確認する。Phase 12 implementation-guide の "Notes for follow-up" に「draft path vs 採用 path」の差分を書き残し、後続タスクが draft を rehydrate しないようにする。

## L-AVBE-006: 旧 `admin-dashboard.spec.ts` と baseline PNG は新 spec への static merge と同 commit で物理削除する

`apps/web/playwright/tests/visual/admin-dashboard.spec.ts` と対応 `-snapshots/admin-dashboard-visual-chromium-linux.png` は新 `admin-shell/dashboard.spec.ts` に統合された。旧ファイルを残すと `visual-chromium` project が拾って baseline 衝突 + 「同じ画面の baseline が 2 経路ある」状態を生む。Phase 5 implementation で `git rm` まで含め、Phase 12 implementation-guide の "Files deleted" 節で明示記録した。

**Why:** spec の static merge は「旧 spec が走らなくなる」だけでは不十分で、Playwright は spec が存在する限り project の glob で拾い続ける。baseline PNG も同様に snapshot matcher の name table に残り続け、後で「使われていない baseline はどれ？」の判別が effective に不可能になる。

**How to apply:** spec 統合タスクは "rename + delete" を 1 commit で済ませ、Phase 12 implementation-guide に "Files added / modified / deleted" の 3 区分を必ず書く。`git status` で `D` 行と `??` 行が両方出る状態を完了条件にする（rename ではなく `delete + add` で扱うことで、baseline PNG の所属も明示的に切れる）。
