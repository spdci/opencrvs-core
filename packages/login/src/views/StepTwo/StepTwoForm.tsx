import { Field, WrappedFieldProps } from 'redux-form'
import * as React from 'react'
import styled from 'styled-components'
import { InjectedIntlProps, defineMessages, injectIntl } from 'react-intl'
import { InjectedFormProps } from 'redux-form'

import {
  TextInput,
  InputField,
  THEME_MODE
} from '@opencrvs/components/lib/forms'
import { Mobile2FA } from '@opencrvs/components/lib/icons'
import { stepTwoFields } from './stepTwoFields'

import {
  Title,
  FormWrapper,
  ActionWrapper,
  Container,
  LogoContainer,
  StyledPrimaryButton,
  StyledButton,
  FieldWrapper
} from '../StepOne/StepOneForm'

import { IVerifyCodeNumbers } from '../../login/actions'
import { Ii18nReduxFormFieldProps } from '../../utils/fieldUtils'
import { localiseValidationError } from '../../forms/i18n'

export const messages = defineMessages({
  stepTwoTitle: {
    id: 'login.stepTwoTitle',
    defaultMessage: 'Verify your mobile',
    description: 'The title that appears in step two of the form'
  },
  resend: {
    id: 'login.resendMobile',
    defaultMessage: 'Resend SMS',
    description: 'Text for button that resends SMS verification code'
  },
  stepTwoInstruction: {
    id: 'login.stepTwoInstruction',
    defaultMessage:
      'A verification code has been sent to your phone. ending in {number}. This code will be valid for 5 minutes.',
    description: 'The instruction that appears in step two of the form'
  },
  submit: {
    id: 'login.submit',
    defaultMessage: 'Submit',
    description: 'The label that appears on the submit button'
  },
  codeSubmissionError: {
    id: 'login.codeSubmissionError',
    defaultMessage: 'Sorry that code did not work.',
    description:
      'The error that appears when the user entered sms code is unauthorised'
  },
  resentSMS: {
    id: 'login.resentSMS',
    defaultMessage: 'We have delivered a new SMS to your mobile phone',
    description: 'The message that appears when the resend button is clicked.'
  },
  optionalLabel: {
    id: 'login.optionalLabel',
    defaultMessage: 'Optional',
    description: 'Optional label'
  },
  verficationCodeLabel: {
    id: 'login.verficationCodeLabel',
    defaultMessage: 'Verification code (6 digits)',
    description: 'Verification code label'
  }
})

const ErrorMsg = styled.span`
  color: ${({ theme }) => theme.colors.white};
  font-size: 15px;
`
export interface IProps {
  formId: string
  submissionError: boolean
  resentSMS: boolean
  submitting: boolean
  stepOneDetails: { mobile: string }
}
export interface IDispatchProps {
  submitAction: (values: IVerifyCodeNumbers) => void
  onResendSMS: () => void
}

type IStepTwoForm = IProps & IDispatchProps
const CodeInput = injectIntl(
  (
    props: WrappedFieldProps & {
      field: Ii18nReduxFormFieldProps
    } & InjectedIntlProps
  ) => {
    const { field, meta, intl, ...otherProps } = props
    return (
      <InputField
        {...field}
        {...otherProps}
        touched={meta.touched}
        error={meta.error && localiseValidationError(intl, meta.error)}
        label={intl.formatMessage(messages.verficationCodeLabel)}
        optionalLabel={intl.formatMessage(messages.optionalLabel)}
        ignoreMediaQuery
        hideAsterisk
        mode={THEME_MODE.DARK}
      >
        <TextInput
          {...field}
          {...props.input}
          touched={Boolean(meta.touched)}
          error={Boolean(meta.error)}
          placeholder="000000"
          ignoreMediaQuery
        />
      </InputField>
    )
  }
)

export class StepTwoForm extends React.Component<
  InjectedIntlProps &
    InjectedFormProps<IVerifyCodeNumbers, IStepTwoForm> &
    IStepTwoForm
> {
  render() {
    const {
      intl,
      handleSubmit,
      formId,
      submitAction,
      submitting,
      stepOneDetails,
      submissionError
    } = this.props
    const mobileNumber = stepOneDetails.mobile.replace(
      stepOneDetails.mobile.slice(5, 10),
      '******'
    )
    const field = stepTwoFields.code
    return (
      <Container id="login-step-two-box">
        <Title>
          <LogoContainer>
            <Mobile2FA />
          </LogoContainer>
          <h2>{intl.formatMessage(messages.stepTwoTitle)}</h2>
          <p>
            {intl.formatMessage(messages.stepTwoInstruction, {
              number: mobileNumber
            })}
          </p>
        </Title>
        <FormWrapper id={formId} onSubmit={handleSubmit(submitAction)}>
          <FieldWrapper>
            <Field
              name={field.name}
              validate={field.validate}
              component={CodeInput}
              field={field}
            />
            {submissionError && (
              <ErrorMsg>
                {intl.formatMessage(messages.codeSubmissionError)}
              </ErrorMsg>
            )}
          </FieldWrapper>

          <ActionWrapper>
            <StyledPrimaryButton
              id="login-mobile-submit"
              disabled={submitting}
              type="submit"
            >
              {intl.formatMessage(messages.submit)}
            </StyledPrimaryButton>{' '}
            <br />
            <StyledButton
              onClick={this.props.onResendSMS}
              id="login-mobile-resend"
              type="button"
            >
              {intl.formatMessage(messages.resend)}
            </StyledButton>
          </ActionWrapper>
        </FormWrapper>
      </Container>
    )
  }
}
