<template>
	<v-container grid-list-md>
		<v-layout row wrap>
			<v-flex sm6>
				<v-card>
					<v-card-title>Recent Blocks</v-card-title>
					<v-container fluid>
						<v-layout row>
							<v-flex>
								<v-data-table
									:loading="loading_block"
									:hide-actions="true"
									:items="blocks"
									:headers="block_headers">
									<template slot="items" slot-scope="props">
										<td>
											<nuxt-link class="address__tag" :to="{name: 'blocks-slug', params: {slug: props.item.number}}">{{ props.item.number }}</nuxt-link>
										</td>
										<td class="text-xs-right">{{ props.item.e_tx }}</td>
										<td>
											<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.signer}}">{{ props.item.signer }}</nuxt-link>
										</td>
									</template>
								</v-data-table>
							</v-flex>
						</v-layout>
					</v-container>
				</v-card>
			</v-flex>

			<v-flex sm6>
				<v-card>
					<v-card-title>Recent Transactions</v-card-title>
					<v-container fluid>
						<v-layout row>
							<v-flex>
								<v-data-table
									:loading="loading_tx"
									:hide-actions="true"
									:items="txs"
									:headers="tx_headers">
									<template slot="items" slot-scope="props">
										<td>
											<nuxt-link class="address__tag" :to="{name: 'txs-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
										</td>
										<td>
											<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.from}}">{{ props.item.from }}</nuxt-link>
										</td>
										<td>
											<v-icon color="green">mdi-arrow-right-bold</v-icon>
										</td>
										<td>
											<nuxt-link v-if="props.item.to" class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.to}}">{{ props.item.to }}</nuxt-link>
											<nuxt-link v-else class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.contractAddress}}">{{ props.item.contractAddress }}</nuxt-link>
										</td>
										<td class="text-xs-right">{{ formatUnit(toEther(props.item.value)) }}</td>
									</template>
								</v-data-table>
							</v-flex>
						</v-layout>
					</v-container>
				</v-card>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
  import axios from '~/plugins/axios'
  import mixin from '~/plugins/mixin'
  import socket from '~/plugins/socket.io'

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
      block_headers: [
        {text: 'Block', value: 'block', sortable: false},
        {text: 'Txns', value: 'txns', sortable: false},
        {text: 'Miner', value: 'signer', sortable: false},
      ],
      blocks: [],
      tx_headers: [
        {text: 'TXID', value: 'hash', sortable: false},
        {text: 'From', value: 'from', sortable: false},
        {value: 'arrow', sortable: false},
        {text: 'To', value: 'to', sortable: false},
        {text: 'Value', value: 'value', sortable: false},
      ],
      txs: [],
    }),
    beforeMount () {
      let self = this
      socket.on('new__block', (block) => {
        console.log(block)
        self.blocks.unshift(block)
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
	.title {
		margin: 30px 0;
	}
</style>
