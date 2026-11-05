export interface CatalogCategory {
  id: string
  name: string
  items: string[]
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'maternidade-bebe',
    name: 'Maternidade & Bebê',
    items: ['Gestante', 'Newborn', 'Acompanhamento', 'Revelação']
  },
  {
    id: 'comemoracoes',
    name: 'Comemorações',
    items: ['Aniversário Infantil', '15 Anos', 'Batizado']
  },
  {
    id: 'estudio-carreira',
    name: 'Estúdio & Carreira',
    items: ['Família', 'Formatura em Estúdio', 'Perfil Profissional']
  }
]
