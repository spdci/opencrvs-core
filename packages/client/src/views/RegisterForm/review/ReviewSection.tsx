/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors. OpenCRVS and the OpenCRVS
 * graphic logo are (registered/a) trademark(s) of Plan International.
 */
import {
  LinkButton,
  TertiaryButton,
  PrimaryButton
} from '@opencrvs/components/lib/buttons'
import {
  InputField,
  ISelectOption as SelectComponentOptions,
  TextArea
} from '@opencrvs/components/lib/forms'
import {
  DocumentViewer,
  IDocumentViewerOptions,
  ResponsiveModal
} from '@opencrvs/components/lib/interface'
import { FullBodyContent } from '@opencrvs/components/lib/layout'
import {
  IDeclaration,
  IPayload,
  SUBMISSION_STATUS,
  writeDeclaration,
  DOWNLOAD_STATUS
} from '@client/declarations'
import { ReviewAction } from '@client/components/form/ReviewActionComponent'
import {
  BirthSection,
  CHECKBOX_GROUP,
  DATE,
  Event,
  FETCH_BUTTON,
  FIELD_WITH_DYNAMIC_DEFINITIONS,
  ICheckboxGroupFormField,
  IDynamicOptions,
  IFileValue,
  IForm,
  IFormData,
  IFormField,
  IFormFieldValue,
  IFormSection,
  IFormSectionData,
  IFormSectionGroup,
  IPreviewGroup,
  IRadioOption,
  ISelectOption,
  LIST,
  PARAGRAPH,
  RADIO_GROUP,
  RADIO_GROUP_WITH_NESTED_FIELDS,
  Section,
  SELECT_WITH_DYNAMIC_OPTIONS,
  SELECT_WITH_OPTIONS,
  SUBSECTION,
  TEXTAREA,
  WARNING,
  REVIEW_OVERRIDE_POSITION,
  DOCUMENT_UPLOADER_WITH_OPTION,
  IDocumentUploaderWithOptionsFormField,
  LOCATION_SEARCH_INPUT,
  IAttachmentValue
} from '@client/forms'
import {
  getBirthSection,
  getRegisterForm
} from '@client/forms/register/declaration-selectors'
import {
  birthSectionMapping,
  birthSectionTitle
} from '@client/forms/register/fieldMappings/birth/mutation/documents-mappings'
import {
  deathSectionMapping,
  deathSectionTitle
} from '@client/forms/register/fieldMappings/death/mutation/documents-mappings'
import {
  getConditionalActionsForField,
  getSectionFields,
  getVisibleSectionGroupsBasedOnConditions,
  getListOfLocations
} from '@client/forms/utils'
import {
  Errors,
  getValidationErrorsForForm,
  IFieldErrors
} from '@client/forms/validation'
import { buttonMessages } from '@client/i18n/messages'
import { messages } from '@client/i18n/messages/views/review'
import { getLanguage } from '@client/i18n/selectors'
import { getDefaultLanguage } from '@client/i18n/utils'
import { goToPageGroup } from '@client/navigation'
import {
  ILocation,
  IOfflineData,
  OFFLINE_FACILITIES_KEY,
  OFFLINE_LOCATIONS_KEY
} from '@client/offline/reducer'
import { getOfflineData } from '@client/offline/selectors'
import { getScope } from '@client/profile/profileSelectors'
import { IStoreState } from '@client/store'
import styled from '@client/styledComponents'
import { Scope } from '@client/utils/authUtils'
import { isMobileDevice } from '@client/utils/commonUtils'
import { REJECTED } from '@client/utils/constants'
import { formatLongDate } from '@client/utils/date-formatting'
import { getDraftInformantFullName } from '@client/utils/draftUtils'
import { flatten, isArray, flattenDeep, get, clone } from 'lodash'
import * as React from 'react'
import { findDOMNode } from 'react-dom'
import {
  injectIntl,
  IntlShape,
  MessageDescriptor,
  WrappedComponentProps as IntlShapeProps
} from 'react-intl'
import { connect } from 'react-redux'
import { ReviewHeader } from './ReviewHeader'
import { IValidationResult } from '@client/utils/validate'
import { DocumentListPreview } from '@client/components/form/DocumentUploadfield/DocumentListPreview'
import { DocumentPreview } from '@client/components/form/DocumentUploadfield/DocumentPreview'
import { generateLocations } from '@client/utils/locationUtils'
import { isCorrection } from '@client/views/CorrectionForm/utils'
import {
  ListViewSimplified,
  ListViewItemSimplified
} from '@opencrvs/components/lib/interface/ListViewSimplified/ListViewSimplified'

const Deleted = styled.del`
  color: ${({ theme }) => theme.colors.negative};
`
const RequiredField = styled.span`
  color: ${({ theme }) => theme.colors.negative};
  display: inline-block;
  text-transform: lowercase;
  &::first-letter {
    text-transform: uppercase;
  }
`
const Row = styled.div`
  display: flex;
  flex: 1;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    flex-direction: column;
  }
`
const RightColumn = styled.div`
  width: 40%;
  border-radius: 4px;
  margin-left: 24px;

  &:first-child {
    margin-left: 0px;
  }
  &:last-child {
    margin-right: -24px;
  }

  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    display: none;
  }
`

const LeftColumn = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey300};
  width: 60%;
  margin-bottom: 200px;

  &:first-child {
    margin-left: 0px;
  }
  &:last-child {
    margin-right: 0px;
  }

  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    width: 100%;
    margin-bottom: 0px;
  }
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    border: 0;
  }
`

const ZeroDocument = styled.div`
  ${({ theme }) => theme.fonts.reg18};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

const ResponsiveDocumentViewer = styled.div<{ isRegisterScope: boolean }>`
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    display: ${({ isRegisterScope }) => (isRegisterScope ? 'block' : 'none')};
    margin-bottom: 11px;
  }
`

