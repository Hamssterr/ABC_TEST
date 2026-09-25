# Cách hệ thống tạo file báo giá PDF

> Tài liệu này mô tả đúng flow đang có trong backend tại `server/server`. Số dòng bên dưới là vị trí hiện tại để dễ đặt breakpoint; chúng có thể thay đổi khi code được sửa.

## 1. Trả lời nhanh: PDF thật sự được tạo ở đâu?

Có bốn vị trí quan trọng, mỗi vị trí giữ một vai trò khác nhau:

1. **Điểm bắt đầu nghiệp vụ từ HTTP**
   - File: `src/modules/quotations/quotations.controller.ts`
   - Hàm: `create()` tại khoảng dòng 31.
   - API: `POST /api/customers/:customerId/quotations`.
   - Việc hàm này làm: nhận form, lưu báo giá và tạo job `PENDING`.
   - **Hàm này chưa tạo file PDF.**

2. **Điểm gọi processor trong background**
   - File: `src/modules/processing-jobs/services/processing-job-runner.service.ts`
   - Hàm: `handleIntervalTick()` tại khoảng dòng 86.
   - Lệnh chuyển giao công việc:

     ```ts
     const result = await this.processor.process(job);
     ```

   - Đây là điểm runner lấy một job từ database và yêu cầu processor xử lý.

3. **Điểm gọi trực tiếp chức năng tạo PDF**
   - File: `src/modules/processing-jobs/processor/mock-mac-processor.service.ts`
   - Hàm: `process()` tại khoảng dòng 32.
   - Lệnh gọi trực tiếp PDF service:

     ```ts
     const pdf = await this.pdfService.generatePdf(quotation);
     ```

4. **Điểm tạo dữ liệu PDF thật sự bằng thư viện**
   - File: `src/modules/pdf/quotation-pdf.service.ts`
   - Hàm: `generatePdf()` tại khoảng dòng 66.
   - Hai lệnh cốt lõi:

     ```ts
     const pdfDoc = await PDFDocument.create();
     // renderQuotationV1(...) vẽ nội dung vào tài liệu
     const pdfBytes = await pdfDoc.save();
     ```

Vì vậy, nếu câu hỏi là **“hàm nào được gọi để tạo báo giá?”**, câu trả lời là `QuotationsService.create()`. Nếu câu hỏi là **“hàm nào thật sự sinh byte của file PDF?”**, câu trả lời là `QuotationPdfService.generatePdf()`, cụ thể `PDFDocument.create()` tạo tài liệu trong bộ nhớ và `pdfDoc.save()` kết xuất tài liệu thành byte.

---

## 2. Bản đồ toàn bộ call chain

```text
Người dùng bấm "Tạo báo giá"
    │
    ▼
POST /api/customers/:customerId/quotations
    │
    ▼
QuotationsController.create()
    │
    ▼
QuotationsService.create()
    ├── kiểm tra customer
    ├── kiểm tra/load products
    ├── QuotationCalculatorService.calculate()
    └── transaction lưu:
          ├── quotations (SUBMITTED)
          ├── quotation_items
          └── processing_jobs (PENDING)
    │
    └── trả HTTP 202 + quotationId + jobId

Sau đó, chạy độc lập với HTTP request:

ProcessingJobRunner.setInterval(...)
    │
    ▼
ProcessingJobRunner.handleIntervalTick()
    │
    ├── ProcessingJobsService.claimNextJob()
    │      └── PENDING → PROCESSING
    │
    ▼
QuotationProcessor.process(job)
    │
    └── Runtime implementation: MockMacProcessorService.process(job)
           ├── load quotation + items
           ├── QuotationPdfService.generatePdf(quotation)
           │      ├── loadFontBytes()
           │      ├── PDFDocument.create()
           │      ├── embedFont(...)
           │      ├── renderQuotationV1(...)
           │      │      ├── addPage(A4)
           │      │      ├── drawText/drawLine/drawRectangle
           │      │      └── tự thêm trang khi thiếu chỗ
           │      └── pdfDoc.save() → Buffer
           │
           └── FileStorage.uploadPdf(...)
                  └── SupabaseStorageService.uploadPdf(...)
                         └── private bucket
    │
    ├── thành công: ProcessingJobsService.completeJob()
    │      ├── job → COMPLETED
    │      ├── lưu filePath/fileName/checksum
    │      └── quotation → COMPLETED
    │
    └── lỗi: ProcessingJobsService.failJob()
           ├── job → FAILED
           ├── lưu errorMessage đã làm sạch
           └── quotation → FAILED

Frontend kiểm tra trạng thái:

GET /api/processing-jobs/:jobId
    │
    ├── PENDING/PROCESSING → tiếp tục polling
    ├── FAILED → hiển thị lỗi/nút Retry
    └── COMPLETED
           │
           ▼
GET /api/quotations/:quotationId/download
           │
           └── tạo signed URL 5 phút để tải file từ Supabase Storage
```

