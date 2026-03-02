import Store from 'electron-store'
import { AppSettings, Template } from '../shared/types'

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl-001',
    name: 'Listing Introduction',
    body: 'Hi {name}, this is [Agent] from [Agency]. I have a new property listing that I think would be perfect for you. It\'s a beautifully maintained unit in a prime location. Would you like to hear more details or schedule a viewing? Let me know at your convenience.',
    category: 'introduction'
  },
  {
    id: 'tpl-002',
    name: 'Follow-Up',
    body: 'Hi {name}, this is [Agent] from [Agency]. I wanted to follow up on our recent conversation about the property. Have you had a chance to consider it? I\'m happy to answer any questions or arrange another viewing if needed. Looking forward to hearing from you.',
    category: 'follow-up'
  },
  {
    id: 'tpl-003',
    name: 'Viewing Confirmation',
    body: 'Hi {name}, just confirming your viewing appointment for tomorrow. The property is located at [Address]. Please bring a valid Emirates ID. I\'ll meet you at the building entrance. Feel free to reach out if you need directions.',
    category: 'viewing'
  },
  {
    id: 'tpl-004',
    name: 'Viewing Reminder',
    body: 'Hi {name}, a friendly reminder about your property viewing today at [Time]. The address is [Address]. If anything comes up and you need to reschedule, please let me know as soon as possible. See you there!',
    category: 'reminder'
  },
  {
    id: 'tpl-005',
    name: 'New Listing Alert',
    body: 'Hi {name}, I just came across a new listing that matches what you\'re looking for. It\'s a [Type] in [Area] with [Features]. The asking price is [Price]. Shall I send you the full details and photos? Happy to arrange a viewing this week.',
    category: 'alert'
  },
  {
    id: 'tpl-006',
    name: 'Thank You',
    body: 'Hi {name}, thank you for taking the time to view the property today. I hope it met your expectations. Please don\'t hesitate to reach out if you have any questions or would like to discuss the next steps. It was a pleasure meeting you.',
    category: 'thank-you'
  }
]

export const store = new Store<AppSettings>({
  defaults: {
    clipboardEnabled: true,
    hotkeysEnabled: true,
    dialHotkey: 'CommandOrControl+Shift+D',
    whatsappHotkey: 'CommandOrControl+Shift+W',
    whatsappMode: 'web',
    templates: DEFAULT_TEMPLATES
  }
})
