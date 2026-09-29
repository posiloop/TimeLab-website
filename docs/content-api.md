# 內容 API

給外部系統讀寫網站內容的 HTTP 端點。與後台介面寫入同一份資料、
共用同一組驗證規則，差別只在認證方式：後台走登入 session，這裡走金鑰。

> **這把金鑰能刪除所有前台內容，也能上傳檔案。** 沒有分級權限、沒有稽核紀錄，
> 也無法在不重新部署的情況下撤銷。外洩的後果等同把網站內容交出去；
> 上傳沒有頻率限制，每個 GIF 都會在伺服器上跑三次 ffmpeg 轉檔，大量上傳
> 會吃滿 CPU 並持續佔用 S3 空間。請比照資料庫密碼保管。若日後需要多方對接或可撤銷的憑證，
> 應改為資料庫裡的 ApiKey 表，而不是把這把金鑰分給更多人。

## 啟用

在 `.env` 設定金鑰，至少 32 字元：

```bash
openssl rand -base64 32
```

```
CONTENT_API_KEY="產生出來的值"
```

**未設定或短於 32 字元時，所有端點一律回 503。** 這是刻意的預設關閉 ——
「忘了設」與「不打算開」在環境變數上長得一模一樣，預設放行會讓一次疏漏
把整份內容曝露成可寫入。

## 認證

每個請求都要帶：

```
Authorization: Bearer <CONTENT_API_KEY>
```

金鑰比對採常數時間（`timingSafeEqual`），長度不符時也會先做一次等長比對
才回傳，避免回應時間洩漏金鑰內容。

## 資源

| 資源 | 對應內容 | 網站位置 |
|---|---|---|
| `hero` | 主視覺相框 | 最上方傾斜的三排 |
| `events` | 活動現場照 | 最下方的三排 |
| `frames` | 拍貼框動畫 | 中段會動的那排 |
| `cases` | 案例照片 | 五個分類底下的照片 |
| `categories` | 案例分類 | 首頁的分類卡片、案例頁的分類標題與副標 |
| `faq` | 常見問題 | FAQ 清單 |

`categories` 只能讀取與修改名稱（`label`）、副標（`tagline`），
**不開放新增與刪除**，送 `POST` 或 `DELETE` 會回 405：

- 刪除分類會連帶刪除底下所有案例照（資料庫設為 cascade），
  一個請求就能清掉幾十張照片
- 前台的連結、hash 白名單與 redirect 都寫死了這五個 slug，
  多一個或少一個分類都要一併改程式碼

新增案例照時需要的 `categoryId`，可以從 `GET /api/content/categories` 查到。

## 端點

| 方法 | 路徑 | 用途 |
|---|---|---|
| `GET` | `/api/content/<resource>` | 列出全部（分排、分類的先依範圍，再依 position） |
| `POST` | `/api/content/<resource>` | 新增一筆，接在最後 |
| `GET` | `/api/content/<resource>/<id>` | 取單筆 |
| `PATCH` | `/api/content/<resource>/<id>` | 只改送來的欄位 |
| `DELETE` | `/api/content/<resource>/<id>` | 刪除 |
| `PUT` | `/api/content/<resource>/order` | 重新排序，見「排序」 |
| `PUT` | `/api/content/<resource>/<id>/media` | 更換圖片或影片，見「換圖」 |
| `POST` | `/api/admin/upload`、`/api/admin/upload-video` | 上傳檔案，見「上傳」 |

用 `PATCH` 而非 `PUT`：外部系統多半只想改一個欄位（例如把某張照片下架），
`PUT` 的語義要求送出完整資源，漏送的欄位會被清成預設值。

### 新增時的必填欄位

```jsonc
// POST /api/content/faq
{ "question": "…", "answer": "…", "isVisible": true }

// POST /api/content/hero —— 一次加進三排，見下方「主視覺是三排一起」
{ "assetId": "…" }

// POST /api/content/events
{ "assetId": "…", "track": "TRACK_1", "displayWidth": 1013 }  // 高預設 760

// POST /api/content/cases
{ "categoryId": "…", "assetId": "…", "name": "標準 - 籃球隊" }

// POST /api/content/frames —— width/height 是「影片尺寸」而非版面尺寸
{ "alt": "…", "posterId": "…", "webmId": "…", "mp4Id": "…", "width": 610, "height": 910 }
```

