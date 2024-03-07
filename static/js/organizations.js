const organizationsData = [
  {
    name: 'SPARC',
    id: 'N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0',
    logo: new URL('@/assets/logo-sparc-wave-primary.svg', import.meta.url).href
  },
  {
    name: 'RE-JOIN',
    id: 'N:organization:f08e188e-2316-4668-ae2c-8a20dc88502f',
    logo: new URL('@/assets/rejoin.jpg', import.meta.url).href
  },
  {
    name: 'HEAL PRECISION',
    id: 'N:organization:98d6e84c-9a27-48f8-974f-93c0cca15aae',
    logo: new URL('@/assets/precision.jpg', import.meta.url).href
  }
]

export const getOrganizationInfo = id => {
  const org = organizationsData.find(org => org.id == id)
  return org ? org : null
}

export const getOrganizationStatus = org => {
  if (org.isOwner)
    return 'Owner Access'
  else if (org.isAdmin)
    return 'Admin Access'
  else if (org.isGuest)
    return 'Guest Access'
  else
    return 'Read Access'
}