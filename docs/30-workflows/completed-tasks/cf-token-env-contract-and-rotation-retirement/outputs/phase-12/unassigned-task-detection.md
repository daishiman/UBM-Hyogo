# 未タスク検出 — cf-token-env-contract-and-rotation-retirement

本ファイルは 0 件でも出力必須。`current`（今サイクルで起票すべき未タスク）と `baseline`（将来候補・非起票）を分離する。

## current

**1 件**（2回目検証で補完 — 当初 0 件判定から是正）。

| # | 未タスク | issue | 起票理由 |
| - | -------- | ----- | -------- |
| C-1 | rotation 撤廃に伴う open issue #524（Slack 通知統合）の CF rotation reminder 通知統合行の撤廃整合 | #1175 | 本タスクで `cf-token-rotation-reminder.yml` を**削除**したことにより、open issue #524 の通知統合対象 3 件中 1 行目（CF rotation reminder → Slack 投稿）が**実装不能**になる。これは投機的将来候補ではなく削除という**確定した帰結**であり、#524 のスコープ整合は別タスクとして起票が必要。仕様書: `docs/30-workflows/unassigned-task/cf-token-env-contract-and-rotation-retirement-followup-001-issue-524-rotation-notify-retirement.md` |

判定根拠（本タスク自身の実装スコープは 1 サイクル内で完結。C-1 は削除の**外部副作用**であり別 issue が正）:

- A1（provision 追加）/ A2（degrade）/ A3-A5（drift gate）/ B1-B4（rotation 撤廃 + runbook）はすべて本仕様書の実装スコープに含まれ、別タスクへ切り出す残件はない。
- AC-1〜AC-8 はすべて本仕様の検証設計（phase-11 evidence ledger）でカバー済。未割当の AC・宙に浮いた要件はない。
- TODO / FIXME / skip 由来の追加タスクなし（本タスクで生成するコードは spec のみ・skip マーカーを残さない設計）。
- **C-1 の発見経緯**: 1回目の検出は「自タスクの責務範囲」で current 0 件と判定したが、`cf-token-rotation-reminder.yml` の削除が **open issue #524 を参照無効化する副作用**を見落としていた。2回目の独立検証（`gh issue list --state open --search "cf-token-rotation-reminder"`）でこれを検出し、current C-1 として起票（#1175）した。教訓: workflow/script を**削除**するタスクでは「関連タスク差分確認」で削除ファイル名を open issue へ逆引きする。

## baseline（将来候補・非起票）

| # | 候補 | 非起票理由 | 実施時期 / 場所 |
| - | ---- | ---------- | --------------- |
| B-1 | drift gate（`verify-runtime-smoke-secret-contract`）を dev/main の required status check に登録 | branch protection 変更は CLAUDE.md ブランチ戦略で **user 承認必須**（gating）。さらに `pull_request.paths` フィルタの footgun（非該当 PR で永久 pending・memory issue-1146 教訓）への対処（paths 除去 = 常時実行化）を伴うため、本サイクルでは非起票。CONST_007 の「先送り」ではなく user-gated ガバナンス変更ゆえの分離 | 実装サイクル完了後・user 承認時に branch protection（`gh api -X PUT repos/.../branches/{dev,main}/protection`）で実施 |
| B-2 | 他 environment（`production-runtime-smoke` 等）へ同種 secret-contract gate を横展開 | 現時点で赤になっている environment は `staging-runtime-smoke` のみ。production 側の provision 正本に同型ギャップが顕在化していないため YAGNI。横展開は drift gate の汎用化（consumed/provisioned path のパラメータ化）を伴う設計判断が必要 | production 側で同型ギャップが顕在化した時点で別タスク化。場所 = `scripts/smoke/verify-runtime-smoke-secret-contract.mts` の汎用化 + 新 gate yml |
| B-3 | 1Password `CLOUDFLARE_API_TOKEN_STAGING_RUNTIME_SMOKE` item の作成自動化 | item 作成は手動オペレーション（CF dashboard でのトークン発行 → 1Password 保管）であり、自動化は秘密情報の取り回し設計を要する。MVP / solo 運用では手順を runbook（B2）に明文化する方が安全・コスト効率が良いため非起票 | 手動オペレーション頻度が増えた場合に別タスク化。場所 = runbook 手順 + `op` CLI スクリプト化 |

各 baseline は「非起票理由」と「実施時期 / 場所」を明示し、本サイクルでの起票対象外であることを確定する。

## 関連タスク差分確認（FB-CANCEL-004-2）

既存 workflow との重複なしを確認する。

| 既存タスク | 重複有無 | 差分 |
| ---------- | -------- | ---- |
| `staging-mint-bearer-env-contract-guard`（`verify-mint-env-contract.mts` / `.yml`） | **重複なし** | mint env 契約 gate は「mint step が要求する env が role 単位で provision されているか」を検査する**別責務**。本タスクの `verify-runtime-smoke-secret-contract` は「workflow が消費する**全 secret** が provision 正本に登録されているか」を検査する。前者は本タスクで **無変更（AC-7）**。drift gate は雛形（`verify-mint-env-contract.yml`）を再利用するが、責務が異なるため別ファイルで実装し、既存 verifier を改変しない |
| `issue-1081-bulk-tag-real-d1-runtime-smoke`（親） | **重複なし** | 親は bulk-tag runtime smoke の **導入**。本タスクはその smoke を赤にしていた provision ギャップの**恒久解消**。additive で親仕様を変更しない |
| **open issue #524**（ops: Slack 通知統合） | **依存あり（C-1 として起票）** | #524 は CF rotation reminder workflow を含む 3 件の Slack 通知統合 issue。本タスクの `cf-token-rotation-reminder.yml` 削除により #524 の 1 行目が陳腐化する。重複ではないが**削除の副作用で #524 のスコープ整合が必要**になるため、current C-1（#1175）として起票し依存を追跡する |

> 既存の env 契約 gate（mint）と本タスクの secret 契約 gate（全 secret）は責務が直交し、両者を別ファイルで分離するため重複起票は不要。
> open issue #524 との関係は重複ではなく**削除の副作用**であり、#1175（C-1）で別途整合する。
