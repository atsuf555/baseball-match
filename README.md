# BaseHub — 草野球チーム運営サービス

草野球チームの出欠管理をシンプルにするWebサービスです。

## 現在の実装状況

| 機能 | 状態 |
|------|------|
| Googleログイン | ✅ 実装済み |
| チーム作成 | ✅ 実装済み |
| チーム一覧表示 | ✅ 実装済み |
| チーム参加（招待コード） | ✅ 実装済み |
| 試合作成・出欠管理 | 未実装 |
| 助っ人募集 | 未実装 |

---

## ローカル開発環境のセットアップ

### 必要なもの

- Node.js v20 以上
- Docker Desktop（PostgreSQL 用）
- Google アカウント（OAuth 認証情報の取得用）

---

### 手順

#### 1. 依存関係のインストール

```bash
npm install
```

#### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を開き、各変数を設定します（後述）。

#### 3. PostgreSQL を起動

##### 方法A: Docker（Docker Desktop がある場合）

```bash
docker compose up -d
```

起動確認：
```bash
docker compose ps
# postgres が "healthy" になっていることを確認
```

##### 方法B: Homebrew のネイティブ PostgreSQL（Docker を使わない場合）

Docker が無い環境では Homebrew の PostgreSQL でも代用できます。

```bash
# PostgreSQL 16 をインストール（未導入の場合）
brew install postgresql@16

# サービスとして起動（再起動後も自動起動）
brew services start postgresql@16

# データベースを作成
createdb baseball_match

# .env.local の DSN（postgres:postgres）に合わせてロールを作成
psql -d baseball_match -c "CREATE ROLE postgres LOGIN SUPERUSER PASSWORD 'postgres';"
```

起動確認：
```bash
pg_isready -h localhost -p 5432
# "accepting connections" と表示されれば OK
```

#### 4. Google OAuth 認証情報の取得

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) を開く
2. 「認証情報を作成」→「OAuth 2.0 クライアント ID」を選択
3. アプリケーションの種類: **ウェブアプリケーション**
4. 承認済みのリダイレクト URI に追加:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. 作成後に表示される **クライアントID** と **クライアントシークレット** をメモ

#### 5. `.env.local` の設定

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/baseball_match"

AUTH_SECRET="任意の文字列（openssl rand -base64 32 で生成推奨）"
AUTH_GOOGLE_ID="手順4で取得したクライアントID"
AUTH_GOOGLE_SECRET="手順4で取得したクライアントシークレット"
```

`AUTH_SECRET` の生成コマンド（ターミナルで実行）：
```bash
openssl rand -base64 32
```

#### 6. データベースのマイグレーション

> **注意:** Prisma CLI は `.env` は自動で読み込みますが、Next.js 用の `.env.local` は読み込みません。
> そのため `.env.local` を明示的に読み込んでから実行します（読み込まないと
> `Environment variable not found: DATABASE_URL` エラーになります）。

```bash
set -a && source .env.local && set +a && npx prisma db push
```

> 毎回入力したくない場合は、`.env` を `.env.local` へのシンボリックリンクにしておくと
> 以降は `npx prisma db push` だけで動きます（`prisma studio` など他コマンドも同様）：
> ```bash
> ln -s .env.local .env
> ```

成功すると以下のような出力が表示されます：
```
✓ Generated Prisma Client
The database is now in sync with your Prisma schema.
```

#### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 動作確認手順

### 1. Googleログイン

1. `http://localhost:3000` を開く
2. 「Googleでログイン」ボタンをクリック
3. Google アカウントを選択してログイン
4. `/dashboard` にリダイレクトされることを確認

**確認ポイント：**
- ランディングページにアプリ名とログインボタンが表示される
- ログイン後にダッシュボードに遷移する
- 未ログインで `/dashboard` に直接アクセスすると `/` にリダイレクトされる
- ログイン済みで `/` にアクセスすると `/dashboard` にリダイレクトされる

---

### 2. チーム作成

1. ダッシュボードの「+ チームを作成」ボタンをクリック
2. チーム名を入力（例: 渋谷ベアーズ）
3. 説明を入力（任意）
4. 「チームを作成する」をクリック
5. ダッシュボードに戻り、作成したチームが表示されることを確認

**確認ポイント：**
- チーム名が空のまま送信するとエラーが表示される（「チーム名を入力してください」）
- 51文字以上のチーム名を入力するとエラーが表示される
- 作成成功後にダッシュボードへリダイレクトされる
- 複数チームを作成して、すべてが一覧に表示されることを確認する

