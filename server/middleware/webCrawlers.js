export default defineEventHandler((event) => {
  const req = event?.node?.req
  const res = event?.node?.res
  const userAgent = req?.headers['user-agent']?.toLowerCase()
  const botNames = ['semrush', 'msnbot', 'yandex', 'applebot', 'wowrack', 'lifeera', 'PetalBot', 'nettle', 'xforce-security',
    'Neevabot', 'Seekport\sCrawler', 'Exabot', 'Gigabot', 'ICCrawler', 'Snappy', 'Mb2345Browser', 'QQBrowser', 'LieBaoFast',
    'MicroMessenger', 'Kinza', 'TheWorld', 'YoudaoBot', 'Qwantify', 'Bleriot', 'WikiApiary', 'MegaIndex', 'MojeekBot', 'BLEXBot',
    'coccocbot', 'SEOkicks', 'SeznamBot', 'YandexImages', 'TweetmemeBot', 'Yeti', 'AhrefsBot', 'Bytespider', 'MJ12bot', 'TurnitinBot',
    'CCBot', 'Linguee\sBot', 'DotBot', 'SeznamBot', 'SemrushBot', 'Turnitin', 'YandexBot', 'mj12bot', 'Blexbot', 'OpenLinkProfiler',
    'Ltx71', 'Rogerbot', 'Baiduspider']

  // Block all un-wanted bots
  if (userAgent && botNames.some(botName => userAgent.indexOf(botName.toLowerCase()) !== -1)) {
    res.statusCode = 403
    res.end('Bot detected, serving 403 response.')
  }
})
