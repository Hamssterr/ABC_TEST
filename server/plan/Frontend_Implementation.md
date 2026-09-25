# Frontend Implementation Plan — ABC Quotation Management

> Tài liệu này là kế hoạch triển khai frontend cho backend tại `server/server`. Frontend ưu tiên tốc độ phát triển, component tái sử dụng, giao diện dễ trình diễn và bám đúng API hiện có. Chỉ đánh dấu `[x]` khi chức năng đã được triển khai và kiểm tra thực tế.

## 1. Mục tiêu sản phẩm

Frontend cần cho phép người dùng hoàn thành trọn vẹn các luồng sau:

```text
Quản lý khách hàng
→ Quản lý sản phẩm
→ Mở thông tin một khách hàng
→ Tạo báo giá thủ công hoặc dùng AI hỗ trợ điền form
→ Kiểm tra và xác nhận dữ liệu
→ Gửi yêu cầu tạo báo giá
→ Theo dõi PENDING/PROCESSING không cần refresh trang
→ Xử lý COMPLETED hoặc FAILED
→ Retry job thất bại
→ Tải PDF hoặc Excel
```

Frontend phải thể hiện rõ ranh giới:

- Gemini chỉ tạo draft và gợi ý product candidates.
- Người dùng luôn kiểm tra form trước khi tạo quotation.
- Giá sản phẩm lấy từ PostgreSQL qua backend.
- Backend là nguồn chính thức cho calculation và job state.
- Frontend không gửi `unitPrice`, subtotal, tax amount hoặc total amount khi tạo quotation.

---

## 2. Các quyết định thiết kế đã chốt

| Hạng mục | Quyết định |
|---|---|
| Framework | React + Vite + TypeScript |
| UI library | shadcn/ui + Tailwind CSS |
| Font | Inter |
| Theme | Corporate Blue + Slate, nội dung sáng, sidebar tối |
| Navigation chính | Khách hàng và Sản phẩm |
| Quotation history | Nằm trong Customer Detail vì backend chưa có API list toàn bộ quotations |
| Customer/Product create-edit | Right Sheet |
| Delete confirmation | AlertDialog |
| Tạo quotation | Full page |
| AI quotation | Cùng một quotation page, AI chỉ điền form |
| Trạng thái job | Polling mỗi 2 giây bằng TanStack Query |
| PDF download | Lấy signed URL rồi mở/tải file |
| Excel download | Gọi binary endpoint và tải Blob trực tiếp |
| State management | TanStack Query cho server state, React Hook Form cho form state |
| Global state | Không dùng Redux trong MVP |
| Source organization | Layer-based: một folder chung cho `api`, `components`, `hooks`, `schemas`, `types` |

### Lý do chưa có mục Báo giá trong sidebar

Backend hiện hỗ trợ lịch sử báo giá theo customer:

```text
GET /api/customers/:customerId/quotations
```

Backend chưa có endpoint list tất cả quotations. Vì vậy MVP chỉ có hai navigation chính:

```text
Khách hàng
Sản phẩm
```

Quotation được truy cập từ Customer Detail hoặc bằng direct route `/quotations/:id`. Khi backend có API global quotation list, có thể thêm mục `Báo giá` vào sidebar mà không thay đổi các component hiện tại.

---

## 3. Tech stack

### Core

- React.
- TypeScript strict mode.
- Vite.
- React Router.

### UI

- Tailwind CSS.
- shadcn/ui.
- Radix primitives thông qua shadcn/ui.
- Lucide React icons.
- Sonner toast.
- Inter font.

### Data và form

- TanStack Query.
- React Hook Form.
- Zod.
- `@hookform/resolvers`.
- Axios hoặc một Fetch wrapper thống nhất; chỉ chọn một.
- `date-fns` cho ngày tháng.
- `decimal.js` cho phần preview tiền trên frontend; kết quả backend vẫn là kết quả chính thức.

### Testing

- Vitest.
- React Testing Library cho hành vi component quan trọng.
- Manual browser verification cho core flow.
- Không thêm test chỉ kiểm tra class CSS hoặc chi tiết implementation nhỏ.

### shadcn/ui components dự kiến

```text
button
input
textarea
label
form
table
card
badge
sheet
alert-dialog
dropdown-menu
select
command
popover
calendar
separator
skeleton
tooltip
breadcrumb
sidebar
scroll-area
sonner
```

---

## 4. Design system

### 4.1 Màu sắc

| Token | Hex tham chiếu | Mục đích |
|---|---|---|
| Primary | `#1D4ED8` | Button chính, link, focus, navigation active |
| Primary dark | `#1E3A8A` | Brand, heading nổi bật |
| Primary light | `#EFF6FF` | Selected row, AI panel, highlight |
| App background | `#F8FAFC` | Nền nội dung |
| Surface | `#FFFFFF` | Card, table, Sheet |
| Sidebar | `#0F172A` | Nền sidebar |
| Sidebar text | `#CBD5E1` | Navigation bình thường |
| Text | `#0F172A` | Nội dung chính |
| Muted text | `#64748B` | Metadata, mô tả |
| Border | `#E2E8F0` | Border card/input/table |
| Success | `#16A34A` | Completed, create/update success |
| Warning | `#D97706` | Pending, cảnh báo cần kiểm tra |
| Processing | `#2563EB` | Processing |
| Destructive | `#DC2626` | Failed, delete |

Các màu sẽ được map vào CSS variables của shadcn, không hardcode rải rác trong component.

### 4.2 Status badge

| Status | Background | Text | Label |
|---|---|---|---|
| `SUBMITTED` | `#FEF3C7` | `#B45309` | Đã gửi |
| `PENDING` | `#FEF3C7` | `#B45309` | Đang chờ |
| `PROCESSING` | `#DBEAFE` | `#1D4ED8` | Đang xử lý |
| `COMPLETED` | `#DCFCE7` | `#15803D` | Hoàn thành |
| `FAILED` | `#FEE2E2` | `#B91C1C` | Thất bại |

