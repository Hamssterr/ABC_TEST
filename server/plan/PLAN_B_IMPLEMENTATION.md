# Plan B — Quotation Workflow với Gemini và Mock Mac Processor

## 1. Mục tiêu

Xây dựng một public demo cho phép nhà tuyển dụng thực hiện trọn vẹn quy trình:

```text
Mở thông tin khách hàng
→ Chọn tạo báo giá
→ Nhập thủ công hoặc dùng Gemini tạo bản nháp
→ Kiểm tra và gửi yêu cầu xử lý
→ Theo dõi PENDING / PROCESSING / COMPLETED / FAILED
→ Tải file PDF được tạo từ template
```

Prototype không cần Mac mini thật. Thành phần đáng lẽ chạy trên Mac mini được mô phỏng bởi một background processor nằm trong NestJS. Database, trạng thái job, tính toán, tạo PDF, upload và download đều chạy thật.

## 2. Phạm vi đã chốt

### 2.1. Bắt buộc

- Customer CRUD.
- Product CRUD.
- Phân trang dạng offset cho danh sách customer và product.
- Trang chi tiết khách hàng và lịch sử báo giá.
- Tạo báo giá trong ngữ cảnh một khách hàng.
- Chọn nhiều sản phẩm từ catalog.
- Backend lấy đơn giá chính thức từ PostgreSQL.
- Backend tính subtotal, discount, VAT và total.
- Lưu snapshot khách hàng và sản phẩm vào báo giá.
- Tạo processing job khi người dùng gửi báo giá.
- Background processor xử lý job trong cùng NestJS server.
- Client tự cập nhật trạng thái bằng polling, không reload trang.
- Cho phép người dùng retry job `FAILED`, tối đa ba lần xử lý.
- Tạo PDF từ template cố định.
- Upload file vào private Supabase Storage bucket.
- Tạo signed URL để tải PDF.
- Gemini hỗ trợ chuyển yêu cầu khách hàng có sẵn thành bản nháp.
- Người dùng phải kiểm tra và xác nhận trước khi gửi.
- Public live demo và README giải thích phần mock.

### 2.2. Nếu còn thời gian

- Tìm kiếm customer/product theo tên, mã hoặc SKU.
- Seed/reset demo data.
- Lưu log thời điểm thay đổi trạng thái.
- Video demo ngắn.

### 2.3. Không làm trong Plan B

- Local Worker chạy trên laptop.
- Kết nối Codex CLI thật.
- Redis, BullMQ, RabbitMQ hoặc Kafka.
- WebSocket, SSE hoặc Supabase Realtime.
- Microservices.
- Nhiều template báo giá.
- Phân quyền phức tạp.
- AI tự quyết định giá, thuế, giảm giá hoặc sản phẩm chính thức.

## 3. Tech stack

| Thành phần | Công nghệ |
|---|---|
| Frontend | React, Vite, TypeScript |
| UI state/server state | TanStack Query |
| Form | React Hook Form |
| Frontend validation | Zod |
| Backend | NestJS, TypeScript |
| ORM | TypeORM với migrations, `synchronize: false` |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage, private bucket |
| AI | Gemini API qua một adapter trong NestJS |
| PDF | `pdf-lib`, `@pdf-lib/fontkit`, Noto Sans |
| Background scheduling | `@nestjs/schedule` |
| Frontend hosting | Cloudflare Pages |
| Backend hosting | Render Free hoặc nền tảng tương đương |

## 4. Kiến trúc tổng thể

```text
React/Vite
   │
   │ HTTPS REST
   ▼
NestJS API
   ├── CustomerModule
   ├── ProductModule
   ├── QuotationModule
   ├── AiModule
   ├── ProcessingJobModule
   ├── MockMacProcessorModule
   ├── PdfModule
   └── StorageModule
        │
        ├── Supabase PostgreSQL
        ├── Supabase Storage
        └── Gemini API
```

Chỉ deploy một backend NestJS. REST API và background processor chạy trong cùng một Node.js process nhưng được tách thành các module/service riêng.

## 5. Cấu trúc repository dự kiến

