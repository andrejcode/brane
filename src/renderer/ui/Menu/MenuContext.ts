import { createContext, use } from 'react'

interface MenuContextValue {
  close: () => void
}

export const MenuContext = createContext<MenuContextValue | null>(null)

export function useMenu() {
  const menu = use(MenuContext)

  if (!menu) {
    throw new Error('MenuItem must be used within a Menu')
  }

  return menu
}
