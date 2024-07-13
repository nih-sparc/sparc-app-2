export default defineEventHandler((event) => {
  const req = event?.node?.req
  const res = event?.node?.res
  const route = event?.node?.url
  const userAgent = req?.headers['user-agent']?.toLowerCase()
  const algoliaSearchPaths = ['data', 'datasets']
  const botNames = ['googlebot', 'semrush', 'msnbot', 'yandex', 'applebot', 'wowrack', 'lifeera', 'PetalBot', 'nettle', 'xforce-security',
    'Neevabot', 'Seekport\sCrawler', 'Exabot', 'Gigabot', 'ICCrawler', 'Snappy', 'Mb2345Browser', 'QQBrowser', 'LieBaoFast',
    'MicroMessenger', 'Kinza', 'TheWorld', 'YoudaoBot', 'Qwantify', 'Bleriot', 'WikiApiary', 'MegaIndex', 'MojeekBot', 'BLEXBot',
    'coccocbot', 'SEOkicks', 'SeznamBot', 'YandexImages', 'TweetmemeBot', 'Yeti', 'AhrefsBot', 'Bytespider', 'MJ12bot', 'TurnitinBot',
    'CCBot', 'Linguee\sBot', 'DotBot', 'SeznamBot', 'SemrushBot', 'Turnitin', 'YandexBot', 'mj12bot', 'Blexbot', 'OpenLinkProfiler',
    'Ltx71', 'Rogerbot', 'Baiduspider']

  // Remove leading '/' if present
  let firstPartOfRoute = route?.length > 0 ? route.replace(/^\//, '') : ''
  const index = firstPartOfRoute.indexOf('/')
  if (index !== -1) {
    // Grab the first directory
    firstPartOfRoute = firstPartOfRoute.substring(0, index);
  }

  if (firstPartOfRoute != '' && algoliaSearchPaths.includes(firstPartOfRoute)) {
    if (userAgent && botNames.some(botName => userAgent.indexOf(botName) !== -1)) {
      res.statusCode = 403
      res.end('Bot detected, serving 403 response.')
    }
  }
})
