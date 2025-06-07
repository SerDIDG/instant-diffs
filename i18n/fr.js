/*
 * Authors: [[User:Serhio Magpie]]
 */

// <nowiki>

window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n.fr = {
	'name': 'Instant Diffs',

	/*** LINKS ***/

	'diff-title': 'Différence entre les versions',
	'diff-title-admin': 'La différence entre les versions est masquée',
	'revision-title': 'Contenu de la version',
	'revision-title-admin': 'Le contenu de la version est masqué',
	'compare': '$1',
	'compare-title': 'Comparer les versions sélectionnées ($1)',
	'alt-click': '(Alt+clic : ouvrir le lien)',

	/*** DIALOG ***/

	'save': 'Enregistrer',
	'cancel': 'Annuler',
	'close': 'Fermer',
	'reload': 'Recharger',

	'title-empty': '[Aucun titre]',
	'title-not-found': '[Introuvable]',
	'unsupported-wikilambda': 'L\'application WikiLambda n\'est pas encore prise en charge.',

	/*** NAVIGATION ***/

	'goto-links': 'Liens',
	'goto-snapshot-next': 'Lien suivant sur la page',
	'goto-snapshot-prev': 'Lien précédent sur la page',
	'goto-view-diff': 'Afficher les modifications',
	'goto-view-revision': 'Afficher la révision',
	'goto-view-pending': 'Modifications en attente',
	'goto-prev': 'Ancien',
	'goto-next': 'Récent',
	'goto-prev-diff': 'Modification plus ancienne',
	'goto-next-diff': 'Modification plus récente',
	'goto-back-diff': 'Retour',
	'goto-prev-revision': 'Révision précédente',
	'goto-next-revision': 'Révision suivante',
	'goto-back-revision': 'Retour',
	'goto-cd': 'Aller au message',
	'goto-diff': 'Aller à la modification',
	'goto-revision': 'Aller à la version',
	'goto-page': 'Aller à la page',
	'goto-history': 'Voir l’historique',
	'goto-talkpage': 'Discussion',
	'goto-settings': 'Paramètres',

	/*** ACTIONS ***/

	'copy-link': 'Copier le lien',
	'copy-link-copied': 'Le lien a été copié dans le presse-papiers.',
	'copy-link-error': 'Impossible de copier le lien.',

	'copy-wikilink': 'Copier le lien wiki',
	'wikilink-page': 'page',
	'wikilink-diff': 'différence',
	'wikilink-revision': 'révision',
	'wikilink-example-title': 'Page principale',

	/*** SETTINGS ***/

	'settings-title': 'Paramètres d’Instant Diffs',
	'settings-saved': 'Les paramètres ont été enregistrés avec succès. Rechargez la page pour les appliquer.',
	'settings-fieldset-links': 'Liens',
	'settings-show-link': 'Afficher le bouton d’action',
	'settings-show-link-help': 'Affiche un bouton d’action (❖) après le lien pour ouvrir la fenêtre Instant Diffs. Sinon, l’action de clic est ajoutée directement au lien. Vous pouvez toujours ouvrir le lien dans l’onglet actuel en appuyant sur Alt+Clic.',
	'settings-show-page-link': 'Afficher le lien vers la page',
	'settings-show-page-link-help': 'Affiche un bouton (➔) après le lien pour accéder à la page et à la section où la modification a été effectuée. Si le script Convenient Discussions est installé, le bouton essaiera également d’aller au commentaire correspondant.',
	'settings-highlight-line': 'Surligner les lignes dans les listes de suivi et listes similaires lorsque la fenêtre Instant Diffs est ouverte depuis le lien associé.',
	'settings-mark-watched-line': 'Marquer les modifications comme visitées dans les listes de suivi lorsque la fenêtre Instant Diffs est ouverte depuis le lien associé.',
	'settings-fieldset-dialog': 'Dialogue',
	'settings-unhide-diffs': 'Afficher le contenu caché des révisions et les informations de diff sans étapes supplémentaires.',
	'settings-unhide-diffs-help': 'Le droit utilisateur « suppressrevision » est requis pour afficher le contenu de la révision.',
	'settings-show-revision-info': 'Afficher les informations sur les modifications lors de la consultation d\'une révision.',
	'settings-open-in-new-tab': 'Ouvrir les liens du dialogue Instant Diffs dans un nouvel onglet.',
	'settings-links-format': 'Format du lien pour l’action de copie',
	'settings-links-format-full': 'URL complète avec le titre de la page',
	'settings-links-format-minify': 'URL raccourcie',
	'settings-wikilinks-format': 'Format du wikilien pour l’action de copie',
	'settings-wikilinks-format-link': 'Lien simple entre crochets',
	'settings-wikilinks-format-special': 'Lien wiki interne',
	'settings-fieldset-general': 'Général',
	'settings-enable-mobile': 'Activer Instant Diffs pour le thème mobile (Minerva).',
	'settings-enable-mobile-help': 'Pour réactiver Instant Diffs, vous devrez passer à un autre thème.',
	'settings-notify-errors': 'Afficher des alertes contextuelles pour les erreurs critiques.',

	/*** ERRORS ***/

	'error-wasted': 'wasted',
	'error-generic': 'Une erreur est survenue : $4',
	'error-prepare-generic': 'Impossible de préparer la configuration : $4',
	'error-prepare-version': 'Le script est déjà en cours d’exécution : $4',
	'error-prepare-mobile': 'Le script est désactivé dans les paramètres pour le thème mobile (Minerva)',
	'error-revision-generic': 'Échec du chargement des données de la version « oldid=$1 » : $4',
	'error-revision-curid': 'Échec du chargement des données de la version « curid=$1 » : $4',
	'error-revision-badrevids': 'Version introuvable',
	'error-revision-badpageids': 'Page introuvable',
	'error-revision-missing': 'Page introuvable',
	'error-revision-invalid': 'Page introuvable : $4',
	'error-diff-generic': 'Échec du chargement des données de comparaison « oldid=$1, diff=$2 » : $4',
	'error-diff-missingcontent': 'Version masquée',
	'error-diff-nosuchrevid': 'Version introuvable',
	'error-dependencies-generic': 'Échec du chargement des dépendances : $4',
	'error-dependencies-parse': 'Échec du chargement des dépendances de la page « $3 » : $4',
	'error-setting-request': 'Échec du chargement des options utilisateur : $4',
	'error-setting-save': 'Échec de l’enregistrement des options utilisateur',
};

// </nowiki>
