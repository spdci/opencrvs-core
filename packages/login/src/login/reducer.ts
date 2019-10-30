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
import { loop, LoopReducer, Cmd, Loop } from 'redux-loop'
import { push } from 'connected-react-router'
import * as actions from '@login/login/actions'
import { authApi } from '@login/utils/authApi'
import * as routes from '@login/navigation/routes'

export type LoginState = {
  submitting: boolean
  token: string
  authenticationDetails: { nonce: string; mobile: string }
  submissionError: boolean
  resentSMS: boolean
  stepOneDetails: { username: string }
  errorCode?: number
}

export const initialState: LoginState = {
  submitting: false,
  token: '',
  authenticationDetails: {
    nonce: '',
    mobile: ''
  },
  submissionError: false,
  resentSMS: false,
  stepOneDetails: { username: '' }
}

export const loginReducer: LoopReducer<LoginState, actions.Action> = (
  state: LoginState = initialState,
  action: actions.Action
): LoginState | Loop<LoginState, actions.Action> => {
  switch (action.type) {
    case actions.AUTHENTICATE:
      return loop(
        {
          ...state,
          submitting: true,
          submissionError: false,
          resentSMS: false,
          stepOneDetails: action.payload
        },
        Cmd.run<
          actions.AuthenticationFailedAction,
          actions.AuthenticateResponseAction
        >(authApi.authenticate, {
          successActionCreator: actions.completeAuthentication,
          failActionCreator: actions.failAuthentication,
          args: [action.payload]
        })
      )
    case actions.AUTHENTICATE_VALIDATE:
      return {
        ...state,
        submissionError: true,
        errorCode: action.payload
      }
    case actions.AUTHENTICATION_FAILED:
      return {
        ...state,
        submitting: false,
        submissionError: true,
        errorCode: action.payload.response && action.payload.response.status
      }
    case actions.AUTHENTICATION_COMPLETED:
      return loop(
        {
          ...state,
          submitting: action.payload.token ? true : false,
          submissionError: false,
          resentSMS: false,
          authenticationDetails: {
            ...state.authenticationDetails,
            nonce: action.payload.nonce,
            mobile: action.payload.mobile
          }
        },
        (action.payload.token &&
          Cmd.run(() => {
            window.location.assign(
              `${window.config.REGISTER_APP_URL}?token=${action.payload.token}`
            )
          })) ||
          Cmd.action(push(routes.STEP_TWO))
      )
    case actions.RESEND_SMS:
      return loop(
        {
          ...state,
          submissionError: false,
          resentSMS: false
        },
        Cmd.run<actions.ResendSMSFailedAction, actions.ResendSMSCompleteAction>(
          authApi.resendSMS,
          {
            successActionCreator: actions.completeSMSResend,
            failActionCreator: actions.failSMSResend,
            args: [state.authenticationDetails.nonce]
          }
        )
      )
    case actions.RESEND_SMS_FAILED:
      return { ...state, resentSMS: false, submissionError: true }
    case actions.RESEND_SMS_COMPLETED:
      return {
        ...state,
        resentSMS: true,
        submissionError: false,
        authenticationDetails: {
          ...state.authenticationDetails,
          nonce: action.payload.nonce
        }
      }
    case actions.VERIFY_CODE:
      const code = action.payload.code
      return loop(
        {
          ...state,
          submitting: true,
          submissionError: false,
          resentSMS: false
        },
        Cmd.run<
          actions.VerifyCodeFailedAction,
          actions.VerifyCodeCompleteAction
        >(authApi.verifyCode, {
          successActionCreator: actions.completeVerifyCode,
          failActionCreator: actions.failVerifyCode,
          args: [{ code, nonce: state.authenticationDetails.nonce }]
        })
      )
    case actions.VERIFY_CODE_FAILED:
      return { ...state, submitting: false, submissionError: true }
    case actions.VERIFY_CODE_COMPLETED:
      return loop(
        {
          ...state,
          stepSubmitting: false,
          submissionError: false,
          resentSMS: false,
          token: action.payload.token
        },
        Cmd.run(() => {
          window.location.assign(
            `${window.config.REGISTER_APP_URL}?token=${action.payload.token}`
          )
        })
      )
    case actions.GOTO_APP:
      return loop(
        {
          ...state
        },
        Cmd.run(() => {
          window.location.assign(
            `${window.config.REGISTER_APP_URL}?token=${state.token}`
          )
        })
      )
    default:
      return state
  }
}
