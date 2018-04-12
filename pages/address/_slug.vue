<template>
	<div>
		<v-card flat>
			<div v-if="address" class="table__overflow">
				<table class="datatable table">
					<thead>
					<tr>
						<th colspan="2">Overview</th>
					</tr>
					</thead>
					<tbody>
					<tr>
						<td>ETH Balance:</td>
						<td>{{ toEther(address.balance) }}</td>
					</tr>
					<tr>
						<td>No Of Transactions:</td>
						<td>{{ address.﻿transactionCount }} txns</td>
					</tr>
					</tbody>
				</table>
			</div>
		</v-card>
		<v-tabs>
			<v-tab>Transactions</v-tab>
			<v-tab>Token Transfers</v-tab>
			<v-tab-item>
			</v-tab-item>
		</v-tabs>
	</div>
</template>
<script>
  export default {}
</script>