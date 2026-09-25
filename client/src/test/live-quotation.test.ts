import { describe, it, expect, beforeAll } from 'vitest'
import { getHealth } from '@/api/health-api'
import { createCustomer } from '@/api/customers-api'
import { getProducts, createProduct } from '@/api/products-api'
import {
  createQuotation,
  getQuotation,
  getCustomerQuotations,
  getQuotationDownload,
  exportQuotationExcel,
} from '@/api/quotations-api'
import { getProcessingJob } from '@/api/processing-jobs-api'

describe('Live End-to-End Quotation Integration', () => {
  let isBackendLive = false

  beforeAll(async () => {
    try {
      const health = await getHealth()
      isBackendLive = health.status === 'ok'
    } catch {
      isBackendLive = false
    }
  })

  it('runs complete end-to-end quotation lifecycle against live backend', async () => {
    if (!isBackendLive) {
      console.warn('Backend not running; skipping live quotation end-to-end test.')
      return
    }

    // 1. Create a dedicated customer to prevent race conditions with live CRUD tests
    const customerRes = await createCustomer({
      code: `LIVE-QT-${Date.now().toString().slice(-6)}`,
      name: 'Công ty Thử Nghiệm Báo Giá Dedicated',
      email: `test-${Date.now().toString().slice(-6)}@live-quotation.vn`,
      phone: '0901234567',
      address: '123 Đường Nguyễn Huệ, Q.1, TP.HCM',
    })
    const customer = customerRes.data
    expect(customer).toBeDefined()
    expect(customer.id).toBeTruthy()

    // 2. Prepare 2 Active Products
    const productList = await getProducts({ page: 1, limit: 10 })
    const activeProducts = productList.data.filter((p) => p.isActive)
    while (activeProducts.length < 2) {
      const p = await createProduct({
        sku: `LIVE-P${activeProducts.length + 1}-${Date.now().toString().slice(-4)}`,
        name: `Sản phẩm thử nghiệm ${activeProducts.length + 1}`,
        unit: 'bộ',
        unitPrice: '500000.00',
        isActive: true,
      })
      activeProducts.push(p.data)
    }

    const p1 = activeProducts[0]
    const p2 = activeProducts[1]
    const tomorrow = new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10)

    // 3. Create Quotation: POST /customers/:customerId/quotations
    // Frontend ONLY sends items (productId, quantity), discountAmount, taxRate, validUntil, terms.
    // Frontend NEVER sends unitPrice, lineTotal, subtotal, taxAmount, totalAmount!
    const createResult = await createQuotation(customer.id, {
      items: [
        { productId: p1.id, quantity: '2.00' },
        { productId: p2.id, quantity: '1.00' },
      ],
      discountAmount: '50000.00',
      taxRate: '10.00',
      validUntil: tomorrow,
      deliveryAddress: 'Kho số 5, Tân Bình, TP.HCM',
      paymentTerms: 'Thanh toán 100% trong vòng 15 ngày',
      notes: 'Hàng dễ vỡ, bảo quản nhiệt độ thường',
    })

    expect(createResult.data).toBeDefined()
    expect(createResult.data.quotationId).toBeTruthy()
    expect(createResult.data.quotationNumber).toMatch(/^QT-\d{8}-[A-Z0-9]{4}$/)
    expect(createResult.data.jobId).toBeTruthy()
    expect(createResult.data.status).toBe('PENDING')

    const quotationId = createResult.data.quotationId
    const jobId = createResult.data.jobId

    // 4. Verify Quotation Detail: GET /quotations/:id
    const detailResult = await getQuotation(quotationId)
    const quotation = detailResult.data

    expect(quotation.id).toBe(quotationId)
    expect(quotation.customerId).toBe(customer.id)
    expect(quotation.customerSnapshot.name).toBe(customer.name)
    expect(quotation.items).toHaveLength(2)
    expect(quotation.processingJob?.id).toBe(jobId)
    expect(Number(quotation.subtotal)).toBeGreaterThan(0)
    expect(Number(quotation.totalAmount)).toBeGreaterThan(0)

    // 5. Verify Customer Quotation History: GET /customers/:customerId/quotations
    const historyResult = await getCustomerQuotations(customer.id, { page: 1, limit: 10 })
    const historyItem = historyResult.data.find((q) => q.quotationId === quotationId)
    expect(historyItem).toBeDefined()
    expect(historyItem?.quotationNumber).toBe(quotation.quotationNumber)

    // 6. Poll Job Status until terminal: GET /processing-jobs/:id
    let jobStatus = quotation.processingJob?.status ?? 'PENDING'
    let pollCount = 0
    const maxPolls = 15

    while ((jobStatus === 'PENDING' || jobStatus === 'PROCESSING') && pollCount < maxPolls) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      pollCount++
      const jobRes = await getProcessingJob(jobId)
      jobStatus = jobRes.data.status
    }

    console.log(`Job ${jobId} finished with status: ${jobStatus} after ${pollCount} polls`)
    expect(['COMPLETED', 'FAILED']).toContain(jobStatus)

    // 7. Verify Downloads
    if (jobStatus === 'COMPLETED') {
      // 7a. PDF Download: GET /quotations/:id/download
      const downloadRes = await getQuotationDownload(quotationId)
      expect(downloadRes.data).toBeDefined()
      expect(downloadRes.data.downloadUrl).toBeTruthy()
      expect(downloadRes.data.expiresIn).toBeGreaterThan(0)

      // 7b. Excel Download: GET /quotations/:id/export.xlsx
      const excelRes = await exportQuotationExcel(quotationId)
      expect(excelRes.blob).toBeDefined()
      expect(excelRes.blob.size).toBeGreaterThan(0)
      expect(excelRes.fileName).toMatch(/\.xlsx$/i)
    }
  }, 45000)
})
