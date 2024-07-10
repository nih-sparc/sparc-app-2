export default defineEventHandler((event) => {
  const req = event?.node?.req
  const res = event?.node?.res
  const route = event?.node?.url
  const userAgent = req?.headers['user-agent']?.toLowerCase()
  const googlebotPaths = ['data', 'datasets']
  // Remove leading '/' if present
  let firstPartOfRoute = route?.length > 0 ? route.replace(/^\//, '') : ''
  const index = firstPartOfRoute.indexOf('/')
  if (index !== -1) {
    // Grab the first directory
    firstPartOfRoute = firstPartOfRoute.substring(0, index);
  }

  if (firstPartOfRoute == '' || googlebotPaths.includes(firstPartOfRoute)) {
    if (userAgent && (userAgent.includes('googlebot') || userAgent.includes("google.com/bot.html"))) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      res.end('Googlebot detected, serving empty response.')
    }
  }
})
