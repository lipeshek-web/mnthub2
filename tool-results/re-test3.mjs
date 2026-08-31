console.log('1', [...'text-stone-900'.matchAll(/[a-zA-Z-]+-stone[0-9]+/g)].map((m) => m[0]))
console.log('2', [...'text-stone-900'.matchAll(/[a-zA-Z]+-stone[0-9]+/g)].map((m) => m[0]))
console.log('3', [...'text-stone-900'.matchAll(/[a-zA-Z-]+-(?:stone)[0-9]+/g)].map((m) => m[0]))
console.log('4', [...'text-stone-900'.matchAll(/[a-zA-Z-]+(?:xx)*-(?:stone|white)[0-9]+/g)].map((m) => m[0]))
