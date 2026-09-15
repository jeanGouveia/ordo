import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'ordem-simples-app-ojv72jqn',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_hOriQNPLbCTVIaPuZRkf0rZzYs-6NqPk',
  authRequired: true,
  auth: { mode: 'managed' },
})