```text
ABC_TEST/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   └── quotations/
│   │   ├── pages/
│   │   ├── router/
│   │   └── types/
│   └── package.json
├── server/
│   ├── plan/
│   │   └── BACKEND_TODO.md
│   └── server/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── customers/
│       │   │   ├── products/
│       │   │   ├── quotations/
│       │   │   ├── processing-jobs/
│       │   │   ├── ai/
│       │   │   ├── pdf/
│       │   │   └── storage/
│       │   ├── database/
│       │   │   └── migrations/
│       │   ├── assets/
│       │   │   └── fonts/
│       │   └── main.ts
│       └── package.json
├── docs/
│   └── PLAN_B_IMPLEMENTATION.md
├── samples/
│   └── quotation-sample.pdf
└── README.md
```

Không tạo shared package trong MVP. Frontend và backend có type riêng để giảm cấu hình build.

## 6. Data model

### 6.1. `customers`

| Cột | Kiểu | Quy tắc |
|---|---|---|
| `id` | uuid | Primary key |
| `code` | varchar | Unique, ví dụ `CUS-001` |
| `name` | varchar | Bắt buộc |
| `company_name` | varchar | Có thể null |
| `email` | varchar | Có thể null, validate email |
| `phone` | varchar | Có thể null |
| `address` | text | Có thể null |
| `created_at` | timestamptz | Tự động |
| `updated_at` | timestamptz | Tự động |
| `deleted_at` | timestamptz | Soft delete |

### 6.2. `products`

| Cột | Kiểu | Quy tắc |
|---|---|---|
| `id` | uuid | Primary key |
| `sku` | varchar | Unique |
| `name` | varchar | Bắt buộc |
| `description` | text | Có thể null |
| `unit` | varchar | Ví dụ `chiếc`, `bộ`, `gói` |
| `unit_price` | numeric(15,2) | Không âm |
| `is_active` | boolean | Mặc định `true` |
| `created_at` | timestamptz | Tự động |
| `updated_at` | timestamptz | Tự động |
| `deleted_at` | timestamptz | Soft delete |

### 6.3. `quotations`

| Cột | Kiểu | Quy tắc |
|---|---|---|
| `id` | uuid | Primary key |
| `quotation_number` | varchar | Unique, do backend tạo |
| `customer_id` | uuid | Foreign key tới customer |
| `customer_snapshot` | jsonb | Thông tin customer tại thời điểm gửi |
| `status` | enum | `SUBMITTED`, `COMPLETED`, `FAILED` |
| `subtotal` | numeric(15,2) | Backend tính |
| `discount_amount` | numeric(15,2) | Mặc định 0 |
| `tax_rate` | numeric(5,2) | Mặc định 10 |
| `tax_amount` | numeric(15,2) | Backend tính |
| `total_amount` | numeric(15,2) | Backend tính |
| `valid_until` | date | Bắt buộc |
| `delivery_address` | text | Có thể null |
| `payment_terms` | text | Có thể null |
| `notes` | text | Có thể null |
| `template_version` | varchar | Mặc định `v1` |
| `created_at` | timestamptz | Tự động |
| `updated_at` | timestamptz | Tự động |

### 6.4. `quotation_items`

| Cột | Kiểu | Quy tắc |
|---|---|---|
| `id` | uuid | Primary key |
| `quotation_id` | uuid | Foreign key |
| `product_id` | uuid | Foreign key, dùng truy vết |
| `product_sku` | varchar | Snapshot |
| `product_name` | varchar | Snapshot |
| `description` | text | Snapshot |
| `unit` | varchar | Snapshot |
| `quantity` | numeric(12,2) | Lớn hơn 0 |
| `unit_price` | numeric(15,2) | Snapshot từ database |
| `line_total` | numeric(15,2) | Backend tính |

### 6.5. `processing_jobs`

