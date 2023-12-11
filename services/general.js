const lookupOntoTerm = async (apiClient, term) => {
  const config = {
    params: {
      term
    }
  }
  const response = await apiClient.get('/onto_term_lookup', config)
  return response.data
}

export default {
  lookupOntoTerm
}
