import * as React from 'react'
import styled from 'styled-components'
import { ApolloQueryResult } from 'apollo-client'
import { GQLQuery } from '@opencrvs/gateway/src/graphql/schema.d'
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl'

import { Spinner } from '@opencrvs/components/lib/interface'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import { Success, Error } from '@opencrvs/components/lib/icons'
import { client } from 'src/utils/apolloClient'

const messages = defineMessages({
  back: {
    id: 'menu.back',
    defaultMessage: 'Back',
    description: 'Back button text in the modal'
  },
  cancel: {
    id: 'formFields.loaderButton.cancel',
    defaultMessage: 'Cancel',
    description: 'Cancel button text in the modal'
  }
})

interface ILoaderButtonProps {
  query: any
  className?: string
  label: string
  modalTitle: string
  modalInfoText1: string
  modalInfoText2: string
  successTitle: string
  errorTitle: string
  errorText: string
  onFetch?: (response: ApolloQueryResult<GQLQuery>) => void
  variables: any
}

interface ILoaderButtonState {
  response?: ApolloQueryResult<GQLQuery>
  error?: boolean
  success?: boolean
  loading?: boolean
  show?: boolean
}

type IFullProps = ILoaderButtonProps & InjectedIntlProps

const Container = styled.div`
  display: flex;
`
const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(53, 73, 93, 0.78);
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`

const ModalContent = styled.div`
  width: 30vw;
  border-radius: 2px;
  background-color: ${({ theme }) => theme.colors.white};
  padding: 30px 30px 60px 30px;
  color: ${({ theme }) => theme.colors.copy};
  text-align: center;
  font-size: 14px;
  font-family: ${({ theme }) => theme.fonts.regularFont};
  position: relative;
`

const Heading = styled.div`
  color: ${({ theme }) => theme.colors.copy};
  text-align: center;
  font-size: 15px;
  font-weight: bold;
  font-family: ${({ theme }) => theme.fonts.regularFont};
`

const Info = styled.div`
  color: ${({ theme }) => theme.colors.copy};
  text-align: center;
  font-size: 15px;
  font-family: ${({ theme }) => theme.fonts.regularFont};
`

const StyledSpinner = styled(Spinner)`
  margin: 10px auto;
`
const StyledError = styled(Error)`
  margin: 10px auto;
`
const StyledSuccess = styled(Success)`
  margin: 10px auto;
`
const ConfirmButton = styled.a`
  margin: 10px;
  display: block;
  text-decoration: underline;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
`
const StyledPrimaryButton = styled(PrimaryButton)`
  text-align: center;
  ${({ theme }) => {
    return `@media (min-width: ${theme.grid.breakpoints.md}px) {
      width: 515px;
    }`
  }}
`

class LoaderButton extends React.Component<IFullProps, ILoaderButtonState> {
  constructor(props: IFullProps) {
    super(props)
    this.state = {
      loading: false,
      error: false
    }
  }
  hideModal = () => {
    this.setState({
      show: false,
      loading: false,
      error: false,
      response: undefined
    })
  }
  performQuery = async () => {
    try {
      this.setState({ show: true, loading: true, success: false, error: false })
      const response = await client.query({
        query: this.props.query,
        variables: this.props.variables
      })
      this.setState({ success: true, loading: false, error: false })
      if (this.props.onFetch) {
        this.props.onFetch(response)
      }
    } catch (error) {
      this.setState({ error: true, loading: false, success: false })
    }
  }

  render() {
    const {
      intl,
      label,
      modalTitle,
      modalInfoText1,
      successTitle,
      errorTitle,
      errorText,
      variables
    } = this.props
    const { loading, error, success, show } = this.state
    return (
      <Container {...this.props}>
        <StyledPrimaryButton
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            this.performQuery()
            event.preventDefault()
          }}
        >
          {label}
        </StyledPrimaryButton>
        {show && (
          <Backdrop>
            <ModalContent>
              {modalTitle && loading && <Heading>{modalTitle}</Heading>}
              {errorTitle && error && <Heading>{errorTitle}</Heading>}
              {successTitle && success && <Heading>{successTitle}</Heading>}
              {modalInfoText1 && <Info>{modalInfoText1}</Info>}
              {variables && <Info>{Object.values(variables)}</Info>}

              {loading && (
                <div>
                  <StyledSpinner id="loader-button-spinner" />
                  <ConfirmButton onClick={this.hideModal}>
                    {intl.formatMessage(messages.cancel)}
                  </ConfirmButton>
                </div>
              )}
              {error && <StyledError />}
              {success && <StyledSuccess />}
              {errorText && error && <Info>{errorText}</Info>}
              {!loading && (
                <ConfirmButton onClick={this.hideModal}>
                  {intl.formatMessage(messages.back)}
                </ConfirmButton>
              )}
            </ModalContent>
          </Backdrop>
        )}
      </Container>
    )
  }
}

export const LoaderButtonField = injectIntl<IFullProps>(LoaderButton)
