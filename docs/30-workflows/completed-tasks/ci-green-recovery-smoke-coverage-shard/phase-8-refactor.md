# Phase 8: リファクタリング

Phase 5（実装）/ Phase 6（テスト拡充）で成立させた 3 lane の振る舞いを**変えずに**、構造の明瞭性・テスト容易性・回帰耐性を高めるリファクタリングを記録する。本サイクルでは mint helper の純粋関数/CLI 分離と reason 分岐の局所化を採用し、coverage 判定ロジック自体は不変にした（Feedback RT-03）。

> 前提: ここで挙げる変更は**外部挙動を変えない**（mint 出力フォーマット・smoke の PASS/FAIL 判定・coverage MISSING 判定ロジック・required status context 名はすべて不変）。挙動が変わるものはリファクタリングではなく Phase 5 の実装差分として扱う。

---

## 0. リファクタリングの原則（過度な抽象化の回避）

- **YAGNI 優先**: 「将来 lane が増えたら」「他 workflow でも使うかも」という推測に基づく共通化はしない。本タスクは 3 lane・1 サイクル完結であり、再利用の事実が出るまで抽象化を先送りする。
- **純粋関数と副作用の分離は行うが、層を増やさない**: mint helper の JWT 生成（純粋）と `GITHUB_OUTPUT`/`GITHUB_ENV` 追記（副作用）の分離はテスト容易性の実利があるため採用する。一方で「JWT writer interface」「output sink 抽象」のような DI 層は導入しない。
- **shell の関数抽出は副作用が読みやすくなる範囲に限る**: bash の関数化はスコープ・`set -e` 伝播・サブシェルの落とし穴があるため、reason 判定のように「分岐が増えて可読性が落ちた箇所」だけを対象にし、runner 全体の再構造化はしない。
- **ci.yml の重複 step 整理は anchor / composite 化の誘惑を退ける**: GitHub Actions の YAML anchor は actionlint 互換性と可読性の両面でコストが高い。重複は「同一値の明示的再掲」に留め、step を共通 composite に押し込まない。

---

## 1. リファクタリング記録（対象 / Before / After / 理由）

### 1.1 Lane A — mint helper（`scripts/smoke/mint-staging-bearers.mts`）

| 対象 | Before | After | 理由 |
|---|---|---|---|
| 純粋関数と CLI の分離 | mint ロジックと `process.env` 読み取り・`GITHUB_OUTPUT` 追記が同一スコープに同居しうる | `export async function mintStagingBearers(env)` を純粋関数として確立し、`process.env` 読み取り・出力追記は `import.meta` guard 配下の CLI ブロックに隔離する | parity test（AC-2）が `process.env` に依存せず純粋関数を直接叩けるようにする。テスト容易性と責務分離。Phase 2 §1.2 の設計を構造として固定 |
| env 読み取りの一点集約 | 各 env を関数本体で都度参照 | CLI ブロック先頭で `readEnv()` 相当の 1 箇所に集約し、欠落時メッセージを 1 経路にする | 欠落エラーの出力経路を 1 つにし、AC（必須 env 欠落 → `exit 2`）の検証点を単純化。ただし `readEnv` を別ファイルに切り出すことはしない（1 ファイル内ローカル関数に留める） |
| 出力時 mask の責務境界 | helper 側で mask を試みる誘惑 | helper は **stdout/`GITHUB_OUTPUT` 追記のみ**、`::add-mask::` 適用は workflow 側 1 step に閉じる（Phase 2 §1.2 / R-1） | mask の責務を workflow に一元化し、helper が JWT を console へ漏らす経路を構造的に消す。helper をテストするとき mask 副作用がないので純粋に検証できる |
| 戻り値の型 | ad-hoc な object | `MintedBearers`（`readonly adminBearer / meBearer / memberId`）を明示 | 型で出力契約を固定し、workflow が読む key 名の drift を typecheck で検出 |

### 1.2 Lane A — smoke runner（`scripts/smoke/runtime-attendance-provider.sh`）

| 対象 | Before | After | 理由 |
|---|---|---|---|
| reason 判定の関数抽出**可否** | 401/403/500 の reason 分岐が `request_json` 内にインライン展開（Phase 2 §1.4 で 3 分岐に増加） | **関数抽出する**: `classify_failure_reason "$status" "$redacted_body"` を 1 関数に切り出し、`echo` で reason を返す純粋寄り関数にする | 分岐が 1 → 3 に増え可読性が落ちるため抽出が正当化される。`request_json` の本筋（HTTP 実行）と分類ロジックを分け、Phase 6 の shell unit が `classify_failure_reason` 単体を叩けるようにする |
| 抽出の範囲限定 | （runner 全体の関数化を検討しうる） | 抽出は `classify_failure_reason` の 1 関数のみ。HTTP 実行・jq 抽出・summary 書き込みは現状維持 | 過度な再構造化を避ける。`set -euo pipefail` 下での関数戻り値の扱いを増やさず、副作用の局所性を保つ |
| redact の重複 | reason 判定の各分岐で `printf '%s' "$redacted_body"` を反復 | 既に redact 済みの body を関数引数で 1 度だけ渡す | JWT 等の生 body を関数内に持ち込まない（不変条件 3 維持）。重複 `printf` を引数渡しに集約 |

