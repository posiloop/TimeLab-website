# 內容管理後台

讓非技術人員自行更新網站的輪播圖片、活動案例照片與常見問題，
儲存後線上立即生效。

## 可管理的內容

| 後台頁面 | 對應網站位置 |
|---|---|
| 首頁主視覺 | 最上方傾斜的三排相框（12 張，三排各自排序） |
| 活動現場照 | 最下方的三排現場照（三排各 7 張，不共用） |
| 拍貼框動畫 | 中段會動的拍貼框（5 組，上傳 GIF 即可更換） |
| 活動案例 | 五個分類與各自的案例照（84 張） |
| 常見問題 | FAQ 問答清單 |

---

## 首次設定

### 1. 環境變數

複製 `.env.example` 為 `.env` 並填入實際值：

```bash
cp .env.example .env
openssl rand -base64 32   # 產生 BETTER_AUTH_SECRET
```

`NEXT_PUBLIC_MEDIA_URL` 與 `NEXT_PUBLIC_SITE_URL` 會在 **build 時**寫進
前端程式碼，執行期才設定是讀不到的 —— Docker 部署時要透過 build arg 傳入
（`compose.yaml` 已設定好）。

### 2. AWS S3

完整步驟見 **[s3-setup.md](./s3-setup.md)**，摘要：

1. 建 bucket（台北 `ap-east-2`），取消 Block all public access
2. Bucket policy 只開放讀取 `media/*`
3. 建 IAM 使用者，只給 `s3:PutObject` 與 `s3:DeleteObject`
4. 把金鑰與 `NEXT_PUBLIC_MEDIA_URL` 填進 `.env`

一開始直連 S3 即可，不需要 CloudFront —— 媒體總量約 22MB，
且 `next/image` 會在伺服器端先抓原圖再最佳化，訪客不會直接連到 S3。
日後要換成 CloudFront 只需改 `NEXT_PUBLIC_MEDIA_URL` 一個值，
因為資料庫只存 S3 key，完整網址在 `app/server/s3.ts` 的 `mediaUrl()` 組成。

檔案的 S3 key 帶內容雜湊，同一個 key 的內容永不改變，
所以上傳時設了 `max-age=31536000, immutable` —— 換圖是產生新 key，
瀏覽器不會拿到過期的舊圖。

### 3. 資料庫與內容匯入

```bash
bun run db:deploy      # 建立資料表
bun run seed:content   # 把現有圖片上傳到 S3 並寫入資料庫
```

`seed:content` 分六個階段執行，最後會把資料讀回來與遷移前的內容
逐欄位比對，**全部相符才算成功**。可先用 `--dry-run` 檢查檔案是否齊全：

```bash
bun --env-file=.env prisma/seed/migrate-content.ts --dry-run
```

腳本以檔案的 sha256 去重，重複執行不會重傳或重複建立資料。

### 4. 建立第一個帳號

後台不開放對外註冊，第一個帳號只能用腳本建立：

```bash
# 先在 .env 設定 SEED_ADMIN_EMAIL 與 SEED_ADMIN_PASSWORD（至少 12 字）
bun run seed:admin
```

建立完請把 `SEED_ADMIN_PASSWORD` 從 `.env` 移除。
之後要加帳號，在後台的「帳號管理」頁新增即可。

---

## 日常使用

到 `/login` 登入後進入 `/admin`。

- **拖曳**縮圖可調整順序，調整後畫面底部會出現「儲存並更新網站」。
  沒按儲存就離開頁面，瀏覽器會出聲提醒。
- **顯示開關**關掉的項目不會出現在網站上，但資料仍保留，隨時可以開回來。
- **上傳**支援一次選多張，單檔上限 12MB。
  上傳前會先顯示縮圖與尺寸，確認無誤再送出。
  其中一張失敗不會中斷其餘，失敗的會標紅可重試。

### 幾個要注意的地方

**主視覺的三排共用同一組圖片。** 上傳新相框會自動加進三排的最後面，
刪除則是三排一起移除（刪除前會顯示用在哪幾排）。
網站上一律以 275 × 410 呈現，這樣相框間距才會一致 ——
原始檔案的尺寸其實不完全相同，但不影響顯示。

**活動現場照的寬度各不相同**，這是正常的。
網站把高度統一成 760，寬度照原圖比例縮放。
若某張的版面寬度與檔案比例對不上，後台會標黃字提醒。

**分類的網址代號（brand、wedding…）不開放修改。**
它被首頁連結、社群貼文與名片上的網址依賴，
改了之後舊連結不會 404，而是靜默導向錯誤的分類。

**拍貼框動畫直接上傳 GIF 即可。**
伺服器會自動轉成網頁播放用的 WebM、MP4 與封面圖，
不用自備三個檔案。轉檔約需幾秒，完成後會顯示壓縮結果。
這麼做是因為 GIF 直接上站太肥：現有五組素材的 GIF 原檔共 30MB，
轉成影片後只剩 1.5MB。

