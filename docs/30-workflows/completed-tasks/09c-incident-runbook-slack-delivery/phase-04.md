# Phase 4: テスト戦略 — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: Phase 2 設計と Phase 3 レビューを受け、Slack 配信スクリプト・Block Kit template render・evidence 永続化・誤配信ガード・secret 不在時の fail-fast を検証する unit / integration / e2e (smoke) テスト戦略を確定する。Vitest テストファイル新規追加、`@slack/web-api` の stub、実 Slack 環境への dryrun smoke 実行を含むため docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 4 / 13 |
| wave | 9c-fu |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 AC（AC-01〜AC-07）を機械的に検証可能なテストに分解し、Phase 7 で実装、Phase 8 で実行できる粒度に落とす。誤配信ガード・token 漏出ゼロ・evidence schema 準拠の 3 つを最重要 invariant として固める。

## テストピラミッド

```
                ┌──────────────────────────────┐
       e2e      │ dryrun smoke (実 Slack 1 件) │  1 ケース / 手動 + CI 限定
                └──────────────────────────────┘
              ┌──────────────────────────────────┐
   integration│ CLI argv → script → mock WebClient│  4 ケース
              │ → evidence file written           │
              └──────────────────────────────────┘
        ┌─────────────────────────────────────────────┐
   unit │ renderTemplate / buildRunbookPermalink /     │  10+ ケース
        │ saveEvidence / mode switch / mask / errors  │
        └─────────────────────────────────────────────┘
```

総数目安: unit 10〜14 / integration 4 / e2e 1。Vitest 単一 framework に統一。

## テストファイル一覧

| パス | レイヤ | 役割 |
| --- | --- | --- |
| `scripts/notify/__tests__/slack-incident-runbook.test.ts` | unit + integration | 主要 unit cases と CLI integration |
| `scripts/notify/__tests__/render-template.test.ts` | unit | Block Kit render snapshot / 変数置換 |
| `scripts/notify/__tests__/save-slack-evidence.test.ts` | unit | evidence JSON schema / 書き込み |
| `scripts/notify/__tests__/mode-switch.test.ts` | unit | 誤配信ガード（dryrun ↔ production 隔離） |
| `scripts/notify/__tests__/permalink.test.ts` | unit | `buildRunbookPermalink` の SHA pin |
| `scripts/notify/__tests__/dryrun-smoke.e2e.ts` | e2e | 実 Slack dryrun channel への post（手動 / CI manual trigger 限定） |

`vitest.config.ts` には `scripts/notify/**/*.test.ts` を include する設定を Phase 7 で追加。e2e は `vitest --run dryrun-smoke.e2e.ts` を別 npm script で起動。

## 単体テストケース表

