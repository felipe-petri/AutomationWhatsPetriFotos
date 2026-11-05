export interface PixCharge {
  txid: string
  orderId: string
  amount: number
  copiaECola: string
  status: 'PENDING_PIX' | 'PAID' | 'CANCELLED'
  createdAt: Date
}
