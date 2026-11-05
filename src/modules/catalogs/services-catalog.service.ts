import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { AppError } from '../../core/errors/index.js'

export const serviceItemSchema = z.object({
  id: z.string().min(1, 'ID do serviço é obrigatório.'),
  title: z.string().min(1, 'Nome de exibição do serviço é obrigatório.'),
  sector: z.string().min(1, 'Setor do serviço é obrigatório.'),
  url: z.string().url('A URL informada deve ser válida (ex: https://petrifotos.com.br/...).'),
  humanizedMessage: z.string().min(1, 'A mensagem humanizada é obrigatória.'),
  active: z.boolean().default(true)
})

export const updateServicesSchema = z.array(serviceItemSchema).min(1, 'Ao menos um serviço deve ser configurado.')

export type ServiceItem = z.infer<typeof serviceItemSchema>

const CONFIG_PATH = path.resolve(process.cwd(), 'src/config/services-catalog.json')

export class ServicesCatalogService {
  private cache: ServiceItem[] = []

  public constructor() {
    this.load()
  }

  public load(): ServiceItem[] {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
        const parsed = JSON.parse(raw)
        const validated = z.array(serviceItemSchema).parse(parsed)
        this.cache = validated
        return this.cache
      }
    } catch (err: any) {
      console.warn(`⚠️ [ServicesCatalogService] Aviso ao carregar catálogo: ${err.message}`)
    }
    return this.cache
  }

  public getAll(): ServiceItem[] {
    if (this.cache.length === 0) {
      this.load()
    }
    return this.cache
  }

  public getActive(): ServiceItem[] {
    return this.getAll().filter(s => s.active)
  }

  public getById(id: string): ServiceItem | undefined {
    return this.getAll().find(s => s.id === id)
  }

  public getSectors(): string[] {
    const sectors = new Set<string>()
    for (const item of this.getAll()) {
      sectors.add(item.sector)
    }
    return Array.from(sectors)
  }

  public async updateAll(items: ServiceItem[]): Promise<ServiceItem[]> {
    const validated = updateServicesSchema.parse(items)
    this.cache = validated

    try {
      const dir = path.dirname(CONFIG_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(validated, null, 2), 'utf-8')
    } catch (err: any) {
      throw new AppError(`Falha ao salvar configurações de serviços: ${err.message}`, 500)
    }

    return this.cache
  }

  public formatMessage(service: ServiceItem): string {
    const template =
      service.humanizedMessage ||
      'Que notícia maravilhosa! 💛 Dá uma olhadinha em tudo o que preparamos para o {title} (fotos, propostas e detalhes de produção):\n🔗 {url}\n\nDá uma olhada com carinho e me avise qual opção combina mais com o que você imaginou! Se precisar de ajuda para escolher ou quiser consultar nossa agenda, estou por aqui. ✨'

    return template
      .replace(/{title}/g, service.title)
      .replace(/{url}/g, service.url)
      .replace(/{link}/g, service.url)
  }
}

export const servicesCatalogService = new ServicesCatalogService()
