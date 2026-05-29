# Phase 12: DoD・受け入れ基準

## 12.1 中学生レベル概念説明

このタスクは「ログインの修理」をする作業です。

「会員サイト」では、Google Form というアンケートに答えて会員になる仕組みがあります。会員のメールアドレスはデータベースに2つの場所に保存されます:

1. **「アンケート回答」表（member_responses）**: アンケートに答えるとここに記録される
2. **「会員リスト」表（member_identities）**: ログインの時に「あなたは会員ですか?」を確認するための名簿

普通は両方に同時に記録されますが、まれに **「アンケートには答えたのに、会員リストに名前が載っていない」** という不一致が起きます。すると、その人は本人なのにログインできず、自分のページ（マイページ）が見られなくなります。これが H2 という問題です。

今回のタスクは:

- **修理①: 過去の不一致を一括修正**(backfill migration) — 「アンケート回答」表を見て、会員リストに足りない名前を追加する
- **修理②: 今後の不一致を防止**(auto-link) — ログイン時に名前が見つからなくても、アンケート回答があれば自動で会員リストに追加する仕組みを入れる

これによって、本人なのにログインできない事故をなくします。

## 12.2 機能要件 DoD

- [ ] DoD-F-01: staging で migration 適用後、bridge-backed H2 sample の `H2_identityMissing === false`
- [ ] DoD-F-02: production で同上、bridge-backed H2 sample の `H2_identityMissing === false`
- [ ] DoD-F-03: bridge 無し orphan が残る場合、現行 schema では email 対応が無いことを evidence に記録し、auto-link 経路で verified email sign-in を救済できる
- [ ] DoD-F-04: migration 0021 を 2 回連続適用で差分 0
- [ ] DoD-F-05: 既存 member_identities row（test fixture B-01f）が auto-link / backfill で改変されない
- [ ] DoD-F-06: `apps/web` 側のコード変更なしで sign-in flow が成立する

## 12.3 品質要件 DoD

- [ ] DoD-Q-01: `pnpm typecheck` green
- [ ] DoD-Q-02: `pnpm lint` green
- [ ] DoD-Q-03: `pnpm --filter @ubm-hyogo/api test` で B-01a〜g / B-02a〜e / B-03a〜b 全 green
- [ ] DoD-Q-04: 新規テストカバレッジが既存 lane の baseline を下回らない
- [ ] DoD-Q-05: production 投入前に staging Gate-B（Phase 10 / 11）通過済

## 12.4 ドキュメント DoD

- [ ] DoD-D-01: `docs/00-getting-started-manual/specs/02-auth.md` に auto-link 仕様を追記
- [ ] DoD-D-02: PR 本文に Phase 11 evidence のパスを明記
- [ ] DoD-D-03: 親 workflow（`completed-tasks/google-form-reflection-diagnostics/`）の README / Phase 12 detection から本 followup の完了を相互リンク

## 12.5 受け入れ責任者

solo dev 運用のため自己承認。Gate-A〜C の各段階で本 phase-12.md のチェックボックスを埋めること。
