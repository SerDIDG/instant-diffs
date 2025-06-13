/*
 * Authors: [[User:Serhio Magpie]]
 */

// <nowiki>

window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n.de = {
    'name': 'Instant Diffs',

    /*** LINKS ***/

    'diff-title': 'Unterschied zwischen Versionen',
    'diff-title-admin': 'Unterschied zwischen Versionen ist ausgeblendet',
    'revision-title': 'Versionsinhalt',
    'revision-title-admin': 'Versionsinhalt ist ausgeblendet',
    'compare': '$1',
    'compare-title': 'Gewählte Versionen vergleichen ($1)',
    'alt-click': '(Alt+Klick: Link öffnen)',

    /*** DIALOG ***/

    'save': 'Speichern',
    'cancel': 'Abbrechen',
    'close': 'Schließen',
    'reload': 'Neu laden',

    'title-empty': '[Kein Titel]',
    'title-not-found': '[Nicht gefunden]',
    'unsupported-wikilambda': 'Die WikiLambda-Anwendung wird derzeit nicht unterstützt.',

    /*** NAVIGATION ***/

    'goto-links': 'Links',
    'goto-snapshot-next': 'Nächster Link auf der Seite',
    'goto-snapshot-prev': 'Vorheriger Link auf der Seite',
    'goto-view-diff': 'Änderungen anzeigen',
    'goto-view-revision': 'Version anzeigen',
    'goto-view-pending': 'Unmarkierten Änderungen',
    'goto-prev': 'Älter',
    'goto-next': 'Neuer',
    'goto-prev-diff': 'Ältere Bearbeitung',
    'goto-next-diff': 'Neuere Bearbeitung',
    'goto-back-diff': 'Zurück',
    'goto-prev-revision': 'Ältere Version',
    'goto-next-revision': 'Neuere Version',
    'goto-back-revision': 'Zurück',
    'goto-cd': 'Zur Nachricht springen',
    'goto-diff': 'Zur Bearbeitung springen',
    'goto-revision': 'Zur Version springen',
    'goto-page': 'Zur Seite springen',
    'goto-history': 'Versionsgeschichte',
    'goto-talkpage': 'Diskussion',
    'goto-settings': 'Einstellungen',

    /*** ACTIONS ***/

    'copy-link': 'Link kopieren',
    'copy-link-copied': 'Der Link wurde in die Zwischenablage kopiert.',
    'copy-link-error': 'Link konnte nicht kopiert werden.',

    'copy-wikilink': 'Wikilink kopieren',
    'wikilink-page': 'Seite',
    'wikilink-diff': 'Unterschied',
    'wikilink-revision': 'Version',
    'wikilink-example-title': 'Hauptseite',

    /*** SETTINGS ***/

    'settings-title': 'Instant Diffs-Einstellungen',
    'settings-saved': 'Die Einstellungen wurden erfolgreich gespeichert. Laden Sie die Seite neu, um sie anzuwenden.',
    'settings-fieldset-links': 'Links',
    'settings-show-link': 'Aktionsschaltfläche anzeigen',
    'settings-show-link-help': 'Zeigt nach dem Link eine Aktionsschaltfläche (❖) an, um den Instant-Diffs-Dialog zu öffnen. Andernfalls wird die Klickaktion direkt dem Link hinzugefügt. Sie können den Link weiterhin im aktuellen Tab öffnen, indem Sie Alt+Klick drücken.',
    'settings-show-page-link': 'Seitenlink anzeigen',
    'settings-show-page-link-help': 'Zeigt nach dem Link eine Schaltfläche (➔) an, um zur Seite und zum Abschnitt der Bearbeitung zu springen. Wenn das Skript Convenient Discussions installiert ist, versucht die Schaltfläche außerdem, zum entsprechenden Kommentar zu navigieren.',
    'settings-highlight-line': 'Zeilen in Beobachtungslisten und ähnlichen Listen hervorheben, wenn der Instant-Diffs-Dialog über den zugehörigen Link geöffnet wird.',
    'settings-mark-watched-line': 'Änderungen in Beobachtungslisten als besucht markieren, wenn der Instant-Diffs-Dialog über den zugehörigen Link geöffnet wird.',
    'settings-fieldset-dialog': 'Dialog',
    'settings-unhide-diffs': 'Verborgenen Versionsinhalt und Diff-Informationen ohne zusätzliche Schritte anzeigen.',
    'settings-unhide-diffs-help': 'Zum Anzeigen des Versionsinhalts wird das Benutzerrecht „suppressrevision“ benötigt.',
    'settings-show-revision-info': 'Änderungsinformationen beim Anzeigen einer Version anzeigen.',
    'settings-open-in-new-tab': 'Links im Instant-Diffs-Dialog in einem neuen Tab öffnen.',
    'settings-links-format': 'Linkformat für die Kopieraktion',
    'settings-links-format-full': 'Vollständige URL mit Seitentitel',
    'settings-links-format-minify': 'Verkürzte URL',
    'settings-wikilinks-format': 'Wikilink-Format für die Kopieraktion',
    'settings-wikilinks-format-link': 'Einfacher Link in Klammern',
    'settings-wikilinks-format-special': 'Interner Wikilink',
    'settings-fieldset-general': 'Allgemein',
    'settings-enable-mobile': 'Instant Diffs für das mobile Skin (Minerva) aktivieren.',
    'settings-enable-mobile-help': 'Um Instant Diffs erneut zu aktivieren, müssen Sie auf ein anderes Skin wechseln.',
    'settings-show-menu-icons': 'Symbole im Dropdown-Menü des Instant-Diffs-Dialogs anzeigen.',
    'settings-notify-errors': 'Popup-Benachrichtigungen für kritische Fehler anzeigen.',

    /*** ERRORS ***/

    'error-wasted': 'wasted',
    'error-generic': 'Ein Fehler ist aufgetreten: $4',
    'error-prepare-generic': 'Konfiguration konnte nicht vorbereitet werden: $4',
    'error-prepare-version': 'Skript läuft bereits: $4',
    'error-prepare-mobile': 'Das Skript ist in den Einstellungen für das mobile Skin (Minerva) deaktiviert',
    'error-revision-generic': 'Versionsdaten konnten nicht geladen werden „oldid=$1“: $4',
    'error-revision-curid': 'Versionsdaten konnten nicht geladen werden „curid=$1“: $4',
    'error-revision-badrevids': 'Version nicht gefunden',
    'error-revision-badpageids': 'Seite nicht gefunden',
    'error-revision-missing': 'Seite nicht gefunden',
    'error-revision-invalid': 'Seite nicht gefunden: $4',
    'error-diff-generic': 'Vergleichsdaten konnten nicht geladen werden „oldid=$1“, „diff=$2“: $4',
    'error-diff-missingcontent': 'Version ist versteckt',
    'error-diff-nosuchrevid': 'Version nicht gefunden',
    'error-dependencies-generic': 'Abhängigkeiten konnten nicht geladen werden: $4',
    'error-dependencies-parse': 'Seitendependenzen konnten nicht geladen werden „$3“: $4',
    'error-setting-request': 'Benutzereinstellungen konnten nicht geladen werden: $4',
    'error-setting-save': 'Benutzereinstellungen konnten nicht gespeichert werden',
};

// </nowiki>
