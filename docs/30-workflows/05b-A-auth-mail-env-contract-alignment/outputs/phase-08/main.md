# Output Phase 8: DRY 化

## 重複候補と SSOT 割り当て

| # | 重複箇所 | SSOT |
| --- | --- | --- |
| D-1 | env 名定数（Env interface / AuthRouteEnv / `wrangler.toml [vars]` / spec / aiworkflow） | 別タスクで `apps/api/src/env.ts` 等に集約（実装委譲） |
| D-2 | secret 投入手順 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（UT-25 / UT-27） |
| D-3 | env 名対応表 | Phase 2 § "仕様語 ↔ 実装語対応表" |
| D-4 | fail-closed 仕様 | Phase 6 E-1（実装観点）。Phase 2 は方針宣言 |
| D-5 | approval gate リスト | Phase 7 § "approval gate 集約" |
| D-6 | rg コマンド | Phase 4 § "L3: doc grep test" |
| D-7 | CLI ラッパー使用ルール | `CLAUDE.md` § "Cloudflare 系 CLI 実行ルール" |
| D-8 | 1Password vault path 命名 | Phase 5 Step 1 |

## D-1: env 名定数の集中管理（実装委譲）

提案（実装は別タスク）:

```ts
// apps/api/src/env.ts (仮)
export const ENV_KEYS = {
  MAIL_PROVIDER_KEY: "MAIL_PROVIDER_KEY",
  MAIL_FROM_ADDRESS: "MAIL_FROM_ADDRESS",
  AUTH_URL: "AUTH_URL",
  AUTH_SECRET: "AUTH_SECRET",
} as const;

export type EnvKey = keyof typeof ENV_KEYS;
```

Env interface はこの型から派生。`wrangler.toml` との整合は L2 契約テストで検証。本タスクでは方針記述のみ、Phase 12 / 13 で別 follow-up として登録。

## D-2: secret 投入手順 SSOT 化

- `deployment-secrets-management.md` UT-25 / UT-27 節に `MAIL_PROVIDER_KEY` を Phase 12 で追記
- Phase 5 Step 4 は SSOT への link + 具体例のみ短縮
- `08-free-database.md` は配置先表のみ保持し手順は SSOT へ link

## D-3 / D-4 / D-5: Phase 間 cross-reference

| 項目 | SSOT | 他 Phase の方針 |
| --- | --- | --- |
| 仕様語 ↔ 実装語対応表 (D-3) | Phase 2 | Phase 1 / 5 で link |
| fail-closed 仕様 (D-4) | Phase 6 E-1 | Phase 2 / 5 / 7 は方針宣言 + link |
| approval gate (D-5) | Phase 7 集約表 | Phase 1 / 5 は項目数 + link |

書き方: 同一タスク内 Phase 間 = relative link（`[phase-02.md § ...](./phase-02.md#...)`）、外部仕様 = absolute path。

## D-6 / D-7 / D-8

- D-6: Phase 5 Step 5 / Phase 6 E-10 は再掲せず Phase 4 を link。例外マーカー仕様も Phase 4 集約
- D-7: Phase 5「CLI ラッパー使用ルール再確認」は CLAUDE.md link + 本タスク固有禁止事項のみ
- D-8: Phase 2 同期マッピング表は具体例のみ、命名規則は Phase 5 Step 1 link

## DRY 化優先順位

| 順位 | 項目 | タイミング |
| --- | --- | --- |
| 1 | D-2 | Phase 12 docs 更新 |
| 2 | D-3〜D-5 | Phase 9 QA 時の最終整合確認 |
| 3 | D-6〜D-8 | Phase 12 docs 更新 |
| 4 | D-1 | 別タスク（実装委譲先） |

## 兆候検知

| 兆候 | 検知 |
| --- | --- |
| spec / aiworkflow / runbook で env 名表記分岐 | Phase 4 L3 grep を逆方向適用（正本名の同義反復検出） |
| 同 rg が複数 Phase に書かれる | Phase 9 QA で grep + diff |
| approval gate 件数が Phase 間で不一致 | Phase 9 QA で件数比較 |

検知後: SSOT への link 置換、または SSOT 側を更新して整合させる。

## #16 との関係

DRY 化 = secret 実値が万一書かれた場合の影響範囲縮小。SSOT 経路で実値含有を Phase 9 / 10 で重点 review。

## 次 Phase への引き渡し

- D-1〜D-8 と SSOT 割り当て
- 兆候検知方法（grep / 件数比較）
- D-1 実装委譲方針
- D-2〜D-8 の Phase 12 適用優先順位
