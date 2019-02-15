import { defineMessages } from 'react-intl'
import { messages as addressMessages } from '../../../address'
import { countries } from '../../../countries'
import {
  messages as identityMessages,
  birthIdentityOptions,
  identityTypeMapper
} from '../../../identity'
import { messages as maritalStatusMessages } from '../../../maritalStatus'
import { messages as educationMessages } from '../../../education'
import { OFFLINE_LOCATIONS_KEY } from 'src/offline/reducer'
import {
  ViewType,
  RADIO_GROUP,
  TEXT,
  NUMBER,
  DATE,
  SUBSECTION,
  SELECT_WITH_OPTIONS,
  SELECT_WITH_DYNAMIC_OPTIONS,
  FIELD_WITH_DYNAMIC_DEFINITIONS
} from 'src/forms'
import {
  bengaliOnlyNameFormat,
  englishOnlyNameFormat,
  dateFormat,
  validIDNumber,
  isValidBirthDate
} from 'src/utils/validate'

export interface IFatherSectionFormData {
  firstName: string
  foo: string
  bar: string
  baz: string
}
import { identityNameMapper } from 'src/forms/identity'
import { IFormSection } from '../../../index'
import { conditionals } from '../../../utils'
import {
  fieldToNameTransformer,
  fieldToArrayTransformer,
  fieldToIdentifierTransformer,
  fieldToAddressTransformer,
  copyAddressTransformer,
  sectionRemoveTransformer,
  fieldNameTransformer
} from 'src/forms/mappings/mutation/field-mappings'

import {
  nameToFieldTransformer,
  fieldValueTransformer,
  arrayToFieldTransformer,
  identifierToFieldTransformer,
  addressToFieldTransformer,
  sameAddressFieldTransformer
} from 'src/forms/mappings/query/field-mappings'
import { emptyFatherSectionTransformer } from './mappings/query/father-mappings'

export const messages = defineMessages({
  fatherTab: {
    id: 'register.form.tabs.fatherTab',
    defaultMessage: 'Father',
    description: 'Tab title for Father'
  },
  fatherTitle: {
    id: 'register.form.section.fatherTitle',
    defaultMessage: "Father's details",
    description: 'Form section title for Father'
  },
  fathersDetailsExist: {
    id: 'formFields.fathersDetailsExist',
    defaultMessage: "Do you have the father's details?",
    description: "Question to ask the user if they have the father's details"
  },
  confirm: {
    id: 'formFields.confirm',
    defaultMessage: 'Yes',
    description: 'confirmation label for yes / no radio button'
  },
  deny: {
    id: 'formFields.deny',
    defaultMessage: 'No',
    description: 'deny label for yes / no radio button'
  },
  nationality: {
    id: 'formFields.father.nationality',
    defaultMessage: 'Nationality',
    description: 'Label for form field: Nationality'
  },
  nationalityBangladesh: {
    id: 'formFields.father.nationalityBangladesh',
    defaultMessage: 'Bangladesh',
    description: 'Option for form field: Nationality'
  },
  fatherFirstNames: {
    id: 'formFields.fatherFirstNames',
    defaultMessage: 'First Name(s) in Bengali',
    description: 'Label for form field: First name'
  },
  fatherFamilyName: {
    id: 'formFields.fatherFamilyName',
    defaultMessage: 'Last Name(s) in Bengali',
    description: 'Label for form field: Family name'
  },
  fatherFirstNamesEng: {
    id: 'formFields.fatherFirstNamesEng',
    defaultMessage: 'First Name(s) in English',
    description: 'Label for form field: First names in english'
  },
  fatherFamilyNameEng: {
    id: 'formFields.fatherFamilyNameEng',
    defaultMessage: 'Last Name(s) in English',
    description: 'Label for form field: Family name in english'
  },
  defaultLabel: {
    id: 'formFields.defaultLabel',
    defaultMessage: 'Label goes here',
    description: 'default label'
  },
  fatherDateOfBirth: {
    id: 'formFields.fatherDateOfBirth',
    defaultMessage: 'Date of birth',
    description: 'Label for form field: Date of birth'
  },
  fatherEducationAttainment: {
    id: 'formFields.fatherEducationAttainment',
    defaultMessage: "Father's level of formal education attained",
    description: 'Label for form field: Father education'
  },
  currentAddress: {
    id: 'formFields.currentAddress',
    defaultMessage: 'Current Address',
    description: 'Title for the current address fields'
  },
  permanentAddress: {
    id: 'formFields.permanentAddress',
    defaultMessage: 'Permanent Address',
    description: 'Title for the permanent address fields'
  },
  optionalLabel: {
    id: 'formFields.optionalLabel',
    defaultMessage: 'Optional',
    description: 'Optional label'
  }
})