| # | case 名 | input | expected | 種別 |
| --- | --- | --- | --- | --- |
| U-01 | template render: header に release version が入る | `renderTemplate({ mode: "production", releaseVersion: "v1.4.2", ...fixtures })` | header.text に `v1.4.2` を含む | unit |
| U-02 | template render: dryrun mode は header に `[DRYRUN]` プレフィックス | `mode: "dryrun"` | header.text に `[DRYRUN]` を含む | unit |
| U-03 | template render: 全 placeholder が置換される | 全変数を fixture | 出力 JSON に `{{` を含まない | unit |
| U-04 | template render: snapshot 一致 | 固定 fixture | `__snapshots__/render-template.snap` と一致 | unit |
| U-05 | buildRunbookPermalink: SHA pin URL 生成 | `{ repoSlug: "daishiman/UBM-Hyogo", commitSha: "abc...", runbookPath: "docs/30-workflows/.../incident-runbook.md" }` | `https://github.com/daishiman/UBM-Hyogo/blob/abc.../docs/...` | unit |
| U-06 | buildRunbookPermalink: SHA が短縮形でも動く（規約は full） | `commitSha: "abc1234"` | URL に `abc1234` がそのまま含まれる（警告ではなく許容） | unit |
| U-07 | mode switch: dryrun で production channel id 変数が読まれない | env に両 id 設定し dryrun 実行 | 実際に `chat.postMessage` の channel 引数が `..._DRYRUN_CHANNEL_ID` の値 | unit (with WebClient stub) |
| U-08 | mode switch: 不正 mode で exit 2 | argv `--mode prod` (typo) | process.exit(2) (or thrown via test wrapper) | unit |
| U-09 | secret 不在: token 未設定で exit 2、token 文字列を出力しない | `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK=""` | exit 2、stderr に `missing env: SLACK_BOT_TOKEN_INCIDENT_RUNBOOK`、`xox[b]-` 文字列を含まない | unit |
| U-10 | secret 不在: channel id 不在で exit 2 | dryrun 実行 + dryrun id 未設定 | exit 2 | unit |
| U-11 | Slack API 4xx: `channel_not_found` で exit 1 | mock WebClient が error 投げ | exit 1、log に `channel_not_found`、token 文字列なし | unit |
| U-12 | Slack API 5xx: 3 retry 後 exit 1 | mock WebClient が 500 を 3 回 | retryCount=3 後 exit 1 | unit |
| U-13 | Slack API rate limited: 即時 exit 1 | mock が `ratelimited` | exit 1、`Retry-After` を log するが retry しない | unit |
| U-14 | log mask: token 含む文字列が log に出ても置換される | `console.log("token=xox[b]-abc-def")` | 出力に `xox*-***` のみ含み、`xox[b]-abc-def` を含まない | unit |
| U-15 | evidence schema 準拠: 出力 JSON の required keys を満たす | mock 成功 → `saveEvidence` | JSON schema validate（`ok`, `mode`, `channel`, `ts`, `message.permalink`, `postedAt`, `releaseVersion`, `commitSha`, `runbookPermalink` 全て存在） | unit |
| U-16 | evidence: token 値が含まれない | 上に同じ | `xox[b]-` 含まないことを assert | unit |
| U-17 | permalink 取得失敗: `permalink: null` で exit 0 | `chat.getPermalink` が ok=false | exit 0、evidence の `permalink` が null | unit |
| U-18 | evidence ファイル名が mode で切り替わる | `mode: "dryrun"` → `slack-delivery-dryrun.json`、`production` → `slack-delivery-production.json` | basename 一致 | unit |

## 統合テストケース表

| # | case 名 | input | expected | 種別 |
| --- | --- | --- | --- | --- |
| I-01 | CLI 一気通貫 (dryrun) | argv 完全指定 + WebClient stub | exit 0、evidence file 生成、JSON schema 一致 | integration |
| I-02 | CLI 一気通貫 (production) | argv production + stub | exit 0、production channel id が使われる | integration |
| I-03 | 環境変数だけで動く（GitHub Actions 模倣） | `process.env.GITHUB_REPOSITORY` / `GITHUB_SHA` 設定 | runbookPermalink がそれら値を使う | integration |
| I-04 | evidence dir が存在しなくても自動作成 | tmpdir + 未作成 sub path | 書き込み成功 | integration |

## E2E（dryrun smoke）

| # | case 名 | input | expected | 備考 |
| --- | --- | --- | --- | --- |
| E-01 | 実 Slack dryrun channel に post | 1Password 経由で実 token、dryrun channel id | `chat.postMessage` 200 / `ok=true`、Slack 上で目視確認可能、evidence 生成 | 手動 / GitHub Actions の `workflow_dispatch` でのみ実行 |

E-01 は Phase 11 runtime evidence 取得そのもの。Phase 8 の通常 CI gate には含めない。

## Mock 戦略

`@slack/web-api` の `WebClient` を Vitest で stub。

```ts
import { vi } from "vitest";

const postMessage = vi.fn().mockResolvedValue({
  ok: true,
  channel: "C0000000000",
  ts: "1714960000.000100",
  message: { bot_id: "B000", text: "stub" }
});
const getPermalink = vi.fn().mockResolvedValue({
  ok: true,
  permalink: "https://ubm-hyogo.slack.com/archives/C0000000000/p1714960000000100"
});
const WebClientStub = vi.fn().mockImplementation(() => ({
  chat: { postMessage, getPermalink }
}));
vi.mock("@slack/web-api", () => ({ WebClient: WebClientStub }));
```

DI 経路（Phase 3 で WARN 引き渡し）が Phase 6 で実装される場合は、`postIncidentRunbook({ ..., webClient: stubInstance })` で直接注入する形にも対応する。

## カバレッジ目標

