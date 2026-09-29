# 內容 API

給外部系統讀寫網站內容的 HTTP 端點。與後台介面寫入同一份資料、
共用同一組驗證規則，差別只在認證方式：後台走登入 session，這裡走金鑰。

> **這把金鑰能刪除所有前台內容。** 沒有分級權限、沒有稽核紀錄，
> 也無法在不重新部署的情況下撤銷。外洩的後果等同把網站內容交出去，
> 請比照資料庫密碼保管。若日後需要多方對接或可撤銷的憑證，
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
| `faq` | 常見問題 | FAQ 清單 |

## 端點

| 方法 | 路徑 | 用途 |
|---|---|---|
| `GET` | `/api/content/<resource>` | 列出全部，依 position 排序 |
| `POST` | `/api/content/<resource>` | 新增一筆，接在最後 |
| `GET` | `/api/content/<resource>/<id>` | 取單筆 |
| `PATCH` | `/api/content/<resource>/<id>` | 只改送來的欄位 |
| `DELETE` | `/api/content/<resource>/<id>` | 刪除 |

用 `PATCH` 而非 `PUT`：外部系統多半只想改一個欄位（例如把某張照片下架），
`PUT` 的語義要求送出完整資源，漏送的欄位會被清成預設值。

### 新增時的必填欄位

```jsonc
// POST /api/content/faq
{ "question": "…", "answer": "…", "isVisible": true }

// POST /api/content/hero
{ "assetId": "…", "track": "TRACK_1", "displayWidth": 275, "displayHeight": 410 }

// POST /api/content/events
{ "assetId": "…", "track": "TRACK_1", "displayWidth": 1013 }  // 高預設 760

// POST /api/content/cases
{ "categoryId": "…", "assetId": "…", "name": "標準 - 籃球隊" }

// POST /api/content/frames —— width/height 是「影片尺寸」而非版面尺寸
{ "alt": "…", "posterId": "…", "webmId": "…", "mp4Id": "…", "width": 610, "height": 910 }
```

`assetId` 要先透過 `/api/admin/upload`（圖片）或 `/api/admin/upload-video`
（GIF 轉檔）取得 —— 那兩個端點走後台 session，目前**不接受這把金鑰**。
外部系統若也需要上傳檔案，得再開一次；現階段它只能引用已存在的 asset。

### 不開放修改的欄位

| 欄位 | 原因 |
|---|---|
| `position` | 排序有唯一約束，散著改會撞鍵。要重排請用後台 |
| 分類的 `slug` | 首頁連結、社群貼文與名片上的網址都依賴它 |
| `assetId` 等關聯 | 換圖等同換內容，請建立新項目 |
| `frames` 的 `slug`、`boxWidth`、`boxHeight` | 由伺服器推導，見下 |

`PATCH` 只送了這些欄位時會回 422 而非靜默成功，避免對接的人以為改掉了。

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
```

失敗一律是 `{ "error": "…" }`，驗證錯誤另帶 `issues` 逐欄說明：

| 狀態 | 意義 |
|---|---|
| 400 | 請求主體不是有效的 JSON |
| 401 | 金鑰缺少或不正確 |
| 404 | 未知的資源名稱，或該 id 不存在 |
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
