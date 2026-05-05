# Phase 8: DRY 化 — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 8 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

env 契約の確定に伴って発生しがちな多重記述（spec docs / aiworkflow refs / runbook / 実装 / Phase docs）を整理し、Single Source of Truth (SSOT) と参照経路を確定する。本 Phase は DRY 化方針の文書化のみで、実装・置換は Phase 12 / 別タスクで実施する。

## 重複候補の棚卸し

| 重複箇所 | 内容 | 現状 | DRY 化方針 |
| --- | --- | --- | --- |
| D-1 | env 名定数 | `apps/api/src/index.ts` Env interface, `apps/api/src/routes/auth/index.ts` AuthRouteEnv, `wrangler.toml [vars]`, spec docs, aiworkflow refs に env 名文字列が個別記述 | 別タスクで `apps/api/src/env.ts` 等の type-safe binding helper に集約（後述） |
| D-2 | secret 投入手順 | `deployment-secrets-management.md` (UT-25 / UT-27), Phase 5 runbook, `docs/00-getting-started-manual/specs/08-free-database.md` で類似手順が分散 | `deployment-secrets-management.md` を SSOT、他は link 参照に統一 |
| D-3 | env 名対応表 | Phase 1, Phase 2, Phase 5 で複数回登場 | Phase 2「仕様語 ↔ 実装語対応表」を SSOT、他 Phase は要約 + link |
| D-4 | fail-closed 仕様 | Phase 2 (環境別表), Phase 6 (E-1 詳細) で重複 | Phase 6 E-1 を実装観点 SSOT、Phase 2 は方針宣言、Phase 6 を参照 |
| D-5 | approval gate リスト | Phase 1, Phase 5, Phase 7 で重複 | Phase 7「approval gate 集約」を SSOT、他 Phase は項目数のみ参照 |
| D-6 | rg コマンド | Phase 4 (L3), Phase 5 (Step 5), Phase 6 (E-10) | Phase 4 L3 を SSOT、他 Phase は cross-reference |
| D-7 | CLI ラッパー使用ルール | CLAUDE.md, Phase 5 で重複 | CLAUDE.md を SSOT、Phase 5 は要約 + link |
| D-8 | 1Password vault path 命名規則 | Phase 2 同期マッピング表, Phase 5 Step 1 | Phase 5 Step 1 を SSOT、Phase 2 は要約 |

## D-1: env 名定数の集中管理（実装委譲）

### 提案（実装は別タスク）

`apps/api/src/env.ts`（仮）に type-safe binding helper を追加:

```ts
// 型と key の SSOT を 1 ファイルに集約する想定（実装は別タスク）
export const ENV_KEYS = {
  MAIL_PROVIDER_KEY: "MAIL_PROVIDER_KEY",
  MAIL_FROM_ADDRESS: "MAIL_FROM_ADDRESS",
  AUTH_URL: "AUTH_URL",
  AUTH_SECRET: "AUTH_SECRET",
} as const;

export type EnvKey = keyof typeof ENV_KEYS;
```

- Env interface はこの型から派生（`type Env = Record<EnvKey, string | undefined>` のような形）
- `wrangler.toml` との整合は L2 契約テスト（Phase 4）で検証

### 本タスクでの取り扱い

- 実装は別タスクへ委譲
- 本 Phase では「env 名定数 SSOT を 1 ファイルに集約する」という方針記述に留める
- 委譲先タスク作成は Phase 12 / 13 の段階で別 follow-up として登録

## D-2: secret 投入手順の SSOT 化

### SSOT: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

- UT-25 / UT-27 の節に `MAIL_PROVIDER_KEY` を追記（Phase 12 で実施）
- Phase 5 Step 4 の手順は SSOT への link 参照に短縮（具体例のみ Phase 5 に残す）
- `docs/00-getting-started-manual/specs/08-free-database.md` は配置先表のみ保持し、投入手順は SSOT へ link

### 効果

- 投入手順の更新（CLI 仕様変更等）が SSOT 1 箇所で完結
- 手順記述の drift（同じ操作が異なる順序で書かれる）を防止

## D-3 / D-4 / D-5: Phase 間 cross-reference

| 項目 | SSOT Phase | 他 Phase の記述方針 |
| --- | --- | --- |
| 仕様語 ↔ 実装語対応表 (D-3) | Phase 2 | Phase 1 / 5 では「Phase 2 § '仕様語 ↔ 実装語対応表' 参照」と link |
| fail-closed 仕様 (D-4) | Phase 6 E-1 | Phase 2 / 5 / 7 は方針宣言 + link |
| approval gate (D-5) | Phase 7 集約表 | Phase 1 / 5 は項目数のみ + link |

### Phase docs における cross-reference の書き方

```md
詳細は [phase-02.md § 仕様語 ↔ 実装語対応表](./phase-02.md#仕様語--実装語-対応表) を参照。
```

- 同一タスク内 Phase 間は relative link
- 外部仕様 (specs / aiworkflow) は absolute path で link

## D-6: rg コマンドの SSOT 化

### SSOT: Phase 4 § "L3: doc grep test"

- Phase 5 Step 5 / Phase 6 E-10 では同 rg コマンドを再掲せず Phase 4 を link
- 例外マーカー (`<!-- doc-grep-allow: legacy-name -->`) の仕様も Phase 4 に集約

