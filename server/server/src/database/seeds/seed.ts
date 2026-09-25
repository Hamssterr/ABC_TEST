import AppDataSource from '../data-source.js';
import { CustomerEntity } from '../../modules/customers/customer.entity.js';
import { ProductEntity } from '../../modules/products/product.entity.js';

export async function runSeed(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Cannot run seed.');
    process.exit(1);
  }

  const dataSource = await AppDataSource.initialize();
  console.log('Connected to database for seeding...');

  try {
    const customerRepo = dataSource.getRepository(CustomerEntity);
    const productRepo = dataSource.getRepository(ProductEntity);

    const customersData = [
      {
        code: 'CUS-001',
        name: 'Nguyen Van An',
        companyName: 'An Phat Trading Co., Ltd.',
        email: 'an.nguyen@anphat.example.vn',
        phone: '0901234567',
        address: '123 Le Loi, District 1, Ho Chi Minh City',
      },
      {
        code: 'CUS-002',
        name: 'Tran Thi Binh',
        companyName: 'Binh Minh Tech Solutions',
        email: 'binh.tran@binhminhtech.example.vn',
        phone: '0912345678',
        address: '456 Tran Hung Dao, Da Nang',
      },
      {
        code: 'CUS-003',
        name: 'Le Hoang Cuong',
        companyName: 'Cuong Thinh Logistics',
        email: 'cuong.le@cuongthinh.example.vn',
        phone: '0987654321',
        address: '789 Hoang Hoa Tham, Ba Dinh, Ha Noi',
      },
    ];

    console.log('Seeding customers...');
    for (const cData of customersData) {
      const existing = await customerRepo.findOne({
        where: { code: cData.code },
      });
      if (!existing) {
        const customer = customerRepo.create(cData);
        await customerRepo.save(customer);
        console.log(`Created customer: ${cData.code} - ${cData.name}`);
      } else {
        console.log(`Customer ${cData.code} already exists, skipping.`);
      }
    }

    const productsData = [
      {
        sku: 'PRD-001',
        name: 'Laptop Workstation Pro 16',
        description: 'Core i7, 32GB RAM, 1TB SSD',
        unit: 'chiếc',
        unitPrice: '32000000.00',
        isActive: true,
      },
      {
        sku: 'PRD-002',
        name: 'Màn hình UltraSharp 27 inch 4K',
        description: 'IPS, 4K UHD, Type-C 90W',
        unit: 'chiếc',
        unitPrice: '12500000.00',
        isActive: true,
      },
      {
        sku: 'PRD-003',
        name: 'Bàn phím cơ không dây',
        description: 'Switch cơ học, kết nối Bluetooth/2.4G',
        unit: 'chiếc',
        unitPrice: '2100000.00',
        isActive: true,
      },
      {
        sku: 'PRD-004',
        name: 'Chuột công thái học',
        description: 'Cảm biến quang học chính xác cao',
        unit: 'chiếc',
        unitPrice: '1850000.00',
        isActive: true,
      },
      {
        sku: 'PRD-005',
        name: 'Gói hỗ trợ kỹ thuật Onsite 1 năm',
        description: 'Bảo trì định kỳ và hỗ trợ kỹ thuật tận nơi',
        unit: 'gói',
        unitPrice: '5000000.00',
        isActive: true,
      },
    ];

    console.log('Seeding products...');
    for (const pData of productsData) {
      const existing = await productRepo.findOne({ where: { sku: pData.sku } });
      if (!existing) {
        const product = productRepo.create(pData);
        await productRepo.save(product);
        console.log(`Created product: ${pData.sku} - ${pData.name}`);
      } else {
        console.log(`Product ${pData.sku} already exists, skipping.`);
      }
    }

    console.log('Seeding completed successfully.');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed.');
    }
  }
}

if (
  process.argv[1]?.endsWith('seed.ts') ||
  process.argv[1]?.endsWith('seed.js')
) {
  runSeed().catch((err) => {
    console.error('Error during seeding:', err);
    process.exit(1);
  });
}
