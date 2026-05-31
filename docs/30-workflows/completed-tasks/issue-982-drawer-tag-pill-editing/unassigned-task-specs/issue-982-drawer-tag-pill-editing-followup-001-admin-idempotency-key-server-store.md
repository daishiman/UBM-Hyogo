# issue-982-drawer-tag-pill-editing-followup-001 — admin API server 側 Idempotency-Key 処理ストア

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-982-drawer-tag-pill-editing-followup-001 |
| 分類 | implementation / API middleware |
| 優先度 | 低 (priority:low) |
| 規模 | 中 (scale:medium) |
| ステータス | unassigned |
| 発見元 | issue-982-drawer-tag-pill-editing Phase 12 unassigned-task-detection (scope-out 候補: idempotency middleware) |
| 発見日 | 2026-05-30 |
| 親ワークフロー | issue-982-drawer-tag-pill-editing |
| visualEvidence | NON_VISUAL |

## 背景

親ワークフロー issue-982 で `MemberDrawer` の tag pill 編集を実装し、`apps/web/src/features/admin/hooks/useAdminMutation` は mutation 呼び出しに `Idempotency-Key` header を送出する経路を持つ（`options.idempotencyKey` 指定時のみ `headers["Idempotency-Key"]` に載せる）。

しかし apps/api の admin 側には **Idempotency-Key を処理する middleware が未実装**で、`apps/api/src/routes/admin/members.ts` の tag write endpoint は header を**受理するだけで no-op**（読み捨て）になっている。現状の冪等性は以下の暗黙的手段で担保されている:

- POST `/admin/members/:memberId/tags`: `assignTagToMemberByAdmin` の `INSERT OR IGNORE`（member_tags の PK / unique 制約）に依存し、再送時は `applied=false` で audit も二重記録されない。
- DELETE `/admin/members/:memberId/tags/:tagId`: 未存在に対する DELETE が no-op となり、常に 204 を返す。

つまり header ベースの冪等性は存在せず、**PK 制約と DELETE no-op に暗黙依存**している。issue-982 ではこの状態を許容し、server 側 Idempotency-Key ストアの追加実装は scope 外として明示的に切り出した。

将来タスク（本仕様）は、server 側で Idempotency-Key を記録し、同一 key の再送に対してキャッシュ済みレスポンスを返す idempotency store / middleware を admin mutation 経路に配線する。issue-913 系の既存 idempotency 設計と名前空間・ストア層を乖離させないことが前提。

## 概要

admin mutation 経路に Idempotency-Key を server 側で処理する middleware と key 記録ストアを新設する。同一 key の再送に対して、初回実行時に保存したレスポンス（status + body）をそのまま返却し、副作用（DB write / audit）を二重実行させない。member tag write endpoint を最初の適用対象とし、他の admin mutation endpoint へ横展開できる汎用 middleware として実装する。

## 苦戦箇所【記入必須】

