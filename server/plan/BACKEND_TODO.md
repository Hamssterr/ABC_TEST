# Backend TODO — Plan B

> Backend source hiện nằm tại `server/server`. Thực hiện checklist theo thứ tự từ Phase 0 đến Phase 12. Chỉ chuyển phase khi checkpoint của phase hiện tại đã đạt.

Prompt thực thi Phase 0: `server/plan/PHASE_0_PROMPT.md`.

## Quy ước đánh dấu

- `[ ]` Chưa làm.
- `[x]` Đã hoàn thành và đã kiểm tra.
- Không đánh dấu hoàn thành nếu code mới compile nhưng checkpoint chưa chạy được.

## Kết quả backend cần đạt

```text
Customer CRUD + pagination
→ Product CRUD + pagination
→ Create quotation trong customer context
→ Tạo processing job PENDING
→ Background processor claim job
→ PROCESSING
→ Tạo PDF theo template
→ Upload private Supabase Storage
→ COMPLETED hoặc FAILED
→ Retry FAILED job
→ Gemini tạo quotation draft
→ Export một quotation thành Excel có thông tin công ty và khách hàng
```

---

## Phase 0 — Kiểm tra NestJS project hiện tại

- [x] Làm việc trong thư mục `server/server`.
- [x] Chạy `npm run start:dev` và xác nhận server khởi động.
- [x] Chạy `npm run lint`.
- [x] Chạy `npm run test`.
- [x] Chạy `npm run build`.
- [x] Xóa cấu hình `@nestjs/observe` mặc định và placeholder `YOUR_APP_KEY/YOUR_APP_SECRET`; prototype không cần dịch vụ này.
- [x] Thay endpoint Hello World bằng `GET /api/health` trả `{ "status": "ok" }`.
- [x] Giữ Vitest đang có trong starter.

### Checkpoint

```text
GET /api/health → 200 { "status": "ok" }
npm run lint     → pass
npm run test     → pass
npm run build    → pass
```

### Phase 0 completion record

- **Status:** COMPLETED
- **Completed at:** 2026-09-22
- **Changed files:**
  - `server/server/package.json`: Gỡ bỏ package `@nestjs/observe` khỏi dependencies.
  - `server/server/package-lock.json`: Cập nhật lockfile tương ứng sau khi gỡ `@nestjs/observe`.
  - `server/server/src/main.ts`: Xóa import `ObserveInstrument` và cấu hình `instrument` khi khởi tạo ứng dụng.
  - `server/server/src/app.module.ts`: Xóa `createObserveModule`, `ObserveModule.forRoot(...)`, và provider `AppService` không còn dùng.
  - `server/server/src/app.controller.ts`: Đổi route thành `api/health`, xóa injection của `AppService`, trả về JSON object `{ "status": "ok" }`.
  - `server/server/src/app.service.ts`: Xóa file do không còn nghiệp vụ cần service.
  - `server/server/src/app.controller.spec.ts`: Cập nhật unit test kiểm tra `getHealth()` trả về `{ status: 'ok' }`.
  - `server/server/test/app.e2e-spec.ts`: Cập nhật e2e test gọi `GET /api/health` trả về status 200 và `{ status: 'ok' }`.
- **Verification:**
  - `npm run lint`: PASS (0 warnings, 0 errors, 5 files).
  - `npm run test`: PASS (1 test file, 1 passed).
  - `npm run test:e2e`: PASS (1 test file, 1 passed).
  - `npm run build`: PASS (`nest build` thành công, tạo thư mục `dist`).
  - `curl -i http://localhost:3000/api/health`: PASS (HTTP 200 OK, `Content-Type: application/json; charset=utf-8`, body `{"status":"ok"}`).
- **Final relevant structure:**
  ```text
  server/server/
  ├── package.json
  ├── package-lock.json
  ├── src/
  │   ├── main.ts
  │   ├── app.module.ts
  │   ├── app.controller.ts        # Định nghĩa GET /api/health
  │   └── app.controller.spec.ts   # Unit test cho AppController
  └── test/
      └── app.e2e-spec.ts          # E2E test cho GET /api/health
  ```
- **Remaining issues:** Không có.

---

## Phase 1 — Cài dependency và cấu hình nền

### Dependency cần thiết

- [x] Cài `@nestjs/config`.
- [x] Cài `@nestjs/typeorm`, `typeorm`, `pg`.
- [x] Cài `class-validator`, `class-transformer`.
- [x] Cài `@nestjs/schedule`.
- [x] Cài `@supabase/supabase-js`.
- [x] Cài `pdf-lib`, `@pdf-lib/fontkit`.
- [x] Cài Gemini SDK và `zod` để validate AI output.
- [x] Cài `decimal.js` để thực hiện phép tính tiền an toàn.
- [x] Cài `helmet` cho HTTP security headers.
- [x] Cài Swagger: Hoãn lại (deferred) theo thiết kế, prototype tập trung vào core workflow, HTTP headers bảo mật và health route trước.

### Bootstrap

- [x] Đặt global prefix là `/api`.
- [x] Thêm global `ValidationPipe` với `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- [x] Bật CORS chỉ cho `FRONTEND_URL`.
- [x] Bật `helmet`.
- [x] Cấu hình graceful shutdown hooks.
- [x] Tạo `.env.example`; không commit `.env` thật.
- [x] Tạo config module đọc và validate environment variables.
- [x] Chuẩn hóa error response cơ bản.

### Environment variables

```text
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=
DATABASE_SSL=true
DATABASE_POOL_MAX=5
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=quotation-files
GEMINI_API_KEY=
JOB_POLL_INTERVAL_MS=2000
```

### Checkpoint

- [x] App không khởi động nếu thiếu biến môi trường bắt buộc cho môi trường tương ứng.
- [x] Field thừa trong request DTO bị từ chối.
- [x] CORS hoạt động với frontend local.
- [x] Build pass.

### Phase 1 completion record

- **Status:** COMPLETED
- **Completed at:** 2026-09-22
- **Changed files:**
  - `server/server/package.json`: Thêm production dependencies (`@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`, `class-validator`, `class-transformer`, `@nestjs/schedule`, `@supabase/supabase-js`, `pdf-lib`, `@pdf-lib/fontkit`, `@google/genai`, `zod`, `decimal.js`, `helmet`, `joi`, `dotenv`) và dev dependencies (`ts-node`, `@types/pg`).
  - `server/server/package-lock.json`: Cập nhật theo npm install.
  - `server/server/.env.example`: Tạo file mẫu cấu hình môi trường chuẩn không chứa secrets.
  - `server/server/src/bootstrap/configure-app.ts`: Tạo hàm cấu hình chung (global prefix `/api`, ValidationPipe, CORS, helmet, graceful shutdown, HttpExceptionFilter).
  - `server/server/src/common/filters/http-exception.filter.ts`: Tạo global exception filter chuẩn hóa JSON response `{ statusCode, message, error, path, timestamp }`.
  - `server/server/src/config/env.validation.ts`: Joi validation schema và hàm `validateEnv` cho các biến môi trường.
  - `server/server/src/config/app-config.module.ts`: ConfigModule toàn cục tích hợp validateEnv.
  - `server/server/src/app.controller.ts`: Đổi route thành `@Controller('health')` để kết hợp prefix `/api` thành `GET /api/health`.
  - `server/server/src/main.ts`: Tích hợp `configureApp(app)` và lấy dynamic port từ `ConfigService`.
  - `server/server/test/app.e2e-spec.ts`: E2E test kiểm thử `configureApp` (prefix `/api`, CORS header khi Origin là `FRONTEND_URL`, ValidationPipe chặn field thừa trả 400).
- **Dependencies đã thêm:** `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`, `class-validator`, `class-transformer`, `@nestjs/schedule`, `@supabase/supabase-js`, `pdf-lib`, `@pdf-lib/fontkit`, `@google/genai`, `zod`, `decimal.js`, `helmet`, `joi`, `dotenv`, `ts-node`, `@types/pg`.
- **Verification:**
  - `npm run lint`: PASS (0 warnings, 0 errors).
  - `npm run test`: PASS (1 unit test passed).
  - `npm run test:e2e`: PASS (3 e2e tests passed: health route, CORS, ValidationPipe).
  - `npm run build`: PASS (`nest build` thành công).
  - `curl -i http://localhost:3000/api/health`: PASS (HTTP 200 OK, đầy đủ security headers từ Helmet và CORS headers).
- **Final relevant structure:**
  ```text
  server/server/
  ├── .env.example
  ├── src/
  │   ├── bootstrap/
  │   │   └── configure-app.ts
  │   ├── common/
  │   │   └── filters/
  │   │       └── http-exception.filter.ts
  │   ├── config/
  │   │   ├── app-config.module.ts
  │   │   └── env.validation.ts
  │   ├── app.controller.ts
  │   ├── app.module.ts
  │   └── main.ts
  └── test/
      └── app.e2e-spec.ts
  ```
- **Remaining issues:** Không có.

---

## Phase 2 — PostgreSQL, TypeORM và migrations

### Database configuration

- [x] Tạo TypeORM config dùng `DATABASE_URL`, SSL cho Supabase và connection pool nhỏ.
- [x] Đặt `synchronize: false` ở mọi môi trường.
- [x] Tạo DataSource riêng để chạy migration CLI.
- [x] Thêm scripts `migration:generate`, `migration:run`, `migration:revert` và `migration:show`.

### Enum

- [x] Tạo `QuotationStatus`: `SUBMITTED`, `COMPLETED`, `FAILED`.
- [x] Tạo `ProcessingJobStatus`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.
- [x] Tạo `ProcessorType`: `HOSTED_MOCK`.

### Entity

- [x] Tạo `CustomerEntity`.
- [x] Tạo `ProductEntity`.
- [x] Tạo `QuotationEntity`.
- [x] Tạo `QuotationItemEntity`.
- [x] Tạo `ProcessingJobEntity`.
- [x] Khai báo relation và foreign key rõ ràng.
- [x] Dùng transformer hoặc mapper thống nhất cho PostgreSQL `numeric`.

### Migration đầu tiên

- [x] Tạo năm bảng theo `docs/PLAN_B_IMPLEMENTATION.md`.
- [x] Thêm unique constraint cho `customers.code`.
- [x] Thêm unique constraint cho `products.sku`.
- [x] Thêm unique constraint cho `quotations.quotation_number`.
- [x] Thêm unique constraint cho `processing_jobs.quotation_id` trong MVP.
- [x] Thêm check constraint cho giá, quantity, tax và discount không âm.
- [x] Thêm index phục vụ customer/product pagination.
- [x] Thêm index `(status, created_at)` cho `processing_jobs`.
- [x] Chạy migration trên database development.

### Seed

- [x] Tạo seed script idempotent.
- [x] Seed ít nhất ba customers.
- [x] Seed ít nhất năm products.
- [x] Chạy seed nhiều lần không tạo dữ liệu trùng.

