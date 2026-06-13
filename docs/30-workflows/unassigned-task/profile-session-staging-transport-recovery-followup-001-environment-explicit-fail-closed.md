# profile-session-staging-transport-recovery followup 001 / ENVIRONMENT 未注入時 localhost fallback の fail-closed 化 - タスク指示書

## メタ情報

```yaml
issue_number: 1234
status: 未着手
```

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | profile-session-staging-transport-recovery-followup-001-environment-explicit-fail-closed |
| タスク名     | ENVIRONMENT 未注入時 localhost fallback の fail-closed 化（environmentExplicit 方式の統合完遂） |
| 分類         | 不具合是正（仕様-実装ギャップ / fail-closed 回帰） |
| 対象機能     | apps/web transport 解決層（`apps/web/src/lib/env.ts` / `apps/web/src/lib/fetch/transport.ts` / `apps/web/src/lib/fetch/authed.ts`） |
| 優先度       | 中 |
| 見積もり規模 | 小規模 |
| ステータス   | 未着手 |
| GitHub Issue | #1234 |
| 発見元       | `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/` の実装後検証（未タスク作成フロー 2026-06-12 の2回検証） |
| 発見日       | 2026-06-12 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親ワークフロー `profile-session-staging-transport-recovery` は、staging `/profile` の「セッション情報を取得できませんでした」を根治するため、transport 解決層の観測性強化と fail-closed 化を仕様化した。正本仕様は fail-closed を明示的に要求している:

- `_shared-context.md:81`「localhost への fallback は『ENVIRONMENT=local が**明示**されている場合』のみ（T01 の environmentExplicit 方式を維持）」
- AC-4（`_shared-context.md:144`）「非 local 環境で localhost transport に絶対に落ちない（ENVIRONMENT 明示 local のみ localhost fallback。fail-closed 維持）」
- T01 DoD（`outputs/phase-12/implementation-guide.md`）「S2 が fail-closed 化（非 local で localhost に落ちず throw）」

観測性ブランチ原実装（local branch `fix/profile-session-staging-localhost-endpoint`・未マージ）にはこの方式が存在する:

- env.ts: `getEnvironmentResolution(rawEnv): { environment, explicit }`（ENVIRONMENT 未注入時 `{environment:"local", explicit:false}`）
- transport.ts:62: `if ((env.environment ?? "local") === "local" && env.environmentExplicit === true)` のときのみ localhost fallback

### 1.2 問題点・課題

現実装（work branch）は T01 の他成果（`ApiTransportError{transportKind,baseHost}` / `describeTransport` / `server_fetch_failed{transportKind,baseHost}` 構造化ログ / `api_transport_fallback` warn / `auth_env_field_dropped` warn）は統合済で、focused 5 spec 72 tests 全 PASS（実走確認済）だが、**environmentExplicit だけが欠落**している:

- `apps/web/src/lib/env.ts:153-156` の `getEnvironment()` は ENVIRONMENT 未注入（undefined）時に `"local"` へ既定する（explicit 概念なし）
- `apps/web/src/lib/fetch/transport.ts:91-96` の localhost fallback 条件は `env.environment === "local"` のみ
- `apps/web/src/lib/fetch/authed.ts:35` は `environment: getEnvironment()` を渡すのみ

帰結として、ENVIRONMENT 未注入 かつ API_SERVICE / INTERNAL_API_BASE_URL 欠落の縮退構成では、(a) environment が "local" 扱いになり NEXT_PUBLIC_API_BASE_URL が chain に追加されず（staging/production 判定に入らないため）、(b) 空 chain → `http://localhost:8787` へ fail-open fallback → Workers ランタイムで接続 throw となる。これは親ワークフローが根治対象とした S2（`_shared-context.md:55`）がそのまま残存している状態である。fail-closed であれば「API transport unresolved in non-local runtime」throw + `server_fetch_failed` 構造化ログで正しく診断できる。

加えて 2 つの付随ギャップがある:

- テストギャップ: ENVIRONMENT undefined ケースの回帰テストが env.spec / transport.spec / authed.spec のいずれにも存在しない（72 tests 全緑でも本欠落を検出不能だった）
- doc-over-claim: `outputs/phase-12/system-spec-update-summary.md:22` は「fail-closed は T01 の environmentExplicit 方式で強化方向に維持」と実装に無いものを記載しており、`implementation-guide.md:66` も getEnvironmentResolution / environmentExplicit を「取り込まれる変更」として列挙している

### 1.3 放置した場合の影響

