import * as React from 'react'
import styled from 'styled-components'
import { ActionPage, Box } from '@opencrvs/components/lib/interface'
import { Spinner, InvertSpinner } from '@opencrvs/components/lib/interface'
import {
  InjectedIntlProps,
  injectIntl,
  defineMessages,
  InjectedIntl
} from 'react-intl'
import { FormFieldGenerator } from 'src/components/form'
import {
  IFormSection,
  IFormSectionData,
  INFORMATIVE_RADIO_GROUP,
  PARAGRAPH,
  IFormData,
  PDF_DOCUMENT_VIEWER,
  IFormField,
  IForm,
  Event,
  Action
} from 'src/forms'
import {
  PrimaryButton,
  SecondaryButton,
  IconAction
} from '@opencrvs/components/lib/buttons'
import { connect } from 'react-redux'
import { IStoreState } from 'src/store'
import { hasFormError } from 'src/forms/utils'
import { calculatePrice } from './calculatePrice'
import { Print } from '@opencrvs/components/lib/icons'
import * as moment from 'moment'
import 'moment/locale/bn'
import 'moment/locale/en-ie'
import {
  Registrant,
  generateMoneyReceipt,
  generateCertificateDataURL,
  CertificateDetails,
  generateAndPrintCertificate
} from './generatePDF'
import { CERTIFICATE_DATE_FORMAT } from 'src/utils/constants'
import { TickLarge, Edit } from '@opencrvs/components/lib/icons'
import {
  storeDraft,
  createReviewDraft,
  IDraftsState
} from '@opencrvs/register/src/drafts'
import { Dispatch } from 'redux'
import { HeaderContent } from '@opencrvs/components/lib/layout'
import {
  fatherDataDoesNotExist,
  fatherDataExists
} from 'src/forms/certificate/fieldDefinitions/collector-section'
import { gqlToDraftTransformer, draftToGqlTransformer } from 'src/transformer'
import { documentForWhomFhirMapping } from 'src/forms/register/fieldDefinitions/birth/mappings/mutation/documents-mappings'
import {
  MutationProvider,
  MutationContext
} from 'src/views/DataProvider/MutationProvider'
import {
  QueryProvider,
  QueryContext
} from 'src/views/DataProvider/QueryProvider'
import { getUserDetails } from 'src/profile/profileSelectors'
import { GQLHumanName } from '@opencrvs/gateway/src/graphql/schema'
import { IUserDetails } from 'src/utils/userUtils'
import { RouteComponentProps } from 'react-router'
import { goToHome } from 'src/navigation'
import { CERTIFICATION, COMPLETION } from 'src/utils/constants'
import { CONFIRMATION_SCREEN } from 'src/navigation/routes'
import {
  IOfflineDataState,
  OFFLINE_LOCATIONS_KEY,
  OFFLINE_FACILITIES_KEY,
  ILocation
} from 'src/offline/reducer'
import { getOfflineState } from 'src/offline/selectors'
import { renderSelectDynamicLabel } from 'src/views/RegisterForm/review/ReviewSection'

const COLLECT_CERTIFICATE = 'collectCertificate'
const PAYMENT = 'payment'
const CERTIFICATE_PREVIEW = 'certificatePreview'

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
const ConfirmBtn = styled(PrimaryButton)`
  font-weight: bold;
  min-width: 148px;
  padding: 15px 20px 15px 20px;
  span {
    margin: 0 auto;
  }
  &:disabled {
    background: ${({ theme }) => theme.colors.primary};
    path {
      stroke: ${({ theme }) => theme.colors.disabled};
    }
  }
`

const EditRegistration = styled(SecondaryButton)`
  border: solid 1px ${({ theme }) => theme.colors.disabledButton};
  color: ${({ theme }) => theme.colors.primary} !important;
  font-weight: bold;
  margin: 0px 20px;
  top: 3px;
  position: relative;
  svg {
    margin-right: 15px;
  }
  &:hover {
    background: inherit;
    border: solid 1px ${({ theme }) => theme.colors.disabledButton};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.inputBackground};
  }

  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    margin-left: 0px;
    margin-top: 15px;
  }
`

