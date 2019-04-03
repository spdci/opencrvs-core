import { client } from 'src/elasticsearch/client'
import { ISearchQuery } from './types'
import { queryBuilder, EMPTY_STRING } from './utils'

const DEFAULT_SIZE = 10
const DEFAULT_SEARCH_TYPE = 'compositions'

export const searchComposition = async (params: ISearchQuery) => {
  const {
    query = EMPTY_STRING,
    event = EMPTY_STRING,
    status = EMPTY_STRING,
    applicationLocationId = EMPTY_STRING,
    from = 0,
    size = DEFAULT_SIZE
  } = params

  return client.search({
    type: DEFAULT_SEARCH_TYPE,
    from: from,
    size: size,
    body: {
      query: queryBuilder(query, applicationLocationId, { event, status })
    }
  })
}