# Meeting Room Estimator

貸し会議室の利用時間・人数・備品・飲み物から概算料金を計算し、見積もりを保存するアプリケーションです。

## 技術構成

- Next.js（App Router）/ React / TypeScript
- Tailwind CSS
- Supabase（認証・PostgreSQL・Storage）
- Prisma（Supabase PostgreSQLへの型安全なサーバーサイドアクセス）

## セットアップ

Node.js 20.9以上を用意し、次のコマンドを実行します。

```bash
cp .env.example .env.local
npm install
npm run prisma:generate
npm run db:setup
npm run storage:seed -- --linked
npm run dev
```

ブラウザで <http://localhost:3000> を開きます。Supabaseを利用する機能を実装する前に、`.env.local` の各値を自身のSupabaseプロジェクトの値へ置き換えてください。Storage の Seed を初めて実行する場合は、先に `npx supabase login` と `npx supabase link --project-ref <project-ref>` で対象プロジェクトをリンクしてください。

## コマンド

| コマンド                  | 用途                                         |
| ------------------------- | -------------------------------------------- |
| `npm run dev`             | 開発サーバーを起動                           |
| `npm run build`           | 本番用にビルド                               |
| `npm run preview`         | ビルド済みアプリを本番相当で起動             |
| `npm run lint`            | ESLintによる静的解析                         |
| `npm run format`          | Prettierによる整形                           |
| `npm run format:check`    | フォーマットを変更せず検査                   |
| `npm run prisma:generate` | Prisma Clientを生成                          |
| `npm run prisma:validate` | Prismaスキーマを検査                         |
| `npm run db:setup`        | SupabaseへマイグレーションとSeedを順番に適用 |
| `npm run storage:seed`    | Storage bucketとサンプル画像を同期           |

## ディレクトリ

```text
prisma/              Prismaスキーマ
src/
  app/               画面・レイアウト（App Router）
  components/        共通UI（機能実装時に追加）
  features/          機能単位のコード（機能実装時に追加）
  lib/                Prisma・Supabaseなどの共通処理
doc/                  設計資料
supabase/migrations/  DB・RLS・トリガー・Seedの再現可能なSQL
```

## データベースの初期化

`.env` に `DATABASE_URL` と `DIRECT_URL` を設定したうえで、次を実行します。

```bash
npm run db:setup
```

このコマンドは `supabase/migrations` のSQLを名前順に適用します。SQLは繰り返し実行でき、公開マスターの読み取り、ユーザー固有データのRLS、ユーザー登録時のプロフィール作成、開発用Seedを含みます。

## 会議室画像Storage

`meeting-room-images` は公開読み取り専用のbucketです。画像URLを知っている未認証ユーザーは画像を表示できますが、`anon` / `authenticated` にはbucket単位の制限ポリシーを設定しているため、一般ユーザーはアップロード・更新・削除できません。

bucket設定と `meeting_rooms.image_path` は `npm run db:setup` で反映されます。リポジトリ内の `supabase/storage/meeting-room-images` にある画像実体は、次のコマンドでリンク済みプロジェクトへ同期します。

```bash
npm run storage:seed -- --linked
```

ローカルSupabaseへ同期する場合は `--linked` の代わりに `--local` を指定します。アプリは `image_path` から Supabase の公開URLを生成して会議室一覧に表示します。

## SupabaseとPrismaの役割

Supabaseは認証、PostgreSQLデータベース、会議室画像のStorageを提供します。ブラウザやServer ComponentsからSupabaseを利用できるよう、`src/lib/supabase` にクライアントを用意しています。

PrismaはNext.jsのサーバー側からSupabase PostgreSQLへアクセスするために使用します。`.env.local` の `DATABASE_URL` にはアプリ実行用のTransaction pooler、`DIRECT_URL` にはマイグレーション用の直接接続文字列を設定してください。ER図のモデル化とマイグレーションはDB実装タスクで行います。
