<template>
	<section>
		<b-row class="mb-2">
			<b-col sm="6" class="mb-3">
				<b-card title="Recent Blocks">
					<b-table striped hover :items="blocks" :fields="block_headers" responsive>
						<template slot="block" slot-scope="data">
							<transition name="fade">
								<nuxt-link :to="{name: 'blocks-slug', params: {slug: data.item.number}}">{{ data.item.number }}</nuxt-link>
							</transition>
						</template>
						<template slot="txns" slot-scope="data">{{ data.item.e_tx }}</template>
						<template slot="signer" slot-scope="data">
							<transition name="fade">
								<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: data.item.signer}}">{{ data.item.signer }}</nuxt-link>
							</transition>
						</template>
					</b-table>
				</b-card>
			</b-col>

			<b-col sm="6" class="mb-3">
				<b-card title="Recent Transactions">
					<b-table
						striped
						hover
						responsive
						:items="txs"
						:fields="tx_headers">
						<template slot="hash" slot-scope="data">
							<nuxt-link class="address__tag" :to="{name: 'txs-slug', params: {slug: data.item.hash}}">{{ data.item.hash }}</nuxt-link>
						</template>
						<template slot="from" slot-scope="data">
							<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: data.item.from}}">{{ data.item.from }}</nuxt-link>
						</template>
						<template slot="arrow" slot-scope="data">
							<i class="fa fa-arrow-alt-right text-success"></i>
						</template>
						<template slot="to" slot-scope="data">
							<nuxt-link v-if="data.item.to" class="address__tag" :to="{name: 'address-slug', params: {slug: data.item.to}}">{{ data.item.to }}</nuxt-link>
							<nuxt-link v-else class="address__tag" :to="{name: 'address-slug', params: {slug: data.item.contractAddress}}">{{ data.item.contractAddress }}</nuxt-link>
						</template>
						<template slot="value" slot-scope="data">
							{{ formatUnit(toEther(data.item.value)) }}
						</template>
					</b-table>
				</b-card>
			</b-col>
		</b-row>
	</section>
</template>

<script>
  import axios from '~/plugins/axios'
  import mixin from '~/plugins/mixin'
  import socket from '~/plugins/socket.io'
  import _ from 'lodash'

  export default {
    mixins: [mixin],
    head () {
      return {
        title: 'TOMO Explorer',
      }
    },
    data: () => ({
      loading_block: true,
      loading_tx: true,
      block_headers: {
        block: {label: 'Block', sortable: false},
        txns: {label: 'Txns', sortable: false},
        signer: {label: 'Miner', sortable: false, tdClass: ''},
      },
      blocks: [],
      tx_headers: {
        hash: {label: 'TXID'},
        from: {label: 'From'},
        arrow: {},
        to: {label: 'To'},
        value: {label: 'Value'},
      },
      txs: [],
    }),
    beforeMount () {
      let self = this
      socket.on('new__block', (block) => {
        self.loading_block = true
        if (block) {
          let find = _.find(self.blocks, item => item.number == block.number)
          if (!find) {
            self.blocks.unshift(block)
            self.blocks = self.blocks.slice(0, 5)
          }

          // Refresh txs recent too.
          self.getLatestTxs()
        }
        self.loading_block = false
      })
    },
    mounted () {
      let self = this
      self.getLastestBlocks()
      self.getLatestTxs()
    },
    methods: {
      async getLastestBlocks () {
        let self = this
        let params = {
          filter: 'latest',
          limit: 5,
        }
        let query = this.serializeQuery(params)
        self.loading_block = true
        let {data} = await self.$axios.get('/api/blocks?' + query)
        self.loading_block = false

        self.blocks = data.items
      },

      async getLatestTxs () {
        let self = this
        let params = {
          filter: 'latest',
          limit: 5,
        }

        let query = this.serializeQuery(params)
        self.loading_tx = true
        let {data} = await self.$axios.get('/api/txs?' + query)
        self.loading_tx = false

        self.txs = data.items
      },
    },
  }
</script>

<style scoped>
</style>
