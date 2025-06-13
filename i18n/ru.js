/*
 * Authors: [[User:Serhio Magpie]]
 */

// <nowiki>

window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n.ru = {
    'name': 'Instant Diffs',

    /*** LINKS ***/

    'diff-title': 'Разница версий',
    'diff-title-admin': 'Разница версий скрыта',
    'revision-title': 'Содержимое версии',
    'revision-title-admin': 'Содержимое версии скрыто',
    'compare': '$1',
    'compare-title': 'Сравнить выбранные версии ($1)',
    'alt-click': '(Alt+Click: перейти по ссылке)',

    /*** DIALOG ***/

    'save': 'Сохранить',
    'cancel': 'Отменить',
    'close': 'Закрыть',
    'reload': 'Перезагрузить',

    'title-empty': '[Без названия]',
    'title-not-found': '[Не найдено]',
    'unsupported-wikilambda': 'Приложение WikiLambda в настоящее время не поддерживается.',

    /*** NAVIGATION ***/

    'goto-links': 'Ссылки',
    'goto-snapshot-next': 'Следующая ссылка на странице',
    'goto-snapshot-prev': 'Предыдущая ссылка на странице',
    'goto-view-diff': 'Разница версий',
    'goto-view-revision': 'Показать версию',
    'goto-view-pending': 'Непроверенные изменения',
    'goto-prev': 'Предыдущая',
    'goto-next': 'Следующая',
    'goto-prev-diff': 'Предыдущая правка',
    'goto-next-diff': 'Следующая правка',
    'goto-back-diff': 'Вернуться',
    'goto-prev-revision': 'Предыдущая версия',
    'goto-next-revision': 'Следующая версия',
    'goto-back-revision': 'Вернуться',
    'goto-cd': 'Перейти к сообщению',
    'goto-diff': 'Перейти к правке',
    'goto-revision': 'Перейти к версии',
    'goto-page': 'Перейти к странице',
    'goto-history': 'История изменений',
    'goto-talkpage': 'Обсуждение',
    'goto-settings': 'Настройки',

    /*** ACTIONS ***/

    'copy-link': 'Скопировать ссылку',
    'copy-link-copied': 'Ссылка скопирована в буфер обмена',
    'copy-link-error': 'Не удалось скопировать ссылку',

    'copy-wikilink': 'Скопировать вики-ссылку',
    'wikilink-page': 'страница',
    'wikilink-diff': 'правка',
    'wikilink-revision': 'версия',
    'wikilink-example-title': 'Заглавная страница',

    /*** SETTINGS ***/

    'settings-title': 'Настройки Instant Diffs',
    'settings-saved': 'Настройки успешно сохранены. Перезагрузите страницу, чтобы применить их.',
    'settings-fieldset-links': 'Ссылки',
    'settings-show-link': 'Показать кнопку действия',
    'settings-show-link-help': 'Отображает кнопку действия (❖) после ссылки для открытия окна Instant Diffs. Иначе действие добавляется непосредственно на ссылкуь но вы сможете откырыть сслку в текущей вкладке с помощью Alt+Click.',
    'settings-show-page-link': 'Показать ссылку на страницу',
    'settings-show-page-link-help': 'Отображает кнопку (➔) после ссылки для перехода к странице и разделу, где была сделана правка. Если установлен скрипт Convenient Discussions, кнопка также попытается перейти к соответствующему комментарию.',
    'settings-highlight-line': 'Подсвечивать строки в списках наблюдения и подобных списках при открытии окна Instant Diffs из связанной ссылки.',
    'settings-mark-watched-line': 'Отмечать изменения как просмотренные в списках наблюдения при открытии окна Instant Diffs из связанной ссылки.',
    'settings-fieldset-dialog': 'Окно',
    'settings-unhide-diffs': 'Показывать содержимое скрытых версий без дополнительных действий.',
    'settings-unhide-diffs-help': 'Для просмотра содержимого скрытых версий требуется право «suppressrevision».',
    'settings-show-revision-info': 'Показывать информацию об изменениях при просмотре версии.',
    'settings-open-in-new-tab': 'Открывать ссылки в окне Instant Diffs в новой вкладке.',
    'settings-links-format': 'Формат ссылки для действия копирования',
    'settings-links-format-full': 'Полная ссылка с названием страницы',
    'settings-links-format-minify': 'Минифицированная ссылка',
    'settings-wikilinks-format': 'Формат вики-ссылки для действия копирования',
    'settings-wikilinks-format-link': 'Простая ссылка в скобках',
    'settings-wikilinks-format-special': 'Внутренняя вики-ссылка',
    'settings-fieldset-general': 'Общие',
    'settings-enable-mobile': 'Включить Instant Diffs в мобильной теме (Minerva).',
    'settings-enable-mobile-help': 'Чтобы повторно включить Instant Diffs, вам нужно будет переключиться на другую тему оформления.',
    'settings-show-menu-icons': 'Показывать иконки в выпадающем меню диалога.',
    'settings-notify-errors': 'Показывать всплывающие уведомления при критических ошибках.',

    /*** ERRORS ***/

    'error-wasted': 'потрачено',
    'error-generic': 'Что-то пошло не так: $4',
    'error-prepare-generic': 'Не удалось подготовить конфигурацию: $4',
    'error-prepare-version': 'Скрипт уже был запущен: $4',
    'error-prepare-mobile': 'Скрипт отключён в настройках для мобильной темы (Minerva)',
    'error-revision-generic': 'Не удалось загрузить данные версии «oldid=$1»: $4',
    'error-revision-curid': 'Не удалось загрузить данные версии «curid=$1»: $4',
    'error-revision-badrevids': 'Версия не найдена',
    'error-revision-badpageids': 'Страница не найдена',
    'error-revision-missing': 'Страница не найдена',
    'error-revision-invalid': 'Страница не найдена: $4',
    'error-diff-generic': 'Не удалось загрузить данные разницы версий «oldid=$1», «diff=$2»: $4',
    'error-diff-missingcontent': 'Версия скрыта',
    'error-diff-nosuchrevid': 'Версия не найдена',
    'error-dependencies-generic': 'Не удалось загрузить зависимости: $4',
    'error-dependencies-parse': 'Не удалось загрузить зависимости страницы «$3»: $4',
    'error-setting-request': 'Не удалось загрузить настройки пользователя: $4',
    'error-setting-save': 'Не удалось сохранить настройки пользователя',
};

// </nowiki>
