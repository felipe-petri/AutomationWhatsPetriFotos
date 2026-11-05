import crypto from 'node:crypto'
import { dbPool, parseJsonField, stringifyJsonField } from '../../shared/database/connection.js'

export interface PhotoOrder {
  id: string
  remoteJid: string
  orderType: string
  totalAmount: number
  pixCode?: string | null
  paymentStatus: string
  orderMetadata: Record<string, unknown>
  createdAt: Date
}

export interface CreatePhotoOrderDTO {
  id?: string
  remoteJid: string
  orderType: string
  totalAmount: number
  pixCode?: string | null
  paymentStatus?: string
  orderMetadata?: Record<string, unknown>
}

export class OrdersRepository {
  public async create(data: CreatePhotoOrderDTO): Promise<PhotoOrder> {
    const id = data.id || crypto.randomUUID()
    const paymentStatus = data.paymentStatus || 'PENDING'
    const orderMetadataStr = stringifyJsonField(data.orderMetadata || {})

    const query = `
      INSERT INTO photo_orders (
        id,
        remote_jid,
        order_type,
        total_amount,
        pix_code,
        payment_status,
        order_metadata,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        order_type = VALUES(order_type),
        total_amount = VALUES(total_amount),
        pix_code = VALUES(pix_code),
        payment_status = VALUES(payment_status),
        order_metadata = VALUES(order_metadata)
    `

    await dbPool.query(query, [
      id,
      data.remoteJid,
      data.orderType,
      data.totalAmount,
      data.pixCode || null,
      paymentStatus,
      orderMetadataStr
    ])

    const created = await this.findById(id)
    if (!created) {
      throw new Error(`Falha ao recuperar pedido criado com id: ${id}`)
    }
    return created
  }

  public async findById(id: string): Promise<PhotoOrder | null> {
    const query = `
      SELECT 
        id,
        remote_jid as remoteJid,
        order_type as orderType,
        total_amount as totalAmount,
        pix_code as pixCode,
        payment_status as paymentStatus,
        order_metadata as orderMetadata,
        created_at as createdAt
      FROM photo_orders
      WHERE id = ?
      LIMIT 1
    `

    const [rows] = await dbPool.query<any[]>(query, [id])
    if (!rows || rows.length === 0) return null

    const row = rows[0]
    return {
      id: row.id,
      remoteJid: row.remoteJid,
      orderType: row.orderType,
      totalAmount: Number(row.totalAmount),
      pixCode: row.pixCode,
      paymentStatus: row.paymentStatus,
      orderMetadata: parseJsonField(row.orderMetadata),
      createdAt: row.createdAt
    }
  }

  public async findByRemoteJid(remoteJid: string): Promise<PhotoOrder[]> {
    const query = `
      SELECT 
        id,
        remote_jid as remoteJid,
        order_type as orderType,
        total_amount as totalAmount,
        pix_code as pixCode,
        payment_status as paymentStatus,
        order_metadata as orderMetadata,
        created_at as createdAt
      FROM photo_orders
      WHERE remote_jid = ?
      ORDER BY created_at DESC
    `

    const [rows] = await dbPool.query<any[]>(query, [remoteJid])
    return (rows || []).map((row: any) => ({
      id: row.id,
      remoteJid: row.remoteJid,
      orderType: row.orderType,
      totalAmount: Number(row.totalAmount),
      pixCode: row.pixCode,
      paymentStatus: row.paymentStatus,
      orderMetadata: parseJsonField(row.orderMetadata),
      createdAt: row.createdAt
    }))
  }

  public async updatePaymentStatus(
    id: string,
    paymentStatus: string,
    pixCode?: string | null
  ): Promise<PhotoOrder | null> {
    const fields = ['payment_status = ?']
    const values: any[] = [paymentStatus]

    if (pixCode !== undefined) {
      fields.push('pix_code = ?')
      values.push(pixCode)
    }

    values.push(id)

    const query = `
      UPDATE photo_orders
      SET ${fields.join(', ')}
      WHERE id = ?
    `

    await dbPool.query(query, values)
    return await this.findById(id)
  }

  public async listRecent(limit = 50): Promise<PhotoOrder[]> {
    const query = `
      SELECT 
        id,
        remote_jid as remoteJid,
        order_type as orderType,
        total_amount as totalAmount,
        pix_code as pixCode,
        payment_status as paymentStatus,
        order_metadata as orderMetadata,
        created_at as createdAt
      FROM photo_orders
      ORDER BY created_at DESC
      LIMIT ?
    `

    const [rows] = await dbPool.query<any[]>(query, [limit])
    return (rows || []).map((row: any) => ({
      id: row.id,
      remoteJid: row.remoteJid,
      orderType: row.orderType,
      totalAmount: Number(row.totalAmount),
      pixCode: row.pixCode,
      paymentStatus: row.paymentStatus,
      orderMetadata: parseJsonField(row.orderMetadata),
      createdAt: row.createdAt
    }))
  }
}

export const ordersRepository = new OrdersRepository()