Điểm quan trọng: HTTP request ban đầu kết thúc ngay sau khi job được lưu. Runner tạo PDF ở chu kỳ polling tiếp theo. Vì vậy frontend không phải giữ request tạo báo giá mở trong suốt thời gian sinh và upload PDF.

---

## 3. Giai đoạn A — Nhận form và tạo job

### 3.1 `QuotationsController.create()`

**File:** `src/modules/quotations/quotations.controller.ts`, khoảng dòng 29–37.

```ts
@Post('customers/:customerId/quotations')
@HttpCode(HttpStatus.ACCEPTED)
async create(customerId: string, dto: CreateQuotationDto) {
  return this.quotationsService.create(customerId, dto);
}
```

Nhiệm vụ:

- Nhận `customerId` từ URL.
- Nhận dữ liệu báo giá từ request body.
- Dùng `ParseUUIDPipe` để từ chối UUID sai định dạng.
- Chuyển việc xử lý nghiệp vụ cho `QuotationsService`.
- Trả `202 Accepted`, diễn đạt đúng rằng yêu cầu đã được nhận nhưng xử lý file diễn ra sau đó.

Kỹ thuật áp dụng:

- Controller chỉ xử lý HTTP; business logic nằm trong service.
- DTO và global `ValidationPipe` kiểm tra dữ liệu trước khi vào service.
- Asynchronous job API dùng `202`, phù hợp hơn `200/201` cho tác vụ chưa hoàn thành.

### 3.2 `CreateQuotationDto`

**File:** `src/modules/quotations/dto/create-quotation.dto.ts`.

Các dữ liệu đầu vào chính:

- `items`: ít nhất một sản phẩm, mỗi sản phẩm không được lặp `productId`.
- `discountAmount`: chuỗi số thập phân không âm, tối đa hai chữ số lẻ.
- `taxRate`: từ 0 đến 100.
- `validUntil`: `YYYY-MM-DD`, không được là ngày trong quá khứ.
- `deliveryAddress`, `paymentTerms`, `notes`: tùy chọn.

Ví dụ request:

```json
{
  "items": [
    {
      "productId": "PRODUCT_UUID",
      "quantity": "2.00"
    }
  ],
  "discountAmount": "100000.00",
  "taxRate": "10.00",
  "validUntil": "2026-10-15",
  "deliveryAddress": "123 Nguyễn Huệ, TP.HCM",
  "paymentTerms": "Thanh toán trong 15 ngày",
  "notes": "Báo giá đã bao gồm phí giao hàng"
}
```

### 3.3 `QuotationsService.create()`

**File:** `src/modules/quotations/services/quotations.service.ts`, khoảng dòng 68–219.

Hàm này thực hiện theo thứ tự:

1. Tìm customer chưa bị xóa.
2. Chặn `productId` trùng nhau.
3. Load tất cả product bằng một query và chỉ nhận product đang active, chưa bị xóa.
4. Gọi `QuotationCalculatorService.calculate()`.
5. Chụp snapshot thông tin customer.
6. Mở transaction.
7. Lưu `QuotationEntity` với trạng thái `SUBMITTED`.
8. Lưu các `QuotationItemEntity` đã chụp lại SKU, tên, mô tả, đơn vị, đơn giá và thành tiền.
9. Lưu `ProcessingJobEntity` với trạng thái `PENDING`.
10. Commit transaction rồi trả về `quotationId` và `jobId`.

Đoạn tạo job:

```ts
const job = queryRunner.manager.create(ProcessingJobEntity, {
  quotationId: savedQuotation.id,
  processorType: ProcessorType.HOSTED_MOCK,
  status: ProcessingJobStatus.PENDING,
  attemptCount: 0,
});

const savedJob = await queryRunner.manager.save(job);
```

