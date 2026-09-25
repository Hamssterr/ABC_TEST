# ABC Quotation Backend

Backend NestJS xử lý Customer, Product, báo giá, Gemini AI, background job, PDF và Excel.

## 1. Quick Evaluation

Không cần cài đặt hoặc cấu hình môi trường.

- **Demo frontend:** `<FRONTEND_DEMO_URL>`
- **Backend API:** `<BACKEND_DEMO_URL>/api`
- **Source code:** `<REPOSITORY_URL>`

Luồng kiểm tra đề xuất:

```text
Chọn khách hàng
→ Tạo báo giá thủ công hoặc bằng AI
→ Kiểm tra form
→ Gửi yêu cầu
→ Theo dõi trạng thái xử lý
→ Tải PDF hoặc Excel
```

> Public demo sử dụng free-tier hosting nên lần truy cập đầu tiên có thể mất vài giây để backend khởi động.

## 2. Full Integration Mode

Dùng phương án này nếu muốn clone repository và chạy đầy đủ trên local.

### Yêu cầu

- Node.js 20 trở lên.
- npm 10 trở lên.
- PostgreSQL hoặc Supabase PostgreSQL.
- Supabase project để lưu PDF.
- Gemini API key.

Mac mini không bắt buộc. Project sử dụng `MockMacProcessorService` để giả lập bước xử lý tài liệu trên Mac mini.

## 3. Cài đặt backend

```bash
git clone <REPOSITORY_URL>
cd <repository-directory>/server/server
npm ci
```

Tạo file environment:

```bash
cp .env.example .env
```

## 4. Cấu hình environment

Mở `.env` và điền các giá trị sau:

```env
# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# PostgreSQL
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
DATABASE_SSL=true
DATABASE_POOL_MAX=5

# Supabase Storage
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=quotation-files

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
AI_REQUEST_TIMEOUT_MS=15000

# Background Job
JOB_PROCESSOR_ENABLED=true
JOB_POLL_INTERVAL_MS=2000
```

### PostgreSQL

Nếu dùng Supabase PostgreSQL:

```env
DATABASE_SSL=true
```

Nếu dùng PostgreSQL local không có SSL:

```env
DATABASE_SSL=false
```

### Supabase Storage

Trong Supabase Dashboard:

1. Tạo Storage bucket tên `quotation-files`.
2. Đặt bucket ở chế độ private.
3. Lấy Project URL điền vào `SUPABASE_URL`.
4. Lấy Service Role Key điền vào `SUPABASE_SERVICE_ROLE_KEY`.

`SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng ở backend.

### Gemini

Tạo Gemini API key và điền:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

Nếu không cấu hình Gemini, các chức năng khác vẫn hoạt động nhưng API tạo AI draft sẽ trả HTTP `503`.

## 5. Migration và seed dữ liệu

Chạy migration:

```bash
npm run migration:run
```

Tạo dữ liệu Customer và Product mẫu:

```bash
npm run seed
```

Seed có thể chạy nhiều lần; các customer code và product SKU đã tồn tại sẽ được bỏ qua.

## 6. Chạy backend

Development:

```bash
npm run start:dev
```

Backend mặc định chạy tại:

```text
http://localhost:3000/api
```

Production:

```bash
npm run build
npm run start:prod
```

## 7. Chạy frontend

Từ thư mục `server/server`, mở terminal khác và chạy:

```bash
cd ../../client
npm ci
cp .env.example .env.local
npm run dev
```

Frontend environment:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Mở:

```text
http://localhost:5173
```

Giá trị `FRONTEND_URL` của backend phải trùng với origin frontend:

```env
FRONTEND_URL=http://localhost:5173
```

## 8. Kiểm tra project

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## 9. Lưu ý cấu hình

| Trường hợp | Kết quả |
|---|---|
| Thiếu `DATABASE_URL` | Các chức năng database không hoạt động |
| Thiếu Gemini key | AI endpoint trả `503` |
| Thiếu Supabase credentials | Job tạo PDF chuyển sang `FAILED` |
| `JOB_PROCESSOR_ENABLED=false` | Job giữ ở trạng thái `PENDING` |
| Sai `FRONTEND_URL` | Frontend có thể gặp lỗi CORS |
| Bucket không tồn tại | Upload PDF thất bại |

Không commit file `.env` hoặc đưa các secret sau vào frontend:

```text
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
```