| 対象 | line | branch | function |
| --- | --- | --- | --- |
| `scripts/notify/render-template.ts` | ≥95% | ≥90% | 100% |
| `scripts/notify/save-slack-evidence.ts` | ≥95% | ≥90% | 100% |
| `scripts/notify/slack-incident-runbook.ts` | ≥85% | ≥80% | ≥90% |

`pnpm` の coverage runner は `vitest --coverage` (v8 provider)。e2e は coverage 集計外。

## ローカル実行コマンド

```bash
# 依存インストール（@slack/web-api 追加後）
mise exec -- pnpm install

# 型チェック
mise exec -- pnpm typecheck

# unit + integration（高速）
mise exec -- pnpm vitest run scripts/notify/__tests__ --coverage

# 単一ファイルだけ実行
mise exec -- pnpm vitest run scripts/notify/__tests__/render-template.test.ts

# e2e dryrun smoke（実 Slack へ送信。op 経由）
bash scripts/with-env.sh \
  mise exec -- pnpm vitest run scripts/notify/__tests__/dryrun-smoke.e2e.ts
```

## CI 配置

| 場所 | 実行内容 |
| --- | --- |
| 既存 `verify` workflow（unit + lint + typecheck） | unit + integration を必ず実行 |
| `.github/workflows/incident-runbook-slack-delivery.yml`（本タスクで新規） | dryrun job 内で e2e smoke 相当の `chat.postMessage` を実行（評価対象は workflow run 自体） |
| pre-commit hook | 既存 `lefthook.yml` の lint/typecheck 経路に乗る |

## 観測 / 失敗時の調査手順

| 失敗 | 一次調査 |
| --- | --- |
| U-09/U-10 失敗 | env loader 順序を確認。テスト前に `vi.stubEnv` をリセットしているか |
| U-14 失敗 | console 置換が `beforeAll` でかかっているか、test 内で再 import していないか |
| I-01 失敗 | tmpdir の cleanup が他テストと衝突していないか（`fs.mkdtempSync(os.tmpdir() + "/slack-")` を毎テストで切る） |
| E-01 失敗 | Slack token / channel id / bot 招待状態を Phase 5 ランブックで再確認 |

## セキュリティ観点のテスト

| # | 観点 | 検証手段 |
| --- | --- | --- |
| S-01 | token が evidence に含まれない | U-16 で assert |
| S-02 | token が log に含まれない | U-14 で assert + `pnpm test 2>&1 \| rg -F "xox[b]-"` で 0 hit |
| S-03 | dryrun → production 漏出なし | U-07 で channel 引数を assert |
| S-04 | mode 不正値の即時拒否 | U-08 |

## 参照資料

- `phase-02.md`（関数シグネチャ・evidence schema）
- `phase-03.md`（テスト容易性 WARN: WebClient DI 化）
- `phase-01.md`（AC-01〜AC-07）
- Vitest docs / `@slack/web-api` types
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-04.md`（フォーマット参照）

## サブタスク管理

- [ ] U-01〜U-18 / I-01〜I-04 / E-01 を test ファイルにマップ済み
- [ ] mock 戦略を Phase 7 実装ガイドへ
- [ ] coverage 目標を CI gate 設定に反映
- [ ] `outputs/phase-04/main.md` 作成

## 成果物

- `outputs/phase-04/main.md`

## Definition of Done（Phase 4）

- [ ] テストピラミッド・ファイル一覧・ケース表（unit 18 / integration 4 / e2e 1）が網羅されている
- [ ] AC-01〜AC-07 が全てテストケースにマップされている（cross-reference 表は Phase 7 で作成）
- [ ] mock 戦略（`@slack/web-api` の `WebClient` stub）がコード片で示されている
- [ ] カバレッジ目標が file 単位で定義されている
- [ ] ローカル実行コマンドが mise / pnpm / op 経由で確定している
- [ ] セキュリティ観点（token 非露出、誤配信なし）の test ID が明示されている
- [ ] `outputs/phase-04/main.md` にサマリが保存されている

## 次 Phase への引き渡し

Phase 5 へ:
- 単体・統合・e2e の実行コマンド一覧（ランブックに転記）
- e2e dryrun smoke の前提条件（Slack workspace 設定 / 1Password vault / GitHub Secrets / Variables）
- mock 戦略を踏まえた WebClient DI 実装方針
