export class AppError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export class DomainError extends AppError {
  constructor(message: string) {
    super(message, 422)
    this.name = 'DomainError'
  }
}

export class WebhookSecurityError extends AppError {
  constructor(message = 'Assinatura ou chave de webhook inválida.') {
    super(message, 401)
    this.name = 'WebhookSecurityError'
  }
}
