<template>
  <NuxtLayout>
    <NuxtPage/>
  </NuxtLayout>
</template>

<script setup>
  import { Amplify } from 'aws-amplify'
  const config = useRuntimeConfig()
  const awsConfig = {
    Auth: {
      Cognito: {
        userPoolId: config.public.AWS_USER_POOL_ID,
        userPoolClientId: config.public.AWS_USER_POOL_WEB_CLIENT_ID,
        loginWith: {
          oauth: {
            domain: config.public.AWS_OAUTH_DOMAIN,
            scopes: ['openid'],
            redirectSignIn: [config.public.AWS_OAUTH_REDIRECT_SIGN_IN_URL],
            redirectSignOut: [config.public.AWS_OAUTH_REDIRECT_SIGN_OUT_URL],
            responseType: 'token'
          }
        }
      }
    }
  }
  Amplify.configure(awsConfig)
</script>
