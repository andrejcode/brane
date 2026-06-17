import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AlertProvider, useAlert } from '../contexts/AlertContext'
import { GlobalAlert } from '../GlobalAlert'

function renderWithControls() {
  function Controls() {
    const { showAlert, dismissAlert } = useAlert()

    return (
      <>
        <button type="button" onClick={() => showAlert('Boom', 'error')}>
          raise
        </button>
        <button type="button" onClick={() => showAlert('FYI', 'info')}>
          raise-info
        </button>
        <button type="button" onClick={dismissAlert}>
          clear
        </button>
      </>
    )
  }

  return render(
    <AlertProvider>
      <GlobalAlert />
      <Controls />
    </AlertProvider>,
  )
}

describe('GlobalAlert', () => {
  it('shows nothing until an alert is raised', () => {
    renderWithControls()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders the raised message, then clears on dismiss', async () => {
    const user = userEvent.setup()
    renderWithControls()

    await user.click(screen.getByRole('button', { name: 'raise' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Boom')

    await user.click(screen.getByRole('button', { name: 'clear' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('uses a polite status role for non-error variants', async () => {
    const user = userEvent.setup()
    renderWithControls()

    await user.click(screen.getByRole('button', { name: 'raise-info' }))

    expect(screen.getByRole('status')).toHaveTextContent('FYI')
  })
})