### 4.3 Typography

| Thành phần | Kích thước | Weight |
|---|---:|---:|
| Page title | 24px | 600 |
| Section title | 18px | 600 |
| Card title | 16px | 600 |
| Body | 14px | 400 |
| Form label | 13–14px | 500 |
| Table header | 12–13px | 600 |
| Helper/error | 12px | 400 |
| Total amount | 22–24px | 700 |

Giá tiền dùng `font-variant-numeric: tabular-nums` để các chữ số thẳng hàng.

### 4.4 Spacing và hình dạng

- Page content max width: `1440px`.
- Sidebar desktop: `240px`.
- Page padding desktop: `24–32px`.
- Page padding mobile: `16px`.
- Card radius: `10–12px`.
- Input/button height mặc định: `40px`.
- Table row tối thiểu: `52px`.
- Khoảng cách section: `24px`.
- Không dùng shadow nặng; ưu tiên border và shadow rất nhẹ.

### 4.5 Icon và chuyển động

- Icon dùng Lucide, kích thước thông thường `16–18px`.
- Mọi icon button phải có Tooltip và accessible label.
- Chỉ dùng transition ngắn cho Sheet, Dialog, hover và status.
- Không dùng animation trang trí làm chậm thao tác.

---

## 5. Information architecture và routes

```text
/
└── redirect /customers

/customers
└── Customer list, pagination, create/edit/delete

/customers/:customerId
└── Customer detail và quotation history

/customers/:customerId/quotations/new?mode=manual
└── Tạo quotation thủ công

/customers/:customerId/quotations/new?mode=ai
└── AI panel + cùng quotation form

/quotations/:quotationId
└── Quotation detail, job status, retry, PDF/Excel download

/products
└── Product list, pagination, create/edit/delete

*
└── Not found page
```

URL search params cho list:

```text
/customers?page=1&limit=10
/products?page=1&limit=10
/customers/:id?page=1&limit=10
```

Page và limit được lưu trong URL để refresh/back-forward không làm mất vị trí.

Search và advanced filter chưa nằm trong MVP vì backend hiện chỉ hỗ trợ pagination. Không tạo ô search giả chỉ lọc dữ liệu của một trang.

---

## 6. App Shell

### Desktop

```text
┌──────────────────────────────────────────────────────────────────┐
│ Sidebar 240px        │ Topbar                                    │
│                      ├───────────────────────────────────────────┤
│ ABC Quotation        │ Breadcrumb / Page title                   │
│                      │                                           │
│ QUẢN LÝ              │ Page content                              │
│ ● Khách hàng         │                                           │
│ ○ Sản phẩm           │                                           │
│                      │                                           │
│                      │                                           │
│ Backend: Online      │                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile

```text
┌──────────────────────────────┐
│ ☰  ABC Quotation             │
├──────────────────────────────┤
│ Page title                   │
│                              │
│ Page content                 │
│                              │
└──────────────────────────────┘
```

Mobile navigation mở bằng shadcn `Sheet` từ bên trái.

### Thành phần

- `AppShell`.
- `AppSidebar`.
- `MobileSidebar`.
- `Topbar`.
- `PageContainer`.
- `PageHeader`.
- `Breadcrumbs`.

---

## 7. Customer List

### Route

```text
/customers
```

### Mục tiêu

- Xem danh sách có pagination.
- Tạo customer.
- Edit customer.
- Delete customer.
- Mở Customer Detail.
- Tạo quotation thủ công hoặc AI từ đúng customer.

### Wireframe desktop

```text
Khách hàng                                      [+ Thêm khách hàng]
Quản lý thông tin khách hàng và lịch sử báo giá

┌──────────────────────────────────────────────────────────────────┐
│ Mã KH    Khách hàng        Công ty         Liên hệ       Thao tác│
├──────────────────────────────────────────────────────────────────┤
│ CUS-TEST Công ty TNHH...   Thử Nghiệm      0988...       [⋯]    │
│ CUS-003  Lê Hoàng Cường    Cường Thịnh     0987...       [⋯]    │
│ CUS-002  Trần Thị Bình     Bình Minh       0912...       [⋯]    │
└──────────────────────────────────────────────────────────────────┘

Hiển thị 1–10 / 24                         [Trước] 1 2 3 [Sau]
```

### Row interaction

- Click customer name: mở Customer Detail.
- Dropdown `⋯`:
  - Xem chi tiết.
  - Tạo báo giá.
  - Tạo báo giá bằng AI.
  - Chỉnh sửa.
  - Xóa.
- Delete dùng màu destructive và có separator trước action.

### Mobile

Table chuyển thành card list:

```text
┌──────────────────────────────┐
│ CUS-TEST                 [⋯] │
│ Công ty TNHH Thử Nghiệm      │
│ Thử Nghiệm Corp              │
│ 0988889999                   │
└──────────────────────────────┘
```

### States

- Loading: table skeleton 5 rows.
- Empty: icon + “Chưa có khách hàng” + button thêm.
- Error: error state + `Thử lại`.
- Delete success: toast và invalidate customer queries.

---

## 8. Customer Create/Edit Sheet

### Quyết định

Create và edit sử dụng cùng `CustomerForm` đặt trong `CustomerFormSheet`.

```text
                              ┌────────────────────────────────┐
                              │ Thêm khách hàng            ✕   │
                              │                                │
                              │ Mã khách hàng *                │
                              │ [CUS-004                     ]  │
                              │                                │
                              │ Tên khách hàng *               │
                              │ [Nguyễn Văn A                ]  │
                              │                                │
                              │ Tên công ty                    │
                              │ [ABC Company                 ]  │
                              │                                │
                              │ Email                          │
                              │ [contact@example.com         ]  │
                              │                                │
                              │ Số điện thoại                  │
                              │ [0901234567                  ]  │
                              │                                │
                              │ Địa chỉ                        │
                              │ [                            ]  │
                              │ [                            ]  │
                              ├────────────────────────────────┤
                              │             [Hủy] [Lưu]        │
                              └────────────────────────────────┘
