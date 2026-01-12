import { registerAs } from '@nestjs/config';

export default registerAs('qi', () => ({
  isProduction: process.env.QI_IS_PRODUCTION === 'true',
  usernameTest: process.env.QI_USERNAME_TEST,
  passwordTest: process.env.QI_PASSWORD_TEST,
  xTerminalIdTest: process.env.QI_X_TERMINAL_ID_TEST,
  urlTest: process.env.QI_URL || 'https://uat-sandbox-3ds-api.qi.iq/api/v1',
  currencyTest: process.env.QI_CURRENCY || 'IQD',
  usernameProd: process.env.QI_USERNAME_PROD,
  passwordProd: process.env.QI_PASSWORD_PROD,
  xTerminalIdProd: process.env.QI_X_TERMINAL_ID_PROD,
  urlProd: 'https://3ds-api.qi.iq/api/v1',
  currencyProd: process.env.QI_CURRENCY || 'IQD',
  callbackToken: process.env.QI_CALLBACK_TOKEN,
  publicKeyPath: process.env.QI_PUBLIC_KEY_PATH || './keys/qi-public.pem',
}));
