# Phase 8: リファクタリング方針 + エラーパターン / fail-fast / rollback

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| workflow_id | `profile-session-fetch-failure-investigation` |
| taskType | VISUAL |
| implementation_mode | `new` |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_evidence_captured` |

## 目的

実装後の重複・責務漏れを除去するリファクタリング方針（対象 / Before / After / 理由）を確定し、3 タスクで起こり得る失敗パターンと fail-fast 条件・rollback 起点を列挙する。本 Phase の中核は **error code → `{ 表示文言, data-cause, ログレベル }` のマッピングを単一の純関数へ集約して重複を排除**することである（T01 の `resolveProfileSessionCause` を SSOT 化し、page.tsx・SectionError・safe-fetch の各層が独自に分岐を持たないようにする）。本サイクルはコード自体は user-gated だが、実装時に守るべき構造方針と障害時の戻り先を固定する。

## 実行タスク

### 8.1 リファクタリング方針（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| error code → 表示の写像 | `page.tsx` のデフォルト分岐に文言をベタ書き（`detail="時間をおいて再読み込みしてください。"` 固定で 410/5xx/FAILED を区別しない） | `resolveProfileSessionCause(code)` 純関数（`profile-session-cause.ts`）が `{ cause, detail }` を返し、page.tsx はそれを `SectionError` に渡すだけ | status 別の表示文言と `data-cause` の対応を 1 箇所（純関数）に集約。page.tsx に分岐を散在させない。CC-1〜CC-8 で一括被覆 |
| マッピングの責務配置 | UI（page.tsx）/ ログ（safe-fetch）が各々 status を解釈 | **表示マッピングは `resolveProfileSessionCause`（純関数）**、**ログは `logServerFetchFailure`（`code`/`status` をそのまま出力・解釈しない）** に責務分離 | UI は「見せ方」、ログは「事実の記録」に限定。ログ側は code/status を再解釈せず `safe-fetch` が生成した値を素通しするため二重定義が起きない |
| `data-cause` の生成元 | `SectionError` 側で code を解釈して属性を作る案も可能 | 属性値（`cause`）は純関数の戻り値を `SectionError` に渡すだけ（`SectionError` は受け取った `cause` を `data-cause` に出すのみ・解釈しない） | 表示 component を「dumb」に保ち、status 解釈ロジックを純関数 1 箇所に閉じる（テスト容易性・重複排除） |
| エラー文言の散在 | `SectionError` 呼び出し側に生 message（`fetchAuthed failed: 503`）を渡し得る | 固定の安全文言（純関数が返す `detail`）のみを渡し、生 message を渡さない | 技術文字列のユーザー露出を構造的に断つ（AC-3） |
| エラー UI primitive | エラー区別を別 component で新設 | `SectionError` に optional `cause?` prop を 1 つ追加して再利用 | 新規 primitive を生やさない（不変条件・SSOT §3）。既存呼び出しは後方互換 |
| ログレベルの一貫性 | 失敗種別ごとに `console.warn` / `console.error` を使い分ける案も可能 | 失敗はすべて `console.error`（1 レベル）で出し、種別は payload の `code`/`status` で表現 | レベル分岐を増やさず、種別は構造化フィールドで判別（grep/集計が容易）。401 は rethrow され**そもそもログを出さない**ため誤検知ノイズにならない |

> 「error code → `{ 表示文言, data-cause, ログレベル }`」のマッピングは、**表示文言と data-cause** を `resolveProfileSessionCause`（純関数・SSOT）に、**ログレベル**を `logServerFetchFailure`（一律 `error` レベル + 構造化フィールド）に分割して重複排除する。両者は同じ `code` を入力に取るが、互いに相手のロジックを再実装しないため二重定義が発生しない。

### 8.2 エラーパターン一覧

| # | 段階 | エラー | 検出 | ハンドリング |
| --- | --- | --- | --- | --- |
| E-1 | T01 local | `profile-session-cause.spec.ts`（CC-x）が fail（cause/detail 不一致） | Phase 9 L-3 | 純関数の 410/5xx 正規表現 / FAILED 判定を task-01 §2.1 と照合し修正 |
| E-2 | T01 local | 5xx 境界（CC-4 599 / CC-8 400）が誤判定 | Phase 9 L-3 | 正規表現 `/_(?:5\d\d)$/` のアンカー（末尾 `$`）と桁数を再確認 |
| E-3 | T01 local | PF-1〜PF-3 で `data-cause` が DOM に出ない | Phase 9 L-3 | `SectionError` の `data-cause={cause}` 出力と page.tsx の `cause` 受け渡しを確認 |
| E-4 | T01 local | PF-1〜PF-3 で生 `fetchAuthed failed: <status>` が DOM に残る | Phase 9 L-3 | デフォルト分岐で `detail` に生 message を渡している。純関数の安全文言へ差し替え（AC-3） |
| E-5 | T01 local | PF-4（404）の再ログイン CTA が回帰し消える / `data-cause` が誤って付く | Phase 9 L-3 | 404 分岐（53-63）を純関数経由にしていないか確認。404 は CTA 分岐のまま無変更（AC-3） |
| E-6 | T01 local | PF-5（401）の redirect が回帰し `/login` へ飛ばない | Phase 9 L-3 | `AuthRequiredError` rethrow 経路を変更していないか確認、変更していれば revert（AC-3 NO-GO） |
| E-7 | T02 local | LG-1〜LG-4 の `status`/`code`/`path` が payload に出ない | Phase 9 L-3 | `logServerFetchFailure` の payload キーと `statusFromError` 再利用を task-02 §2 と照合 |
| E-8 | T02 local | LG-7 で memberId / 生 message 全文が payload に混入 | Phase 9 L-3 | payload に固定キー（event/path/code/status）以外を入れていないか確認（不変条件 #11 NO-GO） |
| E-9 | T02 local | LG-5（401 rethrow）でログが出てしまう | Phase 9 L-3 | `shouldRethrow` true 時は throw 前にログを呼ばない順序を確認 |
| E-10 | T03 local | 診断スクリプトが secret 実値 / cookie を出力 | task-03 §6 DoD-T03-4 | 出力経路を presence/status のみに限定。`smoke-staging-me.sh` の非出力規約を踏襲 |
| E-11 | T03 local | `wrangler` を直接呼んでいる | task-03 §6 DoD-T03-5 | `bash scripts/cf.sh` 経由へ置換 |
| E-12 | 横断 local | `pnpm typecheck` / `pnpm lint` が exit≠0 | Phase 9 L-1/L-2 | unused import / 型注釈漏れを最小差分で修正。`lint --fix` を先に試す |

### 8.3 fail-fast / 縮退の方針

- Phase 9 の L-1（typecheck）/ L-2（lint）/ L-3（対象 vitest）の **いずれか 1 件でも fail したら commit へ進まない**（gate）。
- 以下は **NO-GO 条件**（崩れた場合は該当タスクの diff を revert し Phase 2/3 の方針へ戻る）:
  - AC-3: 401 redirect・404 再ログイン CTA の回帰（PF-4 / PF-5）。
  - AC-4 / 不変条件 #11: ログへの memberId / 生 message 全文の露出（LG-7）。
  - AC-6: `/me` レスポンス shape / path / status 体系・D1 schema・Google Form 仕様の変更（`apps/api` diff が空でないこと）。
- 本サイクルはコード未コミットの仕様作成段階のため、実装着手後でも変更は worktree 内で完全に戻せる（cap=worktree）。

### 8.4 rollback 起点

| 状況 | rollback 起点 |
| --- | --- |
| T01 で 404 CTA / 401 redirect が回帰（PF-4 / PF-5 失敗） | `page.tsx` のデフォルト分岐追加と `SectionError.tsx` の `cause` prop を revert、`profile-session-cause.ts` を削除。404/401 経路は元から無変更のため復旧 |
| T01 で技術文字列が露出（PF-1〜PF-3 / SE-3 失敗） | 純関数の `detail`（安全文言）と `SectionError` の `data-cause`（可視テキスト非露出）を task-01 §2 へ戻す |
| T02 で memberId 露出（LG-7 失敗） | `safe-fetch.ts` の `logServerFetchFailure` の payload を固定 4 キーへ戻す。最悪 `logServerFetchFailure` 呼び出し 1 行を外せばログ機能のみ無効化（戻り値 shape は元から不変） |
| T03 で secret 露出 / wrangler 直叩き（E-10/E-11） | `scripts/diagnose-profile-session.sh` を削除（新規 1 ファイルのみ）。既存スクリプトは無改変 |
| 横断 typecheck/lint 不能 | 3 タスクは UI / ログ / スクリプトで責務分離・独立のため、失敗タスクの diff のみ revert し他 2 タスクは保持 |

> 3 タスクは web UI（表示）/ web lib（ログ）/ scripts（運用診断）で責務分離しており、いずれか 1 タスクの revert が他タスクの成果を巻き込まない。写像純関数 `resolveProfileSessionCause` は T01 専有のため、削除しても T02/T03 に影響しない。

## 完了条件

- [x] リファクタリング方針を 対象 / Before / After / 理由 テーブルで確定（error code → 表示/data-cause/ログレベル の純関数集約を中核に）
- [x] 表示マッピング（純関数）とログ（一律 error + 構造化フィールド）の責務分離で二重定義を排除する方針を明示
- [x] E-1〜E-12 のエラーパターンを段階・検出・ハンドリング付きで列挙
- [x] fail-fast 条件（L-1/L-2/L-3 gate）と NO-GO 条件（AC-3 / AC-4・#11 / AC-6）を明示
- [x] タスク別 rollback 起点を確定

## 成果物

- `outputs/phase-8/phase-8.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401 redirect / 410 境界（AC-3 NO-GO の根拠） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` shape / path 不変（AC-6 NO-GO の根拠） |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | エラー表示と文言写像方針（T01 安全文言） |

- `_shared-context.md`（SSOT §2 仮説 / §3 不変条件 / §4 AC）
- `outputs/phase-5/task-01..03`（写像純関数 / ログ / 診断スクリプト）
- `outputs/phase-6/phase-6.md`（テストケース CC/PF/SE/LG）

## 統合テスト連携

E-1〜E-12 の検出は Phase 9 のテスト層（L-1/L-2/L-3）に紐づき、NO-GO（AC-3 / AC-4・#11 / AC-6）違反は Phase 10 の最終レビューで blocker 判定の根拠になる。写像純関数への集約（8.1）は Phase 7 の変更ブロック 100% 被覆（CC-1〜CC-8）で品質を担保する。