| Cột | Kiểu | Quy tắc |
|---|---|---|
| `id` | uuid | Primary key |
| `quotation_id` | uuid | Unique trong MVP |
| `processor_type` | enum | `HOSTED_MOCK` |
| `status` | enum | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `attempt_count` | integer | Mặc định 0 |
| `error_message` | text | Có thể null |
| `file_path` | text | Storage object path, không lưu signed URL |
| `file_name` | varchar | Có thể null |
| `file_checksum` | varchar | Có thể null |
| `created_at` | timestamptz | Tự động |
| `started_at` | timestamptz | Có thể null |
| `completed_at` | timestamptz | Có thể null |

### 6.6. Quy tắc snapshot

- Sửa customer sau này không làm đổi nội dung báo giá cũ.
- Sửa giá hoặc tên product sau này không làm đổi báo giá cũ.
- PDF luôn đọc từ quotation snapshot và quotation item snapshot.

## 7. Business rules

### 7.1. Công thức

```text
lineTotal     = quantity × unitPrice
subtotal      = tổng lineTotal
taxableAmount = subtotal - discountAmount
taxAmount     = taxableAmount × taxRate / 100
totalAmount   = taxableAmount + taxAmount
```

### 7.2. Validation

- Báo giá phải có ít nhất một item.
- `quantity > 0`.
- Product phải tồn tại, đang active và chưa bị soft delete.
- Backend lấy `unit_price`; không tin giá do frontend hoặc AI gửi.
- `discountAmount >= 0` và không lớn hơn subtotal.
- `taxRate` nằm trong khoảng 0–100.
- `validUntil` không nhỏ hơn ngày hiện tại.
- Không cho sửa dữ liệu quotation sau khi đã submit trong MVP.
- Tiền được tính bằng decimal/numeric; không dùng số thực thiếu kiểm soát cho phép tính tài chính.

### 7.3. Quotation number

Dùng định dạng dễ đọc và tránh phụ thuộc sequence phức tạp:

```text
QT-YYYYMMDD-XXXX
```

`XXXX` là bốn ký tự lấy từ UUID. Cột vẫn có unique constraint để phát hiện va chạm hiếm gặp.

## 8. API contract

Base path:

```text
/api
```

### 8.1. Customers

```http
GET    /api/customers?search=&page=1&limit=20
GET    /api/customers/:id
POST   /api/customers
PATCH  /api/customers/:id
DELETE /api/customers/:id
GET    /api/customers/:id/quotations
```

`DELETE` thực hiện soft delete. Customer bị xóa không xuất hiện trong danh sách mặc định nhưng báo giá cũ vẫn đọc được từ snapshot.

Danh sách dùng offset pagination. `page` bắt đầu từ 1, `limit` mặc định là 10 và tối đa là 100. `search` là tham số bổ trợ, có thể triển khai sau pagination.

Response danh sách:

```json
{
  "data": [
    {
      "id": "customer-uuid",
      "code": "CUS-001",
      "name": "Nguyễn Văn An",
      "companyName": "Công ty ABC"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

Query phải có thứ tự ổn định, ví dụ `created_at DESC, id DESC`, và luôn loại bản ghi đã soft delete.

Implementation với TypeORM dùng `findAndCount`, `skip = (page - 1) * limit` và `take = limit`; không tải toàn bộ dữ liệu rồi mới cắt trang trong memory. Migration tạo index phục vụ thứ tự danh sách trên `created_at` và `id`.

### 8.2. Products

```http
GET    /api/products?search=&page=1&limit=20
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

`DELETE` thực hiện soft delete. Product đã bị xóa hoặc inactive không được chọn cho báo giá mới.

Product list dùng cùng response `{ data, meta }`, quy tắc `page`, `limit`, `total`, `totalPages` và stable ordering như customer list.

Frontend đưa `page` và `limit` vào TanStack Query key. Khi bấm Trang trước/Trang sau, client fetch đúng trang mới; không reload browser page.

### 8.3. AI quotation draft

```http
POST /api/ai/quotation-draft
```

Request:

```json
{
  "customerId": "uuid",
  "rawRequest": "Khách cần 10 Dell Latitude, giao tại TP.HCM, trả trước 30%."
}
```

Response dự kiến:

```json
{
  "items": [
    {
      "productQuery": "Dell Latitude",
      "quantity": 10,
      "candidates": [
        {
          "id": "product-uuid",
          "sku": "DELL-LAT-001",
          "name": "Dell Latitude 5450",
          "unit": "chiếc",
          "unitPrice": "25000000.00"
        }
      ]
    }
  ],
  "deliveryAddress": "TP.HCM",
  "paymentTerms": "Thanh toán trước 30%",
  "validityDays": null,
  "notes": null,
  "unresolvedFields": ["validUntil", "exactProduct"]
}
```

Gemini chỉ trả `productQuery`, quantity và thông tin ngôn ngữ tự nhiên. Backend tìm candidate trong bảng product. Nếu có nhiều candidate, người dùng phải chọn.

### 8.4. Quotations

```http
POST /api/customers/:customerId/quotations
GET  /api/quotations/:id
GET  /api/quotations/:id/download
```

Request tạo quotation:

```json
{
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 10
    }
  ],
  "discountAmount": "1000000.00",
  "taxRate": "10.00",
  "validUntil": "2026-10-15",
  "deliveryAddress": "TP.HCM",
  "paymentTerms": "Thanh toán trước 30%",
  "notes": "Giao hàng trong giờ hành chính"
}
```

Response:

```http
202 Accepted
```

```json
{
  "quotationId": "quotation-uuid",
  "quotationNumber": "QT-20260922-A1B2",
  "jobId": "job-uuid",
  "status": "PENDING"
}
```

Quotation, items và job phải được tạo trong cùng một database transaction.

### 8.5. Processing jobs

```http
GET  /api/processing-jobs/:id
POST /api/processing-jobs/:id/retry
```

Response trạng thái:

```json
{
  "id": "job-uuid",
  "quotationId": "quotation-uuid",
  "status": "PROCESSING",
  "errorMessage": null,
  "fileName": null,
  "completedAt": null
}
```

API chỉ trả dữ liệu cần cho status UI, không join toàn bộ quotation trong mỗi lần polling.

Retry chỉ hợp lệ khi job đang `FAILED` và `attempt_count < 3`:

```text
FAILED
→ POST /processing-jobs/:id/retry
→ PENDING
→ background runner claim lại
→ PROCESSING
→ COMPLETED hoặc FAILED
```

Retry endpoint phải thực hiện conditional update để hai lần bấm liên tiếp không tạo hai lượt xử lý. Khi retry, backend xóa `error_message`, đặt quotation về `SUBMITTED` và trả:

```http
202 Accepted
```

```json
{
  "jobId": "job-uuid",
  "quotationId": "quotation-uuid",
  "status": "PENDING",
  "attemptCount": 1,
  "maxAttempts": 3
}
```

`attempt_count` tăng khi runner claim job và chuyển sang `PROCESSING`. Nếu đã đủ ba lần xử lý, retry endpoint trả `409 Conflict`.

### 8.6. Download

`GET /api/quotations/:id/download` chỉ hoạt động khi job đã `COMPLETED`.

Response:

```json
{
  "fileName": "quotation-QT-20260922-A1B2.pdf",
  "downloadUrl": "temporary-signed-url",
  "expiresIn": 300
}
```

Signed URL được tạo lúc người dùng yêu cầu tải, không lưu lâu dài trong database.

## 9. Luồng tạo báo giá thủ công

```text
1. Frontend gọi GET /customers/:id.
2. Người dùng bấm “Tạo báo giá”.
3. Frontend mở form trong ngữ cảnh customer đó.
4. Người dùng tìm và chọn product.
5. Frontend hiển thị đơn giá tham khảo từ product API.
6. Người dùng nhập quantity, discount, VAT và điều khoản.
7. Người dùng bấm “Gửi xử lý”.
8. Backend đọc lại customer và product từ PostgreSQL.
9. Backend validate và tính toàn bộ amount.
10. Backend tạo quotation snapshot, items snapshot và job PENDING.
11. Backend trả HTTP 202 cùng jobId.
12. Frontend hiển thị PENDING ngay lập tức.
13. Background runner claim job và đổi thành PROCESSING.
14. Frontend polling nhận PROCESSING và tự render lại.
15. Processor tạo PDF, upload Storage và đổi thành COMPLETED.
16. Frontend polling nhận COMPLETED, dừng polling và hiện nút download.
```