## D-7: CLI ラッパー使用ルール

### SSOT: `CLAUDE.md` § "Cloudflare 系 CLI 実行ルール"

- Phase 5 「CLI ラッパー使用ルール再確認」節は CLAUDE.md への link + 本タスク固有の禁止事項のみ抜粋
- aiworkflow refs / 他 Phase docs では re-statement しない

## D-8: 1Password vault path 命名規則

### SSOT: Phase 5 Step 1

- Phase 2 同期マッピング表は具体例のみ保持（命名規則は Phase 5 § "Step 1: 1Password Vault path 命名規則" を link）

## DRY 化の優先順位

| 順位 | 項目 | 適用タイミング |
| --- | --- | --- |
| 1 | D-2 (secret 投入手順 SSOT) | Phase 12 docs 更新時 |
| 2 | D-3〜D-5 (Phase 間 cross-reference) | Phase 9 QA 時の最終整合確認時 |
| 3 | D-6〜D-8 (個別 SSOT 化) | Phase 12 docs 更新時 |
| 4 | D-1 (env 名定数 helper) | 別タスク（実装委譲先）で対応 |

## DRY 化が崩れる兆候の検知

| 兆候 | 検知方法 |
| --- | --- |
| spec docs / aiworkflow / runbook で env 名表記が分岐 | Phase 4 L3 grep を逆方向にも適用（`MAIL_PROVIDER_KEY` 出現箇所が SSOT 以外で同義反復していないか） |
| 同じ rg コマンドが複数 Phase に書かれる | Phase 9 QA で grep + diff で検出 |
| approval gate リストが Phase 間で件数不一致 | Phase 9 QA で件数比較 |

検知後の対応: 該当箇所を SSOT への link に置換、または SSOT 側を更新して整合させる。

## DRY 化と #16 (secret values never documented) の関係

- DRY 化で記述箇所を集約することは、secret 実値が万一書かれた場合の影響範囲を狭める効果も持つ
- SSOT 経路で secret 実値が含まれていないかを Phase 9 / Phase 10 で重点 review する

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: 重複候補 D-1〜D-8 が確定する。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: 各重複箇所に SSOT が割り当てられる。
3. user approval または上流 gate が必要な操作を分離する。完了条件: D-1 の実装委譲方針が明記される。
4. DRY 化の優先順位と適用タイミングを Phase 12 / 別タスクに紐付ける。完了条件: 4 段階の優先順位表が確定する。

## 参照資料

- docs/30-workflows/05b-A-auth-mail-env-contract-alignment/phase-01.md 〜 phase-07.md
- docs/00-getting-started-manual/specs/10-notification-auth.md
- docs/00-getting-started-manual/specs/08-free-database.md
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
- CLAUDE.md（CLI ラッパー / `.env` 運用ルール SSOT）
- apps/api/src/index.ts（Env interface — D-1 集中管理の対象）

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- D-1 (env.ts helper) の実装は別タスクへ委譲する。本 Phase では方針記述のみ。
- D-2〜D-8 の Markdown 適用は Phase 12 で実施。

## 統合テスト連携

- 上流: 05b Magic Link provider 本体, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-B Magic Link callback follow-up（D-1 helper を共有）, 09a staging auth smoke, 09c production deploy readiness

## 多角的チェック観点

- #16 secret values never documented: SSOT に集約することで実値混入の検査範囲を縮小する
- #15 Auth session boundary: D-1 helper は `AUTH_SECRET` を含むが値は扱わない（key 名定数のみ）
- #14 Cloudflare free-tier: DRY 化で新規 binding を作らず既存 env 名の整理に留める
- 未実装 / 未実測を PASS と扱わない: 方針記述のみで AC を満たしたとみなさない
- プロトタイプと仕様書の採用 / 不採用を混同しない: GAS prototype の env 名定義を D-1 helper の参照元にしない

## サブタスク管理

- [ ] refs を確認する
- [ ] 重複候補 D-1〜D-8 を棚卸しする
- [ ] 各重複箇所に SSOT を割り当てる
- [ ] D-1 (env.ts helper) の実装委譲方針を記述する
- [ ] DRY 化崩れの兆候検知方法を記述する
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md（重複候補 D-1〜D-8 / SSOT 割り当て / 優先順位 / 兆候検知 / D-1 委譲方針）

## 完了条件

- env 名の正本が1つに統一される（D-1 SSOT 方針 + D-3 SSOT 化）
- Cloudflare/1Password/runbook の配置先が一致する（D-2 SSOT 化）
- production で未設定時 fail-closed の仕様が明記される（D-4 SSOT 化）
- staging smoke で Magic Link メール送信設定を確認できる（D-6 rg / D-7 CLI ルールの SSOT 化）
- secret 実値が repo/evidence に残らない（DRY 化と #16 の関係を明記）

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 9（品質保証）へ次を渡す:

- 重複候補 D-1〜D-8 と SSOT 割り当て
- DRY 化崩れの兆候検知方法（grep / 件数比較）
- D-1 (env.ts helper) の実装委譲方針
- D-2〜D-8 の Phase 12 適用優先順位
