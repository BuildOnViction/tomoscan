<template>
    <section
        v-if="smartContract">
        <h5 class="mb-4">
            <i class="fa fa-check-circle-o text-success mr-2"/>Contract Source Code Verified
        </h5>
        <b-row class="mb-3">
            <b-col sm="6">
                <b-table
                    :items="[
                        {key: 'Contract Name', value: smartContract.contractName},
                        {key: 'Compiler Version', value: smartContract.compiler},
                    ]"
                    class="tomo-table tomo-table--verified-contract"
                    thead-class="d-none"/>
            </b-col>

            <b-col sm="6">
                <b-table
                    :items="[
                        {key: 'Verified At', value: $moment(smartContract.createdAt).format('lll')},
                        {
                            key: 'Optimization Enabled',
                            value: smartContract.optimization ? 'Yes' : 'No'
                        },
                    ]"
                    class="tomo-table tomo-table--verified-contract"
                    thead-class="d-none" />
            </b-col>
        </b-row>

        <b-form-group>
            <label>Contract Source Code<i class="fa fa-code ml-1"/></label>
            <div
                id="code-actions--source"
                class="code-actions">
                <button
                    v-clipboard="smartContract.sourceCode"
                    class="btn btn-sm mr-2 code-actions__copy"
                    @success="copySourceCode"><i class="fa fa-copy mr-1" />Copy</button>
            </div>
            <no-ssr placeholder="Codemirror Loading...">
                <codemirror
                    ref="tomoCmSourceCode"
                    :value="smartContract.sourceCode" />
            </no-ssr>
        </b-form-group>

        <b-form-group>
            <label>Contract ABI<i class="fa fa-cogs ml-1"/></label>
            <div
                id="code-actions--abi"
                class="code-actions">
                <button
                    v-clipboard="smartContract.abiCode"
                    class="btn btn-sm mr-2 code-actions__copy"
                    @success="copySourceCode"><i class="fa fa-copy mr-1" />Copy</button>
            </div>
            <no-ssr placeholder="Codemirror Loading...">
                <codemirror
                    ref="tomoCmAbiCode"
                    :value="smartContract.abiCode"
                    :options="{mode:'application/ld+json',styleActiveLine:false}" />
            </no-ssr>
        </b-form-group>

        <b-form-group>
            <label>Contract Creation Code</label>
            <div
                id="code-actions--creation"
                class="code-actions">
                <button
                    v-clipboard="address.code"
                    class="btn btn-sm mr-2 code-actions__copy"
                    @success="copySourceCode"><i class="fa fa-copy mr-1" />Copy</button>
            </div>
            <no-ssr placeholder="Codemirror Loading...">
                <codemirror
                    ref="tomoCmCode"
                    :value="address.code"
                    :options="{mode:'application/ld+json',styleActiveLine:false}" />
            </no-ssr>
        </b-form-group>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import ReadMore from '~/components/ReadMore'

export default {
    components: {
        ReadMore
    },
    mixins: [mixin],
    props: {
        token: {
            type: String,
            default: ''
        },
        address: {
            type: Object,
            default: () => {
                return {}
            }
        },
        smartcontract: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data () {
        return {
            smartContract: null
        }
    },
    created () {
        this.smartContract = this.smartcontract
    }
}
</script>
