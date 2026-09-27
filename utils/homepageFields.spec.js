import getHomepageFields from './homepageFields'

const defaultData = {
  heroEyebrow: '',
  heroHeading: '',
  heroCopy: '',
  heroButtonLabel: '',
  heroButtonLink: '',
  heroImage: {},
  mapEyebrow: '',
  mapHeading: '',
  mapKicker: '',
  mapVideo: {},
  exploreEyebrow: '',
  exploreHeading: '',
  exploreKicker: '',
  toolsEyebrow: '',
  toolsHeading: '',
  toolsKicker: '',
  tools: [],
  pathEyebrow: '',
  pathHeading: '',
  pathKicker: '',
  paths: []
}

describe('homepageFields', () => {
  it('Should return default data if no fields provided', () => {
    const fields = getHomepageFields({})
    expect(fields).toMatchObject(defaultData)
  })

  it('Should return default data if some fields are missing', () => {
    const fields = getHomepageFields({
      heroHeading: 'foo'
    })
    expect(fields).toMatchObject({ ...defaultData, heroHeading: 'foo' })
  })
})