### Checkpoint

```text
Migration chạy từ database trống thành công.          [ĐÃ ĐẠT]
Migration revert rồi run lại thành công.              [ĐÃ ĐẠT]
Database có 3 customers và 5 products mẫu.             [ĐÃ ĐẠT]
Ứng dụng kết nối Supabase PostgreSQL thành công.      [ĐÃ ĐẠT]
```

### Phase 2 completion record

- **Status:** COMPLETED
- **Completed at:** 2026-09-22
- **Changed files:**
  - `server/server/src/database/enums/quotation-status.enum.ts`: Định nghĩa enum `QuotationStatus`.
  - `server/server/src/database/enums/processing-job-status.enum.ts`: Định nghĩa enum `ProcessingJobStatus`.
  - `server/server/src/database/enums/processor-type.enum.ts`: Định nghĩa enum `ProcessorType`.
  - `server/server/src/database/entities/customer.entity.ts`: Định nghĩa `CustomerEntity` (code, name, soft delete, relations).
  - `server/server/src/database/entities/product.entity.ts`: Định nghĩa `ProductEntity` (sku, unitPrice numeric 15,2, isActive, soft delete).
  - `server/server/src/database/entities/quotation.entity.ts`: Định nghĩa `QuotationEntity` (quotationNumber, customerSnapshot jsonb, numeric financial fields).
  - `server/server/src/database/entities/quotation-item.entity.ts`: Định nghĩa `QuotationItemEntity` (snapshots, quantity, numeric unitPrice & lineTotal).
  - `server/server/src/database/entities/processing-job.entity.ts`: Định nghĩa `ProcessingJobEntity` (processorType, status, attemptCount, storage paths).
  - `server/server/src/database/entities/index.ts`: Barrel export cho 5 entities.
  - `server/server/src/database/migrations/1700000000000-InitialMigration.ts`: Migration khởi tạo PostgreSQL enums, 5 tables, check constraints, unique constraints, foreign keys và partial stable-order indexes.
  - `server/server/src/database/data-source.ts`: TypeORM DataSource cho CLI và AppModule tương thích TypeScript ESM.
  - `server/server/src/database/seeds/seed.ts`: Seed script idempotent tạo 3 customers và 5 products mẫu an toàn khi chạy nhiều lần.
  - `server/server/src/app.module.ts`: Tích hợp TypeOrmModule kết nối Supabase PostgreSQL qua `DATABASE_URL`.
  - `server/server/package.json`: Bổ sung các scripts `migration:create`, `migration:generate`, `migration:run`, `migration:revert`, `migration:show`, `seed`.
- **Database/migration status:** Initial migration đã chạy thành công trên database Supabase PostgreSQL (`[X] InitialMigration1700000000000`).
- **Seed status:** Seed idempotent đã chạy thành công 2 lần, bảo đảm không trùng lặp và có sẵn 3 customers, 5 products.
- **Verification:**
  - `npm run migration:run`: PASS (Migration executed successfully).
  - `npm run seed`: PASS (Đã seed 3 customers và 5 products).
  - `npm run seed` (lần 2): PASS (Idempotent - skipping existing records).
  - `npm run migration:show`: PASS (`[X] 1 InitialMigration1700000000000`).
- **Final relevant structure:**
  ```text
  server/server/src/database/
  ├── data-source.ts
  ├── enums/
  │   ├── processing-job-status.enum.ts
  │   ├── processor-type.enum.ts
  │   └── quotation-status.enum.ts
  ├── entities/
  │   ├── customer.entity.ts
  │   ├── index.ts
  │   ├── processing-job.entity.ts
  │   ├── product.entity.ts
  │   ├── quotation-item.entity.ts
  │   └── quotation.entity.ts
  ├── migrations/
  │   └── 1700000000000-InitialMigration.ts
  └── seeds/
      └── seed.ts
  ```
- **Remaining issues:** Không có.

---

## Phase 3 — Common pagination

- [x] Tạo `PaginationQueryDto` với `page >= 1`.
- [x] Đặt `limit` mặc định 10, nhỏ nhất 1, lớn nhất 100.
- [x] Tạo kiểu response `{ data, meta }`.
- [x] `meta` gồm `page`, `limit`, `total`, `totalPages`.
- [x] Dùng `skip = (page - 1) * limit` và `take = limit`.
- [x] Dùng stable ordering `created_at DESC, id DESC`.
- [x] Không load toàn bộ records rồi cắt trang trong memory.
- [x] Viết test cho page đầu, page cuối, page vượt quá dữ liệu và giới hạn `limit`.

### Checkpoint

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

### Phase 3 completion record

- **Status:** COMPLETED
- **Completed at:** 2026-09-22
- **Changed files:**
  - `server/server/src/common/pagination/pagination-query.dto.ts`: DTO phân trang (`page >= 1`, `limit` 1..100, transform sang number).
  - `server/server/src/common/pagination/pagination-meta.interface.ts`: Interface metadata `{ page, limit, total, totalPages }`.
  - `server/server/src/common/pagination/paginated-response.interface.ts`: Generic interface `PaginatedResponse<T>`.
  - `server/server/src/common/pagination/pagination.util.ts`: Hàm tính `calculatePaginationMeta`, `buildPaginatedResponse`, `getPaginationSkipTake`.
  - `server/server/src/common/pagination/pagination.spec.ts`: Unit tests kiểm tra 10 kịch bản pagination (default values, string transform, boundary check, page vượt dữ liệu).
- **Endpoints được tạo:** Không có endpoint riêng; là utility/DTO dùng chung cho tất cả các modules.
- **Tests được thêm:** 10 unit tests trong `src/common/pagination/pagination.spec.ts`.
- **Verification:**
  - `npm run test`: PASS (10/10 pagination tests passed).
  - `npm run lint`: PASS (0 warnings, 0 errors).
- **Manual API verification:** Đã kiểm thử qua `GET /api/customers` và `GET /api/products`: page mặc định, limit mặc định, `page=0` trả 400, `limit=101` trả 400, page vượt quá dữ liệu trả `data: []` với `totalPages` chính xác.
- **Final relevant structure:**
  ```text
  server/server/src/common/pagination/
  ├── paginated-response.interface.ts
  ├── pagination-meta.interface.ts
  ├── pagination-query.dto.ts
  ├── pagination.spec.ts
  └── pagination.util.ts
  ```
- **Deferred items:** Không có.
- **Remaining issues:** Không có.

---

## Phase 4 — Customer CRUD

### Module structure

- [x] Tạo `CustomersModule`.
- [x] Tạo `CustomersController`.
- [x] Tạo `CustomersService`.
- [x] Tạo `CreateCustomerDto` và `UpdateCustomerDto`.

### Endpoints

- [x] `GET /api/customers?page=1&limit=10`.
- [x] `GET /api/customers/:id`.
- [x] `POST /api/customers`.
- [x] `PATCH /api/customers/:id`.
- [x] `DELETE /api/customers/:id` dùng soft delete.
- [x] `GET /api/customers/:id/quotations` được hoàn thiện sau QuotationModule. (Đã hoàn thiện và kiểm tra trong Phase 6)

### Rules

- [x] Không trả customer đã soft delete trong list mặc định.
- [x] Customer detail không trả stack trace khi không tồn tại.
- [x] Code customer là unique.
- [x] Validate email khi có giá trị.
- [x] Không hard delete customer có lịch sử quotation.
- [x] List trả đúng pagination metadata.

### Checkpoint

- [x] CRUD customer chạy được bằng API client.
- [x] Pagination hoạt động qua ít nhất hai trang seed/test data.
- [x] Soft-deleted customer biến mất khỏi list.
- [x] Test service/controller quan trọng pass.

### Phase 4 completion record

- **Status:** COMPLETED
- **Completed at:** 2026-09-22
- **Changed files:**
  - `server/server/src/modules/customers/dto/create-customer.dto.ts`: DTO tạo customer (code, name, email validate, trimming & uppercase).
  - `server/server/src/modules/customers/dto/update-customer.dto.ts`: DTO cập nhật customer dùng PartialType.
  - `server/server/src/modules/customers/dto/customer-response.dto.ts`: DTO response định dạng dữ liệu trả về cho client.
  - `server/server/src/modules/customers/customers.service.ts`: Service xử lý nghiệp vụ, phân trang database (`findAndCount`), soft-delete, bắt lỗi trùng code PostgreSQL `23505` trả về `ConflictException`.
  - `server/server/src/modules/customers/customers.controller.ts`: Controller khai báo routes `GET`, `POST`, `PATCH`, `DELETE` (trả 204).
  - `server/server/src/modules/customers/customers.module.ts`: Khai báo CustomersModule kết nối TypeOrmModule feature CustomerEntity.
  - `server/server/src/modules/customers/customers.service.spec.ts`: Unit tests cho service (findAll, findById 404, duplicate code 409, remove 404).
  - `server/server/src/app.module.ts`: Import CustomersModule.
- **Endpoints được tạo:**
  - `GET /api/customers?page=1&limit=10`: 200 OK, trả danh sách phân trang.
  - `GET /api/customers/:id`: 200 OK (hoặc 404 nếu không tồn tại/đã soft-delete).
  - `POST /api/customers`: 201 Created (hoặc 409 Conflict nếu trùng code).
  - `PATCH /api/customers/:id`: 200 OK (hoặc 404).
  - `DELETE /api/customers/:id`: 204 No Content (soft delete).
- **Tests được thêm:** 4 unit tests trong `src/modules/customers/customers.service.spec.ts`.
- **Verification:**
  - `npm run test`: PASS.
  - `npm run lint`: PASS.
  - `npm run build`: PASS.
- **Manual API verification:**
  - `GET /api/customers?page=1&limit=2`: Trả 2 items, meta `total: 3`, `totalPages: 2`.
  - `POST /api/customers`: Tạo customer mới `CUS-999` trả 201 Created.
  - `POST /api/customers` trùng code `CUS-999`: Trả 409 Conflict với message `["Customer code already exists"]`.
  - `GET /api/customers/:id`: Trả thông tin chi tiết customer.
  - `PATCH /api/customers/:id`: Cập nhật thành công trả 200.
  - `DELETE /api/customers/:id`: Trả 204 No Content.
  - Sau khi delete: `GET /api/customers/:id` trả 404 Not Found, record biến mất khỏi danh sách phân trang.
- **Final relevant structure:**
  ```text
  server/server/src/modules/customers/
  ├── customers.controller.ts
  ├── customers.module.ts
  ├── customers.service.spec.ts
  ├── customers.service.ts
  └── dto/
      ├── create-customer.dto.ts
      ├── customer-response.dto.ts
      └── update-customer.dto.ts
  ```
- **Deferred items:** `GET /api/customers/:id/quotations` hoãn sang Phase 6 theo thiết kế.
- **Remaining issues:** Không có.

---

## Phase 5 — Product CRUD