- 親ワークフローの正本仕様（AC-4 / T01 DoD）と実装の不一致が固定化し、後続タスクが文書を信じて誤判断する（doc-over-claim の温存）
- ENVIRONMENT 注入が欠落する重大な構成事故時に、明示的な throw + 構造化ログではなく localhost 接続 throw という誤誘導的な失敗になり、診断時間が再び長期化する
- ENVIRONMENT undefined 次元のテストが無いまま transport 層に変更が重なると、fail-open 退行を将来も検出できない

なお実害到達性は限定的である: staging / production の wrangler.toml `[vars]` は ENVIRONMENT を注入するため、発火には env 注入の重大な構成欠落が必要。かつ親ワークフローの T03 fallback chain により binding / baseUrl が 1 つでも生きていれば localhost 分岐に到達しない。よって優先度は中（診断正確性と仕様適合の問題であり、即時のユーザー影響回帰ではない）。

---

## 2. 何を達成するか（What）

### 2.1 目的

親ワークフロー正本仕様の T01 environmentExplicit 方式を現実装へ統合完遂し、ENVIRONMENT 未注入時の localhost fallback を fail-closed 化する。

### 2.2 最終ゴール

- ENVIRONMENT 未注入（undefined）かつ transport 全欠落の縮退構成で、localhost に落ちず「API transport unresolved in non-local runtime」相当の throw + `server_fetch_failed` 構造化ログになる
- ENVIRONMENT=local が明示されている場合のみ localhost fallback が許可される（AC-4 充足）
- ENVIRONMENT undefined ケースの回帰テストが env.spec / transport.spec / authed.spec に追加され、fail-open 退行を検出できる
- focused 5 spec（現状 72 tests + 追加分）/ typecheck / lint が green
- phase-12 文書の over-claim 2 箇所（system-spec-update-summary:22 / implementation-guide:66 周辺）が実装で充足され、記載と実装が整合する

### 2.3 スコープ

#### 含むもの

