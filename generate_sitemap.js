import { simpleSitemapAndIndex } from 'sitemap'
import algoliasearch from 'algoliasearch'
import contentful from 'contentful'

const PORTAL_BASE_URL = process.env.ROOL_URL || 'https://staging.sparc.science'

// Algolia creds
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY
const ALGOLIA_INDEX = process.env.ALGOLIA_INDEX || 'k-core_dev'

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY)
const algoliaIndex = algoliaClient.initIndex(ALGOLIA_INDEX)

// Contentful
const CTF_SPACE_ID = process.env.CTF_SPACE_ID
const CTF_CDA_ACCESS_TOKEN = process.env.CTF_CDA_ACCESS_TOKEN
const CTF_API_HOST = process.env.CTF_API_HOST || 'preview.contentful.com'

// Checking required variables
if (
  ![
    PORTAL_BASE_URL,
    ALGOLIA_APP_ID,
    ALGOLIA_API_KEY,
    ALGOLIA_INDEX,
    CTF_SPACE_ID,
    CTF_CDA_ACCESS_TOKEN,
    CTF_API_HOST
  ].every(env => env)
) {
  console.error('At least one required environment variable is missing.')
  process.exit(9)
}

const contentfulClient = contentful.createClient({
  space: CTF_SPACE_ID,
  accessToken: CTF_CDA_ACCESS_TOKEN,
  host: CTF_API_HOST
})

// Add static URLs here
const urls = new Set([
  '/data',
  '/about',
  '/contact-us',
  '/share-data'
])

// DATA

// Fetching DATASETS IDs
process.stdout.write('Fetching datasets from Algolia...')

