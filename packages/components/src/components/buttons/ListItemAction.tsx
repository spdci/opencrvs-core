import * as React from 'react'
import styled from 'styled-components'
import { Button, IButtonProps } from './Button'
import { ExpansionButton } from './ExpansionButton'
import { IAction } from '../interface/ListItem'

const Container = styled.div`
  display: flex;
  flex-direction: row;
  margin-left: 1px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    margin-left: 0px;
  }
`
const ListItemSingleAction = styled(Button)`
  display: flex;
  justify-content: center;
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.white};
  ${({ theme }) => theme.fonts.capsFontStyle};
  font-weight: 600;
  width: 140px;
  margin-right: 1px;
  padding: 0px 0px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    margin-right: 0px;
  }
  margin-bottom: 1px;
  &:last-child {
    margin-bottom: 0;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.white};
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.disabled};
  }
`

interface IListItemActionProps {
  actions: IAction[]
  id?: string
  expanded?: boolean
  onExpand?: () => void
}

export function ListItemAction(props: IListItemActionProps) {
  const { actions, expanded, onExpand, id } = props
  return (
    <Container id={id}>
      {actions &&
        actions.map((action: IAction) => (
          <ListItemSingleAction
            key={action.label as string}
            id={action.label as string}
            onClick={action.handler}
          >
            {action.label}
          </ListItemSingleAction>
        ))}
      {onExpand && <ExpansionButton expanded={expanded} onClick={onExpand} />}
    </Container>
  )
}