## 10. Luồng dùng Gemini

```text
1. Người dùng mở customer và chọn “Tạo báo giá”.
2. Người dùng dán email/tin nhắn/yêu cầu có sẵn của khách hàng.
3. Frontend gọi POST /ai/quotation-draft.
4. NestJS gọi Gemini qua AiAdapter.
5. NestJS validate JSON trả về.
6. NestJS tìm product candidates bằng SKU/name trong PostgreSQL.
7. Frontend điền bản nháp và đánh dấu trường còn thiếu.
8. Người dùng chọn product chính xác và sửa dữ liệu nếu cần.
9. Người dùng bấm “Gửi xử lý”.
10. Từ đây sử dụng đúng luồng thủ công ở mục 9.
```

Nếu Gemini timeout, hết quota hoặc trả JSON không hợp lệ, frontend hiển thị lỗi AI và giữ nguyên form để người dùng nhập thủ công.

## 11. Quy tắc AI

### AI được phép

- Nhận diện tên hoặc mô tả sản phẩm từ nội dung tự nhiên.
- Nhận diện số lượng.
- Nhận diện địa điểm giao hàng.
- Nhận diện điều khoản thanh toán được khách hàng viết rõ.
- Nhận diện thời hạn báo giá nếu có.
- Liệt kê trường thiếu hoặc mơ hồ.

### AI không được phép

- Tạo giá hoặc thay đổi giá.
- Chọn product ID khi không chắc chắn.
- Tự đặt VAT hoặc discount.
- Tự thêm điều khoản pháp lý.
- Tính tổng tiền.
- Tạo quotation chính thức mà không có xác nhận của người dùng.
- Thay đổi processing job status.

### Adapter

Backend định nghĩa interface để không khóa chặt vào Gemini:

```text
QuotationDraftExtractor
└── GeminiQuotationDraftExtractor
```

Production có thể bổ sung:

```text
QuotationDraftExtractor
├── GeminiQuotationDraftExtractor
└── CodexCliQuotationDraftExtractor
```

## 12. Background processor và Mock Mac mini

### 12.1. Cách chạy trong prototype

`ProcessingJobRunner` dùng `@nestjs/schedule` kiểm tra job mỗi 2 giây:

```text
Interval tick
→ claim một job PENDING
→ đổi thành PROCESSING
→ MockMacProcessorService.process(job)
→ đọc quotation snapshot
→ tạo PDF
→ upload Supabase Storage
→ cập nhật COMPLETED
```

Nếu xảy ra lỗi:

```text
PROCESSING → FAILED
```

Lưu error message đã làm sạch, không trả stack trace hoặc secret cho frontend.

### 12.2. Chống xử lý trùng

Ngay cả khi demo chỉ chạy một backend instance, thao tác claim nên là atomic:

```text
Chỉ đổi PENDING → PROCESSING nếu status hiện tại vẫn là PENDING.
```

Nếu update không ảnh hưởng dòng nào, một runner khác đã claim job và runner hiện tại bỏ qua.

PostgreSQL production có thể nâng cấp sang `FOR UPDATE SKIP LOCKED` khi có nhiều worker.

### 12.3. Mapping sang Mac mini thật

Prototype:

```text
NestJS process
├── REST API
└── MockMacProcessorService
```

Production:

```text
NestJS API
└── PostgreSQL jobs
       ▲
       │ claim/complete/fail API
       ▼
Mac mini
└── Quotation Worker
    ├── Job Poller
    ├── Optional Codex CLI Adapter
    ├── Quote Engine
    └── PDF Generator
```

Phần thay đổi là nơi worker chạy và cách worker claim job. Input, output, state transition, template và file format giữ nguyên.

## 13. Client status tự cập nhật

Frontend dùng TanStack Query polling:

- Hiển thị `PENDING` ngay từ response của POST.
- Chỉ bắt đầu polling khi có `jobId`.
- Gọi `GET /processing-jobs/:id` mỗi 2 giây.
- Tự render lại khi response đổi thành `PROCESSING`.
- Dừng polling khi `COMPLETED` hoặc `FAILED`.
- Không polling ở browser tab đang nằm background.
- Nếu reload trang, `GET /quotations/:id` trả job hiện tại để tiếp tục theo dõi.
- Khi `FAILED` và còn lượt thử, hiển thị nút `Thử lại`.
- Sau khi retry thành công, cập nhật UI về `PENDING` và khởi động polling lại.

UI mapping:

| Status | Nội dung |
|---|---|
| `PENDING` | Yêu cầu đã được gửi, đang chờ xử lý |
| `PROCESSING` | Hệ thống đang tạo file báo giá |
| `COMPLETED` | Tạo báo giá thành công, hiện nút tải PDF |
| `FAILED` | Hiển thị thông báo lỗi an toàn |

Ở trạng thái `FAILED`, UI hiển thị số lần đã xử lý và nút retry khi `attemptCount < maxAttempts`. Nút bị disable trong lúc gửi retry request để tránh double submit.

Không cần WebSocket cho bốn trạng thái thay đổi trong vài giây.

## 14. PDF template

Template `v1` gồm:

1. Logo và thông tin công ty bán hàng.
2. Tiêu đề “BÁO GIÁ”.
3. Số báo giá, ngày tạo và ngày hết hiệu lực.
4. Thông tin khách hàng từ snapshot.
5. Bảng sản phẩm: STT, SKU, tên, đơn vị, số lượng, đơn giá, thành tiền.
6. Subtotal, discount, VAT và total.
7. Địa điểm giao hàng.
8. Điều khoản thanh toán.
9. Ghi chú.
10. Khu vực chữ ký.

Phải embed Noto Sans để tiếng Việt hiển thị đúng. PDF filename:

```text
quotation-{quotationNumber}.pdf
```

Storage object path:

```text
quotations/{year}/{quotationId}/quotation-{quotationNumber}.pdf
```

## 15. Frontend pages

### Customers

```text
/customers
/customers/new
/customers/:id
/customers/:id/edit
```

Trang detail hiển thị customer, lịch sử quotation và nút `Tạo báo giá`.

### Products

```text
/products
/products/new
/products/:id/edit
```

Danh sách hiển thị SKU, tên, đơn vị, giá và trạng thái active.

### Quotations

```text
/customers/:customerId/quotations/new
/quotations/:quotationId
```

Màn hình tạo quotation có hai cách nhập trong cùng một form:

- Chọn product thủ công.
- Dán yêu cầu và dùng Gemini để điền bản nháp.

Màn hình detail hiển thị dữ liệu quotation, processing status và download action.

## 16. Backend modules

### `CustomersModule`

- CRUD và soft delete.
- Customer detail.
- Customer quotation history.
- Offset pagination cho customer list.

### `ProductsModule`

- CRUD và soft delete.
- List products phục vụ picker; search theo SKU/name nếu còn thời gian.
- Chỉ trả active product cho picker mặc định.
- Offset pagination cho product list.

### `QuotationsModule`

- Validate create input.
- Load dữ liệu chính thức từ database.
- Calculator service.
- Tạo snapshot và job trong transaction.
- Detail/history/download orchestration.

### `ProcessingJobsModule`

- Tạo job.
- Atomic claim.
- State transitions.
- Status endpoint.
- Manual retry cho job `FAILED`, tối đa ba attempts.

### `AiModule`

- Provider adapter.
- Prompt và schema validation.
- Product candidate lookup.
- Timeout/error normalization.

### `PdfModule`

- Template `v1`.
- Font embedding.
- Currency/date formatting.
- Trả PDF buffer và checksum.

### `StorageModule`

- Upload PDF.
- Private bucket.
- Signed download URL.

## 17. Error cases phải xử lý