const datasetResp = await algoliaIndex.search('', {
  hitsPerPage: 9999,
  facets: '["*"]',
  filters: '(NOT item.published.status:embargo OR item.published.status:embargo) AND item.types.name:Dataset'
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)
process.stdout.write('Fetching datasets from Algolia... Done. Found ' + datasetResp.hits.length + ' URLs.\n')

datasetResp.hits.forEach(dataset => {
  urls.add(PORTAL_BASE_URL + '/datasets/' + dataset.objectID)
})

// Fetching ANATOMICAL MODELS IDs
process.stdout.write('Fetching anatomical models from Algolia...')

const anatomicalResp = await algoliaIndex.search('', {
  hitsPerPage: 9999,
  facets: '["*"]',
  filters: '(NOT item.published.status:embargo OR item.published.status:embargo) AND (NOT item.types.name:Dataset AND item.types.name:Scaffold)'
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)
process.stdout.write('Fetching anatomical models from Algolia... Done. Found ' + anatomicalResp.hits.length + ' URLs.\n')

anatomicalResp.hits.forEach(dataset => {
  urls.add(PORTAL_BASE_URL + '/datasets/' + dataset.objectID)
})

// Fetching COMPUTATIONAL MODEL IDs
process.stdout.write('Fetching computational models from Algolia...')

const computationalResp = await algoliaIndex.search('', {
  hitsPerPage: 9999,
  facets: '["*"]',
  filters: '(NOT item.published.status:embargo OR item.published.status:embargo) AND (NOT item.types.name:Dataset AND NOT item.types.name:Scaffold)'
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)
process.stdout.write('Fetching computational models from Algolia... Done. Found ' + computationalResp.hits.length + ' URLs.\n')

computationalResp.hits.forEach(dataset => {
  urls.add(PORTAL_BASE_URL + '/datasets/' + dataset.objectID)
})

// Fetching PROJECTS IDs
process.stdout.write('Fetching projects from Contentful...')

const projectResp = await contentfulClient.getEntries({
  content_type: 'sparcAward',
  limit: 1000
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)
process.stdout.write('Fetching projects from Contentful... Done. Found ' + projectResp.items.length + ' URLs.\n')

projectResp.items.forEach(project => {
  urls.add(PORTAL_BASE_URL + '/projects/' + project.sys.id)
})

// TOOLS & RESOURCES

// Fetching DATABASES IDs
process.stdout.write('Fetching databases from Contentful...')

const databasesResp = await contentfulClient.getEntries({
  content_type: 'sparcPartners',
  limit: 1000,
  'fields.resourceType[in]': 'Data and Models'
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)

let counter = 0
databasesResp.items.forEach(db => {
  if (db.fields.url && db.fields.url.includes(PORTAL_BASE_URL)) {
    counter++
    urls.add(db.fields.url)
  }
})

process.stdout.write('Fetching databases from Contentful... Done. Found ' + counter + ' URLs.\n')

// Fetching SOFTWARE IDs
process.stdout.write('Fetching software from Contentful...')

const softwareResp = await contentfulClient.getEntries({
  content_type: 'sparcPartners',
  limit: 1000,
  'fields.resourceType[in]': 'Software'
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)

counter = 0
softwareResp.items.forEach(db => {
  if (db.fields.url && db.fields.url.includes(PORTAL_BASE_URL)) {
    counter++
    urls.add(db.fields.url)
  }
})

process.stdout.write('Fetching software from Contentful... Done. Found ' + counter + ' URLs.\n')

// Fetching INFORMATION SERVICES IDs
process.stdout.write('Fetching software from Contentful...')

const infoResp = await contentfulClient.getEntries({
  content_type: 'sparcPartners',
  limit: 1000,
  'fields.resourceType[in]': 'Information Services'
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)

counter = 0
infoResp.items.forEach(db => {
  if (db.fields.url && db.fields.url.includes(PORTAL_BASE_URL)) {
    counter++
    urls.add(db.fields.url)
  }
})

process.stdout.write('Fetching information services from Contentful... Done. Found ' + counter + ' URLs.\n')

// Fetching DEVICES IDs
process.stdout.write('Fetching devices from Contentful...')

const deviceResp = await contentfulClient.getEntries({
  content_type: 'sparcPartners',
  limit: 1000,
  'fields.resourceType[in]': 'Devices'
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)

counter = 0
deviceResp.items.forEach(db => {
  if (db.fields.url && db.fields.url.includes(PORTAL_BASE_URL)) {
    counter++
    urls.add(db.fields.url)
  }
})

process.stdout.write('Fetching devices from Contentful... Done. Found ' + counter + ' URLs.\n')

// Fetching BIOLOGICAL IDs
process.stdout.write('Fetching biological from Contentful...')

const bioResp = await contentfulClient.getEntries({
  content_type: 'sparcPartners',
  limit: 1000,
  'fields.resourceType[in]': 'Biologicals'
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)

counter = 0
bioResp.items.forEach(db => {
  if (db.fields.url && db.fields.url.includes(PORTAL_BASE_URL)) {
    counter++
    urls.add(db.fields.url)
  }
})

process.stdout.write('Fetching biological from Contentful... Done. Found ' + counter + ' URLs.\n')

// NEWS & EVENTS

// Fetching NEWS IDs
process.stdout.write('Fetching news from Contentful...')

const newsResp = await contentfulClient.getEntries({
  content_type: 'news',
  limit: 1000
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)

counter = 0
newsResp.items.forEach(db => {
  if (db.fields.url && db.fields.url.includes(PORTAL_BASE_URL)) {
    counter++
    urls.add(db.fields.url)
  }
})

process.stdout.write('Fetching news from Contentful... Done. Found ' + counter + ' URLs.\n')

// Fetching EVENTS IDs
process.stdout.write('Fetching events from Contentful...')

const eventsResp = await contentfulClient.getEntries({
  content_type: 'event',
  limit: 1000
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)

counter = 0
eventsResp.items.forEach(db => {
  if (db.fields.url && db.fields.url.includes(PORTAL_BASE_URL)) {
    counter++
    urls.add(db.fields.url)
  }
})

process.stdout.write('Fetching events from Contentful... Done. Found ' + counter + ' URLs.\n')

// Fetching COMMUNITY SPOTLIGHT IDs
process.stdout.write('Fetching community spotlights from Contentful...')

const commResp = await contentfulClient.getEntries({
  content_type: 'communitySpotlight',
  limit: 1000,
  'fields.itemType[in]': undefined,
  'fields.anatomicalStructure[in]': undefined
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)

counter = 0
commResp.items.forEach(db => {
  if (db.fields.linkedItem && db.fields.linkedItem.fields.storyRoute) {
    counter++
    urls.add(PORTAL_BASE_URL + '/news-and-events/community-spotlight/success-stories/' + db.fields.linkedItem.fields.storyRoute)
  }
})

// Fetching ABOUT DETAILS IDs
process.stdout.write('Fetching about details from Contentful...')

const aboutResp = await contentfulClient.getEntries({
  content_type: 'aboutPageSecondLevel',
  limit: 1000
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)

counter = 0
aboutResp.items.forEach(db => {
  if (db.sys.id) {
    counter++
    urls.add(PORTAL_BASE_URL + '/about/' + db.sys.id)
  }
})

process.stdout.write('Fetching about details from Contentful... Done. Found ' + counter + ' URLs.\n')

console.log('Finished scraping data. URLs found:', urls.size)
process.stdout.write('Generating sitemap...')

simpleSitemapAndIndex({
  hostname: PORTAL_BASE_URL,
  destinationDir: './public',
  sourceData: Array.from(urls).map(url => ({ url }))
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)
console.log('Generating sitemap... Done. Sitemap and sitemap index can be found in ./public.')