Đây là cách runner “biết có dữ liệu mới”: runner không nhận lệnh trực tiếp từ controller. Nó định kỳ tìm trong bảng `processing_jobs` xem có dòng `PENDING` hay không.

Kỹ thuật áp dụng:

- **Transaction:** quotation, items và job cùng thành công hoặc cùng rollback. Không có trường hợp tạo quotation nhưng quên tạo job.
- **Snapshot pattern:** tên, giá và thông tin customer được chụp tại thời điểm lập báo giá. Product/customer thay đổi sau này không làm sai tài liệu cũ.
- **Batch query:** load danh sách product một lần, tránh N+1 query.
- **Exact decimal:** dữ liệu tiền được truyền dưới dạng chuỗi và tính bằng `decimal.js`, tránh sai số `number` của JavaScript.
- **Persisted queue:** PostgreSQL đóng vai trò hàng đợi bền vững; restart server không làm mất job.

### 3.4 `QuotationCalculatorService.calculate()`

**File:** `src/modules/quotations/services/quotation-calculator.service.ts`, khoảng dòng 16–86.

Công thức:

```text
lineTotal    = quantity × unitPrice
subtotal     = tổng lineTotal
taxable      = subtotal - discountAmount
taxAmount    = taxable × taxRate / 100
totalAmount  = taxable + taxAmount
```

Hàm cũng kiểm tra:

- quantity phải lớn hơn 0;
- discount không âm và không vượt subtotal;
- tax rate nằm trong 0–100;
- kết quả tiền được làm tròn hai chữ số theo `ROUND_HALF_UP`.

Phần này dùng code xác định, có thể test và tái lập. Không nên giao phép tính tiền cho AI.

---

## 4. Giai đoạn B — Runner phát hiện và claim job

### 4.1 `ProcessingJobRunner.onModuleInit()`

**File:** `src/modules/processing-jobs/services/processing-job-runner.service.ts`, khoảng dòng 31–63.

Khi NestJS khởi động:

- Đọc `JOB_PROCESSOR_ENABLED`.
- Đọc `JOB_POLL_INTERVAL_MS`, mặc định 2.000 ms.
- Đưa job bị kẹt ở `PROCESSING` về `PENDING` bằng `recoverStalledJobs()`.
- Gọi `startPolling()` để chạy bộ đếm thời gian.

Cấu hình cần có trong `.env` để server thật sự xử lý job:

```dotenv
JOB_PROCESSOR_ENABLED=true
JOB_POLL_INTERVAL_MS=2000
```

Nếu `JOB_PROCESSOR_ENABLED=false`, API vẫn tạo quotation và job, nhưng job sẽ đứng ở `PENDING` vì không có runner xử lý.

### 4.2 `startPolling()`

Khoảng dòng 69–77:

```ts
this.intervalTimer = setInterval(() => {
  this.handleIntervalTick().catch(...);
}, intervalMs);
```

Cứ mỗi khoảng thời gian cấu hình, runner gọi `handleIntervalTick()` một lần. Biến `isProcessing` ngăn hai chu kỳ trong cùng process chạy chồng lên nhau.

### 4.3 `ProcessingJobsService.claimNextJob()`

**File:** `src/modules/processing-jobs/services/processing-jobs.service.ts`, khoảng dòng 71–110.

Hàm dùng một câu SQL nguyên tử để:

- lấy job `PENDING` cũ nhất;
- chỉ lấy job có `attempt_count < 3`;
- đổi trạng thái thành `PROCESSING`;
- tăng `attempt_count`;
- ghi `started_at`;
- trả về ID job vừa claim.

Phần quan trọng trong SQL:

```sql
FOR UPDATE SKIP LOCKED
```

Ý nghĩa:

- `FOR UPDATE` khóa row đang được worker chọn.
- `SKIP LOCKED` cho worker khác bỏ qua row đã bị khóa và lấy row kế tiếp.
- Nhờ vậy, nếu sau này chạy nhiều backend instance, hai runner ít có nguy cơ xử lý cùng một job.

### 4.4 `ProcessingJobRunner.handleIntervalTick()`

Khoảng dòng 86–126. Đây là bộ điều phối chính:

