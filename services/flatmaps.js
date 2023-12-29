const speciesMap = {
  'NCBITaxon:10114': 'rat',
  'NCBITaxon:10090': 'mouse',
  'NCBITaxon:9823': 'pig',
  'NCBITaxon:9606': 'human',
  'NCBITaxon:9685': 'cat'
}

const buildConnectivitySqlStatement = function (keastIds) {
  let sql = 'select knowledge from knowledge where entity in ('
  if (keastIds.length === 1) {
    sql += `'${keastIds[0]}')`
  } else if (keastIds.length > 1) {
    for (let i in keastIds) {
      sql += `'${keastIds[i]}'${i >= keastIds.length - 1 ? ')' : ','} `
    }
  }
  return sql
}

const buildAnatomySqlStatement = function(taxo, anatomy) {
  let anatomyString = ''
  if (anatomy.length === 1) {
    anatomyString = `('${anatomy[0]}')`
  } else if (anatomy.length > 1) {
    anatomyString = '('
    for (let i in anatomy) {
      anatomyString += `'${anatomy[i]}'${i >= anatomy.length - 1 ? ')' : ','} `
    }
  }
  let sql = `select id, entity from (select id, models from flatmaps group by models having max(created)) left join flatmap_entities on id = flatmap where models = '${taxo}' and entity in ${anatomyString}`
  return sql
}

const anatomyQuery = async (taxo, anatomy) => {
  const { $flatmapApiClient } = useNuxtApp()
  const sqlData = { sql: buildAnatomySqlStatement(taxo, anatomy) }
  return $flatmapApiClient.post('knowledge/query/', sqlData)
}

export default {
  anatomyQuery,
  buildConnectivitySqlStatement,
  speciesMap
}
