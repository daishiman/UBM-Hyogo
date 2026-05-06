# Phase 8: DRY 化 / リファクタリング — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 8 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |

## 目的

Phase 5-7 で実装した `scripts/postmortem/generate-postmortem.ts` / `template.md` / `README.md` を、動作を変えずに重複削減・命名整理・責務分離の観点でリファクタリングする。
苦戦箇所 S1（blame 排除構造）/ S4（冪等性）を**構造で守ったまま**、可読性とテスタビリティを底上げする。

NON_VISUAL タスクのため UI 差分は発生せず、本 Phase では「コード／markdown のリファクタ」と「既存テスト全 PASS の継続確認」のみを行う。

## 苦戦箇所 S1-S5（前 phase から転記）

- S1: blame 表現禁止（template / コードの placeholder / 変数名にも `responsible` `blame` `fault` `責任` を入れない）
- S2: 09c Phase 11 evidence path 必須（`ensureEvidencePathExists` が directory + `main.md` を確認）
- S3: runbook 責務分離（既存 incident response runbook 本文を編集しない・追加のみ）
- S4: 冪等性（`Date.now()` `Math.random()` 等を `generatePostmortem` から排除）
- S5: pnpm スクリプト統合（`postmortem:generate` 経由で叩ける）

## 実行タスク

1. `scripts/postmortem/generate-postmortem.ts` の重複コード削減（テンプレ書き出し処理の関数化、見出し定数の集約、入力検証ロジックの分離）
2. markdown 見出しを `const HEADINGS = [...] as const` で共通化し、`generatePostmortem` と test の双方から参照する
3. 既存 `scripts/` 配下の utility（fs / path / argv 系 helper）に統合可能か確認する
4. template.md / README.md 文言の表記ゆれを整える（見出し記法、日本語/英語混在の整理）
5. 全 unit test（Phase 4 で定義した TC 全件）が継続的に green であることを確認する
6. `outputs/phase-08/main.md` にリファクタリング差分のサマリを記録する

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 2 設計 | `outputs/phase-02/main.md` | 関数シグネチャ / template 7 見出し |
| Phase 4 テスト戦略 | `outputs/phase-04/main.md` | TC 一覧（DRY 後も全 PASS が条件） |
| Phase 5 実装ランブック | `outputs/phase-05/main.md` | 実装本体の正本 |
| 既存 utility | `scripts/coverage-guard.ts` `scripts/skill-logs-append.ts` | 統合可能性の評価対象 |
| Phase テンプレ | `.claude/skills/task-specification-creator/references/phase-template-phase8-10.md` | Phase 8 共通骨格 |

## DRY 観点と方針

| 観点 | 重複候補 | 方針 |
| --- | --- | --- |
| markdown 見出し | `generatePostmortem` 内のリテラルと test 内 expected の重複 | `const HEADINGS = ['Header','Timeline','Impact','Detection','Response','Root Cause','Prevention','Follow-up Issues'] as const` を共通 export にする |
| placeholder 名 | `{{release}}` `{{commit}}` 等を関数内に散在させない | `const PLACEHOLDERS = { ... } as const` で集約、`replaceAll` のキー source とする |
| 入力検証 | release 正規表現 / commit 正規表現 / ISO8601 形式 | `validators.ts` 相当ではなく **同ファイル内の private const + 小関数** に集約（過剰分割を避ける）|
| テンプレ書き出し | header section の組み立てを `buildHeader(input)` に切り出し、本体組み立てから分離 | pure 関数のまま |
| fs helper | `fs.statSync` 例外ハンドリング | `ensureEvidencePathExists` 内に閉じ、外部に export しない |
| argv parser | `node:util` `parseArgs` を直接使用 | 外部依存を増やさない（CLAUDE.md「外部依存追加禁止」遵守） |

## 既存 scripts/ utility との統合可能性

| 既存 utility | 検討結果 | 結論 |
| --- | --- | --- |
| `scripts/coverage-guard.ts` の fs 系 helper | coverage 専用ロジックに密結合、抽出すると逆に複雑化 | 統合しない |
| `scripts/skill-logs-append.ts` の argv 解析 | append 専用引数に最適化されており共通化メリット低 | 統合しない |
| `scripts/with-env.sh` (op run wrapper) | 1Password 注入は本タスクと無関係 | 統合しない |

→ 既存 utility への統合は行わず、`scripts/postmortem/` ディレクトリで自己完結させる（小規模スクリプトのため YAGNI）。

## 過剰抽象化の禁止