```ts
const job = await this.processingJobsService.claimNextJob();
if (!job) return;

try {
  const result = await this.processor.process(job);
  await this.processingJobsService.completeJob(job.id, result);
} catch (procError) {
  await this.processingJobsService.failJob(job.id, procError);
}
```

Hàm này không biết cách vẽ PDF hay cách upload Supabase. Nó chỉ biết quy trình: lấy job → gọi processor → complete hoặc fail.

Kỹ thuật áp dụng:

- **Orchestrator:** runner phối hợp các bước nhưng không chứa chi tiết từng bước.
- **State machine:** `PENDING → PROCESSING → COMPLETED | FAILED`.
- **Failure boundary:** mọi lỗi từ tạo PDF hoặc upload đều được bắt tại một chỗ và đổi job sang `FAILED`.
- **Graceful lifecycle:** interval được dừng trong `onApplicationShutdown()`.

---

## 5. Giai đoạn C — Processor nối job với PDF và storage

### 5.1 Vì sao `this.processor` lại chạy `MockMacProcessorService`?

Trong runner, dependency có kiểu interface:

```ts
@Inject(QUOTATION_PROCESSOR_TOKEN)
private readonly processor: QuotationProcessor
```

Interface không tồn tại ở runtime JavaScript, nên NestJS cần một injection token. Mapping nằm tại:

**File:** `src/modules/processing-jobs/processing-jobs.module.ts`, khoảng dòng 20–27.

```ts
MockMacProcessorService,
{
  provide: QUOTATION_PROCESSOR_TOKEN,
  useExisting: MockMacProcessorService,
}
```

Vì mapping này, lời gọi:

```ts
this.processor.process(job)
```

thực tế chạy:

```ts
MockMacProcessorService.process(job)
```

Đây là **Dependency Inversion + Strategy pattern**. Runner chỉ phụ thuộc hợp đồng `QuotationProcessor`. Khi có Mac mini/agent thật, có thể tạo `MacAgentProcessorService` cùng interface rồi đổi binding module, không phải viết lại runner.

### 5.2 `MockMacProcessorService.process()`

**File:** `src/modules/processing-jobs/processor/mock-mac-processor.service.ts`, khoảng dòng 32–82.

Đây là service quan trọng nhất để hiểu đoạn nối giữa các lớp:

```ts
async process(job: ProcessingJobEntity): Promise<ProcessorResult> {
  const quotation = await this.quotationRepository.findOne({
    where: { id: job.quotationId },
    relations: { items: true },
  });

  const pdf = await this.pdfService.generatePdf(quotation);

  const storagePath =
    `quotations/${year}/${quotation.id}/` +
    `quotation-${quotation.quotationNumber}.pdf`;

  const stored = await this.storage.uploadPdf({
    buffer: pdf.buffer,
    path: storagePath,
    fileName: pdf.fileName,
  });

  return {
    filePath: stored.path,
    fileName: stored.fileName,
    fileChecksum: stored.checksum,
  };
}
```

Nhiệm vụ chính:

1. Dùng `job.quotationId` để load quotation và `items`.
2. Chặn quotation không tồn tại hoặc không có item.
3. Gọi PDF service để lấy `Buffer`.
4. Tạo đường dẫn storage xác định theo năm, quotation ID và quotation number.
5. Upload buffer.
6. Trả metadata cho runner; processor không tự cập nhật trạng thái job.

Tên “Mock Mac” có nghĩa service này đang giả lập vai trò của máy Mac/agent bên ngoài: nó nhận một job, tạo artifact và trả kết quả. Phần tạo PDF vẫn là thật; phần được mock là **môi trường/agent xử lý bên ngoài**, vì hiện nó chạy ngay trong NestJS process.

Không có Gemini hay AI trong flow tạo PDF này. Đây là code xác định: cùng dữ liệu và template sẽ tạo cùng nội dung nghiệp vụ.

---

## 6. Giai đoạn D — Tạo byte PDF

### 6.1 `QuotationPdfService.generatePdf()` là gốc tạo PDF

**File:** `src/modules/pdf/quotation-pdf.service.ts`, khoảng dòng 66–98.

