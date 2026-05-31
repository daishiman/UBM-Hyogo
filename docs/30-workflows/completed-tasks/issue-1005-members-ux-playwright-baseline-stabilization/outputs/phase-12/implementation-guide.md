<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 12 -->

# Implementation Guide — issue-1005-members-ux-playwright-baseline-stabilization

## Part 1: 中学生レベルの説明

`/members`（会員一覧）ページの見た目を自動でスクリーンショット撮影して、
あとから「デザインが崩れていないか」を比べる仕組み（visual baseline）があります。

ところが、撮影ロボット（Playwright）が動き出すとき、ページを表示するサーバーが
まだ「準備運動（ウォームアップ）」を終えていないことがあります。
サーバーは初めてそのページを開かれた瞬間に裏で組み立て作業を始めるので、
1 枚目の写真を撮ろうとした時に「まだ画面ができていない！」となって失敗してしまうのです。
これまではこの失敗を、別の手作業スクリプトで穴埋めしていました。

対策はシンプルです。

1. **先に 1 回ページを開いて温めておく**。撮影を始める前にロボットに `/members` を 1 回開かせ、
   サーバーの組み立てを終わらせてから本番の撮影に入ります。
2. **写真の保存先フォルダを正しい場所に直す**。元の保管場所が「引っ越し（完了タスク用フォルダへ移動）」したのに、
   撮影ロボットが古い住所に写真を届けていました。これを新しい住所へ直します。
3. **撮影は 1 セットだけにする**。同じ写真を 3 種類のブラウザで 3 回も撮って上書きしていたので、
   代表 1 ブラウザだけで撮るようにして、ムダと失敗の元を減らします。

これで、毎回手作業で穴埋めしなくても、サーバーを新しく起動した直後でも安定して
24 枚の写真がそろうようになります。

## Part 2: 技術者レベルの説明

### 変更対象（2 ファイル）

- `apps/web/playwright.config.ts`
- `apps/web/playwright/tests/members-ux-clarity.spec.ts`

### RC-1: cold-compile race の除去

Next dev（`dev:webpack`）は on-demand compile のため、matrix 先頭テスト（mobile/comfy）が
`/members` の cold-compile に当たり per-test timeout を超過して flaky になる。

- `playwright.config.ts` に `isMembersUxClarityBaseline` flag を追加（既存 `isMembersPrototypeAlignment` と同型）。
  flag 有効時は webServer の ready URL を `${localBaseURL}/members` にして、起動時に route compile を強制する。
  `/members` の cold compile は 120s を超えることがあるため、同 flag では `webServer.timeout` も 180s に拡張する。
- `members-ux-clarity.spec.ts` に `beforeAll` の明示 warm-up navigation を追加し、
  最初の visual テストが走る前に route を確実に compile 済みにする。

### RC-2: 出力先 path drift の補正

- spec の `workflowRoot` 定数を `docs/30-workflows/completed-tasks/members-list-ux-clarity` へ補正。
- `process.env.MEMBERS_UX_EVIDENCE_DIR` による override も許容（CI / 一時出力先切替に対応）。
- `playwright.config.ts` の `EVIDENCE_DIR` 分岐も同 path へ整合させる。

### RC-3: evidence flag gating（冗長 project の解消）

- evidence flag 未設定時は `fixtureGatedTestIgnore` で当該 spec を除外。
- evidence run（argv / env flag）時のみ単一 project（desktop-chromium 相当）で 1 回だけ実行し、
  同名 24 PNG の 3 重上書きと flake 面・実行時間を削減する。

### RC-4: runtime-notes 文言更新

- spec の `afterAll` runtime-notes 生成文言を「cold start で direct-script 補完不要」に更新し、
  出力先を補正後 path に固定する。

### RC-5: mobile filter expansion の安定化

- mobile viewport では `filters-summary-mobile` をクリックして `filters-body` を展開してから撮影する。
- cold-start hydration 直後に click state が反映されない環境があるため、`data-expanded=true` を待つ。
- visual baseline 取得目的の最終 fallback として DOM 属性を固定する。toggle の機能自体は component test で担保する。

### 検証コマンド

```bash
pnpm --filter @ubm-hyogo/web exec tsc --noEmit --pretty false
curl -I --max-time 180 http://localhost:3000/members
CI=1 PLAYWRIGHT_BASE_URL=http://localhost:3105 \
  PLAYWRIGHT_EVIDENCE_TASK=members-ux-clarity-baseline \
  pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity --project=desktop-chromium
find docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots \
  -name 'members-ux-clarity-*.png' | wc -l
test ! -d docs/30-workflows/members-list-ux-clarity && echo OK
```

### 不変条件

- INV-1: 既存 API endpoint surface のみ利用（`/members` の query/schema 変更なし）。
- INV-5: 新規 test ファイルを増やさない（既存 `.spec.ts` の編集のみ）。
- INV-6: `apps/web/src` へのローカル限定 endpoint 焼き込み禁止。

## DoD

- [ ] Part 1（比喩）と Part 2（技術）の両方を含む
- [ ] 変更 2 ファイルと検証コマンドが記載されている
- [ ] PR 本文へ流用可能な構成になっている