```

### Fields

| Field | Create | Edit | Rule |
|---|---|---|---|
| `code` | Required | Optional update | Tối đa 50, uppercase trước submit |
| `name` | Required | Optional update | Tối đa 255 |
| `companyName` | Optional | Optional | Tối đa 255 |
| `email` | Optional | Optional | Email hợp lệ |
| `phone` | Optional | Optional | Tối đa 50 |
| `address` | Optional | Optional | Textarea |

### UX

- Sheet desktop rộng `520px`, mobile full width.
- Sticky footer chứa Hủy/Lưu.
- Submit disable khi đang gửi.
- Close khi thành công.
- API validation error hiển thị ở form/toast phù hợp.
- Duplicate code `409` hiển thị thông báo rõ ràng.
- Không đóng Sheet khi API thất bại.

---

## 9. Delete Customer Dialog

```text
Xóa khách hàng?

Bạn sắp xóa “Công ty TNHH Thử Nghiệm”.
Hành động này sẽ ẩn khách hàng khỏi danh sách.

                              [Hủy] [Xóa khách hàng]
```

- Dùng `AlertDialog`.
- Hiển thị đúng tên/code customer.
- Chỉ gọi API sau khi người dùng xác nhận.
- Button destructive có loading state.

---

## 10. Customer Detail

### Route

```text
/customers/:customerId
```

### Wireframe

```text
← Khách hàng

Công ty TNHH Thử Nghiệm                         [Chỉnh sửa]
CUS-TEST

┌─────────────────────────────────┐  ┌──────────────────────────┐
│ Thông tin khách hàng            │  │ Tạo báo giá              │
│                                 │  │                          │
│ Công ty: Thử Nghiệm Corp        │  │ [Tạo báo giá]            │
│ Email: contact@thunghiem.vn     │  │ [✨ Tạo bằng AI]         │
│ Điện thoại: 0988889999          │  │                          │
│ Địa chỉ: Hà Nội, Việt Nam       │  │ AI chỉ hỗ trợ điền form. │
└─────────────────────────────────┘  └──────────────────────────┘

Lịch sử báo giá

┌────────────────┬────────────┬──────────────┬─────────────┬─────┐
│ Số báo giá     │ Ngày tạo   │ Tổng tiền    │ Trạng thái  │     │
├────────────────┼────────────┼──────────────┼─────────────┼─────┤
│ QT-202609...   │ 24/09/2026 │ 116.050.000₫ │ Hoàn thành  │ [→] │
└────────────────┴────────────┴──────────────┴─────────────┴─────┘
```

### API

- Customer detail: `GET /api/customers/:id`.
- Quotation history: `GET /api/customers/:customerId/quotations?page=&limit=`.

### Hành vi

- `Tạo báo giá` → route với `mode=manual`.
- `Tạo bằng AI` → route với `mode=ai`.
- Click quotation → `/quotations/:quotationId`.
- Customer 404 → Not Found state có link quay lại list.

---

## 11. Product List

### Route

```text
/products
```

### Wireframe

```text
Sản phẩm                                         [+ Thêm sản phẩm]
Quản lý danh mục và giá sản phẩm

┌──────────────────────────────────────────────────────────────────┐
│ SKU       Tên sản phẩm            ĐVT      Đơn giá      Trạng thái│
├──────────────────────────────────────────────────────────────────┤
│ PRD-001   Laptop Workstation...    chiếc    32.000.000₫ Hoạt động │
│ PRD-002   Màn hình 27 inch 4K      chiếc    12.500.000₫ Hoạt động │
│ PRD-005   Hỗ trợ kỹ thuật          gói       5.000.000₫ Hoạt động │
└──────────────────────────────────────────────────────────────────┘

Hiển thị 1–10 / 24                         [Trước] 1 2 3 [Sau]
```

### Row actions

- Edit.
- Delete.
- Có thể dùng dropdown `⋯` hoặc hai icon buttons với Tooltip.
- Không có create quotation trong Product list.

### Product status

- `isActive=true`: badge Hoạt động.
- `isActive=false`: badge Ngừng sử dụng.

---

## 12. Product Create/Edit Sheet

```text
                              ┌────────────────────────────────┐
                              │ Thêm sản phẩm              ✕   │
                              │                                │
                              │ SKU *                          │
                              │ [PRD-006                     ]  │
                              │                                │
                              │ Tên sản phẩm *                 │
                              │ [                            ]  │
                              │                                │
                              │ Mô tả                          │
                              │ [                            ]  │
                              │                                │
                              │ Đơn vị tính *                  │
                              │ [chiếc                       ]  │
                              │                                │
                              │ Đơn giá *                      │
                              │ [32.000.000                  ]  │
                              │                                │
                              │ Hoạt động             [switch] │
                              ├────────────────────────────────┤
                              │             [Hủy] [Lưu]        │
                              └────────────────────────────────┘