`assetId` 等檔案 id 要先透過上傳取得，見下方「上傳」。

### 不開放修改的欄位

| 欄位 | 原因 |
|---|---|
| `position` | 排序有唯一約束，散著改會撞鍵。請用「排序」端點 |
| 分類的 `slug` | 首頁連結、社群貼文與名片上的網址都依賴它 |
| `assetId`、`coverId` 等檔案關聯 | 換圖有連帶效果，請用「換圖」端點 |
| `frames` 的 `slug`、`boxWidth`、`boxHeight` | 由伺服器推導，見下 |

`PATCH` 只送了這些欄位時會回 422 而非靜默成功，避免對接的人以為改掉了。

## 上傳

```bash
# 圖片：JPG / PNG / WebP，單檔 12MB
curl -X POST -H "Authorization: Bearer $KEY" \
  -F folder=cases -F "file=@photo.jpg" \
  https://timelabtw.com/api/admin/upload
# → { "id": "…", "url": "…", "width": 960, "height": 679, "reused": false }

# GIF：伺服器轉成 WebM、MP4 與封面圖，單檔 40MB，大檔可能要十幾秒
curl -X POST -H "Authorization: Bearer $KEY" \
  -F "file=@frame.gif" \
  https://timelabtw.com/api/admin/upload-video
# → { "posterId": "…", "webmId": "…", "mp4Id": "…", "gifId": "…", "width": 610, "height": 910, … }
```

`folder` 決定檔案放在 S3 的哪個資料夾，只接受
`hero`、`event`、`cases`、`case-covers`、`frames`。

這兩個端點與後台共用：有後台登入就用登入身分，沒有則檢查這把金鑰。
**上傳只是把檔案放上去，網站不會因此改變** —— 要顯示在網站上，還要拿回傳的
id 去新增項目或換圖。同一個檔案重複上傳會回傳既有的 id（`reused: true`），
不會在 S3 多存一份。

以金鑰上傳的檔案不記錄上傳者（`uploadedById` 為空）：金鑰不代表任何一個人。

## 排序

```jsonc
// PUT /api/content/faq/order
{ "ids": ["…", "…", "…"] }   // 新的完整順序
```

`ids` 必須是**同一個範圍的全部項目**，少送、多送、重複或混了範圍都會回 422，
錯誤訊息會列出缺了哪幾筆：

| 資源 | 一次排的範圍 |
|---|---|
| `hero`、`events` | 一排（`track` 相同的全部） |
| `cases` | 一個分類底下的全部 |
| `faq`、`frames` | 全部 |
| `categories` | 不開放（405），分類順序是版面設計的一部分 |

後台的拖曳清單永遠送整排，所以後台沒有這道檢查；外部呼叫方可能只送想移動的
那幾筆，不擋的話新編號會撞上沒送的項目，或把兩排編進同一組順序。

## 換圖

```jsonc
// PUT /api/content/<resource>/<id>/media
{ "assetId": "…" }                                        // hero、events、cases、categories
{ "posterId": "…", "webmId": "…", "mp4Id": "…", "gifId": "…" }   // frames
```

| 資源 | 換圖時的連帶效果 |
|---|---|
| `hero` | **三排一起換**。三排共用同一組相框，只換一排會讓圖庫多出一張只有那排才有的圖。新圖若已在主視覺裡會回 409。版面尺寸維持 275×410 |
| `events` | 高度不變，寬度照新圖比例重算 —— 沿用舊寬度會把比例不同的照片拉伸 |
| `cases` | 只換圖 |
| `categories` | 換的是封面 |
| `frames` | 角度與版面尺寸不動。`gifId` 沒給就清空，否則後台「下載原始 GIF」會下載到舊的那份 |
| `faq` | 沒有圖（405） |

檔案種類會逐一檢查：照片只接受 JPG、PNG、WebP（GIF 原檔未經壓縮，不上前台），
拍貼框的四個欄位必須分別是 `image/jpeg`、`video/webm`、`video/mp4`、`image/gif`。
填錯欄位在網站上會是一格播不出來的空白，所以寫入前就擋下。

