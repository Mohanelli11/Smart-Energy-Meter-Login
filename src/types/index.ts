export interface Meter {
  accountNo: string;
  meterNo: string;
  customerName: string;
  type: 'prepaid' | 'postpaid';
}
export interface User {
  email: string;
  name: string;
  role: string;
}