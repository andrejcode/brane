import type { Messages } from './types'

export const hr: Messages = {
  'sidebar.chats': 'Razgovori',
  'sidebar.noChats': 'Još nema razgovora',
  'sidebar.historyUnavailable': 'Povijest razgovora nije dostupna.',
  'sidebar.untitledChat': 'Razgovor bez naslova',
  'sidebar.deleteChat': 'Izbriši razgovor',
  'sidebar.openChatFailed':
    'Otvaranje razgovora nije uspjelo. Pokušaj ponovno.',
  'sidebar.deleteChatFailed':
    'Brisanje razgovora nije uspjelo. Pokušaj ponovno.',
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
  'general.open': 'Otvori',
  'general.deleteLogs': 'Izbriši zapise',
  'general.deleteLogsDescription':
    'Trajno izbriši sve datoteke zapisa iz mape sa zapisima.',
  'general.delete': 'Izbriši',

  'appearance.theme': 'Tema',
  'appearance.dark': 'Tamna',
  'appearance.light': 'Svijetla',
  'appearance.system': 'Sustav',

  'shortcuts.resetLabel': 'Vrati zadane prečace',
  'shortcuts.reset': 'Vrati',
  'shortcuts.recording': 'Pritisni tipke…',
  'shortcuts.conflict': 'Taj se prečac već koristi.',
  'shortcuts.toggleSettings': 'Otvori ili zatvori postavke',
  'shortcuts.toggleModels': 'Otvori ili zatvori popis modela',
  'shortcuts.toggleSidebar': 'Prikaži ili sakrij bočnu traku',
  'shortcuts.newChat': 'Započni novi razgovor',

  'alert.error': 'Pogreška',
  'alert.success': 'Uspjeh',
  'alert.info': 'Informacija',
  'alert.close': 'Zatvori obavijest',
}
