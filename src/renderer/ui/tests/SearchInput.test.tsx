import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from '../SearchInput'

describe('SearchInput', () => {
  it('focuses the input when the search control is clicked', async () => {
    render(
      <SearchInput
        value=""
        placeholder="Search"
        ariaLabel="Search chats"
        onChange={() => {}}
      />,
    )

    await userEvent.setup().click(screen.getByRole('search'))

    expect(screen.getByRole('textbox', { name: 'Search chats' })).toHaveFocus()
  })
})