```

### Quy tắc

- `sku`: required, tối đa 50, uppercase.
- `name`: required, tối đa 255.
- `description`: optional.
- `unit`: required, tối đa 50.
- `unitPrice`: decimal string, không âm, tối đa hai số lẻ.
- `isActive`: boolean.
- UI hiển thị giá có separator; payload chuyển về decimal string.
- Duplicate SKU `409` được hiển thị rõ.

---

## 13. Create Quotation Page

### Route

```text
/customers/:customerId/quotations/new?mode=manual
/customers/:customerId/quotations/new?mode=ai
```

### Lý do dùng page

Quotation có nhiều sản phẩm, AI panel, điều khoản, tổng tiền và trạng thái submit. Dùng modal hoặc Sheet sẽ chật, khó responsive và dễ mất dữ liệu khi đóng ngoài ý muốn.

### Wireframe desktop

```text
← Công ty TNHH Thử Nghiệm

Tạo báo giá
Khách hàng: CUS-TEST — Công ty TNHH Thử Nghiệm

┌──────────────────────────────────────────┬────────────────────────┐
│ THÔNG TIN BÁO GIÁ                       │ TỔNG QUAN              │
│                                          │                        │
│ Sản phẩm                                 │ Tạm tính               │
│ ┌──────────────────────────────────────┐ │ 101.500.000 ₫         │
│ │ PRD-001 Laptop     SL 2   64.000.000│ │                        │
│ │ PRD-002 Màn hình   SL 3   37.500.000│ │ Chiết khấu            │
│ └──────────────────────────────────────┘ │ 1.000.000 ₫           │
│ [+ Thêm sản phẩm]                        │                        │
│                                          │ Thuế 10%               │
│ Chiết khấu [1.000.000]                   │ 10.050.000 ₫          │
│ Thuế          [10%]                      │                        │
│ Hiệu lực đến  [24/10/2026]               │ TỔNG CỘNG              │
│                                          │ 110.550.000 ₫         │
│ Địa chỉ giao hàng                        │                        │
│ [......................................] │ [Tạo báo giá]          │
│                                          │                        │
│ Điều khoản thanh toán                    │                        │
│ [......................................] │                        │
│                                          │                        │
│ Ghi chú                                  │                        │
│ [......................................] │                        │
└──────────────────────────────────────────┴────────────────────────┘
```

### Mobile

```text
Customer summary
→ Items
→ Terms
→ Summary card
→ Submit button
```

Summary card không sticky trên mobile.

### Product selection

- Dùng `ProductCombobox`.
- Load active products qua `GET /api/products?page=1&limit=100` cho catalog demo.
- Không hiển thị inactive product trong lựa chọn mới.
- Không cho chọn trùng product ID.
- Nếu catalog sau này vượt 100 sản phẩm, cần backend search API hoặc paginated product picker; không giả lập search chỉ trên một phần dữ liệu.

### Fields gửi backend

```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": "2.00"
    }
  ],
  "discountAmount": "0.00",
  "taxRate": "10.00",
  "validUntil": "2026-10-24",
  "deliveryAddress": "Hà Nội",
  "paymentTerms": "Thanh toán trong 15 ngày",
  "notes": "Giao trong giờ hành chính"
}
```

Không gửi:

```text
unitPrice
lineTotal
subtotal
taxAmount
totalAmount
customerSnapshot
```

### Preview calculation

- Frontend có thể dùng `decimal.js` để hiển thị preview.
- Preview dùng giá product đọc từ API.
- Backend calculation sau submit là kết quả chính thức.
- Sau khi tạo thành công, UI dùng totals từ quotation detail thay cho preview.

---

## 14. AI Quotation Panel

AI mode vẫn dùng cùng `QuotationForm`.

```text
┌──────────────────────────────────────────────────────────────┐
│ ✨ Nhập nhanh bằng AI                                       │
│                                                              │
│ Dán yêu cầu báo giá của khách hàng                           │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Cần 2 laptop PRD-001, 3 màn hình PRD-002.               │ │
│ │ Giao tại Hà Nội, thanh toán trong 15 ngày...            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                        [Phân tích bằng AI]   │
└──────────────────────────────────────────────────────────────┘
```

### Request

```text
POST /api/ai/quotation-draft
```

```json
{
  "customerId": "customer-uuid",
  "rawRequest": "..."
}
```

### Sau khi thành công

```text
✓ AI đã điền thông tin vào form.
Vui lòng kiểm tra sản phẩm, số lượng và điều khoản trước khi tạo.
```

Mapping:

| AI response | Form |
|---|---|
| Candidate được chọn | `productId` |
| `quantity` | Quantity input |
| `deliveryAddress` | Delivery address |
| `paymentTerms` | Payment terms |
| `validityDays` | Chuyển thành `validUntil` |
| `notes` | Notes |

### Candidate rules

- Một candidate: auto-select.
- Nhiều candidates: bắt người dùng chọn.
- Không có candidate: hiển thị product picker thủ công.
- Quantity null: field lỗi cần nhập.
- `unresolvedFields`: hiển thị trong warning card.
- Không disable manual editing sau khi apply draft.

### AI error

| HTTP | UI |
|---:|---|
| 400 | Nội dung đầu vào không hợp lệ |
| 404 | Customer không tồn tại |
| 502 | AI trả kết quả không hợp lệ |
| 503 | AI chưa cấu hình/hết quota; chuyển sang nhập thủ công |
| 504 | AI timeout; cho phép thử lại hoặc nhập thủ công |

AI failure không làm mất dữ liệu người dùng đã nhập trong form.

---

## 15. Processing Status UI

Sau `POST /customers/:customerId/quotations`, lưu `quotationId` và `jobId` vào page state rồi điều hướng đến:

```text
/quotations/:quotationId
```

### Pending/Processing

```text
┌───────────────────────────────────────────────┐
│ ✓ Đã tiếp nhận yêu cầu                        │
│                                               │
│ Số báo giá: QT-20260924-ABCD                  │
│                                               │
│ ● Đã gửi yêu cầu                              │
│ ● Đang tạo file PDF                           │
│ ○ Hoàn thành                                  │
│                                               │
│ Trạng thái: Đang xử lý                        │
└───────────────────────────────────────────────┘
```

Polling:

```text
GET /api/processing-jobs/:jobId
```

- Poll mỗi 2 giây với `refetchInterval`.
- Dừng polling khi `COMPLETED` hoặc `FAILED`.
- Dừng khi component unmount.
- Không tạo nhiều interval thủ công.
- Refetch quotation detail khi job terminal để lấy trạng thái/totals chính thức.

### Completed

```text
┌───────────────────────────────────────────────┐
│ ✓ Tạo báo giá thành công                      │
│                                               │
│ quotation-QT-20260924-ABCD.pdf                │
│                                               │
│ [Tải PDF] [Tải Excel] [Về khách hàng]        │
└───────────────────────────────────────────────┘
```

### Failed

```text
┌───────────────────────────────────────────────┐
│ ✕ Không thể tạo file báo giá                  │
│                                               │
│ Lỗi: <errorMessage an toàn từ backend>        │
│ Lần thử: 1/3                                  │
│                                               │
│ [Thử lại] [Về khách hàng]                     │
└───────────────────────────────────────────────┘
```

Retry:

```text
POST /api/processing-jobs/:jobId/retry
```

Sau retry thành công, invalidate job query và polling tiếp tục.

---

## 16. Quotation Detail

### Route

```text
/quotations/:quotationId
```

### Nội dung

```text
← Công ty TNHH Thử Nghiệm

