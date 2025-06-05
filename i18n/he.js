/*
 * Authors: [[User:Serhio Magpie]], [[User:IKhitron]]
 */

// <nowiki>

window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n.he = {
	'name': 'Instant Diffs',

	/*** LINKS ***/

	'diff-title': 'השוואת הגרסאות',
	'diff-title-admin': 'השוואת הגרסאות הוסתרה',
	'revision-title': 'תוכן הגרסה',
	'revision-title-admin': 'תוכן הגרסה הוסתר',
	'compare': '$1',
	'compare-title': 'השוואת הגרסאות שנבחרו ($1)',
	'alt-click': '(Alt+Click: מעבר ליעד הקישור)',

	/*** DIALOG ***/

	'save': 'שמור',
	'cancel': 'ביטול',
	'close': 'סגירה',
	'reload': 'טען מחדש',

	'title-empty': '[ללא כותרת]',
	'title-not-found': '[לא נמצא]',
	'unsupported-wikilambda': 'האפליקציה WikiLambda אינה נתמכת כעת.',

	/*** NAVIGATION ***/

	'goto-links': 'הקישורים',
	'goto-snapshot-next': 'הקישור הבא בדף',
	'goto-snapshot-prev': 'הקישור הקודם בדף',
	'goto-view-diff': 'הצג שינויים',
	'goto-view-pending': 'שינויים ממתינים',
	'goto-view-revision': 'הצג גרסה',
	'goto-prev': 'ישן יותר',
	'goto-next': 'חדש יותר',
	'goto-prev-diff': 'העריכה הקודמת',
	'goto-next-diff': 'העריכה הבאה',
	'goto-back-diff': 'חזרה',
	'goto-prev-revision': 'גרסה קודמת',
	'goto-next-revision': 'גרסה חדשה יותר',
	'goto-back-revision': 'חזרה',
	'goto-cd': 'מעבר להודעה',
	'goto-edit': 'מעבר לעריכה', // Deprecated in 1.3.0
	'goto-diff': 'מעבר לעריכה',
	'goto-revision': 'מעבר לגרסה',
	'goto-page': 'מעבר לדף',
	'goto-history': 'היסטוריית הגרסאות',
	'goto-talkpage': 'דיון',
	'goto-settings': 'הגדרות',

	/*** ACTIONS ***/

	'copy-link': 'העתקת הקישור',
	'copy-link-copied': 'הקישור הועתק ללוח ההעתקה',
	'copy-link-error': 'נכשלה העתקת הקישור',

	'copy-wikilink': 'העתקת קישור ויקי',
	'wikilink-page': 'דף',
	'wikilink-diff': 'הבדל',
	'wikilink-revision': 'גרסה',
	'wikilink-example-title': 'עמוד ראשי',

	/*** SETTINGS ***/

	'settings-title': 'הגדרות Instant Diffs',
	'settings-saved': 'ההגדרות נשמרו בהצלחה. רעננו את הדף כדי להחיל את השינויים.',
	'settings-fieldset-links': 'קישורים',
	'settings-show-link': 'הצג כפתור פעולה',
	'settings-show-link-help': 'מציג כפתור פעולה (❖) לאחר הקישור לפתיחת חלון Instant Diffs. אחרת, הפעולה מתבצעת ישירות דרך הקישור. עדיין ניתן לפתוח את הקישור בטאב הנוכחי עם Alt+Click.',
	'settings-show-page-link': 'הצג קישור לעמוד',
	'settings-show-page-link-help': 'מציג כפתור (🡰) לאחר הקישור למעבר לעמוד והקטע שבו בוצעה העריכה. אם הסקריפט Convenient Discussions מותקן, הכפתור גם ינסה לעבור להודעה המתאימה.',
	'settings-highlight-line': 'הדגש שורות ברשימות צפייה ודומות כשחלון Instant Diffs נפתח מהקישור המתאים.',
	'settings-mark-watched-line': 'סמן שינויים כנצפו ברשימות צפייה כשנפתח חלון Instant Diffs מהקישור.',
	'settings-fieldset-dialog': 'חלון קופץ',
	'settings-unhide-diffs': 'הצג תוכן גרסאות מוסתר ומידע על שינויים ללא שלבים נוספים.',
	'settings-unhide-diffs-help': 'נדרשת הרשאת "suppressrevision" להצגת תוכן הגרסאות.',
	'settings-show-revision-info': 'הצג מידע על השינויים בעת צפייה בגרסה.',
	'settings-open-in-new-tab': 'פתח קישורים בחלון Instant Diffs בטאב חדש.',
	'settings-links-format': 'פורמט קישור לפעולת העתקה',
	'settings-links-format-full': 'קישור מלא עם כותרת העמוד',
	'settings-links-format-minify': 'קישור מקוצר',
	'settings-wikilinks-format': 'פורמט ויקי-קישור לפעולת העתקה',
	'settings-wikilinks-format-link': 'קישור פשוט בסוגריים',
	'settings-wikilinks-format-special': 'קישור פנימי בויקי',
	'settings-fieldset-general': 'כללי',
	'settings-enable-mobile': 'אפשר Instant Diffs בתצוגה ניידת (Minerva).',
	'settings-enable-mobile-help': 'כדי להפעיל מחדש את Instant Diffs, יש לעבור לעיצוב אחר.',
	'settings-notify-errors': 'הצג התראות קופצות לשגיאות קריטיות.',

	/*** ERRORS ***/

	'error-wasted': 'wasted',
	'error-generic': 'משהו התקלקל בדרך: $4',
	'error-prepare-generic': 'נכשלה הכנת ההגדרות: $4',
	'error-prepare-version': 'הסקריפט כבר רץ: $4',
	'error-prepare-mobile': 'הסקריפט מושבת בהגדרות עבור ערכת העיצוב לנייד (Minerva)',
	'error-revision-generic': 'נכשלה הטענת נתוני הגרסה "oldid=$1": $4',
	'error-revision-curid': 'נכשלה הטענת נתוני הגרסה "curid=$1": $4',
	'error-revision-badrevids': 'הגרסה לא אותרה',
	'error-revision-badpageids': 'הדף לא אותר',
	'error-revision-missing': 'הדף לא אותר',
	'error-revision-invalid': 'הדף לא אותר: $4',
	'error-diff-generic': 'נכשלה הטענת נתוני הגרסה "oldid=$1, diff=$2": $4',
	'error-diff-missingcontent': 'הגרסה הוסתרה',
	'error-diff-nosuchrevid': 'הגרסה לא אותרה',
	'error-dependencies-generic': 'נכשלה הטענת התלויות: $4',
	'error-dependencies-parse': 'נכשלה הטענת התלויות הדף "$3": $4',
	'error-setting-request': 'טעינת ההגדרות נכשלה: $4',
	'error-setting-save': 'שמירת ההגדרות נכשלה',
};

// </nowiki>
