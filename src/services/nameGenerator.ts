import {uniqueNamesGenerator, adjectives, colors, animals} from 'unique-names-generator'

export default () => uniqueNamesGenerator({
  dictionaries: [adjectives, colors, animals],
  separator: ' ',
  style: 'capital',
})
