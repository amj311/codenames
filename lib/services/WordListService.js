let wordSet = require('../../../words/easy_rel.json');

module.exports = class WordListService {
    constructor() { }

    getWordList(options = {}) {
        let {difficulty,category} = options;
        return wordSet.words;
    }

}