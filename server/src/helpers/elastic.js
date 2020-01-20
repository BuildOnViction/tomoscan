const config = require('config')

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: config.get('ELASTICSEARCH') })

let ElasticHelper = {
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
    deleteByQuery: async (index, body) => {
        await client.index({
            index: index,
            body: body
        })
    },
    search: async (index, query, sort, limit, page) => {
        if (Object.keys(query).length > 0) {
            let { body } = await client.search({
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
            let { body } = await client.search({
                index: index,
                body: {
                    sort: sort,
                    size: limit,
                    from: (page - 1) * limit
                }
            })
            return body
        }
    }
}

module.exports = ElasticHelper
