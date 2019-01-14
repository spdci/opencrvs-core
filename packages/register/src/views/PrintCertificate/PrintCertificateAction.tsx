import * as React from 'react'
import gql from 'graphql-tag'
import { Query } from 'react-apollo'
import styled from 'styled-components'
import { ActionPage, Box } from '@opencrvs/components/lib/interface'
import { Spinner } from '@opencrvs/components/lib/interface'
import { InjectedIntlProps, injectIntl, defineMessages } from 'react-intl'
import { FormFieldGenerator } from 'src/components/form'
import {
  IFormSection,
  IFormSectionData,
  INFORMATIVE_RADIO_GROUP,
  PARAGRAPH,
  IFormData
} from 'src/forms'
import { PrimaryButton, IconAction } from '@opencrvs/components/lib/buttons'
import { connect } from 'react-redux'
import { IStoreState } from 'src/store'
import { hasFormError } from 'src/forms/utils'
import { calculatePrice } from './calculatePrice'
import { Print } from '@opencrvs/components/lib/icons'
import * as pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'src/vfs_fonts'
import * as moment from 'moment'
import 'moment/locale/bn'
import 'moment/locale/en-ie'
import { CERTIFICATE_DATE_FORMAT } from 'src/utils/constants'

const COLLECT_CERTIFICATE = 'collectCertificate'
const PAYMENT = 'payment'

export const ActionPageWrapper = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.background};
  z-index: 4;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
`

const StyledSpinner = styled(Spinner)`
  margin: 50% auto;
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-family: ${({ theme }) => theme.fonts.lightFont};
  text-align: center;
  margin-top: 100px;
`
const FormContainer = styled.div`
  padding: 35px 25px;
`
const Column = styled.div`
  margin: 5px 0px;
  width: 100%;

  &:first-child {
    margin-left: 0px;
  }
  &:last-child {
    margin-right: 0px;
  }
`

const ButtonContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.inputBackground};
  padding: 25px;
  margin-bottom: 2px;
`
const StyledPrimaryButton = styled(PrimaryButton)`
  font-weight: 600;
`
const StyledPrintIcon = styled(Print)`
  display: flex;
  margin: -13px;
`
const StyledIconAction = styled(IconAction)`
  background-color: transparent;
  box-shadow: none;
  min-height: auto;
  padding: 0px;
  width: auto;
  div:first-of-type {
    height: 50px;
    padding: 0px;
  }
  h3 {
    font-family: ${({ theme }) => theme.fonts.boldFont};
    margin-left: 70px;
    color: ${({ theme }) => theme.colors.secondary};
    text-decoration: underline;
    font-size: 16px;
  }
  &:disabled {
    div:first-of-type {
      background: ${({ theme }) => theme.colors.disabledButton};
    }
    g {
      fill: ${({ theme }) => theme.colors.disabled};
    }
    h3 {
      color: ${({ theme }) => theme.colors.disabled};
    }
  }
`
export const FETCH_BIRTH_REGISTRATION_QUERY = gql`
  query data($id: ID!) {
    fetchBirthRegistration(id: $id) {
      id
      child {
        name {
          use
          firstNames
          familyName
        }
        birthDate
      }
      mother {
        name {
          firstNames
          familyName
        }
        identifier {
          id
          type
        }
        birthDate
        nationality
      }
      father {
        name {
          firstNames
          familyName
        }
        identifier {
          id
          type
        }
        birthDate
        nationality
      }
      createdAt
    }
  }
`