舊檔案不會刪除，換錯了可以換回來。

### 伺服器推導的值

拍貼框的 `boxWidth` / `boxHeight` 是旋轉後的外接矩形，由版面尺寸與角度
唯一決定。改 `rotate` 或版面尺寸時會自動重算 —— 公式與後台的
`FramesEditor.boundingBox()` 相同，兩處不一致會讓同一個角度從不同入口
改出不同的保留空間，而保留不足時影片四角會被容器裁掉。

## 回應

成功：

```jsonc
{ "item": { … } }                              // 單筆，POST 回 201
{ "resource": "faq", "count": 5, "items": [] }  // 列表
{ "deleted": "<id>" }                           // 刪除
{ "items": [ … ] } / { "deleted": [ … ] }       // 主視覺：三排各一筆
```

每筆項目除了資料表的欄位，還會附上檔案網址與原始檔名，可以直接打開或
傳給使用者看：

| 資源 | 附加欄位 |
|---|---|
| `hero`、`events`、`cases` | `imageUrl`、`fileName` |
| `categories` | `coverUrl`、`coverFileName` |
| `frames` | `posterUrl`、`webmUrl`、`mp4Url`、`gifUrl`、`fileName` |

`fileName` 是上傳時的原始檔名（例如 `roll-07.png`）。主視覺與現場照的
`alt` 多半是空的，要辨認「哪一張」得靠檔名或直接看圖。

### 主視覺是三排一起

三排共用同一組相框、各自排序。所以主視覺的新增、修改、刪除、換圖都以
「一張相框」為單位，一次處理三排，並包在交易裡 —— 三排要嘛全部成功，
要嘛全部不動，不會留下只有某一排才有的相框：

| 操作 | 行為 |
|---|---|
| `POST` | 只收 `assetId`（可選 `alt`、`isVisible`），加進三排的最後面，版面尺寸沿用各排既有的值。送了 `track` 會回 422 |
| `PATCH` | 對任一排的 id 修改，三排的同一張一起改（例如隱藏） |
| `DELETE` | 對任一排的 id 刪除，三排的同一張一起刪 |
| 換圖 | 三排一起換 |

同一張圖已經在主視覺裡時，新增與換圖都會回 409。排序仍是一排一排排，
因為三排本來就刻意排成不同順序。

失敗一律是 `{ "error": "…" }`，驗證錯誤另帶 `issues` 逐欄說明：

| 狀態 | 意義 |
|---|---|
| 400 | 請求主體不是有效的 JSON |
| 401 | 金鑰缺少或不正確 |
| 404 | 未知的資源名稱，或該 id 不存在 |
| 405 | 該資源不開放這個方法（`categories` 的新增、刪除與排序，`faq` 的換圖） |
| 409 | 關聯不存在（`assetId` / `categoryId` 無效）或撞上約束 |
| 422 | 欄位驗證失敗，或沒有任何可更新的欄位 |
| 503 | `CONTENT_API_KEY` 未設定，端點等同關閉 |

## 快取

每次寫入都會呼叫 `revalidateContent()`，與後台走同一個失效入口，
所以 API 改完前台立即生效，不需要另外清快取或重新部署。

## 刪除不會清掉媒體檔

後台刪除拍貼框時會一併清掉不再被引用的 S3 檔案，這個 API **刻意不跟進**。

外部系統誤刪一筆內容，重新 `POST` 一次就能復原（asset 還在，上傳端點本來
就以 checksum 去重）；連檔案一起刪掉就真的救不回來了。代價是留下沒有內容
引用的 asset —— 那是可以事後清理的磁碟空間，比不可逆的資料遺失便宜得多。

## 範例

```bash
KEY="你的金鑰"
BASE="https://timelabtw.com/api/content"

# 列出常見問題
curl -H "Authorization: Bearer $KEY" $BASE/faq

# 新增一則
curl -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"question":"可以指定拍貼框嗎？","answer":"可以，請於預約時告知。"}' \
  $BASE/faq

# 下架某一則（不刪除，資料仍保留）
curl -X PATCH -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"isVisible":false}' $BASE/faq/<id>
```