export const fatherSection: IFormSection = {
  id: 'father',
  viewType: 'form' as ViewType,
  name: messages.fatherTab,
  title: messages.fatherTitle,
  fields: [
    {
      name: 'fathersDetailsExist',
      type: RADIO_GROUP,
      label: messages.fathersDetailsExist,
      required: true,
      initialValue: true,
      validate: [],
      options: [
        { value: true, label: messages.confirm },
        { value: false, label: messages.deny }
      ],
      mapping: {
        mutation: sectionRemoveTransformer
      }
    },
    {
      name: 'iDType',
      type: SELECT_WITH_OPTIONS,
      label: identityMessages.iDType,
      required: true,
      initialValue: '',
      validate: [],
      options: birthIdentityOptions,
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: fieldToIdentifierTransformer('type'),
        query: identifierToFieldTransformer('type')
      }
    },
    {
      name: 'iDTypeOther',
      type: TEXT,
      label: identityMessages.iDTypeOtherLabel,
      required: true,
      initialValue: '',
      validate: [],
      conditionals: [conditionals.fathersDetailsExist, conditionals.iDType],
      mapping: {
        mutation: fieldToIdentifierTransformer('otherType'),
        query: identifierToFieldTransformer('otherType')
      }
    },
    {
      name: 'iD',
      type: FIELD_WITH_DYNAMIC_DEFINITIONS,
      dynamicDefinitions: {
        label: {
          dependency: 'iDType',
          labelMapper: identityNameMapper
        },
        type: {
          dependency: 'iDType',
          typeMapper: identityTypeMapper
        },
        validate: [
          {
            validator: validIDNumber,
            dependencies: ['iDType']
          }
        ]
      },
      label: identityMessages.iD,
      required: true,
      initialValue: '',
      validate: [],
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: fieldToIdentifierTransformer('id'),
        query: identifierToFieldTransformer('id')
      }
    },
    {
      name: 'nationality',
      type: SELECT_WITH_OPTIONS,
      label: messages.nationality,
      required: false,
      initialValue: 'BGD',
      validate: [],
      options: countries,
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: fieldToArrayTransformer,
        query: arrayToFieldTransformer
      }
    },
    {
      name: 'firstNames',
      type: TEXT,
      label: messages.fatherFirstNames,
      required: false,
      initialValue: '',
      validate: [bengaliOnlyNameFormat],
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: fieldToNameTransformer('bn'),
        query: nameToFieldTransformer('bn')
      }
    },
    {
      name: 'familyName',
      type: TEXT,
      label: messages.fatherFamilyName,
      required: true,
      initialValue: '',
      validate: [bengaliOnlyNameFormat],
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: fieldToNameTransformer('bn'),
        query: nameToFieldTransformer('bn')
      }
    },
    {
      name: 'firstNamesEng',
      type: TEXT,
      label: messages.fatherFirstNamesEng,
      required: false,
      initialValue: '',
      validate: [englishOnlyNameFormat],
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: fieldToNameTransformer('en', 'firstNames'),
        query: nameToFieldTransformer('en', 'firstNames')
      }
    },
    {
      name: 'familyNameEng',
      type: TEXT,
      label: messages.fatherFamilyNameEng,
      required: false,
      initialValue: '',
      validate: [englishOnlyNameFormat],
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: fieldToNameTransformer('en', 'familyName'),
        query: nameToFieldTransformer('en', 'familyName')
      }
    },
    {
      name: 'fatherBirthDate',
      type: DATE,
      label: messages.fatherDateOfBirth,
      required: false,
      initialValue: '',
      validate: [isValidBirthDate],
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: fieldNameTransformer('birthDate'),
        query: fieldValueTransformer('birthDate')
      }
    },
    {
      name: 'maritalStatus',
      type: SELECT_WITH_OPTIONS,
      label: maritalStatusMessages.maritalStatus,
      required: false,
      initialValue: 'MARRIED',
      validate: [],
      options: [
        { value: 'SINGLE', label: maritalStatusMessages.maritalStatusSingle },
        { value: 'MARRIED', label: maritalStatusMessages.maritalStatusMarried },
        { value: 'WIDOWED', label: maritalStatusMessages.maritalStatusWidowed },
        {
          value: 'DIVORCED',
          label: maritalStatusMessages.maritalStatusDivorced
        },
        {
          value: 'NOT_STATED',
          label: maritalStatusMessages.maritalStatusNotStated
        }
      ],
      conditionals: [conditionals.fathersDetailsExist]
    },
    {
      name: 'dateOfMarriage',
      type: DATE,
      label: maritalStatusMessages.dateOfMarriage,
      required: false,
      initialValue: '',
      validate: [dateFormat],
      conditionals: [conditionals.fathersDetailsExist, conditionals.isMarried]
    },
    {
      name: 'educationalAttainment',
      type: SELECT_WITH_OPTIONS,
      label: messages.fatherEducationAttainment,
      required: false,
      initialValue: '',
      validate: [],
      options: [
        {
          value: 'NO_SCHOOLING',
          label: educationMessages.educationAttainmentNone
        },
        {
          value: 'PRIMARY_ISCED_1',
          label: educationMessages.educationAttainmentISCED1
        },
        {
          value: 'LOWER_SECONDARY_ISCED_2',
          label: educationMessages.educationAttainmentISCED2
        },
        {
          value: 'UPPER_SECONDARY_ISCED_3',
          label: educationMessages.educationAttainmentISCED3
        },
        {
          value: 'POST_SECONDARY_ISCED_4',
          label: educationMessages.educationAttainmentISCED4
        },
        {
          value: 'FIRST_STAGE_TERTIARY_ISCED_5',
          label: educationMessages.educationAttainmentISCED5
        },
        {
          value: 'SECOND_STAGE_TERTIARY_ISCED_6',
          label: educationMessages.educationAttainmentISCED6
        },
        {
          value: 'NOT_STATED',
          label: educationMessages.educationAttainmentNotStated
        }
      ],
      conditionals: [conditionals.fathersDetailsExist]
    },
    {
      name: 'addressSameAsMother',
      type: RADIO_GROUP,
      label: addressMessages.addressSameAsMother,
      required: true,
      initialValue: true,
      validate: [],
      options: [
        { value: true, label: addressMessages.confirm },
        { value: false, label: addressMessages.deny }
      ],
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: copyAddressTransformer(
          'CURRENT',
          'mother',
          'CURRENT',
          'father'
        ),
        query: sameAddressFieldTransformer(
          'CURRENT',
          'mother',
          'CURRENT',
          'father'
        )
      }
    },
    {
      name: 'currentAddress',
      type: SUBSECTION,
      label: messages.currentAddress,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.fathersDetailsExist,
        conditionals.addressSameAsMother
      ]
    },
    {
      name: 'country',
      type: SELECT_WITH_OPTIONS,
      label: addressMessages.country,
      required: true,
      initialValue: window.config.COUNTRY.toUpperCase(),
      validate: [],
      options: countries,
      conditionals: [conditionals.addressSameAsMother],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT'),
        query: addressToFieldTransformer('CURRENT')
      }
    },
    {
      name: 'state',
      type: SELECT_WITH_DYNAMIC_OPTIONS,
      label: addressMessages.state,
      required: true,
      initialValue: '',
      validate: [],
      dynamicOptions: {
        resource: OFFLINE_LOCATIONS_KEY,
        dependency: 'country'
      },
      conditionals: [conditionals.country, conditionals.addressSameAsMother],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT'),
        query: addressToFieldTransformer('CURRENT')
      }
    },
    {
      name: 'district',
      type: SELECT_WITH_DYNAMIC_OPTIONS,
      label: addressMessages.district,
      required: true,
      initialValue: '',
      validate: [],
      dynamicOptions: {
        resource: OFFLINE_LOCATIONS_KEY,
        dependency: 'state'
      },
      conditionals: [
        conditionals.country,
        conditionals.state,
        conditionals.addressSameAsMother
      ],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT'),
        query: addressToFieldTransformer('CURRENT')
      }
    },
    {
      name: 'addressLine4',
      type: SELECT_WITH_DYNAMIC_OPTIONS,
      label: addressMessages.addressLine4,
      required: true,
      initialValue: '',
      validate: [],
      dynamicOptions: {
        resource: OFFLINE_LOCATIONS_KEY,
        dependency: 'district'
      },
      conditionals: [
        conditionals.country,
        conditionals.state,
        conditionals.district,
        conditionals.addressSameAsMother
      ],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT', 6),
        query: addressToFieldTransformer('CURRENT', 6)
      }
    },
    {
      name: 'addressLine3',
      type: SELECT_WITH_DYNAMIC_OPTIONS,
      label: addressMessages.addressLine3,
      required: false,
      initialValue: '',
      validate: [],
      dynamicOptions: {
        resource: OFFLINE_LOCATIONS_KEY,
        dependency: 'addressLine4'
      },
      conditionals: [
        conditionals.country,
        conditionals.state,
        conditionals.district,
        conditionals.addressLine4,
        conditionals.addressSameAsMother,
        conditionals.isNotCityLocation
      ],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT', 4),
        query: addressToFieldTransformer('CURRENT', 4)
      }
    },
    {
      name: 'addressLine3CityOption',
      type: TEXT,
      label: addressMessages.addressLine3CityOption,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.country,
        conditionals.state,
        conditionals.district,
        conditionals.addressLine4,
        conditionals.addressSameAsMother,
        conditionals.isCityLocation
      ],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT', 5),
        query: addressToFieldTransformer('CURRENT', 5)
      }
    },
    {
      name: 'addressLine2',
      type: TEXT,
      label: addressMessages.addressLine2,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.country,
        conditionals.state,
        conditionals.district,
        conditionals.addressLine4,
        conditionals.addressLine3,
        conditionals.addressSameAsMother
      ],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT', 3),
        query: addressToFieldTransformer('CURRENT', 3)
      }
    },
    {
      name: 'addressLine1CityOption',
      type: TEXT,
      label: addressMessages.addressLine1,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.country,
        conditionals.state,
        conditionals.district,
        conditionals.addressLine4,
        conditionals.isCityLocation,
        conditionals.addressSameAsMother
      ],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT', 2),
        query: addressToFieldTransformer('CURRENT', 2)
      }
    },
    {
      name: 'postCodeCityOption',
      type: NUMBER,
      label: addressMessages.postCode,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.country,
        conditionals.state,
        conditionals.district,
        conditionals.addressLine4,
        conditionals.addressSameAsMother,
        conditionals.isCityLocation
      ],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT', 0, 'postalCode'),
        query: addressToFieldTransformer('CURRENT', 0, 'postalCode')
      }
    },
    {
      name: 'addressLine1',
      type: TEXT,
      label: addressMessages.addressLine1,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.country,
        conditionals.state,
        conditionals.district,
        conditionals.addressLine4,
        conditionals.addressLine3,
        conditionals.addressSameAsMother
      ],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT', 1),
        query: addressToFieldTransformer('CURRENT', 1)
      }
    },
    {
      name: 'postCode',
      type: NUMBER,
      label: addressMessages.postCode,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.country,
        conditionals.state,
        conditionals.district,
        conditionals.addressLine4,
        conditionals.addressLine3,
        conditionals.addressSameAsMother
      ],
      mapping: {
        mutation: fieldToAddressTransformer('CURRENT', 0, 'postalCode'),
        query: addressToFieldTransformer('CURRENT', 0, 'postalCode')
      }
    },
    {
      name: 'permanentAddressSameAsMother',
      type: RADIO_GROUP,
      label: addressMessages.permanentAddressSameAsMother,
      required: true,
      initialValue: true,
      validate: [],
      options: [
        { value: true, label: messages.confirm },
        { value: false, label: messages.deny }
      ],
      conditionals: [conditionals.fathersDetailsExist],
      mapping: {
        mutation: copyAddressTransformer(
          'PERMANENT',
          'mother',
          'PERMANENT',
          'father'
        ),
        query: sameAddressFieldTransformer(
          'PERMANENT',
          'mother',
          'PERMANENT',
          'father'
        )
      }
    },
    {
      name: 'permanentAddress',
      type: SUBSECTION,
      label: messages.permanentAddress,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.fathersDetailsExist,
        conditionals.permanentAddressSameAsMother
      ]
    },
    {
      name: 'countryPermanent',
      type: SELECT_WITH_OPTIONS,
      label: addressMessages.country,
      required: true,
      initialValue: window.config.COUNTRY.toUpperCase(),
      validate: [],
      options: countries,
      conditionals: [
        conditionals.fathersDetailsExist,
        conditionals.permanentAddressSameAsMother
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 0, 'country'),
        query: addressToFieldTransformer('PERMANENT', 0, 'country')
      }
    },
    {
      name: 'statePermanent',
      type: SELECT_WITH_DYNAMIC_OPTIONS,
      label: addressMessages.state,
      required: true,
      initialValue: '',
      validate: [],
      dynamicOptions: {
        resource: OFFLINE_LOCATIONS_KEY,
        dependency: 'countryPermanent'
      },
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 0, 'state'),
        query: addressToFieldTransformer('PERMANENT', 0, 'state')
      }
    },
    {
      name: 'districtPermanent',
      type: SELECT_WITH_DYNAMIC_OPTIONS,
      label: addressMessages.district,
      required: true,
      initialValue: '',
      validate: [],
      dynamicOptions: {
        resource: OFFLINE_LOCATIONS_KEY,
        dependency: 'statePermanent'
      },
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent,
        conditionals.statePermanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 0, 'district'),
        query: addressToFieldTransformer('PERMANENT', 0, 'district')
      }
    },
    {
      name: 'addressLine4Permanent',
      type: SELECT_WITH_DYNAMIC_OPTIONS,
      label: addressMessages.addressLine4,
      required: true,
      initialValue: '',
      validate: [],
      dynamicOptions: {
        resource: OFFLINE_LOCATIONS_KEY,
        dependency: 'districtPermanent'
      },
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent,
        conditionals.statePermanent,
        conditionals.districtPermanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 6),
        query: addressToFieldTransformer('PERMANENT', 6)
      }
    },
    {
      name: 'addressLine3Permanent',
      type: SELECT_WITH_DYNAMIC_OPTIONS,
      label: addressMessages.addressLine3,
      required: false,
      initialValue: '',
      validate: [],
      dynamicOptions: {
        resource: OFFLINE_LOCATIONS_KEY,
        dependency: 'addressLine4Permanent'
      },
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent,
        conditionals.statePermanent,
        conditionals.districtPermanent,
        conditionals.addressLine4Permanent,
        conditionals.isNotCityLocationPermanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 4),
        query: addressToFieldTransformer('PERMANENT', 4)
      }
    },
    {
      name: 'addressLine3CityOptionPermanent',
      type: TEXT,
      label: addressMessages.addressLine3CityOption,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent,
        conditionals.statePermanent,
        conditionals.districtPermanent,
        conditionals.addressLine4Permanent,
        conditionals.isCityLocationPermanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 5),
        query: addressToFieldTransformer('PERMANENT', 5)
      }
    },
    {
      name: 'addressLine2Permanent',
      type: TEXT,
      label: addressMessages.addressLine2,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent,
        conditionals.statePermanent,
        conditionals.districtPermanent,
        conditionals.addressLine4Permanent,
        conditionals.addressLine3Permanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 3),
        query: addressToFieldTransformer('PERMANENT', 3)
      }
    },
    {
      name: 'addressLine1CityOptionPermanent',
      type: TEXT,
      label: addressMessages.addressLine1,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent,
        conditionals.statePermanent,
        conditionals.districtPermanent,
        conditionals.addressLine4Permanent,
        conditionals.isCityLocationPermanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 2),
        query: addressToFieldTransformer('PERMANENT', 2)
      }
    },
    {
      name: 'postCodeCityOptionPermanent',
      type: NUMBER,
      label: addressMessages.postCode,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent,
        conditionals.statePermanent,
        conditionals.districtPermanent,
        conditionals.addressLine4Permanent,
        conditionals.isCityLocationPermanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 0, 'postalCode'),
        query: addressToFieldTransformer('PERMANENT', 0, 'postalCode')
      }
    },
    {
      name: 'addressLine1Permanent',
      type: TEXT,
      label: addressMessages.addressLine1,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent,
        conditionals.statePermanent,
        conditionals.districtPermanent,
        conditionals.addressLine4Permanent,
        conditionals.addressLine3Permanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 1),
        query: addressToFieldTransformer('PERMANENT', 1)
      }
    },
    {
      name: 'postCodePermanent',
      type: NUMBER,
      label: addressMessages.postCode,
      required: false,
      initialValue: '',
      validate: [],
      conditionals: [
        conditionals.permanentAddressSameAsMother,
        conditionals.countryPermanent,
        conditionals.statePermanent,
        conditionals.districtPermanent,
        conditionals.addressLine4Permanent,
        conditionals.addressLine3Permanent
      ],
      mapping: {
        mutation: fieldToAddressTransformer('PERMANENT', 0, 'postalCode'),
        query: addressToFieldTransformer('PERMANENT', 0, 'postalCode')
      }
    }
  ],
  mapping: {
    query: emptyFatherSectionTransformer
  }
}