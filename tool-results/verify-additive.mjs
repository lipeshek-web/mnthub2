// Verifies the diff is strictly additive: stripping every " dark:*" token from each new line
// must reproduce the original line exactly (these files had NO pre-existing dark: classes).
import { execSync } from 'node:child_process'

const files = [
  'src/components/platform/onboarding.tsx',
  'src/components/platform/library-manager.tsx',
  'src/components/platform/tracks-manager.tsx',
  'src/components/platform/dashboard.tsx',
]

let bad = 0
let checked = 0
for (const f of files) {
  const diff = execSync(`git diff -U0 -- ${f}`, { cwd: '/home/z/my-project', encoding: 'utf8' })
  const olds = []
  const news = []
  for (const line of diff.split('\n')) {
    if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) continue
    if (line.startsWith('-')) olds.push(line.slice(1))
    else if (line.startsWith('+')) news.push(line.slice(1))
  }
  if (olds.length !== news.length) {
    console.log(`LINE COUNT MISMATCH in ${f}: ${olds.length} vs ${news.length}`)
    bad++
  }
  for (let i = 0; i < Math.min(olds.length, news.length); i++) {
    checked++
    const stripped = news[i].replace(/\s+dark:[A-Za-z0-9_:/[\]&!%.()()-]+/g, '')
    if (stripped !== olds[i]) {
      bad++
      console.log(`MISMATCH in ${f} pair #${i}:`)
      console.log('  old: ' + olds[i])
      console.log('  new: ' + news[i])
      console.log('  str: ' + stripped)
    }
  }
}
console.log(`checked ${checked} changed line pairs; problems: ${bad}`)