```ts
async generatePdf(quotation: QuotationEntity): Promise<GeneratedPdfResult> {
  const version = quotation.templateVersion || 'v1';
  if (version !== 'v1') throw new BadRequestException(...);

  const { regular, bold } = this.loadFontBytes();
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontRegular = await pdfDoc.embedFont(regular);
  const fontBold = await pdfDoc.embedFont(bold);

  await renderQuotationV1(
    pdfDoc,
    quotation,
    this.companyInfo,
    fontRegular,
    fontBold,
  );

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return {
    buffer,
    fileName: `quotation-${quotation.quotationNumber}.pdf`,
    mimeType: 'application/pdf',
  };
}
```

Ý nghĩa từng lệnh:

- `loadFontBytes()`: đọc `NotoSans-Regular.ttf` và `NotoSans-Bold.ttf`; giữ cache trong service để request sau không đọc disk lại.
- `PDFDocument.create()`: tạo một tài liệu PDF trống trong memory. Đây là **lệnh thư viện bắt đầu tạo PDF**.
- `registerFontkit()`: cho `pdf-lib` dùng font TTF tùy chỉnh.
- `embedFont()`: nhúng font vào file để chữ tiếng Việt hiển thị đúng trên máy khác.
- `renderQuotationV1()`: thêm trang và vẽ toàn bộ nội dung.
- `pdfDoc.save()`: serialize tài liệu thành `Uint8Array`. Đây là **lệnh kết xuất file thật sự**.
- `Buffer.from(pdfBytes)`: đổi sang Node.js `Buffer` để upload mà không cần ghi file tạm ra disk.

### 6.2 `resolveFontPath()` và `loadFontBytes()`

`resolveFontPath()` thử nhiều đường dẫn để font hoạt động cả khi chạy TypeScript trong `src` lẫn JavaScript đã build trong `dist`. Nếu không thấy font, job sẽ fail thay vì tạo PDF bị lỗi tiếng Việt.

`loadFontBytes()` chỉ đọc mỗi font một lần trong vòng đời service. Đây là cache nhỏ tại memory, hợp lý vì font là asset không đổi.

### 6.3 `renderQuotationV1()` là gốc layout/template

**File:** `src/modules/pdf/templates/quotation-v1.template.ts`, bắt đầu khoảng dòng 56.

Hàm này không tạo workflow và không upload. Nó chỉ nhận `PDFDocument` rồi vẽ nội dung:

- tạo trang A4 bằng `pdfDoc.addPage()`;
- vẽ thông tin công ty;
- vẽ tiêu đề, số báo giá, ngày hiệu lực;
- đọc `customerSnapshot` để vẽ thông tin khách hàng;
- vẽ header bảng sản phẩm;
- lặp qua `quotation.items` để vẽ từng dòng;
- dùng `wrapText()` để xuống dòng tên/mô tả dài;
- thêm trang mới khi `y - rowHeight < 140`;
- vẽ subtotal, discount, thuế và tổng tiền;
- vẽ điều khoản, ghi chú và chữ ký;
- đánh số `Trang x / tổng số trang`.

Muốn đổi giao diện file báo giá, đây là file chỉnh chính. Muốn đổi cách lấy dữ liệu hoặc nơi lưu file, không nên chỉnh template.

Kỹ thuật áp dụng:

- **Template versioning:** `templateVersion = v1` cho phép thêm `v2` trong tương lai mà vẫn tái tạo tài liệu cũ đúng mẫu.
- **Separation of concerns:** PDF service quản lý tài liệu/font; template quản lý bố cục.
- **In-memory generation:** không tạo file tạm trên server, phù hợp môi trường deploy có filesystem tạm thời.
- **Pagination thủ công:** theo dõi tọa độ `y`, chiều cao row và thêm page khi cần.
- **Font embedding:** bảo đảm Unicode tiếng Việt.

---

## 7. Giai đoạn E — Upload và hoàn tất job

### 7.1 `FileStorage` interface

**File:** `src/modules/storage/storage.interface.ts`.

```ts
export interface FileStorage {
  uploadPdf(input: UploadPdfInput): Promise<StoredFile>;
  createSignedDownloadUrl(path: string, expiresIn?: number): Promise<string>;
}
```

Processor phụ thuộc interface này thay vì phụ thuộc trực tiếp Supabase. `StorageModule` map `FILE_STORAGE_TOKEN` sang `SupabaseStorageService`, tương tự processor token.

Sau này có thể thay Supabase bằng S3/MinIO/local storage bằng cách viết adapter mới giữ cùng interface.

### 7.2 `SupabaseStorageService.uploadPdf()`

