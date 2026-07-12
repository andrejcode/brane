import { en } from './en'

export type MessageKey = keyof typeof en

// Every locale must define exactly the keys English does; a missing or misspelled
// key becomes a compile error in that locale's catalog.
export type Messages = Record<MessageKey, string>