---

## 技術細節

### 為什麼上傳走 API 而非 server action

Server Action 的 request body 上限 1MB，而這裡的圖片幾乎都會超過；
且從瀏覽器呼叫 server action 是**序列**執行的，一次傳 84 張會排隊。
所以上傳走 route handler，而「把圖掛到某一軌」這類資料寫入留在 server
action —— 只有後者能在同一次往返就更新畫面。

### 「立即生效」的實作

前台用 `unstable_cache` 快取資料庫查詢，正常情況不會每次請求都查詢。
內容異動時呼叫 `app/server/content/revalidate.ts` 的 `revalidateContent()`，
它同時做兩件事：

```ts
revalidateTag(TAGS[section], { expire: 0 });  // 快取條目立即過期
revalidatePath(path);                          // 頁面層的 RSC payload 失效
```

`{ expire: 0 }` 不可換成官方標示為 recommended 的 `"max"` ——
後者只把快取標記為過時，第一位訪客仍會拿到舊內容，
要第二次重新整理才對。**請一律透過 `revalidateContent()`**，
不要在其他地方直接呼叫 `revalidateTag`。

### GIF 轉影片

後台只讓使用者上傳一個 GIF，`app/server/gif-to-video.ts` 用 ffmpeg
轉成三個檔案（輸出寬度固定 610，與現有素材一致）：

| 輸出 | 編碼參數 | 用途 |
|---|---|---|
| WebM | VP9、`-b:v 0 -crf 40` | 主要來源 |
| MP4 | H.264、`-crf 30`、`+faststart` | Safari 後援 |
| JPG | 第一幀、`-q:v 4` | 自動播放被擋時的底圖 |

實測五組素材：30.03MB → 1.54MB，每組約 1.3 秒。

`scale=610:-2` 的 `-2` 是讓高度依比例計算並取偶數 ——
H.264 的 yuv420p 要求長寬皆為偶數，奇數會讓 ffmpeg 直接失敗。

遷移腳本則刻意沿用 `public/videos/` 既有的檔案而非重新轉檔 ——
遷移的目標是外觀完全不變，重新編碼會引入不必要的變數。

### 權限

三層，缺一不可：

1. `proxy.ts` —— 看 cookie 在不在，決定要不要導向登入頁（僅為體驗）
2. `app/(admin)/admin/layout.tsx` —— 驗證 session 才渲染頁面
3. **每個 action 與 route handler 各自 `requireSession()`** —— 真正的防線

第三層不能省：每個 server action 都是對其所在路由的公開 POST 端點，
而 proxy 的 matcher 一旦調整，可能連帶讓某些路由失去保護。

`auth.ts` 的 `disableSignUp: true` 也不可移除，
否則 `/api/auth/sign-up/email` 會對全世界開放註冊。

### 資料模型的關鍵切分

`MediaAsset` 記錄「檔案客觀上是什麼」（S3 位置、真實像素、雜湊），
各展示表記錄「要怎麼擺」（displayWidth/Height、rotate、位置）。

**兩者刻意互不推導。** 主視覺的 12 張原檔實際有三種尺寸
（1920×2860、1048×1561、1048×1563），版面卻必須統一成 275×410；
若讓顯示尺寸跟著檔案走，換算後的寬會出現 274.87 與 275.25 的落差，
疊加 16px 間距與 −6° 傾斜後，相框間距會參差，
跑馬燈的無縫接點也會對不齊。

### 排序

`position` 以 1000 為間隔稀疏配置，拖曳時取前後鄰居的中間值，
單次移動通常只需改一列。`(track, position)` 有唯一約束，
所以重排時先把整批挪到負數區再寫入正式值，避免中途撞鍵。

拖曳用 dnd-kit 而非原生 HTML5 drag events —— 後者在觸控裝置上完全無效，
而後台需要能在 iPad 上操作。

---

## 疑難排解

**後台改完網站沒更新**
檢查該操作是否經由 `revalidateContent()`。
若看到「第一次沒更新、重新整理才對」，多半是某處直接用了
`revalidateTag(tag, "max")`。

**上傳圖片失敗（正式環境）**
`sharp` 的二進位檔與作業系統綁定。Dockerfile 的 runner 階段會安裝
alpine 對應的版本並加上 `libc6-compat`，若自行調整過需確認這兩項還在。

**上傳 GIF 失敗，顯示「伺服器未安裝 ffmpeg」**
Dockerfile 的 runner 階段會 `apk add ffmpeg`，若自行調整過請確認還在。
本機開發則需 `brew install ffmpeg`。

**手機拍的照片方向不對**
上傳時已依 EXIF orientation 校正寬高（5–8 代表旋轉存檔，寬高需對調）。
若仍有問題，請提供原始檔案。

**`prisma` 指令報找不到 DATABASE_URL**
Prisma 7 起不再自動載入 `.env`，請用 `package.json` 裡的 `db:*` 指令，
它們已經帶上 `bun --env-file=.env`。
