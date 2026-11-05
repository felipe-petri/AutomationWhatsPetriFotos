import { PromptEngine } from '../prompts/prompt.engine.js'
import { FSMTransitionInput, FSMTransitionResult } from './types.js'
import { servicesCatalogService } from '../../modules/catalogs/services-catalog.service.js'

export class FSMRouter {
  public async execute(input: FSMTransitionInput): Promise<FSMTransitionResult> {
    const text = input.textInput.trim()
    const lower = text.toLowerCase()

    // 1. Retorno ao menu de catálogos quando estiver em submenus
    if (
      (input.currentState === 'CATALOGS_SUBMENU_INFANTIL' ||
        input.currentState === 'CATALOGS_SUBMENU_NATAL') &&
      (text === '0' || lower === 'voltar' || lower === 'menu')
    ) {
      return {
        nextState: 'CATALOGS_MENU',
        updatedContext: {
          ...input.contextData,
          catalogSubOption: undefined
        },
        replyMessage: PromptEngine.get('catalogs.menu')
      }
    }

    // 2. Comando universal para transbordo humano
    if (text === '0' || lower === 'atendente' || lower === 'humano' || lower === 'ajuda') {
      return {
        nextState: 'HUMAN_ATTENDANCE',
        updatedContext: { ...input.contextData, transferredAt: new Date().toISOString() },
        replyMessage: PromptEngine.get('human_attendance.direct_transfer')
      }
    }

    switch (input.currentState) {
      case 'IDLE':
      case 'MAIN_MENU': {
        return this.handleMainMenu(text, input)
      }

      case 'ALBOOM_MENU': {
        return this.handleAlboomMenu(text, input)
      }

      case 'ALBOOM_AWAITING_REQUEST_DATA': {
        return {
          nextState: 'IDLE',
          updatedContext: {
            ...input.contextData,
            alboomRequestData: text
          },
          replyMessage: PromptEngine.get('alboom.wait_hours_notice')
        }
      }

      case 'ALBOOM_AWAITING_SELECTION_CONFIRM': {
        return {
          nextState: 'IDLE',
          updatedContext: {
            ...input.contextData,
            alboomSelectionData: text
          },
          replyMessage: PromptEngine.get('alboom.confirmation_notice')
        }
      }

      case 'SACRAMENTAL_AWAITING_DATA': {
        return {
          nextState: 'IDLE',
          updatedContext: {
            ...input.contextData,
            sacramentalData: text
          },
          replyMessage: PromptEngine.get('sacramental.received_notice')
        }
      }

      case 'CATALOGS_MENU': {
        return this.handleCatalogsMenu(text, input)
      }

      case 'CATALOGS_SUBMENU_INFANTIL': {
        return this.handleSubmenuInfantil(text, input)
      }

      case 'CATALOGS_SUBMENU_NATAL': {
        return this.handleSubmenuNatal(text, input)
      }

      default: {
        return {
          nextState: 'MAIN_MENU',
          updatedContext: input.contextData,
          replyMessage: PromptEngine.get('main_menu.welcome')
        }
      }
    }
  }

  private handleMainMenu(text: string, input: FSMTransitionInput): FSMTransitionResult {
    switch (text) {
      case '1':
        return {
          nextState: 'DOCUMENT_PHOTOS',
          updatedContext: { ...input.contextData, selectedMenu: 'DOCUMENT_PHOTOS' },
          replyMessage: PromptEngine.get('document_photos.text')
        }

      case '2':
        return {
          nextState: 'CATALOGS_MENU',
          updatedContext: { ...input.contextData, selectedMenu: 'CATALOGS_MENU' },
          replyMessage: PromptEngine.get('catalogs.menu')
        }

      case '3':
        return {
          nextState: 'PERSONAL_PRINTS_WAITING_MEDIA',
          updatedContext: { ...input.contextData, selectedMenu: 'PERSONAL_PRINTS' },
          replyMessage: PromptEngine.get('personal_prints.instructions')
        }

      case '4':
        return {
          nextState: 'STUDIO_SESSIONS',
          updatedContext: { ...input.contextData, selectedMenu: 'STUDIO_SESSIONS' },
          replyMessage: PromptEngine.get('studio_sessions.info')
        }

      case '5':
        return {
          nextState: 'ALBOOM_MENU',
          updatedContext: { ...input.contextData, selectedMenu: 'ALBOOM_MENU' },
          replyMessage: PromptEngine.get('alboom.menu')
        }

      case '6':
        return {
          nextState: 'SACRAMENTAL_AWAITING_DATA',
          updatedContext: { ...input.contextData, selectedMenu: 'SACRAMENTAL' },
          replyMessage: PromptEngine.get('sacramental.prepaid_notice')
        }

      default:
        return {
          nextState: 'MAIN_MENU',
          updatedContext: input.contextData,
          replyMessage: PromptEngine.get('main_menu.welcome')
        }
    }
  }

