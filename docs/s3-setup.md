# S3 設定步驟

給媒體檔案（輪播圖、案例照、拍貼框動畫）用的儲存空間。
以下用直連 S3 的做法，不經過 CloudFront —— 這個站的媒體總量約 22MB，
且 `next/image` 會在伺服器端先抓原圖再最佳化，訪客不會直接連到 S3，
所以一開始不需要 CDN。日後要換只需改一個環境變數，見文末。

全部可在 AWS Console 完成，約 10 分鐘。

---

## 1. 建立 Bucket

**S3 → Create bucket**

| 欄位 | 值 |
|---|---|
| Bucket name | `timelab-website-tw` |
| Region | `ap-east-2`（台北） |
| Object Ownership | ACLs disabled（預設） |
| Block Public Access | **取消勾選** "Block all public access"，並確認下方的警告 |
| Bucket Versioning | Disable（預設。S3 key 帶內容雜湊，同一個 key 不會被覆寫，不需要版本控制） |
| Encryption | SSE-S3（預設） |

> 取消 Block Public Access 只是解除「整體封鎖」，實際能讀什麼由下一步的
> policy 決定。不做這一步的話，第 2 步的 policy 會被擋下而無效。

---

## 2. Bucket Policy（讓訪客能讀圖）

**進入 bucket → Permissions → Bucket policy → Edit**，貼上：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadMediaOnly",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::timelab-website-tw/media/*"
    }
  ]
}
```

兩個重點：

- **只開 `GetObject`** —— 任何人都不能寫入或刪除，只能讀
- **只開 `media/*` 這個前綴** —— 程式上傳的檔案都在 `media/` 底下
  （見 `app/server/s3.ts` 的 `mediaKey()`）。
  限定前綴的話，就算日後誤放其他東西進這個 bucket 也不會一併公開

---

## 3. CORS（可略過，但建議設）

程式是從伺服器端上傳、訪客只是讀圖，正常情況不需要 CORS。
但若日後要在瀏覽器裡直接讀取檔案內容（例如做圖片裁切預覽），會需要。

**Permissions → Cross-origin resource sharing (CORS) → Edit**：

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://timelabtw.com", "http://localhost:3000"],
    "ExposeHeaders": ["Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 4. IAM 使用者（給後台上傳用）

**IAM → Users → Create user**

1. User name：`timelab-website-uploader`
2. **不要**勾選 "Provide user access to the AWS Management Console"
   —— 這組金鑰只給程式用，不需要能登入後台
3. Permissions → **Attach policies directly** → Create policy → JSON：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "UploadAndDeleteMedia",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::timelab-website-tw/media/*"
    }
  ]
}
```

程式實際只用這兩個動作（`app/server/s3.ts` 的 `putObject` 與
`deleteObject`），所以不給 `ListBucket`、不給 `GetObject`、
更不要給 `s3:*`。金鑰外洩時，對方最多只能覆寫或刪除 `media/` 底下的檔案，
不能列出內容、不能刪掉整個 bucket。

4. 建立完使用者後 → **Security credentials → Create access key**
   → 用途選 "Application running outside AWS"
5. 把 **Access key ID** 與 **Secret access key** 記下來
   —— secret 只會顯示這一次

---

## 5. 填進 .env

```bash
AWS_REGION="ap-east-2"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="timelab-website-tw"

# 不含結尾斜線
NEXT_PUBLIC_MEDIA_URL="https://timelab-website-tw.s3.ap-east-2.amazonaws.com"
```

`NEXT_PUBLIC_MEDIA_URL` 的格式是
`https://<bucket>.s3.<region>.amazonaws.com`。
可以在 bucket 裡隨便點一個檔案，Object URL 欄位會顯示完整網址，
去掉後面的路徑就是這個值。

> `AWS_ACCESS_KEY_ID` 與 `AWS_SECRET_ACCESS_KEY` **絕對不可**加
> `NEXT_PUBLIC_` 前綴，那會讓金鑰被打包進前端 JavaScript。

---

## 6. 驗證

```bash
bun --env-file=.env prisma/seed/migrate-content.ts --dry-run
```

dry-run 只檢查檔案與尺寸，不會碰到 S3。確認通過後跑真正的遷移：

```bash
bun run seed:content
```

它會上傳 137 個檔案、寫入資料庫，最後把資料讀回來與遷移前的內容
逐欄位比對。**看到「全部相符」才算成功。**

跑完到 S3 Console 確認 `media/` 底下有 `hero/`、`event/`、`cases/`、
`case-covers/`、`frames/` 五個資料夾，隨便點一個檔案，
用 Object URL 在瀏覽器開得起來就沒問題。

---

## 費用

以這個站的量級（22MB 儲存、流量極少）：

| 項目 | 約略費用 |
|---|---|
| 儲存 22MB | 每月 NT$0.02 |
| PUT 請求（上傳 137 次） | 一次性，不到 NT$0.01 |
| GET 請求與流量 | 伺服器端快取後請求次數很低，每月數元以內 |

實際上每月不會超過 NT$10。

---

## 日後要換成 CloudFront

因為資料庫只存 S3 key、完整網址在 `app/server/s3.ts` 的 `mediaUrl()`
組成，**換來源只需改 `NEXT_PUBLIC_MEDIA_URL` 一個值**，不用動任何資料。

屆時的步驟：

1. 建立 CloudFront distribution，Origin 指向這個 bucket
2. Origin access 選 **Origin access control (OAC)**，
   CloudFront 會產生一段新的 bucket policy 讓你貼上
3. 把 bucket 改回 Block all public access（不再需要公開讀取）
4. 綁自訂網域（例如 `media.timelabtw.com`）與憑證
5. `NEXT_PUBLIC_MEDIA_URL` 改成該網域，重新 build 部署

因為檔名帶內容雜湊、快取設 `immutable`，換過去之後也不需要做
invalidation。

值得換的時機：想用自己的網域，或發現有人大量抓取圖片想擋流量。