**File:** `src/modules/storage/supabase-storage.service.ts`, khoảng dòng 78–137.

Hàm:

1. Chặn buffer rỗng.
2. Chặn file lớn hơn 25 MB.
3. Chặn path có `..`.
4. Tính SHA-256 checksum.
5. Upload với content type `application/pdf`.
6. Dùng `upsert: true` để retry cùng job có thể ghi lại đúng path.
7. Trả `path`, `fileName`, `checksum`.

Các biến môi trường liên quan:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
SUPABASE_STORAGE_BUCKET=quotation-files
```

`SUPABASE_SERVICE_ROLE_KEY` chỉ đặt ở backend. Không đưa key này vào frontend hoặc commit lên Git.

### 7.3 `ProcessingJobsService.completeJob()`

**File:** `src/modules/processing-jobs/services/processing-jobs.service.ts`, khoảng dòng 120–164.

Sau khi processor trả metadata, hàm mở transaction và:

- chỉ update job đang ở `PROCESSING`;
- đổi job thành `COMPLETED`;
- ghi `completedAt`, `filePath`, `fileName`, `fileChecksum`;
- đổi quotation tương ứng thành `COMPLETED`;
- commit cả hai thay đổi cùng lúc.

Nếu không có job `PROCESSING` phù hợp, hàm báo conflict. Điều này chặn việc một kết quả cũ ghi đè trạng thái mới.

### 7.4 `ProcessingJobsService.failJob()`

Khoảng dòng 166–208:

- làm sạch error bằng `sanitizeErrorMessage()` để không lưu connection string, API key hay secret;
- đổi job `PROCESSING → FAILED`;
- lưu thời điểm hoàn tất và lỗi;
- đổi quotation thành `FAILED` trong cùng transaction.

### 7.5 Retry

`POST /api/processing-jobs/:id/retry` gọi `ProcessingJobsService.retryJob()`.

Chỉ job `FAILED` và chưa đủ ba attempt được retry. Hàm đưa job về `PENDING`, xóa metadata lỗi/file cũ và đưa quotation về `SUBMITTED`. Runner sẽ tự claim lại ở chu kỳ sau.

---

## 8. Giai đoạn F — Frontend lấy file

### 8.1 Theo dõi trạng thái

Frontend gọi định kỳ:

```http
GET /api/processing-jobs/:jobId
```

`ProcessingJobsController.getStatus()` gọi `ProcessingJobsService.getJobStatus()`. Response chứa:

- `status`;
- `attemptCount` và `maxAttempts`;
- `errorMessage`;
- `fileName`;
- `completedAt`.

Frontend có thể polling mỗi 2–3 giây và dừng khi gặp trạng thái cuối `COMPLETED` hoặc `FAILED`.

### 8.2 Lấy link download

Khi job `COMPLETED`, frontend gọi:

```http
GET /api/quotations/:quotationId/download
```

`QuotationsService.getDownloadUrl()`:

1. Load quotation và processing job.
2. Chỉ cho tải khi job là `COMPLETED` và có `filePath`.
3. Gọi `storage.createSignedDownloadUrl(job.filePath, 300)`.
4. Trả signed URL có hiệu lực 300 giây.

**API download không tạo lại PDF.** Nó chỉ tạo URL tạm thời trỏ tới file đã upload trong private bucket.

---

## 9. Bảng trách nhiệm của từng service

| Thành phần | Hàm chính | Trách nhiệm | Không chịu trách nhiệm |
|---|---|---|---|
| `QuotationsController` | `create()` | Nhận HTTP request | Tính tiền, tạo PDF |
| `QuotationsService` | `create()` | Validate nghiệp vụ, snapshot, lưu quotation/items/job | Vẽ PDF, upload |
| `QuotationCalculatorService` | `calculate()` | Tính tiền chính xác | Database, PDF |
| `ProcessingJobRunner` | `handleIntervalTick()` | Lấy job và điều phối processor | Chi tiết PDF/storage |
| `ProcessingJobsService` | `claimNextJob()` | Claim nguyên tử và đổi sang `PROCESSING` | Vẽ PDF |
| `MockMacProcessorService` | `process()` | Nối quotation → PDF → storage | Quản lý HTTP |
| `QuotationPdfService` | `generatePdf()` | Tạo PDF document, font, buffer | Upload, trạng thái job |
| `renderQuotationV1` | `renderQuotationV1()` | Vẽ layout/template | Database, upload |
| `SupabaseStorageService` | `uploadPdf()` | Upload file và checksum | Tạo nội dung PDF |
| `ProcessingJobsService` | `completeJob()/failJob()` | Chốt trạng thái và metadata | Render PDF |
| `QuotationsService` | `getDownloadUrl()` | Tạo signed URL khi file sẵn sàng | Sinh PDF mới |

---

## 10. Cách debug từng bước để tự hiểu flow

Đặt breakpoint hoặc log theo đúng thứ tự này:

- [ ] `QuotationsController.create()` — xác nhận request đã vào controller.
- [ ] `QuotationsService.create()` — xem customer, products và calculation.
- [ ] Ngay sau `save(job)` — ghi lại `quotationId`, `jobId`, status `PENDING`.
- [ ] `ProcessingJobRunner.handleIntervalTick()` — xác nhận timer đang chạy.
- [ ] `ProcessingJobsService.claimNextJob()` — xác nhận job chuyển sang `PROCESSING`.
- [ ] `MockMacProcessorService.process()` — xác nhận load được quotation và items.
- [ ] `QuotationPdfService.generatePdf()` — điểm vào của PDF service.
- [ ] `PDFDocument.create()` — PDF document trống được tạo.
- [ ] `renderQuotationV1()` — template bắt đầu vẽ.
- [ ] `pdfDoc.save()` — kiểm tra `pdfBytes.length > 0`.
- [ ] `SupabaseStorageService.uploadPdf()` — kiểm tra storage path và checksum.
- [ ] `ProcessingJobsService.completeJob()` — job và quotation thành `COMPLETED`.
- [ ] `QuotationsService.getDownloadUrl()` — signed URL được tạo.

Nên quan sát hai thời điểm riêng:

```text
Thời điểm 1: POST trả 202 và job vẫn PENDING.
Thời điểm 2: runner xử lý xong, job mới COMPLETED và có filePath.
```

Nếu đặt breakpoint chỉ trong request `POST`, bạn sẽ không thấy `generatePdf()` chạy trong cùng call stack, vì nó được timer gọi sau khi request đã kết thúc.

---

## 11. Kiểm tra thủ công qua API

### Bước 1 — Bật processor

```dotenv
JOB_PROCESSOR_ENABLED=true
JOB_POLL_INTERVAL_MS=2000
```

Đồng thời cấu hình đúng database và Supabase Storage rồi khởi động NestJS.

### Bước 2 — Tạo báo giá

```http
POST /api/customers/:customerId/quotations
Content-Type: application/json
```

Kết quả mong đợi: HTTP `202`, response có `quotationId`, `jobId`, `status: PENDING`.

### Bước 3 — Xem trạng thái job

```http
GET /api/processing-jobs/:jobId
```

Kết quả sẽ đi qua:

```text
PENDING → PROCESSING → COMPLETED
```

Do polling nhanh, đôi khi client gọi lần đầu đã thấy `PROCESSING` hoặc `COMPLETED`; điều này bình thường.

### Bước 4 — Xem báo giá

```http
GET /api/quotations/:quotationId
```

Kiểm tra items, tổng tiền, trạng thái quotation và processing job.

### Bước 5 — Lấy file

```http
GET /api/quotations/:quotationId/download
```

Mở `data.downloadUrl` trong trình duyệt hoặc Postman để tải PDF.

### Bước 6 — Test lỗi và retry

Có thể tạm cấu hình sai bucket trong môi trường development để job vào `FAILED`, sau đó sửa lại cấu hình, restart server và gọi:

```http
POST /api/processing-jobs/:jobId/retry
```

Kết quả mong đợi: `FAILED → PENDING → PROCESSING → COMPLETED`.

Chỉ thực hiện cách gây lỗi này trên môi trường development/test.

---

## 12. Chẩn đoán lỗi thường gặp

### Job đứng mãi ở `PENDING`

Kiểm tra:

- `JOB_PROCESSOR_ENABLED` có phải `true` không;
- NestJS server có đang chạy không;
- log có dòng “Starting background job processor” không;
- `JOB_POLL_INTERVAL_MS` có hợp lệ không.

### Job vào `FAILED` vì font

Kiểm tra:

- `src/assets/fonts/NotoSans-Regular.ttf`;
- `src/assets/fonts/NotoSans-Bold.ttf`;
- bước build có copy assets sang `dist/assets/fonts` không.

### Job vào `FAILED` khi upload

Kiểm tra:

- `SUPABASE_URL` là project URL, không phải dashboard URL;
- `SUPABASE_SERVICE_ROLE_KEY` đúng;
- bucket `quotation-files` đã tồn tại;
- backend đang dùng đúng tên bucket;
- network từ backend tới Supabase hoạt động.

### Job `COMPLETED` nhưng download báo conflict

Kiểm tra row `processing_jobs` có đủ:

- `status = COMPLETED`;
- `file_path` khác null;
- object thật sự tồn tại trong bucket.

### Server restart khi job đang `PROCESSING`

Khi app khởi động lại, `recoverStalledJobs()` đưa mọi job `PROCESSING` về `PENDING`. Runner sẽ claim và làm lại. Đường dẫn storage cố định cộng với `upsert: true` giúp việc chạy lại không tạo nhiều object trùng nhau.

---

## 13. Những kiến thức có thể học từ flow này

### Kiến thức NestJS

- Controller nhận transport input, service giữ business logic.
- Dependency Injection qua class và custom token.
- Lifecycle hooks: `OnModuleInit`, `OnApplicationShutdown`.
- Module binding bằng `provide` và `useExisting`.
- DTO validation và HTTP status phù hợp.

### Kiến thức database và background job

- Dùng database làm persistent job queue cho MVP.
- Thiết kế state machine rõ ràng.
- Transaction bảo đảm dữ liệu nhiều bảng nhất quán.
- `FOR UPDATE SKIP LOCKED` giúp claim job an toàn khi có nhiều worker.
- Recovery, retry, attempt limit và sanitized error.

### Kiến thức thiết kế phần mềm

- Strategy/Dependency Inversion cho processor.
- Adapter cho storage.
- Snapshot để bảo toàn lịch sử chứng từ.
- Tách orchestration, business logic, rendering và infrastructure.
- Deterministic path và idempotent retry.

### Kiến thức tạo tài liệu

- Tạo PDF in memory bằng `pdf-lib`.
- Embed font Unicode bằng `fontkit`.
- Vẽ layout theo tọa độ và quản lý page break.
- Version template để hỗ trợ thay đổi mẫu sau này.
- Dùng buffer để upload trực tiếp, không phụ thuộc filesystem của host.

### Phân biệt phần nên và không nên dùng AI

- Tính giá, thuế, validation, tạo PDF, upload và state transition nên dùng code xác định.
- Gemini có thể hỗ trợ biến mô tả tự do thành **draft** báo giá để người dùng duyệt.
- Sau khi draft được duyệt, nó vẫn phải đi qua cùng DTO, calculator, transaction và PDF pipeline.
- AI không nên tự tính tổng tiền hoặc tự đánh dấu job `COMPLETED`.

---

## 14. Thứ tự đọc source đề xuất

- [ ] `quotations.controller.ts` — tìm entry point HTTP.
- [ ] `create-quotation.dto.ts` — hiểu input hợp lệ.
- [ ] `quotations.service.ts` — hiểu quotation/items/job được lưu cùng nhau.
- [ ] `quotation-calculator.service.ts` — hiểu phép tính tiền.
- [ ] `processing-job.entity.ts` — hiểu dữ liệu trạng thái.
- [ ] `processing-job-runner.service.ts` — hiểu polling và điều phối.
- [ ] `processing-jobs.service.ts` — hiểu claim/complete/fail/retry.
- [ ] `quotation-processor.interface.ts` và `processing-jobs.module.ts` — hiểu DI token.
- [ ] `mock-mac-processor.service.ts` — hiểu cầu nối PDF + storage.
- [ ] `quotation-pdf.service.ts` — xem điểm tạo byte PDF.
- [ ] `quotation-v1.template.ts` — xem cách vẽ nội dung.
- [ ] `storage.interface.ts` và `supabase-storage.service.ts` — hiểu upload/download.

## 15. Câu ghi nhớ ngắn nhất

```text
POST chỉ tạo dữ liệu và job.
Runner mới gọi processor.
Processor gọi generatePdf().
generatePdf() tạo PDFDocument, gọi template và save thành Buffer.
Processor upload Buffer.
Job COMPLETED thì frontend mới lấy signed URL để tải.
```
