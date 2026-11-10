import {configureLocalization} from "@lit/localize"

import {sourceLocale, targetLocales} from "./locale-codes.js"

export default configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: (locale) => import(`./${locale}.ts`),
})
