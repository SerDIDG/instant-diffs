/*
 * Authors: [[User:Serhio Magpie]]
 */

// <nowiki>

window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n.es = {
    'name': 'Instant Diffs',

    /*** LINKS ***/

    'diff-title': 'Diferencia entre revisiones',
    'diff-title-admin': 'La diferencia entre revisiones está oculta',
    'revision-title': 'Contenido de la revisión',
    'revision-title-admin': 'El contenido de la revisión está oculto',
    'compare': '$1',
    'compare-title': 'Comparar revisiones seleccionadas ($1)',
    'alt-click': '(Alt+clic: abrir el enlace)',

    /*** DIALOG ***/

    'save': 'Guardar',
    'cancel': 'Cancelar',
    'close': 'Cerrar',
    'reload': 'Recargar',

    'title-empty': '[Sin título]',
    'title-not-found': '[No encontrado]',
    'unsupported-wikilambda': 'La aplicación WikiLambda no es compatible actualmente.',

    /*** NAVIGATION ***/

    'goto-links': 'Enlaces',
    'goto-snapshot-next': 'Siguiente enlace en la página',
    'goto-snapshot-prev': 'Enlace anterior en la página',
    'goto-view-diff': 'Mostrar cambios',
    'goto-view-revision': 'Mostrar la revisión',
    'goto-view-pending': 'Ediciones pendientes',
    'goto-prev': 'Anterior',
    'goto-next': 'Siguiente',
    'goto-prev-diff': 'Edición anterior',
    'goto-next-diff': 'Edición más reciente',
    'goto-back-diff': 'Volver',
    'goto-prev-revision': 'Revisión anterior',
    'goto-next-revision': 'Revisión siguiente',
    'goto-back-revision': 'Volver',
    'goto-cd': 'Ir al mensaje',
    'goto-diff': 'Ir a la edición',
    'goto-revision': 'Ir a la revisión',
    'goto-page': 'Ir a la página',
    'goto-history': 'Ver historial',
    'goto-talkpage': 'Discusión',
    'goto-settings': 'Ajustes',

    /*** ACTIONS ***/

    'copy-link': 'Copiar enlace',
    'copy-link-copied': 'El enlace ha sido copiado al portapapeles.',
    'copy-link-error': 'No se pudo copiar el enlace.',

    'copy-wikilink': 'Copiar wikienlace',
    'wikilink-page': 'página',
    'wikilink-diff': 'diferencia',
    'wikilink-revision': 'revisión',
    'wikilink-example-title': 'Página principal',

    /*** SETTINGS ***/

    'settings-title': 'Configuración de Instant Diffs',
    'settings-saved': 'La configuración se ha guardado correctamente. Recarga la página para aplicarla.',
    'settings-fieldset-links': 'Enlaces',
    'settings-show-link': 'Mostrar botón de acción',
    'settings-show-link-help': 'Muestra un botón de acción (❖) después del enlace para abrir el diálogo de Instant Diffs. De lo contrario, la acción de clic se añade directamente al enlace. Aún puedes abrir el enlace en la pestaña actual presionando Alt+Clic.',
    'settings-show-page-link': 'Mostrar enlace a la página',
    'settings-show-page-link-help': 'Muestra un botón (➔) después del enlace para ir a la página y a la sección donde se hizo la edición. Si el script Convenient Discussions está instalado, el botón también intentará ir al comentario correspondiente.',
    'settings-highlight-line': 'Resaltar líneas en las listas de seguimiento y listas similares cuando el diálogo de Instant Diffs se abre desde el enlace relacionado.',
    'settings-mark-watched-line': 'Marcar los cambios como visitados en las listas de seguimiento cuando se abre el diálogo de Instant Diffs desde el enlace relacionado.',
    'settings-fieldset-dialog': 'Diálogo',
    'settings-unhide-diffs': 'Mostrar el contenido de las revisiones ocultas y la información de diferencias sin pasos adicionales.',
    'settings-unhide-diffs-help': 'Se requiere el derecho de usuario "suppressrevision" para ver el contenido de la revisión.',
    'settings-show-revision-info': 'Mostrar información de cambios al ver una revisión.',
    'settings-open-in-new-tab': 'Abrir los enlaces dentro del diálogo Instant Diffs en una nueva pestaña.',
    'settings-links-format': 'Formato del enlace para la acción de copia',
    'settings-links-format-full': 'URL completa con el título de la página',
    'settings-links-format-minify': 'URL acortada',
    'settings-wikilinks-format': 'Formato del wikienlace para la acción de copia',
    'settings-wikilinks-format-link': 'Enlace simple entre corchetes',
    'settings-wikilinks-format-special': 'Enlace interno del wiki',
    'settings-fieldset-general': 'General',
    'settings-enable-mobile': 'Habilitar Instant Diffs en la apariencia móvil (Minerva).',
    'settings-enable-mobile-help': 'Para volver a habilitar Instant Diffs, tendrás que cambiar a otra apariencia.',
    'settings-show-menu-icons': 'Mostrar iconos en el menú desplegable del diálogo de Instant Diffs.',
    'settings-notify-errors': 'Mostrar alertas emergentes para errores críticos.',

    /*** ERRORS ***/

    'error-wasted': 'wasted',
    'error-generic': 'Ha ocurrido un error: $4',
    'error-prepare-generic': 'No se pudo preparar la configuración: $4',
    'error-prepare-version': 'El script ya se está ejecutando: $4',
    'error-prepare-mobile': 'El script está deshabilitado en la configuración para el tema móvil (Minerva)',
    'error-revision-generic': 'No se pudieron cargar los datos de la revisión "oldid=$1": $4',
    'error-revision-curid': 'No se pudieron cargar los datos de la revisión "curid=$1": $4',
    'error-revision-badrevids': 'Revisión no encontrada',
    'error-revision-badpageids': 'Página no encontrada',
    'error-revision-missing': 'Página no encontrada',
    'error-revision-invalid': 'Página no encontrada: $4',
    'error-diff-generic': 'No se pudieron cargar los datos de la comparación "oldid=$1", "diff=$2": $4',
    'error-diff-missingcontent': 'Revisión oculta',
    'error-diff-nosuchrevid': 'Revisión no encontrada',
    'error-dependencies-generic': 'No se pudieron cargar las dependencias: $4',
    'error-dependencies-parse': 'No se pudieron cargar las dependencias de la página "$3": $4',
    'error-setting-request': 'No se pudieron cargar las opciones del usuario: $4',
    'error-setting-save': 'No se pudieron guardar las opciones del usuario',
};

// </nowiki>
