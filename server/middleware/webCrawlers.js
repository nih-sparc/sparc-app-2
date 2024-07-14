export default defineEventHandler((event) => {
  const req = event?.node?.req
  const res = event?.node?.res
  const route = event?.node?.url
  const userAgent = req?.headers['user-agent']?.toLowerCase()
  const algoliaSearchPaths = ['data', 'datasets']
  const botNames = ['semrush', 'msnbot', 'yandex', 'applebot', 'wowrack', 'lifeera', 'PetalBot', 'nettle', 'xforce-security',
    'Neevabot', 'Seekport\sCrawler', 'Exabot', 'Gigabot', 'ICCrawler', 'Snappy', 'Mb2345Browser', 'QQBrowser', 'LieBaoFast',
    'MicroMessenger', 'Kinza', 'TheWorld', 'YoudaoBot', 'Qwantify', 'Bleriot', 'WikiApiary', 'MegaIndex', 'MojeekBot', 'BLEXBot',
    'coccocbot', 'SEOkicks', 'SeznamBot', 'YandexImages', 'TweetmemeBot', 'Yeti', 'AhrefsBot', 'Bytespider', 'MJ12bot', 'TurnitinBot',
    'CCBot', 'Linguee\sBot', 'DotBot', 'SeznamBot', 'SemrushBot', 'Turnitin', 'YandexBot', 'mj12bot', 'Blexbot', 'OpenLinkProfiler',
    'Ltx71', 'Rogerbot', 'Baiduspider', 'crawl']

  // Remove leading '/' if present
  let firstPartOfRoute = route?.length > 0 ? route.replace(/^\//, '') : ''
  const index = firstPartOfRoute.indexOf('/')
  if (index !== -1) {
    // Grab the first directory
    firstPartOfRoute = firstPartOfRoute.substring(0, index);
  }
  // block all un-wanted bots and only return a 200 for googlebot so that client does not get rendered
  if (firstPartOfRoute == '' || algoliaSearchPaths.includes(firstPartOfRoute)) {
    if (userAgent && botNames.some(botName => userAgent.indexOf(botName.toLowerCase()) !== -1)) {
      res.statusCode = 403
      res.end('Bot detected, serving 403 response.')
    } else if (userAgent && (userAgent.includes('googlebot') || userAgent.includes("google.com/bot.html"))) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      res.end('Googlebot detected, serving empty response.')
    }
  }
})