- **冪等性が PK 制約に暗黙依存している**: 現状は header を受理して server no-op であり、冪等性は `member_tags` の unique 制約（POST の `INSERT OR IGNORE`）と DELETE no-op に暗黙依存している。これは tag add/remove のように「同一 row への単純 upsert/delete」だから成立しているにすぎない。将来 PUT 全置換系（tag 集合の全置換）や、副作用を伴う mutation（複数 row 更新 + 外部通知 + audit 複合）を admin 経路に追加した時、header ベースの server 側冪等性が無いと **二重実行リスク**（重複 audit、重複通知、中間状態での再送による不整合）が顕在化する。どの粒度（endpoint 単位 / mutation 単位 / 全 admin write 一律）で middleware を適用するか、最初に決めないと後付けが困難。
- **issue-913 既存 idempotency 設計との整合が未確定**: issue-913 系で別途 idempotency 設計があるため、key の名前空間（key だけで一意か / `actor + method + path + key` で複合一意にするか）、ストア層（同一テーブルを共有するか / admin 専用に分けるか）、レスポンス再現の粒度（status のみ / status+body / header 含む）を issue-913 と揃える必要がある。乖離すると 2 系統の idempotency が並走し、運用・監査が分断される。本タスク着手前に issue-913 の設計正本を確認し、共有 or 分離の方針を確定させること。
- **ストアのインフラ判断が割れる（D1 vs KV）**: key 記録テーブルを D1 に増やすか、Cloudflare KV を使うかで判断が割れる。D1 は CLAUDE.md invariant #5（D1 直接アクセスは apps/api に閉じる）に沿い、TTL を自前 cleanup（cron / lazy expire）で実装する必要がある。KV は TTL native だが eventual consistency により「ほぼ同時の再送」に対して未コミット読みが起こりうる。冪等性の強さ（strong vs best-effort）の要件を先に固め、強整合が要るなら D1 トランザクション内で key を記録する設計にする。MVP では D1 を第一候補とし、KV は将来最適化として保留する想定だが、issue-913 のストア選択に合わせること。
- **レスポンス再現と TTL の境界**: 保存したレスポンスをどこまで再現するか（status / body / content-type）と、TTL 経過後の同一 key 再送をどう扱うか（新規実行扱いにするか / 410 を返すか）を決める必要がある。TTL 短すぎると再送保護が効かず、長すぎるとストアが肥大する。

## 目的

- admin mutation 経路に server 側 Idempotency-Key 処理を導入し、header ベースの冪等性を PK 制約への暗黙依存から解放する
- 同一 key の再送で副作用（DB write / audit）を二重実行させず、初回レスポンスを再現する
- issue-913 既存 idempotency 設計と名前空間・ストア層を共有または明示分離し、2 系統並走を避ける
- member tag write endpoint を最初の適用対象としつつ、他 admin mutation へ横展開できる汎用 middleware にする

## スコープ

含む:

- Idempotency-Key を処理する admin 用 middleware の新設（key 抽出 → ストア参照 → ヒット時はキャッシュ済みレスポンス返却 / ミス時は実行後にレスポンス記録）
- key 記録ストア層の追加（D1 第一候補。`apps/api/src/repository/` 配下に repository として実装）
- `apps/api/src/routes/admin/members.ts` の tag write endpoint（POST / DELETE）への middleware 配線
- TTL（期限切れ key の扱い）と key 名前空間（`actor + method + path + key` 複合一意を想定）の確定
- issue-913 既存 idempotency 設計との整合（共有テーブル or 専用テーブルの判断と理由記録）
- middleware の unit test + repository test（同一 key 再送で副作用が増えないこと / TTL 境界 / 名前空間衝突）
- admin tag write の contract test 更新（再送で audit row が増えないことを middleware 層でも担保）

含まない:

- `useAdminMutation` 側の変更（header 送出は既実装。client 側は無変更が原則）
- member_tags の PK 制約 / DELETE no-op の撤去（middleware 導入後も多層防御として残す）
- 公開側 (apps/web) mutation や Google Form ingest 経路への idempotency 適用
- KV への移行（D1 で要件を満たせる場合は将来最適化として保留）
- 新 D1 schema を伴う tag master 変更（issue-982 scope のまま）

## 受入条件 (Acceptance Criteria)