| Tình huống | Hành vi |
|---|---|
| Customer không tồn tại | `404` |
| Product không tồn tại/inactive | `400` hoặc `422` |
| Quantity không hợp lệ | `400` |
| Discount lớn hơn subtotal | `400` |
| Gemini timeout/hết quota | Báo lỗi AI, vẫn cho nhập thủ công |
| Gemini trả JSON sai schema | Báo không thể tạo bản nháp |
| PDF generation lỗi | Job `FAILED` |
| Storage upload lỗi | Job `FAILED` |
| Retry job chưa `FAILED` | `409` |
| Retry đã đủ ba attempts | `409` |
| Download khi chưa hoàn tất | `409` |
| Signed URL hết hạn | Client gọi download API để lấy URL mới |
| Client reload | Fetch quotation/job và tiếp tục polling |
| Backend restart khi còn PENDING | Runner tiếp tục lấy job từ PostgreSQL |

Job đang `PROCESSING` khi backend bị restart là limitation của MVP. Nếu còn thời gian, runner reset job `PROCESSING` quá timeout về `PENDING` và tăng `attempt_count`.

## 18. Environment variables

Backend:

```text
NODE_ENV
PORT
DATABASE_URL
FRONTEND_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
GEMINI_API_KEY
JOB_POLL_INTERVAL_MS=2000
```

Frontend:

```text
VITE_API_BASE_URL
```

`SUPABASE_SERVICE_ROLE_KEY` và `GEMINI_API_KEY` chỉ nằm ở backend. Không đưa secret vào frontend hoặc Git.

## 19. Security tối thiểu

- Validate mọi request bằng DTO và whitelist field.
- CORS chỉ cho phép frontend URL.
- Không nhận giá chính thức từ client/AI.
- Storage bucket private.
- Signed URL hết hạn sau khoảng 5 phút.
- Không trả stack trace, database URL hoặc provider error nguyên bản.
- Soft delete bảo vệ lịch sử quotation.
- Giới hạn độ dài `rawRequest` gửi Gemini.
- Chỉ dùng dữ liệu giả trong public demo.
- Ghi rõ public prototype chưa triển khai authentication/authorization production-grade.

## 20. Kế hoạch thực hiện hai ngày

### Ngày 1 — Core workflow

#### Buổi sáng

1. Khởi tạo `frontend` và `backend`.
2. Cấu hình env, validation, CORS và TypeORM.
3. Tạo migrations cho năm bảng.
4. Tạo seed customers và products.
5. Làm Customer CRUD.
6. Làm Product CRUD.
7. Thêm pagination cho hai trang danh sách.

Checkpoint:

```text
Có thể tạo, xem, sửa, soft delete customer và product.
```

#### Buổi chiều

1. Làm quotation form và product picker.
2. Làm calculator service.
3. Tạo quotation/items/job trong transaction.
4. Làm job status endpoint.
5. Làm retry endpoint và nút retry cho trạng thái `FAILED`.
6. Làm client polling và status UI.
7. Làm PDF template tiếng Việt.
8. Chạy Mock Mac Processor local.

Checkpoint:

```text
Customer → tạo quotation → PENDING → PROCESSING → COMPLETED → tải PDF local.
```

### Ngày 2 — AI, storage, deploy và tài liệu

#### Buổi sáng

1. Tạo private Supabase Storage bucket.
2. Upload PDF và signed download URL.
3. Làm `QuotationDraftExtractor` và Gemini adapter.
4. Validate AI response.
5. Product candidate matching.
6. Làm AI draft UI và manual fallback.

Checkpoint:

```text
Dán yêu cầu → Gemini điền draft → người dùng xác nhận → nhận PDF.
```

#### Buổi chiều

1. Deploy backend.
2. Deploy frontend.
3. Chạy migrations và seed demo data.
4. Kiểm tra CORS, environment variables và download.
5. Test lại core flow trên live URL.
6. Viết README.
7. Lưu sample PDF.
8. Quay video demo nếu cần.

## 21. Test plan

### Unit test cần thiết

- Calculator trả đúng subtotal, discount, VAT và total.
- Calculator từ chối discount lớn hơn subtotal.
- AI response schema từ chối output thiếu/sai kiểu.
- Retry chỉ chấp nhận job `FAILED` còn attempt.
- Pagination tính đúng `totalPages` và giới hạn `limit`.

### Manual end-to-end checklist

