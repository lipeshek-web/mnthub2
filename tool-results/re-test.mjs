const RE = /[a-zA-Z-]+(?::[a-zA-Z-]+)*-(?:white|stone|emerald|amber|rose|teal)[0-9]+(?:\/[0-9]+)?/g
const line = `className="text-stone-900 dark:text-stone-50 bg-stone-950/55" aria-label='x'`
console.log([...line.matchAll(RE)].map((m) => m[0]))
