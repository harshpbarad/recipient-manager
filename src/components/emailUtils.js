export function extractDomain(email) {
    return email.split('@')[1]
}

export function groupByDomain(recipients) {
    return recipients.reduce((acc, curr) => {
        const domain = extractDomain(curr.email)
        acc[domain] = acc[domain] || []
        acc[domain].push(curr.email)
        return acc
    }, {})
}

export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}
