const RE = /[a-zA-Z-]+(?::[a-zA-Z-]+)*-(?:white|stone|emerald|amber|rose|teal)[0-9]+(?:\/[0-9]+)?/g
console.log('A', [...'text-stone-900'.matchAll(RE)].map((m) => m[0]))
console.log('B', [..."className=\"text-stone-900 dark:text-stone-50\"".matchAll(RE)].map((m) => m[0]))
const RE2 = /(?:^|[\s"'{])((?:dark:)?[a-zA-Z-]+(?::[a-zA-Z-]+)*-(?:white|stone|emerald|amber|rose|teal)[0-9]+(?:\/[0-9]+)?)/g
console.log('C', [..."className=\"text-stone-900 dark:text-stone-50\"".matchAll(RE2)].map((m) => m[1]))
