import Crawl from '../models/Crawl'

let CrawlRepository = {
    async add (type, value) {
        let crawl = Crawl.findOneAndUpdate({
            type: type,
            data: value
        }, {
            type: type,
            data: value,
            crawl: false
        }, { upsert: true, new: true })

        return crawl
    }
}

export default CrawlRepository
