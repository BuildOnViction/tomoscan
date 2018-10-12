const program = require('commander')

const { revert } = require('./commands/removeData')
const { RewardProcess } = require('./commands/updateRewardTime')
const { updateTxCount } = require('./commands/updateTxCount')

program
    .version('0.1.0')
    .description('Data command')


program
    .command('revert <blockNumber>')
    .alias('rv')
    .description('Revert data to block')
    .action((blockNumber) => {
        console.log('Revert to block ', blockNumber)
        revert(blockNumber)
    })
program
    .command('reward')
    .alias('rw')
    .description('Update reward count')
    .action(() => {
        RewardProcess()
    })
program
    .command('updateTxCount')
    .alias('utc')
    .description('Update reward count')
    .action(() => {
        updateTxCount()
    })

program.parse(process.argv)