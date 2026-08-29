import type { Messages } from './types'

export const de: Messages = {
  'sidebar.chats': 'Chats',
  'sidebar.noChats': 'Noch keine Chats',
  'sidebar.historyUnavailable': 'Der Chatverlauf ist nicht verfügbar.',
  'sidebar.untitledChat': 'Chat ohne Titel',
  'sidebar.chatActions': 'Chat-Aktionen',
  'sidebar.deleteChatConfirmTitle': 'Chat löschen?',
  'sidebar.deleteChatConfirmMessage':
    '„{title}“ und alle zugehörigen Nachrichten werden endgültig gelöscht.',
  'sidebar.deleteChatConfirm': 'Löschen',
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
  'header.newChat': 'Neuer Chat',
  'header.selectModel': 'Modell auswählen',
  'header.openSettings': 'Einstellungen öffnen',
  'header.loadingModel': 'Modell wird geladen',

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
  'chat.copy': 'Kopieren',
  'chat.copied': 'Kopiert',
  'chat.copyFailed': 'Fehlgeschlagen',

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

  'general.sendWith': 'Mit {shortcut}+Enter senden',
  'general.sendWithDescription':
    'Verwende {shortcut}+Enter, um eine Nachricht zu senden. Enter fügt eine neue Zeile ein.',
  'general.language': 'Sprache',
  'general.languageDescription':
    'Wähle die Sprache, die in der App verwendet wird.',
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
  'shortcuts.toggleSettings': 'Einstellungen öffnen oder schließen',
  'shortcuts.toggleModels': 'Modellliste öffnen oder schließen',
  'shortcuts.toggleSidebar': 'Seitenleiste ein- oder ausblenden',
  'shortcuts.newChat': 'Neuen Chat starten',
  'shortcuts.stopGeneration': 'Generierung stoppen',

  'confirm.cancel': 'Abbrechen',

  'alert.error': 'Fehler',
  'alert.success': 'Erfolg',
  'alert.info': 'Information',
  'alert.close': 'Hinweis schließen',
}