### 1.3 Lane B/C — `ci.yml`

| 対象 | Before | After | 理由 |
|---|---|---|---|
| coverage-gate の step 順序 | `--no-run`（MISSING で exit 1）が「Fail closed on failed shard」より前（Phase 2 §3.1） | 「Fail closed on failed shard」を `--no-run` の前に移動（Phase 2 §3.2a） | これは厳密にはバグ修正（Phase 5）だが、step ブロックの再配置として Phase 8 でも順序の最終確認を行い、コメントで「shard 全成功時のみ到達」を明示する。可読性の補強 |
| checkout step の重複記述 | shard と gate で `actions/checkout@v4` を別々に記述、token 指定が暗黙 | 両 checkout に `token: ${{ github.token }}` / `persist-credentials: true` を**明示再掲**（Phase 2 §2.1） | anchor で共通化せず明示再掲。意図された認証を各 job に固定し、actionlint と diff レビューで認証設定が一目で分かる。共通化による暗黙依存を避ける |
| top-level permissions | 無し | `permissions: contents: read` を `on:` と `jobs:` の間に追加 | 既存 job 個別 permissions は据え置き（R-6）。重複ではなく default の縮退防止。Phase 9 で job 別 permissions と突合 |
| step コメントの整理 | 順序の意図が暗黙 | 並べ替えた step に「upstream shard 失敗を先に明示するため」コメントを 1 行付与 | AC-7 の意図を YAML 上で自己文書化。挙動は変えない |

### 1.4 Lane B — `scripts/coverage-guard.sh`

| 対象 | Before | After | 理由 |
|---|---|---|---|
| MISSING 診断メッセージ | 欠落 package を列挙して exit 1 のみ | メッセージに「shard 成功時のみ真の欠落。shard 失敗が疑われる場合は coverage-gate-shard の結果を確認せよ」を追記（Phase 2 §3.2b） | **判定ロジックは不変**（false negative を作らない・R-4）。文言のみ強化。メッセージ生成箇所が散在する場合は 1 つの heredoc/変数に集約して重複出力を防ぐ |
| メッセージ定数化の**可否** | 文字列がインライン | 同一メッセージが 2 箇所以上に出るなら shell 変数 1 つに集約。1 箇所のみならインラインのまま | DRY は重複が実在する場合のみ適用。1 箇所しかない文言を変数化しない（過度な抽象化回避） |

---

## 2. 採用しない（意図的に見送る）リファクタリング

| 候補 | 見送り理由 |
|---|---|
| mint helper を `packages/shared` 配下のライブラリへ昇格 | smoke 専用の CI スクリプトであり、API ランタイムが import しない。`scripts/smoke/` に閉じるのが責務的に正しい。共有化は再利用の事実が出てから |
| `signSessionJwt` のラッパー新設（admin/me 用の専用関数） | `signSessionJwt(secret, {isAdmin})` を 2 回呼ぶだけで十分。ラッパーは間接層を増やすだけで価値がない |
| ci.yml の checkout/setup を再利用 composite に集約 | `setup-project` は checkout を行わない既存契約（Phase 1 §3.2）。checkout を composite に移すと他 workflow への波及が読めず、本タスクのスコープ（CONST_007）を越える |
| coverage-guard.sh の `--no-run` と group モードの統合 | 2 モードは責務（discover/aggregate と単一 group 実行）が異なる。統合は分岐を増やすだけ。現状の分離を維持 |
| runner 全体の bats への全面移植 | reason 分岐の unit 化（Phase 6）で十分。runner の HTTP 経路まで bats 化するのはスコープ外 |

---

## 3. リファクタリング後の不変条件確認（Phase 9 へ引き継ぐ観点）

1. mint helper の出力フォーマット（`admin_bearer` / `me_bearer` / `member_id` の key 名）が変わっていない → parity test と workflow の `GITHUB_ENV` export 名が一致。
2. `classify_failure_reason` 抽出後も、既存 reason（`auth-secret-binding-missing`）の出力が回帰していない。
3. ci.yml の step 並べ替えで required status context 名（`coverage-gate` / `runtime smoke staging / smoke`）が不変。
4. coverage-guard.sh の MISSING 判定 exit code・対象 package 集合が不変（メッセージのみ差分）。
5. helper / runner / guard のいずれも JWT・署名鍵・secret 実値を console / log に出さない。

---

## 4. 完了条件（DoD）

- [ ] 各 lane のリファクタリングが `対象 / Before / After / 理由` テーブルで記録されている（RT-03）
- [ ] reason 判定の関数抽出可否が判断基準付きで明記されている（抽出する／範囲限定）
- [ ] mint helper の純粋関数・CLI 分離方針が記録されている
- [ ] ci.yml の重複 step を anchor 化せず明示再掲する方針が記録されている
- [ ] 「採用しないリファクタリング」が見送り理由付きで列挙されている（過度な抽象化回避）
- [ ] 外部挙動不変であることが §3 で確認されている

## 成果物

- `outputs/phase-8/refactor.md`（本 Phase の確定事項サマリ）
