# 📋 Documentação de Planejamento (`docs/planning/`)

> **Propósito:** Este diretório centraliza a "planta" e as especificações técnicas do projeto `automationWhatsPetri`. Todo o escopo, arquitetura, fluxos de conversação e roadmap de desenvolvimento estão descritos aqui para orientar tanto a equipe quanto os agentes de Inteligência Artificial durante a implementação.

## 🗂️ Índice de Documentos

1. **[01 — Escopo e Casos de Uso](01-escopo-e-casos-de-uso.md)**
   * Definição dos objetivos de negócio, módulos de atendimento (fotos 3x4, revelações, Pix, agendamentos e galerias Alboom).

2. **[02 — Arquitetura e Stack Tecnológica](02-arquitetura-e-tecnologia.md)**
   * Escolha de ferramentas, trade-offs entre a API Oficial da Meta e a Evolution API, ambiente local via Docker e persistência com PostgreSQL.

3. **[03 — Fluxo de Conversa e Lógica de Negócio](03-fluxo-de-conversa.md)**
   * Máquina de estados do chatbot, menus interativos, subfluxos de cálculo de preços e regras de transbordo para atendimento humano.

4. **[04 — Integrações e Segurança](04-integracoes-e-seguranca.md)**
   * Tratamento de Webhooks, validação de payloads, tratamento de tokens e conformidade com LGPD/Políticas de privacidade.

5. **[05 — Tratamento de Falhas e Resiliência](05-falhas-e-resiliencia.md)**
   * Estratégias de Fail-Fast, circuit breakers, políticas de restart em containers Docker e garantia de idempotência para mensagens duplicadas.

6. **[06 — Roadmap e Fases de Evolução](06-roadmap-fases.md)**
   * Divisão do projeto em marcos incrementais, critérios de aceite para o MVP e passos futuros pós-lançamento.

---
*Nota: Este planejamento serve como base imutável de design. Qualquer alteração estrutural significativa deve refletir a atualização correspondente nestes arquivos antes da codificação.*