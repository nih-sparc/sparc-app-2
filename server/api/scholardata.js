import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { doi } = getQuery(event)
  if (!doi) throw createError({ statusCode: 400, message: 'doi is required' })

  const url = `https://scholardata.io/api/v1/datasets/by-doi?doi=${encodeURIComponent(doi)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw createError({ statusCode: response.status, message: 'scholardata request failed' })
  }

  return response.json()
})
