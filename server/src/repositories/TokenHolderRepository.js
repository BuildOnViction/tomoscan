import TokenHolder from '../models/TokenHolder'

let TokenHolderRepository = {
  async addHoldersFromTokenTx (tokenTx) {
    if (!tokenTx)
      return false

    // Add holder from.
    await TokenHolderRepository.updateQuality(tokenTx.from,
      tokenTx.address, -tokenTx.valueNumber)
    // Add holder to.
    await TokenHolderRepository.updateQuality(tokenTx.to,
      tokenTx.address, tokenTx.valueNumber)
  },

  async updateQuality (hash, token, quantity) {
    let holder = await TokenHolder.findOne(
      {hash: hash, token: token})
    if (!holder) {
      // Create new.
      holder = await TokenHolder.create({
        hash: hash,
        token: token,
        quantityNumber: 0,
      })
    }
    holder.quantityNumber = holder.quantityNumber + quantity
    holder.quantity = holder.quantityNumber
    holder.save()

    return holder
  },

  formatItem (tokenHolder, totalSupply) {
    tokenHolder.percentAge = tokenHolder.quantityNumber / totalSupply * 100

    return tokenHolder
  },
}

export default TokenHolderRepository