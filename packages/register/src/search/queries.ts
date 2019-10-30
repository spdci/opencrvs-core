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
import gql from 'graphql-tag'

export const SEARCH_EVENTS = gql`
  query(
    $sort: String
    $trackingId: String
    $contactNumber: String
    $registrationNumber: String
    $locationIds: [String]
  ) {
    searchEvents(
      sort: $sort
      trackingId: $trackingId
      registrationNumber: $registrationNumber
      contactNumber: $contactNumber
      locationIds: $locationIds
    ) {
      totalItems
      results {
        id
        type
        registration {
          status
          trackingId
          registrationNumber
          registeredLocationId
          duplicates
        }
        ... on BirthEventSearchSet {
          dateOfBirth
          childName {
            firstNames
            familyName
          }
        }
        ... on DeathEventSearchSet {
          dateOfDeath
          deceasedName {
            firstNames
            familyName
          }
        }
      }
    }
  }
`
export const SEARCH_APPLICATIONS_USER_WISE = gql`
  query(
    $status: [String]
    $userId: String
    $locationIds: [String]
    $sort: String
    $count: Int
    $skip: Int
  ) {
    searchEvents(
      status: $status
      userId: $userId
      locationIds: $locationIds
      sort: $sort
      count: $count
      skip: $skip
    ) {
      totalItems
      results {
        id
        type
        registration {
          dateOfApplication
          status
        }
        ... on BirthEventSearchSet {
          childName {
            use
            firstNames
            familyName
          }
        }
        ... on DeathEventSearchSet {
          deceasedName {
            use
            firstNames
            familyName
          }
        }
      }
    }
  }
`

export const COUNT_USER_WISE_APPLICATIONS = gql`
  query($status: [String], $userId: String, $locationIds: [String]) {
    searchEvents(status: $status, userId: $userId, locationIds: $locationIds) {
      totalItems
    }
  }
`