  private handleCatalogsMenu(text: string, input: FSMTransitionInput): FSMTransitionResult {
    switch (text) {
      case '1':
        return this.buildCatalogDeliveryResult('gestante', input)

      case '2':
        return this.buildCatalogDeliveryResult('revelacao-gravidez', input)

      case '3':
        return this.buildCatalogDeliveryResult('newborn', input)

      case '4':
        return this.buildCatalogDeliveryResult('smash-the-cake', input)

      case '5':
        // Submenu: Aniversário Infantil (2026 vs 2027)
        return {
          nextState: 'CATALOGS_SUBMENU_INFANTIL',
          updatedContext: {
            ...input.contextData,
            catalogOption: 'aniversario-infantil'
          },
          replyMessage: PromptEngine.get('catalogs.submenu_infantil')
        }

      case '6':
        return this.buildCatalogDeliveryResult('15-anos', input)

      case '7':
        return this.buildCatalogDeliveryResult('aniversario-feminino', input)

      case '8':
        return this.buildCatalogDeliveryResult('familia', input)

      case '9':
        return this.buildCatalogDeliveryResult('batizado', input)

      case '10':
        return this.buildCatalogDeliveryResult('perfil-profissional', input)

      case '11':
        return this.buildCatalogDeliveryResult('formatura', input)

      case '12':
        // Submenu: Natal Sazonal (Novembro vs Dezembro)
        return {
          nextState: 'CATALOGS_SUBMENU_NATAL',
          updatedContext: {
            ...input.contextData,
            catalogOption: 'natal'
          },
          replyMessage: PromptEngine.get('catalogs.submenu_natal')
        }

      case 'voltar':
      case 'menu':
        return {
          nextState: 'MAIN_MENU',
          updatedContext: input.contextData,
          replyMessage: PromptEngine.get('main_menu.welcome')
        }

      default:
        return {
          nextState: 'CATALOGS_MENU',
          updatedContext: input.contextData,
          replyMessage: PromptEngine.get('common.invalid_option')
        }
    }
  }

  private handleSubmenuInfantil(text: string, input: FSMTransitionInput): FSMTransitionResult {
    if (text === '1') {
      return this.buildCatalogDeliveryResult('aniversario-infantil-2026', input)
    }

    if (text === '2') {
      return this.buildCatalogDeliveryResult('aniversario-infantil-2027', input)
    }

    return {
      nextState: 'CATALOGS_SUBMENU_INFANTIL',
      updatedContext: input.contextData,
      replyMessage: PromptEngine.get('common.invalid_option')
    }
  }

  private handleSubmenuNatal(text: string, input: FSMTransitionInput): FSMTransitionResult {
    if (text === '1') {
      return this.buildCatalogDeliveryResult('natal-novembro', input)
    }

    if (text === '2') {
      return this.buildCatalogDeliveryResult('natal-dezembro', input)
    }

    return {
      nextState: 'CATALOGS_SUBMENU_NATAL',
      updatedContext: input.contextData,
      replyMessage: PromptEngine.get('common.invalid_option')
    }
  }

  private buildCatalogDeliveryResult(
    serviceId: string,
    input: FSMTransitionInput
  ): FSMTransitionResult {
    const service = servicesCatalogService.getById(serviceId)

    if (!service || !service.active) {
      return {
        nextState: 'IDLE',
        updatedContext: {
          ...input.contextData,
          lastServiceId: serviceId,
          catalogStatus: 'NOT_FOUND'
        },
        replyMessage:
          'As informações e propostas para este ensaio estão sendo atualizadas em nosso site oficial. Digite *0* para falar com nossa produtora e receber os detalhes completos! 💛'
      }
    }

    const replyMessage = servicesCatalogService.formatMessage(service)

    return {
      nextState: 'IDLE',
      updatedContext: {
        ...input.contextData,
        lastServiceId: service.id,
        lastServiceTitle: service.title,
        lastServiceUrl: service.url,
        deliveredAt: new Date().toISOString()
      },
      replyMessage
    }
  }

  private handleAlboomMenu(text: string, input: FSMTransitionInput): FSMTransitionResult {
    if (text === '1') {
      return {
        nextState: 'ALBOOM_AWAITING_REQUEST_DATA',
        updatedContext: { ...input.contextData, alboomAction: 'REQUEST_LINK' },
        replyMessage: PromptEngine.get('alboom.ask_client_info')
      }
    }

    if (text === '2') {
      return {
        nextState: 'ALBOOM_AWAITING_SELECTION_CONFIRM',
        updatedContext: { ...input.contextData, alboomAction: 'CONFIRM_SELECTION' },
        replyMessage: PromptEngine.get('alboom.ask_selection_client_name')
      }
    }

    return {
      nextState: 'MAIN_MENU',
      updatedContext: input.contextData,
      replyMessage: PromptEngine.get('main_menu.welcome')
    }
  }
}

export const fsmRouter = new FSMRouter()
