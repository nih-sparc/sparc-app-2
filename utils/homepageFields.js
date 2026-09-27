/**
 * Get homepage fields, but default to empty values
 * @param {Object} field
 * @returns {Object}
 */
export default (fields = {}) => {
  return {
    heroEyebrow: fields.heroEyebrow || '',
    heroHeading: fields.heroHeading || '',
    heroCopy: fields.heroCopy || '',
    heroButtonLabel: fields.heroButtonLabel || '',
    heroButtonLink: fields.heroButtonLink || '',
    heroImage: fields.heroImage || {},
    mapEyebrow: fields.mapEyebrow || '',
    mapHeading: fields.mapHeading || '',
    mapKicker: fields.mapKicker || '',
    mapVideo: fields.mapVideo || {},
    exploreEyebrow: fields.exploreEyebrow || '',
    exploreHeading: fields.exploreHeading || '',
    exploreKicker: fields.exploreKicker || '',
    toolsEyebrow: fields.toolsEyebrow || '',
    toolsHeading: fields.toolsHeading || '',
    toolsKicker: fields.toolsKicker || '',
    tools: fields.tools || [],
    pathEyebrow: fields.pathEyebrow || '',
    pathHeading: fields.pathHeading || '',
    pathKicker: fields.pathKicker || '',
    paths: fields.paths || []
  }
}