---

### 3. チーム一覧表示

**確認ポイント：**
- 作成したチームが一覧に表示される
- チームカードに以下が表示される：
  - チーム名
  - 「管理者」バッジ（自分が作成したチームは管理者）
  - 説明文（入力した場合）
  - メンバー数（「メンバー 1人」）
  - 6文字の招待コード（`A3K9ZR` のような形式）
- 招待コードの「コピー」をクリックするとクリップボードにコピーされ「コピー済み ✓」に変わる
- チームがない状態ではエンプティステートが表示される

---

### 4. チーム詳細・招待コードの確認

ダッシュボードのチームカード（チーム名）をタップすると `/teams/[teamId]` のチーム詳細画面に遷移します。

- [ ] チームカードをタップするとチーム詳細画面が開く
- [ ] 説明文・メンバー一覧（名前・アイコン・役割バッジ）が表示される
- [ ] 自分の行に「（あなた）」が表示される
- [ ] **管理者の場合のみ** 招待コードが表示される
- [ ] 招待コードの「コピー」をタップするとコピーされ「コピー済み ✓」に変わる
- [ ] **管理者でない（PLAYER）メンバー**には招待コードが表示されない
- [ ] 所属していないチームの `/teams/[teamId]` に直接アクセスすると 404 になる
- [ ] 存在しない teamId にアクセスすると 404 になる

---

### 5. チーム参加（招待コード）

別の Google アカウントでログインし直すと、参加フローを確認しやすいです。

#### 参加の成功

1. ダッシュボード右上の「参加」ボタン（またはエンプティステートの「招待コードで参加する」）をタップ
2. `/teams/join` の招待コード入力画面が開く
3. 管理者から共有された6文字の招待コードを入力（小文字で入力しても自動で大文字になる）
4. 「チームに参加する」をタップ

- [ ] 「参加」ボタンから招待コード入力画面に遷移する
- [ ] 入力欄が大文字・等幅フォントで表示される
- [ ] 正しい招待コードで参加すると、そのチームの詳細画面 `/teams/[teamId]` にリダイレクトされる
- [ ] 参加後、ダッシュボードの所属チーム一覧にそのチームが追加される
- [ ] 参加したメンバーの役割は「メンバー」（PLAYER）になっている

#### エラーハンドリング

- [ ] 空のまま送信すると「招待コードを入力してください」が表示される
- [ ] 存在しない招待コードを入力すると「招待コードが正しくありません」が表示される
- [ ] **すでに参加済み**のチームの招待コードを入力すると「すでにこのチームに参加しています」が表示される
- [ ] エラー時は画面が遷移せず、入力した内容が残る

#### API 単体での確認（オプション）

ログイン済みのブラウザの DevTools コンソールから直接 API を叩いて確認できます：

```js
await fetch("/api/teams/join", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ inviteCode: "ABC123" }),
}).then((r) => r.json())
```

- [ ] 正しいコード → `201` と `{ ok: true, teamId }`
- [ ] 存在しないコード → `404` と `{ error: "招待コードが正しくありません" }`
- [ ] 参加済み → `409` と `{ error: "すでにこのチームに参加しています", teamId }`
- [ ] 未ログイン状態 → `401` と `{ error: "ログインが必要です" }`

---

## データベース確認（オプション）

Prisma Studio でデータを直接確認できます（手順6と同じく `.env.local` を読み込みます）：

```bash
set -a && source .env.local && set +a && npx prisma studio
```

ブラウザで `http://localhost:5555` を開くと、DB の内容を GUI で確認できます。

---

## Vercel へのデプロイ（本番環境）

1. [Vercel](https://vercel.com) でプロジェクトを作成してリポジトリを接続
2. Vercel Postgres を作成してプロジェクトに接続（`DATABASE_URL` が自動設定される）
3. 以下の環境変数を Vercel ダッシュボードで設定：
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
4. Google Cloud Console でリダイレクト URI を追加：
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```
5. デプロイ後のターミナルで以下を実行してスキーマを適用：
   ```bash
   npx prisma db push
   ```

---

## 技術スタック

| 技術 | 用途 |
|------|------|
| Next.js 16 App Router | フレームワーク |
| TypeScript | 言語 |
| Auth.js v5 | 認証（Google OAuth） |
| Prisma 7 | ORM |
| PostgreSQL 16 | データベース |
| Tailwind CSS | スタイリング |
| Vercel | ホスティング |
