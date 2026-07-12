import type { Messages } from './types'

export const sr: Messages = {
  'sidebar.chats': 'Разговори',

  'header.toggleSidebar': 'Прикажи/сакриј бочну траку',
  'header.selectModel': 'Изабери модел',
  'header.openSettings': 'Отвори подешавања',
  'header.loadingModel': 'Учитавање модела',

  'chat.inputPlaceholder': 'Питај било шта',
  'chat.sendMessage': 'Пошаљи поруку',
  'chat.stopGenerating': 'Заустави генерисање',
  'chat.selectModelAlert': 'Изабери модел за слање поруке.',
  'chat.sendFailed': 'Слање поруке није успело. Покушај поново.',

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

  'general.sendWith': 'Шаљи са {shortcut}+Enter',
  'general.sendWithDescription':
    'Користи {shortcut}+Enter за слање поруке. Enter додаје нови ред.',
  'general.language': 'Језик',
  'general.languageDescription': 'Изабери језик који се користи у апликацији.',
  'general.logs': 'Записи',
  'general.openLogs': 'Отвори записе',
  'general.openLogsDescription':
    'Отвори фасциклу са записима у прегледнику датотека.',
  'general.open': 'Отвори',
  'general.deleteLogs': 'Обриши записе',
  'general.deleteLogsDescription':
    'Трајно обриши све датотеке записа из фасцикле са записима.',
  'general.delete': 'Обриши',

  'appearance.theme': 'Тема',
  'appearance.dark': 'Тамна',
  'appearance.light': 'Светла',
  'appearance.system': 'Систем',

  'alert.error': 'Грешка',
  'alert.success': 'Успех',
  'alert.info': 'Информација',
  'alert.close': 'Затвори обавештење',
}
