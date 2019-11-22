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
import { IntlShape } from 'react-intl'
import {
  IFunctionTransformer,
  TemplateTransformerData,
  TransformerPayload,
  IOfflineAddressPayload
} from '@client/pdfRenderer/transformer/types'
import { getValueFromApplicationDataByKey } from '@client/pdfRenderer/transformer/utils'
import {
  IAvailableCountries,
  ICountry
} from '@client/views/PrintCertificate/utils'
import { isDefaultCountry } from '@client/forms/utils'

type KeyValues = { [key: string]: string }

const getKeyValues = (keys: any, templateData: TemplateTransformerData) =>
  keys &&
  keys.reduce((keyValues: { [key: string]: string }, key: string) => {
    keyValues[key] = getValueFromApplicationDataByKey(
      templateData.application.data,
      // Getting rid of { }
      key.substr(1, key.length - 2)
    )
    return keyValues
  }, {})

const getCountryValue = (
  countryCode: string,
  templateData: TemplateTransformerData
) => {
  return countryCode.toUpperCase() === window.config.COUNTRY.toUpperCase()
    ? countryCode
    : getValueFromApplicationDataByKey(
        templateData.application.data,
        // Getting rid of { }
        countryCode
      )
}

function getCountryMessage(
  optionalData: IAvailableCountries[],
  countryValue: string,
  language: string
) {
  const countries: ICountry[] = optionalData.filter(
    (country: IAvailableCountries) => {
      return country.language === language
    }
  )[0].countries as ICountry[]
  const country = countries.find((country: ICountry) => {
    return country.value === countryValue
  })
  return (country && country.name) || ''
}

function getTransformedAddress(
  keyValues: KeyValues,
  templateData: TemplateTransformerData,
  addressToParse: string,
  addressKey: string,
  addressType: string,
  countryMessage: string,
  countryValue: string,
  language: string
) {
  return Object.keys(keyValues).reduce((value, key) => {
    if (key.includes('country')) {
      // countries are all translated and can be returned for both languages
      return value.replace(new RegExp(`${key}`, 'g'), countryMessage || '')
    } else if (!isDefaultCountry(countryValue)) {
      if (language !== 'en') {
        // An English internationl address cannot be rendered in some fonts
        return countryMessage
      } else {
        return value.replace(new RegExp(`${key}`, 'g'), keyValues[key])
      }
    } else {
      const addresses =
        templateData.resource[addressType as keyof typeof templateData.resource]
      const address = addresses[keyValues[key] as keyof typeof addresses]
      return value.replace(new RegExp(`${key}`, 'g'), address[addressKey] || '')
    }
  }, addressToParse)
}

export const offlineTransformers: IFunctionTransformer = {
  /*
    OfflineCompanyLogo provides the company logo from offline data.
  */
  OfflineCompanyLogo: (
    templateData: TemplateTransformerData,
    intl: IntlShape
  ) => {
    return templateData.resource.assets.logo
  },

  /*
    OfflineAddress allows you to get coditional address fields from offline data
    @params:
      -  conditionalKeys []: it expects an array of conditional blocks.
         - codition: holds the actual condition. Right now it's only equal matches
         - addressType: offline address type. Ex: facilities | locations
         - addressKey: field name of the address object. Ex: name | alias
         - adddresses: Mendatory object. It is an object containing a countryCode and formatted keyes to determine how to parse local and international addresses and be able to traverse through the object structure
           and fetch the appropriate value if found otherwise will throw exception.  countryCode & localAddress are mandatory fields of the addresses object
           Ex: '{child.addressLine4}, {child.district}, {child.state}'
   */
  OfflineAddress: (
    templateData: TemplateTransformerData,
    intl: IntlShape,
    payload?: TransformerPayload,
    optionalData?: IAvailableCountries[]
  ) => {
    const params = payload && (payload as IOfflineAddressPayload)
    if (!params) {
      throw new Error('No payload found for this transformer')
    }

    if (!optionalData) {
      throw new Error('No countries found for this transformer')
    }

    const matchedCondition = params.conditionalKeys.find(conditionalKey => {
      try {
        if (conditionalKey.condition.default) {
          return true
        } else if (
          !conditionalKey.condition.matchValues ||
          !conditionalKey.condition.key
        ) {
          throw new Error('Condition keys like matchValues or key is missing')
        }
        return conditionalKey.condition.matchValues.includes(
          // Will throw an exception when value is not found for given key
          getValueFromApplicationDataByKey(
            templateData.application.data,
            conditionalKey.condition.key
          )
        )
      } catch (error) {
        return false
      }
    })
    if (!matchedCondition) {
      throw new Error('No condition has matched for this transformer')
    }

    const countryValue = getCountryValue(
      matchedCondition.addresses.countryCode,
      templateData
    )

    const countryMessage = getCountryMessage(
      optionalData,
      countryValue,
      params.language
    )

    let addressToParse = ''
    if (isDefaultCountry(countryValue)) {
      addressToParse = matchedCondition.addresses.localAddress
    } else {
      addressToParse = matchedCondition.addresses.internationalAddress as string
    }
    const keyValues: KeyValues = getKeyValues(
      addressToParse.match(/\{.*?\}/g),
      templateData
    )

    let value = ''
    if (addressToParse.match(/\{.*?\}/g) === null) {
      // return default localAddress without transformation if addressToParse is badly formatted
      value = matchedCondition.addresses.localAddress
    } else {
      value = getTransformedAddress(
        keyValues,
        templateData,
        addressToParse,
        matchedCondition.addressKey, // either name or alias depending on params.language
        matchedCondition.addressType, // either facilities or locations
        countryMessage,
        countryValue,
        params.language
      )
    }
    return value
  }
}
