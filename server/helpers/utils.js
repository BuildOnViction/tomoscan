import mongoose from 'mongoose'
import _ from 'lodash'

export const paginate = async (req, modelName, params) => {
  let per_page = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 10
  let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1

  let query = _.extend({}, params.query)
  let sort = _.extend({}, params.sort)
  let total = _.isInteger(params.total) ? params.total : null
  let count = await mongoose.model(modelName).count()
  total = total ? total : count
  let items = await mongoose.model(modelName).
    find(query).sort(sort).exec()

  return {
    total: total,
    per_page: per_page,
    current_page: page,
    pages: Math.ceil(total / per_page),
    items: items,
  }
}