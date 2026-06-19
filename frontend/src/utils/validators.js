import i18n from '../i18n';

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email || !email.trim()) {
    errors.email = i18n.t('validation.emailRequired');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = i18n.t('validation.invalidEmail');
  }
  if (!password || !password.trim()) {
    errors.password = i18n.t('validation.passwordRequired');
  } else if (password.length < 6) {
    errors.password = i18n.t('validation.passwordMinLength');
  }
  return errors;
}

export function validateCustomer(data) {
  const errors = {};

  if (!data.fullName || !data.fullName.trim()) {
    errors.fullName = i18n.t('validation.fullNameRequired');
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = i18n.t('validation.fullNameMinLength');
  }

  if (!data.mobileNumber || !data.mobileNumber.trim()) {
    errors.mobileNumber = i18n.t('validation.mobileRequired');
  } else if (!/^[6-9]\d{9}$/.test(data.mobileNumber.replace(/\D/g, ''))) {
    errors.mobileNumber = i18n.t('validation.invalidIndianMobile');
  }

  if (!data.loanAmount || isNaN(data.loanAmount)) {
    errors.loanAmount = i18n.t('validation.loanAmountRequired');
  } else if (Number(data.loanAmount) < 1000) {
    errors.loanAmount = i18n.t('validation.minAmount');
  }

  if (!data.interestRate || isNaN(data.interestRate)) {
    errors.interestRate = i18n.t('validation.interestRateRequired');
  } else if (Number(data.interestRate) < 0.1 || Number(data.interestRate) > 100) {
    errors.interestRate = i18n.t('validation.invalidInterest');
  }

  if (!data.monthlyDueDay) {
    errors.monthlyDueDay = i18n.t('validation.monthlyDueDayRequired');
  } else if (
    Number(data.monthlyDueDay) < 1 ||
    Number(data.monthlyDueDay) > 31
  ) {
    errors.monthlyDueDay = i18n.t('validation.invalidDueDay');
  }

  if (!data.loanStartDate) {
    errors.loanStartDate = i18n.t('validation.loanStartDateRequired');
  }

  return errors;
}

export function validatePayment(data, remainingPrincipal) {
  const errors = {};

  if (!data.date) {
    errors.date = i18n.t('validation.paymentDateRequired');
  }

  if (data.interestPaid === '' || data.interestPaid === undefined) {
    errors.interestPaid = i18n.t('validation.interestPaidRequired');
  } else if (isNaN(data.interestPaid) || Number(data.interestPaid) < 0) {
    errors.interestPaid = i18n.t('validation.invalidInterestAmount');
  }

  if (data.principalPaid === '' || data.principalPaid === undefined) {
    errors.principalPaid = i18n.t('validation.principalPaidRequired');
  } else if (isNaN(data.principalPaid) || Number(data.principalPaid) < 0) {
    errors.principalPaid = i18n.t('validation.invalidPrincipalAmount');
  } else if (
    remainingPrincipal !== undefined &&
    Number(data.principalPaid) > remainingPrincipal
  ) {
    errors.principalPaid = i18n.t('validation.principalExceedsAmount', { amount: remainingPrincipal.toLocaleString('en-IN') });
  }

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
