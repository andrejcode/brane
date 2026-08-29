import { clsx } from 'clsx'
import { Ellipsis } from 'lucide-react'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { Ref } from 'react'
import { createPortal } from 'react-dom'
import { GhostButton } from './buttons/GhostButton'

interface MenuContextValue {
  close: () => void
}

const MenuContext = createContext<MenuContextValue | null>(null)

interface MenuProps {
  ref?: Ref<MenuHandle>
  label: string
  children: React.ReactNode
  align?: 'start' | 'end'
  triggerClassName?: string
}

export interface MenuHandle {
  open: () => void
}

interface MenuItemProps {
  children: React.ReactNode
  onSelect: () => void
  isDestructive?: boolean
}

const MENU_GAP = 4
const VIEWPORT_MARGIN = 8

function menuPosition(trigger: DOMRect, menu: DOMRect, align: 'start' | 'end') {
  let top = trigger.bottom + MENU_GAP

  if (top + menu.height > window.innerHeight - VIEWPORT_MARGIN) {
    top = Math.max(VIEWPORT_MARGIN, trigger.top - MENU_GAP - menu.height)
  }

  let left = align === 'end' ? trigger.right - menu.width : trigger.left
  left = Math.min(
    Math.max(VIEWPORT_MARGIN, left),
    window.innerWidth - menu.width - VIEWPORT_MARGIN,
  )

  return { top, left }
}

export function Menu({
  ref,
  label,
  children,
  align = 'end',
  triggerClassName,
}: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  useImperativeHandle(ref, () => ({ open }), [open])

  useLayoutEffect(() => {
    if (!isOpen) {
      return
    }

    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }

      close()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        triggerRef.current?.focus()
        return
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return
      }

      const items = [
        ...(menuRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"]',
        ) ?? []),
      ]

      if (items.length === 0) {
        return
      }

      const currentIndex = items.findIndex(
        (item) => item === document.activeElement,
      )
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex =
        currentIndex === -1
          ? 0
          : (currentIndex + delta + items.length) % items.length
      const next = items[nextIndex]

      if (!next) {
        return
      }

      event.preventDefault()
      next.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', close)
    document.addEventListener('scroll', close, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [close, isOpen])

  return (
    <>
      <GhostButton
        ref={triggerRef}
        ariaLabel={label}
        title={label}
        ariaHasPopup="menu"
        ariaExpanded={isOpen}
        ariaControls={isOpen ? menuId : undefined}
        isActive={isOpen}
        className={triggerClassName}
        onClick={() => {
          setIsOpen((open) => !open)
        }}
      >
        <Ellipsis size={16} />
      </GhostButton>
      {isOpen
        ? createPortal(
            <MenuContext value={{ close }}>
              <div
                ref={(node) => {
                  menuRef.current = node

                  if (!node || !triggerRef.current) {
                    return
                  }

                  const { top, left } = menuPosition(
                    triggerRef.current.getBoundingClientRect(),
                    node.getBoundingClientRect(),
                    align,
                  )
                  node.style.top = `${top}px`
                  node.style.left = `${left}px`
                }}
                id={menuId}
                role="menu"
                aria-label={label}
                className={clsx(
                  'fixed z-50 w-max p-1',
                  'rounded-xl border border-neutral-200 bg-neutral-50 shadow-lg',
                  'dark:border-none dark:bg-neutral-700',
                )}
              >
                {children}
              </div>
            </MenuContext>,
            document.body,
          )
        : null}
    </>
  )
}

export function MenuItem({
  children,
  onSelect,
  isDestructive = false,
}: MenuItemProps) {
  const menu = use(MenuContext)

  if (!menu) {
    throw new Error('MenuItem must be used within a Menu')
  }

  return (
    <GhostButton
      role="menuitem"
      className={clsx(
        'grid w-full grid-cols-[1rem_1fr] items-center gap-2 px-2 py-1.5 text-left text-sm whitespace-nowrap',
        isDestructive
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
          : 'text-neutral-800 dark:text-neutral-100',
      )}
      onClick={() => {
        menu.close()
        onSelect()
      }}
    >
      {children}
    </GhostButton>
  )
}