- markdown テンプレートエンジン（handlebars / mustache 等）の追加導入はしない（外部依存禁止 / 単純文字列置換で十分）
- `PostmortemSection` を class 化して各セクションを polymorphism で扱う設計はしない（YAGNI）
- 入力 validator の汎用化（zod 化等）はしない（小スクリプトの範囲では `parseArgs` + 正規表現で足りる）

## 重複検出 grep（Phase 9 grep gate 候補）

```bash
# S1: blame 表現が code / template / placeholder 名に混入していない
rg -n -i "responsible|blame|fault|責任" scripts/postmortem/ docs/30-workflows/runbooks/postmortem/  # 0 hit 期待

# S4: 非決定要素が generatePostmortem 内に無い
rg -n "Date\.now\(\)|Math\.random\(\)|new Date\(\)\.toISOString\(\)" scripts/postmortem/generate-postmortem.ts  # 0 hit 期待
# ※ CLI 層 (main) で `--occurred-at` 未指定時のエラーメッセージ用などには使用しない

# 見出しリテラルの散在チェック（DRY）
rg -n "'Timeline'|'Root Cause'|'Follow-up Issues'" scripts/postmortem/  # HEADINGS 1 箇所のみ
```

## IPC 契約ドリフト検証

**N/A**: 本タスクのスクリプトは Node.js stand-alone CLI であり、Electron / Workers 間の IPC 契約を持たない。
`apps/api` `apps/web` のいずれも変更対象外（不変条件 #5 / #11 影響なし）であり、IPC スキーマ変更は発生しない。

## リファクタリング後の検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/postmortem
mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md \
  --occurred-at 2026-05-05T00:00:00Z > /tmp/pm.md
diff /tmp/pm.md <(mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
  --evidence docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/ \
  --rollback-evidence /tmp/dummy-rollback.md \
  --occurred-at 2026-05-05T00:00:00Z)  # 0 diff（冪等性）
```

## 統合テスト連携

| 判定項目 | 基準 | 結果記載先 |
| --- | --- | --- |
| typecheck | error 0 | `outputs/phase-08/main.md` |
| lint | warn/error 0 | 同上 |
| unit（Phase 4 全 TC） | 全 PASS（リファクタ前後で結果差なし） | 同上 |
| 冪等性（同入力 2 回 diff 0） | 0 diff | 同上 |

E2E は NON_VISUAL のため不要（運用 CLI スクリプト）。

## 多角的チェック観点

- S1: 変数名・コメント・error message にも blame 表現が混入していないか
- S4: リファクタによって `generatePostmortem` に副作用 / 非決定要素が紛れ込んでいないか（pure 関数のままか）
- DRY: 見出し / placeholder / 正規表現がコード上で 1 箇所に集約されているか
- YAGNI: 抽象化のために機能追加が発生していないか（template engine / class hierarchy 禁止）
- 後方互換: CLI 引数仕様 / exit code 仕様が Phase 1 契約から逸脱していないか

## サブタスク管理

- [ ] HEADINGS / PLACEHOLDERS の定数集約
- [ ] `buildHeader` 等の小関数切り出し
- [ ] template.md / README.md 表記ゆれ整理
- [ ] 既存 utility 統合可否の判断（不採用理由を記録）
- [ ] grep gate（S1 / S4 / DRY）が 0 hit
- [ ] unit 全 TC 継続 PASS
- [ ] 冪等性 diff 0 の再確認
- [ ] `outputs/phase-08/main.md` 作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| DRY / リファクタレポート | `outputs/phase-08/main.md` | 重複削減点・既存 utility 統合可否・grep 結果 |

## 完了条件

- [ ] HEADINGS / PLACEHOLDERS が共通定数化されている
- [ ] `generatePostmortem` が pure のままで、副作用 / 非決定要素を増やしていない
- [ ] 既存 scripts/ utility に対する統合可否の判断が記録されている
- [ ] grep gate（S1 / S4 / DRY）が 0 hit
- [ ] Phase 4 で定義した unit TC が全て継続 PASS
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] commit / push / PR を実行していない（user 承認は Phase 13）
- [ ] 既存 incident response runbook / 09c Phase 6 本文を編集していない（S3）
- [ ] 外部依存（template engine / validator lib）を追加していない
- [ ] `apps/api` / `apps/web` を変更していない

## 次 Phase への引き渡し

Phase 9 へ、リファクタ後の構造図 / 集約定数（HEADINGS / PLACEHOLDERS）/ grep gate スニペット / 冪等性 diff 0 確認手順を渡す。
