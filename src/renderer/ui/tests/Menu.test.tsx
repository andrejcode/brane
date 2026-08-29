import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Menu, MenuItem } from '../Menu'

function renderMenu({
  onRename = vi.fn(),
  onDelete = vi.fn(),
}: { onRename?: () => void; onDelete?: () => void } = {}) {
  return {
    onRename,
    onDelete,
    user: userEvent.setup(),
    ...render(
      <div>
        <button type="button">outside</button>
        <Menu label="Chat actions">
          <MenuItem onSelect={onRename}>
            <span aria-hidden="true">R</span>
            Rename
          </MenuItem>
          <MenuItem isDestructive onSelect={onDelete}>
            <span aria-hidden="true">D</span>
            Delete
          </MenuItem>
        </Menu>
      </div>,
    ),
  }
}

describe('Menu', () => {
  it('shrink-wraps the menu and aligns item icons', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Chat actions' }))

    expect(screen.getByRole('menu')).toHaveClass('w-max')
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveClass(
      'grid',
      'grid-cols-[1rem_1fr]',
      'items-center',
    )
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass(
      'grid',
      'grid-cols-[1rem_1fr]',
      'items-center',
    )
  })

  it('opens the actions and runs the chosen item', async () => {
    const { onRename, user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Chat actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))

    expect(onRename).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Chat actions' }))
    expect(
      screen.getByRole('menu', { name: 'Chat actions' }),
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes when clicking outside', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Chat actions' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'outside' }))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
