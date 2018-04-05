<template>
	<v-app id="inspire">
		<v-navigation-drawer
			fixed
			:clipped="$vuetify.breakpoint.lgAndUp"
			app
			v-model="drawer"
		>
			<v-list dense>
				<template v-for="item in items">
					<v-layout
						row
						v-if="item.heading"
						align-center
						:key="item.heading"
					>
						<v-flex xs6>
							<v-subheader v-if="item.heading">
								{{ item.heading }}
							</v-subheader>
						</v-flex>
					</v-layout>
					<v-list-group
						v-else-if="item.children"
						v-model="item.model"
						:key="item.text"
						:prepend-icon="item.model ? item.icon : item['icon-alt']"
						append-icon=""
					>
						<v-list-tile
							router
							:to="item.to"
							slot="activator">
							<v-list-tile-content>
								<v-list-tile-title>
									{{ item.text }}
								</v-list-tile-title>
							</v-list-tile-content>
						</v-list-tile>
						<v-list-tile
							router
							:to="item.to"
							v-for="(child, i) in item.children"
							:key="i"
						>
							<v-list-tile-action v-if="child.icon">
								<v-icon>{{ child.icon }}</v-icon>
							</v-list-tile-action>
							<v-list-tile-content>
								<v-list-tile-title>
									{{ child.text }}
								</v-list-tile-title>
							</v-list-tile-content>
						</v-list-tile>
					</v-list-group>
					<v-list-tile
						v-else
						router
						:to="item.to"
						:key="item.text">
						<v-list-tile-action>
							<v-icon>{{ item.icon }}</v-icon>
						</v-list-tile-action>
						<v-list-tile-content>
							<v-list-tile-title>
								{{ item.text }}
							</v-list-tile-title>
						</v-list-tile-content>
					</v-list-tile>
				</template>
			</v-list>
		</v-navigation-drawer>
		<v-toolbar
			color="blue"
			dark
			app
			:clipped-left="$vuetify.breakpoint.lgAndUp"
			fixed
		>
			<v-toolbar-title style="width: 300px" class="ml-0 pl-3">
				<v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
				<span class="hidden-sm-and-down">Google Contacts</span>
			</v-toolbar-title>
			<v-text-field
				flat
				solo-inverted
				prepend-icon="search"
				label="Search"
				class="hidden-sm-and-down"
			></v-text-field>
			<v-spacer></v-spacer>
			<v-btn icon>
				<v-icon>apps</v-icon>
			</v-btn>
			<v-btn icon>
				<v-icon>notifications</v-icon>
			</v-btn>
			<v-btn icon large>
				<v-avatar size="32px" tile>
					<img
						src="https://vuetifyjs.com/static/doc-images/logo.svg"
						alt="Vuetify"
					>
				</v-avatar>
			</v-btn>
		</v-toolbar>
		<v-content>
			<v-container>
				<v-layout row wrap>
					<v-flex xs12>
						<nuxt/>
					</v-flex>
				</v-layout>
			</v-container>
		</v-content>
	</v-app>
</template>

<script>
  import MyFooter from '~/components/Footer.vue'

  export default {
    components: {
      MyFooter,
    },
    data: () => ({
      drawer: null,
      items: [
	      {
	        icon: 'home',
		      text: 'Home',
		      to: '/'
	      },
        {
          text: 'All Account',
          to: '/accounts'
        },
        {
          icon: 'keyboard_arrow_up',
          'icon-alt': 'keyboard_arrow_down',
          text: 'Blocks',
          to: '/blocks',
//          children: [
//            {icon: 'add', text: 'Create label'},
//          ],
        },
      ],
    }),
    props: {
      source: String,
    },
  }
</script>

<style>
</style>
