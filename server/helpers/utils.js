import mongoose from 'mongoose'
import _ from 'lodash'

export const paginate = async (req, model_name, params, manual_paginate = false) => {
  let per_page = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 25
  per_page = Math.min(25, per_page)
  let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
  page = page > 10000 ? 10000 : page

  let query = {}, sort = {}, total = null
  if (!isNaN(params)) {
    query = _.extend({}, params.query)
    sort = _.extend({}, params.sort)
    total = _.isInteger(params.total) ? params.total : null
  }

  let count = await mongoose.model(model_name).count()
  total = total ? total : count
  let builder = mongoose.model(model_name).find(query).sort(sort)
  if (!manual_paginate) {
    let offset = page > 1 ? (page - 1) * per_page : 0
    builder = builder.skip(offset)
    builder = builder.limit(per_page)
  }
  let items = await builder.exec()

  return {
    total: total,
    per_page: per_page,
    current_page: page,
    pages: Math.ceil(total / per_page),
    items: items,
  }
}