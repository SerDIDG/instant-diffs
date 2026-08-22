import extensions from './extensions';

// Page adjustments
import './extensions/Page-AbuseLog';
import './extensions/Page-Contributions';
import './extensions/Page-EditTags';
import './extensions/Page-History';

// Skins
import './extensions/Skin-Citizen';

// Extensions
import * as extensionFlaggedRevs from './extensions/Extension-FlaggedRevs/extension';
import './extensions/Extension-GlobalWatchlist';
import './extensions/Extension-IPInfo';
import './extensions/Extension-PersonalDashboard';
import './extensions/Extension-Translate';
import './extensions/Extension-WikibaseMediaInfo';
import './extensions/Extension-WikiLambda';

// Gadgets
import './extensions/Gadget-ConvenientDiscussions';
import './extensions/Gadget-SmartDiff';
import './extensions/Gadget-Twinkle';
import './extensions/Gadget-WikEdDiff';

// Register complex extensions
extensions.register( extensionFlaggedRevs.schema );