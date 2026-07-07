import algoliasearch from 'algoliasearch'

const facetPropPathMapping = [
  { label: 'Type', id: 'item.types', facetPropPath: 'item.types.name', facetSubpropPath: 'item.types.subcategory.name' },
  { label: 'Anatomical Structure', id: 'anatomy.organ.category', facetPropPath: 'anatomy.organ.category.name', facetSubpropPath: 'anatomy.organ.subcategory.name' },
  { label: 'Anatomical Structure', id: 'anatomy.organ', facetPropPath: 'anatomy.organ.name', facetSubpropPath: 'anatomy.organ.subcategory.name' },
  { label: 'Species', id: 'organisms.primary.species', facetPropPath: 'organisms.primary.species.name', facetSubpropPath: 'organisms.primary.species.subcategory.name' },
  { label: 'Experimental Approach', id: 'item.modalities', facetPropPath: 'item.modalities.keyword', facetSubpropPath: 'item.modalities.subcategory.name' },
  { label: 'Sex', id: 'attributes.subject.sex', facetPropPath: 'attributes.subject.sex.value', facetSubpropPath: 'attributes.subject.sex.subcategory.name' },
  { label: 'Age Categories', id: 'attributes.subject.ageCategory', facetPropPath: 'attributes.subject.ageCategory.value', facetSubpropPath: 'attributes.subject.ageCategory.subcategory.name' },
  { label: 'Consortia', id: 'supportingAwards.consortium', facetPropPath: 'supportingAwards.consortium.name', facetSubpropPath: 'supportingAwards.consortium.subCategory.name' },
]

export default defineCachedEventHandler(async (event) => {
  const id = getQuery(event).id
  if (!id) throw createError({ statusCode: 400, message: 'id is required' })
  const config = useRuntimeConfig()
  const client = algoliasearch(config.public.ALGOLIA_APP_ID, config.public.ALGOLIA_API_KEY)
  const index = client.initIndex(config.public.ALGOLIA_INDEX_PUBLISHED_TIME_DESC)

  const facetPropPaths = facetPropPathMapping.map(item => item.facetPropPath)
  const facetSubpropPaths = facetPropPathMapping.map(item => item.facetSubpropPath)

  const response = await index.search('', {
    hitsPerPage: 0,
    sortFacetValuesBy: 'alpha',
    facets: facetPropPaths.concat(facetSubpropPaths),
    filters: `objectID:${id}`
  })

  const facetData = []
  const responseFacets = response.facets || {}

  facetPropPaths.forEach(facetPropPath => {
    const parentFacet = facetPropPathMapping.find(item => item.facetPropPath === facetPropPath)
    const responseFacetChildren = responseFacets[facetPropPath] || {}
    const allPossibleChildrenSubfacets = parentFacet && responseFacets[parentFacet.facetSubpropPath]
      ? Object.keys(responseFacets[parentFacet.facetSubpropPath])
      : []

    const children = Object.keys(responseFacetChildren).map(facet => {
      const childrenSubfacets = allPossibleChildrenSubfacets.reduce((filtered, childFacetInfo) => {
        const info = childFacetInfo.split('.')
        if (info.length === 2 && facet === info[0]) {
          filtered.push({ label: childFacetInfo, id: childFacetInfo, facetPropPath: parentFacet?.facetSubpropPath })
        }
        return filtered
      }, [])
      return { label: facet, id: facet, children: childrenSubfacets, facetPropPath }
    })

    if (children.length > 0) {
      facetData.push({ label: parentFacet?.label || '', id: parentFacet?.label || '', children, key: facetPropPath })
    }
  })

  return facetData
}, {
  maxAge: 30 * 60,
  name: 'algolia-dataset-facets',
  getKey: (event) => `dataset-facets-${getQuery(event).id}`
})
