export const PRINT_SIZES = ['10x15', '13x18', '15x21', '20x30'] as const

export type PrintSize = (typeof PRINT_SIZES)[number]

export interface PrintOrderItem {
  size: PrintSize
  quantity: number
  unitPrice: number
}

export interface PrintOrderCalculation {
  totalItems: number
  totalAmount: number
  items: PrintOrderItem[]
}
