/*
 * Authors: [[User:Serhio Magpie]]
 */

// <nowiki>

window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n.pt = {
	'name': 'Instant Diffs',

	/*** LINKS ***/

	'diff-title': 'Diferença entre revisões',
	'diff-title-admin': 'A diferença entre revisões está oculta',
	'revision-title': 'Conteúdo da revisão',
	'revision-title-admin': 'O conteúdo da revisão está oculto',
	'compare': '$1',
	'compare-title': 'Comparar as versões selecionadas ($1)',
	'alt-click': '(Alt+clique: abrir o link)',

	/*** DIALOG ***/

	'save': 'Salvar',
	'cancel': 'Cancelar',
	'close': 'Fechar',
	'reload': 'Recarregar',

	'title-empty': '[Sem título]',
	'title-not-found': '[Não encontrado]',
	'unsupported-wikilambda': 'O aplicativo WikiLambda atualmente não é suportado.',

	/*** NAVIGATION ***/

	'goto-links': 'Links',
	'goto-snapshot-next': 'Próximo link na página',
	'goto-snapshot-prev': 'Link anterior na página',
	'goto-view-diff': 'Mostrar alterações',
	'goto-view-revision': 'Mostrar revisão',
	'goto-view-pending': 'Edições pendentes',
	'goto-prev': 'Anterior',
	'goto-next': 'Posterior',
	'goto-prev-diff': 'Edição anterior',
	'goto-next-diff': 'Edição posterior',
	'goto-back-diff': 'Voltar',
	'goto-prev-revision': 'Revisão anterior',
	'goto-next-revision': 'Revisão seguinte',
	'goto-back-revision': 'Voltar',
	'goto-cd': 'Ir para a mensagem',
	'goto-diff': 'Ir para a edição',
	'goto-revision': 'Ir para a revisão',
	'goto-page': 'Ir para a página',
	'goto-history': 'Ver histórico',
	'goto-talkpage': 'Discussão',
	'goto-settings': 'Configurações',

	/*** ACTIONS ***/

	'copy-link': 'Copiar link',
	'copy-link-copied': 'O link foi copiado para a área de transferência.',
	'copy-link-error': 'Não foi possível copiar o link.',

	'copy-wikilink': 'Copiar wikilink',
	'wikilink-page': 'página',
	'wikilink-diff': 'diferença',
	'wikilink-revision': 'revisão',
	'wikilink-example-title': 'Página principal',

	/*** SETTINGS ***/

	'settings-title': 'Configurações do Instant Diffs',
	'settings-saved': 'As configurações foram salvas com sucesso. Recarregue a página para aplicá-las.',
	'settings-fieldset-links': 'Links',
	'settings-show-link': 'Mostrar botão de ação',
	'settings-show-link-help': 'Exibe um botão de ação (❖) após o link para abrir o diálogo Instant Diffs. Caso contrário, a ação de clique é adicionada diretamente ao link. Você ainda pode abrir o link na guia atual pressionando Alt+Clique.',
	'settings-show-page-link': 'Mostrar link da página',
	'settings-show-page-link-help': 'Exibe um botão (➔) após o link para ir à página e à seção onde a edição foi feita. Se o script Convenient Discussions estiver instalado, o botão também tentará ir ao comentário correspondente.',
	'settings-highlight-line': 'Destacar linhas em listas de monitoramento e listas semelhantes quando o diálogo Instant Diffs for aberto a partir do link relacionado.',
	'settings-mark-watched-line': 'Marcar alterações como visitadas em listas de monitoramento quando o diálogo Instant Diffs for aberto a partir do link relacionado.',
	'settings-fieldset-dialog': 'Diálogo',
	'settings-unhide-diffs': 'Exibir conteúdo de revisões ocultas e informações de diff sem etapas adicionais.',
	'settings-unhide-diffs-help': 'O direito de usuário "suppressrevision" é necessário para visualizar o conteúdo da revisão.',
	'settings-show-revision-info': 'Mostrar informações da alteração ao visualizar uma revisão.',
	'settings-open-in-new-tab': 'Abrir links dentro do diálogo Instant Diffs em uma nova guia.',
	'settings-links-format': 'Formato do link para a ação de copiar',
	'settings-links-format-full': 'URL completa com o título da página',
	'settings-links-format-minify': 'URL minimizada',
	'settings-wikilinks-format': 'Formato do wikilink para a ação de copiar',
	'settings-wikilinks-format-link': 'Link simples entre colchetes',
	'settings-wikilinks-format-special': 'Link interno do wiki',
	'settings-fieldset-general': 'Geral',
	'settings-enable-mobile': 'Ativar Instant Diffs no tema móvel (Minerva).',
	'settings-enable-mobile-help': 'Para reativar o Instant Diffs, você precisará mudar para outro tema.',
	'settings-notify-errors': 'Mostrar alertas popup para erros críticos.',

	/*** ERRORS ***/

	'error-wasted': 'wasted',
	'error-generic': 'Algo deu errado: $4',
	'error-prepare-generic': 'Falha ao preparar a configuração: $4',
	'error-prepare-version': 'O script já está em execução: $4',
	'error-prepare-mobile': 'O script está desativado nas configurações para o tema móvel (Minerva)',
	'error-revision-generic': 'Falha ao carregar os dados da revisão "oldid=$1": $4',
	'error-revision-curid': 'Falha ao carregar os dados da revisão "curid=$1": $4',
	'error-revision-badrevids': 'Revisão não encontrada',
	'error-revision-badpageids': 'Página não encontrada',
	'error-revision-missing': 'Página não encontrada',
	'error-revision-invalid': 'Página não encontrada: $4',
	'error-diff-generic': 'Falha ao carregar os dados de comparação "oldid=$1", "diff=$2": $4',
	'error-diff-missingcontent': 'Revisão oculta',
	'error-diff-nosuchrevid': 'Revisão não encontrada',
	'error-dependencies-generic': 'Falha ao carregar dependências: $4',
	'error-dependencies-parse': 'Falha ao carregar dependências da página "$3": $4',
	'error-setting-request': 'Falha ao carregar as opções do usuário: $4',
	'error-setting-save': 'Falha ao salvar as opções do usuário',
};

// </nowiki>
