# Phase 2: 設計 — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 2 / 13 |
| wave | 09c-fu |
| mode | parallel |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #352 |

## 目的

Phase 1 の AC・CLI 契約を、`scripts/postmortem/generate-postmortem.ts` の関数シグネチャ・CLI parser・template ファイル構造・runbook 章立てまで落とす。S1（blame 排除構造）/ S2（evidence path 必須）/ S3（runbook 責務分離）/ S4（冪等性）/ S5（pnpm 統合）を構造で守る。

## 実行タスク

1. スクリプトの 2 層構造（pure 関数層 + CLI 層）を確定する。
2. template.md の本文（見出し + 空欄プレースホルダ）を確定する。
3. runbook README の章立てと follow-up issue 作成手順（gh CLI スニペット）を確定する。
4. CONST_005 必須項目（変更ファイル一覧 / 関数シグネチャ / 入出力・副作用 / テスト方針）を埋める。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 | `outputs/phase-01/main.md` |
| 09c Phase 11 evidence | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` |
| 既存 Node 系 script | `scripts/coverage-guard.ts` `scripts/skill-logs-append.ts` |
| package.json | `package.json`（scripts セクション） |

## 変更対象ファイル一覧（CONST_005）

| 種別 | パス | 役割 |
| --- | --- | --- |
| 新規 | `scripts/postmortem/generate-postmortem.ts` | CLI エントリ + `generatePostmortem(input)` pure 関数 |
| 新規 | `scripts/postmortem/__tests__/generate-postmortem.test.ts` | unit test（pure 関数の決定論性 / バリデーション） |
| 新規 | `docs/30-workflows/runbooks/postmortem/template.md` | postmortem markdown template（7 見出し） |
| 新規 | `docs/30-workflows/runbooks/postmortem/README.md` | 運用 runbook（実行手順 / follow-up issue 起票 gh CLI） |
| 編集 | `package.json` | `scripts.postmortem:generate` 追加 |
| 変更なし（S3） | `docs/30-workflows/completed-tasks/09c-.../phase-06.md` | rollback runbook は本タスクで置換しない |
| 変更なし | `apps/api/**` `apps/web/**` | 本タスクは scripts + docs のみ |

## 主要な型・関数シグネチャ（CONST_005）

```ts
// scripts/postmortem/generate-postmortem.ts

export type PostmortemInput = {
  release: string;          // "vX.Y.Z"
  commit: string;           // "[0-9a-f]{7,40}"
  evidencePath: string;     // 09c Phase 11 evidence directory（必須・実在チェック）
  rollbackEvidencePath: string; // rollback 実施記録 path
  occurredAt: string;       // ISO8601（S4: 冪等性のため明示入力）
  detectedAt?: string;
  resolvedAt?: string;
  severity?: string;
};

export type ValidationResult =
  | { ok: true; input: PostmortemInput }
  | { ok: false; reason: string };

export function validateInput(raw: Record<string, string | undefined>): ValidationResult;
// 副作用なし。release / commit の正規表現チェック、evidencePath の存在確認は別関数。

export function ensureEvidencePathExists(path: string): { ok: boolean; reason?: string };
// 副作用: fs.statSync で実在チェックのみ（read しない）。

export function generatePostmortem(input: PostmortemInput, template: string): string;
// 副作用なし。入力 + template文字列 → markdown 文字列。決定論的。Date.now() を使わない。
export function loadTemplate(): string;
// fs read は CLI/loader 層だけに閉じる。
// blame 表現を含む見出し / placeholder を出力に書き込まない（S1）。

// CLI 層（main 関数）
async function main(argv: string[]): Promise<number>;
// 副作用: stdout / stderr 書き込み、`--out` 指定時のみ fs.writeFileSync。
// exit code: 0 / 1 / 2（Phase 1 終了コード表に従う）。
```

CLI parser は最小依存方針で `node:util` の `parseArgs` を使う（外部依存追加禁止）。

## CLI インタフェース（再掲）

```bash
mise exec -- pnpm postmortem:generate -- \
  --release v0.3.1 \
  --commit abc1234def5 \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence outputs/incident/2026-05-05/rollback.md \
  --occurred-at 2026-05-05T10:00:00Z \
  --out outputs/incident/2026-05-05/postmortem.md
```

`package.json` 追加例:

```json
{
  "scripts": {
    "postmortem:generate": "node --experimental-strip-types scripts/postmortem/generate-postmortem.ts"
  }
}
```

## markdown template の固定見出し構造（S1）

| # | 見出し | 記入主体 | スクリプトが埋める内容 | 人が埋めるプレースホルダ |
| --- | --- | --- | --- | --- |
| 1 | Header（metadata） | スクリプト | release / commit / occurred-at / detected-at / resolved-at / severity / evidence link / rollback evidence link | - |
| 2 | Timeline | 人 | 表のヘッダ行のみ（time / event） | 行の本体 |
| 3 | Impact | 人 | 「Affected scope:」「Affected users:」見出し | 値 |
| 4 | Detection | 人 | 「Signal source:」「First detected at:」見出し | 値 |
| 5 | Response | 人 | 「Action taken:」「Rollback type:」見出し | 値・rollback 種別（worker / pages / D1 / cron） |
| 6 | Root Cause | 人 | 「Technical cause:」（**主語はコード / 構成 / プロセス**。人名禁止） | 値 |
| 7 | Prevention | 人 | 「Monitoring:」「Test:」「Runbook update:」見出し | 値 |
| 8 | Follow-up Issues | 人 | gh CLI スニペット（README から transclusion） | issue title 一覧 |

template.md は markdown ファイル単体で human-readable / git-diffable に保つ。スクリプトはこの template の placeholder（例: `{{release}}`、`{{commit}}`）を入力で置換する単純な文字列置換でよい（テンプレートエンジン依存追加なし）。見出し数は metadata Header + core 7 sections として数える。

## 入出力契約と副作用（CONST_005）

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `validateInput` | `Record<string, string \| undefined>` | `ValidationResult` | なし |
| `ensureEvidencePathExists` | path | `{ ok, reason? }` | `fs.statSync` のみ |
| `generatePostmortem` | `PostmortemInput` | markdown 文字列 | なし（pure） |
| `main` | argv | exit code | stdout / stderr 書き込み、`--out` 指定時のみ `fs.writeFileSync` |

外部 API 呼び出し（Slack / GitHub / Cloudflare）は**行わない**（S3）。follow-up issue の `gh issue create` は runbook README に手順として書くのみで、スクリプトからは叩かない。

## 09c Phase 11 evidence path の必須化（S2）

`ensureEvidencePathExists` は以下を確認する:

1. `--evidence` 引数が undefined なら exit 1。
2. path が `fs.statSync` で `ENOENT` なら exit 1（`stderr: "evidence path not found: <path>"`）。
3. path が directory であることを確認（file 不可）。
4. ディレクトリ内に `main.md` が存在することを確認（09c Phase 11 の標準成果物）。なければ exit 1。

これにより「evidence link が空 / 壊れた postmortem」を構造的に防ぐ。

## follow-up issue 作成ルール（runbook README に記載）

```bash
# 1. postmortem 生成
mise exec -- pnpm postmortem:generate -- --release vX.Y.Z --commit <sha> \
  --evidence <evidence-dir> --rollback-evidence <rollback-md> \
  --occurred-at <iso8601> --out outputs/incident/<date>/postmortem.md

# 2. postmortem の "Prevention" / "Follow-up Issues" セクションを人が記入

# 3. follow-up issue 起票（per item）
gh issue create \
  --title "[postmortem-followup] <概要>" \
  --label "type:operations,priority:medium" \
  --body "$(cat <<'EOF'
## 背景
postmortem: <relative path to postmortem.md>

## 期待
<再発防止策の概要>

## 受入条件
- [ ] <該当の Prevention 項目>
EOF
)"
```

ルール:

- 1 postmortem あたり 1 つ以上の follow-up issue を起票する（Prevention セクションが空なら postmortem 自体が未完）。
- issue title prefix は `[postmortem-followup]` で統一。
- postmortem.md への relative path を必ず body に含める（trail 確保）。
- `--label` には `type:operations` を必須付与。

## テスト方針（CONST_005）

| レベル | 追加ファイル | ケース |
| --- | --- | --- |
| unit | `scripts/postmortem/__tests__/generate-postmortem.test.ts` | `generatePostmortem` 同一入力 → 同一出力（冪等性） |
| unit | 同上 | template の 7 見出しが順序通り含まれる |
| unit | 同上 | `validateInput` release 不正 / commit 不正 / 必須欠落で `ok:false` |
| unit | 同上 | `ensureEvidencePathExists` 不在 path で `ok:false` |
| unit | 同上 | 出力 markdown に blame 候補語（`/who is responsible/i` `/blame/i` `/fault/i` `/責任/i`）が含まれない（regex assert） |
| integration / smoke | Phase 11 で手動 1 件 | 実 09c Phase 11 evidence path で CLI 実行 → exit 0 + markdown 生成確認 |

## ローカル実行・検証コマンド（CONST_005）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/postmortem
mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md \
  --occurred-at 2026-05-05T00:00:00Z
```

## DoD（Phase 2 設計）

- [ ] 変更ファイル一覧と種別が確定（scripts 1 / template 1 / README 1 / package.json 編集 1 / test 1）
- [ ] 関数シグネチャがコード化レベルで確定（`generatePostmortem` は pure）
- [ ] template の 7 見出しと placeholder が確定
- [ ] 09c Phase 11 evidence path 必須化（S2）が `ensureEvidencePathExists` で構造化
- [ ] follow-up issue 作成ルールが gh CLI スニペットで明文化
- [ ] CONST_005 必須項目が埋まっている

## 多角的チェック観点

- S1 blame 排除: template に「責任」「blame」「fault」見出しを追加していないか。スクリプトの placeholder 名にも入れない。
- S2 evidence 必須: `ensureEvidencePathExists` が `--evidence` の不在を exit 1 で拒否しているか。
- S3 runbook 責務分離: 既存 09c Phase 6 runbook 本文 / incident response runbook 本文を編集していないか（変更ファイル一覧に存在しないこと）。
- S4 冪等性: `Date.now()` / `Math.random()` / `process.env.HOSTNAME` 等の非決定要素を `generatePostmortem` で使っていないか。
- S5 pnpm 統合: `package.json` の scripts に `postmortem:generate` が追加され、`tsx` 経由で叩けるか（既存 `tsx` 依存の存在確認は Phase 5 で行う）。

## サブタスク管理

- [ ] スクリプト 2 層構造（pure / CLI）を図解
- [ ] template.md placeholder 一覧を確定
- [ ] runbook README の章立てを確定
- [ ] follow-up issue gh CLI スニペットを確定
- [ ] `outputs/phase-02/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| 設計書 | `outputs/phase-02/main.md` |

## 完了条件

- [ ] CONST_005 必須項目が全て揃っている
- [ ] 苦戦箇所 S1 / S2 / S3 / S4 / S5 が設計に反映されている
- [ ] 外部 API 呼び出しを `generatePostmortem` から排除している
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装コードを書いていない
- [ ] commit / push / PR を実行していない
- [ ] 09c の本文（phase-06.md / runbook 等）を編集していない

## 次 Phase への引き渡し

Phase 3 へ、設計書、CONST_005 表、苦戦箇所 S1-S5 反映確認用の checklist、grep gate 候補語リスト（blame 候補）を渡す。