- AC-1: 同一 Idempotency-Key + 同一 `actor + method + path` の再送に対し、middleware が初回実行時に記録した stored レスポンス（status + body）をそのまま返却する
- AC-2: 再送時は副作用が二重実行されない（POST tag assign の audit row が 2 件目を記録しない / DB write が再実行されない）ことを test で assert
- AC-3: 初回実行（key 未記録）は通常通り endpoint handler を実行し、成功レスポンスを key とともにストアへ記録する
- AC-4: key 記録ストアは TTL を持ち、TTL 経過後の同一 key 再送は新規実行として扱う（または明示的に gone を返す）。TTL 値は定数として一元管理する
- AC-5: D1 をストアに使う場合、書き込みは `apps/api` 内に閉じる（CLAUDE.md 不変条件 #5 遵守。apps/web から D1 binding へ直接アクセスしない）
- AC-6: key 名前空間は `actor + method + path + key` の複合で一意化し、別 actor / 別 endpoint の同一 key 文字列が衝突しない
- AC-7: issue-913 既存 idempotency 設計とストア層・名前空間が整合する（共有なら同一テーブル / 分離なら理由を documentation-changelog に記録）
- AC-8: 既存 tag write endpoint の正常系・409（member_is_deleted）・404（member_not_found / tag_not_found）レスポンスに regression が無い
- AC-9: Idempotency-Key header を送らない呼び出しは従来通り（middleware は素通しで PK 制約による冪等性に委ねる）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| issue-913 設計と乖離し idempotency が 2 系統並走 | 着手前に issue-913 の設計正本を確認し、共有 / 分離の方針を確定。理由を documentation-changelog に記録 |
| D1 への key テーブル追加でストア肥大 | TTL + 定期 cleanup（cron or lazy expire）を設計に含め、TTL 値を定数で一元管理 |
| ほぼ同時の再送に対する race（未コミット読み） | D1 を選び、key 記録と副作用を同一トランザクション境界で扱う。KV は eventual consistency のため強整合要件下では非採用 |
| middleware 適用粒度の誤り（全 admin write 一律に効かせて副作用） | 最初は member tag write のみに opt-in 配線し、横展開は endpoint ごとに明示適用 |
| stored レスポンス再現の不完全（content-type / status ずれ） | 記録対象を status + JSON body に限定し、再現範囲を test で固定 |

## 検証方法

- apps/api unit: middleware の key 抽出 / ストアヒット時のキャッシュ返却 / ミス時の handler 実行 + 記録の 3 分岐 spec
- apps/api repository: key 記録ストアの insert / lookup / TTL 境界 / 名前空間複合一意の spec（D1 Vitest config）
- apps/api contract: tag write endpoint で同一 key 再送 → audit row が増えない / 副作用が二重化しないことを assert（既存 contract spec 拡張）
- regression: header 無し呼び出しが従来通り PK 制約冪等で動くこと / 409 / 404 / 正常系の維持

## 上流前提

- 親 issue-982 の member tag write endpoint（POST / DELETE）が実装済み（`apps/api/src/routes/admin/members.ts`）
- `useAdminMutation` の `Idempotency-Key` header 送出経路が既実装（`apps/web/src/features/admin/hooks/useAdminMutation.ts`）
- issue-913 系 idempotency 設計の正本を確認できること（名前空間 / ストア層の整合判断に必須）
- CLAUDE.md 不変条件 #5（D1 直接アクセスは apps/api に閉じる）を遵守できること

## 関連参照

- `apps/api/src/routes/admin/members.ts`（Idempotency-Key を受理するが server no-op な現状の tag write endpoint）
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`（`Idempotency-Key` header 送出側）
- `apps/api/src/repository/memberTags.ts`（`assignTagToMemberByAdmin` の `INSERT OR IGNORE` による暗黙冪等）
- `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/`（index.md / detection.md = 本タスクの scope-out 出典）
- issue-913 系 idempotency 設計（名前空間 / ストア層の整合先）

## GitHub Issue

- **既存 Issue #913 に集約（新規起票せず・重複回避）** — [#913](https://github.com/daishiman/UBM-Hyogo/issues/913) `[issue-842-followup-003-server-idempotency-key-persistence] Idempotency-Key を server (apps/api) で永続化し admin mutation を冪等化する`（state: CLOSED / status:unassigned = spec 化済・実装未了）。
- 本仕様（issue-982 由来）は #913 と同一スコープ（admin API server 側 Idempotency-Key 永続化 / middleware）であり、issue-982 の Phase 3 で 2 回確認した結果 #913 が既起票と判明したため新規 Issue は作成しない。本ファイルは #913 への issue-982 観点の補足（tag write における PK 暗黙依存と PUT 全置換系での二重実行リスク）として保持する。
- #913 既存 spec: `docs/30-workflows/unassigned-task/issue-842-followup-003-server-idempotency-key-persistence.md`
- 既存 labels（#913）: `priority:medium`, `scale:medium`, `status:unassigned`