QT-20260924-ABCD                    [Hoàn thành]
Ngày tạo: 24/09/2026

┌──────────────────────────────────────────────────────────────┐
│ Khách hàng                                                   │
│ Công ty TNHH Thử Nghiệm — Thử Nghiệm Corp                   │
│ contact@thunghiem.vn — 0988889999                            │
└──────────────────────────────────────────────────────────────┘

Sản phẩm
┌─────┬─────────┬────────────────────┬─────┬───────────┬────────┐
│ STT │ SKU     │ Tên                │ SL  │ Đơn giá   │ Tổng   │
└─────┴─────────┴────────────────────┴─────┴───────────┴────────┘

Điều khoản                         Tổng tiền
Địa chỉ giao hàng                  Tạm tính
Thanh toán                         Chiết khấu
Ghi chú                            Thuế
                                   Tổng cộng

[Tải PDF] [Tải Excel]
```

### API

- Detail: `GET /api/quotations/:id`.
- PDF signed URL: `GET /api/quotations/:id/download`.
- Excel binary: `GET /api/quotations/:id/export.xlsx`.

### Download handling

PDF:

```text
Call download API
→ nhận signed URL
→ mở URL hoặc tạo anchor download
```

Excel:

```text
Call export endpoint với responseType=blob
→ đọc Content-Disposition nếu có
→ URL.createObjectURL(blob)
→ click anchor
→ URL.revokeObjectURL()
```

---

## 17. Component architecture

### Layout

```text
AppShell
AppSidebar
MobileSidebar
Topbar
PageContainer
PageHeader
Breadcrumbs
```

### Shared

```text
DataTable
TablePagination
EmptyState
ErrorState
LoadingSkeleton
ConfirmDeleteDialog
StatusBadge
CurrencyText
DateText
AsyncButton
```

### Customer

```text
CustomerTable
CustomerForm
CustomerFormSheet
CustomerSummaryCard
CustomerActions
CustomerQuotationHistory
```

### Product

```text
ProductTable
ProductForm
ProductFormSheet
ProductCombobox
ProductStatusBadge
```

### Quotation

```text
QuotationForm
QuotationItemsTable
QuotationItemRow
QuotationSummaryCard
QuotationDetailCard
QuotationStatusBadge
QuotationDownloadActions
JobStatusCard
RetryJobDialog
```

### AI

```text
AiQuotationPanel
AiCandidateSelect
AiDraftAlert
UnresolvedFieldsAlert
```

### Component rules

- `components/ui`: chỉ shadcn primitives, không business logic.
- `components/shared`: component dùng ở ít nhất hai domain hoặc có khả năng dùng lại rõ ràng.
- Domain components nhận props và không tự tạo API client mới.
- Page gọi hooks và compose components.
- API request chỉ nằm trong `api/`.
- Không để quotation logic trong generic `DataTable`.
- Không tạo một component chung khi hai màn hình chỉ giống nhau bề ngoài nhưng khác hành vi.

---

## 18. Folder structure — layer-based

Frontend dự kiến đặt tại workspace root:

```text
/Users/hamssterr/Documents/Code/ABC_TEST/client
```

Cấu trúc:

```text
client/
├── public/
├── src/
│   ├── app/
│   │   ├── app.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── api/
│   │   ├── api-client.ts
│   │   ├── customers.api.ts
│   │   ├── products.api.ts
│   │   ├── quotations.api.ts
│   │   ├── processing-jobs.api.ts
│   │   └── ai.api.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── shared/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── quotations/
│   │   └── ai/
│   │
│   ├── hooks/
│   │   ├── use-customers.ts
│   │   ├── use-customer.ts
│   │   ├── use-create-customer.ts
│   │   ├── use-update-customer.ts
│   │   ├── use-delete-customer.ts
│   │   ├── use-products.ts
│   │   ├── use-product.ts
│   │   ├── use-create-product.ts
│   │   ├── use-update-product.ts
│   │   ├── use-delete-product.ts
│   │   ├── use-customer-quotations.ts
│   │   ├── use-quotation.ts
│   │   ├── use-create-quotation.ts
│   │   ├── use-processing-job.ts
│   │   ├── use-retry-processing-job.ts
│   │   ├── use-ai-quotation-draft.ts
│   │   └── use-debounce.ts
│   │
│   ├── schemas/
│   │   ├── customer.schema.ts
│   │   ├── product.schema.ts
│   │   ├── quotation.schema.ts
│   │   └── ai-quotation.schema.ts
│   │
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── pagination.types.ts
│   │   ├── customer.types.ts
│   │   ├── product.types.ts
│   │   ├── quotation.types.ts
│   │   ├── processing-job.types.ts
│   │   └── ai.types.ts
│   │
│   ├── pages/
│   │   ├── customers-page.tsx
│   │   ├── customer-detail-page.tsx
│   │   ├── products-page.tsx
│   │   ├── create-quotation-page.tsx
│   │   ├── quotation-detail-page.tsx
│   │   └── not-found-page.tsx
│   │
│   ├── lib/
│   │   ├── query-client.ts
│   │   ├── query-keys.ts
│   │   ├── formatters.ts
│   │   ├── download-file.ts
│   │   ├── date-utils.ts
│   │   └── utils.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── navigation.ts
│   │
│   ├── assets/
│   ├── main.tsx
│   └── index.css
│
├── .env.example
├── components.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Dependency direction

