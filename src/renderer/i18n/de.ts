import type { Messages } from './types'

export const de: Messages = {
  'sidebar.recentChats': 'Letzte Chats',
  'sidebar.search': 'Chats durchsuchen',
  'sidebar.noMatch': 'Keine Chats stimmen mit „{query}“ überein.',
  'sidebar.noChats': 'Noch keine Chats',
  'sidebar.historyUnavailable': 'Der Chatverlauf ist nicht verfügbar.',
  'sidebar.untitledChat': 'Chat ohne Titel',
  'sidebar.chatActions': 'Chat-Aktionen',
  'sidebar.deleteChatConfirmTitle': 'Chat löschen?',
  'sidebar.deleteChatConfirmMessage':
    '„{title}“ und alle zugehörigen Nachrichten werden endgültig gelöscht.',
  'sidebar.openChatFailed':
    'Der Chat konnte nicht geöffnet werden. Bitte versuche es erneut.',
  'sidebar.deleteChatFailed':
    'Der Chat konnte nicht gelöscht werden. Bitte versuche es erneut.',
  'sidebar.renameChatFailed':
    'Der Chat konnte nicht umbenannt werden. Bitte versuche es erneut.',
  'sidebar.modelMissing':
    'Dieses Modell liegt nicht mehr in deinem Modellordner.',
  'sidebar.modelReplaced':
    'Diese Modelldatei hat sich seit dem Erstellen des Chats geändert.',

  'header.toggleSidebar': 'Seitenleiste umschalten',
  'header.selectModel': 'Modell auswählen',
  'header.openSettings': 'Einstellungen öffnen',
  'header.loadingModel': 'Modell wird geladen',

  'chat.newChat': 'Neuer Chat',
  'chat.inputPlaceholder': 'Frag mich etwas',
  'chat.sendMessage': 'Nachricht senden',
  'chat.stopGenerating': 'Generierung stoppen',
  'chat.scrollToBottom': 'Nach unten scrollen',
  'chat.selectModelAlert':
    'Bitte wähle ein Modell aus, um eine Nachricht zu senden.',
  'chat.sendFailed':
    'Deine Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.',
  'chat.historyUnavailable':
    'Der Chatverlauf ist nicht verfügbar, dieses Gespräch wird nicht gespeichert.',
  'chat.readOnlyModelMissing':
    'Dieser Chat kann nur gelesen werden, weil sein Modell nicht mehr verfügbar ist.',
  'chat.thinking': 'Denkt nach',
  'chat.copyResponse': 'Antwort kopieren',
  'chat.copyCode': 'Code kopieren',
  'chat.copied': 'Kopiert',
  'chat.copyFailed': 'Fehlgeschlagen',
  'chat.openExternalLinkTitle': 'Externen Link öffnen?',
  'chat.openExternalLinkMessage': '{url} im Standardbrowser öffnen?',
  'chat.openExternalLinkConfirm': 'Link öffnen',
  'chat.openExternalLinkFailed':
    'Der Link konnte nicht geöffnet werden. Bitte versuche es erneut.',
  'chat.contextUsed': '{used} / {size} Tokens verwendet',
  'chat.contextUsageSummary':
    '{percentage}% des Kontexts verwendet. {used} / {size} Tokens. {remaining} Tokens verbleiben.',
  'chat.contextLimitReached':
    'Kontextlimit erreicht. {used} / {size} Tokens verwendet.',
  'chat.contextUsageUnavailable':
    'Die Kontextnutzung ist noch nicht verfügbar.',
  'chat.notAvailable': 'k. A.',
  'chat.generatedTokens': 'Generierte Tokens',
  'chat.tokenCount': '{count} Tokens',
  'chat.tokensPerSecond': 'Tokens pro Sekunde',
  'chat.tokenRate': '{rate} Tok./s',
  'chat.timeToFirstToken': 'Zeit bis zum ersten Token',
  'chat.stopReason': 'Stoppgrund',
  'chat.stopReason.abort': 'Gestoppt',
  'chat.stopReason.maxTokens': 'Tokenlimit',
  'chat.stopReason.eogToken': 'End-Token',
  'chat.stopReason.stopGenerationTrigger': 'Stoppsequenz',
  'chat.stopReason.functionCalls': 'Funktionsaufruf',
  'chat.stopReason.customStopTrigger': 'Eigener Stopp',

  'models.title': 'Modelle',
  'models.search': 'Modelle suchen',
  'models.close': 'Modelle schließen',
  'models.emptyBeforeExtension': 'Keine Modelle gefunden. Füge ',
  'models.emptyBetween': '-Modelldateien in ',
  'models.emptyAfterPath': ' hinzu, um loszulegen.',
  'models.noMatch': 'Keine Modelle passen zu „{query}“.',
  'models.stopLoading': 'Laden stoppen',
  'models.unload': 'Modell entladen',
  'models.loadFailed':
    'Das Modell konnte nicht geladen werden. Bitte versuche es erneut.',
  'models.unloadFailed':
    'Das Modell konnte nicht entladen werden. Bitte versuche es erneut.',

  'settings.title': 'Einstellungen',
  'settings.sections': 'Einstellungsbereiche',
  'settings.close': 'Einstellungen schließen',
  'settings.tabGeneral': 'Allgemein',
  'settings.tabAppearance': 'Darstellung',
  'settings.tabShortcuts': 'Tastenkürzel',

  'general.loadModelOnStartup': 'Ausgewähltes Modell beim Start laden',
  'general.loadModelOnStartupDescription':
    'Lädt das ausgewählte Modell automatisch, wenn Brane startet.',
  'general.sendWith': 'Mit {shortcut}+Enter senden',
  'general.sendWithDescription':
    'Verwende {shortcut}+Enter, um eine Nachricht zu senden. Enter fügt eine neue Zeile ein.',
  'general.language': 'Sprache',
  'general.languageDescription':
    'Wähle die Sprache, die in der App verwendet wird.',
  'general.chats': 'Chats',
  'general.deleteAllChats': 'Alle Chats löschen',
  'general.deleteAllChatsDescription':
    'Alle Chats und ihre Nachrichten dauerhaft löschen.',
  'general.deleteAllChatsConfirmTitle': 'Alle Chats löschen?',
  'general.deleteAllChatsConfirmMessage':
    'Alle Chats und Nachrichten werden endgültig gelöscht. Dies kann nicht rückgängig gemacht werden.',
  'general.deleteAllChatsFailed':
    'Die Chats konnten nicht gelöscht werden. Bitte versuche es erneut.',
  'general.logs': 'Protokolle',
  'general.openLogs': 'Protokolle öffnen',
  'general.openLogsDescription': 'Öffne den Protokollordner im Dateimanager.',
  'general.openLogsFailed':
    'Der Protokollordner konnte nicht geöffnet werden. Bitte versuche es erneut.',
  'general.open': 'Öffnen',
  'general.deleteLogs': 'Protokolle löschen',
  'general.deleteLogsDescription':
    'Alle Protokolldateien dauerhaft aus dem Protokollordner löschen.',
  'general.deleteLogsConfirmTitle': 'Protokolle löschen?',
  'general.deleteLogsConfirmMessage':
    'Alle Protokolldateien im Protokollordner werden endgültig gelöscht.',
  'general.deleteLogsFailed':
    'Die Protokolle konnten nicht gelöscht werden. Bitte versuche es erneut.',
  'general.deleted': 'Gelöscht',
  'general.rename': 'Umbenennen',
  'general.delete': 'Löschen',
  'general.cancel': 'Abbrechen',
  'general.reset': 'Zurücksetzen',
  'general.restored': 'Zurückgesetzt',

  'appearance.theme': 'Design',
  'appearance.dark': 'Dunkel',
  'appearance.light': 'Hell',
  'appearance.system': 'System',
  'appearance.fontSize': 'Nachrichtenschriftgröße',
  'appearance.increaseFontSize': 'Nachrichtenschrift vergrößern',
  'appearance.decreaseFontSize': 'Nachrichtenschrift verkleinern',
  'appearance.fontSizeDescription': 'Ändert die Schriftgröße der Nachrichten.',
  'appearance.statistics': 'Statistiken anzeigen',
  'appearance.statisticsDescription':
    'Zeigt Generierungsstatistiken und die aktuelle Kontextnutzung an.',
  'appearance.statisticsSaveFailed':
    'Die Statistikeinstellung konnte nicht gespeichert werden. Bitte erneut versuchen.',
  'appearance.messageDates': 'Nachrichtendaten anzeigen',
  'appearance.messageDatesDescription':
    'Zeigt Datum und Uhrzeit beim Bewegen des Mauszeigers über eine Nachricht an.',
  'appearance.messageDatesSaveFailed':
    'Die Einstellung für Nachrichtendaten konnte nicht gespeichert werden. Bitte versuche es erneut.',
  'appearance.pointerCursor': 'Zeiger-Cursor',
  'appearance.pointerCursorDescription':
    'Zeigt beim Bewegen über interaktive Steuerelemente einen Zeiger-Cursor an.',
  'appearance.pointerCursorSaveFailed':
    'Die Zeiger-Cursor-Einstellung konnte nicht gespeichert werden. Bitte versuche es erneut.',

  'shortcuts.resetLabel': 'Standard-Tastenkürzel wiederherstellen',
  'shortcuts.resetFailed':
    'Die Tastenkürzel konnten nicht zurückgesetzt werden. Bitte versuche es erneut.',
  'shortcuts.saveFailed':
    'Dieses Tastenkürzel konnte nicht gespeichert werden. Bitte versuche es erneut.',
  'shortcuts.resetConfirmTitle': 'Tastenkürzel zurücksetzen?',
  'shortcuts.resetConfirmMessage':
    'Alle Tastenkürzel erhalten wieder ihre Standardbelegung.',
  'shortcuts.recording': 'Tasten drücken …',
  'shortcuts.conflict': 'Dieses Tastenkürzel wird bereits verwendet.',
  'shortcuts.toggleSettings': 'Einstellungen ein-/ausblenden',
  'shortcuts.toggleModels': 'Modellliste ein-/ausblenden',
  'shortcuts.newChat': 'Neuen Chat starten',

  'alert.error': 'Fehler',
  'alert.success': 'Erfolg',
  'alert.info': 'Information',
  'alert.close': 'Hinweis schließen',
}