### Module structure

- [x] Tạo `ProductsModule`.
- [x] Tạo `ProductsController`.
- [x] Tạo `ProductsService`.
- [x] Tạo `CreateProductDto` và `UpdateProductDto`.

### Endpoints

- [x] `GET /api/products?page=1&limit=10`.
- [x] `GET /api/products/:id`.
- [x] `POST /api/products`.
- [x] `PATCH /api/products/:id`.
- [x] `DELETE /api/products/:id` dùng soft delete.

### Rules

- [x] SKU là unique.
- [x] `unitPrice >= 0`.
- [x] Product picker mặc định chỉ lấy product active và chưa deleted.
- [x] Product bị xóa không phá quotation item snapshot cũ.
- [x] List trả đúng pagination metadata.
- [ ] Search theo SKU/name chỉ làm sau khi core pagination hoàn tất. (Optional / Out of scope)

### Checkpoint

- [x] CRUD product chạy được bằng API client.
- [x] Pagination hoạt động qua ít nhất hai trang seed/test data.
- [x] Product inactive/deleted không được dùng cho quotation mới.
- [x] Test service/controller quan trọng pass.

### Phase 5 completion record

- **Status:** COMPLETED
- **Completed at:** 2026-09-22
- **Changed files:**
  - `server/server/src/modules/products/dto/create-product.dto.ts`: DTO tạo product (sku uppercase, name, unit, unitPrice validate regex decimal string, isActive).
  - `server/server/src/modules/products/dto/update-product.dto.ts`: DTO cập nhật product dùng PartialType.
  - `server/server/src/modules/products/dto/product-response.dto.ts`: DTO response định dạng dữ liệu trả về cho client.
  - `server/server/src/modules/products/products.service.ts`: Service xử lý nghiệp vụ, phân trang database, chuẩn hóa `unitPrice` qua `decimal.js`, soft-delete, bắt lỗi trùng SKU PostgreSQL `23505` trả về `ConflictException`.
  - `server/server/src/modules/products/products.controller.ts`: Controller khai báo routes `GET`, `POST`, `PATCH`, `DELETE` (trả 204).
  - `server/server/src/modules/products/products.module.ts`: Khai báo ProductsModule kết nối TypeOrmModule feature ProductEntity.
  - `server/server/src/modules/products/products.service.spec.ts`: Unit tests cho service (findAll, create with Decimal normalization, duplicate SKU 409, remove 404).
  - `server/server/src/app.module.ts`: Import ProductsModule.
- **Endpoints được tạo:**
  - `GET /api/products?page=1&limit=10`: 200 OK, trả danh sách phân trang.
  - `GET /api/products/:id`: 200 OK (hoặc 404 nếu không tồn tại/đã soft-delete).
  - `POST /api/products`: 201 Created (hoặc 409 Conflict nếu trùng SKU).
  - `PATCH /api/products/:id`: 200 OK (hoặc 404).
  - `DELETE /api/products/:id`: 204 No Content (soft delete).
- **Tests được thêm:** 4 unit tests trong `src/modules/products/products.service.spec.ts`.
- **Verification:**
  - `npm run test`: PASS.
  - `npm run lint`: PASS.
  - `npm run build`: PASS.
- **Manual API verification:**
  - `GET /api/products?page=1&limit=2`: Trả 2 items, meta `total: 5`, `totalPages: 3`.
  - `POST /api/products`: Tạo product mới `PRD-999` với unitPrice `3500000.00` trả 201 Created.
  - `POST /api/products` trùng SKU `PRD-999`: Trả 409 Conflict với message `["Product SKU already exists"]`.
  - `GET /api/products/:id`: Trả thông tin chi tiết product.
  - `PATCH /api/products/:id`: Cập nhật thành công trả 200.
  - `DELETE /api/products/:id`: Trả 204 No Content.
  - Sau khi delete: `GET /api/products/:id` trả 404 Not Found, record biến mất khỏi danh sách phân trang.
- **Final relevant structure:**
  ```text
  server/server/src/modules/products/
  ├── dto/
  │   ├── create-product.dto.ts
  │   ├── product-response.dto.ts
  │   └── update-product.dto.ts
  ├── products.controller.ts
  ├── products.module.ts
  ├── products.service.spec.ts
  └── products.service.ts
  ```
- **Deferred items:** Search theo SKU/name là tính năng mở rộng nằm ngoài scope core pagination.
- **Remaining issues:** Không có.

---

## Phase 6 — Quotation core và calculator

### Module structure

- [x] Tạo `QuotationsModule`.
- [x] Tạo `QuotationsController`.
- [x] Tạo `QuotationsService`.
- [x] Tạo `QuotationCalculatorService`.
- [x] Tạo DTO cho create quotation và item input.

### Calculator

- [x] Dùng `decimal.js`; không cộng tiền bằng floating point trực tiếp.
- [x] Tính `lineTotal = quantity × unitPrice`.
- [x] Tính `subtotal = sum(lineTotal)`.
- [x] Validate `discountAmount <= subtotal`.
- [x] Tính `taxableAmount = subtotal - discountAmount`.
- [x] Tính `taxAmount = taxableAmount × taxRate / 100`.
- [x] Tính `totalAmount = taxableAmount + taxAmount`.
- [x] Chốt quy tắc rounding hai chữ số thập phân.
- [x] Viết unit tests cho calculator trước khi nối database.

### Create quotation transaction

- [x] `POST /api/customers/:customerId/quotations`.
- [x] Kiểm tra customer tồn tại và chưa deleted.
- [x] Kiểm tra có ít nhất một item.
- [x] Load toàn bộ product từ database theo product IDs.
- [x] Reject product thiếu, inactive hoặc deleted.
- [x] Không nhận `unitPrice` chính thức từ client.
- [x] Tạo `customer_snapshot`.
- [x] Tạo quotation item snapshots.
- [x] Tạo quotation number `QT-YYYYMMDD-XXXX`.
- [x] Tính amounts ở backend.
- [x] Tạo quotation `SUBMITTED`.
- [x] Tạo processing job `PENDING` trong cùng transaction.
- [x] Trả `202 Accepted` cùng `quotationId`, `quotationNumber`, `jobId`, `status`.

### Read endpoints

- [x] `GET /api/quotations/:id` trả quotation, customer snapshot, items và job hiện tại.
- [x] Hoàn thiện `GET /api/customers/:id/quotations`.
- [x] Lịch sử báo giá có thứ tự mới nhất trước.

### Checkpoint

- [x] Tạo quotation với hai products thành công.
- [x] Giá lưu trong items đúng với database.
- [x] Thay giá product sau đó không làm thay đổi quotation cũ.
- [x] Customer/product/job được lưu nhất quán khi transaction thành công.
- [x] Khi transaction lỗi, không có quotation hoặc job dở dang.

### Phase 6 completion record

- **Status:** COMPLETED
- **Completed at:** 2026-09-22
- **Changed files:**
  - `server/server/src/modules/quotations/types/customer-snapshot.type.ts`: Interface typed cho customer snapshot (`id`, `code`, `name`, `companyName`, `email`, `phone`, `address`).
  - `server/server/src/modules/quotations/types/quotation-calculation.type.ts`: Interface typed cho kết quả tính toán chi tiết từng dòng và tổng tiền.
  - `server/server/src/modules/quotations/quotation-calculator.service.ts`: Pure business service dùng `decimal.js`, làm tròn `ROUND_HALF_UP` 2 chữ số thập phân, validate discount/tax.
  - `server/server/src/modules/quotations/quotation-calculator.service.spec.ts`: Unit tests kiểm tra 6 kịch bản tính toán, làm tròn, validate lỗi âm/vượt subtotal.
  - `server/server/src/modules/quotations/dto/create-quotation-item.dto.ts`: DTO validate từng item (productId UUID v4, quantity decimal string > 0 tối đa 2 chữ số).
  - `server/server/src/modules/quotations/dto/create-quotation.dto.ts`: DTO tạo quotation (validate nested items, cấm duplicate productId, taxRate 0-100, validUntil >= today).
  - `server/server/src/modules/quotations/dto/quotation-item-response.dto.ts`: DTO response chi tiết cho item.
  - `server/server/src/modules/quotations/dto/quotation-response.dto.ts`: DTO response chi tiết quotation kèm snapshots và tóm tắt processing job.
  - `server/server/src/modules/quotations/dto/quotation-list-item.dto.ts`: DTO tóm tắt phục vụ danh sách phân trang lịch sử báo giá của khách hàng.
  - `server/server/src/modules/quotations/quotations.service.ts`: Service nghiệp vụ quản lý quotation, transaction nguyên tử tạo quotation, items và job, sinh số `QT-YYYYMMDD-XXXX`, phân trang lịch sử báo giá.
  - `server/server/src/modules/quotations/quotations.service.spec.ts`: Unit tests cho QuotationsService (8 kịch bản bao gồm transaction, validation, snapshot, pagination).
  - `server/server/src/modules/quotations/quotations.controller.ts`: Controller định tuyến `POST /api/customers/:customerId/quotations` (202), `GET /api/customers/:customerId/quotations` (200), `GET /api/quotations/:id` (200).
  - `server/server/src/modules/quotations/quotations.module.ts`: Khai báo QuotationsModule kết nối các repository TypeORM và export service.
  - `server/server/src/app.module.ts`: Import QuotationsModule.
- **Calculator rules:**
  - Sử dụng thư viện `decimal.js` với chế độ làm tròn `Decimal.ROUND_HALF_UP`.
  - `lineTotal = quantity × unitPrice` (định dạng 2 chữ số thập phân).
  - `subtotal = sum(lineTotal)`.
  - Validate `discountAmount <= subtotal`, nếu lớn hơn trả 400 Bad Request.
  - `taxableAmount = subtotal - discountAmount`.
  - `taxAmount = taxableAmount × taxRate / 100` (làm tròn 2 chữ số thập phân).
  - `totalAmount = taxableAmount + taxAmount` (làm tròn 2 chữ số thập phân).
  - Deterministic pure service, không truy cập database, không biến đổi input ban đầu.
- **Transaction behavior:**
  - Sử dụng TypeORM `QueryRunner` quản lý 1 database transaction duy nhất.
  - Kiểm tra customer tồn tại & chưa soft-deleted (404 nếu không tìm thấy).
  - Tải danh sách sản phẩm theo batch `In(productIds)` kiểm tra active & chưa soft-deleted (400 nếu thiếu/inactive/duplicate).
  - Sinh số báo giá `QT-YYYYMMDD-XXXX` (retry lên đến 3 lần nếu xảy ra collision unique constraint PostgreSQL `23505`).
  - Ghi đồng thời: `QuotationEntity` (status `SUBMITTED`), danh sách `QuotationItemEntity`, và `ProcessingJobEntity` (status `PENDING`, `attemptCount = 0`).
  - Commit transaction hoặc Rollback toàn bộ nếu bất kỳ bước nào thất bại.
