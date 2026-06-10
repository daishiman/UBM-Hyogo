# 5xx の根治（session-resolver / API worker / D1 のバグ修正） - タスク指示書

## メタ情報

```yaml
issue_number: 1190
```

| 項目         | 内容                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| タスクID     | task-5xx-session-resolver-api-d1-root-fix                                                              |
| 分類         | 本格修正（apps/api バグ修正）                                                                          |
| 対象機能     | /me 5xx 例外経路                                                                                       |
| 優先度       | medium                                                                                                 |
| 見積もり規模 | 中〜大                                                                                                 |
| ステータス   | `deferred_pending_root_cause`                                                                          |
| 発見元       | profile-session-fetch-failure-investigation Phase 12 unassigned-task-detection                        |
| 発見日       | 2026-06-09                                                                                             |
| 親タスク     | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation`                       |
| タスク種別   | implementation / NON_VISUAL                                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親ワークフロー `profile-session-fetch-failure-investigation` は、staging `/profile` で
「セッション取得に失敗しました」バナーが表示される事象を調査し、**観測性の向上**を実装した。
具体的には web 側の `safe-fetch.ts`（T02）で `status` / `code` / `path` を構造化ログに残し、
5xx は `FetchAuthedError(5xx)` → `MEMBER_SESSION_5xx` → デフォルト分岐へ集約される経路まで可視化した。

しかし親タスクは **AC-6 で apps/api 非接触**を不変条件として設計されている。
そのため「観測性で 5xx と判明させる」ところまでが責務であり、
**5xx を発生させているコード経路そのものの特定と根治は、構造的に未着手のまま残された**。
この残課題が本未タスク（C-2）であり、分離理由は CONST_007 例外①
（真因が H4＝5xx と確定し、例外箇所を特定してからでないと修正対象を定義できない）に基づく。

`/me` の認証境界の所有権は以下のとおり分割されている。

- `apps/api/src/middleware/session-guard.ts` … 401 / 410 の判定所有権（認証可否の境界）
- `apps/api/src/middleware/me-session-resolver.ts` … Auth.js cookie / JWT → session の解決
- `apps/api/src/routes/me/index.ts` … `/me` ハンドラ（session 解決済み前提の本処理 + D1 read）

5xx（server error）は、上記 session-resolver の解決失敗時 throw / D1 クエリ（`member_status` 等の read）の例外 /
`/me` ハンドラ内部の例外、のいずれかで発生しうる。

### 1.2 問題点・課題

- 親調査タスクは AC-6（apps/api 非接触）を守るため、5xx の**根治を同一サイクルに入れられなかった**。
  観測性ログで 5xx と判明しても、修正は apps/api 改変を伴うため別タスク・別ブランチが必須。
- web 側の観測性ログ（`safe-fetch.ts` の `status` / `code` / `path`）は **web worker のログ**であり、
  API worker 内部の stack trace（どの行で throw されたか）は含まれない。
  例外箇所の特定には別途 Cloudflare ログ / `wrangler tail` を `bash scripts/cf.sh` 経由で取得する必要がある。
- このため**現時点では「5xx が起きている」ことは分かっても、「どのコード経路で起きているか」は未確定**であり、
  修正対象を確定できない（着手前提＝真因 H4 確定 + 例外箇所特定）。

### 1.3 放置した場合の影響

- 真因が H4（5xx）の場合、server error によって会員マイページ（`/profile`）全体が機能不全になる。
  ログインしても自分の会員情報が一切表示できない状態が継続する。
- 観測性は得たが根治しないため、ユーザーには引き続き「セッション取得に失敗しました」の
  デフォルト分岐バナーのみが見え、原因を切り分けられないまま再発し続ける。
- 例外箇所が D1 read の場合、他の認証必須エンドポイントへ波及している可能性を検証できないまま残る。

---

## 2. 何を達成するか（What）

### 2.1 目的

`/me` で発生している 5xx（server error）の**例外発生箇所を特定し、その例外を生んでいるバグを根治**する。
対象は session-resolver / API worker ハンドラ / D1 read のいずれか（真因確定後に1点以上へ確定）。

### 2.2 最終ゴール

- staging `/profile` で `/me` 呼び出しが 5xx を返さなくなる（正常時 200 / 未認証時 401 / 退会時 410 のみ）。
- 5xx を生んでいた例外箇所が apps/api 内のバグ修正として解消され、apps/api typecheck / lint / test が PASS。
- apps/web は非接触（本タスクは apps/api 改変のみ。観測性 UI / `safe-fetch.ts` には触らない）。

### 2.3 スコープ

#### 含む

- Cloudflare ログ / `wrangler tail`（`bash scripts/cf.sh` 経由）による API worker 内部 stack trace の取得と例外箇所特定。
- 特定した例外箇所（session-resolver の throw / D1 read の例外 / `/me` ハンドラの例外）のバグ修正。
- 修正に対する apps/api の typecheck / lint / test（必要なら回帰テスト追加）。

#### 含まない

- **D1 schema 変更**（D1 直接アクセスは apps/api に閉じる不変条件 #5 を維持。schema は触らない）。
- **`/me` の status 体系変更**（401 / 410 / 5xx の意味づけ自体は変えない。例外を発生させているバグの修正に限定）。
- **観測性 UI の再変更**（親タスクで実装した `safe-fetch.ts` のログ / web の分岐は再変更しない）。
- apps/web の改変全般（本タスクは apps/api 改変として独立させる）。
- Google Form 仕様変更。

---

## 3. どう実現するか（How）

### 3.1 着手前提（必ず確認）

1. 親調査タスクで**真因が H4（5xx）と確定**していること（Phase 11 MT-A の手動テスト結果）。
2. **例外箇所が特定済み**であること（API ログで session-resolver / D1 / ハンドラのいずれかに絞れている）。

上記2点が未充足の場合、本タスクは着手しない（`deferred_pending_root_cause` のまま）。

### 3.2 調査ステップ（例外箇所の特定）

```bash
# API worker のリアルタイムログで /me の stack trace を取得
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging

