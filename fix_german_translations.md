# Fix German Translations

The German (`de`) translations in src/contexts/i18n-context.tsx (lines 315-393) are currently in Hindi instead of German. They need to be replaced with proper German translations.

For now, the language selector has been updated to use localStorage-based switching which will reload the page to apply translations.

The site should work but selecting German will show Hindi text. This needs to be fixed by replacing the German translation block.
