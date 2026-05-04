# Phase 8: DRY 化 — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 8 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec) |

## 目的

`scripts/cf.sh` と `scripts/with-env.sh` の三段ラップ構造、および本タスクの「op → mise → wrangler の SOP 切り分け」が、他の Cloudflare CLI 系タスク（deploy / d1 / tail 等）でも再利用可能な単一正本になっているかを検証する。重複している SOP / 構造を抽出可能か検討し、本サイクル内での実抽出可否を Phase 10 final review で判断する（CONST_007 — 今回サイクルで完了させる前提でスコープ判断する）。

## 実行タスク

1. `scripts/cf.sh` のサブコマンド（`whoami` / `d1` / `deploy` / `tail` / `rollback`）が三段ラップを共通化しているかを確認する
2. 本タスクで定義した「Stage 1〜3 切り分け SOP」が他の `bash scripts/cf.sh <cmd>` 失敗時にも流用できる構造になっているかを確認する
3. `wrangler login` 残置検知 SOP が他の Cloudflare 系タスクでも参照可能な形になっているかを確認する
4. 本サイクルで helper / SOP 抽出するか否かの判断材料を Phase 10 final review に渡す

## 参照資料

- scripts/cf.sh（実コード・必要時にのみ最小修正）
- scripts/with-env.sh（実コード・必要時にのみ最小修正）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」

## DRY 観点

| 重複候補 | 本タスクでの該当 | 他タスクでの該当（想定） | 対処方針案 |
| --- | --- | --- | --- |
| `op run --env-file=.env` ラップ | `whoami` 経路 | `deploy` / `d1` / `tail` / `rollback` 経路 | 既に `scripts/with-env.sh` に集約されているため抽出済み |
| `mise exec --` ラップ | `whoami` 経路 | 全 Cloudflare CLI 経路 | 既に `scripts/cf.sh` に集約されているため抽出済み |
| `ESBUILD_BINARY_PATH` 解決 | `whoami` 経路 | 全 Cloudflare CLI 経路 | 既に `scripts/cf.sh` に集約されているため抽出済み |
| Stage 1〜3 切り分け SOP | 本タスク Phase 5 / 6 | 他の `bash scripts/cf.sh <cmd>` 失敗時 | 本タスク Phase 12 で SOP として system spec / skill 側に抽出する候補 |
| `wrangler login` 残置検知 SOP | 本タスク Phase 5 / 6 | 全 Cloudflare 系タスク | 本タスク Phase 12 で SOP として skill 側に抽出する候補 |
| redaction checklist（token 非露出） | 本タスク Phase 7 | 全 Cloudflare 系タスク | 本タスク Phase 12 で skill 側に抽出する候補（既存テンプレと整合 |

## SOP 抽出案

### 共通 SOP: `cf.sh-failure-stage-isolation.md`（仮）

```
[Stage 1: 1Password]
  op whoami / op item list で signin / item アクセスを確認
[Stage 2: mise]
  mise current / mise exec -- which <bin> でバイナリ解決を確認
[Stage 3: wrangler]
  bash scripts/cf.sh <cmd> の最終 exit code で判定
```

抽出時の利用イメージ:

- `whoami` 復旧: 本タスク
- `deploy` 失敗: 同 SOP を deploy のサブコマンド向けに流用
- `d1 export` 失敗: 同 SOP を d1 サブコマンド向けに流用
- `tail` 接続不能: 同 SOP を tail サブコマンド向けに流用

### 共通 SOP: `wrangler-login-residue-check.md`（仮）

`~/Library/Preferences/.wrangler/config/default.toml` の存在確認 / 除去手順を全 Cloudflare 系タスクで共有する。

## 抽出時の影響範囲

- skill 側（task-specification-creator / aiworkflow-requirements）: SOP テンプレに追加。対象となる Cloudflare 系タスクのフェーズ 5 / 6 で参照可能になる
- 既存 Cloudflare 系タスク: 既存仕様書には影響しないが、後続タスクでは SOP を直接参照することで重複記述を減らせる

## スコープ判断（Phase 10 final review に渡す材料）

| 判断軸 | 抽出する側へ寄せる材料 | 抽出しない側へ寄せる材料 |
| --- | --- | --- |
| 安全性 | SOP を 1 箇所で固定でき、Cloudflare 認証復旧の重複記述が減る | 本タスクは whoami 復旧スコープに限定。他の cf.sh サブコマンド失敗系を抽出スコープに含めると CONST_007 違反になる |
| スコープ | 本タスクの Phase 12 で skill feedback として promote する程度に留める | 共通 SOP の正本は Phase 12 promote のみで完結。新規 helper 抽出は不要 |
| Phase 11 evidence 整合 | SOP 抽出後も本タスクの evidence path / Layer 構造は不変 | 既存 SOP のままで AC PASS が取れる |

> 結論案: 本タスクサイクル内では `scripts/cf.sh` / `scripts/with-env.sh` の既存実装をそのまま正本とし、Stage 1〜3 切り分け / `wrangler login` 残置検知 / redaction checklist は **Phase 12 skill feedback として promote** する範囲で完結する。新規 shell helper の抽出は本タスクスコープ外とする（CONST_007 に従い、本サイクルでスコープ確定する）。

## 多角的チェック観点

- DRY 化により仕様の正本が `scripts/cf.sh` / `scripts/with-env.sh` に集約されていることを確認
- skill 側 SOP テンプレ追加時に既存 Cloudflare 系仕様書と矛盾しないこと
- 本タスクスコープ（whoami 復旧）を超えた helper 抽出を行わないこと

## 統合テスト連携

skill feedback として promote する場合は、Phase 12 `skill-feedback-report.md` に SOP 追加差分と他タスクへの影響を記載する。promote しない場合も、本タスクの SOP が他 Cloudflare 系タスクで自然参照できる構造であることを記録する。

## サブタスク管理

- [ ] 重複箇所を一覧化
- [ ] 共通 SOP 案（Stage isolation / wrangler login residue / redaction）を確定
- [ ] スコープ判断材料を Phase 10 final review に渡す
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md

## 完了条件

- 重複箇所が一覧化されている
- 共通 SOP 案が提示されている
- 本サイクルで抽出するか否かの判断材料が Phase 10 final review に渡されている

## タスク100%実行確認

- [ ] 同一仕様を 2 箇所以上に書いていない
- [ ] 既存コード（`scripts/cf.sh` / `scripts/with-env.sh`）を不必要に改変する記述が含まれていない
- [ ] 本タスクスコープ（whoami 復旧）を超えた helper 抽出を含めていない

## 次 Phase への引き渡し

Phase 9 へ、共通 SOP 案とスコープ判断材料を渡す。
