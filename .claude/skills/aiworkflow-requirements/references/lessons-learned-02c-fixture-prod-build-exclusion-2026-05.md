# Lessons Learned — 02c fixture/test production build exclusion

## L-02CFU2-001: code/config diff がある workflow は implementation へ昇格する

`docs-only / spec_created` で作った follow-up でも、`apps/` や root config に実装差分が入った時点で
workflow metadata を `implementation / implemented-local` に更新する。Phase 12 compliance では
changed files と metadata の矛盾を gate にする。

## L-02CFU2-002: full-suite PASS と scope PASS を分けて書く

既存 test failure がある場合、影響範囲内 regression がないことは記録してよいが、AC の full
`pnpm test` PASS と混同しない。FULL PASS でない場合は PARTIAL とし、同一 wave で follow-up を作る。

## L-02CFU2-003: wrangler dry-run substitute は明示する

direct esbuild bundle grep は到達性確認として有効だが、`wrangler deploy --dry-run` の代替であることを
Phase 11 / Phase 12 に明記する。production readiness の実 dry-run evidence は別 task に分離する。

## L-02CFU2-004: dep-cruiser rule は通常 lint 経路に接続する

`.dependency-cruiser.cjs` に rule を追加しただけでは CI gate ではない。root `lint` など既存品質ゲートから
実行される script を同一 wave で追加し、manual-only の境界を残さない。

## L-02CFU2-005: prod build 隔離は tsconfig 分離で行い `noEmit:true` を維持する

prod boundary を `tsconfig.json` の `exclude` に直接書くと test や IDE 体験が壊れる。`tsconfig.build.json`
を separate document として用意し、`extends` した上で `exclude` に `**/*.test.ts` / `**/*.spec.ts` /
`**/__tests__/**` / `**/fixtures/**` / `**/__fixtures__/**` を集約する。`noEmit:true` を維持して typecheck
gate 専用とし、bundle 生成は `wrangler` / `esbuild` に委ねることで責務を分離する。

## L-02CFU2-006: dep-cruiser の `options.exclude` と rule scope は反転関係になる

`options.exclude` を fixture/test に narrow すると rule の評価対象に fixture/test が含まれるようになり、
`no-prod-to-fixtures-or-tests` rule の `from`（prod）→ `to`（fixture/test）違反検出が初めて成立する。
fixture/test 全体を `options.exclude` に残したまま rule を書くと、rule は永続的に空集合に対して評価されて
sleeper rule になる。narrow exclude と rule scope の反転は同一 wave で同期する。

## L-02CFU2-007: 不変条件 #6（prod≠test fixture）は build / lint / runtime の三重防御で固定する

build = `tsconfig.build.json` exclude、lint = dep-cruiser rule（root `lint:deps`）、runtime = miniflare
test-only binding。いずれか単独では穴が残る（lint だけでは bundler に乗る、build だけでは指摘が遅れる、
runtime 分離だけでは prod source からの import を許す）。三層を同時にドキュメントへ書かないと
いずれか欠落で再発する。