const Info = styled.div`
  font-family: ${({ theme }) => theme.fonts.regularFont};
  margin-bottom: 30px;
`
const B = styled.div`
  display: block;
  line-height: 50px;
  font-weight: bold;
`

const ButtonSpinner = styled(InvertSpinner)`
  width: 15px;
  height: 15px;
  top: 0px !important;
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
  },
  printCertificate: {
    id: 'register.workQueue.print.printCertificate',
    defaultMessage: 'Print certificate',
    description: 'The label for print certificate button'
  },
  finish: {
    id: 'register.workQueue.print.finish',
    defaultMessage: 'Finish',
    description: 'The label for finish printing certificate button'
  },
  editRegistration: {
    id: 'certificate.btn.editRegistration',
    defaultMessage: 'Edit Registration'
  },
  certificateIsCorrect: {
    id: 'certificate.txt.isCorrectTxt'
  },
  state: {
    id: 'formFields.state',
    defaultMessage: 'Division',
    description: 'The label for state of event location'
  },
  district: {
    id: 'formFields.district',
    defaultMessage: 'District',
    description: 'The label for district of event location'
  },
  certificateConfirmationTxt: {
    id: 'certificate.txt.confirmationTxt'
  },
  back: {
    id: 'menu.back',
    defaultMessage: 'Back',
    description: 'Back button in the menu'
  },
  FIELD_AGENT: {
    id: 'register.home.header.FIELD_AGENT',
    defaultMessage: 'Field Agent',
    description: 'The description for FIELD_AGENT role'
  },
  REGISTRATION_CLERK: {
    id: 'register.home.header.REGISTRATION_CLERK',
    defaultMessage: 'Registration Clerk',
    description: 'The description for REGISTRATION_CLERK role'
  },
  LOCAL_REGISTRAR: {
    id: 'register.home.header.LOCAL_REGISTRAR',
    defaultMessage: 'Registrar',
    description: 'The description for LOCAL_REGISTRAR role'
  },
  DISTRICT_REGISTRAR: {
    id: 'register.home.header.DISTRICT_REGISTRAR',
    defaultMessage: 'District Registrar',
    description: 'The description for DISTRICT_REGISTRAR role'
  },
  STATE_REGISTRAR: {
    id: 'register.home.header.STATE_REGISTRAR',
    defaultMessage: 'State Registrar',
    description: 'The description for STATE_REGISTRAR role'
  },
  NATIONAL_REGISTRAR: {
    id: 'register.home.header.NATIONAL_REGISTRAR',
    defaultMessage: 'National Registrar',
    description: 'The description for NATIONAL_REGISTRAR role'
  }
})

interface IFullName {
  fullNameInBn: string
  fullNameInEng: string
}

const getFullName = (certificateDetails: CertificateDetails): IFullName => {
  let fullNameInBn = ''
  let fullNameInEng = ''
  if (certificateDetails && certificateDetails.name) {
    fullNameInBn = String(certificateDetails.name.bn)
    fullNameInEng = String(certificateDetails.name.en)
  }
  return {
    fullNameInBn,
    fullNameInEng
  }
}

interface ICertDetail {
  [key: string]: any
}
interface ICertDetails {
  [key: string]: ICertDetail
}

type State = {
  currentForm: string
  data: IFormSectionData
  enableConfirmButton: boolean
  certificatePdf: string
}

type IProps = {
  registrationId: string
  language: string
  collectCertificateForm: IFormSection
  paymentFormSection: IFormSection
  certificatePreviewFormSection: IFormSection
  registerForm: IForm
  userDetails: IUserDetails
  offlineResources: IOfflineDataState
}

type IFullProps = InjectedIntlProps &
  RouteComponentProps<{}> &
  IProps & { dispatch: Dispatch; drafts: IDraftsState }

class PrintCertificateActionComponent extends React.Component<
  IFullProps,
  State
> {
  constructor(props: IFullProps) {
    super(props)
    this.state = {
      data: {},
      enableConfirmButton: false,
      currentForm: COLLECT_CERTIFICATE,
      certificatePdf: ''
    }
  }

  finishSubmission = (certificateDetails: CertificateDetails) => {
    const { history } = this.props
    const fullName = getFullName(certificateDetails)
    const noOfCertificate = 103

    history.push(CONFIRMATION_SCREEN, {
      trackNumber: noOfCertificate,
      trackingSection: true,
      eventName: CERTIFICATION,
      actionName: COMPLETION,
      fullNameInBn: fullName.fullNameInBn,
      fullNameInEng: fullName.fullNameInEng
    })
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
    if (form.id !== 'certificatePreview') {
      return documentData && !hasFormError(form.fields, documentData)
    } else {
      return false
    }
  }

  addPDFToField(form: IFormSection) {
    form.fields.map((field: IFormField) => {
      if (field.type === PDF_DOCUMENT_VIEWER) {
        field.initialValue = this.state.certificatePdf
      }
    })
    return form
  }

  getForm = (currentForm: string) => {
    const {
      collectCertificateForm,
      paymentFormSection,
      certificatePreviewFormSection
    } = this.props
    switch (currentForm) {
      case COLLECT_CERTIFICATE:
        return collectCertificateForm
      case PAYMENT:
        return paymentFormSection
      case CERTIFICATE_PREVIEW:
        const result = this.addPDFToField(certificatePreviewFormSection)
        return result
      default:
        throw new Error(`No form found for id ${currentForm}`)
    }
  }
  getDraft() {
    const {
      registrationId,
      drafts: { drafts }
    } = this.props
    return (
      drafts.find(draftItem => draftItem.id === registrationId) || {
        data: {},
        eventType: 'birth'
      }
    )
  }
  processSubmitData() {
    const { registrationId, registerForm } = this.props
    const { data } = this.state
    const draft = this.getDraft()

    const result = {
      id: registrationId,
      details: draftToGqlTransformer(registerForm, draft.data)
    }
    let individual = null
    if (data.personCollectingCertificate === documentForWhomFhirMapping.Other) {
      individual = {
        name: [
          {
            use: 'en',
            firstNames: data.otherPersonGivenNames,
            familyName: data.otherPersonFamilyName
          }
        ],
        identifier: [{ id: data.documentNumber, type: data.otherPersonIDType }]
      }
    }

    const certificates = {
      collector: {
        relationship: data.personCollectingCertificate,
        individual
      },
      payments: {
        type: data.paymentMethod,
        total: data.paymentAmount,
        amount: data.paymentAmount,
        outcome: 'COMPLETED',
        date: Date.now()
      },
      hasShowedVerifiedDocument:
        data.otherPersonSignedAffidavit ||
        data.motherDetails ||
        data.fatherDetails
    }

    result.details.registration.certificates =
      result.details.registration.certificates || []
    result.details.registration.certificates.push(certificates)
    return result
  }

  getFormAction = (
    currentForm: string,
    registrant: Registrant,
    certificateDetails: CertificateDetails
  ) => {
    const { intl, paymentFormSection } = this.props
    const { enableConfirmButton } = this.state
    const issuerDetails = this.getIssuerDetails()
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
              onClick={() => {
                this.previewCertificatePDF(certificateDetails)
                this.onConfirmForm()
              }}
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
                  generateMoneyReceipt(
                    intl,
                    registrant,
                    issuerDetails,
                    amount,
                    this.props.language
                  )
                }}
              />
            </ButtonContainer>

            <ButtonContainer>
              <StyledPrimaryButton
                id="payment-confirm-button"
                disabled={!enableConfirmButton}
                onClick={() => {
                  this.previewCertificatePDF(certificateDetails)
                  this.onConfirmForm()
                }}
              >
                {intl.formatMessage(messages.next)}
              </StyledPrimaryButton>
            </ButtonContainer>
          </>
        )
      case CERTIFICATE_PREVIEW:
        return (
          <>
            <Box>
              <Info>
                <B>{intl.formatMessage(messages.certificateIsCorrect)}</B>
                {intl.formatMessage(messages.certificateConfirmationTxt)}
              </Info>
              <MutationProvider
                event={this.getEvent()}
                action={Action.COLLECT_CERTIFICATE}
                payload={this.processSubmitData()}
                onCompleted={() => {
                  this.setState(() => ({
                    enableConfirmButton: true
                  }))
                }}
              >
                <MutationContext.Consumer>
                  {({ mutation, loading, data }) => (
                    <ConfirmBtn
                      id="registerApplicationBtn"
                      disabled={loading || data}
                      // @ts-ignore
                      onClick={() => mutation()}
                    >
                      {!loading && (
                        <>
                          <TickLarge />
                          <span>{intl.formatMessage(messages.confirm)}</span>
                        </>
                      )}
                      {loading && (
                        <span>
                          <ButtonSpinner id="Spinner" />
                        </span>
                      )}
                    </ConfirmBtn>
                  )}
                </MutationContext.Consumer>
              </MutationProvider>
              <EditRegistration id="edit" disabled={true}>
                <Edit />
                {this.props.intl.formatMessage(messages.editRegistration)}
              </EditRegistration>
            </Box>
            <ButtonContainer>
              <StyledIconAction
                id="print-certificate"
                title={intl.formatMessage(messages.printCertificate)}
                icon={() => <StyledPrintIcon />}
                disabled={!enableConfirmButton}
                onClick={() => {
                  generateAndPrintCertificate(certificateDetails)
                }}
              />
            </ButtonContainer>

            <ButtonContainer>
              <StyledPrimaryButton
                id="finish-printing-certificate"
                disabled={!enableConfirmButton}
                onClick={() => this.finishSubmission(certificateDetails)}
              >
                {intl.formatMessage(messages.finish)}
              </StyledPrimaryButton>
            </ButtonContainer>
          </>
        )
      default:
        return null
    }
  }

  previewCertificatePDF(certificateDetails: CertificateDetails) {
    generateCertificateDataURL(certificateDetails, (certificatePdf: string) => {
      this.setState(prevState => {
        const result = {
          ...prevState,
          certificatePdf
        }
        return result
      })
    })
  }

  onConfirmForm = () => {
    const { currentForm } = this.state
    let destForm = COLLECT_CERTIFICATE

    switch (currentForm) {
      case COLLECT_CERTIFICATE:
        const { paymentFormSection } = this.props
        const paymentAmountField = paymentFormSection.fields.find(
          field => field.name === 'paymentAmount'
        )
        paymentAmountField && Number(paymentAmountField.initialValue) > 0
          ? (destForm = PAYMENT)
          : (destForm = CERTIFICATE_PREVIEW)
        break
      case PAYMENT:
        destForm = CERTIFICATE_PREVIEW
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

  getCertificateDetails(
    data: ICertDetails,
    intl: InjectedIntl,
    offlineResources: IOfflineDataState
  ): CertificateDetails {
    const names = data.child.name as Array<{ [key: string]: {} }>
    const NameBn = names.find(name => name.use === 'bn')
    const NameEn = names.find(name => name.use === 'en')
    const DOBEn = moment(data.child.birthDate as string).format(
      CERTIFICATE_DATE_FORMAT
    )
    moment.locale('bn')
    const DOBBn = moment(data.child.birthDate as string).format(
      CERTIFICATE_DATE_FORMAT
    )

    let regLocationEn = ''
    let regLocationBn = ''
    if (
      data &&
      data.registration &&
      data.registration.status &&
      data.registration.status[0] &&
      data.registration.status[0].office &&
      data.registration.status[0].office.address
    ) {
      regLocationEn = [
        data.registration.status[0].office.name as string,
        data.registration.status[0].office.address.district as string,
        data.registration.status[0].office.address.state as string
      ].join(', ') as string
      regLocationBn = data.registration.status[0].office.alias as string
    }

    let eventLocationEn = ''
    let eventLocationBn = ''

    if (
      data &&
      data.eventLocation &&
      data.eventLocation.address &&
      data.eventLocation.address.state &&
      data.eventLocation.address.district
    ) {
      if (
        data.eventLocation.type === 'HEALTH_FACILITY' &&
        data._fhirIDMap.eventLocation
      ) {
        const selectedLocation = offlineResources[
          OFFLINE_FACILITIES_KEY
        ].filter((location: ILocation) => {
          return location.id === data._fhirIDMap.eventLocation
        })[0]
        const partOfID = selectedLocation.partOf.split('/')[1]
        eventLocationEn = [
          renderSelectDynamicLabel(
            data._fhirIDMap.eventLocation,
            {
              resource: OFFLINE_FACILITIES_KEY,
              dependency: 'placeOfBirth'
            },
            {},
            intl,
            offlineResources,
            'en'
          ),
          renderSelectDynamicLabel(
            partOfID,
            {
              resource: OFFLINE_LOCATIONS_KEY,
              dependency: 'district'
            },
            {},
            intl,
            offlineResources,
            'en'
          )
        ].join()
        eventLocationBn = [
          renderSelectDynamicLabel(
            data._fhirIDMap.eventLocation,
            {
              resource: OFFLINE_FACILITIES_KEY,
              dependency: 'placeOfBirth'
            },
            {},
            intl,
            offlineResources,
            'bn'
          ),
          renderSelectDynamicLabel(
            partOfID,
            {
              resource: OFFLINE_LOCATIONS_KEY,
              dependency: 'district'
            },
            {},
            intl,
            offlineResources,
            'bn'
          )
        ].join()
      } else {
        eventLocationEn = [
          `${renderSelectDynamicLabel(
            data.eventLocation.address.district,
            {
              resource: OFFLINE_LOCATIONS_KEY,
              dependency: 'state'
            },
            {},
            intl,
            offlineResources,
            'en'
          )} ${intl.formatMessage(messages.district)}`,
          `${renderSelectDynamicLabel(
            data.eventLocation.address.state,
            {
              resource: OFFLINE_LOCATIONS_KEY,
              dependency: 'country'
            },
            {},
            intl,
            offlineResources,
            'en'
          )} ${intl.formatMessage(messages.state)}`
        ].join(', ')
        eventLocationBn = [
          renderSelectDynamicLabel(
            data.eventLocation.address.district,
            {
              resource: OFFLINE_LOCATIONS_KEY,
              dependency: 'state'
            },
            {},
            intl,
            offlineResources,
            'bn'
          ),
          renderSelectDynamicLabel(
            data.eventLocation.address.state,
            {
              resource: OFFLINE_LOCATIONS_KEY,
              dependency: 'country'
            },
            {},
            intl,
            offlineResources,
            'bn'
          )
        ].join(', ')
      }
    }

    return {
      registrationNo: data.registration.registrationNumber as string,
      registrationLocation: {
        en: regLocationEn,
        bn: regLocationBn
      },
      eventLocation: {
        en: eventLocationEn,
        bn: eventLocationBn
      },
      name: {
        bn: NameBn ? NameBn.firstNames + ' ' + NameBn.familyName : '',
        en: NameEn ? NameEn.firstNames + ' ' + NameEn.familyName : ''
      },
      dob: {
        bn: DOBBn,
        en: DOBEn
      }
    }
  }
  getEvent() {
    const eventType = this.getDraft().eventType || 'BIRTH'
    switch (eventType.toLocaleLowerCase()) {
      case 'birth':
        return Event.BIRTH
      case 'death':
        return Event.DEATH
      default:
        return Event.BIRTH
    }
  }

  getIssuerDetails() {
    const { intl, userDetails, language } = this.props
    let fullName = ''

    if (userDetails && userDetails.name) {
      const nameObj = userDetails.name.find(
        (storedName: GQLHumanName) => storedName.use === language
      ) as GQLHumanName
      fullName = `${String(nameObj.firstNames)} ${String(nameObj.familyName)}`
    }

    return {
      name: fullName,
      role:
        userDetails && userDetails.role
          ? intl.formatMessage(messages[userDetails.role])
          : '',
      issuedAt:
        userDetails &&
        userDetails.primaryOffice &&
        userDetails.primaryOffice.name
          ? userDetails.primaryOffice.name
          : ''
    }
  }

  render = () => {
    const {
      intl,
      registrationId,
      collectCertificateForm,
      paymentFormSection,
      drafts: { drafts },
      dispatch,
      offlineResources
    } = this.props

    const { currentForm } = this.state
    const form = this.getForm(currentForm)

    return (
      <ActionPageWrapper>
        <ActionPage
          title={intl.formatMessage(form.title)}
          backLabel={intl.formatMessage(messages.back)}
          goBack={() => {
            dispatch(goToHome())
          }}
        >
          <HeaderContent>
            <QueryProvider
              event={this.getEvent()}
              action={Action.LOAD_CERTIFICATE_APPLICATION}
              payload={{ id: registrationId }}
            >
              <QueryContext.Consumer>
                {({ loading, error, data, dataKey }) => {
                  if (loading) {
                    return <StyledSpinner id="print-certificate-spinner" />
                  }
                  if (data) {
                    // @ts-ignore
                    const retrievedData = data[dataKey]
                    let fields = collectCertificateForm.fields
                    fields = fields.map(field => {
                      if (
                        field &&
                        field.type === INFORMATIVE_RADIO_GROUP &&
                        field.name === 'motherDetails'
                      ) {
                        field.information = retrievedData.mother
                      } else if (
                        field &&
                        field.type === INFORMATIVE_RADIO_GROUP &&
                        field.name === 'fatherDetails'
                      ) {
                        field.information = retrievedData.father
                      }

                      return field
                    })

                    const paymentAmount = calculatePrice(
                      retrievedData.child.birthDate
                    )

                    moment.locale(this.props.language)
                    const DOBDiff = moment(
                      retrievedData.child.birthDate,
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
                      retrievedData
                    )

                    const certificateData = this.getCertificateDetails(
                      retrievedData,
                      intl,
                      offlineResources
                    )

                    const transData: IFormData = gqlToDraftTransformer(
                      this.props.registerForm,
                      retrievedData
                    )
                    if (
                      form.fields.filter(
                        field => field.name === 'personCollectingCertificate'
                      ).length === 0 &&
                      form === collectCertificateForm
                    ) {
                      if (
                        transData.father &&
                        transData.father.fathersDetailsExist
                      ) {
                        form.fields.unshift(fatherDataExists)
                      } else {
                        form.fields.unshift(fatherDataDoesNotExist)
                      }
                    }
                    const reviewDraft = createReviewDraft(
                      registrationId,
                      transData,
                      this.getEvent()
                    )
                    const draftExist = !!drafts.find(
                      draft => draft.id === registrationId
                    )
                    if (!draftExist) {
                      dispatch(storeDraft(reviewDraft))
                    }
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
                            this.getFormAction(
                              this.state.currentForm,
                              registrant,
                              certificateData
                            )}
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
              </QueryContext.Consumer>
            </QueryProvider>
          </HeaderContent>
        </ActionPage>
      </ActionPageWrapper>
    )
  }
}

const event = 'birth'

function mapStatetoProps(
  state: IStoreState,
  props: RouteComponentProps<{ registrationId: string }>
) {
  const { match } = props

  return {
    registrationId: match.params.registrationId,
    language: state.i18n.language,
    paymentFormSection: state.printCertificateForm.paymentForm,
    certificatePreviewFormSection:
      state.printCertificateForm.certificatePreviewForm,
    drafts: state.drafts,
    registerForm: state.registerForm.registerForm[event],
    collectCertificateForm: state.printCertificateForm.collectCertificateForm,
    userDetails: getUserDetails(state),
    offlineResources: getOfflineState(state)
  }
}
export const PrintCertificateAction = connect(
  (state: IStoreState) => mapStatetoProps
)(injectIntl<IFullProps>(PrintCertificateActionComponent))