const messages = defineMessages({
  queryError: {
    id: 'print.certificate.queryError',
    defaultMessage:
      'An error occurred while quering for birth registration data',
    description: 'The error message shown when a query fails'
  },
  confirm: {
    id: 'print.certificate.confirm',
    defaultMessage: 'Confirm',
    description:
      'The label for confirm button when all information of the collector is provided'
  },
  printReceipt: {
    id: 'print.certificate.printReceipt',
    defaultMessage: 'Print receipt',
    description: 'The label for print receipt button'
  },
  next: {
    id: 'print.certificate.next',
    defaultMessage: 'Next',
    description: 'The label for next button'
  },
  serviceYear: {
    id: 'register.workQueue.print.serviceYear',
    defaultMessage:
      'Service: <strong>Birth registration after {service, plural, =0 {0 year} one {1 year} other{{service} years}} of D.o.B.</strong><br/>Amount Due:',
    description: 'The label for service paragraph'
  },
  serviceMonth: {
    id: 'register.workQueue.print.serviceMonth',
    defaultMessage:
      'Service: <strong>Birth registration after {service, plural, =0 {0 month} one {1 month} other{{service} months}} of D.o.B.</strong><br/>Amount Due:',
    description: 'The label for service paragraph'
  },
  service: {
    id: 'register.workQueue.print.service',
    defaultMessage:
      'Service: <strong>Birth registration after {service} of D.o.B.</strong><br/>Amount Due:',
    description: 'The label for service paragraph'
  },
  certificateHeader: {
    id: 'register.work-queue.certificate.header'
  },
  certificateSubHeader: {
    id: 'register.work-queue.certificate.subheader'
  },
  certificateIssuer: {
    id: 'register.work-queue.certificate.issuer'
  },
  certificatePaidAmount: {
    id: 'register.work-queue.certificate.amount'
  },
  certificateService: {
    id: 'register.work-queue.certificate.service'
  }
})

type Registrant = {
  name: string
  DOBDiff: string
}

type State = {
  currentForm: string
  data: IFormSectionData
  enableConfirmButton: boolean
}

type Issuer = {
  name: string
  role: string
  issuedAt: string
}

type IProps = {
  backLabel: string
  title: string
  registrationId: string
  language: string
  togglePrintCertificateSection: () => void
  printCertificateFormSection: IFormSection
  paymentFormSection: IFormSection
  IssuerDetails: Issuer
}

type IFullProps = InjectedIntlProps & IProps

class PrintCertificateActionComponent extends React.Component<
  IFullProps,
  State
