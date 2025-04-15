<template>
  <a-row gutter="24">
    <a-col :xs="24" :md="12">
      <a-card title="Available recipients">
        <a-auto-complete
          v-model:value="searchQuery"
          :options="autocompleteOptions"
          :filter-option="false"
          placeholder="Search by company or email"
          @select="handleAutocompleteSelect"
          @search="handleSearch"
          style="width: 100%; margin-bottom: 16px"
        >
          <template #option="{ value }">
            <span>{{ value }}</span>
          </template>
        </a-auto-complete>

        <a-collapse v-model:activeKey="openDomains">
          <a-collapse-panel
            v-for="group in filteredAvailableDomains"
            :key="group.domain"
            :header="group.domain"
          >
            <a-button
              type="link"
              @click="selectDomain(group.domain)"
              style="padding: 0; margin-bottom: 8px"
            >
              Select all
            </a-button>
            <div v-for="email in group.emails" :key="email">
              <a-tag @click="selectRecipient(email)" style="margin: 4px; cursor: pointer">
                {{ email }}
              </a-tag>
            </div>
          </a-collapse-panel>
        </a-collapse>

        <div v-for="email in ungroupedAvailableEmails" :key="email">
          <a-tag @click="selectRecipient(email)" style="margin: 4px; cursor: pointer">
            {{ email }}
          </a-tag>
        </div>
      </a-card>
    </a-col>

    <a-col :xs="24" :md="12">
      <a-card title="Selected recipients">
        <a-collapse accordion>
          <a-collapse-panel key="companies" header="company recipients">
            <div
              v-for="(emails, domain) in selectedByCompany"
              :key="domain"
              style="margin-bottom: 12px"
            >
              <strong>{{ domain }}</strong>
              <a-button
                type="link"
                @click="deselectDomain(domain)"
                danger
                style="padding: 0; font-size: 12px"
              >
                Remove all
              </a-button>
              <div>
                <a-tag
                  v-for="email in emails"
                  :key="email"
                  closable
                  @close="deselectRecipient(email)"
                  style="margin: 4px"
                >
                  {{ email }}
                </a-tag>
              </div>
            </div>
          </a-collapse-panel>

          <a-collapse-panel key="individuals" header="email recipients">
            <a-tag
              v-for="email in selectedIndividuals"
              :key="email"
              closable
              @close="deselectRecipient(email)"
              style="margin: 4px"
            >
              {{ email }}
            </a-tag>
          </a-collapse-panel>
        </a-collapse>
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup>
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'

const rawRecipients = ref([
  { email: 'ann@timescale.com', isSelected: false },
  { email: 'bob@timescale.com', isSelected: false },
  { email: 'brian@qwerty.com', isSelected: true },
  { email: 'james@qwerty.com', isSelected: false },
  { email: 'jane@awesome.com', isSelected: false },
  { email: 'kate@qwerty.com', isSelected: true },
  { email: 'mike@hello.com', isSelected: true },
])

const searchQuery = ref('')
const openDomains = ref([])

const filteredAvailableDomains = computed(() => {
  const domainMap = {}

  rawRecipients.value.forEach(({ email, isSelected }) => {
    if (isSelected) return
    const domain = getDomain(email)
    if (!domainMap[domain]) domainMap[domain] = []
    domainMap[domain].push(email)
  })

  const filtered = []
  Object.entries(domainMap).forEach(([domain, emails]) => {
    const match = !searchQuery.value || domain.includes(searchQuery.value.toLowerCase())
    if (match) filtered.push({ domain, emails })
  })

  return filtered
})

const ungroupedAvailableEmails = computed(() => {
  const domainGrouped = filteredAvailableDomains.value.flatMap((g) => g.emails)
  return rawRecipients.value
    .filter((r) => !r.isSelected && !domainGrouped.includes(r.email))
    .filter((r) => !searchQuery.value || r.email.includes(searchQuery.value.toLowerCase()))
    .map((r) => r.email)
})

const selectedByCompany = computed(() => {
  const grouped = {}
  rawRecipients.value
    .filter((r) => r.isSelected)
    .forEach(({ email }) => {
      const domain = getDomain(email)
      if (!grouped[domain]) grouped[domain] = []
      grouped[domain].push(email)
    })

  return Object.fromEntries(Object.entries(grouped).filter(([, emails]) => emails.length > 1))
})

const selectedIndividuals = computed(() => {
  const groupedEmails = Object.values(selectedByCompany.value).flat()
  return rawRecipients.value
    .filter((r) => r.isSelected && !groupedEmails.includes(r.email))
    .map((r) => r.email)
})

function getDomain(email) {
  return email.split('@')[1]
}

function selectRecipient(email) {
  const item = rawRecipients.value.find((r) => r.email === email)
  if (item) item.isSelected = true
}

function deselectRecipient(email) {
  const item = rawRecipients.value.find((r) => r.email === email)
  if (item) item.isSelected = false
}

function selectDomain(domain) {
  rawRecipients.value.forEach((r) => {
    if (!r.isSelected && getDomain(r.email) === domain) {
      r.isSelected = true
    }
  })
}

function deselectDomain(domain) {
  rawRecipients.value.forEach((r) => {
    if (r.isSelected && getDomain(r.email) === domain) {
      r.isSelected = false
    }
  })
}

function handleSearch(query) {
  searchQuery.value = query
}

function handleAutocompleteSelect(value) {
  if (value.includes('@')) {
    const exists = rawRecipients.value.find((r) => r.email === value)
    if (exists) {
      selectRecipient(value)
    } else if (isValidEmail(value)) {
      rawRecipients.value.push({ email: value, isSelected: true })
    } else {
      message.error('Invalid email format')
    }
  } else {
    selectDomain(value)
  }
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const autocompleteOptions = computed(() => {
  const options = []

  // company domains
  const domains = [...new Set(rawRecipients.value.map((r) => getDomain(r.email)))].filter((d) =>
    d.includes(searchQuery.value.toLowerCase()),
  )
  domains.forEach((domain) => {
    options.push({ value: domain })
  })

  // emails
  rawRecipients.value
    .filter((r) => r.email.includes(searchQuery.value.toLowerCase()))
    .forEach((r) => options.push({ value: r.email }))

  // custom email entry
  if (searchQuery.value.includes('@') && isValidEmail(searchQuery.value)) {
    options.push({ value: searchQuery.value })
  }

  return options
})
</script>
