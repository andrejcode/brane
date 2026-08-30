import type { Messages } from './types'

export const sr: Messages = {
  'sidebar.recentChats': 'Недавни разговори',
  'sidebar.search': 'Претражи разговоре',
  'sidebar.noMatch': 'Ниједан разговор не одговара упиту „{query}“.',
  'sidebar.noChats': 'Још нема разговора',
  'sidebar.historyUnavailable': 'Историја разговора није доступна.',
  'sidebar.untitledChat': 'Разговор без наслова',
  'sidebar.chatActions': 'Радње разговора',
  'sidebar.deleteChatConfirmTitle': 'Избрисати разговор?',
  'sidebar.deleteChatConfirmMessage':
    '„{title}“ и све његове поруке биће трајно избрисани.',
  'sidebar.deleteChatConfirm': 'Избриши',
  'sidebar.openChatFailed': 'Отварање разговора није успело. Покушај поново.',
  'sidebar.deleteChatFailed': 'Брисање разговора није успело. Покушај поново.',
  'sidebar.renameChatFailed':
    'Преименовање разговора није успело. Покушај поново.',
  'sidebar.modelMissing': 'Овај модел више није у твојој фасцикли са моделима.',
  'sidebar.modelReplaced':
    'Датотека овог модела променила се након стварања разговора.',

  'header.toggleSidebar': 'Прикажи/сакриј бочну траку',
  'header.newChat': 'Нови разговор',
  'header.selectModel': 'Изабери модел',
  'header.openSettings': 'Отвори подешавања',
  'header.loadingModel': 'Учитавање модела',

  'chat.inputPlaceholder': 'Питај било шта',
  'chat.sendMessage': 'Пошаљи поруку',
  'chat.stopGenerating': 'Заустави генерисање',
  'chat.scrollToBottom': 'Помери на дно',
  'chat.selectModelAlert': 'Изабери модел за слање поруке.',
  'chat.sendFailed': 'Слање поруке није успело. Покушај поново.',
  'chat.historyUnavailable':
    'Историја разговора није доступна, па овај разговор неће бити сачуван.',
  'chat.readOnlyModelMissing':
    'Овај разговор може се само читати јер његов модел више није доступан.',
  'chat.thinking': 'Размишља',
  'chat.copy': 'Копирај',
  'chat.copied': 'Копирано',
  'chat.copyFailed': 'Неуспешно',

  'models.title': 'Модели',
  'models.search': 'Претражи моделе',
  'models.close': 'Затвори моделе',
  'models.emptyBeforeExtension': 'Нема пронађених модела. Додај ',
  'models.emptyBetween': ' датотеке модела у ',
  'models.emptyAfterPath': ' да започнеш.',
  'models.noMatch': 'Ниједан модел не одговара упиту „{query}”.',
  'models.stopLoading': 'Заустави учитавање',
  'models.unload': 'Искључи модел',
  'models.loadFailed': 'Учитавање модела није успело. Покушај поново.',
  'models.unloadFailed': 'Искључивање модела није успело. Покушај поново.',

  'settings.title': 'Подешавања',
  'settings.sections': 'Одељци подешавања',
  'settings.close': 'Затвори подешавања',
  'settings.tabGeneral': 'Опште',
  'settings.tabAppearance': 'Изглед',
  'settings.tabShortcuts': 'Пречице',

  'general.sendWith': 'Шаљи са {shortcut}+Enter',
  'general.sendWithDescription':
    'Користи {shortcut}+Enter за слање поруке. Enter додаје нови ред.',
  'general.language': 'Језик',
  'general.languageDescription': 'Изабери језик који се користи у апликацији.',
  'general.logs': 'Записи',
  'general.openLogs': 'Отвори записе',
  'general.openLogsDescription':
    'Отвори фасциклу са записима у прегледнику датотека.',
  'general.openLogsFailed':
    'Отварање фасцикле са записима није успело. Покушај поново.',
  'general.open': 'Отвори',
  'general.deleteLogs': 'Обриши записе',
  'general.deleteLogsDescription':
    'Трајно обриши све датотеке записа из фасцикле са записима.',
  'general.deleteLogsConfirmTitle': 'Обрисати записе?',
  'general.deleteLogsConfirmMessage':
    'Све датотеке записа у фасцикли са записима биће трајно обрисане.',
  'general.deleteLogsFailed': 'Брисање записа није успело. Покушај поново.',
  'general.deleted': 'Обрисано',
  'general.rename': 'Преименуј',
  'general.delete': 'Обриши',
  'general.reset': 'Врати',
  'general.restored': 'Враћено',

  'appearance.theme': 'Тема',
  'appearance.dark': 'Тамна',
  'appearance.light': 'Светла',
  'appearance.system': 'Систем',
  'appearance.fontSize': 'Величина текста порука',
  'appearance.increaseFontSize': 'Повећај величину текста порука',
  'appearance.decreaseFontSize': 'Смањи величину текста порука',
  'appearance.fontSizeDescription': 'Мења величину текста порука.',

  'shortcuts.resetLabel': 'Врати подразумеване пречице',
  'shortcuts.resetFailed':
    'Враћање подразумеваних пречица није успело. Покушај поново.',
  'shortcuts.saveFailed': 'Чување пречице није успело. Покушај поново.',
  'shortcuts.resetConfirmTitle': 'Вратити подразумеване пречице?',
  'shortcuts.resetConfirmMessage':
    'Све пречице се враћају на подразумеване комбинације тастера.',
  'shortcuts.recording': 'Притисни тастере…',
  'shortcuts.conflict': 'Та пречица се већ користи.',
  'shortcuts.toggleSettings': 'Отвори или затвори подешавања',
  'shortcuts.toggleModels': 'Отвори или затвори листу модела',
  'shortcuts.toggleSidebar': 'Прикажи или сакриј бочну траку',
  'shortcuts.newChat': 'Започни нови разговор',
  'shortcuts.stopGeneration': 'Заустави генерисање',

  'confirm.cancel': 'Одустани',

  'alert.error': 'Грешка',
  'alert.success': 'Успех',
  'alert.info': 'Информација',
  'alert.close': 'Затвори обавештење',
}
