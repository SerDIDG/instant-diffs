import extensions from './extensions';

// Skins
import { schema as skinCitizen } from './extensions/Skin-Citizen';

// Pages
import { schema as pageAbuseLog } from './extensions/Page-AbuseLog';
import { schema as pageContributions } from './extensions/Page-Contributions';
import { schema as pageEditTags } from './extensions/Page-EditTags';
import { schema as pageHistory } from './extensions/Page-History';

// Extensions
import { schema as extensionFlaggedRevs } from './extensions/Extension-FlaggedRevs/extension';
import { schema as extensionPersonalDashboard } from './extensions/Extension-PersonalDashboard/extension';
import { schema as extensionWikibaseMediaInfo } from './extensions/Extension-WikibaseMediaInfo/extension';
import { schema as extensionGlobalWatchlist } from './extensions/Extension-GlobalWatchlist';
import { schema as extensionIPInfo } from './extensions/Extension-IPInfo';
import { schema as extensionTranslate } from './extensions/Extension-Translate';
import { schema as extensionWikiLambda } from './extensions/Extension-WikiLambda';

// Gadgets
import { schema as gadgetConvenientDiscussions } from './extensions/Gadget-ConvenientDiscussions';
import { schema as gadgetSmartDiff } from './extensions/Gadget-SmartDiff';
import { schema as gadgetTwinkle } from './extensions/Gadget-Twinkle';
import { schema as gadgetWikEdDiff } from './extensions/Gadget-WikEdDiff';

// Register extensions
extensions.register( skinCitizen );

extensions.register( pageAbuseLog );
extensions.register( pageContributions );
extensions.register( pageEditTags );
extensions.register( pageHistory );

extensions.register( extensionFlaggedRevs );
extensions.register( extensionPersonalDashboard );
extensions.register( extensionWikibaseMediaInfo );
extensions.register( extensionGlobalWatchlist );
extensions.register( extensionIPInfo );
extensions.register( extensionTranslate );
extensions.register( extensionWikiLambda );

extensions.register( gadgetConvenientDiscussions );
extensions.register( gadgetSmartDiff );
extensions.register( gadgetTwinkle );
extensions.register( gadgetWikEdDiff );