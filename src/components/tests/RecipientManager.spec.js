import { mount } from '@vue/test-utils'
import RecipientManager from '../RecipientManager.vue'

describe('RecipientManager.vue', () => {
    it('renders available recipients grouped by domain', () => {
        const wrapper = mount(RecipientManager)

        expect(wrapper.text()).toContain('timescale.com')
        expect(wrapper.text()).toContain('qwerty.com')

        expect(wrapper.text()).toContain('ann@timescale.com')
    })

    it('adds a custom valid email through autocomplete', async () => {
        const wrapper = mount(RecipientManager)

        const customEmail = 'newuser@mydomain.com'
        await wrapper.vm.handleAutocompleteSelect(customEmail)

        const exists = wrapper.vm.rawRecipients.find(r => r.email === customEmail)
        expect(exists).toBeTruthy()
        expect(exists.isSelected).toBe(true)
    })

    it('selects all recipients in a domain', async () => {
        const wrapper = mount(RecipientManager)

        await wrapper.vm.selectDomain('awesome.com')

        const selected = wrapper.vm.rawRecipients.filter(
            r => r.isSelected && r.email.endsWith('@awesome.com')
        )

        expect(selected.length).toBeGreaterThan(0)
    })
})
