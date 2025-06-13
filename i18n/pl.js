/*
 * Authors: [[User:Serhio Magpie]]
 */

// <nowiki>

window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n.pl = {
    'name': 'Instant Diffs',

    /*** LINKS ***/

    'diff-title': 'Różnice między wersjami',
    'diff-title-admin': 'Różnice między wersjami są ukryte',
    'revision-title': 'Zawartość wersji',
    'revision-title-admin': 'Zawartość wersji jest ukryta',
    'compare': '$1',
    'compare-title': 'Porównaj wybrane wersje ($1)',
    'alt-click': '(Alt+klik: otwórz link)',

    /*** DIALOG ***/

    'save': 'Zapisz',
    'cancel': 'Anuluj',
    'close': 'Zamknij',
    'reload': 'Przeładuj',

    'title-empty': '[Brak tytułu]',
    'title-not-found': '[Nie znaleziono]',
    'unsupported-wikilambda': 'Aplikacja WikiLambda nie jest obecnie obsługiwana.',

    /*** NAVIGATION ***/

    'goto-links': 'Linki',
    'goto-snapshot-next': 'Następny link na stronie',
    'goto-snapshot-prev': 'Poprzedni link na stronie',
    'goto-view-diff': 'Pokaż zmiany',
    'goto-view-revision': 'Pokaż wersję',
    'goto-view-pending': 'Oczekuje na przejrzenie',
    'goto-prev': 'Starsza',
    'goto-next': 'Nowsza',
    'goto-prev-diff': 'Starsza edycja',
    'goto-next-diff': 'Nowsza edycja',
    'goto-back-diff': 'Wstecz',
    'goto-prev-revision': 'Poprzednia wersja',
    'goto-next-revision': 'Następna wersja',
    'goto-back-revision': 'Wstecz',
    'goto-cd': 'Przejdź do wiadomości',
    'goto-diff': 'Przejdź do edycji',
    'goto-revision': 'Przejdź do wersji',
    'goto-page': 'Przejdź do strony',
    'goto-history': 'Wyświetl historię',
    'goto-talkpage': 'Dyskusja',
    'goto-settings': 'Ustawienia',

    /*** ACTIONS ***/

    'copy-link': 'Kopiuj link',
    'copy-link-copied': 'Link został skopiowany do schowka.',
    'copy-link-error': 'Nie udało się skopiować linku.',

    'copy-wikilink': 'Skopiuj link wiki',
    'wikilink-page': 'strona',
    'wikilink-diff': 'różnica',
    'wikilink-revision': 'wersja',
    'wikilink-example-title': 'Strona główna',

    /*** SETTINGS ***/

    'settings-title': 'Ustawienia Instant Diffs',
    'settings-saved': 'Ustawienia zostały pomyślnie zapisane. Odśwież stronę, aby je zastosować.',
    'settings-fieldset-links': 'Linki',
    'settings-show-link': 'Pokaż przycisk akcji',
    'settings-show-link-help': 'Wyświetla przycisk akcji (❖) po linku, aby otworzyć okno dialogowe Instant Diffs. W przeciwnym razie akcja kliknięcia jest przypisana bezpośrednio do linku. Nadal możesz otworzyć link w bieżącej karcie, naciskając Alt+Klik.',
    'settings-show-page-link': 'Pokaż link do strony',
    'settings-show-page-link-help': 'Wyświetla przycisk akcji (➔) po linku, aby przejść do strony i sekcji, gdzie dokonano edycji. Jeśli zainstalowano skrypt Convenient Discussions, przycisk spróbuje również przejść do odpowiedniego komentarza.',
    'settings-highlight-line': 'Podświetl linie na listach obserwowanych i podobnych, gdy okno Instant Diffs zostanie otwarte z powiązanego linku.',
    'settings-mark-watched-line': 'Oznacz zmiany jako odwiedzone na listach obserwowanych, gdy okno Instant Diffs zostanie otwarte z powiązanego linku.',
    'settings-fieldset-dialog': 'Okno dialogowe',
    'settings-unhide-diffs': 'Wyświetl ukrytą zawartość wersji i informacji o różnicach bez dodatkowych kroków.',
    'settings-unhide-diffs-help': 'Wymagane jest uprawnienie użytkownika „suppressrevision”, aby zobaczyć zawartość wersji.',
    'settings-show-revision-info': 'Pokaż informacje o zmianach podczas przeglądania wersji.',
    'settings-open-in-new-tab': 'Otwórz linki w oknie Instant Diffs w nowej karcie.',
    'settings-links-format': 'Format linku do skopiowania',
    'settings-links-format-full': 'Pełny adres URL z tytułem strony',
    'settings-links-format-minify': 'Skrócony adres URL',
    'settings-wikilinks-format': 'Format linku wiki do skopiowania',
    'settings-wikilinks-format-link': 'Prosty link w nawiasach',
    'settings-wikilinks-format-special': 'Wewnętrzny link wiki',
    'settings-fieldset-general': 'Ogólne',
    'settings-enable-mobile': 'Włącz Instant Diffs dla motywu mobilnego (Minerva).',
    'settings-enable-mobile-help': 'Aby ponownie włączyć Instant Diffs, musisz przełączyć się na inny motyw.',
    'settings-show-menu-icons': 'Pokaż ikony w menu rozwijanym okna dialogowego.',
    'settings-notify-errors': 'Pokaż powiadomienia o krytycznych błędach.',

    /*** ERRORS ***/

    'error-wasted': 'porażka',
    'error-generic': 'Coś poszło nie tak: $4',
    'error-prepare-generic': 'Nie udało się przygotować konfiguracji: $4',
    'error-prepare-version': 'Skrypt już działa: $4',
    'error-prepare-mobile': 'Skrypt został wyłączony w ustawieniach dla motywu mobilnego (Minerva)',
    'error-revision-generic': 'Nie udało się załadować danych wersji „oldid=$1”: $4',
    'error-revision-curid': 'Nie udało się załadować danych wersji „curid=$1”: $4',
    'error-revision-badrevids': 'Wersja nie znaleziona',
    'error-revision-badpageids': 'Strona nie znaleziona',
    'error-revision-missing': 'Strona nie znaleziona',
    'error-revision-invalid': 'Strona nie znaleziona: $4',
    'error-diff-generic': 'Nie udało się załadować danych porównania „oldid=$1”, „diff=$2”: $4',
    'error-diff-missingcontent': 'Wersja ukryta',
    'error-diff-nosuchrevid': 'Wersja nie znaleziona',
    'error-dependencies-generic': 'Nie udało się załadować zależności: $4',
    'error-dependencies-parse': 'Nie udało się załadować zależności strony „$3”: $4',
    'error-setting-request': 'Nie udało się załadować ustawień użytkownika: $4',
    'error-setting-save': 'Nie udało się zapisać ustawień użytkownika',
};

// </nowiki>