```text
pages → components + hooks + schemas + types
components → hooks/types khi thật sự cần
hooks → api + types
api → types
schemas → types khi cần
types → không phụ thuộc UI/api/hooks
```

Tránh:

```text
api → hooks
api → components
types → components
types → api
ui primitives → business components
```

### Naming convention

- File: `kebab-case`.
- Component: `PascalCase`.
- Hook: `useSomething`.
- API function: `getCustomers`, `createQuotation`.
- Schema: `customerFormSchema`.
- Type: `Customer`, `CreateCustomerInput`.
- Không dùng barrel `index.ts` tràn lan trong giai đoạn đầu để tránh circular imports.

---

## 19. API layer

### API client

`api/api-client.ts` chịu trách nhiệm:

- Đọc `VITE_API_BASE_URL`.
- Thiết lập JSON headers.
- Timeout chung.
- Parse response/error thống nhất.
- Không trực tiếp hiển thị toast.
- Không log body hoặc secrets.

`.env.example`:

```text
VITE_API_BASE_URL=http://localhost:3000/api
```

Không đưa Gemini key hoặc Supabase service role key vào frontend.

### API mapping

| UI action | API |
|---|---|
| Health | `GET /health` |
| Customer list | `GET /customers?page=&limit=` |
| Customer detail | `GET /customers/:id` |
| Create customer | `POST /customers` |
| Update customer | `PATCH /customers/:id` |
| Delete customer | `DELETE /customers/:id` |
| Product list | `GET /products?page=&limit=` |
| Product detail | `GET /products/:id` |
| Create product | `POST /products` |
| Update product | `PATCH /products/:id` |
| Delete product | `DELETE /products/:id` |
| Customer quotation history | `GET /customers/:id/quotations?page=&limit=` |
| Create quotation | `POST /customers/:id/quotations` |
| Quotation detail | `GET /quotations/:id` |
| Job status | `GET /processing-jobs/:id` |
| Retry job | `POST /processing-jobs/:id/retry` |
| PDF URL | `GET /quotations/:id/download` |
| Excel | `GET /quotations/:id/export.xlsx` |
| AI draft | `POST /ai/quotation-draft` |

API client đã có `/api` trong base URL nên API functions không lặp `/api`.

---

## 20. Types và response model

### Common

```ts
interface ApiResponse<T> {
  message: string;
  data: T;
}

interface ApiPaginatedResponse<T> {
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiErrorResponse {
  statusCode: number;
  message: string[];
  error: string;
  path: string;
  timestamp: string;
}
```

### Numeric convention

- `unitPrice`, `quantity`, subtotal, discount, tax và total giữ kiểu `string` trong API types.
- Chỉ convert tạm sang Decimal khi format/preview.
- Không đổi thành global `number` trong types.

### Date convention

- Timestamp giữ dạng ISO string.
- `validUntil` giữ `YYYY-MM-DD`.
- Formatter chịu trách nhiệm hiển thị `dd/MM/yyyy`.

---

## 21. Hooks và TanStack Query

### Query keys

`lib/query-keys.ts` định nghĩa:

```text
customerKeys
productKeys
quotationKeys
processingJobKeys
```

### Invalidation rules

| Mutation | Invalidate |
|---|---|
| Create/update/delete customer | Customer lists và customer detail liên quan |
| Create/update/delete product | Product lists và product detail liên quan |
| Create quotation | Customer quotation history và quotation detail |
| Retry job | Job detail và quotation detail |
| Job terminal | Quotation detail và customer quotation history |

### Polling

`use-processing-job.ts`:

- `enabled` khi có job ID.
- `refetchInterval=2000` khi `PENDING/PROCESSING`.
- `false` khi `COMPLETED/FAILED`.
- Không polling nếu tab/page không còn dùng query.

---

## 22. Form schemas

### Customer schema

- Bám backend max length và email validation.
- Trim string.
- Empty optional field chuyển thành `undefined` trước submit.

### Product schema

- SKU/name/unit required.
- Unit price dùng regex decimal string.
- UI money input normalize separator trước validation.

### Quotation schema

- Ít nhất một item.
- Product ID hợp lệ.
- Product không trùng.
- Quantity decimal string > 0, tối đa hai số lẻ.
- Discount không âm.
- Tax rate 0–100.
- `validUntil` required và không ở quá khứ.

Frontend validation giúp UX tốt hơn nhưng không thay thế backend validation.

---

## 23. Shared UI states

Mỗi data page phải có bốn trạng thái:

1. Loading.
2. Success có dữ liệu.
3. Success không có dữ liệu.
4. Error có retry.

Mutation phải có:

- Disable double submit.
- Loading label.
- Success toast.
- Error toast/form message.
- Không optimistic delete trong MVP; chờ backend xác nhận.

Network error message:

