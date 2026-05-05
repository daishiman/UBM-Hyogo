# task-09a-cloudflare-auth-token-injection-recovery-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09a-cloudflare-auth-token-injection-recovery-001 |
| タスク名 | 09a Cloudflare auth token injection recovery |
| 分類 | operations / implementation |
| 対象機能 | Cloudflare staging smoke preflight |
| 優先度 | 高 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/main.md` |
| 発見日 | 2026-05-02 |
| 親タスク | `docs/30-workflows/ut-09a-exec-staging-smoke-001/` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 1. なぜこのタスクが必要か（Why）

`ut-09a-exec-staging-smoke-001` の Phase 11 で `bash scripts/cf.sh whoami` を実行したところ
`You are not authenticated` となり、staging deploy smoke、wrangler tail、Forms sync、
Playwright screenshot の実行が全て停止した。

この状態を放置すると、09a staging evidence が PASS に置換できず、09c production deploy gate
も継続して blocked になる。

## 2. 何を達成するか（What）

1Password / `.env` / Cloudflare API Token の注入経路を復旧し、`bash scripts/cf.sh whoami`
が staging 操作対象の Cloudflare account で PASS する状態に戻す。

## 3. どのように実行するか（How）

secret 値は記録せず、存在確認とコマンド結果だけを evidence 化する。Cloudflare CLI は直接
`wrangler` ではなく、既存正本どおり `bash scripts/cf.sh` 経由で扱う。

## 4. 実行手順

1. `op signin` 済みであることを確認する。
2. `.env` の op 参照が指す Cloudflare API Token item が 1Password に存在することを確認する。
3. token が staging Workers / Pages / D1 操作に必要な権限を持つことを確認する。
4. `bash scripts/cf.sh whoami` を実行し、account identity を secret なしで evidence 化する。
5. 復旧後、`ut-09a-exec-staging-smoke-001` Phase 11 の再実行へ引き渡す。

## 5. 完了条件チェックリスト

- [ ] secret 値を stdout / artifact に出していない
- [ ] `bash scripts/cf.sh whoami` が exit 0
- [ ] staging 操作対象 account が確認できる
- [ ] 復旧 evidence path が `ut-09a-exec-staging-smoke-001` に引き渡されている

## 6. 検証方法

```bash
bash scripts/cf.sh whoami
```

期待: `You are not authenticated` ではなく Cloudflare account identity が返る。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| secret 値の漏洩 | 値を読まず、存在確認と exit code のみ記録する |
| token 権限不足 | staging Workers / D1 / Pages 操作権限を明示確認する |
| 直接 `wrangler` 実行による手順 drift | `bash scripts/cf.sh` に統一する |

## 8. 苦戦箇所（将来の課題解決のための知見）

| 苦戦箇所 | 詳細 | 将来への示唆 |
| --- | --- | --- |
| 認証経路の三段ラップ | `op run --env-file=.env` → `mise exec --` → `wrangler` の三段ラップを経由するため、どの段で token 注入が落ちたか切り分けが難しい | `scripts/cf.sh whoami` 単体で exit code を見るだけでは原因層が判別できない。`OP_DEBUG=1` 等で 1Password 側、次に env 変数到達確認、最後に wrangler 認証確認という階層的切り分けを SOP 化する |
| secret 値を覗かずに復旧確認する制約 | CLAUDE.md の禁止事項により `.env` を `cat` / `Read` できないため、復旧確認は exit code と account identity 出力に限定される | `whoami` の標準出力のみを evidence 化し、token 値は決して artifact に書かない原則を runbook に明記する |
| `wrangler login` を併用すると `.env` 経路が無効化される | ローカル OAuth トークンが `.env` の op 参照より優先される事故が起きやすい | `wrangler login` を禁止し、op 参照に一本化する旨を CLAUDE.md と本タスクの再発防止項目で重複明示する |
| 09c blocker の維持判断 | staging 復旧失敗時に「09c を blocked のまま据え置く」判断を技術ではなく governance として保持する必要がある | `task-workflow-active.md` の 09c gate 表現を「09a staging PASS が evidence path で参照可能になるまで GO に上げない」と明文化する |

## 9. 参照情報

- `docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/main.md`
- `docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/wrangler-tail.log`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