- `apps/web/src/lib/env.ts` への `getEnvironmentResolution(){environment, explicit}` 追加（または `getEnvironment()` の置換）
- `apps/web/src/lib/fetch/transport.ts` の `ApiTransportEnv` への `environmentExplicit` 追加と localhost fallback 条件の `environment === "local" && environmentExplicit === true` 化
- `apps/web/src/lib/fetch/authed.ts` および他の `getEnvironment()` 呼び出し元（verify-magic-link.ts / app/api/auth/* / app/api/me/[...path]/route.ts / public.ts）の影響確認と必要最小の追従
- ENVIRONMENT undefined 次元の回帰テスト追加（env.spec / transport.spec / authed.spec）
- 親ワークフロー docs の over-claim 2 箇所の記載と実装の整合化（実装で充足させるため文書側は結果的に正となる旨の確認）

#### 含まないもの

- apps/api / D1 schema / Google Form 仕様の変更
- T01 の他成果（ApiTransportError / describeTransport / 構造化ログ群）の再実装・変更（統合済のため）
- T03 fallback chain の順序・構成変更
- commit / push / PR 作成

### 2.4 成果物

- env.ts / transport.ts / authed.ts（+ 影響呼び出し元の最小追従）の実装差分
- ENVIRONMENT undefined 回帰テストを含む spec 更新差分
- focused 5 spec / typecheck / lint green の NON_VISUAL 証跡

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 親ワークフロー `profile-session-staging-transport-recovery` の実装（T01 他成果 + T03 fallback chain）が work branch に統合済であること（focused 5 spec 72 tests PASS 実走確認済）
- 原実装ブランチ `fix/profile-session-staging-localhost-endpoint` がローカルに存在し、`git show <branch>:<path>` で該当 diff を参照できること

### 3.2 依存タスク

- 親: `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/`
- 原実装参照: local branch `fix/profile-session-staging-localhost-endpoint`（未マージ）

### 3.3 必要な知識

- CLAUDE.md「`apps/web` env アクセス不変条件」: env 参照は `env.ts` 公開アクセサ経由のみ・認証境界は fail-closed（invariant #11）優先
- 親ワークフローの transport fallback chain 設計（`_shared-context.md` §3 T01 / T03）と S2 障害シナリオ
- environmentExplicit 方式の原実装: `getEnvironmentResolution(rawEnv)` が `{environment, explicit}` を返し、ENVIRONMENT 未注入時は `{environment:"local", explicit:false}` として localhost fallback を拒否する

### 3.4 推奨アプローチ

原実装ブランチの該当 diff（env.ts の `getEnvironmentResolution` / transport.ts:62 の fallback 条件）を `git show` で取り出し、現実装の構造（`getEnvironment()` 呼び出し面）に合わせて統合する。名前は現実装の慣行に合わせてよいが、「未注入は explicit=false → localhost fallback 拒否」という意味論を等価維持する。次に ENVIRONMENT undefined 次元の回帰テストを先に書いて fail を確認してから実装を入れる（テストギャップの根治を兼ねる）。最後に focused 5 spec + typecheck + lint で締め、phase-12 文書の over-claim 2 箇所が実装で充足されたことを確認する。

---

## 4. 実行手順

### Phase 1: environmentExplicit 方式の統合

#### 目的

ENVIRONMENT 未注入時の localhost fallback を仕様どおり fail-closed 化する。

#### 手順

1. `apps/web/src/lib/env.ts` に `getEnvironmentResolution(){environment, explicit}` を追加（または `getEnvironment()` を置換）。ENVIRONMENT 未注入（undefined）時は `{environment:"local", explicit:false}` を返す
2. `apps/web/src/lib/fetch/transport.ts` の `ApiTransportEnv` に `environmentExplicit` を追加し、localhost fallback 条件（現行 :91-96 の `env.environment === "local"` のみ）を `environment === "local" && environmentExplicit === true` 化
3. `apps/web/src/lib/fetch/authed.ts:35` の `environment: getEnvironment()` を新方式へ追従
4. 他の `getEnvironment()` 利用箇所（verify-magic-link.ts / app/api/auth/* / app/api/me/[...path]/route.ts / public.ts）の影響を確認し、必要最小の追従のみ行う
5. 原実装ブランチ `fix/profile-session-staging-localhost-endpoint` の該当 diff を `git show <branch>:<path>` で随時参照する

#### 完了条件

- ENVIRONMENT 未注入時に localhost fallback へ到達せず throw + `server_fetch_failed` 構造化ログとなる実装が入っている
- 既存呼び出し元の typecheck が通る

### Phase 2: 回帰テスト追加

#### 目的

ENVIRONMENT undefined 次元のテストギャップを根治し、fail-open 退行を将来検出可能にする。

#### 手順

1. ENVIRONMENT undefined + transport 全欠落 → throw（localhost に落ちない）の回帰テストを追加
2. ENVIRONMENT=local 明示 → localhost fallback 許可の回帰テストを追加
3. ENVIRONMENT undefined + NEXT_PUBLIC_API_BASE_URL あり の挙動を確定するテストを追加
4. env.spec / transport.spec / authed.spec のうち該当層へ配置する（新規 test ファイルは `*.spec.{ts,tsx}` のみ）

#### 完了条件

- 上記 3 次元の回帰テストが追加され、実装前に fail / 実装後に pass することを確認済み

### Phase 3: 検証と文書整合

#### 目的

focused 検証を green に締め、親ワークフロー docs の over-claim を実装充足で解消する。

#### 手順

1. focused 5 spec（env / transport / authed / safe-fetch / profile page）を repo root から実走し全 green を確認
2. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` を green に締める
3. `outputs/phase-12/system-spec-update-summary.md:22` と `implementation-guide.md:66` 周辺の記載（environmentExplicit 方式）が、本タスクの実装により結果的に正となったことを確認する（実装で充足させるため文書側の書き換えは原則不要。乖離が残る場合のみ最小修正）

#### 完了条件

- focused 5 spec + typecheck + lint green・親ワークフロー docs の記載と実装が整合

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] ENVIRONMENT 未注入 + transport 全欠落で localhost に落ちず throw + `server_fetch_failed` 構造化ログになる
- [ ] ENVIRONMENT=local 明示時のみ localhost fallback が許可される（AC-4 充足）
- [ ] ENVIRONMENT undefined + NEXT_PUBLIC_API_BASE_URL あり の挙動がテストで確定している

### 品質要件

- [ ] ENVIRONMENT undefined 次元の回帰テストが env.spec / transport.spec / authed.spec の該当層に追加されている
- [ ] focused 5 spec（現状 72 tests + 追加分）/ typecheck / lint が green
- [ ] T01 の他成果（ApiTransportError / describeTransport / 構造化ログ群）と T03 fallback chain を破壊していない
- [ ] apps/api / D1 schema / Google Form 仕様に変更がない

### ドキュメント要件

- [ ] phase-12 文書の over-claim 2 箇所（system-spec-update-summary:22 / implementation-guide:66 周辺）と実装が整合している
- [ ] NON_VISUAL 証跡（spec 実走 / typecheck / lint）が残っている

---

## 6. 検証方法

```bash
mise exec -- pnpm vitest run apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/fetch/transport.spec.ts apps/web/src/lib/fetch/authed.spec.ts apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts 'apps/web/app/(member)/profile/page.spec.tsx'
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: focused 5 spec（現状 72 tests + 本タスク追加分）全 PASS。typecheck / lint exit 0。ENVIRONMENT undefined + transport 全欠落のテストが「localhost に落ちず throw」を検証している。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| `getEnvironment()` の他呼び出し元（verify-magic-link.ts / app/api/auth/* / app/api/me/[...path]/route.ts / public.ts）が新方式で挙動変化する | 中 | 中 | 影響確認を Phase 1 手順に組み込み、transport 解決以外の用途は従来挙動を等価維持する（必要最小の追従のみ） |
| local dev で ENVIRONMENT 未注入のまま開発しており、fail-closed 化で localhost fallback が拒否され開発が止まる | 中 | 中 | `.dev.vars` / wrangler dev の ENVIRONMENT=local 明示注入を確認し、必要なら `.dev.vars.example` への記載で明示化する |
| 原実装ブランチの diff をそのまま移植して現実装（T03 chain 統合後）と構造が衝突する | 中 | 低 | 名前・構造は現実装に合わせ、「未注入は explicit=false → fallback 拒否」の意味論のみ等価移植する |
| テストを後から書くと実装に合わせた追認テストになり退行検出力が出ない | 低 | 中 | Phase 2 のテストを実装前に fail することを確認してから実装を入れる（red → green） |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/_shared-context.md`（§3 T01 / AC-1 / AC-4。特に :81 / :144 / :55）
- `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/outputs/phase-12/implementation-guide.md`（T01 DoD / :66 周辺）
- `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/outputs/phase-12/system-spec-update-summary.md`（:22 の over-claim）
- CLAUDE.md「`apps/web` env アクセス不変条件」（task-02 wrangler-env-injection / invariant #11 fail-closed）

### 参考資料

- 原実装ブランチ: local branch `fix/profile-session-staging-localhost-endpoint`（未マージ。env.ts `getEnvironmentResolution` / transport.ts:62 の environmentExplicit 条件）
- 現実装の該当箇所: `apps/web/src/lib/env.ts:153-156` / `apps/web/src/lib/fetch/transport.ts:91-96` / `apps/web/src/lib/fetch/authed.ts:35`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | focused 5 spec 72 tests 全 PASS の実走 green にもかかわらず、正本仕様が要求する environmentExplicit 方式（fail-closed）が実装から欠落していた。文書（phase-12）は「environmentExplicit 方式で維持」と充足済みのように記載 |
| 原因 | (1) 部分カバレッジ green の罠: 「ENVIRONMENT undefined」次元のテストが存在せず、N/M green は定義済みケースの green であって仕様の全分岐カバーの証明ではなかった (2) シンボル名と機能の照合不足: 仕様書は `getEnvironmentResolution`、実装は `getEnvironment` と名前が異なるため、名前 grep だけでは「T01 全部未実装」と過大判定し、機能テスト green だけでは「T01 完了」と過小判定する (3) doc-over-claim: phase-12 文書が実装に無いものを「取り込まれる変更」として記載していた |
| 対応 | 原実装ブランチとの diff 照合（`git show <branch>:<path>`）で「T01 の何が取り込まれ（ApiTransportError / 構造化ログ群）、何が落ちたか（environmentExplicit のみ）」を確定。実害到達性（wrangler.toml [vars] の ENVIRONMENT 注入 + T03 chain の防御）を評価して優先度を中と正直に設定 |
| 再発防止（future-self への観点） | (1) AC に「明示」「のみ」等の限定詞がある場合、その否定形（未注入・非明示）の回帰テスト存在を必ず確認する (2) 名前 grep（過大判定）と機能テスト green（過小判定）の両方を行い、最終確定は原実装ブランチとの diff 照合で行う (3) 文書の充足主張（doc-over-claim）はコード grep で裏取りする。文書だけ読むと充足済みに見える |

### 補足事項

本タスクは親ワークフロー T01 の取りこぼし統合であり、新規設計は不要（原実装ブランチに動作する参照実装が存在する）。staging / production の wrangler.toml `[vars]` が ENVIRONMENT を注入するため即時の実害到達性は低いが、仕様適合（AC-4 / T01 DoD）と構成事故時の診断正確性のために是正する。親ワークフロー dir は未タスク作成フロー後に completed-tasks へ移動される可能性があるが、本書のパス参照は移動時に一括書換される前提で現行パス（`docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery/`）で記載している。GitHub Issue は #1234 として起票済み。commit / push / PR 作成はスコープ外（user-gated）。