# 別タブで staging /profile を開き /me を発火させ、5xx 時の例外スタックを観察
```

- web 側ログ（`safe-fetch.ts` の `status` / `code` / `path`）だけでは API 内部の例外行は分からない。
  必ず `wrangler tail` / Cloudflare ログで **API worker 内部の stack trace** を取得し、
  例外が session-resolver / D1 read / ハンドラのどこで throw されているかを確定する。
- 確定した例外箇所を 1 点以上に絞り、修正対象を定義する。

### 3.3 修正ステップ

- 例外箇所が **session-resolver**（cookie / JWT 解決失敗時の throw）の場合
  … 解決失敗を 5xx ではなく適切な認証境界（401）へ閉じるか、解決ロジックのバグを修正する
  （`session-guard.ts` の 401 / 410 所有権を侵さない範囲で `me-session-resolver.ts` を直す）。
- 例外箇所が **D1 read**（`member_status` 等）の場合
  … クエリ / カラム参照 / null 取り扱いのバグを修正する。**schema は変更しない**（不変条件 #5）。
- 例外箇所が **`/me` ハンドラ**（`routes/me/index.ts`）の場合
  … session 解決済み前提が崩れている箇所 / 例外を握り潰さず投げている箇所を特定し修正する。
- 修正後、回帰防止のため該当経路の spec を追加・更新する（新規 test は `*.spec.ts` のみ）。

---

## 苦戦箇所【記入必須】

- 対象: 親タスク `profile-session-fetch-failure-investigation` の AC-6（apps/api 非接触）と本タスクの境界
- 症状: 「観測性で 5xx と判明 → ではそのまま直す」と**安易に同一サイクルに入れると、apps/api 改変が混入して
  調査タスクの非接触契約（AC-6）を壊す**。観測性タスクは web のみ・根治タスクは apps/api のみ、と
  ブランチ・タスクを構造的に分離すること。本タスクは必ず apps/api 改変の独立タスク・独立ブランチで扱う。
- 参照: `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/unassigned-task-detection.md`

- 対象: API worker 内部の例外箇所特定（`me-session-resolver.ts` / D1 read / `routes/me/index.ts`）
- 症状: T02 で入れた観測性ログ（`safe-fetch.ts` の `status` / `code` / `path`）は **web 側ログ**であり、
  API worker 内部の stack trace は含まれない。**web ログだけでは API 内部の例外行まで特定できない罠**がある。
  例外箇所は `bash scripts/cf.sh` 経由の Cloudflare ログ or `wrangler tail` で別途取得する必要がある。
- 参照: `apps/api/src/middleware/me-session-resolver.ts` / `apps/api/src/routes/me/index.ts`

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 真因未確定のまま着手し、誤った箇所を修正する | 高 | 着手前提（§3.1）の真因 H4 確定 + 例外箇所特定を必須ゲートにする。未充足なら着手しない |
| 観測性タスクと同一サイクルに入れて AC-6（apps/api 非接触）を壊す | 高 | 本タスクを apps/api 改変の独立タスク・独立ブランチに分離。web は非接触で保つ |
| web ログだけで判断し API 内部の例外箇所を取り違える | 中 | `wrangler tail` / Cloudflare ログで API worker 内部 stack trace を必ず取得してから修正対象を確定する |
| D1 read 修正のつもりで schema を変更してしまう | 高 | 不変条件 #5（D1 直接アクセスは apps/api に閉じる）を維持。schema は変更せずクエリ / null 取り扱いのバグのみ直す |
| `/me` status 体系（401 / 410 / 5xx）の意味づけを変えてしまう | 中 | status 体系は不変。例外を発生させているバグの修正に限定し、`session-guard.ts` の判定所有権を侵さない |
| 観測性 UI / `safe-fetch.ts` を再変更し親タスク成果を壊す | 低 | 観測性 UI は scope 外。本タスクでは触らない |

---

## 検証方法

### 着手前提の確認（真因 H4 確定 + 例外箇所特定）

```bash
# 親タスクの手動テスト結果で 5xx（H4）が確定しているか
grep -nE "5xx|H4|MT-A" docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md