```text
Không thể kết nối đến máy chủ. Vui lòng thử lại.
```

Không hiển thị raw stack/error object.

---

## 24. Responsive và accessibility

### Responsive

- Desktop `>=1024px`: sidebar fixed, table đầy đủ, quotation 2 columns.
- Tablet `768–1023px`: sidebar collapsible, table có horizontal scroll, quotation summary không sticky nếu thiếu chỗ.
- Mobile `<768px`: sidebar Sheet, customer/product card list, quotation một cột, Sheet form full width.

### Accessibility

- Mọi input có label.
- Error message liên kết với input.
- Dialog/Sheet giữ focus đúng.
- Icon button có `aria-label` và Tooltip.
- Status không chỉ phân biệt bằng màu; luôn có text.
- Button loading vẫn có accessible label.
- Keyboard dùng được cho dropdown, combobox và dialog.
- Contrast màu đạt mức đọc được trên nền tương ứng.

---

## 25. Phase FE-0 — Khởi tạo frontend

- [ ] Tạo project React + Vite + TypeScript tại `ABC_TEST/client`.
- [ ] Bật TypeScript strict mode.
- [ ] Cấu hình alias `@/`.
- [ ] Cài Tailwind CSS.
- [ ] Khởi tạo shadcn/ui.
- [ ] Cài React Router.
- [ ] Cài TanStack Query.
- [ ] Cài React Hook Form, Zod và resolver.
- [ ] Cài Lucide React, Sonner và date-fns.
- [ ] Cài decimal.js nếu dùng money preview.
- [ ] Tạo `.env.example` với `VITE_API_BASE_URL`.
- [ ] Tạo đúng layer folders `api/components/hooks/schemas/types/pages/lib/config`.
- [ ] Tạo scripts `dev`, `build`, `lint`, `test`.
- [ ] Không commit `.env` thật.

### Checkpoint FE-0

- [ ] App khởi động.
- [ ] TypeScript compile.
- [ ] Tailwind hoạt động.
- [ ] Một shadcn Button render đúng.
- [ ] `/api/health` gọi được qua API client.
- [ ] Build pass.

---

## 26. Phase FE-1 — Design system và App Shell

- [ ] Cấu hình Inter font.
- [ ] Cấu hình shadcn CSS variables theo Corporate Blue + Slate.
- [ ] Tạo AppShell.
- [ ] Tạo sidebar tối.
- [ ] Thêm navigation Khách hàng/Sản phẩm.
- [ ] Tạo mobile sidebar.
- [ ] Tạo PageContainer, PageHeader và Breadcrumbs.
- [ ] Tạo common loading/error/empty components.
- [ ] Tạo StatusBadge, CurrencyText và DateText.
- [ ] Tạo route skeleton và Not Found page.

### Checkpoint FE-1

- [ ] Desktop sidebar đúng active route.
- [ ] Mobile sidebar mở/đóng bằng keyboard.
- [ ] Theme thống nhất.
- [ ] Không có horizontal overflow ngoài vùng table được phép scroll.

---

## 27. Phase FE-2 — Customer management

- [ ] Tạo customer API functions.
- [ ] Tạo customer types và schema.
- [ ] Tạo customer query/mutation hooks.
- [ ] Tạo Customer List với pagination từ URL.
- [ ] Tạo CustomerForm dùng chung create/edit.
- [ ] Tạo CustomerFormSheet.
- [ ] Tạo delete AlertDialog.
- [ ] Tạo loading/empty/error states.
- [ ] Tạo Customer Detail.
- [ ] Tạo quotation history có pagination.
- [ ] Thêm actions manual quotation và AI quotation.

### Checkpoint FE-2

- [ ] CRUD customer hoạt động.
- [ ] Duplicate code hiển thị đúng.
- [ ] Delete cần xác nhận.
- [ ] Pagination giữ sau refresh/back.
- [ ] Customer detail và quotation history hoạt động.

---

## 28. Phase FE-3 — Product management

- [ ] Tạo product API functions.
- [ ] Tạo product types và schema.
- [ ] Tạo product query/mutation hooks.
- [ ] Tạo Product List với pagination.
- [ ] Tạo ProductForm dùng chung create/edit.
- [ ] Tạo ProductFormSheet.
- [ ] Tạo delete AlertDialog.
- [ ] Format unit price theo `vi-VN`.
- [ ] Hiển thị active/inactive badge.
- [ ] Tạo ProductCombobox dùng cho quotation.

### Checkpoint FE-3

- [ ] CRUD product hoạt động.
- [ ] Duplicate SKU hiển thị đúng.
- [ ] Decimal price gửi backend đúng.
- [ ] ProductCombobox không cho chọn duplicate.

---

## 29. Phase FE-4 — Manual quotation

- [ ] Tạo quotation types, schemas và API functions.
- [ ] Tạo create quotation hook.
- [ ] Tạo QuotationForm.
- [ ] Tạo items field array.
- [ ] Tạo ProductCombobox cho từng row.
- [ ] Tạo quantity validation.
- [ ] Tạo discount/tax/validUntil/terms/notes fields.
- [ ] Tạo preview bằng Decimal.
- [ ] Tạo sticky summary card desktop.
- [ ] Không gửi price/totals từ client.
- [ ] Submit nhận quotationId/jobId.
- [ ] Điều hướng sang quotation detail.

### Checkpoint FE-4

- [ ] Tạo quotation với nhiều products thành công.
- [ ] Duplicate product bị chặn.
- [ ] Ngày quá khứ bị chặn.
- [ ] Backend 422 hiển thị rõ mà không mất form.
- [ ] Response `202` chuyển sang trạng thái xử lý.

---

## 30. Phase FE-5 — Job status, retry và downloads

