import type { Messages } from './types'

export const hr: Messages = {
  'sidebar.recentChats': 'Nedavni razgovori',
  'sidebar.noChats': 'Još nema razgovora',
  'sidebar.historyUnavailable': 'Povijest razgovora nije dostupna.',
  'sidebar.untitledChat': 'Razgovor bez naslova',
  'sidebar.chatActions': 'Radnje razgovora',
  'sidebar.deleteChatConfirmTitle': 'Izbrisati razgovor?',
  'sidebar.deleteChatConfirmMessage':
    '„{title}“ i sve njegove poruke bit će trajno izbrisani.',
  'sidebar.deleteChatConfirm': 'Izbriši',
  'sidebar.openChatFailed':
    'Otvaranje razgovora nije uspjelo. Pokušaj ponovno.',
  'sidebar.deleteChatFailed':
    'Brisanje razgovora nije uspjelo. Pokušaj ponovno.',
  'sidebar.renameChatFailed':
    'Preimenovanje razgovora nije uspjelo. Pokušaj ponovno.',
  'sidebar.modelMissing': 'Ovaj model više nije u tvojoj mapi s modelima.',
  'sidebar.modelReplaced':
    'Datoteka ovog modela promijenila se nakon stvaranja razgovora.',

  'header.toggleSidebar': 'Prikaži/sakrij bočnu traku',
  'header.newChat': 'Novi razgovor',
  'header.selectModel': 'Odaberi model',
  'header.openSettings': 'Otvori postavke',
  'header.loadingModel': 'Učitavanje modela',

  'chat.inputPlaceholder': 'Pitaj bilo što',
  'chat.sendMessage': 'Pošalji poruku',
  'chat.stopGenerating': 'Zaustavi generiranje',
  'chat.scrollToBottom': 'Pomakni na dno',
  'chat.selectModelAlert': 'Odaberi model za slanje poruke.',
  'chat.sendFailed': 'Slanje poruke nije uspjelo. Pokušaj ponovno.',
  'chat.historyUnavailable':
    'Povijest razgovora nije dostupna, pa ovaj razgovor neće biti sačuvan.',
  'chat.readOnlyModelMissing':
    'Ovaj razgovor može se samo čitati jer njegov model više nije dostupan.',
  'chat.thinking': 'Razmišlja',
  'chat.copy': 'Kopiraj',
  'chat.copied': 'Kopirano',
  'chat.copyFailed': 'Neuspješno',

  'models.title': 'Modeli',
  'models.search': 'Pretraži modele',
  'models.close': 'Zatvori modele',
  'models.emptyBeforeExtension': 'Nema pronađenih modela. Dodaj ',
  'models.emptyBetween': ' datoteke modela u ',
  'models.emptyAfterPath': ' za početak.',
  'models.noMatch': 'Nijedan model ne odgovara upitu „{query}”.',
  'models.stopLoading': 'Zaustavi učitavanje',
  'models.unload': 'Isključi model',
  'models.loadFailed': 'Učitavanje modela nije uspjelo. Pokušaj ponovno.',
  'models.unloadFailed': 'Isključivanje modela nije uspjelo. Pokušaj ponovno.',

  'settings.title': 'Postavke',
  'settings.sections': 'Odjeljci postavki',
  'settings.close': 'Zatvori postavke',
  'settings.tabGeneral': 'Općenito',
  'settings.tabAppearance': 'Izgled',
  'settings.tabShortcuts': 'Prečaci',

  'general.sendWith': 'Šalji s {shortcut}+Enter',
  'general.sendWithDescription':
    'Koristi {shortcut}+Enter za slanje poruke. Enter dodaje novi redak.',
  'general.language': 'Jezik',
  'general.languageDescription': 'Odaberi jezik koji se koristi u aplikaciji.',
  'general.logs': 'Zapisi',
  'general.openLogs': 'Otvori zapise',
  'general.openLogsDescription':
    'Otvori mapu sa zapisima u pregledniku datoteka.',
  'general.openLogsFailed':
    'Otvaranje mape sa zapisima nije uspjelo. Pokušaj ponovno.',
  'general.open': 'Otvori',
  'general.deleteLogs': 'Izbriši zapise',
  'general.deleteLogsDescription':
    'Trajno izbriši sve datoteke zapisa iz mape sa zapisima.',
  'general.deleteLogsConfirmTitle': 'Izbrisati zapise?',
  'general.deleteLogsConfirmMessage':
    'Sve datoteke zapisa u mapi sa zapisima bit će trajno izbrisane.',
  'general.deleteLogsFailed': 'Brisanje zapisa nije uspjelo. Pokušaj ponovno.',
  'general.deleted': 'Izbrisano',
  'general.rename': 'Preimenuj',
  'general.delete': 'Izbriši',
  'general.reset': 'Vrati',
  'general.restored': 'Vraćeno',

  'appearance.theme': 'Tema',
  'appearance.dark': 'Tamna',
  'appearance.light': 'Svijetla',
  'appearance.system': 'Sustav',
  'appearance.fontSize': 'Veličina teksta poruka',
  'appearance.increaseFontSize': 'Povećaj veličinu teksta poruka',
  'appearance.decreaseFontSize': 'Smanji veličinu teksta poruka',
  'appearance.fontSizeDescription': 'Mijenja veličinu teksta poruka.',

  'shortcuts.resetLabel': 'Vrati zadane prečace',
  'shortcuts.resetFailed':
    'Vraćanje zadanih prečaca nije uspjelo. Pokušaj ponovno.',
  'shortcuts.saveFailed': 'Spremanje prečaca nije uspjelo. Pokušaj ponovno.',
  'shortcuts.resetConfirmTitle': 'Vratiti zadane prečace?',
  'shortcuts.resetConfirmMessage':
    'Svi se prečaci vraćaju na zadane kombinacije tipki.',
  'shortcuts.recording': 'Pritisni tipke…',
  'shortcuts.conflict': 'Taj se prečac već koristi.',
  'shortcuts.toggleSettings': 'Otvori ili zatvori postavke',
  'shortcuts.toggleModels': 'Otvori ili zatvori popis modela',
  'shortcuts.toggleSidebar': 'Prikaži ili sakrij bočnu traku',
  'shortcuts.newChat': 'Započni novi razgovor',
  'shortcuts.stopGeneration': 'Zaustavi generiranje',

  'confirm.cancel': 'Odustani',

  'alert.error': 'Pogreška',
  'alert.success': 'Uspjeh',
  'alert.info': 'Informacija',
  'alert.close': 'Zatvori obavijest',
}