- **Endpoints:**
  - `POST /api/customers/:customerId/quotations` -> HTTP 202 Accepted.
  - `GET /api/quotations/:id` -> HTTP 200 OK.
  - `GET /api/customers/:customerId/quotations` -> HTTP 200 OK (phân trang `{ data, meta }`, sắp xếp `createdAt DESC, id DESC`).
- **Snapshot verification:**
  - Customer snapshot lưu nguyên vẹn: `id`, `code`, `name`, `companyName`, `email`, `phone`, `address`.
  - Item snapshots lưu `productId`, `productSku`, `productName`, `description`, `unit`, `quantity`, `unitPrice`, `lineTotal`.
  - Đã thực nghiệm chỉnh sửa tên khách hàng và đơn giá sản phẩm trên database live dev; `GET /api/quotations/:id` vẫn giữ nguyên giá trị snapshot ban đầu.
- **Tests:**
  - Calculator: 6/6 unit tests PASS.
  - Quotations service: 8/8 unit tests PASS.
- **Manual API/database verification:**
  - `POST /api/customers/:customerId/quotations`: Tạo thành công quotation `QT-20260922-B359` với 2 sản phẩm, trả 202 Accepted với `jobId` và status `PENDING`.
  - `GET /api/quotations/:id`: Trả thông tin chi tiết đầy đủ snapshots và tóm tắt job `PENDING`.
  - `GET /api/customers/:customerId/quotations`: Hiển thị lịch sử báo giá đúng phân trang.
  - Input validation: Từ chối duplicate productId (400), validUntil trong quá khứ (400), discount > subtotal (400), product không tồn tại (400).
- **Final relevant structure:**
  ```text
  server/server/src/modules/quotations/
  ├── dto/
  │   ├── create-quotation-item.dto.ts
  │   ├── create-quotation.dto.ts
  │   ├── quotation-item-response.dto.ts
  │   ├── quotation-list-item.dto.ts
  │   └── quotation-response.dto.ts
  ├── types/
  │   ├── customer-snapshot.type.ts
  │   └── quotation-calculation.type.ts
  ├── quotation-calculator.service.spec.ts
  ├── quotation-calculator.service.ts
  ├── quotations.controller.ts
  ├── quotations.module.ts
  ├── quotations.service.spec.ts
  └── quotations.service.ts
  ```
- **Remaining issues:** Không có.

---

## Phase 7 — Processing job, background runner và retry

### Processing job API

- [x] Tạo `ProcessingJobsModule`.
- [x] `GET /api/processing-jobs/:id` trả payload nhỏ cho client polling.
- [x] Response có `attemptCount` và `maxAttempts: 3`.

### Background runner

- [x] Đăng ký `ScheduleModule`.
- [x] Tạo `ProcessingJobRunner` chạy theo `JOB_POLL_INTERVAL_MS`.
- [x] Chỉ lấy một job `PENDING` trong một tick.
- [x] Claim job bằng conditional update atomic.
- [x] Chuyển `PENDING → PROCESSING`.
- [x] Tăng `attempt_count` khi claim.
- [x] Không chạy hai tick chồng lên nhau trong cùng process.
- [x] Khi thành công chuyển job và quotation sang `COMPLETED`.
- [x] Khi lỗi chuyển job và quotation sang `FAILED`.
- [x] Lưu error message an toàn; không lưu/trả secret hoặc stack trace công khai.

### Retry

- [x] `POST /api/processing-jobs/:id/retry`.
- [x] Chỉ chấp nhận job `FAILED`.
- [x] Từ chối khi `attempt_count >= 3` bằng `409 Conflict`.
- [x] Conditional update `FAILED → PENDING` chống double submit.
- [x] Xóa `error_message`, `started_at`, `completed_at` cũ.
- [x] Đặt quotation về `SUBMITTED`.
- [x] Không tăng attempt ở retry endpoint; tăng khi runner claim lại.
- [x] Trả `202 Accepted`.

### Tests

- [x] Không claim cùng một job hai lần.
- [x] Không retry job `PENDING`, `PROCESSING` hoặc `COMPLETED`.
- [x] Retry job `FAILED` còn lượt thành công.
- [x] Không retry sau ba attempts.
- [x] Hai retry requests gần đồng thời chỉ một request thành công.

### Checkpoint

```text
PENDING → PROCESSING → COMPLETED
PENDING → PROCESSING → FAILED → retry → PENDING
```

### Phase 7 completion record

- **Status:** COMPLETED
- **Completed at:** 2026-09-22
- **Changed files:**
  - `server/server/src/config/env.validation.ts`: Bổ sung validate boolean `JOB_PROCESSOR_ENABLED` (mặc định `false`).
  - `server/server/.env.example`: Thêm mẫu `JOB_PROCESSOR_ENABLED=false`.
  - `server/server/src/modules/processing-jobs/processor/quotation-processor.interface.ts`: Interface contract `ProcessorResult` và `QuotationProcessor` cho Phase 8.
  - `server/server/src/modules/processing-jobs/processor/quotation-processor.token.ts`: Dependency injection token `QUOTATION_PROCESSOR_TOKEN`.
  - `server/server/src/modules/processing-jobs/processor/unconfigured-quotation-processor.service.ts`: Provider mặc định ném lỗi rõ ràng khi runtime chưa cấu hình processor thật.
  - `server/server/src/modules/processing-jobs/dto/processing-job-response.dto.ts`: DTO response trạng thái job (`maxAttempts: 3`, không trả filePath nội bộ).
  - `server/server/src/modules/processing-jobs/dto/retry-processing-job-response.dto.ts`: DTO response khi retry job (HTTP 202).
  - `server/server/src/modules/processing-jobs/processing-jobs.service.ts`: Service xử lý trạng thái job, atomic claim với SQL `FOR UPDATE SKIP LOCKED`, complete/fail transitions, và conditional retry logic.
  - `server/server/src/modules/processing-jobs/processing-jobs.service.spec.ts`: 12 unit tests kiểm tra state transitions, sanitization, conditional retry logic.
  - `server/server/src/modules/processing-jobs/processing-job-runner.service.ts`: Background runner tích hợp `@Interval(2000)` từ `@nestjs/schedule`, kiểm tra `JOB_PROCESSOR_ENABLED`, chống chạy chồng lấn tick.
  - `server/server/src/modules/processing-jobs/processing-job-runner.service.spec.ts`: 4 unit tests cho background runner và unconfigured processor.
  - `server/server/src/modules/processing-jobs/processing-jobs.controller.ts`: Controller định nghĩa `GET /api/processing-jobs/:id` (200) và `POST /api/processing-jobs/:id/retry` (202).
  - `server/server/src/modules/processing-jobs/processing-jobs.module.ts`: Khai báo ProcessingJobsModule, đăng ký processor provider và export service.
  - `server/server/src/app.module.ts`: Đăng ký `ScheduleModule.forRoot()` và import `ProcessingJobsModule`.
- **State transitions:**
  - `PENDING → PROCESSING`: runner claim atomic, tăng `attemptCount` thêm 1, gán `startedAt`.
  - `PROCESSING → COMPLETED`: khi processor thành công, cập nhật thông tin file, `completedAt`, chuyển quotation sang `COMPLETED`.
  - `PROCESSING → FAILED`: khi processor lỗi, làm sạch error message, gán `completedAt`, chuyển quotation sang `FAILED`.
  - `FAILED → PENDING`: người dùng gọi retry, xóa lỗi, reset quotation sang `SUBMITTED`, không tăng `attemptCount`.
- **Atomic claim implementation:**
  - Truy vấn PostgreSQL nguyên tử với `FOR UPDATE SKIP LOCKED`:
    ```sql
    UPDATE processing_jobs
    SET
      status = 'PROCESSING',
      attempt_count = attempt_count + 1,
      started_at = NOW(),
      completed_at = NULL,
      error_message = NULL
    WHERE id = (
      SELECT id
      FROM processing_jobs
      WHERE status = 'PENDING'
        AND attempt_count < 3
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id;
    ```
- **Retry behavior:**
  - Chỉ cho phép khi job `status = FAILED` và `attemptCount < 3`.
  - Từ chối với `409 Conflict` nếu job đang ở trạng thái khác (`PENDING`, `PROCESSING`, `COMPLETED`).
  - Từ chối với `409 Conflict` nếu `attemptCount >= 3`.
  - Conditional update đảm bảo hai requests retry đồng thời chỉ có duy nhất 1 request thành công.
- **Processor contract:**
  - Định nghĩa interface `QuotationProcessor` với phương thức `process(job: ProcessingJobEntity): Promise<ProcessorResult>`.
  - Token injection `QUOTATION_PROCESSOR_TOKEN`.
  - `UnconfiguredQuotationProcessor` ném lỗi khi được gọi; tuyệt đối không sinh fake COMPLETED hay hardcoded file.
- **JOB_PROCESSOR_ENABLED behavior:**
  - Cấu hình mặc định là `false`. Runner bỏ qua tick, không claim job, giữ nguyên trạng thái `PENDING` an toàn.
- **Tests:**
  - 12 unit tests cho `ProcessingJobsService`.
  - 4 unit tests cho `ProcessingJobRunner` và `UnconfiguredQuotationProcessor`.
- **Manual verification:**
  - `GET /api/processing-jobs/:id`: trả trạng thái `PENDING`, `attemptCount: 0`, `maxAttempts: 3`.
  - `POST /api/processing-jobs/:id/retry` trên job `PENDING`: trả 409 Conflict với thông điệp từ chối chính xác.
  - Không có job nào bị chuyển sang COMPLETED giả khi processor chưa cài đặt.
- **Final relevant structure:**
  ```text
  server/server/src/modules/processing-jobs/
  ├── dto/
  │   ├── processing-job-response.dto.ts
  │   └── retry-processing-job-response.dto.ts
  ├── processor/
  │   ├── quotation-processor.interface.ts
  │   ├── quotation-processor.token.ts
  │   └── unconfigured-quotation-processor.service.ts
  ├── processing-job-runner.service.spec.ts
  ├── processing-job-runner.service.ts
  ├── processing-jobs.controller.ts
  ├── processing-jobs.module.ts
  ├── processing-jobs.service.spec.ts
  └── processing-jobs.service.ts
  ```
- **Deferred to Phase 8:**
  - PDF generation (pdf-lib, fontkit, Noto Sans).
  - Supabase Storage upload và signed download URLs.
  - Processor runtime enablement (`JOB_PROCESSOR_ENABLED=true`).
- **Remaining issues:** Không có.


---

## Phase 8 — PDF template và Supabase Storage

### PDF

