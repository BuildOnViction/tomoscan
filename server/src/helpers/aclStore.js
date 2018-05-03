class AclStore {
  constructor () {
    this._acl = null
  }

  set acl (acl) {
    this._acl = acl
  }

  get acl () {
    return this._acl
  }
}

const aclStore = new AclStore()

export default aclStore