> {
  constructor(props: IFullProps) {
    super(props)
    this.state = {
      data: {},
      enableConfirmButton: false,
      currentForm: COLLECT_CERTIFICATE
    }
  }

  storeData = (documentData: IFormSectionData) => {
    this.setState(
      prevState => ({
        data: { ...prevState.data, ...documentData }
      }),
      () =>
        this.setState(() => ({
          enableConfirmButton: this.shouldEnableConfirmButton(documentData)
        }))
    )
  }

  shouldEnableConfirmButton = (documentData: IFormSectionData) => {
    const form = this.getForm(this.state.currentForm)
    return documentData && !hasFormError(form.fields, documentData)
  }

  getForm = (currentForm: string) => {
    const { printCertificateFormSection, paymentFormSection } = this.props
    switch (currentForm) {
      case COLLECT_CERTIFICATE:
        return printCertificateFormSection
      case PAYMENT:
        return paymentFormSection
      default:
        throw new Error(`No form found for id ${currentForm}`)
    }
  }

  getFormAction = (currentForm: string, registrant: Registrant) => {
    const { intl, IssuerDetails, paymentFormSection } = this.props
    const { enableConfirmButton } = this.state
    const dateOfPayment = moment().format(CERTIFICATE_DATE_FORMAT)
    const amountObj = paymentFormSection.fields.find(
      i => i.name === 'paymentAmount'
    )
    let amount = ''
    if (amountObj && amountObj.label && amountObj.initialValue) {
      amount = intl.formatMessage(amountObj.label, {
        paymentAmount: amountObj.initialValue.toString()
      })
    }

    switch (currentForm) {
      case COLLECT_CERTIFICATE:
        return (
          <ButtonContainer>
            <StyledPrimaryButton
              id="print-confirm-button"
              disabled={!enableConfirmButton}
              onClick={this.onConfirmForm}
            >
              {intl.formatMessage(messages.confirm)}
            </StyledPrimaryButton>
          </ButtonContainer>
        )
      case PAYMENT:
        return (
          <>
            <ButtonContainer>
              <StyledIconAction
                id="print-receipt"
                title={intl.formatMessage(messages.printReceipt)}
                icon={() => <StyledPrintIcon />}
                onClick={() => {
                  console.log(pdfFonts)
                  console.log(pdfMake.pdfMake)

                  const docDefinition = {
                    info: {
                      title: 'Receipt-for-Birth-Certificate'
                    },
                    defaultStyle: {
                      font: 'notosans'
                    },
                    content: [
                      {
                        text: intl.formatMessage(messages.certificateHeader),
                        style: 'header'
                      },
                      {
                        text: registrant.name,
                        style: 'header'
                      },
                      '\n\n',
                      {
                        text: [
                          {
                            text: intl.formatMessage(
                              messages.certificateService
                            )
                          },
                          {
                            text: intl.formatMessage(
                              messages.certificateSubHeader,
                              { DOBDiff: registrant.DOBDiff }
                            ),
                            style: 'subheader'
                          }
                        ]
                      },
                      intl.formatMessage(messages.certificatePaidAmount),
                      {
                        text: `${amount}\n\n`,
                        style: 'amount'
                      },
                      intl.formatMessage(messages.certificateIssuer, {
                        issuedAt: IssuerDetails.issuedAt,
                        role: IssuerDetails.role,
                        name: IssuerDetails.name,
                        dateOfPayment
                      })
                    ],
                    styles: {
                      header: {
                        fontSize: 18
                      },
                      amount: {
                        font: 'notosanscurrency',
                        fontSize: 30,
                        bold: true
                      },
                      subheader: {
                        bold: true
                      }
                    }
                  }

                  const fonts = {
                    bn: {
                      notosans: {
                        normal: 'NotoSansBengali-Light.ttf',
                        regular: 'NotoSansBengali-Light.ttf',
                        bold: 'NotoSansBengali-Regular.ttf',
                        italics: 'NotoSansBengali-Light.ttf'
                      },
                      notosanscurrency: {
                        normal: 'NotoSansBengali-Light.ttf',
                        regular: 'NotoSansBengali-Light.ttf',
                        bold: 'NotoSansBengali-Light.ttf',
                        italics: 'NotoSansBengali-Light.ttf'
                      }
                    },
                    en: {
                      notosanscurrency: {
                        normal: 'NotoSansBengali-Light.ttf',
                        regular: 'NotoSansBengali-Light.ttf',
                        bold: 'NotoSansBengali-Light.ttf',
                        italics: 'NotoSansBengali-Light.ttf'
                      },
                      notosans: {
                        normal: 'NotoSans-Light.ttf',
                        regular: 'NotoSans-Light.ttf',
                        bold: 'NotoSans-Regular.ttf',
                        italics: 'NotoSans-LightItalic.ttf'
                      }
                    }
                  }

                  pdfMake.vfs = pdfFonts.pdfMake.vfs
                  const font = fonts[this.props.language]

                  console.log(fonts)
                  console.log(pdfFonts)
                  console.log(font)

                  const generatedPDF = pdfMake.createPdf(
                    docDefinition,
                    null,
                    font
                  )
                  generatedPDF.open()
                }}
              />
            </ButtonContainer>

            <ButtonContainer>
              <StyledPrimaryButton
                id="payment-confirm-button"
                disabled={!enableConfirmButton}
                onClick={() => console.log('go to certificate print section')}
              >
                {intl.formatMessage(messages.next)}
              </StyledPrimaryButton>
            </ButtonContainer>
          </>
        )
      default:
        return null
    }
  }

  onConfirmForm = () => {
    const { currentForm } = this.state
    let destForm = COLLECT_CERTIFICATE

    switch (currentForm) {
      case COLLECT_CERTIFICATE:
        destForm = PAYMENT
        break
      default:
        break
    }
    this.setState({ currentForm: destForm })
  }

  setRegistrant(data: IFormData): Registrant {
    const names = data.child.name as Array<{ [key: string]: {} }>
    const nameObj = names.find(name => name.use === this.props.language)
    const registrant = { name: '', DOBDiff: '' }
    moment.locale(this.props.language)

    if (nameObj) {
      registrant.name = nameObj.firstNames + ' ' + nameObj.familyName
      registrant.DOBDiff = moment(data.child.birthDate.toString(), 'YYYY-MM-DD')
        .fromNow()
        .replace(' ago', '')
        .replace(' আগে', '')
    }

    return registrant
  }

  render = () => {
    const {
      intl,
      backLabel,
      registrationId,
      togglePrintCertificateSection,
      printCertificateFormSection,
      paymentFormSection
    } = this.props

    const { currentForm } = this.state
    const form = this.getForm(currentForm)

    return (
      <ActionPageWrapper>
        <ActionPage
          title={intl.formatMessage(form.title)}
          backLabel={backLabel}
          goBack={togglePrintCertificateSection}
        >
          <Query
            query={FETCH_BIRTH_REGISTRATION_QUERY}
            variables={{
              id: registrationId
            }}
          >
            {({ loading, error, data }) => {
              if (loading) {
                return <StyledSpinner id="print-certificate-spinner" />
              }

              if (data) {
                let fields = printCertificateFormSection.fields
                fields = fields.map(field => {
                  if (
                    field &&
                    field.type === INFORMATIVE_RADIO_GROUP &&
                    field.name === 'motherDetails'
                  ) {
                    field.information = data.fetchBirthRegistration.mother
                  } else if (
                    field &&
                    field.type === INFORMATIVE_RADIO_GROUP &&
                    field.name === 'fatherDetails'
                  ) {
                    field.information = data.fetchBirthRegistration.father
                  }

                  return field
                })

                const paymentAmount = calculatePrice(
                  data.fetchBirthRegistration.child.birthDate
                )

                moment.locale(this.props.language)
                const DOBDiff = moment(
                  data.fetchBirthRegistration.child.birthDate,
                  'YYYY-MM-DD'
                )
                  .fromNow()
                  .replace(' ago', '')
                  .replace(' আগে', '')

                paymentFormSection.fields.map(field => {
                  if (
                    field &&
                    field.type === PARAGRAPH &&
                    field.name === 'paymentAmount'
                  ) {
                    field.initialValue = paymentAmount
                  }
                })

                paymentFormSection.fields.map(field => {
                  if (
                    field &&
                    field.type === PARAGRAPH &&
                    field.name === 'service'
                  ) {
                    field.initialValue = DOBDiff.toString()
                    field.label = messages[`service`]
                  }
                })

                const registrant: Registrant = this.setRegistrant(
                  data.fetchBirthRegistration
                )

                return (
                  <FormContainer>
                    <Box>
                      <FormFieldGenerator
                        id={form.id}
                        onChange={this.storeData}
                        setAllFieldsDirty={false}
                        fields={form.fields}
                      />
                    </Box>
                    <Column>
                      {this.state.data.personCollectingCertificate &&
                        this.getFormAction(this.state.currentForm, registrant)}
                    </Column>
                  </FormContainer>
                )
              }
              if (error) {
                return (
                  <ErrorText id="print-certificate-queue-error-text">
                    {intl.formatMessage(messages.queryError)}
                  </ErrorText>
                )
              }

              return JSON.stringify(data)
            }}
          </Query>
        </ActionPage>
      </ActionPageWrapper>
    )
  }
}

export const PrintCertificateAction = connect((state: IStoreState) => ({
  language: state.i18n.language,
  paymentFormSection: state.printCertificateForm.paymentForm
}))(injectIntl<IFullProps>(PrintCertificateActionComponent))
