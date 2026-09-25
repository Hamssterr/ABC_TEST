export interface QuotationCompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxCode: string;
  website?: string;
}

export const defaultCompanyInfo: QuotationCompanyInfo = {
  name: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ ABC',
  address: 'Tòa nhà ABC Tower, 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  phone: '(028) 3822 9999 - Hotline: 1900 1234',
  email: 'sales@abc-tech.example.vn',
  taxCode: '0312345678',
  website: 'https://abc-tech.example.vn',
};