# 未タスク検出ログで例外箇所候補（session-resolver / D1 / handler）が記録されているか
grep -nE "session-resolver|D1|handler|例外箇所" docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/unassigned-task-detection.md
```

期待: 真因 H4（5xx）が確定し、例外箇所が 1 点以上に絞られている

### API 内部の例外箇所特定（修正前）

```bash
# API worker のログで /me の stack trace を取得（修正対象の確定）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging
```

期待: 5xx 発生時に session-resolver / D1 read / ハンドラのどこで throw しているかが stack trace で判別できる

### 修正完了の検証（apps/api）

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api lint
mise exec -- pnpm --filter @repo/api test
```

期待: typecheck / lint / test 全 PASS。回帰テストで 5xx 経路が再発しないことを担保

### apps/web 非接触の確認

```bash
# 本タスクの差分が apps/api に閉じており apps/web を変更していないこと
git diff --name-only dev...HEAD | grep -E "^apps/web/" && echo "NG: apps/web に差分あり" || echo "OK: apps/web 非接触"
```

期待: `OK: apps/web 非接触`（observability UI / `safe-fetch.ts` は再変更しない）

---

## 4. 関連リンク

| 種別 | パス | 用途 |
| --- | --- | --- |
| 親タスク | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/` | 調査・観測性実装の正本（5xx 判明の起点） |
| 親タスク未タスク検出 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/unassigned-task-detection.md` | C-2 分離理由（CONST_007 例外①）の正本 |
| 親タスク手動テスト | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md` | 真因 H4（5xx / MT-A）確定の根拠 |
| 修正対象候補 | `apps/api/src/middleware/me-session-resolver.ts` | Auth.js cookie / JWT → session 解決（throw 例外箇所候補） |
| 認証境界 | `apps/api/src/middleware/session-guard.ts` | 401 / 410 判定の所有権（status 体系は不変） |
| 修正対象候補 | `apps/api/src/routes/me/index.ts` | `/me` ハンドラ + D1 read（例外箇所候補） |
| 実行ラッパー | `scripts/cf.sh` | Cloudflare ログ / `wrangler tail` 取得（API 内部 stack trace） |