- [x] Tạo `PdfModule` và `QuotationPdfService`.
- [x] Thêm Noto Sans Regular/Bold vào `src/assets/fonts` và ghi nguồn/license.
- [x] Embed font bằng `@pdf-lib/fontkit` để hỗ trợ tiếng Việt.
- [x] Tạo template version `v1`.
- [x] Render thông tin công ty bán hàng.
- [x] Render quotation number, ngày tạo, ngày hết hạn.
- [x] Render customer snapshot.
- [x] Render bảng items và xử lý nhiều dòng/trang.
- [x] Render subtotal, discount, VAT và total.
- [x] Render delivery address, payment terms, notes và chữ ký.
- [x] Format tiền VND và ngày tháng thống nhất.
- [x] Tạo filename `quotation-{quotationNumber}.pdf`.
- [x] Tính checksum SHA-256 cho file.

### Storage

- [x] Tạo private bucket `quotation-files` trên Supabase.
- [x] Tạo `StorageModule` và `SupabaseStorageService`.
- [x] Upload vào `quotations/{year}/{quotationId}/quotation-{quotationNumber}.pdf`.
- [x] Lưu object path, filename và checksum; không lưu signed URL.
- [x] Dùng deterministic path để retry có thể ghi đè an toàn cùng file của job đó.
- [x] `GET /api/quotations/:id/download` chỉ cho job `COMPLETED`.
- [x] Tạo signed URL hết hạn sau khoảng 300 giây.
- [x] Download trước khi completed trả `409 Conflict`.

### Nối processor

- [x] Tạo `MockMacProcessorService`.
- [x] Load quotation cùng snapshots/items.
- [x] Gọi PDF service.
- [x] Gọi storage service.
- [x] Cập nhật job completion trong database.
- [x] Failure ở PDF/storage phải đi qua luồng `FAILED` và có thể retry.

### Checkpoint

- [x] Một job thật chạy từ PENDING đến COMPLETED.
- [x] PDF tải được qua signed URL.
- [x] PDF hiển thị đúng tiếng Việt và amounts.
- [x] Storage bucket không public.
- [x] Lỗi upload tạo job FAILED và retry xử lý lại được.

### Phase 8 completion record

- **Status:** COMPLETED
- **Completed at:** 2026-09-23
- **Changed files:**
  - `server/server/src/assets/fonts/NotoSans-Regular.ttf`: Font Noto Sans Regular phục vụ render tiếng Việt.
  - `server/server/src/assets/fonts/NotoSans-Bold.ttf`: Font Noto Sans Bold phục vụ render tiêu đề, nhãn đậm.
  - `server/server/src/assets/fonts/OFL.txt`: Giấy phép mã nguồn mở SIL Open Font License cho Noto Sans.
  - `server/server/nest-cli.json`: Thêm cấu hình compilerOptions.assets sao chép `assets/**/*` vào thư mục `dist`.
  - `server/server/src/modules/pdf/config/quotation-company.config.ts`: Metadata thông tin công ty bán lẻ/phân phối mặc định (ABC Tech).
  - `server/server/src/modules/pdf/templates/quotation-v1.template.ts`: Layout PDF chuẩn A4, format tiền tệ VND, bảng hàng hóa tự tính ngắt trang nhiều trang, chữ ký và số trang `Trang X / Y`.
  - `server/server/src/modules/pdf/quotation-pdf.service.ts`: Dịch vụ khởi tạo pdf-lib, đăng ký fontkit, nhúng Noto Sans tiếng Việt và render template v1.
  - `server/server/src/modules/pdf/quotation-pdf.service.spec.ts`: Unit test cho PDF service (A4 layout, ngắt trang nhiều item, null safety, template version validation).
  - `server/server/src/modules/pdf/pdf.module.ts`: NestJS module cung cấp và export `QuotationPdfService`.
  - `server/server/src/modules/storage/storage.interface.ts`: Interface hợp đồng `FileStorage`, `StoredFile`, `UploadPdfInput`.
  - `server/server/src/modules/storage/storage.token.ts`: Injection token `FILE_STORAGE_TOKEN`.
  - `server/server/src/modules/storage/supabase-storage.service.ts`: Triển khai `FileStorage` với Supabase Storage (private bucket `quotation-files`, SHA-256 checksum, signed URL 300s, sanitize error).
  - `server/server/src/modules/storage/supabase-storage.service.spec.ts`: Unit test cho Supabase storage (upload, checksum, signed url, error handling).
  - `server/server/src/modules/storage/storage.module.ts`: Module export `SupabaseStorageService` và `FILE_STORAGE_TOKEN`.
  - `server/server/src/modules/processing-jobs/processor/mock-mac-processor.service.ts`: Triển khai `QuotationProcessor` thật: tải quotation + items, gọi PdfService tạo PDF, gọi StorageService tải lên path tất định và trả về kết quả cho job runner.
  - `server/server/src/modules/processing-jobs/processor/mock-mac-processor.service.spec.ts`: Unit test cho mock processor (xử lý thành công, lỗi không tìm thấy quotation, lỗi sinh PDF).
  - `server/server/src/modules/processing-jobs/processing-jobs.module.ts`: Đăng ký `PdfModule`, `StorageModule` và bind `MockMacProcessorService` vào `QUOTATION_PROCESSOR_TOKEN`.
  - `server/server/src/modules/processing-jobs/processing-job-runner.service.ts`: Loại bỏ `@Interval(2000)` cứng, thay bằng interval động theo `JOB_POLL_INTERVAL_MS`, lifecycle hooks `OnModuleInit`/`OnApplicationShutdown` an toàn và log sanitize.
  - `server/server/src/modules/quotations/quotations.controller.ts`: Bổ sung endpoint `GET /api/quotations/:id/download`.
  - `server/server/src/modules/quotations/services/quotations.service.ts`: Bổ sung phương thức `getDownloadUrl` (kiểm tra job `COMPLETED`, trả về 409 Conflict nếu job chưa xong, tạo signed URL 300s).
  - `server/server/src/modules/quotations/quotations.module.ts`: Import `StorageModule`.
  - `server/server/src/app.module.ts`: Đăng ký `PdfModule` và `StorageModule`.
  - `samples/quotation-sample.pdf`: File PDF mẫu được render và kiểm tra tính toàn vẹn (607,530 bytes).
- **PDF generation:** Sử dụng `pdf-lib` kết hợp `@pdf-lib/fontkit` nhúng bộ font `Noto Sans Regular` và `Noto Sans Bold`, giải quyết triệt để vấn đề hiển thị ký tự có dấu trong tiếng Việt. Định dạng chuẩn A4, đầy đủ thông tin bên bán, bên mua (snapshot), bảng báo giá phân trang tự động, điều khoản và chữ ký.
- **Storage:** Private bucket `quotation-files`, lưu trữ theo cấu trúc tất định `quotations/{year}/{quotationId}/quotation-{quotationNumber}.pdf`. Tính toán checksum SHA-256 tự động. Cơ chế signed URL có thời hạn hợp lệ 300 giây. Không lưu public URL vào database.
- **Processor integration:** `MockMacProcessorService` thực thi giao diện `QuotationProcessor`, tải đầy đủ dữ liệu báo giá và chi tiết mặt hàng, sinh PDF nhúng font tiếng Việt, lưu trữ qua `FileStorage` và cập nhật kết quả vào `processing_jobs`.
- **Verification:**
  - `npm test`: PASS (11 test suites, 73 tests passed 100%).
  - `npm run test:e2e`: PASS (3 e2e tests passed 100%).
  - `npm run lint`: PASS (0 warnings, 0 errors).
  - `npm run build`: PASS (Nest build thành công, font assets được copy tự động vào `dist/assets/fonts/`).
  - `npm run migration:show`: PASS (`[X] 1 InitialMigration1700000000000`).
  - File PDF mẫu tại `samples/quotation-sample.pdf` đạt dung lượng 607,530 bytes, mở đọc hoàn hảo với tiêu chuẩn `%PDF-`.
- **Final relevant structure:**
  ```text
  server/server/src/
  ├── assets/
  │   └── fonts/
  │       ├── NotoSans-Bold.ttf
  │       ├── NotoSans-Regular.ttf
  │       └── OFL.txt
  ├── modules/
  │   ├── pdf/
  │   │   ├── config/
  │   │   │   └── quotation-company.config.ts
  │   │   ├── pdf.module.ts
  │   │   ├── quotation-pdf.service.spec.ts
  │   │   ├── quotation-pdf.service.ts
  │   │   └── templates/
  │   │       └── quotation-v1.template.ts
  │   ├── processing-jobs/
  │   │   ├── processing-job-runner.service.spec.ts
  │   │   ├── processing-job-runner.service.ts
  │   │   ├── processing-jobs.controller.ts
  │   │   ├── processing-jobs.module.ts
  │   │   ├── processing-jobs.service.spec.ts
  │   │   ├── processing-jobs.service.ts
  │   │   └── processor/
  │   │       ├── mock-mac-processor.service.spec.ts
  │   │       ├── mock-mac-processor.service.ts
  │   │       ├── quotation-processor.interface.ts
  │   │       └── quotation-processor.token.ts
  │   ├── quotations/
  │   │   ├── dto/
  │   │   ├── enitities/
  │   │   ├── quotations.controller.ts
  │   │   ├── quotations.module.ts
  │   │   └── services/
  │   │       ├── quotation-calculator.service.spec.ts
  │   │       ├── quotation-calculator.service.ts
  │   │       ├── quotations.service.spec.ts
  │   │       └── quotations.service.ts
  │   └── storage/
  │       ├── storage.interface.ts
  │       ├── storage.module.ts
  │       ├── storage.token.ts
  │       ├── supabase-storage.service.spec.ts
  │       └── supabase-storage.service.ts
  ```
- **Remaining issues:** Không có.

---

## Phase 9 — Gemini quotation draft

### Adapter

- [x] Tạo interface `QuotationDraftExtractor`.
- [x] Tạo `GeminiQuotationDraftExtractor`.
- [x] Chỉ adapter biết Gemini SDK; controller/service không phụ thuộc trực tiếp provider.
- [x] Giữ khả năng bổ sung `CodexCliQuotationDraftExtractor` sau này.

### Prompt và schema

- [x] Yêu cầu Gemini trả structured JSON.
- [x] Schema chỉ gồm product query, quantity, delivery, payment terms, validity và notes.
- [x] Trường không có trong input phải là `null` hoặc nằm trong `unresolvedFields`.
- [x] Cấm AI tạo giá, tax, discount, product ID hoặc điều khoản không có trong input.
- [x] Validate response bằng Zod trước khi dùng.
- [x] Đặt giới hạn độ dài `rawRequest`.
- [x] Chuẩn hóa timeout/quota/invalid-output thành error an toàn.

### Endpoint và product matching

- [x] `POST /api/ai/quotation-draft`.
- [x] Validate customer tồn tại.
- [x] Tìm product candidates theo SKU/name bằng query thông thường; không cần vector database.
- [x] Trả nhiều candidates nếu không xác định được product chính xác.
- [x] Không tự submit quotation.
- [x] Nếu Gemini lỗi, endpoint báo lỗi nhưng core quotation API vẫn hoạt động.

