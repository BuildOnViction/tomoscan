import Crawl from '../models/Crawl'

let CrawlRepository = {
  async add (type, value) {
    return await Crawl.findOneAndUpdate({
      type: type,
      data: value,
    }, {
      type: type,
      data: value,
      crawl: false,
    }, {upsert: true, new: true})
  },
}

export default CrawlRepository