import TokenHolder from '../models/TokenHolder'
import BigNumber from 'bignumber.js'

let TokenHolderRepository = {
  async addHoldersFromTokenTx (tokenTx) {
    if (!tokenTx)
      return false

    // Add holder from.
    await TokenHolderRepository.updateQuality(tokenTx.from,
      tokenTx.address, -tokenTx.value)
    // Add holder to.
    await TokenHolderRepository.updateQuality(tokenTx.to,
      tokenTx.address, tokenTx.value)
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
        quantity: 0,
      })
    }
    quantity = new BigNumber(quantity)
    let holderQuantity = new BigNumber(holder.quantity)
    let quantityCalc = holderQuantity.plus(quantity)
    holder.quantity = quantityCalc.toString()
    holder.quantityNumber = quantityCalc.toString()
    holder.save()

    return holder
  },

  formatItem (tokenHolder, totalSupply) {
    if (totalSupply) {
      totalSupply = new BigNumber(totalSupply)
      let quantity = new BigNumber(tokenHolder.quantity)
      let percentAge = quantity.div(totalSupply) * 100
      percentAge = percentAge.toFixed(4)
      percentAge = (percentAge.toString() == '0.0000') ? '0.0001' : percentAge
      tokenHolder.percentAge = percentAge
    }

    return tokenHolder
  },
}

export default TokenHolderRepository