- Tạo customer mới.
- Sửa customer.
- Chuyển trang customer list và kiểm tra tổng số trang.
- Tạo product mới.
- Sửa giá product.
- Chuyển trang product list và kiểm tra stable ordering.
- Mở customer detail.
- Tạo quotation thủ công với hai products.
- Quan sát UI tự đổi PENDING → PROCESSING → COMPLETED.
- Tải PDF và kiểm tra tiếng Việt, tổng tiền, customer, items.
- Sửa product sau đó xác nhận quotation cũ không thay đổi.
- Dùng Gemini tạo draft.
- Thử raw request thiếu unit price và xác nhận AI không tự tạo giá.
- Thử Gemini failure và xác nhận vẫn nhập thủ công được.
- Thử PDF/storage failure và xác nhận UI hiển thị FAILED.
- Retry job FAILED và quan sát UI quay lại PENDING rồi tiếp tục polling.
- Xác nhận không thể retry job chưa FAILED hoặc đã đủ ba attempts.
- Reload trang khi đang xử lý và xác nhận UI tiếp tục theo dõi.

## 22. README phải giải thích

### Phạm vi mock

> The prototype does not require a physical Mac mini. The Mac-side worker is simulated by a hosted processor running inside the NestJS application. The simulation uses the same job input, output, state transitions, quotation engine, template and output format intended for the production worker. In production, the hosted processor would be disabled and the worker package would run as a long-lived process on the Mac mini, claiming jobs and reporting completion through authenticated APIs.

### Vai trò của AI

> Gemini is used only to extract a quotation draft from an existing unstructured customer request. Product identity, official pricing, validation, financial calculations, job state transitions, template rendering and file storage are handled by deterministic code. This keeps financial output testable and reproducible. The AI provider is isolated behind an adapter and can be replaced by a Codex CLI adapter if the production environment requires it.

### Production upgrade

- Tách processor khỏi NestJS và chạy trên Mac mini.
- Thêm agent authentication.
- Thêm claim/heartbeat/lease API.
- Dùng `FOR UPDATE SKIP LOCKED` cho nhiều worker.
- Thêm retry với backoff và dead-letter handling.
- Thêm production authentication/authorization.
- Thêm audit logs và observability.
- Chuyển từ polling sang SSE chỉ khi số lượng job hoặc thời gian xử lý tăng đáng kể.

## 23. Definition of Done

Plan B hoàn thành khi:

- Public live URL truy cập được.
- Có ít nhất ba customers và năm products mẫu.
- Customer/Product CRUD hoạt động.
- Customer/Product list có pagination và metadata chính xác.
- Có thể mở customer detail và chọn tạo quotation.
- Có thể tạo quotation thủ công.
- Có thể dùng Gemini tạo draft và sửa lại draft.
- Giá dùng trong quotation được lấy từ backend database.
- Client tự cập nhật đủ bốn trạng thái mà không reload trang.
- Job FAILED có thể retry an toàn và không vượt quá ba attempts.
- PDF được tạo từ template và hiển thị tiếng Việt đúng.
- PDF nằm trong private storage và tải qua signed URL.
- Có sample PDF trong repository.
- README mô tả architecture, mock scope, AI role, setup, deploy và production path.
- Core flow được kiểm tra lại trên live deployment.

## 24. Thứ tự ưu tiên khi thiếu thời gian

Không được cắt core flow. Thứ tự cắt giảm nếu gần hết thời gian:

1. Bỏ video demo.
2. Bỏ search nâng cao.
3. Bỏ seed/reset UI, giữ seed script.
4. Giảm độ đẹp của dashboard.
5. Giữ Gemini ở một textarea đơn giản.

Luôn giữ:

```text
Customer detail
→ Create quotation
→ Submit job
→ Status tự cập nhật
→ Template PDF
→ Download
```

## 25. Backend implementation checklist

Checklist thực thi chi tiết cho NestJS backend được đặt tại:

```text
server/plan/BACKEND_TODO.md
```

Backend source hiện nằm tại `server/server`. Thực hiện checklist theo từng phase và chỉ đánh dấu hoàn thành khi checkpoint của phase đó đã chạy thành công.
