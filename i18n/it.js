/*
 * Authors: [[User:Serhio Magpie]]
 */

// <nowiki>

window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n.it = {
	'name': 'Instant Diffs',

	/*** LINKS ***/

	'diff-title': 'Differenze tra le versioni',
	'diff-title-admin': 'La differenza tra le versioni è nascosta',
	'revision-title': 'Contenuto della versione',
	'revision-title-admin': 'Il contenuto della versione è nascosto',
	'compare': '$1',
	'compare-title': 'Confronta versioni selezionate ($1)',
	'alt-click': '(Alt+clic: apri il collegamento)',

	/*** DIALOG ***/

	'save': 'Salva',
	'cancel': 'Annulla',
	'close': 'Chiudi',
	'reload': 'Ricarica',

	'title-empty': '[Nessun titolo]',
	'title-not-found': '[Non trovato]',
	'unsupported-wikilambda': 'L\'app WikiLambda non è attualmente supportata.',

	/*** NAVIGATION ***/

	'goto-links': 'Collegamenti',
	'goto-snapshot-next': 'Collegamento successivo nella pagina',
	'goto-snapshot-prev': 'Collegamento precedente nella pagina',
	'goto-view-diff': 'Mostra modifiche',
	'goto-view-pending': 'Modifiche in attesa',
	'goto-view-revision': 'Mostra la revisione',
	'goto-prev': 'Precedente',
	'goto-next': 'Successiva',
	'goto-prev-diff': 'Modifica precedente',
	'goto-next-diff': 'Modifica più recente',
	'goto-back-diff': 'Indietro',
	'goto-prev-revision': 'Revisione precedente',
	'goto-next-revision': 'Revisione successiva',
	'goto-back-revision': 'Indietro',
	'goto-cd': 'Vai al messaggio',
	'goto-edit': 'Vai alla modifica', // Deprecated in 1.3.0
	'goto-diff': 'Vai alla modifica',
	'goto-revision': 'Vai alla versione',
	'goto-page': 'Vai alla pagina',
	'goto-history': 'Cronologia',
	'goto-talkpage': 'Discussione',
	'goto-settings': 'Impostazioni',

	/*** ACTIONS ***/

	'copy-link': 'Copia collegamento',
	'copy-link-copied': 'Il collegamento è stato copiato negli appunti.',
	'copy-link-error': 'Impossibile copiare il collegamento.',

	'copy-wikilink': 'Copia wikilink',
	'wikilink-page': 'pagina',
	'wikilink-diff': 'differenza',
	'wikilink-revision': 'revisione',
	'wikilink-example-title': 'Pagina principale',

	/*** SETTINGS ***/

	'settings-title': 'Impostazioni di Instant Diffs',
	'settings-saved': 'Le impostazioni sono state salvate correttamente. Ricarica la pagina per applicarle.',
	'settings-fieldset-links': 'Collegamenti',
	'settings-show-link': 'Mostra pulsante azione',
	'settings-show-link-help': 'Visualizza un pulsante di azione (❖) dopo il collegamento per aprire la finestra di Instant Diffs. In caso contrario, l\'azione di clic viene aggiunta direttamente al collegamento. Puoi comunque aprire il collegamento nella scheda corrente premendo Alt+Clic.',
	'settings-show-page-link': 'Mostra collegamento alla pagina',
	'settings-show-page-link-help': 'Visualizza un pulsante (➔) dopo il collegamento per navigare alla pagina e alla sezione in cui è stata fatta la modifica. Se è installato lo script Convenient Discussions, il pulsante cercherà anche di andare al commento corrispondente.',
	'settings-highlight-line': 'Evidenzia le righe negli Osservati speciali e liste simili quando la finestra di Instant Diffs viene aperta dal collegamento correlato.',
	'settings-mark-watched-line': 'Segna le modifiche come visitate negli Osservati speciali quando si apre Instant Diffs dal collegamento correlato.',
	'settings-fieldset-dialog': 'Finestra',
	'settings-unhide-diffs': 'Mostra il contenuto delle revisioni nascoste e le informazioni sui diff senza passaggi aggiuntivi.',
	'settings-unhide-diffs-help': 'Per visualizzare il contenuto della revisione è necessario il diritto utente "suppressrevision".',
	'settings-show-revision-info': 'Mostra le informazioni sulle modifiche durante la visualizzazione di una revisione.',
	'settings-open-in-new-tab': 'Apri i collegamenti all\'interno di Instant Diffs in una nuova scheda.',
	'settings-links-format': 'Formato del collegamento per l\'azione di copia',
	'settings-links-format-full': 'URL completo con titolo della pagina',
	'settings-links-format-minify': 'URL abbreviato',
	'settings-wikilinks-format': 'Formato del wikilink per l\'azione di copia',
	'settings-wikilinks-format-link': 'Collegamento semplice tra parentesi',
	'settings-wikilinks-format-special': 'Collegamento interno al wiki',
	'settings-fieldset-general': 'Generale',
	'settings-enable-mobile': 'Abilita Instant Diffs nel tema mobile (Minerva).',
	'settings-enable-mobile-help': 'Per riabilitare Instant Diffs dovrai passare a un altro tema.',
	'settings-notify-errors': 'Mostra popup di avviso per errori critici.',

	/*** ERRORS ***/

	'error-wasted': 'wasted',
	'error-generic': 'Si è verificato un errore: $4',
	'error-prepare-generic': 'Impossibile preparare la configurazione: $4',
	'error-prepare-version': 'Lo script è già in esecuzione: $4',
	'error-prepare-mobile': 'Lo script è disabilitato nelle impostazioni per il tema mobile (Minerva)',
	'error-revision-generic': 'Impossibile caricare i dati della versione "oldid=$1": $4',
	'error-revision-curid': 'Impossibile caricare i dati della versione "curid=$1": $4',
	'error-revision-badrevids': 'Versione non trovata',
	'error-revision-badpageids': 'Pagina non trovata',
	'error-revision-missing': 'Pagina non trovata',
	'error-revision-invalid': 'Pagina non trovata: $4',
	'error-diff-generic': 'Impossibile caricare i dati di confronto "oldid=$1", "diff=$2": $4',
	'error-diff-missingcontent': 'Versione nascosta',
	'error-diff-nosuchrevid': 'Versione non trovata',
	'error-dependencies-generic': 'Impossibile caricare le dipendenze: $4',
	'error-dependencies-parse': 'Impossibile caricare le dipendenze della pagina "$3": $4',
	'error-setting-request': 'Impossibile caricare le opzioni utente: $4',
	'error-setting-save': 'Impossibile salvare le opzioni utente',
};

// </nowiki>
