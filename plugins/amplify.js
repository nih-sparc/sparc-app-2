import { Amplify } from '@aws-amplify/core';
import { Auth } from '@aws-amplify/auth';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const awsConfig = {
    Auth: {
      region: config.public.AWS_REGION,
      userPoolId: config.public.AWS_USER_POOL_ID,
      userPoolWebClientId: config.public.AWS_USER_POOL_WEB_CLIENT_ID,
      authenticationFlowType: config.public.AWS_USER_AUTHENTICATION_FLOW_TYPE,
      oauth: {
        domain: config.public.AWS_OAUTH_DOMAIN,
        scope: [`${config.public.AWS_OAUTH_SCOPE}`],
        redirectSignIn: config.public.AWS_OAUTH_REDIRECT_SIGN_IN_URL,
        redirectSignOut: config.public.AWS_OAUTH_REDIRECT_SIGN_OUT_URL,
        responseType: config.public.AWS_OAUTH_RESPONSE_TYPE
      }
    }
  }
  // https://aws.amazon.com/blogs/mobile/ssr-support-for-aws-amplify-javascript-libraries/
  Amplify.configure(awsConfig)

  return {
    provide: {
      auth: awsConfig
    }
  }
})