### Checkpoint

- [x] Input tiếng Việt tạo draft hợp lệ.
- [x] Field thiếu được báo rõ.
- [x] AI không tạo giá.
- [x] Product candidate luôn lấy từ PostgreSQL.
- [x] Quotation thủ công vẫn hoạt động khi Gemini key không khả dụng.

### Phase 9 completion record

- **Status:** PARTIAL (Implementation và automated tests hoàn thành 100%; Manual test với live Gemini provider đang chờ cung cấp `GEMINI_API_KEY` và `GEMINI_MODEL` trong môi trường runtime).
- **Completed at:** 2026-09-23
- **Changed files:**
  - `server/server/.env.example`: Bổ sung các biến `GEMINI_MODEL=` và `AI_REQUEST_TIMEOUT_MS=15000`.
  - `server/server/src/config/env.validation.ts`: Thêm validation Joi cho `GEMINI_MODEL` (optional string) và `AI_REQUEST_TIMEOUT_MS` (positive number, default 15000).
  - `server/server/src/modules/ai/dto/product-candidate.dto.ts`: DTO `ProductCandidateDto` chứa thông tin ứng viên sản phẩm từ PostgreSQL (`id`, `sku`, `name`, `description`, `unit`, `unitPrice`).
  - `server/server/src/modules/ai/dto/create-quotation-draft.dto.ts`: DTO `CreateQuotationDraftDto` cho request (`customerId` UUID v4, `rawRequest` string 1-5000 ký tự có trim, chặn field thừa).
  - `server/server/src/modules/ai/dto/quotation-draft-item.dto.ts`: DTO `QuotationDraftItemDto` đại diện cho một mục sản phẩm trong bản nháp kèm mảng ứng viên `candidates`.
  - `server/server/src/modules/ai/dto/quotation-draft-response.dto.ts`: DTO `QuotationDraftResponseDto` chuẩn hóa dữ liệu trả về cho client.
  - `server/server/src/modules/ai/extractors/quotation-draft-extractor.interface.ts`: Interface trừu tượng `QuotationDraftExtractor` và các kiểu dữ liệu trích xuất độc lập với provider.
  - `server/server/src/modules/ai/extractors/quotation-draft-extractor.token.ts`: Injection token `QUOTATION_DRAFT_EXTRACTOR_TOKEN`.
  - `server/server/src/modules/ai/prompts/quotation-draft.prompt.ts`: System instructions nghiêm ngặt và hàm tạo prompt trích xuất, chống prompt injection, nghiêm cấm sinh giá và ID.
  - `server/server/src/modules/ai/schemas/quotation-draft.schema.ts`: Zod strict schema (`.strict()`) xác thực và hàm `parseAndNormalizeDraft` chuẩn hóa `quantity` (Decimal tối đa 2 chữ số thập phân), chặn mọi field cấm.
  - `server/server/src/modules/ai/extractors/gemini-quotation-draft.extractor.ts`: Triển khai `QuotationDraftExtractor` với SDK `@google/genai` (`GoogleGenAI`), cấu hình structured schema, abort timeout và ánh xạ lỗi HTTP chuẩn (502, 503, 504).
  - `server/server/src/modules/ai/extractors/gemini-quotation-draft.extractor.spec.ts`: Unit test cho extractor (12 tests) bao phủ trích xuất, parse markdown JSON, invalid JSON, empty output, extra fields, timeout, quota error, prompt injection.
  - `server/server/src/modules/ai/ai.service.ts`: Điều phối luồng nghiệp vụ: kiểm tra customer qua `CustomersService`, gọi extractor, tìm kiếm ứng viên qua `ProductsService.findActiveCandidates`, bổ sung và loại trùng `unresolvedFields`.
  - `server/server/src/modules/ai/ai.service.spec.ts`: Unit test cho AiService (6 tests) bao phủ customer 404, trim request, candidate matching, thiếu candidate, nhiều candidates, thiếu field chung, deduplication.
  - `server/server/src/modules/ai/ai.controller.ts`: Controller cung cấp endpoint `POST /api/ai/quotation-draft`.
  - `server/server/src/modules/ai/ai.module.ts`: NestJS module đăng ký provider, binding token và controller.
  - `server/server/src/modules/products/products.service.ts`: Thêm method `findActiveCandidates` tìm kiếm sản phẩm đang hoạt động theo SKU/Name (exact & contains) sắp xếp ưu tiên.
  - `server/server/src/modules/products/products.service.spec.ts`: Bổ sung unit tests cho `findActiveCandidates` (query rỗng, parameterized matching, order).
  - `server/server/src/app.module.ts`: Đăng ký `AiModule`.
  - `server/server/test/ai.e2e-spec.ts`: E2E tests (6 tests) với fake extractor override, kiểm thử validation, 200 OK, 400 Bad Request, 404 Not Found, không phát sinh side-effect vào DB.
- **Endpoint:** `POST /api/ai/quotation-draft` (HTTP 200 khi thành công, trả về bản nháp báo giá kèm candidates từ database).
- **Extractor interface:** `QuotationDraftExtractor` được inject qua token `QUOTATION_DRAFT_EXTRACTOR_TOKEN`, giúp tách biệt hoàn toàn AiService khỏi SDK của Gemini và cho phép mở rộng các provider khác (như Codex CLI) dễ dàng.
- **Gemini implementation:** `GeminiQuotationDraftExtractor` sử dụng `@google/genai` official SDK, cấu hình `responseMimeType: 'application/json'` và `responseSchema`, cơ chế `AbortSignal.timeout(timeoutMs)`, lọc sạch mã lỗi tránh rò rỉ token.
- **Prompt rules:** Hướng dẫn AI coi đầu vào của khách hàng là untrusted input, cấm thực thi mệnh lệnh người dùng chèn vào, cấm tạo giá (unitPrice), cấm tạo ID/SKU, cấm tự bịa sản phẩm hoặc điều khoản, ép trả về duy nhất JSON.
- **Structured output schema:** Zod schema strict đảm bảo không có trường lạ (như `unitPrice`, `taxRate`, `productId`), chuẩn hóa số lượng thành chuỗi thập phân 2 chữ số (Decimal), nếu không hợp lệ hoặc thiếu số lượng thì chuyển thành `null` và ghi nhận vào `unresolvedFields`.
- **Product matching:** `ProductsService.findActiveCandidates` thực hiện truy vấn trực tiếp trên PostgreSQL với `isActive = true` và `deletedAt IS NULL`, ưu tiên exact match trước contains match, giới hạn 5 kết quả, giá sản phẩm lấy trực tiếp từ database.
- **Unresolved field rules:** Tự động phát hiện và ghi nhận các trường thiếu: items rỗng, thiếu địa chỉ giao hàng, thiếu điều khoản thanh toán, thiếu thời hạn báo giá, không tìm thấy sản phẩm, tìm thấy nhiều sản phẩm tương đồng, hoặc thiếu số lượng. Tự động deduplicate danh sách trước khi trả về.
- **Error mapping:**
  - Thiếu API key hoặc Model: `503 Service Unavailable` ("AI quotation draft is not configured.")
  - Quota / Provider unavailable: `503 Service Unavailable` ("AI quotation draft is temporarily unavailable.")
  - Timeout: `504 Gateway Timeout` ("AI quotation draft request timed out.")
  - Output rỗng hoặc sai cấu trúc schema: `502 Bad Gateway` ("AI provider returned an invalid response.")
- **Automated tests:**
  - Unit tests: 73/73 tests pass (bao gồm 12 tests extractor, 6 tests AiService, 7 tests ProductsService).
  - E2E tests: 9/9 tests pass (bao gồm 6 tests mới trong `test/ai.e2e-spec.ts` và 3 tests trong `test/app.e2e-spec.ts`).
- **Manual Gemini verification:** Chưa thực hiện do môi trường runtime chưa cấu hình `GEMINI_API_KEY` và `GEMINI_MODEL`. Khi gọi endpoint với cấu hình trống, hệ thống trả về mã `503 Service Unavailable` an toàn như thiết kế.
- **Manual quotation regression test:** Luồng tạo báo giá thủ công từ Phase 3 đến Phase 8 (`GET /api/customers`, `GET /api/products`, `POST /api/customers/:id/quotations`, background runner xử lý sang `COMPLETED`, `GET /api/quotations/:id/download` tải PDF signed URL) vẫn hoạt động 100% bình thường, không bị bất kỳ ảnh hưởng nào.
- **Database side-effect verification:** Endpoint AI hoàn toàn là tác vụ trích xuất (read-only / compute), không ghi thêm bản ghi vào `quotations`, `quotation_items`, hay `processing_jobs`.
- **Final relevant structure:**
  ```text
  server/server/src/modules/ai/
  ├── ai.controller.ts
  ├── ai.module.ts
  ├── ai.service.spec.ts
  ├── ai.service.ts
  ├── dto/
  │   ├── create-quotation-draft.dto.ts
  │   ├── product-candidate.dto.ts
  │   ├── quotation-draft-item.dto.ts
  │   └── quotation-draft-response.dto.ts
  ├── extractors/
  │   ├── gemini-quotation-draft.extractor.spec.ts
  │   ├── gemini-quotation-draft.extractor.ts
  │   ├── quotation-draft-extractor.interface.ts
  │   └── quotation-draft-extractor.token.ts
  ├── prompts/
  │   └── quotation-draft.prompt.ts
  └── schemas/
      └── quotation-draft.schema.ts
  ```
- **Deferred items:** Chạy manual test trực tiếp với Gemini provider thực tế khi người dùng cung cấp API Key và tên Model.
- **Remaining issues:** Không có.

---

## Phase 10 — API quality, security và documentation

- [x] Tất cả endpoint có DTO validation.
- [x] Không trả entity nội bộ trực tiếp nếu chứa field không cần thiết.
- [x] Chuẩn hóa `400`, `404`, `409`, `422` và `500`.
- [x] CORS chỉ cho frontend URL.
- [x] Service role và Gemini key không xuất hiện trong response/log.
- [x] Storage bucket private.
- [x] Thêm request logging tối thiểu gồm method, path, status; không log secrets.
- [x] Thay README mặc định của Nest bằng hướng dẫn dự án.
- [x] README giải thích Mock Mac Processor và production replacement.
- [x] README giải thích AI dùng cho extraction, code dùng cho pricing/calculation/PDF.
- [x] README ghi rõ public prototype chưa có production-grade authentication.

### Checkpoint

- [x] Người khác clone repo và chạy được theo README.
- [x] `.env.example` đủ biến và không có secret thật.
- [x] Không còn nội dung Nest starter không liên quan.

