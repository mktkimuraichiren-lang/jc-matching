# 関東JC ビジネスマッチング アプリ

1都7県・2000名規模の異業種交流会向け ビジネスマッチングWebアプリです。
スマートフォンのブラウザからそのまま使えます（インストール不要）。

---

## 📁 ファイル構成

```
jc-matching/
├── index.html          ← 参加者用アプリ（メイン）
├── admin.html          ← 運営管理ダッシュボード
├── api/
│   └── notify.js       ← LINE通知サーバーレス関数
├── supabase_schema.sql ← Supabase テーブル定義
└── README.md           ← このファイル
```

---

## 🚀 セットアップ手順

### STEP 1 — Supabase プロジェクト作成

1. https://supabase.com にアクセスしてアカウント作成（無料）
2. 「New project」からプロジェクトを作成
3. 「SQL Editor」を開き、`supabase_schema.sql` の内容を貼り付けて実行
4. 「Project Settings → API」から以下をコピー：
   - **Project URL**（例: https://abcdefgh.supabase.co）
   - **anon public key**（長い文字列）

### STEP 2 — アプリに設定を反映

`index.html` と `admin.html` の冒頭 CONFIG 部分を編集：

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'  // ← Supabase URLに変更
const SUPABASE_KEY = 'YOUR_ANON_KEY'                      // ← anon keyに変更
```

`admin.html` のパスワードも変更してください：
```javascript
const ADMIN_PASSWORD = 'admin2024'  // ← 必ず変更！
```

### STEP 3 — Vercel にデプロイ（無料）

1. https://vercel.com でアカウント作成
2. GitHubにこのフォルダをリポジトリとしてアップロード
3. Vercelで「Import Git Repository」してデプロイ
4. デプロイ完了後、生成されたURLをQRコードにして会場に掲示

**または、** ファイルをそのままサーバーにアップロードするだけでも動作します。

---

## 📱 LINE通知のセットアップ（任意）

### LINE Developers 設定

1. https://developers.line.biz/ にアクセス
2. 「Messaging API」チャネルを作成
3. 「Channel access token（long-lived）」を発行・コピー

### 環境変数の設定（Vercel）

Vercelの「Settings → Environment Variables」に以下を追加：

| 変数名 | 値 |
|--------|-----|
| `SUPABASE_URL` | SupabaseのProject URL |
| `SUPABASE_SERVICE_KEY` | SupabaseのService Role Key |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINEのChannel Access Token |
| `APP_URL` | VercelのアプリURL |

### index.html の LINE_NOTIFY_PROXY を設定

```javascript
const LINE_NOTIFY_PROXY = 'https://your-app.vercel.app/api/notify'
```

### LINEユーザーIDの収集方法

参加者にLINE公式アカウントを友だち追加してもらうと、
Webhook経由でユーザーIDを取得できます。
→ 詳細: https://developers.line.biz/ja/docs/messaging-api/receiving-messages/

---

## 👤 管理ダッシュボードの使い方

`admin.html` にアクセスし、設定したパスワードでログイン。

| 機能 | 説明 |
|------|------|
| 概要 | リアルタイムKPI・都道府県/職業別グラフ |
| 参加者一覧 | 全参加者を検索・フィルタ・CSV出力 |
| マッチング状況 | 申請・承認・辞退の一覧とCSV出力 |
| 分析 | 近隣県間マッチング・職業部門間傾向 |

---

## 🔧 マッチングスコアのロジック

| 要素 | 重み | 満点 |
|------|------|------|
| 職業部門の近さ | 65% | 同一部門=100点、同系統=65点、異系統=20点 |
| 都道府県の近さ | 35% | 同県=40点、近隣県=80点、遠方=15点 |

**近隣県の定義：**
- 東京都 ↔ 神奈川・千葉・埼玉
- 埼玉県 ↔ 東京・群馬・栃木・茨城
- 千葉県 ↔ 東京・茨城
- 神奈川県 ↔ 東京・山梨
- 群馬県 ↔ 埼玉・栃木・山梨
- 栃木県 ↔ 埼玉・群馬・茨城
- 茨城県 ↔ 千葉・埼玉・栃木
- 山梨県 ↔ 神奈川・群馬

---

## 📋 当日の運用フロー

```
1. 会場入口にQRコードポスター掲示
   └── QRコード → index.html のURL

2. 参加者がスマホでQRを読み取り
   └── その場で登録（1〜2分）

3. マッチングタブでスコア順に相手を閲覧

4. 気になる相手に「コネクション申請」

5. 相手が「承認」するとコネクション成立
   └── LINE通知が届く（設定時）

6. 運営はadmin.htmlでリアルタイム確認
   └── CSV出力で事後分析も可能
```

---

## 💡 カスタマイズのヒント

- **イベントタイトル変更**: `index.html` の `<title>` と `<div class="header-title">` を編集
- **職業部門の追加**: `<select id="f-dept">` の `<option>` を追加
- **都道府県の変更**: 全国展開する場合は `NEIGHBORS` マップを更新
- **カラーテーマ変更**: `--blue: #185FA5` を好みの色に変更
- **スコアの重み調整**: `calcScore()` 関数内の `0.65` と `0.35` の係数を変更

---

## 🛡️ セキュリティ注意事項

- `ADMIN_PASSWORD` は必ず変更してください（デフォルト: admin2024）
- 本番環境では Supabase の Row Level Security をより厳密に設定することを推奨
- LINE Channel Access Token は環境変数で管理し、コードに直接書かないこと
- Supabase の Service Role Key はサーバーサイドのみで使用すること

---

## 📞 技術スタック

| 技術 | 用途 |
|------|------|
| HTML/CSS/JavaScript | フロントエンド（フレームワーク不要） |
| Supabase | データベース・リアルタイム通信 |
| Vercel | ホスティング・サーバーレス関数 |
| LINE Messaging API | プッシュ通知 |
| QRCode.js | QRコード生成 |

---

## ライセンス

MIT License — 自由に改変・商用利用可能です。