const FooterArea = styled.div`
  padding-top: 20px;
`

const FormData = styled.div`
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.copy};
  padding: 32px;
  border-radius: 4px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    padding: 24px;
  }
`
const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  ${({ theme }) => theme.fonts.h3};
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey200};
`
const Label = styled.span`
  ${({ theme }) => theme.fonts.bold16};
`
const Value = styled.span`
  ${({ theme }) => theme.fonts.reg16}
`
const SectionContainer = styled.div`
  margin-bottom: 40px;
`

const DocumentListPreviewContainer = styled.div`
  display: none;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    display: block;
  }
`

const InputWrapper = styled.div`
  margin-top: 56px;
`
type onChangeReviewForm = (
  sectionData: IFormSectionData,
  activeSection: IFormSection,
  declaration: IDeclaration
) => void
interface IProps {
  draft: IDeclaration
  registerForm: { [key: string]: IForm }
  pageRoute: string
  rejectDeclarationClickEvent?: () => void
  goToPageGroup: typeof goToPageGroup
  submitClickEvent: (
    declaration: IDeclaration,
    submissionStatus: string,
    action: string,
    payload?: IPayload,
    downloadStatus?: DOWNLOAD_STATUS
  ) => void
  scope: Scope | null
  offlineCountryConfiguration: IOfflineData
  language: string
  onChangeReviewForm?: onChangeReviewForm
  onContinue?: () => void
  writeDeclaration: typeof writeDeclaration
  registrationSection: IFormSection
  documentsSection: IFormSection
}
type State = {
  displayEditDialog: boolean
  editClickedSectionId: string
  editClickedSectionGroupId: string
  editClickFieldName: string
  activeSection: Section | null
  previewImage: IFileValue | null
}

interface IErrorsBySection {
  [sectionId: string]: Errors
}

type FullProps = IProps & IntlShapeProps

function renderSelectOrRadioLabel(
  value: IFormFieldValue,
  options: Array<ISelectOption | IRadioOption>,
  intl: IntlShape
) {
  const option = options.find((option) => option.value === value)
  return option ? intl.formatMessage(option.label) : value
}

export function renderSelectDynamicLabel(
  value: IFormFieldValue,
  options: IDynamicOptions,
  draftData: IFormSectionData,
  intl: IntlShape,
  offlineCountryConfig: IOfflineData,
  language: string
) {
  if (!options.resource) {
    const dependency = options.dependency
      ? draftData[options.dependency]
      : false
    const selectedOption = dependency
      ? options.options &&
        options.options[dependency.toString()].find(
          (option) => option.value === value
        )
      : false
    return selectedOption ? intl.formatMessage(selectedOption.label) : value
  } else {
    if (options.resource) {
      let selectedLocation: ILocation
      const locationId = value as string
      if (options.resource === 'locations') {
        selectedLocation =
          offlineCountryConfig[OFFLINE_LOCATIONS_KEY][locationId]
      } else {
        selectedLocation =
          offlineCountryConfig[OFFLINE_FACILITIES_KEY][locationId]
      }

      if (selectedLocation) {
        if (language !== getDefaultLanguage()) {
          return selectedLocation.alias
        } else {
          return selectedLocation.name
        }
      } else {
        return false
      }
    } else {
      return false
    }
  }
}

const getCheckBoxGroupFieldValue = (
  field: ICheckboxGroupFormField,
  value: string[],
  intl: IntlShape
) => {
  const option = field.options.find((option) => {
    return value.length > 0 && option.value === value[0]
  })
  if (option) {
    return intl.formatMessage(option.label)
  }
  return ''
}

const getFormFieldValue = (
  draftData: IFormData,
  sectionId: string,
  field: IFormField
): IFormFieldValue => {
  const sectionDraftData = draftData[sectionId] || {}
  if (field.name in sectionDraftData) {
    return sectionDraftData[field.name]
  }

  let tempField: IFormField
  for (const key in sectionDraftData) {
    tempField = sectionDraftData[key] as IFormField
    return (tempField &&
      tempField.nestedFields &&
      tempField.nestedFields[field.name]) as IFormFieldValue
  }
  return ''
}

const renderValue = (
  draftData: IFormData,
  sectionId: string,
  field: IFormField,
  intl: IntlShape,
  offlineCountryConfiguration: IOfflineData,
  language: string
) => {
  const value: IFormFieldValue = getFormFieldValue(draftData, sectionId, field)
  if (field.type === SELECT_WITH_OPTIONS && field.options) {
    return renderSelectOrRadioLabel(value, field.options, intl)
  }
  if (field.type === SELECT_WITH_DYNAMIC_OPTIONS && field.dynamicOptions) {
    const sectionData = draftData[sectionId]
    return renderSelectDynamicLabel(
      value,
      field.dynamicOptions,
      sectionData,
      intl,
      offlineCountryConfiguration,
      language
    )
  }

  if (
    (field.type === DATE ||
      (field.type === FIELD_WITH_DYNAMIC_DEFINITIONS &&
        field.dynamicDefinitions.type &&
        field.dynamicDefinitions.type.kind === 'static' &&
        field.dynamicDefinitions.type.staticType === DATE)) &&
    value &&
    typeof value === 'string'
  ) {
    return formatLongDate(value)
  }

  if (field.hideValueInPreview) {
    return ''
  }

  if (field.type === RADIO_GROUP) {
    return renderSelectOrRadioLabel(value, field.options, intl)
  }

  if (field.type === RADIO_GROUP_WITH_NESTED_FIELDS) {
    return renderSelectOrRadioLabel(
      (value && (value as IFormSectionData).value) || '',
      field.options,
      intl
    )
  }

  if (value && field.type === CHECKBOX_GROUP) {
    return getCheckBoxGroupFieldValue(field, value as string[], intl)
  }

  if (value && field.type === LOCATION_SEARCH_INPUT) {
    const searchableListOfLocations = generateLocations(
      getListOfLocations(offlineCountryConfiguration, field.searchableResource),
      intl
    )
    const selectedLocation = searchableListOfLocations.find(
      (location) => location.id === value
    )
    return (selectedLocation && selectedLocation.displayLabel) || ''
  }

  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'boolean') {
    return value
      ? intl.formatMessage(buttonMessages.yes)
      : intl.formatMessage(buttonMessages.no)
  }
  return value
}

const getErrorsOnFieldsBySection = (
  formSections: IFormSection[],
  offlineCountryConfig: IOfflineData,
  draft: IDeclaration
): IErrorsBySection => {
  return formSections.reduce((sections, section: IFormSection) => {
    const fields: IFormField[] = getSectionFields(
      section,
      draft.data[section.id],
      draft.data
    )

    const errors = getValidationErrorsForForm(
      fields,
      draft.data[section.id] || {},
      offlineCountryConfig,
      draft.data
    )

    return {
      ...sections,
      [section.id]: fields.reduce((fields, field) => {
        // REFACTOR
        const validationErrors: IFieldErrors = errors[
          field.name as keyof typeof errors
        ] as IFieldErrors

        const value = draft.data[section.id]
          ? draft.data[section.id][field.name]
          : null

        const informationMissing =
          validationErrors.errors.length > 0 ||
          value === null ||
          Object.values(validationErrors.nestedFields).some(
            (nestedErrors) => nestedErrors.length > 0
          )
            ? validationErrors
            : { errors: [], nestedFields: {} }

        return { ...fields, [field.name]: informationMissing }
      }, {})
    }
  }, {})
}

const SECTION_MAPPING = {
  [Event.BIRTH]: birthSectionMapping,
  [Event.DEATH]: deathSectionMapping
}
const SECTION_TITLE = {
  [Event.BIRTH]: birthSectionTitle,
  [Event.DEATH]: deathSectionTitle
}

class ReviewSectionComp extends React.Component<FullProps, State> {
  hasChangesBeenMade = false

  constructor(props: FullProps) {
    super(props)

    this.state = {
      displayEditDialog: false,
      editClickedSectionGroupId: '',
      editClickFieldName: '',
      editClickedSectionId: '',
      activeSection: null,
      previewImage: null
    }
  }

  componentWillUpdate() {
    this.hasChangesBeenMade = false
  }

  componentDidMount() {
    !isMobileDevice() && window.addEventListener('scroll', this.onScroll)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll)
  }

  getVisibleSections = (formSections: IFormSection[]) => {
    const { draft } = this.props
    return formSections.filter(
      (section) =>
        getVisibleSectionGroupsBasedOnConditions(
          section,
          draft.data[section.id] || {},
          draft.data
        ).length > 0
    )
  }

  getViewableSection = (registerForm: IForm): IFormSection[] => {
    const sections = registerForm.sections.filter(
      ({ id, viewType }) =>
        id !== 'documents' && (viewType === 'form' || viewType === 'hidden')
    )

    return this.getVisibleSections(sections)
  }

  getDocumentSections = (registerForm: IForm): IFormSection[] => {
    const sections = registerForm.sections.filter(
      ({ hasDocumentSection }) => hasDocumentSection
    )

    return this.getVisibleSections(sections)
  }

  docSections = this.getDocumentSections(
    this.props.registerForm[this.props.draft.event]
  )

  onScroll = () => {
    const scrollY = window.scrollY + window.innerHeight / 2
    let minDistance = 100000
    let sectionYTop = 0
    let sectionYBottom = 0
    let distance = 0
    let sectionElement: HTMLElement
    let activeSection = this.state.activeSection

    const node = findDOMNode(this) as HTMLElement

    this.docSections.forEach((section: IFormSection) => {
      sectionElement = node.querySelector(
        '#Section_' + section.id
      ) as HTMLElement
      sectionYTop = sectionElement.offsetTop
      sectionYBottom = sectionElement.offsetTop + sectionElement.offsetHeight

      distance = Math.abs(sectionYTop - scrollY)
      if (distance < minDistance) {
        minDistance = distance
        activeSection = section.id
      }

      distance = Math.abs(sectionYBottom - scrollY)
      if (distance < minDistance) {
        minDistance = distance
        activeSection = section.id
      }
    })
    this.setState({
      activeSection
    })
  }

  getLabelForDocType = (docForWhom: string, docType: string) => {
    const { intl } = this.props
    const documentSection = this.props.registerForm[
      this.props.draft.event
    ].sections.find((section) => section.id === 'documents')
    const docSectionFields = documentSection && documentSection.groups[0].fields
    const docFieldsWithOptions =
      docSectionFields &&
      (docSectionFields.filter(
        (field) =>
          field.extraValue && field.type === DOCUMENT_UPLOADER_WITH_OPTION
      ) as IDocumentUploaderWithOptionsFormField[])
    const allOptionsForPerson: ISelectOption[][] = []
    if (docFieldsWithOptions) {
      for (let i = 0; i < docFieldsWithOptions.length; i++) {
        allOptionsForPerson.push(docFieldsWithOptions[i].options)
      }
    }
    const matchedOption = allOptionsForPerson
      .flat()
      .find((option) => option.value === docType)
    return matchedOption && intl.formatMessage(matchedOption.label)
  }
  prepSectionDocuments = (
    draft: IDeclaration,
    activeSection: Section
  ): IDocumentViewerOptions & { uploadedDocuments: IFileValue[] } => {
    const { documentsSection, intl } = this.props

    const draftItemName = documentsSection.id
    const documentOptions: SelectComponentOptions[] = []
    const selectOptions: SelectComponentOptions[] = []

    let uploadedDocuments: IFileValue[] = []

    for (const index in draft.data[draftItemName]) {
      if (isArray(draft.data[draftItemName][index])) {
        const newDocuments = draft.data[draftItemName][
          index
        ] as unknown as IFileValue[]
        uploadedDocuments = uploadedDocuments.concat(newDocuments)
      }
    }

    uploadedDocuments = uploadedDocuments.filter((document) => {
      const sectionMapping = SECTION_MAPPING[draft.event]
      const sectionTitle = SECTION_TITLE[draft.event]

      const allowedDocumentType: string[] =
        sectionMapping[activeSection as keyof typeof sectionMapping] || []

      if (
        allowedDocumentType.indexOf(document.optionValues[0]!.toString()) > -1
      ) {
        const title: string =
          sectionTitle[activeSection as keyof typeof sectionMapping]
        const label =
          intl.formatMessage(messages.documentForWhom, {
            section: title.toLowerCase()
          }) +
          ' ' +
          (this.getLabelForDocType(title, document.optionValues[1] as string) ||
            document.optionValues[1])

        documentOptions.push({
          value: document.data,
          label
        })
        selectOptions.push({
          value: label,
          label
        })
        return true
      }
      return false
    })

    return {
      selectOptions,
      documentOptions,
      uploadedDocuments
    }
  }

  toggleDisplayDialog = () => {
    this.setState((prevState) => ({
      displayEditDialog: !prevState.displayEditDialog
    }))
  }

  editLinkClickHandler = (
    sectionId: string,
    sectionGroupId: string,
    fieldName: string
  ) => {
    this.setState(() => ({
      editClickedSectionId: sectionId,
      editClickedSectionGroupId: sectionGroupId,
      editClickFieldName: fieldName
    }))
    this.toggleDisplayDialog()
  }

  editLinkClickHandlerForDraft = (
    sectionId: string,
    groupId: string,
    fieldName?: string
  ) => {
    const { draft, pageRoute, writeDeclaration, goToPageGroup } = this.props
    const declaration = draft
    declaration.review = true
    writeDeclaration(declaration)
    goToPageGroup(
      pageRoute,
      declaration.id,
      sectionId,
      groupId,
      declaration.event.toLowerCase(),
      fieldName
    )
  }

  replaceHandler(sectionId: string, groupId: string) {
    const { draft, pageRoute, writeDeclaration, goToPageGroup } = this.props
    const declaration = draft
    declaration.data[sectionId] = {}
    writeDeclaration(declaration)
    goToPageGroup(
      pageRoute,
      declaration.id,
      sectionId,
      groupId,
      declaration.event.toLowerCase()
    )
  }

  userHasRegisterScope() {
    if (this.props.scope) {
      return this.props.scope && this.props.scope.includes('register')
    } else {
      return false
    }
  }

  userHasValidateScope() {
    if (this.props.scope) {
      return this.props.scope && this.props.scope.includes('validate')
    } else {
      return false
    }
  }

  isVisibleField(field: IFormField, section: IFormSection) {
    const { draft, offlineCountryConfiguration } = this.props
    const conditionalActions = getConditionalActionsForField(
      field,
      draft.data[section.id] || {},
      offlineCountryConfiguration,
      draft.data
    )
    return (
      !conditionalActions.includes('hide') &&
      !conditionalActions.includes('disable')
    )
  }

  isViewOnly(field: IFormField) {
    return [LIST, PARAGRAPH, WARNING, SUBSECTION, FETCH_BUTTON].find(
      (type) => type === field.type
    )
  }

  isDraft() {
    return this.props.draft.submissionStatus === SUBMISSION_STATUS.DRAFT
  }

  getFieldValueWithErrorMessage(
    section: IFormSection,
    field: IFormField,
    errorsOnField: any
  ) {
    return (
      <RequiredField id={`required_label_${section.id}_${field.name}`}>
        {field.ignoreFieldLabelOnErrorMessage ||
          (field.previewGroup &&
            this.props.intl.formatMessage(field.label) + ' ')}
        {this.props.intl.formatMessage(
          errorsOnField.message,
          errorsOnField.props
        )}
      </RequiredField>
    )
  }

  getRenderableField(
    section: IFormSection,
    group: IFormSectionGroup,
    fieldLabel: MessageDescriptor,
    fieldName: string,
    value: IFormFieldValue | JSX.Element | undefined,
    ignoreAction = false
  ) {
    const { draft: declaration, intl } = this.props

    return {
      label: intl.formatMessage(fieldLabel),
      value,
      action: !ignoreAction && {
        id: `btn_change_${section.id}_${fieldName}`,
        label: intl.formatMessage(buttonMessages.change),
        handler: () => {
          if (this.isDraft() || isCorrection(declaration)) {
            this.editLinkClickHandlerForDraft(section.id, group.id, fieldName)
          } else {
            this.editLinkClickHandler(section.id, group.id, fieldName)
          }
        }
      }
    }
  }

  getErrorForNestedField(
    section: IFormSection,
    field: IFormField,
    sectionErrors: IErrorsBySection
  ): IValidationResult[] {
    for (const key in sectionErrors[section.id]) {
      return sectionErrors[section.id][key].nestedFields[field.name] || []
    }
    return []
  }

  getValueOrError = (
    section: IFormSection,
    data: IFormData,
    field: IFormField,
    sectionErrors: IErrorsBySection,
    ignoreNestedFieldWrapping?: boolean,
    replaceEmpty?: boolean
  ) => {
    const { intl, offlineCountryConfiguration, language } = this.props

    let value = renderValue(
      data,
      section.id,
      field,
      intl,
      offlineCountryConfiguration,
      language
    )

    if (replaceEmpty && !value) {
      value = '-'
    }
    const errorsOnField =
      get(sectionErrors[section.id][field.name], 'errors') ||
      this.getErrorForNestedField(section, field, sectionErrors)

    return errorsOnField.length > 0
      ? this.getFieldValueWithErrorMessage(section, field, errorsOnField[0])
      : field.nestedFields && !Boolean(ignoreNestedFieldWrapping)
      ? (
          (data[section.id] &&
            data[section.id][field.name] &&
            (data[section.id][field.name] as IFormSectionData).value &&
            field.nestedFields[
              (data[section.id][field.name] as IFormSectionData).value as string
            ]) ||
          []
        ).reduce((groupedValues, nestedField) => {
          const errorsOnNestedField =
            sectionErrors[section.id][field.name].nestedFields[
              nestedField.name
            ] || []
          // Value of the parentField resembles with IFormData as a nested form
          const nestedValue =
            (data[section.id] &&
              data[section.id][field.name] &&
              renderValue(
                data[section.id][field.name] as IFormData,
                'nestedFields',
                nestedField,
                intl,
                offlineCountryConfiguration,
                language
              )) ||
            ''
          return (
            <>
              {groupedValues}
              {(errorsOnNestedField.length > 0 || nestedValue) && <br />}
              {errorsOnNestedField.length > 0
                ? this.getFieldValueWithErrorMessage(
                    section,
                    field,
                    errorsOnNestedField[0]
                  )
                : nestedValue}
            </>
          )
        }, <>{value}</>)
      : value
  }

  getNestedFieldValueOrError = (
    section: IFormSection,
    nestSectionData: IFormData,
    nestedField: IFormField,
    parentFieldErrors: IFieldErrors
  ) => {
    const { intl, offlineCountryConfiguration, language } = this.props
    const errorsOnNestedField =
      parentFieldErrors.nestedFields[nestedField.name] || []

    return (
      <>
        {errorsOnNestedField.length > 0
          ? this.getFieldValueWithErrorMessage(
              section,
              nestedField,
              errorsOnNestedField[0]
            )
          : renderValue(
              nestSectionData,
              'nestedFields',
              nestedField,
              intl,
              offlineCountryConfiguration,
              language
            )}
      </>
    )
  }

  getPreviewGroupsField(
    section: IFormSection,
    group: IFormSectionGroup,
    field: IFormField,
    visitedTags: string[],
    errorsOnFields: IErrorsBySection,
    data: IFormSectionData,
    originalData?: IFormSectionData
  ) {
    const { draft } = this.props

    if (field.previewGroup && !visitedTags.includes(field.previewGroup)) {
      visitedTags.push(field.previewGroup)

      const baseTag = field.previewGroup
      const taggedFields: IFormField[] = []
      group.fields.forEach((field) => {
        if (this.isVisibleField(field, section) && !this.isViewOnly(field)) {
          if (field.previewGroup === baseTag) {
            taggedFields.push(field)
          }
          for (const index in field.nestedFields) {
            field.nestedFields[index].forEach((tempField) => {
              if (
                this.isVisibleField(tempField, section) &&
                !this.isViewOnly(tempField) &&
                tempField.previewGroup === baseTag
              ) {
                taggedFields.push(tempField)
              }
            })
          }
        }
      })

      const tagDef =
        (group.previewGroups &&
          (group.previewGroups.filter(
            (previewGroup) => previewGroup.id === baseTag
          ) as IPreviewGroup[])) ||
        []
      const values = taggedFields
        .map((field) =>
          this.getValueOrError(section, draft.data, field, errorsOnFields)
        )
        .filter((value) => value)

      let completeValue = values[0]
      values.shift()
      values.forEach(
        (value) =>
          (completeValue = (
            <>
              {completeValue}
              {tagDef[0].delimiter ? (
                <span>{tagDef[0].delimiter}</span>
              ) : (
                <br />
              )}
              {value}
            </>
          ))
      )

      const hasErrors = taggedFields.reduce(
        (accum, field) =>
          accum || this.fieldHasErrors(section, field, errorsOnFields),
        false
      )

      const hasAnyFieldChanged = taggedFields.reduce(
        (accum, field) =>
          accum || this.hasFieldChanged(field, data, originalData),
        false
      )
      const draftOriginalData = draft.originalData
      if (draftOriginalData && hasAnyFieldChanged && !hasErrors) {
        const previousValues = taggedFields
          .map((field, index) =>
            this.getValueOrError(
              section,
              draftOriginalData,
              field,
              errorsOnFields,
              undefined,
              !!index
            )
          )
          .filter((value) => value)
        let previousCompleteValue = <Deleted>{previousValues[0]}</Deleted>
        previousValues.shift()
        previousValues.forEach(
          (previousValue) =>
            (previousCompleteValue = (
              <>
                {previousCompleteValue}
                {tagDef[0].delimiter ? (
                  <span>{tagDef[0].delimiter}</span>
                ) : (
                  <br />
                )}
                <Deleted>{previousValue}</Deleted>
              </>
            ))
        )

        completeValue = (
          <>
            {previousCompleteValue}
            <br />
            {completeValue}
          </>
        )
      }

      return this.getRenderableField(
        section,
        group,
        (tagDef[0] && tagDef[0].label) || field.label,
        (tagDef[0] && tagDef[0].fieldToRedirect) || field.name,
        completeValue,
        field.readonly
      )
    }
  }

  hasNestedDataChanged(
    nestedFieldData: IFormData,
    previousNestedFieldData: IFormData
  ) {
    if (nestedFieldData.value === previousNestedFieldData.value) {
      for (const key in nestedFieldData.nestedFields) {
        if (
          nestedFieldData.nestedFields[key] !==
          previousNestedFieldData.nestedFields[key]
        ) {
          this.hasChangesBeenMade = true
          return true
        }
      }
      return false
    }
    this.hasChangesBeenMade = true
    return true
  }

  fieldHasErrors(
    section: IFormSection,
    field: IFormField,
    sectionErrors: IErrorsBySection
  ) {
    if (
      (
        get(sectionErrors[section.id][field.name], 'errors') ||
        this.getErrorForNestedField(section, field, sectionErrors)
      ).length > 0
    ) {
      return true
    }
    return false
  }

  hasFieldChanged(
    field: IFormField,
    data: IFormSectionData,
    originalData?: IFormSectionData
  ) {
    if (!originalData) return false
    if (data[field.name] && (data[field.name] as IFormData).value) {
      return this.hasNestedDataChanged(
        data[field.name] as IFormData,
        originalData[field.name] as IFormData
      )
    }
    /*
     * data section might have some values as empty string
     * whereas original data section have them as undefined
     */
    if (!originalData[field.name] && data[field.name] === '') {
      return false
    }
    const hasChanged = data[field.name] !== originalData[field.name]
    this.hasChangesBeenMade = this.hasChangesBeenMade || hasChanged
    return hasChanged
  }

  getSinglePreviewField(
    section: IFormSection,
    group: IFormSectionGroup,
    field: IFormField,
    sectionErrors: IErrorsBySection,
    ignoreNestedFieldWrapping?: boolean
  ) {
    const {
      draft: { data, originalData }
    } = this.props

    let value = this.getValueOrError(
      section,
      data,
      field,
      sectionErrors,
      ignoreNestedFieldWrapping
    )

    if (
      originalData &&
      this.hasFieldChanged(field, data[section.id], originalData[section.id]) &&
      !this.fieldHasErrors(section, field, sectionErrors)
    ) {
      value = (
        <>
          <Deleted>
            {this.getValueOrError(
              section,
              originalData,
              field,
              sectionErrors,
              ignoreNestedFieldWrapping,
              true
            )}
          </Deleted>
          <br />
          {value}
        </>
      )
    }

    return this.getRenderableField(
      section,
      group,
      field.label,
      field.name,
      value,
      field.readonly
    )
  }

  getNestedPreviewField(
    section: IFormSection,
    group: IFormSectionGroup,
    field: IFormField,
    sectionErrors: IErrorsBySection
  ) {
    const { draft } = this.props
    const visitedTags: string[] = []
    const nestedItems: any[] = []
    // parent field
    nestedItems.push(
      this.getSinglePreviewField(section, group, field, sectionErrors, true)
    )
    ;(
      (field.nestedFields &&
        draft.data[section.id] &&
        draft.data[section.id][field.name] &&
        (draft.data[section.id][field.name] as IFormSectionData).value &&
        field.nestedFields[
          (draft.data[section.id][field.name] as IFormSectionData)
            .value as string
        ]) ||
      []
    ).forEach((nestedField) => {
      if (nestedField.previewGroup) {
        nestedItems.push(
          this.getPreviewGroupsField(
            section,
            group,
            nestedField,
            visitedTags,
            sectionErrors,
            (draft.data[section.id][field.name] as IFormData).nestedFields,
            (draft.originalData &&
              (draft.originalData[section.id][field.name] as IFormData)
                .nestedFields) ||
              undefined
          )
        )
      } else {
        nestedItems.push(
          this.getRenderableField(
            section,
            group,
            nestedField.label,
            nestedField.name,
            this.getNestedFieldValueOrError(
              section,
              draft.data[section.id][field.name] as IFormData,
              nestedField,
              sectionErrors[section.id][field.name]
            ),
            nestedField.readonly
          )
        )
      }
    })
    return nestedItems
  }

  getOverriddenFieldsListForPreview(
    formSections: IFormSection[]
  ): IFormField[] {
    const overriddenFields = formSections
      .map((section) => {
        return section.groups
          .map((group) => {
            return group.fields
              .map((field) => {
                const { draft, offlineCountryConfiguration } = this.props
                const tempField = clone(field)
                const residingSection =
                  get(field.reviewOverrides, 'residingSection') || ''
                tempField.conditionals =
                  get(field.reviewOverrides, 'conditionals') ||
                  field.conditionals ||
                  []

                const isVisible = !getConditionalActionsForField(
                  tempField,
                  draft.data[residingSection] || {},
                  offlineCountryConfiguration,
                  draft.data
                ).includes('hide')

                return isVisible ? field : ({} as IFormField)
              })
              .filter((field) => !Boolean(field.hideInPreview))
              .filter((field) => Boolean(field.reviewOverrides))
              .filter((field) => this.isVisibleField(field, section))
          })
          .filter((item) => item.length)
      })
      .filter((item) => item.length)
    return flattenDeep(overriddenFields)
  }

  getOverRiddenPreviewField(
    section: IFormSection,
    group: IFormSectionGroup,
    overriddenField: IFormField,
    sectionErrors: IErrorsBySection,
    field: IFormField,
    items: any[],
    item: any
  ) {
    overriddenField.label =
      get(overriddenField, 'reviewOverrides.labelAs') || overriddenField.label
    const residingSectionId = get(
      overriddenField,
      'reviewOverrides.residingSection'
    )
    const residingSection = this.props.registerForm.death.sections.find(
      (section) => section.id === residingSectionId
    ) as IFormSection

    const result = this.getSinglePreviewField(
      residingSection,
      group,
      overriddenField,
      sectionErrors
    )

    const { sectionID, groupID, fieldName } =
      overriddenField!.reviewOverrides!.reference
    if (
      sectionID === section.id &&
      groupID === group.id &&
      fieldName === field.name
    ) {
      if (
        overriddenField!.reviewOverrides!.position ===
        REVIEW_OVERRIDE_POSITION.BEFORE
      ) {
        items = items.concat(result)
        items = items.concat(item)
      } else {
        items = items.concat(item)
        items = items.concat(result)
      }
      return items
    }

    items = items.concat(item)
    return items
  }

  selectForPreview = (previewImage: IFileValue | IAttachmentValue) => {
    this.setState({ previewImage: previewImage as IFileValue })
  }

  closePreviewSection = (callBack?: () => void) => {
    if (typeof callBack === 'function') {
      this.setState({ previewImage: null }, callBack)
    } else {
      this.setState({ previewImage: null })
    }
  }

  removeAttachmentFromDraft = (file: IFileValue | IAttachmentValue) => {
    const { documentsSection, draft, onChangeReviewForm } = this.props
    if (onChangeReviewForm) {
      const documentsSectionAllFields = flatten(
        documentsSection.groups.map((group) => group.fields)
      ).filter(
        (field) =>
          field.extraValue && field.type === DOCUMENT_UPLOADER_WITH_OPTION
      )

      const fieldToUpdate = (
        documentsSectionAllFields.find(
          (field) => field.extraValue === (file as IFileValue).optionValues[0]
        ) as IDocumentUploaderWithOptionsFormField
      ).name

      const updatedValue = (
        draft.data[documentsSection.id][fieldToUpdate] as IFileValue[]
      ).filter(
        (eachFile) =>
          eachFile.optionValues[1] !== (file as IFileValue).optionValues[1]
      )

      onChangeReviewForm(
        { [fieldToUpdate]: updatedValue },
        documentsSection,
        draft
      )
    }
  }

  onDelete = (file: IFileValue | IAttachmentValue) => {
    this.closePreviewSection(() => this.removeAttachmentFromDraft(file))
  }

  shouldShowChangeAll = (section: IFormSection) => {
    const {
      draft: { data, event }
    } = this.props
    return (
      event === Event.BIRTH &&
      ((section.id === BirthSection.Mother && !!data.mother?.detailsExist) ||
        (section.id === BirthSection.Father && !!data.father?.detailsExist))
    )
  }

  transformSectionData = (
    formSections: IFormSection[],
    errorsOnFields: IErrorsBySection
  ) => {
    const { intl, draft } = this.props
    const overriddenFields =
      this.getOverriddenFieldsListForPreview(formSections)
    let tempItem: any

    return formSections.map((section) => {
      let items: any[] = []
      const visitedTags: string[] = []
      const visibleGroups = getVisibleSectionGroupsBasedOnConditions(
        section,
        draft.data[section.id] || {},
        draft.data
      )
      visibleGroups.forEach((group, index) => {
        group.fields
          .filter(
            (field) =>
              this.isVisibleField(field, section) && !this.isViewOnly(field)
          )
          .filter((field) => !Boolean(field.hideInPreview))
          .filter((field) => !Boolean(field.reviewOverrides))
          .forEach((field) => {
            tempItem = field.previewGroup
              ? this.getPreviewGroupsField(
                  section,
                  group,
                  field,
                  visitedTags,
                  errorsOnFields,
                  draft.data[section.id],
                  (draft.originalData && draft.originalData[section.id]) ||
                    undefined
                )
              : field.nestedFields && field.ignoreNestedFieldWrappingInPreview
              ? this.getNestedPreviewField(
                  section,
                  group,
                  field,
                  errorsOnFields
                )
              : this.getSinglePreviewField(
                  section,
                  group,
                  field,
                  errorsOnFields
                )

            overriddenFields.forEach((overriddenField) => {
              items = this.getOverRiddenPreviewField(
                section,
                group,
                overriddenField as IFormField,
                errorsOnFields,
                field,
                items,
                tempItem
              )
            })

            if (!overriddenFields.length) {
              items = items.concat(tempItem)
            }
          })
      })
      return {
        id: section.id,
        title: intl.formatMessage(section.title),
        items: items.filter((item) => item),
        action: this.shouldShowChangeAll(section)
          ? {
              label: intl.formatMessage(buttonMessages.replace),
              handler: () =>
                this.replaceHandler(section.id, visibleGroups[0].id)
            }
          : undefined
      }
    })
  }

  render() {
    const {
      intl,
      draft: declaration,
      registerForm,
      rejectDeclarationClickEvent,
      submitClickEvent,
      registrationSection,
      documentsSection,
      offlineCountryConfiguration,
      draft: { event },
      onContinue
    } = this.props
    const formSections = this.getViewableSection(registerForm[event])
    const errorsOnFields = getErrorsOnFieldsBySection(
      formSections,
      offlineCountryConfiguration,
      declaration
    )

    const isComplete =
      flatten(Object.values(errorsOnFields).map(Object.values)).filter(
        (errors) => errors.errors.length > 0
      ).length === 0

    const textAreaProps = {
      id: 'additional_comments',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        ;(this.props.onChangeReviewForm as onChangeReviewForm)(
          { commentsOrNotes: e.target.value },
          registrationSection,
          declaration
        )
      },
      value:
        (declaration.data.registration &&
          declaration.data.registration.commentsOrNotes) ||
        '',
      ignoreMediaQuery: true
    }

    const sectionName = this.state.activeSection || this.docSections[0].id
    const informantName = getDraftInformantFullName(declaration, intl.locale)
    const draft = this.isDraft()
    const transformedSectionData = this.transformSectionData(
      formSections,
      errorsOnFields
    )

    return (
      <FullBodyContent>
        <Row>
          <LeftColumn>
            <ReviewHeader
              id="review_header"
              logoSource={offlineCountryConfiguration.config.COUNTRY_LOGO.file}
              title={intl.formatMessage(messages.govtName)}
              subject={
                informantName
                  ? intl.formatMessage(messages.headerSubjectWithName, {
                      eventType: event,
                      name: informantName
                    })
                  : intl.formatMessage(messages.headerSubjectWithoutName, {
                      eventType: event
                    })
              }
            />
            <FormData>
              {transformedSectionData.map((sec, index) => {
                const { uploadedDocuments, selectOptions } =
                  this.prepSectionDocuments(declaration, sec.id)
                return (
                  <SectionContainer key={index}>
                    {sec.title && (
                      <Title>
                        {sec.title}
                        {sec.action && (
                          <LinkButton onClick={sec.action.handler}>
                            {sec.action.label}
                          </LinkButton>
                        )}
                      </Title>
                    )}
                    <DocumentListPreviewContainer>
                      <DocumentListPreview
                        id={sec.id}
                        documents={uploadedDocuments}
                        onSelect={this.selectForPreview}
                        dropdownOptions={selectOptions}
                      />
                    </DocumentListPreviewContainer>
                    <ListViewSimplified id={'Section_' + sec.id}>
                      {sec.items.map((item, index) => {
                        return (
                          <ListViewItemSimplified
                            key={index}
                            label={<Label>{item.label}</Label>}
                            value={
                              <Value id={item.label.split(' ')[0]}>
                                {item.value}
                              </Value>
                            }
                            actions={
                              <LinkButton
                                id={item.action.id}
                                disabled={item.action.disabled}
                                onClick={item.action.handler}
                              >
                                {item.action.label}
                              </LinkButton>
                            }
                          />
                        )
                      })}
                    </ListViewSimplified>
                  </SectionContainer>
                )
              })}
              {event === Event.BIRTH && !isCorrection(declaration) && (
                <InputWrapper>
                  <InputField
                    id="additional_comments"
                    touched={false}
                    required={false}
                    label={intl.formatMessage(messages.additionalComments)}
                  >
                    <TextArea {...textAreaProps} />
                  </InputField>
                </InputWrapper>
              )}
              {!isCorrection(declaration) && (
                <ReviewAction
                  completeDeclaration={isComplete}
                  declarationToBeValidated={this.userHasValidateScope()}
                  declarationToBeRegistered={this.userHasRegisterScope()}
                  alreadyRejectedDeclaration={
                    this.props.draft.registrationStatus === REJECTED
                  }
                  draftDeclaration={draft}
                  declaration={declaration}
                  submitDeclarationAction={submitClickEvent}
                  rejectDeclarationAction={rejectDeclarationClickEvent}
                />
              )}
              {isCorrection(declaration) && (
                <FooterArea>
                  <PrimaryButton
                    id="continue_button"
                    onClick={onContinue}
                    disabled={!isComplete || !this.hasChangesBeenMade}
                  >
                    {intl.formatMessage(buttonMessages.continueButton)}
                  </PrimaryButton>
                </FooterArea>
              )}
            </FormData>
          </LeftColumn>
          <RightColumn>
            <ResponsiveDocumentViewer
              isRegisterScope={this.userHasRegisterScope()}
            >
              <DocumentViewer
                id={'document_section_' + this.state.activeSection}
                key={'Document_section_' + this.state.activeSection}
                options={this.prepSectionDocuments(
                  declaration,
                  this.state.activeSection || this.docSections[0].id
                )}
              >
                <ZeroDocument id={`zero_document_${sectionName}`}>
                  {intl.formatMessage(messages.zeroDocumentsText, {
                    section: sectionName
                  })}
                  <LinkButton
                    id="edit-document"
                    disabled={isCorrection(declaration)}
                    onClick={() =>
                      this.editLinkClickHandlerForDraft(
                        documentsSection.id,
                        documentsSection.groups[0].id!
                      )
                    }
                  >
                    {intl.formatMessage(messages.editDocuments)}
                  </LinkButton>
                </ZeroDocument>
              </DocumentViewer>
            </ResponsiveDocumentViewer>
          </RightColumn>
        </Row>
        <ResponsiveModal
          title={intl.formatMessage(messages.editDeclarationConfirmationTitle)}
          contentHeight={96}
          responsive={false}
          actions={[
            <TertiaryButton
              id="cancel-btn"
              key="cancel"
              onClick={this.toggleDisplayDialog}
            >
              {intl.formatMessage(buttonMessages.cancel)}
            </TertiaryButton>,
            <PrimaryButton
              id="edit_confirm"
              key="submit"
              onClick={() => {
                this.editLinkClickHandlerForDraft(
                  this.state.editClickedSectionId!,
                  this.state.editClickedSectionGroupId,
                  this.state.editClickFieldName!
                )
              }}
            >
              {intl.formatMessage(buttonMessages.continueButton)}
            </PrimaryButton>
          ]}
          show={this.state.displayEditDialog}
          handleClose={this.toggleDisplayDialog}
        >
          {intl.formatMessage(messages.editDeclarationConfirmation)}
        </ResponsiveModal>
        {this.state.previewImage && (
          <DocumentPreview
            previewImage={this.state.previewImage}
            title={intl.formatMessage(buttonMessages.preview)}
            goBack={this.closePreviewSection}
            onDelete={this.onDelete}
          />
        )}
      </FullBodyContent>
    )
  }
}

export const ReviewSection = connect(
  (state: IStoreState) => ({
    registerForm: getRegisterForm(state),
    registrationSection: getBirthSection(state, BirthSection.Registration),
    documentsSection: getBirthSection(state, BirthSection.Documents),
    scope: getScope(state),
    offlineCountryConfiguration: getOfflineData(state),
    language: getLanguage(state)
  }),
  { goToPageGroup, writeDeclaration }
)(injectIntl(ReviewSectionComp))
