export interface CustomerSnapshot {
  id: string;
  code: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}
