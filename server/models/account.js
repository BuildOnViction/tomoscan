const mongoose = require( 'mongoose' )
const Schema = mongoose.Schema;

const schema = new mongoose.Schema( {
	hash: {type: String, unique: true}, balance: Number, code: String, transactionCount: Number, storageAt: String,
}, {timestamps: true} )


module.exports = mongoose.model( 'Account', schema )