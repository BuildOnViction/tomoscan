const config = require('config')

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: config.get('ELASTICSEARCH') })

const ElasticHelper = {
    index: async (id, index, body) => {
        await client.index({
            id: id,
            index: index,
            opType: 'index',
            body: body
        })
    },
    indexWithoutId: async (index, body) => {
        await client.index({
            index: index,
            opType: 'index',
            body: body
        })
    },
    deleteByQuery: async (index, query) => {
        return client.deleteByQuery({
            index: index,
            body: { query: query }
        })
    },
    search: async (index, query, sort, limit, page) => {
        if (Object.keys(query).length > 0) {
            const { body } = await client.search({
                index: index,
                body: {
                    query: query,
                    sort: sort,
                    size: limit,
                    from: (page - 1) * limit
                }
            })
            // })
            return body
        } else {
            const { body } = await client.search({
                index: index,
                body: {
                    sort: sort,
                    size: limit,
                    from: (page - 1) * limit
                }
            })
            return body
        }
    },
    count: async (index, query) => {
        if (Object.keys(query).length > 0) {
            const { body } = await client.count({
                index: index,
                body: { query: query }
            })
            return body
        } else {
            const { body } = await client.count({ index: index })
            return body
        }
    }
}

module.exports = ElasticHelper