- [ ] Tạo processing job API và hooks.
- [ ] Poll mỗi 2 giây khi cần.
- [ ] Tạo JobStatusCard.
- [ ] Tạo quotation detail page.
- [ ] Hiển thị PENDING/PROCESSING/COMPLETED/FAILED.
- [ ] Dừng polling ở terminal state.
- [ ] Tạo RetryJobDialog.
- [ ] Retry và tiếp tục polling.
- [ ] Tải PDF qua signed URL.
- [ ] Tải Excel qua Blob.
- [ ] Invalidate quotation/history khi status thay đổi.

### Checkpoint FE-5

- [ ] UI tự cập nhật không refresh.
- [ ] Completed hiện đúng hai download actions.
- [ ] Failed hiện error và attempt count.
- [ ] Retry chỉ hiển thị khi hợp lệ.
- [ ] PDF và Excel tải được.

---

## 31. Phase FE-6 — AI quotation assistant

- [ ] Tạo AI API, types và hook.
- [ ] Tạo AI panel với textarea.
- [ ] Loading state không khóa phần form đã có.
- [ ] Map draft vào QuotationForm.
- [ ] Auto-select khi một candidate.
- [ ] Hiển thị dropdown khi nhiều candidates.
- [ ] Cho chọn product thủ công khi không có candidate.
- [ ] Hiển thị unresolved fields.
- [ ] Convert validityDays sang validUntil an toàn.
- [ ] Cho phép người dùng sửa mọi field sau AI.
- [ ] Submit qua create quotation API hiện có.
- [ ] 502/503/504 có manual fallback.

### Checkpoint FE-6

- [ ] Draft đầy đủ điền form đúng.
- [ ] Draft thiếu dữ liệu buộc người dùng bổ sung.
- [ ] Candidate lấy từ backend.
- [ ] AI error không làm mất dữ liệu.
- [ ] AI không tự submit quotation.

---

## 32. Phase FE-7 — Responsive, quality và testing

- [ ] Kiểm tra desktop/tablet/mobile.
- [ ] Kiểm tra keyboard navigation.
- [ ] Kiểm tra loading/empty/error toàn bộ pages.
- [ ] Chuẩn hóa API errors.
- [ ] Kiểm tra double-submit protection.
- [ ] Kiểm tra URL pagination.
- [ ] Test formatters, draft mapping và job polling stop condition.
- [ ] Test form validation quan trọng.
- [ ] Không viết snapshot test lớn không có giá trị.
- [ ] Chạy lint, test và build.

### Checkpoint FE-7

- [ ] Không có TypeScript error.
- [ ] Không có console error trong core flow.
- [ ] Không có layout overflow nghiêm trọng.
- [ ] Core manual và AI flows chạy được.
- [ ] Lint/test/build pass.

---

## 33. Phase FE-8 — Public demo deploy

- [ ] Chọn static frontend hosting có free tier phù hợp tại thời điểm deploy.
- [ ] Cấu hình `VITE_API_BASE_URL` bằng live backend URL.
- [ ] Cấu hình backend `FRONTEND_URL` bằng live frontend origin.
- [ ] Build production.
- [ ] Deploy.
- [ ] Kiểm tra direct route refresh không 404; cấu hình SPA fallback.
- [ ] Test toàn bộ customer/product/manual quotation/AI/status/download flow trên live URL.
- [ ] Ghi live demo link vào README.
- [ ] Không đưa backend secrets vào frontend environment.

### Checkpoint FE-8

- [ ] Nhà tuyển dụng mở được live link.
- [ ] Customer/Product CRUD hoạt động.
- [ ] Manual quotation hoạt động.
- [ ] AI draft hoạt động hoặc hiển thị fallback rõ.
- [ ] Job status tự cập nhật.
- [ ] PDF và Excel tải được.
- [ ] Refresh direct routes hoạt động.

---

## 34. Out of scope cho MVP

- Authentication/authorization production-grade.
- Global quotation search/list nếu backend chưa có endpoint.
- Server-side search cho customer/product.
- Advanced filters và sorting.
- Dark mode đầy đủ.
- Bulk customer/product import.
- Bulk quotation export.
- Real-time WebSocket/SSE; polling là đủ cho MVP.
- Local Mac agent UI/monitoring.
- Rich text editor cho notes.
- Drag-and-drop item reordering nếu không còn thời gian.

---

## 35. Definition of Done

- [ ] Cấu trúc source đúng layer-based đã chốt.
- [ ] shadcn/ui được dùng nhất quán.
- [ ] Customer/Product create-edit dùng Sheet.
- [ ] Delete dùng AlertDialog.
- [ ] Customer list chỉ có quotation actions ở customer context.
- [ ] Customer Detail hiển thị quotation history.
- [ ] Manual và AI dùng chung QuotationForm.
- [ ] AI chỉ điền draft, không tự submit.
- [ ] Frontend không gửi price/totals cho create quotation.
- [ ] Job polling tự dừng ở COMPLETED/FAILED.
- [ ] Retry hoạt động.
- [ ] PDF và Excel download hoạt động.
- [ ] Loading/empty/error states đầy đủ.
- [ ] Responsive và keyboard cơ bản hoạt động.
- [ ] Không có frontend secret.
- [ ] Lint/test/build pass.
- [ ] Live demo link hoạt động.

---

## 36. Completion record template cho mỗi frontend phase

Sau khi hoàn thành mỗi phase, bổ sung record ngay dưới phase đó:

```text
### Phase FE-X completion record

- Status:
- Completed at:
- Changed files:
- Components added:
- Routes added:
- API integrated:
- Validation covered:
- Automated verification:
- Manual verification:
- Final relevant structure:
- Remaining issues:
```

Không đánh dấu hoàn thành chỉ vì UI render. Phase chỉ hoàn thành khi API integration, error states và checkpoint tương ứng đã được kiểm tra.
