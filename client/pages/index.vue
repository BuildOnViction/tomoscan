<template>
	<section>
		<b-row class="mb-2">
			<b-col sm="6" class="mb-3">
				<b-card title="Recent Blocks">
					<b-table
						striped
						hover
						small
						responsive
						:items="blocks"
						:fields="block_headers" responsive>
						<template slot="block" slot-scope="props">
							<transition name="fade">
								<nuxt-link :to="{name: 'blocks-slug', params: {slug: props.item.number}}">{{ props.item.number }}</nuxt-link>
							</transition>
						</template>

						<template slot="txns" slot-scope="props">{{ props.item.e_tx }}</template>

						<template slot="signer" slot-scope="props">
							<transition name="fade">
								<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.signer}}">{{ props.item.signer }}</nuxt-link>
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
						small
						:items="txs"
						:fields="tx_headers">
						<template slot="hash" slot-scope="props">
							<nuxt-link class="address__tag" :to="{name: 'txs-slug', params: {slug: props.item.hash}}">{{ props.item.hash }}</nuxt-link>
						</template>

						<template slot="arrow" slot-scope="props">
							<i class="fa fa-arrow-right text-success"></i>
						</template>

						<template slot="from" slot-scope="props">
							<nuxt-link class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.from}}">
								<i v-if="props.item.from_id && props.item.from_id.isContract" class="fa fa-file-text-o mr-1 pull-left"></i>
								{{ props.item.from }}
							</nuxt-link>
						</template>

						<template slot="to" slot-scope="props">
							<nuxt-link v-if="props.item.to" class="address__tag" :to="{name: 'address-slug', params: {slug: props.item.to}}">
								<i v-if="props.item.to_id && props.item.to_id.isContract" class="fa fa-file-text-o mr-1"></i>
								{{ props.item.to }}
							</nuxt-link>
						</template>

						<template slot="value" slot-scope="props">
							{{ formatUnit(toEther(props.item.value)) }}
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
        arrow: {class: 'text-center'},
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

      // Init breadcrumbs props.
      this.$store.commit('breadcrumb/setItems', {name: 'index', to: {name: 'index'}})

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
