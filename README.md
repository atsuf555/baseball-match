# BaseHub — 草野球チーム運営サービス

草野球チームの出欠管理をシンプルにするWebサービスです。

## 現在の実装状況

| 機能 | 状態 |
|------|------|
| Googleログイン | ✅ 実装済み |
| チーム作成 | ✅ 実装済み |
| チーム一覧表示 | ✅ 実装済み |
| チーム参加（招待コード） | 未実装 |
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

#### 3. PostgreSQL を起動（Docker）

```bash
docker compose up -d
```

起動確認：
```bash
docker compose ps
# postgres が "healthy" になっていることを確認
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

```bash
npx prisma db push
```

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

## データベース確認（オプション）

Prisma Studio でデータを直接確認できます：

```bash
npx prisma studio
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