### Phase 10 completion record
- **Status:** COMPLETED.
- **Mục tiêu đạt được:**
  - Hoàn thiện toàn bộ DTO validation trên tất cả endpoint (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`), áp dụng `ParseUUIDPipe({ version: '4' })` cho tất cả ID parameters.
  - Chuẩn hóa HTTP exception responses (`400`, `404`, `409`, `422`, `500`, `502`, `504`):
    - `400 Bad Request`: Lỗi validation DTO, phân trang, param UUID không hợp lệ, duplicate product items trong quotation.
    - `404 Not Found`: Không tìm thấy customer/product/quotation/job hoặc đã soft-delete.
    - `409 Conflict`: Trùng customer code/product SKU, hoặc trạng thái job không hợp lệ khi retry/download.
    - `422 Unprocessable Entity`: Dữ liệu đúng định dạng cú pháp nhưng vi phạm quy tắc nghiệp vụ (product bị inactive, discount vượt quá subtotal).
    - `500 Internal Server Error`: `HttpExceptionFilter` mask toàn bộ chi tiết lỗi nội bộ/database, không leak stack trace.
    - `HttpExceptionFilter` tự động strip query parameters khỏi URL path trả về để ngăn rò rỉ token/credentials nhạy cảm qua query string.
  - Triển khai `LoggingInterceptor` toàn cục: ghi log tối thiểu theo định dạng `[HTTP] METHOD PATH STATUS DURATIONms`, tự động strip query parameters, tuyệt đối không log request/response body, headers, cookies hay secrets.
  - Bảo mật & Security review:
    - Kích hoạt Helmet toàn cục.
    - Thiết lập CORS nghiêm ngặt theo `FRONTEND_URL`.
    - Rà soát toàn bộ source code với grep không chứa bất kỳ secret, API key hay credential hardcoded nào.
    - Supabase Storage bucket `quotation-files` là private hoàn toàn, tải file qua signed URL có thời hạn 300 giây.
  - Cập nhật `.env.example`: đầy đủ tất cả biến cấu hình ứng dụng kèm chú thích chi tiết, không chứa secret thực tế.
  - Viết lại toàn bộ `README.md`: loại bỏ boilerplate Nest starter, bao gồm đầy đủ 17 phần chi tiết từ kiến trúc, sơ đồ Mermaid, thiết lập DB, giải thích Mock Mac Processor, vai trò của Gemini AI tách bạch với code định lượng, bảo mật, giới hạn prototype auth và hướng dẫn test toàn diện với Postman.
- **Files thay đổi/tạo mới:**
  - `server/server/src/common/interceptors/logging.interceptor.ts`: Interceptor ghi log request an toàn.
  - `server/server/src/common/interceptors/logging.interceptor.spec.ts`: Unit test cho logging interceptor.
  - `server/server/src/common/filters/http-exception.filter.ts`: Sanitize URL path (loại bỏ query params).
  - `server/server/src/common/filters/http-exception.filter.spec.ts`: Unit test cho HttpExceptionFilter (kiểm tra status, structure, masking 500 và sanitization).
  - `server/server/src/bootstrap/configure-app.ts`: Đăng ký `LoggingInterceptor` toàn cục.
  - `server/server/src/modules/quotations/services/quotation-calculator.service.ts`: Ném `UnprocessableEntityException` khi discount vượt subtotal.
  - `server/server/src/modules/quotations/services/quotation-calculator.service.spec.ts`: Unit test cho quotation calculator.
  - `server/server/src/modules/quotations/services/quotations.service.ts`: Ném `UnprocessableEntityException` khi product inactive/không tìm thấy.
  - `server/server/src/modules/quotations/services/quotations.service.spec.ts`: Unit test cho QuotationsService.
  - `server/server/.env.example`: File mẫu biến môi trường chuẩn hóa, giàu mô tả.
  - `server/server/README.md`: Tài liệu kỹ thuật chi tiết toàn diện 17 mục cho reviewer/recruiter.
- **Tests & Verification:**
  - `npm run format`: PASS.
  - `npm run lint`: PASS (0 errors, 0 warnings across 95 files).
  - `npm test`: PASS (10 test suites, 45 tests pass).
  - `npm run test:e2e`: PASS (2 test suites, 9 tests pass).
  - `npm run build`: PASS (`nest build` hoàn tất không lỗi).
  - `npm run migration:show`: PASS (Migration `InitialMigration1700000000000` được áp dụng).
- **Final relevant structure:**
  ```text
  server/server/
  ├── .env.example
  ├── README.md
  └── src/
      ├── bootstrap/
      │   └── configure-app.ts
      ├── common/
      │   ├── filters/
      │   │   ├── http-exception.filter.spec.ts
      │   │   └── http-exception.filter.ts
      │   └── interceptors/
      │       ├── logging.interceptor.spec.ts
      │       └── logging.interceptor.ts
      └── modules/
          ├── ai/
          ├── customers/
          ├── pdf/
          ├── processing-jobs/
          ├── products/
          ├── quotations/
          └── storage/
  ```
- **Deferred items:** Không có.
- **Remaining issues:** Không có.

---

## Phase 11 — Export quotation thành Excel

### Phạm vi

- [x] Thêm chức năng xuất **một quotation** thành file `.xlsx`.
- [x] File Excel phải chứa cùng nhóm dữ liệu nghiệp vụ quan trọng như PDF.
- [x] Tạo file on-demand khi client gọi API; không tạo processing job mới.
- [x] Không upload file Excel lên Supabase Storage trong phạm vi này.
- [x] Không thay đổi schema database hoặc migration.
- [x] Không thay đổi pipeline tạo PDF hiện tại.
- [x] Không dùng Gemini/AI để tạo hoặc tính dữ liệu trong Excel.
- [x] Chưa làm báo cáo tổng hợp nhiều quotations trong phase này.

### Dependency và module

- [x] Cài thư viện tạo `.xlsx` phù hợp cho Node.js, ưu tiên `exceljs`.
- [x] Tạo `QuotationExcelService` chịu trách nhiệm tạo workbook và trả `Buffer`.
- [x] Tách phần định dạng workbook vào template/helper riêng nếu service trở nên dài.
- [x] Tái sử dụng `defaultCompanyInfo` từ `pdf/config/quotation-company.config.ts`; không khai báo lại thông tin công ty ở nhiều nơi.
- [x] Đăng ký service/module theo cấu trúc NestJS hiện tại.

### Nội dung file Excel

- [x] Tạo worksheet tên `Báo giá`.
- [x] Hiển thị thông tin công ty:
  - [x] Tên công ty.
  - [x] Địa chỉ.
  - [x] Số điện thoại.
  - [x] Email.
  - [x] Mã số thuế.
- [x] Hiển thị thông tin báo giá:
  - [x] Số báo giá.
  - [x] Ngày tạo.
  - [x] Ngày hết hiệu lực.
- [x] Hiển thị thông tin khách hàng từ `quotation.customerSnapshot`:
  - [x] Mã khách hàng.
  - [x] Tên người liên hệ/tên khách hàng.
  - [x] Tên công ty khách hàng.
  - [x] Email.
  - [x] Số điện thoại.
  - [x] Địa chỉ.
- [x] Hiển thị bảng sản phẩm:
  - [x] STT.
  - [x] SKU.
  - [x] Tên sản phẩm.
  - [x] Mô tả.
  - [x] Đơn vị tính.
  - [x] Số lượng.
  - [x] Đơn giá.
  - [x] Thành tiền.
- [x] Hiển thị phần tổng tiền:
  - [x] Subtotal.
  - [x] Discount.
  - [x] Tax rate.
  - [x] Tax amount.
  - [x] Total amount.
- [x] Hiển thị địa chỉ giao hàng, điều khoản thanh toán và ghi chú.
- [x] Dùng font, màu, border, column width, wrap text và alignment đủ rõ để file có thể mở và đọc trực tiếp.
- [x] Định dạng số tiền và ngày tháng phù hợp với báo giá tiếng Việt.
- [x] Cấu hình page setup/print area hợp lý để người dùng có thể in worksheet.

### Quy tắc dữ liệu

- [x] Đọc customer từ `customerSnapshot`, không đọc lại customer hiện tại để tránh thay đổi lịch sử báo giá.
- [x] Đọc SKU, tên, mô tả, đơn vị, quantity, unit price và line total từ `quotation_items` snapshot.
- [x] Đọc subtotal, discount, tax và total đã lưu trong quotation.
- [x] Không query giá hiện tại từ bảng `products` khi export.
- [x] Không nhận hoặc tin price/total từ client.
- [x] Không dùng Excel formula làm nguồn tính toán chính; số liệu chính thức phải lấy từ dữ liệu quotation đã lưu.
- [x] Dùng Node.js `Buffer` và tạo file trong memory; không ghi file tạm vào filesystem.

### API

- [x] Thêm endpoint:

  ```text
  GET /api/quotations/:id/export.xlsx
  ```

- [x] Validate `:id` bằng `ParseUUIDPipe({ version: '4' })`.
- [x] Trả `404 Not Found` nếu quotation không tồn tại.
- [x] Load đầy đủ `quotation.items` trước khi tạo workbook.
- [x] Trả file bằng `StreamableFile` hoặc cơ chế streaming tương đương của NestJS.
- [x] Thiết lập header:

  ```text
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  Content-Disposition: attachment; filename="quotation-<quotationNumber>.xlsx"
  ```

- [x] Tên file phải an toàn và không lấy trực tiếp input chưa sanitize từ client.
- [x] Endpoint Excel không phụ thuộc trạng thái PDF job ở backend; quotation tồn tại và có items hợp lệ là có thể export.
- [x] Frontend có thể chỉ hiển thị nút `Tải Excel` sau khi quotation/PDF đã `COMPLETED` để UI nhất quán.

### Test

- [x] Unit test `QuotationExcelService` tạo buffer khác rỗng.
- [x] Test có thể load lại buffer như một workbook `.xlsx` hợp lệ.
- [x] Kiểm tra workbook có worksheet `Báo giá`.
- [x] Kiểm tra có thông tin công ty.
- [x] Kiểm tra có thông tin khách hàng từ snapshot.
- [x] Kiểm tra có danh sách sản phẩm và số lượng.
- [x] Kiểm tra subtotal, discount, tax và total đúng dữ liệu đã lưu.
- [x] Kiểm tra tiếng Việt không bị mất hoặc lỗi encoding.
- [x] E2E hoặc controller test kiểm tra status `200`, `Content-Type` và `Content-Disposition`.
- [x] Test quotation không tồn tại trả `404`.
- [x] Regression test bảo đảm PDF, processing job, retry và download PDF không thay đổi.

### Documentation và Postman

- [x] Cập nhật README phần feature và API overview với Excel export.
- [x] Giải thích Excel được tạo on-demand, không lưu trong Supabase Storage.
- [x] Giải thích PDF là artifact background; Excel là export từ quotation snapshot.
- [x] Bổ sung request `GET /api/quotations/{{quotationId}}/export.xlsx` vào Postman collection.
- [x] Ghi chú dùng `Send and Download` trong Postman để lưu file.
- [x] Không thêm Swagger.

### Checkpoint

- [x] Export được file `.xlsx` mở thành công bằng Excel, LibreOffice hoặc Google Sheets.
- [x] File có đầy đủ thông tin công ty và thông tin khách hàng như PDF.
- [x] File có đủ items, giá snapshot, subtotal, discount, tax và total.
- [x] Nội dung tiếng Việt hiển thị đúng.
- [x] Thay đổi customer hoặc product sau khi tạo quotation không làm thay đổi nội dung export của quotation cũ.
- [x] Export Excel không tạo thêm row trong `processing_jobs`.
- [x] Export Excel không tạo object mới trong Supabase Storage.
- [x] `npm run format`, `npm run lint`, `npm run test`, `npm run test:e2e` và `npm run build` đều pass.

### Phase 11 completion record
- **Status:** COMPLETED.
- **Completed at:** 2026-09-23.
- **Dependency được thêm:** `exceljs` (`^4.4.0`) được thêm vào `dependencies` trong `package.json` và `package-lock.json` (tự kèm type definitions `index.d.ts`, không cần `@types/exceljs`).
- **Endpoint cuối cùng:** `GET /api/quotations/:id/export.xlsx`
  - Headers:
    - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    - `Content-Disposition: attachment; filename="quotation-<quotationNumber>.xlsx"`
    - `Content-Length: <buffer-length>`
  - Body: Node.js `StreamableFile` chứa binary workbook `.xlsx`.
- **Changed files và nhiệm vụ:**
  - `server/server/src/modules/excel/interfaces/generated-excel-result.interface.ts`: Interface mô tả kết quả xuất Excel gồm `buffer`, `fileName`, và `mimeType`.
  - `server/server/src/modules/excel/templates/quotation-excel-v1.template.ts`: Layout, styling, format màu sắc, border, font, căn lề và page setup A4 landscape cho worksheet `Báo giá`.
  - `server/server/src/modules/excel/quotation-excel.service.ts`: Khởi tạo workbook ExcelJS, thiết lập metadata, gọi renderer và chuyển đổi thành in-memory buffer an toàn.
  - `server/server/src/modules/excel/quotation-excel.service.spec.ts`: 10 unit tests kiểm thử service xuất Excel (load lại workbook, thông tin công ty, snapshot khách hàng, sản phẩm, tổng tiền, page setup, xử lý nullable).
  - `server/server/src/modules/excel/excel.module.ts`: NestJS Module đăng ký và export `QuotationExcelService`.
  - `server/server/src/modules/quotations/quotations.module.ts`: Import `ExcelModule`.
  - `server/server/src/modules/quotations/services/quotations.service.ts`: Inject `QuotationExcelService` và bổ sung method `exportExcel(id: string)`.
  - `server/server/src/modules/quotations/services/quotations.service.spec.ts`: Unit test cho `QuotationsService.exportExcel` (200, 404, 422 empty items, xác nhận không gọi DB save / storage).
  - `server/server/src/modules/quotations/quotations.controller.ts`: Endpoint `GET quotations/:id/export.xlsx` trả về `StreamableFile`.
  - `server/server/src/modules/quotations/quotations.controller.spec.ts`: Unit test cho controller `exportExcel`.
  - `server/server/test/app.e2e-spec.ts`: E2E tests cho `export.xlsx` (400 UUID, 404 not found, 200 export và load lại bằng ExcelJS).
  - `server/server/src/app.controller.ts` & `src/app.controller.spec.ts`: Khôi phục `AppController` và unit test controller.
  - `server/server/README.md`: Bổ sung tài liệu so sánh PDF vs Excel, hướng dẫn Postman và bảng API.
  - `server/postman/ABC-AI-Phase-9.postman_collection.json`: Thêm request `03.6 - Export quotation Excel` và đổi retry sang `03.7`.
  - `samples/quotation-sample.xlsx`: File Excel mẫu hoàn chỉnh tạo từ dữ liệu demo.
- **Layout workbook:**
  - 1 Worksheet tên `Báo giá`.
  - 8 cột: A (STT: 6), B (Mã SKU: 14), C (Tên sản phẩm: 30), D (Mô tả: 32), E (Đơn vị: 10), F (Số lượng: 13), G (Đơn giá: 18), H (Thành tiền: 20).
  - Khối Header công ty (Rows 1–3): Tên công ty bold navy, địa chỉ, điện thoại, email, MST (tái sử dụng từ `quotation-company.config.ts`).
  - Tiêu đề báo giá (Row 5): `BÁO GIÁ` font 18pt bold căn giữa, nền phẳng thanh lịch.
  - Khối thông tin báo giá & khách hàng (Rows 7–10): Số báo giá, ngày tạo, hiệu lực, tên khách hàng, công ty, mã KH, email, SĐT, địa chỉ (toàn bộ từ snapshot).
  - Bảng sản phẩm (Row 12 Header, Row 13+ Data): Header xanh navy đậm chữ trắng, border mỏng toàn bộ ô, zebra striping, căn lề và định dạng số `#,##0.00`.
  - Khối tổng tài chính: Cộng tiền hàng (Subtotal), Chiết khấu (Discount), Thuế GTGT (VAT), và Tổng cộng thanh toán (Total) nổi bật viền đôi.
  - Điều khoản và ghi chú: Địa chỉ giao hàng, điều khoản thanh toán, ghi chú.
  - Chữ ký: Đại diện khách hàng và Đại diện bên bán kèm dòng hướng dẫn ký tên.
  - Page setup: Khổ giấy A4, orientation Landscape, fit to 1 page width, freeze pane dòng 12.
- **Nguồn dữ liệu dùng cho export:**
  - Khách hàng: `quotation.customerSnapshot`
  - Sản phẩm: `quotation.items` (`productSku`, `productName`, `description`, `unit`, `quantity`, `unitPrice`, `lineTotal`)
  - Giá trị thanh toán: `quotation.subtotal`, `quotation.discountAmount`, `quotation.taxRate`, `quotation.taxAmount`, `quotation.totalAmount`
  - Giao hàng & điều khoản: `quotation.deliveryAddress`, `quotation.paymentTerms`, `quotation.notes`
  - Tuyệt đối không query bảng `customers` hay `products`, bảo toàn 100% lịch sử báo giá.
- **Xác nhận không tạo processing job:** Xác nhận trong code và unit test `QuotationsService.exportExcel` không tương tác với `jobRepository` hay bảng `processing_jobs`.
- **Xác nhận không upload Supabase Storage:** File được tạo trực tiếp dưới dạng Node.js Buffer in-memory và stream thẳng về client qua `StreamableFile`.
- **Unit test result:** PASS 100% (8 test suites, 35 tests passed).
- **E2E test result:** PASS 100% (2 test suites, 12 tests passed).
- **Format/lint/build result:**
  - `npm run format`: PASS.
  - `npm run lint`: PASS (0 warnings, 0 errors).
  - `npm run build`: PASS.
- **Postman verification:**
  - Collection JSON hợp lệ.
  - Request `03.6 - Export quotation Excel` gọi `GET {{baseUrl}}/api/quotations/{{quotationId}}/export.xlsx`.
- **Đường dẫn sample Excel:** `/Users/hamssterr/Documents/Code/ABC_TEST/samples/quotation-sample.xlsx` (đã được load và kiểm tra cấu trúc thành công bằng ExcelJS).
- **Final relevant structure:**
  ```text
  server/server/
  ├── src/
  │   ├── app.controller.spec.ts
  │   ├── app.controller.ts
  │   └── modules/
  │       ├── excel/
  │       │   ├── excel.module.ts
  │       │   ├── interfaces/
  │       │   │   └── generated-excel-result.interface.ts
  │       │   ├── quotation-excel.service.spec.ts
  │       │   ├── quotation-excel.service.ts
  │       │   └── templates/
  │       │       └── quotation-excel-v1.template.ts
  │       ├── pdf/
  │       │   └── config/
  │       │       └── quotation-company.config.ts
  │       └── quotations/
  │           ├── quotations.controller.spec.ts
  │           ├── quotations.controller.ts
  │           ├── quotations.module.ts
  │           └── services/
  │               ├── quotations.service.spec.ts
  │               └── quotations.service.ts
  └── samples/
      └── quotation-sample.xlsx
  ```
- **Remaining issues:** Không có.

---

## Phase 12 — Verification và deploy backend

### Automated checks

- [ ] `npm run format`.
- [ ] `npm run lint`.
- [ ] `npm run test`.
- [ ] `npm run test:e2e`.
- [ ] `npm run build`.

### Manual API flow

- [ ] Customer CRUD và pagination.
- [ ] Product CRUD và pagination.
- [ ] Customer detail và quotation history.
- [ ] Create quotation với hai products.
- [ ] Quan sát job PENDING → PROCESSING → COMPLETED.
- [ ] Download PDF.
- [ ] Export Excel và kiểm tra thông tin công ty/khách hàng/items/tổng tiền.
- [ ] Tạo failure có kiểm soát trong môi trường test.
- [ ] Retry FAILED job và hoàn thành ở attempt sau.
- [ ] Gemini draft thành công.
- [ ] Gemini failure không ảnh hưởng manual flow.

### Deploy

- [ ] Tạo Supabase project/database/bucket.
- [ ] Cấu hình backend environment variables trên hosting.
- [ ] Chạy migration production.
- [ ] Chạy seed demo production một lần.
- [ ] Deploy NestJS.
- [ ] Kiểm tra `GET /api/health` trên live URL.
- [ ] Chạy lại core API flow trên live backend.
- [ ] Kiểm tra free host wake-up behavior và ghi chú trong README.

### Definition of Done cho backend

- [ ] Toàn bộ core API hoạt động trên live backend.
- [ ] Customer/Product CRUD và pagination đúng.
- [ ] Backend không tin price từ client hoặc AI.
- [ ] Quotation snapshots bảo toàn lịch sử.
- [ ] Job state machine và retry tối đa ba attempts hoạt động.
- [ ] PDF tiếng Việt được tạo từ template `v1`.
- [ ] File nằm trong private storage và tải qua signed URL.
- [ ] Excel được tạo on-demand từ quotation snapshot và tải trực tiếp.
- [ ] Excel có đầy đủ thông tin công ty và khách hàng như PDF.
- [ ] Gemini chỉ tạo draft và có manual fallback.
- [ ] Lint, test, e2e và build pass.
- [ ] README đủ để reviewer hiểu setup, architecture, mock scope và AI role.

---

## Thứ tự ưu tiên nếu thiếu thời gian

Không cắt các mục sau:

```text
Customer/Product CRUD + pagination
Quotation transaction + snapshot
Processing job + retry
PDF template
Quotation Excel export on-demand
Private storage + download
Gemini draft + manual fallback
```

Có thể giảm trước:

1. Search nâng cao.
2. Log/audit nâng cao.
3. Automatic stalled-job recovery.
4. UI hoặc endpoint reset demo data.
