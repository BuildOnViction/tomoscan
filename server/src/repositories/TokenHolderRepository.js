import TokenHolder from '../models/TokenHolder'
import BigNumber from 'bignumber.js'
import { convertHexToFloat } from '../helpers/utils'

let TokenHolderRepository = {
  async addHoldersFromTokenTx (tokenTx) {
    if (!tokenTx)
      return false

    console.log(tokenTx.value)

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
        quantity: 0,
      })
    }

    // Convert number to hex.
    quantity = parseFloat(quantity).toString(16)
    let quantityCalc = convertHexToFloat(holder.quantity, 16) +
      convertHexToFloat(quantity, 16)
    let newQuantity = quantityCalc.toString(16)
    if (newQuantity.indexOf('-') >= 0) {
      newQuantity = newQuantity.replace('-', '')
      newQuantity = newQuantity.padStart(64, '0')
      newQuantity = '-' + newQuantity
    }
    else {
      newQuantity = newQuantity.padStart(64, '0')
    }
    holder.quantity = newQuantity
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