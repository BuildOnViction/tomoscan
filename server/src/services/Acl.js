import Acl from 'acl'
import aclStore from '../helpers/aclStore'

const MongodbBackend = Acl.mongodbBackend

const aclService = (dbConnection) => {
  const backend = new MongodbBackend(dbConnection, 'acl_')
  const acl = new Acl(backend)

  // Set roles
  acl.allow([
    {
      roles: 'admin',
      allows: [
        {resources: '/api/admin', permissions: '*'},
      ],
    },
    {
      roles: 'user',
      allows: [],
    },
  ])

  aclStore.acl = acl
}

export default aclService